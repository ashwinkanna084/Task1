var p = document.querySelectorAll(".board .cell");
var q = document.querySelectorAll(".number .block");
var r = document.querySelector(".error");
var undoSpan = document.querySelector(".undoCount");
var hintSpan = document.querySelector(".hintCount");

var MAX_ERRORS = 3;
var MAX_HINTS = 3;
var MAX_UNDOS = 3;
var selectedNumber = 0;
var selectedCell = null;
var errorCount = 0;
var hintCount = 0;
var undoCount = 0;
var noteMode = false;
var undoStack = [];
var puzzle = [
  1,0,0,0,3,4,0,0,8,
  0,7,0,6,8,0,0,3,0,
  0,0,8,2,1,0,7,0,4,
  0,5,4,0,9,0,6,8,0,
  9,1,0,5,0,8,0,2,0,
  0,8,0,3,0,0,0,0,5,
  3,0,5,9,0,6,8,7,1,
  0,0,6,0,0,0,0,4,0,
  0,0,1,0,7,0,2,0,0
];

var solution = [
  1,6,2,7,3,4,5,9,8,
  4,7,9,6,8,5,1,3,2,
  5,3,8,2,1,9,7,6,4,
  2,5,4,1,9,7,6,8,3,
  9,1,3,5,6,8,4,2,7,
  6,8,7,3,4,2,9,1,5,
  3,4,5,9,2,6,8,7,1,
  7,2,6,8,5,1,3,4,9,
  8,9,1,4,7,3,2,5,6
];
start();
var cellEventsAttached = false;
var blockEventsAttached = false;
var keyboardAttached = false;
undoSpan.textContent = "0";
hintSpan.textContent = "0";

function start() {
  selectedNumber = 0;
  selectedCell = null;

  errorCount = 0;
  hintCount = 0;
  undoCount = 0;
  noteMode = false;

  undoStack = [];
  r.textContent = "0";

  buildBoard();

  attachCellEventsOnce();
  attachBlockEventsOnce();
  attachKeyboardOnce();

  updateActionButtons();
  updateNoteButtonUI();
}
function buildBoard() {
  for (var i = 0; i < p.length; i++) {
    p[i].dataset.index = i;
    p[i].classList.remove("fixed", "selected", "hinted");
    p[i].style.color = "black";
    removeNote(p[i]);

    if (puzzle[i] !== 0) {
      p[i].textContent = String(puzzle[i]);
      p[i].classList.add("fixed");
    } else {
      p[i].textContent = "";
    }
  }
}
function attachCellEventsOnce() {
  if (cellEventsAttached) return;
  cellEventsAttached = true;

  for (var i = 0; i < p.length; i++) {
    p[i].addEventListener("click", onCellClick);
  }
}
function attachBlockEventsOnce() {
  if (blockEventsAttached) return;
  blockEventsAttached = true;

  for (var i = 0; i < q.length; i++) {
    q[i].addEventListener("click", onBlockClick);
  }
}
function attachKeyboardOnce() {
  if (keyboardAttached) return;
  keyboardAttached = true;
  document.addEventListener("keydown", onKeyDown);
}
function onCellClick(e) {
  var cell = e.currentTarget;
  if (selectedCell !== null) selectedCell.classList.remove("selected");
  selectedCell = cell;
  selectedCell.classList.add("selected");

  if (cell.classList.contains("fixed")) return;

  if (selectedNumber !== 0) {
    if (noteMode) {
      placeNote(cell, selectedNumber);
    } else {
      placeNumberInCell(cell, selectedNumber, false);
    }
  }
}
function onBlockClick(e) {
  var block = e.currentTarget;
  var id = block.id || "";
  if (id === "undoBtn") { undoMove(); return; }
  if (id === "cancelBtn") { clearSelectedCell(); return; }
  if (id === "hintBtn") { giveHint(); return; }
  if (id === "noteBtn") { toggleNoteMode(); return; }
  var t = block.textContent.trim();
  if (t < "1" || t > "9") return;

  selectedNumber = parseInt(t, 10);

  if (selectedCell !== null && !selectedCell.classList.contains("fixed")) {
    if (noteMode) placeNote(selectedCell, selectedNumber);
    else placeNumberInCell(selectedCell, selectedNumber, false);
  }
}

function placeNumberInCell(cell, num, isHint) {
  var idx = parseInt(cell.dataset.index, 10);

  undoStack.push({
    idx: idx,
    prevText: cell.textContent,
    prevColor: cell.style.color,
    prevNote: getNote(cell),
    errorAdded: 0
  });

  removeNote(cell);

  cell.textContent = String(num);

  if (isHint) {
    cell.classList.add("hinted");
    cell.style.color = "black";
    return;
  }

  if (num !== solution[idx]) {
    errorCount = errorCount + 1;
    r.textContent = String(errorCount);
    cell.style.color = "red";
    undoStack[undoStack.length - 1].errorAdded = 1;

    if (errorCount >= MAX_ERRORS) {
      alert("❌ 3 mistakes. Restarting from beginning.");
      start();
      return;
    }
  } else {
    cell.style.color = "black";
  }

  if (isSolved()) {
    alert("✅ Sudoku Completed!");
  }
}

function placeNote(cell, num) {
  undoStack.push({
    idx: parseInt(cell.dataset.index, 10),
    prevText: cell.textContent,
    prevColor: cell.style.color,
    prevNote: getNote(cell),
    errorAdded: 0
  });

  setNote(cell, String(num));
}

function toggleNoteMode() {
  noteMode = !noteMode;
  updateNoteButtonUI();
}

function updateNoteButtonUI() {
  var noteBtn = document.getElementById("noteBtn");
  if (!noteBtn) return;

  if (noteMode) {
    noteBtn.style.outline = "3px solid black";
  } else {
    noteBtn.style.outline = "none";
  }
  if (undoSpan) undoSpan.textContent = String(undoCount);
if (hintSpan) hintSpan.textContent = String(hintCount);

}
function giveHint() {
  if (hintCount >= MAX_HINTS) return;
  if (selectedCell === null) return;
  if (selectedCell.classList.contains("fixed")) return;

  var idx = parseInt(selectedCell.dataset.index, 10);
  var correct = solution[idx];

  placeNumberInCell(selectedCell, correct, true);

  hintCount = hintCount + 1;
  hintSpan.textContent = String(hintCount);
  updateActionButtons();
}

function undoMove() {
  if (undoCount >= MAX_UNDOS) return;
  if (undoStack.length === 0) return;

  var last = undoStack.pop();
  var cell = p[last.idx];

  if (cell.classList.contains("fixed")) return;

  cell.textContent = last.prevText;
  cell.style.color = last.prevColor;

  if (last.prevNote) setNote(cell, last.prevNote);
  else removeNote(cell);

  if (last.errorAdded === 1) {
    errorCount = errorCount - 1;
    if (errorCount < 0) errorCount = 0;
    r.textContent = String(errorCount);
  }

  undoCount = undoCount + 1;
  undoSpan.textContent = String(undoCount);
  updateActionButtons();
}

function clearSelectedCell() {
  if (selectedCell === null) return;
  if (selectedCell.classList.contains("fixed")) return;

  undoStack.push({
    idx: parseInt(selectedCell.dataset.index, 10),
    prevText: selectedCell.textContent,
    prevColor: selectedCell.style.color,
    prevNote: getNote(selectedCell),
    errorAdded: 0
  });

  selectedCell.textContent = "";
  selectedCell.style.color = "black";
  selectedCell.classList.remove("hinted");
  removeNote(selectedCell);
}
function updateActionButtons() {
  var undoBtn = document.getElementById("undoBtn");
  var hintBtn = document.getElementById("hintBtn");

  if (undoBtn) {
    undoBtn.style.opacity = (undoCount >= MAX_UNDOS) ? "0.4" : "1";
    undoBtn.style.pointerEvents = (undoCount >= MAX_UNDOS) ? "none" : "auto";
    undoBtn.title = "Undo left: " + (MAX_UNDOS - undoCount);
  }
  if (hintBtn) {
    hintBtn.style.opacity = (hintCount >= MAX_HINTS) ? "0.4" : "1";
    hintBtn.style.pointerEvents = (hintCount >= MAX_HINTS) ? "none" : "auto";
    hintBtn.title = "Hints left: " + (MAX_HINTS - hintCount);
  }
}
function getNote(cell) {
  var s = cell.querySelector(".note");
  return s ? s.textContent : "";
}

function setNote(cell, txt) {
  removeNote(cell);
  var span = document.createElement("span");
  span.className = "note";
  span.textContent = txt;
  cell.appendChild(span);
}

function removeNote(cell) {
  var s = cell.querySelector(".note");
  if (s) cell.removeChild(s);
}

function isSolved() {
  for (var i = 0; i < 81; i++) {
    var v = p[i].textContent.trim();
    if (v === "") return false;
    if (parseInt(v, 10) !== solution[i]) return false;
  }
  return true;
}
function onKeyDown(e) {
  if (selectedCell === null) return;
  if (selectedCell.classList.contains("fixed")) return;

  if (e.key >= "1" && e.key <= "9") {
    selectedNumber = parseInt(e.key, 10);
    if (noteMode) placeNote(selectedCell, selectedNumber);
    else placeNumberInCell(selectedCell, selectedNumber, false);
    return;
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    clearSelectedCell();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
    undoMove();
    return;
  }
}
