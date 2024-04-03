console.log("background script running");

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method == "getOptions") {
    options = ['removeNotifs', 'extraDropdown', 'filterToggle', 'categoriesToggle', 'rename'];
    chrome.storage.sync.get(options, function(items) {
        console.log(items);
        sendResponse(items);
    });
  }

  else if (request.method == "getBlacklist") {
    console.log('background reached')
    chrome.storage.sync.get(['blacklist', 'filterToggle'], function(item) {
      console.log(item)
        if (item.filterToggle) sendResponse(item);
        else sendResponse(false);
    });
  }

  else if (request.method == "getCategories"){
    chrome.storage.sync.get(['categories', 'categoriesToggle', 'rename'], function(item){
      if (item.categoriesToggle) sendResponse(item);
      else sendResponse(false);
    });
    
  }  return true; 
  
});

console.log("background script running");