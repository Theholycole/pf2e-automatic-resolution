# Rank 7 batch 15 — conjured tokens and copies (feature group 2b)

2026-10-05. These follow the user's rulings "conjured: token" and "minion: Effect+ownership".

| Spell | Now |
| --- | --- |
| Dragon Turret | **Token:** the dragon (AC 40, +30 to all saves, 250 HP, immune to all conditions; 20 feet across), made at the cast and removed when the spell ends or the dragon dies. **Breath button:** the 60-foot cone, 13d8 with a basic Reflex save; its type comes from the casting tradition (arcane force, divine spirit, occult mental, primal fire). Usable each Cast and once per round on a Sustain. |
| Duplicate Foe | The target's Fortitude save. A failure (or critical failure) makes the **copy**, a module token: the target's statistics, its Strikes without added effects, 70 HP (+10 a rank), no special abilities or immunities, resistances and weaknesses; a minion the caster's players own. It loses 4d6 HP after it acts and can't regain HP; it's gone at 0 HP. A success halves its Strike damage (PF2e's own multiplier, read from the attacker's signature) and limits it to 2 rounds. The level limit (15, +2 a rank) is checked at the cast rank. |
| Reanimate Foe | **Reanimate button:** the caster's Undead Lore check against the corpse's level DC. A success makes the copy (100 HP, losing 15 after it acts); a failure makes it with half damage, losing 50; a critical failure makes a thrall in the corpse's space and refunds the Focus Point. **Destroy the thrall** button. |
| Lifewood Cage | **Token:** the cage (AC 10, 40 HP; Hardness 20 as resistance to all damage; immune to critical hits and precision; weakness 5 to void), removed when the spell ends or the cage is destroyed. **Save button:** the Reflex save — a failure is trapped (a note); a success is pushed out (the GM moves it). The cover, invisibility and too-big rules are GM notes. |
| Elemental Confluence | **Token:** the confluence (AC 28, 120 HP, weakness 10 to area effects, immune to bleed and poison), with a concealing area that follows it. **Element buttons** (up to two each Cast or Sustain): Air (basic Reflex, 4d4 electricity, within 20 feet but not inside); Earth (on the token: +2 circumstance AC and resistance 10 to physical damage except adamantine, for 1 round); Fire (1d6 persistent fire inside); Metal (basic Reflex, 2d6 slashing inside, plus 1d6 persistent bleed on a critical failure); Water (a ranged spell attack, 4d6 bludgeoning); Wood (difficult terrain over its area for 1 round). |

New runtime:

- **Conjured tokens:** `conjure` on the card. The token can end its spell when it reaches 0 HP, and it can carry a concealing area that follows it.
- **Creature copies:** `copyCreature`, the Duplicate Foe save card's `duplicate`, and the `check-copy` part.
- **Turn-end HP loss:** a minion copy loses its HP when its caster's turn ends, because PF2e keeps minions out of the encounter.
- **Halved Strike damage** in the applyDamage wrapper.
- **New part features:** `onConjured` parts and the `terrain` part.

Interpretations (logged in `docs/planning/pending-user-decisions.md`):

- A minion copy's "each turn after it takes its actions" is the end of the caster's turn.
- Water's +2 against a target inside the confluence is added in PF2e's attack dialog, as noted on the button.
- Hardness is resistance to all damage.
- The cage's trapping is a note; the GM keeps the token inside.

## Tests

`test/rank-7-batch-15.test.js` is new. A whole-corpus compile (b771 → b772) changed only these five spells.

## Evidence

[Live evidence](phase-rank-7-batch-15-live-results.json), case `rank7Batch15`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Dragon Turret: cast; breath on a foe; the dragon reduced to 0 HP | AC 40, 250 HP, Fortitude +30, immune to Prone; 13d8 mental (an occult entry); the token removed |
| Duplicate Foe: failure; the caster's turn ends; a success's copy deals 10 damage | 70 HP, a minion, no immunities, 4d6 loss; it loses 17; 5 applied |
| Reanimate Foe: Undead Lore against a level-12 corpse | DC 30, critical success: 100 HP, losing 15 |
| Lifewood Cage: cast; the trap on a foe, failure | AC 10, 40 HP, resistance all 20; trapped |
| Elemental Confluence: a creature moves in; Earth; Wood; the spell ends | Concealed; the token's AC 30; difficult terrain; the token removed |

**Cleanup:** fixtures, copies and conjured tokens removed.
