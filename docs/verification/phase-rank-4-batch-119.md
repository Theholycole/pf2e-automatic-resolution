# Rank 4 batch 119 — Shielding Formation

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shielding Formation (4) | A 30-foot emanation that moves with the caster's token for the sustained minute. The caster and each ally who ends a turn inside gain PF2e's Spell Effect: Shielding Formation (+1 circumstance AC), losing it on leaving. **Using the resistance:** a holder switches on the Effect's resistance option for a damage (resistance 10 to all damage, PF2e's). After that damage the module removes the Effect and adds a 10-minute temporary immunity, so it isn't granted again. **The caster:** a caster who used it can't cast the spell again until the immunity ends. |

## Rules

- **`src/compiler/effect-note-proof.js`:** four readers.
  - The AC sentence: PF2e's AC modifier; the area recipient includes the caster, centred on the caster; `memberTurnEnd`.
  - The resistance sentence: PF2e's toggle and its Resistance; `shieldUse`.
  - The immunity sentence.
  - The caster's sentence (`casterUseBlocksCasting`).
- **Runtime (effect-note area):**
  - A caster-centred emanation is a region following the caster's token.
  - The cast is refused while the caster is immune.
  - `startAreaBoon` takes `includeCaster`, `followToken`, `turnEnd` and `shieldUse`.
- **`ongoing-families`:**
  - **Granting:** with `turnEnd`, `syncMemberEffect` grants only to the creature whose turn just ended (`turnEndedActor`). It skips a creature holding the immunity.
  - **The Effect:** carries `shieldUse`.
- **`main.js`:** the `applyDamage` wrapper calls `shieldUsed` after PF2e's damage.

## Interpretation

- **"Physical damage or damage from a spell or magical effect"** is the holder's choice: switching the toggle on for that damage.
- **The caster's use** gives the same 10-minute immunity. It also blocks a new casting; the existing area keeps working for the others.

## Tests

`test/rank-4-batch-119.test.js` is new. It covers the proof's recipient, turn-end, shield use, immunity and caster block, and a different resistance (not proved).

A whole-corpus compile (b658 → b659) changed only Shielding Formation.

## Evidence

[Live evidence](phase-rank-4-batch-119-live-results.json), case `rank4Batch119`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| Cast | No holders yet; the following region exists |
| The caster's turn ends | The caster holds the Effect |
| The ally's turn ends | The ally holds it (AC +1) |
| An ally outside | Doesn't hold it |
| Toggle on, 20 slashing | 10 taken; the Effect is removed; immune for 10 minutes |
| Next round, after the Sustain | The ally isn't granted it again |

**Cleanup:** fixtures, combat and the region removed.
