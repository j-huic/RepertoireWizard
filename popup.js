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

  testButton.addEventListener("click", async () => {
    let input = fenInput.value;
    if (input === "") input = "https://www.chessable.com/course/77656/41";

    if (input.length > 2) {
      let moves = await getMovesFromUrl(input);
      consolePrint("hello from popup");
      consolePrint(moves);
    } else {
      let cardUrls = await getCardUrls(document);
      consolePrint("hello from popup");
      consolePrint(cardUrls);

      for (let url of cardUrls) {
        let moves = await getMovesFromUrl(url);
        consolePrint(moves);
      }
    }
  });

  async function getCardUrls() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { method: "getCardUrls" },
          (response) => {
            resolve(response);
          }
        );
      });
    });
  }

  async function getMovesFromUrl(url) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ url: url, active: false }, (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === "complete") {
            chrome.tabs.sendMessage(
              tab.id,
              { method: "getMoves" },
              (response) => {
                consolePrint("response from popup:");
                consolePrint(response);
                resolve(response);
                // chrome.tabs.remove(tab.id);
                // chrome.tabs.onUpdated.removeListener(listener);
              }
            );
          }
        });
      });
    });
  }

  function consolePrint(string) {
    chrome.runtime.sendMessage({ method: "print", message: string });
  }
});

console.log("blabl2");
