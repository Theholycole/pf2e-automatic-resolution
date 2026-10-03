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



// Rank 2, batch 73 (2026-10-01): Sea Surge.

import {inspectSavePlan} from '../scripts/basic-save-core.js';

test('Sea Surge: the path\'s degree save, the Swimming question, the wave moving on', async () => {
    const plan = compile(await spell('rank-2/sea-surge'));
    assert.ok(inspectSavePlan(plan).supported);
    assert.deepEqual([plan.targeting.area.type, plan.targeting.area.value], ['line', 60]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'size-at-most', size: 'lg'}]);
    assert.equal(plan.resolution.degreeAdjustment.map.failure, 'criticalFailure');
    assert.deepEqual([plan.resolution.waveRepeat.feet, plan.resolution.waveRepeat.when], [60, 'caster-turn-start']);
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(e => e.slug), ['prone']);
    assert.equal(plan.resolution.outcomes.criticalFailure.forcedMovement.distance, 20);
    assert.equal(inspectSavePlan({...plan, resolution: {...plan.resolution, waveRepeat: {...plan.resolution.waveRepeat, sourceText: 'forged'}}}).supported, false);
});

test('Sea Surge: changed rows or distances are not read', async () => {
    const source = await spell('rank-2/sea-surge');
    for (const [from, to] of [['If the creature was Swimming', 'If the creature was Flying'], ['moves another 60 feet', 'moves another 90 feet and returns'], ['takes 3d6 bludgeoning damage', 'takes 4d6 bludgeoning damage']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.equal(plan.resolution.waveRepeat, undefined, from);
    }
});
