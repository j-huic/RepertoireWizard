const fen = window.location.pathname
  .slice(14, -1)
  .replace(/U/g, "/")
  .replace(/%20/g, "_");
console.log(window.location.pathname);
const color = window.location.search.replace("o", "color");
const url = "https://lichess.org/analysis/" + fen + color;

window.location.replace(url);
