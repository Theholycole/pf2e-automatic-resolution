# Cross-family Speed modifier verification

This expansion composes native damage, generated Speed penalties, conditions, outcome inheritance, and independent expiration. Production routing uses parsed rules and source-bound proof; no spell-name or ID dispatch was added.

## Coverage and full-family audit

New complete shared-save routes:

- **Chilling Spray:** half/full/double native cold damage; failure −5-foot status Speed penalty and critical failure −10-foot, each for two rounds.
- **Magical Fetters:** success Clumsy 1 and −10-foot status Speed penalty for one round; failure Clumsy 3 and the penalty for one minute; critical failure inherits those consequences and adds Slowed 1 for that same minute.

Tempest Touch remains on its existing degree-selected native Effect path. Grasping Grave's failure Speed modifier now compiles, but its full save route remains blocked: critical-failure Immobilized must support both one-round expiration and successful Escape. No failed-degree mechanic is silently omitted to enable a spell.

The [source-derived family audit](../../reports/phase-spell-batches/speed-cross-family-audit.md) covers four overlapping groups, without a spell-count batch limit. The production save capability check assesses every member, and the corpus regression check recompiles each member under a detached name/ID to check identity independence. Counts describe route availability, not live execution of every blocked member.

| Family | Members |
| --- | ---: |
| Explicit Speed penalty/reduction wording, including immunity/removal wording | 45 |
| Saving throws combining direct damage and conditions | 108 |
| Saving throws with fixed or turn-boundary conditions | 145 |
| Inherited save-degree clauses referring to an existing duration | 14 |

There are **254 unique spells** across these overlapping groups. All 1,994 installed-source spells are recompiled for the route census. The 51 primary Phase 9 review spells remain deferred.

The narrower independent review inventory found 39 nonritual Speed-penalty phrase matches; the report's 45 also include `all`/other possessive forms. Membership is deliberately broader than positive applicability: ignoring/removing Speed penalties does not qualify a spell for generated penalties.

## Implementation contract

`outcome.modifiers` is separate from linked native Effect templates. An exact degree clause proves the signed value, modifier type, all-Speeds selector, and fixed or next-turn lifetime. Generated Effects contain native PF2e `FlatModifier` rules and use existing cast ownership, journal tracking, rollback, and expiry.

Proof includes all degree text, modifier arrays and condition value/duration snapshots. Routing and all-target preflight reject mismatches before applying damage or creating Effects. Next-turn timing uses the source or target actor named in the clause, including initiative order. The cast snapshot survives source-item deletion and reload.

An inherited modifier retains its predecessor's proven lifetime. An added condition can have its own explicit duration; “for the duration” binds only when the predecessor's relevant contributions have one unambiguous matching lifetime. Contradictory or uncompiled rules retain a blocker.

Independent review caught an inheritance omission in a custom variant whose added condition lasts two rounds: the one-minute inherited Speed penalty must remain. Regression coverage now exercises that case rather than treating only the official wording as sufficient.

## Verification evidence

**202/202 automated tests pass**, with zero failures or skips. The corpus regression matrix passes for all **254 unique family members** and their detached source copies; all 66 previous shared-save routes remain executable. There are now 68 executable shared-save plans and 200 enabled nonritual routes overall.

The regenerated primary worklists are Phase 2: **124 enabled / 447 not enabled**, and Phase 3: **30 / 594**. Route availability includes partial native Effect routes and is not the same as complete spell verification.

Automated and live results are recorded separately:

- [Corpus family regression results](phase-2-3-speed-corpus-results.json): all family members plus detached source identities and old-route retention.
- [Live Foundry evidence](phase-2-3-speed-live-results.json): save degrees, ranks, typed IWR, timers, turn anchors, malformed-state preflight, repeated casts, reload, and fixture cleanup.

The live matrix passed:

- All four save degrees for Chilling Spray, Magical Fetters and Tempest Touch (12 cases), including duplicate-finalization protection; repeated against the final reviewed code.
- All legal cast ranks for those three spells (28 casts). **Correction (2026-09-24):** the original fixture used a level-5 innate caster, which PF2e clamps to rank 3, so higher-rank casts rolled unheightened damage. The matrix was rerun with level 2r−1 casters and heightening-derived dice checks, and all 28 casts pass; see [the rerun](phase-2-3-speed-ranks-rerun.json). The runtime now refuses to roll when PF2e resolves a different rank than the cast records.
- Native cold resistance and immunity with the independent Speed rider retained (two cases).
- One-round, two-round and one-minute expiration after source-item deletion (three cases).
- Source/target next-turn start/end in both initiative orders (eight cases).
- A renamed custom variant with Slowed for two rounds while inherited Clumsy and Speed penalties remain for one minute.
- Malformed second-target modifier rejection before either target loses HP or receives an Effect.
- Repeated renamed casts, source deletion, reload, native stacking with an unrelated stronger penalty, and selective removal of each cast's contributions.

Live verification uses only disposable `pftest` GM fixtures on Foundry 14.367 / PF2e 8.5.0, with this module active and automatic expired-Effect removal enabled. Native damage/save rolls are real; the test selects explicit provisional save degrees so every branch is exercised.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-speed
node tools/report-enabled-spells.mjs /tmp/phase23-speed/official-spell-compiler-report.json
node tools/audit-condition-coverage.mjs /tmp/phase23-speed/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-speed/official-spell-compiler-report.json
node tools/report-composition-families.mjs /tmp/phase23-speed/official-spell-compiler-report.json
node tools/report-cross-family-speed.mjs /tmp/phase23-speed/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/speed-family-baseline.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-speed/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
```

Cleanup completed: **93 fixture actors and 50 test journals removed; zero Speed-family fixture actors remain**. Chat evidence and macro results are retained.

For live checks, open the PFTEST ongoing verification macro, then **Open Phase 2–3 Speed family verification**. Reload between preparing repeated custom casts and verifying reload ownership. Run fixture cleanup after exporting evidence. The harness is `tools/phase23-speed-verification.mjs`.
