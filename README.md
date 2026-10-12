# Pokémon Double

A browser roguelike: a Colosseum-style **doubles** gauntlet through a region's 8 gyms, the Elite Four, the Champion and your Rival. Draft your starters, recruit after every win, and lose a Pokémon for good when it faints.

Fan project, not for sale. Pokémon © Nintendo / Creatures / Game Freak / The Pokémon Company.

## Play

The game is plain HTML, CSS and JavaScript (no build step). It must be served by a local web server, not opened as a file:

- VS Code: open `index.html` with **Live Server**, or
- Terminal: `python3 -m http.server 8123` in this folder, then open http://localhost:8123

Works on desktop and phones.

## Project

- `DESIGN.md`: the design document. Its tables (progression, odds, team pools, prices…) are read by the game, so editing them changes the balance.
- `js/engine/`: battle engine (Gen 4 rules, doubles).
- `js/game/`: run logic (recruits, items, shop, team pools).
- `js/ui/`: screens. `css/styles.css`: all styles.
- `js/version.js`: the version number shown on the title screen.
- `tools/`: data builders, tests and simulations (Node 18+), e.g. `node tools/test-engine.mjs`.

## Credits

Pokémon & item sprites and data: [PokeAPI](https://pokeapi.co). Trainer sprites: Pokémon Showdown and its sprite artists. Player back sprites: Bulbagarden Archives. Fonts: Pixelify Sans and VT323 (Google Fonts).
