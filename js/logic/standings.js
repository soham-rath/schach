function readNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTeamScoringConfig() {
  const cfg = state && state.config ? state.config : {};
  return {
    matchWin: readNumber(cfg.pointsMatchWin, CONSTANTS.MATCH_WIN),
    matchDraw: readNumber(cfg.pointsMatchDraw, CONSTANTS.MATCH_DRAW),
    matchLoss: readNumber(cfg.pointsMatchLoss, CONSTANTS.MATCH_LOSS),
    byeMatchPoints: readNumber(cfg.pointsBye, CONSTANTS.BYE_MP),
    byeBoardPoints: Math.max(
      1,
      Math.floor(readNumber(cfg.boardsPerMatch, CONSTANTS.BYE_BP)),
    ),
  };
}

function calculateStandings(maxRound) {
  // 1. Reset points
  // Ensure teams objects are valid
  if (!state.teams) return;
  const scoring = getTeamScoringConfig();

  state.teams.forEach((t) => {
    t.mp = 0;
    t.bp = 0;
    t.buchholz = 0;
    t.medianBuchholz = 0;
    t.sonnebornBerger = 0;
  });

  // 2. Tally points from matches
  state.rounds.forEach((round, roundIndex) => {
    const roundNum = roundIndex + 1;
    if (maxRound && roundNum > maxRound) return; // Skip rounds beyond maxRound

    round.matches.forEach((match) => {
      if (match.isBye) {
        // Award Bye points if the match is part of the current or past rounds.
        const t = getTeam(match.teamA);
        if (t) {
          t.mp += scoring.byeMatchPoints;
          t.bp += scoring.byeBoardPoints;
        }
      } else {
        // Regular match logic
        const tA = getTeam(match.teamA);
        const tB = getTeam(match.teamB);

        let ptsA = 0;
        let ptsB = 0;

        // Sum up results if they exist (ignore nulls)
        match.results.forEach((res) => {
          if (res === "1-0") {
            ptsA += 1;
          } else if (res === "0.5-0.5") {
            ptsA += 0.5;
            ptsB += 0.5;
          } else if (res === "0-1") {
            ptsB += 1;
          } else if (res === "0-0") {
            // Missing/forfeited board: no points for either side
          }
        });

        // Always apply Board Points (even if match is incomplete)
        if (tA && tB) {
          tA.bp += ptsA;
          tB.bp += ptsB;
        }

        // Only apply Match Points if the match is complete
        const isComplete = !match.results.includes(null);
        if (isComplete && tA && tB) {
          if (ptsA > ptsB) {
            tA.mp += scoring.matchWin;
            tB.mp += scoring.matchLoss;
          } else if (ptsA < ptsB) {
            tA.mp += scoring.matchLoss;
            tB.mp += scoring.matchWin;
          } else {
            tA.mp += scoring.matchDraw;
            tB.mp += scoring.matchDraw;
          }
        }
      }
    });
  });

  // 3. Calculate Buchholz & Sonneborn-Berger
  state.teams.forEach((t) => {
    let bh = 0;
    let sb = 0;

    state.rounds.forEach((round, roundIndex) => {
      if (maxRound && (roundIndex + 1) > maxRound) return; // Skip rounds beyond maxRound

      round.matches.forEach((m) => {
        if (m.isBye) return;
        if (m.results.includes(null)) return;

        if (m.teamA === t.id || m.teamB === t.id) {
          const isA = m.teamA === t.id;
          const oppId = isA ? m.teamB : m.teamA;
          const opp = getTeam(oppId);
          if (!opp) return;

          // Standard Buchholz uses current opponent match points.
          bh += opp.mp;

          let ptsA = 0;
          let ptsB = 0;
          m.results.forEach((res) => {
            if (res === "1-0") ptsA += 1;
            else if (res === "0.5-0.5") {
              ptsA += 0.5;
              ptsB += 0.5;
            } else if (res === "0-1") ptsB += 1;
          });
          const myPts = isA ? ptsA : ptsB;
          const oppPts = isA ? ptsB : ptsA;

          if (myPts > oppPts) sb += opp.mp;
          else if (myPts === oppPts) sb += opp.mp / 2;
        }
      });
    });

    t.buchholz = bh;
    t.sonnebornBerger = sb;
  });

  // 3b. Median Buchholz (remove highest and lowest opponent MP)
  state.teams.forEach((t) => {
    const oppMps = [];
    state.rounds.forEach((round, roundIndex) => {
      if (maxRound && (roundIndex + 1) > maxRound) return;

      round.matches.forEach((m) => {
        if (m.isBye) return;
        if (m.results.includes(null)) return;
        if (m.teamA === t.id || m.teamB === t.id) {
          const oppId = m.teamA === t.id ? m.teamB : m.teamA;
          const opp = getTeam(oppId);
          if (opp) oppMps.push(opp.mp);
        }
      });
    });
    if (oppMps.length >= 3) {
      oppMps.sort((a, b) => a - b);
      const trimmed = oppMps.slice(1, -1);
      t.medianBuchholz = trimmed.reduce((sum, v) => sum + v, 0);
    } else {
      t.medianBuchholz = oppMps.reduce((sum, v) => sum + v, 0);
    }
  });

  function headToHeadResult(teamAId, teamBId) {
    for (let i = 0; i < state.rounds.length; i++) {
      const round = state.rounds[i];
      if (maxRound && (i + 1) > maxRound) continue;

      for (const m of round.matches) {
        if (m.isBye || m.results.includes(null)) continue;
        const isMatch =
          (m.teamA === teamAId && m.teamB === teamBId) ||
          (m.teamA === teamBId && m.teamB === teamAId);
        if (!isMatch) continue;

        let ptsA = 0;
        let ptsB = 0;
        m.results.forEach((res) => {
          if (res === "1-0") ptsA += 1;
          else if (res === "0.5-0.5") {
            ptsA += 0.5;
            ptsB += 0.5;
          } else if (res === "0-1") ptsB += 1;
        });
        if (ptsA === ptsB) return 0;
        if (m.teamA === teamAId) return ptsA > ptsB ? 1 : -1;
        return ptsB > ptsA ? 1 : -1;
      }
    }
    return 0;
  }

  // 4. Sort
  state.teams.sort((a, b) => {
    if (b.mp !== a.mp) return b.mp - a.mp; // Primary: Match Points
    if (b.bp !== a.bp) return b.bp - a.bp; // Secondary: Board Points
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz; // Buchholz
    if (b.medianBuchholz !== a.medianBuchholz)
      return b.medianBuchholz - a.medianBuchholz;
    if (b.sonnebornBerger !== a.sonnebornBerger)
      return b.sonnebornBerger - a.sonnebornBerger;
    const h2h = headToHeadResult(a.id, b.id);
    if (h2h !== 0) return -h2h;
    return 0;
  });
}

function getMatchPointsSnapshot(roundNum) {
  const snapshot = {};
  if (!state.teams) return snapshot;
  const scoring = getTeamScoringConfig();

  state.teams.forEach((t) => {
    snapshot[t.id] = 0;
  });

  const roundsToCount = Math.max(0, roundNum - 1);
  const rounds = state.rounds.slice(0, roundsToCount);

  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.isBye) {
        const t = getTeam(match.teamA);
        if (t) {
          snapshot[t.id] += scoring.byeMatchPoints;
        }
        return;
      }

      const tA = getTeam(match.teamA);
      const tB = getTeam(match.teamB);
      if (!tA || !tB) return;

      let ptsA = 0;
      let ptsB = 0;
      match.results.forEach((res) => {
        if (res === "1-0") {
          ptsA += 1;
        } else if (res === "0.5-0.5") {
          ptsA += 0.5;
          ptsB += 0.5;
        } else if (res === "0-1") {
          ptsB += 1;
        } else if (res === "0-0") {
          // no points
        }
      });

      if (!match.results.includes(null)) {
        if (ptsA > ptsB) {
          snapshot[tA.id] += scoring.matchWin;
          snapshot[tB.id] += scoring.matchLoss;
        } else if (ptsA < ptsB) {
          snapshot[tA.id] += scoring.matchLoss;
          snapshot[tB.id] += scoring.matchWin;
        } else {
          snapshot[tA.id] += scoring.matchDraw;
          snapshot[tB.id] += scoring.matchDraw;
        }
      }
    });
  });

  return snapshot;
}

function rebuildTeamHistoryFromRounds() {
  state.teams.forEach((t) => {
    t.opponents = [];
    t.colorHistory = [];
    t.colorPreference = 0;
    t.hadBye = false;
  });

  state.rounds.forEach((round) => {
    round.matches.forEach((m) => {
      if (m.isBye) {
        const tA = getTeam(m.teamA);
        if (tA) {
          tA.hadBye = true;
          tA.colorHistory.push(null); // Bye has no color
        }
        return;
      }
      const tA = getTeam(m.teamA);
      const tB = getTeam(m.teamB);
      if (tA && tB) {
        tA.opponents.push(tB.id);
        tB.opponents.push(tA.id);

        const colorA = m.teamAColor || null; // 'W' or 'B' or null if not set
        const colorB = colorA === 'W' ? 'B' : (colorA === 'B' ? 'W' : null);

        tA.colorHistory.push(colorA);
        tB.colorHistory.push(colorB);
      }
    });
  });

  // Calculate Color Preferences
  state.teams.forEach(t => {
    let pref = 0;
    t.colorHistory.forEach(c => {
      if (c === 'W') pref--;
      if (c === 'B') pref++;
    });
    t.colorPreference = pref;
  });
}

function calculateStandingsSingles(maxRound) {
  if (!state.singles || !state.singles.players) return;

  state.singles.players.forEach((p) => {
    p.mp = 0;
    p.buchholz = 0;
  });

  state.singles.rounds.forEach((round, roundIndex) => {
    if (maxRound && (roundIndex + 1) > maxRound) return;

    round.matches.forEach((m) => {
      if (m.isBye) {
        const p = getPlayer(m.playerA);
        if (p) p.mp += state.singles.config.pointsBye;
        return;
      }
      const pA = getPlayer(m.playerA);
      const pB = getPlayer(m.playerB);
      if (!pA || !pB) return;
      if (!m.result) return;

      if (m.result === "1-0") {
        pA.mp += state.singles.config.pointsWin;
        pB.mp += state.singles.config.pointsLoss;
      } else if (m.result === "0-1") {
        pA.mp += state.singles.config.pointsLoss;
        pB.mp += state.singles.config.pointsWin;
      } else if (m.result === "0.5-0.5") {
        pA.mp += state.singles.config.pointsDraw;
        pB.mp += state.singles.config.pointsDraw;
      }
    });
  });

  state.singles.players.forEach((p) => {
    let bh = 0;
    state.singles.rounds.forEach((round, roundIndex) => {
      if (maxRound && (roundIndex + 1) > maxRound) return;

      round.matches.forEach((m) => {
        if (m.isBye || !m.result) return;
        if (m.playerA === p.id) {
          const opp = getPlayer(m.playerB);
          if (opp) bh += opp.mp;
        }
        if (m.playerB === p.id) {
          const opp = getPlayer(m.playerA);
          if (opp) bh += opp.mp;
        }
      });
    });
    p.buchholz = bh;
  });

  state.singles.players.sort((a, b) => {
    if (b.mp !== a.mp) return b.mp - a.mp;
    return b.buchholz - a.buchholz;
  });
}

function rebuildPlayerHistoryFromRounds() {
  if (!state.singles || !state.singles.players) return;
  state.singles.players.forEach((p) => {
    p.opponents = [];
    p.colorHistory = [];
    p.colorPreference = 0;
    p.hadBye = false;
  });

  state.singles.rounds.forEach((round) => {
    round.matches.forEach((m) => {
      if (m.isBye) {
        const pA = getPlayer(m.playerA);
        if (pA) {
          pA.hadBye = true;
          pA.colorHistory.push(null); // Bye has no color
        }
        return;
      }
      const pA = getPlayer(m.playerA);
      const pB = getPlayer(m.playerB);
      if (pA && pB) {
        if (!pA.opponents) pA.opponents = [];
        if (!pB.opponents) pB.opponents = [];
        pA.opponents.push(pB.id);
        pB.opponents.push(pA.id);

        const colorA = m.playerAColor || null;
        const colorB = colorA === 'W' ? 'B' : (colorA === 'B' ? 'W' : null);
        pA.colorHistory.push(colorA);
        pB.colorHistory.push(colorB);
      }
    });
  });

  // Calculate Color Preferences
  state.singles.players.forEach((p) => {
    let pref = 0;
    p.colorHistory.forEach((c) => {
      if (c === 'W') pref--;
      if (c === 'B') pref++;
    });
    p.colorPreference = pref;
  });
}

