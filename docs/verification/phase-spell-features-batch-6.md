# Spell features batch 6: items that act on a spell cast

2026-10-05, from the spell features audit (`docs/planning/spell-features-audit.md`).

Of the 29 items in the audit's spell-stat and counteract groups:

- 6 cast a spell (batch 5);
- 4 act on a spell cast (this batch);
- the rest are PF2e's own rules, or the table's (see the audit).

`scripts/spell-trigger-items-runtime.js`, on each cast:

- **Rune of Sin** (invested): an arcane cast gives the caster resistance 10 to damage from divine spells until the start of its next turn. This is a PF2e custom Resistance whose definition is `item:type:spell` and `item:trait:divine`.
- **Book of Warding Prayers:** a prepared divine spell posts its card. Spirit is always offered; holy or unholy too when the spell has that trait. The button gives PF2e's Effect, with its choice preset, to the caster and its allies within 30 feet. Whether the spell is granted by the deity is the table's.
- **Reflecting Shield** (raised): a spell targeting the holder offers the reaction. It rolls 1d20 + 30 against the caster's spell DC, at counteract rank 9. If it counters, the spell is lost and the GM is told it's turned back on its caster.
- **Spell Duelist's Siphon** (Raise a Tome): an arcane spell attack targeting the holder offers the reaction. The counteract uses the holder's best spell attack modifier, at half its level rounded up. If it counters, the spell is lost and an Effect records the spell the grimoire holds; casting it with a slot is the player's.

## The table's (or PF2e's)

- **PF2e's rules:** Channel Protection Amulet (a custom Resistance against Harm and Heal), Mageslayer, Runeveil Ammunition (PF2e's Effect).
- **GM notes:**
  - Deathless Light (a light spell's rank against darkness);
  - Harmonic Hauberk (auditory effects counteract it; its activation casts compositions using Performance);
  - Eldritch Flare (a poison that feeds on spells);
  - Key of Unwinding (a reaction Strike that negates an attack);
  - Amulet of the Slumberer (an artifact's DC);
  - Tengu Feather Fan (the spells it holds aren't listed);
  - Cantrip Deck (any common cantrip).
- **Items that only name spell attacks in their trigger:** Killer's Belt, Admiral's Bicorne, Horns of Naraga, Chroma Kaleidoscope, Lung Bloodstone, Fungal Armor. Also the spellguns, which are their own attacks.

## Tests

`test/spell-features-batch-6.test.js` (2): the counteract check's degree, and rank 9 against spell ranks.

## Evidence

[Live evidence](phase-spell-features-batch-6-live-results.json), case `spellFeaturesBatch6`, in the `pftest` world.

| Step | Result |
| --- | --- |
| Rune of Sin (invested); Ignition cast from the arcane entry | Its Effect; 30 damage from a divine spell takes 20, from an arcane one 30 |
| Book of Warding Prayers; Heal from the divine prepared entry | The card; spirit: resistance 10 on the priest and the ally within 30 feet |
| Reflecting Shield raised; a foe's Fear at the holder | The card; 37 against DC 24: countered; the Fear lost ("reflected by …") |
| Spell Duelist's Siphon with Raise a Tome; a foe's arcane Ignition at the holder | The card; countered; the grimoire holds Ignition; the Ignition lost |
