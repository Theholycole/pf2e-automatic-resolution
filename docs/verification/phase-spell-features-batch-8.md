# Spell features batch 8: actions that change a spell

2026-10-06, from the spell features audit (part G2).

PF2e's actions compendium has 66 actions whose text mentions spells. Most are creature abilities with saves of their own, or bookkeeping (Learn a Spell, Borrow an Arcane Spell). These change how an official spell is cast or resolved (`scripts/spell-actions-runtime.js`):

| Action | Text | At the table |
| --- | --- | --- |
| Spellstrike, Eldritch Shot, Spell-Woven Shot, Spellsling | "Cast a Spell that takes 1 or 2 actions … Make a Strike … using your attack roll result to determine the effects of both the Strike and the spell" | A caster with the action casting a fitting spell gets a card. Its button marks the cast delivered. The spell attack is then read from the caster's Strike against the target, made after the cast. Spellstrike also takes save spells: the target saves normally, but a critically failed Strike disrupts the spell |
| Intercession Spell | "Trigger Your hierophant Casts a Spell … They do not expend the spell slot, usage, or Focus Point" | An allied creature with the action gets a card on a non-cantrip cast; its button gives the slot back. Whether the caster is its hierophant is the table's |
| Dueling Counter | "Expend a prepared spell or spell slot … counteract the triggering spell with the expended spell" | Offered among the Counterspell options (casting-rules-runtime.js); the duel and tradition focus are the table's |
| Absorb into the Aegis | "counteract check, using your Religion modifier … On a success … your shield takes damage equal to four times the spell rank … On a failure, … twice" | A card for a foe of the caster with a held shield, when the spell targets it or an ally within 15 feet. Counteract rank is half its level; the shield's Hardness reduces the damage |
| Only You and I | "must attempt a Will save against your class DC whenever it tries to … Cast a Spell that doesn't include you as a target. On a failure, … disrupted" | Rolled as the creature under PF2e's Effect casts. A failure loses the spell |
| Ring Bell (Distracting Cacophony) | "Fortitude save … or become Stupefied 1 until the end of your next turn (Stupefied 2 on a critical failure) … lower the spell attack modifier or spell DC of the triggering spell" | A card for a thaumaturge with the action within 30 feet of the caster. The stupefied lowers the DC when the spell's card opens. Whether the caster is the Exploit Vulnerability target is the table's |
| Draw From the Pages | "it's automatically heightened to a rank equal to half your level. Use mythic proficiency …" | Read from its text. Posting the action arms the next spell: heightened to half the level, at mythic proficiency |

The GM's: Shift Spell (its spellshifts), Arcane Cascade (the damage type of the spell cast), Pitch-Perfect Projection (range, which the module doesn't measure), Drain Bonded Item and Repeat a Spell (recasts PF2e's bookkeeping covers), Fuel Impossible Spell.

## Evidence

[Live evidence](phase-spell-features-batch-8-live-results.json), case `spellFeaturesBatch8`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Magus with Spellstrike: Ignition, delivered; the longsword's Strike hits | The card's result is the Strike's: success |
| Fear, delivered; the Strike against AC 100 | Critical failure: the Fear disrupted |
| A spontaneous caster's Fear (slot spent); an ally with Intercession Spell | Its card; the slot back (1 → 2) |
| A foe's Fear at the champion | Dueling Counter offered to the duelist; Absorb into the Aegis: success, countered, the shield's 4 damage stopped by Hardness 5; Ring Bell: critical failure, the caster Stupefied 2 |
| The foe under Only You and I casts Fear at another | Will critical failure: the Fear disrupted |
| Draw From the Pages posted; Fireball cast at rank 3 | Cast at rank 7 (half of level 13), mythic proficiency |
