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



// Rank 2, batch 29 (2026-10-01): a spell attack whose hit leaves an acid puddle on the target's space and the squares adjacent
// (Disintegrating Puddle): the existing ground hazard, here with the adjacent squares and a formula of floor(rank/2) dice.

test('Disintegrating Puddle: the attack and the puddle on a hit', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/disintegrating-puddle'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.groundHazard, {where: 'target-and-adjacent', degrees: ['criticalSuccess', 'success'], events: ['enter', 'turn-start'],
        damage: {formula: '(floor(@item.rank/2))d4', type: 'acid'}, duration: {mode: 'fixed', value: 1, unit: 'minutes'}, label: 'acid puddle',
        sourceText: 'The acid puddle lasts for 1 minute; a creature that enters or starts its turn in the acid puddle takes @Damage[(floor(@item.level / 2))d4[acid]] damage.'});
    const forged = structuredClone(plan); forged.resolution.groundHazard.where = 'everywhere';
    assert.equal(inspectSavePlan(forged).supported, false);
});

test('The ground hazard\'s floor formula at a rank', async () => {
    const {hazardFormula} = await import('../scripts/basic-save-runtime.js');
    assert.equal(hazardFormula('(floor(@item.rank/2))d4', 4), '2d4');
    assert.equal(hazardFormula('(floor(@item.rank/2))d4', 5), '2d4');
});
