var oldFen = "";
var allcourses = {};
var options = {};
initializeCourseData();

let mainObserver = new MutationObserver(() => {
  explorerBox = document.getElementsByClassName("explorer-box")[0]; // makes the code only go off on analysis boards
  if (!explorerBox) {
    return;
  }

  if (hasFenChanged()) {
    dataDiv = document.getElementsByClassName("data")[0];

    if (dataDiv && !dataDiv.className.includes("empty")) {
      let observer = new MutationObserver((mutationList) => {
        if (!hasManufacturedDeletions(mutationList)) {
          deleteManufacturedElements();
          moveSelectorDisplay();
        }
      });
      observer.observe(dataDiv, { childList: true, subtree: true });
    } else if (dataDiv && dataDiv.className.includes("empty")) {
      addMoveToEmpty();
    }
  }
});

let mainObserverAlt = new MutationObserver(() => {
  explorerBox = document.getElementsByClassName("explorer-box")[0]; // makes the code only go off on analysis boards
  if (!explorerBox) {
    return;
  }

  dataDiv = document.getElementsByClassName("data")[0];
  if (dataDiv) {
    let observer = new MutationObserver((mutationList) => {
      if (hasFenChanged()) {
        if (!hasManufacturedDeletions(mutationList)) {
          if (!dataDiv.className.includes("empty")) {
            deleteManufacturedElements();
            moveSelectorDisplay();
          } else {
            console.log("add to empty");
            addMoveToEmpty();
          }
        }
      }
    });
    observer.observe(dataDiv, { childList: true, subtree: true });
  }
});

let observerStatic = new MutationObserver(function (mutations) {
  let wiki = document.getElementsByClassName("analyse__wiki empty")[0];
  if (wiki) {
    wiki.remove();
    observerStatic.disconnect();
  }
});

mainObserverAlt.observe(document, { childList: true, subtree: true });
observerStatic.observe(document, { childList: true, subtree: true });

// functions

function moveSelectorDisplay() {
  fen = getFen();
  let tbody = document.getElementsByTagName("tbody")[0];
  let uniqueCourseMoves = new Set(moveRecommendationsFromFen(fen));

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

function addMoveToEmpty() {
  console.log("adding to empty");
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

function moveRecommendationsFromFen(fen) {
  let courseMoves = displayMoves(getPureFen(fen), options.sideAgnostic);
  let allCourseMoves = Object.values(courseMoves).flat();
  let uniqueCourseMoves = Array.from(new Set(allCourseMoves));
  return uniqueCourseMoves;
}

function displayMoves(fen, sideAgnostic = false) {
  let courseColors = {
    white: ["d4", "catalan"],
    black: ["nimzo", "kid", "sicilian"],
  };

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

function hasFenChanged() {
  let newFen = getFen();
  if (newFen !== oldFen) {
    oldFen = newFen;
    console.log("fen changed");
    return true;
  } else {
    return false;
  }
}

function getFen() {
  tbody = document.querySelector("tbody");
  if (tbody) {
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

function getPureFen(fen) {
  let split = fen.split(" ");
  let newFen = split.slice(0, split.length - 2).join(" ");
  return newFen;
}

function getSide() {
  black = document.getElementsByClassName(
    "cg-wrap cgv1 manipulable orientation-black"
  );
  return black.length === 1 ? "black" : "white";
}

async function initializeCourseData() {
  allcourses = await loadJSON("coursefiles/allcourses_pure.json");
  options = await loadOptions();
}

async function loadJSON(path) {
  const response = await fetch(chrome.runtime.getURL(path));
  const json = await response.json();
  return json;
}

function loadOptions() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ method: "getOptions" }, function (response) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// function getFenOld() {
//   let tbody = document.querySelector("tbody");
//   if (!tbody) {
//     return null;
//   }
//   let fen = tbody.attributes[0].value;
//   return fen;
// }

// async function onReady(document, callback) {
//   if (callback && typeof callback === "function") {
//     if (
//       document.readyState === "complete" ||
//       document.readyState === "interactive"
//     ) {
//       callback();
//     } else {
//       document.addEventListener("DOMContentLoaded", callback);
//     }
//   }
// }

// function getFenBox() {
//   let fenBox = document.querySelector("input.copyable");
//   if (fenBox) {
//     return fenBox;
//   } else {
//     let fenBoxAlt = document.querySelector("input.copy-me__target");
//     if (fenBoxAlt) {
//       return fenBoxAlt;
//     }
//   }
//   return null;
// }

// function onFenChange(mutationList) {
//   let fenChanged = false;
//   mutationList.forEach((mutation) => {
//     if (
//       mutation.type === "attributes" &&
//       mutation.attributeName === "data-fen"
//     ) {
//       fenChanged = true;
//     }
//   });
//   if (fenChanged) {
//     let newFen = getFen();
//     console.log(newFen);
//   }
// }

// function checkFenChange() {
//   let newFen = getFen();
//   if (newFen !== oldFen) {
//     moveSelectorDisplay();
//     oldFen = newFen;
//   }
// }

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
