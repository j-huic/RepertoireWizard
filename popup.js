cogwheel = document.getElementById("settingsButton");
cogwheel.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
