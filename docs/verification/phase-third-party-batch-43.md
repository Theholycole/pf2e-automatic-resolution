# Third-party batch 43: Planar Court

2026-10-06. The forty-third batch of the third-party modules' spells: a save whose penalty lands on an attribute the caster names.

## What changed

- **Planar Court (Clerics+)** (`third-party-rows.js` `courtRows`; the text-save fitter):
  - The item has no save in its data, so the text's Will save is read. The text-save fitter now also reads a save at the end of a sentence ("… and the target must attempt a Will save.").
  - The card asks which attribute the caster names.
  - **Failure / critical failure:** a note for the sustained spell, a −1 or −2 status penalty to that attribute's checks, DCs and saves (PF2e's `-based` selector).
  - **Critical success:** the caster is Doomed 1.
  - **Success:** unaffected; the spell ends.
  - Both vanishing until the target's next turn is a GM reminder.
- **Supporting changes:**
  - A row reader can name a row's narration sentences (`narration`), which the residual check accepts when they hold no rule.
  - The caster-condition check reads "You become {Condition N}."
  - Note rules accept a status penalty to an attribute's `-based` statistics.

The official census is still 1870/1870 enabled. Of the 1,994 official plans, one differs, and only in its pending list (Temporal Twin, batch 4).

## Census

| Route | Batch 42 | Batch 43 |
| --- | --- | --- |
| Save | 65 | 66 |
| Not enabled | 28 | 27 |

Resolved: 198 of 227.

## Tests

`test/third-party-batch-43.test.js` (1). All 1,761 unit tests pass.

## Evidence

[Live evidence](phase-third-party-batch-43-live-results.json), case `thirdPartyBatch43`, in the `pftest` world.

| Cast (rank 4) | Result |
| --- | --- |
| Strength named, failure | The foe's Athletics −1; Perception unchanged |
| Wisdom named, critical failure | Its Perception −2; Athletics unchanged |
| Critical success | The caster Doomed 1 |
