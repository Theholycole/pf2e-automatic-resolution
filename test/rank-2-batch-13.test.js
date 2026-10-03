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



// Rank 2, batch 13 (2026-09-30): conditions granted without a check ("It becomes Concealed.", "All affected targets are Quickened."),
// "Each living creature in the area" on an instantaneous basic save, a narration naming the area, and the caster's terrain option.

test('Blur and Loose Time\'s Arrow: condition + note for the spell\'s duration', async () => {
    const blur = compile(await spell('rank-2/blur'));
    assert.equal(blur.resolution.kind, 'condition-note');
    assert.deepEqual([blur.resolution.conditionNote.condition.slug, blur.resolution.conditionNote.duration.value, blur.resolution.conditionNote.duration.unit], ['concealed', 1, 'minutes']);
    const arrow = compile(await spell('rank-2/loose-times-arrow'));
    assert.equal(arrow.resolution.kind, 'condition-note');
    assert.equal(arrow.resolution.conditionNote.condition.slug, 'quickened');
    // "All affected targets are …" needs a Target of up to N creatures.
    const source = await spell('rank-2/loose-times-arrow'); source.system.target = {value: 'all creatures in the area'};
    assert.notEqual(compile(source).resolution.kind, 'condition-note');
});

test('Sudden Blight: living creatures only, the disease question, the plants as the caster\'s option', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/sudden-blight'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'living-creature'}]);
    assert.match(plan.resolution.attackAdjustment.question, /afflicted by a disease/);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['terrain-option']);
    assert.match(plan.resolution.reminders[0].text, /attempts to counteract any magical effect on the plants/);
    // A changed option sentence isn't read.
    const other = compile(withText(await spell('rank-2/sudden-blight'), html => html.replace('rot all Small and Tiny non-creature plants', 'rot every creature')));
    assert.equal(inspectSavePlan(other).supported, false);
});

test('"Each living creature in the area" is a target check only on an instantaneous basic save', async () => {
    const {isExecutableLingeringPlan} = await import('../scripts/basic-save-core.js');
    const drought = await spell('rank-2/breath-of-drought');
    const living = compile(withText(drought, html => html.replace('Each creature in the area', 'Each living creature in the area')));
    assert.equal(isExecutableLingeringPlan(living), false);
});
