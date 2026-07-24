const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createStorage,
} = require("./lib/helpers");

global.window = {};
global.document = createMockDocument();
const local = createStorage();
global.localStorage = local.api;

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");

console.log("=== MODELS + NORMALIZE TESTS START ===");

// Constructors
state.config.boardsPerMatch = 3;
const team = new Team("Alpha", "T1");
assert.strictEqual(team.name, "Alpha");
assert.strictEqual(team.id, "T1");
assert.deepStrictEqual(team.opponents, []);
assert.strictEqual(team.mp, 0);
assert.strictEqual(team.bp, 0);
assert.strictEqual(team.hadBye, false);

const match = new Match(2, 1, "T1", "T2");
assert.strictEqual(match.id, "R2-T1");
assert.strictEqual(match.isBye, false);
assert.strictEqual(match.results.length, 3);
assert.strictEqual(match.teamAColor, null);

const byeMatch = new Match(2, 2, "T1", null);
assert.strictEqual(byeMatch.isBye, true);

const player = new Player("P1", "P1");
assert.strictEqual(player.name, "P1");
assert.strictEqual(player.hadBye, false);
assert.deepStrictEqual(player.opponents, []);

const singleMatch = new SingleMatch(1, 1, "P1", null);
assert.strictEqual(singleMatch.id, "R1-T1");
assert.strictEqual(singleMatch.isBye, true);
assert.strictEqual(singleMatch.result, null);

// Defaults loader
state.teams = [];
loadDefaults();
assert.strictEqual(state.teams.length, INITIAL_TEAMS.length);
assert(state.teams.every((t) => t.id.startsWith("T")));

// Access helpers
const knownTeamId = state.teams[0].id;
assert.strictEqual(getTeam(knownTeamId).id, knownTeamId);
assert.strictEqual(getTeam("missing"), undefined);
assert.strictEqual(getPlayer("missing"), undefined);

// Normalization of broken state
state = {
  config: { boardsPerMatch: 3, type: "" },
  teams: [
    {
      id: "T100",
      name: "Broken Team",
      opponents: null,
      hadBye: null,
      mp: "x",
      bp: undefined,
      buchholz: "x",
      medianBuchholz: undefined,
      sonnebornBerger: null,
      colorHistory: null,
      colorPreference: "x",
      players: null,
    },
  ],
  rounds: [
    {
      matches: [
        {
          teamA: "T100",
          teamB: "T200",
          results: ["1-0"],
          isBye: "bad",
          teamAColor: "X",
        },
        {
          teamA: "T100",
          teamB: null,
          results: null,
        },
      ],
    },
  ],
  currentRound: "x",
  status: "",
  excludedTeamsThisRound: null,
  singles: {
    config: null,
    players: [
      {
        id: "P100",
        name: "Broken Player",
        opponents: null,
        hadBye: "x",
        mp: "x",
        buchholz: "x",
        colorHistory: null,
        colorPreference: "x",
      },
    ],
    rounds: [
      {
        matches: [
          {
            playerA: "P100",
            playerB: null,
            isBye: "x",
            playerAColor: "Z",
          },
        ],
      },
    ],
    currentRound: "x",
    status: "",
    excludedPlayersThisRound: null,
  },
  mode: "",
  theme: "",
};

normalizeState();

assert.strictEqual(state.config.type, "SWISS");
assert.strictEqual(state.mode, "TEAM");
assert.strictEqual(state.currentRound, 0);
assert.strictEqual(state.status, "SETUP");
assert.strictEqual(state.theme, "dark");
assert(Array.isArray(state.excludedTeamsThisRound));

const normalizedTeam = state.teams[0];
assert.deepStrictEqual(normalizedTeam.opponents, []);
assert.strictEqual(normalizedTeam.hadBye, false);
assert.strictEqual(normalizedTeam.mp, 0);
assert.strictEqual(normalizedTeam.bp, 0);
assert.strictEqual(normalizedTeam.buchholz, 0);
assert.strictEqual(normalizedTeam.medianBuchholz, 0);
assert.strictEqual(normalizedTeam.sonnebornBerger, 0);
assert.deepStrictEqual(normalizedTeam.colorHistory, []);
assert.strictEqual(normalizedTeam.colorPreference, 0);
assert.deepStrictEqual(normalizedTeam.players, []);

const roundMatch = state.rounds[0].matches[0];
assert.strictEqual(roundMatch.results.length, 3);
assert.strictEqual(roundMatch.isBye, false);
assert.strictEqual(roundMatch.teamAColor, null);

const roundByeMatch = state.rounds[0].matches[1];
assert.strictEqual(roundByeMatch.isBye, true);
assert.strictEqual(roundByeMatch.results.length, 3);

assert(state.singles.config);
assert.strictEqual(state.singles.config.type, "SWISS");
assert.strictEqual(state.singles.currentRound, 0);
assert.strictEqual(state.singles.status, "SETUP");
assert(Array.isArray(state.singles.excludedPlayersThisRound));

const normalizedPlayer = state.singles.players[0];
assert.deepStrictEqual(normalizedPlayer.opponents, []);
assert.strictEqual(normalizedPlayer.hadBye, false);
assert.strictEqual(normalizedPlayer.mp, 0);
assert.strictEqual(normalizedPlayer.buchholz, 0);
assert.deepStrictEqual(normalizedPlayer.colorHistory, []);
assert.strictEqual(normalizedPlayer.colorPreference, 0);

const normalizedSingleMatch = state.singles.rounds[0].matches[0];
assert.strictEqual(normalizedSingleMatch.isBye, true);
assert.strictEqual(normalizedSingleMatch.playerAColor, null);

console.log("=== MODELS + NORMALIZE TESTS END ===");
