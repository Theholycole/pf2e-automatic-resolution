# Cantrip / rank 1 batch 41 — Halcyon Mists

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “A soothing mist gathers around the target, granting 1d8 temporary Hit Points and ending one source of persistent acid, bleed, fire, poison, or void damage affecting it. If the creature has persistent damage from more than one of these sources, you choose the one that ends.”: PF2e's Effect gives the temporary HP (its badge rolls `(@item.level)d8`). The module ends the target's one persistent damage of those types. With several, the card asks the caster to choose | Halcyon Mists (1) |
| “The mists linger around the target, making them Concealed until the beginning of their next turn, though this obvious concealment can't be used to Hide.”: the Effect's Concealed, with a **GM:** reminder that it can't be used to Hide | Halcyon Mists |

**A stricter check.** The Effect-completeness check had no signal for “ending persistent damage”. With the choice sentence gone, such a rule would have passed unclaimed. Sentences that deal, take or end persistent damage now block unless a proof claims them. Battle-form stat blocks are excluded. The first draft of this check also caught Insect Form's and Dinosaur Form's stat blocks, so it was narrowed. In b124 only Elemental Gift, already guided, gained the gap.

**Kept strict (tests):** different temporary HP dice, or the persistent sentence without the caster's choice, isn't proved.

## Coverage

**Census:** **523 enabled**, up from 522.
- The b124 corpus diff against b123 changed Halcyon Mists and Elemental Gift (still guided, one more gap).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 591/591 tests pass (`test/cantrip-rank-1-batch-39.test.js` also holds these cases).

[Live evidence](phase-cantrip-rank-1-batch-41-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch41`:
- **Target with persistent fire:** the fire ended. It got 5 temporary HP (1d8), Concealed and the Effect.
- **Target with fire and acid:** both remained, and the card asked the caster to choose one. It got 1 temporary HP.
- **Card:** it showed the Hide reminder.

**Regressions:** `cr1Batch33` (Benediction, GM notes) passed. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b124
node tools/diff-compiled-plans.mjs /tmp/phase23-b123/official-spell-compiler-report.json /tmp/phase23-b124/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b124/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch41`, then `cleanup`.
