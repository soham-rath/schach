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
let generatePairingsCalls = 0;
let generatePairingsSinglesCalls = 0;
let showSectionCalls = [];
let renderAllCalls = 0;
let renderSetupCalls = 0;
let renderSetupSinglesCalls = 0;
let renderResultsCalls = [];
let renderStandingsCalls = 0;
let renderDashboardCalls = 0;
let renderResultsSinglesCalls = 0;
let renderStandingsSinglesCalls = 0;
let checkRoundCompletenessCalls = 0;
let checkSinglesRoundCompletenessCalls = 0;
let calculateStandingsCalls = 0;
let calculateStandingsSinglesCalls = 0;
let applyRulesPresetCalls = [];
let createNewTournamentCalls = [];
let switchTournamentCalls = [];
let deleteTournamentCalls = [];
let getTournamentListValue = [];
let confirmValue = true;
let showConfirmValue = true;

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
  generatePairingsCalls = 0;
  generatePairingsSinglesCalls = 0;
  showSectionCalls = [];
  renderAllCalls = 0;
  renderSetupCalls = 0;
  renderSetupSinglesCalls = 0;
  renderResultsCalls = [];
  renderStandingsCalls = 0;
  renderDashboardCalls = 0;
  renderResultsSinglesCalls = 0;
  renderStandingsSinglesCalls = 0;
  checkRoundCompletenessCalls = 0;
  checkSinglesRoundCompletenessCalls = 0;
  calculateStandingsCalls = 0;
  calculateStandingsSinglesCalls = 0;
  applyRulesPresetCalls = [];
  createNewTournamentCalls = [];
  switchTournamentCalls = [];
  deleteTournamentCalls = [];
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
global.renderSetup = () => {
  renderSetupCalls += 1;
};
global.renderSetupSingles = () => {
  renderSetupSinglesCalls += 1;
};
global.renderResults = (roundNum) => {
  renderResultsCalls.push(roundNum);
};
global.renderStandings = () => {
  renderStandingsCalls += 1;
};
global.renderDashboard = () => {
  renderDashboardCalls += 1;
};
global.renderResultsSingles = () => {
  renderResultsSinglesCalls += 1;
};
global.renderStandingsSingles = () => {
  renderStandingsSinglesCalls += 1;
};
global.checkRoundCompleteness = () => {
  checkRoundCompletenessCalls += 1;
};
global.checkSinglesRoundCompleteness = () => {
  checkSinglesRoundCompletenessCalls += 1;
};
global.calculateStandings = () => {
  calculateStandingsCalls += 1;
};
global.calculateStandingsSingles = () => {
  calculateStandingsSinglesCalls += 1;
};
global.getTournamentList = () => getTournamentListValue;
global.createNewTournament = (...args) => {
  createNewTournamentCalls.push(args);
};
global.switchTournament = (...args) => {
  switchTournamentCalls.push(args);
  return true;
};
global.deleteTournament = (...args) => {
  deleteTournamentCalls.push(args);
  return true;
};
global.confirm = () => confirmValue;
global.showConfirm = async () => showConfirmValue;
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
    id: "tour_active",
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

// Base DOM fixtures
const themeToggle = document._setElement("theme-toggle", createMockElement("button"));
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

const resetModal = document._setElement("reset-options-modal", createMockElement("div"));
const resetMessage = document._setElement(
  "reset-options-message",
  createMockElement("div"),
);
const tournamentList = document._setElement("tournament-list", createMockElement("ul"));
const tournamentManagerModal = document._setElement(
  "tournament-manager-modal",
  createMockElement("div"),
);

tournamentManagerModal.classList.add("hidden");

console.log("=== UI ACTIONS EXTENDED TESTS START ===");

(async function run() {
  // initTheme/applyTheme
  resetStateFixture();
  state.theme = "";
  initTheme();
  assert.strictEqual(state.theme, "dark");
  assert.strictEqual(document.documentElement.getAttribute("data-theme"), "dark");
  assert.strictEqual(themeToggle.innerText, "☀️");
  state.theme = "light";
  applyTheme();
  assert.strictEqual(document.documentElement.getAttribute("data-theme"), "light");
  assert.strictEqual(themeToggle.innerText, "🌙");

  // edit/save team paths
  resetSpies();
  resetStateFixture();
  state.teams = [new Team("Alpha", "T1"), new Team("Bravo", "T2")];
  const teamDisplay = document._setElement("name-display-T1", createMockElement("span"));
  const teamInput = document._setElement("name-input-T1", createMockElement("input"));
  let teamFocused = false;
  teamInput.focus = () => {
    teamFocused = true;
  };
  editTeam("T1");
  assert.strictEqual(teamDisplay.style.display, "none");
  assert.strictEqual(teamInput.style.display, "block");
  assert.strictEqual(teamFocused, true);

  teamInput.value = "Bravo";
  saveTeamName("T1");
  assert.strictEqual(alertCalls.length, 1);
  assert.strictEqual(commitCalls, 0);
  assert.strictEqual(renderSetupCalls > 0, true);

  resetSpies();
  teamInput.value = "Alpha Prime";
  saveTeamName("T1");
  assert.strictEqual(getTeam("T1").name, "Alpha Prime");
  assert.strictEqual(commitCalls, 1);
  assert.strictEqual(saveCalls, 1);
  assert.strictEqual(renderAllCalls, 1);

  // edit/save player paths
  resetSpies();
  resetStateFixture();
  state.singles.players = [new Player("Nina", "P1"), new Player("Omar", "P2")];
  const playerDisplay = document._setElement("pname-display-P1", createMockElement("span"));
  const playerInput = document._setElement("pname-input-P1", createMockElement("input"));
  let playerFocused = false;
  playerInput.focus = () => {
    playerFocused = true;
  };
  editPlayer("P1");
  assert.strictEqual(playerDisplay.style.display, "none");
  assert.strictEqual(playerInput.style.display, "block");
  assert.strictEqual(playerFocused, true);

  playerInput.value = "Omar";
  savePlayerName("P1");
  assert.strictEqual(alertCalls.length, 1);
  assert.strictEqual(commitCalls, 0);

  resetSpies();
  playerInput.value = "Nina Prime";
  savePlayerName("P1");
  assert.strictEqual(getPlayer("P1").name, "Nina Prime");
  assert.strictEqual(commitCalls, 1);
  assert.strictEqual(saveCalls, 1);
  assert.strictEqual(renderAllCalls, 1);

  // start guards
  resetSpies();
  resetStateFixture();
  state.teams = [new Team("Solo", "S")];
  startTournament();
  assert.strictEqual(alertCalls.length, 1);
  assert.strictEqual(commitCalls, 0);

  resetSpies();
  resetStateFixture();
  state.singles.players = [new Player("Solo", "P1")];
  startSinglesTournament();
  assert.strictEqual(alertCalls.length, 1);
  assert.strictEqual(commitCalls, 0);

  // startTournament round-robin even team count
  resetSpies();
  resetStateFixture();
  state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C"), new Team("D", "D")];
  tournamentNameInput.value = "RR Even";
  totalRoundsInput.value = "99";
  boardsCountInput.value = "4";
  rulesPresetSelect.value = "USCF";
  pairingSystemSelect.value = "ROUND_ROBIN";
  startTournament();
  assert.strictEqual(state.config.totalRounds, 3);
  assert.strictEqual(state.config.type, "ROUND_ROBIN");
  assert.deepStrictEqual(applyRulesPresetCalls, ["USCF"]);
  assert.strictEqual(generatePairingsCalls, 1);
  assert.strictEqual(showExcludeModalCalls, 0);

  // startSinglesTournament round-robin odd player count
  resetSpies();
  resetStateFixture();
  state.singles.players = [
    new Player("P1", "P1"),
    new Player("P2", "P2"),
    new Player("P3", "P3"),
    new Player("P4", "P4"),
    new Player("P5", "P5"),
  ];
  singlesNameInput.value = "RR Odd Singles";
  singlesRoundsInput.value = "99";
  singlesWinInput.value = "3";
  singlesDrawInput.value = "1";
  singlesPairingSelect.value = "ROUND_ROBIN";
  startSinglesTournament();
  assert.strictEqual(state.singles.config.totalRounds, 5);
  assert.strictEqual(state.singles.config.type, "ROUND_ROBIN");
  assert.strictEqual(generatePairingsSinglesCalls, 1);
  assert.strictEqual(showExcludeSinglesModalCalls, 0);

  // nextSinglesRound incomplete confirmation branches
  resetSpies();
  resetStateFixture();
  state.singles.currentRound = 1;
  state.singles.config.totalRounds = 3;
  state.singles.config.type = "SWISS";
  state.singles.rounds = [{ matches: [{ isBye: false, result: null }] }];
  showConfirmValue = false;
  await nextSinglesRound();
  assert.strictEqual(showExcludeSinglesModalCalls, 0);

  resetSpies();
  state.singles.currentRound = 1;
  state.singles.config.totalRounds = 3;
  state.singles.config.type = "SWISS";
  state.singles.rounds = [{ matches: [{ isBye: false, result: null }] }];
  showConfirmValue = true;
  await nextSinglesRound();
  assert.strictEqual(showExcludeSinglesModalCalls, 1);

  // updateMatchResult: non-current round should skip completeness check
  resetSpies();
  resetStateFixture();
  state.currentRound = 2;
  state.rounds = [
    { matches: [{ isBye: false, results: [null, null] }] },
    { matches: [{ isBye: false, results: [null, null] }] },
  ];
  await updateMatchResult(1, 0, 1, "1-0");
  assert.strictEqual(state.rounds[0].matches[0].results[1], "1-0");
  assert.strictEqual(checkRoundCompletenessCalls, 0);
  assert.deepStrictEqual(renderResultsCalls, [1]);

  // updateMatchResult: invalid indices should keep results unchanged
  resetSpies();
  const before = state.rounds[0].matches[0].results.slice();
  await updateMatchResult(1, 0, 9, "0-1");
  assert.deepStrictEqual(state.rounds[0].matches[0].results, before);

  // reset modal helpers
  resetSpies();
  resetStateFixture();
  resetModal.classList.add("hidden");
  state.mode = "TEAM";
  resetTournament();
  assert.strictEqual(resetModal.classList.contains("hidden"), false);
  assert(resetMessage.innerText.includes("Mannschaften"));

  state.mode = "SINGLES";
  resetTournament();
  assert(resetMessage.innerText.includes("Spieler"));
  closeResetOptionsModal();
  assert.strictEqual(resetModal.classList.contains("hidden"), true);

  // resetRemoveRoster
  resetSpies();
  resetStateFixture();
  showConfirmValue = false;
  resetRemoveRoster();
  await Promise.resolve();
  assert.strictEqual(createNewTournamentCalls.length, 0);

  showConfirmValue = true;
  resetRemoveRoster();
  await Promise.resolve();
  assert.strictEqual(createNewTournamentCalls.length, 1);
  assert.deepStrictEqual(createNewTournamentCalls[0], [true]);

  // resetKeepRoster TEAM branch
  resetSpies();
  resetStateFixture();
  state.mode = "TEAM";
  state.status = "RUNNING";
  state.currentRound = 2;
  state.excludedTeamsThisRound = ["A"];
  state.teams = [new Team("A", "A")];
  state.teams[0].mp = 7;
  state.teams[0].bp = 5;
  state.teams[0].buchholz = 3;
  state.teams[0].medianBuchholz = 2;
  state.teams[0].sonnebornBerger = 1;
  state.teams[0].opponents = ["B"];
  state.rounds = [{ matches: [{ isBye: false, results: ["1-0"] }] }];
  resetKeepRoster();
  assert.strictEqual(state.status, "SETUP");
  assert.strictEqual(state.currentRound, 0);
  assert.deepStrictEqual(state.rounds, []);
  assert.deepStrictEqual(state.excludedTeamsThisRound, []);
  assert.strictEqual(state.teams[0].mp, 0);
  assert.strictEqual(state.teams[0].bp, 0);
  assert.strictEqual(state.teams[0].opponents.length, 0);
  assert.strictEqual(renderSetupCalls, 1);
  assert.deepStrictEqual(showSectionCalls, ["setup"]);

  // resetKeepRoster SINGLES branch
  resetSpies();
  resetStateFixture();
  state.mode = "SINGLES";
  state.singles.status = "RUNNING";
  state.singles.currentRound = 2;
  state.singles.excludedPlayersThisRound = ["P1"];
  state.singles.players = [new Player("P1", "P1")];
  state.singles.players[0].mp = 3;
  state.singles.players[0].buchholz = 1;
  state.singles.players[0].opponents = ["P2"];
  state.singles.rounds = [{ matches: [{ isBye: false, result: "1-0" }] }];
  resetKeepRoster();
  assert.strictEqual(state.singles.status, "SETUP");
  assert.strictEqual(state.singles.currentRound, 0);
  assert.deepStrictEqual(state.singles.rounds, []);
  assert.deepStrictEqual(state.singles.excludedPlayersThisRound, []);
  assert.strictEqual(state.singles.players[0].mp, 0);
  assert.strictEqual(state.singles.players[0].buchholz, 0);
  assert.strictEqual(state.singles.players[0].opponents.length, 0);
  assert.strictEqual(renderSetupSinglesCalls, 1);

  // tournament manager open/close
  resetSpies();
  resetStateFixture();
  getTournamentListValue = [
    { id: "old", name: "Old Cup", mode: "TEAM", lastModified: 100 },
    { id: "tour_active", name: "Active Cup", mode: "SINGLES", lastModified: 200 },
    { id: "new", name: "New Cup", mode: "TEAM", lastModified: 300 },
  ];
  openTournamentManager();
  assert.strictEqual(tournamentManagerModal.classList.contains("hidden"), false);
  assert.strictEqual(tournamentList.children.length, 3);
  assert(tournamentList.children[0].innerHTML.includes("New Cup"));
  assert(tournamentList.children[1].innerHTML.includes("Active Cup"));
  assert(tournamentList.children[1].innerHTML.includes("(Aktiv)"));
  closeTournamentManager();
  assert.strictEqual(tournamentManagerModal.classList.contains("hidden"), true);

  // create/delete tournament UI helpers
  resetSpies();
  confirmValue = false;
  createNewTournamentUI();
  assert.strictEqual(createNewTournamentCalls.length, 0);

  confirmValue = true;
  createNewTournamentUI();
  assert.strictEqual(createNewTournamentCalls.length, 1);

  confirmValue = false;
  deleteTournamentUI("old");
  assert.strictEqual(deleteTournamentCalls.length, 0);

  confirmValue = true;
  deleteTournamentUI("old");
  assert.strictEqual(deleteTournamentCalls.length, 1);

  // section shortcuts
  resetSpies();
  goToResults();
  goToSinglesResults();
  assert.deepStrictEqual(showSectionCalls, ["results", "results"]);

  console.log("=== UI ACTIONS EXTENDED TESTS END ===");
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
