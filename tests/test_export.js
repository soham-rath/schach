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

const urlCreated = [];
const urlRevoked = [];
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

const downloads = [];
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

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/logic/standings.js");
loadFile("js/export.js");

console.log("=== EXPORT TESTS START ===");

assert.strictEqual(sanitizeFilenameSegment("  My:Test/Name  ", "fallback"), "My_Test_Name");
assert.strictEqual(sanitizeFilenameSegment("", "fallback"), "fallback");
assert.strictEqual(escapeCSV(null), "");
assert.strictEqual(escapeCSV("plain"), "plain");
assert.strictEqual(escapeCSV("a,b"), "\"a,b\"");
assert.strictEqual(escapeCSV("a\"b"), "\"a\"\"b\"");

// Shared state fixture
state.config.name = "Cup:/2026";
state.config.boardsPerMatch = 2;
state.currentRound = 2;
state.teams = [new Team("Alpha,Team", "A"), new Team("Beta", "B")];
state.rounds = [
  {
    matches: [
      {
        table: 1,
        teamA: "A",
        teamB: "B",
        isBye: false,
        results: ["1-0", "0.5-0.5"],
      },
    ],
  },
  {
    matches: [
      {
        table: 1,
        teamA: "A",
        teamB: null,
        isBye: true,
        results: [null, null],
      },
    ],
  },
];

downloads.length = 0;
exportStandingsToCSV();
assert.strictEqual(downloads.length, 1);
assert.strictEqual(downloads[0].download, "Standings_Cup_2026_R2.csv");
const standingsBlob = urlCreated[urlCreated.length - 1].blob;
assert.strictEqual(standingsBlob.type, "text/csv;charset=utf-8;");
assert(standingsBlob.parts[0].includes("Rang,Team,MP,BP,Buchholz,MedianBuchholz,SonnebornBerger"));
assert(standingsBlob.parts[0].includes("\"Alpha,Team\""));

downloads.length = 0;
exportMatchesToCSV();
assert.strictEqual(downloads[0].download, "Matches_Cup_2026_R2.csv");
const matchesBlob = urlCreated[urlCreated.length - 1].blob;
assert(matchesBlob.parts[0].includes("1.5 - 0.5"));
assert(matchesBlob.parts[0].includes("BYE"));

downloads.length = 0;
exportTournamentToJSON();
assert.strictEqual(downloads[0].download, "Tournament_Cup_2026_R2.json");
const tournamentBlob = urlCreated[urlCreated.length - 1].blob;
assert.strictEqual(tournamentBlob.type, "application/json;charset=utf-8;");
const parsedTournament = JSON.parse(tournamentBlob.parts[0]);
assert.strictEqual(parsedTournament.config.name, "Cup:/2026");

state.singles.config.name = "Singles / Finals";
state.singles.currentRound = 3;
state.singles.players = [new Player("P1", "P1")];
downloads.length = 0;
exportSinglesStandingsToCSV();
assert.strictEqual(downloads[0].download, "Singles_Standings_Singles_Finals_R3.csv");

downloads.length = 0;
exportSinglesTournamentToJSON();
assert.strictEqual(downloads[0].download, "Singles_Singles_Finals_R3.json");
const singlesBlob = urlCreated[urlCreated.length - 1].blob;
assert.strictEqual(JSON.parse(singlesBlob.parts[0]).config.name, "Singles / Finals");

// Import trigger helper
const importInput = createMockElement("input");
importInput.value = "something";
let importClicked = false;
importInput.click = () => {
  importClicked = true;
};
document._setElement("import-file-input", importInput);
triggerImportTournament();
assert.strictEqual(importInput.value, "");
assert.strictEqual(importClicked, true);

assert.strictEqual(urlCreated.length, urlRevoked.length);
assert(urlRevoked.every((ref) => ref.startsWith("blob:")));

console.log("=== EXPORT TESTS END ===");
