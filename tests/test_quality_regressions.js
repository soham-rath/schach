const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJECT_ROOT = path.join(__dirname, "..");

function loadFile(relPath) {
  const code = fs.readFileSync(path.join(PROJECT_ROOT, relPath), "utf8");
  vm.runInThisContext(code);
}

function createMockElement() {
  return {
    disabled: false,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    innerText: "",
    innerHTML: "",
    value: "",
    appendChild: () => {},
    removeChild: () => {},
    setAttribute: () => {},
    addEventListener: () => {},
    focus: () => {},
    click: () => {},
    parentNode: { replaceChild: () => {} },
  };
}

function setupMocks() {
  const storage = {};
  global.window = {};
  global.document = {
    getElementById: () => createMockElement(),
    querySelector: () => createMockElement(),
    querySelectorAll: () => [],
    createElement: () => createMockElement(),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };
  global.__reloadCount = 0;
  global.location = {
    reload: () => {
      global.__reloadCount += 1;
    },
  };
  global.localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
    setItem: (k, v) => {
      storage[k] = String(v);
    },
    removeItem: (k) => {
      delete storage[k];
    },
  };
  return storage;
}

setupMocks();
loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/state/storage.js");
loadFile("js/state/history.js");
loadFile("js/logic/standings.js");
loadFile("js/logic/pairings.js");

console.log("=== QUALITY REGRESSION TESTS START ===");

// Test 1: Deleting active tournament must keep meta list clean.
loadState();
const firstId = state.id;
state.config.name = "Tournament A";
saveState();

createNewTournament(false);
const secondId = state.id;
state.config.name = "Tournament B";
saveState();

let meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert(meta.tournaments.some((t) => t.id === firstId), "First tournament missing before delete");
assert(meta.tournaments.some((t) => t.id === secondId), "Second tournament missing before delete");
assert.strictEqual(meta.activeId, secondId, "Expected second tournament to be active before delete");

deleteTournament(secondId);
meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert(meta, "Meta missing after deleting active tournament");
assert(!meta.tournaments.some((t) => t.id === secondId), "Deleted tournament still listed in meta");
assert.strictEqual(meta.activeId, firstId, "Active tournament did not switch to remaining slot");
assert(global.__reloadCount > 0, "Deleting active tournament should trigger reload");
console.log("PASS: Active tournament deletion keeps metadata consistent.");

// Test 2: Singles pairing should be undoable and respect max rounds.
historyStack = [];
futureStack = [];

let alertCount = 0;
global.showAlert = () => {
  alertCount += 1;
};
global.showToast = () => {};

state.mode = "SINGLES";
state.singles.config.type = "SWISS";
state.singles.config.totalRounds = 1;
state.singles.players = [
  new Player("P1", "P1"),
  new Player("P2", "P2"),
  new Player("P3", "P3"),
  new Player("P4", "P4"),
];
state.singles.rounds = [];
state.singles.currentRound = 0;
state.singles.excludedPlayersThisRound = [];
normalizeState();

generatePairingsSingles();
assert.strictEqual(state.singles.currentRound, 1, "First singles round was not generated");
assert.strictEqual(historyStack.length, 1, "Singles round generation should create one undo checkpoint");

generatePairingsSingles();
assert.strictEqual(state.singles.currentRound, 1, "Singles round generation exceeded configured round limit");
assert.strictEqual(historyStack.length, 1, "Blocked round generation should not create extra undo checkpoints");
assert(alertCount > 0, "Expected alert when trying to generate beyond max rounds");
console.log("PASS: Singles pairing honors round cap and undo consistency.");

console.log("=== QUALITY REGRESSION TESTS END ===");
