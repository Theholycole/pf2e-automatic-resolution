# Event lifetimes and coordinated condition lists — verification

2026-09-24. This batch adds one executable event ending (a successful Escape against the cast's spell DC) and a positional grammar for coordinated condition grants. It adds no spell-name or ID dispatch; names below are fixtures and report output only.

## Coverage

New complete shared-save routes:

- **Grasping Grave:** half/full/double native slashing damage. Failure adds a −10-foot circumstance Speed penalty for 1 round. Critical failure adds Immobilized for 1 round or until the target Escapes.
- **Shadow's Web:** success Enfeebled 1 for 1 round; failure Enfeebled 2 for 1 round. Critical failure applies Stunned 1 (action debt, no timer), Enfeebled 2 for 1 round, and Immobilized for 1 round or until Escape, each in its own Effect.

The previous compiler attached Escape to every condition in the sentence. It gave Shadow's Web's Stunned 1 a 1-round timer plus an Escape ending, and silently dropped the unlinked “enfeebled 2” while reporting the outcome fully compiled. The route stayed blocked only because the runtime rejected event endings. Both defects are fixed at the grammar level.

The [whole-family audit](../../reports/phase-spell-batches/escape-family-audit.md) covers **111 unique members** in three overlapping families. All members were recompiled under a detached name and ID, and each copy compiled identically.

| Family | Members | Executable shared saves |
| --- | ---: | ---: |
| Any Escape wording (penalties, grabs, restraints, walls, summons) | 66 | 2 |
| Save outcomes with coordinated condition grants | 42 | 6 |
| Compiled event-terminated conditions | 28 | 5 |

Most Escape members remain blocked by other, separately tracked mechanics. The largest groups are sustained/area lifecycles, attack rolls, ongoing triggers and non-save workflows. Vampiric Maiden's critical failure now compiles fully, but its failure branch also ends on “an Interact action to extricate itself”, a different event that stays blocked. Crucible of Iron, Freezing Touch, Fiendish Rift, Skyglass Prison and Rose's Thorns compile their Escape lifetimes but stay gated on anatomy, persistent/fire interactions, Sustain, cage destruction and area exposure respectively.

## Whole-corpus compiler delta

`tools/diff-compiled-plans.mjs` compared every one of the 1,994 installed spells before and after the change. 41 plans changed meaning; each was reviewed:

- **Previously dropped conditions now compile** (routes still blocked by other gaps): Accelerated Decomposition (drained, enfeebled), Dazzling Flash and Dizzying Colors (dazzled), Dead Weight (off-guard), Expunge Blood (clumsy), Heinous Future (stupefied), Entrancing Eyes (fascinated), Trim the Blight (slowed), Blanket of Stars (dazzled), Falling Sky and Bridge of Vines (prone), Curse of Lost Time, Vision of Beauty, Day's Weight, Pressure Zone.
- **Valued Stunned no longer borrows a timer:** Dizzying Colors, Claim Undead, Touch of Death, Shadow's Web.
- **Explicit list timers now beat a sentence-level “permanently”:** Spiritual Epidemic (Enfeebled/Stupefied 2 for 1 minute; 1 permanently).
- **Prone is consistently unlimited (ends on Stand):** 13 plans whose unlinked Prone had a null duration, including enabled Stormburst. Stormburst's runtime behavior is unchanged because its lifecycle is instantaneous.
- **Enabled Blindness, Deafness, Moonburst, Sunburst and Warp Mind:** identical outcomes (the unlimited duration is byte-identical).
- **Conservative loss:** Shifting Sand's “immobilized within the spell's area until it Escapes” no longer receives an Escape ending, because the area phrase breaks adjacency. That route was already blocked.

No enabled route changed behavior or was lost.

## Implementation contract

- `parseConditionLists` proves each item's lifetime by position; `extractScopedConditionReferences` uses the proof only when it is a written own/shared lifetime or a self-limiting rule (valued Stunned, Prone). Otherwise the older clause heuristics apply unchanged.
- With a proof present, sentence-level `permanently`, spell-duration, Sustain, spell-end and leave-area patterns cannot override the item's own lifetime.
- The residual checker's new `listed-condition` signal requires every coordinated item to have a compiled condition of the same slug/value, except in secondary-save clauses.
- `isEscapeLifetime` accepts exactly one `{event: "escape", dc: "spell"}` with a fixed timer (`first`) or no timer (`event`). Malformed, extra or non-array events still block `condition-composition`.
- The snapshot preserves `endsWhen`/`expirationMode` for Escape conditions. Grouping keeps Escape conditions in their own Effect; the Effect flag records `escape.dc` from the cast's DC.
- The Escape watcher runs only on the primary active GM. It re-grades at click time and refuses a second End. The deletion reason `escaped` is recorded on the ongoing journal entry.
- New runtime guard: shared damage is not rolled when PF2e resolves a different spell rank than the recorded cast rank.

## Evidence

**210/210 automated tests pass**, with zero failures or skips. The new `test/escape-lifetime.test.js` covers the official routes, detached copies, leak guards, grammar negatives, dropped-item detection, the exact event contract and Escape grading. The Speed corpus regression (255 members) and the new family audit both pass, with no lost routes. The route census gives **202 enabled nonritual routes** and **70 executable shared-save plans**; the primary worklists are Phase 2: 126 / 445 and Phase 3: 30 / 594.

[Live Foundry evidence](phase-2-3-escape-live-results.json) comes from disposable `pftest` GM fixtures on Foundry 14.367 / PF2e 8.5.0, with only this module active and automatic expired-Effect removal enabled:

- All four degrees of both spells: exact native damage, conditions, Speed, Effect split and snapshotted Escape DC. Duplicate finalization is inert.
- Every legal rank (Grasping Grave 5–10: 6d6→16d6; Shadow's Web 7–10: 14d4→20d4). A card recording rank 10 for a caster PF2e clamps to a lower rank refuses to roll damage and leaves HP untouched.
- A failed Escape (DC−1) posts no card and keeps the restraint. A successful Escape posts a GM-whispered card; End removes only Immobilized, keeps Stunned 1 and the timed Enfeebled 2, and records `escaped` in the journal. A repeated End is refused.
- Two restraints with DCs 24 and 30: a total of 26 lists only DC 24. A total of 31 lists both; ending one marks the other “Not chosen”, and the other remains.
- Timer path: Immobilized and the Speed penalty survive source deletion until expiry, then end without replaying damage. A later Escape posts no card.
- Reload: after a page reload and source deletion, a critical-success Escape ends the restraint.
- Real UI: a genuine PF2e Escape action rolled from its native dialog (options `action:escape`, `action:escape:athletics`) produced the card, and clicking End ended the restraint.

The live run exposed and fixed three defects:
1. Effect UUIDs used as dotted update keys did not persist card status.
2. The End button shared a class with the Effect-receipt binder, which claimed it first.
3. The harness's level-5 innate caster could not reach ranks above 3. PF2e clamps variants to the caster's maximum rank, so the earlier “every legal rank” check silently rolled rank-3 damage.

The failed attempts are listed in the evidence file.

**Correction to the Speed batch's evidence:** its rank matrix had the same fixture flaw. It was rerun with level 2r−1 casters and dice derived from each spell's heightening data (Chilling Spray 2d4→20d4, Tempest Touch 1d4+1d4→10d4+10d4, Magical Fetters resolving ranks 3–10). All 28 casts pass; see [the rerun](phase-2-3-speed-ranks-rerun.json).

Cleanup: 114 Escape fixture actors and 49 journals, plus 83 Speed fixture actors and 39 journals, were removed; zero fixture actors remain. Chat evidence is retained.

## Remaining blockers in this area

- Other event endings: Interact to extricate, destroying a cage or vine, leaving an area, a successful Swim.
- Escape-ended Speed penalties (Pest Swarm, Manifest Will, Impaling Briars), which need the generated-modifier path to accept the same event.
- Timed unvalued Stunned (Synaptic Pulse, Pain of Ages) and rolled condition values (Wails of the Damned's Drained 1d4). Both remain distinct, gated capabilities.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-escape
node tools/diff-compiled-plans.mjs /path/to/pre-batch/official-spell-compiler-report.json /tmp/phase23-escape/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/phase23-escape/official-spell-compiler-report.json
node tools/audit-condition-coverage.mjs /tmp/phase23-escape/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-escape/official-spell-compiler-report.json
node tools/report-composition-families.mjs /tmp/phase23-escape/official-spell-compiler-report.json
node tools/report-cross-family-speed.mjs /tmp/phase23-escape/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/speed-family-baseline.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-escape/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
node tools/report-escape-family.mjs /tmp/phase23-escape/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/escape-family-baseline.json
```

Live: in the pftest GM client, `const h = await import('/modules/pf2e-automatic-resolution/tools/phase23-escape-verification.mjs')`, then `await h.runCase(name)` for `environment`, `degrees`, `ranks`, `escape`, `multiple`, `timer` and `prepareReload`. Reload, then run `reload`, followed by `prepareUi` (roll the native dialog and click End) and `verifyUi`. Finish with `cleanup`, and use `h.results()` for evidence.
