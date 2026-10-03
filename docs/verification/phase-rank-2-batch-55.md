# Rank 2 batch 55 — Gentle Breeze

2026-10-01. Follows the user's decision of 2026-10-01: the text over mismatched PF2e data, by added rules where needed.

| Spell | Now |
| --- | --- |
| Gentle Breeze (2) | The GM places the 40-foot burst. For 10 minutes, every creature inside holds PF2e's Effect: +2 status to saves against afflictions for a living creature, and +2 status to Medicine checks that benefit a living creature. A creature that leaves loses the Effect. The living creatures inside when it's cast are tracked, and one that leaves is dropped. When the duration runs out, the rest regain 10 Hit Points (+10 per 2 ranks), and the area is removed. The GM gets a note to adjust the heat's temperature effects. |

## Rules

- **`area-boon.js` (new family, kind `area-boon`):**
  - The three rule sentences exactly (one sentence of narration allowed) and "Heightened (+2) The healing increases by 10 Hit Points." (the item's own step).
  - PF2e's Effect must be exactly its two modifiers.
  - **Text over data:** PF2e's Medicine modifier waits on a roll option (`benefit-creature`) that PF2e never sets. The module adds a toggle for it on the Effect.
- **Runtime (`ongoing-families.js`):**
  - `startAreaBoon` starts a placed lingering record whose `memberEffect` (`all`) goes on every creature inside, with the toggle.
  - `stayers` holds the living creatures inside at the cast, narrowed on every reconcile.
  - `applyStayHealing` runs when the cast ends by `maximum-duration` only (a dismissed or removed area heals no one).

## Tests

901/901 pass. `test/rank-2-batch-55.test.js` is new. It checks:
- the plan, the toggle, and the healing by rank (10, 20 at 4th, 30 at 6th, 40 at 9th);
- that a changed bonus, healing, step or condition isn't read.

A whole-corpus compile (b309 → b310) changed only Gentle Breeze.

## Coverage

**Census:** **1132 enabled**, up from 1131. Rank 2: 218 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-55-live-results.json), case `rank2Batch55`, in the `pftest` world (two NPCs at 5 of 50 HP, cast at 4th).
- **Cast:** both creatures held "Spell Effect: Gentle Breeze" with the toggle; both were tracked.
- **One left:** it lost the Effect; the other kept it.
- **Duration ran out:** the one that stayed went from 5 to 25 HP; the one that left stayed at 5. Neither holds the Effect, and the area is gone.
- **A probe:** PF2e's +2 Medicine modifier didn't apply before the toggle, and applied with it on (with a living target).
- **Cleanup:** fixtures removed.

## Limit

The bonus sits on the medic's Effect. A medic standing just outside the area while treating a creature inside doesn't hold it.
