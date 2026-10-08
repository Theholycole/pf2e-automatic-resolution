# Rank 7 batch 14 — control (feature group 2a)

2026-10-05. Group 2 is conjured creatures and objects, and controlling creatures ("conjured: token", "minion: Effect+ownership"). This batch covers the four control spells.

| Spell | Now |
| --- | --- |
| Puppet Strings | The rows' conditions. A failing target holds a note whose end-of-turn Fortitude save ends the spell. A **controls card** follows the save card: **Forced Strike** (the caster's spell attack against a creature in the puppet's reach, 7d6 of the type the caster picks; once per Cast or Sustain, twice on a critical failure) and **Forced Stride** (the caster's path; the GM moves it). |
| Possession | Each possessed creature holds a note for the spell's time (1 minute, or 10 at 9th). Riding along: the note only. Partial control: a start-of-turn Will save — a failure gives Controlled for that turn, with the caster's players owning its token; a critical success ends it. Full control: Controlled and owned. The caster's body is Unconscious while that note lasts. The controls card holds the save when the body dies (the caster's Fortitude against their own DC: Paralyzed for 1 or 24 hours), plus the less-control and initiative reminders. |
| Temporary Possession | Each row's note lasts until the end of the caster's turn: Controlled and owned, with 1, 2 or 3 actions. When it ends, an Effect gives Stunned 1, which lasts as long as the condition does. While the creature is possessed or stunned this way, the caster loses half the Hit Points it loses. The controls card destroys the thrall. |
| Song of the Fallen | A card with two alternatives (using one uses up the other). Dead creatures (up to 4): an Effect with 60 temporary Hit Points and Slowed 1; when it ends, the creature is at 0 Hit Points and Dead. Undead creatures (up to 4): the Will save's rows (5d6, 10d6 and Slowed 1 for 1 round, 100 and Slowed 1 for 1 minute, dies). |

New runtime:

- **Controls card** (`postControlsCard`): the save card posts it when a target gets a row that gives controls. Its buttons are the incarnate card's parts, and each can be pressed again while the spell lasts.
- **Start-of-turn condition saves:** a condition with no value (Controlled) gives the caster's players ownership for that turn, and a critical success can end the note.
- **Note endings** (`note-end-runtime.js`): `thenCondition`, `endsInDeath` and `hpShare` (the caster loses half the Hit Points the creature loses).
- **Caster note `while-target-note`:** the caster's condition while each possessed creature holds this cast's note.
- **Part kind `destroy-thrall`.**

Interpretations (logged in `docs/planning/pending-user-decisions.md`): the forced Strike's critical hit doubles the damage, as a Strike's does. When the possessed body dies, the GM ends Possession in Ongoing spells. Song of the Fallen's "die again" happens when the Effect ends; if the caster stops Sustaining, the GM ends it.

## Tests

`test/rank-7-batch-14.test.js` is new. A whole-corpus compile (b769 → b771) changed these four spells, plus Summon Ancient Fleshforged's attack part (rebuilt with the shared text-attack compiler; the same rows).

## Evidence

[Live evidence](phase-rank-7-batch-14-live-results.json), case `rank7Batch14`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Puppet Strings: failure; Forced Strike (slashing) on another creature, then again | Clumsy 1, Slowed 1, the Fortitude note; one controls card; 7d6 slashing from a spell attack; the Strike can be pressed again |
| Possession: failure; the body dies (failure); the note removed; critical failure on another | Partial-control note (Controlled each failed turn, ends on a critical success); caster Unconscious; caster Paralyzed; caster no longer Unconscious; Controlled and minion |
| Temporary Possession: failure; 20 damage; the note ends | Controlled and minion; the caster loses 10; Stunned 1, no longer Controlled or minion |
| Song of the Fallen: dead ally; then the undead option; the Effect ends; undead critical failure | 60 temporary HP and Slowed 1; refused (dead creatures used); 0 HP and Dead; the undead is Dead |

**Cleanup:** fixtures removed.
