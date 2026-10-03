# Rank 3 batch 86 — Weapon Tide

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Weapon Tide (3) | Each of PF2e's variants is a basic Reflex save of the caster's damage type: bludgeoning, piercing or slashing, chosen on the card. **2 or 3 actions:** a 30-foot cone, 4d6. With 3 actions, the card offers to place difficult terrain for 1 minute (the GM selects the template's region). **Two rounds:** a 60-foot cone, 6d6, plus terrain that is difficult and hazardous for 1 minute. A creature moving into it or ending its turn there takes 2d6 of the chosen type, once a turn. Each +2 ranks adds 4d6 to the wave and 1d6 to the hazard. |

## Rules

- **Weapon wave (`src/compiler/weapon-wave.js`):**
  - It reads the preamble, both action paragraphs, the Two Rounds paragraph and the heightening.
  - The variant is told apart by its data (area and dice), as with Psychic Outburst.
  - The text is rewritten to a plain basic save of PF2e's item damage.
  - Post-hook: the damage-type choice; `areaTerrain` (with 3 actions, or the two rounds' hazard); a data note on the actions.
  - The hazard formula at the cast rank is `(2+floor((@item.rank-3)/2)*1)d6`.
- **Core:** `isWaveTerrain` checks:
  - the stated sentence;
  - the choice;
  - for the 3-action terrain: no hazard;
  - for the two rounds: enter and turn-end events, once a turn, the chosen type, and a formula of the cast rank only.
- **Runtime:**
  - The card says "Only if it was cast with 3 actions" and gives the hazard's type and timing.
  - Placing the terrain takes the caster's chosen type for the hazard.
  - The lingering region record can now take `hazardOncePerTurn`: one hit per creature per turn, whatever the event. The end of a turn counts toward the turn just ended.

## Interpretations

- The 3-action terrain is the GM's button; the card doesn't know how many actions were spent.
- The two rounds are PF2e's own variant, cast when the spell is finished on the next turn.

## Tests

`test/rank-3-batch-86.test.js` is new. It covers both variants, the choice, the terrain and the hazard, a tampered formula (rejected), a variant area that is neither (not read), and an initial heightening that PF2e's data doesn't have (not read).

A whole-corpus compile (b600 → b601) changed only Weapon Tide.

## Evidence

[Live evidence](phase-rank-3-batch-86-live-results.json), case `rank3Batch86`, in the `pftest` world.

| Step | Result |
| --- | --- |
| 3rd rank, slashing, a failure | 4d6 slashing (8 lost of 8 rolled) |
| The card's terrain offer | "Only if it was cast with 3 actions"; difficult terrain placed, no hazard |
| Two rounds at 5th, piercing (in combat), a failure | 10d6 piercing (41 lost of 41) |
| The terrain | Hazardous, piercing, `(2+floor((5-3)/2)*1)d6` (3d6) |
| The creature moves in on its turn | 9 damage |
| It ends that turn there | Nothing more (once a turn) |
| It ends its next turn there | 14 damage |

**Cleanup:** fixtures, regions and combat removed.
