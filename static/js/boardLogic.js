// GUI board & game state variables
let board = null;
let game = new Chess();
let userColor = "w";
let $pgn = $("#pgn");
let $evaluation = $("#evaluation");
let evaluationStack = [];
let piecesHidden = false;
let isDragging = false;

function make_move() {
  if (game.turn() === userColor) return;

  const difficulty = $("#difficulty").val();
  $("#loading").show();
  $.post(
    "/make_move",
    { fen: game.fen(), difficulty: difficulty },
    function (data) {
      const move = game.move(data.best_move, { sloppy: true });

      board.position(game.fen());

      updateEvaluationBar(data.evaluation);

      updateStatus();

      const naturalLanguageMove = convertEngineMoveToNaturalLanguage(move);

      $("#loading").hide();

      speak("I move " + naturalLanguageMove);
    }
  );
}

const evaluationBarContainer = document.getElementById(
  "evaluation-bar-container"
);

for (let i = 1; i < 10; i++) {
  const tick = document.createElement("div");
  tick.className = "evaluation-tick";
  tick.style.bottom = `${i * 10}%`;
  evaluationBarContainer.appendChild(tick);
}

function updateEvaluationBar(evaluation) {
  const $evaluationBar = $("#evaluation-bar");
  const $evaluation = $("#evaluation");

  if (evaluation.includes("M")) {
    evaluation.includes("-")
      ? $evaluationBar.css("height", "0%")
      : $evaluationBar.css("height", "100%");
    $evaluation.text(evaluation.replace("-", ""));
    $evaluationBar.css("background-color", "#FFFFFF");
  } else {
    let numericEvaluation = parseInt(evaluation) / 100; // Convert centipawns to pawns

    evaluationStack.push(numericEvaluation);

    let heightPercentage = 50 + (numericEvaluation / 10) * 50;

    heightPercentage = Math.min(100, Math.max(0, heightPercentage));

    $evaluationBar.css("height", heightPercentage + "%");

    $evaluationBar.css("background-color", "#FFFFFF");

    $evaluation.text((numericEvaluation > 0 ? "+" : "") + numericEvaluation.toFixed(2));
  }
}

function updateEvaluationBarFromStack(evaluation) {
  const $evaluationBar = $("#evaluation-bar");
  const $evaluation = $("#evaluation");

  let heightPercentage = 50 + (evaluation / 10) * 50;

  heightPercentage = Math.min(100, Math.max(0, heightPercentage));

  $evaluationBar.css("height", heightPercentage + "%");

  $evaluationBar.css("background-color", "#FFFFFF"); // Grey for equal

  $evaluation.text((evaluation > 0 ? "+" : "") + evaluation.toFixed(2));
}

function resetEvaluationBar() {
  const $evaluationBar = $("#evaluation-bar");
  const $evaluation = $("#evaluation");

  $evaluationBar.css("height", "50%");
  $evaluationBar.css("background-color", "#FFFFFF");
  $evaluation.text("0.00");
}

function resetGame() {
  game.reset();
  board.position("start");
  board.orientation(userColor === "w" ? "white" : "black");
  if (userColor === "b") {
    make_move();
  }
  updateStatus();
  evaluationStack = [];
  resetEvaluationBar();
}

function enableMobileDragging(allow) {
  if (allow) {
    isDragging = false;
    document.body.style.touchAction = "";
  } else {
    isDragging = true;
    document.body.style.touchAction = "none";
  }
}

function onDragStart(source, piece, position, orientation) {
  if (game.game_over()) return false;

  // only pick up pieces for the side to move
  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1) ||
    game.turn() !== userColor
  ) {
    return false;
  }

  enableMobileDragging(false);

  return true;
}

// on dropping piece
function onDrop(source, target) {
  // see if the move is legal
  let move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) {
    enableMobileDragging(true);
    return "snapback";
  }

  enableMobileDragging(true);

  speak("You moved " + convertEngineMoveToNaturalLanguage(move));

  // make computer move
  if (!game.game_over()) {
    make_move();
  }

  // update game status
  updateStatus();
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
  board.position(game.fen());
  enableMobileDragging(true);
}

function handleUserMove(move) {
  if (game.turn() !== userColor) return false;

  let result_of_move = game.move(move, { sloppy: true });

  if (result_of_move == null) return false;

  speak("You moved " + convertEngineMoveToNaturalLanguage(result_of_move));

  board.position(game.fen());
  make_move();
  updateStatus();

  return true;
}

// update game status
function updateStatus() {
  let status = "";

  let moveColor = "White";
  if (game.turn() === "b") {
    moveColor = "Black";
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = "Game over, " + moveColor + " is in checkmate.";
  }

  // draw?
  else if (game.in_draw()) {
    status = "Game over, drawn position";
  }

  // game still on
  else {
    status = moveColor + " to move";

    // check?
    if (game.in_check()) {
      status += ", " + moveColor + " is in check";
    }
  }

  // update DOM elements
  $pgn.html(game.pgn());
}

// Prevent mobile screen from moving when dragging a piece
document.addEventListener(
  "touchmove",
  function (e) {
    if (isDragging) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// chess board configuration
let config = {
  draggable: true,
  position: "start",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
};

board = Chessboard("chess_board", config);

updateStatus();
