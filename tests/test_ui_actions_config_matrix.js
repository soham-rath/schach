const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createMockElement,
  createStorage,
} = require("./lib/helpers");

global.window = {
  scrollTo: () => {},
};
const document = createMockDocument();
global.document = document;
global.localStorage = createStorage().api;

let alertCalls = [];
let toastCalls = [];
let commitCalls = 0;
let saveCalls = 0;
let updateNavCalls = 0;
let lockSetupCalls = 0;
let showExcludeModalCalls = 0;
let showExcludeSinglesModalCalls = 0;
let closeExcludeModalCalls = 0;
let closeExcludeSinglesModalCalls = 0;
let showForcedPairingModalCalls = 0;
let showForcedPairingSinglesModalCalls = 0;
let closeForcedPairingModalCalls = 0;
let closeForcedPairingSinglesModalCalls = 0;
let generatePairingsCalls = 0;
let generatePairingsSinglesCalls = 0;
let showSectionCalls = [];
let renderAllCalls = 0;
let renderResultsCalls = 0;
let renderStandingsCalls = 0;
let renderDashboardCalls = 0;
let renderStandingsSinglesCalls = 0;
let checkRoundCompletenessCalls = 0;
let applyRulesPresetCalls = [];
let calculateStandingsCalls = 0;
let calculateStandingsSinglesCalls = 0;

function resetSpies() {
  alertCalls = [];
  toastCalls = [];
  commitCalls = 0;
  saveCalls = 0;
  updateNavCalls = 0;
  lockSetupCalls = 0;
  showExcludeModalCalls = 0;
  showExcludeSinglesModalCalls = 0;
  closeExcludeModalCalls = 0;
  closeExcludeSinglesModalCalls = 0;
  showForcedPairingModalCalls = 0;
  showForcedPairingSinglesModalCalls = 0;
  closeForcedPairingModalCalls = 0;
  closeForcedPairingSinglesModalCalls = 0;
  generatePairingsCalls = 0;
  generatePairingsSinglesCalls = 0;
  showSectionCalls = [];
  renderAllCalls = 0;
  renderResultsCalls = 0;
  renderStandingsCalls = 0;
  renderDashboardCalls = 0;
  renderStandingsSinglesCalls = 0;
  checkRoundCompletenessCalls = 0;
  applyRulesPresetCalls = [];
  calculateStandingsCalls = 0;
  calculateStandingsSinglesCalls = 0;
}

global.showAlert = (...args) => {
  alertCalls.push(args);
};
global.showToast = (...args) => {
  toastCalls.push(args);
};
global.commitState = () => {
  commitCalls += 1;
};
global.saveState = async () => {
  saveCalls += 1;
};
global.updateNavigation = () => {
  updateNavCalls += 1;
};
global.lockSetup = () => {
  lockSetupCalls += 1;
};
global.showExcludeModal = () => {
  showExcludeModalCalls += 1;
};
global.showExcludeSinglesModal = () => {
  showExcludeSinglesModalCalls += 1;
};
global.closeExcludeModal = () => {
  closeExcludeModalCalls += 1;
};
global.closeExcludeSinglesModal = () => {
  closeExcludeSinglesModalCalls += 1;
};
global.showForcedPairingModal = () => {
  showForcedPairingModalCalls += 1;
};
global.showForcedPairingSinglesModal = () => {
  showForcedPairingSinglesModalCalls += 1;
};
global.closeForcedPairingModal = () => {
  closeForcedPairingModalCalls += 1;
};
global.closeForcedPairingSinglesModal = () => {
  closeForcedPairingSinglesModalCalls += 1;
};
global.generatePairings = () => {
  generatePairingsCalls += 1;
};
global.generatePairingsSingles = () => {
  generatePairingsSinglesCalls += 1;
};
global.showSection = (id) => {
  showSectionCalls.push(id);
};
global.renderAll = () => {
  renderAllCalls += 1;
};
global.renderSetup = () => {};
global.renderSetupSingles = () => {};
global.renderResults = () => {
  renderResultsCalls += 1;
};
global.renderStandings = () => {
  renderStandingsCalls += 1;
};
global.renderDashboard = () => {
  renderDashboardCalls += 1;
};
global.renderResultsSingles = () => {};
global.renderStandingsSingles = () => {
  renderStandingsSinglesCalls += 1;
};
global.checkSinglesRoundCompleteness = () => {};
global.checkRoundCompleteness = () => {
  checkRoundCompletenessCalls += 1;
};
global.calculateStandings = () => {
  calculateStandingsCalls += 1;
};
global.calculateStandingsSingles = () => {
  calculateStandingsSinglesCalls += 1;
};
global.getTournamentList = () => [];
global.createNewTournament = () => {};
global.switchTournament = () => true;
global.deleteTournament = () => true;
global.confirm = () => true;
global.showConfirm = async () => true;
global.applyRulesPreset = (preset) => {
  applyRulesPresetCalls.push(preset);
  const cfg = RULES_PRESETS[preset];
  if (!cfg) return;
  state.config.pointsMatchWin = cfg.pointsMatchWin;
  state.config.pointsMatchDraw = cfg.pointsMatchDraw;
  state.config.pointsMatchLoss = cfg.pointsMatchLoss;
  state.config.pointsBye = cfg.pointsBye;
};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/ui/actions.js");

function resetStateFixture() {
  state = {
    config: {
      name: "Team Cup",
      type: "SWISS",
      totalRounds: 5,
      boardsPerMatch: 4,
      pointsMatchWin: 2,
      pointsMatchDraw: 1,
      pointsMatchLoss: 0,
      pointsBye: 2,
      rulesPreset: "CUSTOM",
    },
    mode: "TEAM",
    singles: {
      config: {
        name: "Singles Cup",
        type: "SWISS",
        totalRounds: 5,
        pointsWin: 1,
        pointsDraw: 0.5,
        pointsLoss: 0,
        pointsBye: 1,
      },
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
}

const tournamentNameInput = document._setElement(
  "tournament-name",
  createMockElement("input"),
);
const totalRoundsInput = document._setElement(
  "total-rounds",
  createMockElement("input"),
);
const boardsCountInput = document._setElement(
  "boards-count",
  createMockElement("input"),
);
const pointsWinInput = document._setElement("points-win", createMockElement("input"));
const pointsDrawInput = document._setElement(
  "points-draw",
  createMockElement("input"),
);
const rulesPresetSelect = document._setElement(
  "rules-preset",
  createMockElement("select"),
);
const pairingSystemSelect = document._setElement(
  "pairing-system",
  createMockElement("select"),
);

const singlesNameInput = document._setElement(
  "tournament-name-singles",
  createMockElement("input"),
);
const singlesRoundsInput = document._setElement(
  "total-rounds-singles",
  createMockElement("input"),
);
const singlesWinInput = document._setElement(
  "points-win-singles",
  createMockElement("input"),
);
const singlesDrawInput = document._setElement(
  "points-draw-singles",
  createMockElement("input"),
);
const singlesPairingSelect = document._setElement(
  "pairing-system-singles",
  createMockElement("select"),
);

console.log("=== UI ACTIONS CONFIG MATRIX TESTS START ===");

// startTournament: SWISS branch (show exclude modal)
resetSpies();
resetStateFixture();
state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C"), new Team("D", "D")];
tournamentNameInput.value = "Swiss Team Event";
totalRoundsInput.value = "9";
boardsCountInput.value = "6";
pointsWinInput.value = "3";
pointsDrawInput.value = "1.5";
rulesPresetSelect.value = "CUSTOM";
pairingSystemSelect.value = "SWISS";
startTournament();

assert.strictEqual(state.status, "RUNNING");
assert.strictEqual(state.config.name, "Swiss Team Event");
assert.strictEqual(state.config.type, "SWISS");
assert.strictEqual(state.config.totalRounds, 9);
assert.strictEqual(state.config.boardsPerMatch, 6);
assert.strictEqual(state.config.pointsMatchWin, 3);
assert.strictEqual(state.config.pointsMatchDraw, 1.5);
assert.strictEqual(state.config.pointsMatchLoss, 0);
assert.strictEqual(state.config.pointsBye, 3);
assert.strictEqual(commitCalls, 1);
assert.strictEqual(lockSetupCalls, 1);
assert.strictEqual(updateNavCalls, 1);
assert.strictEqual(showExcludeModalCalls, 1);
assert.strictEqual(generatePairingsCalls, 0);

// startTournament: ROUND_ROBIN branch (auto rounds + immediate pairing)
resetSpies();
resetStateFixture();
state.teams = [
  new Team("A", "A"),
  new Team("B", "B"),
  new Team("C", "C"),
  new Team("D", "D"),
  new Team("E", "E"),
];
tournamentNameInput.value = "RR Team Event";
totalRoundsInput.value = "2";
boardsCountInput.value = "4";
pointsWinInput.value = "7";
pointsDrawInput.value = "3";
rulesPresetSelect.value = "FIDE";
pairingSystemSelect.value = "ROUND_ROBIN";
startTournament();

assert.strictEqual(state.status, "RUNNING");
assert.strictEqual(state.config.type, "ROUND_ROBIN");
assert.strictEqual(state.config.totalRounds, 5);
assert.deepStrictEqual(state.excludedTeamsThisRound, []);
assert.deepStrictEqual(applyRulesPresetCalls, ["FIDE"]);
assert.strictEqual(generatePairingsCalls, 1);
assert.strictEqual(showExcludeModalCalls, 0);
assert.deepStrictEqual(showSectionCalls, ["pairings"]);
assert.strictEqual(renderAllCalls, 1);

// startSinglesTournament: SWISS branch
resetSpies();
resetStateFixture();
state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3")];
singlesNameInput.value = "Swiss Singles Event";
singlesRoundsInput.value = "8";
singlesWinInput.value = "1.5";
singlesDrawInput.value = "0.75";
singlesPairingSelect.value = "SWISS";
startSinglesTournament();

assert.strictEqual(state.singles.status, "RUNNING");
assert.strictEqual(state.singles.config.name, "Swiss Singles Event");
assert.strictEqual(state.singles.config.type, "SWISS");
assert.strictEqual(state.singles.config.totalRounds, 8);
assert.strictEqual(state.singles.config.pointsWin, 1.5);
assert.strictEqual(state.singles.config.pointsDraw, 0.75);
assert.strictEqual(state.singles.config.pointsLoss, 0);
assert.strictEqual(state.singles.config.pointsBye, 1.5);
assert.strictEqual(showExcludeSinglesModalCalls, 1);
assert.strictEqual(generatePairingsSinglesCalls, 0);

// startSinglesTournament: ROUND_ROBIN branch
resetSpies();
resetStateFixture();
state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3"), new Player("P4", "P4")];
singlesNameInput.value = "RR Singles Event";
singlesRoundsInput.value = "10";
singlesWinInput.value = "1";
singlesDrawInput.value = "0.5";
singlesPairingSelect.value = "ROUND_ROBIN";
startSinglesTournament();

assert.strictEqual(state.singles.status, "RUNNING");
assert.strictEqual(state.singles.config.type, "ROUND_ROBIN");
assert.strictEqual(state.singles.config.totalRounds, 3);
assert.deepStrictEqual(state.singles.excludedPlayersThisRound, []);
assert.strictEqual(generatePairingsSinglesCalls, 1);
assert.deepStrictEqual(showSectionCalls, ["pairings"]);
assert.strictEqual(renderAllCalls, 1);

// confirmExcludeAndPair: ROUND_ROBIN direct branch
resetSpies();
resetStateFixture();
state.config.type = "ROUND_ROBIN";
confirmExcludeAndPair();
assert.deepStrictEqual(state.excludedTeamsThisRound, []);
assert.strictEqual(closeExcludeModalCalls, 1);
assert.strictEqual(generatePairingsCalls, 1);
assert.deepStrictEqual(showSectionCalls, ["pairings"]);

// confirmExcludeAndPair: SWISS invalid exclusion count
resetSpies();
resetStateFixture();
state.teams = [new Team("A", "A"), new Team("B", "B")];
state.config.type = "SWISS";
const ex1 = createMockElement("input");
ex1.value = "A";
const ex2 = createMockElement("input");
ex2.value = "B";
document._setQuerySelectorAll(
  '#exclude-teams-list input[type="checkbox"]:checked',
  [ex1, ex2],
);
confirmExcludeAndPair();
assert.strictEqual(generatePairingsCalls, 0);
assert.strictEqual(alertCalls.length, 1);

// confirmExcludeAndPair: SWISS valid exclusion set
resetSpies();
resetStateFixture();
state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C")];
state.config.type = "SWISS";
const ex3 = createMockElement("input");
ex3.value = "C";
document._setQuerySelectorAll(
  '#exclude-teams-list input[type="checkbox"]:checked',
  [ex3],
);
confirmExcludeAndPair();
assert.strictEqual(showForcedPairingModalCalls, 1);
// Confirm empty forced-pair list to generate pairings.
const forcedList = createMockElement("div");
document._setElement("forced-pairs-list", forcedList);
confirmForcedPairsAndGenerate();
assert.deepStrictEqual(state.excludedTeamsThisRound, ["C"]);
assert.strictEqual(closeExcludeModalCalls, 1);
assert.strictEqual(generatePairingsCalls, 1);

// confirmExcludeSinglesAndPair: ROUND_ROBIN direct branch
resetSpies();
resetStateFixture();
state.singles.config.type = "ROUND_ROBIN";
confirmExcludeSinglesAndPair();
assert.deepStrictEqual(state.singles.excludedPlayersThisRound, []);
assert.strictEqual(closeExcludeSinglesModalCalls, 1);
assert.strictEqual(generatePairingsSinglesCalls, 1);

// confirmExcludeSinglesAndPair: SWISS invalid/valid paths
resetSpies();
resetStateFixture();
state.singles.config.type = "SWISS";
state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2")];
const pEx1 = createMockElement("input");
pEx1.value = "P1";
const pEx2 = createMockElement("input");
pEx2.value = "P2";
document._setQuerySelectorAll(
  '#exclude-players-list input[type="checkbox"]:checked',
  [pEx1, pEx2],
);
confirmExcludeSinglesAndPair();
assert.strictEqual(showForcedPairingSinglesModalCalls, 0);
assert.strictEqual(generatePairingsSinglesCalls, 0);
assert.strictEqual(alertCalls.length, 1);

resetSpies();
resetStateFixture();
state.singles.config.type = "SWISS";
state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3")];
const pEx3 = createMockElement("input");
pEx3.value = "P3";
document._setQuerySelectorAll(
  '#exclude-players-list input[type="checkbox"]:checked',
  [pEx3],
);
confirmExcludeSinglesAndPair();
assert.strictEqual(showForcedPairingSinglesModalCalls, 1);
// Confirm empty forced-pair list to generate pairings.
const forcedSinglesList = createMockElement("div");
document._setElement("forced-pairs-singles-list", forcedSinglesList);
confirmForcedSinglesPairsAndGenerate();
assert.deepStrictEqual(state.singles.excludedPlayersThisRound, ["P3"]);
assert.strictEqual(closeExcludeSinglesModalCalls, 1);
assert.strictEqual(generatePairingsSinglesCalls, 1);

async function runAsyncChecks() {
  // nextRound: no current round
  resetSpies();
  resetStateFixture();
  await nextRound();
  assert.strictEqual(alertCalls.length, 1);
  assert(alertCalls[0][0].includes("Keine aktuelle Runde"));

  // nextRound: incomplete and confirmation rejected
  resetSpies();
  resetStateFixture();
  state.currentRound = 1;
  state.config.totalRounds = 3;
  state.config.type = "SWISS";
  state.rounds = [{ matches: [{ isBye: false, results: ["1-0", null] }] }];
  global.showConfirm = async () => false;
  await nextRound();
  assert.strictEqual(state.rounds[0].matches[0].results[1], null);
  assert.strictEqual(showExcludeModalCalls, 0);

  // nextRound: incomplete and confirmation accepted (Swiss path)
  resetSpies();
  resetStateFixture();
  state.currentRound = 1;
  state.config.totalRounds = 3;
  state.config.type = "SWISS";
  state.rounds = [{ matches: [{ isBye: false, results: ["1-0", null] }] }];
  global.showConfirm = async () => true;
  await nextRound();
  assert.strictEqual(state.rounds[0].matches[0].results[1], "0-0");
  assert.strictEqual(commitCalls, 1);
  assert.strictEqual(showExcludeModalCalls, 1);
  assert.strictEqual(calculateStandingsCalls > 0, true);

  // nextRound: final round branch
  resetSpies();
  resetStateFixture();
  state.currentRound = 2;
  state.config.totalRounds = 2;
  state.rounds = [{ matches: [] }, { matches: [{ isBye: false, results: ["1-0"] }] }];
  await nextRound();
  assert.strictEqual(state.status, "FINISHED");
  assert.strictEqual(renderStandingsCalls, 1);
  assert.deepStrictEqual(showSectionCalls, ["standings"]);

  // nextRound: ROUND_ROBIN branch
  resetSpies();
  resetStateFixture();
  state.currentRound = 1;
  state.config.totalRounds = 3;
  state.config.type = "ROUND_ROBIN";
  state.rounds = [{ matches: [{ isBye: false, results: ["1-0"] }] }];
  await nextRound();
  assert.deepStrictEqual(state.excludedTeamsThisRound, []);
  assert.strictEqual(generatePairingsCalls, 1);
  assert.deepStrictEqual(showSectionCalls, ["pairings"]);

  // nextSinglesRound: no current round
  resetSpies();
  resetStateFixture();
  await nextSinglesRound();
  assert.strictEqual(alertCalls.length, 1);
  assert(alertCalls[0][0].includes("Keine aktuelle Runde"));

  // nextSinglesRound: final round branch
  resetSpies();
  resetStateFixture();
  state.singles.currentRound = 2;
  state.singles.config.totalRounds = 2;
  state.singles.rounds = [{ matches: [] }, { matches: [{ isBye: false, result: "1-0" }] }];
  await nextSinglesRound();
  assert.strictEqual(state.singles.status, "FINISHED");
  assert.strictEqual(renderStandingsSinglesCalls, 1);
  assert.deepStrictEqual(showSectionCalls, ["standings"]);

  // nextSinglesRound: ROUND_ROBIN branch
  resetSpies();
  resetStateFixture();
  state.singles.currentRound = 1;
  state.singles.config.totalRounds = 3;
  state.singles.config.type = "ROUND_ROBIN";
  state.singles.rounds = [{ matches: [{ isBye: false, result: "0-1" }] }];
  await nextSinglesRound();
  assert.deepStrictEqual(state.singles.excludedPlayersThisRound, []);
  assert.strictEqual(generatePairingsSinglesCalls, 1);
  assert.deepStrictEqual(showSectionCalls, ["pairings"]);

  // nextSinglesRound: Swiss branch
  resetSpies();
  resetStateFixture();
  state.singles.currentRound = 1;
  state.singles.config.totalRounds = 3;
  state.singles.config.type = "SWISS";
  state.singles.rounds = [{ matches: [{ isBye: false, result: "0-1" }] }];
  await nextSinglesRound();
  assert.strictEqual(showExcludeSinglesModalCalls, 1);

  // addExtraRound: ROUND_ROBIN guard
  resetSpies();
  resetStateFixture();
  state.config.type = "ROUND_ROBIN";
  state.config.totalRounds = 4;
  addExtraRound();
  assert.strictEqual(state.config.totalRounds, 4);
  assert.strictEqual(alertCalls.length, 1);

  // addExtraRound: Swiss increment path
  resetSpies();
  resetStateFixture();
  state.config.type = "SWISS";
  state.config.totalRounds = 4;
  totalRoundsInput.value = "4";
  addExtraRound();
  assert.strictEqual(state.config.totalRounds, 5);
  assert.strictEqual(totalRoundsInput.value, 5);
  assert.strictEqual(state.status, "RUNNING");
  assert.strictEqual(showExcludeModalCalls, 1);
  assert.strictEqual(renderAllCalls, 1);

  // updateSettings: block board reduction with recorded results
  resetSpies();
  resetStateFixture();
  state.currentRound = 1;
  state.config.boardsPerMatch = 4;
  state.rounds = [
    {
      matches: [{ isBye: false, results: ["1-0", "0-1", "1-0", null] }],
    },
  ];
  tournamentNameInput.value = "Team Cup";
  totalRoundsInput.value = "5";
  pairingSystemSelect.value = "SWISS";
  boardsCountInput.value = "2";
  rulesPresetSelect.value = "CUSTOM";
  pointsWinInput.value = "2";
  pointsDrawInput.value = "1";
  updateSettings();
  assert.strictEqual(alertCalls.length, 1);
  assert.strictEqual(boardsCountInput.value, 4);
  assert.strictEqual(commitCalls, 0);

  // updateSettings: ROUND_ROBIN rounds + custom scoring
  resetSpies();
  resetStateFixture();
  state.currentRound = 2;
  state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C"), new Team("D", "D"), new Team("E", "E")];
  state.rounds = [{ matches: [{ isBye: false, results: [null, null, null, null] }] }];
  state.config.boardsPerMatch = 4;
  tournamentNameInput.value = "Updated Team Cup";
  totalRoundsInput.value = "1";
  pairingSystemSelect.value = "ROUND_ROBIN";
  boardsCountInput.value = "3";
  rulesPresetSelect.value = "CUSTOM";
  pointsWinInput.value = "4";
  pointsDrawInput.value = "2";
  updateSettings();
  assert.strictEqual(state.config.name, "Updated Team Cup");
  assert.strictEqual(state.config.type, "ROUND_ROBIN");
  assert.strictEqual(state.config.totalRounds, 5);
  assert.strictEqual(state.config.boardsPerMatch, 3);
  assert.strictEqual(state.config.pointsMatchWin, 4);
  assert.strictEqual(state.config.pointsMatchDraw, 2);
  assert.strictEqual(state.config.pointsMatchLoss, 0);
  assert.strictEqual(state.config.pointsBye, 4);
  assert.strictEqual(state.rounds[0].matches[0].results.length, 3);
  assert.strictEqual(toastCalls.length, 1);

  // updateSettings: preset branch delegates to applyRulesPreset
  resetSpies();
  resetStateFixture();
  tournamentNameInput.value = "Preset Cup";
  totalRoundsInput.value = "6";
  pairingSystemSelect.value = "SWISS";
  boardsCountInput.value = "4";
  rulesPresetSelect.value = "USCF";
  pointsWinInput.value = "8";
  pointsDrawInput.value = "4";
  updateSettings();
  assert.deepStrictEqual(applyRulesPresetCalls, ["USCF"]);

  // updateMatchResult: updates board, recalculates and rerenders
  resetSpies();
  resetStateFixture();
  state.currentRound = 1;
  state.rounds = [
    {
      matches: [{ isBye: false, results: [null, null] }],
    },
  ];
  await updateMatchResult(1, 0, 1, "1-0");
  assert.strictEqual(state.rounds[0].matches[0].results[1], "1-0");
  assert.strictEqual(checkRoundCompletenessCalls, 1);
  assert.strictEqual(renderResultsCalls, 1);
  assert.strictEqual(renderStandingsCalls, 1);
  assert.strictEqual(renderDashboardCalls, 1);
  assert.strictEqual(calculateStandingsCalls, 1);

  console.log("=== UI ACTIONS CONFIG MATRIX TESTS END ===");
}

runAsyncChecks().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
