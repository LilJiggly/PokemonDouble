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

## Cloud save and leaderboards (optional)

Off by default: progress is saved in the browser. To keep it across devices with a Google login and to get leaderboards, set up Firebase once:

1. Go to https://console.firebase.google.com, **Add project** (Analytics is not needed).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable**, pick a support email, save.
3. **Build → Firestore Database → Create database** (production mode, any region close to your players).
4. In Firestore open the **Rules** tab, paste the contents of `firestore.rules` and **Publish**.
5. **Project settings (gear) → Your apps → Web (`</>`)**, register an app (no Hosting needed) and copy the `firebaseConfig` values.
6. Paste them into `js/firebase-config.js`.
7. **Authentication → Settings → Authorized domains**: add the domain the game is served from (`localhost` is there already).

The title screen then shows "Sign in with Google" and a Leaderboards button. Leaderboard numbers are sent by the player's browser, so the rules only limit them to sane values; a determined player could still fake them.

## Credits

Pokémon & item sprites and data: [PokeAPI](https://pokeapi.co). Trainer sprites: Pokémon Showdown and its sprite artists. Player back sprites: Bulbagarden Archives. Fonts: Nunito and VT323 (Google Fonts).
