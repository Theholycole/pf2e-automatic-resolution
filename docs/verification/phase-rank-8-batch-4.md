# Rank 8 batch 4 — Confusing Colors, Vibrant Pattern

2026-10-03. Ranks 6–10 pass.

| Spell | Now |
| --- | --- |
| Confusing Colors | Hypnotize's lingering-cloud reading, widened: "A creature must attempt a Will save if it is inside …, enters …, ends its turn within …, or uses a Seek or Interact action on the cloud" (the last the GM's control). Dazzled while inside; Dazzled within 20 feet of the cloud is a GM note. "A creature currently affected by the cloud" skips new saves while it holds any condition the rows give (Confused, Stunned). The critical failure's Stunned for 1d4 rounds (rolled per creature; timed Stunned now accepts rolled rounds); the Confused after it is a note for the rest of the spell. |
| Vibrant Pattern | The same cloud reading. A failure is Blinded for at most 1 minute, with a Will save at the end of each of its turns once it's outside the pattern (Pressure Zone's outside-area recurring save). |

## Tests

`test/rank-8-batch-4.test.js` is new. A whole-corpus compile (b734 → b735) changed only these two spells.

## Evidence

[Live evidence](phase-rank-8-batch-4-live-results.json), case `rank8Batch4`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Confusing Colors, a creature inside when cast critically fails | Dazzled; Stunned for 2 rounds (rolled); the "Then Confused" note; the GM's Seek control refused ("already confused or stunned"); one area note |
| Vibrant Pattern, a creature inside fails | Blinded for 1 minute with the end-of-turn save |

**Cleanup:** fixtures removed.
