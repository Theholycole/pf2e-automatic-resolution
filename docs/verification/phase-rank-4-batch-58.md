# Rank 4 batch 58 — Weaponize Secret

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Weaponize Secret (4) | Will, up to 3 targets. **Failure:** a rune note for the minute; when the creature attacks the caster, the GM's discharge control deals 7d6 mental (+2d6 a rank) once. **Critical failure:** also 1d6 persistent mental (+1 a rank), which the discharge ends. |

## Rules

- **Secret rune (`src/compiler/secret-rune.js` `rewriteSecretRune`):**
  - It reads the lead, the three rows and the heightening (PF2e's item has no damage).
  - It writes plain rows with the critical failure's persistent formula `(1d6 + @item.rank - 4)`.
  - Post-compile: the failing rows' note with `triggeredDamage {trigger: "attack-against-caster", frequency: "once", endsSpell: true}` and, on a critical failure, `endsPersistent`.
- **Runtime:** the hostile-damage control removes the creature's persistent damage of that type when `endsPersistent` is set.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-4-batch-58.test.js` is new. Its negative case is another discharge (not read).

A whole-corpus compile (b518 → b519) changed only Weaponize Secret.

## Evidence

[Live evidence](phase-rank-4-batch-58-live-results.json), case `rank4Batch58`, in the `pftest` world, at 5th rank.

| Result | Result |
| --- | --- |
| Failure, discharged | 9d6 mental = 31 lost; the rune ended |
| Critical failure | (1d6 + 1) persistent mental; discharged: 40 lost, the persistent damage removed |

**Cleanup:** fixtures removed.
