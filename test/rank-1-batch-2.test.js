import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {parseDegreeRider} from '../src/compiler/basic-degree-rider.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: rules.some(r => r.key === 'ChoiceSet'), removesAfterRoll: rules.some(r => r.removeAfterRoll != null)},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}
function mergeDeep(target, patch) {
    for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value;
    return target;
}
/** The PF2e variant for an action count, as PF2e builds it from the overlay. */
function variant(source, time) {
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.system?.time?.value === time);
    const item = structuredClone(source);
    item.system = mergeDeep(item.system, structuredClone(overlay.system));
    delete item.system.overlays;
    for (const entry of Object.values(item.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    return item;
}

test('basic-save riders: "it\'s also" and a narrated participle before the condition', () => {
    assert.ok(parseDegreeRider("If a target critically fails the save, it's also @UUID[Compendium.pf2e.conditionitems.Item.9PR9y0bi4JPKnHPR]{Deafened} for 1 minute."));
    assert.ok(parseDegreeRider('A creature that critically fails its save is disoriented by the explosion of water, becoming @UUID[Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg]{Off-Guard} until the end of your next turn.'));
    // A narration that carries a rule is refused.
    assert.equal(parseDegreeRider('A creature that critically fails its save is pushed by the water 10 feet, becoming @UUID[Compendium.pf2e.conditionitems.Item.AJh5ex99aV6VTggg]{Off-Guard} until the end of your next turn.'), null);
});

test('Spout: Off-Guard on a critical failure, and its water-burst area as a card choice', async () => {
    const plan = compileAbility(await spell('cantrip/spout'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].slug, 'off-guard');
    assert.equal(plan.resolution.reminders[0].kind, 'area-choice');
    assert.match(plan.resolution.reminders[0].text, /5-foot cube or, centred in a body of water, a 5-foot burst/);
    // Haunting Hymn's "only creatures in the area can hear" is narration since cantrip/rank-1 batch 1 (who notices the spell).
    assert.equal(supported(compileAbility(await spell('cantrip/haunting-hymn'))), true);
});

test('Frostbite: its Effect on a critical failure gives the weakness the rider states', async () => {
    const plan = compileAbility(await spell('cantrip/frostbite'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const rule = plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule;
    assert.deepEqual([rule.kind, rule.types, rule.value, rule.durationAnchor], ['weakness-effect', ['bludgeoning'], 1, 'source-turn']);
    assert.equal(plan.resolution.outcomes.failure.nativeEffects?.length ?? 0, 0);
    // A rider claiming more weakness than the Effect gives is refused.
    const wrong = await spell('cantrip/frostbite');
    wrong.system.description.value = wrong.system.description.value.replace('weakness 1 to bludgeoning', 'weakness 2 to bludgeoning');
    assert.equal(supported(compileAbility(wrong, {nativeEffectCatalog: await catalog()})), false);
});

test('Cry of Destruction: the caster answers the d12 question; unattended objects are a GM reminder', async () => {
    const plan = compileAbility(await spell('rank-1/cry-of-destruction'));
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    assert.equal(plan.resolution.diceUpgrade.faces, 12);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['object-damage']);
    // PF2e's "(Dealt Damage)" variant already rolls d12s: no question.
    const source = await spell('rank-1/cry-of-destruction');
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.name === 'Cry of Destruction (Dealt Damage)');
    const dealt = structuredClone(source); dealt.system = mergeDeep(dealt.system, structuredClone(overlay.system)); delete dealt.system.overlays;
    const dealtPlan = compileAbility(dealt);
    assert.equal(supported(dealtPlan), true);
    assert.equal(dealtPlan.resolution.diceUpgrade ?? null, null);
});

test('one paragraph per action count: each variant keeps its own paragraph', async () => {
    const choir = await spell('rank-1/concordant-choir');
    for (const time of ['1', '2', '3']) assert.equal(supported(compileAbility(variant(choir, time))), true, `Concordant Choir ${time}`);
    assert.deepEqual(compileAbility(variant(choir, '1')).targeting.actorConstraints.predicates, [{kind: 'enemy-of-caster'}]);
    assert.equal(supported(compileAbility(choir)), false, 'the base item isn\'t a variant');
    const rain = await spell('rank-4/force-rain');
    assert.equal(supported(compileAbility(variant(rain, '1'))), true);
    assert.equal(supported(compileAbility(variant(rain, '3'))), false, 'no save on 3 actions');
    // A restatement that disagrees with the variant's data (PF2e's 3-action Disorienting Flash keeps 1d10): the text's 2d10 is
    // rolled (rank 2 batch 9, following the user's decision to follow the text).
    const flash = await spell('rank-2/disorienting-flash');
    assert.equal(supported(compileAbility(variant(flash, '2'))), true);
    const three = compileAbility(variant(flash, '3'));
    assert.equal(supported(three), true);
    assert.deepEqual(three.resolution.sharedDamage.formulaOverrides.map(entry => [entry.formula, entry.dataFormula]), [['2d10', '1d10']]);
});
