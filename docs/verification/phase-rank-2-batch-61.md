# Rank 2 batch 61 — Coiling Dance

2026-10-01. A sustained dance aura with an Escape. It needed no new user decision.

| Spell | Now |
| --- | --- |
| Coiling Dance (2) | A sustained 30-foot emanation on the caster for up to 1 minute. Each ally inside (not the caster, and no enemy) holds PF2e's Effect: its spells and weapons gain holy, unless it or the item is unholy. The Effect is lost on leaving. On the cast and on each Sustain, a card offers the Escape. Select the ally (Grabbed, Immobilized or Restrained, inside the area) and target what holds it; the button rolls PF2e's Escape, with a modifier that raises the ally's best (unarmed attack, Acrobatics, Athletics) to the caster's better Occultism or Religion when that's higher. A missed Sustain ends the spell and the Effects. |

## Rules

- **`escape-aura.js` (new family, kind `escape-aura`):**
  - It reads the two holy sentences and the two Escape sentences exactly (one sentence of narration allowed).
  - PF2e's Effect must be exactly its two ItemAlterations (spells and weapons, with the unholy exclusion).
- **`ongoing-families.js`:**
  - `startAllyAura` can now be sustained, allies only (`excludeCaster`), and carry an `escapePrompt`.
  - `postEscapePrompt` runs on the cast and on each Sustain.
  - `escapePrompt` checks the selected ally (an ally, inside, with one of the conditions), works out the raise, and rolls PF2e's Escape.
- **`main.js`:** the Escape card's button uses the user's one selected token.

A first live run targeted the ally to choose it, so PF2e used the ally's own DC. The ally is now the selected token, and the target is the creature holding it, as in PF2e.

## Tests

913/913 pass. `test/rank-2-batch-61.test.js` is new. It checks:
- the plan;
- that other skills, the opposing trait, or an action instead of a reaction aren't read.

A whole-corpus compile (b316 → b317) changed only Coiling Dance.

## Coverage

**Census:** **1138 enabled**, up from 1137. Rank 2: 224 of 245.
- The speed check reports PASSED, and the escape and six rule-family checks report 0 regressions.

## Evidence

[Live evidence](phase-rank-2-batch-61-live-results.json), case `rank2Batch61`, in the `pftest` world. The caster has Wisdom +6; the ally's own modifiers are +0.
- **Effect holders:** the ally inside held the Effect. The caster, a foe inside and an ally 80 feet away didn't.
- **Escape:** the grabbed ally (selected, with the foe targeted) rolled "Escape (Acrobatics Check)" against the foe's DC 10, with "Coiling Dance: … caster's Religion +6", and succeeded. The card is used.
- **Sustain:** in combat, the caster's turn asked for Sustain; sustaining posted a second Escape card.
- **Missed Sustain:** the next round ended the spell, and the ally lost the Effect.
- **Cleanup:** fixtures and the combat were removed.
