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
- **No Fairy type** (it doesn't exist in Gen 1–5).
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
- **IVs:** recruits roll 15–31 in each stat (opponents have 31 in every stat).
- **EVs:** none.
- **Moves:** the last 4 level-up moves the species learns at its level.

### Leveling and moves
- Before each battle, the whole team **auto-levels to the next opponent's level + the Level bonus** in §3a (early gyms only, to soften the start).
- When a level-up offers a new move, you **choose which move to replace** (or skip it).
- **Free move relearning** between battles: the **Moves bar** next to the team lists every move the chosen Pokémon can learn (level-up moves up to its level, and the TMs you own). Tap a move for a popup with its details and the slot to learn it in, or drag it onto one of the four slots. Drag a slot onto another to change the order.

### Evolution
- **Player-triggered:** an **Evolve** button appears once a Pokémon qualifies. You choose when (or whether).
- Every evolution also needs the Pokémon to be at or above its **earliest level in §3c**.

| Method | How it works in this game |
|---|---|
| Level-up | Evolve once the evolution level is reached |
| Evolution stone | Use the stone on the Pokémon. Stones are **multi-use** (not consumed). |
| Trade | Use a **Link Cable** on the Pokémon. Multi-use. |
| Trade + held item (e.g. Onix → Steelix, Magmar → Magmortar) | The Pokémon only has to **hold** the required item (Metal Coat, Magmarizer…); **no Link Cable needed**. The item is **not consumed**, so it keeps its battle effect and can evolve more Pokémon. |
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
- Only items that exist **up to Gen 4** (no Eviolite, Assault Vest, Rocky Helmet, etc.). **Exceptions:** Ice Stone (for Glaceon), **Ability Patch** (switch between a Pokémon's normal abilities) and **Hidden Ability Patch** (switch to its Hidden Ability). Both patches are single-use (used up when applied).
- **No Revives** of any kind. Permadeath is the core of the game.
- **Consumable held items** (berries, herbs) are **single use**: lost for good once they trigger. Item cards say "Single use: lost once it triggers". The **Focus Sash** is the exception: it works once per battle and you keep it afterwards.
- **Bag items** are **used up for good** once used. They **can be used in battle**, which takes up that Pokémon's turn.
- **Evolution items** (stones, Link Cable, trade items like Metal Coat) are **multi-use**. Link Cable is only for plain trade evolutions (Machoke, Kadabra, Graveler, Haunter).
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
| Trade (Link Cable, or a held trade item) | 36 |
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

Every opponent (gyms, Elite Four, Champion, Rival) gives a **reusable TM** when beaten, drawn from the TMs (TM01–TM92 from Gen 4, TM93–TM118 from Gen 5) of their **type theme**. Opponents without a theme (Champion Blue, Cynthia, Rivals) give any type. You never get a TM you already have. Teach it in the hub to any team member that can learn it (Gen 4 or Gen 5 learnsets).

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

The **shop** in the hub is split into **sections** (tabs, like the Bag): Items (held items), Berries, Medicine, Battle, Key Items and TMs. Each section sells the number of random items below, from the item pool (§3e) rolled with the item odds (§3d). TMs are ones you don't own yet, within the TM power limit for the next battle (§3g). The stock refreshes after every battle. **Reroll:** the first reroll after each battle is free, after that each reroll costs the amount below. You can sell items for half their price. **Deals:** every restock puts 2 random items and 1 TM on sale for 20–50% off (shown at the top as "Today's deals", with the old price struck through). The reroll button is called Restock and rerolls the deals too.

| Tier | Price |
|---|---|
| Common | 300 |
| Uncommon | 800 |
| Rare | 2000 |
| Epic | 5000 |

| Shop section | Items for sale |
|---|---|
| Items (held items) | 4 |
| Berries | 3 |
| Medicine | 3 |
| Battle (X items, Dire Hit…) | 2 |
| Key Items (stones, Link Cable, patches) | 2 |
| TMs | 3 |

| Money rule | Amount |
|---|---|
| Starting money | 500 |
| Prize per win | 190 × battle number |
| Flawless bonus (nobody fainted) | 50% |
| TM price (status or power ≤ 60) | 1200 |
| TM price (power 61–85) | 2400 |
| TM price (power 86+) | 4000 |
| Shop reroll (after the free one) | 150 |

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
| scout | Scout | 1 extra card on every recruit screen and item screen | 1 extra card on every recruit screen and item screen | 2 extra cards on every recruit screen and item screen |
| dice | Lucky Dice | 2 | 5 | +1 free reroll per recruit screen |
| allowance | Allowance | 3 | 3 | +500 starting money |
| bag | Bigger Bag | 2 | 3 | Level 1: +2 Super Potions. Level 2: + Sitrus Berry and Full Heal |
| gift | Gift Box | Every item screen shows 1 more card | Every item screen shows 1 more card | Every item screen shows 1 more card and lets you take 1 more item |
| hidden | Hidden Potential | 2.1% extra chance that a recruit has its Hidden Ability | 5.3% extra chance that a recruit has its Hidden Ability | 9.5% extra chance that a recruit has its Hidden Ability |
| shiny | Shiny Charm | 1 | 5 | Shiny chance 1/512 → 1/128 (cosmetic) |

### 3j. Character unlocks ✏️ _(editable table)_

Trainers unlock through **themes**: you do something that fits them and they join. Progress is saved with the Trainer Points (meta save), so it survives losing. A trainer's **Unlock** cell is one or more clauses; `A or B` means either way, `A and B` means both (counted over all your runs, not in one run):

- `Start`: available from the beginning.
- `Runs: N`, `Wins: N`, `Win Gen G`, `Beat battle N`, `TP earned: N`: finish N runs, reach the Hall of Fame N times, win Challenge Gen G, beat battle #N (§3a numbering), earn N Trainer Points in total.
- `Line win: X`: reach the Hall of Fame with a Pokémon of the evolution line of X (the first stage, like `ralts`) on the team. `Line gym N: X`: have that line on the team when you beat battle #N. `Line picks N: X`: pick that line at the starter draft in N runs.
- `Starters: kanto` (or johto, hoenn, sinnoh, unova): have all three starter lines of that region on your team together.
- `Type win: T`: reach the Hall of Fame with a T-type Pokémon on the team. `Type gym N: T`: have a T-type on the team when you beat battle #N.
- `Species: N`: recruit N different species in total. `Badges: N`: own N badges.
- `Clean win` (or `Clean win Gen G`): reach the Hall of Fame without losing a Pokémon. `Clean gym N`: get through battle #N without losing one.
- `Quick wins: N`: win N gym battles in 4 turns or fewer. `Berries: N`, `Items: N`: give N berries or N held items to your Pokémon in total. `Diverse win`: reach the Hall of Fame with six different types on the team. `Full team: T`: win a battle with six Pokémon of type T on the team. `Win all gens`: reach the Hall of Fame in every Challenge Gen (1–5). `Fast win: N`: reach the Hall of Fame within N minutes of play time (counted while the game is open and visible; only runs started after v0.23.0 are timed). `Obtain: a, b, c…`: have every one of those exact species on your team at some point of one run, not necessarily at once, and fallen or released ones count (the picker shows them and the most you had in a single run; Cynthia's Platinum team is the example). `Friendship: N`: recruit N different Pokémon that evolve by friendship (Crobat, Blissey, Lucario, Espeon…); evolving is automatic by level, so there is no friendship system.

**Pacing.** At most **2 trainers unlock per run**: the rest wait for the next battle or run, so each one feels like an event. Each unlock gets a "New trainer unlocked!" popup (or the end-of-run list) with what the perk does. The picker shows every trainer: the ones you have list how you unlocked them, the locked ones list how to unlock them. A few cool trainers stay secret (shown as "???") until you have them: they are listed in `HIDDEN_TRAINERS` in `js/game/unlocks.js` (Lance, Steven, Red (Battle Frontier) and Silver). Characters that are missing from the table are free.

**Perks.** The **Perk** column is the text players see; the **Effect** column is what the game applies (`—` means planned, not in the game yet). Effects, joined by `;`: `money:300`, `bag:oran-berry:2`, `item-pick:1` (one more starting item pick), `starter-reroll:1` (one more free reroll in the starter draft), `starter:kanto` (the starter draft always has a starter of that region), `first-recruit:ralts` (the starter draft always has that line), `starter-extra:kanto` (one extra starter card of that region), `starter-card:1` (one extra card in the starter draft), `scout:1` (one extra card on every recruit screen), `shiny:384` (shiny chance 1/384), `bias:dragon` (that type turns up more in recruits), `level-first:1` / `level-gyms:1` (+1 level in the first gym / at every gym), `discount:berry:50` (percent off a group: `berry`, `evo` for stones, `guard` for Guard Spec. and X items), `prize:10` (+10% prize money from every battle), `dice:1` (one extra reroll on every recruit screen), `stat:atk:5` (+5% to a stat for the whole team in battle; `stat:all:5` for every stat except HP), `power:fire:5` (that type's moves hit 5% harder), `acc:fighting:5` (that type's moves are 5% more accurate), `potion:20` (Potions heal 20 more HP), `revive:1` (once per run, a Pokémon that fell in a won battle is saved), `iv-rating:1` (recruit cards show an IV rating), `weak-badge:1` (the weakest badge in the case gets +1 strength), `rare-first:1` (one extra Rare card on the recruit screen after battle 1), `free-reroll-first:1` (one extra free reroll on that screen). The names, themes and planned perks are suggestions to edit.

| ID | Character | Unlock | Perk | Effect |
|---|---|---|---|---|
| red-gb | Red (R/B) | Starters: kanto | One extra Kanto starter card in the starter draft | starter-extra:kanto |
| oak | Prof. Oak (Yellow) | Species: 25 | Recruit cards show an IV rating | iv-rating:1 |
| ethan-gsc | Ethan (G/S/C) | Starters: johto | One extra Johto starter card in the starter draft | starter-extra:johto |
| kris | Kris (Crystal) | Clean win | Once per run, a Pokémon that would fall in a won battle is saved | revive:1 |
| ethan | Ethan (HGSS) | Start | One extra free reroll in the starter draft | starter-reroll:1 |
| lyra | Lyra (HGSS) | Start | Shiny chance 1/512 → 1/384 (cosmetic) | shiny:384 |
| lance | Lance (HGSS) | Full team: dragon | Dragon-type recruits appear more often | bias:dragon |
| silver | Silver (HGSS) | Friendship: 5 | +1 level on all your Pokémon in the first gym | level-first:1 |
| red | Red (FRLG) | Start | The starter draft always has a Kanto starter | starter:kanto |
| leaf | Leaf (FRLG) | Start | +₽300 starting money | money:300 |
| brendan-rs | Brendan (R/S) | Starters: hoenn | One extra Hoenn starter card in the starter draft | starter-extra:hoenn |
| may-rs | May (R/S) | Win Gen 3 | Berries cost half in the shop | discount:berry:50 |
| brendan | Brendan (Emerald) | Start | The starter draft always has a Hoenn starter | starter:hoenn |
| may | May (Emerald) | Start | Start with 2 extra Oran Berries | bag:oran-berry:2 |
| red-e | Red (Battle Frontier) | Win all gens | +5% to all stats for your whole team, one extra item pick and one extra starter reroll | stat:all:5;item-pick:1;starter-reroll:1 |
| steven | Steven (Emerald) | Full team: steel | Start with a Hard Stone and a Metal Coat | bag:hard-stone:1;bag:metal-coat:1 |
| wally | Wally (R/S) | Line win: ralts | The starter draft always offers a Ralts | first-recruit:ralts |
| lucas | Lucas (Platinum) | Start | One extra item pick (and card) in the starting items | item-pick:1 |
| dawn | Dawn (Platinum) | Start | One extra reroll on every recruit screen | dice:1 |
| barry | Barry (Platinum) | Fast win: 60 | +8% Speed for your whole team and a Quick Claw to start | stat:spe:8;bag:quick-claw:1 |
| buck | Buck (D/P) | Line win: machop | +5% Attack for your whole team | stat:atk:5 |
| cheryl | Cheryl (D/P) | Clean gym 4 | Potions heal 20 more HP | potion:20 |
| marley | Marley (D/P) | Items: 25 | Start with a Sitrus Berry to hold | bag:sitrus-berry:1 |
| mira | Mira (D/P) | Species: 50 | One extra recruit card on every recruit screen | scout:1 |
| riley | Riley (D/P) | Badges: 16 | Your weakest badge gets +1 strength | weak-badge:1 |
| hilbert | Hilbert (B/W) | Wins: 1 | One extra card in the starter draft | starter-card:1 |
| hilda | Hilda (B/W) | Wins: 2 | One extra Rare card on the first recruit screen (after battle 1) | rare-first:1 |
| juniper | Prof. Juniper (B/W) | Species: 100 | Evolution stones cost 30% less | discount:evo:30 |
| nate | Nate (B2/W2) | Win Gen 5 | +1 level on all your Pokémon at every gym | level-gyms:1 |
| rosa | Rosa (B2/W2) | Diverse win | +5% Sp. Atk for your whole team | stat:spa:5 |
| bianca | Bianca (B2/W2) | Type gym 6: normal | One extra free reroll on the first recruit screen (after battle 1) | free-reroll-first:1 |
| cheren | Cheren (B2/W2) | Clean win Gen 5 | +5% Defense and Sp. Def for your whole team | stat:def:5;stat:spd:5 |
| hugh | Hugh (B2/W2) | Quick wins: 5 | +10% prize money from every battle | prize:10 |
| chili | Chili (B2/W2) | Type win: fire | Fire moves hit 5% harder | power:fire:5 |
| cilan | Cilan (B2/W2) | Type win: grass | Grass moves hit 5% harder | power:grass:5 |
| cress | Cress (B2/W2) | Type win: water | Water moves hit 5% harder | power:water:5 |
| cynthia | Cynthia (Platinum) | Obtain: garchomp, spiritomb, roserade, togekiss, lucario, milotic | +6% Attack and Sp. Atk for your whole team | stat:atk:6;stat:spa:6 |

### 3k. Gym badges ✏️ _(editable tables)_

Badges work like the jokers in Balatro: every badge has **its own effect**, no two are the same, and the badges you carry are your build. Every gym leader has a **personal badge** (Brock always gives the Boulder Badge). Beating a Gym Leader in any run **unlocks their badge for good**: 40 badges in total (5 Challenge Gens × 8 gyms), shared by every run and every generation. Before a **new run** you fill your **badge case** with any badges you own, mixing generations as you like. The case **can't be changed during the run** (the Badges button in the hub only shows it). Each badge can only be worn once.

**Strength.** An effect's size depends on the badge's **strength**: its **gym number** (1–8), so the first gyms give small effects and the last ones strong ones. Strength 1 is a few percent, strength 8 or more is big. The numbers per strength are in the scaling table below (they live in `js/game/badges.js`).

**Stat boost.** Like the badges of the main games, **every badge raises one stat of your whole team by itself**: Attack, Defense, Sp. Atk, Sp. Def or Speed, set in the **Stat** column by the gym's type (rock and steel: Defense, fighting and ground: Attack, water and grass: Sp. Def, flying and electric: Speed…). It is small (1% at strength 1 up to 5.5% at strength 10) and **always on**. Only the badge's secondary effect (the **Perk** column) has an on / off switch, and a switched-off badge still gives its stat and counts for the set bonus.

**Boost zones.** The 8 slots of the case (a 4 × 2 grid) are split into **4 fixed zones**, each with its own boost:

```
A A B B      A = ★ (2 slots)     B = ★★ (2 slots)
C C C D      C = ★★★ (3 slots)   D = ★★★★ (1 slot)
```

Every badge inside a zone gets the zone's boost (★ is +1 strength, ★★★★ is +4, at most 10 in total). A small zone has a bigger boost but fits fewer badges, so where you put your badges matters. Only **Rainmaker** calls weather, so weather badges never clash; Sunbringer, Sand Caller and Cold Snap boost Fire, Rock/Ground/Steel and Ice moves.

**Slots open up as you collect badges.** You start with 3 slots; the others are locked (shown with a lock and the number of badges they need) until you own enough badges:

| Slot | Opens at (badges owned) |
|---|---|
| 1, 2, 3 | start |
| 4 | 4 |
| 5 | 8 |
| 6 | 14 |
| 7 | 22 |
| 8 | 32 |

(The numbers live in `SLOT_UNLOCKS` in `js/game/badges.js`.) Locked slots stay empty, are skipped by Auto-fill, and tapping one explains what it needs.

**Badge messages in battle.** Badge effects that act on their own say so: "Rainbow Badge: your Pokémon regrow a little HP every turn." Ongoing effects (Rainmaker, Regrowth, Vampire, Spoils of War, Spikes, Opening Salvo) are announced the first time in a battle; saves and blocks (Second Wind, the status wards) are announced every time. Passive boosts (stats, damage and accuracy changes) stay silent.

The **Perk** column is the effect id (the game reads it, so you can move effects between badges, but give every badge a different one). The **Effect** column is only text for you (at the badge's own gym strength).

| ID | Badge | Leader | Stat | Perk | Effect |
|---|---|---|---|---|---|
| 1-1 | Boulder Badge | Brock | def | sturdy-stone | Sturdy Stone: A Pokémon at full HP takes 2.1% less damage from every hit |
| 1-2 | Cascade Badge | Misty | spd | rain-start | Rainmaker: Rain starts when every battle begins and lasts 3 turns |
| 1-3 | Thunder Badge | Lt. Surge | spe | para-ward | Static Guard: Each time something tries to paralyze one of your Pokémon, there is a 24% chance it is stopped |
| 1-4 | Rainbow Badge | Erika | spd | regen | Regrowth: Your Pokémon heal 1.7% of their max HP at the end of every turn |
| 1-5 | Soul Badge | Koga | atk | poison-ward | Antidote Charm: Each time something tries to poison one of your Pokémon, there is a 38% chance it is stopped |
| 1-6 | Marsh Badge | Sabrina | spa | stat-spa | Mind Over Matter: Your Pokémon's Sp. Atk is 4.9% higher |
| 1-7 | Volcano Badge | Blaine | spa | fire-boost | Sunbringer: Your Fire moves do 11.2% more damage |
| 1-8 | Earth Badge | Giovanni | atk | rock-boost | Sand Caller: Your Rock, Ground and Steel moves do 12.6% more damage |
| 2-1 | Zephyr Badge | Falkner | spe | stat-spe | Tailwind: Your Pokémon's Speed is 1.4% higher |
| 2-2 | Hive Badge | Bugsy | atk | multi-hit | Swarm: Moves that hit several times hit at least 2 times |
| 2-3 | Plain Badge | Whitney | def | wallet | Lucky Wallet: You earn 7% more prize money after every win |
| 2-4 | Fog Badge | Morty | spa | dodge | Thick Fog: Foes' attacks are 3.5% more likely to miss |
| 2-5 | Storm Badge | Chuck | atk | stat-atk | Brawler: Your Pokémon's Attack is 4.2% higher |
| 2-6 | Mineral Badge | Jasmine | def | stat-def | Iron Skin: Your Pokémon's Defense is 4.9% higher |
| 2-7 | Glacier Badge | Pryce | spd | ice-boost | Cold Snap: Your Ice moves do 11.2% more damage |
| 2-8 | Rising Badge | Clair | spa | super-effective | Weakness Hunter: Your super effective attacks do 11.9% more damage |
| 3-1 | Stone Badge | Roxanne | def | weakness-guard | Bedrock: Attacks that are super effective against your Pokémon do 2.8% less damage |
| 3-2 | Knuckle Badge | Brawly | atk | opener | Opening Salvo: On turn 1 of every battle, your attacks do 6.3% more damage |
| 3-3 | Dynamo Badge | Wattson | spe | crit-eye | Sharp Eyes: Your attacks have 3.5% extra chance to be critical hits |
| 3-4 | Heat Badge | Flannery | spa | last-stand | Last Stand: Your Pokémon with less than a third of their HP left do 9.8% more damage |
| 3-5 | Balance Badge | Norman | def | interest | Interest: After every win you earn 4.8% of the money you hold (at most ₽160) |
| 3-6 | Feather Badge | Winona | spe | accuracy | Eagle Eye: Your attacks are 4.9% more likely to hit |
| 3-7 | Mind Badge | Tate & Liza | spa | swap | Swap: On every recruit screen you can trade one of your Pokémon for any card, once. A trade doesn't use a pick |
| 3-8 | Rain Badge | Juan | spd | vampire | Vampire: Your Pokémon heal 9.5% of the damage they deal |
| 4-1 | Coal Badge | Roark | def | revenge | Vengeance: Each of your Pokémon that has fainted in this battle adds 1.4% to your damage (up to 3 fainted) |
| 4-2 | Forest Badge | Gardenia | spd | reroll | Reroller: 1 extra free reroll on every recruit screen |
| 4-3 | Relic Badge | Fantina | spa | second-wind | Second Wind: When one of your Pokémon would faint, there is a 11% chance it hangs on with 1 HP instead (once per battle) |
| 4-4 | Cobble Badge | Maylene | atk | closer | Closer: Your attacks do 8.1% more damage to foes at half HP or less |
| 4-5 | Fen Badge | Crasher Wake | spd | ko-heal | Spoils of War: A Pokémon that knocks out a foe heals 9.8% of its max HP |
| 4-6 | Mine Badge | Byron | def | thorns | Spikes: Foes that hit your Pokémon with a contact move lose 4.9% of their max HP |
| 4-7 | Icicle Badge | Candice | spd | burn-ward | Frost Veil: Each time something tries to burn one of your Pokémon, there is a 52% chance it is stopped |
| 4-8 | Beacon Badge | Volkner | spe | recruit | Extra Recruit: Every recruit screen shows 1 more card and lets you take 1 more Pokémon |
| 5-1 | Basic Badge | Cheren | def | scout | Scout: 1 extra card on every recruit screen and item screen |
| 5-2 | Toxic Badge | Roxie | atk | stab-plus | Signature Style: Attacks that match the user's own type get 2.5% extra power, on top of the usual bonus |
| 5-3 | Insect Badge | Burgh | atk | hidden | Hidden Potential: 4.2% extra chance that a recruit has its Hidden Ability |
| 5-4 | Bolt Badge | Elesa | spe | sleep-ward | Wide Awake: Each time something tries to put to sleep one of your Pokémon, there is a 31% chance it is stopped |
| 5-5 | Quake Badge | Clay | atk | haggler | Haggler: Everything in the shop costs 6.3% less |
| 5-6 | Jet Badge | Skyla | spe | tm | TM Master: After every win there is a 24.5% chance to get a second TM |
| 5-7 | Legend Badge | Drayden | spa | stat-spd | Dragon Scales: Your Pokémon's Sp. Def is 5.6% higher |
| 5-8 | Wave Badge | Marlon | spd | gift | Gift Box: Every item screen shows 1 more card and lets you take 1 more item |

#### Effect scaling

What each effect does at strength 1, 4 and 8 (information only; edit `EFFECTS` in `js/game/badges.js` to change the numbers).

| Perk | Name | Strength 1 | Strength 4 | Strength 8 |
|---|---|---|---|---|
| sturdy-stone | Sturdy Stone | A Pokémon at full HP takes 2.1% less damage from every hit | A Pokémon at full HP takes 6.3% less damage from every hit | A Pokémon at full HP takes 11.9% less damage from every hit |
| weakness-guard | Bedrock | Attacks that are super effective against your Pokémon do 2.8% less damage | Attacks that are super effective against your Pokémon do 7% less damage | Attacks that are super effective against your Pokémon do 12.6% less damage |
| opener | Opening Salvo | On turn 1 of every battle, your attacks do 4.2% more damage | On turn 1 of every battle, your attacks do 10.5% more damage | On turn 1 of every battle, your attacks do 18.9% more damage |
| last-stand | Last Stand | Your Pokémon with less than a third of their HP left do 3.5% more damage | Your Pokémon with less than a third of their HP left do 9.8% more damage | Your Pokémon with less than a third of their HP left do 18.2% more damage |
| revenge | Vengeance | Each of your Pokémon that has fainted in this battle adds 1.4% to your damage (up to 3 fainted) | Each of your Pokémon that has fainted in this battle adds 3.5% to your damage (up to 3 fainted) | Each of your Pokémon that has fainted in this battle adds 6.3% to your damage (up to 3 fainted) |
| closer | Closer | Your attacks do 2.8% more damage to foes at half HP or less | Your attacks do 8.1% more damage to foes at half HP or less | Your attacks do 15.1% more damage to foes at half HP or less |
| super-effective | Weakness Hunter | Your super effective attacks do 2.1% more damage | Your super effective attacks do 6.3% more damage | Your super effective attacks do 11.9% more damage |
| stab-plus | Signature Style | Attacks that match the user's own type get 1.4% extra power, on top of the usual bonus | Attacks that match the user's own type get 4.6% extra power, on top of the usual bonus | Attacks that match the user's own type get 8.8% extra power, on top of the usual bonus |
| crit-eye | Sharp Eyes | Your attacks have 1.4% extra chance to be critical hits | Your attacks have 4.6% extra chance to be critical hits | Your attacks have 8.8% extra chance to be critical hits |
| accuracy | Eagle Eye | Your attacks are 1.4% more likely to hit | Your attacks are 3.5% more likely to hit | Your attacks are 6.3% more likely to hit |
| dodge | Thick Fog | Foes' attacks are 1.4% more likely to miss | Foes' attacks are 3.5% more likely to miss | Foes' attacks are 6.3% more likely to miss |
| multi-hit | Swarm | Moves that hit several times hit at least 2 times | Moves that hit several times hit at least 2 times | Moves that hit several times hit at least 3 times |
| vampire | Vampire | Your Pokémon heal 2.1% of the damage they deal | Your Pokémon heal 5.3% of the damage they deal | Your Pokémon heal 9.5% of the damage they deal |
| thorns | Spikes | Foes that hit your Pokémon with a contact move lose 1.4% of their max HP | Foes that hit your Pokémon with a contact move lose 3.5% of their max HP | Foes that hit your Pokémon with a contact move lose 6.3% of their max HP |
| regen | Regrowth | Your Pokémon heal 0.7% of their max HP at the end of every turn | Your Pokémon heal 1.7% of their max HP at the end of every turn | Your Pokémon heal 3.2% of their max HP at the end of every turn |
| ko-heal | Spoils of War | A Pokémon that knocks out a foe heals 2.8% of its max HP | A Pokémon that knocks out a foe heals 8.1% of its max HP | A Pokémon that knocks out a foe heals 15.1% of its max HP |
| second-wind | Second Wind | When one of your Pokémon would faint, there is a 5% chance it hangs on with 1 HP instead (once per battle) | When one of your Pokémon would faint, there is a 14% chance it hangs on with 1 HP instead (once per battle) | When one of your Pokémon would faint, there is a 26% chance it hangs on with 1 HP instead (once per battle) |
| stat-atk | Brawler | Your Pokémon's Attack is 1.4% higher | Your Pokémon's Attack is 3.5% higher | Your Pokémon's Attack is 6.3% higher |
| stat-spa | Mind Over Matter | Your Pokémon's Sp. Atk is 1.4% higher | Your Pokémon's Sp. Atk is 3.5% higher | Your Pokémon's Sp. Atk is 6.3% higher |
| stat-def | Iron Skin | Your Pokémon's Defense is 1.4% higher | Your Pokémon's Defense is 3.5% higher | Your Pokémon's Defense is 6.3% higher |
| stat-spd | Dragon Scales | Your Pokémon's Sp. Def is 1.4% higher | Your Pokémon's Sp. Def is 3.5% higher | Your Pokémon's Sp. Def is 6.3% higher |
| stat-spe | Tailwind | Your Pokémon's Speed is 1.4% higher | Your Pokémon's Speed is 3.5% higher | Your Pokémon's Speed is 6.3% higher |
| para-ward | Static Guard | Each time something tries to paralyze one of your Pokémon, there is a 10% chance it is stopped | Each time something tries to paralyze one of your Pokémon, there is a 31% chance it is stopped | Each time something tries to paralyze one of your Pokémon, there is a 59% chance it is stopped |
| poison-ward | Antidote Charm | Each time something tries to poison one of your Pokémon, there is a 10% chance it is stopped | Each time something tries to poison one of your Pokémon, there is a 31% chance it is stopped | Each time something tries to poison one of your Pokémon, there is a 59% chance it is stopped |
| burn-ward | Frost Veil | Each time something tries to burn one of your Pokémon, there is a 10% chance it is stopped | Each time something tries to burn one of your Pokémon, there is a 31% chance it is stopped | Each time something tries to burn one of your Pokémon, there is a 59% chance it is stopped |
| sleep-ward | Wide Awake | Each time something tries to put to sleep one of your Pokémon, there is a 10% chance it is stopped | Each time something tries to put to sleep one of your Pokémon, there is a 31% chance it is stopped | Each time something tries to put to sleep one of your Pokémon, there is a 59% chance it is stopped |
| rain-start | Rainmaker | Rain starts when every battle begins and lasts 3 turns | Rain starts when every battle begins and lasts 4 turns | Rain starts when every battle begins and lasts 5 turns |
| fire-boost | Sunbringer | Your Fire moves do 2.8% more damage | Your Fire moves do 7% more damage | Your Fire moves do 12.6% more damage |
| rock-boost | Sand Caller | Your Rock, Ground and Steel moves do 2.8% more damage | Your Rock, Ground and Steel moves do 7% more damage | Your Rock, Ground and Steel moves do 12.6% more damage |
| ice-boost | Cold Snap | Your Ice moves do 2.8% more damage | Your Ice moves do 7% more damage | Your Ice moves do 12.6% more damage |
| recruit | Extra Recruit | Every recruit screen shows 1 more card | Every recruit screen shows 1 more card | Every recruit screen shows 1 more card and lets you take 1 more Pokémon |
| swap | Swap | On every recruit screen you can trade one of your Pokémon for any card, once. A trade doesn't use a pick | On every recruit screen you can trade one of your Pokémon for any card, once. A trade doesn't use a pick | On every recruit screen you can trade one of your Pokémon for any card, twice. A trade doesn't use a pick |
| reroll | Reroller | 1 extra free reroll on every recruit screen | 1 extra free reroll on every recruit screen | 2 extra free rerolls on every recruit screen |
| scout | Scout | 1 extra card on every recruit screen and item screen | 1 extra card on every recruit screen and item screen | 2 extra cards on every recruit screen and item screen |
| wallet | Lucky Wallet | You earn 3.5% more prize money after every win | You earn 8.8% more prize money after every win | You earn 15.8% more prize money after every win |
| hidden | Hidden Potential | 2.1% extra chance that a recruit has its Hidden Ability | 5.3% extra chance that a recruit has its Hidden Ability | 9.5% extra chance that a recruit has its Hidden Ability |
| gift | Gift Box | Every item screen shows 1 more card | Every item screen shows 1 more card | Every item screen shows 1 more card and lets you take 1 more item |
| tm | TM Master | After every win there is a 7% chance to get a second TM | After every win there is a 17.5% chance to get a second TM | After every win there is a 31.5% chance to get a second TM |
| interest | Interest | After every win you earn 2% of the money you hold (at most ₽60) | After every win you earn 4.1% of the money you hold (at most ₽135) | After every win you earn 6.9% of the money you hold (at most ₽235) |
| haggler | Haggler | Everything in the shop costs 2.1% less | Everything in the shop costs 5.3% less | Everything in the shop costs 9.5% less |

#### Set bonus

Badges from the **same generation** anywhere in your case give all your Pokémon a small **stat bonus** (Attack, Defense, Sp. Atk, Sp. Def and Speed) in battle. Every generation counts on its own and the bonuses add up, so 3 + 3 badges from two generations give 2 × the first tier, while a full set of 8 gives the most.

| Badges of one generation | Stat bonus |
|---|---|
| 3 | 2% |
| 5 | 4% |
| 8 | 6% |

Badge images: the official gym badge art from the [PokeAPI sprites](https://github.com/PokeAPI/sprites) repository, scaled down to 40 px pixel icons by `python3 tools/make-badge-images.py` (`images/badges/<gen>-<gym>.png`).

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
- **Leader Pokémon** can be any species from the **National Dex up to Gen 4 (#001–493)** in Gens 1–4, and up to **Gen 5 (#001–649)** for Unova, whatever the Challenge Gen. Teams can follow a theme rather than a strict single type (e.g. Lorelei's Water/Ice).
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
| 5 | Unova | Black 2 / White 2 | Hugh, Bianca or Cheren |

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
- To rebuild the lists from scratch: `node tools/build-pools.mjs <gen>` (filler and signature lists are at the top of that file, keyed `<gen>:<trainer id>`).

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
| 3 | Rotom, Lanturn, Magneton, Raichu, Manectric, Electrode | Forretress |
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

#### Team pools — Gen 2 (Johto)

##### Gym Leader Falkner · Flying (`gen2:falkner`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Caterpie, Wurmple, Magikarp, Metapod, Silcoon, Burmy |
| 1 | Combee, Zubat, Starly, Hoppip, Pidgey, Spearow, Hoothoot, Ledyba, Taillow, Wingull, Doduo, Swablu, Natu, Delibird, Skiploom, Staravia, Drifloon, Pidgeotto | Nincada, Surskit, Dratini, Bagon, Charmander |
| 2 | Farfetch’d, Butterfree, Beautifly, Ledian, Yanma, Togetic, Murkrow, Chatot, Masquerain, Mothim | Charmeleon, Dragonair, Shelgon |
| 3 | Gligar, Swellow, Pelipper, Fearow, Noctowl, Jumpluff, Golbat, Ninjask, Dodrio, Tropius, Mantine, Skarmory, Pidgeot, Xatu, Vespiquen, Staraptor | — |
| 4 | Altaria, Drifblim, Scyther, Honchkrow, Gliscor, Aerodactyl, Yanmega, Charizard | — |
| 5 | Crobat, Gyarados, Togekiss, Articuno, Zapdos, Moltres, Dragonite, Salamence, Lugia, Ho-Oh, Rayquaza | — |

##### Gym Leader Bugsy · Bug (`gen2:bugsy`)

| Group | Species | Filler |
|---|---|---|
| 0 | Kricketot, Caterpie, Weedle, Wurmple, Metapod, Kakuna, Silcoon, Cascoon, Burmy, Shedinja | — |
| 1 | Combee, Spinarak, Ledyba, Nincada, Surskit, Paras, Pineco, Venonat, Skorupi | — |
| 2 | Anorith, Kricketune, Butterfree, Beedrill, Beautifly, Dustox, Ledian, Ariados, Yanma, Volbeat, Illumise, Parasect, Masquerain, Wormadam, Mothim | Kabuto |
| 3 | Venomoth, Ninjask, Forretress, Vespiquen | — |
| 4 | Armaldo, Scyther, Pinsir, Scizor, Heracross, Shuckle, Yanmega | Kabutops |
| 5 | — | — |

##### Gym Leader Whitney · Normal (`gen2:whitney`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Sentret, Zigzagoon, Whismur, Starly, Smeargle, Bidoof, Pidgey, Rattata, Skitty, Spearow, Hoothoot, Jigglypuff, Taillow, Slakoth, Ditto, Meowth, Snubbull, Doduo, Swablu, Glameow, Clefairy, Eevee, Teddiursa, Staravia, Pidgeotto | — |
| 2 | Buneary, Farfetch’d, Aipom, Loudred, Spinda, Delcatty, Lickitung, Porygon, Togetic, Bibarel, Chatot, Raticate, Furret, Dunsparce, Linoone, Castform, Wigglytuff | — |
| 3 | Swellow, Persian, Vigoroth, Kecleon, Fearow, Noctowl, Chansey, Granbull, Purugly, Girafarig, Zangoose, Dodrio, Stantler, Pidgeot, Clefable, Staraptor, Exploud, Lopunny, Ambipom | — |
| 4 | Kangaskhan, Tauros, Miltank, Ursaring, Porygon2, Lickilicky | — |
| 5 | Porygon-Z, Snorlax, Blissey, Togekiss, Slaking, Regigigas, Arceus | — |

##### Gym Leader Morty · Ghost (`gen2:morty`)

| Group | Species | Filler |
|---|---|---|
| 0 | Shedinja | — |
| 1 | Shuppet, Duskull, Gastly, Drifloon | Zubat, Nincada, Ekans, Snorunt |
| 2 | Sableye, Haunter | — |
| 3 | Misdreavus, Rotom, Banette, Dusclops, Froslass, Spiritomb | Arbok, Golbat |
| 4 | Mismagius, Drifblim, Gengar, Dusknoir | — |
| 5 | Giratina | Crobat |

##### Gym Leader Chuck · Fighting (`gen2:chuck`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Makuhita, Meditite, Croagunk, Mankey, Machop | Ralts, Kirlia, Shroomish, Poliwag, Chimchar, Torchic |
| 2 | Machoke, Combusken, Monferno, Medicham | Poliwhirl |
| 3 | Primeape, Hitmonlee, Hitmonchan, Hitmontop, Breloom, Hariyama | — |
| 4 | Toxicroak, Poliwrath, Heracross, Machamp, Gallade, Lucario, Blaziken, Infernape | — |
| 5 | — | — |

##### Gym Leader Jasmine · Steel (`gen2:jasmine`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Beldum, Bronzor, Magnemite, Aron | Pineco, Piplup |
| 2 | Shieldon, Mawile, Metang | Nosepass, Onix, Prinplup |
| 3 | Lairon, Magneton, Forretress, Skarmory | — |
| 4 | Bastiodon, Scizor, Bronzong, Steelix, Lucario, Probopass, Aggron, Empoleon | Scyther |
| 5 | Magnezone, Registeel, Metagross, Jirachi, Heatran, Dialga | — |

##### Gym Leader Pryce · Ice (`gen2:pryce`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Swinub, Spheal, Snorunt, Delibird, Snover | Shellder, Slowpoke, Seel |
| 2 | Sealeo | — |
| 3 | Sneasel, Piloswine, Jynx, Dewgong, Glalie, Froslass | — |
| 4 | Abomasnow, Weavile, Cloyster, Glaceon, Walrein, Mamoswine | Slowbro, Slowking |
| 5 | Lapras, Articuno, Regice | — |

##### Gym Leader Clair · Dragon (`gen2:clair`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Magikarp |
| 1 | Dratini, Bagon, Gible, Vibrava | Trapinch, Horsea, Charmander, Swablu |
| 2 | Gabite, Dragonair, Shelgon | Charmeleon |
| 3 | — | Seadra |
| 4 | Altaria, Flygon | Aerodactyl, Charizard |
| 5 | Kingdra, Dragonite, Salamence, Latias, Latios, Garchomp, Rayquaza, Dialga, Palkia, Giratina | Gyarados |

##### Elite Four Will · Psychic (`gen2:will`)

| Group | Species | Filler |
|---|---|---|
| 0 | Unown | — |
| 1 | Ralts, Kirlia, Meditite, Baltoy, Beldum, Bronzor, Abra, Slowpoke, Natu, Exeggcute, Drowzee, Spoink | Staryu |
| 2 | Kadabra, Wobbuffet, Medicham, Metang, Chimecho | — |
| 3 | Lunatone, Solrock, Jynx, Girafarig, Mr. Mime, Xatu, Grumpig, Hypno | — |
| 4 | Alakazam, Slowbro, Slowking, Claydol, Bronzong, Gardevoir, Gallade, Exeggutor, Starmie, Espeon | — |
| 5 | Uxie, Mesprit, Azelf, Mew, Celebi, Metagross, Latias, Latios, Jirachi, Deoxys, Cresselia, Mewtwo, Lugia | — |

##### Elite Four Koga · Poison (`gen2:koga`)

| Group | Species | Filler |
|---|---|---|
| 0 | Weedle, Kakuna | Wurmple, Cascoon |
| 1 | Zubat, Spinarak, Nidoran♂, Nidoran♀, Ekans, Bellsprout, Croagunk, Gulpin, Venonat, Gastly, Bulbasaur, Oddish, Grimer, Stunky, Skorupi, Tentacool, Koffing | Nincada, Pineco |
| 2 | Nidorina, Nidorino, Beedrill, Dustox, Weepinbell, Ariados, Gloom, Roselia, Ivysaur, Haunter | — |
| 3 | Qwilfish, Arbok, Venomoth, Golbat, Seviper, Swalot, Skuntank, Vileplume, Victreebel | Ninjask, Forretress |
| 4 | Weezing, Toxicroak, Nidoqueen, Nidoking, Muk, Gengar, Drapion, Roserade, Tentacruel, Venusaur | — |
| 5 | Crobat | — |

##### Elite Four Bruno · Fighting (`gen2:bruno`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Makuhita, Meditite, Croagunk, Mankey, Machop | Ralts, Kirlia, Shroomish, Poliwag, Chimchar, Torchic |
| 2 | Machoke, Combusken, Monferno, Medicham | Poliwhirl, Onix |
| 3 | Primeape, Hitmonlee, Hitmonchan, Hitmontop, Breloom, Hariyama | — |
| 4 | Toxicroak, Poliwrath, Heracross, Machamp, Gallade, Lucario, Blaziken, Infernape | Steelix |
| 5 | — | — |

##### Elite Four Karen · Dark (`gen2:karen`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Poochyena, Carvanha, Stunky, Houndour, Nuzleaf | Seedot, Larvitar, Corphish, Oddish, Skorupi, Cacnea |
| 2 | Sableye, Murkrow, Mightyena | Gloom, Pupitar |
| 3 | Sneasel, Sharpedo, Absol, Crawdaunt, Cacturne, Skuntank, Shiftry, Spiritomb | Vileplume |
| 4 | Houndoom, Drapion, Honchkrow, Weavile, Umbreon | — |
| 5 | Tyranitar, Darkrai | — |

##### Champion Lance · Dragon (`gen2:lance`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Magikarp |
| 1 | Dratini, Bagon, Gible, Vibrava | Trapinch, Horsea, Charmander, Swablu |
| 2 | Gabite, Dragonair, Shelgon | Charmeleon |
| 3 | — | Seadra |
| 4 | Altaria, Flygon | Aerodactyl, Charizard |
| 5 | Kingdra, Dragonite, Salamence, Latias, Latios, Garchomp, Rayquaza, Dialga, Palkia, Giratina | Gyarados |

##### Silver (Final Rival) · signature lines (`gen2:rival-silver`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Zubat, Horsea, Cyndaquil, Abra, Gastly, Totodile, Chikorita, Magnemite, Houndour, Koffing | — |
| 2 | Kadabra, Haunter, Bayleef, Quilava, Croconaw, Murkrow | — |
| 3 | Sneasel, Seadra, Golbat, Magneton | — |
| 4 | Alakazam, Weezing, Gengar, Houndoom, Honchkrow, Weavile, Meganium, Feraligatr, Typhlosion | — |
| 5 | Crobat, Magnezone, Kingdra | — |

##### Gold (Final Rival) · signature lines (`gen2:rival-gold`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Mareep, Pikachu, Dratini, Cyndaquil, Gastly, Totodile, Chikorita, Eevee | — |
| 2 | Flaaffy, Haunter, Bayleef, Quilava, Croconaw, Togetic, Sudowoodo, Dragonair | — |
| 3 | Raichu | — |
| 4 | Tauros, Gengar, Scyther, Ampharos, Scizor, Meganium, Espeon, Umbreon, Feraligatr, Typhlosion | — |
| 5 | Lapras, Snorlax, Togekiss, Dragonite | — |

#### Team pools — Gen 3 (Hoenn)

##### Gym Leader Roxanne · Rock (`gen3:roxanne`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Geodude, Larvitar, Aron, Rhyhorn | Slugma |
| 2 | Cranidos, Shieldon, Omanyte, Kabuto, Lileep, Anorith, Nosepass, Corsola, Onix, Graveler, Sudowoodo, Magcargo, Pupitar | — |
| 3 | Lairon, Lunatone, Solrock, Golem, Rhydon, Relicanth | — |
| 4 | Omastar, Kabutops, Cradily, Armaldo, Rampardos, Bastiodon, Shuckle, Aerodactyl, Probopass, Aggron | — |
| 5 | Rhyperior, Regirock, Tyranitar | — |

##### Gym Leader Brawly · Fighting (`gen3:brawly`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Makuhita, Meditite, Croagunk, Mankey, Machop | Ralts, Kirlia, Shroomish, Poliwag, Chimchar, Torchic |
| 2 | Machoke, Combusken, Monferno, Medicham | Poliwhirl |
| 3 | Primeape, Hitmonlee, Hitmonchan, Hitmontop, Breloom, Hariyama | — |
| 4 | Toxicroak, Poliwrath, Heracross, Machamp, Gallade, Lucario, Blaziken, Infernape | — |
| 5 | — | — |

##### Gym Leader Wattson · Electric (`gen3:wattson`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Shinx, Mareep, Electrike, Pikachu, Magnemite, Voltorb, Chinchou | Bronzor |
| 2 | Luxio, Flaaffy, Plusle, Minun, Pachirisu | Porygon |
| 3 | Rotom, Lanturn, Magneton, Raichu, Manectric, Electrode | Forretress |
| 4 | Electabuzz, Ampharos, Luxray, Jolteon | Bronzong, Porygon2 |
| 5 | Magnezone, Electivire, Zapdos, Raikou | Porygon-Z |

##### Gym Leader Flannery · Fire (`gen3:flannery`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Slugma, Vulpix, Numel, Charmander, Cyndaquil, Chimchar, Torchic, Houndour | — |
| 2 | Growlithe, Charmeleon, Quilava, Combusken, Monferno, Ponyta, Magcargo | Castform |
| 3 | Camerupt, Torkoal | — |
| 4 | Magmar, Rapidash, Houndoom, Ninetales, Flareon, Blaziken, Charizard, Typhlosion, Infernape | — |
| 5 | Magmortar, Arcanine, Moltres, Entei, Heatran, Ho-Oh | — |

##### Gym Leader Norman · Normal (`gen3:norman`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Sentret, Zigzagoon, Whismur, Starly, Smeargle, Bidoof, Pidgey, Rattata, Skitty, Spearow, Hoothoot, Jigglypuff, Taillow, Slakoth, Ditto, Meowth, Snubbull, Doduo, Swablu, Glameow, Clefairy, Eevee, Teddiursa, Staravia, Pidgeotto | — |
| 2 | Buneary, Farfetch’d, Aipom, Loudred, Spinda, Delcatty, Lickitung, Porygon, Togetic, Bibarel, Chatot, Raticate, Furret, Dunsparce, Linoone, Castform, Wigglytuff | — |
| 3 | Swellow, Persian, Vigoroth, Kecleon, Fearow, Noctowl, Chansey, Granbull, Purugly, Girafarig, Zangoose, Dodrio, Stantler, Pidgeot, Clefable, Staraptor, Exploud, Lopunny, Ambipom | — |
| 4 | Kangaskhan, Tauros, Miltank, Ursaring, Porygon2, Lickilicky | — |
| 5 | Porygon-Z, Snorlax, Blissey, Togekiss, Slaking, Regigigas, Arceus | — |

##### Gym Leader Winona · Flying (`gen3:winona`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Caterpie, Wurmple, Magikarp, Metapod, Silcoon, Burmy |
| 1 | Combee, Zubat, Starly, Hoppip, Pidgey, Spearow, Hoothoot, Ledyba, Taillow, Wingull, Doduo, Swablu, Natu, Delibird, Skiploom, Staravia, Drifloon, Pidgeotto | Nincada, Surskit, Dratini, Bagon, Charmander |
| 2 | Farfetch’d, Butterfree, Beautifly, Ledian, Yanma, Togetic, Murkrow, Chatot, Masquerain, Mothim | Charmeleon, Dragonair, Shelgon |
| 3 | Gligar, Swellow, Pelipper, Fearow, Noctowl, Jumpluff, Golbat, Ninjask, Dodrio, Tropius, Mantine, Skarmory, Pidgeot, Xatu, Vespiquen, Staraptor | — |
| 4 | Altaria, Drifblim, Scyther, Honchkrow, Gliscor, Aerodactyl, Yanmega, Charizard | — |
| 5 | Crobat, Gyarados, Togekiss, Articuno, Zapdos, Moltres, Dragonite, Salamence, Lugia, Ho-Oh, Rayquaza | — |

##### Gym Leader Tate & Liza · Psychic (`gen3:tate-and-liza`)

| Group | Species | Filler |
|---|---|---|
| 0 | Unown | — |
| 1 | Ralts, Kirlia, Meditite, Baltoy, Beldum, Bronzor, Abra, Slowpoke, Natu, Exeggcute, Drowzee, Spoink | Venonat, Staryu |
| 2 | Kadabra, Wobbuffet, Medicham, Metang, Chimecho | — |
| 3 | Lunatone, Solrock, Jynx, Girafarig, Mr. Mime, Xatu, Grumpig, Hypno | Venomoth |
| 4 | Alakazam, Slowbro, Slowking, Claydol, Bronzong, Gardevoir, Gallade, Exeggutor, Starmie, Espeon | — |
| 5 | Uxie, Mesprit, Azelf, Mew, Celebi, Metagross, Latias, Latios, Jirachi, Deoxys, Cresselia, Mewtwo, Lugia | — |

##### Gym Leader Juan · Water (`gen3:juan`)

| Group | Species | Filler |
|---|---|---|
| 0 | Magikarp, Feebas | — |
| 1 | Wooper, Lotad, Marill, Surskit, Wingull, Barboach, Spheal, Horsea, Poliwag, Remoraid, Shellder, Carvanha, Corphish, Mudkip, Squirtle, Totodile, Piplup, Slowpoke, Psyduck, Goldeen, Seel, Krabby, Shellos, Chinchou, Luvdisc, Buizel, Finneon, Tentacool, Staryu, Lombre, Clamperl | Bidoof |
| 2 | Omanyte, Kabuto, Corsola, Poliwhirl, Wailmer, Wartortle, Croconaw, Marshtomp, Prinplup, Azumarill, Sealeo, Bibarel | — |
| 3 | Quagsire, Qwilfish, Pelipper, Seadra, Seaking, Lanturn, Sharpedo, Lumineon, Mantine, Whiscash, Crawdaunt, Dewgong, Kingler, Gastrodon, Octillery, Ludicolo, Phione, Huntail, Gorebyss, Relicanth | — |
| 4 | Slowbro, Slowking, Omastar, Kabutops, Floatzel, Golduck, Poliwrath, Politoed, Wailord, Tentacruel, Starmie, Cloyster, Vaporeon, Blastoise, Feraligatr, Walrein, Empoleon | — |
| 5 | Lapras, Swampert, Gyarados, Kingdra, Milotic, Suicune, Manaphy, Kyogre, Palkia | — |

##### Elite Four Sidney · Dark (`gen3:sidney`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Poochyena, Carvanha, Stunky, Houndour, Nuzleaf | Seedot, Larvitar, Corphish, Skorupi, Cacnea |
| 2 | Sableye, Murkrow, Mightyena | Pupitar |
| 3 | Sneasel, Sharpedo, Absol, Crawdaunt, Cacturne, Skuntank, Shiftry, Spiritomb | — |
| 4 | Houndoom, Drapion, Honchkrow, Weavile, Umbreon | — |
| 5 | Tyranitar, Darkrai | — |

##### Elite Four Phoebe · Ghost (`gen3:phoebe`)

| Group | Species | Filler |
|---|---|---|
| 0 | Shedinja | — |
| 1 | Shuppet, Duskull, Gastly, Drifloon | Zubat, Nincada, Ekans, Snorunt |
| 2 | Sableye, Haunter | — |
| 3 | Misdreavus, Rotom, Banette, Dusclops, Froslass, Spiritomb | Arbok, Golbat |
| 4 | Mismagius, Drifblim, Gengar, Dusknoir | — |
| 5 | Giratina | Crobat |

##### Elite Four Glacia · Ice (`gen3:glacia`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Swinub, Spheal, Snorunt, Delibird, Snover | Shellder, Slowpoke, Seel |
| 2 | Sealeo | — |
| 3 | Sneasel, Piloswine, Jynx, Dewgong, Glalie, Froslass | — |
| 4 | Abomasnow, Weavile, Cloyster, Glaceon, Walrein, Mamoswine | Slowbro, Slowking |
| 5 | Lapras, Articuno, Regice | — |

##### Elite Four Drake · Dragon (`gen3:drake`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Magikarp |
| 1 | Dratini, Bagon, Gible, Vibrava | Trapinch, Horsea, Charmander, Swablu |
| 2 | Gabite, Dragonair, Shelgon | Charmeleon |
| 3 | — | Seadra |
| 4 | Altaria, Flygon | Aerodactyl, Charizard |
| 5 | Kingdra, Dragonite, Salamence, Latias, Latios, Garchomp, Rayquaza, Dialga, Palkia, Giratina | Gyarados |

##### Champion Wallace · Water (`gen3:wallace`)

| Group | Species | Filler |
|---|---|---|
| 0 | Magikarp, Feebas | — |
| 1 | Wooper, Lotad, Marill, Surskit, Wingull, Barboach, Spheal, Horsea, Poliwag, Remoraid, Shellder, Carvanha, Corphish, Mudkip, Squirtle, Totodile, Piplup, Slowpoke, Psyduck, Goldeen, Seel, Krabby, Shellos, Chinchou, Luvdisc, Buizel, Finneon, Tentacool, Staryu, Lombre, Clamperl | Bidoof |
| 2 | Omanyte, Kabuto, Corsola, Poliwhirl, Wailmer, Wartortle, Croconaw, Marshtomp, Prinplup, Azumarill, Sealeo, Bibarel | — |
| 3 | Quagsire, Qwilfish, Pelipper, Seadra, Seaking, Lanturn, Sharpedo, Lumineon, Mantine, Whiscash, Crawdaunt, Dewgong, Kingler, Gastrodon, Octillery, Ludicolo, Phione, Huntail, Gorebyss, Relicanth | — |
| 4 | Slowbro, Slowking, Omastar, Kabutops, Floatzel, Golduck, Poliwrath, Politoed, Wailord, Tentacruel, Starmie, Cloyster, Vaporeon, Blastoise, Feraligatr, Walrein, Empoleon | — |
| 5 | Lapras, Swampert, Gyarados, Kingdra, Milotic, Suicune, Manaphy, Kyogre, Palkia | — |

##### Brendan (Final Rival) · signature lines (`gen3:rival-brendan`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Ralts, Lotad, Zigzagoon, Zubat, Wingull, Kirlia, Slakoth, Trapinch, Spheal, Electrike, Bagon, Abra, Treecko, Torchic, Mudkip, Aron, Lombre, Vibrava | — |
| 2 | Kadabra, Grovyle, Combusken, Marshtomp, Sealeo, Linoone, Shelgon | — |
| 3 | Pelipper, Lairon, Vigoroth, Golbat, Manectric, Ludicolo | — |
| 4 | Alakazam, Gardevoir, Flygon, Sceptile, Blaziken, Aggron, Walrein | — |
| 5 | Crobat, Swampert, Salamence, Slaking | — |

##### May (Final Rival) · signature lines (`gen3:rival-may`)

| Group | Species | Filler |
|---|---|---|
| 0 | Feebas | — |
| 1 | Ralts, Skitty, Taillow, Kirlia, Trapinch, Spheal, Bagon, Numel, Treecko, Torchic, Mudkip, Swablu, Chinchou, Vibrava | — |
| 2 | Delcatty, Roselia, Grovyle, Combusken, Marshtomp, Sealeo, Shelgon | — |
| 3 | Swellow, Lanturn, Camerupt, Absol | — |
| 4 | Altaria, Roserade, Gardevoir, Flygon, Sceptile, Blaziken, Walrein | — |
| 5 | Swampert, Milotic, Salamence | — |

#### Team pools — Gen 4 (Sinnoh)

##### Gym Leader Roark · Rock (`gen4:roark`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Geodude, Larvitar, Aron, Rhyhorn | Slugma |
| 2 | Cranidos, Shieldon, Omanyte, Kabuto, Lileep, Anorith, Nosepass, Corsola, Onix, Graveler, Sudowoodo, Magcargo, Pupitar | — |
| 3 | Lairon, Lunatone, Solrock, Golem, Rhydon, Relicanth | — |
| 4 | Omastar, Kabutops, Cradily, Armaldo, Rampardos, Bastiodon, Shuckle, Aerodactyl, Probopass, Aggron | — |
| 5 | Rhyperior, Regirock, Tyranitar | — |

##### Gym Leader Gardenia · Grass (`gen4:gardenia`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Burmy |
| 1 | Sunkern, Lotad, Seedot, Hoppip, Cherubi, Paras, Shroomish, Bellsprout, Treecko, Bulbasaur, Chikorita, Turtwig, Oddish, Exeggcute, Snover, Cacnea, Skiploom, Lombre, Nuzleaf | — |
| 2 | Lileep, Weepinbell, Gloom, Roselia, Ivysaur, Parasect, Bayleef, Grovyle, Grotle, Wormadam, Sunflora | — |
| 3 | Tangela, Jumpluff, Cherrim, Carnivine, Breloom, Tropius, Cacturne, Vileplume, Victreebel, Bellossom, Ludicolo, Shiftry | — |
| 4 | Abomasnow, Cradily, Roserade, Exeggutor, Venusaur, Meganium, Torterra, Leafeon, Sceptile | — |
| 5 | Tangrowth, Celebi, Shaymin | — |

##### Gym Leader Fantina · Ghost (`gen4:fantina`)

| Group | Species | Filler |
|---|---|---|
| 0 | Shedinja | — |
| 1 | Shuppet, Duskull, Gastly, Drifloon | Zubat, Nincada, Ekans, Snorunt |
| 2 | Sableye, Haunter | — |
| 3 | Misdreavus, Rotom, Banette, Dusclops, Froslass, Spiritomb | Arbok, Golbat |
| 4 | Mismagius, Drifblim, Gengar, Dusknoir | — |
| 5 | Giratina | Crobat |

##### Gym Leader Maylene · Fighting (`gen4:maylene`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Makuhita, Meditite, Croagunk, Mankey, Machop | Ralts, Kirlia, Shroomish, Poliwag, Chimchar, Torchic |
| 2 | Machoke, Combusken, Monferno, Medicham | Poliwhirl |
| 3 | Primeape, Hitmonlee, Hitmonchan, Hitmontop, Breloom, Hariyama | — |
| 4 | Toxicroak, Poliwrath, Heracross, Machamp, Gallade, Lucario, Blaziken, Infernape | — |
| 5 | — | — |

##### Gym Leader Crasher Wake · Water (`gen4:crasher-wake`)

| Group | Species | Filler |
|---|---|---|
| 0 | Magikarp, Feebas | — |
| 1 | Wooper, Lotad, Marill, Surskit, Wingull, Barboach, Spheal, Horsea, Poliwag, Remoraid, Shellder, Carvanha, Corphish, Mudkip, Squirtle, Totodile, Piplup, Slowpoke, Psyduck, Goldeen, Seel, Krabby, Shellos, Chinchou, Luvdisc, Buizel, Finneon, Tentacool, Staryu, Lombre, Clamperl | Bidoof |
| 2 | Omanyte, Kabuto, Corsola, Poliwhirl, Wailmer, Wartortle, Croconaw, Marshtomp, Prinplup, Azumarill, Sealeo, Bibarel | — |
| 3 | Quagsire, Qwilfish, Pelipper, Seadra, Seaking, Lanturn, Sharpedo, Lumineon, Mantine, Whiscash, Crawdaunt, Dewgong, Kingler, Gastrodon, Octillery, Ludicolo, Phione, Huntail, Gorebyss, Relicanth | — |
| 4 | Slowbro, Slowking, Omastar, Kabutops, Floatzel, Golduck, Poliwrath, Politoed, Wailord, Tentacruel, Starmie, Cloyster, Vaporeon, Blastoise, Feraligatr, Walrein, Empoleon | — |
| 5 | Lapras, Swampert, Gyarados, Kingdra, Milotic, Suicune, Manaphy, Kyogre, Palkia | — |

##### Gym Leader Byron · Steel (`gen4:byron`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Beldum, Bronzor, Magnemite, Aron | Pineco, Piplup |
| 2 | Shieldon, Mawile, Metang | Nosepass, Onix, Prinplup |
| 3 | Lairon, Magneton, Forretress, Skarmory | — |
| 4 | Bastiodon, Scizor, Bronzong, Steelix, Lucario, Probopass, Aggron, Empoleon | Scyther |
| 5 | Magnezone, Registeel, Metagross, Jirachi, Heatran, Dialga | — |

##### Gym Leader Candice · Ice (`gen4:candice`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Swinub, Spheal, Snorunt, Delibird, Snover | Meditite, Shellder, Slowpoke, Seel |
| 2 | Sealeo | Medicham |
| 3 | Sneasel, Piloswine, Jynx, Dewgong, Glalie, Froslass | — |
| 4 | Abomasnow, Weavile, Cloyster, Glaceon, Walrein, Mamoswine | Slowbro |
| 5 | Lapras, Articuno, Regice | — |

##### Gym Leader Volkner · Electric (`gen4:volkner`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Shinx, Mareep, Electrike, Pikachu, Magnemite, Voltorb, Chinchou | Remoraid |
| 2 | Luxio, Flaaffy, Plusle, Minun, Pachirisu | Porygon |
| 3 | Rotom, Lanturn, Magneton, Raichu, Manectric, Electrode | Octillery |
| 4 | Electabuzz, Ampharos, Luxray, Jolteon | Porygon2 |
| 5 | Magnezone, Electivire, Zapdos, Raikou | Porygon-Z |

##### Elite Four Aaron · Bug (`gen4:aaron`)

| Group | Species | Filler |
|---|---|---|
| 0 | Kricketot, Caterpie, Weedle, Wurmple, Metapod, Kakuna, Silcoon, Cascoon, Burmy, Shedinja | — |
| 1 | Combee, Spinarak, Ledyba, Nincada, Surskit, Paras, Pineco, Venonat, Skorupi | Oddish, Cacnea |
| 2 | Anorith, Kricketune, Butterfree, Beedrill, Beautifly, Dustox, Ledian, Ariados, Yanma, Volbeat, Illumise, Parasect, Masquerain, Wormadam, Mothim | Gloom |
| 3 | Venomoth, Ninjask, Forretress, Vespiquen | Cacturne, Vileplume |
| 4 | Armaldo, Scyther, Pinsir, Scizor, Heracross, Shuckle, Yanmega | — |
| 5 | — | — |

##### Elite Four Bertha · Ground (`gen4:bertha`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Wooper, Swinub, Diglett, Nincada, Barboach, Trapinch, Sandshrew, Geodude, Larvitar, Baltoy, Gible, Numel, Cubone, Phanpy, Hippopotas, Vibrava, Rhyhorn | Nidoran♂, Nidoran♀, Mudkip, Turtwig, Shellos |
| 2 | Onix, Graveler, Dugtrio, Marshtomp, Pupitar, Gabite, Marowak | Nidorina, Nidorino, Grotle |
| 3 | Quagsire, Gligar, Sandslash, Piloswine, Camerupt, Whiscash, Gastrodon, Golem, Rhydon | — |
| 4 | Nidoqueen, Nidoking, Donphan, Claydol, Steelix, Gliscor, Flygon, Torterra, Hippowdon, Mamoswine | — |
| 5 | Swampert, Rhyperior, Garchomp, Groudon | — |

##### Elite Four Flint · Fire (`gen4:flint`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Slugma, Vulpix, Numel, Charmander, Cyndaquil, Chimchar, Torchic, Houndour | — |
| 2 | Growlithe, Charmeleon, Quilava, Combusken, Monferno, Ponyta, Magcargo | — |
| 3 | Camerupt, Torkoal | — |
| 4 | Magmar, Rapidash, Houndoom, Ninetales, Flareon, Blaziken, Charizard, Typhlosion, Infernape | — |
| 5 | Magmortar, Arcanine, Moltres, Entei, Heatran, Ho-Oh | — |

##### Elite Four Lucian · Psychic (`gen4:lucian`)

| Group | Species | Filler |
|---|---|---|
| 0 | Unown | — |
| 1 | Ralts, Kirlia, Meditite, Baltoy, Beldum, Bronzor, Abra, Slowpoke, Natu, Exeggcute, Drowzee, Spoink | Venonat, Staryu |
| 2 | Kadabra, Wobbuffet, Medicham, Metang, Chimecho | — |
| 3 | Lunatone, Solrock, Jynx, Girafarig, Mr. Mime, Xatu, Grumpig, Hypno | Venomoth |
| 4 | Alakazam, Slowbro, Slowking, Claydol, Bronzong, Gardevoir, Gallade, Exeggutor, Starmie, Espeon | — |
| 5 | Uxie, Mesprit, Azelf, Mew, Celebi, Metagross, Latias, Latios, Jirachi, Deoxys, Cresselia, Mewtwo, Lugia | — |

##### Champion Cynthia · signature lines (`gen4:cynthia`)

| Group | Species | Filler |
|---|---|---|
| 0 | Feebas | — |
| 1 | Ralts, Kirlia, Dratini, Gible, Gastly, Eevee, Shellos | — |
| 2 | Roselia, Haunter, Togetic, Gabite, Dragonair | — |
| 3 | Sneasel, Gastrodon, Spiritomb | — |
| 4 | Gengar, Roserade, Weavile, Gallade, Lucario, Leafeon | — |
| 5 | Milotic, Togekiss, Dragonite, Garchomp | — |

##### Dawn (Final Rival) · signature lines (`gen4:rival-dawn`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Ralts, Starly, Kirlia, Chimchar, Piplup, Turtwig, Eevee, Houndour, Staravia | — |
| 2 | Buneary, Aipom, Roselia, Togetic, Grotle, Monferno, Prinplup | — |
| 3 | Staraptor, Lopunny, Ambipom | — |
| 4 | Houndoom, Roserade, Gardevoir, Vaporeon, Torterra, Lucario, Empoleon, Infernape | — |
| 5 | Togekiss | — |

##### Lucas (Final Rival) · signature lines (`gen4:rival-lucas`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Ralts, Starly, Shinx, Kirlia, Gible, Chimchar, Piplup, Turtwig, Magnemite, Buizel, Staravia | — |
| 2 | Aipom, Luxio, Roselia, Grotle, Monferno, Prinplup, Gabite | — |
| 3 | Magneton, Staraptor, Ambipom | — |
| 4 | Floatzel, Heracross, Roserade, Gallade, Luxray, Torterra, Empoleon, Infernape | — |
| 5 | Magnezone, Garchomp | — |

##### Barry (Final Rival) · signature lines (`gen4:rival-barry`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Starly, Gible, Chimchar, Abra, Piplup, Turtwig, Buizel, Staravia | — |
| 2 | Aipom, Kadabra, Roselia, Grotle, Monferno, Prinplup, Ponyta, Gabite | — |
| 3 | Staraptor, Ambipom | — |
| 4 | Alakazam, Floatzel, Rapidash, Heracross, Roserade, Torterra, Empoleon, Infernape | — |
| 5 | Snorlax, Garchomp | — |

#### Team pools — Gen 5 (Unova)

##### Gym Leader Cheren · Normal (`gen5:cheren`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Sentret, Zigzagoon, Whismur, Starly, Smeargle, Bidoof, Pidgey, Rattata, Patrat, Skitty, Spearow, Hoothoot, Pidove, Jigglypuff, Taillow, Lillipup, Slakoth, Ditto, Meowth, Snubbull, Minccino, Doduo, Swablu, Glameow, Clefairy, Eevee, Teddiursa, Deerling, Staravia, Pidgeotto | — |
| 2 | Buneary, Rufflet, Farfetch’d, Tranquill, Aipom, Loudred, Spinda, Herdier, Delcatty, Lickitung, Porygon, Togetic, Bibarel, Chatot, Raticate, Furret, Dunsparce, Linoone, Castform, Watchog, Wigglytuff | — |
| 3 | Swellow, Persian, Vigoroth, Kecleon, Fearow, Noctowl, Audino, Chansey, Granbull, Purugly, Girafarig, Zangoose, Dodrio, Stantler, Pidgeot, Cinccino, Clefable, Staraptor, Sawsbuck, Unfezant, Exploud, Lopunny, Ambipom | — |
| 4 | Kangaskhan, Tauros, Miltank, Stoutland, Bouffalant, Ursaring, Braviary, Porygon2, Lickilicky | — |
| 5 | Porygon-Z, Snorlax, Blissey, Togekiss, Meloetta, Slaking, Regigigas, Arceus | — |

##### Gym Leader Roxie · Poison (`gen5:roxie`)

| Group | Species | Filler |
|---|---|---|
| 0 | Weedle, Kakuna | Wurmple, Cascoon |
| 1 | Zubat, Spinarak, Venipede, Nidoran♂, Nidoran♀, Ekans, Foongus, Bellsprout, Croagunk, Gulpin, Venonat, Gastly, Bulbasaur, Oddish, Grimer, Stunky, Trubbish, Skorupi, Tentacool, Koffing | — |
| 2 | Whirlipede, Nidorina, Nidorino, Beedrill, Dustox, Weepinbell, Ariados, Gloom, Roselia, Ivysaur, Haunter | — |
| 3 | Qwilfish, Arbok, Venomoth, Golbat, Seviper, Amoonguss, Swalot, Garbodor, Scolipede, Skuntank, Vileplume, Victreebel | — |
| 4 | Weezing, Toxicroak, Nidoqueen, Nidoking, Muk, Gengar, Drapion, Roserade, Tentacruel, Venusaur | — |
| 5 | Crobat | — |

##### Gym Leader Burgh · Bug (`gen5:burgh`)

| Group | Species | Filler |
|---|---|---|
| 0 | Kricketot, Caterpie, Weedle, Wurmple, Metapod, Kakuna, Silcoon, Cascoon, Burmy, Shedinja | — |
| 1 | Combee, Spinarak, Venipede, Ledyba, Nincada, Surskit, Paras, Pineco, Venonat, Shelmet, Sewaddle, Karrablast, Joltik, Dwebble, Skorupi | — |
| 2 | Anorith, Whirlipede, Larvesta, Swadloon, Kricketune, Butterfree, Beedrill, Beautifly, Dustox, Ledian, Ariados, Yanma, Volbeat, Illumise, Parasect, Masquerain, Wormadam, Mothim | — |
| 3 | Venomoth, Ninjask, Forretress, Galvantula, Vespiquen, Scolipede, Crustle, Durant | — |
| 4 | Leavanny, Armaldo, Escavalier, Accelgor, Scyther, Pinsir, Scizor, Heracross, Shuckle, Yanmega | — |
| 5 | Volcarona, Genesect | — |

##### Gym Leader Elesa · Electric (`gen5:elesa`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Shinx, Tynamo, Mareep, Electrike, Blitzle, Pikachu, Joltik, Magnemite, Voltorb, Chinchou | — |
| 2 | Luxio, Flaaffy, Plusle, Minun, Pachirisu, Eelektrik, Emolga | — |
| 3 | Rotom, Lanturn, Magneton, Stunfisk, Galvantula, Raichu, Manectric, Electrode | — |
| 4 | Electabuzz, Zebstrika, Ampharos, Eelektross, Luxray, Jolteon | — |
| 5 | Magnezone, Electivire, Zapdos, Raikou, Thundurus, Zekrom | — |

##### Gym Leader Clay · Ground (`gen5:clay`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Wooper, Swinub, Diglett, Nincada, Barboach, Trapinch, Sandile, Sandshrew, Geodude, Larvitar, Baltoy, Gible, Golett, Numel, Cubone, Drilbur, Phanpy, Hippopotas, Vibrava, Rhyhorn | Nidoran♂, Nidoran♀, Tympole, Mudkip, Turtwig, Shellos |
| 2 | Krokorok, Palpitoad, Onix, Graveler, Dugtrio, Marshtomp, Pupitar, Gabite, Marowak | Nidorina, Nidorino, Grotle |
| 3 | Quagsire, Gligar, Sandslash, Piloswine, Camerupt, Whiscash, Stunfisk, Gastrodon, Golurk, Golem, Rhydon | — |
| 4 | Nidoqueen, Nidoking, Seismitoad, Donphan, Claydol, Excadrill, Krookodile, Steelix, Gliscor, Flygon, Torterra, Hippowdon, Mamoswine | — |
| 5 | Swampert, Rhyperior, Garchomp, Landorus, Groudon | — |

##### Gym Leader Skyla · Flying (`gen5:skyla`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Caterpie, Wurmple, Magikarp, Metapod, Silcoon, Burmy |
| 1 | Combee, Zubat, Starly, Hoppip, Pidgey, Spearow, Hoothoot, Pidove, Ledyba, Taillow, Wingull, Ducklett, Doduo, Swablu, Woobat, Natu, Delibird, Skiploom, Staravia, Drifloon, Pidgeotto | Nincada, Surskit, Dratini, Bagon, Charmander |
| 2 | Rufflet, Farfetch’d, Tranquill, Vullaby, Butterfree, Beautifly, Ledian, Yanma, Archen, Togetic, Murkrow, Chatot, Masquerain, Mothim, Swoobat, Emolga | Charmeleon, Dragonair, Shelgon |
| 3 | Gligar, Swellow, Pelipper, Fearow, Noctowl, Jumpluff, Golbat, Ninjask, Dodrio, Tropius, Mantine, Skarmory, Pidgeot, Xatu, Swanna, Vespiquen, Staraptor, Unfezant | — |
| 4 | Altaria, Sigilyph, Drifblim, Scyther, Honchkrow, Gliscor, Braviary, Mandibuzz, Aerodactyl, Yanmega, Charizard | — |
| 5 | Crobat, Gyarados, Togekiss, Archeops, Articuno, Zapdos, Moltres, Tornadus, Thundurus, Dragonite, Salamence, Landorus, Lugia, Ho-Oh, Rayquaza | — |

##### Gym Leader Drayden · Dragon (`gen5:drayden`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Magikarp |
| 1 | Dratini, Bagon, Gible, Deino, Axew, Vibrava | Trapinch, Horsea, Charmander, Swablu |
| 2 | Gabite, Fraxure, Dragonair, Shelgon, Zweilous | Charmeleon |
| 3 | Druddigon | Seadra |
| 4 | Altaria, Flygon | Aerodactyl, Charizard |
| 5 | Kingdra, Haxorus, Dragonite, Salamence, Latias, Latios, Garchomp, Hydreigon, Kyurem, Rayquaza, Dialga, Palkia, Giratina, Reshiram, Zekrom | Gyarados |

##### Gym Leader Marlon · Water (`gen5:marlon`)

| Group | Species | Filler |
|---|---|---|
| 0 | Magikarp, Feebas | — |
| 1 | Wooper, Lotad, Marill, Surskit, Wingull, Barboach, Spheal, Tympole, Horsea, Poliwag, Remoraid, Shellder, Carvanha, Ducklett, Corphish, Oshawott, Mudkip, Squirtle, Totodile, Piplup, Slowpoke, Panpour, Psyduck, Goldeen, Seel, Krabby, Shellos, Chinchou, Luvdisc, Buizel, Finneon, Tentacool, Frillish, Staryu, Lombre, Clamperl | Bidoof |
| 2 | Omanyte, Kabuto, Tirtouga, Corsola, Palpitoad, Poliwhirl, Wailmer, Wartortle, Croconaw, Marshtomp, Prinplup, Azumarill, Sealeo, Bibarel, Dewott | — |
| 3 | Quagsire, Qwilfish, Pelipper, Seadra, Seaking, Lanturn, Sharpedo, Lumineon, Basculin, Mantine, Whiscash, Crawdaunt, Alomomola, Swanna, Dewgong, Kingler, Gastrodon, Octillery, Ludicolo, Phione, Jellicent, Huntail, Gorebyss, Relicanth | — |
| 4 | Slowbro, Slowking, Omastar, Kabutops, Floatzel, Carracosta, Simipour, Seismitoad, Golduck, Poliwrath, Politoed, Wailord, Tentacruel, Starmie, Cloyster, Vaporeon, Samurott, Blastoise, Feraligatr, Walrein, Empoleon | — |
| 5 | Lapras, Swampert, Gyarados, Kingdra, Milotic, Suicune, Keldeo, Manaphy, Kyogre, Palkia | — |

##### Elite Four Shauntal · Ghost (`gen5:shauntal`)

| Group | Species | Filler |
|---|---|---|
| 0 | Shedinja | — |
| 1 | Litwick, Shuppet, Duskull, Yamask, Golett, Gastly, Frillish, Drifloon | Zubat, Nincada, Ekans, Snorunt |
| 2 | Lampent, Sableye, Haunter | — |
| 3 | Misdreavus, Rotom, Banette, Dusclops, Froslass, Jellicent, Cofagrigus, Golurk, Spiritomb | Arbok, Golbat |
| 4 | Mismagius, Drifblim, Gengar, Chandelure, Dusknoir | — |
| 5 | Giratina | Crobat |

##### Elite Four Marshal · Fighting (`gen5:marshal`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Makuhita, Meditite, Croagunk, Mankey, Machop, Timburr, Scraggy | Ralts, Kirlia, Shroomish, Poliwag, Tepig, Chimchar, Torchic |
| 2 | Mienfoo, Machoke, Combusken, Monferno, Gurdurr, Medicham, Pignite | Poliwhirl, Onix |
| 3 | Primeape, Hitmonlee, Hitmonchan, Hitmontop, Breloom, Throh, Sawk, Hariyama, Scrafty | — |
| 4 | Toxicroak, Poliwrath, Heracross, Machamp, Conkeldurr, Mienshao, Gallade, Lucario, Emboar, Blaziken, Infernape | Steelix |
| 5 | Cobalion, Terrakion, Virizion, Keldeo | — |

##### Elite Four Grimsley · Dark (`gen5:grimsley`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Poochyena, Purrloin, Sandile, Deino, Carvanha, Stunky, Houndour, Zorua, Nuzleaf, Pawniard, Scraggy | Seedot, Litwick, Larvitar, Corphish, Oddish, Skorupi, Cacnea |
| 2 | Krokorok, Vullaby, Sableye, Murkrow, Mightyena, Zweilous | Lampent, Gloom, Pupitar |
| 3 | Sneasel, Liepard, Sharpedo, Absol, Crawdaunt, Cacturne, Skuntank, Shiftry, Spiritomb, Scrafty | Vileplume |
| 4 | Bisharp, Houndoom, Drapion, Honchkrow, Krookodile, Weavile, Zoroark, Mandibuzz, Umbreon | Chandelure |
| 5 | Tyranitar, Darkrai, Hydreigon | — |

##### Elite Four Caitlin · Psychic (`gen5:caitlin`)

| Group | Species | Filler |
|---|---|---|
| 0 | Unown | — |
| 1 | Ralts, Kirlia, Meditite, Gothita, Solosis, Munna, Baltoy, Beldum, Bronzor, Abra, Woobat, Slowpoke, Natu, Exeggcute, Drowzee, Spoink, Elgyem | Staryu |
| 2 | Duosion, Gothorita, Kadabra, Wobbuffet, Medicham, Metang, Chimecho, Swoobat | — |
| 3 | Lunatone, Solrock, Jynx, Girafarig, Mr. Mime, Xatu, Grumpig, Hypno, Beheeyem, Musharna | — |
| 4 | Alakazam, Slowbro, Slowking, Sigilyph, Gothitelle, Reuniclus, Claydol, Bronzong, Gardevoir, Gallade, Exeggutor, Starmie, Espeon | — |
| 5 | Uxie, Mesprit, Azelf, Mew, Celebi, Metagross, Latias, Latios, Jirachi, Deoxys, Cresselia, Victini, Meloetta, Mewtwo, Lugia | — |

##### Champion Iris · Dragon (`gen5:iris`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | Magikarp |
| 1 | Dratini, Bagon, Gible, Deino, Axew, Vibrava | Trapinch, Horsea, Charmander, Swablu |
| 2 | Gabite, Fraxure, Dragonair, Shelgon, Zweilous | Charmeleon |
| 3 | Druddigon | Seadra |
| 4 | Altaria, Flygon | Aerodactyl, Charizard |
| 5 | Kingdra, Haxorus, Dragonite, Salamence, Latias, Latios, Garchomp, Hydreigon, Kyurem, Rayquaza, Dialga, Palkia, Giratina, Reshiram, Zekrom | Gyarados |

##### Hugh (Final Rival) · signature lines (`gen5:rival-hugh`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Starly, Litwick, Gible, Deino, Timburr, Snivy, Tepig, Oshawott, Axew, Drilbur, Zorua, Staravia | — |
| 2 | Lampent, Gurdurr, Gabite, Fraxure, Servine, Dewott, Pignite, Zweilous | — |
| 3 | Staraptor | — |
| 4 | Conkeldurr, Excadrill, Zoroark, Chandelure, Lucario, Serperior, Emboar, Samurott | — |
| 5 | Haxorus, Garchomp, Hydreigon | — |

##### Bianca (Final Rival) · signature lines (`gen5:rival-bianca`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Ralts, Kirlia, Petilil, Solosis, Munna, Blitzle, Snivy, Tepig, Oshawott, Eevee | — |
| 2 | Duosion, Vullaby, Roselia, Togetic, Servine, Dewott, Pignite | — |
| 3 | Lilligant, Musharna | — |
| 4 | Reuniclus, Zebstrika, Roserade, Mandibuzz, Gardevoir, Flareon, Serperior, Emboar, Samurott | — |
| 5 | Togekiss | — |

##### Cheren (Final Rival) · signature lines (`gen5:rival-cheren`)

| Group | Species | Filler |
|---|---|---|
| 0 | — | — |
| 1 | Pidove, Lillipup, Slakoth, Blitzle, Gible, Snivy, Tepig, Oshawott, Eevee, Pawniard | — |
| 2 | Tranquill, Aipom, Herdier, Vullaby, Gabite, Servine, Dewott, Pignite | — |
| 3 | Vigoroth, Unfezant, Ambipom | — |
| 4 | Stoutland, Bisharp, Zebstrika, Mandibuzz, Jolteon, Serperior, Emboar, Samurott | — |
| 5 | Garchomp, Slaking | — |

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

### Gen 5 rules (decision pending)
Showdown's Gen 4 rules differ from Gen 5 in 56 abilities, 59 items, 132 moves and a few status rules, but most differences are tiny. Our data already uses modern move priorities (Protect +4, Fake Out +3, Extreme Speed +2), and Sturdy, Lightning Rod and Storm Drain already work the Gen 5 way. Candidates, from most to least worthwhile:
- [x] **Gen 5 move values** (power, accuracy, PP), applied to every Challenge Gen: 35 Gen 1–4 moves changed (Curse is now Ghost type). E.g. Tackle 35→50, Thrash/Outrage/Petal Dance 90→120, Fire Spin/Whirlpool/Sand Tomb 15→35, Giga Drain 60→75, Toxic 85→90, Glare 75→90, Jump Kicks stronger but 10 PP.
- [x] **Shorter sleep:** 1–3 turns for every Challenge Gen (Gen 4: 1–4).
- [ ] **Protect:** each consecutive use has 1/3 the chance (Gen 4: halves, never below 1/8).
- [ ] **Not recommended:** the other ability, item and damage-order differences (rare or tiny); rewriting the damage formula.

### Later
- [ ] **TMs** as items.
- [ ] **Leader team builder** UI in the browser.
- [ ] **Bag upgrade system.**
- [ ] **Smart item offers:** boosted odds for an evolution item a team member needs (dropped for now).
- [ ] **Music, sound and move animations.**
- [ ] **Singles mode.**
- [ ] **Multi battles:** e.g. 2 trainers with 6 Pokémon each (12 vs 12).
- [ ] **Multiplayer mode:** team up with 1 friend through the double battles and become Pokémon Champions together (idea only, nothing decided yet: how teams are split, online or same device, shared or separate recruits).

## 7. Technical Notes

- Plain **HTML / CSS / JavaScript**, runs in the browser.
- Pokémon data (stats, types, moves, learnsets, abilities, evolutions, Gen 4 sprites) sourced from **PokeAPI** and bundled into local JSON. PokeAPI is built for this, unlike scraping a fan site.
- **Sprites:** Gen 4 style, front and back. Pokémon only for now (no trainer sprites, music or move animations).
### Data pipeline (step 1, done)

Run `node tools/build-data.mjs` (add `--no-sprites` to skip sprites). API responses are cached in `tools/.cache`.

| Output | Contents |
|---|---|
| `data/pokemon.json` | #001–649 (Gen 5 added: Black/White values, Black/White sprites in `images/sprites/gen5`); #001–493: Gen 4 types and base stats, BST, normal abilities (Gen 4) + Hidden Ability (latest gen), gender ratio, legendary/mythical/baby flags, pre-evolution, height (m), weight (kg), sprite paths, learnset (level-up, TM, tutor, egg) |
| `data/moves.json` | Every move those Pokémon can learn (+ Struggle), with Gen 4 type, power, accuracy and PP, category, priority, target, effect text and battle meta (status chance, flinch, crit, drain, multi-hit…) |
| `data/abilities.json` | Every normal and Hidden Ability used, with effect text |
| `data/evolutions.json` | Evolution links (from → to) with the official conditions. The game applies our own rules (§2 Evolution) on top. |
| `data/manifest.json` | Build date, source, counts, missing sprites |
| `images/sprites/gen5/`, `gen5-ani/` | Black/White sprites for #001–649: static PNG (`gen5`) and animated GIF (`gen5-ani`), same folder layout. Downloaded with `node tools/fetch-pokemon-sprites.mjs` |
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
  - Every Gen 1–5 move now does something. The rules of the copy/call/field moves are listed below. Gen 5 Abilities that still do nothing: Zen Mode (it needs an alternate form); Run Away, Illuminate and Pickup have no use in this game.
  - Alternate forms (Castform, Cherrim, Rotom, etc.) aren't in the data yet.
- Damage formula referenced against **Pokémon Showdown** for accuracy.

#### Gen 5 Pokémon

- **Data:** Pokémon #494–649 use their Black/White types, stats and abilities, and learn the moves they learn in Black/White and Black 2/White 2. Gen 1–4 Pokémon keep their Gen 4 values and **keep every move and level they had; they also get what Black/White and Black 2/White 2 added** (new TMs, tutors and level-up moves). 486 of them gained moves, 3,155 entries in total (e.g. Gengar: Hex, Foul Play, Venoshock, Telekinesis, Wonder Room, Round).
- **Sprites:** Gen 5 Pokémon use Black/White art (96 px); Gen 1–4 keep Platinum/HGSS art (80 px). The battle screen scales each to its own size, with the feet on the same line.
- **Unova trainers:** Black 2 / White 2 line-up: Cheren, Roxie, Burgh, Elesa, Clay, Skyla, Drayden, Marlon; Shauntal, Marshal, Grimsley, Caitlin; Champion Iris; Final Rival Hugh, Bianca or Cheren.
- **Gen 5 moves:** every Gen 5 move is implemented (rules below). Pledge moves combine when both partners use different ones (150 power + rainbow / sea of fire / swamp for 4 turns). Sky Drop is a two-turn move that stops the target from moving on the first turn.

#### Rules of the special moves (Gen 4, simplified where noted)

| Move | Rule here |
|---|---|
| Future Sight / Doom Desire | Hits at the end of the 2nd turn after use. Damage is worked out on use and ignores type matchups (Dark types are hit). Fails if one is already coming for that slot |
| Disable | Target's last move can't be used for 4–7 turns |
| Spite | Takes 4 PP off the target's last move |
| Mimic | Copies the target's last move into Mimic's slot with 5 PP until the user leaves the field |
| Sketch | Copies the target's last move into Sketch's slot **permanently**: the run keeps it (see `finishBattle`). Fails when transformed |
| Mirror Move | Uses the target's last move if it was aimed at other Pokémon |
| Copycat | Uses the last move anyone used |
| Assist | Uses a random move of another team member (bench included) |
| Me First | Uses the foe's chosen move first, ×1.5 power. Fails if the foe already moved or chose a status move |
| Transform | Copies the target's types, stats (not HP), ability, weight, stat stages and moves (5 PP each). The sprite changes. Ends when the user leaves the field |
| Conversion / Conversion 2 / Camouflage | Change the user's type (a move's type / one that resists the last hit / the **arena's** type, §7 Arenas) until it leaves the field |
| Power Trick | Swaps Attack and Defense (swap again to undo; undone on leaving) |
| Psycho Shift | Moves the user's status to the target (if it can get it) |
| Ingrain | Heals 1/16 each turn and the user can't be switched out or forced out |
| Magic Coat | Bounces the first status move aimed at the user (or its side's hazards) this turn. Priority +4 |
| Snatch | Steals the next self-targeted status move this turn (not Splash). Priority +4 |
| Imprison | The foes can't use any move the user also knows, while the user is out |
| Grudge | If the user is knocked out by a move this turn, that move's PP drops to 0 |
| Recycle | Returns the item the user used up this battle |
| Mud Sport / Water Sport | Halve Electric / Fire move power while the user is on the field |
| Wide Guard / Quick Guard | Block multi-target moves / priority moves for your side this turn (can't be used twice in a row) |
| Guard Split / Power Split | Average Defense and Sp. Def / Attack and Sp. Atk with the target until you leave the field |
| Wonder Room / Magic Room | 5 turns: Defense and Sp. Def stats swapped / held items do nothing. Use again to end |
| Rage Powder, Soak, Simple Beam, Entrainment, Bestow, After You, Ally Switch, Heal Pulse, Telekinesis, Autotomize | As in Gen 5. Telekinesis: moves never miss, grounded moves can't hit, 3 turns |
| Gravity | 5 turns: everyone is grounded (Ground hits Flying and Levitate), accuracy ×5/3, and Fly, Bounce, Jump Kick, Hi Jump Kick, Magnet Rise and Splash can't be used |

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
- **Sprite check:** open `tools/sprite-check.html` (through the local server) to see 30 Pokémon at a time (front/back/shiny, Gen 4 / Gen 5 static / Gen 5 moving) on a feet line, with a dotted top-edge line and centre line. Click a sprite and nudge it with the arrow keys; "Download sprite-offsets.json" saves the nudges to `data/sprite-offsets.json` (shiny shares the regular sprite's nudge). Floating sprites are listed in `FLOATERS` in `js/ui/sprite-align.js`.
- **Sprite style:** chosen on the New run screen (saved in the meta save): Static (Gen 5 art), Moving (animated Gen 5), or Gen 4 (static, Gen 5 art only for #494–649). `js/game/sprite-mode.js` rewrites every species' sprite paths. Gen 5 back sprites (static and moving) are drawn bigger and sink behind the textbox so they look closer than the foes: `backScale` 1.15 and `backSink` 0.25 (share of the sprite's height), editable in `_settings` of `data/sprite-offsets.json` or live on the sprite check page.
- **Scene preview:** open `tools/scene-preview.html` through the local server to see every terrain and weather side by side.
- Click the text box (or press Enter/Space) to skip text. Text speed Normal/Fast is on the command menu.
- **Bag** in battle: use a bag item on any team member (takes that Pokémon's turn). There's no Run button (trainer battles).
- The files `js/scripts.js`, `data/data.json` and `images/background.jpg` from the original template aren't used anymore.
- **Saving:** auto-save **every turn** in the browser (`localStorage`). Reloading or closing the page resumes the battle exactly where it was, so faints can't be undone. A **Hall of Fame** stores winning teams.
- Personal fan project: Pokémon names and sprites belong to Nintendo / Game Freak / The Pokémon Company. Not for commercial release.

### Debug panel (press L)
Hidden until you press **L** (not while typing in a field). Code: `js/ui/dev-tools.js`. Opening it once turns the options on; they're remembered in the browser.
- **Live CSS:** when `css/styles.css` changes, the new styles are swapped in without reloading the page (checked every ~0.8 s).
- **Stay on this screen after a reload:** the screen, scroll position and panel are restored after any reload (Live Server, F5). Per browser tab, so a new tab starts at the title as usual.
- **Freeze animations:** pauses CSS animations and the title banner, so a screen holds still while you adjust it.
- **Screens:** jump to menus, every run screen (draft, starter items, hub, hub grid, details window, recruit, item pick, game over, Hall of Fame) and battle screens (intro, commands, moves, targets, Pokémon list, switch-in summary). Previews are built from a fixed test run (seed 1234) and **never touch your real save, Trainer Points or Hall of Fame**. "Back to my real game" resumes your run.

### Versioning
- The version lives in `js/version.js` and is shown on the title screen (e.g. `v0.1.0`).
- Bump it with **every** update and start the change log line (§9) with the new version:
  - **patch** (0.1.0 → 0.1.1): fixes, balance changes, small UI tweaks
  - **minor** (0.1.0 → 0.2.0): new features or content (e.g. Gen 2 team pools)
  - **major** (→ 1.0.0): first complete release

### Fonts

Two fonts, both from Google Fonts (linked in `index.html`), set as variables at the top of `css/styles.css`:

| Variable | Font | Used for |
|---|---|---|
| `--font-main` | Nunito | `body` (so everything by default: headings, buttons, Pokémon and trainer names, the text box and menus), plus `.hit-badge`, `.move-info b`, `.banner-frame .textbox p`, `.mc-name` |
| `--font-info` | Silkscreen (DotGothic16 as fallback) | Details and numbers (its 5/8 and 6/9 are easy to tell apart): the group rule in the "Details and numbers" block (`.info`, `.hpbox .level`, `.hpbox .hp-numbers`, `.move-btn .move-meta`, `.move-btn .move-power`, `.move-info`, `.target-btn .who`, `.party-card .pinfo`, `.turn-badge`, `.facts`, `.mon-sub`, `.mc-stats`, `.mc-desc`, `.mc-toggle`, `.mc-type`, `.move-card .cat-pill`, `.modal-label`, `.mon-item`, `.bag-entry`, `.offer-card .detail`, `.offer-card .tier`, `.track .stop`, `.modal small`, `.modal p`, `.confirm-mon`, `.confirm-text`, `.fallen-list small`, `.hof-team small`, `.hub p`, `.empty-note`, `.choice small`, `.messages p`, `.money`, `.tp-pill`, `.reward`, `.tile-sub`, `.tile-item`, `.tab-count`, `.stats-table`, `.shop-item small`, `.shop-item .btn.small`, `.upgrade-card .btn.small`, `.evo-mon small`, `.ability-list`, `.species-name`, `.next-facts`, `.me-card small`, `.version-tag`) and `.menu-title small`, `.sum-info .pinfo`, `.sum-stats span`, `.sum-move span`, `.slot-label`, `.modal-count`, `.ability-full .ab-now`, `.ability-full p`, `.dialog-moves` |

`tools/sprite-check.html` uses the browser's system font.

### Styles
- `css/styles.css` is one sheet with design tokens at the top (colours, radius, spacing, type sizes). Use the tokens instead of new hard-coded values.
- Battle screens are sized in `cqw` so they scale like a DS; everything else uses px tokens.
- Phones (≤560 px): one column, bottom-sheet dialogs, compact move cards. Upright phones in battle: the menu screen fills the rest of the height. Touch screens: bigger tap targets, no hover lifts. Everything you can drag can also be tapped (bag items → pick a Pokémon).

### Credits
- **Pokémon data, Pokémon sprites and item sprites:** [PokeAPI](https://pokeapi.co) and the PokeAPI/sprites repository.
- **Badge art:** the gym badge images of the [PokeAPI sprites](https://github.com/PokeAPI/sprites) repository (`sprites/badges`), scaled down to pixel icons for `images/badges/`.
- **Black 2 / White 2 trainer sprites:** [Bulbagarden Archives](https://archives.bulbagarden.net) (category "Generation V Trainer sprites"), 52 of our trainers, saved as `images/trainers/variants/<id>-b2w2.png` by `node tools/fetch-b2w2-trainer-sprites.mjs` (file list from `sprites.html`; the category page blocks scripts). Not used in battle yet: they are for the trainer sprite picker.
- **Trainer sprites:** [Pokémon Showdown](https://play.pokemonshowdown.com/sprites/trainers/) and its sprite artists (downloaded with `node tools/fetch-trainer-sprites.mjs` into `images/trainers/`). Gold uses Showdown's HeartGold/SoulSilver Ethan sprite; Tate & Liza are shown as two sprites.
- **Player character sprites:** back sprites from [Bulbagarden Archives](https://archives.bulbagarden.net) (category "Trainer back sprites"), front sprites for the picker from Pokémon Showdown. 36 characters in `data/characters.json`, made by `node tools/fetch-back-sprites.mjs` (the category page blocks scripts, so the file list comes from `sprites.html`). Back sprites are in `images/trainers/back/`, fronts in `images/trainers/`. Only trainers with a front sprite are playable (no Old Man, Dude, Pokémon Dude or Roxie's Father) and only one Nate and one Rosa (Black 2 / White 2).
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
- After a battle, held items that were knocked off or swapped come back. Single-use items (berries, herbs) are gone; the Focus Sash comes back.
- A **draw** (both sides out at once) counts as a loss.
- Saving: `localStorage` key `pd.run` after every action and every battle turn. The Hall of Fame is `pd.hallOfFame`.

**Shop, TMs and progression (step 4):**
- `js/game/run.js`: prize money, the shop (5 items, refreshed after every battle, sell at half price), TM rewards from every opponent and teaching TMs.
- `js/game/meta.js`: Trainer Points and Trainer upgrades, saved in `localStorage` key `pd.meta` (separate from runs, so it survives losing). A new run copies your upgrades at the start.
- `data/tms.json`: TM01–TM92 from Platinum, then the moves Black/White added as TMs, numbered TM93–TM118 in Black/White order (`node tools/build-tms.mjs`).
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
- **v0.2.0 · October 13, 2026:** Future Sight and Doom Desire now really hit two turns later (typeless, damage worked out on use). Held-item trade evolutions (Magmarizer, Electirizer, Metal Coat…) only need the held item, no Link Cable. Shop split into sections with tabs (Items, Berries, Medicine, Battle, Key Items, TMs), stock per section editable in §3h. Dialogs rebuilt: fixed top with a Pokémon selector, scrolling middle, fixed Close; item, swap, relearn, TM and evolve actions moved into the tabs they belong to. Phone dialogs tidied. Battle switch-in shows a full summary (HP, ability, item, stats, moves with PP) before you send a Pokémon out.
- **v0.2.1 · October 13, 2026:** Dialogs fit their content (the details window is as tall as its tallest tab, so nothing is cut off or jumps). Abilities tab shows every ability with its full description. Switch-in summary uses the free space. The empty battle menu no longer shows "…".
- **v0.2.2 · October 13, 2026:** iOS Safari: controls no longer sit in the bottom-edge strip where the first tap only brought the toolbar back (page, sticky confirm bar and dialogs stop ~56 px above the edge). Could not be tested on a real iPhone.
- **v0.3.0 · October 13, 2026:** All 23 moves that did nothing are implemented (Disable, Mimic, Mirror Move, Transform, Conversion, Sketch, Conversion 2, Spite, Assist, Ingrain, Magic Coat, Recycle, Imprison, Grudge, Snatch, Camouflage, Mud Sport, Water Sport, Gravity, Psycho Shift, Power Trick, Me First, Copycat); rules in §7. Sketch is permanent for the run. Camouflage uses the arena type. The AI knows when to use them. 23 new engine tests.
- **v0.3.1 · October 14, 2026:** Smeargle now has 4 Sketch slots (recruits and opponents). Team pools for **all four gens**: Johto, Hoenn and Sinnoh trainers use their specialty type plus a few canon or fitting filler Pokémon (shown in each table's Filler column), the same rules as Kanto. Typeless trainers (Silver, Gold, Brendan, May, Cynthia, Barry, Dawn, Lucas) use signature lines.
- **v0.3.2 · October 14, 2026:** Debug panel on the L key: live CSS without reloading, stay on the same screen after a reload, freeze animations, and a quick screen switcher (previews never touch your save). §7.
- **v0.3.3 · October 15, 2026:** Repaired css/styles.css after all closing braces were lost (630 added back; your two edits to the choice chips were kept).
- **v0.3.4 · October 15, 2026:** The Confirm bar no longer floats at the bottom of the screen (it was in the strip where iOS Safari swallows the first tap). It sits in the page, right under the cards on the recruit screen.
- **v0.4.0 · October 16, 2026:** **Gen 5 (Unova)** is playable: 156 new Pokémon with Black/White sprites, all 86 Gen 5 moves, 15 Gen 5 abilities, Black 2/White 2 trainers and team pools, and Gen 5 in the New run screen and Pokémon Pool. Gens 1–4 are unchanged. Trainer sprites for the Unova leaders are still to be downloaded. 65 engine tests.
- **v0.4.1 · October 16, 2026:** Unova trainer sprites downloaded. Gen 1–4 Pokémon now also learn what Black/White and Black 2/White 2 added (nothing removed; 486 Pokémon gained moves), with 26 new TMs (TM93–TM118). Quash and Reflect Type implemented, so every move through Gen 5 works. 66 engine tests. Gen 5 rule options listed in §6.
- **v0.4.2 · October 15, 2026:** Every move now uses its Black/White power, accuracy and PP in all Challenge Gens (35 moves changed, e.g. Tackle 50, Thrash 120, Fire Spin 35, Toxic 90%). Sleep now lasts 1–3 turns. Protect keeps its 1/2 odds.
- **v0.4.3 · October 16, 2026:** Ability Patch and Hidden Ability Patch are now used up when applied (they were reusable by mistake). Evolution items keep "Not used up upon evolution".
- **v0.4.4 · October 16, 2026:** Shop shows every section stacked under each other instead of tabs (empty sections are hidden). Sprite check page (`tools/sprite-check.html`) now has a position editor: click a Pokémon, nudge it with the arrow keys, download `data/sprite-offsets.json`; the game applies those nudges per sprite file. Sprite check shows Gen 1–5, front/back/shiny at the real battle size. Opponent Smeargle now start with 4 moves already sketched (the AI couldn't use Sketch well).
- **v0.4.5 · October 16, 2026:** Sprite check page shows a dotted purple "top edge" line in every cell (the battle scene's top: 75.5 px above a foe's feet, 153 px above your Pokémon's feet) so sprites aren't placed too high.
- **v0.4.6 · October 16, 2026:** More room above the battle scene: the headroom strip is 24 px instead of 12 (top screen 256×216). Sprites, platforms and HP boxes stay where they were; the opponent's balls, turn counter and weather moved up with the strip. The sprite check's "top edge" line now uses the real distances (97 px above a foe's feet, 170 px above yours; the earlier line was too low).
- **v0.4.7 · October 16, 2026:** Sprite check page also shows a dotted vertical centre line in every cell.
- **v0.4.8 · October 16, 2026:** Shiny sprites reuse the regular sprite's position nudge (one entry in `data/sprite-offsets.json` covers both).
- **v0.5.0 · October 16, 2026:** Gen 5 sprites for every Pokémon, static and animated (downloaded with `node tools/fetch-pokemon-sprites.mjs`). New run screen has a "Pokémon sprites" choice: Static, Moving or Gen 4. Gen 5 back sprites are 15% bigger and sink 25% behind the textbox so your Pokémon look closer than the opponent's. Sprites keep their real pixel size (animated ones vary). Sprite check page: sprite style selector, back size and sink controls.
- **v0.5.1 · October 16, 2026:** Sprites no longer look squashed in the offer cards and other fixed boxes (animated sprites keep their proportions). (The trainer hop idea was dropped: trainers stay static.) Downloaded Black 2 / White 2 art for 52 trainers as sprite variants for the later picker.
- **v0.5.2 · October 16, 2026:** Removed the trainer hop animation (trainer sprites stay static). Animated Pokémon sprites in cards and lists are drawn at one shared scale (`js/ui/sprite-fit.js`), so small Pokémon look small and big ones fill the box, instead of every sprite filling the box.
- **v0.6.0 · October 16, 2026:** 61 playable characters: every trainer with a back sprite (Gen 1: Red, Oak, Old Man · Gen 2: Ethan, Kris, Lance, Silver, Dude… · Gen 3: Red, Leaf, Brendan, May, Steven, Wally… · Gen 4: Lucas, Dawn, Barry, Buck, Cheryl, Marley, Mira, Riley · Gen 5: Hilbert, Hilda, Nate, Rosa, Cheren, Bianca, Hugh, Chili, Cilan, Cress, Juniper, Pokéstar costumes…). The character picker on the New run screen is grouped by generation and shows each sprite's game. Small old sprites are enlarged so every character is about as tall as Lucas; Gen 5 sprites keep their size. You can play as a trainer you also fight (mirror battles).
- **v0.6.1 · October 16, 2026:** Target menu ("Use … on…"): bigger Pokémon sprites, and the sprite and the name now sit in two balanced columns.
- **v0.6.2 · October 16, 2026:** Playable characters cut to 43: removed the ones without a front sprite (Old Man, Dude, Pokémon Dude, Roxie's Father…) and the Pokéstar costumes of Nate and Rosa (one version each now). The picker no longer shows the game under each name.
- **v0.6.3 · October 16, 2026:** Player characters are scaled to one visible height (74 px, `CHARACTER_HEIGHT` in `js/ui/sprite-align.js`): the big Gen 5 sprites were too large at the start of a battle, so they are shrunk to about two thirds.
- **v0.7.0 · October 16, 2026:** Characters are locked behind progress (§3j, editable): runs finished, Hall of Fame wins, regional trophies (win a Challenge Gen), battles beaten and Trainer Points earned. The 8 starting protagonists are free. Locked characters show as silhouettes with their requirement in the picker, and the run-over screens announce new unlocks. Multi-hit moves: each hit now has its own jolt, a counter above the target and a short pause.
- **v0.7.1 · October 19, 2026:** Feedback fixes. Pursuit now hits a Pokémon that switches out, before it leaves, with double power. Early Bird can no longer wake the holder on the same turn it fell asleep (it always loses at least one turn). The detailed team cards show all six stats. Recruit screen: with several picks allowed, a full selection no longer swaps your first pick out (unselect one first, other cards dim); the reroll now offers "Confirm picks, then reroll the rest" and the screen explains that picked cards stay. "Used up" is now "Single use: lost once it triggers". The Focus Sash is once per battle and comes back afterwards. Move descriptions state priority (Aqua Jet: Priority +1: goes before normal moves).
- **v0.7.2 · October 19, 2026:** Characters whose picker sprite was identical to another one are gone (Ethan Spaceworld '97 and Gold beta, Leaf (Emerald), the Diamond/Pearl Lucas, Dawn and Barry, Cheren (Black/White)): 36 playable characters.
- **v0.7.3 · October 19, 2026:** Pixelify Sans is replaced by Nunito (clearer text). VT323 stays for details and numbers. Added a Fonts overview to §7.
- **v0.7.4 · October 19, 2026:** Dialog option buttons with a Pokémon (evolve, swap, relearn…) show a 64 px sprite instead of 32 px and keep it next to the name. Animated sprites no longer drift to the middle of flex rows.
- **v0.8.0 · October 23, 2026:** Gym badges (§3k): each gym gives a badge with a perk (Extra Recruit, Swap, Reroller, Scout, Lucky Wallet, Hidden Potential, Gift Box, TM Master); wear 2 badges at first, 3 after Gym 4, 4 after Gym 8 (Badges button in the hub). Moves bar on the right of the team: the chosen Pokémon's four moves plus every TM and relearnable move as draggable cards; drag a move onto a slot to learn it, drag a slot onto another to reorder. Castform's Forecast now changes its form and type with the weather (Sunny, Rainy, Snowy sprites downloaded). Natures show what they do on recruit cards. The progress circles show the opponent's face with their type colour once you have reached them (remembered per Challenge Gen across runs). New `tools/test-run.mjs` for run-level tests.
- **v0.8.1 · October 23, 2026:** Badges reworked (§3k). Beating a gym leader unlocks their badge for good (40 badges, shared by every generation and run, saved in the meta save). Before a new run you fill an 8-slot badge case (4 × 2 grid, tap or drag, on the New run screen) with badges from any generation; the case is locked during the run. A badge from the run's Challenge Gen is boosted (★), a perk counts at most twice. Badge images are placeholder SVGs (`node tools/make-badges.mjs`, `images/badges/`).
- **v0.9.0 · October 23, 2026:** Badges are personal (§3k): every gym leader has their own badge and perk (Brock always gives the Boulder Badge), 40 different perks, so a badge can only be worn once. Type badges give your moves +10% damage (`boost:<type>`) or your Pokémon −10% damage from that type (`ward:<type>`); 8 badges give run perks (extra recruit, swap, reroll, scout, wallet, hidden, gift, TM). The same-gen boost is replaced by a set bonus: 3 / 5 / 8 badges from one generation give your Pokémon +4% / +8% / +12% to Attack, Defense, Sp. Atk, Sp. Def and Speed (generations add up). Moves and Shop now share the right column with tabs.
- **v0.9.1 · October 23, 2026:** Badges are now like Balatro jokers: 40 badges, 40 different effects (§3k). 30 battle effects (Sturdy Stone, Opening Salvo, Last Stand, Vengeance, Second Wind, Vampire, Spikes, weather starters, status wards, stat boosts…) and 10 run effects (Extra Recruit, Swap, Reroller, Scout, Lucky Wallet, Hidden Potential, Gift Box, TM Master, Interest, Haggler). The type Power/Ward badges are gone. The set bonus stays.
- **v0.9.2 · October 23, 2026:** Badges got weaker and now scale and care about position (§3k). An effect's size depends on the badge's strength: its gym number (1–8) plus 1 for every neighbouring badge of the same generation (left, right, above, below in the 4 × 2 case), at most 10. Early gyms give small effects (Sturdy Stone: 3% less damage at strength 1, 17% at 8), late gyms strong ones; weather badges last at most 8 turns. The set bonus is smaller (2% / 4% / 6%). The case shows each badge's strength, effects are listed with their numbers, and §3k has an effect scaling table.
- **v0.9.3 · October 23, 2026:** Shop items are a compact list: one slim row per item, the whole row is the buy button, the price is plain text. The Bag no longer moves when you switch between the Moves and Shop tabs (the opponent card and Bag are one left column). Badge position is simpler: the badge case has 1, 2 or 3 random pairs of linked slots (new links every run, shown with 🔗 and a letter), and two badges in a linked pair boost each other by +2 strength.
- **v0.9.4 · October 23, 2026:** Shop sections fold up and open again when you click their heading.
- **v0.9.5 · October 23, 2026:** Fly, Bounce and Sky Drop now show the Pokémon flying up and out of the screen on the charge turn; Dig sinks it into the ground, Dive under water and Shadow Force makes it vanish. It drops back in when it attacks (and also if a flinch or paralysis ends the move). Dig and Fly are covered by an engine test. Moves bar: tapping a move opens its details under it, with buttons to learn it in place of one of the four moves (or an empty slot), plus a Show effects toggle; the Moves tab is gone from the Pokémon details window. Shop: "Today's deals" (2 items and 1 TM at 20–50% off with the old price struck through), and a gold Restock button that glows when free. The recruit reroll no longer shows a count "(1)".
- **v0.9.6 · October 24, 2026:** The badge case looks like the League Badge screen of the Trainer Card (grey panel, light blue frame, 4 × 2 badges). Real badge art: the official gym badge images from the PokeAPI sprites repository, scaled down to 40 px pixel icons (`python3 tools/make-badge-images.py`); the placeholder drawings are gone. Shop economy: prize money 150 → 190 × battle number, TMs about 20% cheaper (1200 / 2400 / 4000), shop reroll 200 → 150. The Moves bar has one list of every move the chosen Pokémon can learn now: the TMs you own (received or bought) first, then the level-up moves it has missed.
- **v0.9.7 · October 24, 2026:** Hall of Fame entries (and the Hall of Fame win screen) now also list every Pokémon that fell during the run, in grey under the team (older entries keep just the number).
- **v0.9.8 · October 24, 2026:** The team starts in the grid view. The Moves bar is the only way to learn moves now: the old Move Relearner and TM dialogs, the Moves / TM buttons on the team cards and TM dragging from the Bag are gone. Tapping a move in the bar (known or learnable) opens a popup with its details and, for new moves, which slot it takes. "Show effects" shows the effect of every move in the bar, including your four current moves.
- **v0.9.9 · October 24, 2026:** Removed the red −% sale tag in the shop (sale items keep the struck-through old price and the "Today's deals" section). The buy popup of shop items shows the old price of a sale item.
- **v0.10.0 · October 24, 2026:** Counter and Mirror Coat (and Metal Burst) now hit whoever hit you, they used to hit the user. Reflect, Light Screen, Tailwind and Safeguard show as tags at the top of the battle scene while they are up. Badges: you can switch each badge's effect off in the badge case (it still counts for the set bonus), all damage, stat and heal effects are about 30% weaker and the weather starters last 3–5 turns, the unlock message no longer says what the badge does, and the Next battle panel shows the leader's badge greyed out until you own it. Bag TMs are clickable (details and who can learn it). The item pick screen shows your team like the recruit screen. Items can be dragged between Pokémon in the grid view too. The Moves tab is back in the details window (no relearn button). Show effects is a small switch and the effect text appears inside the move cards. The "Done" button on the recruit screen is now "Skip", and rerolling with all your picks selected rerolls instead of locking them in.
- **v0.10.1 · October 24, 2026:** Moves show a small target icon (foes on top, you and your partner below, the Pokémon it hits filled in: red for foes, green for you and your partner, dotted for "one of these") on move cards, in the battle move menu and in the Moves bar. The tooltip says who it hits.
- **v0.10.2 · October 24, 2026:** The target icon sits on a dark chip with stronger colours so it is readable on every card. Physical, Special and Status moves have a small icon (orange burst, blue swirl, grey bubbles) in their category tag. Payback fix: it now doubles against a Pokémon that switched in this turn too (before, only when the target had attacked), with a test.
- **v0.10.3 · October 24, 2026:** The Physical / Special / Status icons are plain one-colour shapes (star, ring, bar) in the tag's text colour.
- **v0.10.4 · October 24, 2026:** Shorter move labels: Phys / Spec / Status next to the icons, and short target texts (One target, Both foes, All others, Random foe, Self, Partner, Your side, Foe side, Whole field, Everyone, Varies).
- **v0.10.5 · October 24, 2026:** The team shown under the recruit and item screens is clickable: tap a Pokémon to open its details window.
- **v0.10.6 · October 24, 2026:** In the target icon, a damaging move shows your partner red when it hits them too (Surf, Earthquake, Explosion), so you can see it will hurt them. Status moves keep the green.
- **v0.10.7 · October 24, 2026:** Last Resort now works (it fails until the Pokémon has used all its other moves since it came in; the AI waits too). Recruit cards: a "Moves & details" switch above the cards (off by default, remembered) hides the moves, abilities, nature effect and base stat total, and the card grid is wider with more padding. One "Effects" switch everywhere: the per-card Effect buttons are gone and the details window's Moves tab has the same switch. The details window's Moves tab has a right column with every move the Pokémon can learn (tap one for the learn popup).
- **v0.10.8 · October 24, 2026:** Recruit cards show only the sprite, name, types, level and nature (the "Moves & details" switch is gone). A detail panel next to the cards shows everything about the Pokémon you tapped last: abilities, stats, nature effect and its moves with their effects. In the details window the Moves tab is wider with the learnable moves as their own column on the right, and moves can be dragged there too: drag a move onto another to swap their order, or drag a learnable move onto one of yours to learn it in its place.
- **v0.10.9 · October 24, 2026:** Recruiting is now one Pokémon at a time. Tap a recruit card to open the same panel as your team's details (stats, abilities, evolution, moves) and press Lock in to take it; ◀ ▶ and the sprites at the top flip through the other cards. The side panel and the select-then-confirm bar are gone, so rerolling only replaces cards you haven't locked in. In the details window the learnable moves are now a separate column to the right of the window (wide screens).
- **v0.10.10 · October 24, 2026:** Move rows in the Moves bar (known and learnable) show whether the move is Physical, Special or Status next to its power and accuracy, with the target icon on the right. The move popup is wider, with the Physical/Special/Status pill and target icon on the right of its card.
- **v0.10.11 · October 24, 2026:** The "wants to learn a new move" popup after levelling up is gone. A Pokémon with a new move gets a small yellow dot (and a "New move!" tag on its team tile); in the Moves bar and details window the new move is highlighted with a "New" tag until you hover it. Moves a full Pokémon couldn't take sit in its "Moves it can learn" list, same as before.
- **v0.10.12 · October 24, 2026:** Hidden Power shows its real type and power (from the Pokémon's IVs) everywhere: move cards, the Moves bar, popups and the battle summary. Sucker Punch no longer reads a stale move from a previous turn when its target didn't pick a move this turn (e.g. used an item). The Physical / Special / Status pills are all the same width.
- **v0.10.13 · October 24, 2026:** The "Moves it can learn" list remembers its scroll position, in the Moves bar and in the details window, so teaching several TMs in a row doesn't jump back to the top.
- **v0.10.14 · October 24, 2026:** Fixed Hidden Power's type: the formula used the wrong type order (all-31 IVs gave Steel; it is Dark, power 70). It also fixes the move in battle.
- **v0.10.15 · October 24, 2026:** Recruits now roll their IVs (15–31 for each stat) instead of all being 31, so stats differ slightly between Pokémon and Hidden Power gets different types. Shown in the Stats tab.
- **v0.10.16 · October 24, 2026:** Hidden Power, Return and Frustration show their real base power (Hidden Power 30–70 from the IVs, Return and Frustration 102) in the battle move menu and the run screens instead of 1 or —.
- **v0.10.17 · October 24, 2026:** New badge case screen. Two columns: the case with the collection shelves on the left, a live "Your perks" panel on the right with a preview card of what a badge does in the slot you point at or drag over. Linked slots are joined by a coloured bar. Drag badges in, out (drop on the collection) or between slots; tap a badge in the case to pick it up and tap a slot to move it; × takes one out. Auto-fill (strongest badges, linked slots first) and Clear buttons, a "How it works" popup instead of the text wall, set-bonus meters per generation and clearer locked badges. The "flinched!" message now says what caused it, e.g. "(Fake Out from Zubat)".
- **v0.10.18 · October 24, 2026:** The character picker only shows trainers you have unlocked, plus a line with the number still locked and one hint. Set bonus meters in the badge case are now a progress bar with notches at 3, 5 and 8 badges and their bonus, with text like "2 in case · 1 more for +2%". A legend under the case explains the strength number, the yellow boost and the link letters.
- **v0.10.19 · October 24, 2026:** The detail and number font is now DotGothic16 (clearer than VT323; to switch back change `--font-info` and the link in `index.html`). Perk descriptions in the badge case use the full text colour. Added the draft character unlock plan to §3j (themes, perks and pacing; not in the game yet). `tools/font-check.html` compares fonts.
- **v0.11.0 · October 24, 2026:** Character unlock system (§3j): trainers now unlock through themes instead of counters: win with a Pokémon line (Wally: Ralts), collect a region's three starters (Red), win with a type, recruit many species, clean wins, quick gym wins, badges, berries and items. At most 2 trainers unlock per run, each with a "New trainer unlocked!" popup, and the picker hints at the closest one. Trainers have perks: Ethan, Red, Brendan, Leaf, May, Lucas and Wally work now (more are planned in the table). Text is bigger with more letter spacing, small labels are in capitals, and the panel colours have more contrast.
- **v0.11.1 · October 24, 2026:** The pixel font (details and numbers) is bigger (font-size-adjust 0.57 → 0.7) with more letter spacing (0.11em), word spacing and line height (1.5) so the letters no longer touch. The badge case perk chips, preview card and shelves have more padding.
- **v0.12.0 · October 24, 2026:** Badge case boost zones. The old linked pairs are gone: the 4 × 2 case is split into random coloured zones of 1–3 touching slots and every zone boosts the badges in it (+3 strength for a one-slot zone, +2 for two, +1 for three). The collection shelves are tabs (one per generation). Weather badges no longer overlap: only Rainmaker calls weather; Sunbringer now boosts Fire moves, Sand Caller Rock/Ground/Steel moves and Cold Snap Ice moves.
- **v0.12.1 · October 24, 2026:** The perks list in the badge case is folded away: the right panel shows the badge icons with their strength (point at one for its effect) and a "Details and switches" fold with the full list. The legend under the case is two short buttons (Strength, Zone boost). Perk icons, the legend and locked badges show their info when tapped (no help cursor).
- **v0.13.0 · October 24, 2026:** The badge case has no side panel any more: tapping a badge (in the case or the collection) opens a details window like the move popup, with what it does at its strength, where it sits and what you can do (put it in a free slot, take it out, turn its effect off). Tapping an empty slot lists the badges you can put there. Perks and the two legend labels open their own windows. All badge effects have plain-language descriptions, and several were scaled down: Opening Salvo, Last Stand, Spoils of War, Second Wind, TM Master, Lucky Wallet, Interest, status wards (max 75%), and the extra picks/cards/rerolls/swaps now come at gym 8 (Swarm's 3 hits at gym 6).
- **v0.13.1 · October 24, 2026:** Badges in the case show their strength as a stack beside the badge: the zone boost on top, the total strength in the middle and the gym number at the bottom (gym number + boost = total). The zone tag reads "ZONE +2".
- **v0.13.2 · October 24, 2026:** The badge window shows the strength as an equation with highlighted numbers: gym number + zone boost (in the zone's colour) = strength. The effect switch sits under it. The "In slot N" line and the Strength / Zone boost labels under the case are gone (desktop first; mobile comes later).
- **v0.14.0 · October 24, 2026:** Every badge now raises one stat of your whole team by itself (like the main games), by the gym's type: 1% at strength 1 up to 5.5% at strength 10, always on. Only the secondary effect can be switched off; a switched-off badge keeps its stat boost and the set bonus. The badge window and the perks list show both. New Stat column in the §3k table.
- **v0.14.1 · October 24, 2026:** The strength numbers are gone from the badge screens: no number stack on the badges, no equation or number in the badge window, no level number in the perks list. A zone's boost is shown as stars (★★★ for a one-slot zone, ★★ for two, ★ for three); the badge window and perks list show the real values (the stat boost and the effect at the badge's boosted strength). Strength still works the same underneath (§3k).
- **v0.14.2 · October 24, 2026:** Boost zones follow the sketch: the case is split into separate rectangular boxes (one slot, two side by side, two on top of each other, or three in a row), drawn as coloured boxes with gaps between them and a ★ tag on the border. No more L-shapes. Saves with other shapes get new zones.
- **v0.14.3 · October 26, 2026:** The battle screens (move menu, targets, Pokémon list, HP boxes) use a tighter version of the pixel font again (less letter spacing and line height), so the cards fit now that the other screens use bigger text.
- **v0.14.4 · October 26, 2026:** Moves a Pokémon "learns" at level 1 are capped by level (max power 75 below level 20, 90 below 30, 100 below 40, 110 below 50): Brock's Sudowoodo no longer has a 120-power Wood Hammer at level 12. Skarmory is no longer filler for the electric leaders (Forretress instead). Trainer AI: no more spamming moves that fail (Dream Eater on an awake target, Snore, Spit Up, Screech and other stat drops against Clear Body, White Smoke, Mist or a substitute, status moves against Safeguard, Insomnia, Limber…), boosting moves without a matching attack, and Sucker Punch is a gamble. New tests for Fake Out, Dream Eater, Clear Body and the AI. The detail font is now Silkscreen (to switch back, change `--font-info` and the link in `index.html`).
- **v0.14.5 · October 26, 2026:** Confusion now lasts 1–4 attacks like in Gen 4 (it was one turn too short: a Pokémon could snap out before its first attack). Checked Dragon Rush's accuracy (75%, measured 74% over 10,000 uses) and the 50% self-hit chance; a sweep of every move for crashes and impossible HP or stat stages found nothing, and 22 more interactions (Substitute, Safeguard, Mist, Destiny Bond, Encore, Yawn, Perish Song…) behave correctly.
- **v0.14.6 · October 26, 2026:** New trainer overview: `node tools/build-trainer-overview.mjs` builds `trainer-overview.html` (every trainer's pool by power group, shared pools, handmade sets, search and generation filter) and `trainer-pools.csv` from §5 and `data/leaders/`.
- **v0.14.7 · October 26, 2026:** The Challenge Gen choice shows your progress instead of "team pools ready": a row of 14 pips (8 gyms, Elite Four, Champion, Final Rival) filled up to the furthest trainer you beat, plus "Best: N of 14 beaten", "Cleared ✓" or "Not played yet". An opponent whose team pool is too thin can now have the same Pokémon twice (least used first) instead of being filled with unrelated Pokémon.
- **v0.15.0 · October 26, 2026:** The New run screen is a summary of your loadout as cards (remembered from last run): Trainer, Challenge (with your progress pips), Badge case, Pokémon Pool and Sprites. The cards are compact (just the choice); tap one to see the details and change it in a window, or open the badge case on its own screen, then press Start. The Badge case card appears after your first badge (the other cards are always there). Cards have an icon that follows the setting: your equipped badges in this run's zone colours, one starter per generation (dimmed when the generation is not in the pool), and a Pikachu in the chosen sprite style (animated when you pick Moving). Start has a Poké Ball. New debug panel option "Show locked and hidden choices" shows the hidden Badge case card (marked) and the locked trainers (greyed out with how to unlock them).
- **v0.15.1 · October 26, 2026:** The New run setting windows (Trainer, Challenge, Pokémon Pool, Sprites) share one layout: a short note, a grid of option tiles with the chosen one highlighted, and a footer button; they are wider and roomier. Challenge shows one tile per generation with a progress bar. Pokémon Pool has the generation's starter on each tile (tap to include or leave out). Sprites shows the same battle scene in each of the three styles side by side, with front and back sprites.
- **v0.15.2 · October 26, 2026:** The Trainer window scrolls when it gets long and shows each trainer's perk ("No perk yet" when the perk isn't in the game yet). Challenge shows the generation's most iconic Pokémon (Charizard, Lugia, Rayquaza, Dialga, Reshiram) on its card and tiles. The Pokémon Pool starters are a random starter per generation each time the screen opens, so fire, water and grass all show up. The Sprites icon is Blastoise (its Gen 4 and Gen 5 art differ clearly, unlike Pikachu). The setup cards are slightly smaller so all five fit in the frame.
- **v0.15.3 · October 26, 2026:** The badge case is a settings window like the other New run choices (it opens on top of the screen and Escape closes only the top window). The separate badge case screen is gone.
- **v0.15.4 · October 26, 2026:** Pointing at a badge in the case shows its stat boost at the strength it has in its zone (like "+5% Sp. Atk"), so you can see what the stars add without opening every badge.
- **v0.16.0 · October 26, 2026:** Badge case zones changed: always 4 rectangular zones, each with its own boost from ★ to ★★★★ in a random order (before, the stars depended on the zone's size). Zones are saved as `{ slots, boost }`; saves with the old kind get new zones.
- **v0.16.1 · October 26, 2026:** The badge case zones are fixed instead of random: `A A B B / C C C D` with A = ★, B = ★★, C = ★★★ and D = ★★★★ (the layout from the design notes). Saves from the random zones get the fixed ones.
- **v0.17.0 · October 26, 2026:** Badge case slots unlock: 3 open at the start, the rest open at 4, 8, 14, 22 and 32 badges owned (locked slots show a lock and what they need). The badge case is drawn like a Trainer Card (red card with a yellow ring, a name field, the slot count and a BADGES label; colours are CSS variables on `.case-board`). Badges now announce themselves in battle ("Rainbow Badge: …") when Rainmaker, Regrowth, Vampire, Spoils of War, Spikes or Opening Salvo act (first time per battle), and always when Second Wind or a status ward saves a Pokémon.
- **v0.17.1 · October 26, 2026:** The badge window highlights the numbers that the badge's zone made bigger (the stat boost and the effect's numbers) and shows a grey table with the stat boost and the effect's numbers for every zone level (no zone, ★ to ★★★★), with the current one marked.
- **v0.17.2 · October 26, 2026:** The badge window calls the two effects "base effect" (the stat boost, always on) and "special effect" (the badge's own trick, with the on / off switch). It adds the generation's set bonus to the numbers: a line with the total stat (base effect + set bonus), and the set bonus tiers as text (3, 5 or 8 badges of the generation give +2%, +4%, +6% to all stats).
- **v0.17.3 · October 26, 2026:** The badge window is wider with two columns: the effects and switch on the left, the grey table and the set bonus text on the right. The base effect shows the final stat number with its sum right next to it ("+3.5% Defense = 1.5% base effect + 2% set bonus"). You can flip through badges with the icons at the top, the ◀ ▶ keys or a swipe: the badges in your case when you opened it from a slot, the generation's eight when you opened it from the collection.
- **v0.17.4 · October 26, 2026:** After you win a battle the trainer you beat appears again on their platform for a few seconds. The recruit window's Lock in button is at the bottom right, next to "N of M picks left". The recruit screen shows a pick meter ("2 of 3 picks left" with dots) and has less text, and the item screen has the same meter ("1 of 2 picks taken", filling as you select); many other descriptions are shorter (New run, badge case, Trainer Upgrades, move bar, sprite and pool windows).
- **v0.18.0 · October 26, 2026:** The Team card view (the "Detailed" toggle) shows one Pokémon in the middle, picked with the small Pokémon strip above it (moved from the right column). The right column's Moves tab then only lists the moves it can learn; drag one onto a move of the centered card to replace it (empty slots take a drop too), or drag a card's moves onto each other to change their order. The Grid view keeps the Moves bar with all four slots.
- **v0.18.1 · October 26, 2026:** Bide works (it always failed before): the user stores energy for 2–3 turns without being able to act, then hits whoever last hurt it for twice the damage it took (it fails if it took none). On the Team card the abilities are in their own column next to the name and nature.
- **v0.18.2 · October 26, 2026:** The badge case window during a run is wide (card on the left, the perks on the right). Tapping the Team card opens the details window (in the Detailed view too). On the Team card the nature effect sits right after the nature, the empty held item is a visible dashed slot ("+ Held item"), and the Physical / Special / Status pills are all exactly the same width (the "Status" word is longer, so before it was wider).
- **v0.18.3 · October 26, 2026:** Battle log: a Log button next to the text speed (and while the text plays) opens a window with everything said in the battle so far, grouped by turn, with a fixed height and a scroll. A Pokémon that falls asleep or freezes is no longer locked into Petal Dance, Outrage or Rollout, so you can switch or choose again. Letter and word spacing are gone from the CSS (the info font is the body font now) along with about 70 unused rules from earlier designs.
- **v0.18.4 · October 26, 2026:** U-turn, Volt Switch and Baton Pass now let you choose which Pokémon comes in (a "Who comes in?" list after picking the move and target). The foe still brings in its next Pokémon in team order.
- **v0.18.5 · October 26, 2026:** The badge case is drawn with the Trainer Card artwork (`images/ui/trainer-card-480x340.svg`, inlined in `run-screens.js`). Its colours come from CSS variables, with ready-made colour classes on `.case-board` (red, blue, green, purple, gold, silver, bronze, black); red is used for now.
- **v0.18.6 · October 26, 2026:** Badge case window tidied: a shorter two-line intro, three equal buttons under the card (Auto-fill, Clear, Perks) and the "in the case" count removed. Eight colour dots on the Trainer Card let you pick its colour; it is saved and also used for the card during a run.
- **v0.18.7 · October 26, 2026:** The card colour dots moved next to the Auto-fill, Clear and Perks buttons under the card. The five Gen tabs in the badge case now fit on one row.
- **v0.18.8 · October 27, 2026:** The Physical / Special / Status pills are a small icon only (the name shows on hover), so move buttons no longer run off the screen. Gen 4 back sprites stand a bit lower so they reach the textbox instead of floating above it.
- **v0.19.0 · October 27, 2026:** Optional cloud save with Google login (Firebase): your progress (Trainer upgrades, badges, unlocks, Hall of Fame and the run in progress) is copied online and picked up on another device; when both changed you choose which to keep. Leaderboards for Champion wins, furthest run and flawless wins (public name = first name of the Google account). Off until a Firebase config is pasted into `js/firebase-config.js`; setup steps are in README.md and the security rules in `firestore.rules`. Multiplayer is still on the Later list.
- **v0.19.1 · October 28, 2026:** Signed-in players can choose a username (up to 16 characters) with "Change name" under the title menu. It is the name on the leaderboards and is saved with the rest of the progress; empty means the first name of the Google account.
- **v0.19.2 · October 28, 2026:** The login line under the title menu is quieter: small underlined text links (Sign in with Google, Change name, Sign out) and a short save status. The Sync now button is gone; saving is automatic.
- **v0.19.3 · October 28, 2026:** First login on a device that already has progress, for an account that also has one: a window offers Combine both (runs, wins, TP and Trainer Points add up, the higher upgrade levels are kept, badges, unlocks and the Hall of Fame are joined), Use the online save, or Keep this device.
- **v0.19.4 · October 28, 2026:** "Sign in with Google" is a normal small button again; Change name and Sign out stay small links.
- **v0.19.5 · October 28, 2026:** One Ranks board for all players instead of three tabs. Everyone starts at Z and climbs towards A. Points: 1 per battle of your furthest run (max 14), 10 per Champion win and 10 more per flawless win; the letter steps get wider towards the top (see v0.25.1 for the current steps). Each row shows the letter, name, points and a bar to the next letter. The numbers are in `js/game/ranks.js`.
- **v0.19.6 · October 28, 2026:** The leaderboards are back to tabs: the new Ranks tab (everyone, Z up to A) sits first, next to Champion wins, Furthest run and Flawless wins. The title menu is more compact, with a colour per button (green Continue, red New run, yellow Trainer Upgrades, blue Hall of Fame, purple Leaderboards).
- **v0.20.0 · October 28, 2026:** Three more leaderboard tabs: Trainers unlocked, Badges (out of 40) and Most used, which counts how often each Pokémon was in a winning Hall of Fame team across all players. The public player line now also holds the trainer count, badge count and a per-Pokémon win count (taken from the Hall of Fame). `firestore.rules` changed: publish the new version in the Firebase console.
- **v0.20.1 · October 28, 2026:** The title menu is a grid: Continue, New run and Trainer Upgrades are full-width rows, Hall of Fame and Leaderboards sit side by side.
- **v0.20.2 · October 28, 2026:** Title menu: Continue and New run side by side on top (New run alone is full width), Trainer Upgrades, Hall of Fame and Leaderboards in a row of three below. The Hall of Fame count in its button is gone.
- **v0.20.3 · October 28, 2026:** Title menu: Trainer Upgrades is back on its own row; Hall of Fame and Leaderboards share the row below it.
- **v0.20.4 · October 28, 2026:** New title screen intro text, as wide as the menu below it.
- **v0.20.5 · October 28, 2026:** Title screen intro text is one short line: "Hone your skills in this Pokémon double battle roguelike."
- **v0.20.6 · October 28, 2026:** Title screen intro text is longer again: the roguelike line plus a short description of a run (draft, recruit, 8 gyms, Elite Four, Champion, Rival, permanent faints).
- **v0.20.7 · October 28, 2026:** Title screen intro text shortened to two sentences.
- **v0.20.8 · October 28, 2026:** Title screen intro text no longer mentions fainting.
- **v0.20.9 · October 28, 2026:** All title menu buttons share the same, slightly larger padding.
- **v0.21.0 · October 28, 2026:** Illusion now works: Zoroark enters looking like the last Pokémon in the team that is still standing (name, sprite and messages) until a move hits it ("Zoroark's Illusion wore off!"). Substitute shows a doll in place of the Pokémon until it breaks. The foe AI no longer keeps using Ground moves on Flying types or immune targets, and no longer uses a second Future Sight / Doom Desire on a slot that already has one coming. Reflect, Light Screen and other field tags no longer stay on screen in the next battle. The trainer picker shows every trainer with how to unlock them (and how you unlocked the ones you have); four stay secret. The TM from a gym leader is a quiet line like the badge notice instead of a big move card.
- **v0.21.1 · October 28, 2026:** Substitute uses the real doll sprites (Gen 4, Gen 5 and moving styles, front and back) from Pokémon Showdown's sprite set, in `images/sprites/<style>/front|back/substitute.*`, instead of the placeholder drawing.
- **v0.22.0 · October 28, 2026:** 25 more trainer perks work (32 of 36; Oak, Hilda, Riley and Bianca are still planned): extra starter cards (Red R/B, Ethan G/S/C, Brendan R/S, Hilbert), one more recruit card everywhere (Mira), a 1/384 shiny chance (Lyra), more Dragon recruits (Lance), a saved Pokémon once per run (Kris), +1 level in the first gym (Silver) or at every gym (Nate), cheaper berries, stones, Guard Spec. and X items (May R/S, Juniper, Cheren), more money from Rival fights (Hugh), Potions healing 20 more (Cheryl), Fighting moves 5% more accurate (Buck), Fire, Grass and Water moves 5% harder (Chili, Cilan, Cress), best stat on recruit cards (Dawn), and starting items for Red (Battle Frontier), Steven, Barry, Marley and Rosa. Unlock texts are shorter and several unlock requirements are simpler (Ethan G/S/C, Lance, Silver, Brendan R/S, Red (Battle Frontier), Steven, Wally, Rosa). The trainer picker has a Show locked switch.
- **v0.22.1 · October 28, 2026:** Dupes clause (on by default, switch in the Pokémon Pool window on the New Run page): a Pokémon line you already had this run, including fallen and released ones, is not offered as a recruit again (it only relaxes if there would be too few cards). Locked trainers no longer say "To unlock:" in the picker.
- **v0.23.0 · October 28, 2026:** Foe Pokémon now have random IVs like recruits (15–31), so their Hidden Power is no longer always Dark. Trainer changes: new unlocks Lance (win a battle with 6 Dragon-types), Steven (6 Steel-types), Silver (recruit 5 friendship evolutions), May R/S (Win Gen 3), Red (Battle Frontier) (win every generation: the hardest unlock) and Barry (win a run in 60 minutes of play time, timed from this version on), Buck (win with a Machop line Pokémon). New perks: Red (Battle Frontier) +5% to all stats, an extra item pick and starter reroll; Barry +8% Speed and a Quick Claw; Buck +5% Attack; Cheren +5% Defense and Sp. Def; Rosa +5% Sp. Atk; Hugh +10% prize money from every battle; Dawn an extra reroll on every recruit screen; Oak shows an IV rating on recruit cards. 33 of 36 perks work (Hilda, Riley and Bianca are still planned).
- **v0.24.0 · October 28, 2026:** Cynthia (Platinum) is a playable trainer. Unlock: win a battle with her whole Platinum team on yours at once (Garchomp, Spiritomb, Roserade, Togekiss, Lucario and Milotic, exact forms). The picker shows those six Pokémon and the most of them you have had together so far. Perk: +6% Attack and Sp. Atk for your whole team. She has no back sprite in the games, so her front sprite is used from behind until a real one is added at `images/trainers/back/cynthia.png`.
- **v0.24.1 · October 28, 2026:** Cynthia has a real back sprite (`images/trainers/back/cynthia.png`, cut from the artist's sprite sheet), instead of her front sprite.
- **v0.25.0 · October 28, 2026:** The last three trainer perks work, so every trainer has one: Riley makes the weakest badge in your case 1 strength stronger (also shown in the in-run badge case), Hilda adds one extra Rare card to the recruit screen after battle 1, Bianca adds one extra free reroll to that screen.
- **v0.25.1 · October 28, 2026:** Ranks are harder to climb: the letter steps are wider (S now needs 102 points instead of 56, A about 503 instead of 375). The points stay the same: 1 per battle of your furthest run (max 14), 10 per Champion win, 10 more per flawless win.
- **v0.26.0 · October 28, 2026:** Ranks now also count badges (+1 each, up to 40) and trainers unlocked beyond the 8 everyone starts with (+1 each); to keep S hard the letter steps are wider again (S needs 137 points, A 671). The Furthest run tab is replaced by Fastest win (the fastest timed win, shown as h:mm:ss; furthest run still counts towards Ranks). Most used shows pills with who used each Pokémon ("name x 3" when a player won with it in several teams). `firestore.rules` changed (new optional `fastestWin` field): publish the new version.
- **v0.26.1 · October 28, 2026:** Cynthia unlocks when you have obtained all six of her Platinum Pokémon (Garchomp, Spiritomb, Roserade, Togekiss, Lucario and Milotic), over any number of runs, not on one team. The picker lights up the ones you already recruited and says "Obtained: x of 6".
- **v0.26.2 · October 28, 2026:** Cynthia's unlock is now "have all 6 of these in one run": Garchomp, Spiritomb, Roserade, Togekiss, Lucario and Milotic each have to be on your team at some point of the same run, not at once; fallen and released ones count. The picker lights up the ones from your best run so far.
