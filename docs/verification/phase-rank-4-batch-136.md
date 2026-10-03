# Rank 4 batch 136 — stances with their own Strikes

2026-10-03. Part of the user's ranks 3–5 pass. These two monk focus stances were blocked because PF2e's stance Effects live in its feat-effects pack, which isn't in the verified fixtures.

**New family `stance-strike`.** The caster's stance Effect is generated from the text, until the caster leaves the stance (the same rule as generated battle forms):

- the Strike, as PF2e's Strike rule (name, damage, group, traits, a ranged Strike's maximum range);
- the stance's bonuses (a toggle where they apply only against ranged attacks);
- a Strike's ignored concealment and cover, as a note on its attack.

Entering a stance ends the caster's other stance Effects.

| Spell | Now |
| --- | --- |
| Clinging Shadows Stance (4) | **Shadow Grasp:** 1d4 void; brawling; agile, grapple, reach, unarmed. **Bonuses:** +2 circumstance to Athletics for Grapple, and +2 to the Athletics DC (to Escape from you, which PF2e's own Effect lacks). |
| Wild Winds Stance (4) | **Wind Crash:** 1d6 bludgeoning, ranged within 30 feet; brawling; agile, nonlethal, propulsive, unarmed; the note "ignores concealment and all cover". **AC:** +2 circumstance behind the "against a ranged attack" toggle. |

## Rules

- **`src/compiler/stance-strike.js`:** every sentence read; an unknown Strike trait is not read.
- **Runtime:** new kind `stance-strike` (`#executeStanceStrike`).

## Tests

`test/rank-4-batch-136.test.js` is new. It covers both stances' rules and an unknown trait (not read).

A whole-corpus compile (b710 → b711) changed only these two spells.

## Evidence

[Live evidence](phase-rank-4-batch-136-live-results.json), case `rank4Batch136`, in the `pftest` world, on a level 7 character.

| Step | Result |
| --- | --- |
| Clinging Shadows Stance | Shadow Grasp in the character's Strikes (1d4 void, the four traits, brawling); Athletics DC +2; the Grapple bonus predicated on Grapple |
| Wild Winds Stance | Clinging Shadows ended; Wind Crash a ranged Strike (maximum 30 feet, 1d6 bludgeoning, the four traits) with the note |
| The toggle on | AC +2 |

**Cleanup:** fixtures removed.
