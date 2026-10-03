# Rank 5 batch 17 — Blood Feast

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Blood Feast (5) | A spell attack (touch) for 12d6 piercing damage (+2d6 per rank). A critical hit doubles it and adds (rank − 4)d8 persistent bleed. The caster gains temporary Hit Points equal to half the piercing damage taken, for 1 minute. The card asks whether the caster is a gug; a yes adds 2d6 piercing and 1d8 to the critical bleed. |

## Rules

- **Attack in the narration (`spell-attack-table.js`):** "…, dealing 12d6 piercing damage, depending on your spell attack roll." gives both the attack and the damage.
- **Miss row:** "You miss and the creature takes no damage." reads as unaffected.
- **Narration:** "After the spell, your head sews back together …" carries no rule.
- **Temp HP sentence kept for its compiler:** a damage-benefit sentence after the attack stays in the preamble for the damage-benefit compiler, so the preamble check still refuses it if unclaimed. That compiler now reads "You gain temporary Hit Points for 1 minute equal to half the piercing damage the target takes." (the duration inside the sentence).
- **Caster form:** "If you are a gug, increase the piercing damage by 2d6 and increase the Persistent Bleed Damage you deal on a critical hit by 1d8." and "This spell doesn't alter a gug's appearance." compile to `diceUpgrade {question, adds}`. It is validated against the spell's one damage type.
  - At runtime, a yes adds the dice to that type's term of the shared roll.
  - It also adds the dice to the persistent bleed outcome roll: "(@item.rank - 4)d8[bleed]" becomes "(@item.rank - 4 + 1)d8[bleed]".
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-17.test.js` is new. Its negative cases are a different added damage type, refused in compile and in validation.

A whole-corpus compile (b442 → b443) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-17-live-results.json), case `rank5Batch17`, in the `pftest` world.

| Cast | Caster a gug? | Damage | Persistent bleed | Target lost | Caster temp HP |
| --- | --- | --- | --- | --- | --- |
| Critical hit at 5th | yes | 2 × 14d6 piercing | 2d8 | 94 | 47 (for 1 minute) |
| Hit at 6th | no | 14d6 piercing | none | 50 | 25 |

**Cleanup:** fixtures removed.
