# Cantrip / rank 1 batch 123 — Wish Market

2026-09-28. The user took the recommendations: option (A).

| Rule | Spell |
| --- | --- |
| A new `offer-effect` route. The caster's chosen skill (Acrobatics, Athletics, Nature, Occultism or Religion) and Perception get +1 status (+2 at rank 4, +3 at rank 7). A rolled 1d4 price gives −2 status to two skills. Haggle on a Sustain suppresses the price for 1 round. The free Recall Knowledge or Seek are notes | Wish Market (1) |

**Kept strict (tests):** it isn't read with any of these changes:
- damage in the narration;
- a die that doesn't match the table;
- a price overlapping the chosen skills;
- an added AC penalty in a price row;
- an added bonus in a heightened entry;
- an added condition after the Sustain sentence;
- an added bonus after the free actions.

## Coverage

**Census:** **604 enabled**, up from 603.
- The b206 corpus diff against b205 changed only Wish Market.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 733/733 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-123-live-results.json), case `cr1Batch123`, in the `pftest` world. The caster (level 7) cast it at rank 4 and chose Nature.
- **After casting:** Perception and Nature gained +2. The price rolled 3 (Manual Dexterity): Crafting and Thievery took −2, and no other skill changed.
- **The Haggle button:** a real click on “Sustain: Haggle with the merchant” added “Wish Market: price suppressed” (1 round, slug `wish-market-price-suppressed`). Crafting and Thievery went back to 0, the +2 bonuses stayed, and the button stayed enabled.
- **Removing the marker:** Crafting went back to −2 (`afterMarkerRemoved: -2`).
- **Cleanup:** fixtures removed.

**Correction (2026-09-28, batch 127):** the speed check did not pass for this batch; the Coverage line above is wrong about it. The check failed on “Manifest Will: full-family route expectation”: batch 120 recorded Manifest Will, whose route is the Effect + note, and the test expected every audited batch spell to gain a save route. The pipeline only searched the output for a passing line, so the failure printed nothing. The escape and rule-family checks were unaffected. Batch 127 fixed the test (see its [verification](phase-cantrip-rank-1-batch-127.md)), and it now passes. This batch's `.sha256` manifest predates this note.
