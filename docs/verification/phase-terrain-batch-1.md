# Terrain batch 1 — verification

2026-09-26. The first batch of the terrain family (your choice after cantrip batch 2). It also applies your decision to trust PF2e's Effect data where it differs from the text.

## Rules and spells

| Rule | Spell (rank) |
| --- | --- |
| A difficult-terrain area with damage on casting (“…, dealing 6d6 piercing damage to creatures in the area with a basic Reflex save.”), a narrated terrain sentence, an ending note (“turn to dust when the spell ends”), and Dismiss | Cave Fangs (3) |
| **PF2e data over text:** the Effect is applied as PF2e defines it, with the difference in the apply dialog and a GM whisper | |
| — a stated resistance the Effect gives differently at the rank | Reinforce Eidolon (cantrip) |
| — text speaking to the caster while PF2e's Target is a creature | Ghostly Shift (cantrip) |
| — a “+N bonus … such as <actions>” sentence whose actions the Effect names | Song of Strength (cantrip) |

**Kept strict:** a first version exempted any action link the Effect's predicates name. That unblocked 10 plans, including Honeyed Words, which has a rule its Effect doesn't have (“reduce that penalty by half”). The exemption now applies only to a “+N bonus … such as …” sentence whose action links are all named by an Effect modifier of that value and type. Honeyed Words, Bullhorn, Illusory Disguise and the rest are unchanged.

**Still blocked in the terrain family:**
- **Per-square hazard damage:** Spike Stones, Etheric Shards, Coral Eruption, Rose's Thorns, Field of Razors.
- **Effects that end when a creature leaves the area:** Entangling Flora, Sea of Thought, Swampcall, Oneiric Mire. These are the next batch.
- **Terrain for fliers or greater difficult terrain:** Blast of the Bellows, Corrosive Muck, storms.
- **Sustain growth or movement:** Conjured Clockwork, Cyclone Rondo, Rouse Skeletons.
- **Non-creature rules:** 500 Toads (traps), Tacky Pine Sap (ignition), Rime Slick (objects).
- **Action-count areas:** Earthworks.

**Cantrip left:** Sting of the Sea isn't only a data difference; its save repeats at the start of each of the target's turns while the spell lasts.

## Coverage

**Census:** **451 enabled**, up from 447. Cantrips: 53 of 120. Rank 3: 57.
- The b78 corpus diff against b77 changed exactly the four spells above. No variant plan changed and no plan lost a route.
- The speed check passed, and the escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 488/488 tests pass.
- `test/terrain-batch-1.test.js` covers Cave Fangs' declaration, the three data notes and recipients, and that Honeyed Words, Bullhorn and Illusory Disguise stay blocked.
- `test/cantrip-batch-2.test.js`'s Reinforce Eidolon assertion now expects the Effect with its note.

[Live evidence](phase-terrain-batch-1-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `terrainBatch1`:
- **Cave Fangs:** the region got PF2e's difficult terrain (walk ×2), and the confirmed creature's failure took the full `6d6 piercing` roll. Dismiss (the Ongoing control's request) ended the spell (reason `dismissed`) and removed the region.
- **Reinforce Eidolon:** the Effect was applied, and the GM note says PF2e's Effect gives resistance 0 at rank 1 where the text says a minimum of 1.
- **Ghostly Shift:** the Effect went on the targeted creature, not the caster, with the recipient note.
- **Song of Strength:** the caster and the ally within 60 feet got the Effect, with the “such as” note.
- **Regressions:** `lingering`, `cantripBatch1`, `cantripBatch2`, `durationBuffs`, `reactionBuffs`, `heightenedDuration`, `enemies` and `phrasings` passed, with cleanup between them. The run left no P23 fixtures or combats.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b78
node tools/diff-compiled-plans.mjs /tmp/phase23-b77/official-spell-compiler-report.json /tmp/phase23-b78/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b78/official-spell-compiler-report.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `terrainBatch1`, then `cleanup`.
