# Cantrip / rank 1 batch 11 — attitude notes

2026-09-27. Your direction names attitude adjustments and their dependencies as note material. Attitude changes are now note Effects, never conditions.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| An attitude link (Friendly, Helpful, Indifferent, Unfriendly, Hostile) is never applied as a condition. Before this, Charm's failure row compiled both Friendly and Helpful; it stayed blocked, so nothing wrong ever ran | all |
| “The target's attitude becomes Friendly toward you. If it was Friendly, it becomes Helpful.”: one **Attitude** note (a row's same-kind sentences merge), for the spell's duration | Charm (1), Charming Touch (1) |
| “As failure, but the target is helpful.”: its own Attitude note replaces the failure's | Charming Touch |
| “If you use hostile actions against the target, the spell ends.”: added to the notes (before the table), or its own note “Ends if the caster is hostile” (in a row) | Charm, Charming Touch |
| “Heightened (4th) The duration lasts until the next time you make your daily preparations.”: notes lasting the spell's duration last 1 day at 4th rank and above | Charm |
| “It must attempt a Will save, with a +4 circumstance bonus if you or your allies recently threatened it or used hostile actions against it.”: the GM's question per target, adding +4 on yes | Charm (Charming Touch's wording was already read) |
| “The target is unaffected but thinks your spell was something harmless instead of charm, unless it identifies the spell.”: narration | Charm, Charming Touch |
| In a row: “You can Dismiss the spell.” (the cast's Dismiss), and the two “doesn't necessarily realize it was charmed” sentences (narration) | Charming Touch |
| Target `1 creature that could find you attractive`: the GM confirms each target before its save | Charming Touch |

**Kept strict (tests):**
- A save bonus that depends on a roll result isn't a question.
- Another eligibility phrase isn't read.
- A mechanical rule beside the attitude (“takes 2d6 mental damage”) still blocks the row.
- A note with its own timing keeps it when heightened.

## Coverage

**Census:** **491 enabled**, up from 489. Rank 1: 152 of 387.

The b94 corpus diff against b93 changed nine plans:
- Charm and Charming Touch became executable.
- Paranoia, Sudden Recollection, Favorable Review, Outcast's Curse, Rewrite Memory, Glimmer of Charm and Pack Breaker (ranks 2–5) lost their attitude conditions and stay blocked by other rules.
- No plan lost a route.

The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 529/529 tests pass (`test/cantrip-rank-1-batch-11.test.js`).

[Live evidence](phase-cantrip-rank-1-batch-11-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch11`. All notes had 0 rules.
- **Charm:**
  - Failure (GM answered +4): “Charm: Attitude” (Friendly, or Helpful if already Friendly; the spell ends on the caster's hostility) and “Charm: No hostile actions against the caster”, each lasting 1 hour.
  - Critical failure: one Attitude note (Helpful).
  - Success: nothing.
  - No attitude conditions on anyone.
- **Charm at 4th rank:** both notes lasted 1 day.
- **Charming Touch:** the confirmed target got Attitude (“The target is helpful.”), “Ends if the caster is hostile” and the hostility note, lasting 10 minutes. The target the GM marked unaffected got nothing. The question read “Could the creature find the caster attractive? …”.

**Regressions:** `cr1Batch6`, `cr1Batch4`, `longTailBatch4`, `phrasings` and `rank1Batch2` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Limits

- The attitude itself isn't tracked; the note tells the GM what it becomes.
- At 8th rank, Charm's “target up to 10 creatures” isn't read: the card still takes one target.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b94
node tools/diff-compiled-plans.mjs /tmp/phase23-b93/official-spell-compiler-report.json /tmp/phase23-b94/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b94/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch11`, then `cleanup`.
