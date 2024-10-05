import { Chess } from "https://cdn.skypack.dev/chess.js";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method === "getOptions") {
    handleGetOptions(sendResponse);
  } else if (request.method === "getBlacklist") {
    handleGetBlacklist(sendResponse);
  } else if (request.method === "getCategories") {
    handleGetCategories(sendResponse);
  } else if (request.method === "saveVar") {
    handleSaveVar(request);
  } else if (request.method === "getData") {
    handleGetData(request, sendResponse);
    return true;
  } else if (request.method === "getUCI") {
    handleGetUCI(request.fen, request.move, sendResponse);
  }
  return true;
});

function handleGetUCI(fen, algMove, sendResponse) {
  let chess = new Chess(fen);
  let move = chess.move(algMove);
  if (move) {
    sendResponse(move.from + move.to);
  } else {
    sendResponse(null);
  }
}

function handleGetOptions(sendResponse) {
  let options = [
    "removeNotifs",
    "extraDropdown",
    "filterToggle",
    "categoriesToggle",
    "rename",
    "sideAgnostic",
    "highlightMoves",
    "removeWiki",
    "courseDataInfo",
  ];
  chrome.storage.sync.get(options, function (items) {
    sendResponse(items);
  });
}

function handleGetBlacklist(sendResponse) {
  chrome.storage.sync.get(["blacklist", "filterToggle"], function (item) {
    if (item.filterToggle) sendResponse(item);
    else sendResponse(false);
  });
}

function handleGetCategories(sendResponse) {
  chrome.storage.sync.get(
    ["categories", "categoriesToggle", "rename"],
    function (item) {
      if (item.categoriesToggle) sendResponse(item);
      else sendResponse(false);
    }
  );
}

function handleSaveVar(request) {
  let key = request.key;
  let value = request.value;
  chrome.storage.local.get([key], (items) => {
    if (
      items[key] &&
      typeof items[key] === "object" &&
      typeof value === "object"
    ) {
      let newValue = mergeDicts(items[key], value);
      chrome.storage.local.set({ [key]: newValue });
    } else {
      chrome.storage.local.set({ [key]: value });
    }
  });
}

function handleGetData(request, sendResponse) {
  chrome.storage.local.get([request.key], (items) => {
    sendResponse(items[request.key]);
  });
}

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
