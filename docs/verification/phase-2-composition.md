# Phase 2 focused outcome composition

2026-09-23. This implements the approved foundation expansion using shared source
rules. The 51 unresolved classification spells remain deferred. No production
spell-name, slug, ID, or description-hash dispatch was introduced. Implementation
and independent review used GPT-6 Sol through the codex-model-team skill.

## Foundation and new coverage

The existing normalized save plan and executor now compose selected native
damage components, independently timed conditions, and supported native Effects.
Each damage outcome records source component IDs and optional per-component
multipliers. Exactly matched native instances are selected/scaled before a
single PF2e damage application per target, preserving native IWR and receipts.
Full selections with a uniform multiplier retain PF2e's original roll/scaling
path, including its evaluated minimum-damage metadata.

Native outcome Effects use a shared template-preparation helper also used by
standalone Effects. The first supported family proves degree-selected Speed
penalties against native ChoiceSet/FlatModifier rules and exact duration wording.
Selection is supplied before creation, avoiding another choice prompt. The
executor validates every participating target's component mapping and native
template before applying any HP changes. Conditions and native Effects are
tracked separately with their own lifetimes in the existing ongoing journal.

| Newly enabled spell | Shared rules exercised |
| --- | --- |
| Ancient Dust | Success: half initial damage, no persistent damage. Failure: both components. Critical failure: double both. Structured two-rank heightening and spellcasting modifier remain native. |
| Cutting Insult | The same component selection plus independent Frightened 1/2/3. Critical failure doubles mental damage and persistent bleed. |
| Bursting Bloom | The same component selection plus independently timed Encumbered. Critical failure doubles initial piercing damage but does not double persistent bleed. |
| Tempest Touch | Native typed damage plus a degree-selected native Speed penalty: –5 on success, –10 on failure/critical failure, through the end of the caster's next turn. |

This is bounded support. The compiler proves all four outcomes, structured
components, source damage claims and heightening before enabling the component
family. A native Effect link by itself does not prove what it does or when to
apply it. Unknown rule elements, changed templates, unresolved prose, eligibility
restrictions, lifecycles and follow-ups still block the shared route.

`inspectSavePlan(plan)` returns the same capability decision used by execution,
with blocker codes, paths and explanations. The queue summarizes execution gaps;
the catalog retains detailed per-spell blockers. The complete structural
[family audit](../../reports/phase-spell-batches/composition-family-audit.md)
contains all **13 direct-plus-persistent save plans** and **45 save plans with
linked native Effects**, including still-blocked members. These overlapping
structural families are not a promise that every member can now execute.

## Automated and corpus verification

**182 tests pass, 0 fail**, versus 165 at baseline. Tests include renamed/detached
sources, changed component IDs/types/formulas/heightening, exact degree proof,
contradictory or extra mechanics, ambiguous/missing/extra native instances,
zero-valued native roll preservation, altered native templates, turn anchors,
and a normalized outcome containing damage + a condition + a native Effect.
Adding an unsupported consequence still blocks that composed outcome.

All **1,994 installed documents** were recompiled. Compared with the preceding
checkpoint, shared executable saves increase **59 → 63**, with exactly the four
additions above and **no lost shared-save routes**. Existing dedicated routes
retain their counts. Current non-ritual route census: **195 enabled / 1,632 not
enabled**, among 1,827 spells. This includes 119 native Effect routes, 51 of them
partial/guided; route availability is not full spell completion.

| Primary worklist | Total | Enabled | Not enabled |
| --- | ---: | ---: | ---: |
| Phase 2 | 571 | 120 | 451 |
| Phase 3 | 624 | 29 | 595 |

The [Phase 2–3 queue](../../reports/phase-spell-batches/phase-2-3-queue.md) preserves
phase definitions and completed batch history and regenerates lists/counts from
current route support.

## Live verification

Foundry **14.367**, PF2e **8.5.0**, module **0.8.2**, authorized disposable
**pftest**. Native saves use explicit GM degree corrections. Harness:
[phase2-composition-verification.mjs](../../tools/phase2-composition-verification.mjs).
Evidence is retained on the verification macro under `phase2CompositionVerification`.

| Check | Evidence |
| --- | --- |
| Four save degrees for all four spells | 16 cases passed, checking exact initial damage against native rolled totals, receipts, persistent branches, condition values, native Speed changes and duplicate finalization. Rank-one Ancient Dust failure card `YWVxTFYtjNnqltMC` preserved native minimum 1; its critical failure used native scaling and produced 0 initial damage with persistent 2 (`8x7SDZjM7NxQ75hD`). |
| All legal ranks | 36 critical-failure cases passed: Ancient Dust and Tempest Touch 1–10; Cutting Insult 2–10; Bursting Bloom 4–10. Persistent formulas and native heightening were checked. Rank-one Ancient Dust card `caB8pU6FHZZUNMzG`. |
| Native Speed timing and source deletion | Passed both caster-already-acting and caster-later-in-initiative cases, mapping to one/zero native rounds. Penalty survives source spell deletion and caster turn start, expires at the correct caster turn end, and never replays damage. Cards `0eq9CJGzY4tZgIqd`, `1vmaXR8OC3BmWgTq`. |
| Composed outcome across reload | A synthetic normalized plan applied damage, two-minute Clumsy 1, and native Speed penalty as separate contributions. Source deletion and browser reload preserved both; aging only the native penalty removed it while Clumsy remained and HP stayed 485. Card `xgZ8m0Kcnr77h1wj`. This exercises the executor interface, not broader prose recognition. |
| All-target native preflight | A deliberately stale native rule snapshot on the second target rejects the cast before either target loses HP or receives an Effect; state remains collecting. Card `5Tn7iuKxkpkWEgxC`. |
| Native IWR and independent consequences | Piercing resistance 3 and piercing immunity use one damage application each, with exact native receipts; bleed and Encumbered remain independent. Cards `5XuwBvE7qg2AypHq`, `RCfbm9j99o3oMlCB`. |

A native-roll probe exposed the minimum-damage edge case: rebuilding every roll
from instances lost PF2e's `increasedFrom` metadata. Full, uniformly scaled
selections now use the native original/alter path; a regression test and the live
rank-one cases cover it. Early harness failures were fixture mistakes (old PF2e
Speed field and an assumed component ordering); corrected checks passed. Failed
attempts remain in the macro evidence history.

## Scope limits

The first component grammar supports exactly one initial and one persistent
source component. Unmatched extra native damage instances, including unsupported
synthetic extra types, stop before application. Sustained Speed effects continue
to need their lifecycle route. This batch does not add arbitrary native rule
execution, per-spell adapters, or a generic turn-trigger engine. Existing player,
GM-handoff, removal-OFF and third-party-module reports retain their prior scope;
those scenarios were not freshly repeated here. Older stored casts are not
migrated.

## Cleanup and checkpoint

Cleanup passed: **102 authored disposable actors**, their tokens, and **47
associated cast journals** removed. Isolated turn encounters were removed by
finally blocks. Existing actors, modules, ownership and retained chat/macro
evidence were preserved. The temporary browser viewport override was reset.
The [SHA-256 checkpoint](../../reports/phase-2-composition.sha256) covers 99 source,
test, harness and report files; earlier manifests remain historical evidence.
No version bump, commit or publication was performed.
