const cogwheel = document.getElementById("settingsButton");
cogwheel.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

const testButton = document.getElementById("testButton");
const saveButton = document.getElementById("saveButton");

testButton.addEventListener("click", async () => {
  consolePrint("test button clicked");

  browser.runtime.sendMessage({ method: "test" });
  // input = "https://www.chessable.com/course/91808/48/";
});

saveButton.addEventListener("click", () => {
  browser.runtime.sendMessage({ method: "saveCourseData" });
});

function consolePrint(message, origin = "") {
  browser.runtime.sendMessage({
    method: "print",
    message: message,
    origin: origin,
  });
}
