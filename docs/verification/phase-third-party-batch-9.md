# Third-party batch 9: Quick Siphon, Umbral Escape, Shadow's Betrayal, Careless Swings, Shade of Night

2026-10-06. The ninth batch of the third-party modules' spells.

## What changed

- **Quick Siphon (Magic+)** (`src/compiler/healing-compiler.js`):
  - "You regain 10 Hit Points" is the caster's healing (PF2e's own roll). The text's "Increase the Hit Points you regain by 2." must equal PF2e's heightening entry, or the spell is refused.
  - "can choose to immediately end one instance of persistent bleed damage you are suffering from": after the healing, the card lists the caster's persistent bleed and the caster may end one (`healing.endPersistent`, `effect-runtime.js`).
- **Umbral Escape (Magic+)** (`effect-note-proof.js`, `spell-note.js`):
  - The module's Effect is proved against the text: resistance 4 to all damage (+4 a rank).
  - The Effect's type "all" isn't one of PF2e's, so it's patched to "all-damage" (a rule override).
  - Its second link, the immunity Effect, is the one the first grants (GrantItem), so it comes with it (`grantedImmunity`).
  - The Stride and its movement are notes; so is removing the resistance when the Stride ends.
- **Shadow's Betrayal (Magic+)** (`glyph-versions.js` `fitTargetStrikeAttack`):
  - The item has no attack trait, but its text makes a spell attack roll against the target's AC; the text wins, so it's read as PF2e's spell attack.
  - "off-guard in dim light or darkness" is a question at the card (+2 to the attack when yes).
  - The damage is the type of a Strike the target can make: the card lists its Strikes' types and the caster picks (`damageTypeFrom.kind: "target-strike"`, `basic-save-runtime.js`).
- **Careless Swings (Magic+)** (`third-party-rows.js`):
  - The caster picks manipulate or move on the card.
  - The failure's "first Strike" and the critical failure's "all Strikes" are GM-played notes until the end of the target's next turn. Reactions are triggered by hand, so the module adds no trait.
- **Shade of Night (Magic+)**:
  - The reduced vision is a GM-played note for the row's time: 1 round on a success, 1 minute otherwise.
  - The note's text is the cast rank's, so its Heightened (2nd) and (4th) entries are applied. This is a new `rankText` on note Effects (`note-effects.js` `noteTextAt`).
  - Blinded for 1 round on a critical failure.
  - "If the target is a willing ally, the ally can choose which result it gets" is read as the willing-choice reminder.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 8 | Batch 9 |
| --- | --- | --- |
| Save | 39 | 42 |
| Effect | 49 | 51 |
| Not enabled | 84 | 79 |

## Tests

`test/third-party-batch-9.test.js` (5). All 1,707 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-9-live-results.json), case `thirdPartyBatch9`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Quick Siphon, rank 5 | 10 HP to the caster; its persistent bleed ended |
| Umbral Escape, rank 2 | Resistance 8 to all damage; the immunity Effect granted with it |
| Shadow's Betrayal, rank 2, hit, dark | The foe's fire Strike picked: +2 to the attack, 2d8 fire, all of it taken |
| Careless Swings, critical failure, move | The note: each of its Strikes has the move trait until the end of its next turn |
| Shade of Night, rank 4, critical failure | The 4th-rank note text for 10 rounds; Blinded |
