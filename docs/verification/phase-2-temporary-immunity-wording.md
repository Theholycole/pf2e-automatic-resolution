# Temporary immunity wordings — verification note

2026-09-26. This is a rule-family change with **no census change**: 393 enabled before and after.

## Why

The request was the next largest group in Phases 2–4. The largest groups are long tails:
- Phase 3 Sustain (146), Timed-other (117) and Ending (104);
- Phase 2 Native condition (115).

**Sustain, by mechanism:** moving areas (16 spells), repeat damage or saves on Sustain (about 16), commanding a creation (8). Each moving-area or repeat spell also has its own extra rule, such as a path exposure, an optional freeze or a changed rider.

**The most repeated blocker left:** 23 spells have a temporary-immunity sentence the preamble reader didn't accept. So this change widens that reading as a family.

## Change

**`save-preamble.js`** reads these wordings:
- “Regardless of the result/outcome/effects (of its save)”, “No matter the result”, “After attempting its save” or “After the effects are resolved”, followed by “the target/creature is/becomes (then) temporarily immune (to <this spell>) for N minutes/hours/days”;
- “The target must attempt a <save> and is then temporarily immune for …”.

**A pronoun** (“it's”) needs the preceding sentence to have the target itself save with the item's statistic.

**Refused:**
- immunity to another spell or a group of spells;
- weeks.

**New guard:** an outcome condition scoped to “against the triggering attack/Strike” now blocks the plan (`condition-scope:triggering-attack`). The degree compiler had read it as a plain condition with no duration. No enabled spell used that wording; Shadow Projectile would have been enabled with it.

## Result

**Census:** b61 against b60 changed 12 plans, and none became or stopped being executable. Their immunity is now read, and each still has other blockers:
- **Pact Broker:** residual prose, and a modifier.
- **Forced Quiet:** duration by degree.
- **Aberrant Whispers:** a modifier, text after the immunity, and targets.
- **Shadow Projectile:** off-guard against the triggering attack.
- **Shift Blame:** memory alteration.
- **Darkened Eyes:** a conditional effect.
- **Glacial Heart:** secondary saves.
- **Over the Coals:** a pact condition.
- **Pack Breaker:** attitude.
- **Manifold Lives:** condition scope.
- **Warp Mind:** counteract.
- **Overwhelming Presence:** tribute.

**Checks:** the speed check passed, and the escape and six rule-family checks report 0 regressions.

**Automated:** 430/430 tests pass. `test/temporary-immunity-wording.test.js` covers:
- the new wordings;
- refusals: another spell's name, a group of spells, a wrong antecedent, a wrong save statistic, and weeks;
- Shadow Projectile's new guard.

The existing guard test (`test/touch-of-obedience-family.test.js`) still passes.

**Live:** no new route was enabled, so there was no `pftest` case. The immunity Effect's runtime is unchanged; only the days unit is newly allowed.
