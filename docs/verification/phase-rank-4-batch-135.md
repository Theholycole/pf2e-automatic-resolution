# Rank 4 batch 135 — Infiltrator's Tunnel

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Infiltrator's Tunnel (4) | **The caster's Effect** for 1 minute names who passes freely: the caster and, from 6th rank, up to 5 creatures targeted at the cast (refused below 6th). **The card's control** "A creature moves through the portals (target it)": a free creature passes. Any other attempts a Will save against the spell DC: it passes on a success; on a failure, the GM teleports it up to 30 feet away to a random safe space. The portals' places are a GM line. |

## Rules

- **`src/compiler/portal-pair.js`:** reads every sentence and the Heightened entry.
- **Runtime:** new kind `portal-pair`; `portalCross` (API and card button).

## Interpretation

- **The random safe space** is the GM's, as the text says.

## Tests

`test/rank-4-batch-135.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b701 → b702) changed only Infiltrator's Tunnel.

## Evidence

[Live evidence](phase-rank-4-batch-135-live-results.json), case `rank4Batch135`, in the `pftest` world.

| Step | Result |
| --- | --- |
| The caster | Free |
| A strong-willed creature | Passes |
| A weak-willed one | Teleported (the GM's) |
| Designating an ally at 4th | Refused |
| At 6th, an ally designated | Free |

**Cleanup:** fixtures removed.
