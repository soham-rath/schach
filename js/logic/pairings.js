function generatePairingsSingles() {
  const maxRounds = readNumber(state.singles?.config?.totalRounds, 0);
  if (maxRounds > 0 && state.singles.currentRound >= maxRounds) {
    if (typeof showAlert === "function") {
      showAlert(
        "Die konfigurierte Rundenzahl ist bereits erreicht.",
        "Keine weitere Runde",
      );
    } else {
      console.warn(
        "Max rounds reached in singles mode, cannot generate additional pairings.",
      );
    }
    return;
  }

  if (state.singles.config.type === "ROUND_ROBIN") {
    generatePairingsSinglesRoundRobin();
    return;
  }

  commitState();
  calculateStandingsSingles();
  rebuildPlayerHistoryFromRounds();

  const excludedIds = state.singles.excludedPlayersThisRound || [];
  let pool = state.singles.players.filter((p) => !excludedIds.includes(p.id));
  let pairs = [];

  // Handle forced pairings before any automatic pairing.
  const forcedPairs = state.singles.forcedPairsThisRound || [];
  for (const pair of forcedPairs) {
    const idxA = pool.findIndex((p) => p.id === pair.a);
    const idxB = pool.findIndex((p) => p.id === pair.b);
    if (idxA === -1 || idxB === -1) continue;

    const playerA = pool[idxA];
    const playerB = pool[idxB];
    pool.splice(Math.max(idxA, idxB), 1);
    pool.splice(Math.min(idxA, idxB), 1);

    pairs.push({ playerA, playerB });
  }

  if (pool.length % 2 !== 0) {
    let byeIndex = pool.length - 1;
    while (byeIndex >= 0 && pool[byeIndex].hadBye) {
      byeIndex--;
    }
    if (byeIndex < 0) byeIndex = pool.length - 1;
    const byePlayer = pool.splice(byeIndex, 1)[0];
    pairs.push({ playerA: byePlayer, playerB: null });
  }

  if (state.singles.currentRound === 0) {
    const half = Math.floor(pool.length / 2);
    for (let i = 0; i < half; i++) {
      pairs.push({ playerA: pool[i], playerB: pool[i + half] });
    }
    pool = [];
  } else {
    while (pool.length > 0) {
      const home = pool.shift();
      let awayIndex = 0;
      let found = false;
      while (awayIndex < pool.length) {
        const candidate = pool[awayIndex];
        const history = home.opponents || [];
        if (!history.includes(candidate.id)) {
          pool.splice(awayIndex, 1);
          pairs.push({ playerA: home, playerB: candidate });
          found = true;
          break;
        }
        awayIndex++;
      }
      if (!found) {
        if (pool.length > 0) {
          const forced = pool.shift();
          pairs.push({ playerA: home, playerB: forced });
        } else {
          pairs.push({ playerA: home, playerB: null });
        }
      }
    }
  }

  const byeIndex = pairs.findIndex((p) => p.playerB === null);
  if (byeIndex !== -1) {
    const byePair = pairs.splice(byeIndex, 1)[0];
    pairs.push(byePair);
  }

  const newRoundNum = state.singles.currentRound + 1;
  const newMatches = pairs.map(
    (p, idx) => new SingleMatch(newRoundNum, idx + 1, p.playerA.id, p.playerB ? p.playerB.id : null),
  );

  state.singles.rounds.push({ matches: newMatches });
  state.singles.currentRound = newRoundNum;
  rebuildPlayerHistoryFromRounds();

  state.singles.excludedPlayersThisRound = [];
  state.singles.forcedPairsThisRound = [];
  saveState();
}

function generatePairings() {
  const maxRounds = readNumber(state.config?.totalRounds, 0);
  if (maxRounds > 0 && state.currentRound >= maxRounds) {
    if (typeof showAlert === "function") {
      showAlert(
        "Die konfigurierte Rundenzahl ist bereits erreicht.",
        "Keine weitere Runde",
      );
    } else {
      console.warn("Max rounds reached, cannot generate additional pairings.");
    }
    return;
  }

  commitState(); // Save history
  calculateStandings(); // Ensure sorting/scores are fresh
  rebuildTeamHistoryFromRounds(); // Ensure color history is fresh

  if (state.config && state.config.type === "ROUND_ROBIN") {
    if (
      Array.isArray(state.excludedTeamsThisRound) &&
      state.excludedTeamsThisRound.length > 0 &&
      typeof showAlert === "function"
    ) {
      showAlert(
        "Ausschlüsse sind im Round-Robin-Modus nicht verfügbar.",
        "Hinweis",
      );
    }
    state.excludedTeamsThisRound = [];
    generatePairingsRoundRobin();
    return;
  }

  // Filter out excluded teams
  const excludedIds = state.excludedTeamsThisRound || [];
  let pool = state.teams.filter((t) => !excludedIds.includes(t.id));

  // Handle forced pairings (applies to every round, including round 1).
  const forcedPairs = state.forcedPairsThisRound || [];
  const forcedPairObjects = [];
  for (const pair of forcedPairs) {
    const idxA = pool.findIndex((t) => t.id === pair.a);
    const idxB = pool.findIndex((t) => t.id === pair.b);
    if (idxA === -1 || idxB === -1) continue;

    const teamA = pool[idxA];
    const teamB = pool[idxB];
    // Remove in reverse index order to keep splice indices valid.
    pool.splice(Math.max(idxA, idxB), 1);
    pool.splice(Math.min(idxA, idxB), 1);

    const colorA = determineColor(teamA, teamB);
    forcedPairObjects.push({ teamA, teamB, colorA });
  }

  let pairs = [...forcedPairObjects];

  // Round 1 uses split pairing (top half vs bottom half) for the rest.
  if (state.currentRound === 0) {
    const half = Math.floor(pool.length / 2);
    // Simple top-half vs bottom-half
    for (let i = 0; i < half; i++) {
      // Alternate colors for the top half.
      const colorA = (i % 2 === 0) ? 'W' : 'B';
      pairs.push({ teamA: pool[i], teamB: pool[i + half], colorA: colorA });
    }

    // If odd number of teams remain, last seeded team receives a bye.
    if (pool.length % 2 !== 0 && pool.length > 0) {
      const byeTeam = pool[pool.length - 1];
      pairs.push({ teamA: byeTeam, teamB: null });
    }

    const newRoundNum = state.currentRound + 1;
    const newMatches = pairs.map((p, idx) => {
      const m = new Match(
        newRoundNum,
        idx + 1,
        p.teamA.id,
        p.teamB ? p.teamB.id : null,
      );
      if (p.teamB) m.teamAColor = p.colorA;
      return m;
    });

    finalizeRound(newMatches);
    return;
  }

  // Backtracking solver for rounds after the first (remaining pool).
  const pairingResult = runSwissPairing(pool);
  const remainingPairings = pairingResult ? pairingResult.pairings : null;

  if (!remainingPairings) {
    console.error("Unable to generate valid pairings.");
    if (typeof showAlert === "function") {
      showAlert(
        "Keine gültigen Paarungen gefunden. Bitte Paarungen manuell anpassen und erneut versuchen.",
      );
    } else {
      console.error(
        "Keine gültige Paarung gefunden (kein UI-Alert verfügbar).",
      );
    }
    return;
  }

  if (
    pairingResult &&
    pairingResult.relaxed &&
    typeof showToast === "function"
  ) {
    showToast(
      "Hinweis: Strikte Schweizer Paarung war nicht möglich. Wiederholte Paarung wurde verwendet.",
      "info",
      4500,
    );
  }

  // Append automatically paired teams.
  pairs.push(...remainingPairings);

  // Convert to Matches
  const newRoundNum = state.currentRound + 1;
  const newMatches = pairs.map((p, idx) => {
    const m = new Match(newRoundNum, idx + 1, p.teamA.id, p.teamB ? p.teamB.id : null);
    if (p.teamB) {
      m.teamAColor = p.colorA;
    }
    return m;
  });

  finalizeRound(newMatches);
}

function finalizeRound(matches) {
  state.rounds.push({ matches: matches });
  state.currentRound++;
  rebuildTeamHistoryFromRounds(); // Update histories immediately
  state.excludedTeamsThisRound = [];
  state.forcedPairsThisRound = [];
  saveState();
}

// --- SWISS ENGINE ---

function runSwissPairing(pool) {
  const strict = solveSwissPairing(pool, false);
  if (strict) return { pairings: strict, relaxed: false };

  const relaxed = solveSwissPairing(pool, true);
  if (relaxed) return { pairings: relaxed, relaxed: true };

  return null;
}

function getByeCandidates(pool) {
  if (pool.length % 2 === 0) return [null];

  const withoutBye = [];
  const withBye = [];
  for (let i = pool.length - 1; i >= 0; i--) {
    const team = pool[i];
    if (team.hadBye) withBye.push(team);
    else withoutBye.push(team);
  }
  const ordered = withoutBye.concat(withBye);
  return ordered.length > 0 ? ordered : [pool[pool.length - 1]];
}

function solveSwissPairing(pool, allowRepeats) {
  const byeCandidates = getByeCandidates(pool);

  for (const byeCandidate of byeCandidates) {
    const workingPool = [...pool];
    let byeTeam = null;

    if (byeCandidate) {
      const idx = workingPool.findIndex((t) => t.id === byeCandidate.id);
      if (idx === -1) continue;
      byeTeam = workingPool.splice(idx, 1)[0];
    }

    const solverResult = backtrackPair(workingPool, [], allowRepeats);
    if (solverResult) {
      if (byeTeam) solverResult.push({ teamA: byeTeam, teamB: null });
      return solverResult;
    }
  }

  return null;
}

function backtrackPair(remainingTeams, currentPairs, allowRepeats = false) {
  if (remainingTeams.length === 0) {
    return currentPairs;
  }

  const home = remainingTeams[0]; // Highest remaining
  const rest = remainingTeams.slice(1);

  const candidateOrder = [];
  for (let i = 0; i < rest.length; i++) {
    if (!home.opponents.includes(rest[i].id)) candidateOrder.push(i);
  }
  if (allowRepeats) {
    for (let i = 0; i < rest.length; i++) {
      if (home.opponents.includes(rest[i].id)) candidateOrder.push(i);
    }
  }

  for (const i of candidateOrder) {
    const away = rest[i];
    // 2. Color Logic
    const color = determineColor(home, away);

    // Recursive Step
    const nextRest = [...rest];
    nextRest.splice(i, 1); // Remove away

    const newPair = { teamA: home, teamB: away, colorA: color };
    const result = backtrackPair(
      nextRest,
      [...currentPairs, newPair],
      allowRepeats,
    );

    if (result) return result;
  }

  return null; // Backtrack
}

function determineColor(tA, tB) {
  const prefA = tA.colorPreference || 0;
  const prefB = tB.colorPreference || 0;

  // Different signs: Happy match
  if (prefA > 0 && prefB <= 0) return 'W';
  if (prefA < 0 && prefB >= 0) return 'B';

  // Equal signs: Conflict
  // Give to strongly preferring team?
  if (prefA > prefB) return 'W';
  if (prefB > prefA) return 'B';

  // Equal preference: Alternate based on history of higher ranked (tA)
  const lastColorA = tA.colorHistory.length > 0 ? tA.colorHistory[tA.colorHistory.length - 1] : null;
  if (lastColorA === 'W') return 'B';
  return 'W';
}
function generatePairingsRoundRobin() {
  calculateStandings();

  let teams = [...state.teams].sort((a, b) => a.id.localeCompare(b.id));

  const isOdd = teams.length % 2 !== 0;
  if (isOdd) {
    teams.push({ id: "BYE", name: "BYE" });
  }

  const n = teams.length;
  const totalRounds = n - 1;
  const roundNum = state.currentRound + 1;
  if (roundNum > totalRounds) {
    if (typeof showAlert === "function") {
      showAlert("Round Robin ist bereits abgeschlossen.", "Keine weitere Runde");
    } else {
      console.warn("Round Robin finished. No more rounds to generate.");
    }
    return;
  }

  let indices = Array.from({ length: n }, (_, i) => i);
  const fixed = indices.shift();
  const rotationOffset = roundNum - 1;

  const rotated = [];
  for (let i = 0; i < indices.length; i++) {
    let newIndex = (i - rotationOffset) % indices.length;
    if (newIndex < 0) newIndex += indices.length;
    rotated[newIndex] = indices[i];
  }

  const finalIndices = [fixed, ...rotated];

  const pairs = [];
  const half = n / 2;
  for (let i = 0; i < half; i++) {
    const t1 = teams[finalIndices[i]];
    const t2 = teams[finalIndices[n - 1 - i]];

    if (t1.id === "BYE") {
      pairs.push({ teamA: t2, teamB: null });
    } else if (t2.id === "BYE") {
      pairs.push({ teamA: t1, teamB: null });
    } else {

      let pA = t1;
      let pB = t2;
      let pAColor = 'W';

      // Advanced Berger Color Logic
      // Rule: Team at index `i` plays White if `i + roundNum` is Odd (or sum-logic)
      // Standard Table check:
      // Fixed (0): Round 1 (1+0=1 odd)-> White. Round 2 (2+0=2 even)-> Black.
      // Rotating (i>0): Round 1: i=1 (idx 1) plays i=13 (idx N-1). 
      // Let's use Schurig's rule for Circle Method:
      // The team moving to the slot (or in the slot) alternates.
      // Simple heuristic for "good enough" alternation:

      if (i === 0) {
        // Fixed team logic
        if (roundNum % 2 !== 0) {
          pA = t1; pB = t2; pAColor = 'W'; // Fixed is W in Odd rounds
        } else {
          pA = t2; pB = t1; pAColor = 'W'; // Fixed is B in Even rounds
        }
      } else {
        // Rotating teams
        if ((i + roundNum) % 2 === 0) {
          pA = t1; pB = t2; pAColor = 'W';
        } else {
          pA = t2; pB = t1; pAColor = 'W';
        }
      }

      pairs.push({ teamA: pA, teamB: pB, colorA: pAColor });
    }
  }

  const newMatches = pairs.map((p, idx) => {
    const m = new Match(roundNum, idx + 1, p.teamA.id, p.teamB ? p.teamB.id : null);
    if (p.teamB) m.teamAColor = p.colorA;
    return m;
  });

  finalizeRound(newMatches);
}

function generatePairingsSinglesRoundRobin() {
  calculateStandingsSingles();

  let players = [...state.singles.players].sort((a, b) => a.id.localeCompare(b.id));

  const isOdd = players.length % 2 !== 0;
  if (isOdd) {
    players.push({ id: "BYE", name: "BYE" });
  }

  const N = players.length;
  const totalRounds = N - 1;
  const roundNum = state.singles.currentRound + 1;

  if (roundNum > totalRounds) {
    if (typeof showAlert === "function") {
      showAlert("Round Robin ist bereits abgeschlossen.", "Keine weitere Runde");
    } else {
      console.warn("Round Robin finished. No more rounds to generate.");
    }
    return;
  }

  commitState();
  rebuildPlayerHistoryFromRounds();

  let indices = Array.from({ length: N }, (_, i) => i);
  const fixed = indices.shift();
  const rotationOffset = roundNum - 1;
  const rotated = [];

  for (let i = 0; i < indices.length; i++) {
    let newIndex = (i - rotationOffset) % indices.length;
    if (newIndex < 0) newIndex += indices.length;
    rotated[newIndex] = indices[i];
  }

  const finalIndices = [fixed, ...rotated];
  const half = N / 2;
  const pairs = [];

  for (let i = 0; i < half; i++) {
    const p1 = players[finalIndices[i]];
    const p2 = players[finalIndices[N - 1 - i]];

    if (p1.id === "BYE") {
      pairs.push({ playerA: p2, playerB: null });
    } else if (p2.id === "BYE") {
      pairs.push({ playerA: p1, playerB: null });
    } else {
      // Color logic: same simple approach as Teams
      if (i === 0 && roundNum % 2 === 0) {
        pairs.push({ playerA: p2, playerB: p1 });
      } else {
        pairs.push({ playerA: p1, playerB: p2 });
      }
    }
  }

  // Sort matches (tables)

  const newMatches = pairs.map(
    (p, idx) => new SingleMatch(roundNum, idx + 1, p.playerA.id, p.playerB ? p.playerB.id : null),
  );

  state.singles.rounds.push({ matches: newMatches });
  state.singles.currentRound = roundNum;
  rebuildPlayerHistoryFromRounds();

  state.singles.excludedPlayersThisRound = [];
  saveState();
}
