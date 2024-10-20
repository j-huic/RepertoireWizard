const cogwheel = document.getElementById("settingsButton");
cogwheel.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

const testButton = document.getElementById("testButton");
testButton.addEventListener("click", async () => {
  consolePrint("test button clicked");

  let cards = await getCardUrls(document);
  let cardUrls = cards.urls;
  consolePrint(cardUrls);
  scrapeAllLinks(cardUrls.slice(0, 3));
  // input = "https://www.chessable.com/course/91808/48/";
  // let moves = await scrapeLink(input);
  // consolePrint(moves, "moves");
});

async function parseChapterBatch(n) {
  let coursePage = await getCardUrls();
  consolePrint("course page title and links: ");
  consolePrint(coursePage, "parseChBa");
  let courseTitle = coursePage["title"];
  let chapterUrls = coursePage["urls"].slice(0, n);

  for (let url of chapterUrls) {
    let moves = await getMovesFromUrl(url);
    consolePrint({ courseTitle: courseTitle, moves: moves }, "pCB2");
  }
}

async function getCardUrls() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const response = await browser.tabs.sendMessage(tabs[0].id, {
    method: "getCardUrls",
  });
  return response;
}

async function getMovesFromUrl(url) {
  return new Promise((resolve, reject) => {
    browser.tabs
      .create({ url: url, active: false })
      .then((tab) => {
        const listener = (tabId, changeInfo, tabInfo) => {
          if (tabId === tab.id && changeInfo.status === "complete") {
            consolePrint("tab completed loading");
            browser.tabs.onUpdated.removeListener(listener); // Remove the listener to avoid memory leaks
            browser.tabs
              .sendMessage(tab.id, { method: "getMoves" })
              .then((response) => {
                // consolePrint(response);
                browser.tabs.remove(tab.id); // Close the tab after getting the response
                resolve(response);
              })
              .catch((error) => {
                console.error("Error sending message to tab:", error);
                reject(error);
              });
          }
        };
        browser.tabs.onUpdated.addListener(listener);
      })
      .catch((error) => {
        console.error("Error creating tab:", error);
        reject(error);
      });
  });
}

async function scrapeAllLinks(urls) {
  for (let url of urls) {
    const chapterMoves = await scrapeLink(url);
    browser.runtime.sendMessage({
      method: "saveChapterMoves",
      data: chapterMoves,
    });
    consolePrint(chapterMoves);
  }
}

async function scrapeLink(url) {
  const tab = await browser.tabs.create({ url: url, active: false });
  try {
    await waitForTabLoad(tab.id);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await browser.tabs.sendMessage(tab.id, { method: "getMoves" });
    consolePrint(data, "data from scrapelink");
    return { url, chapterData: data };
  } catch (error) {
    console.error(error);
  } finally {
    await browser.tabs.remove(tab.id);
  }
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(changedTabId, changeInfo) {
      if (changedTabId === tabId && changeInfo.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    browser.tabs.onUpdated.addListener(listener);
  });
}

// async function getMovesFromUrl(url) {
//   // return new Promise((resolve, reject) => {
//   chrome.tabs.create({ url: url, active: false }, (tab) => {
//     chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
//       if (tabId === tab.id && info.status === "complete") {
//         chrome.tabs.sendMessage(tab.id, { method: "getMoves" }, (response) => {
//           consolePrint("response from scrape:");
//           consolePrint(response);
//           // resolve(response);
//           // chrome.tabs.remove(tab.id);
//           // chrome.tabs.onUpdated.removeListener(listener);
//         });
//       }
//     });
//   });
//   // });
// }

function consolePrint(message, origin = "") {
  browser.runtime.sendMessage({
    method: "print",
    message: message,
    origin: origin,
  });
}
