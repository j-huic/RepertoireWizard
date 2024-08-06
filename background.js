import { Chess } from "https://cdn.skypack.dev/chess.js";

console.log("background script running");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method === "getOptions") {
    let options = [
      "removeNotifs",
      "extraDropdown",
      "filterToggle",
      "categoriesToggle",
      "rename",
    ];
    chrome.storage.sync.get(options, function (items) {
      sendResponse(items);
    });
  } else if (request.method === "getBlacklist") {
    chrome.storage.sync.get(["blacklist", "filterToggle"], function (item) {
      if (item.filterToggle) sendResponse(item);
      else sendResponse(false);
    });
  } else if (request.method === "getCategories") {
    chrome.storage.sync.get(
      ["categories", "categoriesToggle", "rename"],
      function (item) {
        if (item.categoriesToggle) sendResponse(item);
        else sendResponse(false);
      }
    );
  } else if (request.method === "updateFen") {
    console.log("background received updateFen");
    const chess = new Chess(request.fen);
    chess.move(request.move);
    console.log(chess.fen());
    sendResponse({ fen: chess.fen() });
  } else if (request.method === "fetch") {
    console.log("background fetch thing should not be running");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log(tabs[0]);
      chrome.tabs.sendMessage(
        tabs[0].id,
        { method: "fetch", fen: request.fen },
        function (response) {
          console.log("background got response");
          console.log(response);
        }
      );
    });
    return true;
  } else if (request.method === "saveVar") {
    console.log("savevar message received");
    let key = request.key;
    let value = request.value;
    chrome.storage.local.get([key], (items) => {
      if (
        items[key] &&
        typeof items[key] === "object" &&
        typeof value === "object"
      ) {
        let newValue = mergeDicts(items[key], value);
        chrome.storage.local.set({ [key]: newValue }, () => {
          console.log("saved new value to storage");
        });
      } else {
        chrome.storage.local.set({ [key]: value }, () => {
          console.log("saved new value to storage");
        });
      }
    });
  }
  return true;
});

function mergeDicts(dict1, dict2) {
  var mergedDict = {};

  for (var key in dict1) {
    if (dict1.hasOwnProperty(key)) {
      mergedDict[key] = [].concat(dict1[key]);
    }
  }

  for (var key in dict2) {
    if (dict2.hasOwnProperty(key)) {
      if (!mergedDict[key]) {
        mergedDict[key] = [];
      }
      mergedDict[key] = mergedDict[key].concat(dict2[key]);
    }
  }

  return mergedDict;
}
