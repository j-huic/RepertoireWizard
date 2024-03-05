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
});