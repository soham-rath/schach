const META_KEY = "swiss_manager_meta";
const DATA_PREFIX = "swiss_manager_data_";

function parseJsonSafely(raw, fallback = null) {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function normalizeMeta(meta) {
  const normalized = {
    activeId: null,
    tournaments: [],
  };

  if (!meta || typeof meta !== "object") return normalized;

  if (Array.isArray(meta.tournaments)) {
    normalized.tournaments = meta.tournaments
      .filter((item) => item && typeof item.id === "string" && item.id.trim())
      .map((item) => ({
        id: item.id,
        name:
          typeof item.name === "string" && item.name.trim()
            ? item.name
            : "Turnier",
        lastModified: Number.isFinite(Number(item.lastModified))
          ? Number(item.lastModified)
          : 0,
        mode: item.mode === "SINGLES" ? "SINGLES" : "TEAM",
      }));
  }

  if (typeof meta.activeId === "string" && meta.activeId.trim()) {
    normalized.activeId = meta.activeId;
  }

  if (
    normalized.activeId &&
    !normalized.tournaments.some((t) => t.id === normalized.activeId)
  ) {
    normalized.activeId =
      normalized.tournaments.length > 0 ? normalized.tournaments[0].id : null;
  }

  return normalized;
}

function getMeta() {
  const rawMeta = localStorage.getItem(META_KEY);
  return normalizeMeta(parseJsonSafely(rawMeta));
}

function loadState() {
  try {
    // 1. Load Meta
    let meta = getMeta();
    if (!localStorage.getItem(META_KEY)) {
      // Migration: Check for old single save
      const oldData = localStorage.getItem("swiss_manager_data");
      if (oldData) {
        console.log("Migrating existing save to multi-tournament storage.");
        const oldState = parseJsonSafely(oldData, {});
        const newId = "tour_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        meta = {
          activeId: newId,
          tournaments: [{ id: newId, name: oldState?.config?.name || "Legacy Tournament", lastModified: Date.now() }]
        };
        localStorage.setItem(META_KEY, JSON.stringify(meta));
        localStorage.setItem(DATA_PREFIX + newId, oldData);
        localStorage.removeItem("swiss_manager_data"); // Clean up
      } else {
        // Fresh start
        meta = { activeId: null, tournaments: [] };
      }
    }

    // 2. Load Active Tournament
    if (meta.activeId) {
      const key = DATA_PREFIX + meta.activeId;
      const saved = localStorage.getItem(key);
      if (saved) {
        state = JSON.parse(saved);
        // Ensure state has ID
        if (!state.id) state.id = meta.activeId;
      } else {
        console.warn(`Active tournament ${meta.activeId} not found. Creating new.`);
        createNewTournament(false); // don't reload page yet
      }
    } else {
      // No active tournament, create one
      if (meta.tournaments.length > 0) {
        // Fallback to first
        switchTournament(meta.tournaments[0].id, false);
      } else {
        createNewTournament(false);
      }
    }

  } catch (e) {
    console.warn("Storage Error or File Protocol:", e);
    // Fallback in-memory
    if (!state.teams) state.teams = [];
  }

  // Verification
  if (!state.teams) state.teams = [];
  if (state.teams.length === 0 && (!state.config || state.config.name === "Turnier")) {
    loadDefaults();
  }
  normalizeState();
}

// --- SLOT MANAGEMENT ---

function createNewTournament(reload = true) {
  const newId = "tour_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  // Build a fresh state for the new tournament slot.
  state = {
    id: newId,
    config: { name: "Neues Turnier", type: "SWISS", totalRounds: 5, boardsPerMatch: 4, pointsMatchWin: 2, pointsMatchDraw: 1, pointsMatchLoss: 0, pointsBye: 2, rulesPreset: "CUSTOM" },
    mode: "TEAM",
    singles: { config: { name: "Neues Einzelturnier", type: "SWISS", totalRounds: 5, pointsWin: 1, pointsDraw: 0.5, pointsLoss: 0, pointsBye: 1, rulesPreset: "CUSTOM" }, players: [], rounds: [], currentRound: 0, status: "SETUP", excludedPlayersThisRound: [] },
    teams: [],
    rounds: [],
    currentRound: 0,
    status: "SETUP",
    excludedTeamsThisRound: [],
    theme: state.theme || "dark"
  };
  normalizeState();
  saveState();
  if (reload) location.reload();
}

function switchTournament(id, reload = true) {
  const key = DATA_PREFIX + id;
  const data = localStorage.getItem(key);
  if (!data) return false;

  const parsed = parseJsonSafely(data);
  if (!parsed || typeof parsed !== "object") return false;

  const meta = getMeta();
  meta.activeId = id;
  localStorage.setItem(META_KEY, JSON.stringify(meta));

  if (reload) {
    location.reload();
  } else {
    state = parsed;
    normalizeState();
  }
  return true;
}

function deleteTournament(id) {
  let meta = getMeta();
  if (!meta) return;

  // Remove data
  localStorage.removeItem(DATA_PREFIX + id);

  // Remove from List
  meta.tournaments = meta.tournaments.filter(t => t.id !== id);

  // If deleted was active, switch to another
  if (meta.activeId === id) {
    if (meta.tournaments.length > 0) {
      meta.activeId = meta.tournaments[0].id;
      localStorage.setItem(META_KEY, JSON.stringify(meta));
      switchTournament(meta.activeId, true);
      return true;
    } else {
      // No tournaments left
      localStorage.removeItem(META_KEY); // Reset meta
      createNewTournament(true);
      return true;
    }
  } else {
    // Just update meta
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    return true;
  }
}

function getTournamentList() {
  try {
    const meta = getMeta();
    return meta ? meta.tournaments : [];
  } catch (e) { return []; }
}

async function saveState() {
  try {
    if (!state.id) {
      state.id = "tour_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    }

    // Save Data
    const key = DATA_PREFIX + state.id;
    localStorage.setItem(key, JSON.stringify(state));

    // Update Meta
    let meta = getMeta();

    meta.activeId = state.id;

    // Update or Add to list
    let name = "Turnier";
    if (state.mode === "SINGLES" && state.singles && state.singles.config) {
      name = state.singles.config.name || "Einzelturnier";
    } else if (state.config) {
      name = state.config.name || "Turnier";
    }

    const idx = meta.tournaments.findIndex(t => t.id === state.id);
    const info = { id: state.id, name: name, lastModified: Date.now(), mode: state.mode };

    if (idx >= 0) {
      meta.tournaments[idx] = info;
    } else {
      meta.tournaments.push(info);
    }

    localStorage.setItem(META_KEY, JSON.stringify(meta));

  } catch (e) {
    console.warn("LocalStorage nicht verfügbar:", e);
  }
}

// --- HISTORY MANAGEMENT ---
