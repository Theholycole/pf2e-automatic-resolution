# Third-party features batch 25: cascades entered after a cast

2026-10-07. The fifth Magus+ batch ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`cascadeTypeAhead`** (`scripts/text-rules.js`, around PF2e's item creation — its choice prompts run there): an Effect with the `stanceArcaneCascade` choice (every Magus+ cascade Effect and PF2e's Stance: Arcane Cascade) gets its damage type from the actor's most recent spell. One type is chosen; several are offered alone in PF2e's prompt.
  - PF2e's own: force, or that spell's types only after a cast on the same combat turn.
  - Magus+'s: the spell's type, or force.
  - Each cast's combat turn is kept on its message (`castTurn`).
- **Havok Cascade** (`readPassiveCastRider`, read from the stance's Effect): a havok spell deals damage equal to the level to the caster (`self-damage` rider). If less is taken, the spell is lost.
- **Reservoir of Power** (`readActionCast`, `actionCastOnCard`): after a spell from a slot, the caster's cascade stance (`cascadeStanceFor`, Havok's first) and the module's Effect, with Necromancy's healing.
- **Puppet String** (`readActionCast`, `actionCastOnCard`): after an illusion or mental spell, the targeted enemy within 30 feet gets the module's Tethered Effect (the trait and weakness answered) and the caster its own.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Census

| Family | Batch 24 | Batch 25 |
| --- | --- | --- |
| spellstrike-cascade | 16 / 73 | 20 / 73 |

## Tests

`test/third-party-features-batch-25.test.js` (2). All 1,845 unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-25-live-results.json), case `thirdPartyFeaturesBatch25`. Re-run (the item creation is wrapped): `thirdPartyFeaturesBatch19`, `thirdPartyFeaturesBatch18`, `spellFeaturesBatch8`, `thirdPartyFeaturesBatch16`, which still pass.

| Step | Result |
| --- | --- |
| Ignition, then Stance: Arcane Cascade+ | Fire, no prompt |
| Fear (no damage), then PF2e's Stance: Arcane Cascade | Force, no prompt |
| Reservoir of Power after Fear (a slot) | Stance: Arcane Cascade+ (Force); Effect: Reservoir of Power (Abjuration, asked) |
| Puppet String after Fear at the foe | Effect: Tethered (Puppet String) (Mental), weakness 1; the caster's Puppet String Effect |
| Wreak Havok in the Havok stance (10th level) | 10 damage taken; the spell goes on |
| With resistance 50 to all damage | 0 taken; the spell lost |
