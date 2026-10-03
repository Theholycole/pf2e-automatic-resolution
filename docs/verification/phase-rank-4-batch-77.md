# Rank 4 batch 77 — Luring Wail

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Luring Wail (4) | Will, as a lingering, sustained 60-foot emanation: creatures in it at the cast, or that enter it, save. A creature the caster named takes –2 to its save (asked on the card). Success: Slowed 1 for 1 round. Failure: Fascinated until it leaves the area, plus a "Lured" note while it's Fascinated (it must spend an action each turn moving closer). Critical failure: Fascinated and Off-Guard until it leaves the area, plus the note (it must spend all its actions). A card reminder says that only creatures that can hear are affected. |

## Rules

- **Luring rows (`src/compiler/luring-rows.js`):**
  - It reads the lead's four sentences and the four rows.
  - It rewrites the preamble into the lingering-area trigger ("in the area when you Cast the Spell, or that enters the area"), plus the named-creature sentence, which the existing save adjustment reads.
  - The failing rows become "until it leaves the area" (`leave-area` lifetime), with a `whileCondition: fascinated` note.
- **Interpretation:** "while in the emanation and can hear" is the area lifetime; hearing is the GM's review. "Fascinated ends only for the attacked creature" is in the note. Logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-77.test.js` is new. Its negative case is another compulsion (not read).

A whole-corpus compile (b540 → b541) changed only Luring Wail.

## Evidence

[Live evidence](phase-rank-4-batch-77-live-results.json), case `rank4Batch77`, in the `pftest` world, at 4th rank. The caster stood in an empty corner, because the emanation is measured from the caster and other fixtures would join it.

| Creature | Named (GM) | Result | Fascinated | Off-Guard | Lured |
| --- | --- | --- | --- | --- | --- |
| Named | –2 | failure | yes (while in the area) | — | yes |
| Other | no | critical failure | yes | yes | yes |

The named creature then walked 75 feet out: its Fascinated and its Lured note ended. The other creature stayed Fascinated.

**Cleanup:** fixtures removed.
