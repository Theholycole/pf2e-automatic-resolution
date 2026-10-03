# Rank 3 batch 61 — Antlion Trap

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Antlion Trap (3) | A lingering burst of difficult terrain. A creature that enters or starts its turn inside makes a Reflex save. **Success:** pulled 5 feet toward the center. **Failure:** pulled 10 feet. **Critical failure:** pulled 10 feet and Immobilized until it Escapes. **Heightened (+2):** the burst and the failing rows' pull each grow by 5 feet. Unsecured objects and the blocked-space rule are GM notes. |

## Rules

- **Antlion pit (`antlion-pit.js` `rewriteAntlionPit`):**
  - It reads the pit's four lead sentences, the written rows and the Heightened entry.
  - It writes a lingering-area trigger and plain rows.
  - The heightened step becomes `lingering.areaStep` and a `heightening` on the failing rows' pull.
- **Lingering `areaStep` (`ongoing-families.js`):** the declared burst grows by the step at the cast rank, and the placed template uses that size. PF2e's item doesn't heighten its area.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-61.test.js` is new. Its negative case is another heightened entry (not read).

A whole-corpus compile (b491 → b492) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-61-live-results.json), case `rank3Batch61`, in the `pftest` world, at 5th rank.

| Check | Result |
| --- | --- |
| Area | 20-foot burst (15 + 5), difficult terrain |
| Creature walks in, failure | Pulled 15 feet toward the center |
| Creature walks in, critical failure | Pulled 15 feet and Immobilized |

**Cleanup:** fixtures removed.
