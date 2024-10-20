function getMovesFromChapter() {
  const moveCards = document.getElementsByClassName("variation-card__moves");
  const moveList = Array.from(moveCards).map((card) => card.textContent);

  const chapterName = document
    .getElementsByClassName("courseUI-bookChapter")[0]
    .textContent.split("Chapters")[1];
  return { title: chapterName, moves: moveList };
}

function getChapterUrls() {
  let courseTitle;
  let urls;
  try {
    let header = document.getElementsByClassName("courseUI-header")[0];
    courseTitle = header.textContent.split("Chapters")[0];
  } catch (error) {
    courseTitle = "uknown" + Math.random().toString(36).slice(2, 11);
    console.error("Error retrieving course title", error);
  }
  try {
    let cards = document.getElementsByClassName("levelBox");
    urls = Array.from(cards).map((card) => card.href);
  } catch (error) {
    urls = [];
    throw new Error("Failed to retrieve chapter urls from course page");
  }

  return { title: courseTitle, urls: urls };
}

async function fetchChapter(url) {
  const response = await fetch(url);
  const text = await response.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(text, "text/html");
  return document;
}

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method === "getCardUrls") {
    let urls = getChapterUrls();
    sendResponse(urls);
    return true;
  } else if (request.method === "getMoves") {
    // getMovesFromChapter().then(sendResponse);
    sendResponse(getMovesFromChapter());
    // return true;
  }
});

browser.runtime.onMessage.addListener((request) => {
  if (request.method === "cardurls") {
    console.log(getChapterUrls());
  }
});
