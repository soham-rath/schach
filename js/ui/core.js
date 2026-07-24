function showSection(id) {
  let baseId = id;
  if (baseId.endsWith("-singles")) {
    baseId = baseId.slice(0, -8);
  }
  const sectionId =
    state.mode === "SINGLES" ? `${baseId}-singles` : baseId;

  document
    .querySelectorAll(".view")
    .forEach((el) => el.classList.remove("active"));
  const sectionEl = document.getElementById(sectionId);
  if (sectionEl) sectionEl.classList.add("active");

  // Guard: Prevent navigation if not allowed
  const isSetup = state.mode === "SINGLES" ? state.singles.status === "SETUP" : state.status === "SETUP";
  if (isSetup && (baseId === "pairings" || baseId === "standings" || baseId === "results")) {
    console.warn("Navigation blocked: Tournament is in SETUP mode.");
    showSection("setup");
    return;
  }

  document
    .querySelectorAll(".nav-btn")
    .forEach((el) => el.classList.remove("active"));
  const nav = document.querySelector(`[data-target="${baseId}"]`);
  if (nav) nav.classList.add("active");

  if (baseId === "standings") {
    if (state.mode === "SINGLES") renderStandingsSingles();
    else renderStandings();
  }
  if (baseId === "pairings") {
    if (state.mode === "SINGLES") renderPairingsSingles();
    else renderPairings();
  }
  if (baseId === "results") {
    if (state.mode === "SINGLES") renderResultsSingles();
    else renderResults();
  }
}

function updateNavigation() {
  const running =
    state.mode === "SINGLES"
      ? state.singles.status !== "SETUP"
      : state.status !== "SETUP";
  document.getElementById("nav-pairings").disabled = !running;
  document.getElementById("nav-results").disabled = !running;
  document.getElementById("nav-standings").disabled = !running;
}

function lockSetup() {
  const startBtn = document.getElementById("start-team-btn") || document.querySelector(".actions .success");
  const saveBtn = document.getElementById("update-settings-btn");

  if (state.status === "SETUP") {
    if (startBtn) startBtn.style.display = "block";
    if (saveBtn) saveBtn.remove();
  } else {
    if (startBtn) startBtn.style.display = "none";
    if (!saveBtn) {
      const actionsDiv = document.getElementById("team-actions") || document.querySelector(".actions");
      if (actionsDiv) {
        const btn = document.createElement("button");
        btn.id = "update-settings-btn";
        btn.className = "btn secondary";
        btn.innerText = "💾 Einstellungen Speichern";
        btn.onclick = updateSettings;
        actionsDiv.appendChild(btn);
      }
    }
  }

  // Same logic for singles
  const startBtnSingles = document.getElementById("start-singles-btn") || document.querySelector("#setup-singles .actions .success");
  const saveBtnSingles = document.getElementById("update-settings-btn-singles");

  if (state.singles.status === "SETUP") {
    if (startBtnSingles) startBtnSingles.style.display = "block";
    if (saveBtnSingles) saveBtnSingles.remove();
  } else {
    if (startBtnSingles) startBtnSingles.style.display = "none";
    if (!saveBtnSingles) {
      const actionsDiv = document.getElementById("singles-actions") || document.querySelector("#setup-singles .actions");
      if (actionsDiv) {
        const btn = document.createElement("button");
        btn.id = "update-settings-btn-singles";
        btn.className = "btn secondary";
        btn.innerText = "💾 Einstellungen Speichern";
        btn.onclick = updateSinglesSettings;
        actionsDiv.appendChild(btn);
      }
    }
  }
}

// --- RENDERERS ---

function renderAll() {
  if (state.mode === "SINGLES") {
    renderSetupSingles();
    renderPairingsSingles();
    renderResultsSingles();
    renderStandingsSingles();
  } else {
    renderSetup();
    renderPairings();
    renderResults();
    renderStandings();
  }
}

function renderSetup() {
  // Sync mode radios
  document.querySelectorAll('input[name="tournament-mode"], input[name="tournament-mode-singles"]').forEach(r => {
    const isChecked = r.value === (state.mode || "TEAM");
    r.checked = isChecked;
    if (isChecked) r.parentElement.classList.add('active');
    else r.parentElement.classList.remove('active');
  });

  const list = document.getElementById("team-list");
  list.innerHTML = "";

  if (state.teams.length === 0) {
    list.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">👥</span>
                <p>Noch keine Teams hinzugefügt.</p>
                <p style="font-size:0.8rem; margin-top:0.5rem">Gib oben einen Namen ein und klicke auf + Hinzufügen.</p>
            </div>
        `;
    return;
  }

  state.teams.forEach((t) => {
    const li = document.createElement("li");
    li.className = "team-item shadow-sm";

    li.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
                <span id="name-display-${t.id}" class="team-name-tag">👤 ${formatTeamDisplay(t)}</span>
                <input type="text" id="name-input-${t.id}" value="${t.name}" 
                    style="display:none; padding:0.25rem; font-size:0.9rem;" 
                    onblur="saveTeamName('${t.id}')" 
                    onkeydown="if(event.key==='Enter') saveTeamName('${t.id}')">
                <button class="btn secondary sm" style="padding: 0.2rem 0.5rem;" onclick="editTeam('${t.id}')">✎</button>
            </div>
            <button class="delete-btn" onclick="removeTeam('${t.id}')" title="Team löschen">🗑️</button>
        `;
    list.appendChild(li);
  });
}

function renderSetupSingles() {
  // Sync mode radios
  document.querySelectorAll('input[name="tournament-mode"], input[name="tournament-mode-singles"]').forEach(r => {
    const isChecked = r.value === (state.mode || "SINGLES");
    r.checked = isChecked;
    if (isChecked) r.parentElement.classList.add('active');
    else r.parentElement.classList.remove('active');
  });

  const list = document.getElementById("player-list");
  if (!list) return;
  list.innerHTML = "";

  if (state.singles.players.length === 0) {
    list.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">👥</span>
                <p>Noch keine Spieler hinzugefügt.</p>
                <p style="font-size:0.8rem; margin-top:0.5rem">Gib oben einen Namen ein und klicke auf + Hinzufügen.</p>
            </div>
        `;
    return;
  }

  state.singles.players.forEach((p) => {
    const li = document.createElement("li");
    li.className = "team-item shadow-sm";
    li.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; flex:1;">
                <span id="pname-display-${p.id}" class="team-name-tag">👤 ${formatPlayerDisplay(p)}</span>
                <input type="text" id="pname-input-${p.id}" value="${p.name}" 
                    style="display:none; padding:0.25rem; font-size:0.9rem;" 
                    onblur="savePlayerName('${p.id}')" 
                    onkeydown="if(event.key==='Enter') savePlayerName('${p.id}')">
                <button class="btn secondary sm" style="padding: 0.2rem 0.5rem;" onclick="editPlayer('${p.id}')">✎</button>
            </div>
            <button class="delete-btn" onclick="removePlayer('${p.id}')" title="Spieler löschen">🗑️</button>
        `;
    list.appendChild(li);
  });
}

function renderPairings(viewRoundNum = state.currentRound) {
  if (state.currentRound === 0) return;

  const displayRound = Math.min(Math.max(1, viewRoundNum), state.rounds.length);
  document.getElementById("round-display-pairings").innerText =
    `Runde ${displayRound} Paarungen`;

  // Add round selector
  const headerRow = document.querySelector("#pairings .header-row");
  let selector = document.getElementById("pairings-round-selector");
  if (!selector) {
    selector = document.createElement("div");
    selector.id = "pairings-round-selector";
    selector.className = "round-nav";
    headerRow.insertBefore(selector, headerRow.lastElementChild);
  }

  selector.innerHTML = `
        <button class="btn secondary sm" onclick="renderPairings(${displayRound - 1})" ${displayRound <= 1 ? "disabled" : ""}>←</button>
        <span>Runde ${displayRound}</span>
        <button class="btn secondary sm" onclick="renderPairings(${displayRound + 1})" ${displayRound >= state.rounds.length ? "disabled" : ""}>→</button>
    `;

  const tbody = document.getElementById("pairings-body");
  tbody.innerHTML = "";

  const round = state.rounds[displayRound - 1];
  const mpSnapshot = getMatchPointsSnapshot(displayRound);
  round.matches.forEach((m) => {
    const tA = getTeam(m.teamA);
    const tB = m.isBye ? { name: "-", mp: "-" } : getTeam(m.teamB);
    const mpA = tA ? mpSnapshot[tA.id] ?? 0 : 0;
    const mpB = tB && tB.id ? mpSnapshot[tB.id] ?? 0 : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${m.table}</td>
            <td class="team-name-right"><b>${formatTeamDisplay(tA)}</b></td>
            <td class="center">${mpA}</td>
            <td class="center">vs</td>
            <td class="team-name-left">${m.isBye ? "<i>-</i>" : `<b>${formatTeamDisplay(tB)}</b>`}</td>
            <td class="center">${mpB}</td>
        `;
    tbody.appendChild(tr);
  });
}

function renderPairingsSingles(viewRoundNum = state.singles.currentRound) {
  if (state.singles.currentRound === 0) return;
  const displayRound = Math.min(
    Math.max(1, viewRoundNum),
    state.singles.rounds.length,
  );
  document.getElementById("round-display-pairings-singles").innerText =
    `Runde ${displayRound} Paarungen`;

  const headerRow = document.querySelector("#pairings-singles .header-row");
  let selector = document.getElementById("pairings-round-selector-singles");
  if (!selector) {
    selector = document.createElement("div");
    selector.id = "pairings-round-selector-singles";
    selector.className = "round-nav";
    headerRow.insertBefore(selector, headerRow.lastElementChild);
  }
  selector.innerHTML = `
        <button class="btn secondary sm" onclick="renderPairingsSingles(${displayRound - 1})" ${displayRound <= 1 ? "disabled" : ""}>←</button>
        <span>Runde ${displayRound}</span>
        <button class="btn secondary sm" onclick="renderPairingsSingles(${displayRound + 1})" ${displayRound >= state.singles.rounds.length ? "disabled" : ""}>→</button>
    `;

  const tbody = document.getElementById("pairings-body-singles");
  tbody.innerHTML = "";
  const round = state.singles.rounds[displayRound - 1];
  const mpSnapshot = getSinglesMatchPointsSnapshot(displayRound);

  round.matches.forEach((m) => {
    const pA = getPlayer(m.playerA);
    const pB = m.isBye ? { name: "-", mp: "-" } : getPlayer(m.playerB);
    const mpA = pA ? mpSnapshot[pA.id] ?? 0 : 0;
    const mpB = pB && pB.id ? mpSnapshot[pB.id] ?? 0 : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${m.table}</td>
            <td class="team-name-right"><b>${formatPlayerDisplay(pA)}</b></td>
            <td class="center">${mpA}</td>
            <td class="center">vs</td>
            <td class="team-name-left">${m.isBye ? "<i>-</i>" : `<b>${formatPlayerDisplay(pB)}</b>`}</td>
            <td class="center">${mpB}</td>
        `;
    tbody.appendChild(tr);
  });
}

function renderResults(viewRoundNum = state.currentRound) {
  if (state.currentRound === 0) return;

  const displayRound = Math.min(Math.max(1, viewRoundNum), state.rounds.length);
  document.getElementById("round-display-results").innerText =
    `Ergebnisse Runde ${displayRound}`;

  const container = document.getElementById("results-container");
  container.innerHTML = "";

  // Add round selector for Results
  const header = document.querySelector("#results .header-row");
  let selector = document.getElementById("results-round-selector");
  if (!selector && header) {
    selector = document.createElement("div");
    selector.id = "results-round-selector";
    selector.className = "round-nav";
    header.insertBefore(selector, header.lastElementChild);
  }

  if (selector) {
    selector.innerHTML = `
        <button class="btn secondary sm" onclick="renderResults(${displayRound - 1})" ${displayRound <= 1 ? "disabled" : ""}>←</button>
        <span>Runde ${displayRound}</span>
        <button class="btn secondary sm" onclick="renderResults(${displayRound + 1})" ${displayRound >= state.rounds.length ? "disabled" : ""}>→</button>
    `;
  }


  const round = state.rounds[displayRound - 1];

  round.matches.forEach((m, matchIndex) => {
    if (m.isBye) return; // Don't show inputs for Bye

    const tA = getTeam(m.teamA);
    const tB = getTeam(m.teamB);

    // Calculate current match score
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = createMatchCardHTML(displayRound, m, matchIndex, tA, tB);
    container.appendChild(div);
  });

  // Only show "Next Round" if we are on the current active round
  const nextBtn = document.getElementById("next-round-btn");
  if (nextBtn) {
    if (displayRound === state.currentRound) {
      nextBtn.style.display = "block";
      // Check if all filled to enable Next Round
      checkRoundCompleteness();
    } else {
      nextBtn.style.display = "none";
    }
  }
}

function renderResultsSingles(viewRoundNum = state.singles.currentRound) {
  if (state.singles.currentRound === 0) return;
  const displayRound = Math.min(
    Math.max(1, viewRoundNum),
    state.singles.rounds.length,
  );
  document.getElementById("round-display-results-singles").innerText =
    `Ergebnisse Runde ${displayRound}`;

  const container = document.getElementById("results-container-singles");
  container.innerHTML = "";

  const header = document.querySelector("#results-singles .header-row");
  let selector = document.getElementById("results-round-selector-singles");
  if (!selector && header) {
    selector = document.createElement("div");
    selector.id = "results-round-selector-singles";
    selector.className = "round-nav";
    header.insertBefore(selector, header.lastElementChild);
  }
  if (selector) {
    selector.innerHTML = `
        <button class="btn secondary sm" onclick="renderResultsSingles(${displayRound - 1})" ${displayRound <= 1 ? "disabled" : ""}>←</button>
        <span>Runde ${displayRound}</span>
        <button class="btn secondary sm" onclick="renderResultsSingles(${displayRound + 1})" ${displayRound >= state.singles.rounds.length ? "disabled" : ""}>→</button>
    `;
  }

  const round = state.singles.rounds[displayRound - 1];
  round.matches.forEach((m, matchIndex) => {
    if (m.isBye) return;
    const pA = getPlayer(m.playerA);
    const pB = getPlayer(m.playerB);
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = createSingleMatchCardHTML(displayRound, m, matchIndex, pA, pB);
    container.appendChild(div);
  });

  const nextBtn = document.getElementById("next-round-btn-singles");
  if (nextBtn) {
    if (displayRound === state.singles.currentRound) {
      nextBtn.style.display = "block";
      checkSinglesRoundCompleteness();
    } else {
      nextBtn.style.display = "none";
    }
  }
}

function createSingleMatchCardHTML(roundNum, m, matchIndex, pA, pB) {
  const val = m.result || "";
  let scoreA = 0;
  let scoreB = 0;
  if (val === "1-0") scoreA = 1;
  if (val === "0-1") scoreB = 1;
  if (val === "0.5-0.5") {
    scoreA = 0.5;
    scoreB = 0.5;
  }

  return `
        <div class="table-number-box">
            <span class="table-label">Tisch</span>
            <span class="table-value">${m.table}</span>
        </div>
        <div class="match-content">
            <div class="match-header">
                <span class="match-score">${formatPlayerDisplay(pA)} <span class="badge">${scoreA} - ${scoreB}</span> ${formatPlayerDisplay(pB)}</span>
            </div>
            <div class="board-row">
                <span class="board-label">Ergebnis</span>
                <span style="text-align:right"><b>${formatPlayerDisplay(pA)}</b></span>
                <div class="result-button-group">
                    <button class="res-btn ${val === "1-0" ? "active" : ""}" onclick="updateSinglesMatchResult(${roundNum}, ${matchIndex}, '1-0')">1-0</button>
                    <button class="res-btn ${val === "0.5-0.5" ? "active" : ""}" onclick="updateSinglesMatchResult(${roundNum}, ${matchIndex}, '0.5-0.5')">½-½</button>
                    <button class="res-btn ${val === "0-1" ? "active" : ""}" onclick="updateSinglesMatchResult(${roundNum}, ${matchIndex}, '0-1')">0-1</button>
                </div>
                <span><b>${formatPlayerDisplay(pB)}</b></span>
            </div>
        </div>
    `;
}

function createMatchCardHTML(roundNum, m, matchIndex, tA, tB) {
  let scoreA = 0,
    scoreB = 0;
  m.results.forEach((res) => {
    if (res === "1-0") scoreA += 1;
    else if (res === "0.5-0.5") {
      scoreA += 0.5;
      scoreB += 0.5;
    } else if (res === "0-1") scoreB += 1;
    else if (res === "0-0") {
      // No points for either side
    }
  });

  let html = `
        <div class="table-number-box">
            <span class="table-label">Tisch</span>
            <span class="table-value">${m.table}</span>
        </div>
        <div class="match-content">
            <div class="match-header">
                <span class="match-score">${formatTeamDisplay(tA)} <span class="badge">${scoreA} - ${scoreB}</span> ${formatTeamDisplay(tB)}</span>
            </div>
    `;

  const boardCount = getBoardsPerMatch();
  for (let i = 0; i < boardCount; i++) {
    const val = m.results[i] || "";
    const sideA = i % 2 === 0 ? "(W)" : "(S)";
    const sideB = i % 2 === 0 ? "(S)" : "(W)";

    html += `
            <div class="board-row">
                <span class="board-label">Brett ${i + 1}</span>
                <span style="text-align:right"><b>${formatTeamDisplay(tA)}</b> ${sideA}</span>
                <div class="result-button-group">
                    <button class="res-btn ${val === "1-0" ? "active" : ""}" data-match="${matchIndex}" data-board="${i}" data-val="1-0" onclick="updateMatchResult(${roundNum}, ${matchIndex}, ${i}, '1-0')">1-0</button>
                    <button class="res-btn ${val === "0.5-0.5" ? "active" : ""}" data-match="${matchIndex}" data-board="${i}" data-val="0.5-0.5" onclick="updateMatchResult(${roundNum}, ${matchIndex}, ${i}, '0.5-0.5')">½-½</button>
                    <button class="res-btn ${val === "0-1" ? "active" : ""}" data-match="${matchIndex}" data-board="${i}" data-val="0-1" onclick="updateMatchResult(${roundNum}, ${matchIndex}, ${i}, '0-1')">0-1</button>
                </div>
                <span>${sideB} <b>${formatTeamDisplay(tB)}</b></span>
            </div>
        `;
  }
  html += `</div>`;
  return html;
}

function renderStandings(viewRoundNum = state.currentRound) {
  if (state.currentRound === 0) return;
  const displayRound = Math.min(Math.max(1, viewRoundNum), state.rounds.length);

  // Add round selector
  const headerRow = document.querySelector("#standings .header-row");
  let selector = document.getElementById("standings-round-selector");
  if (!selector && headerRow) {
    selector = document.createElement("div");
    selector.id = "standings-round-selector";
    selector.className = "round-nav";
    headerRow.insertBefore(selector, headerRow.lastElementChild);
  }

  if (selector) {
    selector.innerHTML = `
        <button class="btn secondary sm" onclick="renderStandings(${displayRound - 1})" ${displayRound <= 1 ? "disabled" : ""}>←</button>
        <span>Runde ${displayRound}</span>
        <button class="btn secondary sm" onclick="renderStandings(${displayRound + 1})" ${displayRound >= state.rounds.length ? "disabled" : ""}>→</button>
    `;
  }

  // Pass displayRound to calculateStandings
  calculateStandings(displayRound);

  const tbody = document.getElementById("standings-body");
  tbody.innerHTML = "";

  state.teams.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${i + 1}</td>
            <td class="clickable" onclick="showTeamDetail('${t.id}')"><b>${formatTeamDisplay(t)}</b></td>
            <td class="center"><strong>${t.mp}</strong></td>
            <td class="center">${t.bp}</td>
            <td class="center">${t.buchholz}</td>
            <td class="center">${t.medianBuchholz}</td>
            <td class="center">${t.sonnebornBerger}</td>
        `;
    tbody.appendChild(tr);
  });

  // Show "Add Round" button if tournament is finished OR if we are at the last round
  // And we are viewing the LATEST round
  const addRoundBtn = document.getElementById("add-round-btn");
  if (addRoundBtn) {
    const isLatest = displayRound === state.currentRound;
    const canAdd =
      state.config.type !== "ROUND_ROBIN" &&
      (state.status === "FINISHED" ||
        state.currentRound >= state.config.totalRounds);
    addRoundBtn.style.display = (isLatest && canAdd) ? "block" : "none";
  }
}

function renderStandingsSingles(viewRoundNum = state.singles.currentRound) {
  if (state.singles.currentRound === 0) return;
  const displayRound = Math.min(Math.max(1, viewRoundNum), state.singles.rounds.length);

  // Add round selector
  const headerRow = document.querySelector("#standings-singles .header-row");
  let selector = document.getElementById("standings-singles-round-selector");
  if (!selector && headerRow) {
    selector = document.createElement("div");
    selector.id = "standings-singles-round-selector";
    selector.className = "round-nav";
    headerRow.insertBefore(selector, headerRow.lastElementChild);
  }

  if (selector) {
    selector.innerHTML = `
        <button class="btn secondary sm" onclick="renderStandingsSingles(${displayRound - 1})" ${displayRound <= 1 ? "disabled" : ""}>←</button>
        <span>Runde ${displayRound}</span>
        <button class="btn secondary sm" onclick="renderStandingsSingles(${displayRound + 1})" ${displayRound >= state.singles.rounds.length ? "disabled" : ""}>→</button>
    `;
  }

  calculateStandingsSingles(displayRound);
  const tbody = document.getElementById("standings-body-singles");
  tbody.innerHTML = "";

  state.singles.players.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${i + 1}</td>
            <td><b>${formatPlayerDisplay(p)}</b></td>
            <td class="center"><strong>${p.mp}</strong></td>
            <td class="center">${p.buchholz}</td>
        `;
    tbody.appendChild(tr);
  });
}

function renderDashboard() {
  if (state.teams.length === 0) return;

  const requiredIds = [
    "stat-total-mp",
    "stat-total-bp",
    "stat-total-games",
    "stats-w-wins",
    "stats-b-wins",
    "stats-draws",
    "bar-win",
    "bar-draw",
    "bar-loss",
    "top-scorer-list",
  ];
  const missing = requiredIds.some((id) => !document.getElementById(id));
  if (missing) return;

  let totalMP = 0;
  let totalBP = 0;
  let totalGames = 0;
  let wWins = 0;
  let bWins = 0;
  let draws = 0;

  state.teams.forEach((t) => {
    totalMP += t.mp;
    totalBP += t.bp;
  });

  state.rounds.forEach((round) => {
    round.matches.forEach((m) => {
      if (!m.isBye) {
        m.results.forEach((res) => {
          if (res !== null) {
            totalGames++;
            if (res === "1-0") wWins++;
            else if (res === "0-1") bWins++;
            else if (res === "0.5-0.5") draws++;
          }
        });
      }
    });
  });

  document.getElementById("stat-total-mp").innerText = totalMP / 2; // Each win counted twice
  document.getElementById("stat-total-bp").innerText = totalBP / 2;
  document.getElementById("stat-total-games").innerText = totalGames;

  document.getElementById("stats-w-wins").innerText = wWins;
  document.getElementById("stats-b-wins").innerText = bWins;
  document.getElementById("stats-draws").innerText = draws;

  // Update bars
  const total = wWins + bWins + draws;
  if (total > 0) {
    document.getElementById("bar-win").style.width =
      `${(wWins / total) * 100}%`;
    document.getElementById("bar-draw").style.width =
      `${(draws / total) * 100}%`;
    document.getElementById("bar-loss").style.width =
      `${(bWins / total) * 100}%`;
  }

  // Top Scorer List
  const topScorers = [...state.teams].sort((a, b) => b.bp - a.bp).slice(0, 5);
  const list = document.getElementById("top-scorer-list");
  list.innerHTML = "";
  topScorers.forEach((t) => {
    const li = document.createElement("li");
    li.className = "team-item";
    li.innerHTML = `<span class="team-name-tag">👤 ${formatTeamDisplay(t)}</span> <b>${t.bp} BP</b>`;
    list.appendChild(li);
  });
}

function showTeamDetail(teamId) {
  const team = getTeam(teamId);
  if (!team) return;

  document.getElementById("detail-team-name").innerText =
    `Team-Historie: ${formatTeamDisplay(team)}`;
  const container = document.getElementById("team-detail-content");

  let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Runde</th>
                    <th>Gegner</th>
                    <th>Ergebnis (BP)</th>
                    <th>MP</th>
                </tr>
            </thead>
            <tbody>
    `;

  state.rounds.forEach((round, roundIdx) => {
    const match = round.matches.find(
      (m) => m.teamA === teamId || m.teamB === teamId,
    );
    if (match) {
      let opponentName = "BYE";
      let bpResult = "-";
      let mpResult = "-";

      if (!match.isBye) {
        const oppId = match.teamA === teamId ? match.teamB : match.teamA;
        const oppTeam = getTeam(oppId);
        opponentName = oppTeam ? oppTeam.name : "Unbekannt";

        let ptsA = 0;
        let ptsB = 0;
        match.results.forEach((res) => {
          if (res === "1-0") ptsA += 1;
          else if (res === "0.5-0.5") {
            ptsA += 0.5;
            ptsB += 0.5;
          } else if (res === "0-1") ptsB += 1;
          else if (res === "0-0") {
            // No points for either side
          }
        });

        const myPts = match.teamA === teamId ? ptsA : ptsB;
        const oppPts = match.teamA === teamId ? ptsB : ptsA;
        bpResult = `${myPts} - ${oppPts}`;

        if (!match.results.includes(null)) {
          if (myPts > oppPts)
            mpResult = String(state.config.pointsMatchWin ?? 2);
          else if (myPts < oppPts)
            mpResult = String(state.config.pointsMatchLoss ?? 0);
          else mpResult = String(state.config.pointsMatchDraw ?? 1);
        }
      } else {
        const byeBp = state.config.boardsPerMatch ?? 4;
        const byeMp = state.config.pointsBye ?? state.config.pointsMatchWin ?? 2;
        bpResult = `${byeBp} - 0`;
        mpResult = String(byeMp);
      }

      html += `
                <tr>
                    <td>${roundIdx + 1}</td>
                    <td>${opponentName}</td>
                    <td>${bpResult}</td>
                    <td>${mpResult}</td>
                </tr>
            `;
    }
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  document.getElementById("team-detail-modal").classList.remove("hidden");
}

function closeTeamDetail() {
  document.getElementById("team-detail-modal").classList.add("hidden");
}

function checkRoundCompleteness() {
  if (state.currentRound === 0 || !state.rounds[state.currentRound - 1]) {
    const nextBtn = document.getElementById("next-round-btn");
    if (nextBtn) nextBtn.disabled = true;
    return;
  }
  const round = state.rounds[state.currentRound - 1];
  const isComplete = !round.matches.some(
    (m) => !m.isBye && m.results.includes(null),
  );
  document.getElementById("next-round-btn").disabled = !isComplete;
}

// --- MODALS & NOTIFICATIONS ---

