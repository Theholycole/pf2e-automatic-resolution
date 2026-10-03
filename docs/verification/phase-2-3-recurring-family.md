# Recurring end-of-turn saves — verification

2026-09-24/25. This batch adds recurring saves as a condition lifetime on shared save outcomes, and a safety gate for creature-dependent degree shifts. It adds no spell-name or ID dispatch.

## Coverage

- **Confusion (new route):** Stunned 1 on a success. On a failure, Confused for 1 minute; at the end of each of its turns the target attempts a new Will save against the cast's DC, and a success ends the confusion. On a critical failure, Confused for 1 minute with no save to end early.
- **Paralyze (general route now executable):** Stunned 1 on a success; Paralyzed for 1 round on a failure. On a critical failure, Paralyzed for 4 rounds; each end-of-turn Will save reduces the remaining duration by 1 round on a success, or ends it on a critical success. The official Paralyze slug still routes to its existing dedicated ongoing adapter, which takes precedence, so its live behavior is unchanged. Renamed or custom copies with the same rules now resolve through the general route. That adapter is migration debt this route can later replace, after a side-by-side review.

The [whole-family audit](../../reports/phase-spell-batches/recurring-family-audit.md) covers **74 unique members** in three overlapping families. Every member was recompiled under a detached name and ID.

| Family | Members | Executable shared saves |
| --- | ---: | ---: |
| New, additional or repeated saves | 50 | 2 |
| Remaining-duration reduction (Paralyze, Stasis, Charitable Urge) | 3 | 1 |
| Creature-dependent degree shifts | 28 | 0 |

Close members stay blocked by their own mechanics:
- **Confusing Cry:** critical-success temporary immunity, and a self-Strike that suppresses the flat check.
- **Waking Dream:** Sustain and concealment side effects.
- **Stasis:** its non-condition time stop.
- **Charitable Urge:** an item-giving compulsion.
- **Darkened Eyes:** vision suppression.
- **Undermine Reality and Orb of Twisting Fate:** non-condition states.
- **Appeal to Authority:** a native Effect with a recurring save.
- **Phantasmal Calamity:** a basic save with a secondary Reflex branch.

## Cast-wide Dismiss for save routes

Confusion is the first shared-save route whose spell says “You can Dismiss the spell.” Before this batch, the preamble checker silently accepted that sentence even though the save route offered no caster-side Dismiss. Only that exact standalone sentence (“the spell” or “this spell”) now compiles `lifecycle.dismissal = {authority: "source-actor", scope: "cast", action: "Dismiss"}`. The ongoing record carries that dismissal, and the Ongoing spells panel gives the caster's owner (or a GM) a **Dismiss — 1 action** control that ends every contribution of that one cast. Any other Dismiss wording (a veil, a cage, a form, “can't Dismiss”) now raises a `dismissal` gap. Ten spells gained that gap; all were already blocked.

## Safety correction: creature-dependent degree shifts

Relaxing the “varies” duration rule for valued Stunned exposed Spiritual Anamnesis. Its preamble states that undead and creatures with past lives turn a critical success into a success and a failure into a critical failure, but the preamble checker had never recognized that rule. `preamble:degree-adjustment` now blocks it and 12 others; all were already blocked by other gaps. Before this change, Heat Metal and Hypnopompic Terrors were each one gate away from executing without their degree shift.

## Whole-corpus delta

[`phase-2-3-recurring-corpus-delta.json`](phase-2-3-recurring-corpus-delta.json) lists all 30 changed plans:
- Paralyze and Confusion gained routes.
- Waking Dream and Confusing Cry gained recurring-save metadata but stay blocked.
- Charitable Urge, Stasis and Synesthesia lost the `item-duration-grammar` gap but remain blocked by other gaps.
- 13 spells gained `preamble:degree-adjustment`.
- 10 spells gained `dismissal`.

No existing route was lost.

## Implementation contract

- **Compiler:** only a whole sentence is recognized, and its scope must be proved. `end` needs exactly one compiled condition matching the named noun (confusion, paralysis, blindness, deafness, fascination, or “the X condition”). `reduce` needs every condition in the outcome to share one fixed whole-rounds timer. A mismatched statistic, several recurring sentences, or other lifetimes (Escape, linked) are rejected.
- **Core:** `isRecurringSaveLifetime` accepts exactly `{timing: "turn-end", mode, statistic, sourceText}`. `reduce` requires a rounds timer; `end` requires a fixed or unlimited duration. The statistic must equal the primary save.
- **Runtime:** recurring conditions receive their own Effect with `recurringSave.dc` snapshotted from the cast. `reconcileRecurringSaves` runs after Frightened decay and judges the same pre-reconcile clock. It records one obligation per exact boundary key (combat, round, turn, Effect, event) and prepares a condition-recovery save card with the original spell source and DC. Finalization re-validates the recipient.
- **Outcome table:** `end` ends on a success or critical success. `reduce` subtracts one round on a success (ending at 0) and ends on a critical success. A failure changes nothing.
- **Review and orphans:** a jumped or reversed turn order goes to review with nothing rolled. A save whose Effect expired at the immediately following turn start is closed as `skipped/effect-ended`.
- **Out of combat:** there are no turn boundaries, so no recurring save is prepared. The GM can still end the cast from the Ongoing spells panel.

## Evidence

**219/219 automated tests pass.** The new `test/recurring-save.test.js` covers both routes, detached copies, inheritance and negation, scope negatives, the exact core contract, the outcome table, the degree-shift gate, and dismissal compilation, including rejected wording and a forged authority. The Speed (255 members), event-lifetime (111) and recurring (74) family regressions all pass.

The route census gives **203 enabled nonritual routes** and **72 executable shared-save plans**. The primary worklists are Phase 2: 126 / 445 and Phase 3: 31 / 593.

[Live Foundry evidence](phase-2-3-recurring-live-results.json) comes from disposable `pftest` fixtures on Foundry 14.367 / PF2e 8.5.0, with only this module active and removal on:
- **All four degrees of both spells:** conditions, recurring metadata, and a snapshotted DC 24 Will save.
- **End mode in a real combat:**
  - No card appears before the bearer's turn ends. Exactly one card appears after it, and a second reconcile does not replay it.
  - A failure keeps the confusion; the critical-failure recipient gets no card.
  - A second boundary prepares a second card, and a success ends only that recipient's confusion.
- **Reduce mode:**
  - A failure keeps 4 rounds; a critical success on another recipient ends paralysis immediately; a success shortens the timer to 3 rounds.
  - The shortened timer then expires one round earlier, and the save overtaken by that expiry is closed as skipped.
- **Turn jump:** the cast goes to review with no card.
- **Reload:** after a page reload and source deletion, the pending card finalizes correctly with no replay.
- **Dismiss:** Dismissing one cast ended both of its recipients (reason `dismissed`), while a second cast of the same spell stayed active. That second cast was then Dismissed by clicking the panel control.
- **Real UI:** the Ongoing spells panel showed the collecting save. Its Roll control opened PF2e's native Will save dialog, and a 25 (natural 15) against DC 24 ended the confusion.

The live run caught and fixed one defect: a harness expectation that ignored natural expiry. That exposed the orphaned-obligation case, which now closes cleanly. Cleanup removed every fixture actor, journal and test combat; zero fixture actors remain. Two combats created by earlier (September 20) sessions were left untouched.

## Remaining blockers in this area

- Start-of-turn repeated saves with per-turn outcomes (Manifold Lives, Wave of Despair), and saves triggered by events (damage, witnessing actions, Sustain).
- Degree-scoped temporary immunity (Confusing Cry), and native Effects carrying a recurring save (Appeal to Authority).
- Retiring the ID-dispatched Paralyze adapter, which needs a side-by-side live comparison first.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-recur
node tools/diff-compiled-plans.mjs /tmp/phase23-escape/official-spell-compiler-report.json /tmp/phase23-recur/official-spell-compiler-report.json
node tools/report-enabled-spells.mjs /tmp/phase23-recur/official-spell-compiler-report.json
node tools/audit-condition-coverage.mjs /tmp/phase23-recur/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-recur/official-spell-compiler-report.json
node tools/report-composition-families.mjs /tmp/phase23-recur/official-spell-compiler-report.json
node tools/report-cross-family-speed.mjs /tmp/phase23-recur/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/speed-family-baseline.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-recur/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
node tools/report-escape-family.mjs /tmp/phase23-recur/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/escape-family-baseline.json
node tools/report-rule-family.mjs recurring-saves /tmp/phase23-recur/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/recurring-family-baseline.json
```

Live: `const h = await import('/modules/pf2e-automatic-resolution/tools/phase23-recurring-verification.mjs')`. Run `environment`, `degrees`, `endMode`, `reduceMode`, `jump` and `prepareReload`. Reload, then run `reload`, followed by `prepareUi` (click the panel's Roll control and roll the dialog) and `verifyUi`. Finish with `cleanup`.
