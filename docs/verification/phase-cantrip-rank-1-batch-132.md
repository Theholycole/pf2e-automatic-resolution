# Cantrip / rank 1 batch 132 — Effects applied by their stated forms

2026-09-28. The user asked to take cantrips and rank 1 toward 100%. These seven were on the Effect + note route. PF2e's Effect already covered the text; only *when and to whom it applies* wasn't read.

| Rule | Spells |
| --- | --- |
| A healing bonus on the target (data note: PF2e adds it to every healing spell) | Healer's Blessing (1) |
| The first-Strike toggle on the caster (data note) | Gravity Weapon (1) |
| A reaction or free action's named target | Loremaster's Etude (1), Phase Familiar (1) |
| PF2e's 1d4 formula badge on the caster | Cinder Gaze (1) |
| A counter badge at 1 on the caster (data note: raise it for each mote) | Entropic Wheel (cantrip) |
| “Each ally in the area gains …” | Call to Arms (1) |

**Kept strict (tests):** each form refuses a mismatch:
- an added AC bonus on the healing sentence;
- added fire damage on Gravity Weapon;
- 1d6 instead of the badge's 1d4;
- two motes instead of one.

**Proof limit found (unchanged):** the shared completeness proof doesn't catch an *extra bonus* sentence the Effect lacks. Gravity Weapon with “You also gain a +1 status bonus to AC.” added still passes. Blocking any leftover bonus or penalty would have dropped about 75 existing Effect spells, so it wasn't added (see `docs/module-runtime.md`).

## Coverage

**Census:** **619 enabled**, up from 612.
- The b215 diff changed these seven.
- Five others (Familiar's Call, Overload Connection, Tiny Wings, Sudden Swarm, Patron's Protector) lost only their `target-eligibility` gap (“your familiar”); none changed route.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 742/742 tests pass.

[Live evidence](phase-cantrip-rank-1-batch-132-live-results.json), case `cr1Batch132`, in the `pftest` world.
- **Call to Arms:** the ally 10 feet away got the Effect and 1 temporary HP. The ally 50 feet away and the caster got nothing.
- **Cinder Gaze:** the caster's Effect badge rolled 3.
- **Entropic Wheel:** the caster's badge was 1.
- **Gravity Weapon:** the caster got the Effect.
- **Healer's Blessing:** the target got the Effect; the caster didn't.
- **Loremaster's Etude:** the target got the Effect (RollTwice).
- **Phase Familiar:** the target got the Effect (resistance all-damage 5).
- **Cleanup:** fixtures removed.
