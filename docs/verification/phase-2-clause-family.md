# Phase 2 condition-clause family

2026-09-23. The 51 unresolved classification spells remain deferred. This batch
extends shared rules; it does not complete Phase 2 or Phase 3.

## Implemented behavior

- **Unraveling Blast:** a standalone typed half-damage sentence resolves only when
  its type matches exactly one structured damage component. Success applies half
  mental damage; failure applies full damage and Off-Guard until the target's
  upcoming turn; critical failure applies double damage, Stunned 1 as action
  debt, and a separate Off-Guard effect until the caster's next turn.
- **Touch of Obedience:** bounded pronoun-based temporary immunity requires an
  adjacent target save sentence matching the item statistic. All eligible
  outcomes grant one-hour immunity. Success/failure apply Stupefied 1/2 until
  the caster's next turn ends. Critical failure applies Stupefied 2 for one
  minute plus untimed Prone, which can be removed through native condition
  management after Standing.
- **Existing-route corrections:** Eagle's Cry no longer gives Frightened the
  subsequent Fleeing timer; Painful Vibrations no longer gives Sickened the
  subsequent Deafened timer. Gravity Wave, Blazing Fissure and Stormburst now
  apply the unlinked critical-failure Prone previously omitted by the compiler.

A repeated condition predicate establishes a new duration scope; a simple
conjunction still shares its stated duration. Unsupported restrictions and
uncompiled condition instructions remain gated. No new production spell-name,
ID, hash or per-spell profile dispatch was added. Names in tests select fixtures.
Implementation and review used GPT-6 Sol through the codex-model-team skill.

The queue generator now defines all nine implementation phases and explains
Phase 2 application versus Phase 3 ongoing management. It keeps primary worklist
assignments distinct from cross-phase requirements and regenerates enabled and
not-enabled lists from current routes.

## Automated and corpus verification

**165 tests passed, 0 failed**, versus 149 at this batch’s baseline.
The final installed-source compiler snapshot is dated 2026-09-23T09:35:07.295Z.
Shared executable saves increased from 57 to 59.

The installed corpus contains 1,994 documents. The combined change enables
exactly two additional save plans, **57 → 59**, without losing an existing route.
Among the previous 57, the only outcome-effect changes are the five corrections
listed above. Source tests cover renamed/detached spells, altered values and
durations, mismatched/multiple damage types, malformed Prone predicates,
ambiguous pronouns, unsupported conditions/restrictions and immunity preambles.
Extra typed damage claims must match available structured components one-to-one
by formula, type and persistent category; additional or duplicate claims gate
resolution rather than being silently omitted.

Current non-ritual routes: **191 enabled / 1,636 not enabled** among 1,827 spells.
The 59 shared saves comprise 14 basic damage-only and 45 degree-outcome plans;
119 native Effect routes remain, including 51 partial/guided routes. Route
availability is not a claim of full spell completion. The primary Phase 2
worklist is now **116 enabled / 455 not enabled** among 571 entries; primary
Phase 3 remains **29 / 595** among 624.

## Live Foundry verification

Foundry **14.367**, PF2e **8.5.0**, module **0.8.2**, disposable **pftest**; only
this module active. Native saves were followed by explicit GM degree corrections.
Automatic expired-Effect removal was ON. The repeatable harness is
[phase2-clause-verification.mjs](../../tools/phase2-clause-verification.mjs);
results persist on the verification macro under `phase2ClauseVerification`.

| Check | Result and representative evidence |
| --- | --- |
| All four degrees for both new spells | Passed 8 casts at rank 3, plus four immunity repeat casts. Exact damage, condition values, independent lifetimes and duplicate-finalization checks passed. Critical-failure cards: `Ijbod8NqY05rWKzU`, `6cbcnwIPs8RkMpWk`. |
| Every legal rank | Passed 20 casts, ranks 1–10. Unraveling Blast scales from 2d4 to 29d4 mental damage; conditions and immunity do not heighten. Rank-10 cards: `W83VxRxMaN3Adylo`, `dXziGot9l6R1awbZ`. |
| Actual turn boundaries and Stunned recovery | Passed after correcting the upcoming-turn calculation. Failure Off-Guard ends at target turn start (`q2NNkLOZwuOsQFt9`); critical-failure Stunned waits for confirmed lost actions and resolves independently of Off-Guard (`B8T0nGepOENl8AMK`). Touch success/failure survive caster turn start and expire at its end (`nzoKtnjKrUbqVMmw`, `VSVYdhCFCwN630zk`). |
| Living target predicate | Living target accepted, undead and construct excluded; no conditions or immunity on ineligible targets. Changing an eligible target to undead before finalization prevents application (`qaMJ7FntyiuFOiKU`). |
| Renamed custom source and independent lifetimes | Changed Stupefied duration to two minutes and immunity to two hours, with separate untimed Prone and unrelated Stupefied 3 (`T4eS0JVf9G9M9gJ0`). |
| Source deletion, reload and selective expiry | All own contributions survived source deletion and reload. Aging only the test Stupefied effect expired it while Prone and unrelated Stupefied persisted. Native Prone removal cleared its contribution while immunity persisted; aging only the immunity marker expired it. No damage replay. Same custom card. |
| Existing timing corrections | Eagle's Cry (`zvTx47wiR5emp6CB`) and Painful Vibrations (`KxaRphPw3G8PDHyF`) create independently timed conditions; deleting the timed effect preserves the untimed condition and HP. |
| Previously omitted Prone | Gravity Wave (`DlBLLC0yDnunYbue`), Blazing Fissure (`OZy1PY9W8qp577rZ`) and Stormburst (`sm367TH00dYOmPEe`) apply critical-failure Prone with damage; Stormburst retains Stunned 1. |

The first turn-boundary test failed: an explicit “until the start of its turn”
parsed with offset 0 was stored as one native round and persisted through the
first upcoming target turn. The shared native timing helper now handles explicit
offsets 0 and 1 when mapping an upcoming actor turn to PF2e's zero-round deadline.
The identical live test then passed; unit tests cover before/current/after turn
positions, ambiguity and out-of-combat fallback. Failed evidence remains in the
macro history. No old cast records were migrated.

## Limits and cleanup

Prone removal testing uses native condition removal after an explicitly assumed
Stand; this batch does not execute or spend a Stand action. Stunned loss still
requires confirmation. Existing runtime reports retain their separate coverage
for removal OFF, player/no-GM, GM handoff and module interactions; this batch does
not claim fresh tests of those scenarios. Expiry testing ages only disposable
Effects and does not move the world clock directly.

Cleanup passed: **61 authored disposable actors**, their tokens and **41 associated
cast journals** removed. Both isolated turn encounters were deleted by their
finalizers. Other fixtures, roles, ownership, chat evidence and the verification
macro were preserved; automatic removal remained ON. The temporary browser
viewport override was reset. The [SHA-256 checkpoint](../../reports/phase-2-clause-family.sha256)
identifies the source, tests, harness and regenerated reports; older manifests
remain historical evidence.
No version bump, commit or publication was performed.

Current lists: [queue](../../reports/phase-spell-batches/phase-2-3-queue.md),
[route census](../../reports/spell-enablement.md), and
[structural coverage ledger](../../reports/condition-ongoing-coverage.md).
