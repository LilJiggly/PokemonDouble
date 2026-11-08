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

## Coming soon (noted November 8, 2026)

| Idea | Kind | Tracking | Notes |
|---|---|---|---|
| **Trainers from special modes:** unlock existing locked trainers by winning a mode or an evil path, for example Silver for winning the Gen 2 evil path | Unlock | ✅ | The clauses already exist: `Mode win: hard` (also `moves`, `levels`, `rainbow`, `gyms`, `mono`, `noitems`, `fixed`, `mixed`), `Evil win gen 2` and `Evil wins: 3`. It only needs a choice of which trainer gets which clause, in the §3j table. Silver would move off `Friendship: 5`, or get it as a second way (`Friendship: 5 or Evil win gen 2`). |
| **New trainers for the evil teams and final paths:** extra trainers (for example Team leaders) unlocked by `Evil win` and `Mode win: mixed` | Unlock | 🟡 | Needs picks and sprites first (the back sprites are not downloaded yet). |

### Proposal: trainers for modes, evil paths and final paths (to fine tune later)

Not applied yet. Each row adds a second way in (`A or B`) so nobody loses the old way. Everything here is already tracked, it is only a change to the Unlock cell in §3j.

| Trainer | Now | Proposed | Why |
|---|---|---|---|
| Silver (HGSS) | Friendship: 5 | Friendship: 5 or Evil win gen 2 | The Gen 2 evil path is Team Rocket, Silver's story |
| Cheren (B2/W2) | Clean win Gen 5 | Clean win Gen 5 or Evil win gen 5 | Team Plasma is Unova's story |
| Barry (Platinum) | Fast win: 60 | Fast win: 60 or Evil win gen 4 | Galactic is Sinnoh's story |
| Lance (HGSS) | Full team: dragon | Full team: dragon or Evil win gen 3 | The Hoenn path ends with Zinnia's dragons |
| Kris (Crystal) | Clean win | Clean win or Mode win: hard | Rewards a hard win with her save |
| Hugh (B2/W2) | Quick wins: 5 | Quick wins: 5 or Mode win: rainbow | Rainbow gyms in any order, a speedy kind of run |
| Steven (Emerald) | Full team: steel | Full team: steel or Mode win: noitems | A trainer who gives you a Hard Stone and Metal Coat, so a run without items is his proof |
| Red (Battle Frontier) | Win all gens | Win all gens or Mode win: gauntlet | The Battle Frontier Red for the longest run |

Open for later: new trainers (Team leaders, the Hoenn and Sinnoh bosses) for `Mode win: mixed` and `Evil wins: 3`, once there are sprites for them.

## How to add one

1. Add the clause to the `CLAUSES` list in `js/game/unlocks.js` (what to write in the table, what it counts, its text).
2. If it needs a new counter, add it in `js/game/progress.js` (`noteBattleWon` after a win, `noteRunEnd` at the end of a run).
3. Put the clause in the **Unlock** cell of a trainer in the §3j table of DESIGN.md and add a test in `tools/test-run.mjs`.
