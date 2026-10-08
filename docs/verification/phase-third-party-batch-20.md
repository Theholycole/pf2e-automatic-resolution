# Third-party batch 20: Dynamic Shield, Dynamic Fly

2026-10-06. The twentieth batch of the third-party modules' spells.

## What changed

- **Action versions** (`compile-ability.js`, `runtime-core.js`, `effect-runtime.js`): some spells are cast with "1 to 3" actions and have no PF2e variants (overlays), so PF2e never asks the count. When no version fit applies, each count's version is now compiled on its own, and the plan becomes `action-versions`. The card asks how many actions were spent (or a script gives `actions`), then resolves that version: an Effect route directly, a save or attack on its own card.
- **Dynamic Shield (Magic+)**:
  - Each version reads as official Shield's sequence: its own module Effect (+1, +2 or +4 AC; Hardness 3, 7 or 9, rising every 2 ranks as the text says), then Shield Immunity after Shield Block.
  - The Heightened entry's three-way amount ("3 for the 1-action version, 7 for the 2-action version, or 9 for the 3-action version") is now read per version (`heightenedForVersion`).
- **Dynamic Fly (Magic+)** (`fitFlyVersion`, `effect-note-proof.js`):
  - Each PF2e variant's module Effect is proved against its version's text.
  - The fly Speed (its land Speed or 20, whichever is greater), and in Dynamic Flight the 7th rank's +20-foot status bonus.
  - One action: the caster. Two actions: a touched creature for 1 minute (30 minutes from 7th). Three actions: the caster and up to 6 others. The third variant has no action count in its data; its target names it.
  - "The spell lasts until the end of your next turn" puts the text's end on the Effect, over its start-of-turn end.
- **Live-world catalogs** (`effect-note-proof.js`):
  - A module's own Effect link, in its own compendium form, is now stripped from a proof's sentences, as PF2e's links are.
  - The fly Speed is accepted in both of PF2e's land-Speed paths. A live world's catalog carried the older `@actor.attributes.speed.total`.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 19 | Batch 20 |
| --- | --- | --- |
| Effect | 58 | 60 |
| Not enabled | 55 | 53 |

Resolved: 172 of 227.

## Tests

`test/third-party-batch-20.test.js` (2). All 1,733 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-20-live-results.json), case `thirdPartyBatch20`, in the `pftest` world.

| Spell | Result |
| --- | --- |
| Dynamic Shield, two actions | Dynamic Shield 2's Effect: shield AC +2, Hardness 7 |
| Dynamic Fly, one action | Dynamic Flight on the caster, fly 25, ending at the end of its next turn |
| Dynamic Fly, two actions | Dynamic Fly on an ally for 1 minute |

(The first live runs found the proof missing in the world: the module's own Effect link wasn't stripped, and the world's catalog had the older Speed path. Both are fixed above.)
