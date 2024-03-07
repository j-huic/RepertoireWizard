document.addEventListener('DOMContentLoaded', function() {

    chrome.storage.sync.get(['removeNotifs', 'extraDropdown'], function(options) {
        console.log(options);
        if (options.removeNotifs) {
            document.getElementById('notifs').checked = true;
        }
        if (options.extraDropdown) {
            document.getElementById('extraDropdownCheckbox').checked = true;
        }
    });

    const notifsCheckbox = document.getElementById('notifs');
    const dropdownCheckbox = document.getElementById('extraDropdownCheckbox');

    notifsCheckbox.addEventListener('change', function() {
        if (notifsCheckbox.checked) {
            chrome.storage.sync.set({ 'removeNotifs': true }, function() {
                console.log('Option checked and saved to chrome storage');
            });
        } else {
            chrome.storage.sync.set({ 'removeNotifs': false }, function() {
                console.log('Option unchecked and saved to chrome storage');
            });
        }
    });

    dropdownCheckbox.addEventListener('change', function() {
        if (dropdownCheckbox.checked) {
            chrome.storage.sync.set({ 'extraDropdown': true }, function() {
                console.log('Option checked and saved to chrome storage');
            });
        } else {
            chrome.storage.sync.set({ 'extraDropdown': false }, function() {
                console.log('Option unchecked and saved to chrome storage');
            });
        }
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

    function submitBlacklist() {
        if (blacklistInput.value === '') {
            return;
        }
        var blacklist = blacklistInput.value.split(',').map(function(item) {return item.trim();});

        chrome.storage.sync.get('blacklist', function(storage) {
            if (storage.blacklist) {
                var newBlacklist = storage.blacklist.slice();

                if (Array.isArray(blacklist)) {
                    newBlacklist = newBlacklist.concat(blacklist);
                } else {
                    newBlacklist.push(blacklist);
                }

                chrome.storage.sync.set({ 'blacklist': newBlacklist }, function() {
                    console.log('Blacklist updated, new blacklist:');
                    console.log(newBlacklist);
                });
            } 
            else {
                chrome.storage.sync.set({ 'blacklist': blacklist.split(',') }, function() {
                    console.log('Blacklist set');
                });
            }

            blacklistInput.value = '';
        });
    }
    
    function submitCategories() {
        chrome.storage.sync.get('categories', function(storage) {
            input = jsonObject = JSON.parse(categoriesInput.value);
            console.log(typeof input)
            if (typeof input === 'object' && Object.keys(input).length > 0){
                var newCategories = mergeDicts(storage.categories, input);
            }
            else return;

            if (storage.categories) {
                chrome.storage.sync.set({ 'categories': newCategories }, function() {
                    console.log('categories updated, new categories:');
                    console.log(newCategories);
                });
            } 
            else {
                chrome.storage.sync.set({ 'categories': newCategories }, function() {
                    console.log('categories set');
                    console.log('categories updated, new categories:');
                    console.log(newCategories);
                });
            }
            categoriesInput.value = '';
        });
    }

    blacklistInput = document.getElementById('blacklistInput');
    blacklistSubmit = document.getElementById('blacklistSubmit');
    clearBlacklist = document.getElementById('clearBlacklist');
    
    categoriesInput = document.getElementById('categoriesInput');
    categoriesSubmit = document.getElementById('categoriesSubmit');
    clearCategories = document.getElementById('clearCategories');

    blacklistSubmit.addEventListener('click', submitBlacklist);
    blacklistInput.addEventListener('keydown', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            submitBlacklist();
        }
    });
    categoriesSubmit.addEventListener('click', submitCategories);
    categoriesInput.addEventListener('keydown', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            submitCategories();
        }
    });

    clearBlacklist.addEventListener('click', function() {
        chrome.storage.sync.set({ 'blacklist': [] }, function() {
            console.log('Blacklist cleared');
        });
    });
    clearCategories.addEventListener('click', function() {
        chrome.storage.sync.set({ 'categories': {} }, function() {
            console.log('categories cleared');
        });
    });

    showBlacklist.addEventListener('click', function() {
        chrome.storage.sync.get('blacklist', function(storage) {
            if (storage.blacklist) {
                console.log(storage.blacklist);
                alert(storage.blacklist.join('\n'));
            } else {
                alert('Blacklist is empty');
            }
        });
    }); 
    showCategories.addEventListener('click', function() {
        chrome.storage.sync.get('categories', function(storage) {
            if (storage.categories) {
                console.log(storage.categories);
                alert(JSON.stringify(storage.categories, null, 2));
            } else {
                alert('categories is empty');
            }
        });
    });

    const infoIcon = document.getElementById('infoIcon');
    const infoText = document.getElementById('infoText');
    const infoIconCat = document.getElementById('infoIconCat');
    const infoTextCat = document.getElementById('infoTextCat');
    
    infoIcon.addEventListener('click', () => {
        alert(infoText.textContent);
    });
    infoIconCat.addEventListener('click', () => {
        alert(infoTextCat.textContent);
    });
});

