var oldFen = "";
var allcourses = {};
var options = {};

browser.runtime.sendMessage({ method: "getOptions" }).then((response) => {
  options = response;

  if (options.removeWiki) {
    observerStatic.observe(document, { childList: true, subtree: true });
  }

  if (options.highlightMoves) {
    browser.storage.local.get("courseData").then((result) => {
      allcourses = result.courseData;
      if (allcourses) {
        mainObserver.observe(document, { childList: true, subtree: true });
        if (document.readyState === "complete") {
          setTimeout(() => {
            highlightExplorerMoves();
          }, 500);
        }
      }
    });
  }
});

// top level observer which triggers the inner observer when the explorer tab is open
let mainObserver = new MutationObserver(() => {
  explorerBox = document.getElementsByClassName("explorer-box")[0];
  if (!explorerBox) {
    return;
  }

  dataDiv = document.getElementsByClassName("data")[0];
  if (dataDiv) {
    innerObserver.observe(dataDiv, { childList: true, subtree: true });
  }
});

// inner observer triggers with fen change and calls appropriate functions
var innerObserver = new MutationObserver((mutationList) => {
  if (hasFenChanged()) {
    if (!hasManufacturedDeletions(mutationList)) {
      if (!dataDiv.className.includes("empty")) {
        deleteManufacturedElements();
        highlightExplorerMoves();
      } else {
        addMoveToEmpty();
      }
    }
  }
});

// removes wiki tab
let observerStatic = new MutationObserver(function (mutations) {
  let wiki = document.getElementsByClassName("analyse__wiki empty")[0];
  if (wiki) {
    wiki.remove();
    observerStatic.disconnect();
  }
});

// functions
// top level function which checks and highlights explorer moves against course data for current position
function highlightExplorerMoves() {
  fen = getFen();
  let tbody = document.getElementsByTagName("tbody")[0];
  let uniqueCourseMoves = new Set(moveRecommendationsFromFen(fen));
  if (tbody) {
    for (let move of tbody.children) {
      let moveText = move.getElementsByTagName("td")[0].textContent;
      if (uniqueCourseMoves.has(moveText)) {
        move.getElementsByTagName("td")[0].style.color = "red";
        uniqueCourseMoves.delete(moveText);
      }
    }
    if (uniqueCourseMoves.size > 0) {
      for (let move of uniqueCourseMoves) {
        moveCard = createMoveCard(move, fen);
        tbody.appendChild(moveCard);
      }
    }
  }
}

// if there are no known moves for the current FEN, add the moves to the empty div
function addMoveToEmpty() {
  let empty = document.getElementsByClassName("data empty")[0];
  let msg = empty.getElementsByClassName("message")[0];
  if (msg) {
    empty.removeChild(msg);
  }

  if (document.getElementsByClassName("moves").length === 0) {
    var movesDiv = document.createElement("table");
    let newHeader = document.createElement("thead");
    movesDiv.className = "moves";
    newHeader.appendChild(createHeaderElement());
    movesDiv.appendChild(newHeader);
    empty.appendChild(movesDiv);
  }

  let fen = getFen();
  recommendedMoves = moveRecommendationsFromFen(fen);

  if (recommendedMoves.length === 0) {
    return;
  } else {
    let newTbody = document.createElement("tbody");
    newTbody.setAttribute("data-fen", fen);

    for (let move of recommendedMoves) {
      let moveCard = createMoveCard(move, fen);
      newTbody.appendChild(moveCard);
    }

    movesDiv.appendChild(newTbody);
  }
}

// returns list of unique course moves for the given FEN
function moveRecommendationsFromFen(fen) {
  let courseMoves = displayMoves(getPureFen(fen), options.sideAgnostic);
  let allCourseMoves = Object.values(courseMoves).flat();
  let uniqueCourseMoves = Array.from(new Set(allCourseMoves));

  return uniqueCourseMoves;
}

function courseOptionsBreakdown() {
  let courseOptions = options.courseDataInfo;
  let white = [];
  let black = [];

  for (let key in courseOptions) {
    if (!key.includes("Include") && courseOptions[key + "Include"]) {
      if (courseOptions[key]) {
        black.push(key);
      } else {
        white.push(key);
      }
    }
  }

  return { white, black };
}

// takes a FEN and returns the course data
function displayMoves(fen, sideAgnostic = false) {
  let courseColors = courseOptionsBreakdown();

  let side = getSide();
  let courses = sideAgnostic
    ? Object.values(courseColors).flat()
    : courseColors[side];
  let displays = {};

  for (let course of courses) {
    if (allcourses[course][fen]) {
      displays[course] = allcourses[course][fen];
    }
  }

  return displays;
}

function createMoveCard(move, fen) {
  let tr = document.createElement("tr");
  tr.setAttribute("origin", "manufactured");

  browser.runtime
    .sendMessage({ method: "getUCI", fen: fen, move: move })
    .then((response) => {
      if (response) {
        tr.setAttribute("data-uci", response);
      }
    });

  const tdMove = document.createElement("td");
  tdMove.textContent = move;
  tdMove.style.color = "red";

  const tdGames = document.createElement("td");
  tdGames.textContent = "N/A";

  const tdGamesCount = document.createElement("td");
  tdGamesCount.textContent = "0";

  const tdTitle = document.createElement("td");
  const div = document.createElement("div");
  div.className = "bar";

  const spanWhite = document.createElement("span");
  const spanDraws = document.createElement("span");
  const spanBlack = document.createElement("span");
  spanWhite.className = "white";
  spanDraws.className = "draws";
  spanBlack.className = "black";
  for (let span of [spanWhite, spanDraws, spanBlack]) {
    span.style.width = "33.3%";
    span.textContent = "0%";
  }

  div.appendChild(spanWhite);
  div.appendChild(spanDraws);
  div.appendChild(spanBlack);
  tdTitle.appendChild(div);
  tr.appendChild(tdMove);
  tr.appendChild(tdGames);
  tr.appendChild(tdGamesCount);
  tr.appendChild(tdTitle);

  return tr;
}

// checks if the mutation list contains a deletion of a manufactured element
function hasManufacturedDeletions(mutationList) {
  for (const mutation of mutationList) {
    if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
      for (const node of mutation.removedNodes) {
        if (
          node.nodeType === 1 &&
          node.getAttribute("origin") === "manufactured"
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function deleteManufacturedElements() {
  let elements = document.querySelectorAll("[origin='manufactured']");
  elements.forEach((element) => {
    element.remove();
  });
}

// checks if the FEN has changed since the last check
function hasFenChanged() {
  let newFen = getFen();
  if (newFen !== oldFen) {
    oldFen = newFen;
    return true;
  } else {
    return false;
  }
}

// gets the FEN from the tbody if it exists, otherwise from the input box (latter is slower)
function getFen() {
  tbody = document.querySelector("tbody");
  if (
    tbody &&
    tbody.attributes["data-fen"] &&
    tbody.attributes["data-fen"].value
  ) {
    return tbody.attributes["data-fen"].value;
  }

  let fenBox = document.querySelector("input.copyable");
  if (fenBox) {
    return fenBox.value;
  } else {
    let fenBoxAlt = document.querySelector("input.copy-me__target");
    if (fenBoxAlt) {
      return fenBoxAlt.value;
    }
  }
  return null;
}

// cuts off the part of FEN which hurts transposition recognition
function getPureFen(fen) {
  try {
    let split = fen.split(" ");
    let newFen = split.slice(0, split.length - 2).join(" ");
    return newFen;
  } catch {
    return;
  }
}

function getSide() {
  black = document.getElementsByClassName(
    "cg-wrap cgv1 manipulable orientation-black"
  );
  return black.length === 1 ? "black" : "white";
}

function createHeaderElement() {
  const tr = document.createElement("tr");
  const thMove = document.createElement("th");
  thMove.textContent = "Move";

  const thGames = document.createElement("th");
  thGames.textContent = "Games";
  thGames.colSpan = 2;

  const thResults = document.createElement("th");
  thResults.textContent = "White / Draw / Black";

  tr.appendChild(thMove);
  tr.appendChild(thGames);
  tr.appendChild(thResults);

  return tr;
}
