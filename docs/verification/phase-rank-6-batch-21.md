# Rank 6 batch 21 — the rest of group 2

2026-10-05. The last seven spells of feature group 2 (conjured creatures and objects, and controlling creatures).

| Spell | Now |
| --- | --- |
| Gray Shadow | **Summon button:** the linked Greater Shadow (PF2e's creature), placed beside the dying creature the caster targets, as a minion the caster's players own, with PF2e's Gray Shadow Effect on it. It's removed when the spell ends, or as soon as the dying creature dies or stops dying. Using it as a spell's origin point is a note. |
| Shambling Horror | **Raise button:** target the corpse (its level must be at most the caster's level – 4). The listed skeleton or zombie stat blocks of the corpse's size and at most its level are offered; the chosen one rises at the corpse as a minion for 10 minutes. Linked rows use PF2e's creature; named-only rows are found by name in the Actor compendiums. The kept Speeds and Strikes, the single-horror limit and the sunrise limit are GM notes. |
| Shadow Illusion | Illusory Creature's own route: Strikes deal 3d8 (+1d8 every 2 ranks), and the creature can be up to Gargantuan. The dim-light limit and the still-object option are GM notes. |
| Primal Summons | **Button:** PF2e's Primal Summons Effect on the summoned creature (its element picked on the Effect). |
| Patron's Protector | **Form button** (on the familiar): AC set to 28 (36 at 9th), Large, 20 temporary Hit Points (30 at 9th). At 0 Hit Points the spell ends and the familiar is at 1. **Body Check button:** basic Fortitude, 4d10 (6d10 at 9th), knocked back 10/20 feet. **Protector's Shove button:** +2 status AC for 1 round on an ally (the push is moved by hand). |
| Weapon of Judgment | **Strike button:** the caster's melee spell attack, 4d10 (5d10 at 10th) of the type picked (the weapon's, or spirit if the GM rules it worse). Pressed again on each trigger the GM reports, with the weapon's own attack number. |
| Blessed Boundary | **Shell button:** basic Reflex, 7d8 force (+1d8 a rank), pushed up to 10/20 feet in the caster's direction. Pressed again each time the GM reports a creature crossing or ending its turn in the shell (the user's "undetectable area damage: GM control"). |

New runtime:

- **`summon` part:** a named creature, or one listed stat block picked to fit the corpse. It can be tied to a dying creature, which ends it.
- **Effect parts by rank:** `acSet` (the difference from the creature's own AC), `tempHp`, and `zeroToOne` (the familiar is at 1 HP instead of 0).
- **Plans by rank on a part** (`byRank`).
- **ChoiceSet preselection** for PF2e Effects given by a part.

Interpretations (logged in `docs/planning/pending-user-decisions.md`): Weapon of Judgment's damage type is the caster's pick, with spirit offered for the GM's ruling. Shambling Horror's merged Speeds and Strikes are GM notes, since the text gives the final say to the GM.

## Tests

`test/rank-6-batch-21.test.js` is new. A whole-corpus compile (b772 → b773) changed only these seven spells.

## Evidence

[Live evidence](phase-rank-6-batch-21-live-results.json), case `rank6Batch21`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Gray Shadow: summon beside a dying creature; its Dying removed | Greater Shadow, a minion with the Gray Shadow Effect; removed |
| Shambling Horror: a level-3 Medium corpse, Plague Zombie | Plague Zombie (level 1), a minion, at the corpse |
| Shadow Illusion at 6th | The image's Strike is 3d8 |
| Primal Summons: on a beast (air) | PF2e's Effect, no prompt |
| Patron's Protector: the form; Body Check failure; the familiar to 0 HP | AC 28, Large, 20 temporary HP; 4d10 bludgeoning; 1 HP and the form ended |
| Weapon of Judgment: Strike (spirit), again | 4d10 spirit; pressed again |
| Blessed Boundary: the shell, failure | 7d8 force |

**Cleanup:** fixtures and summoned creatures removed.
