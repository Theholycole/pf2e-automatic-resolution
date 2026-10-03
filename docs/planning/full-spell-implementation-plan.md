# Full spell automation — implementation plan

Status: **Phases 1–5 have verified implementation checkpoints; spell coverage remains incomplete.** [Phase 1](../verification/phase-1-release.md) covers GM corrections; [Phase 2](../verification/phase-2-release.md) covers native outcomes; [Phase 3](../verification/phase-3-release.md) covers durable ongoing casts, native expiry, recurring saves, Sustain and aura review, with 83 automated tests and live verification. Phase 3 also fixes and re-verifies player transport after enabling the module socket. [Phase 4](../verification/phase-4-release.md) verifies Heal, Force Barrage and Disintegrate immediate workflows, with 93 automated tests and live native-dialog, resource, player, privacy and GM-handoff checks. [Phase 5](../verification/phase-5-release.md) verifies Animal, Dragon and Pest Form, native attacks and breath recharge, selective reversion, expiry ON/OFF, player authority and GM handoff, with 101 automated tests. Phases 6–9 remain pending.

**Current priority (2026-09-20): Phase 2–3 coverage expansion before Phase 6.** The earlier phase releases verify representative implementations, not complete spell catalogs. The user reported Enfeeble and Evil Eye missing effects and explicitly prioritized closing condition/outcome and ongoing-spell gaps. Track live evidence and remaining work in [the gap-closure record](../verification/phase-2-3-gap-closure.md) and [candidate ledger](../../reports/condition-ongoing-coverage.md). Phase 6 is deferred until this work is reviewed. The [2026-09-22 general-rules checkpoint](../verification/general-rules-phase-2-3.md) adds shared critical-failure riders and linked-condition lifetimes without new spell profiles.

**Architecture requirement (2026-09-22): general rules-based automation without per-spell implementations.** The user explicitly resolved the handoff's outstanding architecture question. Existing named-spell workflows are migration debt, not the accepted architecture. Follow [the decision](../adr/0001-general-rules-based-automation.md) and [migration assessment](general-rules-migration.md) when expanding coverage. The shared compiler remains the foundation; handwritten spell profiles or tables are not a substitute for reusable rule compilation and execution.

## Destination and authority

Complete dependable spell automation on Foundry v14 / PF2e 8.5.0 before other system automation. The catalog contains 1,827 non-ritual spells, including focus spells and cantrips. The ritual audit includes 43, excludes 123, and skips 1 unverified entry by explicit user exception; none remain unresolved for milestone scope. Recall Past Life is excluded by provisional user ruling pending authoritative clarification; Aspirational State is skipped because its source is unavailable. The accepted catalog denominator is 1,870 documents (1,827 + 43), subject to those exceptions. These are scope classifications, not support counts.

The [decision map](../../.scratch/full-spell-automation/map.md) and its linked decision records are authoritative. This handoff sequences their implementation; it does not replace them. Mechanical gaps cannot be called complete without explicit acceptance. Narrative adjudication and delegated affliction progression remain accepted exceptions. General non-spell ability and environmental automation, broad version compatibility, and public distribution are outside this milestone.

## Completed planning prerequisites

- The user approved the [ongoing interaction prototype](ongoing-spells.prototype.html). Agent browser verification of that local-file prototype remains blocked; user acceptance is recorded separately from live testing.
- The [native expiry experiment](../research/native-expiry-experiment.md) established the required reconciliation design through live time/turn, removal ON/OFF, reload, backward-time, and multi-client observations. It exposed missed retained expiry and lost pending successor prompts. Those are implementation work, not passing behavior.
- [Ritual references](../research/ritual-reference-follow-up.md) are settled by evidence and explicit user decisions. Preserve Recall Past Life's provisional exclusion and Aspirational State's skipped, unverified status in coverage reporting.
- The [release evidence matrix](release-evidence-matrix.md) names representative cases and their expectations. Prepare exact numeric fixtures from pinned data before execution; every implementation release must pass its applicable cases.

## Lifecycle implementation constraints

Use a durable cast/obligation record independent of transient Effects and chat presentation. Reconcile after native combat/world-time processing and Item changes, and on ready/coordinator changes. Persist pending ending work before its only source document disappears. Use one coordinator consistently while respecting document ownership. Proven completion prevents duplication; uncertain completion becomes Needs review. Backward time can reactivate native Effects but must not replay confirmed module consequences. Verify granted-condition lifetime explicitly with removal disabled. These constraints follow the experiment and are implemented for the verified Phase 3 families; additional mechanics require reusable rule primitives and evidence, not per-spell adapters.

**Work order (2026-09-22):** Defer the 51 unassigned review spells until last. Continue Phase 2 by reusable rule family, validating the source/plan and live behavior of each completed batch. Regenerate the Phase 2–3 queue from the fresh runtime route census after each batch, including enabled and not-enabled counts and member lists.

## Grouped implementation worklists

Use the [phase and description-language catalog](../../reports/phase-spell-batches/README.md) and [Phase 2–3 batch queue](../../reports/phase-spell-batches/phase-2-3-queue.md) to select shared rule primitives and fixtures. These are provisional planning assignments across all 1,870 in-scope entries, not verified phase denominators or executable spell profiles. Preserve per-spell/rank assertions and split materially different mechanics before sharing live evidence.

## Release sequence

Each row may comprise multiple small releases. Maintain the catalog audit and support report throughout; the final phase must not be the first discovery of unsupported families.

| Phase | Deliverables | Dependencies | Automated checks | Live scenarios and completion gate |
| --- | --- | --- | --- | --- |
| 1. GM corrections | Exclude/restore targets, effective degree overrides, Unaffected overrides; preserve original rolls and correction notes | Existing save workflow and accepted casting authority | Reroll invalidation, secondary-save changes, readiness, retained target results, permissions | GM/player correction flows before one-click Finalize; existing three-card behavior remains working |
| 2. Outcome-specific native Effects | Apply finalized outcomes, track each cast's contributions, condition/duration corrections, per-target results and total group damage | Phase 1 | Branch selection, native-effect mapping, overlap and ownership, confirmed damage totals, duplicate prevention | Mixed save degrees, native damage adjustments, repeated casts and blocked targets; no added damage approval pause |
| 3. Reminders and recurring saves | Ongoing overview, turn/world-time obligations, Sustain/dismissal, aura reminders, confirmed endings and selective cleanup | Phases 1–2; expiry experiment and approved prototype | Timing, exposure limits, missed Sustain, ending consequences, uncertain-state handling and duplicate prevention | Expiry with removal on/off, reloads, GM handoff, time jumps, missing source, interrupted application; no uncertain replay |
| 4. Immediate spell expansion | Spell attacks, healing, no-roll and mixed workflows; missing choices and explicit object/location targets | Shared resolution and outcome handling | Target-bound rolls, rank/variant changes, permissions, independent versus dependent steps | Native dialogs, GM finalization, owned-recipient no-roll resolution, mixed attack/save casts and ordered applied steps |
| 5. Transformations | Legal form selection, mechanical changes, granted actions and usage limits, safe reversion | Outcome ownership; ongoing lifecycle for expiry | Rank/tradition context, form choices, restrictions, known-data corrections, granted-action resolution | Animal/Dragon Form and contrasting forms; base/heightened behavior, cancellation, space, overlaps, recharge and preservation of unrelated changes |
| 6. Summons and created creatures | Eligible selection, missing-data handling, placement, caster control, spell restrictions, cast-linked cleanup | Ongoing lifecycle and spatial placement requirements | Eligibility/rank, missing actor data, permissions, independent cast identities, selective cleanup | Multiple summons, uncertain placement, original actor unchanged, GM detachment; native creature controls remain usable |
| 7. Spatial effects | Walls/objects/areas, required barriers, destructible objects, movement and teleport workflows | Targeting/outcomes; ongoing lifecycle for persistent creations | Geometry and destination constraints where reliable, durability, cast linkage, edit/detachment behavior | Obstructions, GM adjudication, cross-scene destinations, narrative destination handoff, cleanup without altering unrelated scene content |
| 8. Rituals | Confirmed ceremony outcome intake, all outcome/rank branches, immediate and later saves, persistent records and affliction handoff | Ritual membership; shared outcomes, ongoing and applicable creation workflows | Missing-input/DC gates, branch selection, retained long-term records, handoff reporting | Backlash, delayed triggers, permanent outcomes, absent caster/chat message, delegated affliction progression |
| 9. Catalog completion | Close remaining mechanical gaps, verify complex interactions, finish evidence and accepted-exception report | All required families | Every in-scope entry and meaningful variant/legal rank accounted for; expected behavior checked | Every distinct workflow and selected edge case passes on baseline; no unaccepted gaps or unexplained entries |

## Rules carried across releases

- Keep native casting and resource spending; do not deduct twice. Cancellation does not imply a refund. Surface already-spent resources when applicable.
- Preserve native roll dialogs and the reaction window before manual finalization. Applied dependent steps stay locked; uncertain work stops for review.
- Respect GM/player ownership boundaries. GM-dependent work waits when no GM is available.
- Use verified native mechanics where appropriate. A compiled spell, loaded Effect, or visual marker is not proof of mechanical coverage.
- Preserve unrelated state. End only consequences the spell says should end; permanent creations and independent consequences remain. Explicit GM detachment is visible.
- Group damage totals sum confirmed applied damage after per-target adjustments. Do not subtract healing, count future persistent ticks, or double-count applications. Label uncertain partial totals.
- A suspected native-data discrepancy requires investigation. Narrow baseline corrections require evidence and tests before support is claimed.

## Local Foundry testing availability

Foundry is available at `http://localhost:30000`, with disposable `pftest` authorized for unrestricted test-world changes as Gamemaster. Baseline observed: Foundry 14.367 / PF2e 8.5.0. The installed module links directly to this workspace. See the [session record](../research/local-foundry-session.md) for identities, access, and cleanup. Exercise applicable live cases throughout implementation.

Use a disposable test world or explicitly designated test actors/scenes for mutation-based checks. Automate supported browser interactions and capture observed outcomes and relevant state. Keep checks requiring unavailable clients, permissions, or manual intervention visibly pending. Distinguish live Foundry automation from tests outside Foundry; neither substitutes for the other's evidence.

The native expiry experiment is complete as a planning investigation. Its baseline failures and untested edge variations must be covered by the new implementation's verification; the experiment is not a production release pass.

## Verification and completion

For each release, record module revision, exact Foundry/PF2e versions, relevant settings, tested scenarios, observed results, and unresolved limitations. Automated checks must assert outcomes, not merely compilation. Live evidence remains separate from automated evidence.

The searchable catalog report must distinguish supported variants, gaps, accepted exceptions, and evidence. Show concise limitations before resolution. Intermediate releases may have listed remaining scope; final completion may not have unaccepted gaps.

The evidence matrix must cover multi-client authority, rerolls/corrections, repeated casts, overlapping effects, reloads, GM changes, interrupted application, and recognized/unrecognized custom structures. Preserve existing supported behavior at every release. Apply the [transformation evidence checklist](../research/form-workflow-evidence.md) and [ritual scope audit](../research/ritual-scope-audit.md).

## Evidence design agreed with the user

Select representative live cases by distinct mechanics and workflows, including heightened changes, mixed outcomes, granted abilities, and known problem cases. Record why each case was selected and which spells may rely on its evidence. Shared live evidence is valid only when behavior is the same and each dependent spell's data passes automated checks; materially different rules or interactions need additional cases.

Each case records its setup and expected targeting, rolls, damage, effects, duration, and cleanup as applicable before execution. Record observed results separately and identify discrepancies. The [case matrix](release-evidence-matrix.md) is now specified; execution remains pending for production changes.

Retest affected cases when implementation, spell data, or relevant settings change. Preserve version information and do not treat historical evidence as current without checking its applicability. Unrelated changes do not require repeating the entire manual suite.

Each usable release includes a concise record of newly supported behavior, passed automated checks, live-test results, known gaps, and setup requirements. Unperformed checks stay pending rather than appearing as passed.

## Decision references

- [Coverage contract](../../.scratch/full-spell-automation/issues/03-define-coverage-contract.md)
- [Casting and immediate resolution](../../.scratch/full-spell-automation/issues/04-define-cast-workflows.md)
- [Outcome ownership](../../.scratch/full-spell-automation/issues/05-define-outcome-ownership.md)
- [Ongoing controls](../../.scratch/full-spell-automation/issues/06-shape-ongoing-workflow.md)
- [Ritual handling](../../.scratch/full-spell-automation/issues/07-define-ritual-workflow.md)
- [Acceptance criteria](../../.scratch/full-spell-automation/issues/08-define-release-evidence.md)
- [Release sequencing](../../.scratch/full-spell-automation/issues/09-sequence-spell-milestone.md)
- [Summons](../../.scratch/full-spell-automation/issues/12-define-summoning-workflow.md)
- [Transformations](../../.scratch/full-spell-automation/issues/13-define-form-workflow.md)
- [Spatial effects](../../.scratch/full-spell-automation/issues/14-define-spatial-workflow.md)
