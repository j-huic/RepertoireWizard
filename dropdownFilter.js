var observer = new MutationObserver(callback);
observer.observe(document, { childList: true, subtree: true });

function callback(mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.addedNodes.length) {
      var iframe = document.querySelector("iframe");
      if (iframe) {
        var dropdown =
          iframe.contentDocument.getElementById("repertoireSelector");
        if (dropdown && !dropdown.dataset.processed) {
          dropdown.dataset.processed = "true";

          browser.runtime
            .sendMessage({ method: "getDropdownOptions" })
            .then((response) => {
              observer.disconnect();
              if (response.blacklist && response.filterToggle) {
                filterDropdown(dropdown, response.blacklist);
              }
              if (response.categories && response.categoriesToggle) {
                categoriseDropdown(dropdown, response.categories);
              }
              if (response.rename) {
                rename(dropdown, response.rename);
              }
            });
        }
      }
    }
  }
}

function filterDropdown(dropdown, blacklist) {
  let items = dropdown.children;

  for (var i = items.length - 1; i >= 0; i--) {
    for (let j = 0; j < blacklist.length; j++) {
      if (
        items[i].innerText.toLowerCase().includes(blacklist[j].toLowerCase())
      ) {
        dropdown.remove(i);
        break;
      }
    }
  }
}

function categoriseDropdown(dropdown, categories) {
  let items = dropdown.children;
  var categoryList = Object.keys(categories);

  for (var k = 0; k < categoryList.length; k++) {
    var optgroup = document.createElement("optgroup");
    optgroup.label = categoryList[k];
    whitelist = categories[categoryList[k]];
    dropdown.appendChild(optgroup);
    for (var i = items.length - 1; i >= 0; i--) {
      for (let j = 0; j < categories[categoryList[k]].length; j++) {
        if (
          items[i].innerText
            .toLowerCase()
            .includes(categories[categoryList[k]][j].toLowerCase())
        ) {
          optgroup.appendChild(items[i]);
          break;
        }
      }
    }
  }
}

function rename(dropdown, rename) {
  let renameKeys = Object.keys(rename);
  let items = dropdown.querySelectorAll("option");

  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < renameKeys.length; j++) {
      if (
        items[i].innerText.toLowerCase().includes(renameKeys[j].toLowerCase())
      ) {
        items[i].innerText = rename[renameKeys[j]];
        break;
      }
    }
  }
}
