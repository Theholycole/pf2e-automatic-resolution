# Cantrip batch 1 — verification

2026-09-26. The first cantrip batch: two general rules, which also enabled one rank-1 spell.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| A degree row “takes full/double damage and is pushed N feet away from you”: the row's damage, and a GM push note on the card. Not read when the heightened text changes the distance. | Gale Blast (cantrip), Pummeling Rubble (1) |
| Terrain areas: PF2e's difficult terrain (ground movement ×2) on the spell's region, removed with it. Damage on casting (“Any creature in the area takes …”, “The scattering rocks deal …”), and hazardous terrain as an entering exposure with its own formula. Casting again ends the caster's previous area, and clearing a square is a GM note. | Scatter Scree, Bramble Bush (cantrips) |

**Also:** an Area paragraph was already guarded. The new push rule doesn't fix Repelling Pulse's heightened distance; that spell stays blocked.

## Cantrips still blocked (73), and why

| Kind | Examples | Why |
| --- | --- | --- |
| Text and PF2e data disagree | Ghostly Shift, Reinforce Eidolon | The Effect's resistance at rank 1 (1, 0) differs from the text (2, minimum 1) |
| | Song of Strength | Its Effect covers only the listed actions, not Grapple |
| | Eat Fire | The Effect lasts to the end of the next turn; the resistance is for the current turn |
| | Sting of the Sea | Circumstance vs untyped |
| Rules the module can't carry out | Allegro | Quickened with no Effect |
| | Dirge of Doom, Buzzing Bites | Condition floors in an area |
| | Protect Companion | The Life Block reaction |
| | Uplifting Overture | Aid |
| | Nudge Fate | A bonus after the roll |
| | Glimpse Weakness | The next ally's Strike |
| | Wash Your Luck | Cancels misfortune |
| | Forbidding Ward | TokenMark |
| | Manifest Will | Tradition options |
| New paths needed | Tangle Vine | A spell-attack degree Effect with Escape and heightened durations |
| | Boost Eidolon | A dice-scaled bonus and the “newer spell replaces the older one” rule |
| | Telekinetic Rend, Redistribute Potential | Two areas with a damage choice each |
| | Haunting Hymn | “only creatures in the area can hear” |
| Utility or information, with no automatable mechanics | Detect Magic, Light, Prestidigitation, Telekinetic Hand, Figment, Sigil, Message-like spells, Time Sense, Read the Air, Deep Breath, Glowing Trail, and others | Nothing to resolve beyond narration or GM rulings |

## Coverage

**Census:** **444 enabled**, up from 440. Cantrips: 47 of 120, up from 44. Rank 1: 127.
- The b76 corpus diff against b75 changed 5 plans: the four spells above, and Tornadic Gale's push rows (it stays blocked by its pull preamble).
- No variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 483/483 tests pass. `test/cantrip-batch-1.test.js` covers:
- the push rows, the terrain declaration, recast ending, the entering formula and its exposure plan;
- refusals: a heightened push distance, a push in another direction, a recast naming another spell, and hazardous terrain without its damage;
- that, without the terrain sentence, the spell is an ordinary save.

[Live evidence](phase-cantrip-batch-1-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cantripBatch1`:
- **Gale Blast:** the failure and critical failure took full and double damage. The card showed the pushes (5 and 10 feet away).
- **Scatter Scree:**
  - The region got a `modifyMovementCost` behaviour with walk ×2, and the GM got the clear-a-square note.
  - The confirmed creature's failure took the `2d4 bludgeoning` roll.
  - Casting again ended the first area (reason `recast`) and removed its region. Ending the second removed its region.
- **Bramble Bush**, in combat:
  - Only the creature in the square was exposed on casting, and took the `1d4 piercing` roll.
  - A creature that entered on a later turn got an “entered the area” exposure and took the separate `1d4 + 1 - 1 piercing` formula (rank 1).
  - The region carried the terrain behaviour. At the start of the caster's next turn the area ended (reason `duration`) and its region was removed.
- **Regressions:** `lingering`, `sustainDamage`, `forcedMovement`, `longTailBatch2`, `rank1Batch8`, `rank1Batch9` and `enemies` passed, with cleanup between them. The run left no P23 fixtures, combats or regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b76
node tools/diff-compiled-plans.mjs /tmp/phase23-b75/official-spell-compiler-report.json /tmp/phase23-b76/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b76/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cantripBatch1`, then `cleanup`.
