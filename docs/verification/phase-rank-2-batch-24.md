# Rank 2 batch 24 — no-save spells: notes and a concealing cloud

2026-09-30.

Nine rank 2 spells with no save now resolve: eight as notes, and Mist as a placed concealing area. Note-only spells count as resolved (user decision, 2026-09-30).

| Spell | Now |
| --- | --- |
| Animal Messenger (2) | A note for 24 hours. The duration is "see text"; the text says "or after 24 hours, whichever comes first". |
| Marvelous Mount (2) | A note on the target for 8 hours. The mount's Speed, AC and saves are the conjured creature's, which the GM plays. |
| Ghostly Carrier (2) | A note for 1 minute. The carrier's AC and saves are the conjured figure's. |
| Waterproof (2) | A note for 1 hour, 1 day from 4th, unlimited from 8th. The item's resistance and save bonus are the GM's, since PF2e items carry no rules. |
| Fireproof (2) | A note for 1 hour, 24 hours from 4th, unlimited from 6th. The item's fire resistance is the GM's. Other effects' counteract check against the spell DC is the GM's. |
| Slough Skin (2) | A note for 1 hour. Its bonuses apply only in situations: the initial save against contact poison, the new saves against skin-contact effects, and others Tracking the caster. |
| Enhance Victuals (2) | A note for 1 hour. The card has a "Counteract any poisons in the food or water" button: the GM names the poison, its DC and rank, and the caster's PF2e counteract check decides. |
| Pave Ground (2) | A note (sustained, up to 1 minute). The card's Counteract button is for magical difficult terrain; success makes it normal terrain. |
| Mist (2) | A placed 20-foot burst for 1 minute. Creatures inside are Concealed, with the flat-check note for creatures outside. Leaving the area removes it, and the caster can Dismiss it. |

## Rules

- **A "see text" duration with a bound:** "The spell ends after/when … or after N hours/minutes/days, whichever comes first." The note lasts that long; the GM ends it sooner.
- **A conjured creature's statistics:** when the text says "You create/conjure a … figure/creature/…", a sentence starting "The <word of the spell's name> is/has/uses …" gives that creature's numbers, which the GM plays.
- **An object's numbers:** with a target "1 object …", a sentence naming no creature (resistance, a bonus to its saves) is the GM's.
- **Situational bonuses:** "to those saving throws" and "Anyone Tracking you …" are situational.
- **The spell's own counteract:** "the spell attempts to counteract any <thing> in the <place>" and "You can attempt a counteract check against magical <thing> in the area, (too,) making it <result> for the duration if you succeed".
  - The card offers it (labelled "Counteract"), and the result message states what success does.
  - Putrefy Food and Drink's heightened counteract is unchanged.
  - "Effects with the <trait> trait that target the <item> must first succeed at a counteract check against your spell DC" is the GM's.
- **Heightened "The duration is unlimited.":** a note now lasts unlimited from that rank. This also fixes Cinder Scribe (4th), Invisible Item (7th), Item Facade (3rd) and Inertia Lock (7th), whose notes kept the shorter duration. Other routes still treat it as unsupported.
- **A concealing area (new family):** "All creatures within the <noun> become Concealed, and all creatures outside the <noun> become concealed to creatures within it." for a placed area with a fixed duration, no save and no target. One sentence of narration is allowed, plus "You can Dismiss the <noun>.". It starts the lingering cloud (`startCloud`, now with the caster's Dismiss).

## Tests

847/847 pass. `test/rank-2-batch-24.test.js` is new. It checks:
- each note family, with its refusals (another duration wording, a creature's unconditional number, another counteract wording);
- the unlimited duration by rank;
- Mist's data, and a different concealment wording being refused.

A whole-corpus compile (b277 → b278) changed these nine spells, plus the four notes' heightened durations and Putrefy's counteract result text.

## Coverage

**Census:** **1070 enabled**, up from 1061. Rank 2: 158 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-24-live-results.json), case `rank2Batch24`, in the `pftest` world.
- **Animal Messenger:** note for 24 hours.
- **Marvelous Mount:** note on the rider for 8 hours.
- **Ghostly Carrier:** 1 minute.
- **Waterproof:** unlimited at 8th, 1 hour at 2nd.
- **Item Facade at 3rd:** unlimited.
- **Slough Skin:** 1 hour, no rules.
- **Enhance Victuals:** the card's "Counteract" button. Counteracting "Giant Centipede Venom" (DC 10, rank 1) succeeded: "Giant Centipede Venom is counteracted".
- **Pave Ground:** counteracting "Magical mud" succeeded: "— making it normal terrain".
- **Mist:**
  - The creature inside is Concealed; the one outside isn't.
  - The record has the caster's Dismiss. Moving out removed the concealment.
  - Ending the spell removed the region.
- **Cleanup:** fixtures and the region removed.
