const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createMockElement,
  createStorage,
} = require("./lib/helpers");

global.window = {};
const document = createMockDocument();
global.document = document;
global.localStorage = createStorage().api;

let alertCalls = [];
let commitCalls = 0;
let saveCalls = 0;
let renderSetupCalls = 0;
let renderSetupSinglesCalls = 0;
let renderAllCalls = 0;
let renderResultsSinglesCalls = 0;
let renderStandingsSinglesCalls = 0;

global.showAlert = (...args) => {
  alertCalls.push(args);
};
global.commitState = () => {
  commitCalls += 1;
};
global.saveState = () => {
  saveCalls += 1;
};
global.renderSetup = () => {
  renderSetupCalls += 1;
};
global.renderSetupSingles = () => {
  renderSetupSinglesCalls += 1;
};
global.renderAll = () => {
  renderAllCalls += 1;
};
global.renderResultsSingles = () => {
  renderResultsSinglesCalls += 1;
};
global.renderStandingsSingles = () => {
  renderStandingsSinglesCalls += 1;
};
global.updateNavigation = () => {};
global.lockSetup = () => {};
global.showExcludeModal = () => {};
global.showExcludeSinglesModal = () => {};
global.generatePairings = () => {};
global.generatePairingsSingles = () => {};
global.showSection = () => {};
global.checkRoundCompleteness = () => {};
global.renderResults = () => {};
global.renderStandings = () => {};
global.renderDashboard = () => {};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/logic/standings.js");
loadFile("js/ui/actions.js");

console.log("=== UI ACTIONS TESTS START ===");

assert.strictEqual(parsePositiveInt("5", 1), 5);
assert.strictEqual(parsePositiveInt("0", 7), 7);
assert.strictEqual(parsePositiveInt("abc", 9), 9);
assert.strictEqual(parseNonNegativeNumber("2.5", 0), 2.5);
assert.strictEqual(parseNonNegativeNumber("-1", 3), 3);

state.config.boardsPerMatch = "6";
assert.strictEqual(getBoardsPerMatch(), 6);

state.teams = [new Team("Alpha", "T1"), new Team("Bravo", "T2")];
assert.strictEqual(hasTeamNameConflict(" alpha "), true);
assert.strictEqual(hasTeamNameConflict("alpha", "T1"), false);
assert.strictEqual(hasTeamNameConflict("charlie"), false);

state.singles.players = [new Player("Max", "P1"), new Player("Nina", "P2")];
assert.strictEqual(hasPlayerNameConflict(" max "), true);
assert.strictEqual(hasPlayerNameConflict("max", "P1"), false);
assert.strictEqual(hasPlayerNameConflict("otto"), false);

state.rounds = [
  {
    matches: [
      { isBye: false, results: ["1-0", null, "0-1"] },
      { isBye: true, results: [null, null, null] },
    ],
  },
];
assert.strictEqual(hasRecordedBoardsBeyondLimit(2), true);
assert.strictEqual(hasRecordedBoardsBeyondLimit(3), false);

syncBoardArraysToCount(5);
assert.strictEqual(state.rounds[0].matches[0].results.length, 5);
syncBoardArraysToCount(2);
assert.strictEqual(state.rounds[0].matches[0].results.length, 2);

// addTeam success + duplicate guard
const teamInput = createMockElement("input");
teamInput.value = " Team X ";
document._setElement("new-team-name", teamInput);
state.teams = [];
addTeam();
assert.strictEqual(state.teams.length, 1);
assert.strictEqual(state.teams[0].name, "Team X");
assert.strictEqual(teamInput.value, "");
assert.strictEqual(commitCalls > 0, true);

alertCalls = [];
teamInput.value = "team x";
addTeam();
assert.strictEqual(state.teams.length, 1);
assert.strictEqual(alertCalls.length, 1);

// addPlayer success + duplicate guard
const playerInput = createMockElement("input");
playerInput.value = " Ana ";
document._setElement("new-player-name", playerInput);
state.singles.players = [];
addPlayer();
assert.strictEqual(state.singles.players.length, 1);
assert.strictEqual(state.singles.players[0].name, "Ana");
assert.strictEqual(playerInput.value, "");

alertCalls = [];
playerInput.value = "ana";
addPlayer();
assert.strictEqual(state.singles.players.length, 1);
assert.strictEqual(alertCalls.length, 1);

// remove team/player guards and success paths
const removableTeam = new Team("Rem", "TR");
state.teams = [removableTeam];
state.status = "RUNNING";
alertCalls = [];
removeTeam("TR");
assert.strictEqual(state.teams.length, 1);
assert.strictEqual(alertCalls.length, 1);

state.status = "SETUP";
removeTeam("TR");
assert.strictEqual(state.teams.length, 0);

const removablePlayer = new Player("RemP", "PR");
state.singles.players = [removablePlayer];
state.singles.status = "RUNNING";
alertCalls = [];
removePlayer("PR");
assert.strictEqual(state.singles.players.length, 1);
assert.strictEqual(alertCalls.length, 1);

state.singles.status = "SETUP";
removePlayer("PR");
assert.strictEqual(state.singles.players.length, 0);

// Singles snapshot helper
state.singles = {
  config: { pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, pointsBye: 1 },
  players: [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3")],
  rounds: [
    {
      matches: [
        { playerA: "P1", playerB: "P2", isBye: false, result: "1-0" },
        { playerA: "P3", playerB: null, isBye: true, result: null },
      ],
    },
    {
      matches: [
        { playerA: "P2", playerB: "P3", isBye: false, result: "0.5-0.5" },
      ],
    },
  ],
  currentRound: 2,
  status: "RUNNING",
  excludedPlayersThisRound: [],
};
const singlesSnap = getSinglesMatchPointsSnapshot(3);
assert.deepStrictEqual(singlesSnap, { P1: 1, P2: 0.5, P3: 1.5 });

// checkSinglesRoundCompleteness + updateSinglesMatchResult
const nextSinglesBtn = createMockElement("button");
document._setElement("next-round-btn-singles", nextSinglesBtn);
state.singles.currentRound = 1;
state.singles.rounds = [{ matches: [{ isBye: false, result: null }] }];
checkSinglesRoundCompleteness();
assert.strictEqual(nextSinglesBtn.disabled, true);

state.singles.rounds[0].matches[0].result = "1-0";
checkSinglesRoundCompleteness();
assert.strictEqual(nextSinglesBtn.disabled, false);

state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2")];
state.singles.rounds = [{ matches: [{ isBye: false, playerA: "P1", playerB: "P2", result: null }] }];
state.singles.currentRound = 1;
state.singles.config = { pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, pointsBye: 1 };
commitCalls = 0;
updateSinglesMatchResult(1, 0, "1-0");
assert.strictEqual(state.singles.rounds[0].matches[0].result, "1-0");
assert.strictEqual(commitCalls, 1);
assert.strictEqual(renderResultsSinglesCalls > 0, true);
assert.strictEqual(renderStandingsSinglesCalls > 0, true);

console.log("=== UI ACTIONS TESTS END ===");
