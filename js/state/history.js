function commitState() {
  // Deep copy current state to history
  // Max history limit could be added here if needed
  historyStack.push(JSON.parse(JSON.stringify(state)));
  futureStack = []; // Clear redo stack on new action

  saveState();
  updateUndoRedoUI();
}

function undo() {
  if (historyStack.length === 0) return;

  // Push current state to future
  futureStack.push(JSON.parse(JSON.stringify(state)));

  // Pop from history
  state = historyStack.pop();

  saveState();

  // Re-render everything
  if (typeof renderAll === "function") renderAll();
  if (typeof showSection === "function") {
    // Try to stay on current section, or default to setup/pairings based on state
    const currentSection = document.querySelector(".view.active");
    if (currentSection) showSection(currentSection.id);
  }
  updateUndoRedoUI();

  if (typeof showToast === "function")
    showToast("Rückgängig gemacht", "info", 1500);
}

function redo() {
  if (futureStack.length === 0) return;

  // Push current state to history
  historyStack.push(JSON.parse(JSON.stringify(state)));

  // Pop from future
  state = futureStack.pop();

  saveState();

  if (typeof renderAll === "function") renderAll();
  updateUndoRedoUI();

  if (typeof showToast === "function")
    showToast("Wiederhergestellt", "info", 1500);
}

function updateUndoRedoUI() {
  const undoBtn = document.getElementById("undo-btn");
  const redoBtn = document.getElementById("redo-btn");

  if (undoBtn) undoBtn.disabled = historyStack.length === 0;
  if (redoBtn) redoBtn.disabled = futureStack.length === 0;
}
