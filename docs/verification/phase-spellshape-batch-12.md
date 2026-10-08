# Spellshape batch 12: family C, a spellshape's own save card

2026-10-05. Feats whose effect is a save of its own.

- **The card:** `startShapeCard` builds a spell from the feat's numbers (its basic damage, or its four rows) in the compiler's plain wording, compiles it, and starts the module's save card at the caster's DC. Riders (Prone by degree) go with it.
- **Cards at the cast:** Heraldic Proclamation (allies healed; enemies' card), Explosive Metamorphosis, Kaleidoscopic Entreaty, Vexing Tempest (the familiar's).
- **Cards with a button** (the GM targets a token): the Arrivals (the summoned creature), Secondary Detonation Array (the circle, detonating on the caster's next turn), Thundering Surge (the burst's centre), Command Undead (the undead).
- **After the spell's own card:** Grasping Spirits Spell (its target's Fortitude card).
- **Daunting Spell:** rows on the spell's own save; Stupefied ends with the last frightened.

| Feat | Now |
| --- | --- |
| Heraldic Proclamation | Allies within 30 feet regain twice the rank; enemies' basic Will card (spirit, twice the rank). |
| Explosive Arrival, Ostentatious Arrival | 1d4 per rank around the summoned creature, its type by trait. |
| Explosive Metamorphosis | 1d6 per rank of the chosen energy, basic Reflex, 5 feet around the caster. |
| Secondary Detonation Array | The circle's basic Reflex card at the caster's next turn (1d6 per rank, the spell's type). |
| Vexing Tempest | The familiar's 15-foot Reflex card: pushed; Prone on a critical failure. |
| Thundering Surge | The flat check; the burst's basic Fortitude card by its result, Prone by the stated result. |
| Kaleidoscopic Entreaty | The 10-foot Fortitude card (Dazzled, Blinded). |
| Grasping Spirits Spell | The target's Fortitude card (pulled). |
| Command Undead | The undead's Will save; the caster's minion on a failure. |
| Daunting Spell | Frightened 1/2/3; Stupefied 1/2 while frightened. |

## Tests

`test/spellshape-batch-12.test.js` is new. Coverage: 106 of 131 feats read.

## Evidence

[Live evidence](phase-spellshape-batch-12-live-results.json), case `spellshapeBatch12`, in the `pftest` world. The scene's other test tokens near the caster are caught by the "all enemies within 30 feet" and emanation cards, as the rules say.

| Step | Result |
| --- | --- |
| Heraldic Proclamation on Fireball (3rd) | The ally regained 6; the foe's basic Will card: 6 spirit |
| Explosive Arrival on Summon Animal, the burst at the ally token | Fire, the creatures beside it |
| Explosive Metamorphosis (cold) on Pest Form | The foe's basic Reflex card, cold |
| Secondary Detonation Array on Fireball, the circle at the foe | Detonated: its basic Reflex card, 3d6 fire |
| Vexing Tempest on Gust of Wind (critical failure) | The familiar's card; Prone |
| Grasping Spirits Spell on Fear | The target's Fortitude card |
| Command Undead on Harm against a level-1 undead (caster 5th) | Critical failure: its minion |
| Daunting Spell on Fear (critical failure) | Frightened 3, Stupefied 2; Stupefied gone with the frightened |
