# Phase 4 — immediate spells — verified

Baseline: Foundry 14.367, PF2e 8.5.0, manifest 0.8.2, workspace based on
`92b4fd488f4d73eeed74ad77a78a65411e28bb47`. Tests ran in disposable `pftest`
on September 19–20, 2026. No release commit, version bump or tag was created.

## Implemented scope

Verified immediate profiles for Heal, Force Barrage and Disintegrate extend the
native spell card with **Resolve Immediate Spell**. Native PF2e owns casting,
slot spending, variants, check dialogs, damage/healing preparation and application.
The module retains target identities, original rolls, GM corrections, dependencies,
application receipts and recovery state on a durable chat record.

Heal reuses action variants, prompts for missing choices, suggests recipients
from the native emanation Region, and requests membership/willingness/range review.
Living-only healing resolves directly; mixed living/undead casts wait for native
Fortitude saves and GM finalization. Ineligible recipients remain visible with
explicit GM eligibility overrides. Force Barrage validates every shard allocation
and combines damage per creature before native bonuses, resistance and weakness.
Disintegrate collects a native attack followed by Fortitude on a hit, lowers the
save result on a critical hit, and preserves gear when the creature disintegrates.
It also supports explicit GM-selected Tile/Drawing objects with confirmed AC,
eligibility and volume; an attack must hit before that document is destroyed.

GM target replacement requires fresh attack/save results. Rank corrections clear
dependent checks. Adding targets to three-action Heal retains existing targets'
results. Applied steps cannot be reopened. Interrupted application retains confirmed
receipts and requires manual reconciliation rather than replay.

## Live observations

| Case | Result and retained evidence |
| --- | --- |
| Heal ranks 1/3, actions 1/2/3 | Passed. `1d8`, `1d8+8`, `1d8` and `3d8`, `3d8+24`, `3d8`; mixed bursts wait for saves and share the roll. Cards `8KRDQTfmIzURbuFc`, `Rfe4GjveDjjp0YCW`, `bfqRmzPul8kznw1u`, `O5gRd2mHGyNfbrnt`, `0qnQHfWZeA7ghzRK`, `apKoiP4cLiN80C6a`. |
| Single-target undead Heal | Passed at ranks 1/3, actions 1/2. Native dice damage only; no two-action healing bonus. Cards `KI2YLSYsGYKAYBWF`, `6pyLgzC5JjyXx2lz`, `iLm4fRy2vHxwS1DA`, `YXCAj46a7LwkE5Tl`. |
| Heal area review | Passed in isolated scene. Native emanation suggested caster and both recipients; checkboxes reviewed through UI. Shared roll restored 19 HP to each living creature and dealt 19 to undead. Card `usDC3fPZdnBMjomT`. |
| Force Barrage ranks 1/3, three actions | Passed. Split 2+1 and 5+1 shards; native formulas combined per target, force resistance 2 applied once. Same source card could not apply twice. Cards `RkOM59og5ZkQ0I3j`, `oMdHcZHvF1gLPGGw`. |
| Disintegrate rank 6 | Passed native attacks and saves with explicit GM degree corrections. Miss: no save or damage (`oYQzxR3ye7NIXpm6`). Hit + successful save: 62/2 = 31 damage (`tuRO35kfN2NplZYX`). Critical hit + successful save: effective Failure, 69 damage (`1wdXEEbJ19IPdL2k`). No HP changes before finalization. |
| Replacement and rank correction | Passed. Original target untouched; old target submission rejected; new rolls required. Rank 7 used native 14d10. Card `AjzNwdfMCWjdE9rQ`. |
| Explicit object | Passed. GM-confirmed Drawing remained before attack finalization and was deleted only after confirmed hit. Card `oFyqPlm8Knu7UDju`, Drawing `x2Jdui050sVnzjeJ`. |
| Disintegrate at zero HP | Passed. Native dead status, recorded powder consequence, retained equipment. Card `zpszZG5ShNMlGWDb`, gear `Actor.Ggtief7TpgZglulV.Item.YGWjz2RAXMSlSa9I`. |
| Player authority | Passed. Player2 native attack reached GM; player finalization rejected by coordinator. Card `aZjvBNTyFSXxcbsP`. |
| No GM | Passed. Owned two-action Heal raised HP 200→215; attack preparation blocked. Card `WFuMpRWJoMlDpgf8`. Temporary player actor/macro/hotbar access removed afterward. |
| Native slots, variant and cancellation | Passed. Native spontaneous cast spent one slot; module reused two-action variant and spent no additional slot. Overhealing restored/reported 1 HP. Second native cast spent remaining slot; canceled resolution neither refunded it nor applied healing. Card `mNQ3XIlvJlydEAZ8`, entry `Actor.YvGjxBO9fQmmhD8c.Item.hrqJqPmm1s7eKOVH`. |
| Recovery of interrupted applying state | Passed. Repeated recovery stopped for review without application; finalize stayed locked. Card `rlN4e0v6tWmcODNb`. |
| Failure after an earlier application | Passed. Injected failure on second recipient retained first recipient's confirmed 16 healing, left undead at 250 HP, and did not replay during recovery. Card `E09ds5TwrDdqHSoI`. |

| GM handoff | Passed. GM2 finalized the original GM's durable pending miss while the original GM was disconnected; no HP change or replay. Card `amn8CZ10Q8yD6lJV`. GM2 disabled afterward. |
| Visible native check dialogs | Passed. Second attack used native +14 −5 MAP = +9; fortune/misfortune and modifiers remained available. Native successful Fortitude became effective Failure after explicit critical-hit correction, applying 72 damage. Card `piXQyCpdIqKC40Eo`. |
| Blind visibility | Passed. Native dialog's blind choice restricted collector to original GM and retained blind state. Card `qtUxWrs9TI2TKEKF`. Automated checks prevent later public checks from widening the audience. |
| Initial eligibility override | Passed. GM explicitly treated a construct fixture as eligible living recipient before application; override identity retained and native healing 9 confirmed. Card `ZLTSpans7c8hGc3B`. |
| Final native source-card retest | Passed after source identity validation. Variant reused, slots 2→1→0 only through native casting, actual healing 1, cancellation applied nothing and refunded nothing. Card `PS1SNFR0Kqru8Sfq`. |

Detailed reports, including failed development attempts, remain on
`Macro.BNZ7O7p2tRsjh3ew`, flag `pf2e-automatic-resolution.immediateVerification`.
Run `tools/immediate-verification.mjs` through **Open Phase 4 verification** on
the existing ongoing verification macro. Failed attempts are retained as history;
their presence is not a passing result.

## Issues found during verification

- Foundry v14 removed `User.updateTokenTargets`. Object checks now use native
  token targeting controls and restore the original selection after the roll.
- The first area fixture attempted to move tokens outside the original scene's
  bounds. Actual positions stayed unchanged. The corrected isolated-scene test
  verifies containment and the three explicit suggestions before resolution.
- PF2e's `damageTaken` includes healing attempted beyond maximum HP. Healing
  totals now use the native undo receipt's actual HP restoration; damage still
  uses PF2e's native damage amount, including overkill/temp HP. Regression tests
  cover capped and zero restoration; no local HP-delta reconstruction is used.

## Boundaries

These three verified profiles establish the selected I1 immediate workflows;
they do not claim every spell attack, healing spell or immediate spell is supported.
Changed profile mechanics stop for review. Range, cover, visibility, walls,
willingness and object artifact/volume restrictions require explicit review.
Object destruction is bounded to the declared Tile or Drawing, not arbitrary
wall topology or items in inventories. Other spatial workflows belong to Phase 7.
Attack targets need an unambiguous native active token. Generic applied-step
recovery is supported; additional spells whose later steps require different
applied outcomes need their own adapters and evidence during catalog expansion.

Final automated run: **93 tests passed**, zero failures, using Node 24.19.0 with
`node --test --test-isolation=none`. Syntax checks and `git diff --check` pass.
The final browser check reports no console errors. The original Gamemaster is
connected; temporary GM2 is disabled and logged out, Player2 is logged out, and
temporary actor/macro ownership and hotbar access have been removed.
Source snapshot: [SHA-256 manifest](phase-4-source-sha256.txt).
