console.log("background script running");

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method == "getOptions") {
    options = ['removeNotifs', 'extraDropdown'];
    chrome.storage.sync.get(options, function(items) {
        console.log(items);
        sendResponse(items);
    });
  }

  else if (request.method == "getBlacklist") {
    chrome.storage.sync.get('blacklist', function(item) {
      console.log(item);
        sendResponse(item);
    });
}
  return true; 
});

console.log("background script running");