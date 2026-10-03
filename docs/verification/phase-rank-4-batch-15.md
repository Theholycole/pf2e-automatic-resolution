# Rank 4 batch 15 — Mystic Beacon, Magnetize, Elemental Sense

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Mystic Beacon (4) | A note until the start of the caster's next turn: the target's next damaging or healing spell is heightened one rank higher (the GM's). |
| Magnetize (4) | A note on the target for 1 minute: the redirection of metal attacks, and the −2 to other attackers within 15 feet "whenever" they strike someone else (situational, the GM's). |
| Elemental Sense (4) | A note on the caster for 10 minutes with the chosen sense (seeing Invisible creatures as Concealed is what the caster perceives). |

## Rules

- **Spell notes (`spell-note.js`):**
  - "… as if the spell were heightened N rank higher" restates another spell's heightening, not a number to apply.
  - "whenever" is situational.
  - Mechanoreception's "You can see @C creatures and objects" and "They appear to you as translucent shapes, and they are @C to you" are mentions.

## Tests

1064 pass. `test/rank-4-batch-15.test.js` is new, with a negative case: Magnetize's penalty without its "Whenever" stays blocked.

## Evidence

[Live evidence](phase-rank-4-batch-15-live-results.json), case `rank3Batch30` (one case for rank 3 batch 30, rank 4 batch 15 and rank 5 batch 9), in the `pftest` world.
- Mystic Beacon: the note lasts 1 round.
- Magnetize: the note on the ally lasts 1 minute.
- Elemental Sense: the note lasts 10 minutes.
- **Cleanup:** fixtures removed.
