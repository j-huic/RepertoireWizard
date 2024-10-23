import { Chess } from "./libs/chess.js";
import "./libs/browser-polyfill.js";

let coursesMetaData = {};
let allMoves = [];
let abortController = new AbortController();

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
    ////////////////////////////////
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
    console.log(coursesMetaData[id]);
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

async function existsInCourseData(courseTitle) {
  let { courseData = {} } = await browser.storage.local.get("courseData");
  return courseData.hasOwnProperty(courseTitle);
}

async function getCurrentCourseID() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];
  let courseID = validateCourseURL(activeTab.url);
  return courseID;
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

    let moves = await getMovesFromChapter(chapter.url);
    let fenDict = pgnListToFenDict(moves);
    metaData.allMoves.push(fenDict);
    metaData.lineCount += moves.length;
    metaData.scrapedChapters.push(chapter.url);
    updatePopupInfo();

    console.log("scraped " + chapter.title);
    console.log("chapters scraped: " + metaData.scrapedChapters.length);
    console.log("total: " + chapterCount);
    // if (metaData.scrapedChapters.length === chapterCount) {
    //   console.log("saving");
    //   let bigDict = mergeDictList(allMoves);
    //   mergeFenDictWithCourseData(coursePage.title, coursePage.id, bigDict);
    // }
    i++;
    n++;
  }
}

async function updatePopupInfo() {
  let courseID = await getCurrentCourseID();
  let metaData = coursesMetaData[courseID];
  try {
    browser.runtime.sendMessage({ method: "updateInfo", metaData });
  } catch {}
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

// updates courseData in local storage with new fenDict
async function mergeFenDictWithCourseData(courseTitle, courseID, fenDict) {
  console.log(
    `merging ${courseTitle} data with ${Object.keys(fenDict).length} keys`
  );
  let memUsage = await browser.storage.local.getBytesInUse();
  console.log(memUsage);

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
    console.log(courseID);
    console.log(coursesMetaData[courseID]);
    coursesMetaData[courseID].inMemory = true;
    updatePopupInfo();
  } catch (error) {
    console.error(`Error merging ${courseTitle} with courseData: `, error);
  }
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
