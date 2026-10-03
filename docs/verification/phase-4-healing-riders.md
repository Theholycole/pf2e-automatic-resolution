# Direct healing riders — verification

2026-09-26. This batch works on Phase 4's **Healing / recipient mode** group (47 blocked at the start). It's tied in size with Attack, and Attack's remaining spells are mostly one-off mechanisms.

## Choosing the batch

The 47 remaining healing spells split as follows:
- **Counteract** (Delay Affliction, Luminous Stardust Healing, Harmonize Self, Soothing Ballad, Sound Body);
- **healing from items or food** (Cornucopia, Nature's Bounty, Bounty of the Sky);
- **healing over time or on a trigger** (Fated Healing, Moth's Supper, Regenerate, Phoenix Ward, Life Pact);
- **Effects that change other healing** (Healer's Blessing, Capital Dividend, Consecrate Flesh);
- **area splits and damage-derived healing** (Rejuvenating Flames, Heartbolt, Blood-Feasting Breath);
- **one-off mechanics** (Mending, Execute, Moment of Renewal and others).

This batch takes the direct heals that each need one general rule. There's no spell-name dispatch.

## Compiler

**`healing-compiler.js`:**
- **Healing sentences:** “Each target regains X Hit Points.” and “You prevent the target from dying and restore X Hit Points to the target.”
- **Targets by actions:** “You can spend 1 to 3 actions Casting this Spell, and you can target a number of creatures equal to the actions spent.”
  - The cast PF2e variant's Time must be in that range, and its Target must name that many creatures.
  - The base item stays unresolved.
- **An emanation with a Target** is a range limit, recorded as `healing.within`. Any other area is still refused.
- **Wounded:** “If the target had the Dying condition, coming back from Dying due to this healing doesn't increase its Wounded condition.” sets `healing.noWoundedIncrease`.
- **Free movement:** “… and can Fly up to N feet as a free action along a path of their choice; this movement doesn't trigger reactions but can never put the target in danger, …”
  - It becomes a `free-movement` note. The movement verbs accepted are Fly, Stride, Step, Swim, Climb and Burrow.
  - Other wording after the healing is still a rule and blocks the spell.
- **A reaction's own limit:** “You can't use <spell> if the triggering effect was a death effect or an effect that leaves no remains, such as …” becomes a `reaction-limit` note.
- **Riders:** a rider “… and it gains …” is read with the target as its subject.

**Targets:**
- `target-predicate-compiler.js`: `1 willing living creature` becomes a living-creature predicate, and `1 undead minion you control` an undead-trait predicate. As with “your companion”, which creatures are the caster's is the caster's choice.
- `unscoped-effect-trigger-compiler.js`: the minion target counts as one actor recipient for the duration-bound Effect rule.

## Runtime (`effect-runtime.js`)

- **Range:** with `within`, each recipient's token must be within that distance of the caster's token, or the spell is refused before rolling.
- **Notes:** they're shown on the healing roll message, as “Target:” for movement and “Caster:” for the reaction limit.
- **Dying:** PF2e 8.5 doesn't remove Dying when a creature is healed. A live probe confirmed an NPC healed from 0 kept Dying 1, and the system code has no such rule.
  - On this route, a recipient that had Dying and ends at 1 HP or more now loses Dying and Unconscious, and gains Wounded 1 (or +1), as the rules say. `noWoundedIncrease` skips the Wounded step.
  - This applies to every direct-healing spell, not only the new ones.

## Coverage

**New:**
- **Rebuke Death:** all three variants (1, 2 or 3 living creatures within 20 feet; no Wounded increase).
- **Breath of Life:** a reaction healing 5d8, with the reaction's limit noted.
- **Lively Flight:** heals 6d8 (vitality) and notes the free Fly.
- **Necromancer's Generosity:** void healing and its Effect, for an undead minion.

**Census:** **348 enabled**, up from 344 (Healing / recipient mode: 17 of 60, 43 left).
- The corpus diff against b46 moved exactly these four spells, and Rebuke Death's three variants.
- Six other spells only gained a complete target reading (willing living creature). Their levels are unchanged: Diabolic Edict stays prompted, and Diviner's Sight, Halcyon Mists, Healer's Blessing, Status and Regenerate stay unsupported.
- The speed, escape and six rule-family checks report 0 regressions.

## Evidence

**Automated:** 383/383 tests pass. `test/healing-riders.test.js` covers:
- Rebuke Death's variants, the base item's refusal, a variant whose Target doesn't match its actions, and a non-emanation area;
- Breath of Life's note;
- Lively Flight's note and living predicate, and the refusal of a changed movement clause;
- Necromancer's Generosity's void healing, undead predicate and Effect recipient.

[Live evidence](phase-4-healing-riders-live-results.json) on Foundry 14.367 / PF2e 8.5.0, `pftest`, case `healingRiders`:
- **Rebuke Death, 2 actions:**
  - A dying creature (0 HP, Dying 1, Unconscious) ended at 8 HP with no Dying, awake and Wounded 0.
  - An awake creature went from 300 to 308 HP.
  - A creature 30 feet away was refused (“isn't within 20 feet of the caster”) and wasn't healed.
- **Breath of Life:** a dying creature ended at 28 HP, awake, with no Dying and Wounded 1 (the ordinary rule). The message showed the reaction limit.
- **Lively Flight:** healed 36, and the message showed the free Fly. An undead target was refused (“requires a living creature”).
- **Necromancer's Generosity:** the undead minion healed 5 and got “Spell Effect: Necromancer's Generosity”. A living creature was refused (“requires the undead trait”).
- **Regressions:** `directHealing`, `healOrHarm` and `selfConditional` were rerun, then cleanup.

## Reproduction

```sh
node --test --test-isolation=none test/*.test.js
node tools/compile-official-content.mjs /path/to/verified-content /tmp/phase23-b47
node tools/diff-compiled-plans.mjs /tmp/phase23-b46/official-spell-compiler-report.json /tmp/phase23-b47/official-spell-compiler-report.json
python3 tools/build-phase-spell-batches.py /tmp/phase23-b47/official-spell-compiler-report.json
node tools/test-cross-family-speed.mjs /path/to/verified-content /tmp/phase23-b47/official-spell-compiler-report.json reports/phase-spell-batches/speed-family-baseline.json
python3 tools/build-spell-resolution-status.py
```

Live: `tools/phase23-affliction-verification.mjs` case `healingRiders`, then `cleanup`.
