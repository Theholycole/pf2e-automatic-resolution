# Phase 2 shared save-rider family

2026-09-22 (America/New_York; live evidence timestamps are UTC on September 23).
The 51 unresolved classification spells remain deferred until last. This is the
first family expansion from the grouped Phase 2 worklist, not Phase 2 completion.

## Implemented shared rules

| Rule primitive | Newly enabled official examples | Outcome |
| --- | --- | --- |
| Basic-save damage followed by a bounded failure condition | Tempest Surge | Clumsy 2 for 1 round on failure and critical failure |
| Same failure-condition primitive without a fixed duration | Updraft | Prone on failure and critical failure |
| Creature targeting: undead OR native void healing | Vitality Lash | Basic vitality damage to eligible creatures; Enfeebled 1 until next caster turn only on critical failure |

The compiler recognizes source grammar and produces independent condition data
for each degree. Basic-save damage retains 0, half, full and double multipliers.
There are no new production spell-name, ID, hash or per-spell profile branches.
Names in tests and this report select regression fixtures only. Existing named
adapters remain separate migration debt.

The bounded “On a failure” rider inherits to critical failure in accordance with
[Player Core's degree-of-success rule](https://2e.aonprd.com/Rules.aspx?ID=2263).
The [Tempest Surge source](https://2e.aonprd.com/Spells.aspx?ID=1860) supplies the
failure clause. Unknown additional mechanics, including Speed changes, remain
blocked; this parser does not infer unrestricted consequences from prose.

The target predicate checks a creature's undead trait or PF2e's prepared native
`negativeHealing` HP state. A living creature can qualify through native void
healing. Initially eligible targets are rechecked before application; loss of
eligibility prevents damage and conditions. Existing explicit GM corrections
remain part of the authority model.

Implementation and independent review were delegated to GPT-6 Sol with the
codex-model-team skill; integration, corpus comparison and live testing were
completed by the coordinator.

## Automated verification

- **140 tests passed, 0 failed**, versus 133 at this batch's baseline.
- Source/plan coverage includes four degrees, independent condition objects,
  ranks, renamed sources, removed compendium identity, changed values/durations,
  target grammar and native creature eligibility, late state changes, and refusal
  of unknown clauses and independent compiler gaps.
- A review reproduced unsafe acceptance of an added “Speed is halved” clause.
  The general semantic gate now detects Speed/Speed bonus clauses; regression
  tests cover both failure and critical-failure riders.
- Recompiled **1,994 installed documents**: executable shared save plans increased
  **51 → 54** (14 basic damage plans, 40 degree-outcome plans). Exactly Tempest
  Surge, Updraft and Vitality Lash were added; no previous plan was removed.
- Current enabled routes increased **183 → 186** among **1,827 non-ritual spells**;
  **1,641** have no module route. Of the unchanged 119 native Effect routes,
  51 remain partial/guided. These route counts do not mean full spell completion.
- The provisional primary Phase 2 worklist now has **111 enabled / 460 not enabled**
  among 571 entries. Primary Phase 3 remains **29 / 595** among 624. Memberships
  and dependency signals are planning inferences, not verified completion totals.

## Live Foundry evidence

Foundry **14.367**, PF2e **8.5.0**, module **0.8.2**, disposable **pftest**;
only this module active. Native saves were rolled and then explicitly corrected
by the GM to exercise each degree. Damage and conditions use PF2e's native APIs.
Results persist on the verification macro under `phase2RiderVerification`.
The repeatable harness is [phase2-rider-verification.mjs](../../tools/phase2-rider-verification.mjs).

| Check | Result / evidence |
| --- | --- |
| All four degrees for all three spells | Passed 12 casts at rank 3: correct basic-save multipliers and exact condition branches/values. Critical-failure cards: Tempest `5ZOwicw5UbiGH4gD`, Updraft `YXnW85mdPpVeBi2L`, Vitality `370bFRnU6p9mez1t`. |
| Duplicate finalization | Passed for every degree case: no additional HP change or native items. |
| All legal ranks | Passed 30 casts, ranks 1–10 for each spell. Native damage is rank d12 electricity, twice-rank d6 bludgeoning, and (rank+1) d6 vitality respectively. Condition values do not heighten. Rank-10 cards: `u0O9uvdYS4RsVLy5`, `zLPYG6TVtrU3HHBM`, `85MQ8XgPpUDFfCGu`. |
| Vitality target filtering | Ordinary living and construct creatures excluded (`sQOsT75rd4KQ8oO8`, `A4sxp18kYu8jnZeu`). Undead and living native-void-healing creatures receive damage/rider (`bqtftiO0QBwp5bEu`, `bsuSxyORiPpAybNM`). |
| Eligibility changes before finalization | Passed: removing native void healing before finalization leaves HP and conditions untouched (`6Lp88HppAmJ3DAjN`). |
| Custom description and unrelated overlap | Passed: renamed/unlinked source applies Clumsy 3 for 2 rounds, alongside unrelated Clumsy 4 (`lfP2JxEXncnvZm6t`). |
| Failure-rider expiry | Passed: Tempest Clumsy remains through the recipient turn, then ends at the next caster turn (`dPKFj3G7vTixlzId`). Automatic expired-Effect removal was ON. |
| Native condition immunity | Passed: Clumsy immunity prevents the condition but preserves critical-failure damage (`XAbZTJzrWwNvwcZU`). |
| Source deletion, browser reload, selective removal | Passed: own Clumsy 3 survives deleting the source spell and reloading; deleting its wrapper removes only its grant, preserves unrelated Clumsy 4, and does not replay damage. Same card as custom case. |

For the living void-healing fixture, a native `ActiveEffectLike` rule overrides
`system.attributes.hp.negativeHealing`, and the harness verifies the prepared
value. Direct updates to the base NPC field are overwritten by PF2e preparation
and are not used as eligibility evidence.

## Remaining scope

The family grammar is deliberately bounded. Related candidates with acoustic
or anatomical targeting, breathing restrictions, multiple distinct rider clauses,
weakness Effects, or casting-action choices remain gated. Examples include
Haunting Hymn, Torturous Trauma, Fungal Exhalation, Frostbite and Rip the Spirit.
They need their missing shared primitives before their cohorts can be enabled.

Expiry in this batch was tested with automatic removal ON only. Earlier shared
runtime verification covers removal OFF; no new OFF claim is made here.

This batch does not add fresh player/no-GM, multi-GM, module-interaction or area
acquisition coverage. The existing shared-runtime reports retain their own scope.
It does not migrate old cast records or complete all Phase 2/3 families. No
version bump, commit or publication was performed.

Current lists: [grouped queue](../../reports/phase-spell-batches/phase-2-3-queue.md),
[enablement census](../../reports/spell-enablement.md), and
[structural candidate ledger](../../reports/condition-ongoing-coverage.md).

## Cleanup and source checkpoint

Cleanup passed: **59 authored disposable actors**, their tokens, and **40 associated
journals** removed. The isolated expiry encounter was deleted by its test
finalizer. Other fixtures, roles, ownership, chat evidence and the verification
macro were preserved. Automatic removal remained enabled; no setting change was
needed. The temporary browser viewport override was reset.

The [SHA-256 checkpoint](../../reports/phase-2-rider-family.sha256) identifies the
compiler/runtime, tests, harnesses and resulting reports. Older checkpoint
manifests are preserved as historical evidence.
