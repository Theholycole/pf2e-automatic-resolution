# Spellshape batch 15: Sinbladed Spell, any spell

2026-10-05. The user's answer: Sinbladed Spell's sins are the Runelord's school of Thassilonian rune magic, which PF2e doesn't mark on spells. The module doesn't check the spell; every spell cast with Sinbladed Spell is valid. Its bleed equal to the spell's rank applies to a creature the spell hits or that fails its save.

## Tests

`test/spellshape-batch-13.test.js` updated: Sinbladed Spell's requirement is the table's; a cantrip of any trait meets it.

## Evidence

[Live evidence](phase-spellshape-batch-15-live-results.json), case `spellshapeBatch15`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Sinbladed Spell (its card) on Fireball (3rd): a failure, a success | Applies (no check); 3 persistent bleed; nothing |
