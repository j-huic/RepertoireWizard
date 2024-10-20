import { Chess } from "./libs/chess.js";
import "./libs/browser-polyfill.js";

browser.runtime.onMessage.addListener(async (request, sender) => {
  if (request.method === "getOptions") {
    return handleGetOptions();
  } else if (request.method === "getBlacklist") {
    return handleGetBlacklist();
  } else if (request.method === "getCategories") {
    return handleGetCategories();
  } else if (request.method === "saveVar") {
    return handleSaveVar(request);
  } else if (request.method === "getData") {
    return handleGetData(request);
  } else if (request.method === "getUCI") {
    return handleGetUCI(request.fen, request.move);
  } else if (request.method === "getSelectorTree") {
    handleGetSelectorTree();
  } else if (request.method === "print") {
    console.log("from " + request.origin + " :");
    console.log(request.message);
  } else if (request.method === "saveChapterMoves") {
    parseChapterMoves(request.data);
  } else if (request.method === "startScrape") {
  } else if (request.method === "getChapterIndex") {
    handleGetChapterIndex();
  } else if (request.method === "test") {
    // let input = "https://www.chessable.com/course/91808/48/";
    console.log("test activated");
    let coursePage = await scrapeCoursePage();
    let missingChapters = await getMissingChapters(coursePage);
    let urls = missingChapters.map((chapter) => chapter.url);

    // getMovesFromChapterList(urls.slice(0, 5)).then((data) => {
    //   console.log(data);
    // });
    // let chapters = coursePage.chapters;
    // let moves;

    for (let chapter of missingChapters.slice(0, 3)) {
      new Promise((resolve) => setTimeout(resolve, 100));
      getMovesFromChapter(chapter.url).then((data) => {
        saveChapterData(coursePage.title, chapter.title, data);
      });
      // moves = await getMovesFromChapter(chapter.url);
      // saveChapterData(coursePage.title, chapter.title, moves);
    }
    console.log(await getMissingChapters(coursePage));
  }
  return Promise.resolve();
});

async function getMissingChapters(coursePage) {
  const courseTitle = coursePage.title;
  const { courseIndex } = await browser.storage.local.get("courseIndex");
  console.log(courseIndex);

  if (!courseIndex.hasOwnProperty(courseTitle)) {
    return coursePage.chapters;
  }

  let allChapters = coursePage.chapters;
  let existingChapters = courseIndex[courseTitle];
  let missingChapters = [];

  for (let chapter of allChapters) {
    if (!existingChapters.includes(chapter.title)) {
      missingChapters.push(chapter);
    }
  }

  return missingChapters;
}

function handleGetChapterIndex() {
  browser.storage.local.get("chapterIndex").then((storage) => {
    if (storage.chapterIndex) {
      return storage.chapterIndex;
    } else {
      return [];
    }
  });
}

async function scrapeCoursePage() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const response = await browser.tabs.sendMessage(tabs[0].id, {
    method: "scrapeCoursePage",
  });
  return response;
}

async function getMovesFromChapterList(urlList) {
  const tabs = await Promise.all(
    urlList.map((url) => browser.tabs.create({ url: url, active: false }))
  );

  try {
    await Promise.all(tabs.map((tab) => waitForTabLoad(tab.id)));
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const dataPromises = tabs.map((tab) =>
      browser.tabs.sendMessage(tab.id, { method: "getMoves" })
    );
    const data = await Promise.all(dataPromises);

    return data;
  } catch (error) {
    console.error("Error in getMovesFromChapters: ", error);
  } finally {
    await Promise.all(
      tabs.map(async (tab) => {
        try {
          await browser.tabs.sendMessage(tab.id, { method: "getMoves" });
        } catch (error) {
          console.error(`Error retrieving data from tab ${tab.id}:`, error);
        } finally {
          await browser.tabs.remove(tab.id);
        }
      })
    );
  }
}

async function gmfcl(urls) {
  for (let url of urls) {
    const tab = browser.tabs.create({ url: url, active: false });
  }
}

async function getMovesFromChapter(url) {
  const tab = await browser.tabs.create({ url: url, active: false });
  try {
    await waitForTabLoad(tab.id);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await browser.tabs.sendMessage(tab.id, { method: "getMoves" });
    return data;
  } catch (error) {
    console.error("Error in getMovesFromChapter: ", error);
  } finally {
    await browser.tabs.remove(tab.id);
  }
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    browser.tabs.onUpdated.addListener(listener);

    function listener(changedTabId, changeInfo) {
      if (changedTabId === tabId && changeInfo.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
  });
}

async function saveChapterData(parentCourse, chapterTitle, pgnList) {
  let fenDict = pgnListToFenDict(pgnList);
  let chapterKey = `${parentCourse}_${chapterTitle}`;
  console.log(chapterKey);
  console.log(fenDict);

  await browser.storage.local.set({
    [chapterKey]: fenDict,
  });

  let { courseIndex = {} } = await browser.storage.local.get("courseIndex");
  if (courseIndex.hasOwnProperty(parentCourse)) {
    courseIndex[parentCourse].push(chapterTitle);
  } else {
    courseIndex[parentCourse] = [chapterTitle];
  }
  console.log(courseIndex);
  await browser.storage.local.set({ courseIndex: courseIndex });
}

async function buildCourseDict(courseName) {
  let courseIndex = await browser.storage.local.get("courseIndex");
  if (courseIndex.hasOwnProperty(courseName)) {
    let chapterList = courseIndex[courseName];
  } else {
    throw new Error("building a non-existant course");
  }
}

function mergeDictList(dictList) {
  if (dictList.length < 2) {
    return dictList[0];
  }

  let bigDict = dictList[0];
  for (let dict of dictList.slice(1)) {
    mergeDictsFaster(bigDict, dict);
  }

  return bigDict;
}

function pgnListToFenDict(pgnList) {
  let output = {};
  for (let pgn of pgnList) {
    let fenDict = pgnToFenDict(pgn);
    output = mergeDictsFaster(output, fenDict);
  }

  return output;
}

function pgnToFenDict(pgn) {
  const moves = pgnToMoveList(pgn);
  const chess = new Chess();
  let fenDict = {};

  for (let move of moves) {
    let fen = chess.move(move).before;
    let fenSplit = fen.split(" ");
    let pureFen = fenSplit.slice(0, fenSplit.length - 2).join(" ");
    fenDict[pureFen] = [move];
  }

  return fenDict;
}

function pgnToMoveList(pgn) {
  let moveList = [];
  let split = pgn.split(" ");

  for (let move of split) {
    let puremove = move.includes(".") ? move.split(".")[1] : move;
    puremove.trim();
    if (puremove !== "") {
      moveList.push(puremove);
    } else return moveList;
  }

  return moveList;
}

function handleGetSelectorTree() {
  return browser.storage.sync.get("getSelectorTree");
}

function handleGetUCI(fen, algMove) {
  let chess = new Chess(fen);
  let move = chess.move(algMove);
  if (move) {
    return Promise.resolve(move.from + move.to);
  } else {
    return Promise.resolve(null);
  }
}

function handleGetOptions() {
  let options = [
    "removeNotifs",
    "extraDropdown",
    "filterToggle",
    "categoriesToggle",
    "rename",
    "sideAgnostic",
    "highlightMoves",
    "removeWiki",
    "courseDataInfo",
  ];
  return browser.storage.sync.get(options);
}

function handleGetBlacklist() {
  return browser.storage.sync
    .get(["blacklist", "filterToggle"])
    .then((item) => {
      if (item.filterToggle) return item;
      else return false;
    });
}

function handleGetCategories() {
  return browser.storage.sync
    .get(["categories", "categoriesToggle", "rename"])
    .then((item) => {
      if (item.categoriesToggle) return item;
      else return false;
    });
}

function handleSaveVar(request) {
  let key = request.key;
  let value = request.value;
  return browser.storage.local.get([key]).then((items) => {
    if (
      items[key] &&
      typeof items[key] === "object" &&
      typeof value === "object"
    ) {
      let newValue = mergeDicts(items[key], value);
      return browser.storage.local.set({ [key]: newValue });
    } else {
      return browser.storage.local.set({ [key]: value });
    }
  });
}

function handleGetData(request) {
  return browser.storage.local.get([request.key]).then((items) => {
    return items[request.key];
  });
}

function mergeDicts(dict1, dict2) {
  var mergedDict = {};

  for (var key in dict1) {
    if (dict1.hasOwnProperty(key)) {
      mergedDict[key] = [].concat(dict1[key]);
    }
  }

  for (var key in dict2) {
    if (dict2.hasOwnProperty(key)) {
      if (!mergedDict[key]) {
        mergedDict[key] = [];
      }
      mergedDict[key] = mergedDict[key].concat(dict2[key]);
    }
  }

  return mergedDict;
}

function mergeDictsFaster(dict1, dict2) {
  for (let key in dict2) {
    if (dict1.hasOwnProperty(key)) {
      dict1[key] = Array.from(new Set([...dict1[key], ...dict2[key]]));
    } else {
      dict1[key] = dict2[key];
    }
  }

  return dict1;
}
