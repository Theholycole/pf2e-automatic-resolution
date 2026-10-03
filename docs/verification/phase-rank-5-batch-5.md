# Rank 5 batch 5 — Anchoring Air, Earthbind, Warshard Shot

2026-10-02. Part of the user's ranks 3–5 pass. Ranks 3–5, numbered in the rank-5 series.

| Spell | Now |
| --- | --- |
| Anchoring Air (4, reaction) | The attacker gets PF2e's degree Effect, preset to its result, ending with the attacker's own turn. **Success:** −2 to the triggering Strike (PF2e removes it after that roll). **Failure:** −2 to all attack rolls. **Critical failure:** the failure's Effect plus Immobilized until the start of its next turn. |
| Earthbind (3) | **Success / failure / critical failure:** the GM's reminder that it falls up to 120 feet safely. On a failure or critical failure, the "can't Fly or leave the ground" note lasts 1 round or 1 minute. |
| Warshard Shot (5) | **Critical hit:** a note Effect carrying a −1 status penalty to AC, removed with the persistent spirit damage. |

## Rules

- **Degree-choice Effects (`degree-choice-effect.js`):**
  - "… penalty to the triggering Strike's attack roll." is read as the Effect's removed-after-roll melee Strike modifier.
  - "… penalty to all attack rolls until the end of its turn." is read too.
  - A 1-round, turn-end Effect whose every row ends with the creature's own turn anchors to that creature's turn (target-turn, offset 0).
  - A degree the Effect doesn't offer ("As failure, but the creature is also Immobilized until the start of its next turn.") gets the named row's Effect, preset the same.
  - `residual-prose.js` accepts "the triggering Strike" in that claimed clause.
- **Safe fall (`compile-ability.js`, `basic-save-core.js`, `basic-save-runtime.js`):** "The target falls safely up to N feet." is a `fall` forced movement (a GM reminder, like a push), validated against its sentence.
- **AC penalty while persistent (`compile-ability.js`):** "As long as the target is taking this persistent X damage, it takes a –N status penalty to its AC." is a note Effect with the penalty, `whilePersistent`. It requires the row to deal that persistent type.
- **Test updated:** `test/spell-attack-components.test.js` asserted Warshard Shot stays blocked over this row rule. It now asserts the note.

## Tests

1004 + 3 pass. `test/rank-5-batch-5.test.js` is new, with negative cases:
- a wrong penalty value;
- a forged unsafe fall;
- a forged distance;
- a mismatched persistent type.

A whole-corpus compile (b366 → b367) changed only these three.

## Evidence

[Live evidence](phase-rank-5-batch-5-live-results.json), case `rank5Batch5`, in the `pftest` world.
- **Anchoring Air:** the Effects were preset to success, failure and failure, ending at turn end; only the critical failure was Immobilized.
- **Earthbind:** two fall reminders; the failure got the grounding note and the success didn't.
- **Warshard Shot:** a critical hit gave persistent spirit 5 and the AC −1 note. Removing the persistent damage removed the note, and AC came back by 1.
- **Run note:** the first run started before the scene had loaded after the reload; the rerun passed.
- **Cleanup:** fixtures removed.
