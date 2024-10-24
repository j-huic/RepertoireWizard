import "./libs/browser-polyfill.js";
import { Chess } from "./libs/chess.js";

let coursesMetaData = {};
let abortController = new AbortController();

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
  } else if (request.method === "saveCourseData") {
    let id = await getCurrentCourseID();
    let metaData = coursesMetaData[id];
    let bigDict = mergeDictList(metaData.allMoves);
    mergeFenDictWithCourseData(metaData.title, id, bigDict);
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

function sendProgressMessage(message, replace = true) {
  try {
    browser.runtime.sendMessage({
      method: "updateProgress",
      message: message,
      replace: replace,
    });
  } catch {}
}

async function getMetaData() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (activeTab.url.includes("chessable.com/course/")) {
    let courseID = activeTab.url.split("course/")[1];
    courseID = courseID.replace(/\/$/, "");
    if (isNaN(courseID)) {
      return null;
    }

    if (coursesMetaData.hasOwnProperty(courseID)) {
      return coursesMetaData[courseID];
    } else {
      let coursePage = await scrapeCoursePage();
      coursesMetaData[courseID] = {
        title: coursePage.title,
        chapters: coursePage.chapters,
        scrapedChapters: [],
        allMoves: [],
        lineCount: 0,
        inMemory: await existsInCourseData(coursePage.title),
      };
      return coursesMetaData[courseID];
    }
  } else {
    return null;
  }
}

async function scrapeNMissingChapters(coursePage, maxChapters = 0, signal) {
  let i = 0;
  let n = 0;
  let chapterCount = coursePage.chapters.length;
  let metaData = coursesMetaData[coursePage.id];

  if (maxChapters === 0) {
    maxChapters = chapterCount;
  } else if (maxChapters === 11) {
    maxChapters = chapterCount;
  }

  while (n < maxChapters) {
    if (i >= chapterCount) break;

    if (signal.aborted) {
      sendProgressMessage("scraping aborted", false);
      break;
    }

    let chapter = coursePage.chapters[i];
    if (metaData.scrapedChapters.includes(chapter.url)) {
      i++;
      continue;
    }

    try {
      let moves = await getMovesFromChapter(chapter.url);
      let fenDict = pgnListToFenDict(moves);
      metaData.allMoves.push(fenDict);
      metaData.lineCount += moves.length;
      metaData.scrapedChapters.push(chapter.url);
      updatePopupInfo();
    } catch (error) {
      console.error(error);
    } finally {
      i++;
      n++;
    }
  }
}

async function scrapeCoursePage() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  let courseID = validateCourseURL(activeTab.url);

  if (activeTab && courseID) {
    const response = await browser.tabs.sendMessage(activeTab.id, {
      method: "scrapeCoursePage",
    });
    response.id = courseID;
    return response;
  } else {
    return null;
  }
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

// updates courseData in local storage with new fenDict
async function mergeFenDictWithCourseData(courseTitle, courseID, fenDict) {
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
    coursesMetaData[courseID].inMemory = true;
    updatePopupInfo();
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
  let metaData = coursesMetaData[courseID];
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
