document.addEventListener("DOMContentLoaded", () => {
  console.log("blabla");
  const fetchButton = document.getElementById("fetchButton");
  const fenInput = document.getElementById("fenInput");
  const testButton = document.getElementById("testButton");

  fetchButton.addEventListener("click", function () {
    console.log("fetch button clicked");
    const fenvalue =
      fenInput.value === ""
        ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        : fenInput.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log(tabs[0]);
      chrome.tabs.sendMessage(tabs[0].id, {
        method: "fetch",
        fen: fenvalue,
      });
    });
  });

  testButton.addEventListener("click", () => {
    let input = fenInput.value;
    if (input.length > 2) {
      chrome.tabs.create({ url: input, active: false }, () => {});
    } else {
      cardUrls = getCardUrls(document);
      consolePrint("hello from popup");
      consolePrint(cardUrls);
      cardUrls.slice(0, 5).forEach((url) => {
        chrome.tabs.create({ url: url, active: false }, () => {});
      });
    }
  });

  function getCardUrls(document) {
    let box = document.getElementById("chapterBoxes");
    consolePrint(box);
    let cards = box.getElementsByClassName("levelBox");
    let urls = Array.from(cards).map((card) => card.href);
    return urls;
  }

  function consolePrint(string) {
    chrome.runtime.sendMessage({ method: "print", message: string });
  }
});

console.log("blabl2");
