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



// Rank 2, batch 9 (2026-09-30): an action-count variant's paragraph stating other damage or another area than PF2e's variant data
// (the text's, as a formula override the runtime applies before loading the variant), and a basic save stated in the sentence
// after the damage.
function mergeDeep(target, patch) {
    for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value;
    return target;
}
const variantOf = (source, time) => { const overlay = Object.values(source.system.overlays ?? {}).find(o => o.system?.time?.value === time);
    const copy = structuredClone(source); copy.system = mergeDeep(copy.system, structuredClone(overlay.system)); delete copy.system.overlays; return copy; };

test('Disorienting Flash: each action count, the text\'s damage and area over PF2e\'s variant data', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/disorienting-flash');
    const [one, two, three] = ['1', '2', '3'].map(time => compile(variantOf(source, time)));
    for (const plan of [one, two, three]) assert.equal(inspectSavePlan(plan).supported, true);
    // 1 action: PF2e's 5-foot burst, the text's 5-foot square (a data note; the damage agrees).
    assert.deepEqual(one.targeting.area, {type: 'square', value: 5});
    assert.deepEqual(one.resolution.sharedDamage.formulaOverrides, []);
    assert.match(one.resolution.dataNotes.join(' '), /5-foot burst; the text says a 5-foot square/);
    // 3 actions: PF2e keeps 1d10; the text's 2d10 is rolled.
    assert.deepEqual(three.resolution.sharedDamage.formulaOverrides.map(entry => [entry.componentId, entry.formula, entry.dataFormula]), [['SOCu7FSBr6u7ONAC', '2d10', '1d10']]);
    assert.deepEqual(three.resolution.outcomes.failure.effects.map(effect => effect.slug).sort(), ['dazzled', 'deafened']);
    assert.equal(two.resolution.sharedDamage.formulaOverrides, undefined);
    // The core accepts an override only for a variant's one entry.
    const broken = structuredClone(three); broken.resolution.sharedDamage.formulaOverrides[0].componentId = 'other';
    assert.ok(inspectSavePlan(broken).blockers.some(blocker => blocker.code === 'formula-override'));
    const base = structuredClone(three); base.activation.time = '1 to 3';
    assert.ok(inspectSavePlan(base).blockers.some(blocker => blocker.code === 'formula-override'));
});

test('Inner Radiance Torrent: the save in the sentence after the damage, Blinded on a critical failure, the darkness reminder', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/inner-radiance-torrent');
    for (const time of ['2', '3']) {
        const plan = compile(variantOf(source, time));
        assert.equal(inspectSavePlan(plan).supported, true, time);
        assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['blinded']);
        assert.equal(plan.resolution.outcomes.failure.effects.length, 0);
    }
    // The 2-round version's shining state isn't read.
    assert.equal(inspectSavePlan(compile(variantOf(source, '2 rounds'))).supported, false);
});

test('The paired save sentence: only a bare save right after the one damage sentence', async () => {
    const {assessSimpleBasicSaveDescription, analyzeDescription, adaptSpellSource} = await import('../src/compiler/index.js');
    const adapted = adaptSpellSource(await spell('rank-2/inner-radiance-torrent'));
    const gate = text => assessSimpleBasicSaveDescription({...adapted, descriptionHTML: text}, analyzeDescription(text)).complete;
    assert.equal(gate('A storm of bolts deals 4d4 force damage to all creatures in a 60-foot line. Creatures in the area must attempt a basic Reflex save.'), true);
    assert.equal(gate('Creatures in the area must attempt a basic Reflex save. A storm of bolts deals 4d4 force damage to all creatures in a 60-foot line.'), false);
    assert.equal(gate('A storm of bolts deals 4d4 force damage to all creatures in a 60-foot line. Creatures in the area must attempt a basic Reflex save or be pushed.'), false);
});
