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

const local = createStorage();
const session = createStorage();
global.localStorage = local.api;
global.sessionStorage = session.api;

let setupImportCalls = 0;
let loadStateCalls = 0;
let initThemeCalls = 0;
let saveStateCalls = 0;
let updateNavCalls = 0;
let renderAllCalls = 0;
let renderSetupCalls = 0;
let renderSetupSinglesCalls = 0;
let showSectionCalls = [];
let lockSetupCalls = 0;
let presetListenersCalls = 0;

global.setupImportListener = () => {
  setupImportCalls += 1;
};
global.loadState = () => {
  loadStateCalls += 1;
};
global.initTheme = () => {
  initThemeCalls += 1;
};
global.saveState = () => {
  saveStateCalls += 1;
};
global.updateNavigation = () => {
  updateNavCalls += 1;
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
global.showSection = (id) => {
  showSectionCalls.push(id);
};
global.lockSetup = () => {
  lockSetupCalls += 1;
};
global.setupPresetListeners = () => {
  presetListenersCalls += 1;
};

global.state = {
  config: {
    name: "Team Cup",
    totalRounds: 7,
    boardsPerMatch: 6,
    pointsMatchWin: 3,
    pointsMatchDraw: 1,
    type: "SWISS",
    rulesPreset: "CUSTOM",
  },
  mode: "TEAM",
  singles: {
    config: {
      name: "Singles Cup",
      totalRounds: 5,
      pointsWin: 1,
      pointsDraw: 0.5,
      type: "SWISS",
      rulesPreset: "USCF",
    },
    rounds: [],
    currentRound: 0,
    status: "SETUP",
    players: [],
  },
  rounds: [],
  status: "SETUP",
  theme: "dark",
};

// Session restore values
sessionStorage.setItem("last_mode", "SINGLES");
sessionStorage.setItem("last_theme", "light");

// DOM fixtures
const navSetup = createMockElement("button");
navSetup.dataset.target = "setup";
const navPairings = createMockElement("button");
navPairings.dataset.target = "pairings";
document._setQuerySelectorAll(".nav-btn", [navSetup, navPairings]);

const radioTeam = createMockElement("input");
radioTeam.value = "TEAM";
radioTeam.parentElement = createMockElement("label");
const radioSingles = createMockElement("input");
radioSingles.value = "SINGLES";
radioSingles.parentElement = createMockElement("label");
document._setQuerySelectorAll('input[name="tournament-mode"]', [radioTeam, radioSingles]);

document._setElement("tournament-name", createMockElement("input"));
document._setElement("total-rounds", createMockElement("input"));
document._setElement("boards-count", createMockElement("input"));
document._setElement("points-win", createMockElement("input"));
document._setElement("points-draw", createMockElement("input"));
document._setElement("rules-preset", createMockElement("select"));
document._setElement("pairing-system", createMockElement("select"));

document._setElement("tournament-name-singles", createMockElement("input"));
document._setElement("total-rounds-singles", createMockElement("input"));
document._setElement("points-win-singles", createMockElement("input"));
document._setElement("points-draw-singles", createMockElement("input"));
document._setElement("pairing-system-singles", createMockElement("select"));
document._setElement("rules-preset-singles", createMockElement("select"));

loadFile("js/main.js");

console.log("=== MAIN INIT TESTS START ===");

assert.strictEqual(setupImportCalls, 1);
assert.strictEqual(loadStateCalls, 1);
assert.strictEqual(initThemeCalls, 1);
assert.strictEqual(presetListenersCalls, 1);

// Session values are applied when no legacy key exists
assert.strictEqual(state.mode, "SINGLES");
assert.strictEqual(state.theme, "light");

assert.strictEqual(document.getElementById("tournament-name").value, "Team Cup");
assert.strictEqual(document.getElementById("total-rounds").value, 7);
assert.strictEqual(document.getElementById("boards-count").value, 6);
assert.strictEqual(document.getElementById("points-win").value, 3);
assert.strictEqual(document.getElementById("points-draw").value, 1);
assert.strictEqual(document.getElementById("pairing-system").value, "SWISS");
assert.strictEqual(document.getElementById("tournament-name-singles").value, "Singles Cup");
assert.strictEqual(document.getElementById("rules-preset-singles").value, "USCF");

// SETUP branch in singles mode
assert.strictEqual(updateNavCalls > 0, true);
assert.strictEqual(renderSetupSinglesCalls > 0, true);
assert.deepStrictEqual(showSectionCalls, ["setup"]);

// Mode switch via radio handler
radioTeam.dispatchEvent({ type: "change", target: { value: "TEAM" } });
assert.strictEqual(state.mode, "TEAM");
assert.strictEqual(saveStateCalls > 0, true);
assert.strictEqual(renderAllCalls > 0, true);

// Nav click wiring
navPairings.dispatchEvent({ type: "click", target: { dataset: { target: "pairings" } } });
assert.deepStrictEqual(showSectionCalls.slice(-1), ["pairings"]);

assert.strictEqual(lockSetupCalls, 0); // state.status stays SETUP in this fixture

console.log("=== MAIN INIT TESTS END ===");
