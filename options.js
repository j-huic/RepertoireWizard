document.addEventListener("DOMContentLoaded", function () {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  initializeCheckboxes();
  addCheckboxListeners();

  const blacklistInput = document.getElementById("blacklistInput");
  const blacklistSubmit = document.getElementById("blacklistSubmit");
  const clearBlacklist = document.getElementById("clearBlacklist");

  const categoriesInput = document.getElementById("categoriesInput");
  const categoriesSubmit = document.getElementById("categoriesSubmit");
  const clearCategories = document.getElementById("clearCategories");

  const renameInput = document.getElementById("renameInput");
  const renameSubmit = document.getElementById("renameSubmit");
  const clearRename = document.getElementById("clearRename");

  const fileInput = document.getElementById("fileInput");
  const uploadButton = document.getElementById("uploadFileButton");
  const fileStatusMessage = document.getElementById("fileStatusMessage");

  chrome.storage.sync.get(
    ["blacklist", "categories", "rename"],
    function (storage) {
      blacklistInput.value = storage.blacklist.join(", ");
      categoriesInput.value = JSON.stringify(storage.categories, null, 2);
      renameInput.value = JSON.stringify(storage.rename, null, 2);

      blacklistInput.style.height = "auto";
      blacklistInput.style.height = blacklistInput.scrollHeight + "px";
      resizeInput(categoriesInput, storage.categories);
      resizeInput(renameInput, storage.rename);
    }
  );

  chrome.storage.local.get(
    ["courseData", "courseDataFilename", "courseDataTimestamp"],
    function (storage) {
      if (storage) {
        fileStatusMessage.textContent =
          "Course data file already exists: " +
          storage.courseDataFilename +
          " (" +
          storage.courseDataTimestamp +
          ")";
      }
    }
  );

  blacklistSubmit.addEventListener("click", submitBlacklist);
  categoriesSubmit.addEventListener("click", submitCategories);
  renameSubmit.addEventListener("click", submitRename);
  uploadButton.addEventListener("click", uploadFile);

  blacklistInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitBlacklist();
    }
  });
  categoriesInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitCategories();
    }
  });
  renameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitRename();
    }
  });

  clearBlacklist.addEventListener("click", function () {
    chrome.storage.sync.set({ blacklist: [] }, function () {
      blacklistInput.value = "";
    });
  });
  clearCategories.addEventListener("click", function () {
    chrome.storage.sync.set({ categories: {} }, function () {
      categoriesInput.value = "";
    });
  });
  clearRename.addEventListener("click", function () {
    chrome.storage.sync.set({ rename: {} }, function () {
      renameInput.value = "";
    });
  });

  const infoIconFilter = document.getElementById("infoIcon");
  const infoTextFilter = document.getElementById("infoText");
  const infoIconCat = document.getElementById("infoIconCat");
  const infoTextCat = document.getElementById("infoTextCat");
  const infoIconRename = document.getElementById("infoIconRename");
  const infoTextRename = document.getElementById("infoTextRename");

  infoIconFilter.addEventListener("click", () => {
    alert(infoTextFilter.textContent);
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
          const jsonData = JSON.parse(e.target.storage);
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
    blacklistInput.style.height = blacklistInput.scrollHeight + 5 + "px";

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
    categoriesInput.style.height = categoriesInput.scrollHeight + 5 + "px";
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

  function initializeCheckboxes() {
    chrome.storage.sync.get(
      ["removeNotifs", "filterToggle", "categoriesToggle", "sideAgnostic"],
      function (options) {
        checkboxes.forEach(function (checkbox) {
          checkbox.checked = options[checkbox.id];
        });
      }
    );
  }

  function addCheckboxListeners() {
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
  }

  function resizeInput(input, obj, stringify = true) {
    if (stringify) {
      input.value = JSON.stringify(obj, null, 2);
    }
    input.style.whiteSpace = "pre";
    input.style.width = "auto";
    input.style.height = "auto";
    input.style.width = input.scrollWidth + 25 + "px";
    input.style.height = input.scrollHeight + 5 + "px";
  }
});
