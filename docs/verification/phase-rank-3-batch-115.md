# Rank 3 batch 115 — Aqueous Orb

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Aqueous Orb (3) | A sustained lingering 10-foot orb (a 5-foot-radius area) the GM places and rolls by moving the region. Its only exposure is the GM's control: a creature the orb tries to move through rolls a Reflex save, once per turn per creature (repeats that turn are refused). The rows are GM notes: on a success it lets the orb pass or is pushed along; on a failure it's engulfed (moves with the orb, holds its breath, gets free by Swimming at Athletics DC 10 or Escaping against the spell DC — the Escape ends the note); on a critical failure it can't Swim free. Rolling, passing through and fires are a reminder. |

## Rules

- **`src/compiler/twin-illusion.js`:** `rewriteRollingOrb` reads the eight sentences, the three rows and the Swim DC. It returns the lingering wording, the area (half the diameter), the notes (the engulfed ones with `escape`), the GM action and the reminder.
- **`compileSpell`:** the twin step replaces the area's events with the GM's action (as Unbounded Sphere's crossing).

## Interpretation

- **"Tries to move through" is the GM's call.** The control is used once per turn for each creature, matching "only once per turn".
- **Engulfed is a note.** It is not a condition; the Escape ends it, and Swimming is the GM's.
- **The fires are a reminder.** That covers putting them out and counteracting magical ones.

## Tests

`test/rank-3-batch-115.test.js` is new. It covers the area, events and GM action, the notes, and a different save (not read).

A whole-corpus compile (b639 → b640) changed only Aqueous Orb.

## Evidence

[Live evidence](phase-rank-3-batch-115-live-results.json), case `rank3Batch115`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The plan | 5-foot radius; the GM action; no automatic events |
| The control on the creature, a failed save | The engulfed note, with its Escape and Swim DC 10 |
| The control again that turn | Refused ("already exposed for this action") |

**Cleanup:** fixtures and region removed.
