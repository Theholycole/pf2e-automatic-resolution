# Phase 3 — ongoing spells release verification

Baseline: Foundry 14.367, PF2e 8.5.0, module workspace based on
`92b4fd488f4d73eeed74ad77a78a65411e28bb47`, manifest 0.8.2.
The installed module is a symlink to this workspace. Tests ran in disposable
`pftest` on September 19–20, 2026. No release tag or commit has been made.

## Implemented

Durable JournalEntry cast records retain recipient contributions, pending
successors and recurring obligations independently of chat and native Effects.
One active GM coordinates writes. Native PF2e expiry remains authoritative;
confirmed expired contributions are removed even with automatic removal off,
including granted conditions. Confirmed ending consequences are recorded once;
interrupted work stops for review. GM ending, detachment and manual takeover
preserve permanent or independently managed contributions.

An ongoing overview groups controls with each cast. Relevant owners see their
casts; GMs see all. Grouped reminders link to the overview. Native save dialogs
remain provisional until GM finalization. Petrify, Floating Flame and Bless
have explicit baseline profiles, with original native mechanics checked before
application. Custom basic-save aura declarations require GM membership review.
Sustain uses explicit controls; a generic native Sustain message does not identify
which cast was sustained and is not treated as proof.

## Observed live results

| Case | Observed result |
| --- | --- |
| Guidance and timed Deafened grant, removal ON | Passed: one successor, wrapper and granted condition removed, backward clock did not resurrect or duplicate. Cast `FQVjVCRUdAFCapsq`. |
| Same, effective removal OFF after reload | Passed: same cleanup and successor behavior. Cast `rNyi8gIupXaz8TNU`. Setting restored ON. |
| Shield action versus ordinary deletion | Passed: explicit Shield Block creates cooldown; sheet deletion does not. Casts `nIknUnbEA3KVlUfO`, `iObR8bRffa0OFtMh`. |
| Petrify rank 6 | Passed: native initial save, Slowed 1, one turn-end obligation, recurring incapacitation trait, corrected success removes own Slowed and ends. Cast `of7o1qFb3GzJ0Qkr`. |
| Petrify rank 8 | Passed: confirmed two-action target, initial critical failure produces permanent native Petrified; ending preserves it. Cast `08yDTJ9RSvmSzoUz`. |
| Floating Flame rank 4 | Passed: native 5d6 damage (18 initial, 16 next-round Sustain), repeated same-round Sustain creates no second damaging exposure; confirmed missed Sustain ends and deletes Region. Cast `1xNMZjeTiQXYjwRA`. |
| Bless expansion | Passed: native badge increased once, duplicate same-round expansion rejected. Cast `qfBeOACNDMutTmsc`. |
| Bless ally mechanics | Passed: native 15-foot aura, ally +1 status attack modifier, propagated bonus removed after native deletion event. Cast `uBWL0HxAeeqEfFjH`. |
| Controlled custom aura | Passed: no save before membership confirmation, native damage, re-entry/recovery deduplication, ambiguous source placement enters review. Cast `rbCJb53gg0LGBdIa`. This is structural evidence, not an official Electric Arc aura claim. |
| Interrupted successor | Passed: deliberately persisted applying state stops for review across repeated recovery without replay. Cast `HFDWaXwWUjk6xNU1`. |
| GM handoff and return | Passed: durable pending successor completed exactly once with GM2 (`WCHvGCPipQMSG3pB`), then original GM (`rW96bfNVu9Z4WVK7`) resumed at unchanged revision 5. Cast `pIpQ7nIyB05IuDGO`. GM2 disabled afterward. |
| World-time jump/source loss | Passed: missed saves enter review without rolls, confirmed timing resumes, token deletion alone preserves spell, missing source spell preserves contribution for review. Cast `cPpZ4HziKiUpcjqk`. |
| Player controls and transport | Passed after world relaunch: native dialog opened; submitted native roll 6 + 10 = 16, Failure, reached GM and remained provisional. Actual unauthorized end request rejected. Cast `BwYmwCUgF522g2Fn`. |
| No GM / temporary access cleanup | Passed: no coordinator fallback or cast revision change. Original GM finalized fixture, then removed actor, journal, macro and hotbar access. Player logged out; temporary GM role 0. |
| Floating Flame rank 2 / source lifecycle | Passed: native 3d6; token deletion preserves the cast; unconscious/dead caster ends and cleans Region; missing actor preserves Region for review. Casts `wJhs3cmfQEoo3ehU`, `gUnNmHi8rxAwP7VC`, `fT0SvVEdVY52Tj3R`. |
| Off-scene synthetic expiry | Passed: synthetic Guidance expired with one successor, base actor unchanged. Cast `i0jwEs2XA0ykdK1V`, scene `fsem7q9cZ6Op2AjH`. |
| Native Flame placement | Passed: PF2e interactive canvas placement returned a native Region; ending removed it. Cast `7JEv9SOviAQ9CM7a`. |
| Exact-zero / tied initiative / anchors | Passed: roster 20/20/10; target-anchored expires at target, caster-anchored survives tied target then expires at caster, turn-end survives both tied turns and expires at lower initiative. Actual Guidance retains caster origin and creates one successor. Cast `NUQTAQwytoM5Qw67`, combat `gAs3DD9saLylzUjA`, world time 137→143. |

Live fixtures and detailed reports are retained in
`Macro.BNZ7O7p2tRsjh3ew`, flag
`pf2e-automatic-resolution.ongoingVerification`. The harness is
`tools/ongoing-verification.mjs` (hotbar slot 6). Reports retain failed development
runs as well as successful reruns; do not treat every recorded run as passing.

## Issues found and corrected during verification

- Foundry normalizes `<hr />` to `<hr>` on copied spell descriptions. Profile
  comparison now normalizes that formatting while checking mechanical fields.
- Exposure keyed by dotted actor UUIDs was unsuitable for Foundry flag updates.
  Exposure is now an array, with a regression test for repeated damage and zero
  damage releases.
- Test turn changes must await reconciliation to establish a confirmed missed
  Sustain; skipped/uncertain transitions intentionally require review.
- Native token animation can make immediate distance measurements stale. Aura
  suggestions wait for native movement completion.
- Native aura cleanup is debounced by 50 ms. Its live test waits for deletion,
  rather than assuming a debounced method returns a completion promise.
- An idle encounter must not make out-of-combat casts require review on every
  reload. Corrected and regression tested.
- Player roll transport exposed a missing module manifest `socket: true`.
  Declaration added; world relaunched, registration verified true, and player transport/permission/no-GM checks passed.
  Earlier phase reports are historical evidence; this finding means their
  player transport claims should not substitute for current verification.

- Native Effect creation now retains the source actor in PF2e's context so
  exact-zero expiry distinguishes the caster from a tied-initiative recipient.
  Verified with actual Guidance in addition to native wrapper fixtures.
- Newly confirmed aura recipients receive observer access to their durable cast.
  Excluding a recurring Petrify save preserves its previously confirmed Slowed
  contribution and later saves. Both have automated regression coverage.
- Canceling the Flame path confirmation no longer submits Sustain. An unresolved
  player path at turn end stops for manual review instead of assigning exposure
  to a later round. Automated regression verifies that stop.
- The first off-scene fixture incorrectly assumed a fresh NPC had zero Items.
  Rerun compares the base actor's actual before/after Items and passes.

## Release verdict and boundaries

Phase 3 implementation and the selected E2/L1–L5 release cases pass on the
stated baseline. The ongoing controller is now usable for existing mapped native
Effects, verified Petrify, Floating Flame, Bless, and explicitly declared custom
basic-save auras. This is not a catalog-wide support claim or completion of
Milestone 1; phases 4–9 remain.

The GM confirms organic targets and Petrify action budgets, Flame path/range and
membership, and custom aura eligibility/walls. Flame movement is a native Region
with manual path review, not automatic pathfinding or collision validation.
Generic native Sustain messages cannot identify a cast reliably, so use the
explicit control. If a player's Flame path remains unresolved at turn end,
manual reconciliation is required. Missing source documents, skipped timing,
and uncertain writes stop for review; uncertain outcomes are never replayed.
Custom aura evidence proves structure only, not an official Electric Arc aura.
Changed spell mechanics fail profile verification. No spell resources are spent
or refunded by these ongoing controls.

Latest automated run: **83 tests passed**, Node 24.19.0,
`node --test --test-isolation=none`. Syntax and diff whitespace checks passed.
Live results above are separate evidence. Source hashes are recorded in
[phase-3-source-sha256.txt](phase-3-source-sha256.txt). No release version, commit,
or tag was created. Temporary test access is removed; original GM session is
left open. Disposable actors, journals and failed development reports remain
available as evidence.
