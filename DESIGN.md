# Pokémon Double — Game Design

A browser-based, Colosseum-style **doubles gauntlet** with permadeath. Pick a generation, draft a team, and fight your way through custom-built gym leaders, the Elite Four, the Champion and a Final Rival.

_Last updated: October 09, 2026_

---

## 1. Core Loop

1. **Setup:** choose a **Challenge Gen** (which leaders you fight) and a **Pokémon Pool** (which Pokémon can appear).
2. **Starter draft:** 6 random Pokémon are offered → pick **2**.
3. **Battle** the next opponent in the gauntlet (doubles).
4. **Win:** team fully heals → **recruit** and **item** offers → team auto-levels to the next opponent → next battle.
5. **Lose:** the run ends and you start over.
6. Beat the **Final Rival** → run complete → team enters the **Hall of Fame**.

## 2. Decided Rules

### Battle format
- **Doubles** (2v2 active). A **Singles mode** may be added later.
- You bring **every Pokémon on your team** into each battle. 2 lead, the rest wait in the back.
- Standard Pokémon battle look: sprites, HP bars, text box, move menu.
- **No battle gimmicks** (no Mega Evolution, Z-Moves, Dynamax or Terastal).

### Battle mechanics
- **Gen 4 (Platinum) rules** for moves, abilities, items and the type chart.
- **Exception: Hidden Abilities** from Gen 5 (or a later gen where a Pokémon only got one later) are added. These abilities work the way they did in the gen they were introduced.
- **Exception: Gen 5 versions everywhere** for abilities that changed in Gen 5:
  - **Sturdy:** blocks one-hit KO moves **and** survives any hit from full HP with 1 HP left.
  - **Lightningrod:** pulls in Electric moves, is **immune** to them and gets **+1 Sp. Atk** when hit by one.
  - **Storm Drain:** pulls in Water moves, is **immune** to them and gets **+1 Sp. Atk** when hit by one.
- **Physical/Special split** per move (Gen 4 already has it).
- **No Fairy type** (it doesn't exist in Gen 1–4).
- **Doubles features:** targeting, spread moves at 75% damage, speed order, Protect, Follow Me, Helping Hand, Fake Out.

### Opponent AI
| Opponent | Behavior |
|---|---|
| Gym Leaders | Pick good damaging moves |
| Elite Four, Champion, Final Rival | Also consider type matchups, switching and setup moves |

### Permadeath and losing
- A Pokémon that faints is **gone forever**.
- If you lose a battle, the **run ends** and you start over.

### Team
- **Max team size: 6.**
- The team **fully heals between every battle**, Elite Four battles included.
- **Team order** can be changed freely between battles. The **first 2** in the order are your leads.
- **No team preview:** you don't see the opponent's team (or which set they picked) before battle.
- **Genders:** every Pokémon has a gender based on its species' official ratio. Gender matters for Attract, Rivalry, Cute Charm and gender-based evolutions.
- **Shiny:** 1 in 512 chance per recruit. Cosmetic only.

### Recruiting
- After every win (except the Final Rival) you get a recruit offer. Options, picks, odds and levels are in **§3**.
- Offers are **always random**, but **power-scaled** by rarity tier and level.
- Offers **never include Pokémon already on your team**, and never show duplicates.
- Recruiting continues **during the Elite Four** (may change later).
- **Free reroll:** once per recruit screen (the starter draft too), all cards you haven't picked yet are replaced by new ones.
- **Team at cap (6):** for each pick you can either **replace** a team member or **skip** it. With a "pick 2" offer you can replace 2, replace 1 and skip 1, or skip both. Replaced Pokémon are released.

### Recruit stats
- **Ability:** random. **Normal abilities 90%** (split evenly), **Hidden Ability 10%** _(editable)_. Can be changed later with an Ability Patch or Hidden Ability Patch (see Items).
- **Nature:** random.
- **IVs:** perfect (31 in every stat).
- **EVs:** none.
- **Moves:** the last 4 level-up moves the species learns at its level.

### Leveling and moves
- Before each battle, the whole team **auto-levels to the next opponent's level + the Level bonus** in §3a (early gyms only, to soften the start).
- When a level-up offers a new move, you **choose which move to replace** (or skip it).
- **Free Move Relearner** between battles. TMs may be added later as an item.

### Evolution
- **Player-triggered:** an **Evolve** button appears once a Pokémon qualifies. You choose when (or whether).
- Every evolution also needs the Pokémon to be at or above its **earliest level in §3c**.

| Method | How it works in this game |
|---|---|
| Level-up | Evolve once the evolution level is reached |
| Evolution stone | Use the stone on the Pokémon. Stones are **multi-use** (not consumed). |
| Trade | Use a **Link Cable** on the Pokémon. Multi-use. |
| Trade + held item (e.g. Onix → Steelix) | Use a Link Cable while the Pokémon **holds** the required item (e.g. Metal Coat). The item is **not consumed**, so it keeps its battle effect and can evolve more Pokémon. |
| Friendship | **No friendship needed.** Evolve once the §3c level is reached |
| Location (Magneton → Magnezone, Nosepass → Probopass) | Evolve button at the §3c "Other" level (30) |
| Location (Eevee → Leafeon / Glaceon) | **Leaf Stone** → Leafeon, **Ice Stone** → Glaceon |
| Time of day (Espeon / Umbreon, Riolu, Budew, Chingling) | **Time ignored.** Evolve at the §3c level |
| Held item + time (Sneasel: Razor Claw, Gligar: Razor Fang, Happiny: Oval Stone) | **Hold the item**, time ignored. Item **not consumed** |
| Knows a move (Aipom, Bonsly, Mime Jr., Lickitung, Tangela, Yanma, Piloswine) | **Move not needed.** Evolve at level 30 |
| Beauty (Feebas → Milotic) | Evolve at level 30 |
| Needs a team member (Mantyke + Remoraid) | **Not needed.** Evolve at level 30 |
| Shedinja | When Nincada evolves into Ninjask, you also get a **free Shedinja** if you have a free team slot |
| Stat-based (Tyrogue) | **Player chooses** Hitmonlee / Hitmonchan / Hitmontop at level 20 |
| Random (Wurmple) | **Player chooses** Silcoon or Cascoon |
| Gender (Kirlia → Gallade, Snorunt → Froslass, Burmy, Combee) | **Follows the Pokémon's gender** |

- **Branching evolutions:** when more than one evolution is possible (Eevee, Gloom, Poliwhirl, Slowpoke, Kirlia, Clamperl, Tyrogue, Wurmple…), the Evolve button lets the player **choose**.

### Items
- **Held items** (1 per Pokémon) and a **bag**. Full item pool and odds in **§3d–3e**.
- Only items that exist **up to Gen 4** (no Eviolite, Assault Vest, Rocky Helmet, etc.). **Exceptions:** Ice Stone (for Glaceon), **Ability Patch** (switch between a Pokémon's normal abilities) and **Hidden Ability Patch** (switch to its Hidden Ability). Both patches are multi-use.
- **No Revives** of any kind. Permadeath is the core of the game.
- **Consumable held items** (berries, Focus Sash, herbs) are **used up for good** once triggered.
- **Bag items** are **used up for good** once used. They **can be used in battle**, which takes up that Pokémon's turn.
- **Evolution items** (stones, Link Cable, trade items like Metal Coat) are **multi-use**.
- When a Pokémon dies, its **held item goes back to the bag**.
- **Bag size: unlimited** (an upgrade system may come later).
- **Opponents** only use **held items**, never bag items.
- Item offers after a win are shown as **3 cards**; pick 1 (see §3a). No shop and no boosted odds for needed evolution items, for now.

## 3. Run Progression ✏️ _(editable tables)_

> These tables drive the game's balance. Edit the numbers freely; the game will read them from a data file later.
> All values are **starting proposals**, not final.

### 3a. Battles, levels, recruit and item offers

- **Enemy level:** the level of that opponent's team.
- **Level bonus:** your team auto-levels to **enemy level + bonus** before the battle (e.g. Brock Lv 12 + 2 = your team at Lv 14). Recruits join at that level too.
- **Recruit / item offers:** what you get after beating that opponent.
- **Offer level:** recruits join at **your** level for the **next** battle (so the offer after Gym 4 uses level 36).
- **Rarity odds:** each offered Pokémon rolls its tier separately. Each row must total **100%**.
- **Replacement picks:** for every Pokémon that fainted in a battle, the next recruit screen gets **+1 pick and +1 card** (max +2). A full team doesn't need them, so they only help after losses.

| # | Opponent | Enemy level | Level bonus | Enemy team size | Recruit options | Recruit picks | Common | Uncommon | Rare | Epic | Legendary | Item options | Item picks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | _Run start (starter draft)_ | — | — | — | 8 | 3 | 25% | 40% | 30% | 5% | 0% | 4 | 2 |
| 1 | Gym 1 | 12 | +2 | 2 | 3 | 1 | 30% | 40% | 25% | 5% | 0% | 3 | 1 |
| 2 | Gym 2 | 18 | +1 | 2 | 3 | 1 | 30% | 40% | 25% | 5% | 0% | 3 | 1 |
| 3 | Gym 3 | 24 | 0 | 3 | 4 | 1 | 25% | 38% | 30% | 7% | 0% | 3 | 1 |
| 4 | Gym 4 | 30 | 0 | 3 | 4 | 1 | 25% | 38% | 30% | 7% | 0% | 3 | 1 |
| 5 | Gym 5 | 36 | 0 | 4 | 4 | 1 | 20% | 35% | 35% | 10% | 0% | 3 | 1 |
| 6 | Gym 6 | 42 | 0 | 4 | 4 | 1 | 20% | 35% | 35% | 10% | 0% | 3 | 1 |
| 7 | Gym 7 | 47 | 0 | 5 | 4 | 2 | 10% | 25% | 42% | 22% | 1% | 3 | 1 |
| 8 | Gym 8 | 52 | 0 | 5 | 4 | 2 | 10% | 25% | 42% | 22% | 1% | 3 | 1 |
| 9 | Elite Four #1 | 56 | 0 | 6 | 6 | 2 | 0% | 15% | 45% | 37% | 3% | 3 | 1 |
| 10 | Elite Four #2 | 58 | 0 | 6 | 6 | 2 | 0% | 15% | 45% | 37% | 3% | 3 | 1 |
| 11 | Elite Four #3 | 60 | 0 | 6 | 6 | 2 | 0% | 15% | 45% | 37% | 3% | 3 | 1 |
| 12 | Elite Four #4 | 62 | 0 | 6 | 6 | 2 | 0% | 15% | 45% | 37% | 3% | 3 | 1 |
| 13 | Champion | 65 | 0 | 6 | 6 | 2 | 0% | 5% | 40% | 50% | 5% | 3 | 1 |
| 14 | Final Rival | 70 | 0 | 6 | 0 | 0 | — | — | — | — | — | 0 | 0 |

- **Starter draft:** you pick **3** Pokémon, so you have a reserve on the bench.
- **Starter items:** after the draft you pick 2 of 4 item cards (Gym 1–2 item odds), on top of the starting bag in §3f.
- **Starter draft:** 1st-stage Pokémon at your Gym 1 level (enemy level + bonus). Pokémon that don't evolve are allowed only if they're **Common or Uncommon** (e.g. Tauros yes, Lapras no).
- **Final Rival:** no recruit or item offer. The run ends.
- **Enemy team size:** how many Pokémon the opponent brings. Starts at 2 (doubles) and scales up slowly.
- **Teams:** each opponent's team is drawn at random from their **team pool** (see §5 Team pools).
- **Item offers** use the item odds in §3d.
- For now the levels are the same for every Challenge Gen. We can add per-gen level columns later.

### 3b. Rarity tiers

Tiers rate the **whole evolution line by its final form**. Because your team auto-levels and you evolve whenever you like, an early-stage Pokémon offered late is effectively its final form.

| Tier | Final form of the line | Examples (Gen 1) |
|---|---|---|
| Common | Base stat total (BST) under 450 | Rattata, Caterpie, Ekans lines |
| Uncommon | BST 450–499 | Pidgey, Machop, Oddish lines |
| Rare | BST 500–539 | Kanto starters, Abra, Gastly lines |
| Epic | BST 540+, not legendary | Magikarp, Growlithe, Dratini lines, Snorlax |
| Legendary | Legendary / Mythical | Articuno, Zapdos, Moltres, Mewtwo |

**Tier overrides:** BST sets each line's **default** tier. Lines that play stronger or weaker than their BST suggests can be moved by hand. Overrides apply to the **whole line** (recruit odds and level gating for non-evolving Pokémon).

| Line | Final form BST | Default tier | Override tier | Reason |
|---|---|---|---|---|
| Cranidos → Rampardos | 495 | Uncommon | **Rare** | 165 Attack (highest Rock type up to Gen 4) and Mold Breaker |
| Kabuto → Kabutops | 495 | Uncommon | **Rare** | Swift Swim with good Attack and Speed |
| Anorith → Armaldo | 495 | Uncommon | **Rare** | 125 Attack, solid all-round |

### 3c. Level gating (what can appear and evolve at which level)

A Pokémon can only be **offered**, **evolved into** on your team, or **used by an opponent** once the level reaches the level it could legally exist at. Example: **Swampert can never appear before level 36.**

| Evolution method | Earliest level |
|---|---|
| Level-up | The species' evolution level (e.g. Swampert 36) |
| Evolution stone | 30 |
| Trade (Link Cable) | 36 |
| Friendship | 25 |
| Other (move, location, held item, time of day) | 30 |
| Legendary / Mythical | 45 |
| Doesn't evolve, **Rare** tier (e.g. Aerodactyl, Lapras) | 30 |
| Doesn't evolve, **Epic** tier (e.g. Snorlax) | 40 |

- A stage can **never** be earlier than the stage before it. Example: Rhyperior (trade, 36) can't appear before Rhydon (level 42), so its earliest level is 42.

**Species overrides** (exceptions to the rules above):

| Species | Earliest level | Reason |
|---|---|---|
| _example: Dragonite_ | _55_ | _official evolution level_ |

- **Offered stage (default):** a recruit appears at the **highest stage legal** for the offer level. Change this if you'd rather offer earlier stages and let the player evolve them.

### 3d. Item rarity odds

Each offered item rolls its tier separately. Each row must total **100%**.

| After | Common | Uncommon | Rare | Epic |
|---|---|---|---|---|
| Gym 1–2 | 60% | 30% | 10% | 0% |
| Gym 3–4 | 40% | 40% | 17% | 3% |
| Gym 5–6 | 25% | 40% | 28% | 7% |
| Gym 7–8 | 15% | 35% | 37% | 13% |
| Elite Four / Champion | 15% | 35% | 37% | 13% |

### 3e. Item pool

| Tier | Held items | Bag items |
|---|---|---|
| Common | Oran Berry, Sitrus Berry, Cheri / Chesto / Pecha / Rawst / Aspear Berry, type boosters (Charcoal, Mystic Water, Miracle Seed, etc.) | Potion, Super Potion, Antidote, Paralyze Heal, Burn Heal, Awakening, Ice Heal |
| Uncommon | Lum Berry, Muscle Band, Wise Glasses, Scope Lens, Quick Claw, Bright Powder, Shell Bell, Black Sludge, type-resist berries (Occa, Passho, etc.) | Hyper Potion, Full Heal, X Attack / Defense / Sp. Atk / Sp. Def / Speed, Dire Hit, Guard Spec. |
| Rare | Leftovers, Expert Belt, Focus Sash, White Herb, Mental Herb, Power Herb, Light Clay, weather rocks (Damp, Heat, Smooth, Icy), pinch berries (Liechi, Salac, Petaya), Toxic Orb, Flame Orb, trade-evolution items (Metal Coat, King's Rock, Dragon Scale, Up-Grade, etc.), Razor Claw, Razor Fang, Oval Stone | Max Potion, evolution stones (incl. Ice Stone), Link Cable, Ability Patch |
| Epic | Choice Band, Choice Specs, Choice Scarf, Life Orb | Full Restore, Hidden Ability Patch |
| Species-only | Light Ball (Pikachu), Thick Club (Cubone / Marowak), Metal Powder (Ditto), Stick (Farfetch'd), Lucky Punch (Chansey), DeepSeaTooth / DeepSeaScale (Clamperl). **Only offered if a matching Pokémon is on your team.** Rolls as Rare. | — |

**Not included:** Revives (permadeath), Ethers (PP restores after every battle), gimmick items, and overworld-only items (Repel, Escape Rope).

### 3f. Starting bag

Every run starts with these items in the bag.

| Item | Count |
|---|---|
| Potion | 2 |
| Oran Berry | 2 |

### 3g. TM rewards

Every opponent (gyms, Elite Four, Champion, Rival) gives a **reusable TM** when beaten, drawn from the Gen 4 TMs (TM01–TM92) of their **type theme**. Opponents without a theme (Champion Blue, Cynthia, Rivals) give any type. You never get a TM you already have. Teach it in the hub to any team member that can learn it in Gen 4.

| After | Max TM power |
|---|---|
| Gym 1–3 | 60 |
| Gym 4–6 | 85 |
| Gym 7–8 | any |
| Elite Four / Champion / Rival | any |

- Status TMs (no power) and variable-power TMs (Return, Grass Knot, Gyro Ball…) count as power 0 and can always appear.
- If a type has no TM within the limit, its weakest TM is given.
- **Never in the pool:** Flash, Natural Gift, Fling, Snatch, Recycle (they do nothing in this game).

### 3h. Shop & prize money

The **shop** in the hub sells **5 random items** from the item pool (§3e), rolled with the item odds (§3d), and **2 random TMs** you don't own yet (within the TM power limit for the next battle, §3g). The stock refreshes after every battle. **Reroll:** the first reroll after each battle is free, after that each reroll costs the amount below. You can sell items for half their price.

| Tier | Price |
|---|---|
| Common | 300 |
| Uncommon | 800 |
| Rare | 2000 |
| Epic | 5000 |

| Money rule | Amount |
|---|---|
| Starting money | 500 |
| Prize per win | 150 × battle number |
| Flawless bonus (nobody fainted) | 50% |
| TM price (status or power ≤ 60) | 1500 |
| TM price (power 61–85) | 3000 |
| TM price (power 86+) | 5000 |
| Shop reroll (after the free one) | 200 |

### 3i. Trainer upgrades (roguelite progression)

**Trainer Points (TP)** are earned at the end of **every run**, won or lost: per opponent beaten (below) plus a Hall of Fame bonus. They're spent on permanent upgrades on the title screen.

| Earned for | TP |
|---|---|
| Gym Leader | 1 |
| Elite Four member | 2 |
| Champion | 3 |
| Hall of Fame (beating the Final Rival) | 5 |

| ID | Upgrade | Max level | Cost per level | Effect per level |
|---|---|---|---|---|
| scout | Scout | 2 | 4 | +1 card in the starter draft |
| dice | Lucky Dice | 2 | 5 | +1 free reroll per recruit screen |
| allowance | Allowance | 3 | 3 | +500 starting money |
| bag | Bigger Bag | 2 | 3 | Level 1: +2 Super Potions. Level 2: + Sitrus Berry and Full Heal |
| gift | Gift Box | 1 | 6 | +1 pick (and +1 card) in the starting items |
| hidden | Hidden Potential | 1 | 8 | Hidden Ability chance 10% → 20% |
| shiny | Shiny Charm | 1 | 5 | Shiny chance 1/512 → 1/128 (cosmetic) |

## 4. Settings

| Setting | Options | Notes |
|---|---|---|
| Challenge Gen | Gen 1, 2, 3, 4 | Picks the leader roster |
| Pokémon Pool | Any combination of Gen 1, 2, 3, 4 | Separate from Challenge Gen. At least one gen must be selected. |

## 5. Opponent Roster

Every Challenge Gen uses the same structure: **8 Gyms → 4 Elite Four → Champion → Final Rival** (14 battles).

- These are the **official characters**, but **every team is custom-built by the designer**.
- **Team pools (current):** every opponent has a **pool of species**; each battle their team is drawn at random from it (see Team pools below). Team size per opponent is in §3a.
- **Team sets (parked):** handcrafted sets built around a tactic (e.g. burn + Guts, sandstorm). Brock's sets below are kept for reference but not used while pools are active.
- **Strategy notes:** each set can include notes that tell the AI how to play it (e.g. "turn 1: burn your own Larvitar").
- **No ace rule.** Each set stands on its own.
- **No duplicate species** within a set.
- **Leader Pokémon** can be any species from the **National Dex up to Gen 4 (#001–493)**, whatever the Challenge Gen. Teams can follow a theme rather than a strict single type (e.g. Lorelei's Water/Ice).
- Leader Pokémon follow the **level gating in §3c** (no Golem at level 12).
- **No fixed move or item rules** for leaders: the designer picks freely. Gym order follows the base game.
- Pools are **crafted together with the designer**, one leader at a time.
- **Gen 1 type notes:** Brock uses Rock types only. Ground types are reserved for Giovanni.
- Gen 2 uses the **8 Johto gyms only** (Kanto gyms are not included).
- **Build order:** Gen 1 first, so the engine can be tested against real teams.

| Gen | Region | Based on game | Final Rival options |
|---|---|---|---|
| 1 | Kanto | FireRed / LeafGreen | Red, Blue or Green |
| 2 | Johto | HeartGold / SoulSilver | Silver or Gold |
| 3 | Hoenn | Emerald | Brendan or May |
| 4 | Sinnoh | Platinum | Dawn, Lucas or Barry |

- **Based on game** decides the leader lineup and gym order. Moves, learnsets and sprites come from **Gen 4 data** for every Pokémon.

- The Final Rival is **chosen at random** from that gen's options each run.
- Gen 1: Blue is the Champion **and** can be the Final Rival, so a run may face Blue twice (on purpose, for now). Green was added for variety.

### Team pools ✏️ _(editable tables)_

Every trainer has a pool of **every species of their type** (Gen 1–4, Gen 4 typing), **legendaries and Mythicals included** (they still follow §3c gating, so never before Lv 45). No babies. Trainers without a type (Blue, the Final Rivals) use their **signature lines**, every stage included. Each pool is split into **power groups**. The **battle position** decides which groups a team is drawn from, not the trainer. So if the gym order is randomized later, whoever is Gym 1 still gets a Gym 1-strength team.

**Species vs Filler:** each pool table has two columns.
- **Species:** Pokémon of the trainer's type.
- **Filler:** Pokémon of another type that the trainer may still use. These are drawn exactly like Species. Filler is:
  - picks from the original games that thicken thin pools (e.g. Lance's Gyarados, Charizard, Aerodactyl; Agatha's Arbok, Crobat), plus a few extras;
  - earlier stages of type species that aren't the type themselves (Shellder → Cloyster, Swablu → Altaria), so early battles have options;
  - anything you add by hand: put the species name in the Filler cell of the right group.

**How a team is drawn:**
1. Take the species and filler in the groups allowed for that battle (table below), skipping species that aren't legal yet at that level (§3c gating).
2. **Minimum choice:** if that gives fewer than **1.5× the team size** different evolution lines (rounded up), the window widens one group down at a time (never Group 0), then one group up, until there's enough choice. Thin pools (Lance, Agatha, Lorelei…) widen; rich pools don't.
3. Pick evolution lines at random until the team is full (team size from §3a). **One Pokémon per line**, and each line uses its **strongest legal stage** inside the window.
4. Last resort if still short: random Pokémon of the trainer's type.
- **Legendary weight:** 15% — how likely a legendary or Mythical is to be drawn compared with a regular species.
- **Second legendary weight:** 5% — once a team has one, any further legendary is drawn at this weight instead.
- **Max legendaries:** 2 per team.
- Resulting chance at the current spots (at least one / two): Blaine (Gym 7) ~29% / 1%, Giovanni ~6% / 0%, Lorelei ~30% / 1%, Agatha ~12% / 0%, Lance ~58% / 5%.
- Moves: the last 4 level-up moves at that level. Ability and nature: random. No held items.
- A species may be in several pools (Golem is Rock and Ground).

**Power groups** (by the species' own base stat total; Group 0 is hand-picked):

| Group | Base stat total | Examples |
|---|---|---|
| 0 | Dead weight, never drawn | Magikarp, Feebas, Kakuna, Unown, Shedinja |
| 1 | Under 350 | Geodude, Dratini, Ralts |
| 2 | 350–429 | Onix, Graveler, Kabuto |
| 3 | 430–489 | Golem, Rhydon, Lunatone |
| 4 | 490–534 | Omastar, Aerodactyl, Aggron |
| 5 | 535+ | Rhyperior, Tyranitar |

**Groups per battle:**

| # | Battle | Groups |
|---|---|---|
| 1 | Gym 1 | 1–2 |
| 2 | Gym 2 | 1–2 |
| 3 | Gym 3 | 2–3 |
| 4 | Gym 4 | 2–3 |
| 5 | Gym 5 | 3–4 |
| 6 | Gym 6 | 3–4 |
| 7 | Gym 7 | 4–5 |
| 8 | Gym 8 | 4–5 |
| 9 | Elite Four #1 | 4–5 |
| 10 | Elite Four #2 | 4–5 |
| 11 | Elite Four #3 | 4–5 |
| 12 | Elite Four #4 | 4–5 |
| 13 | Champion | 4–5 |
| 14 | Final Rival | 4–5 |

- Move a species to another group by editing its row, or add filler in the Filler column. The game reads these tables directly.
- Group = the species' own base stat total (table above). Put hand-added filler in the group that matches its BST.
- Heading format: `(gen<N>:<trainer id>)` must match the leader file; Final Rivals use `rival-<id>`.
- To rebuild the lists from scratch (e.g. for another gen): `node tools/build-pools.mjs <gen>`.

#### Team pools — Gen 1 (Kanto)

##### Gym Leader Brock · Rock (`gen1:brock`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Geodude, Larvitar, Aron, Rhyhorn | Slugma |
| 2 | Cranidos, Shieldon, Omanyte, Kabuto, Lileep, Anorith, Nosepass, Corsola, Onix, Graveler, Sudowoodo, Magcargo, Pupitar | — |
| 3 | Lairon, Lunatone, Solrock, Golem, Rhydon, Relicanth | — |
| 4 | Omastar, Kabutops, Cradily, Armaldo, Rampardos, Bastiodon, Shuckle, Aerodactyl, Probopass, Aggron | Steelix |
| 5 | Rhyperior, Regirock, Tyranitar | — |

##### Gym Leader Misty · Water (`gen1:misty`)

| Group | Species | Filler |
|---|---|---|
| 0 | Magikarp, Feebas | — |
| 1 | Wooper, Lotad, Marill, Surskit, Wingull, Barboach, Spheal, Horsea, Poliwag, Remoraid, Shellder, Carvanha, Corphish, Mudkip, Squirtle, Totodile, Piplup, Slowpoke, Psyduck, Goldeen, Seel, Krabby, Shellos, Chinchou, Luvdisc, Buizel, Finneon, Tentacool, Staryu, Lombre, Clamperl | Bidoof |
| 2 | Omanyte, Kabuto, Corsola, Poliwhirl, Wailmer, Wartortle, Croconaw, Marshtomp, Prinplup, Azumarill, Sealeo, Bibarel | — |
| 3 | Quagsire, Qwilfish, Pelipper, Seadra, Seaking, Lanturn, Sharpedo, Lumineon, Mantine, Whiscash, Crawdaunt, Dewgong, Kingler, Gastrodon, Octillery, Ludicolo, Phione, Huntail, Gorebyss, Relicanth | — |
| 4 | Slowbro, Slowking, Omastar, Kabutops, Floatzel, Golduck, Poliwrath, Politoed, Wailord, Tentacruel, Starmie, Cloyster, Vaporeon, Blastoise, Feraligatr, Walrein, Empoleon | — |
| 5 | Lapras, Swampert, Gyarados, Kingdra, Milotic, Suicune, Manaphy, Kyogre, Palkia | — |

##### Gym Leader Lt. Surge · Electric (`gen1:lt-surge`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Shinx, Mareep, Electrike, Pikachu, Magnemite, Voltorb, Chinchou | Bronzor |
| 2 | Luxio, Flaaffy, Plusle, Minun, Pachirisu | Porygon |
| 3 | Rotom, Lanturn, Magneton, Raichu, Manectric, Electrode | Skarmory |
| 4 | Electabuzz, Ampharos, Luxray, Jolteon | Bronzong, Porygon2 |
| 5 | Magnezone, Electivire, Zapdos, Raikou | Porygon-Z |

##### Gym Leader Erika · Grass (`gen1:erika`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Caterpie, Wurmple, Metapod, Silcoon, Burmy |
| 1 | Sunkern, Lotad, Seedot, Hoppip, Cherubi, Paras, Shroomish, Bellsprout, Treecko, Bulbasaur, Chikorita, Turtwig, Oddish, Exeggcute, Snover, Cacnea, Skiploom, Lombre, Nuzleaf | — |
| 2 | Lileep, Weepinbell, Gloom, Roselia, Ivysaur, Parasect, Bayleef, Grovyle, Grotle, Wormadam, Sunflora | Butterfree, Beautifly |
| 3 | Tangela, Jumpluff, Cherrim, Carnivine, Breloom, Tropius, Cacturne, Vileplume, Victreebel, Bellossom, Ludicolo, Shiftry | — |
| 4 | Abomasnow, Cradily, Roserade, Exeggutor, Venusaur, Meganium, Torterra, Leafeon, Sceptile | — |
| 5 | Tangrowth, Celebi, Shaymin | — |

##### Gym Leader Koga · Poison (`gen1:koga`)

| Group | Species | Filler |
|---|---|---|
| 0 | Weedle, Kakuna | Wurmple, Cascoon |
| 1 | Zubat, Spinarak, Nidoran♂, Nidoran♀, Ekans, Bellsprout, Croagunk, Gulpin, Venonat, Gastly, Bulbasaur, Oddish, Grimer, Stunky, Skorupi, Tentacool, Koffing | Nincada, Pineco |
| 2 | Nidorina, Nidorino, Beedrill, Dustox, Weepinbell, Ariados, Gloom, Roselia, Ivysaur, Haunter | — |
| 3 | Qwilfish, Arbok, Venomoth, Golbat, Seviper, Swalot, Skuntank, Vileplume, Victreebel | Ninjask, Forretress |
| 4 | Weezing, Toxicroak, Nidoqueen, Nidoking, Muk, Gengar, Drapion, Roserade, Tentacruel, Venusaur | — |
| 5 | Crobat | — |

##### Gym Leader Sabrina · Psychic (`gen1:sabrina`)

| Group | Species | Filler |
|---|---|---|
| 0 | Unown | — |
| 1 | Ralts, Kirlia, Meditite, Baltoy, Beldum, Bronzor, Abra, Slowpoke, Natu, Exeggcute, Drowzee, Spoink | Venonat, Staryu |
| 2 | Kadabra, Wobbuffet, Medicham, Metang, Chimecho | — |
| 3 | Lunatone, Solrock, Jynx, Girafarig, Mr. Mime, Xatu, Grumpig, Hypno | Venomoth |
| 4 | Alakazam, Slowbro, Slowking, Claydol, Bronzong, Gardevoir, Gallade, Exeggutor, Starmie, Espeon | — |
| 5 | Uxie, Mesprit, Azelf, Mew, Celebi, Metagross, Latias, Latios, Jirachi, Deoxys, Cresselia, Mewtwo, Lugia | — |

##### Gym Leader Blaine · Fire (`gen1:blaine`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Slugma, Vulpix, Numel, Charmander, Cyndaquil, Chimchar, Torchic, Houndour | — |
| 2 | Growlithe, Charmeleon, Quilava, Combusken, Monferno, Ponyta, Magcargo | — |
| 3 | Camerupt, Torkoal | — |
| 4 | Magmar, Rapidash, Houndoom, Ninetales, Flareon, Blaziken, Charizard, Typhlosion, Infernape | — |
| 5 | Magmortar, Arcanine, Moltres, Entei, Heatran, Ho-Oh | — |

##### Gym Leader Giovanni · Ground (`gen1:giovanni`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Wooper, Swinub, Diglett, Nincada, Barboach, Trapinch, Sandshrew, Geodude, Larvitar, Baltoy, Gible, Numel, Cubone, Phanpy, Hippopotas, Vibrava, Rhyhorn | Nidoran♂, Nidoran♀, Meowth, Mudkip, Turtwig, Shellos |
| 2 | Onix, Graveler, Dugtrio, Marshtomp, Pupitar, Gabite, Marowak | Nidorina, Nidorino, Grotle |
| 3 | Quagsire, Gligar, Sandslash, Piloswine, Camerupt, Whiscash, Gastrodon, Golem, Rhydon | Persian |
| 4 | Nidoqueen, Nidoking, Donphan, Claydol, Steelix, Gliscor, Flygon, Torterra, Hippowdon, Mamoswine | Kangaskhan |
| 5 | Swampert, Rhyperior, Garchomp, Groudon | — |

##### Elite Four Lorelei · Ice (`gen1:lorelei`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Swinub, Spheal, Snorunt, Delibird, Snover | Shellder, Slowpoke, Seel |
| 2 | Sealeo | — |
| 3 | Sneasel, Piloswine, Jynx, Dewgong, Glalie, Froslass | — |
| 4 | Abomasnow, Weavile, Cloyster, Glaceon, Walrein, Mamoswine | Slowbro, Slowking |
| 5 | Lapras, Articuno, Regice | — |

##### Elite Four Bruno · Fighting (`gen1:bruno`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Makuhita, Meditite, Croagunk, Mankey, Machop | Ralts, Kirlia, Shroomish, Poliwag, Chimchar, Torchic |
| 2 | Machoke, Combusken, Monferno, Medicham | Poliwhirl, Onix |
| 3 | Primeape, Hitmonlee, Hitmonchan, Hitmontop, Breloom, Hariyama | — |
| 4 | Toxicroak, Poliwrath, Heracross, Machamp, Gallade, Lucario, Blaziken, Infernape | Steelix |
| 5 | — | — |

##### Elite Four Agatha · Ghost (`gen1:agatha`)

| Group | Species | Filler |
|---|---|---|
| 0 | Shedinja | — |
| 1 | Shuppet, Duskull, Gastly, Drifloon | Zubat, Nincada, Ekans, Snorunt |
| 2 | Sableye, Haunter | — |
| 3 | Misdreavus, Rotom, Banette, Dusclops, Froslass, Spiritomb | Arbok, Golbat |
| 4 | Mismagius, Drifblim, Gengar, Dusknoir | — |
| 5 | Giratina | Crobat |

##### Elite Four Lance · Dragon (`gen1:lance`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Magikarp |
| 1 | Dratini, Bagon, Gible, Vibrava | Trapinch, Horsea, Charmander, Swablu |
| 2 | Gabite, Dragonair, Shelgon | Charmeleon |
| 3 | — | Seadra |
| 4 | Altaria, Flygon | Aerodactyl, Charizard |
| 5 | Kingdra, Dragonite, Salamence, Latias, Latios, Garchomp, Rayquaza, Dialga, Palkia, Giratina | Gyarados |

##### Champion Blue · signature lines (`gen1:blue`)

| Group | Species | Filler |
|---|---|---|
| 0 | Magikarp | — |
| 1 | Pidgey, Larvitar, Machop, Charmander, Abra, Squirtle, Bulbasaur, Exeggcute, Eevee, Rhyhorn, Pidgeotto | — |
| 2 | Growlithe, Kadabra, Ivysaur, Charmeleon, Wartortle, Machoke, Pupitar | — |
| 3 | Pidgeot, Rhydon | — |
| 4 | Alakazam, Heracross, Machamp, Aerodactyl, Exeggutor, Venusaur, Jolteon, Blastoise, Charizard | — |
| 5 | Rhyperior, Gyarados, Arcanine, Tyranitar | — |

##### Red (Final Rival) · signature lines (`gen1:rival-red`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Pikachu, Dratini, Charmander, Gastly, Squirtle, Bulbasaur, Eevee | — |
| 2 | Ivysaur, Charmeleon, Wartortle, Haunter, Dragonair | — |
| 3 | Raichu | — |
| 4 | Gengar, Aerodactyl, Venusaur, Espeon, Blastoise, Charizard | — |
| 5 | Lapras, Snorlax, Dragonite | — |

##### Blue (Final Rival) · signature lines (`gen1:rival-blue`)

| Group | Species | Filler |
|---|---|---|
| 0 | Magikarp | — |
| 1 | Pidgey, Larvitar, Machop, Charmander, Abra, Squirtle, Bulbasaur, Exeggcute, Eevee, Rhyhorn, Pidgeotto | — |
| 2 | Growlithe, Kadabra, Ivysaur, Charmeleon, Wartortle, Machoke, Pupitar | — |
| 3 | Pidgeot, Rhydon | — |
| 4 | Alakazam, Heracross, Machamp, Aerodactyl, Exeggutor, Venusaur, Jolteon, Blastoise, Charizard | — |
| 5 | Rhyperior, Gyarados, Arcanine, Tyranitar | — |

##### Green (Final Rival) · signature lines (`gen1:rival-green`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Ralts, Jigglypuff, Nidoran♀, Kirlia, Vulpix, Bellsprout, Charmander, Squirtle, Bulbasaur, Clefairy, Eevee, Staryu | — |
| 2 | Nidorina, Weepinbell, Ivysaur, Charmeleon, Wartortle, Wigglytuff | — |
| 3 | Clefable, Victreebel | — |
| 4 | Kangaskhan, Nidoqueen, Ninetales, Gardevoir, Starmie, Venusaur, Vaporeon, Blastoise, Charizard | — |
| 5 | — | — |

### Leader data (planned format)
Each opponent is defined in a data file with: name, title, gen, order, level, badge/sprite, and a list of **team sets**. Each set has a name, strategy notes, and its Pokémon (species, nature, ability, held item, moves).
A browser-based **team builder** may come later. For now teams are written in the data file.

### Team sets

Moves below are checked against Gen 4 (Platinum) learnsets. Leaders may use any move the species can learn in Gen 4 (level-up, TM, tutor or egg).

#### Gen 1 · Gym 1 · Brock (Lv 12, 2 Pokémon)

**Set 1: Burn for Power.** Solrock burns its own partner. Guts boosts Larvitar's Attack by 50% (and cancels the burn's Attack drop), and Facade doubles in power while burned.

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Solrock | Levitate | Modest | Sitrus Berry | Will-O-Wisp, Helping Hand, Rock Throw, Confusion |
| Larvitar | Guts | Adamant | Oran Berry | Facade, Rock Slide, Bite, Protect |

_AI:_ turn 1, Solrock uses Will-O-Wisp on Larvitar. Afterwards, Solrock uses Helping Hand on Larvitar's attacks.

**Set 2: Sandstorm.** In sand, Rock types get +50% Sp. Def and take no sand damage. Sand Force gives Nosepass's Rock moves +30% in sand. Sheer Force gives Cranidos's Headbutt and Rock Slide +30% (no flinch).

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Nosepass | Sand Force (HA) | Impish | Smooth Rock | Sandstorm, Thunder Wave, Rock Tomb, Protect |
| Cranidos | Sheer Force (HA) | Adamant | Hard Stone | Headbutt, Rock Slide, Pursuit, Protect |

_AI:_ turn 1, Nosepass uses Sandstorm. Re-set sand when it ends.

**Set 3: Rain Fossils.** Swift Swim doubles Speed in rain, and rain boosts Water moves. Punishes Fire starters.

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Omanyte | Swift Swim | Modest | Damp Rock | Rain Dance, Water Gun, Bite, Protect |
| Kabuto | Swift Swim | Adamant | Oran Berry | Rock Slide, Absorb, Leer, Protect |

_AI:_ turn 1, Omanyte uses Rain Dance. Re-set rain when it ends.

**Set 4: Classic Onix.** A nod to the original Brock. Onix lowers a target's Defense with Screech, Geodude speeds up with Rock Polish and hits that target.

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Onix | Sturdy | Impish | Sitrus Berry | Screech, Rock Throw, Rock Tomb, Protect |
| Geodude | Rock Head | Adamant | Hard Stone | Rock Polish, Rock Slide, Rollout, Protect |

_AI:_ turn 1, Onix uses Screech and Geodude uses Rock Polish. Then both focus the Screeched target.

**Set 5: Shatter Shields.** Shieldon lowers a target's Sp. Def by 2 stages with Metal Sound, then Lunatone's special attacks hit hard. Taunt blocks the player's setup.

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Shieldon | Sturdy | Impish | Oran Berry | Metal Sound, Taunt, Rock Tomb, Protect |
| Lunatone | Levitate | Modest | Twisted Spoon | Confusion, Hypnosis, Rock Throw, Protect |

_AI:_ Shieldon uses Metal Sound on the target Lunatone attacks. Taunt any player Pokémon using a status or setup move.

**Set 6: Lightning Rod Guard.** Relicanth (Water/Rock) is weak to Electric. Rhyhorn's Lightningrod pulls every Electric move to itself, is immune, and gains +1 Sp. Atk.

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Rhyhorn | Lightningrod | Adamant | Sitrus Berry | Stomp, Rock Slide, Horn Attack, Protect |
| Relicanth | Sturdy (HA) | Adamant | Mystic Water | Water Gun, Rock Tomb, Yawn, Protect |

_AI:_ keep Rhyhorn on the field while Relicanth is out. Relicanth uses Yawn on the biggest threat.

**Set 7: Sun Shield.** Sun halves the power of Water moves and boosts Fire moves. Covers Brock's weakness to Water and punishes Grass. Storm Drain makes Lileep pull Water moves away from Solrock, absorb them and gain +1 Sp. Atk.

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Solrock | Levitate | Modest | Heat Rock | Sunny Day, Fire Spin, Rock Throw, Protect |
| Lileep | Storm Drain (HA) | Modest | Miracle Seed | Giga Drain, Ancient Power, Confuse Ray, Protect |

_AI:_ turn 1, Solrock uses Sunny Day. Re-set sun when it ends. Fire Spin goes on Grass targets.
_Tuning option:_ swap Fire Spin (15 power) for Flamethrower (TM) if this set is too easy.

**Set 8: Speed Boost Duo.** Aron uses Rock Polish to outspeed, then Headbutt can make targets flinch. Lunatone's Helping Hand powers up every hit.

| Pokémon | Ability | Nature | Item | Moves |
|---|---|---|---|---|
| Aron | Rock Head | Adamant | Sitrus Berry | Rock Polish, Headbutt, Rock Slide, Metal Claw |
| Lunatone | Levitate | Bold | Oran Berry | Helping Hand, Hypnosis, Confusion, Protect |

_AI:_ turn 1, Aron uses Rock Polish while Lunatone uses Hypnosis. Afterwards, Lunatone uses Helping Hand on Aron's attacks.

#### Ideas parked for other leaders

- **Sabrina (Gym 6): Trick Room.** Originally drafted for Brock: Lunatone (Trick Room, Helping Hand, Hypnosis, Rock Throw) + Bonsly (Rock Slide, Low Kick, Flail, Protect). Needs reworking to a Psychic theme at level 42.
- **Koga (Gym 5) or Lt. Surge (Gym 3): Boom.** A Pokémon uses Protect while its partner uses Self-Destruct / Explosion. In Gen 4 these moves have 200 / 250 power and halve the target's Defense. Too punishing for Brock at level 12. Fits Koga (Koffing / Weezing) or Surge (Voltorb / Electrode).

## 6. Open Questions / To Detail Later

- [ ] **Tuning:** odds, levels, BST cutoffs and the starter rule in §3, once real data is in.
- [ ] **Elite Four picks:** 8 picks over 4 battles. Keep for now, revisit after playtesting.
- [ ] **Leader teams:** Gen 1 teams to be written by the designer.
- [ ] **Draw rule:** if both sides lose their last Pokémon at the same time (e.g. Explosion), does the run end? The engine currently reports a draw.
- [ ] **Gym 1 difficulty:** in simulations Brock wins 61–95% of AI-vs-AI battles against random first-stage teams with level-up moves only. The real player is smarter than the AI, but Gym 1 may still need tuning (or a stronger starter draft). In full AI-played runs, 34 of 40 died at Brock.

### Later
- [ ] **TMs** as items.
- [ ] **Leader team builder** UI in the browser.
- [ ] **Bag upgrade system.**
- [ ] **Smart item offers:** boosted odds for an evolution item a team member needs (dropped for now).
- [ ] **Music, sound and move animations.**
- [ ] **Singles mode.**
- [ ] **Multi battles:** e.g. 2 trainers with 6 Pokémon each (12 vs 12).

## 7. Technical Notes

- Plain **HTML / CSS / JavaScript**, runs in the browser.
- Pokémon data (stats, types, moves, learnsets, abilities, evolutions, Gen 4 sprites) sourced from **PokeAPI** and bundled into local JSON. PokeAPI is built for this, unlike scraping a fan site.
- **Sprites:** Gen 4 style, front and back. Pokémon only for now (no trainer sprites, music or move animations).
### Data pipeline (step 1, done)

Run `node tools/build-data.mjs` (add `--no-sprites` to skip sprites). API responses are cached in `tools/.cache`.

| Output | Contents |
|---|---|
| `data/pokemon.json` | #001–493: Gen 4 types and base stats, BST, normal abilities (Gen 4) + Hidden Ability (latest gen), gender ratio, legendary/mythical/baby flags, pre-evolution, height (m), weight (kg), sprite paths, learnset (level-up, TM, tutor, egg) |
| `data/moves.json` | Every move those Pokémon can learn (+ Struggle), with Gen 4 type, power, accuracy and PP, category, priority, target, effect text and battle meta (status chance, flinch, crit, drain, multi-hit…) |
| `data/abilities.json` | Every normal and Hidden Ability used, with effect text |
| `data/evolutions.json` | Evolution links (from → to) with the official conditions. The game applies our own rules (§2 Evolution) on top. |
| `data/manifest.json` | Build date, source, counts, missing sprites |
| `images/sprites/gen4/` | Platinum sprites: `front`, `back`, `front-shiny`, `back-shiny`, named by dex number |

- **Gen 4 accuracy:** later changes are rolled back using PokeAPI's history (e.g. Clefairy is Normal, Tackle is 35 power / 95 accuracy, Gengar has Levitate, Butterfree has 80 Sp. Atk).
- **Learnsets:** Platinum + HeartGold/SoulSilver combined. Level-up levels come from Platinum.
- **Not yet included:** alternate forms (Deoxys, Wormadam, Rotom, Giratina, Shaymin, Burmy, Castform, Cherrim). Only each species' default form is in.

### Battle engine (step 2, in progress)

Code in `js/engine/` (plain ES modules, runs in the browser and in Node):

| File | Purpose |
|---|---|
| `battle.js` | The double battle: turn order, moves, damage (Gen 4 formula), status, weather, switching, end-of-turn effects |
| `ai.js` | Opponent AI: scores every move + target, follows a set's `script`, knows doubles tricks (burn a Guts partner, Protect while the partner uses a spread move, set its own weather, focus one target) |
| `pokemon.js` | Builds a battle Pokémon (stats from level, nature, IVs 31, EVs 0) |
| `constants.js` | Gen 4 type chart (no Fairy), natures, stat stages, crit odds |
| `moveflags.js`, `items.js` | Move flags (contact, sound, punch, two-turn…) and held item tables |
| `rng.js` | Seeded RNG stored inside the battle state |

- **Saving:** the whole battle is one JSON object (`battle.state`), RNG included. Saving after every turn and reloading continues exactly the same.
- **Tools:**
  - `node tools/check-sets.mjs`: checks leader sets for typos and wrong team sizes. Off-book choices are only listed as notes.
  - `node tools/test-engine.mjs`: mechanic tests (damage, Guts, sand, spread, Helping Hand, Lightning Rod, Storm Drain, Sturdy, Protect, Trick Room, weather rocks, berries, save/load).
  - `node tools/sim.mjs`: AI vs AI battles of a leader's sets against random first-stage teams (`--show` prints one battle).
- **Leader data:** `data/leaders/gen1.json` holds Brock's 8 sets. Team size and level are read from the §3a table in this file.
- **Simplified for now:**
  - U-turn and Baton Pass switch to the next healthy Pokémon in team order (the player will get to choose once the UI exists).
  - Not implemented yet (these moves do nothing): Transform, Sketch, Mimic, Imprison, Spite, Snatch, Gravity, Future Sight's delay, and a few other rare moves. The simulator lists any it runs into.
  - Alternate forms (Castform, Cherrim, Rotom, etc.) aren't in the data yet.
- Damage formula referenced against **Pokémon Showdown** for accuracy.

### Battle screen (step 2)

Open `index.html` through a local server (Live Server, or `python3 -m http.server 8123`). Opening the file directly doesn't work because the game loads JSON files.

| File | Purpose |
|---|---|
| `index.html`, `css/styles.css` | Gen 4 DS layout: battle on the top screen, touch menu on the bottom. Side by side on wide windows. |
| `js/ui/battle-screen.js` | Draws the field (sprites, HP boxes, status, weather), plays the engine's events with animations and typed text, and runs the menus (Fight → move → target, Pokémon, replacements) |
| `js/main.js` | Loads the data and the rule tables from this file, then starts the run screens |
| `js/game/recruit.js` | Makes a recruit by the §2 rules (also used by the simulator) |
| `js/game/design-tables.js` | Reads the §3a table from this file, in the browser and in Node |

- **Arenas:** one colour palette per type (sky, ground, platforms), picked by the opponent's type theme (`js/ui/terrain.js`). Opponents without a theme (Champion, Rival) use the Normal palette. No decorations.
- **Sprite alignment** (`js/ui/sprite-align.js`): each sprite's lowest visible pixel is put on one baseline per side (foes on their platform, your Pokémon on the top edge of the text box), centred in its spot. Only Levitate users and the `FLOATERS` list hover. The right-hand Pokémon on each side is drawn in front.
- **Sprite check:** open `tools/sprite-check.html` to see 60 Pokémon at a time (front or back) standing on a feet line, to spot sprites that need a correction. Floating sprites are listed in `FLOATERS` in `js/ui/sprite-align.js`.
- **Scene preview:** open `tools/scene-preview.html` through the local server to see every terrain and weather side by side.
- Click the text box (or press Enter/Space) to skip text. Text speed Normal/Fast is on the command menu.
- **Bag** in battle: use a bag item on any team member (takes that Pokémon's turn). There's no Run button (trainer battles).
- The files `js/scripts.js`, `data/data.json` and `images/background.jpg` from the original template aren't used anymore.
- **Saving:** auto-save **every turn** in the browser (`localStorage`). Reloading or closing the page resumes the battle exactly where it was, so faints can't be undone. A **Hall of Fame** stores winning teams.
- Personal fan project: Pokémon names and sprites belong to Nintendo / Game Freak / The Pokémon Company. Not for commercial release.

### Versioning
- The version lives in `js/version.js` and is shown on the title screen (e.g. `v0.1.0`).
- Bump it with **every** update and start the change log line (§9) with the new version:
  - **patch** (0.1.0 → 0.1.1): fixes, balance changes, small UI tweaks
  - **minor** (0.1.0 → 0.2.0): new features or content (e.g. Gen 2 team pools)
  - **major** (→ 1.0.0): first complete release

### Styles
- `css/styles.css` is one sheet with design tokens at the top (colours, radius, spacing, type sizes). Use the tokens instead of new hard-coded values.
- Battle screens are sized in `cqw` so they scale like a DS; everything else uses px tokens.
- Phones (≤560 px): one column, bottom-sheet dialogs, compact move cards. Upright phones in battle: the menu screen fills the rest of the height. Touch screens: bigger tap targets, no hover lifts. Everything you can drag can also be tapped (bag items → pick a Pokémon).

### Credits
- **Pokémon data, Pokémon sprites and item sprites:** [PokeAPI](https://pokeapi.co) and the PokeAPI/sprites repository.
- **Trainer sprites:** [Pokémon Showdown](https://play.pokemonshowdown.com/sprites/trainers/) and its sprite artists (downloaded with `node tools/fetch-trainer-sprites.mjs` into `images/trainers/`). Gold uses Showdown's HeartGold/SoulSilver Ethan sprite; Tate & Liza are shown as two sprites.
- **Player character back sprites:** [Bulbagarden Archives](https://archives.bulbagarden.net) (FRLG Red & Leaf, HGSS Ethan & Lyra, Emerald Brendan & May, Platinum Lucas & Dawn), in `images/trainers/back/`. Front sprites for the picker from Pokémon Showdown (Ethan = Showdown's HGSS Ethan, Lyra added).
- **Pokémon** © Nintendo / Creatures / Game Freak / The Pokémon Company. This is a non-commercial fan project.
- A credits line is shown on the title screen.

### Hub interactions
- **Drag & drop:** held items, evolution items, ability patches and TMs from the Bag onto a Pokémon (held items are given; evolution items, patches and TMs open their dialog). Held items can be dragged to another Pokémon (swaps) or back to the Bag. Pokémon can be dragged onto another Pokémon to change the team order. Buttons still work everywhere (needed on touch screens).
- **TMs in the Bag** are clickable: pick a Pokémon that can learn it, then the move to forget.
- **Nicknames:** every recruit gets a random nickname (list in `js/game/recruit.js`), shown with its species name.
- **Character picker** on the title screen (8 characters, saved in `pd.meta`). Each run locks in the chosen character; its back sprite stands on your side during trainer intros (in battle and in the title banner).
- **Trainers:** the opponent card shows the trainer sprite and a Poké Ball per Pokémon; battles open with the trainer on the field ("… would like to battle!") and show a Poké Ball row per side that greys out as Pokémon faint.

### Run loop (step 3)

| File | Purpose |
|---|---|
| `js/game/run.js` | The whole run as one saveable object: draft, auto-leveling, learn-move prompts, recruit/item offers, team management, permadeath, opponents, end of run. Uses its own seeded RNG, so offers never change on reload. |
| `js/game/rules.js` | Reads §3a–§3d from this file (progression, tier cutoffs and overrides, level gating, species overrides, item odds) |
| `js/game/pokedex.js` | Evolution lines, tiers, level gating and evolution options (stones, Link Cable + held items, gender, branching) |
| `js/game/item-catalog.js` | **The item pool (§3e) as code**: names, tiers, descriptions and effects. Edit this file to change which items can appear. |
| `js/ui/run-screens.js` | Title, new-run setup, draft, hub, recruit and item cards, run over, Hall of Fame |
| `data/leaders/gen1–4.json` | All 14 opponents per gen. Opponents without `sets` get a **placeholder team** (random Pokémon of their type at the right level and size) until their sets are designed. |

**Rules as built** (decisions made while building, change any):
- Recruit offers never include a Pokémon from an **evolution line** already on your team (not just the same species).
- Recruits are offered at the **highest legal stage**. Babies (Pichu, Munchlax…) are never offered; species that came out before their baby (Pikachu, Snorlax…) count as base forms.
- Learning new moves: if a Pokémon has a free move slot it learns automatically, otherwise you get a "forget which move?" prompt in the hub.
- After a battle, held items that were knocked off or swapped come back. Used-up items (berries, Focus Sash) are gone.
- A **draw** (both sides out at once) counts as a loss.
- Saving: `localStorage` key `pd.run` after every action and every battle turn. The Hall of Fame is `pd.hallOfFame`.

**Shop, TMs and progression (step 4):**
- `js/game/run.js`: prize money, the shop (5 items, refreshed after every battle, sell at half price), TM rewards from every opponent and teaching TMs.
- `js/game/meta.js`: Trainer Points and Trainer upgrades, saved in `localStorage` key `pd.meta` (separate from runs, so it survives losing). A new run copies your upgrades at the start.
- `data/tms.json`: TM01–TM92 from Platinum (`node tools/build-tms.mjs`).
- Screens: money and shop in the hub, a TM button per Pokémon and a TM Case, a rewards banner after each win, Trainer Upgrades on the title screen, TP earned on the end screens.

**Tools:**
- `node tools/sim-run.mjs --n 30 --gen 1`: plays whole runs with the AI making every choice. `--boost` gives the player +40 levels to test that runs can be finished. `--verbose` prints each battle.
- `node tools/fetch-item-sprites.mjs`: downloads item sprites to `images/items/` (Link Cable and Hidden Ability Patch have no PokeAPI sprite).

## 8. Species Reference

Working tables for team building and tier tuning. **Earliest level** follows §3c, **Tier** follows §3b (including overrides). The tier columns apply to the whole line and are only filled on its first Pokémon.

### 8a. Rock types (Gen 1–4)

All Rock-type lines up to Gen 4. Slugma (Fire) and Steelix (Steel/Ground) are included because their lines contain Rock types. "Lv 12" = allowed for Brock (Gym 1).

| # | Pokémon | Type (Gen 4) | BST | Evolves | Earliest level | Default tier | Tier (after override) | Lv 12 |
|---|---|---|---|---|---|---|---|---|
| 074 | Geodude | Rock/Ground | 300 | — | — | Uncommon | Uncommon | ✅ |
| 075 | Graveler | Rock/Ground | 390 | Lv 25 | 25 | | | ❌ |
| 076 | Golem | Rock/Ground | 495 | Trade | 36 | | | ❌ |
| 095 | Onix | Rock/Ground | 385 | — | — | Rare | Rare | ✅ |
| 208 | Steelix | Steel/Ground | 510 | Trade + Metal Coat | 36 | | | ❌ |
| 111 | Rhyhorn | Ground/Rock | 345 | — | — | Rare | Rare | ✅ |
| 112 | Rhydon | Ground/Rock | 485 | Lv 42 | 42 | | | ❌ |
| 464 | Rhyperior | Ground/Rock | 535 | Trade + Protector | 42 | | | ❌ |
| 138 | Omanyte | Rock/Water | 355 | — | — | Uncommon | Uncommon | ✅ |
| 139 | Omastar | Rock/Water | 495 | Lv 40 | 40 | | | ❌ |
| 140 | Kabuto | Rock/Water | 355 | — | — | Uncommon | **Rare** | ✅ |
| 141 | Kabutops | Rock/Water | 495 | Lv 40 | 40 | | | ❌ |
| 142 | Aerodactyl | Rock/Flying | 515 | Doesn't evolve | 30 | Rare | Rare | ❌ |
| 438 | Bonsly | Rock | 290 | — | — | Common | Common | ✅ |
| 185 | Sudowoodo | Rock | 410 | Bonsly learns Mimic (Other) | 30 | | | ❌ |
| 213 | Shuckle | Bug/Rock | 505 | Doesn't evolve | 30 | Rare | Rare | ❌ |
| 218 | Slugma | Fire | 250 | — | — | Common | Common | ✅ |
| 219 | Magcargo | Fire/Rock | 410 | Lv 38 | 38 | | | ❌ |
| 222 | Corsola | Water/Rock | 380 | Doesn't evolve | — | Common | Common | ✅ |
| 246 | Larvitar | Rock/Ground | 300 | — | — | Epic | Epic | ✅ |
| 247 | Pupitar | Rock/Ground | 410 | Lv 30 | 30 | | | ❌ |
| 248 | Tyranitar | Rock/Dark | 600 | Lv 55 | 55 | | | ❌ |
| 299 | Nosepass | Rock | 375 | — | — | Rare | Rare | ✅ |
| 476 | Probopass | Rock/Steel | 525 | Location (Other) | 30 | | | ❌ |
| 304 | Aron | Steel/Rock | 330 | — | — | Rare | Rare | ✅ |
| 305 | Lairon | Steel/Rock | 430 | Lv 32 | 32 | | | ❌ |
| 306 | Aggron | Steel/Rock | 530 | Lv 42 | 42 | | | ❌ |
| 337 | Lunatone | Rock/Psychic | 440 | Doesn't evolve | — | Common | Common | ✅ |
| 338 | Solrock | Rock/Psychic | 440 | Doesn't evolve | — | Common | Common | ✅ |
| 345 | Lileep | Rock/Grass | 355 | — | — | Uncommon | Uncommon | ✅ |
| 346 | Cradily | Rock/Grass | 495 | Lv 40 | 40 | | | ❌ |
| 347 | Anorith | Rock/Bug | 355 | — | — | Uncommon | **Rare** | ✅ |
| 348 | Armaldo | Rock/Bug | 495 | Lv 40 | 40 | | | ❌ |
| 369 | Relicanth | Water/Rock | 485 | Doesn't evolve | — | Uncommon | Uncommon | ✅ |
| 377 | Regirock | Rock | 580 | Legendary | 45 | Legendary | Legendary | ❌ |
| 408 | Cranidos | Rock | 350 | — | — | Uncommon | **Rare** | ✅ |
| 409 | Rampardos | Rock | 495 | Lv 30 | 30 | | | ❌ |
| 410 | Shieldon | Rock/Steel | 350 | — | — | Uncommon | Uncommon | ✅ |
| 411 | Bastiodon | Rock/Steel | 495 | Lv 30 | 30 | | | ❌ |

## 9. Change Log

- **October 09, 2026:** Initial design captured from brainstorming.
- **October 09, 2026:** Decided the replace-or-skip rule for a full team and random Final Rival selection.
- **October 09, 2026:** Added editable Run Progression tables (battles, levels, recruit offers, rarity odds, tiers, level gating).
- **October 09, 2026:** Locked mechanics (Gen 4 rules, doubles scope, AI, recruit stats, moves), evolution rules (stones, Link Cable, no friendship), item offers, Pokémon Pool, saving and sprites. Removed the recruit after the Final Rival.
- **October 09, 2026:** Saving every turn (no undoing faints by reloading).
- **October 09, 2026:** Locked item rules (no Revives, consumables used up, multi-use evolution items, unlimited bag), added item odds and item pool (§3d–3e), enemy team sizes, leader pools, regional dexes and base game per gen.
- **October 09, 2026:** Enemy team sizes start at 2 and scale slowly; added enemy pool sizes; leader pools are fully handcrafted with one ace each.
- **October 09, 2026:** Leader pools use the National Dex up to Gen 4 and follow level gating; no fixed move/item rules for leaders; minimum levels for non-evolving Rare (30) and Epic (40) Pokémon.
- **October 09, 2026:** Added tier overrides (§3b), the "never earlier than the previous stage" gating rule (§3c), and the Rock-type species reference table (§8a). Ground types are reserved for Giovanni.
- **October 09, 2026:** Brock switches from a random pool to handcrafted team sets with AI strategy notes.
- **October 09, 2026:** Every opponent uses handcrafted team sets (no pools, no ace rule). Added Brock's sets 1–3; Trick Room idea moved to Sabrina.
- **October 09, 2026:** Added Brock's sets 4–8. Parked the Boom set for Koga or Lt. Surge.
- **October 09, 2026:** Added genders, shinies, free team order (first 2 lead), no team preview, Hidden Abilities (Gen 5+), item offers as 3 cards incl. after the Elite Four and Champion. Dropped smart item odds for now.
- **October 09, 2026:** Hidden Abilities 10% for recruits, Ability Patch and Hidden Ability Patch items, Gen 5 Sturdy everywhere, odd-evolution rules, Hidden Abilities on Brock's sets 2, 6 and 7.
- **October 09, 2026:** Gen 5 versions of Lightningrod and Storm Drain everywhere.
- **October 09, 2026:** Step 1 done: data pipeline (`tools/build-data.mjs`) built Gen 4 data for #001–493 and downloaded all Platinum sprites.
- **October 09, 2026:** Step 2 started: battle engine, AI, set checker, mechanic tests and simulator. Brock's sets moved to `data/leaders/gen1.json`.
- **October 09, 2026:** Battle screen: Gen 4 DS layout, animated event playback, Fight / target / Pokémon menus, save-every-turn and resume. Test battle vs Brock's sets.
- **October 10, 2026:** Step 3: the run loop. Title, setup, draft, hub (team order, items, evolution, Move Relearner, ability patches), recruit and item cards, permadeath, bag items in battle, run over, Hall of Fame. All 14 opponents per gen, with placeholder teams until designed.
- **October 10, 2026:** Gen 1 Rival can be Red, Blue or Green. Runs start with a starting bag (§3f) and an item pick after the draft (2 of 4).
- **October 10, 2026:** Easier start: draft 2 of 8, Gym 1–2 recruits 1 of 3, new Level bonus column (+2 vs Brock, +1 vs Misty). Move info in battle (Physical/Special/Status, power, accuracy, effect). Confirmation before taking a recruit or item card.
- **October 10, 2026:** Move cards (name, type, category, power, accuracy, PP, effect) in the team builder, recruit cards and learn-move dialogs. One free reroll per recruit screen.
- **October 10, 2026:** Balance: starter draft 3 of 8, better early odds (draft to Gym 4), Gyms 3–4 recruits 1 of 4, replacement picks after losses (+1 pick and card per fainted Pokémon, max +2).
- **October 11, 2026:** Added TM rewards from every opponent (§3g), the shop and prize money (§3h), and roguelite Trainer upgrades bought with Trainer Points (§3i). All gens stay open; item cards and the shop both stay.
- **October 11, 2026:** Title screen battle banner, sprite alignment, 12 terrains by opponent type, layered weather visuals.
- **October 11, 2026:** Arenas simplified to type colour palettes; one baseline per side for sprites.
- **October 11, 2026:** Trainer sprites (Pokémon Showdown, credited), Poké Ball party rows, drag & drop in the hub, clickable TMs, random nicknames.
- **October 11, 2026:** Character picker with Gen 3–4 player back sprites in trainer intros.
- **October 11, 2026:** Character shown in the hub; next opponent revealed right after a win (and in the draft); TMs in the shop; shop reroll (first free per battle).
- **October 11, 2026:** Lower legendary recruit odds late in the run (Gym 7–8: 1%, Elite Four: 3%, Champion: 5%; the difference moved to Epic). Opponent teams are now drawn at random from per-trainer **team pools** (§5); Gen 1 pools added. Brock's handcrafted sets are parked.
- **October 12, 2026:** Team pools now hold **every non-legendary species of the trainer's type** (Gen 1–4), split into power groups 0–5. The battle position picks the groups, so a randomized gym order would still scale. Gen 1 (Kanto) pools generated with `tools/build-pools.mjs`.
- **October 12, 2026:** Legendaries now join team pools when they match the trainer's type (power Group 5; §3c gating keeps them at Lv 45+). Mythicals stay out.
- **October 12, 2026:** Mythicals join team pools. Pool tables get a **Filler** column (canon off-type picks + earlier stages that aren't the type). Thin windows widen automatically (Minimum choice 1.5× team size). Legendaries and Mythicals drawn at 5% weight, so no Group 6.
- **October 12, 2026:** Legendary weight raised to 15%; a second legendary is drawn at 5%; max 2 legendaries per team.
- **October 12, 2026:** Pixel-art party Poké Balls (`images/ui/ball.png`, 12×12, drawn by `tools/make-ball.mjs`). The battle screen and title banner are now 256×204: the 256×192 scene sits at the bottom with 12 px of sky above, so tall Pokémon and trainers are no longer cut off.
- **October 12, 2026:** Character picker moved from the title screen to the New run screen. Opponent party balls and the turn counter sit in the sky strip above the scene (top left / top right). New run screen shows team pools ready per gen.
- **v0.1.0 · October 12, 2026:** First versioned release. Stylesheet rebuilt with shared design tokens (same look, dead override blocks removed). Mobile UI: phone layout for every screen, bottom-sheet dialogs, battle menu fills the screen, bigger tap targets, tap-to-use bag items. Version number on the title screen. README and .gitignore for GitHub.
- **v0.1.1 · October 12, 2026:** Battle menu screen no longer stretches on phones. Battle Pokémon menu is a 2×2 grid (pages for 5–6 Pokémon). Details window and the Move Relearner / TM dialogs flip through your team with ◀ ▶ (arrow keys, swipe on phones). "Earlier / Later" replaced by team slot buttons: tap a slot to swap places. More space above choice rows.
- **v0.1.2 · October 12, 2026:** Battle Pokémon menu is a 2×3 grid: the whole team on one screen (no pages).
