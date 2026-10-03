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

test('Precious Gleam: the next-hit dice and the material choice proved; every-hit and steel data notes', async () => {
    const plan = compile(await spell('rank-1/precious-gleam'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'prompted', []]);
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'target');
    assert.deepEqual([plan.resolution.consumeOn.on, plan.resolution.consumeOn.weaponFlag], ['weapon-damage', 'weapon']);
    assert.match(plan.resolution.dataNotes.join(' '), /doesn't offer steel/);
});

test('Precious Gleam proof: kept strict', async () => {
    const source = await spell('rank-1/precious-gleam');
    for (const [from, to] of [['1d6 precision', '1d8 precision'], ['1d6 precision', '1d6 fire']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.notEqual(plan.automation.level, 'prompted', to);
    }
    // A material list PF2e's choice doesn't match: PF2e's choice applies, and the card names what it doesn't offer.
    const other = compile(withText(source, text => text.replace('cold iron, silver, or steel', 'adamantine, silver, or steel')));
    assert.match(other.resolution.dataNotes.join(' '), /doesn't offer adamantine or steel/);
    // A duration other than to the start of the next turn doesn't put the Effect on the wielder.
    const longer = structuredClone(source); longer.system.duration.value = 'until the end of the day';
    assert.notEqual(compile(longer).automation.level, 'prompted');
});

test('Home Among Mulberry Leaves: the Strike decides the rows; Immobilized until the start of your next turn or an Escape; the caster picks Clumsy or Enfeebled', async () => {
    const {inspectSavePlan, targetOutcomeConditions, saveCollectionReadiness} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/home-among-mulberry-leaves'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'strike');
    const {criticalSuccess, success, failure} = plan.resolution.outcomes;
    assert.deepEqual(success.effects.map(effect => [effect.slug, effect.endsWhen?.[0]?.event, effect.expirationMode]), [['immobilized', 'escape', 'first']]);
    assert.deepEqual(criticalSuccess.effects.map(effect => [effect.slug, effect.choiceGroup ?? null]), [['immobilized', null], ['clumsy', 'caster-condition'], ['enfeebled', 'caster-condition']]);
    assert.deepEqual(failure.effects, []);
    assert.deepEqual(plan.resolution.casterChoice, {kind: 'condition', values: ['clumsy', 'enfeebled'], label: 'Condition on a critical hit'});
    // The card: only the chosen condition applies; the choice is asked only when a target's row has it.
    const state = {outcomes: plan.resolution.outcomes, casterChoice: {...plan.resolution.casterChoice, selected: null}, targets: [{id: 'a', degree: 'success'}]};
    assert.equal(saveCollectionReadiness(state).ready, true);
    state.targets[0].degree = 'criticalSuccess';
    assert.match(saveCollectionReadiness(state).reason, /choose the condition on a critical hit/);
    state.casterChoice.selected = 'enfeebled';
    assert.deepEqual(targetOutcomeConditions(state, state.targets[0]).map(effect => effect.slug), ['immobilized', 'enfeebled']);
});

test('Home Among Mulberry Leaves: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/home-among-mulberry-leaves');
    // "in addition to" must name the success row's condition; a third option or a save isn't read.
    for (const [from, to] of [['in addition to immobilizing it', 'in addition to slowing it'],
        ['or @UUID[Compendium.pf2e.conditionitems.Item.MIRkyAjyBeXivMa7]{Enfeebled 1}', ', @UUID[Compendium.pf2e.conditionitems.Item.MIRkyAjyBeXivMa7]{Enfeebled 1}, or Stupefied 1'],
        ['On a success, the target', 'On a success, the target must attempt a Fortitude save or it']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    // A condition choice outside a Strike-result plan isn't executable.
    const {executableCasterChoice} = await import('../scripts/basic-save-core.js');
    const plan = compile(source);
    assert.equal(executableCasterChoice({...plan, resolution: {...plan.resolution, check: {...plan.resolution.check, statistic: 'fortitude'}}}), false);
});

test('Creative Splash: the 1d4 color table read as rows; each result\'s condition at its own value and lifetime, marked as the roll\'s choice', async () => {
    const {inspectSavePlan, targetOutcomeConditions} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/creative-splash'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual(plan.resolution.conditionRoll.results, {1: 'dazzled', 2: 'enfeebled', 3: 'frightened', 4: 'clumsy'});
    assert.deepEqual(plan.resolution.conditionRoll.chooseOn, []);
    const row = degree => plan.resolution.outcomes[degree].effects.map(effect => [effect.slug, effect.value ?? null, effect.duration ? `${effect.duration.value} ${effect.duration.unit}` : null, effect.choiceGroup]);
    assert.deepEqual(row('failure'), [['dazzled', null, '1 rounds', 'condition-roll'], ['enfeebled', 1, '1 rounds', 'condition-roll'], ['clumsy', 1, '1 rounds', 'condition-roll'], ['frightened', 1, null, 'condition-roll']]);
    assert.deepEqual(row('criticalFailure'), [['dazzled', null, '1 minutes', 'condition-roll'], ['enfeebled', 2, '1 rounds', 'condition-roll'], ['clumsy', 2, '1 rounds', 'condition-roll'], ['frightened', 2, null, 'condition-roll']]);
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
    const state = {outcomes: plan.resolution.outcomes, conditionRoll: {...plan.resolution.conditionRoll, rolled: 2, slug: 'enfeebled'}};
    assert.deepEqual(targetOutcomeConditions(state, {degree: 'criticalFailure'}).map(effect => `${effect.slug} ${effect.value}`), ['enfeebled 2']);
});

test('Creative Splash: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/creative-splash');
    for (const [from, to] of [
        // Two colors with the same condition, a lifetime-less condition PF2e doesn't end, a missing row number, a save the table doesn't match.
        ['{Clumsy 1} for 1 round</td><td>@UUID[Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm]{Clumsy 2} for 1 round', '{Enfeebled 1} for 1 round</td><td>@UUID[Compendium.pf2e.conditionitems.Item.MIRkyAjyBeXivMa7]{Enfeebled 2} for 1 round'],
        ['{Clumsy 1} for 1 round</td>', '{Clumsy 1}</td>'],
        ['<td>4</td>', '<td>5</td>'],
        ['must succeed at a Will save', 'must succeed at a Fortitude save']]) {
        const changed = compile(withText(source, text => text.replace(from, to)));
        assert.ok(changed.resolution.conditionRoll == null || !inspectSavePlan(changed).supported, to);
    }
});

test('Defended by Spirits: a guarded ally — the marker on the ally, the retaliation fixed on the enemy, a sustained cast', async () => {
    const plan = compile(await spell('rank-1/defended-by-spirits'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['retaliation', 'automatic', []]);
    const data = plan.resolution.retaliation;
    assert.deepEqual([data.triggers.length, data.triggers[0].fixedTarget, data.triggers[0].damage.formula, data.triggers[0].damage.type], [1, 'enemy', '1d6', 'spirit']);
    assert.deepEqual([data.sustained, data.durationSeconds, data.guard], [true, 60, {ally: 1, enemy: 1}]);
    assert.ok(data.heightening, 'the item\'s Heightened (+2) data');
});

test('Defended by Spirits: kept strict', async () => {
    const source = await spell('rank-1/defended-by-spirits');
    for (const [from, to] of [['1d6 spirit', '1d8 spirit'], ['attacks and damages the ally', 'attacks the ally'], ['has a general sense', 'is frightened, and has a general sense']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'retaliation', to);
    }
    const two = structuredClone(source); two.system.target.value = '2 allies and 1 enemy';
    assert.notEqual(compile(two).resolution.kind, 'retaliation');
});

test('Hippocampus Retreat: the melee spell attack, then the Swim carried by PF2e\'s Effect on the caster; the movement reminder and the data note', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/hippocampus-retreat'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.equal(plan.resolution.casterEffect.when, 'always');
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['caster-movement']);
    assert.equal(plan.resolution.casterEffect.endsAfterMovement, true);
});

test('Hippocampus Retreat: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/hippocampus-retreat');
    // A bonus the Effect doesn't give, another Speed than the movement's, or an added rule isn't read.
    for (const [from, to] of [['+10-foot circumstance bonus', '+20-foot circumstance bonus'], ['+2 circumstance bonus to your AC', '+3 circumstance bonus to your AC'],
        ['if you already have a swim Speed', 'if you already have a fly Speed'], ['return to normal.', 'return to normal. You are Quickened.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Silver\'s Refrain: PF2e\'s Effect on the allies in the emanation; the automatic counteract as a GM note', async () => {
    const plan = compile(await spell('cantrip/silvers-refrain'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'automatic', []]);
    const recipient = plan.nativeEffects.onUse[0]?.recipient ?? plan.nativeEffects.unscoped[0]?.recipient;
    assert.deepEqual([recipient.actor, recipient.includeSelf, recipient.area.value], ['area-allies', false, 60]);
    assert.match(plan.resolution.gmNotes.join(' '), /automatically attempts to counteract any Translocate cast by a devil within the area[^]*remains where it started\. The GM rolls the counteract check when it happens\./);
});

test('Silver\'s Refrain: kept strict', async () => {
    const source = await spell('cantrip/silvers-refrain');
    // A counteract the reminder doesn't read, or an ally rule it doesn't name, stays blocked.
    for (const [from, to] of [['cast by a devil within the area', 'cast by any creature'], ['are treated as silver', 'deal 1d6 extra damage']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).automation.level, 'automatic', to);
    }
});

test('Untamed Shift: the unarmed attacks proved by PF2e\'s Strike rules; the level-versus-rank data note and the 2-action GM note', async () => {
    const plan = compile(await spell('rank-1/untamed-shift'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'prompted', []]);
    // (User decision: the text.) The extra choices by the cast rank.
    assert.deepEqual(plan.resolution.rankGatedChoices.map(choice => [choice.index, choice.rank, JSON.stringify(choice.predicate).includes('parent:level')]), [[1, 6, false], [2, 10, false]]);
    assert.match(plan.resolution.gmNotes.join(' '), /You must cast untamed shift using 2 actions for this benefit\. PF2e's choice doesn't check the actions spent\./);
});

test('Untamed Shift: kept strict', async () => {
    const source = await spell('rank-1/untamed-shift');
    // Another die, damage type or trait than the Effect's Strike stays unproved (the damage sentence blocks).
    for (const [from, to] of [['deal 1d6 slashing damage', 'deal 1d8 slashing damage'], ['deal 1d8 piercing damage', 'deal 1d8 fire damage'], ['the agile and finesse traits', 'the agile and reach traits']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).automation.level, 'prompted', to);
    }
});

test('Shields of the Spirit: PF2e\'s Effect (Aura, AC bonus, Raise a Shield) as the retaliation marker; the attacker takes the item\'s damage', async () => {
    const plan = compile(await spell('rank-1/shields-of-the-spirit'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['retaliation', 'automatic', []]);
    const data = plan.resolution.retaliation;
    assert.deepEqual([data.triggers.length, data.triggers[0].damage.formula, data.triggers[0].damage.type, data.durationSeconds], [1, '1d4', 'spirit', 6]);
    assert.match(data.effect.uuid, /Shields of the Spirit/);
});

test('Shields of the Spirit: kept strict', async () => {
    const source = await spell('rank-1/shields-of-the-spirit');
    for (const [from, to] of [['+1 status bonus to AC', '+2 status bonus to AC'], ['1d4 spirit damage', '1d6 spirit damage'], ['(even if it misses)', '(if it hits)'],
        ['whichever comes first.', 'whichever comes first. The ally is also Quickened.']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'retaliation', to);
    }
});

test('Buffeting Winds: the basic save\'s damage; nonlethal as a GM reminder; the knockback only for undead that fail', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/buffeting-winds'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {failure, criticalFailure, success} = plan.resolution.outcomes;
    assert.deepEqual([failure.forcedMovement.distance, failure.forcedMovement.trait, criticalFailure.forcedMovement.distance], [5, 'undead', 10]);
    assert.equal(success.forcedMovement ?? null, null);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['nonlethal']);
});

test('Buffeting Winds: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/buffeting-winds');
    for (const [from, to] of [['2d4 bludgeoning damage, which', '2d6 bludgeoning damage, which'], ['Against undead, the winds', 'Against constructs, the winds'],
        ['knocked back 5 feet', 'knocked prone and back 5 feet'], ['without causing them lasting harm', 'dealing 1 extra damage']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Lament: the basic save\'s damage, plus the caster\'s answer (0 if none) added before the roll', async () => {
    const {inspectSavePlan, saveCollectionReadiness} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/lament'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.damageBonus.type, plan.resolution.damageBonus.choices.length], ['mental', 11]);
    const state = {status: 'collecting', damageBonus: {...plan.resolution.damageBonus, answer: null}, targets: []};
    assert.match(saveCollectionReadiness(state).reason, /counteract rank of the highest-level emotion effect/);
});

test('Lament: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/lament');
    // Another damage type than the entry's, or another measure than the counteract rank, isn't read.
    for (const [from, to] of [['additional mental damage', 'additional fire damage'], ['equal to the counteract rank of the highest-level effect', 'equal to your level']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Victory Cry: the text\'s sonic damage (no damage entry), heightened, on the struck creature; the Shove as GM notes; the data note', async () => {
    const plan = compile(await spell('rank-1/victory-cry'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['direct-damage', 'automatic', []]);
    const damage = plan.resolution.damage;
    assert.deepEqual([damage.formula, damage.struck, damage.count], ['(1+floor((@item.rank - 1)/2)*1)d6[sonic]', true, 1]);
    assert.match(damage.notes.join(' '), /Target the creature the ally critically hit[^]*Shove the creature struck/);
    assert.match(damage.dataNote, /no damage entry/);
});

test('Victory Cry: kept strict', async () => {
    const source = await spell('rank-1/victory-cry');
    for (const [from, to] of [['(not doubled due to the critical hit)', '(doubled on the critical hit)'], ['critically succeeds at a melee Strike', 'succeeds at a melee Strike'],
        ['The sonic damage increases by 1d6.', 'The sonic damage increases by 1d8.'], ['a +1 status bonus', 'a +2 status bonus']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'direct-damage', to);
    }
});

test('Personal Rain Cloud: the optional save to avoid it; a failure\'s note with fire resistance at the cast rank; the reminder', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validRowNoteRule, validNoteRule} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-1/personal-rain-cloud'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([success.noteEffects ?? [], failure.noteEffects.length, criticalFailure.noteEffects.length], [[], 1, 1]);
    assert.deepEqual(failure.noteEffects[0].rules, [{key: 'Resistance', type: 'fire', value: '2 + floor((@item.level - 1) / 1) * 2'}]);
    assert.match(failure.noteEffects[0].text, /Creatures with weakness to water take damage[^]*Heightened \(\+1\)/);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['willing-no-save']);
    // A row note carries the resistance; a spell note doesn't.
    assert.deepEqual([validRowNoteRule(failure.noteEffects[0].rules[0]), validNoteRule(failure.noteEffects[0].rules[0])], [true, false]);
});

test('Personal Rain Cloud: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/personal-rain-cloud');
    for (const [from, to] of [['The amount of fire resistance increases by 2.', 'The amount of cold resistance increases by 2.'],
        ['The target gains fire resistance 2.', 'The target gains fire resistance 2 and a +1 status bonus to AC.'],
        ['take damage equal to their weakness', 'take 1d6 damage']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Déjà Vu: “must attempt a Will save. If the target fails, …” as rows; the failure\'s note for the spell\'s 2 rounds, the conditional Stupefied in it', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/déjà-vu'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {success, failure} = plan.resolution.outcomes;
    assert.deepEqual([(success.noteEffects ?? []).length, failure.noteEffects[0].duration.value, failure.noteEffects[0].duration.unit], [0, 2, 'rounds']);
    assert.match(failure.noteEffects[0].text, /^You loop a thought process[^]*Whatever actions the target uses[^]*becomes Stupefied 1 until the end of its turn\.$/);
    assert.deepEqual(failure.effects, []);
});

test('Déjà Vu: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/déjà-vu');
    // A condition outside the triggered form, or damage, isn't read.
    for (const [from, to] of [['it can act as it chooses for that action but becomes', 'it becomes'], ['must repeat on its following turn', 'must repeat on its following turn and takes 1d6 mental damage']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Elysian Whimsy: the 1d4 behaviours as one note per result (the Speeds penalty as a rule); only the rolled note applies', async () => {
    const {inspectSavePlan, targetOutcomeNotes} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/elysian-whimsy'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.conditionRoll.kind, plan.resolution.conditionRoll.options], ['notes', ['result-1', 'result-2', 'result-3', 'result-4']]);
    const {failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([failure.noteEffects[0].rules[0].value, criticalFailure.noteEffects[0].rules[0].value], [-5, -10]);
    assert.deepEqual([failure.noteEffects[1].duration.anchor, failure.noteEffects[1].duration.expiry], ['target-turn', 'turn-end']);
    assert.match(criticalFailure.noteEffects[1].text, /On a critical failure: the target must use all its actions/);
    const state = {outcomes: plan.resolution.outcomes, conditionRoll: {...plan.resolution.conditionRoll, rolled: 3, slug: 'result-3'}};
    assert.deepEqual(targetOutcomeNotes(state, {degree: 'failure'}).map(note => note.choice), ['result-3']);
});

test('Elysian Whimsy: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/elysian-whimsy');
    for (const [from, to] of [['<td>4</td>', '<td>5</td>'], ['babble pleasingly if it knows no songs.', 'babble pleasingly and takes 1d4 sonic damage.'],
        ['(-10-foot status penalty on a critical failure)', '(-10-foot status penalty on a critical failure and it is prone)'], ['determine the spell\'s effect', 'determine the color']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Gift of the Anemos: a sustained aura that waits for its trigger; each triggering enemy saves (Off-Guard on a failure); the cast options as a note', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/gift-of-the-anemos'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.aura, stored.sustained, stored.endsOnTrigger, stored.durationSeconds], [true, true, false, 60]);
    assert.match(stored.notes[0], /you can either Step, Shove a creature in the aura/);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.duration?.expiry]), [['off-guard', 'turn-end']]);
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
});

test('Gift of the Anemos: kept strict', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/gift-of-the-anemos');
    for (const [from, to] of [['must succeed at a Reflex save', 'must succeed at a Will save'], ['or else you fall).', 'or else you fall). You gain a +1 status bonus to AC.']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
    const unsustained = structuredClone(source); unsustained.system.duration.sustained = false;
    assert.equal(isExecutableStoredTriggerPlan(compile(unsustained)), false);
});

test('Song of the Soul: the creature near the thrall healed (1d8) with PF2e\'s fast healing Effect; the thrall notes and the data note', async () => {
    const plan = compile(await spell('rank-1/song-of-the-soul'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'automatic', []]);
    assert.deepEqual([plan.resolution.healing.formula, plan.resolution.healing.recipient], ['1d8', 'target']);
    assert.deepEqual(plan.resolution.healing.notes.map(note => note.kind), ['thrall-recipient', 'thrall-recipient']);
    assert.deepEqual(plan.resolution.nearToken, {trait: 'thrall', feet: 15, ruleIndex: 0});
    assert.equal(plan.targeting.actorConstraints.supportsActorTargets, true);
});

test('Song of the Soul: kept strict', async () => {
    const source = await spell('rank-1/song-of-the-soul');
    for (const [from, to] of [['regains 1d8 Hit Points immediately', 'regains 1d6 Hit Points immediately'], ['Choose one living or undead creature', 'Choose one creature'],
        ['or the void trait if you choose an undead creature.', 'or the void trait if you choose an undead creature, which is also Quickened.']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).automation.level, 'automatic', to);
    }
});

test('Agitate: the per-row durations as the note; the no-move damage as a triggered-damage control, heightened', async () => {
    const {inspectSavePlan, isTriggeredDamage} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/agitate'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {success, failure, criticalFailure, criticalSuccess} = plan.resolution.outcomes;
    assert.deepEqual([success, failure, criticalFailure].map(outcome => outcome.noteEffects[0].duration.value), [1, 2, 4]);
    assert.deepEqual((criticalSuccess.noteEffects ?? []).length, 0);
    const trigger = failure.noteEffects[0].triggeredDamage;
    assert.equal(isTriggeredDamage(trigger), true);
    assert.deepEqual([trigger.trigger, trigger.dice, trigger.die, trigger.type, trigger.frequency, trigger.heightening], ['no-move', 2, 8, 'mental', 'round', {interval: 1, dice: 2}]);
    assert.deepEqual(Object.values(plan.resolution.outcomes).map(outcome => outcome.damage.mode), ['none', 'none', 'none', 'none']);
});

test('Agitate: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/agitate');
    for (const [from, to] of [['take 2d8 mental damage at the end', 'take 2d6 mental damage at the end'], ['Stride, Fly, or Swim at least once', 'Stride at least once'],
        ['The damage increases by 2d8.', 'The damage increases by 2d6.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Barbed Spear: the spell attack; a hit leaves Clumsy 1 (raised by 1 if already clumsy) for 1 minute or until an Interact; the removal reminder', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/barbed-spear'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['criticalSuccess', 'success']) {
        const [effect] = plan.resolution.outcomes[degree].effects;
        assert.deepEqual([effect.slug, effect.value, effect.increment, effect.endsWhen[0].action, effect.duration.value, effect.duration.unit], ['clumsy', 1, true, 'interact', 1, 'minutes']);
    }
    assert.deepEqual(plan.resolution.outcomes.failure.effects, []);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['lodged-removal']);
});

test('Barbed Spear: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/barbed-spear');
    for (const [from, to] of [['increasing its clumsy condition by 1', 'increasing its enfeebled condition by 1'], ['a successful Athletics check', 'a successful Acrobatics check'],
        ['whichever comes first.', 'whichever comes first. The target is also Dazzled.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Magic\'s Vessel: PF2e\'s Effect on the target; the slot trigger\'s resistance Effect proved and granted from an Ongoing control', async () => {
    const plan = compile(await spell('rank-1/magics-vessel'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'automatic', []]);
    assert.deepEqual([plan.nativeEffects.onUse.length, plan.nativeEffects.onUse[0].recipient.actor], [1, 'target']);
    const triggered = plan.resolution.triggeredEffect;
    assert.deepEqual([triggered.trigger, triggered.recipient, triggered.sustains], ['cast-from-slot', 'target', true]);
    assert.match(triggered.label, /Magic's Vessel \(Resistance\)/);
});

test('Magic\'s Vessel: kept strict', async () => {
    const source = await spell('rank-1/magics-vessel');
    // Another trigger or benefit isn't set aside; the second Effect then blocks the route.
    for (const [from, to] of [['from your spell slots', 'from a scroll'], ['resistance to damage from spells equal to the spell\'s rank', 'resistance to fire equal to the spell\'s rank']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).automation.level, 'automatic', to);
    }
});

test('Trade Death for Life: the basic save once; the fast healing Effect granted to a willing creature after a damaging save', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('cantrip/trade-death-for-life'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.beneficiaryEffect.when, plan.resolution.beneficiaryEffect.recipient], ['damaged', 'willing-creature']);
    assert.match(plan.resolution.beneficiaryEffect.label, /Trade Death for Life/);
    assert.equal(plan.resolution.check.basic, true);
});

test('Trade Death for Life: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('cantrip/trade-death-for-life');
    for (const [from, to] of [['gains fast healing 1', 'gains fast healing 2'], ['a willing creature', 'any creature'], ['The target takes damage only once from this spell', 'The target takes damage each round from this spell']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Draconic Barrage: PF2e\'s Effect as the stored trigger\'s marker; the bombard\'s basic save in the Effect\'s chosen type; the spell ends', async () => {
    const {isExecutableStoredTriggerPlan, inspectSavePlan, storedTriggerExposurePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/draconic-barrage'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.endsOnTrigger, stored.effectMarker.flag, stored.effectTypes], [true, 'draconicBarrage', ['fire', 'force', 'mental', 'spirit']]);
    assert.deepEqual(plan.resolution.casterChoice.values, ['fire', 'force', 'mental', 'spirit']);
    assert.equal(inspectSavePlan(storedTriggerExposurePlan(plan)).supported, true);
});

test('Draconic Barrage: kept strict', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/draconic-barrage');
    for (const [from, to] of [['Choose fire, force, mental, or spirit damage', 'Choose fire, cold, mental, or spirit damage'], ['deal 1 additional damage', 'deal 2 additional damage'],
        ['takes 2d4 damage of the chosen type', 'takes 2d6 damage of the chosen type'], ['and the spell ends.', 'and the spell ends. The creature is also Dazzled.']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Crushing Ground: the degree Effect proved with row damage (Speed, Escape); the no-escape damage as a control; the Escape data note', async () => {
    const {inspectSavePlan, isTriggeredDamage} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/crushing-ground'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([failure.nativeEffects[0].outcomeRule.kind, criticalFailure.nativeEffects[0].outcomeRule.escape != null], ['degree-choice', true]);
    const note = criticalFailure.noteEffects.find(entry => entry.triggeredDamage);
    assert.equal(isTriggeredDamage(note.triggeredDamage), true);
    assert.deepEqual([note.triggeredDamage.trigger, note.triggeredDamage.dice, note.triggeredDamage.die, note.triggeredDamage.heightening], ['no-escape', 2, 6, {interval: 1, dice: 2}]);
    assert.equal(plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.escapeEndsOnly, 'immobilized');
});

test('Crushing Ground: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/crushing-ground');
    for (const [from, to] of [['–10-foot circumstance penalty to Speed', '–15-foot circumstance penalty to Speed'], ['an additional 2d6 bludgeoning damage when', 'an additional 2d8 bludgeoning damage when'],
        ['Increase the initial damage and additional damage by 2d6.', 'Increase the initial damage by 2d6.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
});

test('Glass Shield: PF2e\'s shield Effect (raised, AC, Hardness at each rank) as the stored trigger\'s marker; the explosion\'s basic save; the spell ends', async () => {
    const {isExecutableStoredTriggerPlan, inspectSavePlan, storedTriggerExposurePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('cantrip/glass-shield'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.endsOnTrigger, stored.markerDuration.expiry, stored.shield.hardnessByRank], [true, 'turn-start', {1: 2, 3: 4, 5: 7, 7: 10, 9: 12}]);
    assert.match(stored.notes.join(' '), /within 5 feet[^]*can't cast it again for 10 minutes/);
    assert.equal(inspectSavePlan(storedTriggerExposurePlan(plan)).supported, true);
});

test('Glass Shield: kept strict', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('cantrip/glass-shield');
    for (const [from, to] of [['It has Hardness 2.', 'It has Hardness 3.'], ['The shield has Hardness 7,', 'The shield has Hardness 8,'], ['a +1 circumstance bonus to AC', 'a +2 circumstance bonus to AC'],
        ['for 10 minutes.', 'for 10 minutes. You are also Quickened.']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Rainbow\'s End: the Dazzled rider (heightened duration); the ally teleport as the caster\'s sustained note', async () => {
    const {inspectSavePlan, isSustainedCasterNote} = await import('../scripts/basic-save-core.js');
    const {spellNoteText} = await import('../src/compiler/spell-note.js');
    const plan = compile(await spell('rank-1/rainbows-end'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {failure, criticalFailure, success} = plan.resolution.outcomes;
    for (const outcome of [failure, criticalFailure]) {
        assert.deepEqual(outcome.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit, effect.duration.heightening]), [['dazzled', 1, 'rounds', {increase: 1, interval: 2, rank: 1}]]);
    }
    assert.deepEqual(success.effects, []);
    const note = plan.resolution.casterNote;
    assert.equal(isSustainedCasterNote(note, plan), true);
    assert.deepEqual([note.recipient, note.duration.value, note.duration.unit, note.duration.sustained], ['source', 1, 'minutes', true]);
    assert.match(note.text, /instantly teleported[^]*teleportation trait/);
    assert.equal(spellNoteText(note, 1, 1), note.text);
    assert.match(spellNoteText(note, 3, 1), /Heightened \(\+2\) ×1: [^]*increases by 10 feet/);
});

test('Rainbow\'s End: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/rainbows-end');
    for (const [from, to] of [['as long as they don\'t travel more than 60 feet', 'and gain a +1 status bonus to AC'],
        ['an ally who\'s adjacent to you can Interact', 'an ally who\'s adjacent to you takes 1d4 fire damage and can Interact'],
        ['This effect has the teleportation trait.', 'This effect has the teleportation trait. Enemies in the area are Blinded.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    // Not sustained: the note has no Sustain to follow.
    const fixed = structuredClone(source); fixed.system.duration = {sustained: false, value: '1 minute'};
    assert.equal(inspectSavePlan(compile(fixed)).supported, false);
    // A tampered note is refused.
    const plan = compile(source); plan.resolution.casterNote.text += ' You are Quickened.';
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('Soul Siphon: temporary HP equal to the HP the target loses, Drained included, until used', async () => {
    const {inspectSavePlan, isCasterDamageBenefit} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/soul-siphon'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const benefit = plan.resolution.casterBenefit;
    assert.deepEqual([benefit.kind, benefit.aggregate, benefit.measure, benefit.fraction, benefit.duration], ['temp-hp', 'single-target', 'hp-lost', 1, null]);
    assert.equal(isCasterDamageBenefit(benefit, plan), true);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].effects.map(effect => [effect.slug, effect.value])), [[['drained', 1]], [['drained', 2]]]);
});

test('Soul Siphon: kept strict', async () => {
    const {inspectSavePlan, isCasterDamageBenefit} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/soul-siphon');
    for (const [from, to] of [['including the HP lost from becoming', 'excluding the HP lost from becoming'], ['the target loses', 'the target takes'],
        ['bolster your own vitality.', 'bolster your own vitality. The temporary Hit Points last for 1 minute. You lose any remaining temporary Hit Points after 2 minutes.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    // Without Drained in the rows, the measure has nothing to include.
    const plan = compile(source);
    for (const degree of ['failure', 'criticalFailure']) plan.resolution.outcomes[degree].effects = [];
    assert.equal(isCasterDamageBenefit(plan.resolution.casterBenefit, plan), false);
    // A duration of none is only for this measure.
    const forged = compile(source); delete forged.resolution.casterBenefit.measure;
    assert.equal(isCasterDamageBenefit(forged.resolution.casterBenefit, forged), false);
});

test('Savor the Sting: initial and persistent rows; PF2e\'s marking Effect on the caster for each target taking the persistent damage', async () => {
    const {inspectSavePlan, isCasterMark} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/savor-the-sting'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {criticalSuccess, success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([criticalSuccess.damage.mode, success.damage.mode, success.damage.multiplier], ['none', 'shared', 0.5]);
    assert.deepEqual([failure.damage.shared.multiplier, failure.damage.formulas[0].formula], [1, '(@item.level)d4[persistent,mental]']);
    assert.deepEqual([criticalFailure.damage.shared.multiplier, criticalFailure.damage.formulas[0].formula], [2, '(2*((@item.level)d4))[persistent,mental]']);
    const mark = plan.resolution.casterMark;
    assert.equal(isCasterMark(mark, plan), true);
    assert.deepEqual([mark.slug, mark.damageType, mark.degrees], ['savor-the-sting', 'mental', ['failure', 'criticalFailure']]);
    assert.equal(Object.values(plan.resolution.outcomes).flatMap(outcome => outcome.nativeEffects ?? []).length, 0);
    // (User decision: the text.) The mark ends with the target's persistent mental damage.
    assert.equal(mark.endsWithTargetPersistent, 'mental');
});

test('Savor the Sting: kept strict', async () => {
    const {inspectSavePlan, isCasterMark} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/savor-the-sting');
    for (const [from, to] of [['a +1 status bonus', 'a +2 status bonus'], ['attack rolls and skill checks against', 'attack rolls against'],
        ['revel in their anguish.', 'revel in their anguish and suffer a curse.'], ['takes half damage and no persistent damage', 'takes half damage and persistent damage'],
        ['persistent damage increases by 1d4', 'persistent damage increases by 2d4']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    // A tampered mark is refused: another slug, a success row, or a claim the plan didn't compile.
    for (const tamper of [mark => { mark.slug = 'other'; }, mark => { mark.degrees = ['success', 'failure', 'criticalFailure']; }, mark => { mark.claimText += ' '; }]) {
        const plan = compile(source); tamper(plan.resolution.casterMark);
        assert.equal(isCasterMark(plan.resolution.casterMark, plan), false);
    }
});

test('Phantom Pain: full initial damage by row, persistent damage on the failing rows ending with their Sickened', async () => {
    const {inspectSavePlan, isConditionEndedPersistent} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/phantom-pain'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {criticalSuccess, success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([criticalSuccess.damage.mode, success.damage.mode, success.damage.multiplier], ['none', 'shared', 1]);
    for (const [outcome, value, degree] of [[failure, 1, 'failure'], [criticalFailure, 2, 'criticalFailure']]) {
        assert.deepEqual([outcome.damage.shared.multiplier, outcome.damage.formulas[0].formula], [1, '(@item.level)d4[persistent,mental]']);
        assert.deepEqual(outcome.effects.map(effect => [effect.slug, effect.value]), [['sickened', value]]);
        assert.equal(isConditionEndedPersistent(outcome.persistentEndsWith, outcome, degree), true);
        assert.equal(outcome.persistentEndsWith.condition, 'sickened');
    }
});

test('Phantom Pain: kept strict', async () => {
    const {inspectSavePlan, isConditionEndedPersistent} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/phantom-pain');
    for (const [from, to] of [['recovers from being Sickened', 'recovers from being Frightened'], ['and the persistent damage by 1d4', 'and the persistent damage by 2d4'],
        ['Illusory pain wracks the target', 'Illusory pain curses the target'], ['full initial damage but no persistent damage', 'full initial and persistent damage']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    // The link needs the row's condition and its persistent damage.
    const plan = compile(source); const {failure} = plan.resolution.outcomes;
    assert.equal(isConditionEndedPersistent(failure.persistentEndsWith, {...failure, effects: []}, 'failure'), false);
    assert.equal(isConditionEndedPersistent(failure.persistentEndsWith, failure, 'success'), false);
});

test('Signal Skyrocket: the explosion\'s save only when the GM says the stated situation holds; the placement rule as a card note', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/signal-skyrocket'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.match(plan.resolution.castGate.question, /^Does this hold: the rocket explodes in an enclosed space smaller than the full size of the burst\? If not, no creature is affected\.$/);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['placement']);
    assert.match(plan.resolution.reminders[0].text, /can't change the direction or distance of the rocket/);
    const {failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual([failure.effects.map(effect => effect.slug), criticalFailure.effects.map(effect => effect.slug)], [['dazzled'], ['blinded']]);
});

test('Signal Skyrocket: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/signal-skyrocket');
    for (const [from, to] of [['takes 1d10 sonic damage depending', 'takes 2d10 sonic damage depending'],
        ['You can\'t change the direction or distance of the rocket', 'You can\'t change the direction or distance of the rocket, and creatures take 1 damage']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    // A tampered gate or placement note is refused.
    const plan = compile(source); plan.resolution.castGate.sourceText += ' ';
    assert.equal(inspectSavePlan(plan).supported, false);
    const other = compile(source); delete other.resolution.castGate;
    assert.equal(inspectSavePlan(other).supported, false);
});

test('Zenith Star: the tracking note (with its continuation and the caster\'s limit) for the spell\'s days, heightened by 1 day a rank; 4th rank gated', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {noteAtRank} = await import('../scripts/basic-save-runtime.js').catch(() => ({}));
    const plan = compile(await spell('rank-1/zenith-star'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['failure', 'criticalFailure']) {
        const [note] = plan.resolution.outcomes[degree].noteEffects;
        assert.match(note.text, /sense the approximate direction[^]*not pinpoint[^]*oldest zenith star is automatically Dismissed/);
        assert.deepEqual([note.duration.value, note.duration.unit], [1, 'days']);
        assert.deepEqual(plan.resolution.outcomes[degree].manualInstructions, []);
    }
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['dazzled', 'blinded']);
    assert.deepEqual(plan.lifecycle.heightenedDurations.slice(0, 2).map(entry => [entry.minRank, entry.value, entry.unit]), [[2, 2, 'days'], [3, 3, 'days']]);
    // 4th rank: the marked rows' note adds ignoring Concealed (batch rank-2-16).
    assert.equal(plan.resolution.rankGate, undefined);
    assert.match(plan.resolution.heightenedVariants[0].outcomes.failure.noteEffects[0].text, /You ignore the Concealed condition against targets marked by zenith star\.$/);
    if (noteAtRank) assert.equal(noteAtRank(plan.resolution.outcomes.failure.noteEffects[0], plan.lifecycle, 3).duration.value, 3);
});

test('Zenith Star: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {parseHeightenedDurations} = await import('../src/compiler/heightened-duration-compiler.js');
    const source = await spell('rank-1/zenith-star');
    for (const [from, to] of [['but not pinpoint their exact square', 'and it takes 1d6 damage'], ['your oldest zenith star is automatically Dismissed', 'the target is Frightened 1'],
        ['This is enough to track the creature', 'The target is Slowed 1. This is enough to track the creature']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    // An interval increase needs the base rank and a fixed duration in that unit.
    const html = '<p>x</p><hr /><p><strong>Heightened (+1)</strong> The duration increases by 1 day.</p>';
    assert.equal(parseHeightenedDurations(html).entries.length, 0);
    assert.equal(parseHeightenedDurations(html, {baseRank: 1, baseDuration: {mode: 'fixed', value: 1, unit: 'hours'}}).entries.length, 0);
    assert.equal(parseHeightenedDurations(html, {baseRank: 9, baseDuration: {mode: 'fixed', value: 1, unit: 'days'}}).entries.length, 1);
});

test('Swampcall: a terrain-only lingering area; PF2e\'s Speed-and-Off-Guard Effect by row, removed when the creature leaves the area', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const {inspectCompiledNativeOutcomeEffect} = await import('../scripts/native-outcome-effects.js');
    const plan = compile(await spell('rank-1/swampcall'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(plan.automation.pendingCapabilities));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.terrain.difficulty, lingering.centre], [[], true, 2, 'placed']);
    for (const [degree, value] of [['failure', -10], ['criticalFailure', -15]]) {
        const [effect] = plan.resolution.outcomes[degree].nativeEffects;
        assert.deepEqual([effect.outcomeRule.kind, effect.outcomeRule.selectionValue, effect.outcomeRule.leaveArea, effect.outcomeRule.selectors],
            ['degree-speed-condition', value, true, ['burrow-speed', 'climb-speed', 'fly-speed', 'land-speed']]);
        assert.equal(inspectCompiledNativeOutcomeEffect(effect, {degree}).supported, true);
        assert.ok(plan.resolution.outcomes[degree].effects.every(condition => condition.carriedBy === effect.uuid));
    }
    // (User decision: until the end of the creature's next turn, by the module.)
    const swamp = Object.values(plan.resolution.outcomes).flatMap(outcome => outcome.nativeEffects ?? [])[0].outcomeRule;
    assert.deepEqual([swamp.endsAfterTargetTurn, swamp.durationOverride], [true, {value: 2, unit: 'rounds', expiry: 'turn-end'}]);
});

test('Swampcall: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const {speedConditionShape, proveSpeedConditionRows} = await import('../src/compiler/native-outcome-effect-compiler.js');
    const source = await spell('rank-1/swampcall');
    for (const [from, to] of [['–10-foot circumstance penalty', '–5-foot circumstance penalty'], [' (except for its swim Speed, if any)', ''],
        ['is -15 feet.', 'is -20 feet.'], ['The area becomes difficult terrain. ', ''], ['sinks partially into the mud.', 'sinks partially into the mud and takes 1 damage.']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
    // The shape needs exactly the choice, the Speed modifier reading it and one granted condition.
    const rules = [{key: 'ChoiceSet', flag: 'x', prompt: 'p', choices: [{label: 'PF2E.Check.Result.Degree.Check.failure', value: -10}]},
        {key: 'FlatModifier', selector: ['land-speed'], type: 'circumstance', value: '@item.flags.system.rulesSelections.x'},
        {key: 'GrantItem', uuid: 'Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg'}];
    assert.ok(speedConditionShape(rules));
    assert.equal(speedConditionShape([...rules, {key: 'FlatModifier', selector: 'ac', type: 'status', value: -1}]), null);
    assert.equal(proveSpeedConditionRows(speedConditionShape(rules), {failure: 'The creature takes a –10-foot circumstance penalty to its Speeds and becomes @UUID[Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg]{Off-Guard}.'}), null);
});

test('Putrefy Food and Drink: a note (food or water is a thing, not a creature); the heightened counteract checks are rolled from the card', async () => {
    const plan = compile(await spell('rank-1/putrefy-food-and-drink'));
    assert.deepEqual([plan.resolution.kind, plan.automation.pendingCapabilities], ['spell-note', []]);
    // (Batch rank-2-16: a Counteract button from 2nd rank, instead of a rank gate.)
    assert.equal(plan.resolution.note.rankGate, undefined);
    assert.deepEqual(plan.resolution.note.heightenedCounteract.map(entry => [entry.rank, entry.target]), [[2, 'an alchemical elixir'], [3, 'a potion or alchemical elixir']]);
    assert.equal(plan.targeting.actorConstraints.supportsActorTargets, false);
});

test('Putrefy Food and Drink: kept strict', async () => {
    const source = await spell('rank-1/putrefy-food-and-drink');
    // A counteract check in the base text, or in an interval entry, isn't a note.
    for (const edit of [text => text.replace('One cubic foot of liquid', 'You attempt a counteract check against any magic in it. One cubic foot of liquid'),
        text => text.replace('Heightened (2nd)', 'Heightened (+1)')]) {
        assert.notEqual(compile(withText(source, edit)).resolution.kind, 'spell-note');
    }
    // A target naming creatures isn't a thing.
    const creatures = structuredClone(source); creatures.system.target.value = '1 creature or 1 cubic foot of food';
    assert.notDeepEqual(compile(creatures).automation.pendingCapabilities.filter(capability => capability === 'target-eligibility'), []);
});

test('Scrounger\'s Glee: Frightened 1/2 on a failed save, floored at 1 while the spell lasts (hearing: the GM\'s); Dismissing as a reaction heals the ally', async () => {
    const {inspectSavePlan, isConditionFloor} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('cantrip/scroungers-glee'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const [degree, value] of [['failure', 1], ['criticalFailure', 2]]) {
        const outcome = plan.resolution.outcomes[degree];
        assert.deepEqual(outcome.effects.map(effect => [effect.slug, effect.value]), [['frightened', value]]);
        assert.deepEqual([outcome.conditionFloor.slug, outcome.conditionFloor.value, outcome.conditionFloor.lifetime, outcome.conditionFloor.whileText], ['frightened', 1, 'spell', 'the target can hear you']);
        assert.equal(isConditionFloor(outcome.conditionFloor), true);
    }
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
    assert.deepEqual(plan.lifecycle.dismissal.payoff, {kind: 'healing', formula: '(ceil(@item.level/2))d4', recipient: 'ally', reaction: true,
        trigger: 'an ally critically succeeds at a Strike against the target'});
});

test('Scrounger\'s Glee: kept strict', async () => {
    const {inspectSavePlan, isConditionFloor} = await import('../scripts/basic-save-core.js');
    const source = await spell('cantrip/scroungers-glee');
    for (const [from, to] of [['while the spell is active and the target can hear you', 'while the spell is active and the target can see you'],
        ['increases by 1d4.', 'increases by 1d6.'], ['Hit Points to that ally.', 'Hit Points to that ally. The target is also Slowed 1.'],
        ['restoring @Damage', 'dealing @Damage']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    const plan = compile(source);
    assert.equal(isConditionFloor({...plan.resolution.outcomes.failure.conditionFloor, whileText: 'the target is prone'}), false);
    plan.lifecycle.dismissal.payoff.formula = '10d10';
    plan.compilerEvidence.dismissalPayoff = 'forged';
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('Vengeful Glare: the text\'s 1d4 of the chosen cold or fire (basic Fortitude), and the rank\'s persistent damage when the caster says it already dealt damage', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/vengeful-glare'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.deepEqual([plan.resolution.sharedDamage.formula, plan.resolution.casterChoice.values], ['(1+floor((@item.rank - 1)/1)*1)d4[untyped]', ['cold', 'fire']]);
    assert.deepEqual([plan.resolution.persistentRider.formula, /already dealt damage to the creature earlier this turn/.test(plan.resolution.persistentRider.question)], ['(@item.rank)', true]);
});

test('Vengeful Glare: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/vengeful-glare');
    for (const [from, to] of [['it also takes 1 persistent damage', 'it also takes 2 persistent damage'], ['persistent damage by 1.', 'persistent damage by 2.'],
        ['[fire,persistent]', '[acid,persistent]'], ['gains the appropriate trait.', 'gains the appropriate trait and is Dazzled.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    const plan = compile(source); plan.resolution.persistentRider.formula = '(@item.rank)d6';
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('Weaken Earth: a save that negates on success; PF2e\'s weakness Effect on a failure; Hardness the GM\'s; a stone or earth creature the GM confirms', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/weaken-earth'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    for (const degree of ['failure', 'criticalFailure']) assert.equal(plan.resolution.outcomes[degree].nativeEffects[0].outcomeRule.kind, 'stated-effect');
    assert.deepEqual(['criticalSuccess', 'success'].map(degree => plan.resolution.outcomes[degree].nativeEffects.length), [0, 0]);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['hardness']);
    assert.match(plan.resolution.reminders[0].text, /Hardness decreases by 5 \(5 more per \+2 ranks\)/);
    assert.match(plan.targeting.actorConstraints.predicates[0].question, /made of stone or earth/);
});

test('Weaken Earth: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {proveStatedEffect} = await import('../src/compiler/degree-choice-effect.js');
    const source = await spell('rank-1/weaken-earth');
    for (const [from, to] of [['weakness 3 to physical', 'weakness 4 to physical'], ['weakness 3 to physical', 'weakness 3 to fire'],
        ['negating the effect on a success', 'halving the effect on a success'], ['You weaken the bonds', 'You deal 1d4 damage and weaken the bonds']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    const rules = [{key: 'Weakness', type: 'physical', value: 'ceil(@item.level/2)*3'}];
    assert.equal(proveStatedEffect(rules, 'The target gains weakness 3 to physical damage.', {rank: 1}), true);
    assert.equal(proveStatedEffect(rules, 'The target gains weakness 3 to physical damage.'), false);
    assert.equal(proveStatedEffect([...rules, {key: 'FlatModifier', selector: 'ac', value: -1}], 'The target gains weakness 3 to physical damage.', {rank: 1}), false);
});

test('Bane and Malediction: an emanation growing on an optional Sustain; enemies inside save when cast and, on each Sustain, those not yet affected; PF2e\'s penalty Effect while in the area', async () => {
    const {isExecutableLingeringPlan, inspectSavePlan, lingeringExposurePlan} = await import('../scripts/basic-save-core.js');
    const {inspectCompiledNativeOutcomeEffect} = await import('../scripts/native-outcome-effects.js');
    for (const [path, target] of [['rank-1/bane', 'bless'], ['rank-1/malediction', 'benediction']]) {
        const plan = compile(await spell(path));
        assert.equal(isExecutableLingeringPlan(plan), true, `${path}: ${JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers)}`);
        const lingering = plan.resolution.lingering;
        assert.deepEqual([lingering.events, lingering.initial, lingering.enemiesOnly, lingering.centre, lingering.optionalSustain, lingering.growth, lingering.unaffectedOnly, lingering.sustained],
            [['sustain'], true, true, 'caster', true, {feet: 10}, true, false]);
        for (const degree of ['failure', 'criticalFailure']) {
            const [effect] = plan.resolution.outcomes[degree].nativeEffects;
            assert.deepEqual([effect.outcomeRule.kind, effect.outcomeRule.leaveArea], ['area-penalty-effect', true]);
            assert.equal(inspectCompiledNativeOutcomeEffect(effect, {degree}).supported, true);
        }
        assert.deepEqual(plan.resolution.reminders.map(reminder => [reminder.kind, reminder.target]), [['counteract-spell', target]]);
    }
});

test('Bane and Malediction: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const {proveAreaPenalty} = await import('../src/compiler/native-outcome-effect-compiler.js');
    const source = await spell('rank-1/bane');
    for (const [from, to] of [['–1 status penalty to attack rolls', '–2 status penalty to attack rolls'], ['radius by 10 feet', 'radius by 7 feet'],
        ['that weren\'t yet affected', 'that are frightened'], ['with doubt.', 'with doubt and 1d4 mental damage.']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
    assert.equal(proveAreaPenalty([{key: 'FlatModifier', selector: 'attack', type: 'status', value: -1}], "The creature takes a –1 status penalty to AC as long as it's in the area."), false);
    // A forged lingering growth without the optional Sustain is refused.
    const plan = compile(source); delete plan.resolution.lingering.optionalSustain;
    assert.equal(isExecutableLingeringPlan(plan), false);
});

test('Flourishing Flora: the text\'s 2d4 of the chosen plant\'s type (basic Reflex); each plant\'s critical-failure extra only for that plant', async () => {
    const {inspectSavePlan, executableCasterChoice, targetOutcomeConditions} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/flourishing-flora'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(executableCasterChoice(plan), true);
    assert.deepEqual([plan.resolution.casterChoice.kind, plan.resolution.casterChoice.values, plan.resolution.casterChoice.options],
        ['option', ['cacti', 'flowers', 'fruits', 'roots'], {cacti: {type: 'piercing'}, flowers: {type: 'poison'}, fruits: {type: 'bludgeoning'}, roots: {type: 'bludgeoning'}}]);
    assert.equal(plan.resolution.sharedDamage.formula, '(2+floor((@item.rank - 1)/1)*1)d4[untyped]');
    const critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual(critical.effects.map(effect => [effect.option, effect.slug, effect.value, effect.duration?.value ?? null]),
        [['flowers', 'dazzled', null, 2], ['fruits', 'clumsy', 1, 2], ['roots', 'prone', null, null]]);
    assert.deepEqual(critical.damage.formulas.map(entry => [entry.option, entry.formula]), [['cacti', '(@item.level)[bleed]']]);
    // Only the picked plant's condition applies.
    const state = {casterChoice: {kind: 'option', selected: 'fruits'}, outcomes: {criticalFailure: critical}};
    assert.deepEqual(targetOutcomeConditions(state, {degree: 'criticalFailure'}).map(effect => effect.slug), ['clumsy']);
});

test('Flourishing Flora: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/flourishing-flora');
    for (const [from, to] of [['Poison damage', 'Glitter damage'], ['for 2 rounds on a critical failure.</li>\n<li><strong>Fruits', 'for 2 rounds on a critical failure and 1d6 fire damage.</li>\n<li><strong>Fruits'],
        ['bleed damage from cacti increases by 1', 'bleed damage from cacti increases by 2'], ['Plants rapidly grow up from the ground.', 'Plants rapidly grow up, dealing 1d4 damage.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    const plan = compile(source); plan.resolution.outcomes.criticalFailure.effects[0].option = 'weeds';
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('Winter Bolt: the bolt\'s full damage on both hits; the explosion at the end of the target\'s next turn as a note with its control (doubled on a critical hit), removed by Interact', async () => {
    const {inspectSavePlan, isTriggeredDamage} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/winter-bolt'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {criticalSuccess, success, failure} = plan.resolution.outcomes;
    assert.deepEqual([criticalSuccess.damage.multiplier, success.damage.multiplier, failure.damage.mode], [1, 1, 'none']);
    for (const [outcome, multiplier, interacts] of [[criticalSuccess, 2, '2 Interact actions'], [success, 1, '1 Interact action']]) {
        const [note] = outcome.noteEffects;
        assert.equal(isTriggeredDamage(note.triggeredDamage), true);
        assert.deepEqual([note.triggeredDamage.trigger, note.triggeredDamage.multiplier, note.triggeredDamage.die, note.triggeredDamage.type, note.triggeredDamage.heightening],
            ['explosion', multiplier, 12, 'cold', {interval: 1, dice: 1}]);
        assert.deepEqual([note.duration.expiry, note.duration.anchor], ['turn-end', 'target-turn']);
        assert.match(note.text, new RegExp(interacts));
    }
});

test('Winter Bolt: kept strict', async () => {
    const {inspectSavePlan, isTriggeredDamage} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/winter-bolt');
    for (const [from, to] of [['the explosion damage increases by 1d12', 'the explosion damage increases by 2d12'], ['melt harmlessly without detonating.', 'melt harmlessly without detonating, dazzling the target.'],
        ['The bolt\'s explosion deals double damage.', 'The bolt\'s explosion deals triple damage.'], ['to the target and all adjacent creatures', 'to the target and all creatures within 10 feet']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    const trigger = compile(source).resolution.outcomes.success.noteEffects[0].triggeredDamage;
    assert.equal(isTriggeredDamage({...trigger, multiplier: 3}), false);
    assert.equal(isTriggeredDamage({...trigger, trigger: 'hostile-action'}), false);
});

test('Withering Grasp: 1d12 void plus 1d4 persistent void by the attack (double on a critical hit); constructs\' void immunity lifted for it; objects and Shield Block the GM\'s', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/withering-grasp'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const {criticalSuccess, success, failure} = plan.resolution.outcomes;
    assert.deepEqual([criticalSuccess.damage.multiplier, success.damage.multiplier, failure.damage.mode], [2, 1, 'none']);
    assert.deepEqual([plan.resolution.immunityBypass.type, plan.resolution.immunityBypass.trait], ['void', 'construct']);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind).sort(), ['object-hardness', 'shield-blocked']);
    assert.match(plan.resolution.reminders.find(reminder => reminder.kind === 'object-hardness').text, /4 on a critical hit, 2 on a hit \(1 more per rank\)/);
});

test('Withering Grasp: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/withering-grasp');
    for (const [from, to] of [['damages objects, constructs, and the like', 'damages objects, constructs, undead and the like'],
        ['the creature doesn\'t take damage (even', 'the creature takes double damage (even'], ['lower its Hardness by 4 for 1 minute.', 'lower its Hardness by 4 for 1 minute, and it shatters if it is glass.']]) {
        assert.equal(inspectSavePlan(compile(withText(source, text => text.replace(from, to)))).supported, false, to);
    }
    const plan = compile(source); plan.resolution.immunityBypass.type = 'fire';
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('Unfetter Eidolon: the eidolon\'s rule Effect (what the spell protects against is a mention, not a condition applied; automated since batch 167)', async () => {
    const plan = compile(await spell('rank-1/unfetter-eidolon'));
    assert.deepEqual([plan.resolution.kind, plan.automation.pendingCapabilities, plan.resolution.ruleSet.recipient], ['rule-set', [], 'eidolon']);
    assert.match(plan.resolution.ruleSet.notes.join(' '), /unlimited distance[^]*unmanifest/);
});

test('Unfetter Eidolon: kept strict', async () => {
    const source = await spell('rank-1/unfetter-eidolon');
    // Granting the condition isn't a mention.
    const granted = withText(source, text => text.replace('aiding them against being @UUID[Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe]{Immobilized}', 'making them @UUID[Compendium.pf2e.conditionitems.Item.eIcWbB5o3pP6OIMe]{Immobilized}'));
    assert.ok(!['spell-note', 'rule-set'].includes(compile(granted).resolution.kind));
});

test('Gust of Wind: a line area for Large or smaller creatures (when cast and on entering, until your next turn); prone; a flying creature\'s failure is a critical failure; the critical push and damage', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/gust-of-wind'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.endsAt, lingering.durationSeconds], [['enter'], true, 'caster-turn-start', 6]);
    const exposure = lingeringExposurePlan(plan);
    assert.deepEqual(exposure.targeting.actorConstraints.predicates, [{kind: 'size-at-most', size: 'lg'}]);
    assert.deepEqual([exposure.resolution.degreeAdjustment.predicate.kind, exposure.resolution.degreeAdjustment.map.failure], ['gm-confirmed', 'criticalFailure']);
    const {success, failure, criticalFailure} = exposure.resolution.outcomes;
    assert.deepEqual([success.noteEffects[0].label, failure.effects.map(effect => effect.slug), failure.damage.mode], ["Can't move against the wind", ['prone'], 'none']);
    assert.deepEqual([criticalFailure.damage.multiplier, criticalFailure.forcedMovement.distance, criticalFailure.effects.map(effect => effect.slug)], [1, 30, ['prone']]);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['surroundings']);
});

test('Gust of Wind: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/gust-of-wind');
    for (const [from, to] of [['pushed 30 feet in the wind', 'pushed 30 feet toward you in the wind'], ['takes 2d6 bludgeoning damage', 'takes 3d6 bludgeoning damage'],
        ['Large or smaller creatures that later', 'Medium or smaller creatures that later'], ['If it was flying, it takes the effects of critical failure instead.', 'If it was flying, it is Stunned 1.'],
        ['and pushes larger objects.', 'and pushes larger objects and creatures.']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Hallowed Ground: undead in the burst save when cast (vitality and spirit); PF2e\'s weakness Effect on undead while inside; raising undead a counteract reminder; recasting ends the previous one', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/hallowed-ground'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.recastEnds, lingering.memberEffect.trait, lingering.memberEffect.weakness], [[], true, true, 'undead', {value: 1, type: 'vitality'}]);
    assert.equal(lingering.memberEffect.label, 'Spell Effect: Hallowed Ground');
    const exposure = lingeringExposurePlan(plan);
    assert.deepEqual(exposure.targeting.actorConstraints.predicates, [{kind: 'trait', slug: 'undead', present: true}]);
    assert.deepEqual(exposure.resolution.sharedDamage.components.map(component => component.type), ['vitality', 'spirit']);
    assert.deepEqual(plan.resolution.reminders.map(reminder => [reminder.kind, reminder.target]), [['counteract-spell', 'raise undead']]);
    assert.match(plan.resolution.dataNotes.join(' '), /necromancy spells/);
});

test('Hallowed Ground: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/hallowed-ground');
    for (const [from, to] of [['weakness 1 to vitality damage', 'weakness 2 to vitality damage'], ['weakness 1 to vitality damage', 'weakness 1 to fire damage'],
        ['takes 1d6 vitality damage and 1d4 spirit damage', 'takes 1d6 vitality damage'], ['After that, undead creatures', 'After that, fiend creatures']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
    const plan = compile(source); plan.resolution.lingering.memberEffect.sourceText = 'forged';
    assert.equal(isExecutableLingeringPlan(plan), false);
});

test('Earth\'s Bile: a sustained area chosen anew each Sustain; fire and bludgeoning by the basic save; persistent fire only on a failure (doubled on a critical failure)', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/earths-bile'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.sustained, lingering.moveOnSustain], [['sustain'], true, true, true]);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true);
    const {success, failure, criticalFailure} = exposure.resolution.outcomes;
    assert.deepEqual([success.damage.mode, failure.damage.formulas[0].formula, criticalFailure.damage.formulas[0].formula],
        ['shared', '(ceil(@item.rank/2))[persistent,fire]', '(2*(ceil(@item.rank/2)))[persistent,fire]']);
});

test('Earth\'s Bile: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/earths-bile');
    for (const [from, to] of [['negated on a successful save', 'halved on a successful save'], ['the persistent fire damage increases by 1', 'the persistent fire damage increases by 2'],
        ['1d4 fire damage, 1d4 bludgeoning damage, and', '1d4 fire damage, and'], ['choose an area within range.', 'choose an area within range. Creatures in it are Dazzled.']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Garden of Healing: a healing pulse at cast and on the first Sustain each round, then PF2e\'s emotion-save Effect on those healed', async () => {
    const {SUPPORTED_RESOLUTION_KINDS} = await import('../scripts/runtime-core.js');
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('healing-pulse'));
    const plan = compile(await spell('rank-1/garden-of-healing'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['healing-pulse', 'automatic', []]);
    const pulse = plan.resolution.healingPulse;
    assert.deepEqual([pulse.formula, pulse.heightening, pulse.area, pulse.durationSeconds], ['1d4', {interval: 1, dice: '1d4'}, {type: 'emanation', value: 10}, 60]);
    assert.deepEqual(pulse.afterEffect.claim, {value: 1, type: 'circumstance', trait: 'emotion', minutes: 10});
    assert.match(pulse.afterEffect.uuid, /Garden of Healing/);
    assert.deepEqual(plan.nativeEffects?.onUse ?? [], []);
});

test('Garden of Healing: kept strict', async () => {
    const source = await spell('rank-1/garden-of-healing');
    for (const [from, to] of [['for 1d4 Hit Points', 'for 1d6 Hit Points'], ['+1 circumstance bonus', '+2 circumstance bonus'], ['against emotion effects', 'against fear effects'],
        ['for 10 minutes but', 'for 1 minute but'], ['increases by 1d4 Hit Points', 'increases by 2d4 Hit Points'], ['blooming blossoms.', 'blooming blossoms. Enemies inside are Dazzled.'],
        ['while the bonus persists.', 'while the bonus persists. Each creature healed is also Quickened.']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'healing-pulse', to);
    }
    const noSustain = structuredClone(source); noSustain.system.duration.sustained = false;
    assert.notEqual(compile(noSustain).resolution.kind, 'healing-pulse');
});

test('Scouring Sand: saves when cast and at turn end in the burst; Dazzled until Interact, Blinded until its next action; terrain and counteract reminders', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan, isActionEndLifetime} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/scouring-sand'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.sustained], [['turn-end'], true, true]);
    assert.match(lingering.notes.join(' '), /^At rank 3 or higher: once per round when you Sustain, you can move the center of the burst/);
    assert.deepEqual(plan.resolution.reminders.map(r => [r.kind, r.target ?? null]), [['surroundings', null], ['counteract-spell', 'entangling flora']]);
    assert.match(plan.resolution.reminders[1].text, /temporarily immune to scouring sand's counteract for 24 hours/);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true);
    const blinded = exposure.resolution.outcomes.criticalFailure.effects.find(e => e.slug === 'blinded');
    assert.deepEqual([blinded.endsWhen, blinded.expirationMode, isActionEndLifetime(blinded)], [[{event: 'action', action: 'next'}], 'event', true]);
    assert.equal(isActionEndLifetime({...blinded, expirationMode: 'first', duration: {mode: 'fixed', value: 1, unit: 'rounds'}}), false);
});

test('Scouring Sand: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/scouring-sand');
    for (const [from, to] of [['for 24 hours', 'for 1 hour. It also takes 1d6 damage'], ['plant-based terrain in its area', 'stone terrain in its area'],
        ['removes only the portion of its area', 'removes all of its area and the portion'], ['move the center of the burst', 'move the center of the burst and deal 2d6 damage'],
        ['the area is a 20-foot burst', 'the area is a 30-foot burst'], ['cleared with a single Interact action.', 'cleared with a single Interact action. Creatures in it are Slowed 1.']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Discomfiting Whispers: turn-start Will saves in the aura; PF2e\'s roll-twice Effect on a failure; the failed attack\'s void damage is the record\'s control', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan, isFailedAttackDamage} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/discomfiting-whispers'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.centre, lingering.area, lingering.sustained], [['turn-start'], false, 'caster', {type: 'emanation', value: 5}, true]);
    assert.deepEqual([lingering.failedAttackDamage.formula, lingering.failedAttackDamage.type, lingering.failedAttackDamage.heightening], ['1d6', 'void', {interval: 2, dice: '1d6'}]);
    assert.equal(isFailedAttackDamage(plan), true);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(exposure.resolution.sharedDamage, null);
    assert.equal(inspectSavePlan(exposure).supported, true);
    for (const degree of ['failure', 'criticalFailure']) assert.deepEqual(exposure.resolution.outcomes[degree].nativeEffects.map(e => e.outcomeRule.kind), ['roll-twice-effect']);
    assert.deepEqual(exposure.resolution.outcomes.success.nativeEffects ?? [], []);
});

test('Discomfiting Whispers: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/discomfiting-whispers');
    for (const [from, to] of [['takes 1d6 void damage', 'takes 2d6 void damage'], ['take the lower result', 'take the higher result'], ['first attack roll', 'first skill check'],
        ['results in a failure', 'results in a failure or they are Frightened 1'], ['punish failure.', 'punish failure. Allies gain a +1 status bonus to AC.']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
    const effects2 = new Map(effects); const e = structuredClone(effects2.get('Spell Effect: Discomfiting Whispers')); e.mechanics.rules[0].keep = 'higher'; effects2.set(e.name, e);
    assert.equal(isExecutableLingeringPlan(compileAbility(source, {nativeEffectCatalog: effects2})), false);
});

test('Turbulent Tide: the Strike, then creatures adjacent to the caster pushed 5 / 10 feet by the Fortitude save; the GM answers whether the weapon broke', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/turbulent-tide'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.targeting.area, {type: 'emanation', value: 5});
    assert.deepEqual([plan.resolution.outcomes.failure.forcedMovement.distance, plan.resolution.outcomes.criticalFailure.forcedMovement.distance, plan.resolution.outcomes.success.forcedMovement ?? null], [5, 10, null]);
    assert.match(plan.resolution.castGate.question, /^Did the improvised weapon break\?/);
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind), ['strike-prelude', 'strike-placement', 'strike-placement']);
});

test('Turbulent Tide: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/turbulent-tide');
    for (const [from, to] of [['pushed 5 feet away from you (10 feet', 'pushed 5 feet away from you and knocked prone (10 feet'], ['Hardness greater than your level', 'Hardness greater than 5'],
        ['must move the same distance', 'must move twice the distance'], ['with stupendous force as you attack.', 'with stupendous force as you attack. You gain a +1 status bonus to AC.']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'save' && inspectSavePlan(plan).supported && plan.resolution.castGate != null, false, to);
    }
});

test('Wildfire: turn-end Reflex saves or persistent fire (raised by the heightening); the per-square hazard and the growth on Sustain are the record\'s', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan, isHazardMove} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/wildfire'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.centre, lingering.sustained], [['turn-end'], false, 'placed', true]);
    assert.deepEqual([lingering.hazardMove.formula, lingering.hazardMove.type, lingering.hazardMove.heightening, lingering.sustainGrowth.feet], ['1', 'fire', {interval: 2, increase: 1}, 5]);
    assert.equal(isHazardMove(plan), true);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(exposure.resolution.sharedDamage, null);
    assert.equal(inspectSavePlan(exposure).supported, true);
    assert.equal(exposure.resolution.outcomes.failure.damage.formulas[0].formula, '(1+floor((@item.rank - 1)/2))[persistent,fire]');
    assert.equal(exposure.resolution.outcomes.success.damage?.mode ?? 'none', 'none');
});

test('Wildfire: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/wildfire');
    for (const [from, to] of [['takes 1 fire damage for every square', 'takes 2 fire damage for every square'], ['increases by 5 feet', 'increases by 5 feet and creatures inside are Dazzled'],
        ['Increase the damage and persistent damage by 1', 'Increase the damage by 1'], ['becomes hazardous terrain.', 'becomes hazardous terrain and difficult terrain.'],
        ['A thin layer of ash and flame', 'A thin layer of ash and flame (a +1 status bonus to AC)']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Mushroom Patch: saves when cast and at the start of each round in the difficult-terrain burst; Dazzled on a success ends with 1 action outside; the 9th-rank Blinded instead of Dazzled', async () => {
    const {isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan, isActionEndLifetime} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/mushroom-patch'));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.centre, lingering.terrain], [['round-start'], true, 'placed', {difficulty: 2, movement: ['walk'], hazardous: false}]);
    const exposure = lingeringExposurePlan(plan);
    assert.equal(inspectSavePlan(exposure).supported, true);
    const dazzled = exposure.resolution.outcomes.success.effects.find(e => e.slug === 'dazzled');
    assert.deepEqual([dazzled.endsWhen, dazzled.expirationMode, isActionEndLifetime(dazzled)], [[{event: 'action', action: 'outside-action'}], 'first', true]);
    assert.deepEqual(exposure.resolution.outcomes.criticalFailure.effects.map(e => `${e.slug}${e.value ?? ''}`).sort(), ['dazzled', 'slowed1']);
    assert.equal(plan.resolution.rankGate, undefined);
    assert.deepEqual(plan.resolution.heightenedVariants.map(variant => [variant.minRank, variant.outcomes.criticalFailure.effects.map(effect => effect.slug)]), [[9, ['slowed', 'blinded']]]);
});

test('Mushroom Patch: kept strict', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/mushroom-patch');
    for (const [from, to] of [['at the beginning of each round', 'at the beginning of each round, dealing 1d4 poison damage'], ['removing the dazzled condition', 'removing the dazzled and slowed conditions'],
        ['they can spend 1 action to rub their eyes', 'they can spend 1 action to rub their eyes and gain a +1 status bonus to AC'], ['The area becomes difficult terrain.', 'The area becomes difficult terrain and hazardous terrain.']]) {
        assert.equal(isExecutableLingeringPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Lift Nature\'s Caul: bolstered creatures get PF2e\'s bonus instead of saving; critical success immune for 1 hour; Frightened floor while Stupefied', async () => {
    const {inspectSavePlan, isConditionFloor, correctSaveTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/lift-natures-caul'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.match(plan.resolution.bolster.question, /^Is this creature one of: aberrations or worshippers of Outer Gods or Great Old Ones\?/);
    assert.deepEqual(plan.resolution.bolster.claim, {value: 1, type: 'status', selectors: ['will', 'attack-roll'], duration: {value: 1, unit: 'minutes'}});
    assert.deepEqual(plan.resolution.temporaryImmunity, {key: 'lift-natures-caul', duration: {value: 1, unit: 'hours'}, degrees: ['criticalSuccess'], sourceText: 'The creature is unaffected and temporarily immune for 1 hour.'});
    const floor = plan.resolution.outcomes.criticalFailure.conditionFloor;
    assert.deepEqual([floor.slug, floor.value, floor.lifetime, floor.whileCondition], ['frightened', 1, 'while-condition', {slug: 'stupefied', duration: {value: 1, unit: 'minutes'}}]);
    assert.equal(isConditionFloor(floor), true);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value, e.endsWhen ?? null]), [['frightened', 2, null], ['stupefied', 1, null]]);
    const state = {status: 'collecting', bolster: plan.resolution.bolster, targets: [{id: 'a', bolster: {status: 'pending'}, eligible: true, applicationStatus: 'pending', revision: 0}]};
    correctSaveTarget(state, 'a', {action: 'bolstered'}, 'gm');
    assert.deepEqual([state.targets[0].bolster.status, state.targets[0].eligible, state.targets[0].applicationStatus], ['bolstered', false, 'unaffected']);
});

test('Lift Nature\'s Caul: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/lift-natures-caul');
    for (const [from, to] of [['+1 status bonus to Will saving throws and attack rolls', '+2 status bonus to Will saving throws and attack rolls'], ['and attack rolls for 1 minute', 'and AC for 1 minute'],
        ['temporarily immune for 1 hour', 'temporarily immune for 1 hour and Quickened'], ['below 1 as long as it remains stupefied', 'below 3 as long as it remains stupefied'],
        ['as long as it remains stupefied by this spell', 'as long as it remains in the area']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && plan.resolution.bolster != null && plan.resolution.outcomes.criticalFailure.conditionFloor != null && plan.resolution.temporaryImmunity?.degrees != null, false, to);
    }
});

test('Thrall Charge: the thrall\'s next Strike deals the stated dice by rank; destroying it adds the rank as a status bonus', async () => {
    const {SUPPORTED_RESOLUTION_KINDS} = await import('../scripts/runtime-core.js');
    assert.ok(SUPPORTED_RESOLUTION_KINDS.includes('thrall-strike'));
    const plan = compile(await spell('cantrip/thrall-charge'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['thrall-strike', 'automatic', []]);
    assert.deepEqual(plan.resolution.thrallStrike.ranks, [{rank: 1, dice: 1}, {rank: 2, dice: 2}, {rank: 6, dice: 3}, {rank: 10, dice: 4}]);
    assert.deepEqual([plan.resolution.thrallStrike.dieSize, plan.resolution.thrallStrike.range], ['d6', 30]);
    const source = await spell('cantrip/thrall-charge');
    for (const [from, to] of [['an additional 1d6 damage', 'an additional 1d6 fire damage'], ['equal to this spell\'s rank', 'equal to double this spell\'s rank'],
        ['increases to 3d6', 'increases to 3d8'], ['move and attack.', 'move and attack. Enemies adjacent to it are Frightened 1.']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'thrall-strike', to);
    }
});

test('Life Tap: one creature within 30 feet of the thrall saves; Drained 1/2/3 for 1 minute; the caster\'s pick near the thrall regains double the HP lost, once per 10 minutes', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/life-tap'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual([plan.targeting.thrall.origin, plan.targeting.thrall.within, plan.targeting.thrall.destroyed], ['within', 30, true]);
    for (const [degree, value] of [['success', 1], ['failure', 2], ['criticalFailure', 3]]) {
        const [drained] = plan.resolution.outcomes[degree].effects;
        assert.deepEqual([drained.slug, drained.value, drained.duration.value, drained.duration.unit], ['drained', value, 1, 'minutes']);
    }
    assert.deepEqual([plan.resolution.healBack.multiplier, plan.resolution.healBack.within, plan.resolution.healBack.degrees, plan.resolution.healBack.onceEvery],
        [2, {of: 'thrall', feet: 30}, ['success', 'failure', 'criticalFailure'], {value: 10, unit: 'minutes'}]);
});

test('Life Tap: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/life-tap');
    for (const [from, to] of [['equal to double the amount', 'equal to triple the amount'], ['recovers after 1 minute', 'recovers after 1 minute and is Frightened 1'],
        ['only once every 10 minutes', 'only once every 10 minutes and gains a +1 status bonus to AC'], ['The targeted thrall is then destroyed.', 'The targeted thrall is then destroyed. You take 2d6 damage.']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && plan.resolution.healBack != null, false, to);
    }
});

test('Vindicator\'s Mark: the spell attack (2d4 spirit); on a hit PF2e\'s mark on the caster (+2, +1 per 2 ranks); invisibility note; Dismiss deals the payoff', async () => {
    const {inspectSavePlan, isCasterMark} = await import('../scripts/basic-save-core.js');
    const {payoffFormula} = await import('../scripts/ongoing-runtime.js');
    const plan = compile(await spell('rank-1/vindicators-mark'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual([plan.resolution.outcomes.criticalSuccess.rawText, plan.resolution.outcomes.success.rawText], ['The target takes double damage.', 'The target takes full damage.']);
    const mark = plan.resolution.casterMark;
    assert.deepEqual([mark.kind, mark.slug, mark.degrees, mark.value, mark.heightens], ['strike-bonus', 'vindicators-mark', ['criticalSuccess', 'success'], 2, true]);
    assert.equal(isCasterMark(mark, plan), true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(p => p.kind), ['gm-confirmed']);
    assert.equal(plan.lifecycle.dismissal.payoff.kind, 'damage');
    assert.deepEqual([payoffFormula(plan.lifecycle.dismissal.payoff.formula, 1), payoffFormula(plan.lifecycle.dismissal.payoff.formula, 3)], ['2d6', '3d6']);
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind).filter(k => k === 'mark-note'), ['mark-note']);
});

test('Vindicator\'s Mark: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/vindicators-mark');
    for (const [from, to] of [['an additional +2 damage', 'an additional +3 damage'], ['the additional damage you deal increases by 1', 'the additional damage you deal increases by 2'],
        ['that only you can see.', 'that only you can see and it is Dazzled.'], ['weapon or unarmed attack, instantly', 'weapon or unarmed attack or spell, instantly']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && plan.resolution.casterMark != null, false, to);
    }
});

test('Threefold Limb: the melee spell attack of the text\'s 2d6 (+2d6 a rank), typed by the form; Ice\'s PF2e Effect, Water\'s Reposition reminder and Steam\'s note on a hit', async () => {
    const {inspectSavePlan, executableCasterChoice, targetOutcomeNotes} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/threefold-limb'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(executableCasterChoice(plan), true);
    assert.equal(plan.resolution.sharedDamage.formula, '(2+floor((@item.rank - 1)/1)*2)d6[untyped]');
    assert.deepEqual(plan.resolution.casterChoice.options, {ice: {type: 'cold'}, 'liquid water': {type: 'bludgeoning'}, steam: {type: 'fire'}});
    for (const degree of ['criticalSuccess', 'success']) {
        assert.deepEqual(plan.resolution.outcomes[degree].nativeEffects.map(e => [e.option, e.outcomeRule.kind]), [['ice', 'option-speed-effect']]);
        assert.deepEqual(plan.resolution.outcomes[degree].noteEffects.map(n => n.option), ['steam']);
    }
    assert.deepEqual([plan.resolution.outcomes.failure.nativeEffects ?? [], plan.resolution.outcomes.failure.noteEffects ?? []], [[], []]);
    assert.deepEqual(plan.resolution.reminders.filter(r => r.kind === 'option-note').map(r => r.option), ['liquid water']);
    const state = {outcomes: {success: plan.resolution.outcomes.success}, casterChoice: {kind: 'option', selected: 'ice'}};
    assert.deepEqual(targetOutcomeNotes(state, {degree: 'success'}), []);
});

test('Threefold Limb: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/threefold-limb');
    for (const [from, to] of [['–10-foot status penalty', '–15-foot status penalty'], ['the target up to 10 feet', 'the target up to 10 feet and knock it prone'],
        ['The limb deals fire damage', 'The limb deals fire damage and 1d6 persistent fire damage'], ['increases by 2d6', 'increases by 2d8'], ['On a critical hit, double the damage.', 'On a critical hit, double the damage and the target is Stunned 1.']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && plan.resolution.casterChoice?.kind === 'option', false, to);
    }
});

test('Pact Broker: held on the target; each hostile action a Will save (one degree worse if it had accepted); failure 2d4 mental and PF2e\'s −1/−2 Effect; immune 1 minute after', async () => {
    const {isExecutableStoredTriggerPlan, storedTriggerExposurePlan, isDegreeAdjustment} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('cantrip/pact-broker'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.held, stored.endsOnTrigger, stored.sustained, stored.durationSeconds, stored.immunity.value, stored.immunity.unit], [true, false, true, 60, 1, 'minutes']);
    assert.equal(isDegreeAdjustment(plan.resolution.degreeAdjustment), true);
    assert.equal(plan.resolution.degreeAdjustment.map.success, 'failure');
    const exposure = storedTriggerExposurePlan(plan);
    assert.deepEqual(['failure', 'criticalFailure'].map(d => exposure.resolution.outcomes[d].nativeEffects.map(e => [e.outcomeRule.kind, e.outcomeRule.selectionValue])), [[['flag-penalty-effect', -1]], [['flag-penalty-effect', -2]]]);
    // (User decision: the text.) The penalty is limited to the caster's side; only the hex-ending remark stays a note.
    assert.deepEqual(exposure.resolution.outcomes.failure.nativeEffects[0].outcomeRule.againstCasterSide, {ruleIndex: 1});
    assert.match(plan.resolution.dataNotes.join(' '), /applies only against the caster and the allies/);
});

test('Pact Broker: kept strict', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('cantrip/pact-broker');
    for (const [from, to] of [['one category worse', 'two categories worse'], ['immune for 1 minute', 'immune for 1 minute and Frightened 1'], ['to Deception checks to Lie to them', 'to all checks against them'],
        ['against you and your allies for the hex', 'against everyone for the hex'], ['As failure, but the penalty is –2.', 'As failure, but the penalty is –2 and it is Slowed 1.']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Forge: 3d6 fire by the Fortitude save; on a critical failure a metal creature gets PF2e\'s weakness Effect; a metal object\'s Hardness is the GM\'s', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/forge'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const [effect] = plan.resolution.outcomes.criticalFailure.nativeEffects;
    assert.deepEqual([effect.outcomeRule.kind, effect.outcomeRule.recipientTrait, effect.outcomeRule.value, effect.outcomeRule.types], ['weakness-effect', 'metal', 2, ['physical']]);
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind), ['hardness-by-damage']);
    assert.equal(plan.targeting.actorConstraints.complete, true);
});

test('Forge: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/forge');
    for (const [from, to] of [['weakness 2 to physical', 'weakness 3 to physical'], ['weakness on a critical failure increases by 2', 'weakness on a critical failure increases by 3'],
        ['if it\'s a metal creature', 'if it\'s a wooden creature'], ['until the end of your next turn.', 'until the end of your next turn. The target is also Slowed 1.']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && (plan.resolution.outcomes.criticalFailure.nativeEffects ?? []).some(e => e.outcomeRule?.recipientTrait), false, to);
    }
});

test('Appearance of Wealth: GM-confirmed lured creatures save; success Fascinated until its first action next turn; failure Fascinated while sustained; disbelief notes', async () => {
    const {inspectSavePlan, isActionEndLifetime} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/appearance-of-wealth'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(p => p.kind), ['gm-confirmed']);
    const [success] = plan.resolution.outcomes.success.effects;
    assert.deepEqual([success.slug, success.endsWhen, isActionEndLifetime(success)], ['fascinated', [{event: 'action', action: 'next-turn-action'}], true]);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(e => [e.slug, e.endsWhen ?? null]), [['fascinated', null]]);
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind), ['illusion-note', 'illusion-note']);
});

test('Appearance of Wealth: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/appearance-of-wealth');
    for (const [from, to] of [['within 20 feet of the area that could be enticed', 'within 20 feet of the area that could be enticed and is Frightened'],
        ['they are not at risk of becoming', 'they take 1d6 mental damage and are at risk of becoming'], ['its first action on its next turn', 'its first two actions on its next turn']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && (plan.compilerEvidence.illusionLure ?? []).length === 3, false, to);
    }
});

test('Exchange Image: the humanoid\'s Will save; PF2e\'s Illusory Disguise on it and on the caster for 1 minute / 1 hour / 24 hours; Dismiss; willing or unconscious critically fail', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/exchange-image'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'trait', present: true, slug: 'humanoid'}]);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(d => plan.resolution.outcomes[d].nativeEffects.map(e => [e.label, e.outcomeRule.alsoCaster, `${e.outcomeRule.durationOverride.value} ${e.outcomeRule.durationOverride.unit}`])),
        [[['Spell Effect: Illusory Disguise', true, '1 minutes']], [['Spell Effect: Illusory Disguise', true, '1 hours']], [['Spell Effect: Illusory Disguise', true, '24 hours']]]);
    assert.deepEqual(plan.resolution.reminders.map(r => r.kind), ['auto-critical-failure']);
    assert.equal(plan.lifecycle.dismissal.scope, 'cast');
});

test('Exchange Image: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/exchange-image');
    for (const [from, to] of [['1st-rank', '2nd-rank'], ['the target can\'t Dismiss the disguise', 'the target is also Stupefied 1'], ['24 hours.', '24 hours and it is Frightened 1.'], ['automatically critically fail', 'automatically fail']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && (plan.compilerEvidence.appearanceSwap ?? []).length === 3, false, to);
    }
});

test('Flense: the spell attack; a living creature\'s critical hit adds (rank)d4 persistent bleed; an undead\'s is Enfeebled 1 for 1 minute; corpses are the GM\'s', async () => {
    const {inspectSavePlan, outcomeForTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/flense'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.equal(plan.resolution.outcomes.criticalSuccess.damage.formulas[0].formula, '(@item.rank)d4[persistent,bleed]');
    assert.deepEqual(plan.resolution.traitVariant.outcomes.criticalSuccess.effects.map(e => [e.slug, e.value, `${e.duration.value} ${e.duration.unit}`]), [['enfeebled', 1, '1 minutes']]);
    const state = {outcomes: plan.resolution.outcomes, traitVariant: plan.resolution.traitVariant};
    assert.equal(outcomeForTarget(state, {degree: 'criticalSuccess', traitVariant: 'undead'}).effects[0].slug, 'enfeebled');
    assert.equal(outcomeForTarget(state, {degree: 'criticalSuccess'}).effects.length, 0);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(p => p.kind), ['gm-confirmed']);
});

test('Flense: kept strict', async () => {
    const source = await spell('rank-1/flense');
    for (const [from, to] of [['1d4 persistent bleed damage', '1d6 persistent bleed damage'], ['Enfeebled 1}</a> for 1 minute', 'Enfeebled 1} for 1 minute'], ['increases by 1d4.', 'increases by 2d4.'],
        ['leaving only bare bones behind.</p>', 'leaving only bare bones behind. You gain 1d6 temporary Hit Points.</p>'], ['Enfeebled 1} for 1 minute', 'Enfeebled 2} for 1 minute']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        if (from.includes('</a>')) continue;
        assert.equal(plan.resolution.traitVariant != null && plan.resolution.traitVariant.outcomes.criticalSuccess.effects[0]?.value === 1 && plan.resolution.outcomes.criticalSuccess.damage?.formulas?.[0]?.formula === '(@item.rank)d4[persistent,bleed]', false, to);
    }
});

test('Redistribute Potential: 4d4 by the basic Fortitude save; the GM picks each creature\'s square: cold and Clumsy 1, or fire and Enfeebled 1, on a failure', async () => {
    const {inspectSavePlan, correctSaveTarget, outcomeForTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('cantrip/redistribute-potential'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual([plan.resolution.traitVariant.kind, plan.resolution.traitVariant.values, plan.resolution.traitVariant.damageSwap], ['zone', ['cold', 'fire'], {from: 'cold', to: 'fire'}]);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(e => `${e.slug}${e.value}`), ['clumsy1']);
    assert.deepEqual(plan.resolution.traitVariant.outcomes.failure.effects.map(e => `${e.slug}${e.value}`), ['enfeebled1']);
    const state = {status: 'collecting', outcomes: plan.resolution.outcomes, traitVariant: plan.resolution.traitVariant, targets: [{id: 'a', zone: {status: 'pending'}, eligible: true, applicationStatus: 'pending', revision: 0, degree: 'failure'}]};
    correctSaveTarget(state, 'a', {action: 'zone', degree: 'fire'}, 'gm');
    assert.equal(outcomeForTarget(state, state.targets[0]).effects[0].slug, 'enfeebled');
});

test('Redistribute Potential: kept strict', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('cantrip/redistribute-potential');
    for (const [from, to] of [['take 4d4 damage', 'take 4d6 damage'], ['until the start of your next turn', 'for 1 minute'], ['it\'s unaffected by the other area.', 'it takes damage from both areas.'], ['dealing fire damage', 'dealing acid damage']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(inspectSavePlan(plan).supported && plan.resolution.traitVariant?.kind === 'zone', false, to);
    }
});

test('Murmuration: held on the target; each move closer a Will save for (rank)d4 of the caster\'s pick; a critical failure both types and PF2e\'s −2 next-roll Effect', async () => {
    const {isExecutableStoredTriggerPlan, storedTriggerExposurePlan, executableCasterChoice} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('cantrip/murmuration'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    assert.deepEqual([plan.resolution.sharedDamage.formula, plan.resolution.casterChoice.values], ['(@item.rank)d4[untyped]', ['piercing', 'sonic']]);
    const exposure = storedTriggerExposurePlan(plan);
    assert.equal(executableCasterChoice(exposure), true);
    const critical = exposure.resolution.outcomes.criticalFailure;
    assert.deepEqual(critical.damage.formulas.map(f => f.formula), ['(@item.rank)d4[sonic],(@item.rank)d4[piercing]']);
    assert.deepEqual(critical.nativeEffects.map(e => e.outcomeRule.kind), ['next-roll-penalty-effect']);
});

test('Murmuration: kept strict', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('cantrip/murmuration');
    for (const [from, to] of [['Once per round, if the target moves closer', 'If the target moves closer'], ['it takes a –2 status penalty', 'it takes a –3 status penalty'],
        ['(which can include yourself).', '(which can include yourself). The target is also Frightened 1.'], ['or by 2d4 on a critical failure', 'or by 3d4 on a critical failure']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Crown of Prophets: PF2e\'s fangs Effect on the caster is the marker; Toxic Prophecy is a repeatable basic Fortitude save; Serpentine Advice a note', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-1/crown-of-prophets'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    const stored = plan.resolution.storedTrigger;
    assert.deepEqual([stored.endsOnTrigger, stored.sustained, stored.durationSeconds, stored.effectMarker.label], [false, true, 60, 'Spell Effect: Crown of Prophets']);
    assert.match(stored.notes[0], /^Serpentine Advice \(instead of Toxic Prophecy\): .*Dubious Knowledge feat/);
    assert.equal(plan.resolution.check.basic, true);
});

test('Crown of Prophets: kept strict', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-1/crown-of-prophets');
    for (const [from, to] of [['deals 1d6 piercing damage', 'deals 1d8 piercing damage'], ['agile, finesse, and versatile poison', 'agile and versatile poison'], ['dealing 2d4 poison damage', 'dealing 2d6 poison damage'],
        ['Serpents sprout from your head, equally ready to bite your foes or offer you counsel.', 'Serpents sprout from your head. You gain a +1 status bonus to AC.']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Note routes (user decision): Cloak of Shadow and Delay Consequence as spell notes; Manifest Will as PF2e\'s aura on the caster plus a note', async () => {
    const cloak = compile(await spell('rank-1/cloak-of-shadow'));
    assert.deepEqual([cloak.resolution.kind, cloak.automation.pendingCapabilities, cloak.resolution.note.recipient], ['spell-note', [], 'target']);
    assert.match(cloak.resolution.note.text, /form of magical darkness/);
    // (Delay Consequence is automated since batch 160, user request: work on the note-only spells.)
    const delay = compile(await spell('rank-1/delay-consequence'));
    assert.deepEqual([delay.resolution.kind, delay.automation.pendingCapabilities], ['delayed-damage', []]);
    // (Manifest Will is built properly since batch 141, user decision: PF2e's aura plus its Spell Effect at each turn start.)
    const will = compile(await spell('cantrip/manifest-will'));
    assert.deepEqual([will.resolution.kind, will.automation.pendingCapabilities, will.resolution.auraTurnEffect.aura.label, will.resolution.auraTurnEffect.effect.label],
        ['aura-turn-effect', [], 'Aura: Manifest Will', 'Spell Effect: Manifest Will']);
    assert.deepEqual(will.resolution.auraTurnEffect.recipients, {arcane: 'any', divine: 'living-or-undead', occult: 'allies', primal: 'any'});
    // Still refused: a spell that counteracts actively, or numbers granted without a number.
    assert.notEqual(compile(withText(await spell('rank-1/cloak-of-shadow'), text => text.replace('or attempt to counteract magical light.', 'or attempt to counteract magical light. It also attempts to counteract Light spells in the area.'))).resolution.kind, 'spell-note');
});

test('Dancing Blade and Spirit Object: a spell attack of the text\'s damage, repeated once a round on Sustain; the physical type picked each attack', async () => {
    const {inspectSavePlan, executableCasterChoice} = await import('../scripts/basic-save-core.js');
    const blade = compile(await spell('cantrip/dancing-blade'));
    assert.equal(inspectSavePlan(blade).supported, true);
    assert.deepEqual([blade.resolution.check.statistic, blade.resolution.sharedDamage.formula, blade.resolution.repeatable.window, blade.resolution.repeatable.onCast, blade.resolution.repeatable.attacks],
        ['spell-attack', '(3+floor((@item.rank - 1)/2)*1)d6[untyped]', 'sustain', true, 11]);
    assert.equal(executableCasterChoice(blade), true);
    assert.deepEqual(blade.resolution.casterChoice.values, ['bludgeoning', 'piercing', 'slashing']);
    const object = compile(await spell('cantrip/spirit-object'));
    assert.equal(inspectSavePlan(object).supported, true);
    assert.deepEqual([object.resolution.sharedDamage.formula, object.resolution.repeatable.onCast, object.resolution.repeatable.attacks], ['(2+floor((@item.rank - 1)/1)*2)d4[untyped]', false, 10]);
    for (const [slug, from, to] of [['cantrip/dancing-blade', 'deals 3d6 damage', 'deals 3d6 damage and the target is Frightened 1'], ['cantrip/dancing-blade', 'increases by 1d6', 'increases by 2d6'],
        ['cantrip/spirit-object', 'takes 2d4 damage', 'takes 2d6 damage'], ['cantrip/spirit-object', 'You can Dismiss the spell.', 'You can Dismiss the spell. You gain a +1 status bonus to AC.']]) {
        const plan = compile(withText(await spell(slug), text => text.replace(from, to)));
        assert.equal(plan.resolution.repeatable?.window === 'sustain' && inspectSavePlan(plan).supported, false, `${slug}: ${to}`);
    }
});

test('Grasping Vine: Grabbed with the Escape end; the vine\'s AC and HP, the Repositions and the object branch are GM notes; a Medium-or-smaller target on the ground', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const vine = compile(await spell('rank-1/grasping-vine'));
    assert.deepEqual([vine.resolution.kind, vine.automation.pendingCapabilities, inspectSavePlan(vine).supported], ['save', [], true]);
    assert.deepEqual(vine.targeting.actorConstraints.predicates.map(predicate => predicate.kind), ['size-at-most', 'gm-confirmed']);
    assert.equal(vine.targeting.actorConstraints.predicates[0].size, 'med');
    const outcomes = vine.resolution.outcomes;
    assert.deepEqual(outcomes.success.rowNotes.map(note => note.kind), ['breakable']);
    assert.match(outcomes.success.rowNotes[0].text, /AC 15 and 10 Hit Points/);
    assert.deepEqual(outcomes.failure.rowNotes.map(note => note.kind), ['reposition']);
    assert.deepEqual(outcomes.criticalFailure.rowNotes.map(note => note.kind).sort(), ['reposition', 'reposition']);
    assert.match(outcomes.criticalFailure.rowNotes.map(note => note.text).join(' '), /up to 10 feet/);
    assert.deepEqual(vine.resolution.reminders.map(reminder => reminder.kind), ['object-branch']);
    for (const degree of ['success', 'failure', 'criticalFailure']) assert.deepEqual(outcomes[degree].effects.map(effect => [effect.slug, effect.endsWhen?.[0]?.event]), [['grabbed', 'escape']], degree);
    // Kept strict: damage or a bonus beside the vine, a Reposition of a creature it doesn't grab, a larger object move with another rule.
    for (const [from, to] of [['(the vine has AC 15 and 10 Hit Points)', '(the vine has AC 15 and 10 Hit Points and deals 1d6 damage)'],
        ['you can @UUID[Compendium.pf2e.actionspf2e.Item.lOE4yjUnETTdaf2T]{Reposition} the grabbed target up to 5 feet.', 'you can @UUID[Compendium.pf2e.actionspf2e.Item.lOE4yjUnETTdaf2T]{Reposition} the grabbed target up to 5 feet and it takes 1d6 bludgeoning damage.'],
        ['As failure, and you can immediately Reposition the target up to 10 feet.', 'As failure, and the target takes a –2 status penalty to AC.'],
        ['when you Cast the Spell and the first time you Sustain it each round.', 'when you Cast the Spell and the first time you Sustain it each round, and it deals 1d6 damage to a creature.']]) {
        const plan = compile(withText(await spell('rank-1/grasping-vine'), text => text.replace(from, to)));
        assert.equal(plan.automation.pendingCapabilities.length === 0 && inspectSavePlan(plan).supported, false, to);
    }
    // Not a creature on the ground of that size: another size text isn't read as this one.
    const larger = await spell('rank-1/grasping-vine');
    larger.system.target.value = '1 unattended object of up to 8 Bulk, or Medium or smaller creature';
    assert.notDeepEqual(compile(larger).targeting.actorConstraints.predicates?.map(predicate => predicate.kind), ['size-at-most', 'gm-confirmed']);
});

test('Wish Market: a chosen skill\'s bonus and a rolled price on one generated Effect; the price predicated off while suppressed', async () => {
    const {isExecutableOffer, offerRules, offerBonusAt} = await import('../src/compiler/offer-effect.js');
    const market = compile(await spell('rank-1/wish-market'));
    assert.deepEqual([market.resolution.kind, market.automation.level, market.automation.pendingCapabilities], ['offer-effect', 'automatic', []]);
    const offer = market.resolution.offer;
    assert.equal(isExecutableOffer(offer), true);
    assert.deepEqual(offer.bonus.skills, ['acrobatics', 'athletics', 'nature', 'occultism', 'religion']);
    assert.deepEqual(offer.price.rows.map(row => row.skills.join('+')), ['diplomacy+society', 'deception+stealth', 'crafting+thievery', 'arcana+medicine']);
    assert.deepEqual([1, 3, 4, 6, 7, 9].map(rank => offerBonusAt(offer, rank)), [1, 1, 2, 2, 3, 3]);
    assert.deepEqual([offer.suppress.rounds, offer.durationSeconds, offer.freeActions], [1, 60, ['Recall Knowledge', 'Seek']]);
    const rules = offerRules(offer, {castRank: 4, skill: 'nature', row: offer.price.rows[1], spellName: 'Wish Market'});
    assert.deepEqual(rules.map(rule => [rule.selector, rule.value, rule.predicate ?? null]), [['perception', 2, null], ['nature', 2, null],
        ['deception', -2, [{not: 'self:effect:wish-market-price-suppressed'}]], ['stealth', -2, [{not: 'self:effect:wish-market-price-suppressed'}]]]);
    // Kept strict: another rule anywhere, a table that isn't the die's faces, a price overlapping the chosen skills, another heightening.
    const source = await spell('rank-1/wish-market');
    for (const [from, to] of [['When you Cast this Spell, you accept an offer from the merchants.', 'When you Cast this Spell, you take 1d6 mental damage.'],
        ['roll 1d4 on the table below', 'roll 1d6 on the table below'], ['penalty to Arcana and Medicine checks', 'penalty to Arcana and Nature checks'],
        ['penalty to Crafting and Thievery checks', 'penalty to Crafting and Thievery checks and AC'], ['The status bonus increases to +3.', 'The status bonus increases to +3, and you gain a +1 status bonus to AC.'],
        ['for 1 round.</p>', 'for 1 round. You are also Quickened.</p>'], ['as a free action.', 'as a free action, and you gain a +1 status bonus to AC.']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'offer-effect', to);
    }
});

test('Shattering Gem: a Hit Point pool held on the target; the flat check and the burst on the attacker who breaks it', async () => {
    const {isExecutableStoredTriggerPlan, storedPoolHp} = await import('../scripts/basic-save-core.js');
    const gem = compile(await spell('rank-1/shattering-gem'));
    assert.equal(isExecutableStoredTriggerPlan(gem), true);
    const stored = gem.resolution.storedTrigger;
    assert.deepEqual([stored.held, stored.saveTarget, stored.endsOnTrigger, stored.durationSeconds], [true, 'attacker', true, 60]);
    assert.deepEqual(stored.pool, {label: 'gem', hp: 5, perStep: 5, interval: 1, flatDC: 11, range: 10});
    assert.deepEqual([1, 2, 5].map(rank => storedPoolHp(stored.pool, rank, 1)), [5, 10, 25]);
    assert.deepEqual([gem.resolution.check.statistic, gem.resolution.check.basic], ['reflex', true]);
    // Kept strict: another damage, a heightening that doesn't match the item's, a rider on the block, a different check.
    const source = await spell('rank-1/shattering-gem');
    for (const [from, to] of [['dealing 1d8 slashing damage', 'dealing 1d6 slashing damage'], ['increases by 1d8', 'increases by 2d8'],
        ['then applies any remaining damage to the target.', 'then applies any remaining damage to the target. The target is also Quickened.'],
        ['@Check[flat|dc:11|showDC:all]', '@Check[fortitude|dc:11|showDC:all]'], ['A large gem floats around the target in an erratic pattern.', 'A large gem floats around the target, giving it a +1 status bonus to AC.']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Trickster\'s Mirrors: images on the caster (1 to 3), the stated odds per count, a miss breaking one with the attacker\'s basic Will save', async () => {
    const {isExecutableStoredTriggerPlan} = await import('../scripts/basic-save-core.js');
    const mirrors = compile(await spell('rank-1/tricksters-mirrors'));
    assert.equal(isExecutableStoredTriggerPlan(mirrors), true);
    const stored = mirrors.resolution.storedTrigger;
    assert.deepEqual([stored.held ?? false, stored.saveTarget, stored.endsOnTrigger, stored.sustained, stored.durationSeconds], [false, 'attacker', false, true, 60]);
    assert.deepEqual(stored.images, {noun: 'mirror', start: 1, max: 3, perSustain: 1, range: 5,
        odds: [{count: 1, die: '1d6', you: 3}, {count: 2, die: '1d6', you: 2}, {count: 3, die: '1d4', you: 1}]});
    assert.deepEqual([mirrors.resolution.check.statistic, mirrors.resolution.check.basic], ['will', true]);
    // Kept strict: odds that don't match their die, another count, other damage, an added rule.
    const source = await spell('rank-1/tricksters-mirrors');
    for (const [from, to] of [['1 in 3 chance of hitting you (1–2 on 1d6)', '1 in 3 chance of hitting you (1–3 on 1d6)'], ['up to a maximum of 3 mirrors', 'up to a maximum of 4 mirrors'],
        ['take 1d4 mental damage', 'take 1d6 mental damage'], ['Once an image is hit, it is destroyed.', 'Once an image is hit, it is destroyed. You also become Quickened.'],
        ['increases by 1d4', 'increases by 2d4']]) {
        assert.equal(isExecutableStoredTriggerPlan(compile(withText(source, text => text.replace(from, to)))), false, to);
    }
});

test('Stick On: stuck together until the target Escapes; PF2e\'s sizes pick who is Immobilized', async () => {
    const {compareSizes, isExecutableSizeBond} = await import('../src/compiler/size-bond.js');
    const stick = compile(await spell('rank-1/stick-on'));
    assert.deepEqual([stick.resolution.kind, stick.automation.level, stick.automation.pendingCapabilities], ['size-bond', 'automatic', []]);
    const bond = stick.resolution.sizeBond;
    assert.equal(isExecutableSizeBond(bond), true);
    assert.deepEqual([bond.condition.slug, bond.escape.dc, bond.dismissible, bond.durationSeconds, bond.objects], ['immobilized', 'spell', true, 60, true]);
    assert.deepEqual([['med', 'sm'], ['med', 'med'], ['med', 'lg'], ['sm', 'tiny'], ['huge', 'grg'], ['med', 'x']].map(([a, b]) => compareSizes(a, b)), ['smaller', 'same', 'larger', 'smaller', 'larger', null]);
    // Kept strict: another condition, a rule in the narration, an added rule, a heightening, a save.
    const source = await spell('rank-1/stick-on');
    for (const [from, to] of [['{Immobilized} and pulled', '{Grabbed} and pulled'], ['causes it to stick to a target.', 'causes it to stick to a target, dealing 1d4 acid damage.'],
        ['You can Dismiss this spell.', 'You can Dismiss this spell. You gain a +1 status bonus to Athletics checks.'], ['but you both treat all spaces as difficult terrain.', 'but you both take a –10-foot penalty to your Speeds.'],
        ['You can Dismiss this spell.</p>', 'You can Dismiss this spell.</p><hr /><p><strong>Heightened (3rd)</strong> You can target 2 creatures.</p>']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'size-bond', to);
    }
});

test('Grease: the area branch as a Reflex degree save (Prone on a failure); the Acrobatics alternative, the surface and the object branch as reminders', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const grease = compile(await spell('rank-1/grease'));
    assert.deepEqual([grease.resolution.kind, grease.automation.pendingCapabilities, inspectSavePlan(grease).supported], ['save', [], true]);
    assert.deepEqual([grease.resolution.check.statistic, grease.resolution.check.basic], ['reflex', false]);
    assert.deepEqual(['criticalSuccess', 'success', 'failure', 'criticalFailure'].map(degree => grease.resolution.outcomes[degree].effects.map(effect => effect.slug).join()), ['', '', 'prone', 'prone']);
    assert.deepEqual(grease.resolution.reminders.map(reminder => reminder.kind), ['save-or-skill', 'surroundings', 'object-branch']);
    assert.match(grease.resolution.reminders[0].text, /may use Acrobatics instead/);
    assert.equal(grease.targeting.actorConstraints.sourceText, '4 contiguous 5-foot squares');
    // Kept strict: another condition, a Fortitude save, a damaging object branch, an added rule on the surface.
    const source = await spell('rank-1/grease');
    for (const [from, to] of [['{Prone}. Creatures', '{Clumsy 1}. Creatures'], ['must succeed at a Reflex save or an Acrobatics', 'must succeed at a Fortitude save or an Acrobatics'],
        ['releases the item.', 'releases the item and takes 1d6 fire damage.'], ['doesn\'t have to attempt a check or save.', 'doesn\'t have to attempt a check or save. Creatures on it are Off-Guard.']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(plan.automation.pendingCapabilities.length === 0 && inspectSavePlan(plan).supported, false, to);
    }
});

test('Dehydrate: a basic save of persistent fire (water and plant creatures one degree worse); an additional save at each turn end while it lasts', async () => {
    const {inspectSavePlan, isExecutableFollowUpSave, followUpExposurePlan} = await import('../scripts/basic-save-core.js');
    const dehydrate = compile(await spell('rank-1/dehydrate'));
    assert.deepEqual([dehydrate.resolution.kind, dehydrate.automation.pendingCapabilities, inspectSavePlan(dehydrate).route], ['save', [], 'basic-save']);
    assert.deepEqual([dehydrate.resolution.check.basic, dehydrate.resolution.sharedDamage.components[0].category, dehydrate.resolution.degreeAdjustment.predicate.traits], [true, 'persistent', ['water', 'plant']]);
    assert.equal(isExecutableFollowUpSave(dehydrate), true);
    const follow = dehydrate.resolution.followUpSave;
    assert.deepEqual([follow.timing, follow.damageType, follow.statistic, follow.durationSeconds], ['turn-end', 'fire', 'fortitude', 60]);
    assert.match(follow.question, /consume water or a similar hydrating liquid/);
    const exposure = followUpExposurePlan(dehydrate);
    assert.equal(inspectSavePlan(exposure).route, 'degree-save');
    assert.deepEqual(['criticalSuccess', 'success', 'failure', 'criticalFailure'].map(degree => exposure.resolution.outcomes[degree].effects.map(effect => `${effect.slug}${effect.value ?? ''}`).join()), ['', '', 'enfeebled1', 'enfeebled2']);
    // Kept strict: another damage, another additional save, a rider on the forgo sentence, a different ending.
    const source = await spell('rank-1/dehydrate');
    for (const [from, to] of [['take 1d6 persistent fire damage', 'take 1d8 persistent fire damage'], ['attempts an additional Fortitude save', 'attempts an additional Will save'],
        ['(drinking typically requires a single action).', '(drinking typically requires a single action). It is also Sickened 1.'], ['The spell ends for a creature when its persistent damage ends.', 'The spell ends after 1 round.'],
        ['{Enfeebled 1} until the end of its next turn', '{Enfeebled 1} until the end of its next turn and takes 1d6 fire damage']]) {
        const plan = compile(withText(source, text => text.replace(from, to)));
        assert.equal(plan.resolution.followUpSave != null && isExecutableFollowUpSave(plan) && inspectSavePlan(plan).supported, false, to);
    }
});

test('Hand of the Apprentice: guided — PF2e\'s Effect for the chosen weapon, the spell attack, then the weapon\'s own Strike damage', async () => {
    const {proveWeaponThrowEffect} = await import('../src/compiler/weapon-throw.js');
    const hand = compile(await spell('rank-1/hand-of-the-apprentice'));
    assert.deepEqual([hand.resolution.kind, hand.automation.level, hand.automation.pendingCapabilities], ['weapon-throw', 'guided', []]);
    assert.deepEqual([hand.resolution.weaponThrow.flag, hand.resolution.weaponThrow.ability, hand.resolution.weaponThrow.effect.label], ['weapon', 'int', 'Spell Effect: Hand of the Apprentice']);
    assert.equal(hand.resolution.weaponThrow.abilityFromSpellcasting, true);
    // The Effect's proof: an extra rule, an unforced modifier, a specialization on any weapon each fail it.
    const effect = effects.get('Spell Effect: Hand of the Apprentice');
    const rules = effect.mechanics.rules;
    assert.ok(proveWeaponThrowEffect({rules}));
    assert.equal(proveWeaponThrowEffect({rules: [...rules, {key: 'FlatModifier', selector: 'ac', value: 1, type: 'status'}]}), null);
    assert.equal(proveWeaponThrowEffect({rules: rules.map(rule => rule.key === 'FlatModifier' ? {...rule, force: false} : rule)}), null);
    assert.equal(proveWeaponThrowEffect({rules: rules.map(rule => rule.key === 'CriticalSpecialization' ? {...rule, predicate: undefined} : rule)}), null);
    // Kept strict: other text.
    const source = await spell('rank-1/hand-of-the-apprentice');
    for (const [from, to] of [['rather than your Strength modifier.', 'rather than your Strength modifier, and the target is Frightened 1.'], ['you deal double damage', 'you deal triple damage'],
        ['returns to your hand.', 'returns to your hand. You gain a +1 status bonus to AC.']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'weapon-throw', to);
    }
});

test('Invoke True Name: Off-Guard and a save penalty against the caster\'s spells, and a one-time weakness to their damage (predicates checked live)', async () => {
    const {spellMarkRules, isExecutableSpellMark} = await import('../src/compiler/spell-mark.js');
    const invoke = compile(await spell('cantrip/invoke-true-name'));
    assert.deepEqual([invoke.resolution.kind, invoke.automation.level, invoke.automation.pendingCapabilities], ['spell-mark', 'automatic', []]);
    const mark = invoke.resolution.spellMark;
    assert.equal(isExecutableSpellMark(mark), true);
    assert.deepEqual([mark.savePenalty.value, mark.weakness.perRank, mark.knownName], [2, 2, true]);
    const rules = spellMarkRules(mark, {signature: 'sig', castRank: 3, spellName: 'Invoke True Name'});
    assert.deepEqual(rules.map(rule => [rule.key, rule.selector ?? rule.type, rule.value, rule.predicate ?? rule.definition]), [
        ['FlatModifier', 'ac', -2, ['origin:signature:sig', 'item:type:spell']], ['FlatModifier', 'saving-throw', -2, ['origin:signature:sig', 'item:type:spell']],
        ['Weakness', 'custom', 6, ['item:type:spell', 'self:signature:sig']]]);
    // Kept strict.
    const source = await spell('cantrip/invoke-true-name');
    for (const [from, to] of [['-2 circumstance penalty to saving throws', '-2 status penalty to saving throws'], ['equal to double the rank', 'equal to the rank'],
        ['to more surely affect it with your magic.', 'to more surely affect it with your magic. It is also Frightened 1.'], ['against your spells and takes', 'against all attacks and takes']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'spell-mark', to);
    }
});

test('Shielded Arm: a temporary PF2e shield (Hardness 4, 15 HP, +4/+15 per 2 ranks) with twice its Hit Points so PF2e\'s Broken Threshold is the spell\'s zero', async () => {
    const {temporaryShieldAt, isExecutableTemporaryShield} = await import('../src/compiler/temporary-shield.js');
    const arm = compile(await spell('rank-1/shielded-arm'));
    assert.deepEqual([arm.resolution.kind, arm.automation.level, arm.automation.pendingCapabilities], ['temporary-shield', 'automatic', []]);
    const shield = arm.resolution.temporaryShield;
    assert.equal(isExecutableTemporaryShield(shield), true);
    assert.deepEqual([1, 2, 3, 5].map(rank => temporaryShieldAt(shield, rank, 1)), [{hardness: 4, hp: 15}, {hardness: 4, hp: 15}, {hardness: 8, hp: 30}, {hardness: 12, hp: 45}]);
    assert.deepEqual([shield.part, shield.acBonus, shield.durationSeconds, shield.notes.length], ['arm', 2, 60, 2]);
    assert.match(arm.resolution.dataNotes[0], /twice the spell's Hit Points/);
    // Kept strict.
    const source = await spell('rank-1/shielded-arm');
    for (const [from, to] of [['gaining a +2 circumstance bonus to AC', 'gaining a +2 status bonus to AC'], ['doesn\'t have a Broken Threshold', 'has a Broken Threshold of 5'],
        ['can\'t be used to make a shield bash Strike.', 'can\'t be used to make a shield bash Strike. The target also gains resistance 5 to fire.'], ['The Hardness increases by 4', 'The Hardness increases by 4 and the AC bonus by 1'],
        ['with its bare skin.', 'with its bare skin, dealing 1d6 damage to attackers.']]) {
        assert.notEqual(compile(withText(source, text => text.replace(from, to))).resolution.kind, 'temporary-shield', to);
    }
});

test('Effects applied when cast by their stated forms: healing bonus, first-Strike toggle, reaction targets, a rolled badge, a counter badge, allies in the area', async () => {
    const expect = {'rank-1/healers-blessing': 'target', 'rank-1/gravity-weapon': 'source', 'rank-1/loremasters-etude': 'target', 'rank-1/phase-familiar': 'target',
        'rank-1/cinder-gaze': 'source', 'cantrip/entropic-wheel': 'source', 'rank-1/call-to-arms': 'area-allies'};
    for (const [path, actor] of Object.entries(expect)) {
        const plan = compile(await spell(path));
        assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities], ['effect', 'automatic', []], path);
        assert.equal(plan.nativeEffects.onUse[0].recipient.actor, actor, path);
    }
    assert.equal(compile(await spell('rank-1/healers-blessing')).resolution.oncePerSource.ruleIndex, 0);
    assert.deepEqual(compile(await spell('rank-1/gravity-weapon')).resolution.autoToggle, {option: 'gravity-weapon', domain: 'damage', per: 'round', offAfter: 'weapon-damage'});
    // Kept strict: the form must match the Effect.
    for (const [path, from, to] of [['rank-1/healers-blessing', 'it regains 2 additional Hit Points', 'it regains 2 additional Hit Points and a +1 status bonus to AC'],
        ['rank-1/gravity-weapon', 'twice the number of weapon damage dice.', 'twice the number of weapon damage dice. Each Strike also deals 1d6 fire damage.'], ['rank-1/cinder-gaze', 'roll 1d4 for your prediction', 'roll 1d6 for your prediction'],
        ['cantrip/entropic-wheel', 'the wheel has one mote', 'the wheel has two motes']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && plan.automation.level === 'automatic', false, `${path}: ${to}`);
    }
});

test('Effect route: temporary immunity (from the cast, or once used), a cast condition, both holders, caster reminders', async () => {
    const luck = compile(await spell('rank-1/bit-of-luck'));
    assert.deepEqual([luck.resolution.kind, luck.automation.level, luck.resolution.temporaryImmunity], ['effect', 'automatic',
        {key: 'bit-of-luck', duration: {value: 24, unit: 'hours'}, startsWhen: 'cast', sourceText: luck.resolution.temporaryImmunity.sourceText}]);
    assert.equal(luck.resolution.consumeOn.on, 'saving-throw');
    const wash = compile(await spell('cantrip/wash-your-luck'));
    assert.deepEqual([wash.resolution.kind, wash.resolution.temporaryImmunity.startsWhen, wash.resolution.temporaryImmunity.duration], ['effect', 'effect-used', {value: 10, unit: 'minutes'}]);
    const dream = compile(await spell('rank-1/sweet-dream'));
    assert.deepEqual([dream.resolution.kind, dream.resolution.castCondition.slug], ['effect', 'unconscious']);
    assert.match(dream.resolution.gmNotes.join(' '), /wakes up before 1 minute/);
    const vision = compile(await spell('cantrip/share-vision'));
    assert.deepEqual([vision.resolution.kind, vision.resolution.alsoSource], ['effect', true]);
    assert.equal(compile(await spell('rank-1/cutting-eye')).resolution.kind, 'effect');
    assert.match(compile(await spell('cantrip/read-the-air')).resolution.gmNotes.join(' '), /Recall Knowledge using Society/);
    // Kept strict.
    for (const [path, from, to] of [['rank-1/bit-of-luck', 'immune for 24 hours.', 'immune for 24 hours. It also takes 1d6 mental damage.'],
        ['rank-1/sweet-dream', '{Unconscious} if it wasn\'t already', '{Paralyzed} if it wasn\'t already'], ['cantrip/share-vision', 'a +2 status bonus to Perception', 'a +3 status bonus to Perception'],
        ['cantrip/read-the-air', 'using Society to gain information', 'using Society and Diplomacy to gain information']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && ['automatic', 'prompted'].includes(plan.automation.level), false, `${path}: ${to}`);
    }
});

test('Sure Strike, Unimpeded Stride, Scholarly Recollection: proven Effects with immunity, GM notes and a trigger the Effect names', async () => {
    const sure = compile(await spell('rank-1/sure-strike'));
    assert.deepEqual([sure.resolution.kind, sure.automation.level, sure.resolution.temporaryImmunity.duration], ['effect', 'automatic', {value: 10, unit: 'minutes'}]);
    assert.match(sure.resolution.gmNotes.join(' '), /flat check/);
    assert.equal(sure.resolution.consumeOn.on, 'attack-roll');
    const stride = compile(await spell('rank-1/unimpeded-stride'));
    assert.deepEqual([stride.resolution.kind, stride.nativeEffects.onUse[0].recipient.actor], ['effect', 'source']);
    assert.match(stride.resolution.gmNotes.join(' '), /Immobilized or Grabbed/);
    const scholar = compile(await spell('rank-1/scholarly-recollection'));
    assert.deepEqual([scholar.resolution.kind, scholar.automation.level], ['effect', 'automatic']);
    for (const [path, from, to] of [['rank-1/sure-strike', 'for 10 minutes.', 'for 10 minutes. You also take 1d4 mental damage.'],
        ['rank-1/unimpeded-stride', 'You then Stride.', 'You then teleport 30 feet.'], ['rank-1/scholarly-recollection', 'The GM rolls the triggering check twice', 'The GM rolls the triggering check three times']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && plan.automation.level === 'automatic', false, `${path}: ${to}`);
    }
});

test('Magic Stone, Object Memory, Untamed Form, Muscle Barrier: the stated holder of PF2e\'s Effect, with GM notes for what it doesn\'t hold', async () => {
    const expect = {'rank-1/magic-stone': 'target', 'rank-1/object-memory': 'source', 'rank-1/untamed-form': 'source', 'rank-1/muscle-barrier': 'target'};
    for (const [path, actor] of Object.entries(expect)) {
        const plan = compile(await spell(path));
        assert.equal(plan.resolution.kind, 'effect', path);
        assert.ok(['automatic', 'prompted'].includes(plan.automation.level), path);
        assert.deepEqual(plan.automation.pendingCapabilities, [], path);
        assert.equal(plan.nativeEffects.onUse[0].recipient.actor, actor, path);
    }
    assert.match(compile(await spell('rank-1/object-memory')).resolution.gmNotes.join(' '), /Touching a tool/);
    assert.match(compile(await spell('rank-1/magic-stone')).resolution.gmNotes.join(' '), /crumbles to dust/);
    assert.deepEqual([compile(await spell('rank-1/untamed-form')).resolution.shapeDuration.spell, compile(await spell('rank-1/untamed-form')).resolution.shapeDuration.minutes], ['Pest Form', 10]);
    for (const [path, from, to] of [['rank-1/magic-stone', 'crumbles to dust.', 'crumbles to dust, dealing 1d6 bludgeoning damage.'], ['rank-1/muscle-barrier', 'within 15 feet of it', 'within 15 feet of it and 1d6 bludgeoning damage to each enemy'],
        ['rank-1/object-memory', 'increases to trained (if it is not already trained or better). If you touch a tool', 'increases to trained (if it is not already trained or better). You also teleport 30 feet. If you touch a tool']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && ['automatic', 'prompted'].includes(plan.automation.level) && !plan.automation.pendingCapabilities.length, false, `${path}: ${to}`);
    }
});

test('Metal Merged, Nymph\'s Token, Traveling Workshop: PF2e\'s Effect on the stated holder; the table rules are GM notes; an untriggered free-action Dismiss', async () => {
    const merged = compile(await spell('rank-1/metal-merged'));
    assert.deepEqual([merged.resolution.kind, merged.automation.level, merged.nativeEffects.onUse[0].recipient.actor], ['effect', 'automatic', 'source']);
    assert.match(merged.resolution.gmNotes.join(' '), /can't drop the weapon/);
    const token = compile(await spell('rank-1/nymphs-token'));
    assert.deepEqual([token.resolution.kind, token.automation.level, token.nativeEffects.onUse[0].recipient.actor], ['effect', 'automatic', 'target']);
    const termination = token.nativeEffects.terminations[0];
    assert.deepEqual([termination.authority.actor, termination.action.cost.type, termination.action.trigger ?? null], ['source', 'free-action', null]);
    const workshop = compile(await spell('rank-1/traveling-workshop'));
    assert.deepEqual([workshop.resolution.kind, workshop.automation.level], ['effect', 'automatic']);
    assert.match(workshop.resolution.gmNotes.join(' '), /8 hours/);
    for (const [path, from, to] of [['rank-1/metal-merged', 'a +4 circumstance bonus', 'a +2 circumstance bonus'], ['rank-1/nymphs-token', 'Performance checks and Will saves', 'Performance checks, AC and Will saves'],
        ['rank-1/traveling-workshop', 'you are trained in Crafting and Thievery', 'you are trained in Crafting and Stealth']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && plan.automation.level === 'automatic', false, `${path}: ${to}`);
    }
});

test('Figment, Light, Read Aura, Fishing Spot: stated holders; the rolled fish answers PF2e\'s choice in the list\'s order', async () => {
    const expect = {'cantrip/figment': 'source', 'cantrip/light': 'target', 'cantrip/read-aura': 'source', 'rank-1/fishing-spot': 'target'};
    for (const [path, actor] of Object.entries(expect)) {
        const plan = compile(await spell(path));
        assert.equal(plan.resolution.kind, 'effect', path);
        assert.ok(['automatic', 'prompted'].includes(plan.automation.level), path);
        assert.equal(plan.nativeEffects.onUse[0].recipient.actor, actor, path);
    }
    const fish = compile(await spell('rank-1/fishing-spot')).resolution.rolledChoice;
    assert.deepEqual([fish.formula, fish.ruleIndex, fish.values[0], fish.values[7]], ['1d8', 0, 'musical-trout', 'scholar-salmon']);
    for (const [path, from, to] of [['rank-1/fishing-spot', 'roll [[/r 1d8 #Fishing Spot]]', 'roll [[/r 1d6 #Fishing Spot]]'], ['cantrip/figment', 'gaining a +2 circumstance bonus', 'gaining a +2 circumstance bonus and 1d4 fire damage'],
        ['cantrip/read-aura', 'you know whether that item is magical.', 'you know whether that item is magical and it takes 1d6 force damage.']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && ['automatic', 'prompted'].includes(plan.automation.level), false, `${path}: ${to}`);
    }
});

test('Illusory Disguise, Swear Oath, Forbidding Ward: PF2e\'s Effect with its table rules as notes; the ward marks the enemy', async () => {
    const disguise = compile(await spell('rank-1/illusory-disguise'));
    assert.deepEqual([disguise.resolution.kind, disguise.automation.level], ['effect', 'automatic']);
    assert.match(disguise.resolution.gmNotes.join(' '), /dissimilar creature/);
    const oath = compile(await spell('rank-1/swear-oath'));
    assert.deepEqual([oath.resolution.kind, oath.automation.level, oath.nativeEffects.onUse[0].recipient.actor], ['effect', 'automatic', 'source']);
    assert.match(oath.resolution.gmNotes.join(' '), /regain the Focus Point/);
    const ward = compile(await spell('cantrip/forbidding-ward'));
    assert.deepEqual([ward.resolution.kind, ward.automation.level, ward.nativeEffects.onUse[0].recipient.markTarget], ['effect', 'automatic', 'enemy']);
    for (const [path, from, to] of [['rank-1/illusory-disguise', 'gives a +4 status bonus', 'gives a +2 status bonus'], ['rank-1/swear-oath', 'regain the Focus Point spent for this spell.', 'regain the Focus Point spent for this spell and deal 1d6 fire damage.'],
        ['cantrip/forbidding-ward', 'bonus to Armor Class and saving throws', 'bonus to Armor Class, saving throws and damage rolls']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && plan.automation.level === 'automatic', false, `${path}: ${to}`);
    }
});

test('stated Effect forms compare the stated number with PF2e\'s', async () => {
    for (const [path, from, to] of [['cantrip/figment', 'gaining a +2 circumstance bonus', 'gaining a +3 circumstance bonus'], ['cantrip/read-aura', 'gains a +2 circumstance bonus', 'gains a +3 circumstance bonus']]) {
        const plan = compile(withText(await spell(path), text => text.replace(from, to)));
        assert.equal(plan.resolution.kind === 'effect' && plan.automation.level === 'automatic', false, `${path}: ${to}`);
    }
});

test('Glimpse Weakness (a Strike weakness on the foe) and Uplifting Overture (a prepared Aid) — user decisions', async () => {
    const {strikeMarkRules} = await import('../src/compiler/spell-mark.js');
    const {aidPrepareDegree, aidModifier} = await import('../src/compiler/aid-prepare.js');
    const glimpse = compile(await spell('cantrip/glimpse-weakness'));
    assert.deepEqual([glimpse.resolution.kind, glimpse.automation.level, glimpse.resolution.spellMark.strikeWeakness], ['spell-mark', 'automatic', {base: 1, perRank: 1}]);
    assert.deepEqual(strikeMarkRules(glimpse.resolution.spellMark, {castRank: 3, spellName: 'G'})[0].value, 4);
    assert.match(glimpse.resolution.dataNotes[0], /isn't applied/);
    const overture = compile(await spell('cantrip/uplifting-overture'));
    assert.deepEqual([overture.resolution.kind, overture.automation.level, overture.resolution.aidPrepare.skill, overture.resolution.aidPrepare.dc], ['aid-prepare', 'automatic', 'performance', 15]);
    const aid = overture.resolution.aidPrepare;
    assert.deepEqual(['criticalFailure', 'failure', 'success', 'criticalSuccess'].map(d => aidPrepareDegree(aid, d, 1)), ['criticalFailure', 'success', 'success', 'criticalSuccess']);
    assert.equal(aidPrepareDegree(aid, 'criticalFailure', 4), 'criticalSuccess');
    assert.deepEqual([aidModifier('criticalSuccess', 1), aidModifier('criticalSuccess', 3), aidModifier('criticalSuccess', 4), aidModifier('success', 1), aidModifier('failure', 1), aidModifier('criticalFailure', 1)], [2, 3, 4, 1, 0, -1]);
    for (const [path, from, to] of [['cantrip/glimpse-weakness', 'equal to 1 + this spell', 'equal to 1d6 + this spell'], ['cantrip/uplifting-overture', 'you get a success instead', 'you get a critical success instead']]) {
        assert.ok(!['spell-mark', 'aid-prepare'].includes(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind), `${path}: ${to}`);
    }
});

test('Pyroclastic Truth (user decision): the basic save, the fire mark on damaged creatures, Fuel, and the caster\'s lethologic mark', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const pyro = compile(await spell('rank-1/pyroclastic-truth'));
    assert.deepEqual([pyro.resolution.kind, pyro.automation.level, inspectSavePlan(pyro).route], ['save', 'automatic', 'basic-save']);
    const impossible = pyro.resolution.impossibleBurst;
    assert.deepEqual([impossible.mark.label, impossible.fuel.dieSize, impossible.fuel.damageType, impossible.lethologic.frightened, impossible.lethologic.deathAtZero.damageType],
        ['marked by fire', 12, 'fire', {damageType: 'fire', value: 1}, 'fire']);
    assert.match(impossible.lethologic.healNote, /atone ritual/);
    for (const [from, to] of [['you become @UUID', 'you become sickened and @UUID'], ['take @Damage[(@item.level)d12[persistent,fire]] damage', 'take @Damage[(@item.level)d8[persistent,fire]] damage'],
        ['dealing 2d12 fire damage', 'dealing 2d10 fire damage']]) {
        const plan = compile(withText(await spell('rank-1/pyroclastic-truth'), text => text.replace(from, to)));
        assert.equal(plan.resolution.impossibleBurst != null && inspectSavePlan(plan).supported, false, to);
    }
});

test('Manifest Will built properly (user decision): each tradition\'s list item proved against PF2e\'s Spell Effect rule', async () => {
    const will = compile(await spell('cantrip/manifest-will'));
    assert.deepEqual([will.resolution.kind, will.automation.level], ['aura-turn-effect', 'automatic']);
    const data = will.resolution.auraTurnEffect;
    assert.deepEqual([data.area, data.durationSeconds, data.escapeEnds, data.effect.choiceRuleIndex], [{type: 'emanation', value: 10}, 60, ['primal'], 0]);
    for (const [from, to] of [['gains weakness 1 to spell damage', 'gains weakness 2 to spell damage'], ['gains 2 temporary Hit Points', 'gains 3 temporary Hit Points'],
        ['has a –10-foot status penalty', 'has a –5-foot status penalty'], ['An allied creature that begins', 'A creature that begins'],
        ['but can\'t use that concealment', 'and gains a +1 status bonus to AC but can\'t use that concealment']]) {
        assert.notEqual(compile(withText(await spell('cantrip/manifest-will'), text => text.replace(from, to))).resolution.kind, 'aura-turn-effect', to);
    }
});

test('Practice Makes Perfect: the triggering check re-graded (status bonuses don\'t stack; natural 20 and 1 still step)', async () => {
    const {regradeCheck, checkDegree} = await import('../src/compiler/check-bonus-reaction.js');
    const plan = compile(await spell('rank-1/practice-makes-perfect'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level, plan.resolution.checkBonus.value, plan.resolution.checkBonus.masterValue], ['check-bonus', 'automatic', 2, 3]);
    assert.deepEqual(regradeCheck({total: 19, dc: 20, natural: 12, existingOfType: 0}, 2), {added: 2, total: 21, degree: 'success'});
    assert.deepEqual(regradeCheck({total: 19, dc: 20, natural: 12, existingOfType: 1}, 2), {added: 1, total: 20, degree: 'success'});
    assert.deepEqual(regradeCheck({total: 19, dc: 20, natural: 12, existingOfType: 3}, 2), {added: 0, total: 19, degree: 'failure'});
    assert.equal(checkDegree(9, 20, 20), 'failure');
    assert.equal(checkDegree(28, 20, 1), 'failure');
    assert.notEqual(compile(withText(await spell('rank-1/practice-makes-perfect'), text => text.replace('a +2 status bonus', 'a +2 status bonus and 1d6 temporary Hit Points'))).resolution.kind, 'check-bonus');
});

test('Inside Ropes: a Climb Effect on the caster (half-distance note, fall flat check, +1 item from rank 3)', async () => {
    const {climbAidRules, flatCheckPasses} = await import('../src/compiler/climb-aid.js');
    const plan = compile(await spell('cantrip/inside-ropes'));
    const aid = plan.resolution.climbAid;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, aid.rope, aid.length, aid.fallCheckDC, aid.durationSeconds, aid.heightened.minRank], ['climb-aid', 'automatic', 'guts', 50, 5, 600, 3]);
    assert.equal(climbAidRules(aid, {castRank: 1, spellName: 'X'}).filter(rule => rule.key === 'FlatModifier').length, 0);
    assert.deepEqual(climbAidRules(aid, {castRank: 3, spellName: 'X'}).filter(rule => rule.key === 'FlatModifier').map(rule => [rule.selector, rule.type, rule.value, rule.predicate[0]]), [['athletics', 'item', 1, 'action:climb']]);
    assert.equal(flatCheckPasses(5, 5), true);
    assert.equal(flatCheckPasses(4, 5), false);
    for (const [from, to] of [['(minimum 5 feet)', '(minimum 10 feet)'], ['a +1 item bonus', 'a +2 item bonus'], ['they help attach you to a wall.', 'they help attach you to a wall. You gain a +1 status bonus to AC.'], ['Removing these guts', 'Removing these 2 guts']])
        assert.notEqual(compile(withText(await spell('cantrip/inside-ropes'), text => text.replace(from, to))).resolution.kind, 'climb-aid', from);
});

test('Flashy Disappearance: PF2e\'s Effect for the Stride, then Hide against each foe\'s Perception DC (or no cover) ends it', async () => {
    const {hideResults} = await import('../src/compiler/stride-hide.js');
    const plan = compile(await spell('rank-1/flashy-disappearance'));
    const data = plan.resolution.strideHide;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.bonus.type, data.bonus.value, data.effect.label], ['stride-hide', 'automatic', 'status', 2, 'Spell Effect: Flashy Disappearance']);
    assert.deepEqual(hideResults(18, [{name: 'a', dc: 18}, {name: 'b', dc: 19}]).map(entry => entry.hidden), [true, false]);
    for (const [from, to] of [['+2 status bonus', '+3 status bonus'], ['You Stride.', 'You Stride twice.'], ['to Hide.', 'to Hide. You gain a +1 status bonus to AC.'], ['if you have cover, greater cover, or concealment', 'if you have cover']])
        assert.notEqual(compile(withText(await spell('rank-1/flashy-disappearance'), text => text.replace(from, to))).resolution.kind, 'stride-hide', from);
});

test('Eat Fire: PF2e\'s resistance Effect (data note), Belch Smoke places a 5-foot concealing cloud within 20 feet, Unconscious ends it', async () => {
    const plan = compile(await spell('cantrip/eat-fire'));
    const data = plan.resolution.cloudAction;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.action.name, data.cloud.area.value, data.cloud.rangeFeet, data.cloud.durationSeconds, data.endsOnCondition, data.resistance.type, data.resistance.value],
        ['cloud-action', 'automatic', 'Belch Smoke', 5, 20, 60, 'unconscious', 'fire', 5]);
    assert.deepEqual([data.resistanceEffect.ruleIndex, data.resistanceEffect.rule.key, data.resistanceEffect.expiry], [0, 'Resistance', 'current-turn']);
    assert.equal(plan.resolution.dataNotes, undefined);
    for (const [from, to] of [['resistance 5 to fire', 'resistance 10 to fire'], ['within 20 feet', 'within 20 feet, and you become Hidden'], ['are concealed to them.', 'are concealed to them. Each creature in it takes 1d4 fire damage.'], ['The resistance increases by 5.', 'The resistance increases by 10.'], ['inhale, or exhale', 'or inhale']])
        assert.notEqual(compile(withText(await spell('cantrip/eat-fire'), text => text.replace(from, to))).resolution.kind, 'cloud-action', from);
});

test('Protect Companion: PF2e\'s AC Effect on the eidolon or minion, and Life Block tiers read from PF2e\'s action', async () => {
    const {readBlockReaction, blockTiers} = await import('../src/compiler/granted-block.js');
    const plan = compile(await spell('cantrip/protect-companion'));
    const data = plan.resolution.grantedBlock;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.reaction.name, data.step.interval, data.step.reduction, data.step.hpLoss, data.lockout.seconds, data.recipients.join()],
        ['granted-block', 'automatic', 'Life Block', 2, 10, 5, 600, 'eidolon,minion']);
    const action = '<p><strong>Trigger</strong> The spell\'s target would take damage</p>\n<hr />\n<p><strong>Effect</strong> Reduce the triggering damage by 10, but you lose 5 Hit Points. Even if this reduces the damage to 0, the target still takes any effects that would come with the damage, such as the poison on a viper\'s fangs Strike.</p>';
    const base = readBlockReaction(action);
    assert.deepEqual(base, {reduction: 10, hpLoss: 5});
    assert.equal(readBlockReaction(action.replace('by 10', 'by 10 plus 1d4')), null);
    assert.deepEqual(blockTiers(base, data.step, 3).map(tier => [tier.reduction, tier.hpLoss]), [[10, 5], [20, 10]]);
    assert.deepEqual(blockTiers(base, data.step, 2).length, 1);
    for (const [from, to] of [['+1 circumstance bonus to AC', '+2 circumstance bonus to AC'], ['for 10 minutes', 'for 1 hour'], ['another 10, and you lose 5 more', 'another 10, and you lose 5 more. You also gain 5 temporary Hit Points'], ['until the start of your next turn.', 'until the start of your next turn. The target gains a +1 status bonus to saves.']])
        assert.notEqual(compile(withText(await spell('cantrip/protect-companion'), text => text.replace(from, to))).resolution.kind, 'granted-block', from);
});

test('Spirit Ward: the action count sets the recipients; PF2e\'s Effect with the count selected (data note: every spell)', async () => {
    const plan = compile(await spell('rank-1/spirit-ward'));
    const data = plan.resolution.actionModeEffect;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.modes[1].range, data.modes[2].rangeFeet, data.modes[2].livingBonus, data.modes[3].emanation, data.durationSeconds, data.choiceRuleIndex],
        ['action-mode-effect', 'automatic', 'touch', 30, 2, 30, 60, 0]);
    assert.deepEqual(data.ruleOverrides, [{index: 1, key: 'FlatModifier', patch: {predicate: [{or: ['origin:trait:haunt', 'origin:trait:spirit']}]}}]);
    assert.equal(plan.resolution.dataNotes, undefined);
    for (const [from, to] of [['a +1 status bonus', 'a +2 status bonus'], ['the bonus increases to +2', 'the bonus increases to +3'], ['This targets you and all your allies in the burst.', 'This targets all creatures in the burst.'], ['range of touch.', 'range of touch. The target also gains 5 temporary Hit Points.']])
        assert.notEqual(compile(withText(await spell('rank-1/spirit-ward'), text => text.replace(from, to))).resolution.kind, 'action-mode-effect', from);
});

test('Animate Rope: commands (two at cast, one per Sustain); Bind rolls against Reflex DC and applies PF2e\'s Speed Effect by degree', async () => {
    const {commandAttackPenalty} = await import('../src/compiler/command-list.js');
    const plan = compile(await spell('rank-1/animate-rope'));
    const data = plan.resolution.commandList;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.atCast, data.perSustain, data.attack.name, data.attack.defense, data.commands.map(command => command.name).join()],
        ['command-list', 'automatic', 2, 1, 'Bind', 'reflex', 'Coil,Crawl,Knot,Loop,Tie,Undo']);
    assert.deepEqual(['criticalSuccess', 'success', 'failure'].map(degree => commandAttackPenalty(data, degree)), [-20, -10, null]);
    assert.equal(compile(withText(await spell('rank-1/animate-rope'), text => text.replace('two commands when', 'three commands when'))).resolution.commandList.atCast, 3);
    for (const [from, to] of [['–10-foot circumstance', '–15-foot circumstance'], ['two commands when', 'two commands (four in combat) when'], ['forms a tidy, coiled stack.', 'forms a tidy, coiled stack and deals 1d4 damage.'], ["against the target's Reflex DC", "against the target's AC"]])
        assert.notEqual(compile(withText(await spell('rank-1/animate-rope'), text => text.replace(from, to))).resolution.kind, 'command-list', from);
});

test('Contagious Idea: a thought for 1 or 2 creatures; pleasant is PF2e\'s Effect with the text\'s temporary HP, terrifying its own save with row immunity', async () => {
    const {checkThoughtTargets} = await import('../src/compiler/thought-choice.js');
    const plan = compile(await spell('cantrip/contagious-idea'));
    const data = plan.resolution.thoughtChoice;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.modes.join(), data.rangeFeet, data.secondFeet, data.savePlan.resolution.kind, data.savePlan.resolution.check.statistic, data.savePlan.resolution.temporaryImmunity.degrees.join()],
        ['thought-choice', 'automatic', 'pleasant,terrifying', 30, 30, 'save', 'will', 'criticalSuccess,success']);
    const {thoughtTempHP} = await import('../src/compiler/thought-choice.js');
    assert.deepEqual([1, 2, 5].map(rank => thoughtTempHP(data.pleasant, rank)), [5, 6, 9]);
    assert.equal(plan.resolution.dataNotes, undefined);
    assert.equal(checkThoughtTargets({count: 2, selfIncluded: false, firstFromCaster: 10, secondFromFirst: 35}, data), 'the second target must be within 30 feet of the first');
    assert.equal(checkThoughtTargets({count: 1, selfIncluded: true, firstFromCaster: 0, secondFromFirst: 0}, data), "you can't choose yourself");
    assert.equal(checkThoughtTargets({count: 2, selfIncluded: false, firstFromCaster: 30, secondFromFirst: 30}, data), null);
    for (const [from, to] of [['within 30 feet of the first target', 'within 60 feet of the first target and 10 feet of you'], ['The target is unaffected and is temporarily immune for 1 minute.', 'The target is unaffected and is temporarily immune for 1 hour.'], ['that last for 1 minute.', 'that last for 1 minute. The target also gains a +1 status bonus to AC.'], ['increase by 1.', 'increase by 1, and the save DC increases by 1.']])
        assert.notEqual(compile(withText(await spell('cantrip/contagious-idea'), text => text.replace(from, to))).resolution.kind, 'thought-choice', from);
});

test('Frenzied Revelry: an emanation giving the caster and allies inside PF2e\'s Effect (radius and bonus by rank), with the critical rider', async () => {
    const {bonusAt, allyAuraStep} = await import('../src/compiler/ally-aura.js');
    const plan = compile(await spell('rank-1/frenzied-revelry'));
    const data = plan.resolution.allyAura;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.trait, data.durationSeconds, data.critical.label, data.critical.bonus, data.critical.rounds],
        ['ally-aura', 'automatic', 'mental', 60, 'Spell Effect: Frenzied Revelry (Critical)', 1, 1]);
    assert.deepEqual([1, 3, 4, 6, 7, 9].map(rank => [allyAuraStep(data, rank).radius, allyAuraStep(data, rank).bonus]), [[5, 1], [5, 1], [10, 2], [10, 2], [15, 3], [15, 3]]);
    assert.equal(bonusAt('ternary(gte(@item.level,7),3,ternary(gte(@item.level,4),2,1))', 5), 2);
    assert.deepEqual(data.ruleOverrides, [{index: 0, key: 'FlatModifier', patch: {selector: 'saving-throw'}}]);
    assert.equal(plan.resolution.dataNotes, undefined);
    for (const [from, to] of [['a +1 status bonus to saving throws', 'a +2 status bonus to saving throws'], ['the status bonus to saves is +2.', 'the status bonus to saves is +3.'], ['for 1 round.', 'for 1 round. You also gain 5 temporary Hit Points.'], ['You and your allies gain', 'You and all creatures gain']])
        assert.notEqual(compile(withText(await spell('rank-1/frenzied-revelry'), text => text.replace(from, to))).resolution.kind, 'ally-aura', from);
});

test('rule overrides: text-proved patches and removals on PF2e\'s Effect source, refused when the rule changed', async () => {
    globalThis.foundry ??= {utils: {deepClone: value => structuredClone(value)}};
    const {prepareNativeEffectSource} = await import('../scripts/native-outcome-effects.js');
    const template = {uuid: 'Compendium.x', _stats: {}, toObject: () => ({name: 'E', system: {rules: [{key: 'Resistance', type: 'fire', value: 5}, {key: 'FlatModifier', selector: 'will', value: 1}], level: {value: 1}}, flags: {}})};
    const source = prepareNativeEffectSource(template, {sourceItemName: 'S', ruleOverrides: [{index: 0, key: 'Resistance', remove: true}, {index: 1, key: 'FlatModifier', patch: {selector: 'saving-throw'}}]});
    assert.deepEqual(source.system.rules, [{key: 'FlatModifier', selector: 'saving-throw', value: 1}]);
    assert.throws(() => prepareNativeEffectSource(template, {sourceItemName: 'S', ruleOverrides: [{index: 0, key: 'TempHP', patch: {value: 5}}]}), /changed since it was compiled/);
});

test('turn-bound Effects: over when the combat turn or round moves on, the combat ends, or (outside combat) time passes', async () => {
    const {turnBoundEnded} = await import('../scripts/climb-aid-runtime.js');
    const bound = {combatId: 'c', round: 2, turn: 1};
    assert.equal(turnBoundEnded(bound, {id: 'c', round: 2, turn: 1}, 0), false);
    assert.equal(turnBoundEnded(bound, {id: 'c', round: 2, turn: 2}, 0), true);
    assert.equal(turnBoundEnded(bound, {id: 'c', round: 3, turn: 1}, 0), true);
    assert.equal(turnBoundEnded(bound, null, 0), true);
    assert.equal(turnBoundEnded({worldTime: 10}, null, 10), false);
    assert.equal(turnBoundEnded({worldTime: 10}, null, 16), true);
});

test('used-up Effects: which roll consumes an Effect the text allows once', async () => {
    const {rollConsumes} = await import('../scripts/climb-aid-runtime.js');
    const roll = (type, outcome = 'success', options = []) => ({type, outcome, options: new Set(options), weaponId: 'w1'});
    assert.equal(rollConsumes({on: 'attack-roll'}, roll('attack-roll')), true);
    assert.equal(rollConsumes({on: 'attack-roll'}, roll('saving-throw')), false);
    assert.equal(rollConsumes({on: 'saving-throw'}, roll('saving-throw')), true);
    const strike = {on: 'strike', weaponFlag: 'x'};
    assert.equal(rollConsumes(strike, roll('attack-roll', 'success', ['item:id:w1'])), false);
    assert.equal(rollConsumes(strike, roll('attack-roll', 'failure', ['item:id:w1'])), true);
    assert.equal(rollConsumes(strike, roll('damage-roll', 'success', ['item:id:w1'])), true);
    assert.equal(rollConsumes(strike, roll('damage-roll', 'success', ['item:id:other'])), false);
    assert.equal(rollConsumes({on: 'weapon-damage', weaponFlag: 'x'}, roll('attack-roll', 'failure', ['item:id:w1'])), false);
    assert.equal(rollConsumes({on: 'damage-roll', option: 'dismiss-x'}, roll('damage-roll', 'success', [])), false);
    assert.equal(rollConsumes({on: 'damage-roll', option: 'dismiss-x'}, roll('damage-roll', 'success', ['dismiss-x'])), true);
});

test('turn-bound "until the end of its next turn": over only after a later turn of that creature has passed', async () => {
    const {turnBoundEnded} = await import('../scripts/climb-aid-runtime.js');
    const bound = seen => ({combatId: 'c', actorUuid: 'A', startedAt: {round: 1, turn: 0}, seen});
    assert.equal(turnBoundEnded(bound(false), {id: 'c', combatant: {actor: {uuid: 'B'}}}, 0), false);
    assert.equal(turnBoundEnded(bound(true), {id: 'c', combatant: {actor: {uuid: 'A'}}}, 0), false);
    assert.equal(turnBoundEnded(bound(true), {id: 'c', combatant: {actor: {uuid: 'B'}}}, 0), true);
    assert.equal(turnBoundEnded(bound(false), null, 0), true);
});

test('first-Strike toggle: a weapon Strike\'s damage with the toggle on uses it (not unarmed, not with it off)', async () => {
    const {toggleUsed} = await import('../scripts/climb-aid-runtime.js');
    const toggle = {option: 'gravity-weapon', offAfter: 'weapon-damage'};
    assert.equal(toggleUsed(toggle, new Set(['gravity-weapon', 'item:type:weapon'])), true);
    assert.equal(toggleUsed(toggle, new Set(['item:type:weapon'])), false);
    assert.equal(toggleUsed(toggle, new Set(['gravity-weapon', 'item:type:weapon', 'item:category:unarmed'])), false);
});

test('persistent damage of a type: a caster mark ends when its target has none left', async () => {
    const {hasPersistentOf} = await import('../scripts/climb-aid-runtime.js');
    const persistent = type => ({slug: 'persistent-damage', system: {persistent: {damageType: type}}});
    assert.equal(hasPersistentOf([persistent('mental')], 'mental'), true);
    assert.equal(hasPersistentOf([persistent('fire')], 'mental'), false);
    assert.equal(hasPersistentOf([], 'mental'), false);
});

test('healing source: a healing spell\'s item id (not other healing)', async () => {
    const {healingSourceOf} = await import('../scripts/climb-aid-runtime.js');
    assert.equal(healingSourceOf(['item:type:spell', 'item:id:abc', 'vitality']), 'abc');
    assert.equal(healingSourceOf(['item:type:consumable', 'item:id:abc']), null);
    assert.equal(healingSourceOf([]), null);
});

test('Murmuration: the critical-failure penalty only on hostile rolls', async () => {
    const plan = compile(await spell('cantrip/murmuration'));
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.ruleOverrides, [{index: 0, key: 'FlatModifier', patch: {predicate: [{or: ['attack', 'item:trait:attack', 'target:enemy']}]}}]);
    assert.ok(!(plan.resolution.dataNotes ?? []).some(note => /not only hostile/.test(note)));
});

test('PF2e\'s modifier label for an Effect: no "Spell Effect:" prefix, no degree suffix', async () => {
    const {modifierLabel} = await import('../scripts/climb-aid-runtime.js');
    assert.equal(modifierLabel('Spell Effect: Curse of Recoil (Critical Failure)'), 'Curse of Recoil');
    assert.equal(modifierLabel('Effect: Aid'), 'Aid');
    assert.equal(modifierLabel('Bless'), 'Bless');
});

test('terrain areas (note-only before): difficult terrain on a placed burst, sized by actions, flying from the Heightened rank', async () => {
    const {terrainAt} = await import('../src/compiler/terrain-area.js');
    const toads = compile(await spell('rank-1/500-toads')), mud = compile(await spell('rank-1/mud-pit'));
    const works = compile(await spell('rank-1/earthworks')), warped = compile(await spell('rank-1/warped-terrain'));
    assert.deepEqual([toads, mud, works, warped].map(plan => plan.resolution.kind), ['terrain-area', 'terrain-area', 'terrain-area', 'terrain-area']);
    assert.deepEqual([toads.resolution.terrainArea.radius, toads.resolution.terrainArea.endsAt, toads.resolution.terrainArea.notes.length], [15, 'caster-turn-start', 2]);
    assert.deepEqual([mud.resolution.terrainArea.radius, mud.resolution.terrainArea.durationSeconds], [15, 60]);
    assert.deepEqual([1, 2, 3].map(actions => terrainAt(works.resolution.terrainArea, {actions}).radius), [5, 10, 15]);
    assert.deepEqual([1, 2, 3].map(actions => terrainAt(warped.resolution.terrainArea, {actions}).radius), [5, 10, 15]);
    assert.deepEqual([terrainAt(works.resolution.terrainArea, {castRank: 3}).movement, terrainAt(works.resolution.terrainArea, {castRank: 4}).movement], [['walk'], ['walk', 'fly']]);
    for (const [path, from, to] of [['rank-1/mud-pit', 'The mud is difficult terrain.', 'The mud is difficult terrain. Creatures in it take 1d4 damage.'], ['rank-1/earthworks', 'if you spent 2 actions', 'if you spent 2 actions and 1 reaction'], ['rank-1/warped-terrain', 'to a maximum of 10 extra feet', 'to a maximum of 20 extra feet']])
        assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, 'terrain-area', from);
});

test('stated check bonuses (note-only before): Fashionista, Groom Companion, Root Reading', async () => {
    const {bonusValueAt} = await import('../src/compiler/bonus-effect.js');
    const fashion = compile(await spell('rank-1/fashionista')).resolution, groom = compile(await spell('rank-1/groom-companion')).resolution, root = compile(await spell('cantrip/root-reading')).resolution;
    assert.deepEqual([fashion.kind, fashion.bonusEffect.recipient, fashion.bonusEffect.bonuses[0].selector, fashion.bonusEffect.bonuses[0].predicate, fashion.bonusEffect.dismissible, fashion.bonusEffect.spellSeconds],
        ['bonus-effect', 'target', 'deception', ['action:create-a-diversion'], true, 3600]);
    assert.deepEqual([1, 2, 3, 5, 7, 9].map(rank => bonusValueAt(fashion.bonusEffect, fashion.bonusEffect.bonuses[0], rank)), [1, 1, 2, 3, 4, 4]);
    assert.deepEqual([groom.kind, groom.bonusEffect.recipient, groom.bonusEffect.bonuses[0].selector, groom.bonusEffect.spellSeconds], ['bonus-effect', 'companion', 'performance', 28800]);
    assert.deepEqual(root.bonusEffect.bonuses.map(bonus => [bonus.selector, bonus.predicate[0], bonus.duration]), [['perception', 'action:seek', 'until-end-of-next-turn'], ['survival', 'action:track', 'next-check']]);
    for (const [path, from, to] of [['rank-1/fashionista', '+1 status bonus', '+1 status bonus and 5 temporary Hit Points'], ['rank-1/groom-companion', 'Performance checks.', 'Performance checks and saving throws.'], ['cantrip/root-reading', 'to the initial check.', 'to the initial check. Each creature there takes 1d4 damage.']])
        assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, 'bonus-effect', from);
});

test('roll families (note-only before): Diviner\'s Sight, Read Fate, Fact Check, Nudge Fate', async () => {
    const sight = compile(await spell('rank-1/diviners-sight')).resolution, fate = compile(await spell('rank-1/read-fate')).resolution;
    const fact = compile(await spell('rank-1/fact-check')).resolution, nudge = compile(await spell('cantrip/nudge-fate')).resolution;
    assert.deepEqual([sight.kind, sight.substituteRoll.selectors.join(), sight.substituteRoll.notSecret], ['substitute-roll', 'saving-throw,skill-check', true]);
    assert.deepEqual([fate.kind, fate.secretFlatCheck.dc, fate.secretFlatCheck.immunityHours], ['secret-flat-check', 6, 24]);
    assert.deepEqual([fact.kind, fact.repeatCheck.rangeFeet, Object.keys(fact.repeatCheck.outcomes).join()], ['repeat-check', 30, 'criticalSuccess,success,failure']);
    assert.deepEqual([nudge.kind, nudge.retroBonus.value, nudge.retroBonus.rolls.join()], ['retro-bonus', 1, 'attack-roll,spell-attack-roll,skill-check,saving-throw']);
    for (const [path, from, to, kind] of [['rank-1/diviners-sight', 'Roll a d20', 'Roll 2d20', 'substitute-roll'], ['rank-1/read-fate', 'dc:6', 'dc:6|traits:secret] and a Will save [[/r 1d4', 'secret-flat-check'],
        ['rank-1/fact-check', 'Attempt a check using the same skill', 'Attempt a check with a +2 bonus using the same skill', 'repeat-check'], ['cantrip/nudge-fate', 'The spell then ends.', 'The spell then ends, and the target takes 1d4 damage.', 'retro-bonus']])
        assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, kind, from);
});

test('a used roll substitution: a save or skill check without a d20', async () => {
    const {rollConsumes} = await import('../scripts/climb-aid-runtime.js');
    const roll = (type, substituted) => ({type, outcome: 'success', options: new Set(), weaponId: null, substituted});
    assert.equal(rollConsumes({on: 'substituted-check'}, roll('saving-throw', true)), true);
    assert.equal(rollConsumes({on: 'substituted-check'}, roll('saving-throw', false)), false);
    assert.equal(rollConsumes({on: 'substituted-check'}, roll('attack-roll', true)), false);
});

test('damage reactions (note-only before): Protector\'s Sacrifice, Delay Consequence, Interposing Earth', async () => {
    const {redirectAt} = await import('../src/compiler/damage-reactions.js');
    const {turnBoundEnded} = await import('../scripts/climb-aid-runtime.js');
    const sacrifice = compile(await spell('rank-1/protectors-sacrifice')).resolution, delay = compile(await spell('rank-1/delay-consequence')).resolution, earth = compile(await spell('rank-1/interposing-earth')).resolution;
    assert.deepEqual([sacrifice.kind, sacrifice.redirectDamage.rangeFeet, [1, 2, 4].map(rank => redirectAt(sacrifice.redirectDamage, rank)).join()], ['redirect-damage', 30, '3,6,12']);
    assert.deepEqual([delay.kind, delay.delayedDamage.dismissible], ['delayed-damage', true]);
    assert.deepEqual([earth.kind, earth.interposingCover.reduction, earth.interposingCover.raised, earth.interposingCover.notes.length], ['interposing-cover', 2, {rank: 4, reduction: 8, hardness: 8, hp: 20}, 3]);
    const bound = {combatId: 'c', untilStartOf: 'C', startedAt: {round: 1, turn: 1}};
    assert.equal(turnBoundEnded(bound, {id: 'c', round: 1, turn: 2, combatant: {actor: {uuid: 'X'}}}, 0), false);
    assert.equal(turnBoundEnded(bound, {id: 'c', round: 2, turn: 0, combatant: {actor: {uuid: 'C'}}}, 0), true);
    for (const [path, from, to, kind] of [['rank-1/protectors-sacrifice', 'by 3.', 'by 3 and you gain 3 temporary Hit Points.', 'redirect-damage'], ['rank-1/delay-consequence', 'You can Dismiss this spell.', 'You can Dismiss this spell. The target is also Slowed 1.', 'delayed-damage'],
        ['rank-1/interposing-earth', 'reduced by 2.', 'reduced by 2, and the attacker is Off-Guard.', 'interposing-cover']])
        assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, kind, from);
});

test('Strike spells (note-only before): the requirement, the count, a first action, notes', async () => {
    const {weaponQualifies} = await import('../src/compiler/spell-strike.js');
    const of = async path => compile(await spell(path)).resolution;
    const shielding = await of('rank-1/shielding-strike'), spinning = await of('rank-1/spinning-staff'), dimensional = await of('rank-1/dimensional-assault'), sky = await of('rank-1/sky-laughs-at-waves'), star = await of('rank-1/shooting-star');
    assert.deepEqual([shielding, spinning, dimensional, sky, star].map(plan => plan.kind), Array(5).fill('spell-strike'));
    assert.deepEqual([shielding.spellStrike.preAction, spinning.spellStrike.count, spinning.spellStrike.differentTargets, dimensional.spellStrike.movement, sky.spellStrike.weapon, star.spellStrike.range],
        ['raise-a-shield', 2, true, 'teleport', {group: 'sword', hands: 1}, 'ranged']);
    assert.ok(spinning.spellStrike.notes.some(note => /Spellstrike/.test(note)));
    assert.equal(weaponQualifies({group: 'sword', hands: 1}, {group: 'sword', hands: 1}), true);
    assert.equal(weaponQualifies({group: 'sword', hands: 1}, {group: 'sword', hands: 2}), false);
    assert.equal(weaponQualifies({rangedOrThrown: true}, {ranged: false, thrown: true}), true);
    assert.equal(weaponQualifies({baseItem: 'staff'}, {baseItem: 'longsword', group: 'sword'}), false);
    for (const [path, from, to] of [['rank-1/shielding-strike', 'Then, make a melee Strike.', 'Then, make two melee Strikes.'], ['rank-1/shooting-star', 'until the start of your next turn.', 'until the start of your next turn, and it takes 1d6 fire damage.']])
        assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, 'spell-strike', from);
});

test('action families (note-only before): Cackle, Friendfetch, Liberating Command, Bone Shield', async () => {
    const {pullPath, spellShieldHardness} = await import('../src/compiler/action-families.js');
    const of = async path => compile(await spell(path)).resolution;
    const cackle = await of('rank-1/cackle'), fetch = await of('rank-1/friendfetch'), liberate = await of('rank-1/liberating-command'), bone = await of('rank-1/bone-shield');
    assert.deepEqual([cackle.kind, fetch.kind, liberate.kind, bone.kind], ['sustain-other', 'pull-toward', 'prompt-escape', 'spell-shield']);
    assert.deepEqual([fetch.pullToward.rangeFeet, fetch.pullToward.maxTargets, liberate.promptEscape.conditions.join()], [30, 2, 'grabbed,immobilized,restrained']);
    assert.deepEqual([bone.spellShield.acBonus, bone.spellShield.hp, [1, 3, 5].map(rank => spellShieldHardness(bone.spellShield, rank)).join(), bone.spellShield.durationSeconds], [2, 1, '3,6,9', 60]);
    assert.deepEqual(pullPath({x: 0, y: 0}, {x: 400, y: 0}, 100), [{x: 100, y: 0}, {x: 200, y: 0}, {x: 300, y: 0}]);
    assert.deepEqual(pullPath({x: 0, y: 0}, {x: 100, y: 0}, 100), []);
    for (const [path, from, to, kind] of [['rank-1/friendfetch', 'This is forced movement.', 'This is forced movement, and each target takes 1d4 damage.', 'pull-toward'], ['rank-1/bone-shield', 'Hardness 3 and 1 HP', 'Hardness 3 and 5 HP', null]])
        if (kind) assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, kind, from);
    assert.equal(compile(withText(await spell('rank-1/bone-shield'), text => text.replace('Hardness 3 and 1 HP', 'Hardness 3 and 5 HP'))).resolution.spellShield.hp, 5);
});

test('check helpers (note-only before): Extend Boost, Lingering Composition, Share Burden, Counter Performance, Foresee the Path', async () => {
    const {levelDC} = await import('../src/compiler/check-helpers.js');
    const of = async path => compile(await spell(path)).resolution;
    const boost = await of('rank-1/extend-boost'), linger = await of('rank-1/lingering-composition'), burden = await of('rank-1/share-burden'), counter = await of('rank-1/counter-performance'), foresee = await of('cantrip/foresee-the-path');
    assert.deepEqual([boost.kind, boost.spellshapeDuration.next.spells.join(), boost.spellshapeDuration.skill, boost.spellshapeDuration.dc, boost.spellshapeDuration.durations.criticalSuccess.rounds, boost.spellshapeDuration.durations.failure.refund],
        ['spellshape-duration', 'Boost Eidolon,Reinforce Eidolon', 'tradition', 'caster-level', 4, true]);
    assert.deepEqual([linger.spellshapeDuration.next.trait, linger.spellshapeDuration.skill, linger.spellshapeDuration.dc], ['composition', 'performance', 'highest-target-level']);
    assert.deepEqual([burden.kind, burden.sharedSaveBetter.trait, counter.kind, counter.saveReplacement.rangeFeet, foresee.kind, foresee.perceptionAgainstDC.bonus.criticalSuccess, foresee.perceptionAgainstDC.bonus.success],
        ['shared-save-better', 'emotion', 'save-replacement', 60, 'perception-against-dc', 2, 1]);
    assert.deepEqual([1, 3, 10, 20].map(levelDC), [15, 18, 27, 40]);
    for (const [path, from, to, kind] of [['rank-1/extend-boost', 'The spell lasts 3 rounds.', 'The spell lasts 3 rounds and you gain 5 temporary Hit Points.', 'spellshape-duration'],
        ['rank-1/share-burden', 'one degree of success better', 'two degrees of success better', 'shared-save-better'], ['cantrip/foresee-the-path', 'is +1.', 'is +3.', null]])
        if (kind) assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, kind, from);
    assert.equal(compile(withText(await spell('cantrip/foresee-the-path'), text => text.replace('is +1.', 'is +3.'))).resolution.perceptionAgainstDC.bonus.success, 3);
});

test('rule Effects (note-only before): Song of Marching, Share Lore, Tentacular Limbs', async () => {
    const {sharedLoreAt} = await import('../src/compiler/rule-effects.js');
    const song = compile(await spell('cantrip/song-of-marching')).resolution, lore = compile(await spell('rank-1/share-lore')).resolution, limbs = compile(await spell('rank-1/tentacular-limbs')).resolution;
    assert.deepEqual([song.kind, song.marchingSong.radius, song.marchingSong.initiative.value, song.marchingSong.casterStatistic, song.marchingSong.immunityDays], ['marching-song', 60, 1, 'performance', 1]);
    assert.deepEqual([lore.kind, lore.sharedLore.base.targets, lore.sharedLore.base.seconds], ['shared-lore', 3, 600]);
    assert.deepEqual([1, 3, 5].map(rank => { const at = sharedLoreAt(lore.sharedLore, rank); return [at.targets, at.seconds, at.lores]; }), [[3, 600, 1], [5, 3600, 1], [5, 28800, 2]]);
    assert.deepEqual([limbs.kind, limbs.unarmedReach.trait, limbs.unarmedReach.durationSeconds], ['unarmed-reach', 'reach', 60]);
    for (const [path, from, to, kind] of [['cantrip/song-of-marching', '+1 status bonus', '+2 status bonus and 5 temporary Hit Points', 'marching-song'], ['rank-1/share-lore', 'become trained', 'become expert', 'shared-lore'], ['rank-1/tentacular-limbs', 'to 10 feet.', 'to 15 feet.', 'unarmed-reach']])
        assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, kind, from);
});

test('wards (note-only before): Sanctuary\'s attacker saves, Protector Tree\'s absorbing Hit Points', async () => {
    const {absorberHp, isStrikeDamage} = await import('../src/compiler/ward-families.js');
    const sanctuary = compile(await spell('rank-1/sanctuary')).resolution, tree = compile(await spell('rank-1/protector-tree')).resolution;
    assert.deepEqual([sanctuary.kind, sanctuary.attackWard.save, sanctuary.attackWard.durationSeconds, sanctuary.attackWard.rows.criticalFailure], ['attack-ward', 'will', 60, 'barred']);
    assert.deepEqual([tree.kind, tree.strikeAbsorber.ac, [1, 2, 4].map(rank => absorberHp(tree.strikeAbsorber, rank)).join()], ['strike-absorber', 10, '10,20,40']);
    assert.equal(isStrikeDamage(['item:type:weapon']), true);
    assert.equal(isStrikeDamage(['item:type:melee']), true);
    assert.equal(isStrikeDamage(['item:type:spell', 'item:type:weapon']), false);
    assert.equal(isStrikeDamage([]), false);
    for (const [path, from, to, kind] of [['rank-1/sanctuary', 'must attempt a Will save each time', 'must attempt a Will save each time and take 1d4 damage', 'attack-ward'], ['rank-1/protector-tree', 'takes the damage first.', 'takes the damage first and heals the ally 1d4.', 'strike-absorber']])
        assert.notEqual(compile(withText(await spell(path), text => text.replace(from, to))).resolution.kind, kind, from);
});

test('summons (note-only before): the trait, the summon-trait levels, Lesser Servitor\'s list and animal traits, Phantasmal Minion', async () => {
    const {summonEligible, summonMaxLevel, SUMMON_LEVELS} = await import('../src/compiler/summon-families.js');
    const animal = compile(await spell('rank-1/summon-animal'));
    assert.deepEqual([animal.resolution.kind, animal.automation.level], ['summon', 'automatic']);
    const data = animal.resolution.summon;
    assert.deepEqual([data.traits, data.rangeFeet, data.durationSeconds, data.sustained, data.rarity], [['animal'], 30, 60, true, 'common']);
    assert.deepEqual([1, 2, 3, 5, 10].map(rank => summonMaxLevel(data, rank)), [-1, 1, 2, 5, 15]);
    assert.equal(SUMMON_LEVELS[4], 3);
    const wolf = {type: 'npc', system: {details: {level: {value: 1}}, traits: {value: ['animal'], rarity: 'common'}}};
    assert.deepEqual([summonEligible(data, wolf, {castRank: 1}), summonEligible(data, wolf, {castRank: 2})], [false, true]);
    assert.equal(summonEligible(data, {...wolf, system: {...wolf.system, traits: {value: ['animal'], rarity: 'uncommon'}}}, {castRank: 2}), false);
    assert.equal(summonEligible(data, {...wolf, type: 'character'}, {castRank: 2}), false);
    assert.deepEqual(compile(await spell('rank-1/summon-plant-or-fungus')).resolution.summon.traits, ['plant', 'fungus']);
    assert.equal(compile(await spell('rank-2/summon-elemental')).resolution.summon.levels.baseRank, 2);
    // Summon Dragon: a dragon with another tradition trait is refused.
    const dragon = compile(await spell('rank-5/summon-dragon')).resolution.summon;
    const primal = {type: 'npc', system: {details: {level: {value: 4}}, traits: {value: ['dragon', 'primal'], rarity: 'common'}}};
    assert.deepEqual([dragon.traditionMatch, summonEligible(dragon, primal, {castRank: 5, tradition: 'arcane'}), summonEligible(dragon, primal, {castRank: 5, tradition: 'primal'})], [true, false, true]);
    // Summon Lesser Servitor: celestial/fiend/monitor, or an animal that gains chosen traits; its heightened levels.
    const servitor = compile(await spell('rank-1/summon-lesser-servitor')).resolution.summon;
    assert.deepEqual([servitor.traits, servitor.animal.traitChoices], [['celestial', 'fiend', 'monitor'], [['celestial', 'holy'], ['fiend', 'unholy'], ['monitor']]]);
    assert.deepEqual([1, 2, 4, 6].map(rank => summonMaxLevel(servitor, rank)), [-1, 1, 3, 3]);
    assert.equal(summonEligible(servitor, {type: 'npc', system: {details: {level: {value: -1}}, traits: {value: ['animal'], rarity: 'common'}}}, {castRank: 1}), true);
    // Phantasmal Minion: the named creature, sustained up to 10 minutes.
    const minion = compile(await spell('rank-1/phantasmal-minion')).resolution.summon;
    assert.deepEqual([minion.actorUuid, minion.rangeFeet, minion.durationSeconds], ['Compendium.pf2e.pathfinder-bestiary.Actor.j7NNPfZwD19BwSEZ', 60, 600]);
    // Kept strict: a stated level off the summon table, or an extra rule.
    const source = await spell('rank-1/summon-animal');
    assert.notEqual(compile(withText(source, text => text.replace('is –1', 'is 1'))).resolution.kind, 'summon');
    assert.notEqual(compile(withText(source, text => text.replace('to fight for you.', 'to fight for you. It gains a +1 status bonus to attack rolls.'))).resolution.kind, 'summon');
});

test('rule sets (note-only before): Unfetter Eidolon, Healing Plaster, Time Sense, Glamorize, Unbroken Panoply', async () => {
    const {ruleSetRules} = await import('../src/compiler/rule-sets.js');
    const {rollConsumes} = await import('../scripts/climb-aid-runtime.js').catch(() => ({}));
    const kinds = {};
    for (const path of ['rank-1/unfetter-eidolon', 'cantrip/healing-plaster', 'cantrip/time-sense', 'cantrip/glamorize', 'rank-1/unbroken-panoply']) {
        const plan = compile(await spell(path));
        kinds[path] = [plan.resolution.kind, plan.automation.level];
    }
    assert.ok(Object.values(kinds).every(([kind, level]) => kind === 'rule-set' && level === 'automatic'), JSON.stringify(kinds));
    const eidolon = compile(await spell('rank-1/unfetter-eidolon')).resolution.ruleSet;
    assert.deepEqual([eidolon.recipient, eidolon.seconds, eidolon.rules[0].selector, eidolon.rules[0].value], ['eidolon', 60, 'saving-throw', 1]);
    assert.deepEqual([eidolon.rules[1].selector, eidolon.rules[1].predicate[0].or], ['fortitude-dc', ['unfetter-eidolon-restraint', 'action:grapple', 'action:reposition']]);
    // Healing Plaster: +1 item to Medicine from 3rd rank only; used up by the check; one plaster at a time.
    const plaster = compile(await spell('cantrip/healing-plaster')).resolution.ruleSet;
    assert.deepEqual([ruleSetRules(plaster, 1).length, ruleSetRules(plaster, 3)[0].selector, ruleSetRules(plaster, 3)[0].type, plaster.replacesPrevious], [0, 'medicine', 'item', true]);
    assert.deepEqual(plaster.consumeOn.options, ['action:administer-first-aid', 'action:treat-wounds']);
    // Time Sense: a same-turn toggle, used up by the roll it's on for, then immune for 1 hour.
    const timing = compile(await spell('cantrip/time-sense')).resolution.ruleSet;
    assert.deepEqual([timing.turnOnly, timing.consumeOn.on, timing.immunity], [true, 'check-with-option', {hours: 1, onlyWhenUsed: true}]);
    assert.deepEqual(timing.rules[0].selector, ['attack-roll', 'perception', 'saving-throw', 'skill-check']);
    if (rollConsumes) {
        assert.equal(rollConsumes(timing.consumeOn, {type: 'perception-check', options: new Set(['time-sense-precise-timing'])}), true);
        assert.equal(rollConsumes(timing.consumeOn, {type: 'perception-check', options: new Set()}), false);
        assert.equal(rollConsumes(plaster.consumeOn, {type: 'skill-check', options: new Set(['action:treat-wounds'])}), true);
        assert.equal(rollConsumes(plaster.consumeOn, {type: 'skill-check', options: new Set(['action:recall-knowledge'])}), false);
    }
    // Glamorize: the GM's toggle, +1 status to the skill check.
    const glamor = compile(await spell('cantrip/glamorize')).resolution.ruleSet;
    assert.deepEqual([glamor.toggle.option, glamor.rules[0].selector, glamor.seconds], ['glamorize-task', 'skill-check', 3600]);
    // Unbroken Panoply: nonlethal on the chosen weapon, its potency to Diplomacy.
    const panoply = compile(await spell('rank-1/unbroken-panoply')).resolution.ruleSet;
    assert.deepEqual(panoply.rules.map(rule => rule.key), ['AdjustStrike', 'FlatModifier']);
    // Kept strict.
    const source = await spell('cantrip/time-sense');
    assert.notEqual(compile(withText(source, text => text.replace('+1 status bonus', '+2 status bonus to damage and a +1 status bonus'))).resolution.kind, 'rule-set');
    assert.notEqual(compile(withText(await spell('cantrip/glamorize'), text => text.replace('certain tasks', 'certain tasks and deals 1d4 damage'))).resolution.kind, 'rule-set');
});

test('items (note-only before): Summon Instrument and Arms of Nature conjured, Mending restores an item\'s Hit Points', async () => {
    const {conjuredAt, mendable} = await import('../src/compiler/item-families.js');
    const instrument = compile(await spell('cantrip/summon-instrument'));
    assert.deepEqual([instrument.resolution.kind, instrument.automation.level], ['conjured-item', 'automatic']);
    const inst = instrument.resolution.conjuredItem;
    assert.deepEqual([conjuredAt(inst, 1).item.name, conjuredAt(inst, 5).item.name, inst.replacesPrevious, inst.seconds], ['Musical Instrument (Handheld)', 'Musical Instrument (Virtuoso handheld)', true, 3600]);
    const arms = compile(await spell('rank-1/arms-of-nature')).resolution.conjuredItem;
    assert.deepEqual([1, 3, 5, 7].map(rank => [conjuredAt(arms, rank).runes.potency, conjuredAt(arms, rank).runes.striking]), [[1, 0], [1, 1], [2, 1], [3, 2]]);
    assert.equal(arms.weapon.maxBulk, 2);
    const mending = compile(await spell('rank-1/mending'));
    assert.deepEqual([mending.resolution.kind, mending.resolution.itemRepair.perRank], ['item-repair', 5]);
    const data = mending.resolution.itemRepair;
    const buckler = {bulk: 0.1, magical: false, hp: {value: 2, max: 6}}, shield = {bulk: 1, magical: false, hp: {value: 5, max: 20}}, magic = {bulk: 1, magical: true, hp: {value: 5, max: 20}};
    assert.deepEqual([mendable(data, buckler, 1), mendable(data, shield, 1), mendable(data, shield, 2), mendable(data, magic, 2), mendable(data, magic, 3)], [true, false, true, false, true]);
    assert.equal(mendable(data, {...buckler, hp: {value: 0, max: 6}}, 1), false, 'destroyed');
    assert.equal(mendable(data, {...buckler, hp: {value: 6, max: 6}}, 1), false, 'undamaged');
    // Kept strict.
    assert.notEqual(compile(withText(await spell('rank-1/mending'), text => text.replace('5 Hit Points', '5 Hit Points and 1d4 fire damage'))).resolution.kind, 'item-repair');
    assert.notEqual(compile(withText(await spell('cantrip/summon-instrument'), text => text.replace('plays only for you.', 'plays only for you and grants a +1 bonus.'))).resolution.kind, 'conjured-item');
});

test('checks and actions (note-only before): Dim the Light\'s Hide, Omnidirectional Scan\'s Aid, Reed Whistle, Darkened Forest Form', async () => {
    const plans = Object.fromEntries(await Promise.all(['rank-1/dim-the-light', 'cantrip/omnidirectional-scan', 'rank-1/reed-whistle', 'rank-1/darkened-forest-form'].map(async path => [path, compile(await spell(path))])));
    assert.deepEqual(Object.values(plans).map(plan => [plan.resolution.kind, plan.automation.level]), [['hide-reaction', 'automatic'], ['aid-attack', 'automatic'], ['seek-whistle', 'automatic'], ['form-choice', 'automatic']]);
    const dim = plans['rank-1/dim-the-light'].resolution.hideReaction;
    assert.deepEqual([dim.noCoverNeeded, dim.endsAtTurnEnd], [true, true]);
    const scan = plans['cantrip/omnidirectional-scan'].resolution.aidAttack;
    assert.deepEqual([scan.radius, scan.statistic, scan.dc, scan.critFailToFailure], [30, 'spell-attack', 15, true]);
    const whistle = plans['rank-1/reed-whistle'].resolution.seekWhistle;
    assert.deepEqual([whistle.hours, whistle.steps, whistle.costHours, whistle.bonus, whistle.rounds], [1, [{minRank: 3, hours: 4}], 1, {type: 'circumstance', value: 2}, '1d4']);
    const form = plans['rank-1/darkened-forest-form'].resolution.formChoice;
    assert.deepEqual(form.forms.map(entry => [entry.name, entry.minRank]), [['Pest Form', 1], ['Animal Form', 2], ['Elemental Form', 5]]);
    assert.deepEqual([form.seconds, form.sustained], [60, true]);
    // Kept strict.
    assert.notEqual(compile(withText(await spell('rank-1/dim-the-light'), text => text.replace('slip from sight.', 'slip from sight and deal 1d4 damage.'))).resolution.kind, 'hide-reaction');
    assert.notEqual(compile(withText(await spell('cantrip/omnidirectional-scan'), text => text.replace('you get a failure instead.', 'you get a success instead.'))).resolution.kind, 'aid-attack');
    assert.notEqual(compile(withText(await spell('rank-1/reed-whistle'), text => text.replace('+2 circumstance', '+2 status'))).resolution.kind, 'seek-whistle');
});

test('saves and areas (note-only before): Verminous Lure\'s bystander saves, Extradimensional Cover\'s square, Perfected Mind\'s new save', async () => {
    const {lured} = await import('../src/compiler/area-saves.js');
    const lure = compile(await spell('rank-1/verminous-lure'));
    assert.deepEqual([lure.resolution.kind, lure.resolution.lureSave.save, lure.resolution.lureSave.rangeFeet, lure.resolution.lureSave.seconds], ['lure-save', 'will', 30, 600]);
    const data = lure.resolution.lureSave;
    assert.deepEqual([lured(data, {traits: ['animal'], size: 'tiny'}), lured(data, {traits: ['animal', 'swarm'], size: 'lg'}), lured(data, {traits: ['animal'], size: 'sm'}), lured(data, {traits: ['swarm'], size: 'tiny'})], [true, true, false, false]);
    const cover = compile(await spell('rank-1/extradimensional-cover'));
    assert.deepEqual([cover.resolution.kind, cover.resolution.coverSquare.degree, cover.resolution.coverSquare.size, cover.resolution.coverSquare.rules.map(rule => [rule.selector, rule.value])],
        ['cover-square', 'standard', 5, [['ac', 2], ['reflex', 2], ['stealth', 2]]]);
    const mind = compile(await spell('rank-1/perfected-mind'));
    assert.deepEqual([mind.resolution.kind, mind.resolution.saveRetry], ['save-retry', {save: 'will', trait: 'mental', keepBetter: true, oncePerEffect: true}]);
    // Kept strict.
    assert.notEqual(compile(withText(await spell('rank-1/extradimensional-cover'), text => text.replace('standard cover', 'standard cover and 1d6 fire damage'))).resolution.kind, 'cover-square');
    assert.notEqual(compile(withText(await spell('rank-1/perfected-mind'), text => text.replace('in which case nothing happens.', 'in which case you take 1d6 mental damage.'))).resolution.kind, 'save-retry');
});

test('scene features (note-only before): Wall of Shrubs\' line and terrain by rank, House of Imaginary Walls\' movement wall, Hologram Cage\'s sight walls', async () => {
    const {shrubsAt, wallSegments} = await import('../src/compiler/scene-features.js');
    const shrubs = compile(await spell('rank-1/wall-of-shrubs'));
    assert.deepEqual([shrubs.resolution.kind, shrubs.automation.level], ['shrub-wall', 'automatic']);
    const data = shrubs.resolution.shrubWall;
    assert.deepEqual([1, 3, 5].map(rank => [shrubsAt(data, rank).cover, shrubsAt(data, rank).terrain, shrubsAt(data, rank).seconds]), [['lesser', false, 60], ['standard', true, 600], ['greater', true, 3600]]);
    const house = compile(await spell('cantrip/house-of-imaginary-walls')).resolution.sceneWalls;
    assert.deepEqual([house.shape, house.lengthFeet, house.blocksMove, house.blocksSight, house.seconds, house.stats], ['plane', 10, true, false, 6, {ac: 10, hardnessPerRank: 2, hpPerRank: 4}]);
    const cage = compile(await spell('cantrip/hologram-cage')).resolution.sceneWalls;
    assert.deepEqual([cage.shape, cage.sizeFeet, cage.blocksMove, cage.blocksSight, cage.light, cage.replacesPrevious, cage.steps[0].sizeFeet], ['cube', 20, false, true, {bright: 10, dim: 30}, true, 25]);
    assert.deepEqual(wallSegments({type: 'rectangle', x: 0, y: 0, width: 400, height: 400}, 'cube').length, 4);
    assert.deepEqual(wallSegments({type: 'rectangle', x: 0, y: 0, width: 200, height: 100}, 'plane'), [[0, 50, 200, 50]]);
    // Kept strict.
    assert.notEqual(compile(withText(await spell('rank-1/wall-of-shrubs'), text => text.replace('providing lesser cover.', 'providing lesser cover and dealing 1d4 piercing damage.'))).resolution.kind, 'shrub-wall');
    assert.notEqual(compile(withText(await spell('cantrip/house-of-imaginary-walls'), text => text.replace('even incorporeal creatures.', 'even incorporeal creatures, which take 1d6 mental damage.'))).resolution.kind, 'scene-walls');
});
