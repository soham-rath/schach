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
const storage = createStorage();
global.localStorage = storage.api;

global.location = { reload: () => {} };
global.showAlert = () => {};
global.showToast = () => {};

global.commitState = () => {};
global.calculateStandings = () => {};
global.calculateStandingsSingles = () => {};

global.checkRoundCompleteness = () => {};

global.renderResults = () => {};
global.renderStandings = () => {};
global.renderDashboard = () => {};

global.getTournamentList = () => [];

global.createNewTournament = () => {};

global.switchTournament = () => true;

global.deleteTournament = () => true;

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/logic/standings.js");
loadFile("js/logic/pairings.js");
loadFile("js/state/storage.js");
loadFile("js/export.js");

console.log("=== INTERNAL HELPER TESTS START ===");

// storage helpers
assert.deepStrictEqual(parseJsonSafely('{"ok":1}'), { ok: 1 });
assert.strictEqual(parseJsonSafely("{bad", "fallback"), "fallback");
assert.strictEqual(parseJsonSafely(42, null), null);

const normalized = normalizeMeta({
  activeId: "missing",
  tournaments: [
    null,
    { id: "", name: "x", lastModified: "x", mode: "SINGLES" },
    { id: "one", name: "", lastModified: "123", mode: "SINGLES" },
    { id: "two", name: "Cup", lastModified: 99, mode: "TEAM" },
  ],
});
assert.strictEqual(normalized.activeId, "one");
assert.strictEqual(normalized.tournaments.length, 2);
assert.strictEqual(normalized.tournaments[0].name, "Turnier");
assert.strictEqual(normalized.tournaments[0].mode, "SINGLES");
assert.strictEqual(normalized.tournaments[0].lastModified, 123);

localStorage.setItem(
  "swiss_manager_meta",
  JSON.stringify({ activeId: "two", tournaments: [{ id: "two", name: "Cup", lastModified: 1 }] }),
);
assert.strictEqual(getMeta().activeId, "two");

// standings scoring helper + head-to-head tie-break branch
state.config = {
  ...state.config,
  pointsMatchWin: "3",
  pointsMatchDraw: "1.5",
  pointsMatchLoss: "0",
  pointsBye: "3",
  boardsPerMatch: "6.8",
};
const scoring = getTeamScoringConfig();
assert.deepStrictEqual(scoring, {
  matchWin: 3,
  matchDraw: 1.5,
  matchLoss: 0,
  byeMatchPoints: 3,
  byeBoardPoints: 6,
});
state.config.boardsPerMatch = 0;
assert.strictEqual(getTeamScoringConfig().byeBoardPoints, 1);

state.config = {
  ...state.config,
  pointsMatchWin: 2,
  pointsMatchDraw: 1,
  pointsMatchLoss: 0,
  pointsBye: 2,
  boardsPerMatch: 1,
};
state.teams = [new Team("A", "A"), new Team("B", "B")];
state.rounds = [
  {
    matches: [
      { teamA: "A", teamB: "B", isBye: false, results: ["1-0"], teamAColor: "W" },
    ],
  },
  {
    matches: [
      { teamA: "A", teamB: "B", isBye: false, results: ["0-1"], teamAColor: "B" },
    ],
  },
];
calculateStandings();
assert.deepStrictEqual(state.teams.map((t) => t.id), ["A", "B"]);

// swiss engine internals
const rA = new Team("A", "A");
const rB = new Team("B", "B");
rA.opponents = ["B"];
rB.opponents = ["A"];
assert.strictEqual(backtrackPair([rA, rB], [], false), null);
const repeatAllowed = backtrackPair([rA, rB], [], true);
assert.strictEqual(Array.isArray(repeatAllowed), true);
assert.strictEqual(repeatAllowed.length, 1);

const o1 = new Team("O1", "O1");
const o2 = new Team("O2", "O2");
const o3 = new Team("O3", "O3");
o2.hadBye = true;
const solved = solveSwissPairing([o1, o2, o3], false);
assert.strictEqual(Array.isArray(solved), true);
assert.strictEqual(solved.some((p) => p.teamB === null), true);

const unsolved = solveSwissPairing([rA, rB], false);
assert.strictEqual(unsolved, null);

let rebuildCalls = 0;
let saveCalls = 0;
global.rebuildTeamHistoryFromRounds = () => {
  rebuildCalls += 1;
};
global.saveState = () => {
  saveCalls += 1;
};
state.rounds = [];
state.currentRound = 0;
state.excludedTeamsThisRound = ["A"];
finalizeRound([new Match(1, 1, "A", "B")]);
assert.strictEqual(state.rounds.length, 1);
assert.strictEqual(state.currentRound, 1);
assert.deepStrictEqual(state.excludedTeamsThisRound, []);
assert.strictEqual(rebuildCalls, 1);
assert.strictEqual(saveCalls, 1);

// export helpers
const urlCreated = [];
const urlRevoked = [];
const downloads = [];

global.URL = {
  createObjectURL(blob) {
    const ref = `blob:${urlCreated.length + 1}`;
    urlCreated.push({ ref, blob });
    return ref;
  },
  revokeObjectURL(ref) {
    urlRevoked.push(ref);
  },
};
global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options.type;
  }
};
global.setTimeout = (fn) => {
  fn();
  return 1;
};

document.createElement = (tag) => {
  const el = createMockElement(tag);
  if (String(tag).toLowerCase() === "a") {
    el.click = () => {
      downloads.push({
        href: el.getAttribute("href"),
        download: el.getAttribute("download"),
      });
    };
  }
  return el;
};

downloadBlob("sample.txt", "hello", "text/plain");
assert.strictEqual(downloads[0].download, "sample.txt");
assert.strictEqual(urlCreated[0].blob.type, "text/plain");
assert.strictEqual(urlRevoked.includes("blob:1"), true);

downloadCSV("scores.csv", "a,b");
assert.strictEqual(downloads[1].download, "scores.csv");
assert.strictEqual(urlCreated[1].blob.type, "text/csv;charset=utf-8;");

console.log("=== INTERNAL HELPER TESTS END ===");
