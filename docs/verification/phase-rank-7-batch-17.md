# Rank 7 batch 17 — group 3, part 4

2026-10-05. Two more spells of feature group 3.

| Spell | Now |
| --- | --- |
| Unbreaking Wave Barrier | A sustained 5-foot emanation made as a region that follows the caster's token, plus PF2e's +1 status AC Effect on the caster. Creatures inside when cast, as each round starts, or on entering save (once a round). Success: the barrier is difficult terrain for that creature only. Failure: also pushed 10 feet away from the caster. Critical failure: pushed 20 feet and Prone. The pushes are GM reminders with the collision note (2d6 bludgeoning per extra 5 feet). After a Sustain, the caster can expand the radius by 5 feet (the region keeps following). |
| Shadow Raid | Enemies' basic save, each using its better save (Reflex or Will), against the text's 6d8 (8d8 at 9th) of the type the caster picks (bludgeoning, piercing or slashing). After Finalize, the card places the shadows for 1 minute: each enemy ending its turn there takes 3d8 (4d8 at 9th) of that type, no save. The GM's disbelief control (Perception against the spell DC) halves it for that creature. Concealment is a GM note. |

New runtime:

- **Lingering areas on the caster:** a region following the caster's token, with row terrain and the optional expansion.
- **Sustained caster benefits:** a sustained spell's claim with no duration of its own is proven against a sustained Effect.
- **Shadows' area (`isShadowTerrain`):** no terrain, an enemies-only hazard of the chosen type, and disbelief that halves it.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-7-batch-17.test.js` is new. A whole-corpus compile (b776 → b777) changed only these two spells.

## Evidence

[Live evidence](phase-rank-7-batch-17-live-results.json), case `rank7Batch17`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Unbreaking Wave Barrier cast in combat | PF2e's +1 AC Effect on the caster; a 150-pixel region (5 feet + half the token) on the caster |
| A creature inside fails | The "pushed 10 feet away from the caster" reminder with the collision note; the barrier is difficult terrain (2) for it only |
| The caster's next turn: Sustain, then expand; the caster moves | Radius 250 (follow radius 250, area 10 feet); the region moves with the token |
| The spell ends | The region and the AC Effect are gone |
| Shadow Raid with piercing: an enemy fails | 28 piercing |
| The shadows placed; a sharp-eyed enemy disbelieves; turns end inside | No terrain; disbelieved; 15 piercing to the first, 6 (halved, noted) to the doubter |
