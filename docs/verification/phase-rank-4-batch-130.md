# Rank 4 batch 130 — Phantasmal Protagonist

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Phantasmal Protagonist (4) | The card asks the theme (hero, ally or villain). **The protagonist** (user decision 2026-10-01: conjured creatures are tokens): a Medium token with Speed 25 feet, AC 22, saves, Perception and skills +12, and 90 HP. Each rank adds +3 to those modifiers and AC and +30 HP. It is owned and allied like the caster, and lasts while the caster Sustains (10 minutes); the caster's summon Effect removes it. **The thematic action** (the card's control, once a round; the target adjacent to it): **hero**, a melee spell attack with the caster's attack, (4+1 per rank)d6+6 mental, doubled on a critical hit; **ally**, (4+1 per rank)d4 temporary HP for 1 round; **villain**, a Will save: Off-Guard on a failure, Slowed 1 on a critical failure, until the end of the caster's next turn. Striding is moving its token. |

## Rules

- **`src/compiler/protagonist.js`:** reads the seven opening sentences, the three themes and the Heightened entry. `protagonistAt` gives the numbers at a rank.
- **`compileSpell`:** the hero's attack plan (the text's formula with the +6, `phaseFormula`) and the villain's save plan.
- **Runtime:**
  - **New kind `protagonist`:** the NPC with the stated AC, HP, saves, Perception, skills and Speed at the cast rank.
  - **`protagonistAct`:** once per combat round, the target adjacent to the protagonist.

## Interpretation

- **"Off-Guard (Slowed 1 on a critical failure)":** the critical failure gives Slowed 1 instead of Off-Guard.
- **The hero's Strike is the caster's spell attack**, rolled by the module's attack card against the target's AC.
- **"The first time each round that you Sustain"** is the control's once-a-round limit.

## Tests

`test/rank-4-batch-130.test.js` is new. It covers the numbers at 6th, the hero plan's support, statistic and formula, the villain plan and its critical failure, and a changed statistic sentence (not read).

A whole-corpus compile (b669 → b670) changed only Phantasmal Protagonist.

## Evidence

[Live evidence](phase-rank-4-batch-130-live-results.json), case `rank4Batch130`, in the `pftest` world, cast at 5th rank, in combat.

| Step | Result |
| --- | --- |
| Hero token | AC 25, Will +15, 120 HP |
| Its Strike hits an adjacent foe | 5d6 + 6 mental (29 taken) |
| A second action that round | Refused |
| Ending its Effect | The token and actor are removed |
| Ally theme | Its action grants an adjacent creature 12 temporary HP (5d4) |

**Cleanup:** fixtures and combat removed.
