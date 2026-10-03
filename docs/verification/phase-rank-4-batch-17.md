# Rank 4 batch 17 — Vital Beacon, Healing Well

2026-10-02. Part of the user's ranks 3–5 pass. (Healing Well is rank 5; it's batched here with the same route.)

| Spell | Now |
| --- | --- |
| Vital Beacon (4) | A tap card (the food route's) on the caster. The creature that taps (an Interact action, once per round, a note) regains the rank's d10s, then d8s, d6s and d4s (4d10, 4d8, 4d6, 4d4 at 4th). After the fourth tap the spell ends. PF2e's rule-less marker Effect is replaced by the card. |
| Healing Well (5) | A tap card with five taps, each PF2e's healing roll of the item at the cast rank (4d8, +3 a rank). Placement and the other rules are notes. After the fifth tap the spell ends. |

## Rules

- **Food route (`food-healing.js`):**
  - A well tapped for healing: "…can Interact to tap into the well's power, recovering NdM Hit Points." with "When the well has been tapped N times, the spell ends." The amount is the item's healing; its heightening is the item's own.
  - A beacon with weakening dice: four formulas from the text, "until your next daily preparations" as a day.
- **Compile (`compile-ability.js`):** the food route accepts a beacon whose only linked Effect has no rules; that Effect's scope and recipient are not pending.
- **Runtime (`effect-runtime.js`):**
  - The card is worded for taps.
  - A beacon rolls its own formula for each tap, with the cast rank's dice.
  - Messages say "no taps are left (the spell has ended)". This was changed after the live run, which shows the earlier food wording.

## Tests

1069 pass. `test/rank-4-batch-17.test.js` is new, with negative cases:
- without "after which the spell ends";
- without a tap count.

A whole-corpus compile (b402 → b403) changed only these two.

## Evidence

[Live evidence](phase-rank-4-batch-17-live-results.json), case `rank4Batch17`, in the `pftest` world.
- Vital Beacon at 4th: an ally's four taps healed 23 (4d10), 22 (4d8), 4 (4d6) and 13 (4d4); then no taps were left and a fifth tap was refused.
- Healing Well at 5th: two taps healed 20 and 21 (4d8 each), with 3 taps left.
- **Cleanup:** fixtures removed.
