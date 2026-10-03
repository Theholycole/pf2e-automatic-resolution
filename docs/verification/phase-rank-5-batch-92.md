# Rank 5 batch 92 — Shall not Falter, Shall not Rout

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Shall not Falter, Shall not Rout (5) | **The caster's Effect** for 1 minute, with the card's control "First damaging Strike this round: recover N HP". It recovers twice the spell's rank, but not above half the caster's maximum HP, once each combat round (a second press that round is refused). |

## Rules

- **`src/compiler/strike-heal.js`:** reads the three sentences.
- **Runtime:** new kind `strike-heal`; `strikeHeal` (API and card button).

## Interpretation

- **Whether the Strike dealt damage to a foe** is the player's press (the module can't see a hit's attacker).
- **The spell's level** is its cast rank.

## Tests

`test/rank-5-batch-92.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b700 → b701) changed only Shall not Falter, Shall not Rout.

## Evidence

[Live evidence](phase-rank-5-batch-92-live-results.json), case `rank5Batch92`, in the `pftest` world, in combat.

| Step | Result |
| --- | --- |
| At 42/100, cast at 5th (10 HP) | +8 (to 50, the cap) |
| Again that round | Refused |
| Next round at 50 | Nothing (capped) |
| Next round at 40 | +10 |

**Cleanup:** fixtures and combat removed.
