# Rank 3 batch 97 — Life Pact

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Life Pact (3) | Each target (2 to 6) gets the module's Effect for 10 minutes. Damage that would reduce one to 0 Hit Points first takes 3 Hit Points (+1 per rank) from each other member, or all it has if less. The struck creature gets their total just before the damage, so it stays up if that's enough. Every member's Effect then ends. |

## Rules

- **HP pact (`src/compiler/hp-pact.js`, compiled in `compileSpell`):** it reads the trigger, conscious and ending sentences and the heightened step. `pactAmount` gives the Hit Points at a cast rank.
- **Runtime:**
  - **New effect kind:** `hp-pact`, an Effect on each target flagged with the members and the amount.
  - **`hpPactTrigger`** runs on PF2e's damage update (`preUpdateActor` with `damageTaken`, not an undo). When the new Hit Points would be 0, it:
    - raises them to (before + gained, capped at max) − the Hit Point damage, where temporary Hit Points absorbed don't count;
    - takes the others' Hit Points;
    - ends every member's Effect;
    - posts a card.

## Interpretation

- **A member with fewer Hit Points loses only what it has.** It is left at 0 (PF2e adds no Dying for a direct Hit Point change).
- **The pact needs at least two targets.**

## Tests

`test/rank-3-batch-97.test.js` is new. It covers the data, `pactAmount` at 3rd and 6th, and a different trigger (not read).

A whole-corpus compile (b621 → b622) changed only Life Pact.

## Evidence

[Live evidence](phase-rank-3-batch-97-live-results.json), case `rank3Batch97`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 4th on three creatures | 4 HP each; three Effects |
| 8 damage to the one at 5 HP | The others go 20→16 and 2→0; it ends at 3 HP, not Dying; every Effect gone |
| Cast at 3rd, 20 damage to one at 2 HP | The other goes 30→27; the struck one is at 0 (not enough); the Effects gone |

**Cleanup:** fixtures removed.
