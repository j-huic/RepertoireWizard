const Chess = require("chess.js").Chess;

fenToPath = function (FEN, rep) {
  return (
    "/ajax/nextMoves.php?next=" + FEN.replace(/\s/g, "%20") + "&rep=" + rep
  );
};

updateFen = function (fen, move) {
  var chess = new Chess(fen);
  chess.move(move);
  return chess.fen();
};

movesFromResponse = function (response) {
  if (response.length === 0) return null;
  var moves = response.map((response) => response["move"]);
  return moves;
};

recursiveFetch = function (fen, rep, positions, depth) {
  if (depth === 0) return positions;

  var response = mockFetch(fen, rep);
  if (response.length === 0) return positions;

  var moves = movesFromResponse(response);
  positions[fen] = moves;
  for (var move of moves) {
    var newPositions = recursiveFetch(
      updateFen(fen, move),
      rep,
      positions,
      depth - 1
    );
    Object.assign(positions, newPositions);
  }
  return positions;
};

callMock = function (depth = 3) {
  console.log(
    recursiveFetch(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      1,
      {},
      depth
    )
  );
};

moveToObject = function (move) {
  return { move: move };
};

mockFetch = function (fen, rep = 1) {
  var positions = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": ["e4"].map(
      moveToObject
    ),
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1": [
      "c5",
      "e6",
    ].map(moveToObject),
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": [
      "Nf3",
      "Nc3",
      "d4",
    ].map(moveToObject),
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2": [
      "d6",
      "Nc6",
      "e6",
    ].map(moveToObject),
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2": [
      "Nc6",
    ].map(moveToObject),
    "rnbqkbnr/pp1ppppp/8/2p5/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2": [
      "cxd4",
    ].map(moveToObject),
  };
  if (fen in positions) return positions[fen];
  else return [];
};

treeFetch = function (startfen, n, rep) {
  var levels = [];
  var fen = startfen;

  for (var i = 0; i < n; i++) {
    var positions = {};
    var response = fenFetch(fen, rep);
    if (response.length === 0) break;
    positions[fen] = movesFromResponse(response);
    fen = updateFen(fen, response[0]["move"]);
  }

  var response = fenFetch(startfen, rep);
  positions[startfen] = movesFromResponse(response);

  while (response.length > 0) {}
};
