# General rules Phase 2–3 checkpoint

2026-09-22. This expansion follows the [general rules architecture decision](../adr/0001-general-rules-based-automation.md). Phase 2–3 catalog coverage remains incomplete.

## Changes

Two shared mechanics enable four additional installed spells:

| Shared rule | Official regression examples |
| --- | --- |
| Bounded critical-failure condition riders with native damage and parsed timing | Void Warp; Entreat the Many |
| A condition remains only while the same cast's root condition remains | Scramble Body; Divine Wrath |

Production behavior is selected by compiled mechanics, not spell names, IDs, whole-description hashes or new spell profiles. Renamed custom items with removed compendium identity and changed condition values use the same implementation. The compiler no longer drops Daze's exact introductory sentence. Recognizing a rider cannot erase independent targeting, lifecycle, item-rule or native Effect gaps; unknown additional mechanics still refuse execution.

Linked conditions persist the exact root Effect UUID, native GrantItem ID, rule flag and condition slug. Partial Sickened recovery retains the dependent; full recovery or removal of that exact contribution ends it. Unrelated higher-value conditions and other casts remain independent. Root detachment transfers the linked group to manual control; dependent-only detachment preserves that dependent after managed recovery. Native immunity suppresses the dependent when its required root was not applied. Interrupted/uncertain cleanup requires review rather than replaying consequences.

The save-card snapshot now preserves dependency fields. This matters between compilation and actual finalized execution, including later reloads. Existing named-spell routes remain [migration debt](../planning/general-rules-migration.md); this change does not retire them or reinterpret old dependency-free records.

Implementation was delegated to GPT-6 Sol for the rider and linked-runtime slices, with GPT-6 Luna providing a read-only candidate audit. The coordinator integrated the gate regression checks and live harness; a final independent Sol review found no actionable new identity or replay issue.

## Automated checks

- Full suite: **133 passed, 0 failed** (`node --test --test-isolation=none test/*.test.js`), up from 119 before this expansion.
- Source-to-plan checks include custom identity/value/timing changes and rejection of unrecognized mechanics.
- Runtime tests cover exact grant identity, root/child immunity, missing runtime, ambiguity/chains/cycles, separate secondary branches, saved-card execution, recovery, expiry, overlap, deletion, detachment and uncertain writes.
- All 1,994 installed spell/ritual documents recompiled. Shared save plans passing the execution gate increased **47 → 51** (14 basic, 37 degree outcomes), adding exactly the four examples above with no removals. This is a gate count, not verified catalog completion.
- Refreshed [candidate ledger](../../reports/condition-ongoing-coverage.md): 926 structural candidates. Vision of Death's terminal mechanic and the previously refused damage riders remain blocked.

## Live Foundry evidence

Baseline: Foundry **14.367**, PF2e **8.5.0**, module **0.8.2**, disposable **pftest**. Only this module was active. The GM verification harness uses native saves followed by explicit GM degree corrections, native damage and native conditions. No user roles or ownership changed. Results persist on the existing verification macro under `generalRulesVerification`; the harness is [tools/general-rules-verification.mjs](../../tools/general-rules-verification.mjs).

| Check | Result and evidence |
| --- | --- |
| All four degrees, Scramble Body and Divine Wrath | Passed. Critical-failure cards `3NH4UcJV1ubivs4w`, `oVfUzaNTxaQPAI0P`. Correct Sickened/Slowed outcomes and native Divine Wrath damage. |
| Recovery and unrelated overlap | Passed. After deleting original spell, failed Retch retains both; success reduces own Sickened 2 to 1 and retains Slowed; critical success ends both. Unrelated Sickened 4 and Slowed 3 remain. Reconciliation never repeats damage. |
| Custom source and reload | Passed. Renamed, unlinked custom Sickened 3/Slowed 2 cast `l4PTuRZG7lO8TMIl`, card `koET4OhluWhBeyWp`; reload retained both, then partial and full recovery behaved correctly. |
| Native immunity | Passed. Sickened immunity suppresses both conditions (card `7oPKRGlEsn6aJy81`); Slowed immunity leaves only Sickened (`NXLrBFst8qCsD7TO`). |
| Repeated casts and native root deletion | Passed. Casts `MA9tYOfvx5c28zSQ`, `5QB0FNkj9EOvGYtU` remained independent; recovering one preserved the other, then deleting the other's exact native root grant removed its dependent. |
| Root and dependent detachment | Passed. Casts `1OHEpq6ZrHWdXuRM`, `w6iW7i9Jx2GcUoFb`; native contributions preserved with the intended manual ownership. |
| All four degrees, Void Warp and Entreat the Many | Passed. Rank 3 Void Warp uses `4d4 void`, rank 7 Entreat uses `9d8 force`, exact basic-save multipliers and critical-failure-only riders. Critical-failure cards `KlbnC0o0MTqrDv8O`, `CVy0QrFk0W3KaiU5`. |
| Every legal rank for four examples | Passed **32 casts**: Scramble Body 1–10, Divine Wrath 4–10, Void Warp 1–10, Entreat the Many 6–10. Native formulas, condition values, persisted dependencies and linked recovery checked. Rank-10 cards `LKeHA15PTaIeDpAX`, `fEWZYnGwx0KNlqK3`, `5izWfIbRSXYe3db1`, `O411fmTLJjzJPvRG`. |
| Next-caster-turn expiry, removal ON and OFF | Passed. Void Warp survived the recipient turn and ended at the next caster turn in both modes. Cards `TUZSaSQFZoFfKcSC` (ON), `uhYYfDIwdF3RZ5uV` (OFF); settings reloaded between runs. |

### Failures corrected during verification

The initial linked recovery case failed because the actual save-card snapshot discarded the compiled dependency fields. A regression through `start → saved card → apply` reproduced the failure, then passed after preserving those fields; the complete live case passed again. The earlier failed fixture was not silently upgraded or replayed.

Two harness defects were corrected: module collection iteration and a focus-spell caster level that did not support the requested heightened rank. The latter initially rolled the lower native formula; the corrected harness adjusts caster level and asserts the actual heightened formula. Only the corrected rank/outcome runs support the claims above.

### Scope limits

These are source interpretation, save outcome and owned lifetime checks. They do not establish every casting variant, area-target acquisition, spirit-damage interaction, immunity type, module combination or catalog entry. No new player/no-GM or second-GM handoff run was performed in this slice; earlier shared-runtime evidence remains in [the gap-closure report](phase-2-3-gap-closure.md). Native timed-root expiry for a custom linked condition is covered by automated tests, not a separate live timed-root case. The expiry setting was restored and its effective value confirmed after reload. No version bump, commit, public release or Phase 6 work is included.

## Cleanup and source checkpoint

Cleanup passed: removed 83 authored disposable actors, their tokens and 51 associated journals. The two temporary expiry encounters were removed by their test finalizers. Other fixtures, roles, ownership, chat evidence and the verification macro were preserved. The original automatic-removal setting is restored (`true`, effective `true`) and the temporary browser viewport override was reset. IDs above remain historical evidence after fixture deletion.

The [SHA-256 manifest](../../reports/general-rules-phase-2-3.sha256) identifies the runtime/compiler source, tests and verification tools at this checkpoint.
