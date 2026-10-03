# Phase 2–3 inline damage and linked recovery

2026-09-24. Focused shared-rule expansion, using GPT-6 Sol implementation and
review through the codex-model-team skill. The 51 unresolved review spells remain
deferred. No new production spell-name, slug, ID, or description-hash dispatch.

## Scope

- **Grim Tendrils and Ulcerous Canker:** compose structured initial damage with
  rank-dependent persistent bleed defined by inline source expressions. Success
  applies half initial damage without bleed; failure applies full initial damage
  and bleed; critical failure doubles both. Living-creature eligibility remains
  required. Ulcerous Canker has two initial damage types.
- **Missed Cue:** recognize a bounded harmless-impression sentence only for an
  otherwise empty outcome. The already compiled remaining degrees use native
  damage, Frightened 1/2/3 and Slowed 1 linked to this cast's Frightened on failure
  and critical failure. Existing turn recovery and exact-grant ownership manage
  the dependent condition; unrelated Frightened must not keep it active.

The no-effect grammar requires a complete descriptive sentence and zero damage,
conditions, native Effects, follow-ups, decisions, manual instructions, state
changes or terminal result. It does not generally discard narrative sentences
or any phrase containing “no damage.” Dehydrate and Gritty Wheeze remain blocked;
their unimplemented recurring or trait-based save changes are not ignored.

The inline family must prove its source clauses, direct damage claims, rank
expression and heightening. Persistent consequences are combined with native
initial damage before a single application, rather than counted as future HP
loss. Unsupported expression shapes or other mechanics remain gated.

## Verification status

The preceding checkpoint had **182 passing tests**, **63 executable shared save
plans**, and **195 enabled non-ritual routes**. Its 99-file SHA checkpoint matched
before this batch began.

Automated verification passed: **195/195 tests**, with no failures or skips.
The full 1,994-spell corpus adds exactly Grim Tendrils, Ulcerous Canker and Missed
Cue, with no lost shared save routes: **63 → 66**. See the saved
[route comparison](../../reports/phase-spell-batches/inline-family-route-delta.json).

| Primary worklist | Total | Enabled | Not enabled | Change |
| --- | ---: | ---: | ---: | ---: |
| Phase 2 | 571 | 122 | 449 | +2 |
| Phase 3 | 624 | 30 | 594 | +1 |

The non-ritual census is **198 enabled / 1,629 not enabled** out of 1,827.
Enabled counts denote available routes, including existing partial native Effect
routes; they do not certify every spell's complete behavior. The broad inline
persistent candidate family has 17 spells, seven with shared save routes. The
remaining ten retain their individual blockers in the
[family audit](../../reports/phase-spell-batches/composition-family-audit.md).

Tests cover official and renamed custom sources, changed component IDs and
damage types, exact heightening, contradictory clauses, added mechanics, stale
proof, duration/controller drift, unsupported secondary composition, and native
roll composition using test doubles. Independent review checked preflight before
HP changes, a single native application/receipt, and condition ownership.

The repeatable live harness is [phase23-inline-verification.mjs](../../tools/phase23-inline-verification.mjs),
available from the ongoing verification macro. It checks all four degrees,
every legal rank, IWR, living eligibility, duplicate prevention, Frightened
recovery, exact linked contributions, source loss and reload. It also injects an
invalid second-target roll to check that neither target is changed.

## Live verification — 2026-09-24

Passed in disposable **PFTEST**, Foundry **14.367**, PF2e **8.5.0**, module
**0.8.2** (working-tree code). Only `pf2e-automatic-resolution` was active;
native automatic Effect removal was enabled. The 104-file pre-live checksum
checkpoint matched before testing.

- **All four degrees:** 12 outcomes across Grim Tendrils, Ulcerous Canker and
  Missed Cue. Exact initial HP totals, bleed amounts, Frightened/Slowed values,
  one damage application per affected recipient, group receipts excluding
  future persistent ticks, and duplicate finalization all passed.
- **All legal ranks:** 25 critical-failure casts passed: Grim Tendrils 1–10,
  Ulcerous Canker 1–10 and Missed Cue 6–10. Structured native dice and inline
  bleed heightening matched, and linked conditions retained their values.
- **Resistance and eligibility:** typed void resistance applied once, bleed
  remained native persistent damage, and undead/construct targets were excluded.
- **Turn recovery:** Frightened 3 → 2 → 1 → 0 at recipient turn ends, with Slowed
  retained until this cast's Frightened ended. Both owned Effects then cleared;
  initial damage did not replay.
- **Reload and source loss:** two renamed custom casts survived browser reload
  and deletion of the source spell. Ending each root removed only its linked
  Slowed. Unrelated Frightened 5 and Slowed 3 remained, and HP stayed unchanged.
- **All-target preflight:** replacing the second target's persistent roll with
  an evaluated fire roll produced the exact expected missing/ambiguous inline
  bleed error. Both targets retained 500 HP and no persistent condition; the
  cast stayed in collection. Final evidence card: `HbI29QKDhRYJizLL`.

The initial preflight attempt exposed a harness-only mistake: it called an
internal outcome-roll method through the public API. The harness now seeds
native evaluated rolls explicitly for its deliberately corrupted-state test
and checks the exact rejection reason. The corrected scenario passed. Cleanup removed the batch’s 64 fixture actors
and nine ongoing journals while retaining earlier history.

Live testing found and fixed a shared serialization bug in
`composeInlinePersistentDamageRoll`: localized display formulas were being saved
as parser input. Canonical formulas now wrap each native head expression and
preserve its complete instance flavor. The executor validates and reparses the
serialized formula before HP changes, preserving ordered damage types and
persistence. Native normalization of redundant parentheses is allowed, while
evaluated totals and roll options must stay unchanged.

Six native serialization cases passed: one/two direct components at ×1/×2, plus
zero direct damage at both multipliers. These verify raw syntax, exact persistent
amounts, type/persistence, serialization roundtrip, options and PF2e's own minimum
semantics (zero direct damage yielded 1 at ×1 and 0 at ×2, matching native rolls).
Official all-degree, all-rank, IWR/eligibility and preflight checks also passed
after this correction. The automated suite
was rerun: **195/195 passed**, zero failures or skips.

The native serialization and roll-option compatibility concerns from local
review are resolved for these tested official sources and this PF2e version.
Other modules, future PF2e versions, and arbitrary custom mechanical additions
are outside this live verification. Persistent damage's later ticks and flat
checks remain native PF2e behavior; this batch verifies their creation.

Evidence: [live result summary](phase-2-3-inline-live-results.json),
`/tmp/phase23-inline-live-tests.log`,
`/tmp/phase23-inline-final/official-spell-compiler-report.json`, regenerated
queue/catalog/audits, and the
[pre-live checkpoint](../../reports/phase-2-3-inline-family.sha256) and
[final live checkpoint](../../reports/phase-2-3-inline-live.sha256).
Final cleanup passed and the saved fixture-actor list is empty. Across the
initial run and post-fix reruns, cleanup removed 128 disposable actors and 15
associated ongoing journals; earlier test history was retained. All latest
scenario results are passing in the saved macro evidence.

Earlier checksum checkpoints are retained as historical records.
