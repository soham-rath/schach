const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createMockElement,
} = require("./lib/helpers");

global.window = {};
const document = createMockDocument();
global.document = document;

const undoBtn = createMockElement("button");
const redoBtn = createMockElement("button");
document._setElement("undo-btn", undoBtn);
document._setElement("redo-btn", redoBtn);
document._setQuerySelector(".view.active", { id: "results" });

let saveStateCalls = 0;
let renderAllCalls = 0;
let showSectionCalls = [];
let toastCalls = 0;

global.saveState = () => {
  saveStateCalls += 1;
};
global.renderAll = () => {
  renderAllCalls += 1;
};
global.showSection = (id) => {
  showSectionCalls.push(id);
};
global.showToast = () => {
  toastCalls += 1;
};

loadFile("js/state/core.js");
loadFile("js/state/history.js");

console.log("=== HISTORY TESTS START ===");

// Empty undo/redo guards
historyStack = [];
futureStack = [];
state = { marker: "base" };
undo();
redo();
assert.strictEqual(saveStateCalls, 0);

// Commit -> undo -> redo cycle
state = { marker: "before", nested: { a: 1 } };
commitState();
assert.strictEqual(historyStack.length, 1);
assert.strictEqual(futureStack.length, 0);
assert.strictEqual(saveStateCalls, 1);

state.marker = "after";
state.nested.a = 2;
undo();
assert.strictEqual(state.marker, "before");
assert.strictEqual(state.nested.a, 1);
assert.strictEqual(historyStack.length, 0);
assert.strictEqual(futureStack.length, 1);
assert.strictEqual(renderAllCalls, 1);
assert.deepStrictEqual(showSectionCalls, ["results"]);
assert.strictEqual(toastCalls, 1);

redo();
assert.strictEqual(state.marker, "after");
assert.strictEqual(state.nested.a, 2);
assert.strictEqual(historyStack.length, 1);
assert.strictEqual(futureStack.length, 0);
assert.strictEqual(renderAllCalls, 2);
assert.strictEqual(toastCalls, 2);

// UI state checks
updateUndoRedoUI();
assert.strictEqual(undoBtn.disabled, false);
assert.strictEqual(redoBtn.disabled, true);

historyStack = [];
futureStack = [{ marker: "future" }];
updateUndoRedoUI();
assert.strictEqual(undoBtn.disabled, true);
assert.strictEqual(redoBtn.disabled, false);

console.log("=== HISTORY TESTS END ===");
