# Rank 5 batch 37 — Grisly Growths

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Grisly Growths (5) | 10d6 piercing (+2d6 a rank) to the target, basic Fortitude. Unless it critically succeeds, a card starts Will saves for the creatures within 30 feet of it (it included): Failure Sickened 1, Critical Failure Sickened 2. Each is then temporarily immune for 1 hour. The ooze/protean exception is a note. |

## Rules

- **Area follow-up (`src/compiler/area-follow-up.js` `extractAreaFollowUp`):**
  - It reads the damage sentence, the exception and rot notes, the "unless … critically succeeds, creatures within N feet … must attempt … saves, after which … immune … for 1 hour" sentence, the traits sentence and the three rows.
  - The compile pre-step builds the target's plan and a second plan: a 30-foot emanation's Will table with the hour's immunity and the stated traits.
  - It sets `resolution.areaFollowUp`.
- **Validator:** in `inspectSavePlan` (the second plan must itself be executable).
- **Runtime:**
  - At Finalize, unless the target's result is a critical success, a card is posted.
  - Its button (`areaFollowUp`) starts the second plan's saves for every creature within the distance of the target.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-37.test.js` is new. Its negative cases are another gate (not read) and a zero distance (not executable).

A whole-corpus compile (b509 → b510) changed only Grisly Growths.

## Evidence

[Live evidence](phase-rank-5-batch-37-live-results.json), case `rank5Batch37`, in the `pftest` world, at 6th rank.

| Step | Result |
| --- | --- |
| Target fails | 12d6 piercing = 33 lost; the follow-up card is posted |
| Follow-up | The target and the creature 15 feet away save, not the one 40 feet away (a nearby scene creature joined too and was left out): Sickened 1 and 2, then immune |
| Target critically succeeds | No card |

**Cleanup:** fixtures removed.
