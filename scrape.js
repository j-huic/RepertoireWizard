browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method === "scrapeCoursePage") {
    let urls = scrapeCoursePage();
    sendResponse(urls);
    return true;
  } else if (request.method === "getMoves") {
    if (request.skipPaused) {
      sendResponse(robustGetUnpausedMovesFromChapter());
    } else {
      sendResponse(robustGetMovesFromChapter());
    }
  }
});

function getMovesFromChapter() {
  const moveCards = document.getElementsByClassName("variation-card__moves");
  const pgnList = Array.from(moveCards).map((card) => card.textContent);

  return pgnList;
}

function getUnpausedMovesFromChapter() {
  const variationCards = document.getElementsByClassName("variation-card");
  const pgnList = [];
  let skipped = 0;

  for (card of variationCards) {
    try {
      if (card.querySelector('[class*="paused"]')) {
        skipped++;
        continue;
      } else {
        moves = card.getElementsByClassName("variation-card__moves")[0]
          .textContent;
        pgnList.push(moves);
      }
    } catch (error) {
      console.error(error);
    }
  }
  return { pgnList, skipped };
}

async function robustGetUnpausedMovesFromChapter(tries = 5, delay = 300) {
  let chapterScrape = getUnpausedMovesFromChapter();

  if (
    chapterScrape.pgnList.length === 0 &&
    tries > 0 &&
    chapterScrape.skipped === 0
  ) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return robustGetUnpausedMovesFromChapter(tries - 1, delay);
  } else {
    return chapterScrape.pgnList;
  }
}

async function robustGetMovesFromChapter(tries = 5, delay = 300) {
  let pgnList = getMovesFromChapter();

  if (pgnList.length === 0 && tries > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return robustGetMovesFromChapter(tries - 1, delay);
  } else {
    return pgnList;
  }
}

function getChapterTitle() {
  let titletext = document.getElementsByClassName("courseUI-bookChapter")[0];
  if (titletext) {
    return titletext[0].split("Chapters")[1];
  } else {
    return "no title found";
  }
}

function scrapeCoursePage() {
  let chapterList = [];

  let header = document.getElementsByClassName("courseUI-header")[0];
  let courseTitle = header.textContent.split("Chapters")[0];
  let cards = document.getElementsByClassName("levelBox");

  for (let chapter of cards) {
    let chapterTitle = chapter.children[0].textContent;
    let chapterUrl = chapter.href;
    chapterList.push({ title: chapterTitle, url: chapterUrl });
  }

  return { title: courseTitle, chapters: chapterList };
}

async function fetchChapter(url) {
  const response = await fetch(url);
  const text = await response.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(text, "text/html");

  return document;
}

function consolePrint(message, origin = "scrape") {
  browser.runtime.sendMessage({
    method: "print",
    message: message,
    origin: origin,
  });
}
