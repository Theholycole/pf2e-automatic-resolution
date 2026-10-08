# Spellshape batch 18: the wands' buttons

2026-10-05, continuing the user's "automate as much as you can". Each of these wands posts a card at the cast. The GM targets a token and presses the card's button.

- Wand of Refracting Rays: the ray is cast again at the targeted creature, with its own attack and color. It must be within 30 feet of the last creature and not targeted before. After a hit, the card comes back; after a miss, the refraction ceases.
- Wand of Chromatic Burst: the GM picks a color; the armored creature's Chromatic Armor Effect is removed, and a 20-foot emanation basic Reflex card of that color's type starts at the cast's rank.
- Wand of Legerdemain: each enemy within 30 feet of the caster gets a Will card; a failure makes it Fascinated until the end of the caster's next turn.
- Wand of Teeming Ghosts: false vitality ends (its Effect and its temporary Hit Points) and the targeted creature's frightened rises to 2.
- Wand of Shattering Images: the destroyer takes 5 slashing if it's adjacent to the caster, and nothing otherwise.
- Wand of Rolling Flames: the targeted square and the squares around it become difficult and hazardous terrain until the caster's next turn. A creature that ends its turn without moving takes 1 fire for each of its squares in the flames.

## Evidence

[Live evidence](phase-spellshape-batch-18-live-results.json), case `spellshapeBatch18`, in the `pftest` world. The `pftest` scene holds many tokens left by other cases, so the area cards list them too. The test checks the creatures it set up.

| Step | Result |
| --- | --- |
| Refracting Rays: refract to the other foe (green) | A critical hit, 50 poison; the card again (chain 2); refracting back to the first foe is refused |
| Chromatic Burst: red | The armor Effect gone; a fire Reflex card including the foe |
| Legerdemain (Grease): the spotlight; a failure | A Will card for the enemies within 30 feet (not the ally); the foe Fascinated |
| Teeming Ghosts: the foe frightened 1 | Frightened 2; 0 temporary Hit Points; False Vitality ended |
| Shattering Images: the adjacent foe; a foe 20 feet away | 5 slashing; nothing |
| Rolling Flames: at the foe; its turn without moving | A 3×3 Region, difficult terrain; 1 fire as its turn ends |
