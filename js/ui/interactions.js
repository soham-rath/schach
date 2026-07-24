function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return; // Guard

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "⚠️";

  toast.innerHTML = `<span style="font-size:1.2rem">${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add("hiding");
    toast.addEventListener("transitionend", () => toast.remove());
  }, duration);
}

function showAlert(message, title = "Hinweis") {
  document.getElementById("alert-title").innerText = title;
  document.getElementById("alert-message").innerText = message;
  document.getElementById("alert-modal").classList.remove("hidden");
}

function closeAlert() {
  document.getElementById("alert-modal").classList.add("hidden");
}

// --- IMPORT ---

function setupImportListener() {
  const input = document.getElementById("import-file-input");
  if (!input || input.dataset.bound === "true") return;
  input.dataset.bound = "true";

  input.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== "object") {
        showAlert("Ungültige Datei: Kein gültiges JSON-Objekt.", "Import fehlgeschlagen");
        return;
      }

      // Detect file format: Singles tournament vs full tournament
      const isSinglesFile = parsed.players && parsed.rounds && parsed.config && !parsed.teams;
      const isTeamsFile = parsed.teams && parsed.rounds && parsed.config;

      if (!isSinglesFile && !isTeamsFile) {
        showAlert("Ungültige Datei: Fehlende Turnierdaten.", "Import fehlgeschlagen");
        return;
      }

      if (
        !(await showConfirm(
          "Import überschreibt den aktuellen Turnierstand. Fortfahren?",
          "Import bestätigen",
        ))
      ) {
        return;
      }

      commitState();
      if (isSinglesFile) {
        state.mode = "SINGLES";
        state.singles = parsed;
      } else {
        state = parsed;
      }
      normalizeState();
      saveState();
      updateNavigation();
      lockSetup();
      renderAll();
      showSection("standings");
      showToast("Import erfolgreich.", "success");
    } catch (err) {
      console.error(err);
      showAlert("Import fehlgeschlagen: " + err.message, "Fehler");
    }
  });
}

// Global resolve for confirm
let confirmResolve = null;

function showConfirm(message, title = "Bestätigung") {
  return new Promise((resolve) => {
    document.getElementById("confirm-title").innerText = title;
    document.getElementById("confirm-message").innerText = message;
    document.getElementById("confirm-modal").classList.remove("hidden");

    const okBtn = document.getElementById("confirm-ok-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");

    // Clone to clear listeners
    const newOk = okBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newOk.addEventListener("click", () => {
      closeConfirm();
      resolve(true);
    });

    newCancel.addEventListener("click", () => {
      closeConfirm();
      resolve(false);
    });

    // Also allow Escape key?
    // For simplicity, sticking to buttons.
  });
}

function closeConfirm() {
  document.getElementById("confirm-modal").classList.add("hidden");
}

// --- CONFIRM & MODAL HELPERS ---

function showExcludeModal() {
  const modal = document.getElementById("exclude-modal");
  const list = document.getElementById("exclude-teams-list");
  list.innerHTML = "";

  // Sort teams by name for easier selection
  const sortedTeams = [...state.teams].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  sortedTeams.forEach((t) => {
    const div = document.createElement("div");
    div.className = "exclude-item";
    div.innerHTML = `
            <input type="checkbox" id="exclude-${t.id}" value="${t.id}">
            <label for="exclude-${t.id}">${formatTeamDisplay(t)}</label>
        `;
    // Allow clicking the whole row to toggle checkbox
    div.addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT") {
        const cb = div.querySelector("input");
        cb.checked = !cb.checked;
      }
    });
    list.appendChild(div);
  });

  const searchInput = document.getElementById("exclude-teams-search");
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }

  modal.classList.remove("hidden");
}

function closeExcludeModal() {
  document.getElementById("exclude-modal").classList.add("hidden");
}

function showExcludeSinglesModal() {
  const modal = document.getElementById("exclude-singles-modal");
  const list = document.getElementById("exclude-players-list");
  if (!modal || !list) return;
  list.innerHTML = "";

  const sortedPlayers = [...state.singles.players].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  sortedPlayers.forEach((p) => {
    const div = document.createElement("div");
    div.className = "exclude-item";
    div.innerHTML = `
            <input type="checkbox" id="exclude-player-${p.id}" value="${p.id}">
            <label for="exclude-player-${p.id}">${formatPlayerDisplay(p)}</label>
        `;
    div.addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT") {
        const cb = div.querySelector("input");
        cb.checked = !cb.checked;
      }
    });
    list.appendChild(div);
  });

  const searchInput = document.getElementById("exclude-players-search");
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }

  modal.classList.remove("hidden");
}

function closeExcludeSinglesModal() {
  document.getElementById("exclude-singles-modal").classList.add("hidden");
}

// --- FORCED PAIRING MODALS ---

function showForcedPairingModal() {
  const modal = document.getElementById("forced-pairing-modal");
  if (!modal) return;
  renderForcedPairsList();
  const searchInput = document.getElementById("forced-pairs-search");
  if (searchInput) {
    searchInput.value = "";
    filterForcedPairsSearch("", "forced-pairs-list");
    searchInput.focus();
  }
  modal.classList.remove("hidden");
}

function closeForcedPairingModal() {
  const modal = document.getElementById("forced-pairing-modal");
  if (modal) modal.classList.add("hidden");
}

function renderForcedPairsList() {
  const container = document.getElementById("forced-pairs-list");
  if (!container) return;
  container.innerHTML = "";
  const existing = Array.isArray(state.forcedPairsThisRound)
    ? state.forcedPairsThisRound
    : [];
  if (existing.length === 0) {
    addForcedPairRow();
  } else {
    existing.forEach((pair) => addForcedPairRow(pair.a, pair.b));
  }
}

function addForcedPairRow(selectedA, selectedB) {
  const container = document.getElementById("forced-pairs-list");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "forced-pair-row";

  const optionsA = buildForcedTeamOptions(selectedA);
  const optionsB = buildForcedTeamOptions(selectedB);

  row.innerHTML = `
    <select class="forced-pair-a">${optionsA}</select>
    <span>vs</span>
    <select class="forced-pair-b">${optionsB}</select>
    <button class="btn danger sm" type="button" onclick="this.closest('.forced-pair-row').remove()">×</button>
  `;

  container.appendChild(row);
}

function buildForcedTeamOptions(selectedId) {
  let html = '<option value="">-- Team --</option>';
  const excludedIds = new Set(state.excludedTeamsThisRound || []);
  const teams = [...(state.teams || [])]
    .filter((t) => !excludedIds.has(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  teams.forEach((t) => {
    const selected = t.id === selectedId ? "selected" : "";
    html += `<option value="${t.id}" ${selected}>${formatTeamDisplay(t)}</option>`;
  });
  return html;
}

function showForcedPairingSinglesModal() {
  const modal = document.getElementById("forced-pairing-singles-modal");
  if (!modal) return;
  renderForcedSinglesPairsList();
  const searchInput = document.getElementById("forced-pairs-singles-search");
  if (searchInput) {
    searchInput.value = "";
    filterForcedPairsSearch("", "forced-pairs-singles-list");
    searchInput.focus();
  }
  modal.classList.remove("hidden");
}

function closeForcedPairingSinglesModal() {
  const modal = document.getElementById("forced-pairing-singles-modal");
  if (modal) modal.classList.add("hidden");
}

function renderForcedSinglesPairsList() {
  const container = document.getElementById("forced-pairs-singles-list");
  if (!container) return;
  container.innerHTML = "";
  const existing = Array.isArray(state.singles?.forcedPairsThisRound)
    ? state.singles.forcedPairsThisRound
    : [];
  if (existing.length === 0) {
    addForcedSinglesPairRow();
  } else {
    existing.forEach((pair) => addForcedSinglesPairRow(pair.a, pair.b));
  }
}

function addForcedSinglesPairRow(selectedA, selectedB) {
  const container = document.getElementById("forced-pairs-singles-list");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "forced-pair-row";

  const optionsA = buildForcedPlayerOptions(selectedA);
  const optionsB = buildForcedPlayerOptions(selectedB);

  row.innerHTML = `
    <select class="forced-pair-a">${optionsA}</select>
    <span>vs</span>
    <select class="forced-pair-b">${optionsB}</select>
    <button class="btn danger sm" type="button" onclick="this.closest('.forced-pair-row').remove()">×</button>
  `;

  container.appendChild(row);
}

function buildForcedPlayerOptions(selectedId) {
  let html = '<option value="">-- Spieler --</option>';
  const excludedIds = new Set(state.singles?.excludedPlayersThisRound || []);
  const players = [...(state.singles?.players || [])]
    .filter((p) => !excludedIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  players.forEach((p) => {
    const selected = p.id === selectedId ? "selected" : "";
    html += `<option value="${p.id}" ${selected}>${formatPlayerDisplay(p)}</option>`;
  });
  return html;
}

function filterExcludeList(term, listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  const normalized = String(term || "").toLowerCase().trim();
  const items = list.querySelectorAll(".exclude-item");
  let visibleCount = 0;
  items.forEach((item) => {
    const label = item.querySelector("label");
    const text = (label ? label.textContent : item.textContent) || "";
    const match = !normalized || text.toLowerCase().includes(normalized);
    item.classList.toggle("hidden", !match);
    if (match) visibleCount++;
  });

  const noResultsId = listId.replace("-list", "-no-results");
  const noResultsEl = document.getElementById(noResultsId);
  if (noResultsEl) {
    noResultsEl.classList.toggle("hidden", visibleCount > 0);
  }
}

function filterForcedPairsSearch(term, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const normalized = String(term || "").toLowerCase().trim();
  const selects = container.querySelectorAll("select");
  selects.forEach((select) => {
    Array.from(select.options).forEach((option) => {
      if (!option.value) return; // keep placeholder visible
      const text = (option.textContent || "").toLowerCase();
      const matches = !normalized || text.includes(normalized);
      option.hidden = !matches && !option.selected;
    });
  });
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applyTheme();
  saveState();
}

function printActiveView() {
  window.print();
}


function applyRulesPreset(preset) {
  const presetConfig = RULES_PRESETS && RULES_PRESETS[preset];
  if (!presetConfig) return;

  const winInput = document.getElementById("points-win");
  const drawInput = document.getElementById("points-draw");

  state.config.pointsMatchWin = presetConfig.pointsMatchWin;
  state.config.pointsMatchDraw = presetConfig.pointsMatchDraw;
  state.config.pointsMatchLoss = presetConfig.pointsMatchLoss;
  state.config.pointsBye = presetConfig.pointsBye;
  state.config.rulesPreset = preset;

  if (winInput) winInput.value = presetConfig.pointsMatchWin;
  if (drawInput) drawInput.value = presetConfig.pointsMatchDraw;
}

function applySinglesRulesPreset(preset) {
  const presetConfig = RULES_PRESETS && RULES_PRESETS[preset];
  if (!presetConfig) return;

  const winInput = document.getElementById("points-win-singles");
  const drawInput = document.getElementById("points-draw-singles");

  state.singles.config.pointsWin = presetConfig.pointsMatchWin;
  state.singles.config.pointsDraw = presetConfig.pointsMatchDraw;
  state.singles.config.pointsLoss = presetConfig.pointsMatchLoss;
  state.singles.config.pointsBye = presetConfig.pointsBye;
  state.singles.config.rulesPreset = preset;

  if (winInput) winInput.value = presetConfig.pointsMatchWin;
  if (drawInput) drawInput.value = presetConfig.pointsMatchDraw;
}

function markPresetCustom() {
  const presetSelect = document.getElementById("rules-preset");
  if (presetSelect && presetSelect.value !== "CUSTOM") {
    presetSelect.value = "CUSTOM";
  }
}

function markSinglesPresetCustom() {
  const presetSelect = document.getElementById("rules-preset-singles");
  if (presetSelect && presetSelect.value !== "CUSTOM") {
    presetSelect.value = "CUSTOM";
  }
}

function setupPresetListeners() {
  const winInput = document.getElementById("points-win");
  const drawInput = document.getElementById("points-draw");
  const singlesWinInput = document.getElementById("points-win-singles");
  const singlesDrawInput = document.getElementById("points-draw-singles");

  const presetSelect = document.getElementById("rules-preset");
  if (presetSelect) {
    presetSelect.value = state.config.rulesPreset || "CUSTOM";
    presetSelect.addEventListener("change", () => {
      const val = presetSelect.value || "CUSTOM";
      if (val === "CUSTOM") {
        state.config.rulesPreset = "CUSTOM";
        saveState();
        return;
      }
      applyRulesPreset(val);
      saveState();
    });
  }

  if (winInput) winInput.addEventListener("input", markPresetCustom);
  if (drawInput) drawInput.addEventListener("input", markPresetCustom);

  const singlesPresetSelect = document.getElementById("rules-preset-singles");
  if (singlesPresetSelect) {
    singlesPresetSelect.value = state.singles.config.rulesPreset || "CUSTOM";
    singlesPresetSelect.addEventListener("change", () => {
      const val = singlesPresetSelect.value || "CUSTOM";
      if (val === "CUSTOM") {
        state.singles.config.rulesPreset = "CUSTOM";
        saveState();
        return;
      }
      applySinglesRulesPreset(val);
      saveState();
    });
  }

  if (singlesWinInput) singlesWinInput.addEventListener("input", markSinglesPresetCustom);
  if (singlesDrawInput) singlesDrawInput.addEventListener("input", markSinglesPresetCustom);

  // Round Robin Listener
  const pairingSelect = document.getElementById("pairing-system");
  if (pairingSelect) {
    pairingSelect.addEventListener("change", () => {
      const type = pairingSelect.value;
      const roundsInput = document.getElementById("total-rounds");
      const boardsInput = document.getElementById("boards-count");

      if (type === "ROUND_ROBIN") {
        // Calculate needed rounds
        let needed = 1;
        if (roundsInput) {
          const teamCount = state.teams.length;
          needed = teamCount < 2 ? 1 : (teamCount % 2 === 0 ? teamCount - 1 : teamCount);
          roundsInput.value = needed;
        }

        // Hide containers
        if (roundsInput) roundsInput.closest('.form-group').style.display = 'none';
        // boardsInput should remain visible for Team Round Robin!

        // Update State
        state.config.totalRounds = needed;

      } else {
        // Show containers
        if (roundsInput) {
          roundsInput.disabled = false;
          roundsInput.closest('.form-group').style.display = 'block';
        }
        if (boardsInput) {
          boardsInput.closest('.form-group').style.display = 'block';
        }
      }

      state.config.type = type;
      saveState();
    });
    // Sync form state on load when round-robin is already selected.
    if (state.config.type === "ROUND_ROBIN") {
      pairingSelect.dispatchEvent(new Event('change'));
    }
  }

  // Singles Round Robin Listener
  const singlesPairingSelect = document.getElementById("pairing-system-singles");
  if (singlesPairingSelect) {
    singlesPairingSelect.addEventListener("change", () => {
      const type = singlesPairingSelect.value;
      const roundsInput = document.getElementById("total-rounds-singles");

      if (type === "ROUND_ROBIN") {
        let needed = 1;
        if (roundsInput) {
          const playerCount = state.singles.players.length;
          needed = playerCount < 2 ? 1 : (playerCount % 2 === 0 ? playerCount - 1 : playerCount);
          roundsInput.value = needed;
        }

        if (roundsInput) roundsInput.closest('.form-group').style.display = 'none';

        state.singles.config.totalRounds = needed;

      } else {
        if (roundsInput) {
          roundsInput.disabled = false;
          roundsInput.closest('.form-group').style.display = 'block';
        }
      }

      state.singles.config.type = type;
      saveState();
    });

    if (state.singles.config.type === "ROUND_ROBIN") {
      singlesPairingSelect.dispatchEvent(new Event('change'));
    }
  }
}

function openPairingSwapModal() {
  if (state.currentRound === 0) {
    showAlert("Noch keine Paarungen vorhanden.", "Hinweis");
    return;
  }
  if (state.currentRound !== state.rounds.length) {
    showAlert("Nur die aktuelle Runde kann bearbeitet werden.", "Hinweis");
    return;
  }

  const round = state.rounds[state.currentRound - 1];
  const slotA = document.getElementById("swap-slot-a");
  const slotB = document.getElementById("swap-slot-b");
  if (!slotA || !slotB) return;

  const options = [];
  round.matches.forEach((m, idx) => {
    const tA = getTeam(m.teamA);
    if (tA) {
      options.push({
        value: `${idx}:teamA`,
        label: `Tisch ${m.table}: ${formatTeamDisplay(tA)} (A)`,
      });
    }
    if (!m.isBye) {
      const tB = getTeam(m.teamB);
      if (tB) {
        options.push({
          value: `${idx}:teamB`,
          label: `Tisch ${m.table}: ${formatTeamDisplay(tB)} (B)`,
        });
      }
    }
  });

  slotA.innerHTML = "";
  slotB.innerHTML = "";
  options.forEach((opt) => {
    const o1 = document.createElement("option");
    o1.value = opt.value;
    o1.textContent = opt.label;
    const o2 = document.createElement("option");
    o2.value = opt.value;
    o2.textContent = opt.label;
    slotA.appendChild(o1);
    slotB.appendChild(o2);
  });

  document.getElementById("pairing-swap-modal").classList.remove("hidden");
}

function closePairingSwapModal() {
  document.getElementById("pairing-swap-modal").classList.add("hidden");
}

// --- BULK PLAYER IMPORT ---

let bulkImportColumnCount = 0;

function buildPlayerSignature(firstname, lastname, externalId) {
  return [
    String(firstname || "").trim().toLowerCase(),
    String(lastname || "").trim().toLowerCase(),
    String(externalId || "").trim().toLowerCase(),
  ].join("|");
}

function openBulkPlayerImportModal() {
  const modal = document.getElementById("bulk-player-import-modal");
  const textarea = document.getElementById("bulk-import-textarea");
  const delimiterSelect = document.getElementById("bulk-import-delimiter");
  const customDelimiterInput = document.getElementById(
    "bulk-import-custom-delimiter",
  );
  const skipHeaderCheckbox = document.getElementById(
    "bulk-import-skip-header",
  );

  if (textarea) textarea.value = "";
  if (delimiterSelect) delimiterSelect.value = "auto";
  if (customDelimiterInput) {
    customDelimiterInput.value = "";
    customDelimiterInput.style.display = "none";
  }
  if (skipHeaderCheckbox) skipHeaderCheckbox.checked = false;

  bulkImportColumnCount = 0;
  renderBulkImportMapping();
  updateBulkImportPreview();

  modal.classList.remove("hidden");
}



function closeBulkPlayerImportModal() {
  const modal = document.getElementById("bulk-player-import-modal");
  if (modal) modal.classList.add("hidden");
}

function onBulkImportDelimiterChange() {
  const delimiterSelect = document.getElementById("bulk-import-delimiter");
  const customDelimiterInput = document.getElementById(
    "bulk-import-custom-delimiter",
  );

  if (delimiterSelect && customDelimiterInput) {
    customDelimiterInput.style.display =
      delimiterSelect.value === "custom" ? "block" : "none";
  }

  updateBulkImportPreview();
}

function getBulkImportDelimiter() {
  const delimiterSelect = document.getElementById("bulk-import-delimiter");
  if (!delimiterSelect) return "\t";

  const value = delimiterSelect.value;
  if (value === "auto") return "auto";
  if (value === "custom") {
    const customInput = document.getElementById("bulk-import-custom-delimiter");
    const customValue = customInput ? customInput.value : "";
    return customValue || "\t";
  }
  return value;
}

function detectDelimiter(text) {
  if (!text) return "\t";
  const delimiters = ["\t", ";", ",", " "];
  let bestDelimiter = "\t";
  let maxCount = 0;

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  delimiters.forEach((delimiter) => {
    const totalCount = lines.reduce((sum, line) => {
      return sum + Math.max(0, line.split(delimiter).length - 1);
    }, 0);
    if (totalCount > maxCount) {
      maxCount = totalCount;
      bestDelimiter = delimiter;
    }
  });

  return bestDelimiter;
}

function parseBulkImportRows(text) {
  if (!text || !text.trim()) return [];

  let delimiter = getBulkImportDelimiter();
  if (delimiter === "auto") {
    delimiter = detectDelimiter(text);
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    if (delimiter === " ") {
      return line.split(/\s+/).filter((cell) => cell.length > 0);
    }
    return line.split(delimiter).map((cell) => cell.trim());
  });
}

function renderBulkImportMapping() {
  const container = document.getElementById("bulk-import-column-mapping");
  if (!container) return;

  container.innerHTML = "";

  if (bulkImportColumnCount === 0) {
    container.innerHTML =
      '<p class="bulk-import-summary">Füge Daten ein, um die Spaltenzuordnung zu sehen.</p>';
    return;
  }

  const labels = [];
  for (let i = 0; i < bulkImportColumnCount; i++) {
    labels.push(`Spalte ${i + 1}`);
  }

  labels.forEach((label, index) => {
    const row = document.createElement("div");
    row.className = "bulk-import-mapping-row";

    const select = document.createElement("select");
    select.id = `bulk-import-col-${index}`;
    select.dataset.columnIndex = index;
    select.onchange = updateBulkImportPreview;

    const options = [
      { value: "ignore", label: "Ignorieren" },
      { value: "name", label: "Vorname" },
      { value: "lastname", label: "Nachname" },
      { value: "id", label: "ID" },
      { value: "note", label: "Text/Notiz" },
    ];

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });

    // Try to auto-detect mapping based on header or content
    const textarea = document.getElementById("bulk-import-textarea");
    const rows = textarea ? parseBulkImportRows(textarea.value) : [];
    const autoMap = autoDetectColumnMapping(index, rows);
    if (autoMap) {
      select.value = autoMap;
    }

    const labelEl = document.createElement("label");
    labelEl.textContent = label;

    row.appendChild(labelEl);
    row.appendChild(select);
    container.appendChild(row);
  });
}

function autoDetectColumnMapping(columnIndex, rows) {
  const skipHeaderCheckbox = document.getElementById("bulk-import-skip-header");
  const skipHeader = skipHeaderCheckbox ? skipHeaderCheckbox.checked : false;

  const headerRow = skipHeader && rows.length > 1 ? rows[0] : null;
  if (!headerRow || columnIndex >= headerRow.length) return null;

  const cell = headerRow[columnIndex].toLowerCase().trim();

  if (cell.includes("vorname")) return "name";
  if (cell.includes("nachname") || cell.includes("lastname")) return "lastname";
  if (cell.includes("id") || cell.includes("nummer")) return "id";
  if (cell.includes("text") || cell.includes("notiz") || cell.includes("info") || cell.includes("bemerkung")) return "note";
  if (cell.includes("name") && !cell.includes("nachname")) return "name";

  return null;
}

function getBulkImportColumnMappings() {
  const mappings = [];
  for (let i = 0; i < bulkImportColumnCount; i++) {
    const select = document.getElementById(`bulk-import-col-${i}`);
    mappings.push(select ? select.value : "ignore");
  }
  return mappings;
}

function getBulkImportSkipHeader() {
  const skipHeaderCheckbox = document.getElementById("bulk-import-skip-header");
  return skipHeaderCheckbox ? skipHeaderCheckbox.checked : false;
}

function updateBulkImportPreview() {
  const textarea = document.getElementById("bulk-import-textarea");
  const previewContainer = document.getElementById(
    "bulk-import-preview-container",
  );
  const previewTable = document.getElementById("bulk-import-preview-table");
  const summaryEl = document.getElementById("bulk-import-summary");

  if (!textarea || !previewContainer || !previewTable) return;

  const rawText = textarea.value;
  const allRows = parseBulkImportRows(rawText);
  const skipHeader = getBulkImportSkipHeader();
  const dataRows = skipHeader && allRows.length > 1 ? allRows.slice(1) : allRows;

  // Update column count and mapping UI if changed
  const newColumnCount = allRows.reduce(
    (max, row) => Math.max(max, row.length),
    0,
  );
  if (newColumnCount !== bulkImportColumnCount) {
    bulkImportColumnCount = newColumnCount;
    renderBulkImportMapping();
  }

  const mappings = getBulkImportColumnMappings();

  if (allRows.length === 0) {
    previewContainer.classList.add("hidden");
    return;
  }

  previewContainer.classList.remove("hidden");

  // Build preview table
  const thead = previewTable.querySelector("thead");
  const tbody = previewTable.querySelector("tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  // Header row
  const headerRow = document.createElement("tr");
  for (let i = 0; i < bulkImportColumnCount; i++) {
    const th = document.createElement("th");
    const mapping = mappings[i] || "ignore";
    const mappingText = {
      ignore: "Ignorieren",
      name: "Vorname",
      lastname: "Nachname",
      id: "ID",
      note: "Text/Notiz",
    }[mapping];
    th.textContent = `Spalte ${i + 1} (${mappingText})`;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);

  // Preview up to 10 data rows
  const previewRows = dataRows.slice(0, 10);
  previewRows.forEach((row) => {
    const tr = document.createElement("tr");
    for (let i = 0; i < bulkImportColumnCount; i++) {
      const td = document.createElement("td");
      td.textContent = row[i] || "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });

  // Summary
  const validPlayers = buildBulkImportPlayers(dataRows, mappings).filter(
    (p) => p.name || p.lastname,
  ).length;
  summaryEl.textContent = `${dataRows.length} Datenzeile(n) gefunden, ${validPlayers} gültige(r) Spieler.`;
}

function buildBulkImportPlayers(rows, mappings) {
  const players = [];

  rows.forEach((row) => {
    const player = { name: "", lastname: "", id: "", note: "" };

    row.forEach((cell, index) => {
      const mapping = mappings[index];
      if (!mapping || mapping === "ignore") return;
      if (mapping === "name") player.name = cell;
      if (mapping === "lastname") player.lastname = cell;
      if (mapping === "id") player.id = cell;
      if (mapping === "note") player.note = cell;
    });

    players.push(player);
  });

  return players;
}

function confirmBulkPlayerImport() {
  const textarea = document.getElementById("bulk-import-textarea");
  if (!textarea) return;

  const allRows = parseBulkImportRows(textarea.value);
  const skipHeader = getBulkImportSkipHeader();
  const rows = skipHeader && allRows.length > 1 ? allRows.slice(1) : allRows;
  const mappings = getBulkImportColumnMappings();
  const players = buildBulkImportPlayers(rows, mappings);

  // Filter out rows with no usable name data
  const validPlayers = players.filter((p) => p.name || p.lastname);

  if (validPlayers.length === 0) {
    showAlert(
      "Keine gültigen Spieler gefunden. Bitte prüfe das Format und die Spaltenzuordnung.",
      "Hinweis",
    );
    return;
  }

  commitState();

  let addedCount = 0;
  let skippedCount = 0;
  const seenSignatures = new Set();

  // Build signatures for existing players using the tuple (firstname, lastname, externalId)
  const existingSignatures = new Set(
    state.singles.players.map((p) =>
      buildPlayerSignature(p.firstname || p.name, p.lastname, p.externalId),
    ),
  );

  validPlayers.forEach((player, index) => {
    const firstname = String(player.name || "").trim();
    const lastname = String(player.lastname || "").trim();
    const externalId = String(player.id || "").trim();

    const fullName = [firstname, lastname]
      .filter((part) => part)
      .join(" ")
      .trim();

    if (!fullName) {
      skippedCount++;
      return;
    }

    const signature = buildPlayerSignature(firstname, lastname, externalId);

    // Skip duplicates within the pasted data
    if (seenSignatures.has(signature)) {
      skippedCount++;
      return;
    }
    seenSignatures.add(signature);

    // Skip if a player with the same tuple already exists
    if (existingSignatures.has(signature)) {
      skippedCount++;
      return;
    }

    const id = "P" + Date.now().toString().slice(-4) + String(index).padStart(3, "0");

    const newPlayer = new Player(fullName, id);
    newPlayer.firstname = firstname;
    newPlayer.lastname = lastname;
    newPlayer.externalId = externalId;
    newPlayer.note = String(player.note || "").trim();

    state.singles.players.push(newPlayer);
    addedCount++;
  });

  saveState();
  renderSetupSingles();
  closeBulkPlayerImportModal();

  if (addedCount > 0) {
    showToast(
      `${addedCount} Spieler importiert${
        skippedCount > 0 ? `, ${skippedCount} übersprungen` : ""
      }.`,
      "success",
    );
  } else {
    showAlert(
      "Keine neuen Spieler hinzugefügt. Möglicherweise existieren sie bereits.",
      "Hinweis",
    );
  }
}

function confirmPairingSwap() {
  const slotA = document.getElementById("swap-slot-a");
  const slotB = document.getElementById("swap-slot-b");
  if (!slotA || !slotB) return;

  const valA = slotA.value;
  const valB = slotB.value;
  if (!valA || !valB || valA === valB) {
    showAlert("Bitte zwei unterschiedliche Slots wählen.", "Hinweis");
    return;
  }

  const [idxA, sideA] = valA.split(":");
  const [idxB, sideB] = valB.split(":");
  const round = state.rounds[state.currentRound - 1];
  const matchA = round.matches[parseInt(idxA, 10)];
  const matchB = round.matches[parseInt(idxB, 10)];
  if (!matchA || !matchB) return;

  commitState();

  const keyA = sideA === "teamA" ? "teamA" : "teamB";
  const keyB = sideB === "teamA" ? "teamA" : "teamB";

  const tmp = matchA[keyA];
  matchA[keyA] = matchB[keyB];
  matchB[keyB] = tmp;

  [matchA, matchB].forEach((m) => {
    if (!m.isBye) {
      m.results = new Array(state.config.boardsPerMatch).fill(null);
    }
  });

  rebuildTeamHistoryFromRounds();
  saveState();
  closePairingSwapModal();
  renderAll();
  showSection("pairings");
  showToast("Paarungen aktualisiert.", "success");
}
