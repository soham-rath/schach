function loadDefaults() {
  if (typeof INITIAL_TEAMS !== "undefined" && Array.isArray(INITIAL_TEAMS)) {
    state.teams = INITIAL_TEAMS.map((name) => {
      const id = "T" + Math.random().toString(36).substr(2, 9);
      return new Team(name, id);
    });
  }
}

function getTeam(id) {
  if (!state.teams) return null;
  return state.teams.find((t) => t.id === id);
}

function getPlayer(id) {
  if (!state.singles || !state.singles.players) return null;
  return state.singles.players.find((p) => p.id === id);
}

function normalizeState() {
  const defaultConfig = {
    name: "Turnier",
    type: "SWISS",
    totalRounds: 5,
    boardsPerMatch: 4,
    pointsMatchWin: 2,
    pointsMatchDraw: 1,
    pointsMatchLoss: 0,
    pointsBye: 2,
    rulesPreset: "CUSTOM",
  };

  state.config = { ...defaultConfig, ...(state.config || {}) };
  if (!state.config.type) state.config.type = "SWISS";
  if (!state.mode) state.mode = "TEAM";
  if (!state.singles) {
    state.singles = {
      config: {
        name: "Einzelturnier",
        type: "SWISS",
        totalRounds: 5,
        pointsWin: 1,
        pointsDraw: 0.5,
        pointsLoss: 0,
        pointsBye: 1,
        rulesPreset: "CUSTOM",
      },
      players: [],
      rounds: [],
      currentRound: 0,
      status: "SETUP",
    };
  }
  if (!Array.isArray(state.teams)) state.teams = [];
  if (!Array.isArray(state.rounds)) state.rounds = [];
  if (!Array.isArray(state.excludedTeamsThisRound))
    state.excludedTeamsThisRound = [];
  if (typeof state.currentRound !== "number") state.currentRound = 0;
  if (!state.status) state.status = "SETUP";
  if (!state.theme) state.theme = "dark";

  state.teams.forEach((t) => {
    if (!Array.isArray(t.opponents)) t.opponents = [];
    if (typeof t.hadBye !== "boolean") t.hadBye = false;
    if (typeof t.mp !== "number") t.mp = 0;
    if (typeof t.bp !== "number") t.bp = 0;
    if (typeof t.buchholz !== "number") t.buchholz = 0;
    if (typeof t.medianBuchholz !== "number") t.medianBuchholz = 0;
    if (typeof t.sonnebornBerger !== "number") t.sonnebornBerger = 0;
    if (!Array.isArray(t.colorHistory)) t.colorHistory = [];
    if (typeof t.colorPreference !== "number") t.colorPreference = 0;
    if (!Array.isArray(t.players)) t.players = [];
  });

  if (!state.singles.config) {
    state.singles.config = {
      name: "Einzelturnier",
      type: "SWISS",
      totalRounds: 5,
      pointsWin: 1,
      pointsDraw: 0.5,
      pointsLoss: 0,
      pointsBye: 1,
      rulesPreset: "CUSTOM",
    };
  }
  if (!state.singles.config.rulesPreset) state.singles.config.rulesPreset = "CUSTOM";
  if (!state.singles.config.type) state.singles.config.type = "SWISS";
  if (!Array.isArray(state.singles.players)) state.singles.players = [];
  if (!Array.isArray(state.singles.rounds)) state.singles.rounds = [];
  if (typeof state.singles.currentRound !== "number")
    state.singles.currentRound = 0;
  if (!state.singles.status) state.singles.status = "SETUP";
  if (!Array.isArray(state.singles.excludedPlayersThisRound))
    state.singles.excludedPlayersThisRound = [];

  state.singles.players.forEach((p) => {
    if (!Array.isArray(p.opponents)) p.opponents = [];
    if (typeof p.hadBye !== "boolean") p.hadBye = false;
    if (typeof p.mp !== "number") p.mp = 0;
    if (typeof p.buchholz !== "number") p.buchholz = 0;
    if (!Array.isArray(p.colorHistory)) p.colorHistory = [];
    if (typeof p.colorPreference !== "number") p.colorPreference = 0;
  });

  state.rounds.forEach((round) => {
    if (!Array.isArray(round.matches)) round.matches = [];
    round.matches.forEach((m) => {
      if (!Array.isArray(m.results)) {
        m.results = new Array(state.config.boardsPerMatch).fill(null);
      } else if (m.results.length < state.config.boardsPerMatch) {
        const needed = state.config.boardsPerMatch - m.results.length;
        m.results = m.results.concat(new Array(needed).fill(null));
      }
      if (typeof m.isBye !== "boolean") m.isBye = m.teamB === null;
      if (m.teamAColor !== "W" && m.teamAColor !== "B") m.teamAColor = null;
    });
  });

  state.singles.rounds.forEach((round) => {
    if (!Array.isArray(round.matches)) round.matches = [];
    round.matches.forEach((m) => {
      if (typeof m.isBye !== "boolean") m.isBye = m.playerB === null;
      if (m.playerAColor !== "W" && m.playerAColor !== "B") m.playerAColor = null;
    });
  });
}
