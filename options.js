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
    
    let removeNotifs = false;
    let extraDropdown = false;

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

    function submitBlacklist() {
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
    
    blacklistInput = document.getElementById('blacklistInput');
    blacklistSubmit = document.getElementById('blacklistSubmit');
    clearBlacklist = document.getElementById('clearBlacklist');

    blacklistSubmit.addEventListener('click', submitBlacklist);
    blacklistInput.addEventListener('keydown', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            submitBlacklist();
        }
    });

    clearBlacklist.addEventListener('click', function() {
        chrome.storage.sync.set({ 'blacklist': [] }, function() {
            console.log('Blacklist cleared');
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

    const infoIcon = document.getElementById('infoIcon');
    const infoText = document.getElementById('infoText');
    
    infoIcon.addEventListener('click', () => {
        alert(infoText.textContent);
    });
});

