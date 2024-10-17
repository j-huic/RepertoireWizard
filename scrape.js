console.log("scrape running");

function getMovesFromChapter() {
  let moveCards = document.getElementsByClassName("variation-card__moves");
  let cardText = Array.from(moveCards).map((card) => card.innerHTML);
  console.log(cardText);

  return moveCards;
}

function getChapterUrls() {
  console.log(document.readyState);
  console.log("getting card urls");
  let cards = document.getElementsByClassName("levelBox");
  let urls = Array.from(cards).map((card) => card.href);
  return urls;
}

async function fetchChapter(url) {
  const response = await fetch(url);
  const text = await response.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(text, "text/html");
  return document;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === "getCardUrls") {
    let urls = getChapterUrls();
    // console.log(urls);
    sendResponse(urls);
  } else if (request.method === "getMoves") {
    console.log("getmoves called");
    let moves = getMovesFromChapter();
    setTimeout(() => {
      let cardText = Array.from(moves).map((card) => card.textContent);
      console.log(cardText);
      sendResponse(cardText);
    }, 2000);
  }
  return true;
});

browser.runtime.onMessage.addListener((request) => {
  if (request.method === "cardurls") {
    console.log(getChapterUrls());
  }
});
