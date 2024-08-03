static = function () {
  empty = document.getElementsByClassName("analyse__wiki empty")[0];
  empty.remove();
};

dynamic = function (fen) {
  let sidebar = document.getElementsByClassName("analyse__side")[0];
  //let fen = document.querySelector('tbody').attributes[0].value;
  console.log(fen);
  fenfetch(fen);

  let fenText = document.createElement("p");
  fenText.textContent = fen;

  if (sidebar.childNodes.length > 1) {
    sidebar.removeChild(sidebar.childNodes[1]);
  }
  sidebar.appendChild(fenText);
};

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
