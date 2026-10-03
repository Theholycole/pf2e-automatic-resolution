# Rank 2 batch 9 — a variant's text over its data; a save after the damage

2026-09-30.

| Spell | Now |
| --- | --- |
| Disorienting Flash (2) | All three action counts are executable (before, only 2 actions was). 1 action: 1d10 sonic, a 5-foot square (PF2e's variant says a 5-foot burst; a data note). 2 actions: 2d10, a 10-foot burst. 3 actions: the text's 2d10, not PF2e's 1d10, in a 20-foot burst. Failure rows are Dazzled (and Deafened at 3 actions) until the end of the caster's next turn. |
| Inner Radiance Torrent (2) | The 2- and 3-action versions: 4d4 force in a 60- / 120-foot line, basic Reflex save, and Blinded for 1 round on a critical failure. The card reminds the GM that it counteracts magical darkness along the line. The 2-round version (its shining state) isn't read. |

## Rules

- **A variant's paragraph over PF2e's data (user decision: the text):** when a variant's own paragraph states other damage or another area than PF2e's variant data, the text's are used.
  - The damage must be the variant's one entry of the same type.
  - The card rolls PF2e's damage from the text's base formula. The runtime applies it to the spell before PF2e loads the variant, so heightening still applies.
  - A data note names the difference.
- **A save after the damage:** a bare "Creatures in the area must attempt a basic Reflex save." right after the only damage sentence is that damage's save.

**Changed expectation:** `test/rank-1-batch-2.test.js` had asserted that Disorienting Flash's 3-action variant stays a gap because its text disagrees with its data. That test predates the text-over-data decision. It now asserts the text's 2d10.

## Tests

801/801 pass. `test/rank-2-batch-9.test.js` is new. It checks:
- every Disorienting Flash variant, the override and its refusals (another entry; a base card that isn't a fixed-action variant);
- Inner Radiance Torrent's variants;
- that the paired save sentence is accepted only in its exact position and form.

A whole-corpus compile (b262 → b263) changed only these variants: Disorienting Flash 1 and 3, and Inner Radiance Torrent 2 and 3.

## Coverage

**Census:** **808 enabled**, up from 807. Rank 2: 73 of 245.
- The census counts a spell once any variant is executable. Disorienting Flash was already counted through its 2-action variant; Inner Radiance Torrent is new.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-9-live-results.json), case `rank2Batch9`, in the `pftest` world. Each cast was a PF2e variant (`loadVariant`), with the target's result set.
- **Disorienting Flash:**
  - 1 action: rolled 1d10 sonic, and the target lost exactly the roll. Dazzled only. The card shows the square/burst data note.
  - 3 actions: rolled 2d10 sonic (PF2e's variant would roll 1d10). Dazzled and Deafened. The card shows "the text's 2d10 is rolled".
  - 3 actions heightened to rank 3: rolled 3d10.
- **Inner Radiance Torrent, 2 actions:** a critical failure rolled 4d4 force, lost double, and was Blinded. The card has the darkness counteract reminder.
- **Cleanup:** fixtures removed; no combats or PFTEST regions left.
