const assert = require("assert");
const {
  loadFile,
  createMockDocument,
  createStorage,
} = require("./lib/helpers");

global.window = {};
global.document = createMockDocument();
const local = createStorage();
global.localStorage = local.api;

let reloadCount = 0;
global.location = {
  reload: () => {
    reloadCount += 1;
  },
};

loadFile("js/config.js");
loadFile("js/models.js");
loadFile("js/state/core.js");
loadFile("js/state/normalize.js");
loadFile("js/state/storage.js");

console.log("=== STORAGE TESTS START ===");

// Fresh load path
loadState();
assert(state.id, "Expected loadState to create a tournament id");
let meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert(meta, "Expected meta to be persisted");
assert.strictEqual(meta.activeId, state.id);
assert.strictEqual(meta.tournaments.length, 1);

const firstId = state.id;
state.config.name = "Tournament A";
saveState();

// switchTournament missing-data branch
assert.strictEqual(switchTournament("does_not_exist", false), false);

// Create second tournament and verify save metadata
createNewTournament(false);
const secondId = state.id;
state.config.name = "Tournament B";
saveState();
meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert(meta.tournaments.some((t) => t.id === firstId));
assert(meta.tournaments.some((t) => t.id === secondId));
assert.strictEqual(meta.activeId, secondId);

// Inactive delete branch
assert.strictEqual(deleteTournament(firstId), true);
meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert(!meta.tournaments.some((t) => t.id === firstId));
assert(meta.tournaments.some((t) => t.id === secondId));

// Active delete branch with remaining tournament
createNewTournament(false);
const thirdId = state.id;
state.config.name = "Tournament C";
saveState();
reloadCount = 0;
assert.strictEqual(deleteTournament(thirdId), true);
meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert.strictEqual(meta.activeId, secondId);
assert(!meta.tournaments.some((t) => t.id === thirdId));
assert(reloadCount > 0, "Expected reload after deleting active tournament");

// Active delete with last tournament branch
switchTournament(secondId, false);
reloadCount = 0;
assert.strictEqual(deleteTournament(secondId), true);
assert(reloadCount > 0, "Expected reload after recreating tournament");
meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert(meta && meta.activeId, "Expected new tournament to be recreated");
assert(meta.tournaments.length >= 1);

// getTournamentList malformed JSON guard
localStorage.setItem("swiss_manager_meta", "{bad json");
assert.deepStrictEqual(getTournamentList(), []);

// Migration path from legacy key
localStorage.clear();
const legacyState = {
  config: { name: "Legacy Cup" },
  teams: [],
  rounds: [],
};
localStorage.setItem("swiss_manager_data", JSON.stringify(legacyState));
loadState();
meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
assert(meta);
assert.strictEqual(meta.tournaments.length, 1);
assert.strictEqual(meta.tournaments[0].name, "Legacy Cup");
assert.strictEqual(localStorage.getItem("swiss_manager_data"), null);

// switchTournament parse failure branch
const badId = "tour_bad";
localStorage.setItem("swiss_manager_data_tour_bad", "{not json");
assert.strictEqual(switchTournament(badId, false), false);

// saveState mode/name branch for SINGLES
state.mode = "SINGLES";
state.singles.config.name = "Singles Final";
saveState();
meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
const entry = meta.tournaments.find((t) => t.id === state.id);
assert(entry);
assert.strictEqual(entry.mode, "SINGLES");
assert.strictEqual(entry.name, "Singles Final");

console.log("=== STORAGE TESTS END ===");
