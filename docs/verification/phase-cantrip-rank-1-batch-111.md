# Cantrip / rank 1 batch 111 — Threefold Limb

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Make a melee spell attack roll. On a hit, the target takes 2d6 damage; the type … depends on the form you choose. On a critical hit, double the damage.”: the text's damage (PF2e's item has none; a data note), +2d6 per rank, typed by the form the caster picks on the card | Threefold Limb (1) |
| Ice: cold; on a hit, PF2e's Effect (proved: −10-foot status penalty to all Speeds, 1 round) | Threefold Limb |
| Liquid Water: bludgeoning; the caster's Reposition up to 10 feet (a reminder) | Threefold Limb |
| Steam: fire; on a hit, a note Effect (all creatures concealed to the target, to the start of the caster's next turn; deleted if it waves the steam away) | Threefold Limb |
| “This spell gains the cold / fire trait.”: the form's damage type; the module adds no trait | Threefold Limb |

**Kept strict (tests):** it isn't read with any of these changes:
- another penalty;
- a knocked-prone reposition;
- added persistent damage;
- another heightened die;
- a critical-hit condition.

## Coverage

**Census:** **592 enabled**, up from 591.
- The b194 corpus diff against b193 changed only Threefold Limb.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 713/713 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-111-live-results.json), case `cr1Batch111`:
- **Ice hit:** `2d6 cold` (7 lost), with the Ice Effect.
- **Water hit:** `2d6 bludgeoning` (6 lost), no Effect, and the Reposition reminder on the card.
- **Steam critical hit:** `2d6 fire` rolled 3, 6 lost, with the steam note.
- **A miss:** nothing.

**Regressions:** `cr1Batch94` (Flourishing Flora's option) passed.
