# Rank 3 batch 57 — Spirit Veil

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Spirit Veil (3) | The caster gets PF2e's Concealed for 1 minute, plus a note: Hidden from undead with Invisibility's effects against their precise senses, and the spell ends on Interacting with an undead or a hostile action. **Heightened (+1):** one more willing target a rank (targeted when casting), each getting the same condition and note. More targets are refused. |

## Rules

- **Condition + note (`spell-note.js` `compileConditionNote`):**
  - A new grant reads "You become [C] to all creatures, and you are [C] from X creatures regardless of what precise senses they have; this grants the effects of [S], but against all the X creature's precise senses."
  - The first condition is applied. The second depends on the observer, so it stays in the note. The grant is allowed two condition links.
- **Heightened targets:**
  - "Heightened (+N) You can target one additional willing creature within F feet." on the caster's own grant becomes `conditionNote.heightenedTargets`.
  - The runtime applies the grant to the caster plus up to floor((rank − base)/N) targeted creatures, and refuses more. At the base rank, targets are ignored.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-57.test.js` is new. Its negative case is a second condition that isn't the observer's form.

A whole-corpus compile (b474 → b475) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-57-live-results.json), case `rank3Batch57`, in the `pftest` world.

| Cast | Result |
| --- | --- |
| 3rd | Caster Concealed, with the note |
| 5th, three allies | Refused (at most 2) |
| 5th, two allies | Caster and both allies Concealed, with notes; the third ally untouched |

**Cleanup:** fixtures removed.
