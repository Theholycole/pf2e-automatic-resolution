# Rank 3 batch 45 — Shroud of Flame

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shroud of Flame (3) | The caster's 10-foot emanation, sustained for 1 minute. Each creature in it takes 3d6 fire damage (+1d6 per rank) with a basic Reflex save when the spell is cast and the first time it is sustained each round. A retaliation marker on the caster lasts as long as the area: Retaliate deals 3 fire (+1 per rank) to a creature that touched the caster. |

## Rules

- **Lowercase Sustain (`lingering-area-compiler.js`):** "the first time you sustain it each round" (lowercase) is read like "Sustain".
- **Touch retaliation on a lingering area:** "Each creature that hits you with an unarmed attack, Grapples you, or otherwise touches you takes @Damage[N[type]] damage." with "Heightened (+1) The damage caused by touching you increases by 1, …" becomes `lingering.retaliation` on the caster's emanation, with the formula "N + @item.rank - rank".
  - It is validated in `basic-save-core.js`.
  - `startLingering` puts the marker Effect on the caster as a record entry carrying the retaliation metadata. That entry gets the existing Retaliate control, and ending the record removes the marker.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-45.test.js` is new. Its negative case is a touch step other than +1.

A whole-corpus compile (b451 → b452) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-45-live-results.json), case `rank3Batch45`, in the `pftest` world, cast at 5th rank.
- The adjacent creature's cast exposure used Reflex. On a failure it took 5d6 fire = 13.
- The caster has the marker. Retaliate rolled 5 fire, and the creature lost 5.
- Ending the spell removed the marker.
- **Cleanup:** fixtures removed.
