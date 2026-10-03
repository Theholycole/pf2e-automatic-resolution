# Rank 3 batch 21 — Firework Blast, Howling Blizzard

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Firework Blast (3) | Basic Reflex save against 4d6 fire. A failure or critical failure rolls a second Fortitude save with the spell's table: failure Blinded and Deafened 1 round; critical failure Blinded 1 round, Dazzled and Deafened 1 minute. On the critical failure's row that second save takes −2 circumstance. |
| Howling Blizzard (5) | Basic Reflex save against 10d6 cold over the cast's area: 2 actions a 60-foot cone, 3 actions (PF2e's variant) a 30-foot burst within 500 feet. The area stays difficult terrain until the start of the caster's next turn. |

## Rules

- **Second-save table (`basic-degree-rider.js`, `compile-ability.js`):**
  - The text "The X deal NdN T damage." / "Creatures that fail their saves must attempt an additional @Check[x] save." / "Creatures that critically fail their saves take a −N type penalty to this X save." plus the table (Success unaffected; timed Blinded, Deafened and Dazzled) becomes immediate secondary saves on the failure and critical failure rows. The −N is the critical failure's `check.modifier`.
  - Core accepts that evidence and validates the modifier.
  - The runtime adds it to the secondary roll as a PF2e modifier.
- **Lingering area (`lingering-area-compiler.js`):**
  - "X fill the area until the start of your next turn, making the area difficult terrain." is terrain until the caster's next turn.
  - Cones are allowed only with that sentence.
  - "If you Cast this Spell with 2 actions, it has an area of …; if you Cast this Spell with 3 actions, it has a range of … and an area of …" is checked against the item's (or variant's) action count and area.
  - "Each creature in the area takes NdN T damage with a basic X save." is the cast damage.
  - `LINGER_DEBUG=1` prints an unread sentence.
- **Tests updated:**
  - `test/compiler.test.js` asserted Firework Blast's table wasn't attached to the primary rows; it still asserts that, and now also that it's on the follow-up.
  - `test/rank-2-batch-1.test.js` asserted Firework Blast stays blocked with no save adjustment; it still has none, and now asserts the second save's −2.

## Tests

1022 + 2 = 1024 pass. `test/rank-3-batch-21.test.js` is new, with negative cases:
- an extra Stunned in a row;
- a variant area that isn't the stated one.

A whole-corpus compile (b374 → b375) changed only these two.

## Evidence

[Live evidence](phase-rank-3-batch-21-live-results.json), case `rank3Batch21`, in the `pftest` world.
- **Firework Blast:**
  - The failure lost 8 (basic) and its second save's failure gave Blinded and Deafened.
  - The critical failure lost 16 (double) and its second save was 2 lower than the failure's. It gave Blinded (1 round), Deafened (1 minute) and Dazzled (1 minute).
  - PF2e shows that Dazzled as inactive, because Blinded overrides it.
- **Howling Blizzard:** the 2-action plan is a 60-foot cone and the 3-action variant (`loadVariant`) a 30-foot burst. Started on a region, the region got difficult terrain, the cast exposure was made, the record ends at the caster's turn start, and ending it removed the region.
- **Run note:** the first run checked `hasCondition('dazzled')`, which is false while Blinded; the case now checks Dazzled's timer.
- **Cleanup:** fixtures removed.
