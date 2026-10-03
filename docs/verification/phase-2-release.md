# Phase 2 — outcome application release evidence

Status: implemented and verified for the existing executable save-outcome families. No claim of full catalog completion or repaired ongoing expiry.

Baseline: Foundry 14.367, PF2e 8.5.0, module manifest 0.8.2, disposable `pftest`. Working tree based on `92b4fd488f4d73eeed74ad77a78a65411e28bb47`; see the runtime hash file for the exact release contents. Verification ran as the original Gamemaster. The temporary second GM remains disabled. No new account permissions or system settings were changed.

## Delivered

- GM condition-value and duration corrections, calculated-value restoration, original-value notes, stale-revision protection, and invalidation on primary/secondary rerolls or degree changes.
- Native damage receipts, per-target applied damage, and **Total damage to group**. Native IWR, temporary HP and overkill are reflected. Future persistent ticks are excluded. Confirmed partial totals remain visibly incomplete after an interrupted application.
- Per-cast native condition wrappers preserve stacking and selective removal. Public Apply now shares the same cast queue as Finalize and corrections.

## Automated checks

65 tests passed, zero failures or skips using bundled Node with `--test --test-isolation=none`. Existing compiler, immediate-secondary-save, targeting, authority, direct native Effect mapping, sequence, and rollback checks pass. Added checks cover condition corrections/restoration/invalidation, stale/unsupported/applied corrections, native receipt semantics, ambiguity, persistent-only zero damage, missing legacy receipts, separate healing, and deduplicated totals. `git diff --check` passed.

## Live Foundry evidence

Harness: `tools/outcome-verification.mjs`, macro `fAVC8lq6N6RvMQkU` (**PFTEST — Outcome verification**, hotbar 5). Complete snapshots and assertions persist in its `pf2e-automatic-resolution.outcomeVerification` flag. Native random saves were rolled, then corrected through the public GM API to select the specified branches. No extra damage approval was introduced.

| Case | Expected | Observed |
| --- | --- | --- |
| Noise Blast rank 3, mixed saves, resistance 3, weakness 5, sonic immunity, and 1 HP + 2 temporary HP overkill target | 3d10 shared damage; recipient totals reflect save and native adjustments; adjusted deafened duration applied | Passed. Rolled 15; receipts **4, 20, 0, 30**, group **54**. HP **496, 480, 500, 0**. Overkill counted 30 despite only 3 combined HP. Deafened adjustment became 2 rounds, end of turn. Collector `3lotI6yvlACZLmzJ`. |
| Reblooded rank 3, browser correction dialog | Change clumsy 1 to 3 and 1 minute to 2 rounds/end of turn; preserve original values; no immediate damage | Passed through visible dialog. Result shows Clumsy 3, edited duration and original-value note. Group damage **0**, HP 500. Collector `oAwB69fbCT4tkHno`. |
| Reblooded repeat at rank 5 with pre-existing clumsy 1 | Separate cast wrappers; highest native condition applies; deleting first cast preserves second and unrelated condition | Passed. First cast clumsy 3 and second clumsy 2 coexist. Native value was 3, then 2 after deleting the first wrapper. Unrelated clumsy 1 and independent persistent damage survived. Second collector `O5rFdXw1sl7B2zlj`; actor `mStPVHs9s0Atjzbf`. Reblooded has no heightened damage increase: critical failure remains 3d6 persistent acid. |
| Known missing token before application | Stop every recipient before damage, remain correctable | Passed. Both actors stayed at 500 HP. Restored the disposable token with its original identity. |
| Noise Blast rank 2 interrupted at second native-damage entry | Keep first confirmed receipt; stop for review; no blind retry; visible incomplete subtotal | Passed on reloaded final runtime. First receipt **13**; collector `qpMTMUqXxFsCg6sl` shows incomplete confirmed subtotal **13**. Second operation deliberately threw; subsequent Finalize rejected without further HP change. |
| Concurrent duplicate Finalize | One application and one result summary | Passed. First fulfilled, second rejected; exactly one summary. Collector `cZMSEvERJgs5EMqH`. |

Final runtime regression: reloaded Foundry and repeated the Noise Blast check after tightening ambiguous-receipt handling. Rolled **17**, confirmed **5, 22, 0, 34**, total **61**, collector `q0F1UODAkdbyCrxS`. The visible result card matched native receipts and exposed expandable damage calculations and duration/adjustment details. The persistent-damage summary also has an explicit applied indicator backed by native condition IDs.

The intentionally interrupted cast remains Needs review as evidence; it was not retried. Test actors, cards, and the macro remain in the authorized disposable world for inspection.

## Scope and remaining gates

E1 outcome checks pass for these shared workflows. Existing compiler/runtime tests cover branch selection and native mapping, and Phase 1 supplies unchanged authority/exclusion behavior. This release did not repeat a two-GM handoff: coordinator selection and its UI-refresh implementation are unchanged, and condition corrections use the same guarded API and queue.

E2 Guidance/Shield expiry, action-use distinction, missing source, and successor cancellation require Phase 3's durable lifecycle work. The previously observed retained-expiry and disconnected-GM successor failures remain open. Exact-effect counteracting, healing workflows, additional native-effect branches, and catalog completion are not implied by these save-outcome results. Native receipt observation is pinned to PF2e 8.5.0; concurrent ambiguous updates stop for review rather than guessing.
