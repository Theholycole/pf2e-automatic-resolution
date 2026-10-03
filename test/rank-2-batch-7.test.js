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



// Rank 2, batch 7 (2026-09-30): a condition floor while the creature takes persistent bleed damage (Horrifying Blood Loss), and the plan
// validator accepting batch 5's target predicates.

test('Horrifying Blood Loss: Frightened with a floor of 1 until the bleeding stops; the critical failure keeps it', async () => {
    const {inspectSavePlan, isConditionFloor} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/horrifying-blood-loss'));
    assert.equal(plan.automation.level, 'guided');
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, failure, criticalFailure} = plan.resolution.outcomes;
    assert.equal(success.conditionFloor, undefined);
    assert.deepEqual([failure.effects[0].value, criticalFailure.effects[0].value], [2, 3]);
    for (const outcome of [failure, criticalFailure]) {
        assert.deepEqual([outcome.conditionFloor.slug, outcome.conditionFloor.value, outcome.conditionFloor.lifetime, outcome.conditionFloor.persistentDamage], ['frightened', 1, 'while-persistent', 'bleed']);
        assert.equal(isConditionFloor(outcome.conditionFloor), true);
    }
    assert.ok(failure.semanticCoverage.clauses.every(clause => clause.status === 'compiled'));
    // The core refuses a bleeding floor without its damage type, and a damage type on another floor.
    assert.equal(isConditionFloor({...failure.conditionFloor, persistentDamage: null}), false);
    assert.equal(isConditionFloor({...failure.conditionFloor, lifetime: 'spell'}), false);
});

test('Horrifying Blood Loss: without the target line\'s bleed the floor is blocked', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const source = await spell('rank-2/horrifying-blood-loss');
    source.system.target = {value: '1 creature'};
    const plan = compile(source);
    assert.equal(plan.resolution.outcomes.failure.conditionFloor, undefined);
    assert.ok(plan.automation.pendingCapabilities.includes('condition-floor-scope'));
    assert.equal(inspectSavePlan(plan).supported, false);
});

test('The plan validator accepts batch 5\'s target predicates', async () => {
    const plan = compile(await spell('rank-2/horrifying-blood-loss'));
    assert.ok(!plan.diagnostics.some(entry => entry.code === 'ACTOR_TARGET_PREDICATE_INVALID'));
    assert.notEqual(plan.automation.level, 'unsafe');
});
