# Rank 3 batch 60 — Positive Attunement

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Positive Attunement (3) | **Healing variant:** a living target (undead and constructs refused) heals 1d8 now and again at the end of each of the caster's turns while the spell is Sustained. The healing-boost rule is a GM note. **Damage variant:** an undead (or void-healing) target's Will save against 1d8 vitality. A success damages once. A failure damages now and at the end of each of the caster's turns. A critical failure does the same with double damage each time. Both heighten +1d8 every 3 ranks. |

## Rules

- **Attunement (`attunement.js`):**
  - `compileAttunementHealing` reads the healing variant into `turnHealing` with `immediate`, `events: ["source-turn-end"]`, `sustained` and `living`.
  - `rewriteAttunementDamage` writes the damage variant as plain rows on an undead or void-healing target, and adds `resolution.turnHazard` (failure ×1, critical failure ×2, sustained).
  - Both check the other variant's text, the rows, and the Heightened step against PF2e.
- **Runtime:**
  - `startTurnHazard` (ongoing families) generalises `startTurnHealing` to any turn event, Sustain, healing or damage, and a ×2 multiplier. The multiplier rolls the formula as `2*(…)`.
  - `#executeTurnHealing` heals immediately and checks the living rule.
  - The basic-save card's Finalize starts a turn-hazard record per failing target.
- **Validator:** `inspectSavePlan` checks the turn hazard's rows, multipliers, events, type and evidence.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-60.test.js` is new. Its negative case is a turn-hazard row the text doesn't state (blocked).

A whole-corpus compile from b486 to b488/b489 changed Positive Attunement's two variants, plus spells changed by three concurrent audit sessions (movement clauses, save preambles, heightened healing). Those sessions report their own changes. All 1161 tests pass. The census stays at 1364 resolved: Positive Attunement was added, and the save-preamble audit withdrew Eclipse Burst (recorded in `docs/planning/withdrawn-routes.json`).

## Evidence

[Live evidence](phase-rank-3-batch-60-live-results.json), case `rank3Batch60`, in the `pftest` world. The casts happen during the caster's combat turn, at 3rd rank.

| Step | Result |
| --- | --- |
| Healing variant on a living ally | Healed 7 now |
| Damage variant, failure / critical failure | Lost 6 / 12 (1d8 = 6) |
| The caster's turn ends | Ally healed 6; undead lost 6 (1d8) and 4 (2 × 1d8) |

**Cleanup:** fixtures and records removed.
