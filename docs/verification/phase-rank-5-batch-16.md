# Rank 5 batch 16 — Glimmer of Charm

2026-10-02. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Glimmer of Charm (5) | A 20-foot aura on the caster, sustained. A creature ending its turn in the aura saves (Will). Each result's attitude change is a note Effect lasting the spell. On a failure, a second note Effect says the creature can't take hostile actions against the caster. Whatever the result, the creature is then temporarily immune for 24 hours. |

## Rules

- **Lingering degree trigger:** "… must attempt a Will saving throw with the following effects." is read like "… must attempt a Will save." (`lingering-area-compiler.js`).
- **Save immunity antecedent:** "Any/Each creature that … must attempt a X save(…)" counts as the sentence that has the creature save. This means "No matter the result, it's then temporarily immune for 24 hours." refers to that creature (`save-preamble.js`).
- **Immune creatures aren't exposed again:** a lingering area whose spell gives temporary immunity records the immunity key (`declaration.immunityKey`). A creature holding that spell's unexpired immunity Effect gets no new exposure (`ongoing-families.js` `heldBySpell`).
- **Interpretation:** logged in `pending-user-decisions.md`.

## Tests

`test/rank-5-batch-16.test.js` is new. It has a negative case: the immunity sentence isn't read when another sentence comes between it and the creature's save.

A whole-corpus compile (b439 → b440) changed only this spell.

## Evidence

[Live evidence](phase-rank-5-batch-16-live-results.json), case `rank5Batch16`, in the `pftest` world, with the caster sustaining each turn.
- A guest ended its turn in the aura. A `turn-end` exposure came up, and its card used Will. The guest failed and got:
  - Attitude (1 minute),
  - No hostile actions against the caster (1 minute),
  - Temporary immunity (24 hours).
- **Next round:** the guest ended its turn in the aura again and got no exposure. A bystander, not immune, got its second exposure.
- **Cleanup:** fixtures removed.
