# Cantrip / rank 1 batch 148 — Animate Rope

2026-09-28. This replaces the Effect + note route.

| Rule | Spell |
| --- | --- |
| A sustained record with 2 commands at cast, and 1 more per Sustain. **Bind** (a control, at the targeted creature) rolls PF2e's spell attack against its Reflex DC; a hit applies PF2e's Effect (−10 Speed, −20 on a critical) with an Escape end against the spell DC. Coil, Crawl, Knot, Loop, Tie and Undo post what the rope does. Breaking the rope is a GM note | Animate Rope (rank 1) |

**Kept strict (tests):** it isn't read with any of these changes:
- −15 feet (the Effect gives −10);
- an unsupported count phrase;
- damage on Coil;
- AC instead of Reflex DC.

A changed count ("three commands") is read as 3.

## Coverage

**Census:** **653 enabled**, up from 652.
- The b231 diff changed only Animate Rope.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 759/759 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-148-live-results.json), case `cr1Batch148`, in the `pftest` world.
- **Cast:** 2 commands.
- **Bind:** a critical success against the foe's Reflex DC. The foe's Speed went from 25 to 5, the Effect carries an Escape end at DC 24, and 1 command was left.
- **Coil:** 0 left. A third command was refused ("no command left").
- **Sustain** on the caster's first combat turn gave 1 command, and Knot spent it.
- **Cleanup:** fixtures removed, and no combats left.
