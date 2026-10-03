# Cantrip / rank 1 batch 1 — verification

2026-09-26. The first batch of your cantrip-and-rank-1-only pass (one-offs accepted).

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| A “While …” sentence before the table with no rule words is narration (“While the sound is loud, only those closest can feel the true sting of death in it.”) | Deathly Scream (1) |
| Short row narration with no rule words or conditions (“The creature is thrown off by your display.”) | Overselling Flourish (1) |
| “It then remains dazzled and off-guard until the start of your turn.”: the earlier rows' conditions with the same duration | Overselling Flourish |
| “The creature uses its remaining actions to watch you in awe.”: a **GM:** note on that target's result | Overselling Flourish |
| “The recoil imposes a –N status penalty to the ranged attack and renders the target off-guard until the beginning of their next turn.”: PF2e's row Effect (once for that roll, or until their next turn with its Off-Guard) | Curse of Recoil (1) |
| “Until the start of their next turn, any additional ranged attacks made with the same weapon, spell, or ability take the same penalty.”: claimed with a **PF2e data** note, since the Effect penalizes every ranged attack (your trust-PF2e decision) | Curse of Recoil |
| Save cards now show **PF2e data** notes | |
| “… that only creatures in the area can hear” in a basic save's opening is narration, so the critical-failure Deafened rider now reads | Haunting Hymn (cantrip) |

**Reversed decision:** two earlier tests had kept Haunting Hymn's “only creatures in the area can hear” as an unread rule. It only says the hymn is inaudible outside the area and changes nothing about who saves or what happens. The tests now expect the spell supported.

**Kept strict:**
- Narration naming a condition or containing a rule word stays unread. Impending Doom's “The creature is immediately off-guard.” is a rule, and a test checks it.
- A “While” sentence with a rule still blocks (test).
- A different penalty than the Effect's is refused (test).

**Looked at and left blocked (no general rule, or the Effect lacks the text's rules):**
- Wilding Word, Hollow Heart, Charm and Charming Push: behaviour and hostility rules.
- Touch of Undeath: half healing from vitality.
- Veil of Dreams: the flat check on concentrate actions.
- Signal Skyrocket: damage only in an enclosed space.
- Lament: extra damage from the caster's own emotion conditions.
- Rainbow's End: ally teleport.
- Share Vision, Cutting Eye, Sweet Dream, Practice Makes Perfect (its Effect never removes itself), Bit of Luck.
- Protective Wards: its Aura grows on Sustain through a badge; the existing Sustain support is a Bless-only profile, so this needs a general mechanism.
- Sting of the Sea: a save at the start of each of the target's turns. That's next.

## Coverage

**Census:** **468 enabled**, up from 464. Cantrips: 54 of 120. Rank 1: 131 of 387.
- The b84 corpus diff against b83 enables the four spells above.
- Six already-blocked plans gained narration claims (Shroud of Night, Infectious Ennui, Achaekek's Clutch, Chroma Leach, Vampiric Maiden, Impaling Spike).
- No plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 506/506 tests pass. `test/cantrip-rank-1-batch-1.test.js` covers each rule and its refusals. `test/thrall-spells.test.js`, `test/general-condition-riders.test.js` and `test/rank-1-batch-2.test.js` were updated for the two reversals: Deathly Scream's narration and Haunting Hymn's.

[Live evidence](phase-cantrip-rank-1-batch-1-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `cr1Batch1`:
- **Deathly Scream:**
  - A creature 15 feet from the thrall was refused (“more than 5 feet from the thrall”).
  - The critical failure beside the thrall took double damage (6 = 2 × 3) and Frightened 2.
- **Overselling Flourish:** the failure and critical failure were Dazzled and Off-Guard, and the card showed the remaining-actions note.
- **Curse of Recoil:**
  - Success: Off-Guard only.
  - Failure: “Spell Effect: Curse of Recoil (Failure)” (unlimited, removed after the roll) and Off-Guard.
  - Critical failure: the Critical Failure Effect (1 round, turn start), with its Off-Guard.
  - The card showed the PF2e data note.
- **Haunting Hymn:** the failure took 7 and the critical failure 14 and was Deafened for 1 minute.
- **Regressions:** `thrallSpells`, `rank1Batch1`, `rank2Batch1`, `sustainedConditions` and `phrasings` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b84
node tools/diff-compiled-plans.mjs /tmp/phase23-b83/official-spell-compiler-report.json /tmp/phase23-b84/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b84/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `cr1Batch1`, then `cleanup`.
