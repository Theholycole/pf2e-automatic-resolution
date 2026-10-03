# Rank 5 batch 61 — Strange Geometry

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Strange Geometry (5) | The GM places four separate, non-overlapping 10-foot cubes, lasting 1 minute. A creature in one when it's cast, or that enters one, saves (Will) once: it's immune for the spell after any result. On a success it disbelieves (nothing applied). On a failure or critical failure it gets a note for the spell's minute: the cubes' terrain is difficult for it, and leaving a cube puts it out of a random one (both the GM's). The note has a disbelief control: a Will save against the spell DC, whose success ends that creature's note only. |

## Rules

- **Twisted cubes (`src/compiler/twisted-cubes.js`):**
  - It reads the area paragraph (the cube count and size, which must match PF2e's area), the non-adjacent sentence, the save on casting or entering, the disbelief sentence, and the rows.
  - The lingering declaration is built in the hook, because the lingering compiler takes no cubes: placed, initial plus enter, the area count, separate areas.
  - Once per creature: immunity for every result, for the spell's duration.
  - The failure's note for the spell, with `disbelieve`. The exposure sentence's preamble signal is claimed by the declaration.
- **Notes:** a Will-save disbelief may now end only its own note (`endsSpell: false`, `needs: "success"`); the Ongoing control deletes that note on a success.

## Tests

`test/rank-5-batch-61.test.js` is new. It covers the declaration, the immunity, the exposures, the failure note and its disbelief, a cube size other than the item's (not read), and adjacent cubes allowed (not read).

A whole-corpus compile (b605 → b606) changed only Strange Geometry.

## Evidence

[Live evidence](phase-rank-5-batch-61-live-results.json), case `rank5Batch61`, in the `pftest` world, at 5th rank.

| Step | Result |
| --- | --- |
| Four cube regions | The record holds 4 regions |
| A creature in one when cast fails | The note, 1 minute |
| Another walks into a cube and succeeds | No note |
| It leaves and enters another cube | Not asked again |
| The first disbelieves (Will) | "disbelieved": its note gone; the cast still active |

**Cleanup:** fixtures, regions and cast removed.
