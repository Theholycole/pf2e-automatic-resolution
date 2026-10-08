# Rank 7 batch 16 — group 3, part 1 (lingering areas)

2026-10-05. The first three spells of feature group 3 (lingering areas with rules of their own).

| Spell | Now |
| --- | --- |
| Infinitesimal Collapse Field | A sustained 30-foot emanation on the caster. Each enemy inside, or entering, gets a save card once for the casting. Its row's Effect is held while it's inside: Encumbered (success); Encumbered and Slowed 1 (failure); both plus a "can't take reactions" note (critical failure). Leaving removes it; coming back restores it without a new save. Allies aren't asked. |
| Repulsion | An emanation of the radius the caster picks (5 to 40 feet). Each creature inside, or entering, saves once for the casting. The success and failure rows (difficult terrain moving closer; can't move closer) are notes on its Effect while inside, with the "only when it moves toward you of its own accord" rule. |
| Indolent Haze | A lingering 20-foot burst. Creatures inside when cast, and creatures ending their turn inside, save. Success or failure gives Prone, or Unconscious instead for a creature already prone. Failure adds a "can't Stand on its next turn, can Crawl" note. Critical failure gives Prone and Unconscious. An unconscious creature at an exposure takes 6d4 spirit damage (+2d4 a rank) and stays unconscious. Dismissible. |

New runtime:

- **Lantern auras with degree rows:** per-degree Effects (conditions and notes), enemies-only, no light, sustained, and a radius chosen when cast.
- **`insteadIfHeld` on a row's condition:** another condition for a creature that already has it.
- **`sleeperDamage` on a lingering area:** damage to unconscious creatures at the stated exposures, at the cast rank.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-7-batch-16.test.js` is new. A whole-corpus compile (b773 → b774) changed only these three spells.

## Evidence

[Live evidence](phase-rank-7-batch-16-live-results.json), case `rank7Batch16`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Collapse Field: an enemy and an ally inside | Only the enemy is asked; it critically fails: Encumbered, Slowed 1, the reactions note |
| It leaves, comes back; the spell ends | Gone; back with no new card; gone |
| Repulsion at 10 feet: creatures at 10 and 15 feet | Only the one at 10 feet is asked; its note is "can't move closer" |
| Indolent Haze: standing, already prone, failing, unconscious | Prone; Unconscious; Prone and the note; 15 spirit damage, still unconscious |
| The unconscious creature's turn ends inside | Exposed at turn end: 18 more spirit damage, still unconscious |
