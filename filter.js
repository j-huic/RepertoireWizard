var callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if(mutation.addedNodes.length) {
            var iframe = document.querySelector('iframe'); 
            if(iframe) {
                var dropdown = iframe.contentDocument.getElementById("repertoireSelector");
                if(dropdown) {
                    chrome.runtime.sendMessage({method: "getBlacklist"}, function(response) {
                        console.log("sending storage request");
                        if (response.blacklist){
                            console.log("blacklist received");
                            console.log(response.blacklist);     
                    
                            var items = dropdown.children;
                            var itemslength = items.length;
                            var blacklistlength = response.blacklist.length;
                                for (var i = itemslength - 1; i >= 0; i--) {
                                    for (let j = 0; j < blacklistlength; j++) {
                                        if (items[i].innerText.toLowerCase().includes(response.blacklist[j].toLowerCase())) {
                                            console.log("removing " + items[i].innerText);
                                            dropdown.remove(i);
                                            break;
                                        }
                                    }
                                }
                        }
                    });

                    observer.disconnect();
                }
            }
            else console.log("Button div not found");
        }
    }
};



var observer = new MutationObserver(callback);
observer.observe(document, { childList: true, subtree: true});