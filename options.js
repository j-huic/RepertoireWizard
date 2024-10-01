document.addEventListener("DOMContentLoaded", function () {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  chrome.storage.sync.get(
    ["removeNotifs", "filterToggle", "categoriesToggle", "sideAgnostic"],
    function (options) {
      checkboxes.forEach(function (checkbox) {
        checkbox.checked = options[checkbox.id];
      });
    }
  );

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (event) {
      let obj = {};
      obj[event.target.id] = event.target.checked;
      chrome.storage.sync.set(obj, function () {
        console.log(
          `Option ${event.target.id} set to ${event.target.checked} and saved to chrome storage`
        );
      });
    });
  });

  blacklistInput = document.getElementById("blacklistInput");
  blacklistSubmit = document.getElementById("blacklistSubmit");
  clearBlacklist = document.getElementById("clearBlacklist");

  categoriesInput = document.getElementById("categoriesInput");
  categoriesSubmit = document.getElementById("categoriesSubmit");
  clearCategories = document.getElementById("clearCategories");

  renameInput = document.getElementById("renameInput");
  renameSubmit = document.getElementById("renameSubmit");

  fileInput = document.getElementById("fileInput");
  uploadButton = document.getElementById("uploadFileButton");
  fileStatusMessage = document.getElementById("fileStatusMessage");

  chrome.storage.sync.get(
    ["blacklist", "categories", "rename"],
    function (storage) {
      blacklistInput.value = storage.blacklist;
      blacklistInput.style.height = "auto";
      blacklistInput.style.height = blacklistInput.scrollHeight + "px";

      function resizeInput(input, obj) {
        input.value = JSON.stringify(obj, null, 2);
        input.style.whiteSpace = "pre";
        input.style.width = "auto";
        input.style.height = "auto";
        input.style.width = input.scrollWidth + "px";
        input.style.height = input.scrollHeight + "px";
      }

      categoriesInput.value = JSON.stringify(storage.categories, null, 2);
      categoriesInput.style.height = "auto";
      categoriesInput.style.height = categoriesInput.scrollHeight + "px";
      resizeInput(categoriesInput, storage.categories);

      renameInput.value = JSON.stringify(storage.rename, null, 2);
      resizeInput(renameInput, storage.rename);
    }
  );

  chrome.storage.local.get(
    ["courseData", "courseDataFilename", "courseDataTimestamp"],
    function (result) {
      if (result.courseData) {
        fileStatusMessage.textContent = "Course data file already exists";
      }
      if (result.courseDataFilename) {
        fileStatusMessage.textContent += ": " + result.courseDataFilename;
      }
      if (result.courseDataTimestamp) {
        fileStatusMessage.textContent +=
          " (" + result.courseDataTimestamp + ")";
      }
    }
  );

  uploadButton.addEventListener("click", uploadFile);

  blacklistSubmit.addEventListener("click", submitBlacklist);
  blacklistInput.addEventListener("keydown", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      submitBlacklist();
    }
  });

  categoriesSubmit.addEventListener("click", submitCategories);
  categoriesInput.addEventListener("keydown", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      submitCategories();
    }
  });

  renameSubmit.addEventListener("click", submitRename);
  renameInput.addEventListener("keydown", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      submitRename();
    }
  });

  clearBlacklist.addEventListener("click", function () {
    chrome.storage.sync.set({ blacklist: [] }, function () {
      blacklistInput.value = "";
      console.log("Blacklist cleared");
    });
  });

  clearCategories.addEventListener("click", function () {
    chrome.storage.sync.set({ categories: {} }, function () {
      console.log("Categories cleared");
    });
  });

  showBlacklist.addEventListener("click", function () {
    chrome.storage.sync.get("blacklist", function (storage) {
      if (storage.blacklist) {
        console.log(storage.blacklist);
        alert(storage.blacklist.join("\n"));
      } else {
        alert("Blacklist is empty");
      }
    });
  });

  showCategories.addEventListener("click", function () {
    chrome.storage.sync.get("categories", function (storage) {
      if (storage.categories) {
        console.log(storage.categories);
        alert(JSON.stringify(storage.categories, null, 2));
      } else {
        alert("categories is empty");
      }
    });
  });

  const infoIcon = document.getElementById("infoIcon");
  const infoText = document.getElementById("infoText");
  const infoIconCat = document.getElementById("infoIconCat");
  const infoTextCat = document.getElementById("infoTextCat");
  const infoIconRename = document.getElementById("infoIconRename");
  const infoTextRename = document.getElementById("infoTextRename");

  infoIcon.addEventListener("click", () => {
    alert(infoText.textContent);
  });
  infoIconCat.addEventListener("click", () => {
    alert(infoTextCat.textContent);
  });
  infoIconRename.addEventListener("click", () => {
    alert(infoTextRename.textContent);
  });

  function uploadFile() {
    const file = fileInput.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          const fileName = file.name;
          const timestamp = new Date().toLocaleString();

          chrome.storage.local.set(
            {
              courseData: jsonData,
              courseDataFilename: fileName,
              courseDataTimestamp: timestamp,
            },
            () => {
              alert("File uploaded successfully");
            }
          );
        } catch (error) {
          alert("Error parsing file: " + error);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid JSON file");
    }
  }

  function submitBlacklist() {
    blacklistInput.style.height = "auto";
    blacklistInput.style.height = blacklistInput.scrollHeight + "px";

    if (blacklistInput.value === "") {
      return;
    }

    var blacklist = blacklistInput.value.split(",").map(function (item) {
      return item.trim();
    });
    var blacklist = [...new Set(blacklist)];
    console.log(blacklist);
    chrome.storage.sync.set({ blacklist: blacklist }, function () {});
  }

  function submitCategories() {
    categoriesInput.style.height = "auto";
    categoriesInput.style.height = categoriesInput.scrollHeight + "px";
    let value = categoriesInput.value;

    if (value === "") {
      input = {};
    } else {
      input = JSON.parse(value);
    }

    if (typeof input === "object" && Object.keys(input).length > 0) {
      var newCategories = input;
    } else return;

    chrome.storage.sync.set({ categories: newCategories }, function () {});
  }

  function submitRename() {
    renameInput.style.height = "auto";
    renameInput.style.height = renameInput.scrollHeight + "px";
    let value = renameInput.value;

    if (value === "") {
      input = {};
    } else {
      input = JSON.parse(value);
    }

    if (typeof input === "object") {
      var newRename = input;
    } else return;

    chrome.storage.sync.set({ rename: newRename }, function () {});
  }
});
