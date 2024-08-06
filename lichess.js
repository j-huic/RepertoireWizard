var repData = {};
chrome.runtime.sendMessage({ method: "getData", key: "kalash" }, (response) => {
  repData = response;
  console.log(typeof repData);
  console.log(
    "example",
    repData["rnbqkbnr/pp1ppppp/8/2p5/4P3/1P6/P1PP1PPP/RNBQKBNR b KQkq - 0 2"]
  );
  console.log(Object.keys(repData).slice(-3));
});

let observerStatic = new MutationObserver(function (mutations) {
  if (document.getElementsByClassName("analyse__wiki empty")[0]) {
    static();
    observerStatic.disconnect();
  }
});

let observerDynamic = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "attributes") {
      let fen = mutation.target.attributes[0].value;
      dynamic(fen);
    }
  });
});

setTimeout(function () {
  targetNode = document.querySelector("tbody");
  observerDynamic.observe(targetNode, { attributes: true });
}, 500);

observerStatic.observe(document, { childList: true, subtree: true });

function static() {
  empty = document.getElementsByClassName("analyse__wiki empty")[0];
  empty.remove();
}

function dynamic(fen) {
  let sidebar = document.getElementsByClassName("analyse__side")[0];
  // let fen = document.querySelector("tbody").attributes[0].value;

  let fenText = document.createElement("p");
  console.log(fen);
  console.log(Object.keys(repData).slice(-3));
  if (repData[fen]) {
    fenText.innerText = repData[fen].join(", ");
  }

  if (sidebar.childNodes.length > 1) {
    sidebar.removeChild(sidebar.childNodes[1]);
  }
  sidebar.appendChild(fenText);
}
