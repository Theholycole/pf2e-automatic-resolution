# Rank 4 batch 33 — Vampiric Maiden

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Vampiric Maiden (4) | One target saves (Fortitude, not basic) against piercing and void damage. Failure: Immobilized for 1 round, or until it uses Interact. Critical failure: Immobilized for 1 round, or until it Escapes. The caster gains temporary Hit Points equal to the void damage the target took, after IWR, for 1 minute. |

## Rules

- **Typed portion benefit:** "You gain temporary Hit Points equal to the void damage the target takes (after applying resistances, weaknesses, and the like)." is now read when the spell deals several types and only one is named. The plan gets `casterBenefit.portion: "type"`. It is validated in `isCasterDamageBenefit` for one target and temp HP with a stated duration.
- **PF2e's IWR record:** `applyDamageWithReceipt` keeps PF2e's own `data-applications` from the damage-taken message as `receipt.iwr`.
- **Portion at runtime:** the portion is that type's rolled instance plus PF2e's adjustments for that type. Immunity makes it 0, and it is capped at the damage taken. An application PF2e records for a type the roll doesn't name stops the card for review.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-33.test.js` is new. It has negative cases: a type the spell doesn't deal, and a mismatched damage type in validation.

A whole-corpus compile (b440 → b441) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-33-live-results.json), case `rank4Batch33`, in the `pftest` world.

| Cast | Damage | Recorded IWR | Caster temp HP | Target |
| --- | --- | --- | --- | --- |
| Rank 4, plain target | 12 piercing + 12 void | none | 12 (for 1 minute) | lost 24, Immobilized |
| Rank 5, target with void resistance 5 and piercing weakness 2 | 5d4 + 5d4: 11 piercing + 15 void | weakness piercing +2, resistance void −5 | 10 | Immobilized |

**Cleanup:** fixtures removed.
