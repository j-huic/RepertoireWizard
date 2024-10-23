const cogwheel = document.getElementById("settingsButton");
cogwheel.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

const testButton = document.getElementById("testButton");
const saveButton = document.getElementById("saveButton");

const slider = document.getElementById("rangeSlider");
const sliderLabel = document.getElementById("sliderLabel");
sliderLabel.textContent = "11";
const labelString = "Number of chapters to scrape at a time: ";
const progressText = document.getElementById("progressText");
const moveProgress = document.getElementById("moveProgress");
const titleHeader = document.getElementById("titleHeader");
const scrapeControls = document.getElementById("scrapeControls");

browser.runtime.sendMessage({ method: "getCoursePageInfo" }).then((info) => {
  consolePrint(info);
  populateProgressInfo(info);
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

testButton.addEventListener("click", async () => {
  browser.runtime.sendMessage({ method: "startScrape", value: slider.value });
});
saveButton.addEventListener("click", () => {
  browser.runtime.sendMessage({ method: "saveCourseData" });
});

browser.runtime.onMessage.addListener((request) => {
  if (request.method === "updateInfo") {
    populateProgressInfo(request.metaData);
  }
});

function populateProgressInfo(metaData) {
  if (metaData) {
    scrapeControls.style.display = "block";
    titleHeader.textContent = "";
    titleHeader.appendChild(document.createTextNode("Course Title:"));
    titleHeader.appendChild(document.createElement("br"));
    titleHeader.appendChild(document.createTextNode(metaData.title));
    progressText.textContent =
      "Chapters Scraped: " +
      metaData.scrapedChapters.length +
      "/" +
      metaData.chapters.length;
    moveProgress.textContent = "Lines Scraped: " + metaData.lineCount;

    if (metaData.inMemory) {
      console.log("in memory");
      const checkmark = document.createElement("i");
      checkmark.className = "bi bi-check-circle-fill text-success";
      const messageText = document.createTextNode(
        " Course is in local storage"
      );

      titleHeader.appendChild(document.createElement("br"));
      titleHeader.appendChild(checkmark);
      titleHeader.appendChild(messageText);
    }
  } else {
    titleHeader.textContent =
      "Navigate to a Chessable course page to display info";
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
