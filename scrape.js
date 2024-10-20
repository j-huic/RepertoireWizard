function getMovesFromChapter() {
  const moveCards = document.getElementsByClassName("variation-card__moves");
  const pgnList = Array.from(moveCards).map((card) => card.textContent);

  // const chapterName = document
  //   .getElementsByClassName("courseUI-bookChapter")[0]
  //   .textContent.split("Chapters")[1];

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
