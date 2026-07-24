const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createStorage,
} = require("./lib/helpers");

global.window = {};
global.document = createMockDocument();
global.localStorage = createStorage().api;

let alertCalls = [];
let toastCalls = [];
let commitCalls = 0;
let saveCalls = 0;

global.showAlert = (...args) => {
  alertCalls.push(args);
};
global.showToast = (...args) => {
  toastCalls.push(args);
};
global.commitState = () => {
  commitCalls += 1;
};
global.saveState = () => {
  saveCalls += 1;
};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/logic/standings.js");
loadFile("js/logic/pairings.js");

console.log("=== PAIRINGS TESTS START ===");

// determineColor branches
assert.strictEqual(determineColor({ colorPreference: 1, colorHistory: [] }, { colorPreference: 0 }), "W");
assert.strictEqual(determineColor({ colorPreference: -1, colorHistory: [] }, { colorPreference: 1 }), "B");
assert.strictEqual(determineColor({ colorPreference: 2, colorHistory: [] }, { colorPreference: 1 }), "W");
assert.strictEqual(determineColor({ colorPreference: 0, colorHistory: [] }, { colorPreference: 2 }), "B");
assert.strictEqual(determineColor({ colorPreference: 0, colorHistory: ["W"] }, { colorPreference: 0 }), "B");
assert.strictEqual(determineColor({ colorPreference: 0, colorHistory: ["B"] }, { colorPreference: 0 }), "W");

// getByeCandidates
const t1 = new Team("T1", "T1");
const t2 = new Team("T2", "T2");
const t3 = new Team("T3", "T3");
t1.hadBye = true;
t2.hadBye = false;
t3.hadBye = true;
assert.deepStrictEqual(getByeCandidates([t1, t2]), [null]);
const byeCandidates = getByeCandidates([t1, t2, t3]);
assert.strictEqual(byeCandidates[0].id, "T2");

// runSwissPairing relaxed fallback branch
const rA = new Team("A", "A");
const rB = new Team("B", "B");
rA.opponents = ["B"];
rB.opponents = ["A"];
const relaxed = runSwissPairing([rA, rB]);
assert(relaxed);
assert.strictEqual(relaxed.relaxed, true);
assert.strictEqual(relaxed.pairings.length, 1);

// Team Swiss max-round guard
state.teams = [new Team("A", "A"), new Team("B", "B")];
state.rounds = [];
state.currentRound = 1;
state.config.totalRounds = 1;
state.config.type = "SWISS";
alertCalls = [];
commitCalls = 0;
generatePairings();
assert.strictEqual(state.rounds.length, 0);
assert.strictEqual(commitCalls, 0);
assert(alertCalls.length > 0);

// Team Swiss round 1 split + bye
state.teams = [
  new Team("T1", "T1"),
  new Team("T2", "T2"),
  new Team("T3", "T3"),
  new Team("T4", "T4"),
  new Team("T5", "T5"),
];
state.rounds = [];
state.currentRound = 0;
state.config.totalRounds = 10;
state.config.type = "SWISS";
state.excludedTeamsThisRound = [];
state.forcedPairsThisRound = [];
commitCalls = 0;
saveCalls = 0;
generatePairings();
assert.strictEqual(state.currentRound, 1);
assert.strictEqual(state.rounds.length, 1);
assert.strictEqual(state.rounds[0].matches.length, 3);
assert.strictEqual(state.rounds[0].matches[0].teamA, "T1");
assert.strictEqual(state.rounds[0].matches[0].teamB, "T3");
assert.strictEqual(state.rounds[0].matches[0].teamAColor, "W");
assert.strictEqual(state.rounds[0].matches[1].teamAColor, "B");
assert.strictEqual(state.rounds[0].matches[2].isBye, true);
assert.strictEqual(state.rounds[0].matches[2].teamA, "T5");
assert.strictEqual(commitCalls, 1);
assert.strictEqual(saveCalls, 1);

// Team Swiss forced pairing overrides split pairing
state.teams = [
  new Team("T1", "T1"),
  new Team("T2", "T2"),
  new Team("T3", "T3"),
  new Team("T4", "T4"),
];
state.rounds = [];
state.currentRound = 0;
state.config.totalRounds = 5;
state.config.type = "SWISS";
state.excludedTeamsThisRound = [];
state.forcedPairsThisRound = [{ a: "T2", b: "T4" }];
generatePairings();
assert.strictEqual(state.rounds[0].matches.length, 2);
const forcedMatch = state.rounds[0].matches.find(
  (m) => (m.teamA === "T2" && m.teamB === "T4") || (m.teamA === "T4" && m.teamB === "T2"),
);
assert(forcedMatch, "Forced pair T2 vs T4 should appear in round 1");
assert.strictEqual(state.forcedPairsThisRound.length, 0, "Forced pairs should be cleared after generation");

// Team Round-Robin branch + exclusion warning
state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C"), new Team("D", "D")];
state.rounds = [];
state.currentRound = 0;
state.config.type = "ROUND_ROBIN";
state.excludedTeamsThisRound = ["A"];
alertCalls = [];
generatePairings();
assert.strictEqual(state.currentRound, 1);
assert.strictEqual(state.rounds.length, 1);
assert.deepStrictEqual(state.excludedTeamsThisRound, []);
assert(alertCalls.length > 0);

// No valid Swiss pairings branch
state.config.type = "SWISS";
state.currentRound = 1;
state.config.totalRounds = 5;
state.rounds = [{ matches: [] }];
state.teams = [new Team("A", "A"), new Team("B", "B")];
const savedRunSwissPairing = runSwissPairing;
const originalConsoleError = console.error;
console.error = () => {};
global.runSwissPairing = () => null;
alertCalls = [];
generatePairings();
assert.strictEqual(state.currentRound, 1);
assert.strictEqual(state.rounds.length, 1);
assert(alertCalls.length > 0);
global.runSwissPairing = savedRunSwissPairing;
console.error = originalConsoleError;

// Singles Swiss max-round guard
state.singles = {
  config: { type: "SWISS", totalRounds: 1, pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, pointsBye: 1 },
  players: [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3"), new Player("P4", "P4")],
  rounds: [],
  currentRound: 1,
  status: "RUNNING",
  excludedPlayersThisRound: [],
};
alertCalls = [];
commitCalls = 0;
generatePairingsSingles();
assert.strictEqual(state.singles.rounds.length, 0);
assert.strictEqual(commitCalls, 0);
assert(alertCalls.length > 0);

// Singles Swiss round 1 odd players + bye placement
state.singles = {
  config: { type: "SWISS", totalRounds: 5, pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, pointsBye: 1 },
  players: [
    new Player("P1", "P1"),
    new Player("P2", "P2"),
    new Player("P3", "P3"),
    new Player("P4", "P4"),
    new Player("P5", "P5"),
  ],
  rounds: [],
  currentRound: 0,
  status: "RUNNING",
  excludedPlayersThisRound: [],
};
generatePairingsSingles();
assert.strictEqual(state.singles.currentRound, 1);
assert.strictEqual(state.singles.rounds[0].matches.length, 3);
const lastSinglesMatch = state.singles.rounds[0].matches[2];
assert.strictEqual(lastSinglesMatch.isBye, true);
assert.strictEqual(lastSinglesMatch.playerA, "P5");
assert.strictEqual(getPlayer("P5").hadBye, true);
assert.deepStrictEqual(state.singles.excludedPlayersThisRound, []);

// Singles Round-Robin path through generatePairingsSingles
state.singles = {
  config: { type: "ROUND_ROBIN", totalRounds: 10, pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, pointsBye: 1 },
  players: [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3"), new Player("P4", "P4")],
  rounds: [],
  currentRound: 0,
  status: "RUNNING",
  excludedPlayersThisRound: [],
};
generatePairingsSingles();
assert.strictEqual(state.singles.currentRound, 1);
assert.strictEqual(state.singles.rounds.length, 1);

// Round-Robin completion guards
state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C"), new Team("D", "D")];
state.currentRound = 3; // total rounds for 4 teams
state.rounds = [{ matches: [] }, { matches: [] }, { matches: [] }];
alertCalls = [];
generatePairingsRoundRobin();
assert.strictEqual(state.currentRound, 3);
assert.strictEqual(state.rounds.length, 3);
assert(alertCalls.length > 0);

state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2"), new Player("P3", "P3"), new Player("P4", "P4")];
state.singles.currentRound = 3;
state.singles.rounds = [{ matches: [] }, { matches: [] }, { matches: [] }];
alertCalls = [];
generatePairingsSinglesRoundRobin();
assert.strictEqual(state.singles.currentRound, 3);
assert.strictEqual(state.singles.rounds.length, 3);
assert(alertCalls.length > 0);

console.log("=== PAIRINGS TESTS END ===");
