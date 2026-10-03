# Rank 4 batch 116 — Community Restoration

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Community Restoration (4) | The reaction's card asks the triggering spell's rank, and how to divide the allies' share among the targeted allies it affected. The caster gains 2 temporary Hit Points per rank. The allies get the same number in all, divided as chosen; a total above that is refused. Each is an Effect with PF2e's TempHP for 1 minute. |

## Rules

- **`src/compiler/shared-temp-hp.js`:** reads the trigger, the gain and the lasting sentences.
- **Runtime:** the new kind `shared-temp-hp`; `triggeringRank` and `shares` options skip the prompt.
- **Older test updated:** `test/duration-bound-effect.test.js` listed this spell, and Bottle the Storm in batch 115, as blocked. Both now assert their new kinds.

## Interpretation

- **The triggering spell's qualifying conditions are the caster's to confirm by casting.** These are: a wizard slot, willing allies, and no damage to them.
- **PF2e's own Effect (its rank ChoiceSet) isn't used.** The module's Effects carry the stated numbers.

## Tests

`test/rank-4-batch-116.test.js` is new. It covers the data and a different trigger (not read).

A whole-corpus compile (b655 → b656) changed only Community Restoration.

## Evidence

[Live evidence](phase-rank-4-batch-116-live-results.json), case `rank4Batch116`, in the `pftest` world, after a 3rd-rank triggering spell.

| Step | Result |
| --- | --- |
| Dividing 7 among the allies | Refused (at most 6) |
| Dividing 4 and 2 | The caster has 6 temporary HP and the allies 4 and 2, for 1 minute |

**Cleanup:** fixtures removed.
