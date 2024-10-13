browser.runtime.sendMessage({ method: "getOptions" }).then((response) => {
  removeNotifs = response.removeNotifs;

  if (removeNotifs) {
    var notificationsNumber = document.getElementById("notificationsNumber");
    if (notificationsNumber) {
      notificationsNumber.parentNode.removeChild(notificationsNumber);
    }
  }
});

console.log("global script running");
