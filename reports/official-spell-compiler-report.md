# Official PF2e 8.5.0 Spell Compiler Report

Compiler version: 0.15.1

Spells compiled: 1277

## Automation levels

- automatic: 35
- guided: 505
- prompted: 15
- unsupported: 722

## Resolution kinds

- effect: 68
- effect-choice: 3
- effect-sequence: 2
- effect-variant: 4
- save: 478
- unsupported: 722

## Diagnostics

- AFFLICTION_RESOLUTION_DELEGATED: 19
- BASIC_SAVE_DAMAGE_COMPILED: 152
- CHOICE_VARIANT_RESOLUTION_COMPLETE: 2
- CHOICE_VARIANT_RESOLUTION_GUIDED: 1
- COMPILER_PATH_NOT_IMPLEMENTED: 722
- CONDITION_DURATION_SCOPE_PENDING: 22
- CONDITION_DURATIONS_COMPILED: 108
- CONDITION_EXPIRATION_EVENTS_COMPILED: 17
- CONDITION_REFERENCES_COMPILED: 3
- DEGREE_SECTION_SCOPE_AMBIGUOUS: 3
- DESCRIPTION_SEMANTICS_PENDING: 143
- DIRECT_EFFECT_RESOLUTION_COMPLETE: 35
- DIRECT_EFFECT_RESOLUTION_GUIDED: 33
- EFFECT_SEQUENCE_RESOLUTION_COMPLETE: 2
- LINKED_CONDITIONS_COMPILED: 5
- NATIVE_EFFECT_TERMINATION_COMPILED: 25
- NATIVE_SPELL_EFFECT_CHOICE_VARIANT_COMPILED: 3
- NATIVE_SPELL_EFFECT_ON_USE_COMPILED: 71
- NATIVE_SPELL_EFFECT_RANK_VARIANT_COMPILED: 4
- NATIVE_SPELL_EFFECT_RECIPIENT_PENDING: 48
- NATIVE_SPELL_EFFECT_SCOPE_PENDING: 134
- NATIVE_SPELL_EFFECT_SEQUENCE_COMPILED: 2
- NATIVE_SPELL_EFFECTS_COMPILED: 28
- NON_BASIC_DEGREE_SECTIONS_COMPILED: 326
- OMITTED_CRITICAL_OUTCOMES_INHERITED: 41
- OUTCOME_PROSE_ACCOUNTED: 82
- POST_DAMAGE_TERMINAL_COMPILED: 3
- PRIMARY_DEGREE_SECTIONS_COMPILED: 8
- RANK_VARIANT_RESOLUTION_COMPLETE: 2
- RANK_VARIANT_RESOLUTION_GUIDED: 2
- RESIDUAL_PROSE_PENDING: 252
- SECONDARY_SAVES_COMPILED: 10
- SIMPLE_BASIC_SAVE_COMPLETE: 9
- SIMPLE_BASIC_SAVE_GATE_REJECTED: 143
- TARGET_ELIGIBILITY_PENDING: 294

## Compiled capabilities

- actor-target-constraints: 983
- basic-save-scaling: 152
- complete-description: 9
- condition-durations: 108
- condition-expiration-events: 17
- condition-references: 216
- deferred-native-spell-effect: 2
- degree-sections: 334
- direct-effect-resolution: 68
- effect-sequence-resolution: 2
- explicit-choice-selection: 3
- item-duration: 1198
- linked-conditions: 5
- native-effect-termination: 25
- native-spell-effect-choice-variants: 3
- native-spell-effect-links: 239
- native-spell-effect-on-use: 78
- native-spell-effect-rank-variants: 4
- native-spell-effect-sequences: 2
- native-spell-effects: 28
- outcome-prose-accounted: 82
- outcome-specific-damage: 29
- post-damage-terminal: 3
- primary-save: 478
- rank-variant-selection: 4
- reroll-policy: 478
- residual-prose-analysis: 334
- secondary-saves: 10
- shared-damage: 275
- source: 555
- sustained-lifecycle: 183
- targeting: 555
- terminal-results: 2

## Pending and guided capabilities

- basic-save-without-structured-damage: 12
- choice-variant:aura-reminder-runtime: 1
- choice-variant:description-damage: 1
- choice-variant:prerequisite-or-placement: 1
- condition-duration-scope: 22
- description-effects: 143
- description-lifecycle: 143
- description-semantics: 722
- description-target-predicates: 143
- direct-effect:choice-resolution: 5
- direct-effect:condition-interaction: 7
- direct-effect:counteract: 4
- direct-effect:description-damage: 10
- direct-effect:dismissal-consequence: 1
- direct-effect:gm-adjudication: 2
- direct-effect:granted-or-follow-up-action: 2
- direct-effect:inline-damage: 4
- direct-effect:prerequisite-or-placement: 6
- direct-effect:recovery-check: 1
- direct-effect:referenced-action: 6
- direct-effect:temporary-immunity: 1
- item-duration-grammar: 79
- manual:action-restriction: 8
- manual:anatomy: 1
- manual:attitude-or-hostility: 12
- manual:condition-floor: 4
- manual:conditional-effect: 93
- manual:counteract: 2
- manual:forced-movement: 24
- manual:gm-choice: 9
- manual:perception-or-illusion: 6
- manual:temporary-immunity: 13
- manual:terrain: 12
- manual:transformation-or-form: 1
- multi-check-degree-scope: 3
- native-spell-effect-recipient: 48
- native-spell-effect-scope: 134
- no-primary-save: 653
- non-basic-save: 57
- rank-variant:description-damage: 2
- rank-variant:granted-or-follow-up-action: 1
- rank-variant:prerequisite-or-placement: 1
- rank-variant:referenced-action: 1
- residual-prose: 252
- target-eligibility: 294

## Delegated capabilities

- affliction-resolution: 19

## Executable save runtime

Basic-save plans: 9

Degree-outcome plans: 31

Total executable save plans: 40

- Befuddle
- Signal Skyrocket
- Ash Cloud
- Deafness
- Ignite Fireworks
- Noise Blast
- Agonizing Despair
- Blindness
- Corpse Bloom
- Eagle's Cry
- Glass Sand
- Gravity Wave
- Reblooded
- Shadow Projectile
- Slow
- Deathless March
- Enervation
- Mercurial Stride
- Painful Vibrations
- Phantasmal Killer
- Whispers of the Void
- Blazing Fissure
- Shock and Awe
- Stagnate Time
- Stormburst
- Weight of the World
- Utter Destruction
- Pollen Pods
- Telekinetic Bombardment
- Boil Blood
- Stop Heart

## Residual outcome prose

Unclaimed clauses: 778

- action: 81
- choice: 11
- condition: 4
- damage: 115
- duration: 286
- modifier: 79
- movement: 48
- save: 37
- state: 34
- timing: 98
- unclassified: 162

## Native pf2e.spell-effects links

Catalog documents: 544

Description references: 284

Resolved references: 284

Unresolved references: 0

Outcome applications: 57

- outcome recipient source: 4
- outcome recipient target: 53

Immediate on-use applications: 71

- on-use recipient source: 42
- on-use recipient target: 29

Deferred applications: 2

Compiled sequences: 2

- deferred recipient source: 1
- deferred recipient target: 1

Rank-variant applications: 8

Cast-rank selectors: 4

- rank-variant recipient rank-dependent: 2
- rank-variant recipient source: 6

Dismissal transitions: 47

- dismissal authority source: 44
- dismissal authority target: 3

- dismissal action action: 46
- dismissal action free-action: 1

- dismissal complete: 46
- dismissal guided: 1

Player-choice variants: 25

Player-choice selectors: 3

Unscoped references: 137

- unscoped recipient manual: 51
- unscoped recipient source: 25
- unscoped recipient target: 61

### Pending trigger reasons

- area-or-aura-present: 41
- degree-sections-present: 10
- immediate-application-not-explicit: 105
- inline-check-present: 6
- multiple-native-effects: 7
- non-actor-target: 15
- option-block-link: 4
- primary-save-present: 22
- reaction-trigger-present: 6
- recipient-not-safe: 10

## Direct native-Effect resolutions

Plans: 68

- automatic: 24
- guided: 33
- prompted: 11

### Remaining direct-effect capabilities

- direct-effect:choice-resolution: 5
- direct-effect:condition-interaction: 7
- direct-effect:counteract: 4
- direct-effect:description-damage: 10
- direct-effect:dismissal-consequence: 1
- direct-effect:gm-adjudication: 2
- direct-effect:granted-or-follow-up-action: 2
- direct-effect:inline-damage: 4
- direct-effect:prerequisite-or-placement: 6
- direct-effect:recovery-check: 1
- direct-effect:referenced-action: 6
- direct-effect:temporary-immunity: 1

## Native Effect sequences

Plans: 2

- prompted: 2

## Deterministic rank variants

Plans: 4

- automatic: 2
- guided: 2

### Remaining rank-variant capabilities

- rank-variant:description-damage: 2
- rank-variant:granted-or-follow-up-action: 1
- rank-variant:prerequisite-or-placement: 1
- rank-variant:referenced-action: 1

## Player-choice Effect variants

Plans: 3

Selectable Effects: 25

- guided: 1
- prompted: 2

### Remaining choice-variant capabilities

- choice-variant:aura-reminder-runtime: 1
- choice-variant:description-damage: 1
- choice-variant:prerequisite-or-placement: 1

Only plans that pass either the strict damage-only gate or the audited native-Effect completeness gate are marked automatic. Other plans retain explicit prompted, guided, or unsupported work.
