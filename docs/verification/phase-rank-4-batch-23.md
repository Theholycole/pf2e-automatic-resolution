# Rank 4 batch 23 — Bind Heroic Spirit, Fortissimo Composition

2026-10-02. Part of the user's ranks 3–5 pass. (Bind Heroic Spirit is rank 3.)

| Spell | Now |
| --- | --- |
| Bind Heroic Spirit (3) | PF2e's Spell Effect: Bind Heroic Spirit goes on the caster: +1 status bonus to attack rolls and saves (+2 at 6th), with PF2e's critical-hit Note for the new thrall. A GM note says to remove the target thrall, which is destroyed. |
| Fortissimo Composition (4) | The caster's Performance check, against the highest Will DC of the targeted creatures (the GM gives a DC if none are targeted). The next Courageous Anthem, Rallying Anthem or Song of Strength gives each recipient PF2e's Spell Effect: Fortissimo Composition, with +3 (critical success) or +2 (success) selected. On a failure, that composition's Focus Point is refunded. |

## Rules

- **Thrall-bound Effects (`unscoped-effect-trigger-compiler.js`, `target-predicate-compiler.js`):** "Destroy the target thrall and gain a +N status bonus to attack rolls and saving throws." with PF2e's status FlatModifier puts the Effect on the caster, with a note to remove the thrall. "1 of your thralls" is then complete: the thrall is a mark on the map, not a recipient.
- **Spellshape Effects (`check-helpers.js` `compileSpellshapeEffect`, kind `spellshape-effect`):** "If your next action is to cast one of these compositions, attempt a @Check[performance|against:will] check." The pattern also needs the DC sentence, rows of "+3", "+2" and the failure refund, and PF2e's ChoiceSet offering those bonuses for those degrees. The compositions are the `<em>` names in the opening.
- **The next casting (`spellshapeOnEffect`):** every Effect of that one casting is matched by the module's cast id, or PF2e's origin item; a later casting's Effects are not. Each recipient gets PF2e's Effect with the ChoiceSet's `selection` and `rulesSelections` set, so PF2e doesn't prompt. The pending check now lasts a minute instead of 3 seconds: the module applies a cast's Effects one recipient at a time, and the live run showed 6 seconds between them. A new check clears the old flag instead of merging into it (Extend Boost too).

## Tests

1084 pass. `test/rank-4-batch-23.test.js` is new, with negative cases: a different bonus sentence (Bind Heroic Spirit), and a row PF2e's ChoiceSet doesn't offer (Fortissimo).

A whole-corpus compile (b414 → b415) changed only these two.

## Evidence

[Live evidence](phase-rank-4-batch-23-live-results.json), case `rank4Batch23`, in the `pftest` world.
- Bind Heroic Spirit at 6th: the caster's Fortitude rose by 2, and the thrall note was posted.
- Fortissimo Composition: a bard (character) and an ally. The check's DC was the ally's Will DC (10). Set to a critical success, the next Courageous Anthem gave the ally PF2e's Effect with +3 selected.
- **Failure:** with focus 0/2, the next anthem gave no Effect and refunded the Focus Point (focus 1).
- **Regression check:** the earlier Extend Boost case (`cr1Batch163`) still passes with the new flag handling.
- **Cleanup:** fixtures removed.
