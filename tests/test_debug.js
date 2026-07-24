// test_debug.js
global.window = {};
global.window = {};
global.document = {
    getElementById: (id) => ({ disabled: false, style: {}, classList: { add: () => { }, remove: () => { } }, innerText: "" }),
    querySelector: (sel) => ({ classList: { add: () => { }, remove: () => { } } }),
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({ innerHTML: "", appendChild: () => { }, classList: { add: () => { }, remove: () => { } } })
};
global.localStorage = { getItem: () => null, setItem: () => { } };
global.showAlert = console.log;
global.showToast = console.log;

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PROJECT_ROOT = path.join(__dirname, '..');

function loadFile(relPath) {
    console.log("Loading " + relPath);
    const code = fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
    vm.runInThisContext(code);
}

try {
    loadFile('js/config.js');
    loadFile('js/models.js');
    global.state = {};
    loadFile('js/state/core.js');
    loadFile('js/state/normalize.js');
    loadFile('js/state/storage.js');
    loadFile('js/state/history.js');
    loadFile('js/logic/standings.js');
    loadFile('js/logic/pairings.js');

    function resetState(teamNames) {
        state.teams = teamNames.map((name, i) => new Team(name, 'T' + i));
        state.rounds = [];
        state.currentRound = 0;
        state.config.type = 'SWISS';
        state.config.totalRounds = 3;
        normalizeState();
    }

    console.log("=== DEBUG START ===");
    resetState(["A", "B", "C", "D"]);

    console.log("Generating Round 1...");
    generatePairings();
    console.log("R1 Done. Matches:", state.rounds[0].matches.length);

    // Set Results
    state.rounds[0].matches.forEach(m => m.results = ['1-0', '1-0', '1-0', '1-0']);
    calculateStandings();

    console.log("Generating Round 2...");
    generatePairings();
    console.log("R2 Done. Matches:", state.rounds[1].matches.length);

    // Set Results
    state.rounds[1].matches.forEach(m => m.results = ['0.5-0.5', '0.5-0.5', '0.5-0.5', '0.5-0.5']);
    calculateStandings();

    console.log("Generating Round 3...");
    generatePairings();
    console.log("R3 Done. Matches:", state.rounds[2].matches.length);

    console.log("=== DEBUG END ===");

} catch (e) {
    console.error("ERROR:", e);
}
