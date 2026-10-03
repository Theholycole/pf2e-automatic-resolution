# Rank 3 batch 64 — Cup of Dust

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Cup of Dust (3) | Fortitude. **Critical success:** immune for 1 hour. **Success:** Fatigued for 1 round. **Failure:** Fatigued, and 1d4 damage each hour that can't be healed (a note for the day, whose Ongoing control deals the hour's damage). **Critical failure:** 2d4 each hour. Heightening adds 1d4 / 2d4 every 3 ranks. |

## Rules

- **Hourly damage:** the daily-damage reader (`compile-ability.js`, Feast of Ashes) also reads the hourly thirst wording ("each hour … until it quenches its thirst", the drink sentences).
  - With no damage entry in PF2e's item, the text's dice are used, untyped.
  - The trigger is `hourly`.
- **Core and runtime:** `isTriggeredDamage` accepts `hourly`. The Ongoing control reads "— an hour has passed".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-64.test.js` is new. Its negative case is another quenching (not read). Feast of Ashes' tests still pass.

A whole-corpus compile (b510 → b511) changed only Cup of Dust.

## Evidence

[Live evidence](phase-rank-3-batch-64-live-results.json), case `rank3Batch64`, in the `pftest` world, at 6th rank.

| Result | Result |
| --- | --- |
| Failure | Fatigued; the hour's control: 2d4 = 4 lost |
| Critical failure | Fatigued; 4d4 = 11 lost |
| Critical success | Temporarily immune |

**Cleanup:** fixtures removed.
