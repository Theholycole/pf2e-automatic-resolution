# Rank 1 batch 1 — verification

2026-09-26. The first batch in spell-rank order, as the user asked: the blocked rank-1 spells, several unrelated general rules at a time, with one live run.

## Where rank 1 stands

- **Blocked before this batch:** 281 rank-1 spells.
- **Phases 2–4:** Phase 2 had 81 (native Effects 19, conditions 23, degree outcomes 15, persistent damage 10). Phase 3 had 118; Phase 4 had 32.
- **Phase 9:** 16 are Phase 9 review entries, left until last.
- Most rank-1 gaps are one-offs. Two groups that look shared aren't honestly automatable yet:
  - **Durations set by the save** (Forced Quiet, Forced Mercy, Clouded Focus, Penumbral Shroud): these only time prose effects that have no PF2e Effect.
  - **Degree-row Effects** (34 blocked spells): most rows also carry rules their Effects don't state, so the general row proof frees one of them here.

## Rules and spells

| Rule | Spell |
| --- | --- |
| A sentence the Effect's rules state exactly: Bulk limits | Ant Haul |
| A sentence the Effect's rules state exactly: fists (heightened durations already read) | Wooden Fists |
| A caster reminder for each target that fails a basic save | Brain Drain |
| A GM-judged −1 to the save, and Clumsy 1 for 1 round only for those targets when damaged | Thunderstrike |
| A degree-row Effect whose penalties and duration one row sentence states; the Target “the triggering foe” | Schadenfreude |
| A reaction whose Target field is its trigger; an instantaneous basic save with its own table; rounds rolled per creature | Split the Tongue |

### Found and fixed during the batch

The basic-save table rule first made Divine Immolation (rank 5) executable. That was wrong: its preamble's inline persistent damage and the GM's fire-or-spirit choice would have been dropped.

- The table rule now refuses a preamble with inline rolls, “instead” or a GM ruling, or rows that mention persistent damage.
- “as determined by the GM” in a save preamble is now its own gap (`gm-adjudication`). Four already-blocked spells gained it: Curse of Lost Time, Mycological Malady, Duplicate Foe and Trim the Blight.
- An inline-damage signal was tried too. It wrongly withdrew five enabled spells (Puff of Poison and others), so it was removed.

## Coverage

**Census:** **419 enabled**, up from 413 (Phase 2: 228 of 588).

**The b66 corpus diff against b65 changed 12 plans:**
- The six spells above.
- Chastising Retort and Confusing Colors: rolled durations now read; both still blocked for other rules.
- The four `gm-adjudication` gaps above.
- No plan lost a route.

The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 457/457 tests pass.
- `test/rank-1-batch-1.test.js` covers each rule and its refusals:
  - a Bulk amount the Effect doesn't give;
  - a follow-up sentence with its own rule;
  - a row claim with a different duration, a missing statistic or a rule in the narration;
  - Divine Immolation staying blocked.
- `test/homebrew-guide.test.js` compiles a homebrew spell with rolled rounds and its own table.

[Live evidence](phase-rank-1-batch-1-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `rank1Batch1`:
- **Ant Haul:** PF2e's Effect on the target (8 hours) raised Bulk before Encumbered from 5 to 8, and the maximum from 10 to 16.
- **Wooden Fists:**
  - The caster's Fist became `1d6 bludgeoning` with `reach-10` and no nonlethal trait, for 1 minute.
  - Heightened to 7th, it lasted 10 minutes.
- **Brain Drain:** a failure took full damage (3), and the card showed the caster's Recall Knowledge reminder.
- **Thunderstrike:**
  - The metal target saved at +9 against +10 for the other.
  - The damaged metal target was Clumsy 1 for 1 round.
  - The non-metal target wasn't; its card note says the GM answered no.
  - A metal target that critically succeeded took no damage and wasn't Clumsy.
- **Schadenfreude:** success gave “Spell Effect: Schadenfreude (Success)” for 1 round (Perception −1); failure gave Stupefied 1.
- **Split the Tongue:**
  - Failure lost 8 and was Stupefied 1 for 2 rounds (rolled 1d4); critical failure lost 16 and was Stupefied 2 for 3 rounds (rolled).
  - Both rolls were recorded as overrides.
- **Regressions:** `attackAdjustments`, `longTailBatch4`, `longTailBatch3`, `durationBuffs`, `heightenedDuration`, `compact` and `degreeChoiceAndRift` passed, with cleanup between them. Cleanup left no fixtures and no combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b66
node tools/diff-compiled-plans.mjs /tmp/phase23-b65/official-spell-compiler-report.json /tmp/phase23-b66/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b66/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `rank1Batch1`, then `cleanup`.
