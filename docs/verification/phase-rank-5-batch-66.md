# Rank 5 batch 66 — Belittling Boast

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Belittling Boast (5) | **The caster's choice** (a dialog, or the `boast` option): melee, ranged or spell attack rolls, or one skill. **One Intimidation check** (PF2e's, with `action:demoralize` and the spell's mental traits) against each enemy's Will DC within 30 feet: Frightened 1 on a success, 2 on a critical success. An enemy immune to one of the spell's traits is unaffected. **Each frightened enemy** takes a −1 circumstance penalty to the chosen statistic for 1 minute. **If any is frightened**, the caster gains +1 status to it for 1 minute. **At 8th rank** both are 2. |

## Rules

- **`src/compiler/boast.js`:** reads every sentence and the Heightened entry. `boastSelector` maps the choice: melee is `strike-attack-roll` with `item:melee`; ranged is the same with `item:ranged`; spell is `spell-attack-roll`; a skill is its own slug.
- **Runtime:** new kind `boast`; the card lists each enemy's result. Demoralize's language penalty and 10-minute immunity are a GM line on the card.

## Interpretation

- **QUESTION: the caster's "+1 status penalty".** The text says penalty, but the Heightened entry says "the bonus and penalty increase to 2", so it is read as a bonus.
- **One check for every enemy** ("Attempt an Intimidation check to Demoralize all enemies"), compared against each Will DC (natural 20 and 1 adjust the degree).
- **Enemies** are creatures of a different alliance from the caster.

## Tests

`test/rank-5-batch-66.test.js` is new. It covers the data and an unrecognised clause (not read).

A whole-corpus compile (b674 → b675) changed only Belittling Boast.

## Evidence

[Live evidence](phase-rank-5-batch-66-live-results.json), case `rank5Batch66`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Cast at 5th about melee attack rolls; a weak-willed enemy adjacent | Critical success: Frightened 2; −1 circumstance to `strike-attack-roll` with `item:melee` |
| A strong-willed enemy | Failure: untouched |
| An enemy 50 feet away; an ally | Untouched |
| The caster | +1 status for 1 minute |
| Cast at 8th about Athletics | −2 and +2 |

**Cleanup:** fixtures removed.
