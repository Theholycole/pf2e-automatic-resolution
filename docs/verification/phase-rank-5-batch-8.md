# Rank 5 batch 8 — Rip the Spirit, Spiritual Torrent

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Rip the Spirit (5) | Each PF2e action variant is a basic Fortitude save: 1 action is 5d6 void to one living creature; 2 actions is 10d6 to one living creature; 3 actions hits the living creatures in a 30-foot emanation. **Failure / critical failure:** Drained 1. |
| Spiritual Torrent (5) | Basic Fortitude save for 10d6 vitality in a 60-foot line (2 actions) or a 60-foot cone (3 actions). An undead caster's damage is void instead (the card says "vitality → void"). |

## Rules

- **Joined riders (`basic-degree-rider.js`, `splitJoinedRiders`):** "…damage, …, and is also X if it (critically) fails its save." and "…damage …; on a failed save, they also fall Prone." are read as the damage sentence plus the rider sentence.
- **Gate (`semantic-gate.js`):** ", depending on its basic X save" is the save, not an extra rule. "living" is the Target's own word when the Target says "living creature(s)".
- **Action paragraphs (`action-paragraphs.js`):**
  - Two new restatements: "The spell targets one (living) creature in range, and the damage is NdM T damage instead of …" and "The spell targets all (living) creatures in a N-foot line/cone/… (or @Template)".
  - An area PF2e stores as a burst with `areaType: "emanation"` counts as an emanation. This also enables Kinetic Ram's 3-action variant; the spell was already resolved through its 1-action variant.
- **Targets (`target-predicate-compiler.js`):** "All living creatures" means living creatures.
- **Caster's energy (`energy-by-creature.js`):** "If you're a living creature, this spell deals vitality damage …" / "If you're an undead creature, … void damage …" is a `damageSwap` with `when: "caster-undead"`. The core accepts it only for one vitality entry; the runtime looks at the caster.

## Tests

1055 pass. `test/rank-5-batch-8.test.js` is new, with negative cases:
- a 2-action damage that isn't the variant's;
- a swap pair other than living/undead.

A whole-corpus compile (b393 → b394) changed Spiritual Torrent, Rip the Spirit's variants and Kinetic Ram's 3-action variant. Halt Death's target is now read too, but it is still unsupported for other reasons.

## Evidence

[Live evidence](phase-rank-5-batch-8-live-results.json), case `rank5Batch8`, in the `pftest` world.
- Rip the Spirit:
  - 2-action variant: a failure lost 39 and became Drained 1.
  - 3-action variant: the living creature was eligible and became Drained 1; the undead one was refused.
- Spiritual Torrent:
  - A living caster's torrent on an undead target dealt 40, with no swap.
  - An undead caster (ActorTraits undead) on a living target dealt 32, and the card says "vitality → void".
- **Cleanup:** fixtures removed.
