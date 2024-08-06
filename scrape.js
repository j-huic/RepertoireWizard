function getMovesFromChapter(document) {
  moveCards = document.getElementByClassName("variation-card__moves");
  pgns = moveCards.map((card) => card.textContent);
  return pgns;
}

function getCardUrls(document) {
  cards = document.getElementsByClassName("levelBox");
  urls = cards.map((card) => card.href);
  return urls;
}

async function fetchChapter(url) {
  const response = await fetch(url);
  const text = await response.text();
  const parser = new DOMParser();
  const document = parser.parseFromString(text, "text/html");
  return document;
}
