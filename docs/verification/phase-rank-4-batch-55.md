# Rank 4 batch 55 — Weapon Storm

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Weapon Storm (4) | A 30-foot cone or 10-foot emanation (a reminder). Four dice of the held weapon's die size (its two-hand die in both hands) and damage type, one more die each rank. Reflex: success half, failure full, critical failure double; the weapon's critical specialization is a GM reminder. |

## Rules

- **Weapon dice (`src/compiler/weapon-dice.js` `rewriteWeaponDice`):**
  - It reads the Area line, the narration, the dice-count, type and two-hand sentences, the four rows and "Add another damage die".
  - It writes the rows over a placeholder `weapon-dice` component, `resolution.weaponDamage {mode: "dice"}` and two reminders.
- **Validator:** `validWeaponDamage` covers the dice mode; the reminders are known kinds.
- **Runtime:**
  - `start` picks any held weapon and works out its die and type.
  - The roll is `{count + (rank − base)}{die}[type]`.
  - The melee Strike paths (PF2e's Strike roll, the critical roll) are skipped.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-55.test.js` is new. Its negative cases are another wording (not read) and another step (not executable).

A whole-corpus compile (b511 → b512) changed only Weapon Storm.

## Evidence

[Live evidence](phase-rank-4-batch-55-live-results.json), case `rank4Batch55`, in the `pftest` world, at 6th rank, with a two-hand-d12 weapon held in both hands.

| Result | Lost |
| --- | --- |
| Failure | 29 (6d12 slashing) |
| Critical failure | 58 |
| Success | 14 |

**Cleanup:** fixtures removed.
