# Rank 2 batch 59 — Swallow Light

2026-10-01. A breath weapon gained by a counteract, with a recharge. It needed no new user decision.

| Spell | Now |
| --- | --- |
| Swallow Light (2) | The card has a GM button, "Counteract the light effect". The GM names the light and gives its counteract DC and rank, and the caster's PF2e counteract check decides. Until it succeeds, the breath button is refused; after a failure, it stays refused. After a success, the breath is a basic Reflex save for the creatures in the 15-foot cone: 1d6 cold + 1d6 void (+1d6 each per 2 ranks, PF2e's heightening), as a two-action activity on any turn. Each use rolls the recharge (1d4 rounds) and refuses the next until it passes. The button stops when the minute ends. |

## Rules

- **`breath-gate.js` (new pre-pass):**
  - It reads the six rule sentences (one sentence of narration allowed). The target must be "1 magical light effect", and the area, save, damage and heightened step must be the item's.
  - It becomes the ordinary basic save in the cone, with `repeatable` = window `duration`, two actions, `recharge` 1d4 rounds and a `counteract` gate.
- **`basic-save-core.js`:**
  - The repeat window check is now `validRepeatable`, used on both the simple basic-save route and the degree route.
  - The first unit test found that the simple route didn't check `repeatable` at all: a forged recharge was accepted. It is refused now.
  - The whole-corpus compile changed only Swallow Light.
- **`main.js`:**
  - The gate button runs the card's counteract (`noteCounteract`) and records `repeatGate`.
  - The window stays closed until the gate succeeds and the recharge (`rechargeUntil`, rolled after each use) has passed.

## Tests

909/909 pass. `test/rank-2-batch-59.test.js` is new. It checks:
- the plan, and that a forged recharge or a missing gate is refused;
- that a changed area, damage or action count isn't read.

A whole-corpus compile (b313 → b315; b314 was before the route fix) changed only Swallow Light.

## Coverage

**Census:** **1136 enabled**, up from 1135. Rank 2: 222 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-59-live-results.json), case `rank2Batch59`, in the `pftest` world, in combat, from the chat card's buttons. The case ran before the route fix; that fix only refuses malformed plans.
- **Card 1:**
  - Breathing before the counteract: refused.
  - The counteract against DC 60 failed, and breathing stayed refused.
- **Card 2:**
  - The counteract against DC 5 critically succeeded.
  - The breath ("1d6 cold + 1d6 void", 7 lost on a failure) was made.
  - A second breath right away was refused (the recharge rolled 1 round).
  - After 25 seconds, a second breath was made.
  - After the minute, the button made none.
- **Cleanup:** fixtures and the combat were removed.
