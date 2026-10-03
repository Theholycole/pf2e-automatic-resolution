# Rank 5 batch 31 — Gluttonous Growth and Grasping Earth

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Gluttonous Growth (5) | A sustained burst of difficult terrain (ground and air). A creature that begins its turn inside saves (Reflex) unless the spell already holds it Grabbed or Restrained. **Success:** Grabbed for 1 round. **Failure:** Grabbed until it Escapes. **Critical failure:** Restrained until it Escapes. Each Sustain deals every creature it holds 4d6 piercing (+2d6 a rank, per the text). |
| Grasping Earth (4) | A sustained burst: a save when cast and at the end of a turn inside. **Failure:** Grabbed until it Escapes. **Critical failure:** Restrained until it Escapes. The first Sustain each round deals 1d6 bludgeoning to the grabbed and 2d6 to the restrained (+1d6 / +2d6 every 2 ranks). |

## Rules

- **Held damage (`src/compiler/held-damage.js` `rewriteHeldDamage`):**
  - It reads the hold rows, the Escape sentence, the Sustain damage per held condition and its heightening.
  - It declares `lingering.heldDamage` (entries per condition, with their step) and, for "unless it's already Grabbed or Restrained", `lingering.skipWhile`.
- **Runtime (`ongoing-families.js`):**
  - Sustain rolls `applyHeldDamage` at the cast's rank for each creature that one of this spell's outcome Effects holds; Restrained is preferred over Grabbed.
  - `skipWhile` skips the turn's save for creatures the spell holds.
  - When the area ends, the spell's hold Effects end (`clearLeaveArea`).
- **Validator (`basic-save-core.js`):**
  - It accepts `heldDamage` only for conditions that the rows apply.
  - It accepts `skipWhile.slugs` and walk-and-fly terrain.
- **Interpretations:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-31.test.js` and `test/rank-4-batch-48.test.js` are new. Their negative cases are a broken held condition (not executable) and another damage step (not read). `test/lingering-area.test.js` no longer expects Gluttonous Growth to be refused.

A whole-corpus compile (b496 → b497) changed only these two spells.

## Evidence

[Live evidence](phase-rank-5-batch-31-live-results.json), cases `rank5Batch31` and `rank4Batch48`, in the `pftest` world, in combat.

| Case | Result |
| --- | --- |
| Gluttonous Growth (5), start of turn, failure | Grabbed; the caster's Sustain: 4d6 piercing = 16 lost; no new save on its next turn; Grabbed ends with the spell |
| Grasping Earth at 6th, when cast, critical failure | Restrained; the first Sustain: 4d6 bludgeoning = 16 lost; Restrained ends with the spell |

**Cleanup:** fixtures removed.
