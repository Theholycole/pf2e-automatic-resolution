# Rank 4 batch 28 — Rust Cloud

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rust Cloud (4) | A placed 20-foot burst. Creatures inside are Concealed, and those outside are concealed to them. A creature starting its turn inside makes a basic Fortitude save against 5d10 slashing (+1d10 per 2 ranks). When a metal creature takes that damage, it rusts: (floor(rank/2)−1)d4 persistent slashing. The cloud also grows 5 feet, up to a 40-foot burst. Dismissable. |

## Rules

- **Cloud damage (`lingering-area-compiler.js`):** "The cloud/fog/mist/storm deals NdM type damage to any creature that …" is read like "You deal …". "You can Dismiss the cloud." is read too.
- **Trait rust (`traitRust`):** "Metal that rusts off of a creature adds to the cloud." and "When a <trait> creature takes damage from the cloud, the cloud's area increases by N feet (to a maximum of a M-foot burst), and the creature starts to rust, taking @Damage[(…)d4[persistent,type]] damage." are read. The formula may read only the rank. The validator checks the shape on a placed burst.
- **How it runs (`ongoing-families.js` `finalizeSave`):** after the area's save, each creature with the trait that took damage gets the persistent damage at the cast rank, through PF2e's damage application. The region then grows, capped at the maximum, and the chat says so.
- **An older test:** `test/lingering-area.test.js` listed Rust Cloud among "areas with extra rules stay blocked". It's taken out, with a comment.

## Tests

1098 pass. `test/rank-4-batch-28.test.js` is new, with a negative case: a rider of another shape isn't read.

A whole-corpus compile (b428 → b429) changed only this spell.

## Evidence

[Live evidence](phase-rank-4-batch-28-live-results.json), case `rank4Batch28`, in the `pftest` world.
- Both creatures inside are Concealed.
- The metal creature's failed turn-start save: 5d10 slashing, then `1d4 slashing` persistent, and the cloud grew to 25 feet (region and record).
- The other creature's failed save: 5d10 slashing with no rust, and the cloud stayed at 25 feet.
- **Cleanup:** fixtures removed.
