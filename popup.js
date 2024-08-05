document.addEventListener("DOMContentLoaded", () => {
  console.log("blabla");
  const fetchButton = document.getElementById("fetchButton");
  const fenInput = document.getElementById("fenInput");

  fetchButton.addEventListener("click", function () {
    console.log("fetch button clicked");
    const fenvalue =
      fenInput.value === ""
        ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        : fenInput.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log(tabs[0]);
      chrome.tabs.sendMessage(tabs[0].id, {
        method: "fetch",
        fen: fenvalue,
      });
    });
    // chrome.runtime.sendMessage(
    //   { method: "fetch", fen: fenInput.value },
    //   function (response) {
    //     console.log("popup listening for response");
    //     console.log(response);
    //   }
    // );
  });
});

console.log("blabl2");
