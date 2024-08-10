var oldFen = "";

var allcourses = {};
initializeData();

let mainObserver = new MutationObserver((mutations) => {
  tbody = document.querySelector("tbody");

  if (tbody && tbody.attributes["data-fen"]) {
    let observer = new MutationObserver(checkFenChange);
    let config = { attributes: true, subtree: true };
    observer.observe(tbody, config);
  }
});

mainObserver.observe(document, { childList: true, subtree: true });

// functions

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

function getFen() {
  let tbody = document.querySelector("tbody");
  if (!tbody) {
    return null;
  }
  let fen = tbody.attributes[0].value;
  return fen;
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
    console.log(newFen);
    moveSelectorDisplay();
    oldFen = newFen;
  }
}

async function loadJSON(path) {
  const response = await fetch(chrome.runtime.getURL(path));
  const json = await response.json();
  return json;
}

async function initializeData() {
  allcourses = await loadJSON("coursefiles/allcourses.json");
}
