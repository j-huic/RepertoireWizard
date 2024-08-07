function getMovesFromChapter() {
  console.log("helo from getmoves");
  let doc = document.cloneNode(true);
  let moveCards = doc.getElementsByClassName("variation-card__moves");
  console.log(moveCards);
  console.log(moveCards instanceof HTMLCollection);
  console.dir(moveCards.length);

  console.log(moveCards[0]);
  //   var arr = Array.prototype.slice.call(moveCards);
  //   console.log(moveCards);
  //   console.log(Object.getOwnPropertyNames(moveCards));
  //   pgns = Array.from(moveCards).map((card) => card.textContent);
  //   console.log(pgns);
  //   return pgns;
  return moveCards;
}

function getCardUrls() {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === "getCardUrls") {
    let urls = getCardUrls();
    console.log(urls);
    sendResponse(urls);
  } else if (request.method === "getMoves") {
    console.log("sending back moves");
    let moves = getMovesFromChapter();
    console.log(moves);
    sendResponse(moves);
  }
});
