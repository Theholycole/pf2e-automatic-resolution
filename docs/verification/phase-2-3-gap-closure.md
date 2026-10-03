# Phase 2–3 coverage expansion — in progress

User priority: close condition/outcome and ongoing-spell gaps before Phase 6.
This is not a declaration of complete Phase 2–3 catalog coverage.

Baseline: Foundry 14.367 / PF2e 8.5.0, disposable pftest. Existing phase reports
remain historical checkpoints. The installed fixtures include 1,994 spell and
ritual documents; the accepted milestone denominator is separately defined in
the plan and must not be confused with this raw fixture count.

The next [general-rules checkpoint](general-rules-phase-2-3.md) enables four additional spells through shared mechanics and records its own tests and live evidence.

## Work and evidence

- Added a structural candidate ledger in reports/condition-ongoing-coverage.json
  and .md. Runtime-ready compilation and live evidence remain distinct.
- Reproduced Enfeeble failing the actual compiler/runtime execution gate with
  `node --test --test-isolation=none test/phase23-coverage.test.js`.
- Timing residual analysis now claims only exact already-parsed condition timing.
  A regression test retains rejection of an additional unimplemented damage trigger.
- A `varies` summary can use outcome-owned lifetimes when every condition has an
  explicit duration. Enfeeble and Stupefy become executable without bypassing
  other semantic gates. Condition Effects retain caster/item identity.
- Live Enfeeble and Stupefy outcomes: all four degrees produced values 0/1/2/3.
  Cards `31p3zAbRJNvPR311`, `d0X7t2MXS2Iieyqd`.
- Live Enfeeble success retained through the recipient turn and expired at the
  next caster turn: card `5CcsPjaE0yqafFkg`.
- Evil Eye: independent native Sickened, durable Sustain and sight review, native
  Fortitude Retch saves through the existing provisional/finalization workflow.
  Sight/obstructions remain explicit review; committed caster/target movement,
  relevant conditions, walls and darkness invalidate the ruling. Other changes
  still require updating it. Spell ending releases the floor and does not cure Sickened.
- Live Evil Eye critical failure → Sickened 2 → critical-success Retch while
  visible → Sickened 1; native decrement blocked at the floor; end retained 1;
  later successful Retch removed it. Cast `RUYagq7uoLbFx0ze`.
- Fear passes Frightened 3 → 2 → 1 → 0 at recipient turn ends, with separate
  Fleeing expiry after one round: cast `Zxi326zsWvZggMFT`.
- PF2e overwrites Effect start initiative during creation using its origin actor.
  Native condition wrappers and Fear now include explicit caster/recipient origin
  context. Next-recipient-turn timing distinguishes an upcoming turn in the
  current round from a turn in the next round.
- Blindness passes upcoming recipient-turn expiry, temporary immunity on success
  and critical success, repeat-cast rejection and immunity expiry: cards
  `bh6jcHFmQozG8X9W`, `KGzHG75l76uKIQOc`, `tUpE6dIoIKHMxqUn`.
  Immunity prevents this module's save workflow from affecting an immune target;
  it does not intercept arbitrary third-party macros or native manual rolls.
- Clinging Ice passes failure/critical-failure native Speed penalties, one-time
  native cold damage, Sustain without repeated damage, and missed-Sustain cleanup:
  casts `Y94t77QTvdZjfpty`, `vFCcBPfhyVBcCKfk`.
- Shared Frightened recovery passes with Agonizing Despair: own value 2 → 1 → 0,
  unrelated Frightened 3 preserved, no repeated damage or duplicated decay.
  Card `jQnqDkpcioHZYGZN`.
- Evil Eye edge tests pass all initial outcomes, committed token movement
  invalidating visibility, full recovery when not visible, and missed Sustain
  retaining Sickened: casts `gWxqmQCdz5x5vsvb`, `8zO2WXiaplkbgEm5`,
  `1CLsQlgzktAvdu9q`, `NF6vk3nUfBOlMnbT`, `zVNcXUmCuWnDEQ8y`.
- Numbered Stunned now uses confirmed action loss rather than an invented round
  duration. A turn reminder and recipient/GM control record the loss, reduce the
  owned native condition, and prevent repeating that confirmation at the same
  turn boundary. Daze passes this workflow, including duplicate rejection: card
  `e7SQsJU7LCJdI32N`, cast `GBSvMxPjwrALszSz`.
- Bounded inline critical-failure condition sentences enable Timber, Arrow Salvo
  and Daze. Extra mechanics still fail the compiler gate. Timber and Arrow Salvo
  pass native damage/condition application, including Timber's recipient-turn-end
  expiry: cards `R5JjlOPyYy0qRZKV`, `5aBt3p9EjBXQ78R0`.
- Paralyze passes all four initial outcomes and recurring Will recovery:
  `RfvD44fsSlfYLThT`, `mfmbWl3wisuULqXX`, `uOUCPrkfOJipwZ5v`,
  `OMYbh4bjRwiRJ1tu`. Ordinary failure expires after one round; critical-failure
  recovery success shortens the original duration, critical success ends it.
- Normal Evil Eye source-card UI passes native-dialog saving throw and one-click
  Finalize: source card `Dass5SkoFPAWzdIt`, recipient `Actor.egl8HXaPyLOMRtio`.
  A natural 12 + 10 against DC 24 failed and applied Sickened 1. Reload retained
  cast `d2gwLg4vCh0I6VXE`, save card `NGEm11zEjm0rbEjH` and the same condition.
- Latest Daze/basic-save regression passes: `PA7g9TEnhq0RhwMc`.
- Latest Enfeeble caster-turn expiry regression passes: `J5EbA0MEaITbQZFt`.
- Final four-degree Enfeeble/Stupefy regressions pass with explicit caster
  initiative 20: cards `CsHZl04pJ27yuDXa`, `CkCXv0jjB7xYtdWB`.
- Native mental immunity is respected for Fear, Daze and Paralyze before rolling:
  cards `0xWT6JcLW1eUG1Zs`, `KnBJILAu0qPrZzFY`, `yZkRdvY8zvNaLddy`.
  The durable cast stores spell roll options and presents them as a spell Effect
  to PF2e's immunity evaluator. Its mental/emotion/fear predicates require the
  Effect type; damage-only immunities remain native damage resolution work.
  Condition-recovery saves are not treated as a new application of the spell.
  Recheck after rolling also passes: Paralyze card `jrCBhx5ioRUfLEgv` remained
  Unaffected after the recipient gained mental immunity before finalization.
- Unsupported spell cards now explicitly say native saves will not apply effects.

The authored harness is tools/phase23-verification.mjs, opened through
PFTEST — Ongoing verification. Detailed successes and failures are retained in
Macro.BNZ7O7p2tRsjh3ew flags pf2e-automatic-resolution.phase23Verification.

## Rules and source notes

[Evil Eye](https://2e.aonprd.com/Spells.aspx?ID=798) restricts reduction below
Sickened 1 while active and the caster can see the target. The recovery-floor
lifetime is tracked separately from independently recoverable Sickened.
Installed native PF2e Condition creation checks immunity/affected status;
ConditionManager.updateConditionValue supports updating a specific contribution.
Native Condition.onEndTurn handles persistent damage, not automatic Frightened
decay. Condition recovery therefore needs explicit module lifecycle work.

## Outstanding

Complete the candidate-family audit and implementations, final runtime and live
regressions, supported-variant report, player/GM authority and recovery checks,
cleanup and final source hashes. No broad completion claim is made yet.

## Current gaps retained explicitly

This expansion has not closed the catalog. Laughing Fit's action restriction and transition, Synesthesia's concentrate and
concealment checks, special Sickened restrictions and older casts without recovery snapshots, and further native
outcome Effects remain work. New condition/Sustain services still require expanded
coordinator-handoff, broader reload/source-loss and interrupted-write evidence. Player-owned shared Retch, no-GM refusal and original-item deletion are verified below.
Existing Stunned Effects created by the old one-round implementation are not
silently migrated; review those casts manually.

[Stunned rules](https://2e.aonprd.com/Conditions.aspx?ID=93) define recovery by
lost actions and interaction with Slowed. The module requests confirmation of
actual actions lost rather than assuming every actor has exactly three actions.

Test fixture corrections: explicitly activate each test encounter; native PF2e
speed is observed at `system.movement.speeds.land.value`; test movement uses saved
Token coordinates rather than animation-interpolated getters. These corrections
are recorded separately from production fixes.

## Automated checkpoint

`node --test --test-isolation=none test/*.test.js`: **119 passed, 0 failed**.
`git diff --check`: passed. Full catalog compilation completed for 1,994 fixtures.
The ledger contains 926 structural candidates and 47 executable generic save
plans, plus separate ongoing-family routes. These numbers are not a count of
fully verified or fully covered Phase 2–3 spells.


## Shared recovery and authority follow-up

- Compiled Sickened contributions now receive separate wrappers and a recipient-owned
  **Retch — 1 action** control. Native Fortitude saves use the original cast DC;
  failed saves preserve severity, success reduces it by one, critical success by two.
  Independent conditions, sibling Deafened and original damage remain unchanged.
  Live Ashen Wind: `CvgZeJlE9OLJ33fm`, cast `bN9LxwQMcj1SMoFZ`.
  Live Painful Vibrations: `q4gC83iJpUeuPU8Y`, cast `Cfb3r9HaXMV1LraC`.
  Both cases deleted the original spell before recovery and passed.
- Evil Eye original-item deletion also passed: cast `JynMLGTaniUt67Yy`, recovery
  card `Yop0rkWphcRgWfMg`. New casts retain a spell snapshot for recovery. The caster
  actor is still required; missing-caster handling and old snapshot-free casts are
  not claimed as closed.
- Evil Eye overlap/detachment passed: cast `q6VIBmcr4q9VWybf`; unrelated Sickened 3
  `Actor.VF0hINP5hFbLLxwA.Item.QcNjdGxUuhUSHnmV` remained intact.
- Actual Player2 browser session at 127.0.0.1, with GM on localhost: existing
  `PFTEST Corrections Player` ownership was reused without permission changes.
  Its Ongoing overview exposed the owned Retch control, native Fortitude included
  Sickened's −2, and player Finalize remained disabled. GM received the inline roll
  and finalized card `urATEEyqcndKvtE6`, cast `tYnUfVYLl5QtSX4b`. Critical failure
  retained Sickened 2, then the test contribution was removed.
- No-GM case: only Player2 appeared in the connected-user list. Retch created no
  recovery card and left Sickened 2 unchanged. After GM reconnection, case
  `2OS7JLv0bkmPjfOx` verified that state and removed its contribution.
- Verification correction: inline saves intentionally do not create a separate
  chat roll message. The initial player assertion incorrectly required one; the
  corrected assertion checks the inline receipt, with player identity observed
  through the separate browser session. This was a harness failure.
- Four condition-spell adapters now pin verified mechanical data. Changed installed
  rules require review, even when the owned item matches the new compendium.
  Normalization accounts for Foundry's empty `traits.otherTags` default, whitespace,
  `<hr>` markup and the verified Clinging Ice name-to-ID reference conversion.
  Clinging Ice's native Effect rules and duration are also pinned.
  Latest pinned Clinging Ice passes: `oVFQHWB5L2wakTCz`, `MuH6xI08zoy8NKUf`.
  Latest pinned mental-immunity passes: `fei2lvX9akPOlYx6`, `YyerXfgHwvTTotyi`,
  `UYLMmxPpRm8JPDq4`; late immunity `Yj8hB98js7pUyF6M`.

The shared recovery checks cover a live player/GM socket and no-GM path, not a
second-GM handoff or every adapter's player workflow. Those remain distinct checks.


Source checkpoint: [SHA-256 manifest](../../reports/phase-2-3-gap-checkpoint.sha256)
records the runtime, compiler, test suite and relevant verification tools. No
version bump, commit, public release or Phase 6 work is included in this checkpoint.

## Test-world cleanup

Coverage fixture cleanup passed: 150 authored `PFTEST Coverage` actors, 150 of
their tokens, 8 test-only encounters and 59 associated journals were removed.
Other actors, existing roles and ownership, chat evidence and the verification
macro were preserved. Artifact IDs above are historical evidence; removed
fixtures can be recreated by the harness. The separate Player2 connection was
closed, and the original GM session remains open and responsive.
