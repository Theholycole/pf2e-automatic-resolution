# Sustained condition lifetime — verification

2026-09-25. Sustained save spells with a degree-of-success table were refused (“The save route cannot manage this lifecycle or controller”), because nothing ended their conditions when the caster stopped sustaining. This batch adds that controller to the shared save route. There's no spell-name dispatch.

## Rule

**Which plans qualify** (`isSustainedConditionPlan`): a non-basic save (a degree table) whose spell is sustained with a fixed maximum (“sustained up to 1 minute”), and which isn't a lingering area.

**How long conditions last:**
- **No stated duration:** a condition in the table lasts while the caster Sustains, and never past the maximum. Its Effect is given the maximum as its PF2e duration, so it expires even if the controller is unavailable.
- **“For the duration of the spell”:** compiled as a spell-lifetime condition (`endsWhen: spell-ended` with the sustained duration). It's accepted only on such a plan; any other plan with one is refused (`spell-lifetime`), so it can't outlive a spell nobody controls.
- **Stated duration:** a condition with its own duration (“Encumbered for 1 round”) keeps it.

**Compiler guard:** a sustained save whose rules text mentions Sustain anywhere else (repeat saves, moving or growing an area, extra effects) gets `sustain-effect` and stays blocked, so those rules are never silently dropped.

## Runtime

**The cast record:** the save card records `sustained: {castRound, maximumSeconds}`. When conditions are applied, the cast's native outcome record in the Ongoing panel (which owns the condition Effects) gets `sustained`, `castRound` and `maximumAt`.

**Each reconcile** (`OngoingFamilies.reconcileSustainedNative`) uses its own `sustainClock`, so the existing recovery and recurring-save steps keep their clock. It:
- ends the cast at the maximum (`maximum-duration`);
- asks for Sustain on each of the caster's turns after the cast round, including the first turn of an encounter that starts after casting;
- ends the cast when the caster's turn ends unsustained (`missed-sustain`);
- sends turn changes missed while no coordinator was running to GM review.

Ending removes every Effect the cast applied.

**Controls:**
- The Ongoing panel shows “Sustain <spell> — 1 action (its conditions end if not sustained)” to the caster's owners and the GM.
- A resumed review resets the Sustain clock.

## Coverage

**New (Phase 3):**
- **Information Overload:** also relies on the compact-table batch.
- **Unexpected Windfall:** Encumbered “for the duration of the spell”; Encumbered for 1 round on a success; Prone added on a critical failure.

**Still blocked, with reasons:**
- Personal Blizzard (its shared damage isn't used);
- Dirge of Remembrance (semi-corporeal, ghost touch);
- Freezing Rain and Fiendish Rift (other Sustain rules, now reported as `sustain-effect`);
- about 30 more sustained spells that mention Sustain beyond keeping the spell going.

**Census:** **288 enabled.** No route was lost, and all family regressions show 0. The 34 changed plans are mostly disabled sustained spells that now also report `sustain-effect`.

**Tool fix:** `tools/test-cross-family-speed.mjs` expected every newly audited spell to be a one-time save. That broke once a lingering area (The Queen's Rainbow) was recorded. An audited spell that's an executable lingering area must now not be a one-time save.

## Evidence

**Automated:** 293/293 tests pass. The new `test/sustained-conditions.test.js` covers:
- both spells and the fixed maximum;
- the spell-lifetime condition, and it being refused without the controller;
- an unbounded Sustain being refused;
- any other Sustain rule blocking the spell.

[Live evidence](phase-3-sustained-conditions-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Unexpected Windfall:**
  - a failed save applied Encumbered, held by a sustained cast;
  - the encounter started on the caster's turn and asked for Sustain; sustaining kept Encumbered;
  - the next round asked again, and ending that turn unsustained ended the cast (`missed-sustain`) and removed Encumbered.
- **Information Overload:** a critical failure applied Stupefied 2 and a success nothing. Advancing world time past the minute ended the cast (`maximum-duration`) and removed Stupefied.
- **Regressions:** the native outcome records' other steps (Sickened recovery, recurring saves, timed Stunned) were rerun with the rider harness (Torturous Trauma, Vomit Swarm, timed Stunned, Gritty Wheeze), and all passed.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `sustainedConditions`, then `cleanup`.
