# Rank 5 batch 94 — the last rank 3–5 gaps, by the user's rulings

2026-10-03. The user answered the remaining rank 1–5 questions; this batch applies them.

| Spell | Ruling | Now |
| --- | --- | --- |
| Restraining Chains (3) | The unnamed save is Reflex. | The source adapter gives Reflex to save results with no named save, when they are a restraint (the critical success unaffected, the others holding the creature's movement until it Escapes). The rows are rewritten (`chain-rows.js`): a failure is Clumsy 1, a critical failure Clumsy 2, each until it Escapes. On each held row, a "Chained" note gives the distance (20, 10 or 5 feet) and ends on an Escape at the spell DC. The chain's statistics are a reminder. |
| Ravening Maw (5) | No results in the text: a failure gives the effect, a success nothing. | New kind `cannibal-hunger`. The living target's Will save against the spell DC; on a failure or critical failure, the hunger's Effect for 3 rounds, with two controls (below). |
| Elemental Tempest (4) | Schools were removed; the caster confirms the spell counts as evocation (option B). | New kind `spell-storm`. The caster's primed Effect, then a release control (below). |
| Conglomerate of Limbs (4) | The thrall rules (from the thrall trait). | New kind `giant-thrall`: the thrall token and its two Strikes (below). |
| Note-only rituals | They count as resolved. | `tools/report-enabled-spells.mjs` and `tools/build-spell-resolution-status.py` now count them. |

**Ravening Maw's controls:**

- **Cannibalize** (target the adjacent Dying or dead body):
  - A Dying creature dies.
  - It regains 5d8 HP for an ally, 5d4 otherwise (+1 die per rank).
  - Each body can be cannibalized once.
- **The round's damage:** 5d4 mental (+1d4 per rank). It is refused unless a Dying or dead creature is within 30 feet and the target hasn't eaten this round.

**Elemental Tempest's release.** The caster confirms the spell came from their wizard slots and counts as evocation, and gives its rank and type. Then:

- Every foe within 10 feet takes rank × d6 of that type.
- For the foes the spell also damaged, PF2e's own record of the resistance or weakness it applied to the storm's damage is undone, so it counts once in all, as if the damage were combined. This assumes the spell's own damage beat the resistance.

**Conglomerate of Limbs' thrall.** A token beside the caster:

- level −1, mindless undead, Huge, 40 HP (+10 per rank), Speed 25;
- immune to bleed, death effects, disease, mental and poison;
- every check of its own a failure (PF2e's `AdjustDegreeOfSuccess`);
- a Strike at the caster's spell attack modifier for 1d6 (+1d6 at caster level 5 and every 4 after).

The caster's control makes its two Thrall Charge Strikes:

- up to two different creatures within 10 feet of it, at one multiple attack penalty, with the caster's spell attack;
- Thrall Charge's extra dice used;
- a hit creature attempts a Fortitude save: Grabbed for 1 round (Restrained on a critical failure), ended by an Escape at the spell DC.

The thrall goes with the caster's Effect, or ends it at 0 HP.

## Not automated

"Checks made against a thrall automatically succeed" can't be set in PF2e. The thrall has AC 0, and a card line tells the GM to treat a critical success against it as a success.

## Tests

`test/rank-5-batch-94.test.js` is new. It covers all four spells, plus a non-restraint row (not given Reflex) and changed sentences (not read).

A whole-corpus compile (b711 → b713) changed only these four spells.

## Evidence

[Live evidence](phase-rank-5-batch-94-live-results.json), case `rank5Batch94`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Restraining Chains, failure | Reflex; Clumsy 1 and Chained |
| A scripted Escape | Both ended |
| Ravening Maw on Will −40 | Critical failure: the hunger for 3 rounds; a Will +60 creature unaffected |
| Cannibalizing a Dying ally | It dies (dying 4); healed 23 (5d8) |
| The same body again | Refused |
| The round's damage | 12 mental (5d4) |
| Elemental Tempest at rank 3 fire, rolled 13 | Fire resistance 5 (also damaged by the spell): lost 13 (the resistance undone). Fire weakness 5 (also damaged): lost 13. Resistance 5, not damaged by the spell: lost 8. The caster untouched |
| Conglomerate of Limbs at 4th | Huge thrall, 40 HP, its Fortitude save a failure, 2d6 Strike at caster level 7, the five immunities |
| Its two Strikes | Both hit; Fortitude −40 critically failed: Restrained; Fortitude +60: not held |
| An Escape | The Restrained gone |
| The caster's Effect deleted | The thrall gone |
| A note-only ritual (Confound the Eye and Confuse the Mind) | Its note applied |

**Cleanup:** fixtures removed. A thrall left over from a failed first run (a regex group bug, fixed) was deleted.
