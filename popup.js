const cogwheel = document.getElementById("settingsButton");
cogwheel.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

const testButton = document.getElementById("testButton");
testButton.addEventListener("click", async () => {
  consolePrint("test button clicked");
  //   let input = fenInput.value;
  input = "https://www.chessable.com/course/91808/48/";
  if (input.length > 2) {
    // let moves = await getMovesFromUrl(input);
    consolePrint(getCardUrls());
    // consolePrint(moves);
  } else {
    let cardUrls = await getCardUrls(document);
    consolePrint(cardUrls);

    for (let url of cardUrls) {
      let moves = await getMovesFromUrl(url);
      consolePrint(moves);
    }
  }
});

async function getCardUrls() {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    browser.tabs
      .sendMessage(tabs[0].id, { method: "getCardUrls" })
      .then((response) => {
        for (let href of response.slice(0, 3)) {
          getMovesFromUrl(href);
          // consolePrint(href);
        }
      });
  });
}

async function getMovesFromUrl(url) {
  // return new Promise((resolve, reject) => {
  chrome.tabs.create({ url: url, active: false }, (tab) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.sendMessage(tab.id, { method: "getMoves" }, (response) => {
          consolePrint("response from scrape:");
          consolePrint(response);
          // resolve(response);
          // chrome.tabs.remove(tab.id);
          // chrome.tabs.onUpdated.removeListener(listener);
        });
      }
    });
  });
  // });
}

function consolePrint(message) {
  browser.runtime.sendMessage({
    method: "print",
    message: message,
  });
}
