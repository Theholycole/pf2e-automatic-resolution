# Rank 2 batch 1 — verification

2026-09-26. The first rank-order batch after the terrain family (rank 2 had 57 of 245).

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| A basic save's “N persistent TYPE damage” is part of the roll when it is exactly one of the item's persistent damage entries; the result halves or doubles it as PF2e's own buttons do | Bone Spray (2), Calcium Rain (5) |
| A GM-answered penalty to a basic save (“…: Prone creatures or those taking persistent bleed damage take a –2 status penalty to the save.”) | Feral Shades (2) |
| The GM-answered save adjustment now reads bonuses and penalties, circumstance or status, in four phrasings (“If …, it takes …”, “It gains … if …”, “A creature … takes …”, “Creatures with the X trait take …”) | Feral Shades; Wilding Word, Chroma Leach, Luring Wail, Charming Touch, Sudden Blight and Dimensional Excision now read it but stay blocked by other text |
| “As success, but the effect lasts 1 minute.” (also “As failure, except the duration is N …”): the inherited conditions with the new fixed duration; a later “As failure, and …” row inherits it | Manifestation of Spirits (2) |
| “The target believes …” with no rules in it narrates the row's conditions | Manifestation of Spirits |

**Kept strict:**
- A persistent phrase that doesn't match an item damage entry is still an uncompiled signal (test: Bone Spray rewritten to “persistent fire”).
- A save adjustment about a roll result (Firework Blast's “Creatures that critically fail …”), another save, or an item bonus is refused.
- A “believes” clause that states a rule (“believes it must Stride away …”) is refused.
- Paranoia and Phantasmal Treasure read the new inherited durations but stay blocked by other rules.

**Still blocked at rank 2 (examples):** Sudden Blight (living-only targets, rotting plants, counteract), Binding Muzzle and Laughing Fit (action restrictions), Unrelenting Gravity (falling rules), Frozen Lungs (damage when the target acts), Warrior's Regret, and the lingering areas still waiting for their family (Breath of Drought, The Queen's Rainbow, Animated Assault).

## Coverage

**Census:** **457 enabled**, up from 453. Rank 2: 60 of 245. Rank 5: 37.
- The b80 corpus diff against b79 changed 10 plans. Bone Spray, Calcium Rain, Feral Shades and Manifestation of Spirits are newly enabled.
- Wilding Word, Charming Touch, Chroma Leach and Luring Wail lost their save-adjustment blocker, and Paranoia and Phantasmal Treasure got inherited durations. All six stay blocked by other rules.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 495/495 tests pass. `test/rank-2-batch-1.test.js` covers:
- the persistent-component gate, with its refusal;
- Feral Shades' status penalty question;
- the save-adjustment shapes and refusals;
- Manifestation of Spirits' durations and the belief refusal.

[Live evidence](phase-rank-2-batch-1-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank2Batch1`:
- **Bone Spray:** `2d10 piercing + 1 bleed`, with 4 targets:
  - critical success: nothing;
  - success: half the direct damage, and persistent bleed `0.5 * 1`;
  - failure: full damage, and bleed `1`;
  - critical failure: double damage, and bleed `2 * 1`.
- **Calcium Rain:** the failure took the full roll and 5 persistent bleed.
- **Feral Shades:** the card asked about “prone creatures or those taking persistent bleed damage”. The GM-marked Prone target saved at +8 against the other's +10, and both failures took the full roll.
- **Manifestation of Spirits:**
  - success: Stupefied 3 for 1 round;
  - failure: Stupefied 3 for 1 minute;
  - critical failure: Stupefied 3 for 1 minute and Confused for 1 round.
- **Regressions:** `attackAdjustments` (Blistering Invective's +4 and Thunderstrike's −1), `longTailBatch4`, `rank1Batch1`, `lingering`, `rank1Batch10`, `cantripBatch1` and `terrainBatch2` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b80
node tools/diff-compiled-plans.mjs /tmp/phase23-b79/official-spell-compiler-report.json /tmp/phase23-b80/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b80/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank2Batch1`, then `cleanup`.
