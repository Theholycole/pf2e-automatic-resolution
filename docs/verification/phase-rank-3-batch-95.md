# Rank 3 batch 95 — Whirling Scarves

2026-10-03. Part of the user's ranks 3–5 pass.

| Spell | Now |
| --- | --- |
| Whirling Scarves (3) | The caster's Effect grants Concealed for the minute. The card's snag control is used when a melee attack misses on the concealed flat check: target the attacker and pick its Strike. That Strike takes a −1 circumstance penalty (+1 per 2 ranks) until the end of the attacker's turn, or the end of its next turn if it wasn't its turn. The Effect notes that the concealment is only against attacks, and gives the ranged DC (6, +1 per 2 ranks). |

## Rules

- **Stated rules on one Effect (`ruleSet`, `src/compiler/rule-sets.js`):**
  - A new `scarves` reader adds the Concealed GrantItem (in memory, so it goes with the Effect) and a `snag` at the stated value, DC and heightened steps.
  - `snagAt` computes the penalty and the DC at a cast rank.
- **Runtime:**
  - The rule-set card adds a repeatable `rule-set-snag` button.
  - `ruleSetSnag` (also on the module API) gives the targeted attacker an Effect with the penalty, predicated on `item:id` of the chosen melee Strike.
  - The Effect is turn-bound: it ends with this turn if it's the attacker's turn, otherwise after the attacker's next turn.

## Interpretation

- **The flat check is a manual report.** PF2e 8.5 rolls no concealment flat check, so the snag is reported with the control after a melee miss on that check.
- **"Only against attacks" and the ranged DC are notes.** PF2e's Concealed condition can't be limited to attacks.

## Tests

`test/rank-3-batch-95.test.js` is new. It covers the data and `snagAt` at 5th rank, and a snag lasting another time (not read). The existing rule-set tests still pass.

A whole-corpus compile (b619 → b620) changed only Whirling Scarves.

## Evidence

[Live evidence](phase-rank-3-batch-95-live-results.json), case `rank3Batch95`, in the `pftest` world, cast at 5th rank, in combat.

| Step | Result |
| --- | --- |
| The cast | Concealed; penalty 2, ranged DC 7 in the notes; the button on the card |
| The snag, on the caster's turn | The foe's Claw rolls 1d20 + 8 (Jaws stays + 10); lasts until the end of its next turn |
| The foe's turn | The penalty still there |
| After the foe's turn | Gone |
| The spell's Effect deleted | Concealed gone |

**Cleanup:** fixtures and combat removed.
