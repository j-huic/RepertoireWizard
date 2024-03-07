var callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if(mutation.addedNodes.length) {
            var iframe = document.querySelector('iframe'); 
            if(iframe) {
                var dropdown = iframe.contentDocument.getElementById("repertoireSelector");
                if(dropdown) {
                    var items = dropdown.children;
                    var itemslength = items.length;

                    chrome.runtime.sendMessage({method: "getBlacklist"}, function(response) {
                        console.log("sending storage request");
                        if (response.blacklist){
                            console.log("blacklist received");
                            console.log(response.blacklist);     
                    
                            
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
                    
                    chrome.runtime.sendMessage({method: "getCategories"}, function(response) {
                        console.log(response.categories)
                        var newDropdown = document.createElement("select");
                        newDropdown.id = "newDropdown";
                        var categories = Object.keys(response.categories);

                        for (var k = 0; k < categories.length; k++){
                            var optgroup = document.createElement("optgroup");
                            optgroup.label = categories[k];
                            whitelist = response.categories[categories[k]];
                            //newDropdown.appendChild(optgroup);
                            dropdown.appendChild(optgroup);
                            for (var i = items.length - 1; i >= 0; i--) {
                                for (let j = 0; j < response.categories[categories[k]].length; j++) {
                                    console.log(items[i].innerText)
                                    console.log(response.categories[categories[k]][j])
                                    if (items[i].innerText.toLowerCase().includes(response.categories[categories[k]][j].toLowerCase())) {
                                        console.log("adding " + items[i].innerText + " to " + categories[k]);
                                        optgroup.appendChild(items[i]);
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