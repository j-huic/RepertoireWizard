let theme;
const inputVars = ["blacklist", "categories", "rename", "positions", "data"];

document.addEventListener("DOMContentLoaded", async () => {
  let htmlElement = document.documentElement;
  initialiseTheme();

  browser.runtime.onMessage.addListener((request) => {
    if (request.method === "theme") {
      htmlElement.setAttribute("data-bs-theme", request.theme);
    }
  });

  initializeCheckboxes();
  addCheckboxListeners();
  initializeInputs();
  addInputListeners();
  initializeCourseData();

  const params = new URLSearchParams(window.location.search);
  const tabId = params.get("tab");
  if (tabId) {
    document.querySelector(`#${tabId}`).click();
  }

  document.querySelector("#options-tab").addEventListener("click", () => {
    ["categories", "rename", "positions"].forEach((item) => {
      let input = document.getElementById(item + "Input");
      resizeInput(input);
    });
  });

  document.getElementById("clearLogs").addEventListener("click", clearLogs);
  await loadLogs();
});

function initializeCourseData() {
  browser.storage.local
    .get(["courseData", "courseDataFilename", "courseDataTimestamp"])
    .then(function (storage) {
      if (storage.courseData) {
        displayCourseDataOptions(Object.keys(storage.courseData).sort());
      }
    });
}

async function loadLogs() {
  const logContainer = document.querySelector(".log-container");
  const { logs = [] } = await browser.storage.local.get("logs");

  while (logContainer.firstChild) {
    logContainer.removeChild(logContainer.firstChild);
  }

  logs.forEach((log) => {
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";

    const timestamp = document.createElement("span");
    timestamp.className = "log-timestamp";
    timestamp.textContent = new Date(log.timestamp).toLocaleString();
    logEntry.appendChild(timestamp);

    const message = document.createElement("span");
    message.className = "log-message";

    // Add status indicator if specified
    if (log.status) {
      const status = document.createElement("span");
      status.className = `status-indicator status-${log.status}`;

      switch (log.status) {
        case "good":
          status.textContent = "+ ";
          break;
        case "bad":
          status.textContent = "x ";
          break;
      }

      message.appendChild(status);
    }

    if (log.url && log.linkText) {
      const parts = log.message.split("{link}");

      parts.forEach((part, index) => {
        if (part) {
          message.appendChild(document.createTextNode(part));
        }
        if (index < parts.length - 1) {
          const link = document.createElement("a");
          link.href = log.url;
          link.textContent = log.linkText;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          message.appendChild(link);
        }
      });
    } else {
      message.appendChild(document.createTextNode(log.message));
    }

    logEntry.appendChild(message);
    logContainer.appendChild(logEntry);
  });

  logContainer.scrollTop = logContainer.scrollHeight;
}

async function clearLogs() {
  if (confirm("Are you sure you want to clear all logs?")) {
    await browser.storage.local.set({ logs: [] });
    await loadLogs();
  }
}

function initialiseTheme() {
  browser.storage.sync.get("theme").then((storage) => {
    if (storage.theme) {
      theme = "light";
      htmlElement.setAttribute("data-bs-theme", theme);
    } else {
      theme = "dark";
    }
  });
}

function addInputListeners() {
  inputVars.forEach((item) => {
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
      if (item === "data") {
        const confirmation = confirm(
          "Are you sure you want to delete all course data?"
        );
        if (confirmation) {
          browser.storage.local.remove("courseData");
          browser.storage.sync.remove("courseDataInfo");
          let container = document.getElementById("courseOptionsContainer");
          emptyContainer(container);
        }
      } else {
        inputField.value = "";
        inputField.style.height = "auto";
        browser.storage.sync.remove(item);
      }
    });

    // implements info icons/text
    const icon = document.getElementById(item + "InfoIcon");
    const text = document.getElementById(item + "InfoText");
    icon.addEventListener("click", () => {
      alert(text.textContent);
    });
  });
}

function initializeInputs() {
  browser.storage.sync.get(inputVars).then((storage) => {
    for (let item in storage) {
      let inputField = document.getElementById(item + "Input");
      if (inputField && storage[item] !== undefined) {
        if (Array.isArray(storage[item])) {
          inputField.value = storage[item].join(", ");
        } else if (typeof storage[item] === "object") {
          inputField.value = JSON.stringify(storage[item], null, 2);
          resizeInput(inputField, storage[item]);
        }
      }
    }
  });
}

function emptyContainer(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

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

function resizeInput(input) {
  input.style.whiteSpace = "pre";
  input.style.width = "max";
  input.style.height = "auto";
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
  input.style.borderColor = input.checked ? "black" : "black";
  input.style.setProperty(
    "--bs-form-switch-bg",
    input.checked ? "blue" : "white"
  );
}

function createCourseDataOptionsRow(key, container, courseDataInfo) {
  let row = document.createElement("div");
  row.className = "row align-items-center mb-2";

  let labelCol = createLabelColumn(key);
  let switchCol = createSwitchColumn(key, courseDataInfo, 2);
  let checkboxCol = createCheckboxColumn(key, courseDataInfo, 2);
  let removeCol = createRemoveColumn(key, 2);

  row.appendChild(labelCol);
  row.appendChild(switchCol);
  row.appendChild(checkboxCol);
  row.appendChild(removeCol);
  container.appendChild(row);
}

function createLabelColumn(key) {
  let labelCol = document.createElement("div");
  labelCol.className = "col-6 text-start";
  let label = document.createElement("label");
  label.textContent = key;
  label.className = "form-check-label me-2";
  label.htmlFor = key;
  labelCol.appendChild(label);
  return labelCol;
}

function createSwitchColumn(key, courseDataInfo, width) {
  let switchCol = document.createElement("div");
  switchCol.className = `col-${width}`;
  switchCol.style.display = "flex";
  switchCol.style.justifyContent = "center";
  switchCol.style.alignItems = "center";

  let switchDiv = document.createElement("div");
  switchDiv.className = "form-check form-switch";
  switchDiv.style.display = "flex";
  switchDiv.style.justifyContent = "center";
  switchCol.appendChild(switchDiv);

  let input = document.createElement("input");
  input.className = "form-check-input";
  input.type = "checkbox";
  input.id = key;
  input.style.verticalAlign = "middle";
  switchDiv.appendChild(input);

  if (courseDataInfo) {
    input.checked = courseDataInfo[key];
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

  return switchCol;
}

function createCheckboxColumn(key, courseDataInfo, width) {
  let checkboxCol = document.createElement("div");
  checkboxCol.className = `col-${width}`;
  checkboxCol.style.display = "flex";
  checkboxCol.style.justifyContent = "center";
  checkboxCol.style.alignItems = "center";

  let checkbox = document.createElement("input");
  checkbox.className = "form-check-input";
  checkbox.type = "checkbox";
  checkbox.id = key + "Include";
  checkbox.style.margin = "0";
  checkbox.style.verticalAlign = "middle";
  if (theme === "light") {
    checkbox.style.borderColor = "black";
  } else if (theme === "dark") {
    checkbox.style.borderColor = "white";
  }
  checkboxCol.appendChild(checkbox);

  if (courseDataInfo) {
    checkbox.checked = courseDataInfo[key + "Include"];
  }

  checkbox.addEventListener("change", () => {
    browser.storage.sync.get(["courseDataInfo"]).then((storage) => {
      let courseDataInfo = storage.courseDataInfo || {};
      courseDataInfo[key + "Include"] = checkbox.checked;
      browser.storage.sync.set({ courseDataInfo: courseDataInfo });
    });
  });

  return checkboxCol;
}

function createRemoveColumn(key, width) {
  let removeCol = document.createElement("div");
  removeCol.className = `col-${width}`;
  removeCol.style.display = "flex";
  removeCol.style.justifyContent = "center";
  removeCol.style.alignItems = "center";

  let removeIcon = document.createElement("i");
  removeIcon.className = "bi bi-trash";
  removeIcon.id = key + "Remove";
  removeIcon.style.cursor = "pointer";
  removeIcon.style.margin = "0";
  removeIcon.style.verticalAlign = "middle";
  removeCol.appendChild(removeIcon);

  removeIcon.addEventListener("click", async () => {
    const confirmation = confirm(
      `Are you sure you want to delete the course data for: ${key}`
    );
    if (confirmation) {
      try {
        let { courseData = {} } = await browser.storage.local.get("courseData");
        if (courseData) {
          delete courseData[key];
          await browser.storage.local.set({ courseData });
        }

        let { courseDataInfo = {} } = await browser.storage.sync.get(
          "courseDataInfo"
        );
        if (courseDataInfo) {
          delete courseDataInfo[key];
          delete courseDataInfo[key + "Include"];
          await browser.storage.sync.set({ courseDataInfo });
        }
        browser.runtime.sendMessage({ method: "courseRemoved", key: key });
        displayCourseDataOptions(Object.keys(courseData).sort());
      } catch (error) {
        console.log("error removing course", error);
      }
    }
  });

  return removeCol;
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
  removeLabelText = "Remove";

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

  // title, switch, checkbox, remove cols
  const titleCol = createOptionsTitleColumn(6, titleText, "left");
  const switchCol = createOptionsTitleColumn(2, switchLabelText, "center");
  const checkboxCol = createOptionsTitleColumn(2, checkboxLabelText, "center");
  const removeCol = createOptionsTitleColumn(2, "Remove", "center");

  titleRow.appendChild(titleCol);
  titleRow.appendChild(switchCol);
  titleRow.appendChild(checkboxCol);
  titleRow.appendChild(removeCol);
  container.appendChild(titleRow);
}

function createOptionsTitleColumn(width, labelText, justifyContent) {
  const col = document.createElement("div");
  col.className = `col-${width} text-start`;
  col.style.display = "flex";
  col.style.justifyContent = justifyContent;
  const label = document.createElement("span");
  label.textContent = labelText;
  col.appendChild(label);

  return col;
}
