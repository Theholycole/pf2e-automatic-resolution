# Rank 7 batch 9 — Visions of Danger

2026-10-03. Ranks 6–10 pass, continued.

| Spell | Now |
| --- | --- |
| Visions of Danger | A lingering 30-foot burst for 1 minute: 8d8 mental damage (basic Will, heightened) to each creature inside when it's created, entering it, or starting its turn inside. Disbelief is the GM's control (your 2026-10-01 ruling): it rolls the targeted creature's Perception against the spell DC; a success gives it an exemption Effect for the rest of the spell, and the area skips it from then on. The control's label lists when a creature may try (a critical success on its save, Interacting with the monsters, or Seeking them). |

Runtime: the lingering family's new `area-disbelieve` action and control; the exemption reuses the area's immunity key.

## Tests

`test/rank-7-batch-9.test.js` is new. `test/lingering-area.test.js` no longer lists Visions of Danger among the areas that stay blocked. A whole-corpus compile (b746 → b747) changed only this spell.

## Evidence

[Live evidence](phase-rank-7-batch-9-live-results.json), case `rank7Batch9`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Two creatures inside when cast fail their saves | 40 and 24 mental |
| The GM's Disbelieve control on both (Perception +60 / −30) | Disbelieved / fooled |
| Their turns start inside | Only the fooled creature is exposed again |

**Cleanup:** fixtures removed.
