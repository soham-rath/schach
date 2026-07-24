const fs = require("fs");
const path = require("path");

// --- MOCK GLOBALS ---
global.window = {};
global.document = {
    getElementById: () => null,
    querySelectorAll: () => []
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// --- MOCK STATE ---
global.state = {
    mode: 'SINGLES',
    singles: {
        players: [],
        rounds: [],
        currentRound: 0,
        config: {
            type: 'ROUND_ROBIN',
            pointsWin: 1,
            pointsDraw: 0.5,
            pointsLoss: 0,
            pointsBye: 1
        },
        excludedPlayersThisRound: []
    },
    teams: [],
    rounds: [],
    config: {}
};

// --- MOCK HELPER FUNCTIONS ---
// logic.js might use these if they are global, or we define them
global.getPlayer = (id) => {
    return global.state.singles.players.find(p => p.id === id);
};
global.getTeam = (id) => null; // Not needed for singles
global.SingleMatch = class SingleMatch {
    constructor(round, table, playerA, playerB) {
        this.round = round;
        this.table = table;
        this.playerA = playerA;
        this.playerB = playerB;
        this.result = null;
        this.isBye = (playerA === 'BYE' || playerB === 'BYE' || playerB === null);
    }
}


global.saveState = () => {};
global.commitState = () => {};
global.CONSTANTS = {
    MATCH_WIN: 1,
    MATCH_DRAW: 0.5,
    MATCH_LOSS: 0,
    BYE_MP: 1
};


// --- LOAD LOGIC ---
const standingsCode = fs.readFileSync(
    path.join(__dirname, "..", "js/logic/standings.js"),
    "utf8",
);
const pairingsCode = fs.readFileSync(
    path.join(__dirname, "..", "js/logic/pairings.js"),
    "utf8",
);
eval(standingsCode);
eval(pairingsCode);

// --- TEST CASES ---

function testRR_Even() {
    console.log("\n=== TEST: Even Players (4) ===");
    global.state.singles.players = [
        { id: "P1", name: "Player 1", mp:0, buchholz:0, opponents: [] },
        { id: "P2", name: "Player 2", mp:0, buchholz:0, opponents: [] },
        { id: "P3", name: "Player 3", mp:0, buchholz:0, opponents: [] },
        { id: "P4", name: "Player 4", mp:0, buchholz:0, opponents: [] }
    ];
    global.state.singles.rounds = [];
    global.state.singles.currentRound = 0;

    // 4 players -> 3 rounds
    for (let i = 0; i < 3; i++) {
        generatePairingsSinglesRoundRobin();
        const round = global.state.singles.rounds[i];
        console.log(`Round ${i+1}:`);
        round.matches.forEach(m => {
             console.log(`  Table ${m.table}: ${m.playerA} vs ${m.playerB}`);
        });
        
        // Verify uniqueness
        const seen = new Set();
        round.matches.forEach(m => {
            if(m.playerA) seen.add(m.playerA);
            if(m.playerB) seen.add(m.playerB);
        });
        if(seen.size !== 4) console.warn("WARNING: Not all players paired!");
    }
}

function testRR_Odd() {
    console.log("\n=== TEST: Odd Players (5) ===");
    global.state.singles.players = [
        { id: "P1", name: "Player 1", mp:0, buchholz:0, opponents: [] },
        { id: "P2", name: "Player 2", mp:0, buchholz:0, opponents: [] },
        { id: "P3", name: "Player 3", mp:0, buchholz:0, opponents: [] },
        { id: "P4", name: "Player 4", mp:0, buchholz:0, opponents: [] },
        { id: "P5", name: "Player 5", mp:0, buchholz:0, opponents: [] }
    ];
    global.state.singles.rounds = [];
    global.state.singles.currentRound = 0;

    // 5 players -> 5 rounds
    for (let i = 0; i < 5; i++) {
        generatePairingsSinglesRoundRobin();
        const round = global.state.singles.rounds[i];
        console.log(`Round ${i+1}:`);
        round.matches.forEach(m => {
             if (m.isBye) console.log(`  BYE: ${m.playerA}`);
             else console.log(`  Table ${m.table}: ${m.playerA} vs ${m.playerB}`);
        });
    }
}

// Run Tests
try {
    testRR_Even();
    testRR_Odd();
} catch (e) {
    console.error(e);
}
