# Rank 5 batch 48 — Consuming Darkness

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Consuming Darkness (5, focus) | Reflex, as a sustained lingering 10-foot emanation around the caster: enemies that enter it or start a turn in it save. Success: half the void and a –5-foot circumstance penalty to Speeds until it leaves the area. Failure: full and –10 feet. Critical failure: double, and Immobilized for 1 round or until it Escapes. On each round's first Sustain, the radius grows 5 feet. |

## Rules

- **Consuming shadow (`src/compiler/consuming-shadow.js`):**
  - It reads the lead (the growth, the damage, the trigger), the rows (the failure's "As success, but …" made explicit) and the damage entry.
  - The preamble becomes the lingering trigger; the growth becomes `sustainGrowth {feet, optional: false}`.
- **Mandatory growth without a hazard:**
  - The lingering compiler passes the growth through, and `isSustainGrowth` (`scripts/basic-save-core.js`) validates it.
  - The record's Sustain grows the area. For an emanation measured from the caster, which has no region, `growRegion` grows only the record's radius.
- **Speed penalties in a sustained lingering area:** the generated Speed-penalty compiler no longer skips sustained spells when the area is lingering (its controller is the Ongoing record). The corpus compile changed only this spell.

## Tests

`test/rank-5-batch-48.test.js` is new. Its negative cases are:

- an unsustained growth (refused);
- optional growth wording (not read).

A whole-corpus compile (b551 → b552) changed only Consuming Darkness.

## Evidence

[Live evidence](phase-rank-5-batch-48-live-results.json), case `rank5Batch48`, in the `pftest` world, at 6th rank (caster level 11), in combat, in an empty corner of the scene.

| Step | Result |
| --- | --- |
| Enemy starts its turn in the emanation | exposed; failure: 3d6 void (lost 5), land Speed –10 |
| Caster Sustains on the next round | radius 10 → 15 feet |
| Enemy walks out | Speed penalty gone |

**Cleanup:** fixtures removed.
