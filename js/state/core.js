let state = {
  config: {
    name: "Turnier",
    type: "SWISS", // 'SWISS' or 'ROUND_ROBIN'
    totalRounds: 5,
    boardsPerMatch: 4,
    pointsMatchWin: 2,
    pointsMatchDraw: 1,
    pointsMatchLoss: 0,
    pointsBye: 2,
    rulesPreset: "CUSTOM",
    displayFields: getDefaultTeamDisplayFields(),
  },
  mode: "TEAM",
  singles: {
    config: {
      name: "Einzelturnier",
      type: "SWISS",
      totalRounds: 5,
      pointsWin: 1,
      pointsDraw: 0.5,
      pointsLoss: 0,
      pointsBye: 1,
      rulesPreset: "CUSTOM",
      displayFields: getDefaultSinglesDisplayFields(),
    },
    players: [],
    rounds: [],
    currentRound: 0,
    status: "SETUP",
    excludedPlayersThisRound: [],
    forcedPairsThisRound: [],
  },
  teams: [], // Array of Team objects
  rounds: [], // Array of Round objects
  currentRound: 0,
  status: "SETUP", // SETUP, RUNNING, FINISHED
  excludedTeamsThisRound: [], // Temporarily excluded team IDs for current round generation
  forcedPairsThisRound: [], // Temporarily forced team pairings for current round generation
  theme: "dark",
};

// --- HISTORY STATE ---
let historyStack = [];
let futureStack = [];

// --- PERSISTENCE ---
