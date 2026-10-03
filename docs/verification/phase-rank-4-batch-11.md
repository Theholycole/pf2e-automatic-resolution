# Rank 4 batch 11 — Anathematic Reprisal, Life-Draining Roots

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Anathematic Reprisal (4) | Basic Will save for 4d6 mental. **Failure / critical failure:** Stupefied 1 for 1 round. The target is then temporarily immune for 1 minute (a later cast finds it immune). The cast limit ("only when a creature actively commits a unique act of anathema", with its example) is on the card. |
| Life-Draining Roots (4) | Basic Reflex save for 8d6 piercing in the line. The caster gains 1d4 temporary Hit Points for each living creature among the targets, judged by PF2e's mode of being, for 1 minute. |

## Rules

- **General basic-save rider (`compile-ability.js`):**
  - Reads the spell's timed immunity ("The creature is then temporarily immune for N minutes.") with `compileSaveImmunity`.
  - On a reaction, it reads "You can cast this spell only when …" and its "For example, …" as a `cast-condition` reminder; `basic-save-core.js` accepts that reminder kind.
- **Damage benefit (`damage-benefit-compiler.js`):**
  - "You gain NdM temporary Hit Points for every living creature in the line/area" is the `dice-per-living` measure (an area is required).
  - The runtime counts the applied targets whose mode of being is living, rolls the dice once for each (posted to chat), and grants the temporary HP through the usual Effect.
- **Interpretation (logged):** "every living creature in the line" counts every living target, whatever its save.

## Tests

1048 pass. `test/rank-4-batch-11.test.js` is new, with negative cases:
- the cast limit on a non-reaction stays blocked;
- the benefit without a stated duration stays blocked.

## Evidence

[Live evidence](phase-rank-4-batch-11-live-results.json), case `rank4Batch11`, in the `pftest` world.
- Anathematic Reprisal: a failure gave Stupefied 1 and lost 16. A 1-minute immunity Effect was created; a second cast found the target immune; the cast limit was on the card.
- Life-Draining Roots: two living targets and one undead (PF2e modes living, living, undead), all failing. The caster rolled 2d4 = 2 temporary HP for 1 minute; each target lost 31.
- **Cleanup:** fixtures removed.
