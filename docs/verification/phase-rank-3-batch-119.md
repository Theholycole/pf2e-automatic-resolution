# Rank 3 batch 119 — rituals from their confirmed result

2026-10-03. Part of the user's ranks 3–5 pass: the first rituals of ranks 3 to 5.

**New family `ritual-degrees`.** As for every ritual, the GM gives the confirmed result (and the secondary casters). The module applies that result's actions to the primary caster ("you"), all casters, the secondary casters, or the creatures the GM targets:

- conditions for their stated time, or locked at their value by the module's `ritualLock` hook;
- the outcome recorded on the target as an Effect;
- damage with each victim's basic save;
- a rolled time.

Every sentence is read. A sentence without rule words is a GM note; a rule sentence needs its own reader. "As critical success, but …" borrows that result's actions. A ritual that would be notes only stays a note-only ritual, apart (the user's decision).

| Ritual | Now |
| --- | --- |
| Rest Eternal (4) | **Critical success:** the dead target's record (an effect needs a counteract rank of at least the cast rank + 2). **Success:** + 1. **Critical failure:** all casters Doomed 1 for 1 week. |
| Awaken Portal (3) | **Failure:** the primary caster Stupefied 1 for 24 hours. **Critical failure:** the same, and the hostile creature a GM line. **Success:** the 1d6 days rolled. The portal's state is the GM's. |
| Labyrinthine Prison (3) | **Success:** the target's "trapped" record. **Critical success:** that and Stupefied 2 while within. **Critical failure:** all casters Stupefied 4 for 1 week. The target's maximum level at the cast rank is checked (8 at 3rd, +2 per rank). |
| Reinforced Rations (4) | **Critical failure:** each living creature targeted is Sickened 2, locked for 24 hours; an undead one is untouched. |
| Drain Planar Connection (5) | **Failure:** the secondary casters take 4d12+26 force (basic Reflex DC 26). **Critical failure:** the same, without the severing. The severing's span is a GM line. |

## Rules

- **`src/compiler/ritual-degrees.js`:** the readers, the "As …" borrowing (a record of the same name replaces the borrowed one) and the Heightened entries' maximum levels.
- **Runtime:** new kind `ritual-degrees`; it runs after the existing `ritual-outcome`, so the rank 2 rituals keep theirs.

## Interpretation

- **The resisting spirit or target's save** (Rest Eternal, Labyrinthine Prison) is part of the GM's confirmed result.

## Tests

`test/rank-3-batch-119.test.js` is new. It covers each ritual's actions and an unrecognised rule sentence (not read).

A whole-corpus compile (b703 → b704) changed only these five rituals.

## Evidence

[Live evidence](phase-rank-3-batch-119-live-results.json), case `rank3Batch119`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Rest Eternal, critical failure | Both casters Doomed 1 (168 hours) |
| Rest Eternal, critical success on a corpse | Its record: counteract rank at least 6 (at 4th) |
| Awaken Portal, failure | The primary caster Stupefied 1; the helper not |
| Awaken Portal, success | 1d6 days rolled (2) |
| Labyrinthine Prison, critical success on a level 8 creature | Trapped, Stupefied 2 |
| Labyrinthine Prison on a level 9 creature at 3rd | Refused (at most 8) |
| Reinforced Rations, critical failure | The living creature Sickened 2, still 2 after trying to reduce it; the undead one untouched |
| Drain Planar Connection, failure | The secondary caster (Reflex −40) lost 53; the primary caster nothing. **Corrected in [rank 3 batch 120](phase-rank-3-batch-120.md):** the critical failure's double damage was not applied. On the rerun the helper lost 130 (2 × 65). |

**Cleanup:** fixtures removed.
