# Rank 8 batch 14 — group 3, part 2 (lingering areas that move creatures)

2026-10-05. Four spells of feature group 3.

| Spell | Now |
| --- | --- |
| Whirlpool | A sustained lingering cylinder of difficult terrain. Creatures inside when cast, and on the first Sustain each round, save. The rows deal half, full or double 6d10 bludgeoning (+1d10 a rank). The failure's 10-foot pull and the critical failure's "to the center" are GM reminders on the card. The breathing and Swim notes go to the GM. |
| Whirlwind | A sustained lingering cylinder of difficult terrain. Saves when cast and on each Sustain, after the GM moves it. A "moved through" control covers creatures it passed; each creature saves at most once a round. Failure: full damage and a 10-foot rise; critical failure: double damage and 20 feet. Both rises are GM reminders, and a note Effect gives the fly Speed. |
| Tear the Veil | A sustained lingering burst for living creatures only: their saves, and difficult terrain only for them. The rows deal 5d12/10d12/20d12 void and pull 15 or 30 feet (GM reminders). The 5-foot center is a child area: a living creature starting its turn there gets Drained 1, or 1 more up to Drained 4. One already at Drained 4 rolls the death save (incapacitation applies); on a failure it's at 0 HP and Dead, and the GM places the wraith. |
| Stars of Another Sky | A sustained lingering cylinder. Creatures inside when cast and on each Sustain save. Critical success: immune for 1 day. Otherwise the creature is Fascinated until the spell ends and rises 20/50/100 feet (a GM reminder). Failure and critical failure add the "hostile actions don't end it for 1 round" note. The "reached the top" control (with a no-soul variant) gives an Effect dealing 5d10 mental (doubled without a soul) as each of the creature's turns starts; at 0 HP it dies. |

New runtime:

- **Row movement:** "takes … damage and moves N feet toward / to the center" (row dice too), and "rises N feet into the air" after damage or a condition; both are GM reminders.
- **Living-only terrain:** per-creature terrain whose `living` mode applies to living creatures only.
- **`drainCenter`:** a child area at the center with a Drained-and-death-save turn effect (`applyDrainTurn`).
- **`gmMark`:** a GM control that gives a turn-start-damage Effect for the area's lifetime. Turn-start note damage can now kill at 0 HP.

Interpretations are logged in `docs/planning/pending-user-decisions.md`.

## Tests

`test/rank-8-batch-14.test.js` is new. A whole-corpus compile (b774 → b775) changed only these four spells, plus Repulsion: its missing critical-failure row now uses the failure row.

## Evidence

[Live evidence](phase-rank-8-batch-14-live-results.json), case `rank8Batch14`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Whirlpool: a failure and a critical failure inside | 28 and 66 bludgeoning; "moved 10 feet toward the center" / "moved to the center" reminders; the terrain behavior |
| Whirlwind: a failure; a creature it moved through | 31 bludgeoning, the rise reminder and the fly note; the second creature exposed by the control |
| Tear the Veil: living, undead, two in the center | The three living ones exposed, not the undead; terrain for the living (difficulty 2); 83 void and the 30-foot pull |
| The center creature's turn starts; the Drained 4 one's turn starts | Drained 1; death save failed: 0 HP, Dead |
| Stars of Another Sky: a failure, then the top mark, at 3 HP | Fascinated, the 50-foot rise, the Rapt note; its turn starts: 0 HP, Dead; the spell ends: Fascinated and the mark gone |
