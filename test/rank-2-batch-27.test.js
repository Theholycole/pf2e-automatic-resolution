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



// Rank 2, batch 27 (2026-10-01): repeated spell attacks on Sustain with the caster's type pick (Spiritual Weapon, Spiritual Armament); object
// damage rolled on the card with its Hardness rule (Shatter); GM-triggered area damage (Explosive Dust per square, Tacky Pine Sap igniting).

test('Spiritual Weapon and Spiritual Armament: a repeated spell attack with the stated damage types', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    for (const [path, values] of [['rank-2/spiritual-weapon', ['force', 'bludgeoning', 'piercing', 'slashing']], ['rank-2/spiritual-armament', ['bludgeoning', 'piercing', 'slashing', 'spirit']]]) {
        const plan = compile(await spell(path));
        assert.equal(inspectSavePlan(plan).supported, true, path);
        assert.deepEqual(plan.resolution.casterChoice.values, values);
        assert.deepEqual([plan.resolution.repeatable.window, plan.resolution.repeatable.onCast], ['sustain', true]);
        assert.equal(plan.resolution.sharedDamage.formula, '(2+floor((@item.rank - 2)/2)*1)d8[untyped]');
    }
    const other = compile(withText(await spell('rank-2/spiritual-weapon'), text => text.replace('Regardless of its appearance, the weapon deals 2d8 force damage.', 'The weapon deals 2d8 force damage plus your modifier.')));
    assert.notEqual(other.resolution.repeatable?.window, 'sustain');
});

test('Shatter: the damage and the Hardness it ignores at a rank', async () => {
    const {objectDamageAt} = await import('../src/compiler/object-damage.js');
    const plan = compile(await spell('rank-2/shatter'));
    assert.equal(plan.resolution.kind, 'object-damage');
    assert.deepEqual(objectDamageAt(plan.resolution.objectDamage, 2), {formula: '2d10', type: 'sonic', hardness: 4});
    assert.deepEqual(objectDamageAt(plan.resolution.objectDamage, 5), {formula: '5d10', type: 'sonic', hardness: 10});
});

test('Explosive Dust and Tacky Pine Sap: the GM\'s control and its formula at a rank', async () => {
    const {hazardFormulaAt} = await import('../src/compiler/hazard-area.js');
    const dust = compile(await spell('rank-2/explosive-dust'));
    assert.equal(dust.resolution.kind, 'hazard-area');
    assert.deepEqual([hazardFormulaAt(dust.resolution.hazardArea, 2), hazardFormulaAt(dust.resolution.hazardArea, 4)], ['1d4[fire]', '2d4[fire]']);
    assert.equal(dust.resolution.hazardArea.notes.length, 3);
    const sap = compile(await spell('rank-2/tacky-pine-sap'));
    assert.deepEqual([sap.resolution.hazardArea.terrain, sap.resolution.hazardArea.control.endsSpell, hazardFormulaAt(sap.resolution.hazardArea, 5)], [true, true, '(2d6)[persistent,fire]']);
    const other = compile(withText(await spell('rank-2/explosive-dust'), text => text.replace('for every square they pass through', 'once')));
    assert.notEqual(other.resolution.kind, 'hazard-area');
});
