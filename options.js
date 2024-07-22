document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        chrome.storage.sync.get(
            ['removeNotifs', 'extraDropdown', 'filterToggle', 'categoriesToggle'], 
            function(options) {
                checkboxes.forEach(function(checkbox) {
                    checkbox.checked = options[checkbox.id];
                });
            });
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function(event) {
                let obj = {};
                obj[event.target.id] = event.target.checked;
                chrome.storage.sync.set(obj, function() {
                    console.log(`Option ${event.target.id} set to ${event.target.checked} and saved to chrome storage`);
                });
            });
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

    function submitBlacklist2() {
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
    function submitCategories2() {
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

    function submitBlacklist() {
        blacklistInput.style.height = 'auto';
        blacklistInput.style.height = (blacklistInput.scrollHeight) + 'px';
        
        if (blacklistInput.value === '') {
            return;
        }

        var blacklist = blacklistInput.value.split(',').map(function(item) {return item.trim();});
        var blacklist = [...new Set(blacklist)];
        console.log(blacklist);
        chrome.storage.sync.set({ 'blacklist': blacklist }, function() {});
    }

    function submitCategories() {
        categoriesInput.style.height = 'auto';
        categoriesInput.style.height = (categoriesInput.scrollHeight) + 'px'
        var value = categoriesInput.value;

        if (value === '') {input = {};}
        else {input = JSON.parse(value);}

        if (typeof input === 'object' && Object.keys(input).length > 0){
            var newCategories = input;
        }
        else return;

        chrome.storage.sync.set({ 'categories': newCategories }, function() {});
    }

    function submitRename() {
        renameInput.style.height = 'auto';
        renameInput.style.height = (renameInput.scrollHeight) + 'px'
        var value = renameInput.value;

        if (value === '') {input = {};}
        else {input = JSON.parse(value);}

        if (typeof input === 'object'){
            var newRename = input;
        }
        else return;
        
        chrome.storage.sync.set({ 'rename': newRename }, function() {});
    }
    
    blacklistInput = document.getElementById('blacklistInput');
    blacklistSubmit = document.getElementById('blacklistSubmit');
    clearBlacklist = document.getElementById('clearBlacklist');
    
    categoriesInput = document.getElementById('categoriesInput');
    categoriesSubmit = document.getElementById('categoriesSubmit');
    clearCategories = document.getElementById('clearCategories');

    renameInput = document.getElementById('renameInput');
    renameSubmit = document.getElementById('renameSubmit');

    chrome.storage.sync.get(['blacklist', 'categories', 'rename'], function(storage) {
        blacklistInput.value = storage.blacklist;
        blacklistInput.style.height = 'auto';
        blacklistInput.style.height = (blacklistInput.scrollHeight) + 'px';

        categoriesInput.value = JSON.stringify(storage.categories, null, 2);
        categoriesInput.style.height = 'auto';
        categoriesInput.style.height = (categoriesInput.scrollHeight) + 'px';

        renameInput.value = JSON.stringify(storage.rename, null, 2);
        renameInput.style.height = 'auto';
        renameInput.style.height = (renameInput.scrollHeight) + 'px';
    });

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

    renameSubmit.addEventListener('click', submitRename);
    renameInput.addEventListener('keydown', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            submitRename();
        }
    });

    clearBlacklist.addEventListener('click', function() {
        chrome.storage.sync.set({ 'blacklist': [] }, function() {
            blacklistInput.value = '';
            console.log('Blacklist cleared');
        });
    });
    clearCategories.addEventListener('click', function() {
        chrome.storage.sync.set({ 'categories': {} }, function() {
            console.log('Categories cleared');
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
    const infoIconRename = document.getElementById('infoIconRename');
    const infoTextRename = document.getElementById('infoTextRename');
    
    infoIcon.addEventListener('click', () => {
        alert(infoText.textContent);
    });
    infoIconCat.addEventListener('click', () => {
        alert(infoTextCat.textContent);
    });
    infoIconRename.addEventListener('click', () => {
        chrome.storage.sync.get('rename', function(storage) {
            console.log(storage.rename);
        });
        //alert(infoTextRename.textContent);
    });
});

