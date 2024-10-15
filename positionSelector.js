let treeExpansionState = {};
let positions = {};

let wiki = document.getElementsByClassName("analyse__wiki empty")[0];
if (wiki) {
  wiki.remove();
}

browser.storage.sync
  .get(["positions", "treeExpansionState"])
  .then((storage) => {
    if (storage.treeExpansionState) {
      treeExpansionState = storage.treeExpansionState;
    }
    if (storage.positions) {
      positions = storage.positions;
      refreshTree();
    }
  });

function setBoardPosition(fen) {
  const url = "https://lichess.org/analysis/" + fen;
  window.location.replace(url);
}

function parseSelectorTree(selectorTree, depth = 0, parentNode = {}) {
  let hasLeafNodes =
    typeof selectorTree[Object.keys(selectorTree)[0]] === "object";

  if (!hasLeafNodes && Object.keys(selectorTree).length > 0) {
    const list = document.createElement("ul");
    list.style.paddingLeft = "20px";
    for (let key in selectorTree) {
      let listItem = document.createElement("li");
      listItem.textContent = key;
      listItem.style.color = "#ADD8E6";
      listItem.style.textDecoration = "underline";
      listItem.style.cursor = "pointer";
      listItem.addEventListener("click", () => {
        setBoardPosition(selectorTree[key]);
      });
      listItem.appendChild(addSwitch());
      list.appendChild(listItem);
    }
    return list;
  } else {
    let div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    if (depth > 0) {
      div.style.paddingLeft = "20px";
    }

    // Add functionality to parent div

    if (depth === 0) {
      const addButton = addBigPlusButton(selectorTree);
      div.appendChild(addButton);
    }

    for (let key in selectorTree) {
      const details = document.createElement("details");
      details.style.paddingTop = "3px";
      const summary = document.createElement("summary");
      const stateKey = `${key}_${depth}`;
      if (stateKey in treeExpansionState) {
        details.open = treeExpansionState[stateKey];
      }

      // Create a container for the summary content
      const summaryContent = document.createElement("span");
      summaryContent.textContent = key;
      summary.appendChild(summaryContent);

      const gap = document.createElement("span");
      gap.className = "col-1";
      summary.appendChild(gap);
      const addIcon = addPlusButton(selectorTree[key], stateKey);
      const addFenIcon = addAtButton(selectorTree[key]);
      const addXIcon = addXButton(key, selectorTree, stateKey);

      summary.appendChild(addIcon);
      summary.appendChild(addFenIcon);
      summary.appendChild(addXIcon);
      details.appendChild(summary);

      details.addEventListener("toggle", () => {
        treeExpansionState[stateKey] = details.open;
        browser.storage.sync.set({ treeExpansionState: treeExpansionState });
      });

      details.appendChild(
        parseSelectorTree(selectorTree[key], depth + 1, selectorTree)
      );
      div.appendChild(details);
    }
    return div;
  }
}

function addBigPlusButton(selectorTree) {
  const addButton = document.createElement("button");
  addButton.textContent = "+";
  addButton.style.marginBottom = "10px";
  addButton.style.width = "25px";
  addButton.style.height = "25px";
  addButton.addEventListener("click", () => {
    addNewChild(selectorTree);
    refreshTree();
  });
  return addButton;
}

function addSwitch() {
  const switchButton = document.createElement("div");
  switchButton.id = "switch123";
  switchButton.style.width = "20px";
  switchButton.style.height = "15px";
  switchButton.style.borderRadius = "5px";
  switchButton.style.border = "1px solid black";
  switchButton.style.backgroundColor = "white";
  switchButton.style.display = "inline-block";
  switchButton.style.marginLeft = "10px";
  switchButton.style.verticalAlign = "middle";

  switchButton.addEventListener("click", (event) => {
    // event.preventDefault();
    event.stopPropagation();
    if (switchButton.style.backgroundColor === "white") {
      switchButton.style.backgroundColor = "black";
      switchButton.style.border = "1px solid white";
    } else {
      switchButton.style.backgroundColor = "white";
      switchButton.style.border = "1px solid black";
    }
  });
  return switchButton;
}

function addPlusButton(currentNode, stateKey) {
  const addIcon = document.createElement("span");
  addIcon.textContent = "+";
  addIcon.style.cursor = "pointer";
  addIcon.style.marginLeft = "20px";
  addIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    addNewChild(currentNode);
    treeExpansionState[stateKey] = true;
    refreshTree();
  });
  return addIcon;
}

function addAtButton(currentNode) {
  const addIcon = document.createElement("span");
  addIcon.textContent = "@";
  addIcon.style.cursor = "pointer";
  addIcon.style.marginLeft = "10px";
  addIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    addFenLink(currentNode);
    refreshTree();
  });
  return addIcon;
}

function addXButton(childNode, parentNode, stateKey) {
  const addIcon = document.createElement("span");
  addIcon.textContent = "x";
  addIcon.style.cursor = "pointer";
  addIcon.style.marginLeft = "10px";
  addIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    delete parentNode[childNode];
    browser.storage.sync.set({ positions: positions });
    treeExpansionState[stateKey] = true;
    refreshTree();
  });
  return addIcon;
}

function addNewChild(parentNode) {
  const newKey = prompt("Enter the name for the new node:");
  if (newKey) {
    parentNode[newKey] = {};
    browser.storage.sync.set({ positions: positions });
  }
}

function addFenLink(parentNode) {
  const newKey = prompt("Enter the name for this position:");
  if (newKey) {
    const fen = prompt("Enter the FEN for this position:");
    if (fen) {
      parentNode[newKey] = fen;
      browser.storage.sync.set({ positions: positions });
    }
  }
}

function refreshTree() {
  const side = document.querySelector("aside");
  if (side) {
    side.innerHTML = "";
    const nestedlist = parseSelectorTree(positions);
    side.appendChild(nestedlist);
  } else {
    console.error("Unable to find 'aside' element. Tree cannot be rendered.");
  }
}
