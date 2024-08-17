$("#new_game").on("click", resetGame);

$("#choose_color").on("click", function () {
  // If user color is white, make it black, vice versa
  userColor = userColor === "w" ? "b" : "w";
  updateColorButton();

  resetGame();
});

function updateColorButton() {
  $("#choose_color").text(
    userColor === "w" ? "Play as Black" : "Play as White"
  );
}

function undoMove() {
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
}

$("#take_back").on("click", undoMove);

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

$("#user-move").on("keyup", function (e) {
  // "Enter" key
  if (e.key === "Enter" || e.keyCode === 13) {
    let move = $(this).val();
    if (handleUserMove(move)) {
      $(this).val("");
    } else {
      alert("Invalid move. Please try again.");
    }
  }
});