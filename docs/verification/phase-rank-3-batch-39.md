# Rank 3 batch 39 — Focusing Hum

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Focusing Hum (3) | A spell note on the caster for 1 minute. It carries a −2 untyped penalty to Stealth checks to Hide or Sneak. The area's other rules are in the note: a lower flat-check DC for stupefied casting, and confused creatures not attacking. |

## Rules

- **Action penalties on notes (`spell-note.js` `judgeNumbers`, `note-effects.js` `validNoteRule`):** "You take a -N penalty to <Skill> checks to <Action> and <Action>." on the caster's note becomes an untyped FlatModifier on that skill, predicated on either action. The validator allows only that shape (−1 to −4, one skill, two actions).

## Tests

1102 pass. `test/rank-3-batch-39.test.js` is new, with a negative case: the penalty on Perception (not a skill) isn't read.

A whole-corpus compile (b432 → b433) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-39-live-results.json), case `rank3Batch39`, in the `pftest` world.
- The caster's note Effect has the rule.
- A Stealth roll with `action:hide` included the −2; a plain Stealth roll didn't.
- The note has the area's text.
- **Cleanup:** fixtures removed.
