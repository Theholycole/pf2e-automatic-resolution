import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}, ...(e.system?.badge ? {badge: e.system.badge} : {})}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
const effects = await catalog();
const compile = source => compileAbility(source, {nativeEffectCatalog: effects});
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

test('Weapon Surge: PF2e\'s Effect on the wielder, its next-Strike sentence proved, and the lasting-longer data note', async () => {
    const plan = compile(await spell('rank-1/weapon-surge'));
    assert.equal(plan.resolution.kind, 'effect');
    // Complete (PF2e's weapon prompt picks the weapon): nothing pending.
    assert.deepEqual([plan.automation.level, plan.automation.pendingCapabilities], ['prompted', []]);
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'source');
    // (User decision: removed after the Strike.)
    assert.deepEqual(plan.resolution.consumeOn, {on: 'strike', weaponFlag: 'spellEffectWeaponSurge', sourceText: plan.resolution.consumeOn.sourceText});
});

test('Weapon Surge proof: kept strict', async () => {
    const source = await spell('rank-1/weapon-surge');
    // Another die, bonus or trait than the Effect's isn't proved: the route falls to guided, with the gaps pending.
    for (const [from, to] of [['1d6 spirit', '1d8 spirit'], ['+1 status bonus', '+2 status bonus'], ['sanctified trait', 'holy trait']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(plan.automation.level, 'guided', to);
        assert.ok(plan.automation.pendingCapabilities.some(capability => capability.startsWith('direct-effect:')), to);
    }
});

test('Funeral Flames: +1 potency, versatile fire, torch light and the dismiss toggle proved; the persistent-damage data note', async () => {
    const plan = compile(await spell('rank-1/funeral-flames'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'prompted', []]);
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'source');
    // (User decision: the toggle's dice are persistent, and using them removes the Effect.)
    assert.deepEqual(plan.resolution.ruleOverrides, [{index: 5, key: 'DamageDice', patch: {category: 'persistent'}}]);
    assert.deepEqual([plan.resolution.consumeOn.on, plan.resolution.consumeOn.option], ['damage-roll', 'dismiss-funeral-flames']);
    const source = await spell('rank-1/funeral-flames');
    for (const [from, to] of [['+1 weapon', '+2 weapon'], ['versatile fire', 'versatile cold'], ['d8s', 'd10s'], ['1d6 persistent fire', '1d6 persistent cold']]) {
        const changed = compile(withText(source, text => text.replace(from, to)));
        assert.notEqual(changed.automation.level, 'prompted', to);
    }
});

test('Halcyon Mists: TempHP from the rolled badge, ending one persistent damage, and the no-Hide reminder', async () => {
    const plan = compile(await spell('rank-1/halcyon-mists'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'automatic', []]);
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'target');
    assert.deepEqual(plan.resolution.endPersistent.types, ['acid', 'bleed', 'fire', 'poison', 'void']);
    assert.equal(plan.resolution.endPersistent.choice, true);
    assert.deepEqual(plan.resolution.gmNotes, ["The target's concealment from this spell can't be used to Hide."]);
    const source = await spell('rank-1/halcyon-mists');
    // Temporary HP the badge doesn't roll, or a persistent sentence without the caster's choice, isn't proved.
    for (const change of [text => text.replace('1d8 temporary', '1d6 temporary'), text => text.replace(/If the creature has persistent damage[^.]*\./, '')])
        assert.notEqual(compile(withText(source, change)).automation.level, 'automatic');
});

test('Veil of Dreams: PF2e\'s sustained Effect stated by the success row (penalty and its sleep override); the concentrate flat check a note', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {inspectCompiledNativeOutcomeEffect} = await import('../scripts/native-outcome-effects.js');
    const plan = compile(await spell('rank-1/veil-of-dreams'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['success', 'failure', 'criticalFailure']) {
        const [effect] = plan.resolution.outcomes[degree].nativeEffects;
        assert.equal(effect.outcomeRule.kind, 'stated-effect');
        assert.equal(inspectCompiledNativeOutcomeEffect(effect, {degree}).supported, true);
    }
    assert.deepEqual(plan.resolution.outcomes.success.noteEffects ?? [], []);
    assert.match(plan.resolution.outcomes.failure.noteEffects[0].text, /DC 5 flat check or the action is disrupted/);
    const source = await spell('rank-1/veil-of-dreams');
    // Another penalty, statistic or override value than the Effect's isn't stated.
    for (const [from, to] of [['-1 status penalty', '-2 status penalty'], ['attack rolls, and Will', 'AC, and Will'], ['increases to -2', 'increases to -3']])
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
});

test('Equal Footing: a land-Speed target check, the success row\'s Effect and the degree-choice Effect carrying Clumsy', async () => {
    const {inspectSavePlan, validateActorTarget} = await import('../scripts/basic-save-core.js');
    const {inspectCompiledNativeOutcomeEffect} = await import('../scripts/native-outcome-effects.js');
    const plan = compile(await spell('rank-1/equal-footing'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'land-speed-above-caster'}]);
    const creature = land => ({type: 'npc', system: {movement: {speeds: {land: {value: land}}}, traits: {value: []}}});
    const constraints = {...plan.targeting.actorConstraints, casterLandSpeed: 25};
    assert.equal(validateActorTarget(constraints, creature(40)).eligible, true);
    assert.equal(validateActorTarget(constraints, creature(25)).eligible, false);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.equal(success.nativeEffects[0].outcomeRule.kind, 'row-modifier-effect');
    assert.deepEqual([failure.nativeEffects[0].outcomeRule.kind, failure.nativeEffects[0].outcomeRule.selectionValue, criticalFailure.nativeEffects[0].outcomeRule.selectionValue], ['degree-choice', 'failure', 'critical-failure']);
    for (const [degree, outcome] of Object.entries({success, failure, criticalFailure})) {
        assert.ok(outcome.effects.every(effect => effect.carriedBy), degree);
        assert.equal(inspectCompiledNativeOutcomeEffect(outcome.nativeEffects[0], {degree}).supported, true, degree);
    }
    const source = await spell('rank-1/equal-footing');
    for (const [from, to] of [['–15-foot status penalty to all its Speeds for 1 minute. During', '–20-foot status penalty to all its Speeds for 1 minute. During'], ['{Clumsy 2}', '{Clumsy 3}'], ['can\'t benefit from bonuses to its Speeds or take', 'can\'t take']])
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
});

test('Celestial Accord: GM-confirmed pair, a combat floor at success, the penalty against the other target and the attitude notes', async () => {
    const {inspectSavePlan, isDegreeAdjustment} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-1/celestial-accord'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.targeting.actorConstraints.predicates[0].kind, 'gm-confirmed');
    const shift = plan.resolution.degreeAdjustment;
    assert.ok(isDegreeAdjustment(shift));
    assert.deepEqual(shift.map, {criticalSuccess: 'criticalSuccess', success: 'success', failure: 'success', criticalFailure: 'success'});
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([success.noteEffects[0].label, success.noteEffects[0].duration.value, success.noteEffects[0].duration.unit], ['Penalty against the other target', 1, 'rounds']);
    assert.match(failure.noteEffects[0].text, /can't make hostile actions/);
    // "As failure, but …friendly …": the failure's behaviour still applies.
    assert.match(criticalFailure.noteEffects[0].text, /^As on a failure: The creature can't make hostile actions .* But: The creature's attitude .* friendly/);
    assert.ok([success, failure, criticalFailure].flatMap(outcome => outcome.noteEffects).every(validNoteEffect));
    const source = await spell('rank-1/celestial-accord');
    // Another floor isn't read as a degree adjustment: the sentence stays a reminder on the notes (never dropped).
    const otherFloor = compile(withText(source, text => text.replace("can't get a result worse than success", "can't get a result worse than failure")));
    assert.equal(otherFloor.resolution.degreeAdjustment ?? null, null);
    assert.match(otherFloor.resolution.outcomes.failure.noteEffects[0].text, /can't get a result worse than failure/);
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('against the other target for 1 round', 'for 1 round')))).supported, false);
});

test('Airburst: Large-or-smaller creatures, the pushes (10 feet from 4th rank), reaction notes and the objects reminder', async () => {
    const {inspectSavePlan, validateActorTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/airburst'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'size-at-most', size: 'lg'}]);
    const creature = size => ({type: 'npc', size, system: {traits: {value: []}}});
    assert.equal(validateActorTarget(plan.targeting.actorConstraints, creature('lg')).eligible, true);
    assert.equal(validateActorTarget(plan.targeting.actorConstraints, creature('huge')).eligible, false);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.equal(success.forcedMovement, undefined);
    for (const outcome of [failure, criticalFailure]) assert.deepEqual([outcome.forcedMovement.distance, outcome.forcedMovement.heightening.minRank, outcome.forcedMovement.heightening.distance], [5, 4, 10]);
    assert.match(failure.noteEffects[0].text, /-2 status penalty to checks made during its reactions/);
    assert.deepEqual(criticalFailure.noteEffects.map(note => note.text), ["The creature can't use reactions until the end of your turn."]);
    assert.match(plan.resolution.reminders[0].text, /^Unattended objects of 1 Bulk or less are pushed 5 feet away from you\. \(10 feet at rank 4 or higher\.\)/);
    const source = await spell('rank-1/airburst');
    // Another heightening, or another size limit, isn't read.
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('pushed to 10 feet', 'pushed an additional 10 feet')))).supported, false);
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('Large or smaller creatures must', 'Creatures that can fly must')))).supported, false);
});

test('Eject Soul: the body stunned, the soul (and its Invisible) a note, a GM soul question and the allies-choose reminder', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-1/eject-soul'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['living-creature', 'gm-confirmed']);
    const critical = plan.resolution.outcomes.criticalFailure;
    // The body is stunned for 1 round; the Invisible is the soul's, never the body's.
    assert.deepEqual(critical.effects.map(effect => [effect.slug, effect.duration?.value, effect.duration?.unit]), [['stunned', 1, 'rounds']]);
    const [note] = critical.noteEffects;
    assert.equal(note.label, 'Soul form');
    assert.match(note.text, /is Invisible, and has a fly Speed of 60 feet.*Heightened \(\+3\): If a willing ally chooses to critically fail/);
    assert.ok(validNoteEffect(note));
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['willing-choice']);
    const source = await spell('rank-1/eject-soul');
    // Another condition on the soul's body (not stunned) isn't read.
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace("target's body becomes stunned for 1 round", "target's body becomes paralyzed for 1 round")))).supported, false);
});

test('Chastising Retort: the reveal-the-truth choice a note; the Feint target\'s Off-Guard never on this creature', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/chastising-retort'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual(critical.effects.map(effect => [effect.slug, effect.value, effect.duration.valueRoll]), [['stupefied', 2, '1d4']]);
    assert.equal(critical.noteEffects[0].label, 'Reveal the truth');
    assert.match(critical.noteEffects[0].text, /recover Hit Points equal to the mental damage it took .* no longer Off-Guard due to the successful Feint\.$/);
    const source = await spell('rank-1/chastising-retort');
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('lose the stupefied condition from the spell', 'lose the frightened condition from the spell')))).supported, false);
});

test('Ignite Ambition: penalties against the triggering effect as 1-round notes; any creature being influenced', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-1/ignite-ambition'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.targeting.actorConstraints.predicates, []);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.match(success.noteEffects[0].text, /-1 status penalty to its defenses against the triggering effect\. This penalty is -2 .* doesn't realize/);
    assert.match(failure.noteEffects[0].text, /the penalty is -4 if/);
    assert.match(criticalFailure.noteEffects[0].text, /automatically follows a suggestion/);
    assert.ok([success, failure, criticalFailure].every(outcome => outcome.effects.length === 0 && validNoteEffect(outcome.noteEffects[0]) && outcome.noteEffects[0].duration.value === 1));
    const source = await spell('rank-1/ignite-ambition');
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('against the triggering effect', 'against all effects')))).supported, false);
});

test('Lose the Path: the triggering Stride as notes; immune for 1 hour regardless (no "temporarily")', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/lose-the-path'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 1, unit: 'hours'});
    assert.match(plan.resolution.outcomes.failure.noteEffects[0].text, /difficult terrain for its Stride/);
    assert.match(plan.resolution.outcomes.criticalFailure.noteEffects[0].text, /But you determine where the target moves/);
    const source = await spell('rank-1/lose-the-path');
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('difficult terrain for its Stride', 'difficult terrain for 1 minute')))).supported, false);
});

test('Undeath\'s Blessing: how Harm and Heal treat it as notes, the willing-no-save reminder, a living target', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/undeaths-blessing'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'living-creature'}]);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([success.noteEffects[0].duration.value, success.noteEffects[0].duration.unit], [1, 'rounds']);
    for (const outcome of [failure, criticalFailure]) {
        assert.match(outcome.noteEffects[0].text, /Harm and Heal spells treat the creature as undead\. .*\+2 status bonus .*Heightened \(\+1\)/);
        assert.deepEqual([outcome.noteEffects[0].duration.value, outcome.noteEffects[0].duration.unit], [1, 'minutes']);
    }
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['willing-no-save']);
    const source = await spell('rank-1/undeaths-blessing');
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('+2 status bonus', '+2 circumstance bonus')))).supported, false);
});

test('Cycle of Retribution: hostile-action damage by row (once, once a round, each time), on the row notes', async () => {
    const {inspectSavePlan, isTriggeredDamage} = await import('../scripts/basic-save-core.js');
    const {prepareNoteEffectSource} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-1/cycle-of-retribution'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const trig = degree => plan.resolution.outcomes[degree].noteEffects[0].triggeredDamage;
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => [trig(degree).frequency, trig(degree).endsSpell]), [['once', true], ['round', false], ['each', false]]);
    assert.deepEqual([trig('failure').dice, trig('failure').die, trig('failure').type, trig('failure').heightening], [1, 4, 'mental', {interval: 1, dice: 1}]);
    assert.ok(['success', 'failure', 'criticalFailure'].every(degree => isTriggeredDamage(trig(degree)) && plan.resolution.outcomes[degree].damage.mode === 'none'));
    const source = prepareNoteEffectSource(plan.resolution.outcomes.failure.noteEffects[0], {castId: 'c', castRank: 3, sourceActorUuid: 'A', sourceItemUuid: 'I', sourceItemName: 'Cycle of Retribution', targetActorUuid: 'T', targetName: 'Foe'});
    assert.deepEqual([source.flags['pf2e-automatic-resolution'].runtime.triggeredDamage.castRank, source.flags['pf2e-automatic-resolution'].runtime.triggeredDamage.targetName], [3, 'Foe']);
    // A tampered payload is refused; another damage than the item's isn't read.
    const tampered = compile(await spell('rank-1/cycle-of-retribution')); tampered.resolution.outcomes.failure.noteEffects[0].triggeredDamage.frequency = 'sometimes';
    assert.equal(inspectSavePlan(tampered).supported, false);
    const other = await spell('rank-1/cycle-of-retribution');
    assert.equal(inspectSavePlan(compile(withText(other, text => text.replace('Each time the target takes a hostile action, the target takes 1d4 mental damage', 'Each time the target takes a hostile action, the target takes 1d6 fire damage')))).supported, false);
});

test('Telekinetic Rend: damage the item lacks, read from the text; the caster picks bludgeoning or slashing; a data note', async () => {
    const {inspectSavePlan, isExecutableBasicSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('cantrip/telekinetic-rend'));
    assert.equal(isExecutableBasicSavePlan(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.sharedDamage.mode, plan.resolution.sharedDamage.formula], ['formula', '(1+floor((@item.rank - 1)/2)*1)d6[untyped]']);
    assert.deepEqual(plan.resolution.casterChoice, {kind: 'damage-type', values: ['bludgeoning', 'slashing'], label: 'Damage type'});
    assert.match(plan.resolution.dataNotes[0], /PF2e's item has no damage entry/);
    const source = await spell('cantrip/telekinetic-rend');
    // Different dice for the two types, or a rider sentence, isn't read.
    assert.equal(isExecutableBasicSavePlan(compile(withText(source, text => text.replace('or 1d6 slashing', 'or 1d8 slashing')))), false);
    assert.equal(isExecutableBasicSavePlan(compile(withText(source, text => text.replace('takes damage only once.', 'takes damage only once. Creatures that fail are knocked prone.')))), false);
    // An item that has damage data keeps PF2e's damage.
    const withData = structuredClone(source); withData.system.damage = {a: {formula: '1d6', type: 'untyped', category: null, kinds: ['damage']}};
    assert.notEqual(compile(withData).resolution.sharedDamage?.mode, 'formula');
});

test('Sacred Beasts: the text\'s 2d6 (+2d6 a rank) with the item\'s basic Reflex; the GM picks the type by the animal', async () => {
    const {isExecutableBasicSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/sacred-beasts'));
    assert.equal(isExecutableBasicSavePlan(plan), true);
    assert.equal(plan.resolution.check.statistic, 'reflex');
    assert.equal(plan.resolution.sharedDamage.formula, '(2+floor((@item.rank - 1)/1)*2)d6[untyped]');
    assert.deepEqual(plan.resolution.casterChoice.values, ['bludgeoning', 'piercing', 'slashing']);
    assert.match(plan.resolution.casterChoice.label, /GM/);
    const source = await spell('rank-1/sacred-beasts');
    assert.equal(isExecutableBasicSavePlan(compile(withText(source, text => text.replace('After their attacks, the animals return', 'After their attacks, each creature is knocked prone and the animals return')))), false);
});

test('Sepulchral Mask: the caster\'s Effect when the area starts, and rows\' Will penalty against emotion effects', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect, validNoteRule} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-1/sepulchral-mask'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.match(plan.resolution.lingering.casterEffect.claimText, /granting you a \+1 status bonus to Will saving throws against emotion effects for 1 minute/);
    const exposure = lingeringExposurePlan(plan);
    const failure = exposure.resolution.outcomes.failure.noteEffects[0], critical = exposure.resolution.outcomes.criticalFailure.noteEffects[0];
    assert.deepEqual(failure.rules, [{key: 'FlatModifier', selector: 'will', type: 'status', value: -1, predicate: ['item:trait:emotion']}]);
    assert.deepEqual([failure.duration.value, failure.duration.unit, critical.duration.value, critical.duration.unit], [1, 'rounds', 1, 'minutes']);
    assert.ok(validNoteEffect(failure));
    // Only a single trait predicate is accepted on a note's modifier.
    assert.equal(validNoteRule({key: 'FlatModifier', selector: 'will', type: 'status', value: -1, predicate: ['self:condition:frightened']}), false);
    const source = await spell('rank-1/sepulchral-mask');
    assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace('+1 status bonus to Will saving throws', '+2 status bonus to Will saving throws')))), false);
});

test('Nymph\'s Grace: an aura (enemies entering once a round or starting their turn inside) saving or Confused 1 round, with the no-harm note', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/nymphs-grace'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.enterOncePerRound, lingering.enemiesOnly, lingering.centre, lingering.sustained], [['enter', 'turn-start'], true, true, 'caster', true]);
    const exposure = lingeringExposurePlan(plan);
    assert.deepEqual(exposure.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit]), [['confused', 1, 'rounds']]);
    assert.equal(exposure.resolution.outcomes.success.effects.length, 0);
    assert.match(exposure.resolution.outcomes.failure.noteEffects[0].text, /never include harming you/);
    const source = await spell('rank-1/nymphs-grace');
    // Any other trailing rule isn't read.
    assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace("never include harming you.", "never include harming you. It also takes 1d4 mental damage.")))), false);
});

test('Dirge of Doom: enemies in the emanation held at Frightened 1 for the spell (a floor), the leaving-the-area note', async () => {
    const {prepareConditionGrantSource} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('cantrip/dirge-of-doom'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['condition-note', 'automatic']);
    const data = plan.resolution.conditionNote;
    assert.deepEqual([data.recipient, data.condition.slug, data.condition.value, data.condition.floor, data.duration.value, data.duration.unit], ['area-enemies', 'frightened', 1, true, 1, 'rounds']);
    const source = prepareConditionGrantSource(data.condition, {system: {value: {isValued: true}}, uuid: 'U'}, {castId: 'c', castRank: 1, duration: data.duration, sourceActorUuid: 'A', targetActorUuid: 'T', sourceItemName: 'Dirge of Doom'});
    assert.equal(source.system.rules[0].onDeleteActions.grantee, 'restrict');
    assert.match(source.system.description.value, /delete this Effect if it leaves the area/);
    const spellSource = await spell('cantrip/dirge-of-doom');
    // A floor at another value, or none, isn't read.
    assert.notEqual(compile(withText(spellSource, text => text.replace('below 1 while', 'below 2 while'))).resolution.kind, 'condition-note');
    assert.notEqual(compile(withText(spellSource, text => text.replace(/They can't reduce[^.]*\./, ''))).resolution.kind, 'condition-note');
});

test('Veil of Confidence: the caster\'s Frightened lowered by 1 now; the rest a note for the minute', async () => {
    const plan = compile(await spell('rank-1/veil-of-confidence'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.resolution.conditionNote.recipient], ['condition-note', 'automatic', 'source']);
    assert.deepEqual([plan.resolution.conditionNote.condition.slug, plan.resolution.conditionNote.condition.reduceBy], ['frightened', 1]);
    const source = await spell('rank-1/veil-of-confidence');
    // A different amount in the two halves isn't read.
    assert.notEqual(compile(withText(source, text => text.replace('reduce the amount by 1', 'reduce the amount by 2'))).resolution.kind, 'condition-note');
});

test('Tether: Speed penalties on notes, Immobilized until it Escapes (or the minute ends), the tether rules on the notes', async () => {
    const {inspectSavePlan, isEscapeLifetime} = await import('../scripts/basic-save-core.js');
    const {validNoteRule} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-1/tether'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([success.noteEffects[0].rules[0].value, failure.noteEffects[0].rules[0].value, failure.noteEffects[0].rules[0].type], [-5, -10, 'circumstance']);
    const immobilized = criticalFailure.effects[0];
    assert.ok(isEscapeLifetime(immobilized));
    assert.deepEqual([immobilized.duration.value, immobilized.duration.unit], [1, 'minutes']);
    assert.match(failure.noteEffects[0].text, /tethers have AC 15 and 10 Hit Points.*Heightened \(\+1\)/);
    assert.equal(validNoteRule({key: 'FlatModifier', selector: 'land-speed', type: 'circumstance', value: -7}), false);
    const source = await spell('rank-1/tether');
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('as long as it\'s within 30 feet of you', 'for 1 hour')))).supported, false);
});
