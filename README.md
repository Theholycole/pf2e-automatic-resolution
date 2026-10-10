# PF2e Automatic Spell Resolution

A Foundry VTT module for the Pathfinder Second Edition system that resolves spells as they're cast: saving throws, damage, conditions with their durations, areas, auras, summons, forms and the rest, with cards for the GM to confirm or adjust.

## Requirements

- Foundry VTT 14
- The PF2e system 8.5
- [PF2e Resolution Core](https://github.com/Theholycole/PF2e-Automation-Core) (Foundry offers to install it with this module)

## Installing

In Foundry's setup screen, **Add-on Modules → Install Module**, and paste this manifest URL:

```
https://github.com/Theholycole/pf2e-automatic-spell-resolution/releases/latest/download/module.json
```

Updates arrive the same way: each release on GitHub carries its `module.json` and `module.zip`.

## Tables you supply

One spell from the Witches+ add-on, Patron's Apocalypse, needs the Lesson of Apocalypses table from the book, which the add-on's data doesn't include and this module doesn't ship. To automate it, put your copy of the table in your Foundry data folder:

```
Data/pf2e-automatic-resolution-supplements/patrons-apocalypse.json
```

as `{ "duration": "sustained up to 1 minute", "entries": ["Cosmic. …", "Corpses. …", …] }`, one entry per apocalypse as the book words it. Without the file, that spell is left to the GM.

## License

MIT — see [LICENSE](LICENSE).
