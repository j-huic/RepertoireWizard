let theme;
const htmlElement = document.documentElement;

const settingsIcon = document.getElementById("settingsIcon");
const infoIcon = document.getElementById("infoIcon");
const logIcon = document.getElementById("logsIcon");

settingsIcon.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});
infoIcon.addEventListener("click", () => {
  browser.tabs.create({
    url: browser.runtime.getURL("options.html?tab=info-tab"),
  });
});

logIcon.addEventListener("click", () => {
  browser.tabs.create({
    url: browser.runtime.getURL("options.html?tab=logs-tab"),
  });
});

const lightSwitch = document.getElementById("lightSwitch");
const lightSlider = document.getElementById("lightSlider");
const body = document.getElementById("body");

browser.storage.sync.get("theme").then((storage) => {
  if (storage.theme) {
    theme = "light";
    lightSlider.style.transition = "none";
    lightSwitch.checked = storage.theme;
    lightSlider.offsetHeight;
    lightSlider.style.transition = "";
    htmlElement.setAttribute("data-bs-theme", theme);
  } else {
    theme = "dark";
  }
});

const startButton = document.getElementById("startButton");
const saveButton = document.getElementById("saveButton");
const abortButton = document.getElementById("abortButton");

const slider = document.getElementById("rangeSlider");
const sliderLabel = document.getElementById("sliderLabel");
sliderLabel.textContent = "11";
const labelString = "Number of chapters to scrape at a time: ";

const skipPaused = document.getElementById("skipPausedLines");
browser.storage.sync.get("skipPaused").then((storage) => {
  if (storage.skipPaused) {
    skipPaused.checked = storage.skipPaused;
  }
});
skipPaused.addEventListener("change", () => {
  browser.storage.sync.set({ skipPaused: skipPaused.checked });
});

const titleHeader = document.getElementById("titleHeader");
const titleContainer = document.getElementById("courseTitle");
const courseInStorage = document.getElementById("courseInStorage");

const scrapeControls = document.getElementById("scrapeControls");
const progressText = document.getElementById("progressText");
const moveProgress = document.getElementById("moveProgress");
const statusUpdate = document.getElementById("statusUpdate");
let intervalID;

browser.runtime.sendMessage({ method: "getCoursePageInfo" }).then((info) => {
  try {
    populateProgressInfo(info);
  } catch {}
});

lightSwitch.addEventListener("change", () => {
  theme = lightSwitch.checked ? "light" : "dark";
  htmlElement.setAttribute("data-bs-theme", theme);
  browser.runtime.sendMessage({ method: "theme", theme: theme });
  browser.storage.sync.set({ theme: lightSwitch.checked });
});

browser.storage.sync.get("sliderValue").then((storage) => {
  if (storage.sliderValue) {
    slider.value = storage.sliderValue;
  } else {
    slider.value = "11";
  }
  sliderLabel.textContent = slider.value === "11" ? "Max" : storage.sliderValue;
});

slider.addEventListener("input", () => {
  let sliderValue = slider.value;
  sliderLabel.textContent = sliderValue === "11" ? "Max" : sliderValue;
  browser.storage.sync.set({ sliderValue });
});

startButton.addEventListener("click", async () => {
  browser.runtime.sendMessage({ method: "startScrape", value: slider.value });
});
saveButton.addEventListener("click", () => {
  browser.runtime.sendMessage({ method: "saveCourseData" });
});
abortButton.addEventListener("click", () => {
  browser.runtime.sendMessage({ method: "abort" });
});

browser.runtime.onMessage.addListener((request) => {
  if (request.method === "updateInfo") {
    populateProgressInfo(request.metaData);
  } else if (request.method === "updateStatus") {
    if (request.info === "ongoing") {
      dotsMessage(statusUpdate, "Scrape is Ongoing");
    } else if (request.info === "aborted") {
      clearInterval(intervalID);
      statusUpdate.textContent = "Scraping Aborted";
    } else if (request.info === "complete") {
      clearInterval(intervalID);
      statusUpdate.textContent = "Scraping Complete";
    } else if (request.info === "partial") {
      clearInterval(intervalID);
      statusUpdate.textContent = "Partial Scraping Complete";
    }
  }
});

function dotsMessage(element, message) {
  let dots = ".";

  element.textContent = message + dots;
  intervalID = setInterval(() => {
    dots = cycleDots(dots);
    element.textContent = message + dots;
  }, 500);
}

function cycleDots(dots) {
  return ".".repeat((dots.length % 3) + 1);
}

function populateProgressInfo(metaData) {
  if (metaData) {
    scrapeControls.style.display = "block";
    titleHeader.textContent = "";
    titleHeader.appendChild(document.createTextNode("Course Title:"));
    titleContainer.textContent = metaData.title;
    progressText.textContent =
      "Chapters Scraped: " +
      metaData.scrapedChapters.length +
      "/" +
      metaData.chapters.length;
    moveProgress.textContent = "Lines Scraped: " + metaData.lineCount;

    if (metaData.inMemory === true) {
      courseInStorage.style.display = "block";
    } else {
      courseInStorage.style.display = "none";
    }
  } else {
    titleHeader.textContent =
      "Navigate to a Chessable course page to display info and controls";
    scrapeControls.style.display = "none";
  }
}

function consolePrint(message, origin = "") {
  browser.runtime.sendMessage({
    method: "print",
    message: message,
    origin: origin,
  });
}
