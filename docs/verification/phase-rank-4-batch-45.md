# Rank 4 batch 45 — Entangle Fate

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Entangle Fate (4) | Will save for 2 to 4 targeted creatures. **Success:** Off-Guard until the start of its next turn. **Failure:** Off-Guard for 3 rounds, plus Stupefied 1 for 3 rounds. **Critical failure:** as failure, plus Enfeebled 1 and Clumsy 1. Stupefied, Enfeebled and Clumsy apply only when at least two of the cast's targets failed or critically failed. |

## Rules

- **Group gate (`group-gate.js` `rewriteGroupGate`):**
  - It reads the area save and the four written rows ("If more than one of the targets failed to resist this spell, … also becomes Stupefied 1 …", "any creature that becomes stupefied 1 … also becomes Enfeebled 1 and Clumsy 1").
  - The result is written out as plain rows, one sentence per condition, with the spell's fixed duration.
  - The gated conditions are tagged `choiceGroup: "group-gate"` with `{degrees: [failure, criticalFailure], minimum: 2}`.
- **Runtime:** `targetOutcomeConditions` keeps a gated condition only when that many participating targets have those degrees. The state snapshot carries `groupGate`.
- **Validator:** gated conditions need the stated degrees, a minimum of at least two, and the evidence sentence.
- **Targets:** "N to M creatures in range" is read as the caster's targets.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-45.test.js` is new. It checks the gate with one and two failures. Its negative case is a gate of one (blocked).

A whole-corpus compile (b485 → b486) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-45-live-results.json), case `rank4Batch45`, in the `pftest` world, cast at 4th rank.

| Results | Conditions |
| --- | --- |
| Failure + critical failure | Off-Guard and Stupefied 1; Off-Guard, Stupefied 1, Enfeebled 1 and Clumsy 1 |
| Failure + success | Off-Guard only on both |

**Cleanup:** fixtures removed.
