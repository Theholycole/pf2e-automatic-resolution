# Rank 2 batch 82 — Oil-Slicked Walls

2026-10-01. The ritual-outcome family (batches 79–81), following the accepted ritual workflow (decision ticket 07). This completes rank 2: all 245 milestone-scope rank 2 spells are enabled.

| Spell | Now |
| --- | --- |
| Oil-Slicked Walls (2, ritual) | The GM gives the result and the secondary caster (at most 1). **Success / Critical Success:** the GM draws a region over the affected walls and selects it; without one the ritual is refused. A placed lingering area lasts 1 week. Each creature inside holds an Effect: −5 (−10 on a critical success) to Athletics checks with `action:climb`. This is the DC's increase written as a penalty to the check, so the degrees are the same. On a critical success a Climb failure also carries the note "drops anything it is carrying". A creature that leaves loses the Effect, and it ends with the area. **Failure:** no effect. **Critical Failure:** the GM gives the ritual's casting DC. Every caster holds a "phantom oil" Effect for 1 week under a native record. In combat, each caster's first move in each encounter brings a card: Reflex save or Acrobatics (Balance) against that DC, where a failure is Prone; or "It Stepped or Crawled", with no check. |

## Rules

**`ritual-outcome.js`** gains:
- "The DC for Athletics checks to Climb the affected walls increases by N[, and a creature who fails a check to climb also drops anything they are carrying].";
- "For 1 week, the first time each encounter that a primary or secondary caster takes an action to move, they must attempt a Reflex save or Acrobatics check to Balance against the ritual's casting DC or fall Prone.", which needs "A caster can Step or Crawl without having to attempt a check or save.";
- the ritual's duration for an area.

**Runtime:**
- `startAreaRules` / `syncAreaRules` (`ongoing-families.js`), a placed lingering area whose members hold an Effect of given rules, called in the lingering reconcile next to `syncWeb`;
- the climb rules (a FlatModifier and a Note);
- the slip record (`ritualSlip`: casters, the GM's DC, and who has been seen in which combat);
- `ritualSlipCheck` from an `updateToken` hook (active GM, a started combat with the caster in it);
- `ritualSlip` and the card's three buttons. Answering marks the card resolved, so it can't be answered twice.

## Tests

958/958 pass. `test/rank-2-batch-82.test.js` is new. It checks:
- every degree;
- that changed drop, exemption or fall riders aren't read, and that a changed increase is.

A whole-corpus compile (b337 → b338) changed Oil-Slicked Walls. It also changed the three earlier rituals' plans by the new empty fields (`climb`, `slip`); all four are automatic.

## Coverage

**Census:** **1159 enabled** (milestone), up from 1158. Rank 2: **245 of 245**.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-82-live-results.json), case `rank2Batch82`, in the `pftest` world.
- **No region:** refused.
- **Success:** the climber in the region got `ritual-climb-dc` −5 with `action:climb`, and nothing without it. The outsider had no Effect. Moving out removed it.
- **Critical Success:** −10, and the drop note in its Athletics roll notes. Ending the area removed the Effect.
- **Failure:** nothing.
- **Critical Failure (DC 20):** both casters had phantom oil. In combat, two moves by the caster brought one card. Its Reflex (−30) failed, and the caster was Prone. The secondary caster's card answered "Stepped or Crawled" gave no check and no Prone, and a second answer was refused. Ending the record removed both Effects.
- **Cleanup:** fixtures, the combat and the regions removed. The 6 active ongoing records left in the world all predate this session's runs.
