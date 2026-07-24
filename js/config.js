  const INITIAL_NAME = "Schachturnier";
  const INITIAL_TEAMS = ["Team 1", "Team 2", "Team 3", "Team 4"];
  const RULES_PRESETS = {
    FIDE: {
      pointsMatchWin: 2,
      pointsMatchDraw: 1,
      pointsMatchLoss: 0,
      pointsBye: 2,
    },
    USCF: {
      pointsMatchWin: 1,
      pointsMatchDraw: 0.5,
      pointsMatchLoss: 0,
      pointsBye: 1,
    },
    CUSTOM: null,
  };

  function getDefaultTeamDisplayFields() {
    return { id: false, note: true };
  }

  function getDefaultSinglesDisplayFields() {
    return { firstname: true, lastname: true, externalId: true, note: true };
  }

  const CONSTANTS = {
    WIN: 1,
    DRAW: 0.5,
    LOSS: 0,
    MATCH_WIN: 2,
    MATCH_DRAW: 1,
    MATCH_LOSS: 0,
    BYE_MP: 2,
    BYE_BP: 4,
  };
