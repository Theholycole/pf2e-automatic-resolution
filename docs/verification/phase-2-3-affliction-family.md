# Affliction handoff — verification

2026-09-25. Affliction progression is delegated to the **Pseudo Afflictions** module (reyzor1991, v0.5.1), which owns the affliction Effect, stage effects and progression. This batch compiles and runs everything around it:
- the save's immediate outcomes;
- delivery damage;
- the handoff of each target's *finalized* degree to Pseudo Afflictions.

It also adds a core safety guard: a degree save whose structured damage no outcome applies is now blocked, where before that damage was silently dropped. No spell-name or ID dispatch was added.

## Coverage

New shared-save routes (7):

- **Spider Sting, Purple Worm Sting:** “You deal XdY piercing damage to the touched creature and afflict it with … The target must attempt a Fortitude save.” The delivery damage applies at every degree, including a critical success. On a success the outcome's poison damage is added, and a failure or critical failure starts stage 1 or stage 2.
- **Blood Chestnuts:** takes 0, half, full or double piercing damage by degree, with stage 1 on a failure and stage 2 on a critical failure. This uses the new typed “takes full/double the piercing damage” wording.
- **Blinding Bottle, Crimson Breath:** the success dice are the spell's structured damage; failures start the affliction. Crimson Breath's reference “breath of the mantis god poison” is matched to its block only because the spell has the poison trait.
- **Divine Plagues, Advanced Scurvy:** handoff only, plus Advanced Scurvy's success Enfeebled 1 for 1 minute.

The [family audit](../../reports/phase-spell-batches/affliction-family-audit.md) has 23 members with stage blocks, 7 of them executable. The rest stay blocked by their own rules:
- **Imp, Wyvern, Leng and Linnorm Sting:** “If the target takes piercing damage, they must attempt a Fortitude save” makes the save depend on the damage. That needs a damage-before-save step; these spells are now blocked by `unused-shared-damage`.
- **Mycological Malady, Curse of Death, Dread Mosquito Storm:** sustained or lifecycle rules (`affliction-handoff:lifecycle`).
- **Blister Bomb:** a week of immunity on a critical success.
- **Abyssal Plague:** a penalty to saves against the plague.
- **Internal Insurrection:** an unvalued Clumsy.
- **Others:** the rest have preamble rules of their own.

## Rules

- **Stage block:** the single block after the degree table, with a name (a `<strong>` or `<h2>` heading that isn't a label) and consecutive Stage 1..n entries. Level, traits and maximum duration are recorded.
- **Outcome sentences, matched exactly:**
  - “The target/creature is afflicted with NAME at stage N.”
  - “The target/creature is afflicted with stage N NAME.”
  - “The target/creature takes full|double the TYPE damage and becomes afflicted with NAME at stage N.”
- **Name and stage checks:** NAME must equal the block name (an optional trailing poison, disease or curse is allowed only when the spell has that trait), and N must be a stage in the block. Otherwise the route is blocked with `affliction-handoff:*`.
- **Plain outcome dice:** “The target/creature takes XdY TYPE damage.” uses the structured component when formula and type match; otherwise it becomes a plain formula, and only for spells without heightening.
- **Lifecycle:** only instantaneous spells; sustained or spell-bound diseases stay blocked.
- **Core contract:** `isAfflictionHandoffPlan` requires the `affliction-resolution` delegation, one block, and afflicting outcomes whose stage lies within it. Only then is the delegated capability accepted. Tampered stages or a missing delegation are rejected (tested).
- **Runtime handoff to Pseudo Afflictions:**
  - **Why at Finalize:** Pseudo Afflictions normally reacts to native saving-throw chat messages. This module's save rolls are provisional and post no such message, so they couldn't trigger it early, and rerolls couldn't apply it twice. At Finalize, for each target with an afflicting degree, the module calls the `pseudo-afflictions.processMessage` hook with the confirmed degree, which already includes GM corrections and degree adjustments. It passes the cast DC and the source spell, which Pseudo Afflictions looks up by slug.
  - **Confirmation:** the module then waits up to 5 seconds for a Pseudo Afflictions Effect to be created, or for its stage to rise, and records it on the card: “Afflicted: NAME, stage N — handled by Pseudo Afflictions (…)”.
  - **Fallback:** if Pseudo Afflictions is inactive or doesn't know the spell, the card says “… apply the affliction manually”. Nothing else is applied for the affliction.
  - **Rollback:** a newly created Pseudo Afflictions Effect is rolled back with the cast's other Effects if application fails. A stage increase on an existing affliction is treated as irreversible.
  - **No module Effect:** the module creates no affliction Effect of its own (it briefly had a rule-less marker, removed at the user's direction).

## Evidence

**243/243 automated tests pass.** The new `test/affliction-handoff.test.js` covers:
- block parsing, including an `<h2>` heading;
- delivery damage and the stage map for both Sting spells;
- typed full/double damage and structured success dice;
- blocks for a renamed affliction, an out-of-range stage, a sustained lifecycle and gated delivery;
- core rejection of tampered handoffs.

The corpus delta against the degree-adjustment output changes 14 plans, with 7 newly executable and none lost. Every family regression passes with 0 regressions:
- Speed
- event-lifetime
- damage-derived
- self-help
- degree-rider
- recurring
- degree-adjustment
- affliction

Census: **226 enabled nonritual routes** and **95 executable shared-save plans**. Primary worklists: Phase 2 148 / 423 enabled / not enabled, Phase 3 31 / 593.

[Live evidence](phase-2-3-affliction-live-results.json) on Foundry 14.367 / PF2e 8.5.0 with Pseudo Afflictions 0.5.1 (disposable `pftest` world). Each of the seven spells was cast at all four degrees.

| Spell | Picked up by Pseudo Afflictions | Failure / critical failure |
| --- | --- | --- |
| Spider Sting | yes | Affliction Effect at stage 1 (Enfeebled 1) / stage 2 (Enfeebled 2); piercing delivery damage at every degree, and a success adds poison |
| Purple Worm Sting | yes | stage 1 / 2 (Enfeebled 2) |
| Divine Plagues | yes | stage 1 / 2. Pseudo Afflictions applies all three of clumsy, stupefied and enfeebled rather than the caster's single choice (its modelling) |
| Crimson Breath | yes | stage 1 / 2 (Drained 1) |
| Blood Chestnuts | no (not in its registry) | card reports manual handling; damage 0 / half / full / double still applied |
| Blinding Bottle | no | card reports manual handling |
| Advanced Scurvy | no | card reports manual handling; success Enfeebled 1 still applied |

Other checks:
- Pseudo Afflictions always used the cast DC (24).
- No affliction was applied on a success or critical success.
- The module created no Effects of its own.
- A second failed Spider Sting advanced the existing poison to stage 2 (Pseudo Afflictions' repeated-poison rule) instead of adding a second Effect.

Before the integration was in place, a probe confirmed that the module's provisional save rolls didn't trigger Pseudo Afflictions. Fixtures were removed after export.

Pseudo Afflictions' registry also covers Wyvern, Imp, Leng and Linnorm Sting, Abyssal Plague, Internal Insurrection, Mycological Malady, Goblin Pox, Curse of Death and others in this family. Those spells are still blocked by their own non-affliction rules (see Coverage). Once those rules compile, the same handoff applies to them.

## Batch 2 — the rest of the family

This batch adds 11 new shared-save routes. The affliction family is now **18 of 24**.

| Spell | Rule that unblocked it | Pseudo Afflictions |
| --- | --- | --- |
| Imp, Wyvern, Leng, Linnorm Sting | **Damage-gated delivery:** “If the target takes piercing damage, they [also take 1d6 spirit damage and] must attempt a Fortitude save.” The delivery (and Imp's spirit damage) applies at every degree. A creature that takes 0 piercing damage after IWR gets nothing further, and the card says “Took no piercing damage — no save”. | yes |
| Swarming Wasp Stings | **Damage-gated area:** “Creatures in the affected area take … Each creature that takes piercing damage must attempt…”. Its “10-foot burst” target entry is now read as an area. | yes |
| Blightburn Blast | **Basic-save affliction rider** with no degree table: “Creatures who fail their save are afflicted with stage 1 of … (on a critical failure … stage 2)”. The level and DC sentence is a handoff detail; the handler gets the cast DC. | yes; its onset shows first, as Pseudo Afflictions models it |
| Goblin Pox | A stage block placed **before** the degree table, which the preamble check now ignores. “Creatures that have the goblin trait and goblin dogs are immune” is read as immunity to the disease, not to the spell. Goblin-trait targets skip the handoff automatically; the card asks the GM to check for goblin dogs. | yes |
| Internal Insurrection | “becomes @UUID{Clumsy} for 1 round” — a **bare linked valued condition** granted directly is value 1, which is what PF2e applies for that link. A value written after the link (“{Drained} [[/r 1d4]]”) is never implied, so Wails of the Damned stays blocked (regression test). | yes |
| Abyssal Plague | Success: “2 spirit damage per spell rank” → `(2*@item.rank)[spirit]`, plus a **−2 status penalty to saves against the plague for 1 day or until contracted**. This is an Effect with a FlatModifier limited to saves whose item is this spell or its Pseudo Afflictions Effect, which switches off once the creature has that Effect. | yes |
| Blister Bomb | Critical success: “unaffected and is immune to blister pox for 1 week” → a 7-day immunity Effect. A later cast's affliction handoff reports the creature as immune. | no (manual) |
| Bone Moth's Kiss | “1 creature with bones or a natural exoskeleton” is a **GM-confirmed anatomy target** (also used for skeleton, teeth and blood). “the bone moth's kiss” drops its article. Sentences about the spell's own introduced vehicle (“A tiny, bone-white moth emerges…” → “The moth lands on…”) with no mechanic signal count as narration; anything the spell didn't introduce stays residual (tested). | no (manual) |

**Evidence:**
- 247/247 automated tests pass.
- The corpus delta against batch 1 changes 14 plans: 11 become executable and none are lost. Boneshaker and Teeth to Terror gain only their anatomy targeting. Mosquito Blight gains only an explicit lifecycle gap.
- All nine family regressions show 0 regressions.
- Census: **237 enabled** and **106 executable shared-save plans**.

[Live evidence](phase-2-3-affliction-batch2-live-results.json), all four degrees for each of the 11 spells:
- Stages 1 and 2 were created by Pseudo Afflictions for the nine spells it knows; Blister Bomb and Bone Moth's Kiss were reported for manual handling.
- **Damage gate:** a piercing-immune target of Wyvern Sting took no damage and wasn't afflicted, while a normal target was.
- **Goblin Pox:** the goblin was immune and the human afflicted, with the goblin-dog note on the card.
- **Blister Bomb:** a critical success gave the 7-day immunity, and a later failure was reported as immune.
- **Abyssal Plague:** the success dealt 10 damage at rank 5, and the save against the spell dropped from +10 to +8. After contraction it matched a plain save (+9 each, with stage 1 Drained).

Two earlier Abyssal Plague runs failed and were fixed:
- PF2e drops the `effect-` prefix in `self:effect:` roll options, so the predicate is now `self:effect:<spell slug>`.
- The harness compared against a plain roll taken before stage 1 Drained.

## Batch 3 — the last six (family complete: 24 of 24)

| Spell | Rule | Route |
| --- | --- | --- |
| Cordyceps Command | **Cast-time behaviour choice** for a delegated stage. The caster picks ascend, consume, descend or lure; the choice sentence, the stage-3 sentence and the rest of that paragraph (risky behaviour, the +4 to the next save when the behaviour leads to harm) are recorded rather than dropped. The save card shows one button per behaviour, Finalize waits for the choice, and the chosen behaviour and notes are written at the top of Pseudo Afflictions' affliction Effect. | shared save |
| Mariner's Curse | **Curse condition floor.** “becomes sickened N and can't reduce its sickened condition below 1 while the curse remains” compiles to an ordinary Sickened N plus a curse Effect with a locked grant of Sickened 1. “The curse can be lifted by …” is its ending, and the GM deletes the Effect. “Whenever the target is sickened and on the water at least a mile from shore, it is also Slowed 1” is a toggle on the curse that grants Slowed 1 while it's on. PF2e re-evaluates that grant only on actor updates, so the module touches the actor when the toggle changes. | shared save |
| Restoration | **Affliction care**: choose to lessen a toxin (poison stage −1, or −2 at 4th; never below stage 1 or cured; once per exposure) or reduce conditions (Clumsy, Enfeebled or Stupefied by 2, or two of them by 1; Drained added at 4th; Doomed −1 as a third mode at 4th, not permanent Doomed unless the 6th-rank cost is paid). One Restoration per creature per day (a 1-day marker). | affliction care |
| Restorative Moment | Doomed and Drained −1, a save against each affliction whose current stage lasts 1 day or less, then 1 day of immunity. | affliction care |
| Take its Course | An unwilling target rolls Will against the caster's DC, and a success negates the spell. Otherwise, an affliction save at +2 or −2 status, or persistent poison: damage now (optional) and a flat check at DC 5 or 20 using PF2e's own recovery roll (the normal DC is restored afterwards). At 7th rank, any number of these. PF2e's linked ±2 spell Effects are claimed by the compiled modifier choice. | affliction care |
| Ectoplasmic Expulsion | Counteract one effect with the emotion or possession trait, or one granting Controlled or Fascinated. The caster's spellcasting check is rolled against the effect's counteract DC and rank (entered by the GM) using PF2e's counteract table. On a failure, the target gets +2 status to Will saves whose item is that effect or its source spell, for 1 hour. | affliction care |

**The affliction-care route** (`src/compiler/affliction-care-compiler.js`, `scripts/affliction-care-core.js`, `scripts/affliction-care-runtime.js`):
- **Operations:** exact sentence and mode-entry forms compile to shared operations: decrease conditions, affliction saves, a single affliction save with a modifier choice, reduce an affliction stage, reduce conditions by pattern, persistent damage, and counteract. There are also limits: an unwilling save, temporary immunity or a daily marker, once per exposure, and permanent-condition rules. Heightened entries change them by rank.
- **Blocking:** an unrecognised sentence blocks the spell (tested). Only the first sentence may be narration, and only if it has no rule words or conditions.
- **Runtime:** a GM-only resolve button on the spell card opens a choice dialog showing the target's afflictions, stages and conditions. The runtime applies the operations and posts a result card.
- **Affliction stages:** these use PF2e's affliction save table (critical success −2, success −1, failure +1, critical failure +2; virulent critical success −1 and success 0) on Pseudo Afflictions' Effect badge. Pseudo Afflictions re-applies stage conditions, onset offsets are respected, and an affliction in its onset makes no save.
- **Census:** the route is counted as “Affliction-care workflow”.

**Evidence:**
- 252/252 automated tests pass. The new `test/affliction-care.test.js` covers compilation, rank changes, affliction and counteract arithmetic, reworded-sentence blocks, the curse floor and the behaviour choice.
- The corpus delta against batch 2 changes exactly these 6 plans.
- All ten family regressions show 0 regressions.
- Census: **243 enabled**; the Delegated affliction family is 24 of 24.

[Live evidence](phase-2-3-affliction-batch3-live-results.json):
- **Cordyceps Command:** Finalize was blocked until the behaviour was chosen, then “Descend” was written onto Pseudo Afflictions' Effect.
- **Mariner's Curse:** a success gave Sickened 1 and no curse. A critical failure gave Sickened 2, and four reductions stopped at 1. The toggle gave Slowed 1 at sea and removed it ashore.
- **Restorative Moment:** Doomed 1→0 and Drained 2→1, the Spider Sting save was rolled (a critical success cured it), and a second cast was refused.
- **Restoration:** poison stage 2→1, and Clumsy 2→0. The real dialog was then filled in by hand: Clumsy 2→1 and Enfeebled 1→0.
- **Take its Course:** a −2 hindered save moved stage 1→2. An unwilling target's successful Will save negated it. Persistent poison took 10 damage now and then a DC 20 flat check.
- **Ectoplasmic Expulsion:** a counteract critical success removed an emotion effect, and a critical failure added the +2 resonance.

## Without Pseudo Afflictions

Pseudo Afflictions is optional. When it isn't installed or active, every spell still resolves its own parts. Each affliction step becomes an exact instruction for the GM, and nothing errors.

| Spells | Without Pseudo Afflictions |
| --- | --- |
| The 20 save-route affliction spells | Save, damage, conditions and immunities apply as usual. The card says “Afflicted: NAME, stage N — Pseudo Afflictions is not active; apply the affliction manually”. For Cordyceps Command, the card line also carries the chosen behaviour's full text and notes. |
| Abyssal Plague | The −2 penalty Effect and card say to delete it when the creature contracts the plague, since it can't detect that by itself. |
| Mariner's Curse, Ectoplasmic Expulsion | Unaffected; they don't use afflictions. |
| Restoration, Restorative Moment, Take its Course | Their condition, persistent-poison, unwilling-save and immunity steps apply. Each affliction step (lessen a stage, affliction saves, a modified affliction save) is posted as a **“GM to apply:”** line stating the exact rule: the stage change, the modifier, the floor and once-per-exposure. The choice dialog says afflictions aren't tracked. |

The same instruction is posted when Pseudo Afflictions *is* active but tracks no matching affliction on the target (for example one applied by hand).

[Live evidence](phase-2-3-affliction-no-handler-live-results.json): Pseudo Afflictions was disabled in `pftest` and the above was confirmed for Spider Sting, Cordyceps Command, Abyssal Plague, Restorative Moment, Restoration and Take its Course. It was then re-enabled, and the Cordyceps Command handoff was re-verified with it active. Behaviour text is now stored with condition links flattened (“Off-Guard”, not the raw link).

## Reproduction

The same pipeline as earlier batches, using `/tmp/phase23-b7`, plus:

```sh
node tools/report-rule-family.mjs afflictions /tmp/phase23-b7/official-spell-compiler-report.json /path/to/verified-content reports/phase-spell-batches/affliction-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live (requires Pseudo Afflictions active): `tools/phase23-affliction-verification.mjs` cases `environment`, `family`, `repeatedPoison`, `damageGate`, `goblinImmunity`, `blisterImmunity`, `abyssalPenalty`, `familyTwo`, `cordyceps`, `marinersCurse`, `care`, `noHandler` (with Pseudo Afflictions disabled), `cleanup`. Batch 2 baseline: `reports/phase-spell-batches/affliction-2-family-baseline.json`.
