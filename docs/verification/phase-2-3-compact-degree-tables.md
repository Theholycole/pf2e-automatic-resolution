# Compact degree tables — verification

2026-09-25. This batch covers non-basic saves that state their whole table in one sentence. After the Sustain, lingering and enemy batches, no remaining Phase 2/3 blocker is shared by more than a handful of spells. This was the most common unhandled shape still standing: about 25 disabled spells across phases use it.

## Compiler (`src/compiler/compact-degree-table.js`)

`expandCompactDegreeTable` runs right after the spell is adapted. It rewrites the description, so every later compiler (degree outcomes, residual prose, save preamble, lingering triggers) judges the standard table exactly as if it were written out.

**When it applies:**
- **Save and table:** only for a non-basic save with no degree headings.
- **Sentence:** exactly one compact sentence, which must be the last sentence before any heightening. Links are masked while sentences are split, because their UUIDs contain full stops.
- **Save match:** the statistic must match the item's save.

**Forms:**
- “<subject> must succeed at a STAT save/saving throw or be/become <condition>”;
- “… or fall <condition>”;
- “The target becomes <condition> if it fails a STAT save”;
- “<narration>, causing it to become <condition> if it fails a STAT save”.

Each can take “(or <condition> on a critical failure)”. A condition is one condition, optionally with a value and “for N rounds/minutes”.

**Subject:** it must be plain (“The target”, “Each/Every/All/Any creature(s)/enemy/enemies”, “Creatures”, “Enemies”), optionally followed by “who/that/in/within …” with no comma. That refuses Exploding Earth (“On a critical hit, … the target you hit must succeed …”) and Disruptive Transfer (“Each of them …”).

**Resulting table:** Critical Success and Success are unaffected; Failure takes the first outcome; Critical Failure takes the critical-failure outcome, or repeats the failure outcome.

**Lingering grammar:**
- Placed line areas are accepted for degree-save lingering areas.
- “<noun>'s space” is accepted as an area name.
- Plural and elided verbs (“enter or begin their turn in …”) give the enter plus turn events.

## Coverage

- **The Queen's Rainbow (new, Phase 3):** a 60-foot line. Entering it or beginning a turn in it calls for a Fortitude save: Dazzled for 1 round, or Blinded for 1 round on a critical failure.
- **Information Overload:** the table now compiles (Stupefied 1/2), but it's still refused. It's a sustained spell, and the save route can't keep a condition alive for as long as a spell is sustained. That lifecycle gap now blocks only this spell among the compact-table spells; no shared controller was built for one spell.
- **The other compact-sentence spells** stay blocked by their own rules, among them:
  - Carrion Mire (counteracts healing);
  - Nymph's Grace (“first time … each round”, Confused never harms you);
  - Scrounger's Glee (can't be reduced below 1, Dismiss reaction);
  - Flesh Tsunami and Fallen Soldier's Lament (thrall and corpse targets);
  - Control Sand (“as long as it remains in”);
  - Radiant Globe and Gift of the Anemos (attack-based triggers).

**Census:** **286 enabled.** Only Information Overload and The Queen's Rainbow changed across the corpus, and all family regressions show 0.

## Evidence

**Automated:** 290/290 tests pass. `test/compact-degree-table.test.js` covers:
- all four forms and the unwritten critical failure;
- the refusals: an attack condition, a back-reference, a trailing rule, two sentences, and a wrong save;
- Information Overload's remaining lifecycle gap;
- The Queen's Rainbow.

There's also a guide example.

[Live evidence](phase-2-3-compact-degree-tables-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- **Homebrew Sudden Dread** (“The target must succeed at a Will save or become Frightened 1 (or Frightened 2 on a critical failure).”), cast at three targets: success → no Frightened, failure → Frightened 1, critical failure → Frightened 2.
- **The Queen's Rainbow**, a placed 60-foot line:
  - nobody was inside at casting;
  - a creature walking in was flagged as entering;
  - the GM confirmed, and a critical failure applied Blinded for 1 round (turn-start expiry);
  - deleting the line ended the spell.
- **Regressions rerun live:** Breath of Drought, Ember Vortex and Petal Storm.

## Reproduction

Live: `tools/phase23-affliction-verification.mjs` case `compact`, then `cleanup`.
