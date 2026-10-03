# Cantrip / rank 1 batch 12 — Effect + note

2026-09-27. Your decision: a spell that links a PF2e Effect the module can't prove covers the text (or can't tell who receives it) gets PF2e's own Effect on the clear recipient, asking at cast when it's unclear. It also gets a note Effect with the spell's text, and is counted apart as “Effect + note”.

## Rules

| Rule | Example (live) |
| --- | --- |
| No save or attack; exactly one linked PF2e Effect, unscoped and found in PF2e's data. **Apply Effect + Note** applies the Effect as PF2e defines it, plus “Spell Note: <spell>” with the spell's text at the cast rank, for the spell's duration | Sure Strike (1): PF2e's Effect (roll twice, 2 rules) and the note, on the caster |
| Target line names creatures: the targets; more than the line allows is refused | Glimpse Weakness (cantrip): on the target only; 2 targets refused |
| The text doesn't say who: the card asks, caster or targeted creatures | Light (cantrip): once on a targeted ally, once on the caster, each with its 1-day note |
| PF2e's ChoiceSet prompts run as usual; a month becomes 30 days | Harrowing (rank-1 ritual, excluded from the scope census): result and suit chosen in PF2e's prompts; 30-day note |
| An instantaneous spell whose Effect lasts: the note lasts as the Effect does | Cinder Gaze (1), test |

**Never this route (tests):**
- damage, healing or counteracting in the text;
- two linked Effects;
- an Effect PF2e doesn't have;
- a spell with a save.

These take their own routes or stay blocked.

## Coverage

**Census:** **491 enabled**, unchanged.
- **Effect + note** (counted apart): 82 non-ritual (83 in scope, 85 installed): 11 cantrips, 22 rank 1. The status and by-rank docs have an “Effect + note” column and list.
- **Note only:** 294 non-ritual. Seven spell notes now count weeks, months or years as days.

**Compile checks:**
- The b95 corpus diff against b94 turned 85 previously `unsupported` plans into `effect-note`.
- No plan became or stopped being executable.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

**Tests:** two older strictness tests (`duration-bound-effect`, `rank-1-batch-6` Protection) now assert only that the proven Effect route isn't taken, since those spells fall to Effect + note.

## Evidence

**Automated:** 532/532 tests pass (`test/cantrip-rank-1-batch-12.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-12-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch12` (the four examples above).

**Regressions:** `durationBuffs`, `rank1Batch6`, `cr1Batch8`, `reactionBuffs` and `cr1Batch7` passed, with cleanup between them. The run left no P23 fixtures, combats or open prompts.

## Limits

- PF2e's Effect keeps PF2e's own duration, which can differ from the spell's (Glimpse Weakness's Effect is unlimited and ends itself). The note carries the spell's duration.
- A sustained spell's note says to remove it when Sustaining stops; nothing is removed automatically.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b95
node tools/diff-compiled-plans.mjs /tmp/phase23-b94/official-spell-compiler-report.json /tmp/phase23-b95/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/phase23-b95/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b95/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch12`, then `cleanup`.
