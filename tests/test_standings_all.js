const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createStorage,
} = require("./lib/helpers");

global.window = {};
global.document = createMockDocument();
global.localStorage = createStorage().api;

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/logic/standings.js");

console.log("=== STANDINGS TESTS START ===");

assert.strictEqual(readNumber("3.5", 0), 3.5);
assert.strictEqual(readNumber("x", 7), 7);

// Team standings scenario with byes, complete and incomplete rounds
state.config = {
  ...state.config,
  pointsMatchWin: 2,
  pointsMatchDraw: 1,
  pointsMatchLoss: 0,
  pointsBye: 2,
  boardsPerMatch: 2,
};

state.teams = [new Team("A", "A"), new Team("B", "B"), new Team("C", "C")];
state.rounds = [
  {
    matches: [
      {
        teamA: "A",
        teamB: "B",
        isBye: false,
        results: ["1-0", "0.5-0.5"],
        teamAColor: "W",
      },
      { teamA: "C", teamB: null, isBye: true, results: [null, null], teamAColor: null },
    ],
  },
  {
    matches: [
      {
        teamA: "A",
        teamB: "C",
        isBye: false,
        results: ["0-1", null],
        teamAColor: "B",
      },
      { teamA: "B", teamB: null, isBye: true, results: [null, null], teamAColor: null },
    ],
  },
  {
    matches: [
      {
        teamA: "B",
        teamB: "C",
        isBye: false,
        results: ["0.5-0.5", "0.5-0.5"],
        teamAColor: "W",
      },
      { teamA: "A", teamB: null, isBye: true, results: [null, null], teamAColor: null },
    ],
  },
];

calculateStandings();
assert.deepStrictEqual(state.teams.map((t) => t.id), ["A", "C", "B"]);

const teamA = getTeam("A");
const teamB = getTeam("B");
const teamC = getTeam("C");

assert.strictEqual(teamA.mp, 4);
assert.strictEqual(teamA.bp, 3.5);
assert.strictEqual(teamA.buchholz, 3);
assert.strictEqual(teamA.sonnebornBerger, 3);
assert.strictEqual(teamA.medianBuchholz, 3);

assert.strictEqual(teamB.mp, 3);
assert.strictEqual(teamB.bp, 3.5);
assert.strictEqual(teamB.buchholz, 7);
assert.strictEqual(teamB.sonnebornBerger, 1.5);
assert.strictEqual(teamB.medianBuchholz, 7);

assert.strictEqual(teamC.mp, 3);
assert.strictEqual(teamC.bp, 4);
assert.strictEqual(teamC.buchholz, 3);
assert.strictEqual(teamC.sonnebornBerger, 1.5);
assert.strictEqual(teamC.medianBuchholz, 3);

// maxRound path
calculateStandings(1);
assert.strictEqual(getTeam("A").mp, 2);
assert.strictEqual(getTeam("B").mp, 0);
assert.strictEqual(getTeam("C").mp, 2);

// Match points snapshot path
calculateStandings();
const snapshot = getMatchPointsSnapshot(3); // after rounds 1 + 2
assert.deepStrictEqual(snapshot, { A: 2, B: 2, C: 2 });

// Team history rebuild
rebuildTeamHistoryFromRounds();
assert.deepStrictEqual(getTeam("A").opponents, ["B", "C"]);
assert.deepStrictEqual(getTeam("A").colorHistory, ["W", "B", null]);
assert.strictEqual(getTeam("A").hadBye, true);
assert.strictEqual(getTeam("A").colorPreference, 0);
assert.strictEqual(getTeam("B").colorPreference, 0);
assert.strictEqual(getTeam("C").colorPreference, 0);

// Singles standings scenario
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
        { playerA: "P1", playerB: "P3", isBye: false, result: null },
        { playerA: "P2", playerB: null, isBye: true, result: null },
      ],
    },
    {
      matches: [
        { playerA: "P2", playerB: "P3", isBye: false, result: "0.5-0.5" },
        { playerA: "P1", playerB: null, isBye: true, result: null },
      ],
    },
  ],
  currentRound: 3,
  status: "RUNNING",
  excludedPlayersThisRound: [],
};

calculateStandingsSingles();
assert.deepStrictEqual(state.singles.players.map((p) => p.id), ["P1", "P2", "P3"]);
assert.strictEqual(getPlayer("P1").mp, 2);
assert.strictEqual(getPlayer("P2").mp, 1.5);
assert.strictEqual(getPlayer("P3").mp, 1.5);
assert.strictEqual(getPlayer("P1").buchholz, 1.5);
assert.strictEqual(getPlayer("P2").buchholz, 3.5);
assert.strictEqual(getPlayer("P3").buchholz, 1.5);

calculateStandingsSingles(1);
assert.strictEqual(getPlayer("P1").mp, 1);
assert.strictEqual(getPlayer("P2").mp, 0);
assert.strictEqual(getPlayer("P3").mp, 1);

console.log("=== STANDINGS TESTS END ===");
