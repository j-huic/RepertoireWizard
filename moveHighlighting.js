var oldFen = "";
var allcourses = {};
var options = {};
initializeData();

let mainObserver = new MutationObserver(() => {
  tbody = document.querySelector("tbody");

  if (tbody && tbody.attributes["data-fen"]) {
    let observer = new MutationObserver(checkFenChange);
    let config = { attributes: true, subtree: true };
    observer.observe(tbody, config);
  }
});

let mainObserverTwo = new MutationObserver(() => {
  explorer = document.getElementsByClassName("data")[0];

  if (explorer) {
    let observer = new MutationObserver(checkFenChange);
    let config = { attributes: true, subtree: true };
    observer.observe(explorer, config);
  }
});

let mainObserverAlt = new MutationObserver(() => {
  if (hasFenChanged()) {
    dataDiv = document.getElementsByClassName("data")[0];

    if (dataDiv && !dataDiv.className.includes("empty")) {
      let observer = new MutationObserver(moveSelectorDisplay);
      observer.observe(dataDiv, { childList: true, subtree: true });
    } else if (dataDiv && dataDiv.className.includes("empty")) {
      addMoveToEmpty();
    }
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

function debounce(func, wait = 10) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

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
    j;
    empty.appendChild(movesDiv);
  }

  let fen = getFen();
  moves = moveRecommendationsFromFen(fen);

  if (moves.length === 0) {
    return;
  } else {
    let newTbody = document.createElement("tbody");
    newTbody.setAttribute("data-fen", fen);

    for (let move of moves) {
      let tr = document.createElement("tr");
      tr.innerHTML = getMoveCardHTML(move);
      newTbody.appendChild(tr);
    }

    movesDiv.appendChild(newTbody);
  }
}

function moveSelectorDisplay(bla = null) {
  fen = getFen();
  let tbody = document.getElementsByTagName("tbody")[0];
  let uniqueCourseMoves = moveRecommendationsFromFen(fen);

  for (let move of tbody.children) {
    moveText = move.getElementsByTagName("td")[0].textContent;
    if (uniqueCourseMoves.includes(moveText)) {
      move.getElementsByTagName("td")[0].style.color = "red";
    }
  }
}

function moveRecommendationsFromFen(fen) {
  let courseMoves = displayMoves(getPureFen(fen), options.sideAgnostic);
  let allCourseMoves = Object.values(courseMoves).flat();
  let uniqueCourseMoves = Array.from(new Set(allCourseMoves));
  return uniqueCourseMoves;
}

function getSide() {
  black = document.getElementsByClassName(
    "cg-wrap cgv1 manipulable orientation-black"
  );
  return black.length === 1 ? "black" : "white";
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

function getFenOld() {
  let tbody = document.querySelector("tbody");
  if (!tbody) {
    return null;
  }
  let fen = tbody.attributes[0].value;
  return fen;
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

function onMutation(mutationList) {
  console.log("A mutation occurred:", mutationList);
  console.log("________________________________");
  console.log("________________________________");
}

function onFenChange(mutationList) {
  let fenChanged = false;
  mutationList.forEach((mutation) => {
    if (
      mutation.type === "attributes" &&
      mutation.attributeName === "data-fen"
    ) {
      fenChanged = true;
    }
  });
  if (fenChanged) {
    let newFen = getFen();
    console.log(newFen);
  }
}

function checkFenChange() {
  let newFen = getFen();
  if (newFen !== oldFen) {
    moveSelectorDisplay();
    oldFen = newFen;
  }
}

function hasFenChanged() {
  let newFen = getFen();
  if (newFen !== oldFen) {
    oldFen = newFen;
    return true;
  } else {
    return false;
  }
}

function getPureFen(fen) {
  let split = fen.split(" ");
  let newFen = split.slice(0, split.length - 2).join(" ");
  return newFen;
}

async function loadJSON(path) {
  const response = await fetch(chrome.runtime.getURL(path));
  const json = await response.json();
  return json;
}

async function initializeData() {
  allcourses = await loadJSON("coursefiles/allcourses_pure.json");
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

async function onReady(document, callback) {
  if (callback && typeof callback === "function") {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }
}

function getFenBox() {
  let fenBox = document.querySelector("input.copyable");
  if (fenBox) {
    return fenBox;
  } else {
    let fenBoxAlt = document.querySelector("input.copy-me__target");
    if (fenBoxAlt) {
      return fenBoxAlt;
    }
  }
  return null;
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
