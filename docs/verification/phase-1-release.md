# Phase 1 correction release verification

Status: **Passed for the Phase 1 correction release**, 2026-09-19 local
(2026-09-20 UTC). This is not completion of the full spell-automation milestone.
Phases 2–9, including durable expiry recovery, retain their separate gates.

## Environment and evidence

Foundry 14.367, PF2e 8.5.0, installed module manifest 0.8.2 plus the working-tree
changes identified in `phase-1-runtime-sha256.txt`. Disposable world `pftest`;
scene `pCgysuwHQ8wg9vST` (PFTEST Corrections laboratory). Automatic expired-effect
removal was saved/effective ON. No time/turn changes were made by these checks.

Original GM: `rW96bfNVu9Z4WVK7`; temporary GM: `WCHvGCPipQMSG3pB`;
player: `utxVA4eu1cnQzlIj`. Independent browser sessions were used. The temporary
GM was enabled with explicit user approval and disabled afterward (role 0).
Auxiliary browser sessions were closed. Fixtures remain for inspection.

Full harness observations, including failed attempts, are retained on
`Macro.mmDfXh9LdjNWFsBn`, **PFTEST — Correction verification**, flag
`pf2e-automatic-resolution.correctionVerification`. The script is
[correction-verification.mjs](../../tools/correction-verification.mjs), invoked
through the actual Foundry macro editor. It uses the public module API, native
PF2e saves/damage, real embedded documents, and assertion-based result reports.
Permission and visible-handoff observations below were also checked directly
through browser UI; they are not all recorded by the harness.

## Live correction matrix

All spell cases used DC 24. Ordinary NPC recipients were level 5, saves +10,
500 HP, and had no IWR. C1 also included a player-owned blank character, used
for native player rolling and then excluded from damage.

| Case | Collector ID | Observed pass evidence |
| --- | --- | --- |
| C1 — Fireball rank 3 | `IWEvi3KPOFFVWSg7` | Two unlinked copies retained distinct synthetic actor UUIDs; one linked NPC and one player-owned character remained distinct. Native player dialog submitted its save. Exclude/restore retained dice and correction. Shared 6d6 fire rolled 19: corrected Success copy lost 9 HP (500→491), excluded copy lost 0, linked Critical Failure lost 38 (500→462), excluded player lost 0. Repeated Finalize rejected without another application. |
| C2 — Noise Blast rank 2 | `PbL31BbOTcGwpqlU` | Failure/Success corrections retained original dice; native reroll cleared the override. Final effective Success/Failure/Critical Failure used shared 2d10 sonic=14: HP losses 7/14/28. Success had no conditions; Failure granted Deafened via a 1-round wrapper; Critical Failure granted Deafened via a 1-minute wrapper and Stunned 1. |
| C3 — Phantasmal Killer rank 4 | `NU4RNNbUn1gHMFwB` | Primary Critical Failure created Fortitude stage. Secondary correction retained its original roll. Changing primary away removed the stage; changing back created an unrolled stage and blocked Finalize. Corrected secondary Success applied 12d6 mental=41 (500→459), Fleeing with a 1-round turn-end wrapper, and Frightened 4. |
| C4 — Reblooded rank 3 | `6H9MPabOXlGOzJIp` | Living/undead/living targets began ineligible/eligible/ineligible. A living target explicitly marked Affected received Failure's 2d6 persistent acid and Clumsy 1 for 1 minute, without immediate HP loss. Its original undead restriction remained recorded. The undead target was toggled both directions then marked Unaffected; it received nothing. The unchanged ineligible living target received nothing. No actor-wide eligibility or immunity was installed. |
| C5 — authority, reload, concurrency | `lsNS9yjSQEpjtFv4` | Player and non-coordinating GM API correction attempts rejected with unchanged state. Reload retained the entire corrected cast. Old target revision rejected. After original GM disconnected, GM2 rejected stale revision 2 against revision 4, then made a fresh exclude/restore (revision 6). Concurrent Finalize/Finalize/correction resolved once and rejected the latter two; later correction also rejected. |

Additional C3 edge case: collector `7acakw5lkVQOsCWj`, level-10 recipient
`Actor.SIoMmvPCeDfMi9eU`, rank-4 Phantasmal Killer. Native secondary roll was
4+10=14 vs DC24: base Critical Failure improved to Failure from incapacitation.
Finalizing that secondary Failure set the native dead status. No damage was
applied by the death-only branch.

Every completed C1–C5 cast retained its native source card, one save collector,
and exactly one result summary. No separate module damage-roll card was added.
PF2e's own damage receipts remain native behavior. Wrapper creation/duration was
checked here; lifetime cleanup remains the separate lifecycle release gate.

## Failures found and resolved

1. **Missing damage token:** Initial C2 preparation passed tokenless world actors.
   PF2e applied damage, then threw while constructing its receipt (`token.name`).
   The module correctly marked that attempt uncertain; it was not replayed.
   Resolution now preflights all affected damage recipients before any actor
   mutation. Actor-only calls may resolve exactly one active token; absent or
   ambiguous tokens stop safely, and a missing persisted token is never silently
   replaced. A new live tokenless fixture (`Actor.5Er8LFaxCW5GkoIK`) retained 500 HP
   and collecting status after rejection. Fresh explicit-token C2 passed.
2. **Handoff buttons stayed disabled:** API authority transferred correctly, but
   controls rendered under the previous GM stayed disabled. Client-local control
   refresh now responds to Foundry `userConnected`/`updateUser`, preserves readiness
   and busy locks, and attaches handlers even while unauthorized. Live GM2 controls
   became enabled after original GM disconnected; clicking **Exclude Target**
   succeeded. They disabled again when original GM reconnected. Completed/unready
   Finalize buttons stayed locked. No cast-state write is needed for this refresh.
3. **Harness recipient order assumption:** Foundry returned created tokens in a
   different order than requested. The first C1 assertion expected the player at
   index 3. The harness now identifies player, linked, and synthetic recipients by
   identity. The corrected C1 passed. This was a test-fixture issue, not a runtime
   identity failure.

## Automated verification and fixture reproducibility

**59 tests passed, 0 failed, 0 skipped**, including compiler, save runtime,
Effect runtime, and debug checks. New regression assertions cover stale edits,
original dice, secondary invalidation, reroll override reset, player rejection,
concurrent Finalize/correction, a native roll finishing after a correction,
unknown socket submitters, tokenless preflight, and handoff UI readiness locks.
Syntax checks and `git diff --check` also passed.

The old compiler tests hard-coded an absent personal source directory. Tests now
use `PF2E_CONTENT_ROOT` when set, otherwise `.cache/pf2e-test-fixtures` relative to
this repository. Generate that ignored local cache from installed data:

```sh
node tools/export-installed-test-fixtures.mjs \
  '/path/to/Foundry/resources/app' \
  '/path/to/Foundry/Data/systems/pf2e' \
  .cache/pf2e-test-fixtures
node --test --test-isolation=none
```

The exporter opens temporary **copies**, never Foundry's live databases. It
exported 1,994 spells/rituals and 544 spell Effects from PF2e 8.5.0. Test fixtures
restore spell-effect/feat UUIDs to source-name notation using actual installed
ID/name mappings; dedicated installed-ID tests translate them back. No mechanics
are rewritten. `provenance.json` records installed source hashes and version.
The exporter depends on the supplied Foundry app's `classic-level` dependency.

Local Node used:
`/home/theholycole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
No public release, version tag, or commit was made by verification.
