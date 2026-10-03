# Rank 5 batch 21 — Psychic Outburst

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Psychic Outburst (5) | **PF2e's "2 to 3" variant:** a 20-foot emanation, 6d10 mental (+1d10 per rank), Will save. Failure pushes 10 feet, critical failure 20 feet, and the reminder says only when cast with 3 actions. **Two-round variant:** a 40-foot emanation, 8d10, enemies only, and the push always applies. |

## Rules

- **Outburst variants (`action-paragraphs.js` `rewriteOutburstVariant`):** for a "2 to 3" or "2 to 2 rounds" cast, it reads:
  - the lead "…, dealing X damage to creatures in the area with a basic Y save." and the action-count sentence;
  - the [2] and [3] paragraphs (the same damage, with the 3-action push);
  - the Two Rounds paragraph (its own area, damage, enemies only and push);
  - the Heightened entry, against the variant's data.

  The variant's own data decides which one it is. The result is written out as the basic save's four rows with the pushes.
- **Gated push:** `forcedMovement.actions: 3` is allowed only on a "2 to 3" cast. The card's push reminder adds "Only if the spell was cast with 3 actions.". The two-round variant gets the enemy predicate.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-21.test.js` is new and covers both variants. Its negative case is a variant whose damage matches neither stated damage.

A whole-corpus compile (b455 → b456) changed no base plan; Psychic Outburst's two variant plans now resolve.

## Evidence

[Live evidence](phase-rank-5-batch-21-live-results.json), case `rank5Batch21`, in the `pftest` world, cast at 5th rank.
- **"2 to 3" variant:** the critical failure took double 6d10 mental (68), and the push reminder named 20 feet "only if the spell was cast with 3 actions".
- **Two-round variant:** the caster's ally was ineligible. The enemy failed and took 8d10 mental (39), with an ungated 10-foot push reminder.
- **Cleanup:** fixtures removed.
