# Rank 5 batch 68 — Cloak of Colors

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Cloak of Colors (5) | **The target's Effect** for 1 minute. **The adjacent creatures** (not the wearer) hold Dazzled while adjacent, through Ongoing's target aura. **The card's control** "A creature hit X with a melee attack (target it)" posts that creature's Will save (incapacitation): a failure is Blinded for 1 round; a critical failure, Stunned for 1 round. **The creature** is then temporarily immune until the end of its turn. |

## Rules

- **`src/compiler/flash-cloak.js`:** reads the four sentences and the result rows.
- **`compile-ability`:** the attacker's save is a compiled plan of the stated rows, plus the incapacitation trait.
- **Immunity:** `temporaryImmunity` is 0 rounds to the end of the turn (PF2e's "until the end of its turn"). `basic-save-core` now accepts that duration when backed by the sentence the compiler read (`turnImmunity`).
- **`startTargetAura`:** takes `includeTargets` (false: the wearer isn't in its own aura).
- **Runtime:** new kind `flash-cloak`; `flashCloakAttacker` (API and card button).

## Interpretation

- **"Creatures"** means every creature adjacent, the caster's allies included; the wearer is excluded.
- **The immunity starts after the save**, whatever its result.
- **A creature that can't see** isn't exempted automatically (the GM's call, as with any visual effect).

## Tests

`test/rank-5-batch-68.test.js` is new. It covers the data, the attacker plan (supported), its immunity, and an unrecognised clause (not read).

A whole-corpus compile (b676 → b677) changed only Cloak of Colors.

## Evidence

[Live evidence](phase-rank-5-batch-68-live-results.json), case `rank5Batch68`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast on a creature | Its Effect for 1 minute |
| A creature adjacent / one 30 feet away / the wearer | Dazzled / not / not |
| The adjacent creature moves away | No longer Dazzled |
| A creature that hit the wearer fails its Will save | Blinded; immunity 0 rounds to the end of its turn |
| A second flash on it | Refused (immune) |

**Cleanup:** fixtures and the record removed.
