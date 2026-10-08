# Rank 8 batch 10 — the GM-handled spells and their GM options

2026-10-04. The user's ruling: "6 and 12 can be skipped and count as resolved", and "For Group six make sure the spells that can affect creatures have an option to do so, such as earthquake but must be chosen by the gm".

| Group | Spells | Now |
| --- | --- | --- |
| World-scale (6) | Earthquake, Upheaval, Restore Ground, Trim the Blight, Call of the Quenching, Under Sunless Skies, Veil of Broken Reality, Astral Labyrinth, Theogeny, Shipwreck | The card whispers the spell's text to the GM, marked theirs to run. Each spell that can affect creatures offers GM options on that card; each applies only to the creatures the GM targets when pressing it. |
| Information, travel, wards (12) | Scrying, Unrelenting Observation, Forest of Gates, Hag's Fruit, Temporal Ward, Aura of the Unremarkable | The card whispers the spell's text to the GM, marked theirs to run. |

The GM options:

| Spell | Options |
| --- | --- |
| Earthquake | Shaking Ground (PF2e's Effect); Fissures (Reflex: a failure falls 40 feet for 20 bludgeoning and lands Prone); Collapse (Reflex: 11d6 bludgeoning, half/full/double, Prone unless a critical success) |
| Upheaval | Pillar or collapse (its Reflex table: 11d6; half, half and Prone, full and Prone, full and Restrained until it Escapes) |
| Restore Ground | Collapse (as Earthquake's) |
| Trim the Blight | Blighted creatures (its Fortitude table: 12d10 spirit; Sickened and Slowed; the reach reduction a note) |
| Call of the Quenching | Allies (fire resistance 15, Concealed, 1 minute); an enemy ended its turn (7d4 piercing + 7d4 bludgeoning, basic Reflex) |
| Under Sunless Skies | Allies (greater darkvision, 40 temporary HP, +3 status to saves); enemies (−3 status to Will) |
| Veil of Broken Reality | The Will table (Slowed 1 / Slowed 3 for the day; reactions and knowledge notes) |
| Astral Labyrinth | The Will table for a teleporting creature (Stunned 1 / Stunned 3; the rerouting a note) |
| Theogeny | Allies or foes, for a holy or unholy caster (traits, fly Speed, Strikes +1d10 spirit; the foes' weakness 5) |

Interpretations: Earthquake's fissure fall is 40 feet (20 bludgeoning) and the creature lands Prone. Trim the Blight's failing rows take full damage, as the lead states. Theogeny's fly Speed is the land Speed. Shipwreck affects vehicles only, so it has no options.

Runtime: a GM-handled note carries GM options (a save sub-spell, PF2e's Effect, or a stated Effect) as GM-only buttons on its whispered card.

## Tests

`test/rank-8-batch-10.test.js` is new. A whole-corpus compile (b765 → b767) changed only these sixteen spells.

## Evidence

[Live evidence](phase-rank-8-batch-10-live-results.json), case `rank8Batch10`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Six casts | Each card whispered to the GM; Scrying and Forest of Gates have no options, the world-scale ones theirs |
| Earthquake: Shaking Ground on two creatures | Both hold PF2e's Effect |
| Earthquake: Collapse — a failure and a critical success | 39 bludgeoning and Prone; nothing |
| Under Sunless Skies: allies | 40 temporary HP; Will +3 |
| Theogeny: a holy caster's foes | The unholy trait and weakness 5 to holy |

**Cleanup:** fixtures removed.
