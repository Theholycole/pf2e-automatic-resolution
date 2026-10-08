# Automatic spell resolution status

Generated 2026-10-05 from the current compiler output (Foundry 14.367, PF2e 8.5.0). Each of the 1,870 in-scope spells and rituals is counted once, under its primary phase and rule family. "Can resolve" means the module has an enabled automatic route for the spell; for some spells, that route automates only part of the spell. Afflictions resolve their immediate outcome here and hand the finalized degree to the Pseudo Afflictions module, which applies stages and progression; without that module, the card tells the GM exactly which affliction and stage to apply.

Phase 1 (GM corrections and authority) applies to every phase, so no spells are assigned to it.

Regenerate with `python3 tools/build-spell-resolution-status.py` after `tools/build-phase-spell-batches.py`.

**Note only (counted apart):** 383 further spells have no mechanical rule the module could apply. Casting one gives a rule-less note Effect with the spell's rules for its duration (on the caster, with a line to mark the area on the map, for a spell placed in the environment). Note-only spells count as resolved (user decisions: cantrips and rank 1 on 2026-09-29, every rank on 2026-09-30), and so do note-only rituals (2026-10-03). All are listed apart in [the rank view](spell-resolution-by-rank.md).

**Effect + note (counted apart):** 0 further spells link a PF2e Effect the module can't prove covers the text (or can't tell who receives it). Casting one applies PF2e's Effect as PF2e defines it, plus a note Effect with the spell's text. They're also counted under "Cannot resolve" and listed apart in the rank view.

## By phase

| Phase | Worklist | Can resolve | Cannot resolve | Total |
| --- | --- | ---: | ---: | ---: |
| 2 | Outcome-specific Effects and conditions | 595 | 0 | 595 |
| 3 | Ongoing rules and recurring saves | 611 | 0 | 611 |
| 4 | Immediate resolution and choices | 240 | 0 | 240 |
| 5 | Transformations | 63 | 0 | 63 |
| 6 | Summons and created creatures | 56 | 0 | 56 |
| 7 | Spatial effects and movement | 212 | 0 | 212 |
| 8 | Rituals | 43 | 0 | 43 |
| 9 | Catalog completion and unresolved classification | 50 | 0 | 50 |
| **All** | | **1870** | **0** | **1870** |

## By rule family

### Phase 2: Outcome-specific Effects and conditions

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Delegated affliction | 24 | 0 | 24 |
| Basic-save damage | 58 | 0 | 58 |
| Native condition | 162 | 0 | 162 |
| Save-result condition rider | 32 | 0 | 32 |
| Degree-outcome | 68 | 0 | 68 |
| Native-effect | 159 | 0 | 159 |
| Persistent damage | 53 | 0 | 53 |
| Temporary immunity | 39 | 0 | 39 |

### Phase 3: Ongoing rules and recurring saves

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Aura membership | 90 | 0 | 90 |
| Area exposure | 84 | 0 | 84 |
| Condition-dependent lifetime | 19 | 0 | 19 |
| Recurring saving throw | 35 | 0 | 35 |
| Ending or dismissal | 116 | 0 | 116 |
| Sustain | 153 | 0 | 153 |
| Timed-other | 114 | 0 | 114 |

### Phase 4: Immediate resolution and choices

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Attack and dependent result | 96 | 0 | 96 |
| Choice / casting variant | 20 | 0 | 20 |
| Counteract | 22 | 0 | 22 |
| Information / adjudication | 32 | 0 | 32 |
| Healing / recipient mode | 60 | 0 | 60 |
| Immediate-other | 7 | 0 | 7 |
| Granted movement speed | 3 | 0 | 3 |

### Phase 5: Transformations

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Creature transformation | 63 | 0 | 63 |

### Phase 6: Summons and created creatures

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Created entities | 12 | 0 | 12 |
| Incarnate arrival/departure | 28 | 0 | 28 |
| Creature creation | 16 | 0 | 16 |

### Phase 7: Spatial effects and movement

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Forced movement | 36 | 0 | 36 |
| Movement action | 29 | 0 | 29 |
| Object / structure creation | 6 | 0 | 6 |
| Teleportation | 48 | 0 | 48 |
| Terrain | 76 | 0 | 76 |
| Wall / barrier | 17 | 0 | 17 |

### Phase 8: Rituals

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Ritual | 43 | 0 | 43 |

### Phase 9: Catalog completion and unresolved classification

| Rule family | Can resolve | Cannot resolve | Total |
| --- | ---: | ---: | ---: |
| Review | 50 | 0 | 50 |
