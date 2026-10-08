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



// Rank 2, batch 32 (2026-10-01): a blast whose save and damage type come from the caster's constellation (Shining Starlight Attack).

test('Shining Starlight Attack: the constellations, the enemies-only check and the Dazzled rider', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/shining-starlight-attack'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const rows = Object.fromEntries(plan.resolution.constellations.map(row => [row.name, [row.area.type, row.area.value, row.statistic, row.damageType, row.traits.join()]]));
    assert.deepEqual(rows['Sky Dragon'], ['line', 30, 'reflex', 'electricity', '']);
    assert.deepEqual(rows['Blossom'], ['line', 30, 'fortitude', 'poison', 'plant,wood']);
    assert.deepEqual(rows['Archer'], ['cone', 15, 'reflex', 'piercing', '']);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'enemy-of-caster'}]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['dazzled']);
    // The plan the cast makes for a constellation keeps its save; another save is refused.
    const sky = {...plan, resolution: {...plan.resolution, check: {...plan.resolution.check, statistic: 'reflex'}, constellation: plan.resolution.constellations.find(row => row.name === 'Sky Dragon')}};
    assert.equal(inspectSavePlan(sky).supported, true);
    const wrong = {...sky, resolution: {...sky.resolution, check: {...sky.resolution.check, statistic: 'will'}}};
    assert.equal(inspectSavePlan(wrong).supported, false);
});
