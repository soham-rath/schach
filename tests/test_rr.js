// Mock DOM and Globals
global.window = {};
global.document = {};
global.localStorage = { getItem: () => null, setItem: () => {} };

// Mock State
global.state = {
    config: { type: 'ROUND_ROBIN', pointsMatchWin: 2, pointsMatchDraw: 1, pointsMatchLoss: 0, pointsBye: 2 },
    teams: [],
    rounds: [],
    currentRound: 0,
    currentRound: 0,
    excludedTeamsThisRound: []
};

// Mock Functions
global.commitState = () => {};
global.saveState = () => {};
global.getTeam = (id) => state.teams.find(t => t.id === id);

// Load Code
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
// State is mocked above for this isolated RR test.
loadFile('js/logic/standings.js');
loadFile('js/logic/pairings.js');

// Helper to reset
function resetState(teamNames) {
    state.teams = teamNames.map((name, i) => new Team(name, 'T'+i));
    state.rounds = [];
    state.currentRound = 0;
    state.config.totalRounds = teamNames.length % 2 === 0 ? teamNames.length - 1 : teamNames.length;
}

function printPairings() {
    console.log(`Round ${state.currentRound} Pairings:`);
    const round = state.rounds[state.currentRound - 1];
    round.matches.forEach(m => {
        const tA = state.teams.find(t => t.id === m.teamA);
        const tB = m.teamB ? state.teams.find(t => t.id === m.teamB) : {name: 'BYE'};
        console.log(`  ${tA.name} vs ${tB.name}`);
    });
}

function runTournament() {
    const total = state.config.totalRounds;
    for(let i=0; i<total; i++) {
        generatePairings();
        printPairings();
        // Simulate results (all draws)
        const round = state.rounds[state.currentRound - 1];
        round.matches.forEach(m => {
            if(!m.isBye) {
                m.results = ['0.5-0.5', '0.5-0.5', '0.5-0.5', '0.5-0.5'];
            }
        });
        calculateStandings();
    }
}

// TEST 1: 4 Teams (Even)
console.log("=== TEST 1: 4 Teams (Even) ===");
resetState(["A", "B", "C", "D"]);
runTournament();

// Verify: Expected 3 rounds.
// A should play B, C, D.
// Check consistency.
let A = state.teams.find(t => t.name === "A");
console.log("A played against:", A.opponents.map(oid => state.teams.find(t => t.id === oid).name).join(', '));


// TEST 2: 5 Teams (Odd)
console.log("\n=== TEST 2: 5 Teams (Odd) ===");
resetState(["A", "B", "C", "D", "E"]);
runTournament();

// Verify: Expected 5 rounds.
// A should play B, C, D, E and have 1 BYE.
A = state.teams.find(t => t.name === "A");
console.log("A played against:", A.opponents.map(oid => state.teams.find(t => t.id === oid).name).join(', '));
console.log("A had Bye:", A.hadBye);
