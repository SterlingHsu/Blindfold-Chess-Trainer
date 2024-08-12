let recognition;
let synth;
let selectedVoice;

// Lookup tables to make the machine's speech more natural
const letterToPiece = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const pieceToLetter = {
  knight: "N",
  bishop: "B",
  rook: "R",
  queen: "Q",
  king: "K",

  // Handling common WebSpeech misinterpretations
  92: "Nd2",
  he: "e",
  of: "f",
  night: "N",
  see: "c",
  sea: "c",
  doyou: "d",
};

const fileNames = {
  a: "A",
  b: "B",
  c: "C",
  d: "D",
  e: "E",
  f: "F",
  g: "G",
  h: "H",
};

const rankNames = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
};

function initSpeech() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Your browser doesn't support speech recognition. Try Chrome.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    const last = event.results.length - 1;
    const move = event.results[last][0].transcript.trim().toLowerCase();
    // console.log("Recognized: " + move);
    processVoiceMove(move);
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error", event.error);
  };

  synth = window.speechSynthesis;

  let voices = synth.getVoices();

  // Find a more natural-sounding voice (e.g., Google's neural network voices)
  let selectedVoice = voices.find(
    (voice) => voice.name.includes("Google") || voice.name.includes("Neural")
  );
}

function processVoiceMove(move) {
  // Convert the move to lowercase and remove extra spaces
  console.log(move)
  move = move.toLowerCase().trim().replace(/\s+/g, " ").split(" ").join("");

  if (
    move === "castlekingside" ||
    move === "kingsidecastle" ||
    move === "shortcastle"
  ) {
    move = "O-O";
  } else if (
    move === "castlequeenside" ||
    move === "queensidecastle" ||
    move === "longcastle"
  ) {
    move = "O-O-O";
  }

  for (let [pieceName, pieceSymbol] of Object.entries(pieceToLetter)) {
    if (move.startsWith(pieceName)) {
      move = move.replace(pieceName, pieceSymbol);
    }
  }

  move = move.replace("check", "");

  move = move
    .replace("captures", "x")
    .replace("capture", "x")
    .replace("takes", "x");

  move = move.replace(" to ", " ");

  if (!/[NBRQK]/.test(move[0]) && move[0] !== "O") {
    move = move.split(" ").slice(-2).join("");
  }

  let result = game.move(move, { sloppy: true });

  if (result) {
    board.position(game.fen());
    speak("You moved " + convertEngineMoveToNaturalLanguage(result));
    updateStatus();
    make_move();
  } else {
    speak("Invalid move. Please try again.");
    console.log("Invalid move:", move);
  }
}

function convertEngineMoveToNaturalLanguage(move) {
  let text = "";

  if (move.flags.includes("k")) {
    return "kingside castle";
  } else if (move.flags.includes("q")) {
    return "queenside castle";
  }

  if (move.piece !== "p") {
    text += letterToPiece[move.piece] + " ";
  }

  if (move.flags.includes("c") && move.piece === "p") {
    text += fileNames[move.from[0]] + " " + "captures";
  } else if (move.flags.includes("c")) {
    text += "captures";
  }

  text += fileNames[move.to[0]] + " " + rankNames[move.to[1]];

  if (move.flags.includes("e")) {
    text += " en passant";
  } else if (move.flags.includes("p")) {
    text += " promoting to " + letterToPiece[move.promotion];
  } else if (move.san.includes("#")) {
    text += " checkmate";
  } else if (move.san.includes("+")) {
    text += " check";
  }

  return text;
}

function speakMove(move) {
  let text = "";
  if (move.piece !== "p") {
    text += letterToPiece[move.piece] + " ";
  }
  text += fileNames[move.to[0]] + " " + rankNames[move.to[1]];
  speak(text);
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  synth.speak(utterance);
}

$('<button id="voice_move" class="btn btn-outline-primary">Voice Move</button>')
  .appendTo(".btn-group")
  .on("click", function () {
    recognition.start();
    speak("Listening.");
  });

$(document).ready(function () {
  initSpeech();
});
