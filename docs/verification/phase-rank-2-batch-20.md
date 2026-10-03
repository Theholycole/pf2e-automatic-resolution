# Rank 2 batch 20 — a condition gated on the GM's answer; a creature ability as a note

2026-09-30.

| Spell | Now |
| --- | --- |
| Fear the Sun (2) | Success: Dazzled 1 round. Failure: Dazzled 1 minute. Critical failure: a "Light Blindness" note for 1 minute (with the ability's link), and Blinded until the end of its next turn only if the GM answers yes to "Is it already exposed to bright light?". Temporary immunity as before. Heightened (6th): up to 10 targets (the save route doesn't cap targets). |

## Rules

- **A condition gated on a situation:** "If the creature is already exposed to bright light, it immediately becomes Blinded until the end of its next turn, as it …" makes that condition a `gm-question` gate.
  - Once the target's result is in, the card asks "Is it already exposed to bright light? If so, it's Blinded." with Yes / No buttons (`gate-yes` / `gate-no` corrections).
  - Finalize waits until every such question is answered. A "no" leaves the condition out ("not applied: the GM answered no").
  - The core accepts only a gate whose source starts "If the creature / the target / it is …" and has no other keys.
- **A creature ability:** "The creature gains Light Blindness for 1 minute." (a bestiary-ability link, which PF2e has no condition for) is a note for that time, carrying the link.
- **Scoped durations:** a row whose condition durations are all stated, with its note's duration, counts as scoped (the temporary-immunity check).

## Tests

830/830 pass. `test/rank-2-batch-20.test.js` is new. It checks:
- the rows, the gate's question and the note;
- `gmQuestionGate` only for the critical-failure target;
- the refusals: a forged gate source, a gate with an extra key, and a differently worded sentence (not read as a gate).

`test/temporary-immunity-family.test.js` now expects Fear the Sun to be executable.

A whole-corpus compile (b273 → b274) changed only Fear the Sun.

## Coverage

**Census:** **1054 enabled**, up from 1053. Rank 2: 142 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-20-live-results.json), case `rank2Batch20`, in the `pftest` world. The cast was heightened to 6th, with three targets.
- **The card** showed the bright-light question; Finalize was refused before it was answered.
- **Failure:** Dazzled, no Light Blindness.
- **Critical failure, answered yes:** Blinded and the Light Blindness note.
- **Critical failure, answered no:** the Light Blindness note, no Blinded.
- **All three** got the temporary immunity.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
