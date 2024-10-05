var oldFen = "";
var allcourses = {};
var options = {};

chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
  options = response;

  if (options.removeWiki) {
    observerStatic.observe(document, { childList: true, subtree: true });
  }

  if (options.highlightMoves) {
    chrome.storage.local.get("courseData", function (result) {
      allcourses = result.courseData;
      if (allcourses) {
        mainObserver.observe(document, { childList: true, subtree: true });
        if (document.readyState === "complete") {
          setTimeout(() => {
            highlightExplorerMoves();
          }, 100);
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
    newHeader.innerHTML = getHeaderHTML();
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
  chrome.runtime.sendMessage(
    { method: "getUCI", fen: fen, move: move },
    (response) => {
      if (response) {
        tr.setAttribute("data-uci", response);
      }
    }
  );
  tr.setAttribute("origin", "manufactured");
  tr.innerHTML = getMoveCardHTML(move);
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

function getMoveCardHTML(move) {
  return `
    <td style="color: red;">${move}</td>
    <td>N/A</td>
    <td>0</td>
    <td title="">
      <div class="bar">
        <span class="white" style="width: 33.3%">0%</span
        ><span class="draws" style="width: 33.3%">0%</span
        ><span class="black" style="width: 33.3%">0%</span>
      </div>
    </td>
  `;
}

function getHeaderHTML() {
  return `
      <tr>
        <th>Move</th>
        <th colspan="2">Games</th>
        <th>White / Draw / Black</th>
      </tr>
  `;
}
