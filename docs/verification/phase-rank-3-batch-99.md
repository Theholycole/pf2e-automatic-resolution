# Rank 3 batch 99 — Horde of Underlings

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Horde of Underlings (3) | The caster picks the damage type and the size. The module makes one actor and a token per underling (6, +2 per rank) in free squares near the caster: AC 5, 1 HP each, saves that fail. On the cast, each damages one adjacent enemy (1d4 of the type). The card's control, for the first Sustain each later round, moves each up to 20 feet toward the nearest enemy, then each damages an adjacent one. The caster's Effect (sustained, 1 minute) removes them all when it ends. Their kind, their place in the cone and their difficult terrain are notes. |

## Rules

- **Minion horde (`src/compiler/minion-horde.js`, compiled in `compileSpell`):** it reads all eight sentences and the heightened count. `hordeCount` gives the number at a cast rank.
- **Runtime:**
  - **New effect kind:** `minion-horde`. One actor with unlinked tokens, flagged as summoned. The caster's Effect carries `summon`, so `summonOnEnd` removes them, and `minionHorde`.
  - **`minionHordeAct`** (also on the module API):
    - **Movement:** each living underling moves to the free square within 20 feet (5-10 diagonals, inside the scene) nearest the nearest enemy.
    - **Damage:** each damages one adjacent enemy with PF2e's damage roll.
    - **Who is an enemy:** a token of the opposite disposition with Hit Points.

## Interpretation

- **The underlings are placed near the caster.** The text puts them in squares of the caster's choice within the cone; the note asks the caster to move them.
- **Movement is a straight search.** There's no pathfinding around walls.
- **Their difficult terrain is a note.**

## Tests

`test/rank-3-batch-99.test.js` is new. It covers the data, the count at 3rd and 5th, and differing damage (not read).

A whole-corpus compile (b623 → b624) changed only Horde of Underlings.

## Evidence

[Live evidence](phase-rank-3-batch-99-live-results.json), case `rank3Batch99`, in the `pftest` world, cast at 4th rank.

| Step | Result |
| --- | --- |
| The cast | 8 tokens (AC 5, 1 HP, Fortitude −50); the 3 beside the near enemy dealt 8 slashing to it |
| The near enemy down; the control | The underlings moved (columns 16–18 → up to 21); 3 reached the far enemy and dealt 4. The others went for nearer stray test tokens. |
| Ending the Effect | All tokens and the actor removed |

**Cleanup:** fixtures removed.
