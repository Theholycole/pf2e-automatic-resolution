# Counteract family (part 7): area wards, seeing through, secret suppression — verification

2026-09-26. This extends the [standing wards](phase-4-counteract-wards.md) to areas the caster places, and to the GM's secret checks that reveal rather than end. It also covers a secret counteract that suppresses illusions for the spell's duration.

## Change

**Compiler (`affliction-care-compiler.js`):**
- **Planar Seal:** “You create a visible magical barrier that attempts to counteract teleportation effects and planar travel into or out of the area, …” becomes a ward on the caster until daily preparations (“until your next daily preparations” is now read too). The summoning sentence is a note.
- **Dispelling Globe:** “… as if the globe were a Dispel Magic spell 1 rank lower than its actual spell rank.” becomes a ward with `rankOffset: -1`, a success text (only the portion entering the globe is prevented), and the placement sentence as a casting condition.
- **Truesight:** “You see things within 60 feet …” (a range note) and “The GM rolls a secret counteract check … only for the purpose of determining whether you see through it (…)” become a ward with `secret` and `seeThrough`.
- **Glimpse the Truth:** “The GM attempts a secret counteract check against each illusion …” + “Instead of counteracting the illusion, you see through it (…).” become a ward with `secret` and `seeThrough`, lasting 1 round (round durations are now read). Heightened (7th) adds a note.
- **Unblinking Flame Revelation** (Target `the creature you hit`, now a complete target): “The GM attempts a secret counteract check against each illusion affecting the creature; on a success, you suppress the illusion for the duration, …” becomes a counteract against every illusion-trait Effect (`secret`), with each success set aside (`suppress`) for the spell's 2 rounds.

**Runtime:**
- **Wards:**
  - The check's rank is the ward's rank plus `rankOffset`.
  - A `secret` ward rolls blind and whispers its result to the GM.
  - A `seeThrough` success reads “The check succeeds against X: you see through it (it doesn't end).”, and a failure reads “you don't see through it”.
- **Care counteracts:** a `secret` counteract rolls blind, and the card is whispered to the GM. A `suppress` set-aside may have a fixed duration (rounds use turn-start expiry).

## Coverage

**New:** Planar Seal, Dispelling Globe, Truesight, Glimpse the Truth, Unblinking Flame Revelation.

**Census:** **377 enabled**, up from 372 (Counteract: 16 of 22).
- The corpus diff against b53 changed exactly these 5 plans. Steal the Sky only gained its target reading.
- The speed, escape and six rule-family checks report 0 regressions.

**Left in the family:**
- Elemental Counter (losing a slot of the countering element);
- Planar Tether (a save decides the ward's duration);
- Detonate Magic (a counteract that gates an explosion save);
- Quench (fire creatures in a sustained area plus one magical fire);
- Swallow Light (a counteract that grants a breath weapon);
- Thief of Fortune (copying a spell effect with halved duration);
- Umbral Graft, Seize Soul;
- area auras inside other routes (Astral Labyrinth, Carrion Mire, Scouring Sand, Aqueous Orb, Wall of Water …).

## Evidence

**Automated:** 404/404 tests pass.
- `test/counteract-care.test.js` covers each plan, Glimpse's heightened note, the suppression's duration, and the refusal of a positive rank offset.
- `test/set-aside.test.js` covers the fixed-duration suppression.

[Live evidence](phase-4-counteract-area-wards-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `counteractAreaWards`:
- **Planar Seal:** an unlimited ward on the caster; “Test teleport” (DC 1, rank 5) was counteracted; resting for the night ended it.
- **Dispelling Globe (cast at rank 4):** the check read “rank 3 (-1) vs 4”, and the success text said only the portion entering the globe is prevented.
- **Truesight:** the roll was secret and the result was whispered to the GM: “The check succeeds against Test illusory disguise: you see through it (it doesn't end).”
- **Glimpse the Truth:** 1 round, secret.
- **Unblinking Flame Revelation:**
  - The illusion Effect was suppressed, with a 2-round marker, and the card was whispered.
  - After 13 s of game time the illusion was back.
- **Regressions:** `counteractWards`, `counteractSetAside` and `care` were rerun, then cleanup.
