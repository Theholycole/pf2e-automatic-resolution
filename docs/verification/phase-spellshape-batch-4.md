# Spellshape batch 4: family B wands

2026-10-05. Six more wands that change their spell, and the current printing of a wand's spell.

- **Riders added:**
  - conditions with their own durations, one Effect each ("Blinded for 1 round and Dazzled for a number of rounds equal to the spell rank");
  - a Fortitude save at the end of the creature's turns that ends one of them;
  - a condition following the one the spell grants, at its value plus 1, for the spell's duration;
  - persistent damage on a creature the spell gives a condition (knocked Unconscious);
  - a trait the spell's affliction gains (virulent);
  - a condition when the spell's Effect on the creature runs its full course;
  - damage at the start of the creature's turns while the spell's condition lasts.
- **Rider Effects tied to the spell's own:** when the spell's Effect on the creature goes, its rider Effects go too.
- **A wand's stored spell:** a wand's copy of an older printing the module can't resolve is replaced on its card by the compendium's current printing, at the wand's rank. This affects Wand of Tormented Slumber's Sleep, and Wand of Clinging Rime's Frigid Flurry (7th to 9th), which weren't resolving from the wand before.
- **Wand reading:** the cast sentence's clause without "but" ("…, dazzling your target with the beam's intensity") is narration.

| Wand | Now |
| --- | --- |
| Wand of Dazzling Rays | Holy Light: a damaged creature is Blinded 1 round and Dazzled for the rank's rounds. On a critical hit, Blinded for the rank's rounds too, with a Fortitude save at the end of its turns to end it. |
| Wand of Dumbfounding Doom | Impending Doom: whenever the spell frightens the target, Stupefied at that value + 1, for the spell's 3 rounds. |
| Wand of Tormented Slumber | Sleep (4th): 1d6 persistent mental on each creature knocked Unconscious. Waking is the GM's note. |
| Wand of Pernicious Poison (1st) | Spider Sting's spider venom is virulent. The 6th-rank wand, which replaces the poison, isn't read yet. |
| Wand of Wearying Dance | Uncontrollable Dance: Fatigued when the minute's dance (failure or critical failure) runs its course. |
| Wand of Paralytic Shock | Paralyze: 1d12 electricity at the start of the creature's turns while the spell's Stunned or Paralyzed lasts. |

## Tests

`test/spellshape-batch-4.test.js` is new. Coverage: 18 of 131 feats and 10 of 49 wand kinds read. Live batches 1 to 3 pass again.

## Evidence

[Live evidence](phase-spellshape-batch-4-live-results.json), case `spellshapeBatch4`, in the `pftest` world. Each wand is used through PF2e (`consume`), and the card's spell is the one the module resolves.

| Step | Result |
| --- | --- |
| Dazzling Rays: a hit, a critical hit | Blinded 1 and Dazzled 3; plus Blinded 3 with the save. The save at the end of the target's turn ended it. |
| Dumbfounding Doom: critical failure, success | Frightened 3 and Stupefied 4; watched, nothing yet |
| Tormented Slumber: failure, success | Persistent mental; none |
| Pernicious Poison: failure | The spider venom affliction is virulent |
| Wearying Dance: failure, success | Fatigued as the minute ran out; nothing on the success |
| Paralytic Shock: failure | Paralyzed; 8 electricity as its turn started |
