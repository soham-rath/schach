// test_rr_verification.js
global.window = {};
global.document = {
    getElementById: (id) => ({ disabled: false, style: {}, classList: { add: () => { }, remove: () => { } }, innerText: "" }),
    querySelector: (sel) => ({ classList: { add: () => { }, remove: () => { } } }),
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({ innerHTML: "", appendChild: () => { }, classList: { add: () => { }, remove: () => { } } })
};
global.localStorage = { getItem: () => null, setItem: () => { } };
global.showAlert = console.log;

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PROJECT_ROOT = path.join(__dirname, '..');

function loadFile(relPath) {
    const code = fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
    vm.runInThisContext(code);
}

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
    state.config.type = 'ROUND_ROBIN';
    state.config.totalRounds = teamNames.length - 1;
    normalizeState();
}

console.log("=== RR TEST START ===");
resetState(["A", "B", "C", "D"]); // 4 Teams

// Expected: 3 Rounds
// Round 1
generatePairingsRoundRobin();
console.log("R1:");
state.rounds[0].matches.forEach(m => {
    const tA = getTeam(m.teamA);
    const tB = getTeam(m.teamB);
    console.log(`  ${tA.name} (${m.teamAColor}) vs ${tB.name}`);
});

// Round 2
state.rounds[0].matches.forEach(m => m.results = ['0.5-0.5']);
calculateStandings();
generatePairingsRoundRobin();
console.log("R2:");
state.rounds[1].matches.forEach(m => {
    const tA = getTeam(m.teamA);
    const tB = getTeam(m.teamB);
    console.log(`  ${tA.name} (${m.teamAColor}) vs ${tB.name}`);
});

// Round 3
state.rounds[1].matches.forEach(m => m.results = ['0.5-0.5']);
calculateStandings();
generatePairingsRoundRobin();
console.log("R3:");
state.rounds[2].matches.forEach(m => {
    const tA = getTeam(m.teamA);
    const tB = getTeam(m.teamB);
    console.log(`  ${tA.name} (${m.teamAColor}) vs ${tB.name}`);
});

console.log("=== RR TEST END ===");
