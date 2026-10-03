# Rank 3 batch 48 — Blood in the Water

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Blood in the Water (3) | One creature that can bleed (the GM confirms) takes 2d6 spirit damage (+2d6 per 2 ranks), Reflex save, written out as the basic save's rows. The card repeats it on each Sustain. Every result that deals damage adds a 1-round "Dragged down" note (water is difficult terrain for it). Notes cover the requirement, the automatic Sustain on slashing damage, and the recast. |

## Rules

- **Sustain hex (`sustain-bolt.js` `extractSustainHex`):** it reads:
  - the Requirements paragraph;
  - "When you Cast or Sustain this Spell, the target takes NdM T damage (basic X save).";
  - the damaged-target water terrain;
  - "The spectral … don't take up space, …" (narration);
  - the automatic Sustain and recast sentences;
  - "Heightened (+N) The damage dealt increases by …".

  The result is the four rows in the sustain-bolt family's repeatable form, with a `rowNote` on the success, failure and critical-failure rows and the rest as card notes.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-48.test.js` is new. Its negative case is the text without the requirement paragraph.

A whole-corpus compile (b460 → b461) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-48-live-results.json), case `rank3Batch48`, in the `pftest` world.
- The card asked "Can the creature bleed? …", and the GM confirmed.

| Cast | Result | Damage taken | Dragged down note |
| --- | --- | --- | --- |
| At cast (3rd) | failure | 2d6 spirit = 6 | 1 round |
| Sustain repeat | critical success | 0 | none |
| At 5th | failure | 4d6 = 16 | 1 round |

The card shows the notes.

**Cleanup:** fixtures removed.
