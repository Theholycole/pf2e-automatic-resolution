# Spellshape batch 17: wands at the card and the template

2026-10-05, continuing the user's "automate as much as you can".

- Wand of the Ash Puppet: when Disintegrate's immediate card reduces a living creature to powder (`immediate-runtime.js` calls `shapeDisintegrated`), that creature's token is hidden. The caster's Sulfur Zombie appears in its space, with the minion and summoned traits and owned like the caster. It lasts 1 minute: the caster's Effect removes it, and it also ends at 0 Hit Points.
- Wand of Contagious Frailty: if Enfeeble leaves its target enfeebled, an Enfeeble save card goes to every creature within 10 feet of it (not the target itself), with each degree one step better.
- Wand of Choking Mist: when Mist's template is placed, PF2e's Effect: Remaining Air goes on the creatures in it.
- Wand of Fey Flames: when Faerie Fire's template is placed, a Will card goes to the creatures in it; a failure applies PF2e's Effect: Wand of Fey Flames.
- Wand of Caustic Effluence: on Grease's card, a failed Reflex save that leaves a creature prone deals 1d6 acid. Grease's area also becomes caustic ground for the spell's duration: a creature that begins its turn prone there takes 1d6 acid.
- Wand of Toxic Blades: a creature damaged by the spell's save card (Blessed Boundary's shell) gets a Cave Worm Venom save card at the poison's DC 32, at most once per turn.

Fixes found on the way:

- The immediate runtime (Disintegrate, Heal, Force Barrage) now finds a wand's own spell through `castSpellFromUuid`. Wand casts previously failed with "You do not own the caster".
- A consumable wand that PF2e stores no spell in (Wand of Caustic Effluence) now arms the next spell from its card and is read as a wand.

## Evidence

[Live evidence](phase-spellshape-batch-17-live-results.json), case `spellshapeBatch17`, in the `pftest` world. Toxic Blades' wall damage is a basic Reflex card named Blessed Boundary, which is what the module posts for the shell.

| Step | Result |
| --- | --- |
| Ash Puppet: Disintegrate hits; the foe (1 HP) critically fails | Powder; the Sulfur Zombie (minion, summoned) at the foe's square; 10 rounds; removed with the Effect |
| Contagious Frailty: Enfeeble, a failure | Enfeebled 2; an Enfeeble card for the creatures within 10 feet, without the foe |
| Choking Mist: the template around the foe | Effect: Remaining Air |
| Fey Flames: the template, a failure | The Will card; Effect: Wand of Fey Flames |
| Caustic Effluence: the template; the prone foe's turn begins | Caustic ground; 6 acid |
| Toxic Blades: the shell card, a failure | 25 force; a Cave Worm Venom card (DC 32) for that creature |
