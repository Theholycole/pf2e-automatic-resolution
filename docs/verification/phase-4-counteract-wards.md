# Counteract family (part 6): standing wards — verification

2026-09-26. This continues the counteract family ([1](phase-4-counteract-care.md) · [2](phase-4-counteract-spells.md) · [3](phase-4-counteract-set-aside.md) · [4](phase-4-counteract-many.md) · [5](phase-4-light-darkness-counteract.md)). Some spells last and counteract something *whenever it comes up*: a named spell, detection and scrying, a harmful polymorph, a targeted spell.

## Design

- **The marker:** casting puts a marker Effect on the warded creature (or the caster). It has the spell's duration, or unlimited for “until the next time you make your daily preparations”. It's flagged as a `counteract-ward` with the ward's cast rank and rules, and registered with **Ongoing spells** as a native record.
- **The control:** Ongoing spells shows **Counteract with <spell>** (prefixed “Reaction:” for a reaction ward) to the caster's owner or GM. It asks for the effect's name, counteract DC and rank (“a cantrip counts as 1st rank” where the ward says so). The coordinator rolls the ward spell's PF2e counteract statistic at the ward's cast rank and posts the result, with the ward's success text. A ward that ends after one use ends there.
- **Ending:** a daily-preparation ward ends when its caster rests for the night (`pf2e.restForTheNight`). A timed ward ends when PF2e removes its expired Effect.

## Compiler (`affliction-care-compiler.js`)

| Spell | Sentences | Ward |
|---|---|---|
| Spell Immunity (1 creature) | “Choose a spell and name it aloud …” · “… attempts to counteract that spell whenever …'s target is the target of the named spell or in that spell's area.” · the area/multiple-targets sentence | `named`, `untilDailyPreparations`, one note |
| Veil of Privacy (1 creature or object) | “… attempts to counteract all detection, revelation, and scrying effects used against the target or the target's gear throughout the duration, counting cantrips as 1st-rank spells …” · the area sentence | 8 hours, `cantripRank: 1`, one note |
| Rigid Form (self) | “For the duration of this spell, whenever you're targeted by a harmful polymorph effect, you can use your reaction to attempt to counteract the effect.” · Heightened (6th) “The duration increases to 10 minutes.” | `reaction`, 1 minute (10 at 6th) |
| Spell Turning (self) | “When a spell targets you, you can spend a reaction to attempt to reflect it.” · “… turned back on the caster.” · “Whether or not … then ends.” · the targeted-only and mutual-turning sentences | `reaction`, `successText`, `endsAfterUse`, 1 hour, two notes |

**Restrictions:**
- A ward must be the spell's only operation and needs a trigger and a supported duration.
- “1 creature or object” is read only for a ward, and the runtime wards a creature token.

## Coverage

**New:** Spell Immunity, Veil of Privacy, Rigid Form, Spell Turning.

**Census:** **372 enabled**, up from 368 (Counteract: 13 of 22).
- The corpus diff against b52 changed exactly these 4 plans.
- The speed, escape and six rule-family checks report 0 regressions.

**Left in the family:**
- area wards and auras (Planar Seal, Dispelling Globe, Truesight, Glimpse the Truth, Astral Labyrinth);
- a save spell with a counteract ward (Planar Tether);
- Elemental Counter (losing a slot of the countering element);
- Detonate Magic (a counteract that gates an explosion);
- Quench (fire creatures in a sustained area and one magical fire);
- Swallow Light (a counteract that grants a breath weapon);
- Thief of Fortune (copying a spell effect with its duration halved);
- Unblinking Flame Revelation, Umbral Graft, Seize Soul.

## Evidence

**Automated:** 402/402 tests pass. `test/counteract-care.test.js` covers:
- each ward's plan, and Rigid Form's duration by rank;
- **refusals:** a ward without a supported duration, and a tampered cantrip rank.

[Live evidence](phase-4-counteract-wards-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `counteractWards`:
- **Spell Immunity:**
  - The ally got “Spell Immunity (Fireball)”, with an unlimited duration and an active Ongoing record.
  - DC 1 was counteracted; DC 80 at the cast rank wasn't.
  - `pf2e.restForTheNight` for the caster ended the record and removed the Effect.
- **Spell Turning:** the ward counteracted a rank-5 spell (“the spell is turned back on its caster. Spell Turning ends.”); the Effect was removed and the record ended.
- **Rigid Form at 6th rank:** 10 minutes, as a reaction; after 601 s of game time the Effect was gone.
- **Veil of Privacy:** 8 hours, with cantrips as rank 1. A counteract succeeded and the ward stayed active.
- **By hand:** Ongoing spells listed “Counteract with Veil of Privacy”. Clicking it opened the dialog, which showed the trigger, the note and the cantrip hint. Entering “UI scrying”, DC 1, rank 1 posted “critical success (rank 3 vs 1). GM to apply: UI scrying is counteracted.”
- **Regressions:** `counteractCare`, `counteractSpells` and `care` were rerun, then cleanup.
