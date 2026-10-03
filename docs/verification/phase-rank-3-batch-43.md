# Rank 3 batch 43 — Warning Stripes

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Warning Stripes (3) | A retaliation marker for 1 minute. A creature that touches the bearer or hits it with an unarmed melee attack takes 2d8 poison damage (+1d8 per 2 ranks) through the Retaliate control. The marker goes on the caster or, if one is targeted, on the caster's animal companion within 30 feet. |

## Rules

- **Retaliation trigger (`retaliation.js`):** "Any creature that touches you or hits you with an unarmed melee attack takes NdM type damage." is read. It is checked against the item's damage entry, which PF2e heightens.
- **Companion option:** "If you have an animal companion, you can cast this spell on them instead, with a range of N feet." becomes `retaliation.companion`.
  - At runtime, one targeted creature other than the caster becomes the bearer, after the caster confirms it's their companion.
  - The range is checked.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-43.test.js` is new. Its negative cases:
- damage that differs from the item's;
- the companion sentence without a retaliation sentence before it.

A whole-corpus compile (b444 → b445) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-43-live-results.json), case `rank3Batch43`, in the `pftest` world.
- **On the caster at 3rd:** Retaliate rolled 2d8 poison = 12, and the attacker lost 12.
- **On the adjacent companion at 5th:** the marker went on the companion. Retaliate rolled 3d8 poison = 14, and the attacker lost 14.
- **Cleanup:** fixtures removed.
