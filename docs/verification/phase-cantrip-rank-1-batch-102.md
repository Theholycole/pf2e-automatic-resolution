# Cantrip / rank 1 batch 102 — Scouring Sand

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Each creature in the area when you Cast this Spell or that ends its turn in the area must attempt a Reflex save.”: a sustained lingering burst (existing family) | Scouring Sand (1) |
| “… Dazzled for 1 minute or until it uses an Interact action …” (existing Interact lifetime); critical failure “also Blinded for its next action”: an Effect ended by a “took its next action” control | Scouring Sand |
| The plant-based terrain becoming loose: a GM reminder on the card | Scouring Sand |
| The counteract against Entangling Flora and other plant-terrain effects: the card's Counteract control, with the overlap and the 24-hour immunity in its text | Scouring Sand |
| Heightened (3rd) moving the burst on Sustain: a GM note to move the region. Heightened (6th) is checked against the item's data (120 feet, 20-foot burst) | Scouring Sand |

**Kept strict (tests):** it isn't read with any of these changes:
- another immunity, or added damage;
- another kind of terrain;
- another overlap rule;
- an added effect on the move;
- a heightened area that doesn't match the data;
- an added condition on the terrain.

A timed condition can't also end “at its next action”.

## Coverage

**Census:** **583 enabled**, up from 582.
- The b185 corpus diff against b184 changed only Scouring Sand. Captivating Adoration (rank 4, also “for its next action”) stays blocked on its other rules.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 696/696 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-102-live-results.json), case `cr1Batch102`:
- **When cast:** the critical failure got Dazzled and Blinded. PF2e's Blinded overrides Dazzled, so only Blinded shows. The failure got Dazzled.
- **Card:** it shows the terrain reminder and the Counteract control with its text.
- **Controls:** the critically failed creature had two, Interact (Dazzled) and next action (Blinded). Using “next action” left only Dazzled.
- **Turn end:** in combat, a creature ending its turn in the burst got a turn-end exposure. It failed and became Dazzled.

**Regressions:** `cr1Batch100` (Earth's Bile) passed. Its leftover `PFTEST` region was deleted, and no combats remain.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b185
node tools/diff-compiled-plans.mjs /tmp/phase23-b184/official-spell-compiler-report.json /tmp/phase23-b185/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```
