# Rank 4 batch 86 — Implement of Destruction

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Implement of Destruction (4) | The enemy's Will save. Each row (success, failure, critical failure) is a note on the enemy with Ongoing controls the GM uses when the target weapon hits it or critically hits it. Success: the first hit deals 2d6 mental (+1d6 every 2 ranks), then the note ends. Failure: each hit deals 2d6 persistent mental (+1d6). Critical failure: 4d6 persistent mental (+2d6). After a failure, a critical hit also makes it Doomed 1 for as long as that persistent damage lasts; after a critical failure, Doomed 1. The weapon is a reminder. |

## Rules

- **Destruction implement (`src/compiler/destruction-implement.js`):**
  - It reads the lead, the target line (the weapon), the rows and the heightening.
  - The rows become notes with `triggeredDamage`: the dice, the persistent flag, the frequency and the critical hit's condition.
  - The targeting becomes "1 enemy", with the enemy predicate.
- **New trigger `weapon-hit`:**
  - Once (ending the note) or each hit (persistent only). An optional `criticalCondition` (a PF2e condition and value, while the persistent damage lasts or not) gives a second control, "critically hit".
  - The persistent link is a runtime Effect (GrantItem at the value) that the persistent-link reconciler removes when that damage ends.
  - Validator: as above.
- **Interpretation:** the critical hit's added damage isn't doubled ("deals an additional"). After a critical failure, "the enemy is doomed 1" isn't tied to the persistent damage. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-86.test.js` is new. It covers the notes, the enemy predicate, persistent damage only once (refused), and another heightening (not read).

A whole-corpus compile (b574 → b575) changed only Implement of Destruction.

## Evidence

[Live evidence](phase-rank-4-batch-86-live-results.json), case `rank4Batch86`, in the `pftest` world, at 4th rank (caster level 7).

| Step | Result |
| --- | --- |
| Success, the weapon hits | 2d6 mental = 8, lost 8; the note ended |
| Failure, the weapon hits | 2d6 persistent mental on the creature; no Doomed; the note stays |
| Failure, a critical hit | Doomed 1 (linked Effect) |
| Its persistent mental damage ends | Doomed gone |

**Cleanup:** fixtures removed.
