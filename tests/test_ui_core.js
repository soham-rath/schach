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

// Return null for missing ids so guard checks in UI code are meaningful.
document.getElementById = (id) => document._elements.get(id) || null;

global.getBoardsPerMatch = () => 2;
global.calculateStandings = () => {};
global.calculateStandingsSingles = () => {};
global.getMatchPointsSnapshot = () => ({ A: 2, B: 1 });
global.getSinglesMatchPointsSnapshot = () => ({ P1: 1, P2: 0 });
global.checkSinglesRoundCompleteness = () => {};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/ui/core.js");

console.log("=== UI CORE TESTS START ===");

// showSection + updateNavigation
const setupView = createMockElement("section");
setupView.id = "setup";
const pairingsView = createMockElement("section");
pairingsView.id = "pairings";
const setupSinglesView = createMockElement("section");
setupSinglesView.id = "setup-singles";
const pairingsSinglesView = createMockElement("section");
pairingsSinglesView.id = "pairings-singles";
document._setElement("setup", setupView);
document._setElement("pairings", pairingsView);
document._setElement("setup-singles", setupSinglesView);
document._setElement("pairings-singles", pairingsSinglesView);
document._setQuerySelectorAll(".view", [setupView, pairingsView, setupSinglesView, pairingsSinglesView]);

const navSetup = createMockElement("button");
const navPairings = createMockElement("button");
document._setElement("nav-pairings", navPairings);
document._setElement("nav-results", createMockElement("button"));
document._setElement("nav-standings", createMockElement("button"));
document._setQuerySelectorAll(".nav-btn", [navSetup, navPairings]);
document._setQuerySelector('[data-target="setup"]', navSetup);
document._setQuerySelector('[data-target="pairings"]', navPairings);

state.mode = "TEAM";
state.status = "SETUP";
const originalConsoleWarn = console.warn;
console.warn = () => {};
showSection("pairings");
console.warn = originalConsoleWarn;
assert.strictEqual(setupView.classList.contains("active"), true);
assert.strictEqual(pairingsView.classList.contains("active"), false);

state.status = "RUNNING";
showSection("pairings");
assert.strictEqual(pairingsView.classList.contains("active"), true);

updateNavigation();
assert.strictEqual(document.getElementById("nav-pairings").disabled, false);
state.status = "SETUP";
updateNavigation();
assert.strictEqual(document.getElementById("nav-pairings").disabled, true);

// renderDashboard branch
[
  "stat-total-mp",
  "stat-total-bp",
  "stat-total-games",
  "stats-w-wins",
  "stats-b-wins",
  "stats-draws",
  "bar-win",
  "bar-draw",
  "bar-loss",
  "top-scorer-list",
].forEach((id) => document._setElement(id, createMockElement("div")));

state.teams = [new Team("A", "A"), new Team("B", "B")];
state.teams[0].mp = 4;
state.teams[0].bp = 5;
state.teams[1].mp = 2;
state.teams[1].bp = 3;
state.rounds = [
  {
    matches: [
      { isBye: false, results: ["1-0", "0.5-0.5"] },
      { isBye: false, results: ["0-1", null] },
    ],
  },
];
renderDashboard();
assert.strictEqual(document.getElementById("stat-total-mp").innerText, 3);
assert.strictEqual(document.getElementById("stat-total-bp").innerText, 4);
assert.strictEqual(document.getElementById("stat-total-games").innerText, 3);
assert.strictEqual(document.getElementById("stats-w-wins").innerText, 1);
assert.strictEqual(document.getElementById("stats-b-wins").innerText, 1);
assert.strictEqual(document.getElementById("stats-draws").innerText, 1);
assert.strictEqual(document.getElementById("top-scorer-list").children.length, 2);

// checkRoundCompleteness
const nextRoundBtn = document._setElement("next-round-btn", createMockElement("button"));
state.currentRound = 1;
state.rounds = [{ matches: [{ isBye: false, results: ["1-0", null] }] }];
checkRoundCompleteness();
assert.strictEqual(nextRoundBtn.disabled, true);
state.rounds[0].matches[0].results = ["1-0", "0-1"];
checkRoundCompleteness();
assert.strictEqual(nextRoundBtn.disabled, false);

// Match card helpers
const cardHtml = createMatchCardHTML(
  1,
  { table: 3, results: ["1-0", "0.5-0.5"] },
  0,
  { name: "A" },
  { name: "B" },
);
assert(cardHtml.includes("Tisch"));
assert(cardHtml.includes("Brett 1"));
assert(cardHtml.includes("Brett 2"));
assert(cardHtml.includes("1.5 - 0.5"));

const singleCardHtml = createSingleMatchCardHTML(
  2,
  { table: 1, result: "0-1" },
  0,
  { name: "P1" },
  { name: "P2" },
);
assert(singleCardHtml.includes("P1"));
assert(singleCardHtml.includes("0 - 1"));
assert(singleCardHtml.includes("updateSinglesMatchResult(2, 0, '0-1')"));

console.log("=== UI CORE TESTS END ===");
