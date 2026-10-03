# Rank 3 batch 126 — thralls as tokens

2026-10-03. The user asked for the thrall rules (from the thrall trait) to make tokens for every spell that creates thralls.

**Shared maker (`scripts/thrall-tokens.js`).** A thrall is an NPC token built from the rules:

- level −1, mindless undead, Small or Medium, 1 HP, Speed 15;
- immune to bleed, death effects, disease, mental and poison;
- every check of its own a failure (`AdjustDegreeOfSuccess`);
- AC 0, with a note that a critical success against it counts as a success;
- a Strike at the caster's spell attack modifier for 1d6 (+1d6 at caster level 5 and every 4 after), bludgeoning, piercing or slashing.

A spell's own numbers replace the defaults. The thralls go in the free squares nearest the given point. One Effect on the caster owns each creation for its time (1 minute unless stated), so ending it removes them. A thrall at 0 HP is removed on its own.

| Spell | Now |
| --- | --- |
| Create Thrall (cantrip) | New kind `thrall-create`. The caster chooses: two thralls, or one and its Command (a card line); Small or Medium. Placed beside the caster within 30 feet. |
| Bloody Tendrils (3) | With no targets, the area makes its tendril thralls (up to 3, +1 every 3 ranks): Medium, Speed 0, immune to physical damage, Strike reach 10. They are the area's centres. Targeted tokens still work as before. |
| Blossoming Gore (5) | A failed save makes 1 thrall, a critical failure 2, in the free squares just outside the field (replacing the GM line). |
| Bind Heroic Spirit (3) | The targeted thrall is removed. The card's control makes a thrall beside the creature the caster critically hit. |
| Spells that destroy "1 of your thralls" (Necrotic Bomb, Bone Spear, Dead Weight, Blood Infusion, Life Tap, Zombie Horde) | A module thrall token is removed; anything else stays the GM's reminder. |
| Zombie Horde (3) | Its growth control removes and counts the caster's module thralls in the area (otherwise it asks how many). |
| Conglomerate of Limbs (4) | Its thrall is flagged as one, so these spells find it. |

Thrall-making spells at rank 6+ (Perfected Thrall, Skeletal Lancers and others) aren't resolved yet; they'll use the same maker when they are.

## Tests

`test/rank-3-batch-126.test.js` is new.

A whole-corpus compile (b713 → b714) changed only Create Thrall, Bind Heroic Spirit, Bloody Tendrils and Zombie Horde (its notes). Blossoming Gore's change is runtime-only.

## Evidence

[Live evidence](phase-rank-3-batch-126-live-results.json), case `rank3Batch126`, with `rank5Batch91` (updated to expect the tokens), `rank3Batch81`, `rank3Batch109` and `rank5Batch94` rerun, all passing, in the `pftest` world.

| Step | Result |
| --- | --- |
| Create Thrall, two Small | 1 HP, Speed 15, AC 0, the five immunities; its Fortitude save a failure; Strike +14 (the caster's spell attack) |
| One thrall at 0 HP | Removed alone |
| The caster's Effect ended | The other removed |
| Create Thrall, one and Command | 1 thrall, the Command line |
| Bloody Tendrils with no targets | 3 tendril thralls (Speed 0, immune physical, reach 10) as the centres |
| Necrotic Bomb through a module thrall | The thrall removed |
| Zombie Horde growth with two thralls in the area | Both removed; 10 → 20 feet |
| Bind Heroic Spirit on a module thrall | It's removed |
| The critical-hit control | A thrall beside the target |
| Blossoming Gore, critical failure | 2 thrall tokens beside the field |

**Cleanup:** fixtures, thralls and regions removed.
