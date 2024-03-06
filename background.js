console.log("background script running");

// Listen for messages from the content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("got a message")
  if (request.method == "getOptions") {
    console.log("trying to get storage");
    options = ['removeNotifs', 'extraDropdown'];
    chrome.storage.sync.get(options, function(items) {
        console.log(items);
        sendResponse(items);
    });
  }
  return true; // Required to keep the message channel open until sendResponse is called
});

console.log("background script running");