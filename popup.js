document.addEventListener("DOMContentLoaded", () => {
  console.log("blabla");
  const fetchButton = document.getElementById("fetchButton");
  const fenInput = document.getElementById("fenInput");

  fetchButton.addEventListener("click", function () {
    fetch();
  });
});

console.log("blabl2");
