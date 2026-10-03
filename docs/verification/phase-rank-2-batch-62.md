# Rank 2 batch 62 — Invoke the Crimson Oath

2026-10-01. Follows the user's decision of 2026-10-01: a creature that critically fails takes PF2e's critical damage roll for the weapon. Critical specialization effects are a GM reminder, and a creature immune to critical hits takes the failure's damage.

| Spell | Now |
| --- | --- |
| Invoke the Crimson Oath (2) | A basic Fortitude save for the creatures in the 20-foot cone. The caster must hold a melee weapon; the cast asks which one if there are several, and whether undead take vitality instead of the physical damage. The damage is PF2e's own Strike damage roll for that weapon, with all its bonuses. A success halves it. A critical failure takes PF2e's critical damage roll for the weapon (deadly, fatal and the like included), rolled once; a creature immune to critical hits takes the failure's damage instead. With the conversion chosen, undead take the physical part as vitality. The card reminds the GM of the weapon's critical specialization. |

## Rules

- **`weapon-blast.js` (new pre-pass):** the four rule sentences exactly (one sentence of narration allowed).
  - It becomes the ordinary basic save, with an untyped placeholder entry and `weaponDamage`, which records the melee requirement, the critical roll, critical immunity, and the optional conversion.
  - It adds the `weapon-critical` reminder.
- **`basic-save-core.js`:** `validWeaponDamage` on both routes, and the reminder kind.
- **`basic-save-runtime.js`:**
  - `start` picks the held melee Strike and asks about the conversion. Tests pass these in as `weaponItemId` and `weaponConvert`.
  - `rollDamage` rolls the Strike's damage. PF2e's dialog is skipped with a shift-click event matched to the user's setting.
  - Finalize rolls the critical damage once if any creature not immune to critical hits critically failed. It applies that roll ×1 to those creatures, the normal roll to the immune ones, and swaps the physical types to vitality for undead.

## Tests

915/915 pass. `test/rank-2-batch-62.test.js` is new. It checks:
- the plan, the reminder, and that a forged sentence is refused;
- that another save, requirement or conversion isn't read.

A whole-corpus compile (b317 → b318) changed only Invoke the Crimson Oath.

## Coverage

**Census:** **1139 enabled**, up from 1138. Rank 2: 225 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-62-live-results.json), case `rank2Batch62`, in the `pftest` world (a character caster with a longsword and Strength +3, cast at 2nd).

| Creature | Result | Lost |
| --- | --- | --- |
| Failed | "1d8 + 3 slashing" | 6 |
| Critically failed | "2 * (1d8 + 3) slashing" (PF2e's critical roll) | 22 |
| Immune to critical hits, critically failed | the failure's damage | 6 |
| Undead, failed, conversion chosen | vitality | 6 |

- **A probe:** a rapier with deadly d8 gives the critical roll "2 * (1d6 + 3) + 1d8 piercing".
- **Cleanup:** fixtures removed.
