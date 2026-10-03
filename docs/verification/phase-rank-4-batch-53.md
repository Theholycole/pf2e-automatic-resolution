# Rank 4 batch 53 — Sanguine Mist

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sanguine Mist (4) | A sustained 10-foot burst of concealing fog. Living creatures in it other than the caster take 6d6 void (+2d6 a rank), basic Fortitude, when it's cast. On the first Sustain each round they take (rank − 2)d6 void with another save, and the caster gains half the most any one creature took as temporary Hit Points for 1 minute. |

## Rules

- **Siphon mist (`src/compiler/siphon-mist.js` `rewriteSiphonMist`):**
  - It reads the six sentences and the heightening (the secondary step must be the formula's 1 a rank).
  - It writes the lingering cast and Sustain sentences and concealment.
  - Post-compile: `excludeCaster`, the `living-creature` predicate, and `lingering.casterSiphon`.
- **Core:**
  - `lingeringExposurePlan` gives the Sustain exposure `casterSiphon`.
  - The lingering validator checks its shape and sentences.
- **Runtime (`basic-save-runtime.js`):** after a Sustain exposure card's damage, half the most a creature lost goes to the caster as an Effect with PF2e's TempHP rule. The higher amount is kept.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-53.test.js` is new. Its negative cases are another share (not read) and a changed fraction (not executable).

A whole-corpus compile (b502 → b503) changed only Sanguine Mist.

## Evidence

[Live evidence](phase-rank-4-batch-53-live-results.json), case `rank4Batch53`, in the `pftest` world, in combat, at 5th rank.

| Step | Result |
| --- | --- |
| Cast, with the caster inside | The caster isn't exposed; the creature fails: 8d6 void = 37 lost; no temporary Hit Points |
| Sustain, the creature fails | 3d6 void = 14 lost; the caster has 7 temporary Hit Points (a 1-minute Effect) |

**Cleanup:** fixtures removed.
