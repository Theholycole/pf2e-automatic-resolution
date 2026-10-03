# Rank 3 batch 51 — Malicious Shadow

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Malicious Shadow (3) | The shadow's Strike when the spell is cast and on each Sustain: a spell attack for 2d10 (+1d10 per 2 ranks) of the physical type the caster picks on the card, repeated from the card for 1 minute. Notes cover the multiple attack penalty, keeping the type, the vanishing shadow and the counteract. |

## Rules

- **Shadow Strike (`sustain-attack.js` `compileShadowStrike`):** it reads:
  - "When you Cast the Spell, and each time you Sustain it, the X Strikes the target.";
  - "The X's Strikes are melee spell attacks that deal NdM damage." (the item's untyped entry);
  - the damage-type choice sentence and the multiple-attack-penalty sentence;
  - what the shadow isn't (narration);
  - the vanishing and counteract sentences (notes);
  - "Heightened (+N) The Strike damage increases by …", against the item's step.

  The result is the sustain-attack family's repeated spell attack with the physical damage-type choice. The Sustain sentence is the repeat's source.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-3-batch-51.test.js` is new. Its negative case is damage other than the item's.

A whole-corpus compile (b466 → b467) changed only this spell.

## Evidence

[Live evidence](phase-rank-3-batch-51-live-results.json), case `rank3Batch51`, in the `pftest` world.

| Cast | Type picked | Result | Damage |
| --- | --- | --- | --- |
| 3rd | slashing | hit | 2d10 slashing = 2 |
| 3rd | piercing | critical hit | 2d10 piercing, doubled to 6 |
| 5th | bludgeoning | hit | 3d10 bludgeoning = 25 |

The card shows the repeat note.

**Cleanup:** fixtures removed.
