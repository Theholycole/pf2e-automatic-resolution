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



// Rank 2, batch 31 (2026-10-01): blasts made by destroying the caster's own creature (Final Sacrifice's minion, Bony Barrage's thrall and its
// bone armor).

test('Final Sacrifice: the basic save of the area, the minion choice and the cold switch', async () => {
    const {inspectSavePlan, saveCollectionReadiness} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/final-sacrifice'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual([plan.resolution.sacrifice.pick, plan.resolution.sacrifice.typeByTrait], ['minion', {traits: ['cold', 'water'], type: 'cold', replaces: 'fire'}]);
    assert.match(saveCollectionReadiness({targets: [], sacrifice: {pick: 'minion', selected: null}}).reason, /choose the minion/);
    const forged = structuredClone(plan); forged.resolution.sacrifice.typeByTrait.replaces = 'acid';
    assert.equal(inspectSavePlan(forged).supported, false);
});

test('Bony Barrage: the thrall reminder and the bone armor question', async () => {
    const {inspectSavePlan, damageMultiplierForTarget} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/bony-barrage'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.sacrifice.pick, 'thrall');
    assert.equal(plan.resolution.boneArmor.ac, 1);
    assert.equal(damageMultiplierForTarget({}, {boneArmor: true, degree: 'criticalFailure'}), 0);
    const other = compile(withText(await spell('rank-2/bony-barrage'), text => text.replace('take no damage from this spell', 'take half damage from this spell')));
    assert.equal(other.resolution.boneArmor, undefined);
});
