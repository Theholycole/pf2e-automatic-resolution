# Rank 5 batch 3 — Banishment

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Banishment (5) | The GM confirms each target is away from its home plane. The caster answers the card's question: an extra action and an anathema cost give that target −2 circumstance to its Will save. **Critical Success:** no effect on the target; the caster is Stunned 1. **Success:** no effect. **Failure / Critical Failure:** the GM's reminder that it's banished (remove its token); the critical failure adds the 1-week bar. Heightened (9th) allows 10 targets. |

## Rules

- **The caster's option (`save-preamble.js`):** "You can spend an extra action while Casting this Spell and add a cost to the spell to give the creature a –N circumstance penalty to its save." is a save adjustment the caster answers (−N / 0) per target.
- **Caster conditions on a row (`compile-ability.js`, `basic-save-core.js`, `basic-save-runtime.js`):** "… and you are Stunned 1." applies to the caster, not the target.
- **"The target resists being X." (`residual-prose.js`):** this means no effect.
- **Banished rows:** a `banished` row note (a GM reminder). The critical failure's "for 1 week" doesn't become an Effect duration.

## Tests

998 + 2 pass. `test/rank-5-batch-3.test.js` is new; it includes a negative case (a penalty to AC isn't read as the option).

A whole-corpus compile (b364 → b365) changed only Banishment.

## Evidence

[Live evidence](phase-rank-5-batch-3-live-results.json), case `rank5Batch3`, in the `pftest` world, cast at rank 9 with four targets.
- Rolling before the question was answered was refused.
- The "Yes" target's save modifier was 2 lower (8 vs 10).
- The critical success left the caster Stunned 1.
- The failure and critical failure each showed the banished reminder.
- The targets got no Effects or conditions.
- **Run note:** the first run didn't confirm the home-plane question; the case now confirms it.
- **Cleanup:** fixtures removed.
