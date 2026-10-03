# Rank 5 batch 85 — Transmute Rock and Mud

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Transmute Rock And Mud (5) | **The caster's option** (a dialog, or the `option` option): rock to mud on a floor, on a deep floor, or from a ceiling; or mud to rock. **The area** is the GM's selected region (2 adjacent 10-foot cubes, +1 per 2 ranks) or PF2e's template. **On a floor** the region becomes difficult terrain that stays (greater difficult when 3 feet deep, or a DC 10 Swim). **From a ceiling**, the creatures inside get a basic Reflex save card for 8d6 bludgeoning, and the terrain too (the GM enlarges it 10 feet). **Mud to rock**: the creatures inside get a Reflex save card: Prone on a success; Grabbed for 1 round on a failure; Restrained for 1 round on a critical failure. |

## Rules

- **`src/compiler/rock-mud.js`:** reads the area, the lead, both options (the result rows) and the Heightened entry.
- **`compile-ability`:** the ceiling's basic save (the text's damage, the `phaseFormula` evidence) and the mud's save are compiled plans.
- **Runtime:** new kind `rock-mud`.

## Interpretation

- **Where the mud is** (a floor, how deep, a ceiling) is the caster's pick; whether the stone qualifies (non-magical, unworked, unattended) is the GM's.
- **The terrain stays** on the region ("until natural conditions … disperse"); the GM removes it.

## Tests

`test/rank-5-batch-85.test.js` is new. It covers the data, both plans (supported) and an unrecognised clause (not read).

A whole-corpus compile (b693 → b694) changed only Transmute Rock And Mud.

## Evidence

[Live evidence](phase-rank-5-batch-85-live-results.json), case `rank5Batch85`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A floor; a deep floor | Movement cost 2; 3 (2 cubes) |
| A ceiling; the creature inside fails | One target; 28 bludgeoning; the one outside untouched |
| Mud to rock; it critically fails | Restrained; the one outside not |
| At 7th | 3 cubes |

**Cleanup:** fixtures and regions removed.
