# SwissMaster

SwissMaster is a browser-based tournament manager for chess events with support for:

- Team tournaments
- Singles tournaments
- Swiss system pairings
- Round-robin pairings
- Live standings, tiebreaks, and exports

---

## Live Demo

Try it in your browser (It might show as a security risk, but there is no harmfull code:  [**Open SwissMaster Demo**](https://soham-rath.github.io/SwissMaster/)

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/soham-rath/SwissMaster.git
```

2. Unzip the zipped folder

3. Open index.html in your browser.

4. Explore the full functionality!

---

## Development

No build step is required.

Run from a local static server if you prefer:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

---

## Testing

Tests are plain Node.js scripts in `tests/`.

Run all tests:

```bash
for f in tests/test_*.js; do node "$f"; done
```

---

## Project Structure

```text
.
|-- index.html
|-- style.css
|-- js/
|   |-- main.js                 # app initialization and startup wiring
|   |-- config.js               # constants and rules presets
|   |-- models.js               # Team/Match/Player model classes
|   |-- export.js               # CSV/JSON export + import trigger
|   |-- logic/
|   |   |-- pairings.js         # Swiss + round-robin pairing engines
|   |   `-- standings.js        # scoring and tiebreak calculations
|   |-- state/
|   |   |-- core.js             # root app state
|   |   |-- normalize.js        # state shape normalization
|   |   |-- storage.js          # localStorage persistence + slots
|   |   `-- history.js          # undo/redo state history
|   `-- ui/
|       |-- core.js             # rendering and navigation helpers
|       |-- interactions.js     # modals, toasts, UI interactions
|       `-- actions.js          # tournament actions and mutations
`-- tests/
    `-- test_*.js               # coverage across logic/state/ui
```

---

## Contributing
Contributions are welcome! You can help by:

1. Adding new spreadsheet features (formulas, formatting, copy-paste, etc.)

2. Improving performance & UI

3. Writing documentation or tutorials

Opening issues or pull requests for bug fixes and ideas
