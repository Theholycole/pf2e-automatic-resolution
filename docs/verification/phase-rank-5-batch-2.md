# Rank 5 batch 2 — Glossolalia

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Glossolalia (5) | The target rolls a Will save. **Success:** a 1-round note Effect: its language is unintelligible, it can't communicate ideas, and its linguistic actions fail. **Failure:** that, plus it can't cast spells that require incantations (subtle spells don't), for 1 round. **Critical Failure:** the same for 1 minute. |

## Rules

- **The item duration "varies" (`compile-ability.js`):** a save spell whose every row's lasting part is a note with its own stated time (nothing else) takes its duration from the rows (`outcome`). Before, the text duration was pending.
- **"As failure, except the duration is 1 minute." (`note-effects.js`, whole-row notes):** the stated time now replaces the named row's, and that row's own "For 1 round," lead is dropped. Before, the critical failure's note said "The duration is 1 minute." but lasted 1 round.
- **Side effect:** the corpus compile also changed Earthbind's plan, which is still not enabled.

## Tests

988 + 1 pass. `test/rank-5-batch-2.test.js` is new and checks the duration and each row's note time.

A whole-corpus compile (b357 → b358) changed Glossolalia (and Earthbind, as above).

## Coverage

**Census:** **1174 enabled** (milestone; 1170 non-ritual), up from 1173. Rank 5: 81 of 202.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-5-batch-2-live-results.json), case `rank5Batch2`, in the `pftest` world.
- **Critical success:** no Effect.
- **Success:** one note, 1 round, no incantation rule.
- **Failure:** one note, 1 round, with the incantation rule.
- **Critical failure:** one note, 1 minute, with it.
- **Cleanup:** fixtures removed.
