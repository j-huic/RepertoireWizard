const cogwheel = document.getElementById("settingsButton");
cogwheel.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

const testButton = document.getElementById("testButton");
const saveButton = document.getElementById("saveButton");

const slider = document.getElementById("rangeSlider");
const sliderLabel = document.getElementById("sliderLabel");
const labelString = "Number of chapters to scrape at a time: ";
const progressText = document.getElementById("progressText");
const titleHeader = document.getElementById("titleHeader");

browser.runtime.sendMessage({ method: "getCoursePageInfo" }).then((info) => {
  if (info.coursePage) {
    let coursePage = info.coursePage;
    titleHeader.textContent = "";
    titleHeader.appendChild(document.createTextNode("Current Chapter:"));
    titleHeader.appendChild(document.createElement("br"));
    titleHeader.appendChild(document.createTextNode(coursePage.title));
    progressText.textContent =
      "Chapters Scraped: " +
      info.scrapedChapters.length +
      "/" +
      coursePage.chapters.length;
  }
});

browser.storage.sync.get("sliderValue").then((storage) => {
  if (storage.sliderValue) {
    slider.value = storage.sliderValue;
  } else {
    slider.value = 11;
  }
  sliderLabel.textContent =
    storage.sliderValue === "11" ? "Max" : storage.sliderValue;
});

slider.addEventListener("input", () => {
  let sliderValue = slider.value;
  sliderLabel.textContent = sliderValue === "11" ? "Max" : sliderValue;
  browser.storage.sync.set({ sliderValue });
});

testButton.addEventListener("click", async () => {
  consolePrint("test button clicked");

  browser.runtime.sendMessage({ method: "test", value: slider.value });
  // input = "https://www.chessable.com/course/91808/48/";
});

saveButton.addEventListener("click", () => {
  browser.runtime.sendMessage({ method: "saveCourseData" });
});

browser.runtime.onMessage.addListener((request) => {
  if (request.method === "updateProgress") {
    updateProgress(request.message);
  }
});

function updateProgress(message) {
  progressText.textContent = message;
}

function consolePrint(message, origin = "") {
  browser.runtime.sendMessage({
    method: "print",
    message: message,
    origin: origin,
  });
}
