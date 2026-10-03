# Phase 2 persistent damage and temporary immunity

2026-09-23. Continuation of the [rider-family batch](phase-2-rider-family.md).
The 51 unassigned review spells remain deferred until last.

## Shared rules

| Rule | Official regression example | Intended outcome |
| --- | --- | --- |
| Basic-save damage plus a critical-failure-only persistent rider | Caustic Blast | Basic acid damage; the separately listed persistent acid amount only on critical failure |
| Independent initial and persistent save damage | Puff of Poison | No damage on critical success; half initial/no persistent on success; full initial and persistent on failure; double both on critical failure |
| Save-wide temporary immunity wording | Deafness | No Deafened on critical success; 1 round/10 minutes/permanent by remaining degree; all eligible outcomes grant 1-minute immunity |

Production selection uses bounded source grammar, component data and formulas,
not spell names, IDs, hashes or new profiles. Renamed detached sources and changed
dice, constants, rank variables and immunity durations are regression fixtures.
Unsupported prose stays gated. The delivery sentence grammar is deliberately
limited: arbitrary descriptive paraphrases are not claimed as supported.

Persistent damage uses native PF2e DamageRoll and native conditions. Initial
application does not deduct future persistent damage, and later native ticks do
not change the original cast's confirmed damage subtotal. Rank expressions are
not heightened twice. Explicit doubling multiplies the persistent damage result,
rather than merely doubling the number of dice. These semantics follow
[Player Core's persistent-damage rules](https://2e.aonprd.com/Conditions.aspx?ID=86).
Native PF2e retains control of end-turn rolls, recovery and damage-type stacking.

Temporary immunity reuses the existing shared marker and eligibility check.
It blocks repeat module resolutions until expiry; manual native rolls and
unrelated third-party macros remain outside that guard.

Two GPT-6 Sol delegates implemented the disjoint parser slices, with independent
read-only review of the persistent slice. The coordinator integrated source
reviews, the queue generator and live verification.

## Review corrections and remaining gates

Review caught unsafe acceptance of additional action-loss/condition/creation
clauses in introductions and disagreement between prose damage and structured
components. Bounded whole-clause checks and adversarial regressions now reject
those inputs. The review also changed critical persistent damage from doubled
dice to multiplication. The final compiler includes those corrections.

Ancient Dust stays blocked: it needs independent selection and multipliers for
structured initial and persistent components. Phantom Pain and Scouring Pulse
retain their condition-linked ending and light/visibility gaps. Fear the Sun and
Touch of Obedience retain their distinct unrepresented conditions. More candidate
findings are saved in [the next-batch cautions](../planning/phase-2-candidate-cautions.md).
These are assigned candidates, separate from the 51 deferred review entries.

## Automated checks and counts

- Full suite: **149 passed, 0 failed**, up from 140 at this batch's baseline.
- Recompiled all **1,994** installed documents. Executable shared save plans
  increased **54 → 57**: exactly Caustic Blast, Puff of Poison and Deafness added,
  with no removals. The final split is 14 basic damage-only and 43 degree-outcome
  plans, including basic saves with riders.
- Regression tests cover degree branches, source/structured-data agreement,
  detached renamed items, changed dice/constants/rank variables, immunity units,
  zero/invalid intervals, extra clauses and preserved independent gates.
- Current module routes: **189 enabled / 1,638 not enabled** among 1,827
  non-ritual spells. Of 119 native Effect routes, 51 remain partial/guided.
- Provisional primary Phase 2 worklist: **114 enabled / 457 not enabled** out of
  571. Phase 3 remains **29 / 595** out of 624. These are route counts over
  planning assignments, not completion claims.

## Live baseline and evidence

Foundry **14.367**, PF2e **8.5.0**, module **0.8.2**, disposable **pftest**;
only this module active, automatic expired-Effect removal ON. Native save rolls
are followed by explicit GM degree corrections so every branch is exercised.
Results persist under `phase2DamageImmunityVerification` on the verification
macro. Harness: [phase2-damage-immunity-verification.mjs](../../tools/phase2-damage-immunity-verification.mjs).

| Check | Evidence |
| --- | --- |
| Native persistent formula classification | Passed for both base formulas and doubled Puff formula: correct acid/poison type, persistent flag true, immediate total 0. |
| Persistent family: all four degrees | Passed corrected 8-cast rerun at rank 3, including exact initial HP, native persistent amounts, DC 15 recovery, confirmed subtotals and duplicate prevention. Critical-failure cards: Caustic `KE9ioxnyaoyX3dRp`, Puff `l2aCrtyRCOCQQnff`. Puff failure `79VoibDqP4w2fJWT` creates 2d4; critical failure creates (2 × 2d4). |
| Persistent family: ranks 1–10 | Passed 20 corrected casts with exact native initial formulas and persistent amounts. Rank-10 cards: Caustic `7S41PiYFHKW0o4Do`, Puff `PEOopl6Hn0P0tWgF`. |
| Native immunity and stacking | Passed acid/poison immunity (`r9Iqci7JzR40MY02`, `ux2lVF9NmlRke179`). An existing stronger 9 persistent acid contribution remains active, with a separate fire contribution preserved (`C3Ktvw5QwQ4zrpiX`). |
| Detached renamed custom source | Passed: changed Caustic persistent constant produces 4 persistent acid at rank 3 (`0tRYuAHv41U5DKsH`). Original spell item then deleted before reload. |
| Persistent reload and native tick | Passed after source deletion and reload. Native end-turn roll `EmDo0opDg1ZJFKyh` applied 4 acid damage through the native damage API; original cast subtotal stayed unchanged. Native DC 15 recovery `8uP4mmCdJKMbugL4` critically failed and correctly retained the condition. |
| Native successful recovery | Passed subsequent ordinary DC 15 checks: failure retained the condition, success `UAu0YlrDYzNYvOFt` removed it without another damage application. |
| Deafness: all degrees and repeat immunity | Passed. Initial cards CS `sof6ZWHK9l2skXQT`, S `TqLXhA2QDBlUXjuD`, F `5YrqlyHzYFUJ7k2M`, CF `jSM2LLPmJLRjtYX6`. Exact native condition durations and 1-minute markers; repeat casts excluded at every degree; HP unchanged. |
| Deafness: legal ranks | Passed ranks 2–10; condition and immunity durations unchanged. Rank-10 card `Rfx3zZHYYPZ4Iyez`. |
| Deafness: reload and immunity expiry | Passed. Reload preserved the permanent condition and immunity. Aging only the disposable immunity marker by 61 seconds expired it and allowed another module resolution (`sw8KYguj1TOu25pl`), while permanent Deafened survived. The world clock was not advanced. |

## Live failure and correction

The first persistent all-degree run failed on Puff of Poison critical failure
(card `DFw8RfHpT1MlUG4z`). The native receipt showed the shared roll correctly
applied 16 initial damage, but the new formula `2*((ceil(@item.level/2))d4)[persistent,poison]`
was interpreted by PF2e as untyped immediate damage and applied 14 more, with no
persistent condition. Node tests could not prove native parser behavior.

Wrapping the entire multiplied expression before its damage annotation preserves
the intended category: `(2*((ceil(@item.level/2))d4))[persistent,poison]`.
A native formula-classification check now asserts persistent category, damage type
and zero immediate total before the corrected live casts. The earlier failed
fixture is historical evidence and is not replayed or silently repaired.

## Queue maintenance

The [Phase 2–3 queue](../../reports/phase-spell-batches/phase-2-3-queue.md)
now includes current enabled/not-enabled totals for each primary phase and rule
family, plus named enabled/not-enabled members of every suggested batch. Its
snapshot timestamp comes from the runtime route census. A planning-only progress
manifest preserves completed batch examples and their evidence when suggested
next cohorts change. Regenerate the census and queue after each batch; the work-order document now records this requirement.
“Enabled” remains an available route, including partial native Effects, not a
claim that every spell variant is fully verified.

## Scope limits

This batch does not test every IWR combination, casting variant, area acquisition,
player/no-GM or multi-GM scenario. Parser support is bounded; unrelated clauses
and structured persistent-component combinations still require further work.
No change to old cast records, module version, commit or publication is included.

## Cleanup and checkpoint

Cleanup passed: **65 authored disposable actors**, their tokens and **14 associated
journals** removed, including the failed first persistent run's fixtures. Existing
world fixtures, roles, ownership, chat evidence and verification macro were
preserved. No world setting or world-time change was made. The temporary browser
viewport was reset. Temporary inspection code was removed; the native formula
classification check remains as a reusable regression check.

The [SHA-256 checkpoint](../../reports/phase-2-damage-immunity.sha256) identifies
this compiler/runtime, test, harness and reporting state. Older checkpoint
manifests are preserved as historical evidence.
