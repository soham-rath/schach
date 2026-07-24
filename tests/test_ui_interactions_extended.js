const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createMockElement,
  createStorage,
} = require("./lib/helpers");

let printCalls = 0;
global.window = {
  print: () => {
    printCalls += 1;
  },
};
const document = createMockDocument();
global.document = document;
global.localStorage = createStorage().api;

let applyThemeCalls = 0;
let saveCalls = 0;

global.applyTheme = () => {
  applyThemeCalls += 1;
};
global.saveState = () => {
  saveCalls += 1;
};
global.commitState = () => {};
global.renderAll = () => {};
global.showSection = () => {};
global.rebuildTeamHistoryFromRounds = () => {};
global.showToast = () => {};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/ui/interactions.js");

console.log("=== UI INTERACTIONS EXTENDED TESTS START ===");

const confirmModal = document._setElement("confirm-modal", createMockElement("div"));
const alertModal = document._setElement("alert-modal", createMockElement("div"));
const alertTitle = document._setElement("alert-title", createMockElement("div"));
const alertMessage = document._setElement("alert-message", createMockElement("div"));
const swapModal = document._setElement("pairing-swap-modal", createMockElement("div"));
const slotA = document._setElement("swap-slot-a", createMockElement("select"));
const slotB = document._setElement("swap-slot-b", createMockElement("select"));

confirmModal.classList.remove("hidden");
alertModal.classList.add("hidden");
closeConfirm();
assert.strictEqual(confirmModal.classList.contains("hidden"), true);

state.theme = "dark";
toggleTheme();
assert.strictEqual(state.theme, "light");
assert.strictEqual(applyThemeCalls, 1);
assert.strictEqual(saveCalls, 1);

toggleTheme();
assert.strictEqual(state.theme, "dark");
assert.strictEqual(applyThemeCalls, 2);
assert.strictEqual(saveCalls, 2);

printActiveView();
assert.strictEqual(printCalls, 1);

swapModal.classList.remove("hidden");
closePairingSwapModal();
assert.strictEqual(swapModal.classList.contains("hidden"), true);

// openPairingSwapModal guard: no rounds yet
alertModal.classList.add("hidden");
alertMessage.innerText = "";
state.currentRound = 0;
state.rounds = [];
openPairingSwapModal();
assert.strictEqual(alertModal.classList.contains("hidden"), false);
assert(alertMessage.innerText.includes("Noch keine Paarungen"));

// openPairingSwapModal guard: only current round editable
alertModal.classList.add("hidden");
alertMessage.innerText = "";
state.currentRound = 1;
state.rounds = [{ matches: [] }, { matches: [] }];
openPairingSwapModal();
assert.strictEqual(alertModal.classList.contains("hidden"), false);
assert(alertMessage.innerText.includes("aktuelle Runde"));

// openPairingSwapModal success
alertModal.classList.add("hidden");
state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C")];
state.currentRound = 1;
state.rounds = [
  {
    matches: [
      { table: 1, teamA: "A", teamB: "B", isBye: false },
      { table: 2, teamA: "C", teamB: null, isBye: true },
    ],
  },
];
openPairingSwapModal();
assert.strictEqual(alertModal.classList.contains("hidden"), true);
assert.strictEqual(slotA.children.length, 3);
assert.strictEqual(slotB.children.length, 3);
assert.strictEqual(swapModal.classList.contains("hidden"), false);

console.log("=== UI INTERACTIONS EXTENDED TESTS END ===");
