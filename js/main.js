// --- INITIALIZATION ---

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
      if (e.target.dataset.target) {
          showSection(e.target.dataset.target);
      }
  });
});

setupImportListener();

// App Start
loadState();
initTheme();

try {
  const storedMode = sessionStorage.getItem("last_mode");
  const storedTheme = sessionStorage.getItem("last_theme");
  if (!localStorage.getItem("swiss_manager_data") && storedMode) {
    state.mode = storedMode;
  }
  if (!localStorage.getItem("swiss_manager_data") && storedTheme) {
    state.theme = storedTheme;
  }
} catch (e) {
  console.warn(e);
}

const nameInput = document.getElementById("tournament-name");
const roundsInput = document.getElementById("total-rounds");
const boardsInput = document.getElementById("boards-count");
const winInput = document.getElementById("points-win");
const drawInput = document.getElementById("points-draw");
const presetSelect = document.getElementById("rules-preset");

if (nameInput) nameInput.value = state.config.name;
if (roundsInput) roundsInput.value = state.config.totalRounds;
if (boardsInput) boardsInput.value = state.config.boardsPerMatch;
if (winInput) winInput.value = state.config.pointsMatchWin;
if (drawInput) drawInput.value = state.config.pointsMatchDraw;
if (presetSelect) presetSelect.value = state.config.rulesPreset || "CUSTOM";

const pairingSelect = document.getElementById("pairing-system");
if (pairingSelect) {
    pairingSelect.value = state.config.type || "SWISS";
}

const modeRadios = document.querySelectorAll('input[name="tournament-mode"], input[name="tournament-mode-singles"]');
modeRadios.forEach((radio) => {
  const isChecked = (state.mode || "TEAM") === radio.value;
  radio.checked = isChecked;
  if(isChecked) radio.parentElement.classList.add('active');
  else radio.parentElement.classList.remove('active');
  
  radio.addEventListener("change", (e) => {
    const newMode = e.target.value;
    state.mode = newMode;

    // Sync all radios
    modeRadios.forEach((r) => {
      r.checked = r.value === newMode;
      if (r.value === newMode) r.parentElement.classList.add('active');
      else r.parentElement.classList.remove('active');
    });

    saveState();
    updateNavigation();
    renderAll();

    // Switch to the appropriate setup view
    showSection("setup");
  });
});

const singlesNameInput = document.getElementById("tournament-name-singles");
const singlesRoundsInput = document.getElementById("total-rounds-singles");
const singlesWinInput = document.getElementById("points-win-singles");
const singlesDrawInput = document.getElementById("points-draw-singles");
if (singlesNameInput) singlesNameInput.value = state.singles.config.name;
if (singlesRoundsInput)
  singlesRoundsInput.value = state.singles.config.totalRounds;
if (singlesWinInput) singlesWinInput.value = state.singles.config.pointsWin;
if (singlesDrawInput) singlesDrawInput.value = state.singles.config.pointsDraw;

const singlesPairingSelect = document.getElementById("pairing-system-singles");
if (singlesPairingSelect) {
    singlesPairingSelect.value = state.singles.config.type || "SWISS";
}
const singlesPresetSelect = document.getElementById("rules-preset-singles");
if (singlesPresetSelect) {
  singlesPresetSelect.value = state.singles.config.rulesPreset || "CUSTOM";
}

// Sync team display-field toggles
const displayTeamId = document.getElementById("display-team-id");
const displayTeamNote = document.getElementById("display-team-note");
const teamDisplayFields = {
  ...getDefaultTeamDisplayFields(),
  ...state.config.displayFields,
};
if (displayTeamId) displayTeamId.checked = teamDisplayFields.id === true;
if (displayTeamNote) displayTeamNote.checked = teamDisplayFields.note !== false;

// Sync singles display-field toggles
const displayFirstname = document.getElementById("display-firstname");
const displayLastname = document.getElementById("display-lastname");
const displayExternalId = document.getElementById("display-external-id");
const displayNote = document.getElementById("display-note");
const displayFields = {
  ...getDefaultSinglesDisplayFields(),
  ...state.singles.config.displayFields,
};
if (displayFirstname) displayFirstname.checked = displayFields.firstname !== false;
if (displayLastname) displayLastname.checked = displayFields.lastname !== false;
if (displayExternalId) displayExternalId.checked = displayFields.externalId !== false;
if (displayNote) displayNote.checked = displayFields.note !== false;

setupPresetListeners();

if (state.mode === "SINGLES") {
  if (state.singles.status !== "SETUP") {
    updateNavigation();
    if (state.singles.rounds.length > 0) {
      renderAll();
    } else {
      renderSetupSingles();
    }
  } else {
    updateNavigation();
    renderSetupSingles();
  }
  showSection("setup");
} else {
  if (state.status !== "SETUP") {
    lockSetup();
    updateNavigation();

    if (state.rounds.length > 0) {
      renderAll();
    } else {
      renderSetup();
    }
  }

  if (state.status === "SETUP") {
    updateNavigation();
    renderSetup();
    showSection("setup");
  } else {
    showSection("setup"); // Or 'pairings'
  }
}
