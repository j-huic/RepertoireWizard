function getMovesFromChapter() {
  const moveCards = document.getElementsByClassName("variation-card__moves");
  const pgnList = Array.from(moveCards).map((card) => card.textContent);

  return pgnList;
}

function getUnpausedMovesFromChapter() {
  const variationCards = document.getElementsByClassName("variation-card");
  const pgnList = [];

  for (card of variationCards) {
    try {
      if (card.querySelector('[class*="paused"]')) {
        continue;
      } else {
        moves = card.getElementsByClassName("variation-card__moves")[0]
          .textContent;
        pgnList.push(moves);
      }
    } catch (error) {
      console.log(error);
    }
  }
  return pgnList;
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

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method === "scrapeCoursePage") {
    let urls = scrapeCoursePage();
    sendResponse(urls);
    return true;
  } else if (request.method === "getMoves") {
    if (request.skipPaused) {
      sendResponse(getUnpausedMovesFromChapter());
    } else {
      sendResponse(getMovesFromChapter());
    }
  }
});

browser.runtime.onMessage.addListener((request) => {
  if (request.method === "cardurls") {
    console.log(getChapterUrls());
  }
});
