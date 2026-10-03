# Duration-bound native Effect buffs — verification

2026-09-25. About 130 unresolved Phase 2 spells have no saving throw. Most are buffs that link one PF2e spell Effect. 33 were blocked only because the description never says “the target gains …” or “you gain …” in the phrasing the on-cast rule recognises (“granting it a +1 status bonus”, “grants you cold resistance 5”, “The target and its gear gain …”).

This batch adds a structural recipient rule, which applies only when the rest of the spell is already fully proved. No spell-name or ID dispatch was added.

## Rule

The spell's single linked Effect is applied when the spell is cast, as its standing effect, when all of the following hold:
- **Structure:** no primary save, no degree table, no area or aura, no trigger or reaction, and exactly one linked Effect.
- **Duration:** a real duration (“N rounds/minutes/hours/days”, or “until the start/end of your next turn”) and no repeating timing (“each round”, “whenever”, “the first time”, “then”).
- **With a target:** the target must be exactly “1 creature”, “1 willing creature” or “1 creature touched”, and the caster must gain nothing (“you gain …”, “grants you …”).
- **Without a target:** the caster is the recipient, and nothing else may be named as one: no target, ally, eidolon, companion, familiar, minion or thrall.
- **Completeness:** the existing check against the Effect's rule elements must find nothing missing. Anything short of that (conditions outside the Effect, text-only damage, referenced actions, an Effect with no rules, choices the Effect can't make) leaves the spell blocked. This rule never creates a partial (“guided”) route.

A new general completeness blocker, `embedded-cast` (“You cast Ignition as part of casting …”), applies to every direct Effect route.

## Coverage

**19 new Effect routes, and none lost:**
- **Fully automatic (13):** Heroism, Fly, Shrink, Runic Body, Lashunta's Life Bubble, Countless Eyes, Dragon Wings, Angelic Wings, Stormwind Flight, Weapon Trance, Speaking Sky, Untwisting Iron Augmentation, Word of Truth.
- **With a caster choice through PF2e's own prompt (6):** Resist Energy, Enlarge, Adapt Self, Elemental Motion, Traveler's Transit, Pocket Library.

**Refused on purpose (tested):**
- **Lifelink Surge:** the recipient is the eidolon.
- **Divine Dragon's Watch:** a target, but the caster gains the reaction.
- **Flaming Fusillade:** it casts Ignition.
- **Sweet Dream:** its unconsciousness is outside the Effect.

18 more spells reached the Effect route only as partial, and they stay blocked. Among them are Share Vision, Sweet Dream, Mirror Image, Prismatic Armor, Untamed Shift and Unfettered Movement.

## Evidence

**Automated:** 254/254 tests pass. The new `test/duration-bound-effect.test.js` covers the target, self and choice cases and the four refusals.

**Regressions:** the Effect-route delta changes exactly the 19 intended spells, and every family regression shows 0 regressions.

**Census:** **262 enabled** (from 243). Phase 2 is 180 / 405.

[Live evidence](phase-2-duration-bound-live-results.json) on Foundry 14.367 / PF2e 8.5.0:
- All 13 automatic buffs were cast through the module's Effect route. Each Effect landed only on the correct recipient (6 on the target, 7 on the caster), with PF2e's own rules and duration.
- **Resist Energy** was cast by hand. PF2e's energy prompt appeared, Fire was clicked, and the target got “Spell Effect: Resist Energy (Fire)” with fire resistance 5.

## Reaction buffs (follow-up batch)

A reaction is cast when its trigger happens, so its single linked Effect is applied then. This needs an explicit recipient: “You gain …” with no target, or “The target gains …” / “It gains …” with a target. Trigger-named targets such as “the triggering creature”, “the creature that would take fire damage” and “the creature targeted by the triggering Strike” are the creature the caster picks.

As with duration-bound buffs, only complete Effects are enabled. On top of that, a reaction limited to “the triggering …” is refused when its Effect never ends and isn't removed after the roll (`unbounded-trigger-effect`).

**New general completeness blockers** apply to every direct Effect route:
- teleport (`movement`);
- “immune to this spell” (`temporary-immunity`);
- “divided … among” (`distribution`);
- incapacitation adjustments;
- “spend **a** single action” (the old pattern missed the article).

The only effect on existing routes: **Ooze Form** moves from prompted to partial (still enabled), because its form attack's incapacitation save isn't in the Effect.

**6 new routes:**
- **Automatic:** Enduring Might, Flame Barrier, Hidebound, Tempt Fate.
- **With PF2e's damage-type prompt:** Energy Absorption, Adaptive Ablation.

**Refused (tested):**
- **Bottle the Storm:** a follow-up spell attack.
- **Repel Metal:** a redirected Strike and immunity to the spell.
- **Community Restoration:** temporary HP divided among allies.
- **Warping Pull:** a teleport.
- **Battlefield Persistence:** an incapacitation level adjustment.
- **Cutting Eye:** a condition outside its Effect.
- **Practice Makes Perfect** and **Scintillating Safeguard:** their PF2e Effects are unlimited and would keep applying to every later check or damage.

[Live evidence](phase-2-reaction-effects-live-results.json):
- **Enduring Might:** the caster got resistance 8 to all damage, ending at the end of the turn.
- **Flame Barrier:** the target got fire resistance 15.
- **Hidebound:** the target got physical resistance 5.
- **Tempt Fate:** the target got its +1 and degree-adjustment Effect.

Practice Makes Perfect also landed correctly in that run, but it's now refused because of its unlimited Effect.

**Evidence:** 256/256 tests pass, all family regressions show 0 regressions, and the census gives **268 enabled**.

## Area ally buffs (follow-up batch)

A spell with an **emanation**, no target, a real duration and exactly one recipient sentence applies its single linked Effect when cast. The accepted sentences are “You and (all) (your) allies (in the area) gain …” (the caster is included) and “(All) (your) allies in the area gain …” (allies only). Recipients:
- the caster, when named;
- every token whose actor is a PF2e ally of the caster (`isAllyOf`, which follows PF2e's alliance setting), is not hidden, and is within the emanation by PF2e's token distance;
- if the GM targets tokens before resolving, those targets replace the automatic ally selection.

**Ongoing auras stay excluded:** “while within the emanation”, “each round”, “whenever”, “Sustain”, “the first time”. So do Effects that aren't complete.

**New routes (4), fully automatic:** Courageous Anthem, Rallying Anthem, Triple Time, Valiant Anthem.

**Stays blocked:**
- **Song of Strength:** its Athletics action links are a conservative completeness block.
- **Benediction** and the other auras: ongoing.

[Live evidence](phase-2-area-allies-live-results.json), with tokens on one row at 5 ft per 100 px:
- **Courageous Anthem (60 ft, includes you):** the caster and the allies at 10 ft and 50 ft got it; the ally at 70 ft and the enemy at 5 ft did not.
- **Valiant Anthem (30 ft, allies only):** only the ally at 10 ft got it.

The first runs gave the Effect to the “enemy” because every fixture actor had PF2e's default opposition alliance. That's why the runtime uses `isAllyOf` rather than token disposition.

**Evidence:** 265/265 tests pass, all regressions show 0, and the census gives **272 enabled**. The [homebrew guide](../homebrew-spells.md) has an area-buff example, and it's covered by a test.

## Companion, eidolon and plural targets; native PF2e auras (follow-up batch)

**Targets:** the duration-bound rule now accepts:
- plural and willing creature targets (`up to N creatures`, `up to N willing creatures`, `1 to N willing creatures`);
- `1 ally`, `1 living creature`, `1 willing animal` (a trait check);
- `your animal companion` / `your eidolon` / `your companion`, which the caster targets.

**Native auras:** an Effect with PF2e's **Aura** rule element is applied to the aura's centre: the caster, or the single target. PF2e then manages who is inside. This needs no save, and the Effect must still be complete.

**New completeness blockers:**
- “the newer spell replaces the older one”;
- Shield Block (without GrantItem);
- a size change without a CreatureSize rule;
- radius growth on Sustain.

These change no existing route.

**New routes (5):**
- **Automatic:** Protector's Sphere, Angelic Halo, Silence (its aura is limited to rank 4+ by PF2e), Magic Hide.
- **With a prompt:** Enlarge Companion.

**Refused:**
- **Boost Eidolon and Reinforce Eidolon:** “the newer spell replaces the older one”.
- **Summoner's Visage:** a size change.
- **Domora's Defense:** Shield Block with the replicas.
- **Protective Wards:** radius growth on Sustain.
- **Benediction:** counteracting malediction, plus growth.

[Live evidence](phase-2-3-native-aura-live-results.json):
- **Protector's Sphere:** cast by the caster. PF2e's aura gave resistance 3 to all damage to the caster and the ally 10 ft away, but not to an ally 50 ft away or an adjacent enemy.
- **Magic Hide:** landed only on the targeted companion.

**Evidence:** 269/269 tests pass (the guide has a companion-buff example, covered by a test), all regressions show 0, and the census gives **280 enabled**.

## Reproduction

Same pipeline, using `/tmp/phase23-b10`.

Live: `tools/phase23-affliction-verification.mjs` case `durationBuffs`.
