# General rules architecture assessment

2026-09-22. This assessment implements the documentation portion of [the accepted architecture decision](../adr/0001-general-rules-based-automation.md). At the initial documentation checkpoint, runtime migration had not started. The subsequent [general-rules expansion](../verification/general-rules-phase-2-3.md) adds shared condition riders and exact-contribution linked lifetimes; the named runtime routes listed below remain migration debt. Existing automated and live-test results remain historical evidence of the current implementation, not evidence that this architecture is already implemented.

## Findings

The existing compiler is the starting point, not something to replace wholesale. `src/compiler/compile-ability.js` already combines structured damage, degree outcomes, condition references, duration, targeting, native Effect links and residual-prose analysis into a normalized plan. `scripts/basic-save-core.js` already determines whether several plan structures are executable. The shared save, Effect and ongoing runtimes already provide native rolls, outcome application, receipts, cast ownership and durable obligations.

The following paths still select mechanics by spell identity:

| Current code | Coupling | General mechanism needed |
| --- | --- | --- |
| `scripts/condition-spell-runtime.js`, `condition-spell-core.js`, `condition-spell-baseline.js` | Four slug/ID profiles; hardcoded target counts, degrees, recovery restrictions and a native Effect selection | Data-derived degree outcomes, rank-dependent targeting, native Effect choices, recovery constraints |
| `scripts/paralysis-runtime.js` | Fixed Paralyze outcomes, durations and recovery branches | Scheduled recovery saves with outcome-driven duration changes and ending |
| `scripts/ongoing-families.js` | Petrify, Floating Flame and Bless select separate state transitions and controls | Progression, exposure limits, Sustain requirements/benefits and area membership review |
| `scripts/immediate-core.js`, `immediate-runtime.js` | Heal, Force Barrage and Disintegrate select choices, formulas and ordered steps | Casting variants, recipient predicates, allocation and dependent attack/save resolution |
| `scripts/form-core.js`, `form-runtime.js`, `form-baseline.js` | Three named forms select options, rank changes and granted abilities | Native form choices, rank-derived effects, granted actions and usage limits |
| `scripts/main.js` | Specialized `supports(item)` paths take precedence over shared plan execution | Routing by a completely compiled and executable plan |

The compiler also needs auditing for spell-specific text exceptions. The initial audit found `basic-condition-rider.js` removing Daze's exact introductory sentence before checking the remaining description. The subsequent expansion removes that exception and preserves the prose for semantic gating. Recognizing a reusable rule sentence is useful; exempting a particular spell's prose is not a general rule. Whole-document hashes protect the current adapters from unexpected edits, but do not establish general support.

Condition names such as frightened or sickened are legitimate reusable rule vocabulary. Spell identity is also legitimate for source lookup, labels, ownership and evidence. The architectural problem is using identity or a whole-text fingerprint to choose what mechanics execute.

## Proposed migration order

1. Establish plan-based eligibility for one complete condition-on-save workflow, using the existing compiler and save/Effect runtime. Verify all outcomes, timing and recovery, then replace that workflow's named-spell route. Fear is a useful candidate to assess because general frightened recovery already exists; its timed fleeing outcome and heightened targeting must also be accounted for before switching it.
2. Extend the plan with the missing ongoing rule primitives: trigger timing, recurrence, eligibility, recovery constraints, outcome transitions and cleanup ownership. Compile these from source structures and interpret them through the existing durable cast/obligation machinery. Migrate recovery and Sustain paths by mechanic.
3. Generalize native Effect choice selection and rank/action/recipient variants. Move shared allocation and dependent attack/save execution behind the same plan-driven interface.
4. Migrate transformations and granted abilities using native rules plus explicit supported mechanics. Continue honoring the Phase 2–3 product priority; this inventory does not bring Phase 6 forward.

Each slice must include source interpretation, plan validation, execution, controls and lifecycle behavior. Renaming a runtime or putting existing branches into a registry does not complete a slice. Do not loosen residual-prose gates merely to increase coverage.

Store enough versioned plan/source context with a cast to continue its confirmed lifecycle after a source item changes or disappears. Review compatibility before changing persisted cast records. Old records must not be silently reinterpreted or replay completed consequences; any temporary compatibility path must be named migration debt, with an explicit removal condition.

## Acceptance evidence

- An official source and a custom source with equivalent recognized mechanics execute the same operations when their names, slugs and source IDs differ. Provenance and identity-scoped immunity keys may differ without changing the rule interpretation.
- Changing a recognized condition value, duration or recovery outcome changes the compiled plan and executed result without adding a spell entry or modifying runtime code.
- Adding an unknown mechanical clause blocks the affected workflow and identifies the gap. Matching a familiar sentence does not authorize dropping the rest of the spell.
- Every migrated workflow retains applicable degree, legal-rank, casting-variant, correction, overlap, ownership, interruption and lifecycle checks. Recognized and unsupported custom cases are both exercised.
- Live Foundry evidence remains separate from compilation and automated tests. Native effect creation alone does not prove its rules, recovery, expiry or selective cleanup work.

The first implementation checkpoint should demonstrate a complete workflow through this interface and remove its new-cast dependency on the old spell route. It must report remaining named-spell paths explicitly; one generalized workflow is not completion of the migration or the catalog.
