# Rank 9 batch 5 — Voracious Gestalt

2026-10-03. Growing areas.

| Spell | Now |
| --- | --- |
| Voracious Gestalt | The caster's sustained 30-foot emanation. When cast, it deals 14d6 void (basic Fortitude; 16d6 at 10th). A creature ending its turn inside takes (rank − 3)d6 void: 6d6, or 7d6 at 10th. The GM's review leaves out creatures the caster doesn't choose and creatures that aren't living (a note). A GM control adds a slain creature's soul: once a round, the emanation grows 20 feet and the turn damage gains 1d6. Whether a creature was threat enough is the GM's call (a note). |

Runtime: a lingering area's turn exposures may have their own damage plan (dice from the cast rank); a new GM control, "soul-growth", grows the caster's emanation and adds a die, once a round.

## Tests

`test/rank-9-batch-5.test.js` is new. A whole-corpus compile (b757 → b758) changed only Voracious Gestalt.

## Evidence

[Live evidence](phase-rank-9-batch-5-live-results.json), case `rank9Batch5`, in the `pftest` world. The scene's other creatures were left out at review (the caster's choice).

| Step | Result |
| --- | --- |
| Cast (rank 9) | The creature 10 feet away saves against 14d6 void |
| It ends its turn inside | 6d6 void |
| The GM adds a soul | Radius 50 feet; the turn damage becomes 7d6 |
| A second soul in the same round | Refused |
| The creature 40 feet away ends its turn | Now inside: 7d6 void |

**Cleanup:** fixtures and combat removed.
