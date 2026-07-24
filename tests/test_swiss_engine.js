// test_swiss_engine.js
// Verification suite for Swiss Engine

// Mock DOM and Globals
global.window = {};
global.window = {};
global.document = {
    getElementById: (id) => ({ disabled: false, style: {}, classList: { add: () => { }, remove: () => { } }, innerText: "" }),
    querySelector: (sel) => ({ classList: { add: () => { }, remove: () => { } } }),
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({ innerHTML: "", appendChild: () => { }, classList: { add: () => { }, remove: () => { } } })
};
global.localStorage = { getItem: () => null, setItem: () => { } };
// Mock functions to avoid UI errors
global.showAlert = (msg) => console.log("ALERT:", msg);
global.showToast = (msg) => console.log("TOAST:", msg);

// Load Logic
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PROJECT_ROOT = path.join(__dirname, '..');

function loadFile(relPath) {
    const code = fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
    vm.runInThisContext(code);
}

// Order matters
loadFile('js/config.js');
loadFile('js/models.js');
// Mock State Init
global.state = {};
loadFile('js/state/core.js'); // Logic relies on state global
loadFile('js/state/normalize.js');
loadFile('js/state/storage.js');
loadFile('js/state/history.js');
loadFile('js/logic/standings.js');
loadFile('js/logic/pairings.js');

// Helper to reset
function resetState(teamNames, type = 'SWISS') {
    state.teams = teamNames.map((name, i) => {
        const t = new Team(name, 'T' + i);
        t.id = 'T' + i; // Ensure short ID
        return t;
    });
    state.rounds = [];
    state.currentRound = 0;
    state.config.type = type;
    state.config.totalRounds = type === 'ROUND_ROBIN' ? teamNames.length - 1 : 5;
    normalizeState();
}

function printRound(roundNum) {
    console.log(`\n--- Round ${roundNum} ---`);
    const round = state.rounds[roundNum - 1];
    round.matches.forEach(m => {
        const tA = getTeam(m.teamA);
        const tB = m.teamB ? getTeam(m.teamB) : { name: 'BYE' };
        const color = m.teamAColor || '?';
        console.log(`  ${tA.name} (${color}) vs ${tB.name}`);
    });
}

function runRound(results) {
    // Generate
    if (state.config.type === 'ROUND_ROBIN') generatePairingsRoundRobin();
    else generatePairings();

    printRound(state.currentRound);

    // Simulate Results
    const round = state.rounds[state.currentRound - 1];
    round.matches.forEach((m, idx) => {
        if (m.isBye) return;

        let res = results ? results[idx] : '1-0'; // Default to Win for Team A
        // If results is 'random', pick one
        if (results === 'random') {
            const r = Math.random();
            res = r > 0.6 ? '1-0' : (r > 0.3 ? '0.5-0.5' : '0-1');
        }

        // Fill all boards
        m.results = m.results.map(() => res);
    });

    calculateStandings();
}

console.log("=== TEST 1: Swiss 4 Teams, 3 Rounds ===");
resetState(["A", "B", "C", "D"], 'SWISS');

// Round 1
runRound(['1-0', '1-0']); // A beats C? (Split 1v3, 2v4). A(1) vs C(3). B(2) vs D(4).
// Ranking: A(1), B(1), C(0), D(0)

// Round 2
// Winners play winners: A vs B. Losers vs Losers: C vs D.
runRound(['0.5-0.5', '1-0']);
// A=1.5, B=1.5, C=1, D=0

// Round 3
// A played B(draw), C(win). A needs D?
// B played A(draw), D(win). B needs C?
runRound(['1-0', '1-0']);

// Check History
console.log("\nHistory check:");
state.teams.forEach(t => {
    console.log(`${t.name}: Opp=${t.opponents.join(',')}, Colors=${t.colorHistory.join(',')}`);
});

console.log("\n=== TEST 2: Round Robin 4 Teams ===");
resetState(["A", "B", "C", "D"], 'ROUND_ROBIN');
for (let i = 0; i < 3; i++) runRound();

console.log("\nRR Colors check:");
state.teams.forEach(t => {
    console.log(`${t.name}: Colors=${t.colorHistory.join(',')}`);
});
