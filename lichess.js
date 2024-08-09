var allcourses = {};

async function loadJSON(path) {
  const response = await fetch(chrome.runtime.getURL(path));
  const json = await response.json();
  return json;
}

async function initializeData() {
  allcourses = await loadJSON("coursefiles/allcourses.json");
}

async function initializeDataFromLists(whitelist, blacklist) {
  for (var file of whitelist) {
    let path = "coursefiles/" + file + ".json";
    let data = await loadJSON(path);
    Object.assign(white, data);
  }
  for (var file of blacklist) {
    let path = "coursefiles/" + file + ".json";
    let data = await loadJSON(path);
    Object.assign(black, data);
  }
}

initializeData();

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
      let body = document.querySelector("body");
      if (!body.className.includes("playing")) {
        dynamic(fen);
        moveSelectorDisplay();
      }
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

  let moveDisplay = displayMoves(fen);

  while (sidebar.firstChild) {
    sidebar.removeChild(sidebar.firstChild);
  }

  for (let course in moveDisplay) {
    let courseText = document.createElement("p");
    courseText.textContent = course;
    courseText.style.fontSize = "24px";
    courseText.style.fontWeight = "bold";
    sidebar.appendChild(courseText);

    let moveText = document.createElement("p");
    moveText.style.fontSize = "20px";
    moveText.textContent = moveDisplay[course];
    sidebar.appendChild(moveText);
  }
}

function moveSelectorDisplay() {
  let tbody = document.getElementsByTagName("tbody")[0];
  let fen = tbody.attributes[0].value;
  let courseMoves = displayMoves(fen, true);
  let allCourseMoves = Object.values(courseMoves).flat();
  let uniqueCourseMoves = Array.from(new Set(allCourseMoves));

  for (let move of tbody.children) {
    moveText = move.getElementsByTagName("td")[0].textContent;
    if (uniqueCourseMoves.includes(moveText)) {
      move.getElementsByTagName("td")[0].style.color = "red";
    }
  }
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
