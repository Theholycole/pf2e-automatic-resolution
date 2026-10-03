# Rank 5 batch 7 — Glacial Skewer

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Glacial Skewer (5) | A ranged spell attack. **Hit:** 4d10 cold and 4d4 piercing, and a 10-foot push (the GM's reminder). **Critical hit:** double damage and a 20-foot push. On either, the card asks the GM whether the target was pushed into an obstacle or structure that's Large or larger; "yes" gives Immobilized for 1 minute, ended by Escape. |

## Rules

- **`spell-attack-table.js`:**
  - The hit-then-critical form also reads "On a critical hit, the target takes double damage and is pushed …".
  - "If the target is pushed into an obstacle or structure that's Large or larger, the target becomes … and is @C for N minute(s) or until it Escapes." is set aside and added to both hit rows (only with a push on both).
- **`compile-ability.js`:** a spell-attack table's condition gets the GM-question gate for that sentence (row rules aren't run on attack tables, so only this gate is added). The save rows' gate pattern also accepts it.
- **`residual-prose.js`:** the gated sentence's "pushed" is the row's push.

## Tests

1037 + 1 = 1038 pass. `test/rank-5-batch-7.test.js` is new, with a negative case: an obstacle of another wording stays blocked.

A whole-corpus compile (b382 → b383) changed only Glacial Skewer.

## Evidence

[Live evidence](phase-rank-5-batch-7-live-results.json), case `rank5Batch7`, in the `pftest` world.
- **Two targets:**
  - The hit lost 28 and, with the GM's "yes", was Immobilized for 1 minute.
  - The critical hit lost 56 (double) and, with "no", wasn't.
  - The 10- and 20-foot push reminders appeared.
- **Run note:** the first run looked for the question text after both answers; the card then shows "GM answered", which the case now checks.
- **Cleanup:** fixtures removed.
