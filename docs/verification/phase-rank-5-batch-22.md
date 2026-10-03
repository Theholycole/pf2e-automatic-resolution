# Rank 5 batch 22 — Scouring Pulse

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Scouring Pulse (5) | A 10-foot cylinder, 6d8 vitality damage, Reflex save, written out as the basic save's four rows. Failure and critical failure add 1d8 persistent vitality (2d8 from 8th rank, which also has 9d8 initial damage from PF2e's data). Those rows get a "Halo of light" note, which is removed when the persistent damage ends. |

## Rules

- **Persistent halo (`persistent-halo.js` `rewritePersistentHalo`):** it reads:
  - the Area paragraph, which must be the item's cylinder;
  - the damage sentence and the "Creatures that fail the save also take … persistent … damage" sentence;
  - the two halo sentences;
  - the fixed Heightened rank, where PF2e's data must give the text's initial damage, with the persistent "2dX" and the extra light rounds.

  It writes four rows with the persistent formula "(1 + floor(@item.rank / R))dX" (the text's numbers). The failing rows get a note with `whilePersistent`; the existing persistent-link runtime removes it.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-22.test.js` is new. Its negative case is an Area paragraph other than the item's. `test/persistent-damage-family.test.js` no longer lists Scouring Pulse as gated, since its persistent damage is now compiled.

A whole-corpus compile (b457 → b458) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-22-live-results.json), case `rank5Batch22`, in the `pftest` world: two undead, cast at 5th rank.
- The damage was 6d8 vitality = 21.
- On a success the first undead lost 10 and got no halo.
- On a failure the second lost 21, with 1d8 persistent vitality and the Halo note.
- Deleting the persistent damage removed the note.
- **Cleanup:** fixtures removed.
