# Rank 4 batch 75 — Trickster's Twin

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Trickster's Twin (4, focus) | Will. Each affected result gives a "Trickster's double" note for the spell's 1 minute (the target believes the caster is at the double; a hostile action against it ends the spell). When a listed event happens, the GM uses the Disbelieve control (user decision: disbelief as a control), which ends the spell on disbelief. The threshold depends on the result: success, automatic (no roll); failure, a Will save needing a success; critical failure, a Will save needing a critical success. |

## Rules

- **Twin illusion (`src/compiler/twin-illusion.js`):**
  - It reads the lead (the double within 100 feet, the save), the success row's three sentences, and the two "As success, but … must (critically) succeed at a Will save to disbelieve" rows.
  - It gives each affected row a note with `disbelieve {statistic: will, endsSpell, needs}`.
- **Disbelieve, generalized:**
  - `scripts/note-effects.js` accepts a Will-save disbelief with `needs` of automatic, success or critical success.
  - `scripts/stored-trigger-runtime.js` rolls the Will save, or skips the roll when the disbelief is automatic, and compares against the threshold.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-75.test.js` is new. Its negative cases are:

- an invalid threshold (refused);
- another threshold wording (not read).

A whole-corpus compile (b536 → b537) changed only Trickster's Twin.

## Evidence

[Live evidence](phase-rank-4-batch-75-live-results.json), case `rank4Batch75`, in the `pftest` world, at 4th rank (caster level 7, DC 24), one cast per result.

| Result | Disbelieve | Rolled | Outcome |
| --- | --- | --- | --- |
| Success | automatic | — | disbelieved, spell ended |
| Failure | Will, needs success (+40) | success or better | disbelieved, spell ended |
| Critical failure | Will, needs critical success (+23) | success | still believed, spell active |

The case was run until the critical-failure check rolled a plain success, so the evidence shows a success that does not disbelieve. An earlier run's critical success did disbelieve.

**Cleanup:** fixtures removed.

**Housekeeping:** `/tmp` reached its quota during this batch's compile. Old compile outputs `/tmp/phase23-b1`…`b519`, which can be regenerated, were deleted. b520 and later are kept.
