# Rank 2 batch 5 — target lines with a stated limit

2026-09-30.

**The rule:** a spell's target line with a limit is checked against PF2e's data where it has some, and asked of the GM where it doesn't. Before, such a target line blocked the whole spell.

| Target line | Check |
| --- | --- |
| "1 Tiny/Small/Medium/Large/Huge or smaller creature" | PF2e's size |
| "1 corporeal creature" | Not incorporeal (a trait that must be absent) |
| "1 living humanoid" | Living, with the humanoid trait |
| "1 living or undead creature" | A creature that isn't a construct (new check, `living-or-undead`) |
| "1 creature other than you" | Not the caster (new check, `not-caster`) |
| "1 creature taking bleed damage" | PF2e's persistent-damage condition of that type (new check, `persistent-damage`) |
| "each foe in the area" | An enemy of the caster (PF2e alliances) |
| "1 object held by 1 creature and the creature holding it", "1 creature in line of sight" | The creature the caster targets |
| Standing on the ground, flying, can bleed, has a disease, a true name or name the caster knows, off its home plane, made of or holding metal | A GM question for each target on the save card |

**Newly executable:**
- Lock Item (2): its effect before the table is a note for each row's duration.
- Aberrant Whispers (3): foes only; Stupefied 2 or Confused.

**Target line no longer the blocker (other rules still to do):** Dimensional Drop, Heat Metal, Horrifying Blood Loss, Imprinting Hand and Worm's Repast (2); Blood in the Water, Earthbind and Hedge Prison (3); Bestial Curse, Compel True Name, Debilitating Dichotomy, Foul Miasma, Mutilate, Nightmare and Purifying Veil (4); Banishment and Grisly Growths (5); Implosion (9); and Positive Attunement.
- Life Link's target now also records "other than you", which its own route already enforced.
- **Correction ([batch 7](phase-rank-2-batch-7.md)):** the plan validator didn't yet accept the new `trait` (absent), `not-caster`, `living-or-undead` and `persistent-damage` checks, so plans using them were still marked unsafe. Batch 7 fixed the validator. Only Horrifying Blood Loss became executable; the others listed above still have other rules to do.

## Tests

790/790 pass. `test/rank-2-batch-5.test.js` is new. It checks each target line and the runtime checks against stand-in actors, including incorporeal, construct, the caster, and bleed against fire persistent damage.

A whole-corpus compile (b258 → b259) changed 22 plans, all in their targeting. Only Lock Item and Aberrant Whispers gained a route, and no plan lost one.

## Coverage

**Census:** **803 enabled**, up from 801. Rank 2: 68 of 245. Rank 3: 61.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-5-live-results.json), case `rank2Batch5`, in the `pftest` world.
- **Lock Item:** a failure put its note on the holder for 4 rounds.
- **Aberrant Whispers:**
  - With an ally and an enemy targeted, the ally was ineligible ("an ally of the caster, not an enemy").
  - The enemy's failure gave Stupefied 2, and the ally got nothing.
- **Cleanup:** fixtures removed; no combats left.
