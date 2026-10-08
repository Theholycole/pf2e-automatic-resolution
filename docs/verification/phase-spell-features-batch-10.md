# Spell features batch 10: the rest of PF2e — boons, curses, relics and heritages

2026-10-06, from the spell features audit (part G4).

## What was read

I searched the compendiums the earlier parts hadn't, for text on casting (67 matches, each read):

| Compendium | Entries | Mention casting |
| --- | --- | --- |
| Ancestries | 50 | 0 |
| Ancestry features | 55 | 2 |
| Heritages | 328 | 25 |
| Backgrounds | 520 | 7 |
| Deities | 480 | 0 |
| Boons and curses | 247 | 9 |
| Society boons | 157 | 2 |
| Adventure actions | 208 | 15 |
| Kingmaker | 132 | 0 |
| Campaign Effects | 76 | 7 |

## Already handled, or not a change to a spell

- **Innate spells PF2e already heightens:** the heritages' and backgrounds' "A cantrip is heightened to a spell rank equal to half your level rounded up".
- **Rules PF2e already applies:**
  - the Makari Lizardfolk's lost manipulate trait (ItemAlteration);
  - Pharasma's Moderate Boon (+1 per rank);
  - the campaign Effects (Level Bump, Favor of a Past Benefactor).
- **Afflictions:** counteracts against poisons and diseases, outside the module's spell casting (Awful Scab, Little Ripple's Blessing).
- **The GM's:**
  - Eclipseborn's reroll;
  - Nethys's Major Boon (preparation);
  - the relics' counteracts of conditions;
  - Fight Fires;
  - Dispel a Disguise.

## Now carried out

| Entry | Text | At the table |
| --- | --- | --- |
| Nethys – Moderate Curse | "Whenever you cast a spell, attempt a DC 11 flat check. On a failure, if your spell was harmful, you instead cast a beneficial spell of the same rank … You still lose the spell slot" | The flat check on every cast. A failure loses the spell, and the GM is told to cast the opposite kind at the same rank on the same targets (`casting-rules-runtime.js`) |
| Sarenrae – Major Curse | "spells you cast … are nonlethal except against fiends and undead … You deal minimum damage except against fiends and undead … +4 status bonus to their AC and saving throws" | The cursed caster's spells carry the nonlethal rider, except against fiends and undead: a creature brought to 0 is knocked out. The minimum damage and the +4 are told to the GM on each cast |
| River's Reflection (relic) | "If the next action you use is to Cast a Spell with the vitality or void traits … All void damage becomes vitality damage and vice versa" | Read from its text, like Draw From the Pages: posting it arms the next vitality or void spell, whose damage type is swapped. The healing's swap is told to the GM. (It has the spellshape trait, so it's read this way when the feats' own reader doesn't know it.) |

## Tests

`test/spell-features-batch-9.test.js` gained River's Reflection's reading (4 tests in all).

## Evidence

[Live evidence](phase-spell-features-batch-10-live-results.json), case `spellFeaturesBatch10`, two runs, in the `pftest` world. The casters are characters, since boons, curses and relic actions are feats.

| Step | Result |
| --- | --- |
| Nethys's curse: Fireball | Rolled 14: kept. Rolled 9: lost ("the opposite spell of the same rank is cast instead") |
| Sarenrae's curse: Fireball at a humanoid and an undead at 5 HP (both fail) | Both to 0. The humanoid knocked out (Unconscious); the undead not |
| River's Reflection posted; Void Warp | Armed; its damage "4d4 vitality" |
