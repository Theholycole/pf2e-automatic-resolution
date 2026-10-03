# Rank 3 batch 19 — Wall of Shadow, Wall of Water (note walls)

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Wall of Shadow (3) | A spell note (like Wall of Stone): the wall's text at the cast rank, so the 5th- and 7th-rank darkvision lines appear from those ranks. |
| Wall of Water (3) | A spell note whose card has the Counteract button: the caster's counteract check against a magical fire the GM names (its DC and rank). Putting out non-magical fires, projectiles and the aquatic rules are in the note. |

## Rules (`spell-note.js`)

- **Mentions:** "They treat targets seen through the wall as Concealed." is a mention (what creatures see through the wall), not a grant.
- **Base counteract:** "It also attempts to counteract any magical fires in its area." is one, read by the card's button.
- **Passive counteract:** "If the wall fails to counteract a given fire, it can't counteract that fire for the duration of the spell." restates that counteract, so it isn't another.
- **Situational numbers:** "For instance, …" sentences are examples of rules the GM applies (Wall of Water's aquatic −2), so they're situational.
- **Debugging:** `SPELL_NOTE_DEBUG=1` prints which check refused a spell (the line in `compileSpellNote`).

## Tests

1015 + 2 = 1017 pass. `test/rank-3-batch-19.test.js` is new, with negative cases:
- a real grant in Wall of Shadow's sentence;
- a counteract sentence that isn't the restatement.

A whole-corpus compile (b370 → b371) changed only these two.

## Evidence

[Live evidence](phase-rank-3-batch-19-live-results.json), case `rank3Batch19`, in the `pftest` world. It passed on the first run.
- **Wall of Shadow at 5th:** a 1-minute note including the darkvision line.
- **Wall of Water:** a 1-minute note; its card's button counteracted "Magical flames" (DC 10, rank 1), and the result card said so.
- **Cleanup:** fixtures removed.
