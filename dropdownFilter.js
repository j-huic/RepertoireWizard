var callback = function (mutationsList, observer) {
  for (let mutation of mutationsList) {
    if (mutation.addedNodes.length) {
      var iframe = document.querySelector("iframe");
      if (iframe) {
        var dropdown =
          iframe.contentDocument.getElementById("repertoireSelector");
        if (dropdown) {
          var items = dropdown.children;
          var itemslength = items.length;

          chrome.runtime.sendMessage(
            { method: "getBlacklist" },
            function (response) {
              if (response.blacklist) {
                var blacklistlength = response.blacklist.length;

                for (var i = itemslength - 1; i >= 0; i--) {
                  for (let j = 0; j < blacklistlength; j++) {
                    if (
                      items[i].innerText
                        .toLowerCase()
                        .includes(response.blacklist[j].toLowerCase())
                    ) {
                      dropdown.remove(i);
                      break;
                    }
                  }
                }
              }
            }
          );

          chrome.runtime.sendMessage(
            { method: "getCategories" },
            function (response) {
              var categories = Object.keys(response.categories);

              for (var k = 0; k < categories.length; k++) {
                var optgroup = document.createElement("optgroup");
                optgroup.label = categories[k];
                whitelist = response.categories[categories[k]];
                dropdown.appendChild(optgroup);
                for (var i = items.length - 1; i >= 0; i--) {
                  for (
                    let j = 0;
                    j < response.categories[categories[k]].length;
                    j++
                  ) {
                    if (
                      items[i].innerText
                        .toLowerCase()
                        .includes(
                          response.categories[categories[k]][j].toLowerCase()
                        )
                    ) {
                      optgroup.appendChild(items[i]);
                      break;
                    }
                  }
                }
              }

              rename();
            }
          );

          observer.disconnect();
        }
      }
    }
  }
};

var observer = new MutationObserver(callback);
observer.observe(document, { childList: true, subtree: true });

rename = function () {
  chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
    let rename = response.rename;
    let renameKeys = Object.keys(rename);

    var iframe = document.querySelector("iframe");
    let dropdown2 = iframe.contentDocument.getElementById("repertoireSelector");
    let items = dropdown2.querySelectorAll("option");

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
  });
};
