# Cantrip / rank 1 batch 16 — per-row durations

2026-09-27. Continuing the cantrip and rank-1 pass spell by spell. A group of save spells describe their effect before the table, and each row only says how long it lasts. Under your note direction, the effect is now a note lasting each row's duration.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| Rows “The duration is 1 round / 1 minute / 10 minutes.”: the effect before the table (“… no creature more than 10 feet away can hear its whispers …”) is a “Spell's effect” note with each row's duration. The spell's existing 24-hour temporary immunity still applies | Forced Quiet (1) |
| “The target is affected for 1 round / 1 minute.” and “As failure, but the target can't perceive anything beyond a range of 10 feet.”: the failure's duration, with the restriction added to the note | Clouded Focus (1) |
| “The effect lasts for 1 round.” / “The effect lasts its normal duration.”: 1 round, or the item's 10 minutes | Penumbral Shroud (1) |
| “A willing target can choose to critically fail their saving throw.” / “You can allow allies to choose the outcome …” / “… a creature can willingly choose to be subject to the failure effect”: a **GM:** reminder to set the result | Clouded Focus, Penumbral Shroud |
| Situational numbers now also read capitalised “When”/“If”, “to open the …”, “attempted with …”, and “reduce … to 0 Hit Points” | spell notes: Bone Shield, Protector Tree, Lock (1); Foresee the Path, Nudge Fate (cantrips) |

**Kept strict (tests):**
- An effect with damage stays blocked (Agitate's 2d8 at the end of a turn).
- So does an unconditional bonus in the effect, and a row that says anything besides its duration.
- Forced Mercy (a rolled 1d4-round duration) stays blocked.

## Coverage

**Census:** **497 enabled**, up from 494. Rank 1: 157 of 387. Note only: 358 non-ritual.
- The b99 corpus diff against b98 changed 15 plans: Clouded Focus, Forced Quiet and Penumbral Shroud became executable, and 11 spell notes were added (5 cantrip or rank 1, 6 at ranks 3–7, all situational bonuses).
- Lock Item (rank 2) lost its note gaps but stays blocked by its target.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 542/542 tests pass (`test/cantrip-rank-1-batch-16.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-16-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch16`:
- **Forced Quiet:** the four degrees gave no note, then notes of 1 round, 1 minute and 10 minutes. Every target also got the 24-hour immunity.
- **Clouded Focus:**
  - The critical failure's 1-minute note included the 10-foot limit.
  - The card showed the GM's willing-choice reminder.

The first run's assertion missed the immunity Effects and failed; it was corrected and re-run.

**Regressions:** `cr1Batch6`, `cr1Batch11`, `longTailBatch4` and `cr1Batch15` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b99
node tools/diff-compiled-plans.mjs /tmp/phase23-b98/official-spell-compiler-report.json /tmp/phase23-b99/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b99/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch16`, then `cleanup`.
