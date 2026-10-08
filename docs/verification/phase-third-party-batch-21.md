# Third-party batch 21: Dynamic Gouging Claw

2026-10-06. The twenty-first batch of the third-party modules' spells. It also covers a live-world audit after batch 20.

## What changed

- **Dynamic Gouging Claw (Magic+)** (`glyph-versions.js` `fitClawVersion`, `compile-ability.js`, `effect-runtime.js`, `runtime-core.js`):
  - **One action:** the caster gains a claw Strike for 1 minute.
    - It's PF2e's `Strike` rule element: 1d6 slashing, agile, finesse, unarmed, knife group, with `CriticalSpecialization` for it.
    - The caster is then temporarily immune to gaining it from this spell for 10 minutes, and a second cast while immune is refused. The stated-effect route now has an immunity.
    - The module's own linked Effect has no rules, so the text's rules are used.
  - **Two actions:** the melee spell attack, with the caster's pick of piercing or slashing on the card (the text's dice, +1d6 a rank). A hit adds the rank's persistent bleed, not doubled on a critical hit.
  - **Three actions:** a new **compound** plan runs its parts in order:
    - the claw Strike's Effect;
    - its reach (+10 feet, PF2e's `reach-15` trait) until the end of the caster's next turn;
    - the attack's card, with 2 persistent bleed (+1 a rank), doubled on a critical hit. The 20-foot reach for this attack is a reminder.
- **Live audit (after batch 20):** every spell the census counts as resolved was compiled in the pftest world.
  - All 172 take a supported route.
  - All 11 proved Effect + note plans are proved there too.
  - Cosmic Tune's Effect in the world writes its bonus as PF2e's bracket table on the item's level, so the proof's value reader now reads PF2e's brackets (`ruleValueAt`). The world's catalog is read from the packs' index (their stored data), which can predate a document's migration.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 20 | Batch 21 |
| --- | --- | --- |
| Save | 56 | 57 |
| Not enabled | 53 | 52 |

Resolved: 173 of 227.

## Tests

`test/third-party-batch-21.test.js` (3). All 1,736 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-21-live-results.json), case `thirdPartyBatch21`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| One action (a character) | The claw Strike on its sheet; temporary immunity; a second cast refused |
| Two actions, piercing, critical hit | 2d6 piercing doubled; 1 persistent bleed |
| Three actions, slashing, hit | The claw, its reach-15 Effect, then the attack's card: 2d6 slashing; 2 persistent bleed |
