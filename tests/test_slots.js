// Mock Storage
const storage = {};
global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => storage[k] = v,
    removeItem: (k) => delete storage[k]
};
global.location = { reload: () => console.log("Reload called") };
global.window = {}; // UI functions check window/document
global.document = { querySelector: () => null, getElementById: () => null }; // minimalistic mock

// Load Code
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const PROJECT_ROOT = path.join(__dirname, '..');

function loadFile(relPath) {
    const code = fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
    vm.runInThisContext(code);
}

loadFile('js/config.js');
loadFile('js/models.js');
// Mock state variable init normally found in state.js
global.state = {}; 
loadFile('js/state/core.js');
loadFile('js/state/normalize.js');
loadFile('js/state/storage.js');
loadFile('js/state/history.js');

// Helper
function logMeta() {
    const meta = JSON.parse(localStorage.getItem("swiss_manager_meta"));
    if(!meta) {
        console.log("Meta: NULL");
        return;
    }
    console.log(`Active: ${meta.activeId}`);
    console.log("Tournaments:");
    meta.tournaments.forEach(t => console.log(` - ${t.id}: ${t.name}`));
}

console.log("=== TEST START ===");

// 1. Initial Load (Should create first tournament)
console.log("\n1. Initial Load");
loadState();
logMeta();
const id1 = state.id;
state.config.name = "Tournament A";
saveState(); 

// 2. Create New
console.log("\n2. Create New Tournament");
createNewTournament(false); // No reload
state.config.name = "Tournament B";
saveState();
const id2 = state.id;
logMeta();

if(id1 === id2) console.error("FAIL: IDs should be different");

// 3. Switch back to A
console.log("\n3. Switch to A");
switchTournament(id1, false);
console.log(`Current Name: ${state.config.name}`);
if(state.config.name !== "Tournament A") console.error("FAIL: Should be Tournament A");

// 4. Delete B
console.log("\n4. Delete B");
// Switch to B first to test auto-switch on delete? 
// Or delete inactive? Let's delete inactive B while on A.
deleteTournament(id2);
logMeta();
const list = getTournamentList();
if(list.find(t => t.id === id2)) console.error("FAIL: B should be gone");

console.log("=== TEST END ===");
