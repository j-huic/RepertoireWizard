document.addEventListener("DOMContentLoaded", function () {
  const inputVars = ["blacklist", "categories", "rename", "positions", "data"];

  initializeCheckboxes();
  addCheckboxListeners();

  // populates inputs if values exist in storage
  browser.storage.sync.get(inputVars).then((storage) => {
    for (let item in storage) {
      let inputField = document.getElementById(item + "Input");
      if (inputField && storage[item] !== undefined) {
        if (Array.isArray(storage[item])) {
          inputField.value = storage[item].join(", ");
          resizeInput(inputField, storage[item], false);
        } else if (typeof storage[item] === "object") {
          inputField.value = JSON.stringify(storage[item], null, 2);
          resizeInput(inputField, storage[item]);
        }
      }
    }
  });

  // adds necessary functions for each input variable
  inputVars.forEach((item) => {
    console.log(item);
    // implements input and submit buttons
    const inputField = document.getElementById(item + "Input");
    const submitButton = document.getElementById(item + "Submit");
    submitButton.addEventListener("click", () => parseInput(inputField, item));
    inputField.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        if (event.shiftKey) {
          return;
        } else {
          event.preventDefault();
          parseInput(inputField, item);
        }
      }
    });

    // implements clear buttons
    const clearButton = document.getElementById(item + "Clear");
    clearButton.addEventListener("click", () => {
      inputField.value = "";
      inputField.style.height = "auto";
      browser.storage.sync.remove(item);
    });

    // implements info icons/text
    const icon = document.getElementById(item + "InfoIcon");
    const text = document.getElementById(item + "InfoText");
    icon.addEventListener("click", () => {
      alert(text.textContent);
    });
  });

  // populates the course data options if they exist and notifies existance of course data fiel
  browser.storage.local
    .get(["courseData", "courseDataFilename", "courseDataTimestamp"])
    .then(function (storage) {
      if (storage.courseData) {
        displayCourseDataOptions(Object.keys(storage.courseData).sort());
        const fileStatusMessage = document.getElementById("fileStatusMessage");
        fileStatusMessage.textContent =
          "Course data file already exists: " +
          storage.courseDataFilename +
          " (uploaded on   " +
          storage.courseDataTimestamp +
          ")";
      }
    });
});
// functions

function submitBlacklist() {
  const blacklistInput = document.getElementById("blacklistInput");
  blacklistInput.style.height = "auto";
  blacklistInput.style.height = blacklistInput.scrollHeight + 5 + "px";
  var value = blacklistInput.value;
  var blacklist;

  if (blacklistInput.value === "") {
    browser.storage.sync.remove("blacklist");
  } else {
    blacklist = value.split(",").map((item) => {
      return item.trim();
    });
    blacklist = [...new Set(blacklist)];
    browser.storage.sync.set({ blacklist: blacklist });
    blacklistInput.value = blacklist.join(", ");
    resizeInput(blacklistInput, blacklist, false);
  }
}

function submitJson(varName) {
  const inputField = document.getElementById(varName + "Input");
  inputField.style.height = "auto";
  inputField.style.height = inputField.scrollHeight + 5 + "px";
  let value = inputField.value;
  let input;

  if (value === "") {
    input = {};
  } else {
    try {
      input = JSON.parse(value);
    } catch (error) {
      alert("Error parsin JSON: " + error);
      return;
    }
  }

  if (typeof input != "object") {
    return;
  } else if (Object.keys(input).length > 0) {
    browser.storage.sync.set({ [varName]: input });
    resizeInput(inputField, input);
  } else {
    browser.storage.sync.remove(varName);
  }
}

function initializeCheckboxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  browser.storage.sync
    .get([
      "removeNotifs",
      "filterToggle",
      "categoriesToggle",
      "sideAgnostic",
      "highlightMoves",
      "removeWiki",
      "enablePositionSelector",
    ])
    .then(function (options) {
      checkboxes.forEach(function (checkbox) {
        checkbox.checked = options[checkbox.id];
      });
    });
}

function addCheckboxListeners() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (event) {
      browser.storage.sync.set({ [event.target.id]: event.target.checked });
    });
  });
}

function resizeInput(input, obj, stringify = true) {
  if (stringify) {
    input.value = JSON.stringify(obj, null, 2);
  }
  input.style.whiteSpace = "pre";
  input.style.width = "max";
  input.style.height = "auto";
  input.style.width = input.scrollWidth + 25 + "px";
  input.style.height = input.scrollHeight + 5 + "px";
}

function parseInput(input, varName) {
  if (varName === "blacklist") {
    submitBlacklist(input);
  } else if (varName === "data") {
    uploadFile();
  } else if (["categories", "rename", "positions"].includes(varName)) {
    submitJson(varName);
  }
}

function uploadFile() {
  const dataInput = document.getElementById("dataInput");
  const file = dataInput.files[0];
  if (file && file.type === "application/json") {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const keys = Object.keys(jsonData);
        const fileName = file.name;
        const timestamp = new Date().toLocaleString();

        browser.storage.local
          .set({
            courseData: jsonData,
            courseDataFilename: fileName,
            courseDataTimestamp: timestamp,
          })
          .then(() => {
            alert("File uploaded successfully");
            browser.storage.sync
              .set({
                courseDataInfo: initializeInfoFromCourseData(keys),
              })
              .then(() => {
                displayCourseDataOptions(keys.sort());
              });
          });
      } catch (error) {
        alert("Error parsing file: " + error);
      }
    };
    reader.readAsText(file);
  } else {
    alert("Please upload a valid JSON file");
  }
}

function initializeInfoFromCourseData(courseDataKeys) {
  let courseDataInfo = {};
  for (let key of courseDataKeys) {
    courseDataInfo[key] = false;
    courseDataInfo[key + "Include"] = true;
  }

  return courseDataInfo;
}

function styleCheckbox(input) {
  input.style.backgroundColor = input.checked ? "black" : "white";
  input.style.borderColor = input.checked ? "black" : "white";
  input.style.setProperty(
    "--bs-form-switch-bg",
    input.checked ? "blue" : "white"
  );
}

function createCourseDataOptionsRow(key, container, courseDataInfo) {
  let row = document.createElement("div");
  row.className = "row align-items-center mb-2";

  // label column
  let labelCol = document.createElement("div");
  labelCol.className = "col-6 text-start";
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

  if (courseDataInfo !== undefined) {
    input.checked = courseDataInfo[key];
    checkbox.checked = courseDataInfo[key + "Include"];
  }
  styleCheckbox(input);

  input.addEventListener("change", () => {
    styleCheckbox(input);
    browser.storage.sync.get(["courseDataInfo"]).then((storage) => {
      let courseDataInfo = storage.courseDataInfo || {};
      courseDataInfo[key] = input.checked;
      browser.storage.sync.set({ courseDataInfo: courseDataInfo });
    });
  });

  checkbox.addEventListener("change", () => {
    browser.storage.sync.get(["courseDataInfo"]).then((storage) => {
      let courseDataInfo = storage.courseDataInfo || {};
      courseDataInfo[key + "Include"] = checkbox.checked;
      browser.storage.sync.set({ courseDataInfo: courseDataInfo });
    });
  });

  row.appendChild(labelCol);
  row.appendChild(switchCol);
  row.appendChild(checkboxCol);
  container.appendChild(row);
}

function displayCourseDataOptions(courseDataKeys) {
  if (courseDataKeys.length > 30) {
    alert(
      "Course data has more than 30 keys where there should be courses. Likely incorrect format."
    );
    return;
  }

  let optionsContainer = document.getElementById("courseOptionsContainer");
  titleText =
    "Identify which side each course is meant for and set whether to enable it for move highlighting:";
  switchLabelText = "Color";
  checkboxLabelText = "Include";
  createOptionsTitleRow(
    optionsContainer,
    titleText,
    switchLabelText,
    checkboxLabelText
  );

  browser.storage.sync.get(["courseDataInfo"]).then((storage) => {
    for (let key of courseDataKeys) {
      createCourseDataOptionsRow(key, optionsContainer, storage.courseDataInfo);
    }
  });
}

function createOptionsTitleRow(
  container,
  titleText,
  switchLabelText,
  checkboxLabelText
) {
  container.innerHTML = "";

  const titleRow = document.createElement("div");
  titleRow.className = "row align-items-center mb-3";

  // title column
  const titleCol = document.createElement("div");
  titleCol.className = "col-6 text-start";
  titleCol.id = "titleCol";
  const titleLabel = document.createElement("span");
  titleLabel.textContent = titleText;
  titleCol.appendChild(titleLabel);

  // switch column
  const switchCol = document.createElement("div");
  switchCol.className = "col-1";
  switchCol.id = "switchCol";
  switchCol.style.display = "flex";
  switchCol.style.justifyContent = "center";
  const switchLabel = document.createElement("span");
  switchLabel.textContent = switchLabelText;
  switchCol.appendChild(switchLabel);

  // checkbox column
  const checkboxCol = document.createElement("div");
  checkboxCol.className = "col-1";
  checkboxCol.id = "checkboxCol";
  checkboxCol.style.display = "flex";
  checkboxCol.style.justifyContent = "center";
  const checkboxLabel = document.createElement("span");
  checkboxLabel.textContent = checkboxLabelText;
  checkboxCol.appendChild(checkboxLabel);

  titleRow.appendChild(titleCol);
  titleRow.appendChild(switchCol);
  titleRow.appendChild(checkboxCol);
  container.appendChild(titleRow);
}
