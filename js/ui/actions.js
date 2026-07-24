function initTheme() {
  if (!state.theme) state.theme = "dark";
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.innerText = state.theme === "dark" ? "☀️" : "🌙";
  }
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getBoardsPerMatch() {
  return parsePositiveInt(state.config?.boardsPerMatch, 4);
}

function hasTeamNameConflict(name, ignoreId = null) {
  const normalized = String(name || "").trim().toLocaleLowerCase();
  return state.teams.some(
    (t) =>
      t.id !== ignoreId &&
      String(t.name || "").trim().toLocaleLowerCase() === normalized,
  );
}

function hasPlayerNameConflict(name, ignoreId = null) {
  const normalized = String(name || "").trim().toLocaleLowerCase();
  return state.singles.players.some(
    (p) =>
      p.id !== ignoreId &&
      String(p.name || "").trim().toLocaleLowerCase() === normalized,
  );
}

function hasRecordedBoardsBeyondLimit(limit) {
  for (const round of state.rounds) {
    for (const match of round.matches) {
      if (match.isBye || !Array.isArray(match.results)) continue;
      if (match.results.slice(limit).some((res) => res !== null)) return true;
    }
  }
  return false;
}

function syncBoardArraysToCount(boardCount) {
  state.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.isBye) return;
      if (!Array.isArray(match.results)) match.results = [];
      if (match.results.length < boardCount) {
        const missing = boardCount - match.results.length;
        match.results = match.results.concat(new Array(missing).fill(null));
      } else if (match.results.length > boardCount) {
        match.results = match.results.slice(0, boardCount);
      }
    });
  });
}

function addTeam() {
  try {
    const input = document.getElementById("new-team-name");
    const name = input.value.trim();
    if (!name) return;
    if (hasTeamNameConflict(name)) {
      showAlert("Dieses Team existiert bereits.", "Doppelter Name");
      return;
    }

    const id =
      "T" + Date.now().toString().slice(-4) + Math.floor(Math.random() * 100);
    commitState();
    state.teams.push(new Team(name, id));
    input.value = "";
    renderSetup();
    saveState();
  } catch (e) {
    console.error(e);
    showAlert("Fehler beim Hinzufügen: " + e.message, "Fehler");
  }
}

function addPlayer() {
  try {
    const input = document.getElementById("new-player-name");
    const name = input.value.trim();
    if (!name) return;
    if (hasPlayerNameConflict(name)) {
      showAlert("Dieser Spieler existiert bereits.", "Doppelter Name");
      return;
    }
    const id =
      "P" + Date.now().toString().slice(-4) + Math.floor(Math.random() * 100);
    commitState();
    state.singles.players.push(new Player(name, id));
    input.value = "";
    renderSetupSingles();
    saveState();
  } catch (e) {
    console.error(e);
    showAlert("Fehler beim Hinzufügen: " + e.message, "Fehler");
  }
}

function editPlayer(id) {
  document.getElementById(`pname-display-${id}`).style.display = "none";
  const input = document.getElementById(`pname-input-${id}`);
  input.style.display = "block";
  input.focus();
}

function savePlayerName(id) {
  const input = document.getElementById(`pname-input-${id}`);
  const newName = input.value.trim();
  if (newName) {
    if (hasPlayerNameConflict(newName, id)) {
      showAlert("Dieser Spielername ist bereits vergeben.", "Doppelter Name");
      renderSetupSingles();
      return;
    }
    const player = getPlayer(id);
    if (player) {
      commitState();
      player.name = newName;
      saveState();
      renderAll();
    }
  }
  renderSetupSingles();
}

function removePlayer(id) {
  if (state.singles.status !== "SETUP") {
    showAlert("Spieler können nach Turnierstart nicht entfernt werden.", "Hinweis");
    return;
  }
  commitState();
  state.singles.players = state.singles.players.filter((p) => p.id !== id);
  renderSetupSingles();
  saveState();
}

function editTeam(id) {
  document.getElementById(`name-display-${id}`).style.display = "none";
  const input = document.getElementById(`name-input-${id}`);
  input.style.display = "block";
  input.focus();
}

function saveTeamName(id) {
  const input = document.getElementById(`name-input-${id}`);
  const newName = input.value.trim();
  if (newName) {
    if (hasTeamNameConflict(newName, id)) {
      showAlert("Dieser Teamname ist bereits vergeben.", "Doppelter Name");
      renderSetup();
      return;
    }
    const team = getTeam(id);
    if (team) {
      commitState();
      team.name = newName;
      saveState();
      renderAll();
    }
  }
  renderSetup(); // Reset view
}

function removeTeam(id) {
  if (state.status !== "SETUP") {
    showAlert("Teams können nach Turnierstart nicht entfernt werden.", "Hinweis");
    return;
  }
  commitState();
  state.teams = state.teams.filter((t) => t.id !== id);
  renderSetup();
  saveState();
}

function startTournament() {
  try {
    if (state.teams.length < 2) {
      showAlert("Mindestens 2 Teams erforderlich.", "Zu wenige Teams");
      return;
    }

    commitState();

    state.config.name = document.getElementById("tournament-name").value;
    const rInput = document.getElementById("total-rounds");
    state.config.totalRounds = parsePositiveInt(
      rInput ? rInput.value : null,
      5,
    );

    // Read new config
    state.config.boardsPerMatch = parsePositiveInt(
      document.getElementById("boards-count").value,
      4,
    );
    syncBoardArraysToCount(state.config.boardsPerMatch);
    const presetSelect = document.getElementById("rules-preset");
    const preset = presetSelect ? presetSelect.value : "CUSTOM";
    state.config.rulesPreset = preset || "CUSTOM";

    // Read pairing system
    const pairingSelect = document.getElementById("pairing-system");
    state.config.type = pairingSelect ? pairingSelect.value : "SWISS";

    if (state.config.type === "ROUND_ROBIN") {
      // Auto-set rounds for Round Robin
      const teamCount = state.teams.length;
      // If even teams: N-1 rounds
      // If odd teams: N rounds (each team has one bye)
      state.config.totalRounds =
        teamCount % 2 === 0 ? teamCount - 1 : teamCount;
    }

    if (preset && preset !== "CUSTOM") {
      applyRulesPreset(preset);
    } else {
      state.config.pointsMatchWin = parseNonNegativeNumber(
        document.getElementById("points-win").value,
        2,
      );
      state.config.pointsMatchDraw = parseNonNegativeNumber(
        document.getElementById("points-draw").value,
        1,
      );
      state.config.pointsMatchLoss = 0;
      state.config.pointsBye = state.config.pointsMatchWin; // Bye = Win points
    }

    state.status = "RUNNING";
    saveState();
    lockSetup();
    updateNavigation();

    if (state.config.type === "ROUND_ROBIN") {
      state.excludedTeamsThisRound = [];
      generatePairings();
      showSection("pairings");
      renderAll();
      window.scrollTo(0, 0);
      return;
    }

    // Show modal to select teams to exclude for first round (Swiss only)
    showExcludeModal();
  } catch (e) {
    console.error("Error while starting team tournament", e);
    showAlert("Fehler beim Starten des Turniers: " + e.message, "Fehler");
  }
}

function startSinglesTournament() {
  try {
    if (state.singles.players.length < 2) {
      showAlert("Mindestens 2 Spieler erforderlich.", "Zu wenige Spieler");
      return;
    }

    commitState();

    state.singles.config.name = document.getElementById(
      "tournament-name-singles",
    ).value;
    const rInput = document.getElementById("total-rounds-singles");
    state.singles.config.totalRounds = parsePositiveInt(
      rInput ? rInput.value : null,
      5,
    );
    const pairingSelect = document.getElementById("pairing-system-singles");
    state.singles.config.type = pairingSelect
      ? pairingSelect.value
      : state.singles.config.type || "SWISS";
    const presetSelect = document.getElementById("rules-preset-singles");
    const preset = presetSelect ? presetSelect.value : "CUSTOM";
    state.singles.config.rulesPreset = preset || "CUSTOM";

    if (state.singles.config.type === "ROUND_ROBIN") {
      const playerCount = state.singles.players.length;
      state.singles.config.totalRounds =
        playerCount % 2 === 0 ? playerCount - 1 : playerCount;
    }

    if (preset && preset !== "CUSTOM") {
      applySinglesRulesPreset(preset);
    } else {
      state.singles.config.pointsWin = parseNonNegativeNumber(
        document.getElementById("points-win-singles").value,
        1,
      );
      state.singles.config.pointsDraw = parseNonNegativeNumber(
        document.getElementById("points-draw-singles").value,
        0.5,
      );
      state.singles.config.pointsLoss = 0;
      state.singles.config.pointsBye = state.singles.config.pointsWin;
    }

    state.singles.status = "RUNNING";
    saveState();
    updateNavigation();
    lockSetup();

    if (state.singles.config.type === "ROUND_ROBIN") {
      state.singles.excludedPlayersThisRound = [];
      generatePairingsSingles();
      showSection("pairings");
      renderAll();
      window.scrollTo(0, 0);
      return;
    }

    showExcludeSinglesModal();
  } catch (e) {
    console.error("Error while starting singles tournament", e);
    showAlert("Fehler beim Starten des Turniers: " + e.message, "Fehler");
  }
}

async function nextRound() {
  // Check if round complete
  const currentRoundObj = state.rounds[state.currentRound - 1];
  if (!currentRoundObj) {
    showAlert("Keine aktuelle Runde gefunden.", "Hinweis");
    return;
  }
  const incomplete = currentRoundObj.matches.some(
    (m) => !m.isBye && m.results.includes(null),
  );

  if (
    incomplete &&
    !(await showConfirm(
      "Einige Ergebnisse fehlen. Trotzdem nächste Runde? (Fehlende werden als 0-0 gewertet)",
      "Runde unvollständig",
    ))
  ) {
    return;
  }
  if (incomplete) {
    commitState();
    currentRoundObj.matches.forEach((m) => {
      if (m.isBye) return;
      m.results = m.results.map((res) => (res === null ? "0-0" : res));
    });
    saveState();
  }

  calculateStandings();

  if (state.currentRound >= state.config.totalRounds) {
    showAlert("Turnier beendet! Endstand wird angezeigt.", "Turnierende");
    state.status = "FINISHED";
    calculateStandings();
    saveState();
    renderStandings();
    showSection("standings");
    return;
  }

  if (state.config.type === "ROUND_ROBIN") {
    state.excludedTeamsThisRound = [];
    generatePairings();
    showSection("pairings");
    renderAll();
    window.scrollTo(0, 0);
    return;
  }

  // Show modal to select teams to exclude (Swiss only)
  showExcludeModal();
}

function addExtraRound() {
  if (state.config.type === "ROUND_ROBIN") {
    showAlert(
      "Im Round-Robin-Modus sind zusätzliche Runden nicht verfügbar.",
      "Hinweis",
    );
    return;
  }

  state.config.totalRounds++;
  const roundsInput = document.getElementById("total-rounds");
  if (roundsInput) roundsInput.value = state.config.totalRounds;
  state.status = "RUNNING";
  saveState();

  // Immediately show exclusion modal for the new round
  showExcludeModal();
  renderAll();
}

function confirmExcludeAndPair() {
  if (state.config.type === "ROUND_ROBIN") {
    state.excludedTeamsThisRound = [];
    state.forcedPairsThisRound = [];
    closeExcludeModal();
    generatePairings();
    showSection("pairings");
    renderAll();
    window.scrollTo(0, 0);
    return;
  }

  // Collect excluded team IDs
  const checkboxes = document.querySelectorAll(
    '#exclude-teams-list input[type="checkbox"]:checked',
  );
  state.excludedTeamsThisRound = Array.from(checkboxes).map((cb) => cb.value);

  // Check if we have at least 2 teams remaining
  const remainingTeams = state.teams.filter(
    (t) => !state.excludedTeamsThisRound.includes(t.id),
  );
  if (remainingTeams.length < 2) {
    showAlert(
      "Es müssen mindestens 2 Teams für die Paarungen übrig bleiben.",
      "Hinweis",
    );
    return;
  }

  closeExcludeModal();
  showForcedPairingModal();
}

function confirmForcedPairsAndGenerate() {
  const container = document.getElementById("forced-pairs-list");
  const rows = container ? container.querySelectorAll(".forced-pair-row") : [];
  const pairs = [];
  const usedIds = new Set();
  const excludedIds = new Set(state.excludedTeamsThisRound || []);

  for (const row of rows) {
    const a = row.querySelector(".forced-pair-a").value;
    const b = row.querySelector(".forced-pair-b").value;
    if (!a || !b) continue;

    if (a === b) {
      showAlert(
        "Die beiden ausgewählten Teams müssen unterschiedlich sein.",
        "Hinweis",
      );
      return;
    }
    if (excludedIds.has(a) || excludedIds.has(b)) {
      showAlert(
        "Ein ausgeschlossenes Team kann nicht in einer fixen Paarung spielen.",
        "Hinweis",
      );
      return;
    }
    if (usedIds.has(a) || usedIds.has(b)) {
      showAlert(
        "Jedes Team kann nur in einer fixen Paarung verwendet werden.",
        "Hinweis",
      );
      return;
    }
    usedIds.add(a);
    usedIds.add(b);
    pairs.push({ a, b });
  }

  state.forcedPairsThisRound = pairs;
  closeForcedPairingModal();
  generatePairings();
  showSection("pairings");
  renderAll();
  window.scrollTo(0, 0);
}

function confirmExcludeSinglesAndPair() {
  if (state.singles.config.type === "ROUND_ROBIN") {
    state.singles.excludedPlayersThisRound = [];
    state.singles.forcedPairsThisRound = [];
    closeExcludeSinglesModal();
    generatePairingsSingles();
    showSection("pairings");
    renderAll();
    window.scrollTo(0, 0);
    return;
  }

  const checkboxes = document.querySelectorAll(
    '#exclude-players-list input[type="checkbox"]:checked',
  );
  state.singles.excludedPlayersThisRound = Array.from(checkboxes).map(
    (cb) => cb.value,
  );

  const remainingPlayers = state.singles.players.filter(
    (p) => !state.singles.excludedPlayersThisRound.includes(p.id),
  );
  if (remainingPlayers.length < 2) {
    showAlert(
      "Es müssen mindestens 2 Spieler für die Paarungen übrig bleiben.",
      "Hinweis",
    );
    return;
  }

  closeExcludeSinglesModal();
  showForcedPairingSinglesModal();
}

function confirmForcedSinglesPairsAndGenerate() {
  const container = document.getElementById("forced-pairs-singles-list");
  const rows = container ? container.querySelectorAll(".forced-pair-row") : [];
  const pairs = [];
  const usedIds = new Set();
  const excludedIds = new Set(state.singles.excludedPlayersThisRound || []);

  for (const row of rows) {
    const a = row.querySelector(".forced-pair-a").value;
    const b = row.querySelector(".forced-pair-b").value;
    if (!a || !b) continue;

    if (a === b) {
      showAlert(
        "Die beiden ausgewählten Spieler müssen unterschiedlich sein.",
        "Hinweis",
      );
      return;
    }
    if (excludedIds.has(a) || excludedIds.has(b)) {
      showAlert(
        "Ein ausgeschlossener Spieler kann nicht in einer fixen Paarung spielen.",
        "Hinweis",
      );
      return;
    }
    if (usedIds.has(a) || usedIds.has(b)) {
      showAlert(
        "Jeder Spieler kann nur in einer fixen Paarung verwendet werden.",
        "Hinweis",
      );
      return;
    }
    usedIds.add(a);
    usedIds.add(b);
    pairs.push({ a, b });
  }

  state.singles.forcedPairsThisRound = pairs;
  closeForcedPairingSinglesModal();
  generatePairingsSingles();
  showSection("pairings");
  renderAll();
  window.scrollTo(0, 0);
}

function updateSettings() {
  const nameValue = document.getElementById("tournament-name").value;
  const roundsInput = document.getElementById("total-rounds");
  let nextRounds = parsePositiveInt(
    roundsInput ? roundsInput.value : null,
    state.config.totalRounds || 1,
  );
  const pairingSelect = document.getElementById("pairing-system");
  const nextType = (pairingSelect ? pairingSelect.value : state.config.type) || "SWISS";

  const currentBoards = getBoardsPerMatch();
  const nextBoards = parsePositiveInt(
    document.getElementById("boards-count").value,
    currentBoards,
  );
  if (
    nextBoards < currentBoards &&
    hasRecordedBoardsBeyondLimit(nextBoards)
  ) {
    showAlert(
      "Brettanzahl kann nicht reduziert werden, solange dort Ergebnisse eingetragen sind.",
      "Ungültige Einstellung",
    );
    const boardsInput = document.getElementById("boards-count");
    if (boardsInput) boardsInput.value = currentBoards;
    return;
  }
  if (nextType === "ROUND_ROBIN") {
    const teamCount = state.teams.length;
    nextRounds = teamCount < 2 ? 1 : (teamCount % 2 === 0 ? teamCount - 1 : teamCount);
  }
  nextRounds = Math.max(nextRounds, state.currentRound || 0);

  const presetSelect = document.getElementById("rules-preset");
  const preset = presetSelect ? presetSelect.value : "CUSTOM";
  const nextRulesPreset = preset || "CUSTOM";
  const nextWin = parseNonNegativeNumber(
    document.getElementById("points-win").value,
    state.config.pointsMatchWin ?? 2,
  );
  const nextDraw = parseNonNegativeNumber(
    document.getElementById("points-draw").value,
    state.config.pointsMatchDraw ?? 1,
  );

  commitState();
  state.config.name = nameValue;
  state.config.type = nextType;
  state.config.boardsPerMatch = nextBoards;
  syncBoardArraysToCount(nextBoards);
  state.config.totalRounds = nextRounds;
  state.config.rulesPreset = nextRulesPreset;
  if (roundsInput) roundsInput.value = nextRounds;

  if (nextRulesPreset && nextRulesPreset !== "CUSTOM") {
    applyRulesPreset(nextRulesPreset);
  } else {
    state.config.pointsMatchWin = nextWin;
    state.config.pointsMatchDraw = nextDraw;
    state.config.pointsMatchLoss = 0;
    state.config.pointsBye = nextWin;
  }

  // Read team display-field toggles
  const displayTeamId = document.getElementById("display-team-id");
  const displayTeamNote = document.getElementById("display-team-note");
  state.config.displayFields = {
    ...getDefaultTeamDisplayFields(),
    id: displayTeamId ? displayTeamId.checked : getDefaultTeamDisplayFields().id,
    note: displayTeamNote ? displayTeamNote.checked : getDefaultTeamDisplayFields().note,
  };

  calculateStandings();
  saveState();
  renderAll();
  showToast("Einstellungen gespeichert.", "success");
}

function updateSinglesSettings() {
  const nameValue = document.getElementById("tournament-name-singles").value;
  const roundsInput = document.getElementById("total-rounds-singles");
  let nextRounds = parsePositiveInt(
    roundsInput ? roundsInput.value : null,
    state.singles.config.totalRounds || 1,
  );
  const pairingSelect = document.getElementById("pairing-system-singles");
  const nextType = (pairingSelect ? pairingSelect.value : state.singles.config.type) || "SWISS";

  if (nextType === "ROUND_ROBIN") {
    const playerCount = state.singles.players.length;
    nextRounds = playerCount < 2 ? 1 : (playerCount % 2 === 0 ? playerCount - 1 : playerCount);
  }
  nextRounds = Math.max(nextRounds, state.singles.currentRound || 0);

  const presetSelect = document.getElementById("rules-preset-singles");
  const preset = presetSelect ? presetSelect.value : "CUSTOM";
  const nextRulesPreset = preset || "CUSTOM";
  const nextWin = parseNonNegativeNumber(
    document.getElementById("points-win-singles").value,
    state.singles.config.pointsWin ?? 1,
  );
  const nextDraw = parseNonNegativeNumber(
    document.getElementById("points-draw-singles").value,
    state.singles.config.pointsDraw ?? 0.5,
  );

  commitState();
  state.singles.config.name = nameValue;
  state.singles.config.type = nextType;
  state.singles.config.totalRounds = nextRounds;
  state.singles.config.rulesPreset = nextRulesPreset;
  if (roundsInput) roundsInput.value = nextRounds;

  if (nextRulesPreset && nextRulesPreset !== "CUSTOM") {
    applySinglesRulesPreset(nextRulesPreset);
  } else {
    state.singles.config.pointsWin = nextWin;
    state.singles.config.pointsDraw = nextDraw;
    state.singles.config.pointsLoss = 0;
    state.singles.config.pointsBye = nextWin;
  }

  // Read display-field toggles from singles settings
  const displayFirstname = document.getElementById("display-firstname");
  const displayLastname = document.getElementById("display-lastname");
  const displayExternalId = document.getElementById("display-external-id");
  const displayNote = document.getElementById("display-note");
  state.singles.config.displayFields = {
    ...getDefaultSinglesDisplayFields(),
    firstname: displayFirstname ? displayFirstname.checked : getDefaultSinglesDisplayFields().firstname,
    lastname: displayLastname ? displayLastname.checked : getDefaultSinglesDisplayFields().lastname,
    externalId: displayExternalId ? displayExternalId.checked : getDefaultSinglesDisplayFields().externalId,
    note: displayNote ? displayNote.checked : getDefaultSinglesDisplayFields().note,
  };

  calculateStandingsSingles();
  saveState();
  renderAll();
  showToast("Einstellungen gespeichert.", "success");
}

async function updateMatchResult(roundNum, matchIndex, boardIndex, value) {
  commitState(); // Save undo state before changing result
  const round = state.rounds[roundNum - 1]; // Use the passed roundNum
  if (!round || !round.matches[matchIndex]) return;
  if (!Array.isArray(round.matches[matchIndex].results)) {
    round.matches[matchIndex].results = new Array(
      getBoardsPerMatch(),
    ).fill(null);
  }
  if (boardIndex < 0 || boardIndex >= round.matches[matchIndex].results.length)
    return;
  round.matches[matchIndex].results[boardIndex] = value === "" ? null : value;

  // Only check completeness if we are editing the current active round
  if (roundNum === state.currentRound) {
    checkRoundCompleteness();
  }

  // Recalculate and save immediately
  // Note: This might be heavy if very fast clicking, but ensures consistency
  calculateStandings();
  await saveState();

  // Re-render to update the live board count
  // We should stay on the same round view
  renderResults(roundNum);
  renderStandings(); // Update standings live as results come in
  renderDashboard(); // Update stats live
}

function resetTournament() {
  const modal = document.getElementById("reset-options-modal");
  const msg = document.getElementById("reset-options-message");
  if (msg) {
    msg.innerText =
      state.mode === "SINGLES"
        ? "Spieler löschen oder behalten?"
        : "Mannschaften löschen oder behalten?";
  }
  if (modal) modal.classList.remove("hidden");
}

function closeResetOptionsModal() {
  const modal = document.getElementById("reset-options-modal");
  if (modal) modal.classList.add("hidden");
}

function resetRemoveRoster() {
  closeResetOptionsModal();
  showConfirm(
    "Wirklich das gesamte Turnier löschen? Alle Daten gehen verloren!",
    "Turnier Reset",
  ).then((ok) => {
    if (!ok) return;
    try {
      // Create a new tournament slot and keep the old one stored.
      createNewTournament(true);
    } catch (e) {
      console.warn(e);
    }
  });
}

// --- TOURNAMENT MANAGER UI ---

function openTournamentManager() {
  const list = document.getElementById("tournament-list");
  list.innerHTML = "";

  const tournaments = getTournamentList();
  tournaments.sort((a, b) => b.lastModified - a.lastModified);

  tournaments.forEach(t => {
    const li = document.createElement("li");
    li.className = "tournament-item";
    li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding: 0.5rem; border-bottom: 1px solid var(--border-color);";

    const date = new Date(t.lastModified).toLocaleString();
    const isActive = t.id === state.id;

    li.innerHTML = `
            <div style="flex:1">
                <div style="font-weight:bold; ${isActive ? 'color:var(--primary-color);' : ''}">
                    ${formatTeamDisplay(t)} ${isActive ? '(Aktiv)' : ''}
                </div>
                <div style="font-size:0.8rem; opacity:0.7">
                    ${t.mode === 'SINGLES' ? 'Einzel' : 'Team'} • ${date}
                </div>
            </div>
            <div style="display:flex; gap:0.5rem;">
                ${!isActive ? `<button class="btn secondary sm" onclick="switchTournament('${t.id}')">Laden</button>` : ''}
                <button class="btn danger sm" onclick="deleteTournamentUI('${t.id}')">🗑️</button>
            </div>
        `;
    list.appendChild(li);
  });

  document.getElementById("tournament-manager-modal").classList.remove("hidden");
}

function closeTournamentManager() {
  document.getElementById("tournament-manager-modal").classList.add("hidden");
}

function createNewTournamentUI() {
  if (confirm("Neues Turnier erstellen? Das aktuelle Turnier wird geschlossen (aber gespeichert).")) {
    createNewTournament();
  }
}

function deleteTournamentUI(id) {
  if (confirm("Turnier wirklich unwiderruflich löschen?")) {
    deleteTournament(id);
    openTournamentManager(); // Refresh list
  }
}


function resetKeepRoster() {
  closeResetOptionsModal();
  commitState();
  if (state.mode === "SINGLES") {
    state.singles.rounds = [];
    state.singles.currentRound = 0;
    state.singles.status = "SETUP";
    state.singles.excludedPlayersThisRound = [];
    state.singles.players.forEach((p) => {
      p.mp = 0;
      p.buchholz = 0;
      p.opponents = [];
      p.colorHistory = [];
      p.colorPreference = 0;
      p.hadBye = false;
    });
    calculateStandingsSingles();
    renderSetupSingles();
  } else {
    state.rounds = [];
    state.currentRound = 0;
    state.status = "SETUP";
    state.excludedTeamsThisRound = [];
    state.teams.forEach((t) => {
      t.mp = 0;
      t.bp = 0;
      t.buchholz = 0;
      t.medianBuchholz = 0;
      t.sonnebornBerger = 0;
      t.opponents = [];
      t.colorHistory = [];
      t.colorPreference = 0;
      t.hadBye = false;
    });
    calculateStandings();
    renderSetup();
  }

  saveState();
  updateNavigation();
  lockSetup();
  showSection("setup");
}

function goToResults() {
  showSection("results");
}

function goToSinglesResults() {
  showSection("results");
}

function updateSinglesMatchResult(roundNum, matchIndex, value) {
  commitState();
  const round = state.singles.rounds[roundNum - 1];
  if (!round || !round.matches[matchIndex]) return;
  round.matches[matchIndex].result = value === "" ? null : value;
  if (roundNum === state.singles.currentRound) {
    checkSinglesRoundCompleteness();
  }
  calculateStandingsSingles();
  saveState();
  renderResultsSingles(roundNum);
  renderStandingsSingles();
}

function checkSinglesRoundCompleteness() {
  if (state.singles.currentRound === 0) return;
  const round = state.singles.rounds[state.singles.currentRound - 1];
  const isComplete = !round.matches.some(
    (m) => !m.isBye && !m.result,
  );
  document.getElementById("next-round-btn-singles").disabled = !isComplete;
}

async function nextSinglesRound() {
  const currentRoundObj = state.singles.rounds[state.singles.currentRound - 1];
  if (!currentRoundObj) {
    showAlert("Keine aktuelle Runde gefunden.", "Hinweis");
    return;
  }
  const incomplete = currentRoundObj.matches.some(
    (m) => !m.isBye && !m.result,
  );

  if (
    incomplete &&
    !(await showConfirm(
      "Einige Ergebnisse fehlen. Trotzdem nächste Runde?",
      "Runde unvollständig",
    ))
  ) {
    return;
  }

  if (state.singles.currentRound >= state.singles.config.totalRounds) {
    showAlert("Turnier beendet! Endstand wird angezeigt.", "Turnierende");
    state.singles.status = "FINISHED";
    calculateStandingsSingles();
    saveState();
    renderStandingsSingles();
    showSection("standings");
    return;
  }

  if (state.singles.config.type === "ROUND_ROBIN") {
    state.singles.excludedPlayersThisRound = [];
    generatePairingsSingles();
    showSection("pairings");
    renderAll();
    window.scrollTo(0, 0);
    return;
  }

  showExcludeSinglesModal();
}

function getSinglesMatchPointsSnapshot(roundNum) {
  const snapshot = {};
  state.singles.players.forEach((p) => {
    snapshot[p.id] = 0;
  });
  const roundsToCount = Math.max(0, roundNum - 1);
  const rounds = state.singles.rounds.slice(0, roundsToCount);
  rounds.forEach((round) => {
    round.matches.forEach((m) => {
      if (m.isBye) {
        const p = getPlayer(m.playerA);
        if (p) snapshot[p.id] += state.singles.config.pointsBye;
        return;
      }
      if (!m.result) return;
      const pA = getPlayer(m.playerA);
      const pB = getPlayer(m.playerB);
      if (!pA || !pB) return;
      if (m.result === "1-0") {
        snapshot[pA.id] += state.singles.config.pointsWin;
        snapshot[pB.id] += state.singles.config.pointsLoss;
      } else if (m.result === "0-1") {
        snapshot[pA.id] += state.singles.config.pointsLoss;
        snapshot[pB.id] += state.singles.config.pointsWin;
      } else if (m.result === "0.5-0.5") {
        snapshot[pA.id] += state.singles.config.pointsDraw;
        snapshot[pB.id] += state.singles.config.pointsDraw;
      }
    });
  });
  return snapshot;
}
