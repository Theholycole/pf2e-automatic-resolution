# Cantrip / rank 1 batch 114 — Appearance of Wealth

2026-09-27. Continuing spell by spell.

## Rules

| Rule | Spell (rank) |
| --- | --- |
| “Each creature within 20 feet of the area that could be enticed by material wealth must attempt a Will saving throw.”: the targeted creatures, each confirmed by the GM | Appearance of Wealth (1) |
| Critical success: unaffected. Success: Fascinated until it has completed its first action on its next turn (an Ongoing control ends it). Failure (and critical failure): Fascinated while sustained | Appearance of Wealth |
| Entering the area disbelieves and ends Fascinated; the Sustain's harmless display: notes on the card | Appearance of Wealth |

**Kept strict (tests):** it isn't read with any of these changes:
- an added condition on the lure;
- damage in the display;
- “first two actions”.

## Coverage

**Census:** **595 enabled**, up from 594.
- The b197 corpus diff against b196 changed only Appearance of Wealth (newly executable).
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 719/719 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-114-live-results.json), case `cr1Batch114`:
- **Before the GM confirmed:** finalizing was refused.
- **Success and failure:** both became Fascinated. The success's only control was “completed its first action this turn”, and using it ended only that creature's Fascinated.
- **The cast:** its record is sustained, and ending it ended the failure's Fascinated.
- **Card:** it showed both notes.

**Regressions:** `cr1Batch106` and `cr1Batch102` (the other action ends) passed.
