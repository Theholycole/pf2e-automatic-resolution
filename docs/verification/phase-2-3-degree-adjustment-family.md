# Degree adjustments and timed Stunned — verification

2026-09-25. This batch adds two shared rules:
- **Timed Stunned.** An unvalued Stunned with a stated duration takes away all actions for that duration. It uses a named timed Effect with no action-debt recovery; valued Stunned is still action debt.
- **Creature-dependent degree adjustments.** They are compiled from the save preamble and evaluated per target, from PF2e traits or from a GM answer.

No spell-name or ID dispatch was added.

## Coverage

New shared-save routes (5):

- **Synaptic Pulse, Pain of Ages, Dizzying Colors:** timed Stunned on a critical failure. Synaptic Pulse's plan was already complete, so the core change alone enables it. Pain of Ages also uses the guarded causal flavor suffix (“as it reels from the impact of so much anguish”). Dizzying Colors needed the duration summary “1 or more rounds (see below)” to be treated like “varies”, so its duration comes from the degree table.
- **Gritty Wheeze:** water and plant creatures use the outcome one degree worse. This is a trait predicate; no GM question is asked.
- **Spiritual Anamnesis:** for “undead and creatures that have lived a previous life…”, a critical success counts as a success and a failure as a critical failure. The GM answers per target before Finalize.

The [family audit](../../reports/phase-spell-batches/degree-adjustment-family-audit.md) has **35 unique members**:
- 28 with creature-dependent degree shifts, 2 of them executable.
- 9 with unvalued timed Stunned, 3 of them executable.

The rest stay blocked by their own rules:
- **Breath of Drought:** its adjustment compiles, but its area-entry trigger doesn't.
- **Heat Metal:** the improvement depends on choosing to Release the item.
- **Hypnopompic Terrors:** the shift applies only to sleeping targets and also wakes them.
- **Eject Soul:** allies choose their own degree.
- **Divinity Leech:** an ongoing trigger.

Every non-matching wording keeps `preamble:degree-adjustment`.

## Rules

- **Timed Stunned** (`isTimedStunned`): Stunned with no value and a fixed rounds or minutes duration. It is granted as Stunned 1 inside an Effect named “Stunned (can't act for 1 round)” and gets no `stunned-actions` recovery; the condition ends with the Effect. Correcting the value on a timed Stunned is rejected.
- **Trait subjects:** “X creatures (and Y creatures)”, “Creatures made of X (such as X elementals)…”, “creatures with the X (or Y) trait(s)”. The phrasing must be “use the outcome one degree of success worse/better than the result of their saving throw(s)” or “attempting a save against this spell get a degree of success one worse/better than they rolled”. An unknown trait word makes the sentence ambiguous and blocks the route.
- **Described populations:** only the exact explicit-map sentence compiles, into a `gm-confirmed` question. Changing any word blocks the route again (tested).
- **More than one adjustment sentence** is treated as ambiguous and blocks the route.
- **On the runtime card:**
  - Each target snapshots whether the adjustment applies.
  - The card stores `rolledDegree` and shows “Spell rule: rolled → effective”.
  - Readiness blocks while any rolled target has an unanswered question. Answers use the correction actions `adjustment-applies` and `adjustment-not-applicable`.
  - A GM degree correction is final and is not re-adjusted.

## Evidence

**238/238 automated tests pass.** Coverage:
- Timed-Stunned compilation and link gating.
- Both adjustment forms, including the reworded-sentence block.
- Per-target application to the rolled degree.
- The GM question blocking readiness until answered, and a GM override staying final.

Two older tests were updated because Gritty Wheeze and Spiritual Anamnesis now compile their shifts instead of blocking. The Dehydrate block is still asserted.

The corpus delta against the degree-rider output changes 5 plans. Four become executable; Breath of Drought gains only the compiled adjustment. Synaptic Pulse's plan is unchanged; it is enabled by the core. The batch baseline is the prior 83 routes. All family regressions pass with 0 regressions:
- Speed
- event-lifetime
- damage-derived
- self-help
- degree-rider
- recurring
- degree-adjustment

Census: **219 enabled nonritual routes** and **88 executable shared-save plans**. Primary worklists: Phase 2 141 / 430 enabled / not enabled, Phase 3 31 / 593.

[Live evidence](phase-2-3-degree-adjustment-live-results.json) on Foundry 14.367 / PF2e 8.5.0 (disposable `pftest` world):
- **Timed Stunned:** checked on all three spells. Each got a named 1-round Effect with no recovery, and Stunned ended when world time advanced. Synaptic Pulse's valued Stunned 2 still uses action-debt recovery.
- **Gritty Wheeze:**
  - The plant target rolled a success, which became a failure, and it was Dazzled.
  - The humanoid target's critical failure stayed unchanged.
  - The card showed the “Spell rule” note.
- **Spiritual Anamnesis:**
  - Readiness was blocked, and named the question, until both answers were given.
  - A confirmed target rolled a failure, which became a critical failure: Stunned 3 plus Slowed 1. PF2e marks Slowed inactive because Stunned overrides it.
  - A declined target kept its rolled failure.
  - A real mouse click on **Yes — adjust degree** recorded the answer. Finalize stayed disabled until the save was rolled, then enabled.

Earlier attempts don't appear in the exported results. One ran against module code loaded before this batch (fixed by reloading the page). The other was a harness assertion that checked Slowed as active despite the Stunned override. Fixtures were removed after export.

## Reproduction

The same pipeline as earlier batches, using `/tmp/phase23-b6`, plus:

```sh
node tools/report-rule-family.mjs degree-adjustments /tmp/phase23-b6/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/degree-adjustment-family-baseline.json
```

Live: `tools/phase23-rider-verification.mjs` cases `environment`, `timedStunned`, `grittyWheeze`, `spiritualAnamnesis`, `cleanup`.
