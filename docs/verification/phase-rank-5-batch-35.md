# Rank 5 batch 35 — Blood-Feasting Breath

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Blood-Feasting Breath (5) | The first 30-foot cone: 5d6 void (+1d6 a rank) to living creatures, basic Fortitude. After Finalize, the card heals the caster and the living creatures the GM targets in the second cone by the most any one creature lost. |

## Rules

- **Feast heal (`src/compiler/feast-heal.js` `rewriteFeastHeal`):**
  - It reads the two-cones Area line, the first cone's damage (the item's entry), the second cone's healing sentence and the heightening.
  - It writes the first cone's basic save for living creatures, and `resolution.healSpread`.
- **Validator:** in `inspectSavePlan`.
- **Runtime (`spreadHealing`):**
  - The card button heals the caster and the targeted living creatures by the most HP lost.
  - A creature from the first cone, or a creature that isn't living, is refused.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-35.test.js` is new. Its negative cases are another measure (not read) and a changed measure (not executable).

A whole-corpus compile (b506 → b507) changed only Blood-Feasting Breath.

## Evidence

[Live evidence](phase-rank-5-batch-35-live-results.json), case `rank5Batch35`, in the `pftest` world, at 6th rank.

| Step | Result |
| --- | --- |
| First cone: failure, success | 22 and 11 lost (6d6 void) |
| Second cone: caster (100 HP), targeted ally (100 HP) | Both regain 22 (122) |

**Cleanup:** fixtures removed.
