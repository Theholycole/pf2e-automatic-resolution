# Spell milestone release evidence

Release matrix. **Phases 1–4 selected release cases passed**; execution reports
retain the exact scope and boundaries for [Phase 1](../verification/phase-1-release.md),
[Phase 2](../verification/phase-2-release.md), [Phase 3](../verification/phase-3-release.md)
and [Phase 4](../verification/phase-4-release.md). [Phase 5](../verification/phase-5-release.md) adds verified transformations. Phases 6–9 remain pending.
Baseline: Foundry 14.367 / PF2e 8.5.0, disposable `pftest`. Each execution record
retains versions, roles, fixture identities, inputs, expected and observed outcomes,
and discrepancies. Historical checkpoints below are not the current verdict.

| ID / phase | Fixture and setup | Required observations and selection rationale |
| --- | --- | --- |
| C1 / corrections | Fireball rank 3; owned player target, two unlinked copies and one linked target. Exclude after rolling, restore, Finalize. | Retain rolls and identities; excluded target receives nothing; restore reuses result; each included token resolves once; preserve three-card workflow. |
| C2 / corrections | Noise Blast rank 2; mixed degrees; Failure→Success override followed by reroll. | Retain original dice and correction note; effective degree controls outcome; reroll clears override; 2d10 base damage and degree-specific conditions follow native adjustments. |
| C3 / corrections | Phantasmal Killer rank 4; override into/out of Critical Failure, with an existing secondary result. | Create/remove Fortitude stage; invalidate stale secondary result when recreated; Finalize waits for every required save; native degree/incapacitation behavior preserved. |
| C4 / corrections | Reblooded rank 3, living and undead recipients; toggle automatic and manual Unaffected both ways. | Preserve original eligibility explanation; this-cast override controls application and final eligibility recheck; restored affected target completes saves; no lasting immunity. |
| C5 / authority | Player attempts corrections; two GMs make stale edits; reload while collecting; edit after Finalize starts. | Only authorized coordinator writes; stale revisions cannot replace later results; corrections persist; finalized/uncertain work stays locked. |
| E1 / outcomes | Noise Blast and Reblooded, base/heightened ranks, mixed outcomes, repeated casts, pre-existing conditions. | Separate cast ownership and duration; unrelated state survives cleanup; receipts sum confirmed damage after native IWR, excluding future persistent ticks and labeling partial uncertainty. |
| E2 / native Effects | Guidance and Shield, repeat casts, action use, expiry, sheet deletion, successor cancellation. | Correct native Effect and immunity; distinguish action-used from effect-ended; retain pending work independently of deleted primary Effect. |
| L1 / expiry | Guidance, timed native Effect, timed Deafened wrapper; world time and turns; removal ON/OFF after reload. | Reconcile native expiry without assuming Item hooks; inspect wrapper/grantee cleanup separately. [Baseline experiment](../research/native-expiry-experiment.md) completed with gaps; new controller remains unverified. |
| L2 / recovery | Same fixtures across reload, backward time, two GMs plus player, pending-prompt disconnect, interruption before/after consequence write. | Durable obligation; one coordinator; proven receipt prevents duplicate application; uncertainty requests review; backward time cannot replay confirmed work. Baseline lost-prompt/reload/backward-time observed; write interruption remains pending. |
| L3 / recurring | Petrify rank 6/8, contrasting provisional outcomes on successive turn-end saves. | Native dialogs/corrections each time; correct progression/end rules; one obligation per target/trigger; no automatic missed-save rolling. |
| L4 / Sustain | Floating Flame rank 2/4; explicit and reliably identified native Sustain; missed deadline; missing, unconscious, or dead caster. | Spell-specific movement/damage/maintenance limits; uncertain attribution requests review; ending removes only temporary cast contributions. |
| L5 / aura | Bless rank 1 and a controlled custom save-bearing aura with explicit trigger/exposure rules; enter/leave, reload, uncertain membership. | Native Bless radius/bonus; save reminders obey declared trigger and exposure limit; GM reviews uncertain membership. Custom fixture proves controller structure only. |
| I1 / immediate | Heal rank 1/3 with all action variants; Force Barrage rank 1/3 split targets; Disintegrate rank 6 hit/miss/critical plus save. | Correct variant targeting/formulas; native damage/healing; dependent steps wait for prior outcomes; no double resource spending; cancellation identifies already-spent resources. |
| F1 / forms | Animal Form rank 2/4/5 and Dragon Form rank 6/8; legal selection, space, granted attacks/actions, usage/recharge. | Native statistics and restrictions mechanically verified; legal context; no partial form on canceled/invalid placement. Use the [form checklist](../research/form-workflow-evidence.md). |
| F2 / reversion | Same forms with unrelated actor edit, overlapping Effect, reload, expiry/Dismiss. | Remove only this cast's contributions; preserve unrelated and overlapping changes; uncertain reversion stops for review. |
| S1 / summons | Summon Animal rank 1/3; missing data, obstructed placement, two casts, edited summon, GM detachment. | Eligible selection; no substitution; legal placement; caster controls clone without changing original actor; linked temporary creation cleans up, detached creation remains. |
| P1 / spatial | Wall of Stone rank 5; obstructed/legal placement, attacks on created wall, GM edits, cast ending. | Geometry preview; real collision/sight/targeting and specified durability; preserve the spell's actual permanent consequences instead of generic expiry cleanup. |
| P2 / movement | Translocate rank 4/5; legal/illegal destination, another available scene, unavailable destination scene. | Variant restrictions; authorized destination choice; atomic movement or review; absent map produces explicit narrative placement handoff. |
| R1 / rituals | Binding Circle and Geas; four confirmed ceremony outcomes, missing DC, legal heightening, later trigger. | Missing inputs block affected steps; immediate/backlash/later branches use persistent record; no guessed DC. |
| R2 / ritual lifetime | Awaken Curse and Imprisonment; absent caster/chat, lasting consequences, affliction handoff. | Initial saves/immediate consequences, explicit delegated progression, and actual ending conditions; preserve permanent/independent results. |
| A1 / catalog | All 1,827 spells + 43 included rituals, meaningful variants and legal ranks. | Every entry linked to semantic/data assertions; reuse live evidence only for identical behavior; add cases for distinct mechanics. Report 123 ritual exclusions and 1 skipped exception separately. |

## Cross-cutting variations and execution gate

Apply authority/recovery checks to each distinct mutation path. Include exact-zero
duration, caster/target anchors, tied initiative, turn-end expiry, skipped or
backtracked turns, world-time jumps, off-scene/synthetic tokens, overlapping
grants, absent-GM intervals, and recognized/unrecognized homebrew. The baseline
experiment did not implicitly pass these variations.

Before executing each selected spell case, record its concrete actor setup,
rank/variant, roster, DC, degree branches, expected numeric damage/healing,
native Effect identities, duration/anchor, and cleanup from pinned baseline
data. Incomplete expectations mean the fixture is not ready to run. This is
test preparation, not a new product-policy interview.

Each release passes its cases and affected regressions and reports remaining
scope. Baseline failures motivate implementation; they are not release passes.
Final milestone completion additionally requires A1 with no unaccepted gaps
and every selected live case passing. Retest affected cases when code, data,
or relevant settings change; retain historical evidence with its version.

## Phase 1 implementation checkpoint — 2026-09-19

Working-tree implementation adds coordinator-only pre-Finalize corrections: exclude/restore,
primary/secondary degree changes with retained original rolls, cast-local eligibility overrides,
stale revision rejection, reroll override reset, and secondary branch invalidation. Finalization
and corrections share a cast queue, including API finalization. No release claim yet.

Automated checks: basic-save, runtime, and debug test files pass. Added behavioral checks cover
retained rolls, stale corrections, secondary branch reset, player correction rejection,
Unaffected finalization, and locked completed casts. Full compiler suite has 34 ENOENT failures
because its hard-coded external spell/effect fixture directories are absent; 9 self-contained
compiler checks pass. This is a verification limitation, not a passing full suite.

Live smoke test on Foundry 14.367/PF2e 8.5.0, original Gamemaster, removal setting restored ON:
reloaded module and used retained Fireball rank 3 / Tzitzimitl cast in pftest. Native save dialog
rolled natural 9 +31 =40, Success vs DC39. GM changed it to Failure; UI retained original dice
and showed Success → Failure with ×1 damage. Exclude collapsed the row; Restore recovered
that same roll and override. Mark Unaffected then one-click Finalize produced an Unaffected
result and locked the collector. Duplicate eligibility wording observed and corrected afterward.
This is partial C1/C2/C4 evidence only; full C1–C5 fixtures, player browser, competing GM,
reload persistence, and live secondary-save corrections remain pending. The old cast's stored
damage was rendered Untyped; this smoke test did not validate damage typing or application.

## Phase 1 release verification — 2026-09-19

C1–C5 are now verified, with 59 automated tests passing and live native-token,
damage, condition, player, multi-GM, reload, concurrency, and visible-handoff
checks. Two runtime defects were fixed: tokenless damage now stops before actor
mutation, and visible correction controls refresh when coordinator authority
changes. The compiler suite now uses a reproducible local fixture export.
Full execution details, historic failed attempts, fixture IDs, source hashes,
and remaining milestone scope are in the [Phase 1 report](../verification/phase-1-release.md).
The preceding checkpoint is historical, not the current release verdict.

## Phase 3 release verification — 2026-09-20

E2/L1–L5 selected cases pass on Foundry 14.367 / PF2e 8.5.0, including
removal ON/OFF, Guidance versus Shield, Petrify 6/8, Flame 2/4, native Bless,
explicit custom aura membership, player transport/no GM, GM handoff, interruption,
source loss, native placement, exact-zero tied initiative/anchors, and off-scene
synthetic expiry. There are 83 passing automated tests. The
[Phase 3 report](../verification/phase-3-release.md) records fixture IDs, failures
corrected during verification, hashes, and explicit manual-review boundaries.

## Phase 4 release verification — 2026-09-20

I1 selected profiles pass: Heal rank 1/3 action variants and mixed recipients,
Force Barrage rank 1/3 split allocations with native resistance, and Disintegrate
attack/save dependencies, rank/target corrections, explicit objects and zero-HP
consequences. Native resource spending/cancellation, visible MAP/save dialogs,
blind visibility, player/no-GM authority, GM handoff and interrupted/partial
application were verified. There are 93 passing automated tests. See the
[Phase 4 report](../verification/phase-4-release.md) for IDs, source hashes and
manual-review boundaries. Other immediate profiles remain catalog work.

## Phase 5 release verification — 2026-09-20

F1/F2 representative profiles Animal Form, Dragon Form and Pest Form passed
rank, native statistics/Strikes, contrasting movement/attacks, breath damage and
recharge, cancellation, resource preservation, selective reversion, expiry with
removal ON/OFF, player/no-GM authority, GM handoff and interrupted-write no-replay
checks. All 101 automated tests pass. This does not establish coverage of all
form spells or NPC actors; Sovereign Dragon remains withheld. See the
[Phase 5 report](../verification/phase-5-release.md) for evidence and boundaries.
