# Rank 2 batch 79 — Sweetest Solstice (rituals from their confirmed outcome)

2026-10-01. The first ritual the module resolves. It follows the accepted ritual workflow (decision ticket 07):
- The ceremony and its skill checks are native rolls and the GM's adjudication.
- The module begins from the confirmed outcome and applies that degree's consequences.
- It asks for missing input (the secondary casters) and never guesses it.

| Spell | Now |
| --- | --- |
| Sweetest Solstice (2, ritual) | The GM gives the primary check's result and picks up to 3 secondary casters. **Critical Success:** PF2e's Effect on every caster with its choice preselected (+1 status to saves against emotion and fear), PF2e's 90 days, and a note that it ends at the end of winter. **Success:** the same Effect with only fear, for 30 days (the text's "1 month or until the end of winter, whichever comes first", with the same note). **Failure:** no effect. **Critical Failure:** every caster is Sickened 4, which can't be reduced for 12 hours; then it recovers normally. The food, the once-a-winter limit and the solstice DC reduction are the card's notes, as is the cost. |

## Rules

- **`ritual-outcome.js` (new pre-pass for items with `system.ritual`, kind `ritual-outcome`):** each sentence of the body and the four rows is read by a general rule.
  - Narration (no rule words) is claimed; the ceremony's own conditions are notes.
  - "The ritual succeeds / fails / has no effect."
  - "The casters of the ritual gain a +N status bonus to saves against X (and Y) effects …" maps to the linked PF2e Effect. Its rules are proved against the text: once the ChoiceSet is set to the degree, the active FlatModifiers must be the bonus, type and traits. The text's duration is used.
  - "The casters of the ritual become … Sickened N and can't reduce the condition for T hours." maps to a lock.
  - Any other sentence with rule words leaves the ritual unread.
- **Runtime:**
  - `#executeRitualOutcome`: GM only. It takes the degree (`degree` in tests, otherwise a dialog), the secondary casters (`secondaryCasters`, otherwise a checklist, at most the ritual's count), the Effects (`ruleOverrides` selects the choice), the locks, and the card.
  - **The lock:** an Effect for T hours granting the condition at its value (`granter: detach`, `grantee: restrict`). A new `preUpdateItem` hook in `main.js` refuses any reduction below the lock while its granter exists. PF2e's `restrict` alone stopped deletion but not a decrease, as the first live run showed. When the lock ends, the condition is detached and recovers normally.

## Tests

952/952 pass. `test/rank-2-batch-79.test.js` is new. It checks:
- every degree;
- that a changed bonus, trait, lock rider or ceremony rule isn't read, and that a changed lock duration is.

A whole-corpus compile (b334 → b335) changed only Sweetest Solstice.

## Coverage

**Census:** **1156 enabled** (milestone), up from 1155; this is the first ritual. Rank 2: 242 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-79-live-results.json), case `rank2Batch79`, in the `pftest` world.
- **Four secondary casters:** refused ("at most 3").
- **Success:** the Effect is on the caster and both secondary casters (not the bystander), for 30 days. A Will save with the `fear` option got `sweetest-solstace-fear` +1; one with `emotion` got nothing.
- **Critical Success:** emotion +1 and fear +1, 90 days, with the end-of-winter note.
- **Failure:** nothing applied.
- **Critical Failure:** the caster and the secondary caster are Sickened 4. A reduction was refused (still 4) and the lock lasts 12 hours. With the lock gone, Sickened 4 remained and could then be reduced to 3.
- **Card:** the degree, the food-poisoning note and the cost.
- **Cleanup:** fixtures removed.
