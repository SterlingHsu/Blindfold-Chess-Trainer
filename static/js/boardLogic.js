function make_move() {
  if (game.turn() === userColor) return;

  const difficulty = $("#difficulty").val();
  $("#loading").show();
  $.post(
    "/make_move",
    { fen: game.fen(), difficulty: difficulty },
    function (data) {
      const move = game.move(data.best_move, { sloppy: true });

      console.log(data.best_move);

      board.position(game.fen());

      updateEvaluationBar(data.score);

      updateStatus();

      const naturalLanguageMove = convertEngineMoveToNaturalLanguage(move);

      $("#loading").hide();

      speak("I move " + naturalLanguageMove);
    }
  );
}

let scoreStack = [];

function updateEvaluationBar(score) {
  const $evaluationBar = $("#evaluation-bar");
  const $score = $("#score");

  let numericScore = parseInt(score) / 100; // Convert centipawns to pawns

  scoreStack.push(numericScore);

  let heightPercentage = 50 + (numericScore / 10) * 50;

  heightPercentage = Math.min(100, Math.max(0, heightPercentage));

  $evaluationBar.css("height", heightPercentage + "%");

  $evaluationBar.css("background-color", "#FFFFFF"); // Grey for equal

  $score.text((numericScore > 0 ? "+" : "") + numericScore.toFixed(2));
}

function updateEvaluationBarFromStack(score) {
  const $evaluationBar = $("#evaluation-bar");
  const $score = $("#score");

  let heightPercentage = 50 + (score / 10) * 50;

  heightPercentage = Math.min(100, Math.max(0, heightPercentage));

  $evaluationBar.css("height", heightPercentage + "%");

  $evaluationBar.css("background-color", "#FFFFFF"); // Grey for equal

  $score.text((score > 0 ? "+" : "") + score.toFixed(2));
}

function resetEvaluationBar() {
  const $evaluationBar = $("#evaluation-bar");
  const $score = $("#score");

  $evaluationBar.css("height", "50%");
  $evaluationBar.css("background-color", "#FFFFFF");
  $score.text("0.00");
}

function resetGame() {
  game.reset();
  board.position("start");
  board.orientation(userColor === "w" ? "white" : "black");
  console.log(userColor);
  if (userColor === "b") {
    make_move();
  }
  updateStatus();
  scoreStack = [];
  resetEvaluationBar();
}

$("#new_game").on("click", resetGame);

let userColor = "w";

$("#choose_color").on("click", function () {
  // If user color is white, make it black, vice versa
  console.log(userColor);
  userColor = userColor === "w" ? "b" : "w";
  updateColorButton();

  resetGame();
});

function updateColorButton() {
  $("#choose_color").text(
    userColor === "w" ? "Playing as White" : "Playing as Black"
  );
}

$("#take_back").on("click", function () {
  game.undo();
  game.undo();

  board.position(game.fen());

  scoreStack.pop();
  let previousScore = scoreStack.pop();

  if (previousScore !== undefined) {
    updateEvaluationBarFromStack(previousScore);
  } else {
    resetEvaluationBar();
  }

  updateStatus();
});

$("#flip_board").on("click", function () {
  board.flip();
});

$("#hide_pieces").on("click", function () {
  $("#chess_board").addClass("pieces-hidden");
  $(this).hide();
  $("#show_pieces").show();
});

$("#show_pieces").on("click", function () {
  $("#chess_board").removeClass("pieces-hidden");
  $(this).hide();
  $("#hide_pieces").show();
});

$("#difficulty").on("input", function () {
  $("#difficulty-value").text($(this).val());
});

$("#user-move").keypress(function (e) {
  if (e.which == 13) {
    // Enter key pressed
    var move = $(this).val();
    if (handleUserMove(move)) {
      $(this).val(""); // Clear the input field
    } else {
      alert("Invalid move. Please try again.");
    }
  }
});

// GUI board & game state variables
var board = null;
var game = new Chess();
var $status = $("#status");
var $fen = $("#fen");
var $pgn = $("#pgn");
var $score = $("#score");
var $time = $("#time");
var $nodes = $("#nodes");
var $knps = $("#knps");
var piecesHidden = false;

// on picking up a piece
function onDragStart(source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

  // only pick up pieces for the side to move
  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1) ||
    game.turn() !== userColor
  ) {
    return false;
  }
}

// on dropping piece
function onDrop(source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return "snapback";

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
}

function handleUserMove(move) {
  if (game.turn() !== userColor) return false;

  var result_of_move = game.move(move, { sloppy: true });

  if (result_of_move == null) return false;

  speak("You moved " + convertEngineMoveToNaturalLanguage(result_of_move));

  board.position(game.fen());
  make_move();
  updateStatus();

  return true;
}

// update game status
function updateStatus() {
  var status = "";

  var moveColor = "White";
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
  $status.html(status);
  $fen.val(game.fen());
  $pgn.html(game.pgn());
}

// chess board configuration
var config = {
  draggable: true,
  position: "start",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
};

// create chess board widget instance
board = Chessboard("chess_board", config);

updateColorButton();

// update game status
updateStatus();
