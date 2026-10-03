# Rank 1 batch 2 — verification

2026-09-26. The second rank-order batch: rank-1 spells, including cantrips, which are rank 1 in PF2e. One of the rules is general enough that it also frees two higher-rank spells.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| Basic-save rider leads “it's also …” and a narrated participle; an alternative area as a card choice | Spout (cantrip) |
| A critical-failure Effect whose Weakness the rider states exactly | Frostbite (cantrip) |
| A caster question that upgrades the damage dice (none for PF2e's own d12 variant); unattended objects as a GM reminder | Cry of Destruction (1) |
| Save spells with one paragraph per action count: each PF2e variant keeps its own paragraph, checked against its data | Concordant Choir (1, all three variants), Disorienting Flash (2, 2 actions), Force Rain (4, 1 and 2 actions) |

### Kept as gaps

- **Haunting Hymn:** its rider now parses, but “only creatures in the area can hear” is a rule an existing test protects. It stays blocked.
- **Action-paragraph variants that stay blocked:**
  - Disorienting Flash's 1- and 3-action variants: PF2e's data disagrees with the text (a 5-foot burst against “5-foot square”; 1d10 against “2d10”).
  - Force Rain's 3-action variant has no save.
  - Plasma Whirl: “temporary portal” trips the gate's “temporary” signal.
  - Elemental Annihilation Wave: a trait-swap option.
  - Inner Radiance Torrent: its opening says 60 feet against 120 in the variant.
  - Rip the Spirit: area data, and a rider inside its damage sentence.
- **Needle of Vengeance and Forbidden Thought** (triggers held on the cast's target) and **Circle of Weakness** (a second caster choice in a lingering area) are left for later rank-1 batches.

## Coverage

**Census:** **425 enabled**, up from 419 (Phase 2: 233 of 588; Phase 3: 51 of 615).
- **Base plans:** the b67 corpus diff against b66 changed three, Frostbite, Spout and Cry of Destruction.
- **Variant plans:** exactly Concordant Choir (1–3), Cry of Destruction (both), Disorienting Flash (2) and Force Rain (1, 2) became executable.
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 462/462 tests pass. `test/rank-1-batch-2.test.js` covers:
- the rider leads, and a narrated lead with a rule, which is refused;
- Spout's area choice, with Haunting Hymn still blocked;
- Frostbite, and a claim of more weakness than the Effect gives, which is refused;
- the d12 question and the Dealt Damage variant;
- every Concordant Choir variant, the base item, and Force Rain / Disorienting Flash variants that are blocked.

[Live evidence](phase-rank-1-batch-2-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch2`:
- **Frostbite:** a critical failure lost 16 (double 8) and got “Spell Effect: Frostbite”, weakness 1 to bludgeoning for 1 round. A failure had no weakness.
- **Spout:** a critical failure was Off-Guard and a failure wasn't. The card showed the water-burst area choice.
- **Cry of Destruction:**
  - Damage couldn't be rolled before the caster answered.
  - After “Yes” it rolled `1d12 sonic` (12, applied in full), and the unattended-objects reminder showed.
  - PF2e's Dealt Damage variant rolled `1d12 sonic` without a question.
- **Concordant Choir:**
  - The 1-action variant rolled `1d4 sonic` against one enemy.
  - The 2-action variant rolled `2d4 sonic`: full 3 on a failure, half (1) on a success.
- **Disorienting Flash (2 actions):** `2d10 sonic`, and Dazzled until the end of the caster's next turn.
- **Force Rain (1 action):** `4d6 force`; a success lost 4 of 8.
- **Regressions:** `actionVariants`, `healOrHarm`, `attackVariantChoices`, `rank1Batch1`, `compact` and `attackComponents` passed, with cleanup between them. Cleanup left no fixtures and no combats.
- `FilePicker.upload` returned `false` in `pftest` this time. The results were read from the page and written here directly; the regressions are summarized with pass/fail and timestamps.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b67
node tools/diff-compiled-plans.mjs /tmp/phase23-b66/official-spell-compiler-report.json /tmp/phase23-b67/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b67/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch2`, then `cleanup`.
