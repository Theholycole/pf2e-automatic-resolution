# Rank 9 batch 9: group 4, part 3

2026-10-05. The last five spells of feature group 4.

| Spell | Now |
| --- | --- |
| Fateful Condemnation | Will save for mental damage by row (4d6, 8d6, 16d6, for 1 minute). The failing rows set up a 10-foot aura that follows the doomed creature. Inside it, the doomed creature and its allies take a status penalty by degree. On a critical failure, its allies in the aura are also Slowed 1. |
| Overwhelming Presence | Failure: a tribute counter starting at 6 that grants Fascinated while it is above 0. The GM lowers it for each tribute paid. Temporary immunity for 1 round. |
| Tanglecurse | The spores roll Enfeebled, Clumsy, Drained or Stupefied. The bloom is a region around the target that follows it, 5, 10 or 15 feet by degree. |
| Undertaker | The GM is asked "on the ground?". Then row damage and Prone. On a critical failure, a stone-sarcophagus note. |
| Seize Identity | A controls card. A disguise PF2e Effect and Silence are applied with the native Effects. The Sustain's save escalates the aging Enfeebled. |

New runtime: an aura that follows the target, with ally penalties and conditions; a counter badge on note Effects; and a rolled condition by degree.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-9-batch-9.test.js` is new. A whole-corpus compile (b782 → b784) changed only these five spells.

## Evidence

[Live evidence](phase-rank-9-batch-9-live-results.json), case `rank9Batch9`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Fateful Condemnation, failure | 56 lost. The doomed creature and its ally get the penalty; the outsider doesn't. The ally is Slowed 1. |
| Overwhelming Presence, failure | Counter 6, then cleared by paying |
| Tanglecurse | Drained 1 rolled; the region follows the target |
| Undertaker, critical failure, on the ground | 80 void damage and Prone |
| Seize Identity | Disguise and Silence; 11 lost; the Sustain's save gives Enfeebled 2 |
