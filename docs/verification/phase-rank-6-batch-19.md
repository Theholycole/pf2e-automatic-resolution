# Rank 6 batch 19 — Rose's Thorns

2026-10-03. Growing areas.

| Spell | Now |
| --- | --- |
| Rose's Thorns | A sustained lingering burst. A creature in it when it's cast, or ending its turn inside, takes 8d8 piercing (basic Reflex, heightened). On a critical failure it also takes 1d8 persistent bleed (2d8 from rank 9) and is Immobilized for 1 round or until it Escapes. The area is difficult terrain; a creature moving through takes 5 piercing per square (8 from rank 9). Each Sustain grows the burst by 5 feet. |

Runtime: the per-square hazard can take a fixed amount that changes at a rank; a lingering exposure keeps its shared damage when the hazard comes from the text.

## Tests

`test/rank-6-batch-19.test.js` is new. A whole-corpus compile (b756 → b757) changed only Rose's Thorns.

## Evidence

[Live evidence](phase-rank-6-batch-19-live-results.json), case `rank6Batch19`, in the `pftest` world.

| Step | Result |
| --- | --- |
| A creature critically fails | 33 rolled, 66 lost (doubled); 1d8 persistent bleed; Immobilized |
| The region | Difficult terrain |
| A creature moves two squares through it | 10 piercing |
| Sustain (in combat) | The burst grows from 20 to 25 feet |

**Cleanup:** fixtures and combat removed.
