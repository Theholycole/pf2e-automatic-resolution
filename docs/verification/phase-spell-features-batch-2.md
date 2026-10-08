# Spell features batch 2: Sorcerer blood magic

2026-10-05, from the spell features audit (`docs/planning/spell-features-audit.md`).

PF2e tags a sorcerer's blood magic spells (`blood-magic-spell`) and links each bloodline's Effect in their description, but leaves applying it to the player. Now:

- **The reader:** `src/compiler/blood-magic.js` reads each bloodline's blood magic text, PF2e's own (18 bloodlines, exported to `.cache/pf2e-spell-features/blood-magic-texts.json`), into its options:
  - an Effect for the caster or a target (from the text's "you gain a +N … bonus", "a target takes a –N … penalty" or "You or one target is granted …");
  - Imperial's and Shadow's pick, preset on PF2e's ChoiceSet;
  - temporary Hit Points (Undead, Phoenix);
  - Concealed for 1 round (Harrow, Fey);
  - damage equal to the spell's rank (Undead void, Psychopomp void or vitality, Elemental the bloodline's element, Aesir electricity, Phoenix and Diabolic fire);
  - Hag's spite.
- **The card:** `scripts/blood-magic-runtime.js` posts it when a tagged spell is cast. Each option has a button for the caster or the targeted creature.
- **Tenacious Blood Magic:** tick it to make a 1-round effect last 1 minute, once per minute.
- **Blood Sovereignty:** a second, different effect for 2 × the rank in Hit Points.
- **Blood Rising:** posting the feat's card gives the card again. The target must be the caster or the creature whose spell triggered it, and the effects last until the caster's next turn. Blood Ascendancy allows a second effect.
- **Hag's spite:**
  - a watching Effect;
  - its button starts the basic Will card for the creature that damaged the caster;
  - unspent, it gives temporary Hit Points equal to the rank as the caster's next turn begins.
- **Which bloodline:** read from PF2e's blood magic toggle; the actor's bloodline features when no toggle is set.

## Tests

`test/spell-features-batch-2.test.js` (2): every bloodline read, and its options.

## Evidence

[Live evidence](phase-spell-features-batch-2-live-results.json), case `spellFeaturesBatch2`, in the `pftest` world. Each caster is a level 5 character with a bloodline, casting Angelic Halo (a sorcerer focus spell, which PF2e tags) at 3rd rank.

| Step | Result |
| --- | --- |
| Angelic with Tenacious Blood Magic: its card; "You", Tenacious ticked | 2 options and the Tenacious box; Effect: Angelic Blood Magic on the caster for 1 minute |
| Undead: "A target" on a foe | 3 void damage |
| Imperial: +1 AC | The Effect's pick preset to AC |
| Shadow: "A target" on a foe | –1 Perception |
| Hag: spite; the caster's next turn | The spite Effect; 3 temporary Hit Points, the spite spent |
