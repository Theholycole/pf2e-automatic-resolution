# Rank 4 batch 107 — Sudden Swarm

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Sudden Swarm (4) | The familiar's Effect (sustained, 1 minute), at the cast rank (+1 to the resistances and weaknesses per rank): immune to precision damage, grappled, Prone and Restrained; weakness 4 to area and splash damage; resistance 4 to piercing and slashing; Large. Swarming Bites, once per turn, is the card's control: the item's basic Reflex save (3d6 +1d6 per rank, piercing by default; the GM may make it bludgeoning or slashing) for the targeted creatures in its space. Dropping to 0 HP and the Command are notes. |

## Rules

- **`src/compiler/familiar-swarm.js`:** reads the form, space, 0 HP and once-per-turn sentences, the Swarming Bites paragraph, the Command, and the heightening, which must match the item's interval. `familiarSwarmRules` builds the rules at a rank.
- **`compileSpell`:** compiles the bites as a basic save of the item's own damage entry.
- **Runtime:** the new kind `familiar-swarm`; `familiarSwarmBites` (once per combat turn) starts the bites plan on the targeted creatures.

## Interpretation

- **The bites' type is piercing by default.** The GM may change it.
- **0 HP is a note.** The familiar going to 1 HP instead, and the spell ending, are the GM's.
- **The creatures in its space are the targeted ones.**

## Tests

`test/rank-4-batch-107.test.js` is new. It covers the data, the bites plan's support, the rules at 6th, and different numbers (not read).

A whole-corpus compile (b646 → b647) changed only Sudden Swarm.

## Evidence

[Live evidence](phase-rank-4-batch-107-live-results.json), case `rank4Batch107`, in the `pftest` world, cast at 5th rank, in combat.

| Step | Result |
| --- | --- |
| The swarm form | Resistance 5 to piercing, weakness 5 to area, immune to Prone, Large, sustained |
| Swarming Bites at a foe | 4d6 piercing on a failure |
| Again that turn | Refused |

**Cleanup:** fixtures and combat removed.
