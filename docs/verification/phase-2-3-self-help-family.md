# Self-help endings, creature-state eligibility and preamble safety — verification

2026-09-25. This batch lets an affected creature end a condition with its own Interact action, generalizes the Escape grammar, adds GM-confirmed creature-state eligibility, and tightens two save-preamble signals. It adds no spell-name or ID dispatch.

## Coverage

New shared-save routes (5):

- **Dazzling Flash:**
  - Failure: Blinded for 1 round, ending early when the creature spends an Interact action; Dazzled for 1 minute.
  - Critical failure: Blinded for 1 round and Dazzled for 1 hour, with no Interact ending.
- **Slime Spit:**
  - Critical success: no damage.
  - Success: Dazzled for 1 round, or until the creature Interacts to wipe its eyes.
  - Failure: Dazzled until the end of your next turn.
  - Critical failure: Blinded for 1 round, and Dazzled until the creature uses an Interact action.
- **Grasp of the Deep:** on a failure or critical failure (double damage), Grabbed for the spell's 1-minute duration or until the creature Escapes against the spell DC (“…can attempt to Escape with an Escape DC equal to your spell DC”).
- **Boil Blood:** each target needs the GM's confirmation of “Does the creature have blood?” before Finalize. Creatures confirmed as bloodless are immune; the rest take fire damage and Drained 2 or 3.
- **Reblooded:** undead only; persistent acid by degree, plus Clumsy for 1 minute.

**Withdrawn route: Pollen Pods.** The shared save resolved damage and conditions immediately at casting. The spell actually creates four motion-triggered bulbs that each blossom separately during a 12-hour duration. The preamble checker now recognizes entry triggers, and the withdrawal is recorded with its reason in [`withdrawn-routes.json`](../planning/withdrawn-routes.json). Regression tools accept a lost route only when it is listed there. A sweep of all enabled shared-save spells found no other deferred-trigger or placement wording.

The [family audit](../../reports/phase-spell-batches/self-help-family-audit.md) covers **122 unique members**:

| Family | Members | Executable shared saves |
| --- | ---: | ---: |
| Conditions ended by Interact or Escape | 18 | 2 |
| Creature-state immunity | 5 | 1 |
| Save preambles mentioning while, entering or counteract | 102 | 1 |

## Safety corrections

- **Conjunctive “while”:** in a save preamble, “while” was treated as an ongoing trigger even as a plain conjunction (“…, while the blood itself damages the flesh of the undead”). It now signals only as a clause opener, with a subject state (“while it is…”), or for “while the spell/effect…”.
- **Entering an area:** this is now recognized in its own right. The old “while” pattern had caught it only by accident, which exposed Repulsion and the Pollen Pods error.
- **Counteract:** counteracting in a save preamble was never flagged. Eclipse Burst, Maze of Locked Doors and six others now carry `preamble:counteract`.
- **No-damage outcomes:** “takes no damage” is claimed only when the compiled outcome deals no damage.

## Implementation contract

- **Interact grammar:** three clause-scoped forms: `…until it uses an Interact action[ to …]`, `…, though it can Interact to … and remove the condition`, and the standalone sentence `The creature can spend an Interact action … to end the X condition.`. A purpose phrase must end at punctuation within 40 characters. The standalone form must name exactly one compiled condition of that outcome.
- **Interact core:** `isActionEndLifetime` accepts only `[{event: "action", action: "interact"}]`, either first-of with a fixed timer or alone.
- **Interact runtime:** these conditions get their own Effect, flagged `actionEnd`. The Ongoing spells panel offers “<creature>: Interact to end <condition> — 1 action” to that creature's owner or a GM. The coordinator re-checks ownership and deletes only that Effect (reason `action-ended`).
- **Escape grammar:** it now also accepts “, but it can attempt to Escape with an Escape DC equal to your spell DC”. Without a timer, the Effect lasts for the spell's duration.
- **Creature-state eligibility:** exact whole-spell sentences (“a creature with no blood is immune”; “creatures that lack X are unaffected by this spell”; “a creature that doesn't X is immune to this spell”) compile a `gm-confirmed` predicate with a question. “Immune to this effect” is ambiguous and stays a gap.
  - Each target starts with a pending confirmation, and the card shows the question with **Yes — affected** and **No — immune**.
  - Finalize refuses while any participating target is pending.
  - The answers map onto the existing Affected/Unaffected correction overrides.

## Evidence

**231/231 automated tests pass.** The new `test/self-help-eligibility.test.js` covers both Interact spells, the Escape phrasing, scope negatives, the confirmation workflow in the save core, the while/enter/counteract gates, the withdrawal record, and the exact event contract.

All family regressions pass: Speed 255, event-lifetime 111, recurring 74, damage-derived 47 and self-help 122. The only lost route is the documented withdrawal. The census gives **212 enabled nonritual routes** and **81 executable shared-save plans**; the primary worklists are Phase 2: 134 / 437 and Phase 3: 31 / 593.

[Live Foundry evidence](phase-2-3-selfhelp-live-results.json) on Foundry 14.367 / PF2e 8.5.0, from disposable `pftest` fixtures:

- **Dazzling Flash:** the failure recipient's panel control ended Blinded only. Dazzled, which PF2e had overridden while the creature was Blinded, then became active. The critical-failure recipient had no Interact control.
- **Slime Spit:** Interact ended the 1-round Dazzled (success) and the unlimited Dazzled (critical failure). The critical failure's Blinded remained. A **real mouse click** on the panel control performed the same ending.
- **Grasp of the Deep:** Grabbed for 1 minute; a scripted Escape of 24 against DC 24 posted the GM card, and ending it removed Grabbed.
- **Boil Blood:** Finalize was refused with both confirmations pending. After confirmation, the creature with blood took damage and Drained 2, and the confirmed bloodless creature was untouched.
- **Reblooded:** the living target was ineligible. The undead target received Clumsy 1 for 1 minute and 2d6 persistent acid.

The harness triggers Interact endings through the control's own request after confirming the panel offers the control, because synthetic DOM clicks race the panel's re-render. The real-click result is recorded as its own case. Fixtures were removed after export.

## Reproduction

Same pipeline as the [damage-derived batch](phase-2-3-damage-derived-family.md), using `/tmp/phase23-b4`, plus:

```sh
node tools/report-rule-family.mjs self-help /tmp/phase23-b4/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/self-help-family-baseline.json
```

Live: `const h = await import('/modules/pf2e-automatic-resolution/tools/phase23-selfhelp-verification.mjs')`, then run `environment`, `dazzlingFlash`, `slimeSpit`, `graspOfTheDeep`, `boilBlood`, `reblooded`, and finally `cleanup`.
