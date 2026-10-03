# Rank 4 batch 4 — Downpour, Anointed Ground (area Effects)

2026-10-02. Part of the user's ranks 3–5 pass.

A new Effect-note recipient, **area**: the occupants of a placed area hold PF2e's Effect while inside, and lose it on leaving. It reuses the lingering memberEffect machinery that Gentle Breeze uses.

| Spell | Now |
| --- | --- |
| Downpour (4) | The GM places the burst; creatures inside hold PF2e's Effect: fire resistance 10, +2 per rank (14 at 6th). The module adds the Concealed the text states. "Concealed to those inside" and the water-weakness trigger are GM notes on the card. |
| Anointed Ground (3) | The caster picks the creature type once (PF2e's ChoiceSet, preset); creatures in the burst hold the Effect (+1 status to AC, attacks, damage and saves against that type) until daily preparations (1 day). |

## Rules

- **Proof readers (`effect-note-proof.js`), all with recipient `area`:**
  - "Creatures in the area are Concealed and gain X resistance N." checks the Resistance against the heightened step, and adds a Concealed GrantItem.
  - "Choose aberrations, …, or undead." is the ChoiceSet's exact list (with `areaChoice`).
  - "All creatures in the area gain a +N status bonus to AC, attack rolls, damage rolls, and saving throws against the chosen creatures." is the two trait-predicated modifiers.
- **Step:** "The fire resistance increases by 2." now counts as a resistance step.
- **Runtime (`effect-runtime.js` `#executeEffectNoteArea`):**
  - It needs a fixed duration, asks the pick once (or `options.areaChoice`), and places the area (or `options.region`).
  - It starts `startAreaBoon` without stay-healing, carrying the rule additions and the preset `selection` (`ongoing-families.js`, which also sets `flags.system.rulesSelections`).

## Tests

1005 + 2 (+3 earlier) = 1010 pass. `test/rank-4-batch-4.test.js` is new, with negative cases:
- wrong resistance;
- wrong step;
- a missing choice;
- a wrong bonus.

A whole-corpus compile (b367 → b368) changed only these two.

## Evidence

[Live evidence](phase-rank-4-batch-4-live-results.json), case `rank4Batch4`, in the `pftest` world.
- **Downpour:**
  - With two creatures inside and one outside, the two inside held fire resistance 10 and Concealed; the outsider held neither.
  - The one that left lost both.
  - Ending the spell removed everything.
  - At 6th the resistance was 14.
- **Anointed Ground:** the creature inside held "Spell Effect: Anointed Ground (Undead)", with the selection and flag preset.
- **Run note:** the first run looked for the exact Effect name, but PF2e appends the pick. A direct check confirmed the Effect, and the case now accepts the suffix.
- **Cleanup:** fixtures and regions removed.
