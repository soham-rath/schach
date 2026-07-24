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

document.getElementById = (id) => document._elements.get(id) || null;

global.getBoardsPerMatch = () => 2;
global.updateSettings = () => {};

let calculateStandingsCalls = [];
let calculateStandingsSinglesCalls = [];
let singlesCompletenessCalls = 0;

global.calculateStandings = (roundNum) => {
  calculateStandingsCalls.push(roundNum);
};
global.calculateStandingsSingles = (roundNum) => {
  calculateStandingsSinglesCalls.push(roundNum);
};
global.getMatchPointsSnapshot = () => ({ A: 2, B: 1, C: 0, D: 0 });
global.getSinglesMatchPointsSnapshot = () => ({ P1: 1, P2: 0, P3: 2 });
global.checkSinglesRoundCompleteness = () => {
  singlesCompletenessCalls += 1;
};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/ui/core.js");

console.log("=== UI CORE EXTENDED TESTS START ===");

// Common DOM fixtures
const radioTeam = createMockElement("input");
radioTeam.value = "TEAM";
radioTeam.parentElement = createMockElement("label");
const radioSingles = createMockElement("input");
radioSingles.value = "SINGLES";
radioSingles.parentElement = createMockElement("label");
document._setQuerySelectorAll('input[name="tournament-mode"]', [radioTeam, radioSingles]);

const teamList = document._setElement("team-list", createMockElement("ul"));
const playerList = document._setElement("player-list", createMockElement("ul"));

// renderSetup and renderSetupSingles
state.mode = "TEAM";
state.teams = [];
renderSetup();
assert(teamList.innerHTML.includes("Noch keine Teams"));

state.teams = [new Team("Alpha", "A"), new Team("Bravo", "B")];
renderSetup();
assert.strictEqual(teamList.children.length, 2);
assert(teamList.children[0].innerHTML.includes("editTeam('A')"));

state.mode = "SINGLES";
state.singles.players = [];
renderSetupSingles();
assert(playerList.innerHTML.includes("Noch keine Spieler"));

state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2")];
renderSetupSingles();
assert.strictEqual(playerList.children.length, 2);
assert(playerList.children[0].innerHTML.includes("editPlayer('P1')"));

// lockSetup
const actionsDiv = createMockElement("div");
actionsDiv.className = "actions";
const startBtn = createMockElement("button");
startBtn.className = "success";
startBtn.style.display = "block";
document._setQuerySelector(".actions", actionsDiv);
document._setQuerySelector(".actions .success", startBtn);
state.status = "RUNNING";
lockSetup();
assert.strictEqual(startBtn.style.display, "none");
assert.strictEqual(actionsDiv.children.length, 1);
assert.strictEqual(actionsDiv.children[0].id, "update-settings-btn");
document._setElement("update-settings-btn", actionsDiv.children[0]);
lockSetup();
assert.strictEqual(actionsDiv.children.length, 1);

// renderPairings
const pairingsHeader = createMockElement("div");
pairingsHeader.lastElementChild = createMockElement("div");
const pairingsBody = document._setElement("pairings-body", createMockElement("tbody"));
const pairingsRoundText = document._setElement(
  "round-display-pairings",
  createMockElement("div"),
);
document._setQuerySelector("#pairings .header-row", pairingsHeader);

state.mode = "TEAM";
state.currentRound = 1;
state.teams = [new Team("Alpha", "A"), new Team("Bravo", "B"), new Team("Charlie", "C")];
state.rounds = [
  {
    matches: [
      { table: 1, teamA: "A", teamB: "B", isBye: false, results: [null, null] },
      { table: 2, teamA: "C", teamB: null, isBye: true, results: [null, null] },
    ],
  },
];
renderPairings(1);
assert(pairingsRoundText.innerText.includes("Runde 1"));
assert.strictEqual(pairingsBody.children.length, 2);
assert(pairingsBody.children[1].innerHTML.includes("<i>-</i>"));
assert.strictEqual(pairingsHeader.children.length, 1);

// renderPairingsSingles
const pairingsSinglesHeader = createMockElement("div");
pairingsSinglesHeader.lastElementChild = createMockElement("div");
const pairingsBodySingles = document._setElement(
  "pairings-body-singles",
  createMockElement("tbody"),
);
const pairingsSinglesRoundText = document._setElement(
  "round-display-pairings-singles",
  createMockElement("div"),
);
document._setQuerySelector("#pairings-singles .header-row", pairingsSinglesHeader);

state.singles.currentRound = 1;
state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2")];
state.singles.rounds = [
  {
    matches: [{ table: 1, playerA: "P1", playerB: "P2", isBye: false, result: null }],
  },
];
renderPairingsSingles(1);
assert(pairingsSinglesRoundText.innerText.includes("Runde 1"));
assert.strictEqual(pairingsBodySingles.children.length, 1);
assert.strictEqual(pairingsSinglesHeader.children.length, 1);

// renderResults
const resultsHeader = createMockElement("div");
resultsHeader.lastElementChild = createMockElement("div");
document._setQuerySelector("#results .header-row", resultsHeader);
const resultsRoundText = document._setElement("round-display-results", createMockElement("div"));
const resultsContainer = document._setElement("results-container", createMockElement("div"));
const nextRoundBtn = document._setElement("next-round-btn", createMockElement("button"));

state.currentRound = 2;
state.rounds = [
  {
    matches: [{ table: 1, teamA: "A", teamB: "B", isBye: false, results: ["1-0", null] }],
  },
  {
    matches: [
      { table: 1, teamA: "A", teamB: "B", isBye: false, results: [null, null] },
      { table: 2, teamA: "C", teamB: null, isBye: true, results: [null, null] },
    ],
  },
];
renderResults(1);
assert(resultsRoundText.innerText.includes("Runde 1"));
assert.strictEqual(resultsContainer.children.length, 1);
assert.strictEqual(nextRoundBtn.style.display, "none");

renderResults(2);
assert.strictEqual(nextRoundBtn.style.display, "block");
assert.strictEqual(nextRoundBtn.disabled, true);

// renderResultsSingles
const resultsSinglesHeader = createMockElement("div");
resultsSinglesHeader.lastElementChild = createMockElement("div");
document._setQuerySelector("#results-singles .header-row", resultsSinglesHeader);
const resultsSinglesRoundText = document._setElement(
  "round-display-results-singles",
  createMockElement("div"),
);
const resultsSinglesContainer = document._setElement(
  "results-container-singles",
  createMockElement("div"),
);
const nextSinglesBtn = document._setElement(
  "next-round-btn-singles",
  createMockElement("button"),
);

state.singles.currentRound = 1;
state.singles.rounds = [
  {
    matches: [
      { table: 1, playerA: "P1", playerB: "P2", isBye: false, result: null },
      { table: 2, playerA: "P3", playerB: null, isBye: true, result: null },
    ],
  },
];
state.singles.players = [
  new Player("P1", "P1"),
  new Player("P2", "P2"),
  new Player("P3", "P3"),
];
renderResultsSingles(1);
assert(resultsSinglesRoundText.innerText.includes("Runde 1"));
assert.strictEqual(resultsSinglesContainer.children.length, 1);
assert.strictEqual(nextSinglesBtn.style.display, "block");
assert.strictEqual(singlesCompletenessCalls > 0, true);

// renderStandings
const standingsHeader = createMockElement("div");
standingsHeader.lastElementChild = createMockElement("div");
document._setQuerySelector("#standings .header-row", standingsHeader);
const standingsBody = document._setElement("standings-body", createMockElement("tbody"));
const addRoundBtn = document._setElement("add-round-btn", createMockElement("button"));

state.currentRound = 2;
state.rounds = [{ matches: [] }, { matches: [] }];
state.config.type = "SWISS";
state.config.totalRounds = 2;
state.status = "FINISHED";
state.teams = [new Team("Alpha", "A"), new Team("Bravo", "B")];
state.teams[0].mp = 3;
state.teams[1].mp = 2;
renderStandings(2);
assert.deepStrictEqual(calculateStandingsCalls.slice(-1), [2]);
assert.strictEqual(standingsBody.children.length, 2);
assert.strictEqual(addRoundBtn.style.display, "block");

state.config.type = "ROUND_ROBIN";
state.status = "RUNNING";
renderStandings(2);
assert.strictEqual(addRoundBtn.style.display, "none");

// renderStandingsSingles
const standingsSinglesHeader = createMockElement("div");
standingsSinglesHeader.lastElementChild = createMockElement("div");
document._setQuerySelector("#standings-singles .header-row", standingsSinglesHeader);
const standingsBodySingles = document._setElement(
  "standings-body-singles",
  createMockElement("tbody"),
);
state.singles.currentRound = 1;
state.singles.rounds = [{ matches: [] }];
state.singles.players = [new Player("P1", "P1"), new Player("P2", "P2")];
state.singles.players[0].mp = 2;
state.singles.players[1].mp = 1;
renderStandingsSingles(1);
assert.deepStrictEqual(calculateStandingsSinglesCalls.slice(-1), [1]);
assert.strictEqual(standingsBodySingles.children.length, 2);

// showTeamDetail / closeTeamDetail
const detailTitle = document._setElement("detail-team-name", createMockElement("div"));
const detailContent = document._setElement("team-detail-content", createMockElement("div"));
const detailModal = document._setElement("team-detail-modal", createMockElement("div"));
detailModal.classList.add("hidden");

state.config.pointsMatchWin = 2;
state.config.pointsMatchDraw = 1;
state.config.pointsMatchLoss = 0;
state.config.pointsBye = 2;
state.config.boardsPerMatch = 2;
state.teams = [new Team("Alpha", "A"), new Team("Bravo", "B")];
state.rounds = [
  {
    matches: [
      {
        teamA: "A",
        teamB: "B",
        isBye: false,
        results: ["1-0", "0.5-0.5"],
      },
    ],
  },
  {
    matches: [{ teamA: "A", teamB: null, isBye: true, results: [null, null] }],
  },
];
showTeamDetail("A");
assert(detailTitle.innerText.includes("Alpha"));
assert(detailContent.innerHTML.includes("Bravo"));
assert(detailContent.innerHTML.includes("BYE"));
assert.strictEqual(detailModal.classList.contains("hidden"), false);
closeTeamDetail();
assert.strictEqual(detailModal.classList.contains("hidden"), true);

// checkRoundCompleteness no-round guard
state.currentRound = 0;
nextRoundBtn.disabled = false;
checkRoundCompleteness();
assert.strictEqual(nextRoundBtn.disabled, true);

// renderAll dispatcher
const originalRenderSetup = renderSetup;
const originalRenderPairings = renderPairings;
const originalRenderResults = renderResults;
const originalRenderStandings = renderStandings;
const originalRenderSetupSingles = renderSetupSingles;
const originalRenderPairingsSingles = renderPairingsSingles;
const originalRenderResultsSingles = renderResultsSingles;
const originalRenderStandingsSingles = renderStandingsSingles;
const calls = [];

global.renderSetup = () => calls.push("setup");
global.renderPairings = () => calls.push("pairings");
global.renderResults = () => calls.push("results");
global.renderStandings = () => calls.push("standings");
global.renderSetupSingles = () => calls.push("setupSingles");
global.renderPairingsSingles = () => calls.push("pairingsSingles");
global.renderResultsSingles = () => calls.push("resultsSingles");
global.renderStandingsSingles = () => calls.push("standingsSingles");

state.mode = "TEAM";
renderAll();
state.mode = "SINGLES";
renderAll();
assert.deepStrictEqual(calls, [
  "setup",
  "pairings",
  "results",
  "standings",
  "setupSingles",
  "pairingsSingles",
  "resultsSingles",
  "standingsSingles",
]);

global.renderSetup = originalRenderSetup;
global.renderPairings = originalRenderPairings;
global.renderResults = originalRenderResults;
global.renderStandings = originalRenderStandings;
global.renderSetupSingles = originalRenderSetupSingles;
global.renderPairingsSingles = originalRenderPairingsSingles;
global.renderResultsSingles = originalRenderResultsSingles;
global.renderStandingsSingles = originalRenderStandingsSingles;

console.log("=== UI CORE EXTENDED TESTS END ===");
