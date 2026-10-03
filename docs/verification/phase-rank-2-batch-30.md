# Rank 2 batch 30 — stealing from minds and shadows, extracting poison

2026-10-01. Follows the user's decision of 2026-10-01: things PF2e doesn't model (a stolen Lore or spell, a poison on an object) are rolled on the card, and the GM applies the rest.

| Spell | Now |
| --- | --- |
| Umbral Mindtheft (2) | The caster gets a note with the spell's rules for its 3 rounds. The card's Steal runs PF2e's Steal (Thievery against the targeted creature's Perception DC). On a success the GM gives the stolen Lore's proficiency rank; the target takes 2d6 mental per rank from trained (2d6 trained … 8d6 legendary). After that the card's Steal is refused. |
| Umbral Extraction (2) | The same, with the stolen spell's rank: 1d4 mental per rank. The temporary slot and which spell is taken are the GM's (the note). |
| Extract Poison (2) | The card's Counteract: the GM names the poison and gives its level and counteract DC, and the caster's PF2e counteract check decides (the poison's rank is half its level, rounded up). On a success, PF2e's Spell Effect: Extract Poison goes on the caster until the end of its next turn. It is preset to the held weapon (asked when there are several) and the poison's level. It's removed after the next damage roll with that weapon, or a critically failed attack roll with it. |

## Rules (new families)

- **`steal-damage`:**
  - The Steal action sentence, "You can also make one attempt to Steal as part of Casting …", and the damage sentence by Lore proficiency or by stolen spell rank.
  - Nothing else in the text may deal damage or roll dice. The rest is the note.
- **`counteract-transfer`:**
  - Extract Poison's four rule sentences (one sentence of narration allowed).
  - PF2e's Effect must be exactly a held-weapon choice, a level choice, and DamageDice of that level's number of d6 poison on the chosen weapon. This is checked at compile time and again on the live template.
  - The coated weapon's Effect is removed by a `createChatMessage` hook run by the active GM.

## Tests

861/861 pass. `test/rank-2-batch-30.test.js` is new. It checks:
- the damage by what was taken, and a forged extra damage being refused;
- Extract Poison's data and the Effect shape check.

A whole-corpus compile (b283 → b284) changed only these three spells.

## Coverage

**Census:** **1086 enabled**, up from 1083. Rank 2: 174 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-30-live-results.json), case `rank2Batch30`, in the `pftest` world.
- **Umbral Mindtheft:** a 3-round note. Steal succeeded; an expert Lore dealt 4d6 mental (14 lost). A second Steal was refused.
- **Umbral Extraction:** a 3-round note. A rank 2 spell dealt 2d4 mental (4 lost). A second Steal was refused.
- **Extract Poison (a character caster holding a Dagger):**
  - Counteracting "Giant Wasp Venom" (level 2, DC 10) succeeded.
  - The Effect had weapon = the Dagger's id, level "2", 1 round turn-end.
  - The Dagger's damage roll was "1d4 piercing + 2d6 poison", and the Effect was then gone.
- **Cleanup:** fixtures removed.
