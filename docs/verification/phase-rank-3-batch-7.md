# Rank 3 batch 7 — Shadow Projectile

2026-10-02.

| Spell | Now |
| --- | --- |
| Shadow Projectile (3, reaction) | The GM targets the creature the ally's ranged attack is aimed at, and it rolls a Will save against the spell DC. **Success:** Off-Guard against the triggering attack. **Failure:** that, and 3d8 mental damage. **Critical Failure:** that, with double damage. **Heightened (+2):** +1d8. "Against the triggering attack" means the Off-Guard Effect lasts until the next attack roll against that creature is posted (the triggering one), or the end of the current turn, whichever comes first. The 1-hour immunity to this spell applies on every result, as before. |

## Rules

- **"Against the triggering attack" (`compile-ability.js`):** before, any such phrase blocked the plan, because a plain condition would outlast the attack. Now, in a reaction, the condition the phrase follows gets a new lifetime: until the end of the current turn (`current-turn` anchor) or the `next-attack` event, whichever is first. "As failure, but double damage." keeps the failure's scoped condition. Outside a reaction it still blocks. No other spell had this phrase.
- **Save route:** `isNextAttackLifetime` (`basic-save-core.js`). The Effect is flagged `nextAttack` and named "(against the triggering attack)".
- **`main.js`:** a `createChatMessage` hook (active GM). An attack-roll or spell-attack-roll message whose `context.target.actor` holds such an Effect removes it.
- **The immunity to this spell (`save-preamble.js`):** "temporarily immune to shadow projectile" used to be read only when the name matched the item's. The corpus checks' detached copy renames the item, so that made routing depend on identity, and they failed.
  - It now also reads one plain single-spell name (1–4 words, no family or plural words) as the text naming itself. "all curses of death" and similar are still refused.
  - A first attempt instead renamed the text's self-references in the checks' copy. That changed narration in other spells ("a missed cue"), so it was reverted.
  - The corpus compile (b344 → b345) changed no plan.
- **Test updated:** `test/temporary-immunity-wording.test.js` asserted that this spell's scoped condition blocks the plan. It now asserts the new lifetime.

## Tests

970/970 pass. `test/rank-3-batch-7.test.js` is new. It checks:
- every affected row's lifetime;
- that it's modelled only for a reaction;
- that a renamed copy reads the immunity the same, and a family immunity is still refused.

A whole-corpus compile (b343 → b344) changed only Shadow Projectile.

## Coverage

**Census:** **1164 enabled** (milestone; 1160 non-ritual), up from 1163. Rank 3: 116 of 261.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions, on b345.

## Evidence

[Live evidence](phase-rank-3-batch-7-live-results.json), case `rank3Batch7`, in the `pftest` world.
- **Critical failure:** "3d8 mental", total 17, 34 lost (doubled). It was Off-Guard (AC 2 lower) in "Shadow Projectile: Off-Guard (against the triggering attack)", 1 round to turn end out of combat, and immune for an hour.
- **The triggering attack:** an attack-roll message targeting it was posted. This stands in for the ally's ranged Strike and carries the same flags the hook reads. Off-Guard went and its AC was restored.
- **Success (another creature):** no damage, Off-Guard, immune.
- **Cleanup:** fixtures removed.
