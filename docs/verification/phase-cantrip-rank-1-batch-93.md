# Cantrip / rank 1 batch 93 — Bane and Malediction

2026-09-27. Continuing spell by spell. One mechanism enables both spells.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Enemies in the area must succeed at a Will save or take a –1 status penalty to attack rolls (AC) as long as they are in the area.”: a lingering 10-foot emanation around the caster for 1 minute. Enemies inside save when it's cast; a failure applies PF2e's Effect (−1 status to attack rolls / to AC), removed when the creature leaves the aura | Bane (1), Malediction (1) |
| “Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by 10 feet and force enemies in the area that weren't yet affected to attempt another saving throw.”: an optional Sustain in Ongoing spells. The radius grows 10 feet, then the enemies inside without the penalty save; a missed Sustain doesn't end the aura | Bane, Malediction |
| “Bane can counteract Bless.” / “Malediction can counteract benediction.”: a card reminder whose Counteract button rolls the caster's counteract check | Bane, Malediction |

**Kept strict (tests):**
- Another penalty value isn't read.
- A growth not in 5-foot steps isn't read.
- Another Sustain condition isn't read.
- Narration with damage isn't read.
- The penalty proof checks the statistic.
- A growing aura without the optional Sustain is refused.

## Coverage

**Census:** **575 enabled**, up from 573.
- The b176 corpus diff against b175 changed only Bane and Malediction.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 678/678 tests pass (`test/cantrip-rank-1-batch-59.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-93-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch93` (Bane):
- **When cast (10-foot aura):** near and other were exposed, and far (15 feet) wasn't. Near failed and got the Effect; other succeeded.
- **The caster's second-round Sustain:** the radius became 20. Other and far saved and failed; near (already affected) wasn't exposed again. All three had the Effect, each flagged to the cast's area.
- **Leaving the aura:** near's Effect was removed at the next turn change, and the other two kept theirs.

The shared scene has 23 other creatures that the grown aura reached. The case marks those not affected and resolves only its own three.

**Harness fixes:**
- Two early attempts failed on the harness itself (an unmapped creature, and a combat left behind, since deleted). The case now always deletes its combat.

**Regressions:** `cr1Batch88` (Swampcall) and `drought` (Breath of Drought, lingering area) passed, with cleanup between runs. The runs left no P23 fixtures, combats or `PFTEST` regions.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b176
node tools/diff-compiled-plans.mjs /tmp/phase23-b175/official-spell-compiler-report.json /tmp/phase23-b176/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b176/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch93`, then `cleanup`.
