# Trainer unlock and challenge ideas

A sheet to pick from. **Tracking** says how much work an idea needs:

- ✅ already tracked: only a new row or clause in the §3j table
- 🟡 small addition: one counter in `js/game/progress.js` and a clause in `js/game/unlocks.js`
- 🔴 bigger: needs something the game does not record yet

Each idea can be a trainer unlock (a clause in the DESIGN.md §3j table) or a challenge shown to the player. "Run" means one run.

## Your ideas

| Idea | Kind | Tracking | Notes |
|---|---|---|---|
| **Starter team win:** win a run with a team of six Pokémon from starter lines (any of the 15 starters, any stage) | Unlock | 🟡 | `STARTER_LINES` already exists. Count team members whose line root is a starter at the Hall of Fame. |
| **Starter evolutions:** reach the final stage (stage 3) of every starter at least once, over any number of runs | Unlock | 🟡 | A list of the 15 final forms (Venusaur, Charizard, Blastoise, Meganium, Typhlosion, Feraligatr, Sceptile, Blaziken, Swampert, Torterra, Infernape, Empoleon, Serperior, Emboar, Samurott) saved in the meta save, like `meta.species`. Could be split per region. |
| **Starter team:** have six starter-line Pokémon on your team at once, at any stage (any battle) | Unlock | 🟡 | Same counter as the first idea, checked after every won battle instead of at the end. The "win" version is the harder one. |
| **Single Gen run:** win a run using Pokémon from one generation only (every Pokémon you ever recruited, fallen ones too) | Unlock / Challenge | ✅ | `run.seenSpecies` already holds every species of the run: check that they all share one `gen`. |

## More ideas

| Idea | Kind | Tracking | Notes |
|---|---|---|---|
| **No repeats:** win a run with six different types across the team | Unlock | ✅ | Already exists as `Diverse win`. |
| **Little Cup:** win a run with a team of only unevolved Pokémon (first stage) | Unlock | 🟡 | Check `dex.evolvesFrom` for each team member at the Hall of Fame. |
| **Fully evolved:** win with six fully evolved Pokémon (final stage) | Unlock | 🟡 | Same check the other way round (`evolvesTo` empty). |
| **Shiny win:** win a run with a shiny Pokémon on the team | Unlock | 🟡 | `mon.shiny` is saved; add a win counter. |
| **Hidden abilities:** win with three or more Pokémon that have their Hidden ability | Unlock | 🟡 | `abilitySlot === "H"` is saved on recruits. |
| **Legend in the team:** win a run with a Legendary or Mythical Pokémon | Unlock | 🟡 | `isLegendary / isMythical` exist in the data. |
| **No shop:** win a run without buying anything | Challenge | 🟡 | Count purchases in `run.stats`. |
| **No healing items:** win without using Potions or other bag items | Challenge | 🟡 | `side.usedItems` is known at the end of every battle. |
| **No rerolls:** win without using a reroll | Challenge | 🟡 | Count rerolls in `run.stats`. |
| **Solo hero:** win a battle where only one Pokémon of yours fought | Unlock | 🔴 | Needs a record of who took part. |
| **Gym in two:** win a gym battle in 2 turns or fewer | Unlock | ✅ | Like `Quick wins`, with a different limit. |
| **Marathon:** reach battle 14 with every Pokémon you started with | Unlock | ✅ | `Clean win` covers most of it. |
| **Stone master:** evolve five Pokémon with stones in one run | Unlock | 🟡 | Count evolutions in `Run.evolve`. |
| **Rich trainer:** finish a run with ₽5,000 or more unspent | Unlock | ✅ | `run.money` is known at the end. |
| **Full set:** own a complete set of 8 badges of one generation | Unlock | ✅ | `meta.badges` is saved. |
| **Type collector:** win a run with each of the 17 types, over many runs | Unlock | ✅ | `meta.typeWins` already counts per type. |
| **Region expert:** recruit every Pokémon of one generation | Unlock | ✅ | `meta.species` lists everything you recruited. |
| **Speed run:** win a run in 45 minutes of play time | Unlock | ✅ | Like `Fast win`, with a lower limit. |
| **Weather team:** win with three Pokémon that set or use the same weather | Unlock | 🔴 | Needs ability and move categories counted per run. |
| **Weakness hunter:** win a battle after every Pokémon hit a super-effective move | Challenge | 🔴 | Needs per-battle hit tracking. |

## How to add one

1. Add the clause to the `CLAUSES` list in `js/game/unlocks.js` (what to write in the table, what it counts, its text).
2. If it needs a new counter, add it in `js/game/progress.js` (`noteBattleWon` after a win, `noteRunEnd` at the end of a run).
3. Put the clause in the **Unlock** cell of a trainer in the §3j table of DESIGN.md and add a test in `tools/test-run.mjs`.
