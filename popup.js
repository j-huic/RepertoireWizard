document.addEventListener("DOMContentLoaded", () => {
  console.log("blabla");
  const fetchButton = document.getElementById("fetchButton");
  const fenInput = document.getElementById("fenInput");

  fetchButton.addEventListener("click", function () {
    console.log("fetch button clicked");
    chrome.runtime.sendMessage(
      { method: "fetch", fen: fenInput.value },
      function (response) {
        console.log("popup listening for response");
        console.log(response);
      }
    );
  });
});

console.log("blabl2");
