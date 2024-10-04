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
  const clearData = document.getElementById("clearData");

  chrome.storage.sync.get(
    ["blacklist", "categories", "rename"],
    function (storage) {
      if (storage.blacklist) {
        blacklistInput.value = storage.blacklist.join(", ");
        blacklistInput.style.height = "auto";
        blacklistInput.style.height = blacklistInput.scrollHeight + "px";
      }
      if (storage.categories) {
        categoriesInput.value = JSON.stringify(storage.categories, null, 2);
        resizeInput(categoriesInput, storage.categories);
      }
      if (storage.rename) {
        renameInput.value = JSON.stringify(storage.rename, null, 2);
        resizeInput(renameInput, storage.rename);
      }
    }
  );

  chrome.storage.local.get(
    ["courseData", "courseDataFilename", "courseDataTimestamp"],
    function (storage) {
      if (storage.courseData) {
        displayCourseDataOptions(storage.courseData);
        fileStatusMessage.textContent =
          "Course data file already exists: " +
          storage.courseDataFilename +
          " (uploaded on   " +
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
  clearData.addEventListener("click", function () {
    chrome.storage.local.remove("courseData", function () {
      fileStatusMessage.textContent = "";
      document.getElementById("courseOptionsContainer").innerHTML = "";
    });
  });

  const infoIconBlacklist = document.getElementById("infoIconBlacklist");
  const infoTextBlacklist = document.getElementById("infoTextBlacklist");
  const infoIconRename = document.getElementById("infoIconRename");
  const infoTextRename = document.getElementById("infoTextRename");
  const infoIconData = document.getElementById("infoIconData");
  const infoTextData = document.getElementById("infoTextData");
  const infoIconCat = document.getElementById("infoIconCat");
  const infoTextCat = document.getElementById("infoTextCat");

  infoIconBlacklist.addEventListener("click", () => {
    alert(infoTextBlacklist.textContent);
  });
  infoIconCat.addEventListener("click", () => {
    alert(infoTextCat.textContent);
  });
  infoIconRename.addEventListener("click", () => {
    alert(infoTextRename.textContent);
  });
  infoIconData.addEventListener("click", () => {
    alert(infoTextData.textContent);
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
              displayCourseDataOptions(jsonData);
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

  function styleCheckbox(input) {
    input.style.backgroundColor = input.checked ? "black" : "white";
    input.style.borderColor = input.checked ? "black" : "white";
    input.style.setProperty(
      "--bs-form-switch-bg",
      input.checked ? "blue" : "white"
    );
  }

  function createCourseDataOptionsRow(key, container, storedData) {
    let row = document.createElement("div");
    row.className = "row align-items-center mb-2";

    // label column
    let labelCol = document.createElement("div");
    labelCol.className = "col-4 text-start";
    let label = document.createElement("label");
    label.textContent = key;
    label.className = "form-check-label me-2";
    label.htmlFor = key;
    labelCol.appendChild(label);

    // switch column
    let switchCol = document.createElement("div");
    switchCol.className = "col-1";
    switchCol.style.display = "flex";
    switchCol.style.justifyContent = "center";
    let switchDiv = document.createElement("div");
    switchDiv.className = "form-check form-switch";
    switchCol.appendChild(switchDiv);

    let input = document.createElement("input");
    input.className = "form-check-input";
    input.type = "checkbox";
    input.id = key;
    switchDiv.appendChild(input);

    // checkbox column
    let checkboxCol = document.createElement("div");
    checkboxCol.className = "col-1";
    checkboxCol.style.display = "flex";
    checkboxCol.style.justifyContent = "center";
    let checkboxDiv = document.createElement("div");
    checkboxDiv.className = "form-check";
    checkboxCol.appendChild(checkboxDiv);

    let checkbox = document.createElement("input");
    checkbox.className = "form-check-input";
    checkbox.type = "checkbox";
    checkbox.id = key + "Include";
    checkboxDiv.appendChild(checkbox);

    if (storedData[key] !== undefined) {
      input.checked = storedData[key];
      checkbox.checked = storedData[key + "Include"];
    } else {
      checkbox.checked = true;
    }

    styleCheckbox(input);

    input.addEventListener("change", function () {
      chrome.storage.sync.set({ [key]: input.checked });
      styleCheckbox(input);
    });
    checkbox.addEventListener("change", function () {
      chrome.storage.sync.set({ [key + "Include"]: checkbox.checked });
    });

    row.appendChild(labelCol);
    row.appendChild(switchCol);
    row.appendChild(checkboxCol);
    container.appendChild(row);
  }

  function displayCourseDataOptions(courseData) {
    if (Object.keys(courseData).length > 30) {
      alert(
        "Course data has more than 30 keys where there should be courses. Likely incorrect format."
      );
      return;
    }

    let optionsContainer = document.getElementById("courseOptionsContainer");
    optionsContainer.innerHTML = "";

    let titleRow = document.createElement("div");
    titleRow.className = "row align-items-center mb-3";

    let titleCol = document.createElement("div");
    titleCol.className = "col-4 text-start";

    let titleLabel = document.createElement("label");
    titleLabel.textContent =
      "Identify which side each course is meant for and set whether to enable it for move highlighting:";
    titleCol.appendChild(titleLabel);

    let switchCol = document.createElement("div");
    switchCol.className = "col-1";
    switchCol.style.display = "flex";
    switchCol.style.justifyContent = "center";
    let switchLabel = document.createElement("label");
    switchLabel.textContent = "Color";
    switchCol.appendChild(switchLabel);

    let checkboxCol = document.createElement("div");
    checkboxCol.className = "col-1";
    checkboxCol.style.display = "flex";
    checkboxCol.style.justifyContent = "center";
    let checkboxLabel = document.createElement("label");
    checkboxLabel.textContent = "Include";
    checkboxCol.appendChild(checkboxLabel);

    titleRow.appendChild(titleCol);
    titleRow.appendChild(switchCol);
    titleRow.appendChild(checkboxCol);
    optionsContainer.appendChild(titleRow);

    chrome.storage.sync.get(null, (storedData) => {
      for (let key in courseData) {
        if (courseData.hasOwnProperty(key)) {
          createCourseDataOptionsRow(key, optionsContainer, storedData);
        }
      }
    });
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
      [
        "removeNotifs",
        "filterToggle",
        "categoriesToggle",
        "sideAgnostic",
        "highlightMoves",
        "removeWiki",
      ],
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
        // let obj = {};
        // obj[event.target.id] = event.target.checked;
        chrome.storage.sync.set(
          { [event.target.id]: event.target.checked },
          function () {
            console.log(
              `Option ${event.target.id} set to ${event.target.checked} and saved to chrome storage`
            );
          }
        );
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
