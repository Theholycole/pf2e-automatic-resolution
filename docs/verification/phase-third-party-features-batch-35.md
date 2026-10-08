# Third-party features batch 35: Triplicate Casting

2026-10-07. The last cast rider to build ([audit](../planning/third-party-features-audit.md)).

## What changed

- **`plus-feature-rules.js`:** the `triplicate` action kind.
- **`scripts/text-rules.js`:**
  - The feat's card arms the caster (actor flag `triplicate`).
  - `triplicateOnCast`, hooked on every cast in `main.js`, notes each of the next three qualifying casts and gives back slots through `refundSlot`, so only the highest-rank cast's slot stays spent. A non-qualifying cast ends the arming.

The official plans are unchanged except Temporal Twin's pending list. The third-party spell census is unchanged.

## Tests

`test/third-party-features-batch-35.test.js` (1). All unit tests pass.

## Evidence

[Live evidence](phase-third-party-features-batch-35-live-results.json), case `thirdPartyFeaturesBatch35`. A 6th-level divine spontaneous caster, 3 slots at ranks 1–3:

| Step | Slots (ranks 1, 2, 3) |
| --- | --- |
| Triplicate Casting's card, then Force Barrage at 2 | 3, 2, 3 |
| Heal at 1 | 3, 2, 3 (Heal's given back) |
| Harm at 3 | 3, 3, 2 (Force Barrage's given back; only the rank-3 slot spent) |
| Force Barrage at 1 (not armed) | 2, 3, 2 |
