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

  const fileInput = document.getElementById("fileInput");
  const uploadButton = document.getElementById("uploadFileButton");
  const fileStatusMessage = document.getElementById("fileStatusMessage");

  chrome.storage.sync.get(
    ["blacklist", "categories", "rename"],
    function (storage) {
      blacklistInput.value = storage.blacklist.join(", ");
      categoriesInput.value = JSON.stringify(storage.categories, null, 2);
      renameInput.value = JSON.stringify(storage.rename, null, 2);

      resizeInput(blacklistInput, storage.blacklist);
      resizeInput(categoriesInput, storage.categories);
      resizeInput(renameInput, storage.rename);
    }
  );

  chrome.storage.local.get(
    ["courseData", "courseDataFilename", "courseDataTimestamp"],
    function (result) {
      if (result) {
        fileStatusMessage.textContent =
          "Course data file already exists: " +
          result.courseDataFilename +
          " (" +
          result.courseDataTimestamp +
          ")";
      }
    }
  );

  blacklistSubmit.addEventListener("click", submitBlacklist);
  blacklistInput.addEventListener(
    "keydown",
    handleKeydown(blacklistInput, "blacklist")
  );

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

  uploadButton.addEventListener("click", uploadFile);

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

  function handleKeydown(inputElement, key) {
    return function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        submitData(inputElement, key);
      }
    };
  }

  function submitData(inputElement, key) {
    inputElement.style.height = "auto";
    inputElement.style.height = inputElement.scrollHeight + "px";
    let input = inputElement.value;

    if (key === "categories" || key === "rename") {
      processedInput = processJSONInput(input);
    } else if (key === "blacklist") {
      processedInput = processBlacklist(input);
    }

    chrome.storage.sync.set({ [key]: processedInput });
  }

  function processBlacklist(input) {
    try {
      let blacklist = input.split(",").map((item) => item.trim());
      return [...new Set(blacklist)];
    } catch (error) {
      console.error("error processing blacklist", error);
      return [];
    }
  }

  function processJSONInput(input) {
    try {
      let value = JSON.parse(input);
      if (typeof value === "object" && value !== null) {
        return value;
      }
    } catch (error) {
      console.error("invalid json input", error);
    }
    return {};
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

  function resizeInput(input, obj) {
    input.value = JSON.stringify(obj, null, 2);
    input.style.whiteSpace = "pre";
    input.style.width = "auto";
    input.style.height = "auto";
    input.style.width = input.scrollWidth + "px";
    input.style.height = input.scrollHeight + "px";
  }
});
