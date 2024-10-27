import "./libs/browser-polyfill.js";
import { Chess } from "./libs/chess.js";

let coursesMetaData = {};
let abortController = new AbortController();
let idToTitle = {};

browser.runtime.onMessage.addListener(async (request, sender) => {
  if (request.method === "getOptions") {
    return handleGetOptions();
  } else if (request.method === "getBlacklist") {
    return handleGetBlacklist();
  } else if (request.method === "getCategories") {
    return handleGetCategories();
  } else if (request.method === "getDropdownOptions") {
    return handleGetDropdownOptions();
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
  } else if (request.method === "getCoursePageInfo") {
    return await getMetaData();
  } else if (request.method === "abort") {
    abortController.abort();
    return;
  } else if (request.method === "courseRemoved") {
    coursesMetaData[request.key].inMemory = false;
  } else if (request.method === "saveCourseData") {
    let courseID = await getCurrentCourseID();
    let metaData = coursesMetaData[idToTitle[courseID]];
    let bigDict = mergeDictList(metaData.allMoves);
    mergeFenDictWithCourseData(metaData, bigDict);
  } else if (request.method === "startScrape") {
    let coursePage = await scrapeCoursePage();
    abortController = new AbortController();

    await scrapeNMissingChapters(
      coursePage,
      parseInt(request.value),
      abortController.signal
    );
  }
  return Promise.resolve();
});

function sendProgressMessage(info) {
  try {
    browser.runtime.sendMessage({
      method: "updateStatus",
      info: info,
    });
  } catch {}
}

async function getMetaData() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  let courseID = validateCourseURL(activeTab.url);

  if (courseID) {
    let courseTitle = idToTitle[courseID];
    if (coursesMetaData.hasOwnProperty(courseTitle)) {
      return coursesMetaData[courseTitle];
    } else {
      let coursePage = await scrapeCoursePage();
      if (coursePage) {
        idToTitle[courseID] = coursePage.title;
        coursesMetaData[coursePage.title] = {
          id: courseID,
          title: coursePage.title,
          chapters: coursePage.chapters,
          scrapedChapters: [],
          allMoves: [],
          lineCount: 0,
          inMemory: await existsInCourseData(coursePage.title),
        };
        return coursesMetaData[coursePage.title];
      } else {
        return null;
      }
    }
  } else {
    return null;
  }
}

async function addLogMessage(
  message,
  url = null,
  linkText = null,
  status = "neutral"
) {
  const { logs = [] } = await browser.storage.local.get("logs");
  const newLog = {
    timestamp: Date.now(),
    message,
    url,
    linkText,
    status,
  };

  logs.push(newLog);
  if (logs.length > 1000) logs.splice(0, logs.length - 1000);

  await browser.storage.local.set({ logs });
  // await loadLogsStructured();
}

async function scrapeNMissingChapters(coursePage, maxChapters = 11, signal) {
  let i = 0;
  let n = 0;
  let chapterCount = coursePage.chapters.length;
  let metaData = coursesMetaData[coursePage.title];

  if (maxChapters === 11) {
    maxChapters = chapterCount;
  }

  sendProgressMessage("ongoing");

  while (n < maxChapters) {
    if (i >= chapterCount) {
      sendProgressMessage("complete");
      break;
    } else if (signal.aborted) {
      sendProgressMessage("aborted");
      break;
    }

    let chapter = coursePage.chapters[i];
    if (metaData.scrapedChapters.includes(chapter.url)) {
      i++;
      continue;
    }

    try {
      let moves = await getMovesFromChapter(chapter.url);
      console.log(moves);
      let fenDict = pgnListToFenDict(moves);
      console.log(fenDict);
      metaData.allMoves.push(fenDict);
      metaData.lineCount += moves.length;
      metaData.scrapedChapters.push(chapter.url);
      updatePopupInfo();
      addLogMessage(
        `Scraped ${moves.length} moves from {link}`,
        chapter.url,
        chapter.title,
        "good"
      );
    } catch (error) {
      console.error(error);
      addLogMessage(
        `Error scraping in {link}`,
        chapter.url,
        chapter.title,
        "bad"
      );
    } finally {
      i++;
      n++;
    }
  }
  if (n === maxChapters) {
    sendProgressMessage("partial");
  }
}

async function scrapeCoursePage() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  let courseID = validateCourseURL(activeTab.url);

  if (activeTab && courseID) {
    try {
      const response = await browser.tabs.sendMessage(activeTab.id, {
        method: "scrapeCoursePage",
      });
      response.id = courseID;
      return response;
    } catch (error) {
      return null;
    }
  } else {
    return null;
  }
}

async function getMovesFromChapter(url, delay = 1000) {
  const { skipPaused = false } = await browser.storage.sync.get("skipPaused");
  const tab = await browser.tabs.create({ url: url, active: false });
  try {
    await waitForTabLoad(tab.id);
    await new Promise((resolve) => setTimeout(resolve, delay));
    const data = await browser.tabs.sendMessage(tab.id, {
      method: "getMoves",
      skipPaused,
    });
    return data;
  } catch (error) {
    console.error("Error in getMovesFromChapter: ", error);
  } finally {
    await browser.tabs.remove(tab.id);
  }
}

// updates courseData in local storage with new fenDict
async function mergeFenDictWithCourseData(metaData, fenDict, lineCount) {
  let courseTitle = metaData.title;
  let { courseData = {} } = await browser.storage.local.get("courseData");
  if (courseData.hasOwnProperty(courseTitle)) {
    mergeDictsFaster(courseData[courseTitle], fenDict);
  } else {
    courseData[courseTitle] = fenDict;
  }

  try {
    await browser.storage.local.set({ courseData });
    let { courseDataInfo = {} } = await browser.storage.local.get(
      "courseDataInfo"
    );
    courseDataInfo[courseTitle] = false;
    courseDataInfo[courseTitle + "Include"] = true;
    await browser.storage.sync.set({ courseDataInfo });
    addLogMessage(
      `Saved ${metaData.lineCount} lines from ${courseTitle}`,
      null,
      null,
      "good"
    );
    updatePopupInfo();
    coursesMetaData[courseTitle].inMemory = true;
    coursesMetaData[courseTitle].scrapedChapters = [];
    coursesMetaData[courseTitle].allMoves = [];
    coursesMetaData[courseTitle].lineCount = 0;
  } catch (error) {
    console.error(`Error merging ${courseTitle} with courseData: `, error);
  }
}

async function existsInCourseData(courseTitle) {
  let { courseData = {} } = await browser.storage.local.get("courseData");
  return courseData.hasOwnProperty(courseTitle);
}

// sends course metadata to popup script
async function updatePopupInfo() {
  let courseID = await getCurrentCourseID();
  let metaData = coursesMetaData[idToTitle[courseID]];
  try {
    browser.runtime.sendMessage({ method: "updateInfo", metaData });
  } catch {}
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

// returns course ID if active tab is on a course page, otherwiser returns false
async function getCurrentCourseID() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  let courseID = validateCourseURL(activeTab.url);
  return courseID;
}

// returns courseID if the URL is a course page, otherwise returns false
function validateCourseURL(url) {
  try {
    if (url.includes("chessable.com/course/")) {
      let courseID = url.split("chessable.com/course/")[1];
      courseID = courseID.replace(/\/$/, "");
      if (!isNaN(courseID)) {
        return courseID;
      }
    }
  } catch {
    console.error("error in validate url");
    return false;
  }

  return false;
}

function mergeDictList(dictList) {
  if (dictList.length < 2) {
    return dictList[0];
  }

  let bigDict = { ...dictList[0] };
  for (let dict of dictList.slice(1)) {
    mergeDictsFaster(bigDict, dict);
  }

  return bigDict;
}

function pgnListToFenDict(pgnList) {
  let output = {};
  for (let pgn of pgnList) {
    try {
      let fenDict = pgnToFenDict(pgn);
      output = mergeDictsFaster(output, fenDict);
    } catch (error) {
      continue;
    }
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

function handleGetDropdownOptions() {
  let options = [
    "blacklist",
    "filterToggle",
    "categories",
    "categoriesToggle",
    "rename",
  ];
  return browser.storage.sync.get(options);
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
