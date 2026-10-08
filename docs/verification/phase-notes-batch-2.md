# Notes batch 2: scene-wide and aura spells

2026-10-05, from the notes audit (`docs/planning/notes-automation-audit.md`), after the user said "yes, continue with N2 and N4".

Checking N2 against what the spells already do:

- **Already automated:** Under Sunless Skies, Call of the Quenching, Trim the Blight and Theogeny already have GM option buttons (decisions of 2026-10-04). These cover the allies' and enemies' Effects and the save cards; only their note text looked unautomated.
- **Theogeny:** "all enemies take 10 spirit damage whenever they're critically hit by an attack or whenever they critically fail a saving throw" is now carried out. The foes' option Effect carries `gmOption.watch.critPunish`, and `scripts/note-watchers.js` deals the damage (tested in notes batch 4).
- **Spellsurge:** a `stated-effect` with its four abilities to pick from.
  - Interference becomes PF2e's Aura rule: every creature within 10 feet gets a world Effect with +2 circumstance to saves against mental effects (`item:trait:mental`).
  - Mana Well, Overpower Resistance and Ward stay notes.
  - Changing the ability on a Sustain means casting it again.

## Tests

`test/notes-batch-4.test.js` (Spellsurge's compiled options).

## Evidence

[Live evidence](phase-notes-batch-2-live-results.json), case `notesBatch2`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Spellsurge (Interference) cast by a caster at (10,5); creatures at (11,5) and (16,5) | The Aura rule (10 feet); the near creature and the caster have the Interference Effect, the far one doesn't |
