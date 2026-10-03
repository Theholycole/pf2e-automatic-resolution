# Rank 5 batch 23 — Chthonian Wrath

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Chthonian Wrath (5) | A 60-foot cone, basic Reflex save. The item's two untyped 4d6 entries (+1d6 each per rank) are typed by the realm the caster rolls on the 1d4 table and picks on the card. The realms are Skies (bludgeoning, electricity), Depths (acid, slashing), Frozen (bludgeoning, cold) and Volcanic (fire, piercing). |

## Rules

- **Realm table (`realm-table.js` `rewriteRealmTable`):** it reads:
  - the "based on the result of rolling on the table below" sentence;
  - "You deal NdM damage of each of the corresponding damage types to each creature in the cone (…)", which must be the item's two equal untyped entries;
  - the [[/r 1D4]] table's four rows, each naming two damage types;
  - the Heightened step, which must match the item's for both entries.

  The result is the basic save with `casterChoice.kind: "damage-pair"` (realm → [type, type]).
- **Validation:** `executableCasterChoice` accepts a basic save with two untyped entries and valid pairs; the basic route accepts that choice kind.
- **Runtime:** the two untyped instances are retyped by the chosen pair. If PF2e merged them into one "{NdM}" roll, it is split evenly.
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-23.test.js` is new. Its negative case is a row naming something other than a damage type.

A whole-corpus compile (b470 → b471) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-23-live-results.json), case `rank5Batch23`, in the `pftest` world, cast at 6th rank.
- The card showed the realm choice, and the caster picked Volcanic.
- The damage was 5d6 fire + 5d6 piercing = 30.
- The creature that failed lost 30; the one that succeeded lost 15.
- **Cleanup:** fixtures removed.
