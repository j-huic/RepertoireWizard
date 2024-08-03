console.log("background script running");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.method == "getOptions") {
    options = [
      "removeNotifs",
      "extraDropdown",
      "filterToggle",
      "categoriesToggle",
      "rename",
    ];
    chrome.storage.sync.get(options, function (items) {
      sendResponse(items);
    });
  } else if (request.method == "getBlacklist") {
    chrome.storage.sync.get(["blacklist", "filterToggle"], function (item) {
      if (item.filterToggle) sendResponse(item);
      else sendResponse(false);
    });
  } else if (request.method == "getCategories") {
    chrome.storage.sync.get(
      ["categories", "categoriesToggle", "rename"],
      function (item) {
        if (item.categoriesToggle) sendResponse(item);
        else sendResponse(false);
      }
    );
  } else if (request.method == "fetch") {
    console.log("background fetch thing");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log(tabs[0]);
      chrome.tabs.sendMessage(
        tabs[0].id,
        { method: "fetch", fen: request.fen },
        function (response) {
          sendResponse(response);
        }
      );
    });
  }
  return true;
});
