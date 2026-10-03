# Rank 8 batch 5 — Canticle of Everlasting Grief, Warp Mind

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Canticle of Everlasting Grief | Each row's damage (half, full, double) and PF2e's Effect for that result, proved against the text: bonuses of the circumstance and status types suppressed, the row's Frightened granted (1, 3 or 4), the row's duration (1 round, 1 week, unlimited), and on the critical failure the allies' aura within 15 feet. The rows don't apply Frightened a second time. PF2e's Effect keeps its Frightened and aura to "the creature whose origin it is", which would read the caster once the module records the cast; the module binds them to the cursed creature itself. |
| Warp Mind | "The target spends the first action on its next turn with the Confused condition" is Confused until it has completed its first action on its next turn (the existing first-action lifetime). Immune for 10 minutes after any result. The "effects happen instantly" sentences are a GM reminder about what can still end them. |

## Tests

`test/rank-8-batch-5.test.js` is new. A whole-corpus compile (b735 → b736) changed only these two spells.

## Evidence

[Live evidence](phase-rank-8-batch-5-live-results.json), case `rank8Batch5`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Canticle: failure / critical failure | 46 / 92 damage; the 7-day Effect with Frightened 3 / the unlimited Effect with Frightened 4 and the aura (which reached the adjacent ally, as PF2e's Effect intends; that ally keeps its own Frightened 3) |
| Warp Mind: success / failure | Confused until its first action next turn / Confused for 1 minute; both immune for 10 minutes; the reminder on the card |

**Cleanup:** fixtures removed.
