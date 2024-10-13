browser.runtime.sendMessage({ method: "getSelectorTree" }).then((response) => {
  for (let key in response) {
    const selector = document.createElement("div");
    selector.addEventListener("click", setPosition(response[key]));
  }
});

function createPositionCard(title, fen) {
  const card = document.createElement("div");
  card.textContent(title);
  card.setAttribute("fen", fen);
  card.addEventListener("click", setBoardPosition(card.fen));

  const renameDiv = document.createElement("div");
  renameDiv.className = "col-1";
  const renameButton = document.createElement("button");
  renameButton.addEventListener("click", () => {
    let input;
    deleteButton.textContent = input;
  });
  renameDiv.appendChild(renameButton);

  const deleteDiv = document.createElement("div");
  deleteDiv.className = "col-1";
  const deleteButton = document.createElement("button");
  deleteButton.addEventListener("click", () => {
    card.remove();
  });
  deleteDiv.appendChild(deleteButton);
}

function setBoardPosition(fen) {}

function parseSelectorTree(selectorTree, parent = true) {
  let isNested = typeof selectorTree[Object.keys(selectorTree)[0]] === "object";

  if (!isNested) {
    const list = document.createElement("ul");
    list.style.paddingLeft = "20px";
    for (let key in selectorTree) {
      listItem = document.createElement("li");
      listItem.textContent = key;
      listItem.style.color = "#ADD8E6";
      listItem.style.textDecoration = "underline";
      listItem.style.cursor = "pointer";
      listItem.addEventListener("click", () => {
        const url = "https://lichess.org/analysis/" + selectorTree[key];
        window.location.replace(url);
      });
      list.appendChild(listItem);
    }
    return list;
  } else {
    let div = document.createElement("div");
    if (parent === false) {
      div.style.paddingLeft = "20px";
    }
    for (let key in selectorTree) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = key;
      details.appendChild(summary);
      details.appendChild(parseSelectorTree(selectorTree[key], false));
      div.appendChild(details);
    }
    return div;
  }
}
obj = {
  e4: {
    sicilian: {
      kalash: "r1bqkbnr/pp3ppp/2np4/1N2p3/4P3/8/PPP2PPP/RNBQKB1R w KQkq - 0 6",
      najdorf:
        "rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    },
  },
  e5: {
    berlin:
      "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    petrov: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
  },
};

abc = parseSelectorTree(obj);
side = document.querySelector("aside");
side.appendChild(abc);
