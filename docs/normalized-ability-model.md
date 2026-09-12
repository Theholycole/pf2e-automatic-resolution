# Normalized Ability Model

The compiler converts PF2e source documents into a versioned, source-neutral
ability plan. Runtime resolution consumes the plan and must not branch on
whether the original source was a spell, feat, impulse, NPC action, hazard, or
physical item.

## Safety contract

Compilation is descriptive and must not mutate Foundry documents. Unknown
mechanics produce diagnostics. A partially understood ability is never promoted
to complete automatic resolution merely because its damage was recognized.

Every plan preserves these interaction windows:

- Notify before rolling.
- Open PF2e's native roll dialog.
- Record the first result as provisional.
- Replace it with a valid reroll before application.
- Require confirmation before mutation.
- Send rerolls after application to manual review until safe transactional undo
  exists.

## Primary sections

- `source`: Stable identity and provenance of the source document.
- `activation`: Action cost, traits, traditions, requirements, and cost.
- `targeting`: Target text, range, and structured area.
- `trigger`: Use, entry, turn, movement, reaction, or other timing information.
- `decisionWindows`: Required player and GM checkpoints.
- `lifecycle`: Duration, sustaining, and caster-controller behavior.
- `nativeEffects`: Official PF2e effect links compiled for immediate on-use
  application or retained with an unresolved scope.
- `resolution`: Check, shared damage, four outcomes, effects, follow-ups, and
  decisions.
- `automation`: Level, confidence, compiled capabilities, and pending
  capabilities.
- `diagnostics`: Structured explanations of incomplete or unsafe compilation.
- `compilerEvidence`: Bounded description sections and structural markers used
  to explain why a compiler path was or was not selected.

`targeting.actorConstraints` records whether an Actor is a valid recipient and
any compiled eligibility predicates. The initial predicate vocabulary covers
required Actor traits and living-creature eligibility. Restrictions can come
from the structured target field or from a description sentence that identifies
which creatures attempt the save. Item-only targeting is represented explicitly
and cannot enter an Actor-based save runtime.

## Degree-section safety

Degree headings are bounded before heightening text and conditions are attached
only within their own outcome section. When a structured basic save also has an
inline secondary check or arrival/departure phases, those headings are treated
as ambiguously scoped until a dedicated multi-check or phase compiler claims
them. This prevents secondary-save effects from being applied as primary-save
effects.

## Complete basic-save gate

Structured damage alone does not prove the whole spell is automated. The first
completeness gate promotes a plan to `automatic` only when the description has
one matching damage-bearing basic-save sentence and no detected secondary
checks, outcome sections, conditions, native spell effects, sustained lifecycle,
target-dependent rules, movement, timing, or other uncompiled mechanic signals.
Rejected spells retain their compiled damage plan at `guided` level with the
gate's reasons recorded in `compilerEvidence` and diagnostics.

## Non-basic degree outcomes

The compiler can normalize non-basic saves with all four bounded outcome
sections. It extracts shared PF2e item-damage multipliers, balanced nested
`@Damage` expressions, referenced conditions, and simple “As success/failure”
inheritance. These plans remain `guided` until duration scope and all residual
outcome prose have been accounted for; extraction alone is not considered proof
of complete semantics.

Outcome damage uses four explicit modes: `none`, `shared`, `formulas`, and
`mixed`. A mixed result retains both its multiplier over the item's structured
damage and its separate outcome-scoped formulas. Formula entries preserve
their source and any independently stated interval heightening. Text such as
“1 persistent bleed” is normalized to PF2e's damage-category syntax rather
than being mistaken for immediate bleed damage.

When PF2e omits a critical-success or critical-failure heading, the compiler
inherits the corresponding success or failure outcome and records that
provenance. Condition durations are associated with the nearest reference in
the same sentence and retain whether expiry is anchored to elapsed time or the
affected target's next turn.

## Terminal and guided semantics

An unconditional outcome such as “the target dies” is represented as a terminal
result. Conditional death remains unclaimed unless its branch condition is
itself compiled. The compiler separately recognizes the source-specific pattern
where this spell's damage reducing a target to 0 HP causes death.

Unexecuted but mechanically significant prose is categorized on each outcome,
including forced movement, action restrictions, GM choices, secondary saves,
temporary immunity, terrain, counteracting, hostility, transformations,
anatomy, summoning, illusions, condition floors, and other conditional effects.
These categories are part of the plan rather than being discarded, allowing the
runtime to present precise guided reminders while dedicated compilers are added.

## Residual prose accounting

Every bounded degree-of-success outcome is split into clauses after its known
damage, conditions, terminal results, and follow-up saves are compiled. Each
clause records compiled claims, guided claims, and still-unexplained mechanic
signals. `outcome.semanticCoverage` is therefore an audit trail rather than a
guess based on whether any one mechanic was recognized. A plan retains the
`residual-prose` pending capability while any clause remains unclaimed.

## Secondary saves

A save caused by a primary outcome is represented in that outcome's
`followUps` array. It has its own statistic, traits, timing, four branches, and
the same pre-roll, provisional-result, reroll, and confirmation windows as the
primary save. Conditions and damage belonging to a secondary branch are not
also applied as primary-outcome effects. Saves after a new bold feature or
phase heading are deliberately left for a phase compiler.

## Linked conditions

When one condition lasts only while another remains, the dependent condition
retains `whileCondition` and an `endsWhen` condition-removal event. The runtime
can use this relationship to remove only the dependent effect when its anchor
condition ends. Both “Slowed while Frightened” and dependency-first wording
such as “while Sickened, also Slowed” use the same normalized representation.

## Native spell effects

Links to `Compendium.pf2e.spell-effects` are compiled as references to the
official Effect document. The plan preserves the UUID and resolved document ID
without copying or reinterpreting its rule elements. Each application requires
confirmation and records whether its recipient is the source actor, the
affected target, or must be chosen manually.

Links physically contained in a degree section or explicitly labeled for a
degree are attached to `outcome.nativeEffects`. Compound labels and “As
failure/success” inheritance can attach one Effect to multiple outcomes. Links
without a safe trigger or outcome remain in `nativeEffects.unscoped` and add a
pending capability; their presence is never treated as permission to apply an
Effect immediately.

The initial trigger compiler promotes only an explicitly described, immediate
Actor application to `nativeEffects.onUse`. It rejects ambiguous multi-effect
spells, degree sections, saves, inline checks, reactions, areas and auras,
immunity effects, and non-Actor targets. An on-use effect records a one-time
post-activation trigger and still requires confirmation before it is embedded.

## Direct Effect resolution

An ability with one on-use native Effect, no unresolved native links, no check,
no structured damage, and no outcome application uses `resolution.kind:
"effect"`. Its `applications` entry points back to `nativeEffects.onUse` instead
of duplicating the Effect data.

The official Effect catalog contributes only an automation profile—rule-element
keys, whether native configuration is required, and whether the Effect removes
itself after a roll. This is used to check description signals without copying
the actual rules. A completely represented Effect is `automatic`, or
`prompted` when PF2e must collect native choices. Unrepresented damage, checks,
immunity, dismissal, actions, counteracting, or other mechanics keep the plan
`guided` with explicit `direct-effect:*` pending capabilities.

## Multi-Effect sequences

Related native Effects are not assumed to be simultaneous. A recognized
sequence stores its first Effect in `nativeEffects.onUse`, its successor in
`nativeEffects.deferred`, and a transition in `nativeEffects.sequences`.
`resolution.kind: "effect-sequence"` references both applications and the
sequence ID.

The initial sequence patterns cover an immediate primary Effect followed by a
temporary-immunity Effect. “Either way” expiry or consumption produces an
`effect-ended` transition with explicit allowed reasons. Wording such as
“after you use [action]” produces an `action-used` transition containing the
official action UUID and removes the primary Effect. Rank variants and
mutually-exclusive form options are never inferred to be sequences merely
because they appear in the same description.

These immunity sequences also carry an explicit `reapplication` contract. The
primary application is blocked while its successor immunity Effect remains on
the same recipient. This is required because PF2e's native temporary-immunity
Effects can be duration markers without rule elements that reject a new cast.

## Deterministic rank variants

When two official Effects share the same base name and the description proves
that a fixed heightened rank replaces the base Effect, the compiler emits an
exclusive, exhaustive `cast-rank` selector. Each branch contains a nonoverlapping
rank range and exactly one Effect UUID; `resolution.kind: "effect-variant"`
references the same selector and applications. The runtime evaluates the
current cast rank after activation and presents only the selected Effect for
confirmation.

Effect selection and recipient selection are independent. A heightening can
change a spell from self-only to a target before a later rank changes its
duration Effect. A `rank-dependent` recipient therefore carries its own
cast-rank branches. Labels, bounded Heightened blocks, and structured
fixed-heightening target data are accepted as evidence; ambiguous multi-Effect
descriptions remain unscoped.

## Player-choice Effect variants

When an ability explicitly instructs the user to choose one named form and its
official Effect links share one base name, the compiler emits an
`explicit-choice` selector. The selector presents every label before
application, requires exactly one selection, allows cancellation without
mutation, and retains a separate confirmation before embedding the selected
Effect. `resolution.kind: "effect-choice"` links every selectable application
back to its selector branch.

Choice is treated as interaction, not uncertainty, so a fully represented form
plan is `prompted`. All variants must have a safe common recipient and unique
choice IDs; complete prompted classification also requires audited native
Effect documents. The selector does not claim other mechanics merely because
they appear inside a form: aura behavior, placement prerequisites, damage
riders, and dismissal consequences remain independently compiled or guided.

## Dismissal and Effect termination

An explicit Dismiss permission on an ability can compile into a `dismissed`
lifecycle transition linked to the applied native Effect instance. The
transition preserves PF2e's official Dismiss action UUID, action cost,
concentrate trait, controlling actor, deletion scope, and a confirmation window
before the embedded Effect is removed.

Ordinary Dismiss is one action. Explicit exceptions can instead compile as a
triggered free action, including the triggering event and any damage type.
Source-controlled dismissal removes the selected cast instance; wording that
allows each target to dismiss an effect removes only that recipient's embedded
Effect. Consequences caused by dismissal remain guided until their own
semantics are compiled—for example, deleting an Effect does not also infer
forced movement from a collapsing tunnel.

## Duration and expiration

Item duration is normalized independently from condition duration. Supported
item modes include instantaneous, fixed, sustained with an optional maximum,
turn-boundary, daily-preparations, unlimited, and explicit duration choices.
An unrecognized duration remains `text` and is reported as pending rather than
being converted into a guessed number of rounds.

Condition effects can expire by elapsed duration or by events such as the spell
ending, sustaining ending, Escape, leaving an area, another condition being
removed, use, discharge, or expenditure. When both a duration and an event are
present, `expirationMode: "first"` means whichever happens first ends the
effect.

## Delegated afflictions

Disease and poison stage blocks are semantic boundaries, not continuations of
the final degree-of-success outcome. Their stage resolution is deliberately
excluded and recorded under `delegations` as `affliction-resolution` handled by
an external module. The spell compiler still compiles the immediate outcome
that applies the affliction when it can do so safely.

## Automation levels

- `automatic`: All represented mechanics are deterministic after confirmation.
- `prompted`: Complete resolution requires one or more explicit choices.
- `guided`: Deterministic portions are compiled, with visible manual guidance.
- `unsafe`: The model is internally invalid or contradictory and must not run.
- `unsupported`: No complete compiler path exists yet.

## Sustained effects

A sustained plan requests a PF2e Effect on the source actor. The runtime assigns
a unique cast-instance ID and records dependent target-effect UUIDs on that
controller. Deleting the controller ends only that casting and removes its
dependent effects. Damage and other instantaneous results are never reversed by
controller deletion.

## Versioning

`modelVersion` versions the serialized plan schema. `compilerVersion` identifies
the implementation that produced it. Persisted plans must be migrated or
recompiled when their model version is no longer supported.
