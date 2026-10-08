# Third-party batch 1: the general fixes, and the first spells

2026-10-06. The user added 13 third-party modules and asked to "continue working on all the new spells".

## The content

The modules are Clerics+ Remaster, Magus+, Witches+ Remaster, PF2e Companion Compendia, Summoners+, and the pf2e-team-plus series: Alchemists+, Barbarians+, Feats+, Inventors+, Magic+, Oracles+ Remastered, Tian Xia+ and Wizards+. Together they have 4,125 items, 227 of them spells.

Exported to `.cache/third-party-items.json`. Compile and census with `node tools/third-party-census.mjs [spell names…]`: it compiles each spell with PF2e's spells and Effects as references and prints the routes (the census's own).

## General fixes

- **Older link forms.** The modules write links in forms Foundry still resolves but the compiler didn't read. The compiler now reads them as the current forms (`normalizeLegacyLinks` in `src/compiler/compile-ability.js`):
  - `@UUID[Compendium.pf2e.conditionitems.TBSHQspnbcqxsmjL]` (65 spells, 1,001 items);
  - `@Check[type:flat|dc:6]`;
  - `@Compendium[pack.id]`.

  PF2e's own spells have none of these, so their plans are unchanged.
- **The modules' own Effects** ("Spell Effect: Hemophilia" in Magic+'s pack):
  - the compiler reads them as PF2e's spell Effects are;
  - the Effect catalog indexes the active modules' Effect items after PF2e's (`scripts/native-effect-catalog.js`);
  - the loader finds them in the module's pack by id or name (`findModuleEffect`, `scripts/native-outcome-effects.js`).
- **Personal Blizzard+'s heightening**, "The cold damage increases by 1d6 and the persistent cold damage increases by 2 (2d6 and 4 on a critical failure)", is read beside PF2e's Personal Blizzard's (`src/compiler/sustained-save-damage.js`).

## The census

| Route | Before | After |
| --- | --- | --- |
| Effect | 1 | 45 |
| Save | 6 | 10 |
| Ongoing | 1 | 1 |
| Note only | 83 | 46 |
| Effect + note | — | 11 |
| Not enabled | 136 | 114 |

Some note-only spells became "not enabled" because their Effects are now linked and must be proved.

## Evidence

[Live evidence](phase-third-party-batch-1-live-results.json), case `thirdPartyBatch1`, in the `pftest` world with the modules active.

| Spell (module) | Result |
| --- | --- |
| Personal Blizzard+ (Witches+), rank 5, failure | "2d6 cold + (1d6 + 2) persistent cold"; Concealed |
| Fountain of Blood (Magic+), failure | Frightened 2 |
| Sharp Note (Oracles+), failure | 1d8 sonic, Deafened |
| Mantle of Nobility (Clerics+) | Clerics+'s "Effect: Mantle of Nobility" on the caster |
| Dynamic Haste (Magic+) | Its Effect on the targeted ally |
