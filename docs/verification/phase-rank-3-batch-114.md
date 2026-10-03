# Rank 3 batch 114 — Shifting Sand

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shifting Sand (3) | A sustained lingering burst of difficult terrain. Each creature standing in it holds an in-area Effect: −1 status to Balance, Tumble Through, High Jump and Long Jump checks (−2 at 5th, −3 at 7th, −4 at 9th, PF2e's bracketed value at the cast rank), with a toggle for "ignores the penalty this turn". A creature entering or starting its turn in it rolls a Reflex save; a critical failure is Immobilized until it Escapes. The rows' "ignores the terrain or penalty until the end of its turn" and the critical failure's Prone (when already immobilized) are GM notes. Moving the area on Sustain, carrying those it holds, is a reminder. |

## Rules

- **`src/compiler/twin-illusion.js`:** `rewriteShiftingSurface` reads the six sentences (after the "Area (continued)" paragraph), the four rows and each heightened step. It returns the lingering wording, the notes, the member rules (bracketed by level) and the reminder.
- **`compileSpell`:** the twin step adds notes on every row and the `memberRules` to the lingering declaration.
- **Runtime:** `ongoing-families` `syncLingeringMembers` gives each creature inside an Effect with the area's rules, at the cast rank, on start and on every reconcile. A creature that leaves loses it.
- **Validation:** member rules may only be toggles and status or circumstance modifiers.

## Interpretation

- **"Ignores … until the end of its turn" is the GM's.** Switching the penalty off uses the toggle; ignoring the difficult terrain is a note.
- **The Prone needs a second immobilization.** It applies only if the creature was already immobilized by the sand, so it is a note.

## Tests

`test/rank-3-batch-114.test.js` is new. It covers the events, terrain, sustained area, member rules and brackets, the critical failure, and a different penalty step (not read).

A whole-corpus compile (b638 → b639) changed only Shifting Sand.

## Evidence

[Live evidence](phase-rank-3-batch-114-live-results.json), case `rank3Batch114`, in the `pftest` world, cast at 5th rank, sustained in combat.

| Step | Result |
| --- | --- |
| Two creatures inside | Both hold the in-area Effect |
| Acrobatics to Balance | −2 status |
| A plain Acrobatics check | No penalty |
| Turn-start save, critical failure | Immobilized |
| The other creature walks out | Its Effect is removed |

**Cleanup:** fixtures, combat and region removed.
