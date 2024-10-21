import { Chess } from "./libs/chess.js";
import "./libs/browser-polyfill.js";

let scrapedChapters = [];
let allMoves = [];

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
  } else if (request.method === "saveCourseData") {
    let { testDict } = await browser.storage.local.get("testDict");
    // console.log(bigDict);
    await saveCourseData("kid", testDict);
    buildCourseData();
  } else if (request.method === "test") {
    // let input = "https://www.chessable.com/course/91808/48/";
    console.log("test activated");
    let coursePage = await scrapeCoursePage();
    // let missingChapters = await getMissingChapters(coursePage);

    await scrapeNMissingChapters(3, coursePage);
    let bigDict = mergeDictList(allMoves);
    browser.storage.local.set({ testDict: bigDict });
    // console.log("starting merge");
    // let bigDict = mergeDictList(allMoves);
    // console.log("finished merge");
    // console.log(Object.keys(bigDict).length);
  }
  return Promise.resolve();
});

async function scrapeNMissingChapters(maxChapters, coursePage) {
  let i = 0;
  let n = 0;

  while (n < maxChapters) {
    if (i >= coursePage.length) break;

    let chapter = coursePage.chapters[i];
    if (scrapedChapters.includes(chapter.url)) {
      i++;
      continue;
    }

    let moves = await getMovesFromChapter(chapter.url);
    let fenDict = pgnListToFenDict(moves);
    console.log("scraped " + chapter.title);
    console.log(fenDict);
    allMoves.push(fenDict);
    scrapedChapters.push(chapter.url);
    i++;
    n++;
  }
}

async function scrapeCoursePage() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const response = await browser.tabs.sendMessage(tabs[0].id, {
    method: "scrapeCoursePage",
  });
  return response;
}

async function getMovesFromChapter(url, delay = 1000) {
  const tab = await browser.tabs.create({ url: url, active: false });
  try {
    await waitForTabLoad(tab.id);
    await new Promise((resolve) => setTimeout(resolve, delay));
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

// saves individual fenDict to local storage
async function saveCourseData(courseTitle, fenDict) {
  console.log(fenDict);
  let varName = `${courseTitle}_fenDict`;

  try {
    await browser.storage.local.set({ [varName]: fenDict });
    console.log("stored " + varName);
    console.log(fenDict);

    let { courseIndex = [] } = await browser.storage.local.get("courseIndex");
    if (!courseIndex.includes(courseTitle)) {
      courseIndex.push(courseTitle);
    }
    await browser.storage.local.set({ courseIndex });
    console.log(`Saved dictionary of length ${Object.keys(fenDict).length}`);
  } catch (error) {
    console.error("error saving course data:", error);
  }
}

// combines individual fenDicts from local storage into usage-ready courseData
async function buildCourseData() {
  const { courseIndex = [] } = await browser.storage.local.get("courseIndex");
  console.log("course index:");
  console.log(courseIndex);

  if (courseIndex && courseIndex.length > 0) {
    let courseData = {};
    for (let course of courseIndex) {
      let varName = `${course}_fenDict`;
      let result = await browser.storage.local.get(varName);
      let fenDict = result[varName];
      courseData[course] = fenDict;
    }
    browser.storage.local.set({ courseData });
    console.log(courseData);
  }
}

class ScrapingPipeline {
  constructor(maxConcurrentTabs = 5) {
    this.maxConcurrentTabs = maxConcurrentTabs;
    this.activeTabs = 0;
    this.queue = [];
    this.scrapedData = new Map();
  }

  async addToQueue(url, parentCourse, chapterTitle) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, parentCourse, chapterTitle, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.activeTabs >= this.maxConcurrentTabs || this.queue.length === 0) {
      return;
    }

    const { url, parentCourse, chapterTitle, resolve, reject } =
      this.queue.shift();
    this.activeTabs++;

    try {
      const data = await getMovesFromChapter(url);
      this.scrapedData.set(`${parentCourse}_${chapterTitle}`, data);
      resolve(data);
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      reject(error);
    } finally {
      this.activeTabs--;
      this.processQueue;
    }
  }

  async mergeAndSaveData() {
    let mergedData = {};
    let courseIndex = {};

    for (const [key, value] of this.scrapedData.entries()) {
      const [parentCourse, chapterTitle] = key.split("_");
      mergedData[key] = pgnListToFenDict(value);

      if (courseIndex.hasOwnProperty(parentCourse)) {
        courseIndex[parentCourse].push(chapterTitle);
      } else {
        courseIndex[parentCourse] = [chapterTitle];
      }
    }
    await browser.storage.local.set(mergedData);
    await browser.storage.local.set({ courseIndex: courseIndex });
    console.log("data merged and saved");

    return { mergedData, courseIndex };
  }
}

async function scrapeAllChapters(chapters, parentCourse, pipeline) {
  const scrapePromises = chapters.map(async (chapter) => {
    try {
      await pipeline.addToQueue(chapter.url, parentCourse, chapter.title);
      console.log(`Scraped ${chapter.title}`);
    } catch (error) {
      console.error(`Failed to scrape ${chapter.chapterTitle}:`, error);
    }
  });

  await Promise.all(scrapePromises);
  console.log("All chapters processed");

  const { mergedData, courseIndex } = await pipeline.mergeAndSaveData();
  console.log("Final merged data:", mergedData);
  console.log("Course index:", courseIndex);
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  let bigDict = { ...dictList[0] };
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
