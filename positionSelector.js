let treeExpansionState = {};
let leafNodeColors = {};
let positions = {};

// let wiki = document.getElementsByClassName("analyse__wiki empty")[0];
// if (wiki) {
//   wiki.remove();
// }
browser.storage.sync
  .get([
    "positions",
    "treeExpansionState",
    "leafNodeColors",
    "enablePositionSelector",
  ])
  .then((storage) => {
    if (!storage.enablePositionSelector) {
      return;
    }
    if (storage.treeExpansionState) {
      treeExpansionState = storage.treeExpansionState;
    }
    if (storage.leafNodeColors) {
      leafNodeColors = storage.leafNodeColors;
    }
    if (storage.positions) {
      positions = storage.positions;
      refreshTree();
    } else {
      renderSelectorContainer();
    }
  });

function setBoardPosition(fen, side = "white") {
  const url = "https://lichess.org/analysis/" + fen + "?color=" + side;
  window.location.replace(url);
}

function parseSelectorTree(selectorTree, path = []) {
  let hasLeafNodes =
    typeof selectorTree[Object.keys(selectorTree)[0]] === "object";

  if (!hasLeafNodes && Object.keys(selectorTree).length > 0) {
    const list = document.createElement("ul");
    list.style.paddingLeft = "20px";
    for (let key in selectorTree) {
      const nodeKey = path.concat(key).join("/");
      const listItem = addLeafNodeListItem(key, selectorTree, nodeKey);
      list.appendChild(listItem);
    }
    return list;
  } else {
    let div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    if (path.length === 0) {
      div.style.marginTop = "20px";
    } else {
      div.style.paddingLeft = "20px";
    }

    // Add functionality to parent div

    if (path.length === 0) {
      const addButton = addBigPlusButton();
      div.appendChild(addButton);
    }

    for (let key in selectorTree) {
      const stateKey = path.concat(key).join("/");
      const details = addDetailsRow(selectorTree, key, stateKey);
      details.appendChild(
        parseSelectorTree(selectorTree[key], path.concat(key))
      );
      div.appendChild(details);
    }
    return div;
  }
}

function createSelectorContainer() {
  const div = document.createElement("div");
  div.id = "selectorContainer";
  div.style.marginTop = "20px";
  const buttonBar = document.createElement("div");
  const bigAddButton = addBigPlusButton();
  const bigAtButton = addBigAtButton();
  const bigInfoButton = addBigInfoButton();

  buttonBar.appendChild(bigAddButton);
  buttonBar.appendChild(bigAtButton);
  buttonBar.appendChild(bigInfoButton);
  div.appendChild(buttonBar);

  return div;
}

function renderSelectorTree(selectorTree, path = []) {
  const nodeDiv = document.createElement("div");
  const fenList = document.createElement("ul");

  for (let key in selectorTree) {
    const nodeKey = path.concat(key).join("/");

    if (typeof selectorTree[key] === "string") {
      const listItem = addLeafNodeListItem(key, selectorTree, nodeKey);
      fenList.appendChild(listItem);
    } else if (typeof selectorTree[key] === "object") {
      const details = addDetailsRow(selectorTree, key, nodeKey);
      details.appendChild(
        renderSelectorTree(selectorTree[key], path.concat(key))
      );
      nodeDiv.appendChild(details);
    }
  }

  const parentDiv = document.createElement("div");
  if (path.length !== 0) parentDiv.style.paddingLeft = "20px";
  parentDiv.appendChild(fenList);
  parentDiv.appendChild(nodeDiv);
  return parentDiv;
}

function addLeafNodeListItem(key, selectorTree, nodeKey) {
  const listItem = document.createElement("li");
  listItem.style.display = "flex";
  listItem.style.alignItems = "center";
  // listItem.style.justifyContent = "space-between";

  const fenLink = document.createElement("span");
  fenLink.textContent = key;
  fenLink.style.color = "#ADD8E6";
  fenLink.style.textDecoration = "underline";
  fenLink.style.cursor = "pointer";

  const switchContainer = document.createElement("span");
  const switchButton = addSwitch(nodeKey);
  switchContainer.appendChild(switchButton);
  fenLink.addEventListener("click", () =>
    setBoardPosition(selectorTree[key], switchButton.style.backgroundColor)
  );

  const xButtonContainer = document.createElement("span");
  xButtonContainer.appendChild(addXButton(key, selectorTree));

  listItem.appendChild(fenLink);
  listItem.appendChild(switchContainer);
  listItem.appendChild(xButtonContainer);

  return listItem;
}

function addDetailsRow(selectorTree, key, stateKey) {
  const details = document.createElement("details");
  details.style.paddingTop = "3px";
  const summary = document.createElement("summary");
  if (stateKey in treeExpansionState) {
    details.open = treeExpansionState[stateKey];
  }

  const summaryContent = document.createElement("span");
  summaryContent.textContent = key;
  summary.appendChild(summaryContent);

  const addNodeIcon = addPlusButton(selectorTree[key], stateKey);
  const addFenIcon = addAtButton(selectorTree[key], stateKey);
  const deleteIcon = addXButton(key, selectorTree);

  summary.appendChild(addNodeIcon);
  summary.appendChild(addFenIcon);
  summary.appendChild(deleteIcon);
  details.appendChild(summary);

  details.addEventListener("toggle", () => {
    treeExpansionState[stateKey] = details.open;
    browser.storage.sync.set({ treeExpansionState: treeExpansionState });
  });

  return details;
}

function addBigInfoButton() {
  const infoButton = document.createElement("button");
  infoButton.textContent = "i";
  infoButton.style.marginBottom = "10px";
  infoButton.style.marginLeft = "10px";
  infoButton.style.width = "25px";
  infoButton.style.height = "25px";
  infoButton.addEventListener("click", () => {
    alert(
      `+ button adds a new category node\n@ button adds a new FEN link\nx button removes the node or link`
    );
  });
  return infoButton;
}

function addBigPlusButton() {
  const addButton = document.createElement("button");
  addButton.textContent = "+";
  addButton.style.marginBottom = "10px";
  addButton.style.width = "25px";
  addButton.style.height = "25px";
  addButton.addEventListener("click", () => {
    addNewChild(positions);
    refreshTree();
  });
  return addButton;
}

function addBigAtButton() {
  const button = document.createElement("button");
  button.textContent = "@";
  button.style.marginBottom = "10px";
  button.style.marginLeft = "10px";
  button.style.width = "25px";
  button.style.height = "25px";
  button.addEventListener("click", () => {
    addFenLink(positions);
    refreshTree();
  });
  return button;
}

function addSwitch(nodeKey) {
  const switchButton = document.createElement("div");
  switchButton.id = nodeKey;
  switchButton.style.width = "20px";
  switchButton.style.height = "15px";
  switchButton.style.borderRadius = "5px";
  switchButton.style.display = "inline-block";
  switchButton.style.marginLeft = "20px";
  switchButton.style.verticalAlign = "middle";
  switchButton.style.backgroundColor = leafNodeColors[nodeKey] || "white";
  switchButton.style.border = `1px solid ${
    switchButton.style.backgroundColor === "white" ? "black" : "white"
  }`;

  switchButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (switchButton.style.backgroundColor === "white") {
      switchButton.style.backgroundColor = "black";
      switchButton.style.border = "1px solid white";
      leafNodeColors[nodeKey] = "black";
    } else {
      switchButton.style.backgroundColor = "white";
      switchButton.style.border = "1px solid black";
      leafNodeColors[nodeKey] = "white";
    }
    browser.storage.sync.set({ leafNodeColors: leafNodeColors });
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

function addAtButton(currentNode, stateKey) {
  const addIcon = document.createElement("span");
  addIcon.textContent = "@";
  addIcon.style.cursor = "pointer";
  addIcon.style.marginLeft = "10px";
  addIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    addFenLink(currentNode, stateKey);
    refreshTree();
  });
  return addIcon;
}

function addXButton(childNode, parentNode, isLeafNode = false) {
  const xButton = document.createElement("span");
  xButton.textContent = "x";
  xButton.style.cursor = "pointer";
  xButton.style.marginLeft = "10px";
  if (isLeafNode) {
    //
  }
  xButton.addEventListener("click", (event) => {
    event.stopPropagation();
    delete parentNode[childNode];
    browser.storage.sync.set({ positions: positions });
    refreshTree();
  });
  return xButton;
}

function addNewChild(parentNode) {
  const newKey = prompt("Enter the name for the new node:");
  if (newKey) {
    parentNode[newKey] = {};
    browser.storage.sync.set({ positions: positions });
  }
}

function addFenLink(parentNode, stateKey = "") {
  const newKey = prompt("Enter the name for this position:");
  if (newKey) {
    const fen = prompt("Enter the FEN for this position:");
    if (fen) {
      parentNode[newKey] = fen;
      browser.storage.sync.set({ positions: positions });
      treeExpansionState[stateKey] = true;
    }
  }
}

function renderSelectorContainer() {
  const side = document.querySelector("aside");
  if (side) {
    while (side.children.length > 1) {
      side.removeChild(side.lastChild);
    }

    const selectorDiv = createSelectorContainer();
    side.appendChild(selectorDiv);
  }
}

function refreshTree() {
  const side = document.querySelector("aside");
  if (side) {
    const mselect = side.children[0];
    side.innerHTML = "";
    side.appendChild(mselect);
    const nestedlist = renderSelectorTree(positions);

    const selectorDiv = createSelectorContainer();
    selectorDiv.appendChild(nestedlist);
    side.appendChild(selectorDiv);
  } else {
    console.error("Unable to find 'aside' element. Tree cannot be rendered.");
  }
}
