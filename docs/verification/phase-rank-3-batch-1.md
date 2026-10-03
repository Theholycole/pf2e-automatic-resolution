# Rank 3 batch 1 — verification

2026-09-26. The first rank-3 batch, in strict rank order (your choice: no rule-less tracking Effects). The rule is the push-row family.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| A push-only row (“The creature is pushed 15 feet away from you.”), with no damage in that row | Begone (3), Pushing Gust (1) |
| “The target is pushed 10 feet away from you and knocked Prone.”: the push note plus the row's Prone | Pushing Gust |
| The wall and ledge sentences before the table (“If the creature's movement causes it to hit a firm surface, such as a wall, it takes @Damage[…] damage.”, “A creature knocked off a ledge or the like can [[/act grab-an-edge]] to avoid falling.”) join the **GM:** push note, with the damage at the cast rank | Begone |
| “is pushed 10 feet” with no direction is away from the caster only for a cone or emanation, or a creature target | (read; Qi Blast and Unbreaking Wave Advance stay blocked for other reasons) |
| **Guard:** any other firm-surface, solid-barrier or ledge sentence blocks the spell (`preamble:collision`) instead of being dropped | Unbreaking Wave Advance, Unbreaking Wave Barrier, Life's Flowing River (already blocked) |

**Found and fixed:** Begone's wall-damage sentence wasn't read by any preamble check. A first guard flagged every inline damage roll and action macro before a table. That would have blocked five enabled spells whose preamble damage other rules already claim (Puff of Poison, Grim Tendrils, Ulcerous Canker, Cutting Insult, Combustion), so it was narrowed to collision sentences.

**Still blocked:**
- Qi Blast: its “If you use 2 actions …” sentences restate PF2e's variants.
- Unbreaking Wave Advance: its collision damage is the spell's structured damage.
- The rest of rank 3 is mostly one-off wordings.

## Coverage

**Census:** **462 enabled**, up from 460. Rank 1: 128. Rank 3: 60 of 261.
- The b82 corpus diff against b81 changed 6 plans: Begone and Pushing Gust are newly enabled.
- Qi Blast and Unbreaking Wave Advance read the new rows but stay blocked. Unbreaking Wave Barrier and Life's Flowing River got the collision guard and were already blocked.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 499/499 tests pass. `test/rank-3-batch-1.test.js` covers the rows, Prone, the push notes, the collision guard and the direction refusal.

[Live evidence](phase-rank-3-batch-1-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank3Batch1`:
- **Pushing Gust:** the card's **GM:** reminders read pushed 5, 10 and 10 feet away from the caster. Only the critical failure was knocked Prone, and nobody took damage.
- **Begone** (rank 3, failure): “… is pushed 15 feet away from the caster. Move the token; the module doesn't. If the creature's movement causes it to hit a firm surface, such as a wall, it takes 5 bludgeoning damage. A creature knocked off a ledge or the like can Grab an Edge to avoid falling.”
- **Regressions:** `cantripBatch1` (Gale Blast's damage-and-push rows), `longTailBatch2` (save-row movement toward the centre) and `rank2Batch1` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b82
node tools/diff-compiled-plans.mjs /tmp/phase23-b81/official-spell-compiler-report.json /tmp/phase23-b82/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b82/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank3Batch1`, then `cleanup`.
