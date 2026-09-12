# Official PF2e 8.5.0 Spell Inventory

This is a structural inventory, not a claim that the current runtime parser supports each spell. Actual coverage remains `not-yet-compiled` until the parser is extracted and executed against every entry.

## Totals

- Spells: 1277
- Sustained: 183
- Structured damage: 386
- Inline checks: 61
- Inline damage: 173

## Primary-save structure

- none: 730
- non-basic: 383
- basic: 164

## Structural buckets

- no-primary-save-other: 584
- non-basic-four-outcomes: 281
- basic-save-structured-damage: 149
- no-primary-save-structured-damage: 104
- non-basic-compact-or-incomplete: 95
- interactive-arrive-depart: 27
- no-primary-save-inline-check: 15
- basic-save-no-structured-damage: 10
- no-primary-save-multiple-inline-checks: 9
- interactive-chain: 1
- interactive-movement: 1
- interactive-recurring-area: 1

## Next analyzer milestone

Extract the macro inference layer behind a Foundry-independent adapter, compile every spell into the normalized ability model, and replace `not-yet-compiled` with automatic, prompted, guided, unsafe, unsupported, or compiler-error.
