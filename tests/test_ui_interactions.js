const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createMockElement,
  createStorage,
} = require("./lib/helpers");

global.window = { print: () => {} };
const document = createMockDocument();
global.document = document;
global.localStorage = createStorage().api;
global.Event = function Event(type) {
  this.type = type;
};

global.setTimeout = (fn) => {
  fn();
  return 1;
};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");

let commitCalls = 0;
let saveCalls = 0;
let updateNavCalls = 0;
let lockSetupCalls = 0;
let renderAllCalls = 0;
let showSectionCalls = [];
let rebuildCalls = 0;

global.commitState = () => {
  commitCalls += 1;
};
global.saveState = () => {
  saveCalls += 1;
};
global.updateNavigation = () => {
  updateNavCalls += 1;
};
global.lockSetup = () => {
  lockSetupCalls += 1;
};
global.renderAll = () => {
  renderAllCalls += 1;
};
global.showSection = (id) => {
  showSectionCalls.push(id);
};
global.rebuildTeamHistoryFromRounds = () => {
  rebuildCalls += 1;
};

loadFile("js/ui/interactions.js");

console.log("=== UI INTERACTIONS TESTS START ===");

async function run() {
  // Base required elements
  const toastContainer = document._setElement("toast-container", createMockElement("div"));
  const alertTitle = document._setElement("alert-title", createMockElement("h3"));
  const alertMessage = document._setElement("alert-message", createMockElement("p"));
  const alertModal = document._setElement("alert-modal", createMockElement("div"));
  alertModal.classList.add("hidden");

  const confirmModal = document._setElement("confirm-modal", createMockElement("div"));
  confirmModal.classList.add("hidden");
  const confirmTitle = document._setElement("confirm-title", createMockElement("h3"));
  const confirmMessage = document._setElement("confirm-message", createMockElement("p"));
  const confirmParent = createMockElement("div");
  const confirmOk = createMockElement("button");
  const confirmCancel = createMockElement("button");
  confirmParent.appendChild(confirmOk);
  confirmParent.appendChild(confirmCancel);
  confirmParent.replaceChild = (newChild, oldChild) => {
    const idx = confirmParent.children.indexOf(oldChild);
    if (idx >= 0) confirmParent.children[idx] = newChild;
    newChild.parentNode = confirmParent;
    newChild.parentElement = confirmParent;
    if (oldChild.id === "confirm-ok-btn")
      document._setElement("confirm-ok-btn", newChild);
    if (oldChild.id === "confirm-cancel-btn")
      document._setElement("confirm-cancel-btn", newChild);
    return oldChild;
  };
  document._setElement("confirm-ok-btn", confirmOk);
  document._setElement("confirm-cancel-btn", confirmCancel);

  // showToast / showAlert / closeAlert
  showToast("Saved", "success", 0);
  assert.strictEqual(toastContainer.children.length, 1);
  assert(toastContainer.children[0].innerHTML.includes("Saved"));
  assert(toastContainer.children[0].classList.contains("hiding"));

  showAlert("Problem", "Warn");
  assert.strictEqual(alertTitle.innerText, "Warn");
  assert.strictEqual(alertMessage.innerText, "Problem");
  assert.strictEqual(alertModal.classList.contains("hidden"), false);
  closeAlert();
  assert.strictEqual(alertModal.classList.contains("hidden"), true);

  // showConfirm resolves true/false
  const confirmTrue = showConfirm("Proceed?", "Confirm");
  const okBtnAfterClone = document.getElementById("confirm-ok-btn");
  okBtnAfterClone.dispatchEvent({ type: "click", target: okBtnAfterClone });
  assert.strictEqual(await confirmTrue, true);
  assert.strictEqual(confirmTitle.innerText, "Confirm");
  assert.strictEqual(confirmMessage.innerText, "Proceed?");

  const confirmFalse = showConfirm("Proceed?", "Confirm");
  const cancelBtnAfterClone = document.getElementById("confirm-cancel-btn");
  cancelBtnAfterClone.dispatchEvent({ type: "click", target: cancelBtnAfterClone });
  assert.strictEqual(await confirmFalse, false);

  // Import listener branches
  const importInput = document._setElement("import-file-input", createMockElement("input"));
  state = {
  config: { name: "Old", type: "SWISS", totalRounds: 5, boardsPerMatch: 4, pointsMatchWin: 2, pointsMatchDraw: 1, pointsMatchLoss: 0, pointsBye: 2, rulesPreset: "CUSTOM" },
  mode: "TEAM",
  singles: {
    config: { name: "Singles", type: "SWISS", totalRounds: 5, pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, pointsBye: 1 },
    players: [],
    rounds: [],
    currentRound: 0,
    status: "SETUP",
    excludedPlayersThisRound: [],
  },
  teams: [],
  rounds: [],
  currentRound: 0,
  status: "SETUP",
  excludedTeamsThisRound: [],
  theme: "dark",
  };

  setupImportListener();
  setupImportListener(); // idempotent bind
  assert.strictEqual(importInput.dataset.bound, "true");
  assert.strictEqual(importInput._listeners.change.length, 1);

  const changeHandler = importInput._listeners.change[0];

  // Invalid JSON
  const originalConsoleError = console.error;
  console.error = () => {};
  await changeHandler({
  target: {
    files: [
      {
        text: async () => "{bad",
      },
    ],
  },
  });
  console.error = originalConsoleError;
  assert(alertMessage.innerText.includes("Import fehlgeschlagen"));

  // Missing required keys
  await changeHandler({
  target: {
    files: [
      {
        text: async () => JSON.stringify({ foo: 1 }),
      },
    ],
  },
  });
  assert(alertMessage.innerText.includes("Fehlende Turnierdaten"));

  // Confirm reject path
  global.showConfirm = async () => false;
  commitCalls = 0;
  await changeHandler({
  target: {
    files: [
      {
        text: async () => JSON.stringify({ teams: [], rounds: [], config: {} }),
      },
    ],
  },
  });
  assert.strictEqual(commitCalls, 0);

  // Confirm accept path
  global.showConfirm = async () => true;
  commitCalls = 0;
  saveCalls = 0;
  updateNavCalls = 0;
  lockSetupCalls = 0;
  renderAllCalls = 0;
  showSectionCalls = [];
  await changeHandler({
  target: {
    files: [
      {
        text: async () =>
          JSON.stringify({
            config: { name: "Imported" },
            teams: [{ id: "T1", name: "Team 1" }],
            rounds: [],
            singles: { players: [], rounds: [], config: {} },
          }),
      },
    ],
  },
  });
  assert.strictEqual(commitCalls, 1);
  assert.strictEqual(saveCalls > 0, true);
  assert.strictEqual(updateNavCalls, 1);
  assert.strictEqual(lockSetupCalls, 1);
  assert.strictEqual(renderAllCalls, 1);
  assert.deepStrictEqual(showSectionCalls, ["standings"]);
  assert.strictEqual(state.config.name, "Imported");

  // Rules preset + custom marker
  const pointsWinInput = document._setElement("points-win", createMockElement("input"));
  const pointsDrawInput = document._setElement("points-draw", createMockElement("input"));
  const rulesPresetSelect = document._setElement("rules-preset", createMockElement("select"));
  const pointsWinSinglesInput = document._setElement("points-win-singles", createMockElement("input"));
  const pointsDrawSinglesInput = document._setElement("points-draw-singles", createMockElement("input"));
  const rulesPresetSinglesSelect = document._setElement("rules-preset-singles", createMockElement("select"));
  const roundsInput = document._setElement("total-rounds", createMockElement("input"));
  roundsInput._closest = { style: {} };
  const boardsInput = document._setElement("boards-count", createMockElement("input"));
  boardsInput._closest = { style: {} };
  const pairingSelect = document._setElement("pairing-system", createMockElement("select"));
  const singlesPairingSelect = document._setElement("pairing-system-singles", createMockElement("select"));
  const roundsSinglesInput = document._setElement("total-rounds-singles", createMockElement("input"));
  roundsSinglesInput._closest = { style: {} };

  global.winInput = pointsWinInput;
  global.drawInput = pointsDrawInput;

  state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C"), new Team("D", "D")];
  state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3")];
  state.config.type = "ROUND_ROBIN";
  state.singles.config.type = "ROUND_ROBIN";
  state.config.rulesPreset = "CUSTOM";
  state.singles.config.rulesPreset = "CUSTOM";

  saveCalls = 0;
  setupPresetListeners();
  assert.strictEqual(pairingSelect._listeners.change.length > 0, true);
  assert.strictEqual(singlesPairingSelect._listeners.change.length > 0, true);

  rulesPresetSelect.value = "FIDE";
  rulesPresetSelect.dispatchEvent({ type: "change", target: rulesPresetSelect });
  assert.strictEqual(state.config.pointsMatchWin, RULES_PRESETS.FIDE.pointsMatchWin);
  assert.strictEqual(saveCalls > 0, true);

  rulesPresetSelect.value = "CUSTOM";
  rulesPresetSelect.dispatchEvent({ type: "change", target: rulesPresetSelect });
  assert.strictEqual(state.config.rulesPreset, "CUSTOM");

  applyRulesPreset("USCF");
  assert.strictEqual(state.config.pointsMatchWin, RULES_PRESETS.USCF.pointsMatchWin);
  assert.strictEqual(pointsWinInput.value, RULES_PRESETS.USCF.pointsMatchWin);

  rulesPresetSelect.value = "FIDE";
  markPresetCustom();
  assert.strictEqual(rulesPresetSelect.value, "CUSTOM");

  rulesPresetSinglesSelect.value = "USCF";
  rulesPresetSinglesSelect.dispatchEvent({ type: "change", target: rulesPresetSinglesSelect });
  assert.strictEqual(state.singles.config.pointsWin, RULES_PRESETS.USCF.pointsMatchWin);
  assert.strictEqual(pointsWinSinglesInput.value, RULES_PRESETS.USCF.pointsMatchWin);

  rulesPresetSinglesSelect.value = "FIDE";
  markSinglesPresetCustom();
  assert.strictEqual(rulesPresetSinglesSelect.value, "CUSTOM");

  // Modal helpers
  const excludeModal = document._setElement("exclude-modal", createMockElement("div"));
  excludeModal.classList.add("hidden");
  const excludeList = document._setElement("exclude-teams-list", createMockElement("div"));
  state.teams = [new Team("Bravo", "B"), new Team("Alpha", "A")];
  showExcludeModal();
  assert.strictEqual(excludeModal.classList.contains("hidden"), false);
  assert.strictEqual(excludeList.children.length, 2);
  assert(excludeList.children[0].innerHTML.includes("Alpha"));
  closeExcludeModal();
  assert.strictEqual(excludeModal.classList.contains("hidden"), true);

  const excludeSinglesModal = document._setElement("exclude-singles-modal", createMockElement("div"));
  excludeSinglesModal.classList.add("hidden");
  const excludePlayersList = document._setElement("exclude-players-list", createMockElement("div"));
  state.singles.players = [new Player("Zed", "P2"), new Player("Ana", "P1")];
  showExcludeSinglesModal();
  assert.strictEqual(excludeSinglesModal.classList.contains("hidden"), false);
  assert.strictEqual(excludePlayersList.children.length, 2);
  assert(excludePlayersList.children[0].innerHTML.includes("Ana"));
  closeExcludeSinglesModal();
  assert.strictEqual(excludeSinglesModal.classList.contains("hidden"), true);

  // Pairing swap modal and confirm swap
  const swapModal = document._setElement("pairing-swap-modal", createMockElement("div"));
  swapModal.classList.add("hidden");
  const slotA = document._setElement("swap-slot-a", createMockElement("select"));
  const slotB = document._setElement("swap-slot-b", createMockElement("select"));
  state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C"), new Team("D", "D")];
  state.currentRound = 1;
  state.rounds = [
  {
    matches: [
      { table: 1, teamA: "A", teamB: "B", isBye: false, results: ["1-0", "0-1"] },
      { table: 2, teamA: "C", teamB: "D", isBye: false, results: ["0.5-0.5", "1-0"] },
    ],
  },
  ];
  openPairingSwapModal();
  assert.strictEqual(swapModal.classList.contains("hidden"), false);
  assert.strictEqual(slotA.children.length, 4);
  assert.strictEqual(slotB.children.length, 4);

  slotA.value = "0:teamA";
  slotB.value = "1:teamB";
  commitCalls = 0;
  saveCalls = 0;
  renderAllCalls = 0;
  showSectionCalls = [];
  rebuildCalls = 0;
  confirmPairingSwap();
  assert.strictEqual(commitCalls, 1);
  assert.strictEqual(rebuildCalls, 1);
  assert.strictEqual(saveCalls, 1);
  assert.strictEqual(renderAllCalls, 1);
  assert.deepStrictEqual(showSectionCalls, ["pairings"]);
  assert.strictEqual(state.rounds[0].matches[0].teamA, "D");
  assert.strictEqual(state.rounds[0].matches[1].teamB, "A");
  assert.deepStrictEqual(state.rounds[0].matches[0].results, new Array(state.config.boardsPerMatch).fill(null));
  assert.deepStrictEqual(state.rounds[0].matches[1].results, new Array(state.config.boardsPerMatch).fill(null));

  // confirmPairingSwap validation
  slotA.value = "0:teamA";
  slotB.value = "0:teamA";
  confirmPairingSwap();
  assert(alertMessage.innerText.includes("unterschiedliche Slots"));

  console.log("=== UI INTERACTIONS TESTS END ===");
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
