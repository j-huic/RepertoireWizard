chrome.runtime.sendMessage({method: "getOptions"}, function(response) {
    console.log("sending storage request");

    removeNotifs = response.removeNotifs;

    if (removeNotifs){
        var notificationsNumber = document.getElementById("notificationsNumber");
    if (notificationsNumber) {
        notificationsNumber.parentNode.removeChild(notificationsNumber);
    }}
  });