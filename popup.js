const cogwheel = document.getElementById("settingsButton");
cogwheel.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

const testButton = document.getElementById("testButton");
testButton.addEventListener("click", async () => {
  console.log("test button clicked");
  //   let input = fenInput.value;
  input = "https://www.chessable.com/course/77656/41";

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
