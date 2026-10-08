import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

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



import {validateActorTarget} from '../scripts/basic-save-core.js';

// Rank 3, batch 24 (2026-10-02): Subjugate Undead, Sudden Recollection, Rewrite Memory.

test('Subjugate Undead: an undead of level ≤ the caster\'s − 4 saves; failure a 1-minute minion, critical failure 10 minutes; immune 24 hours', async () => {
    const plan = compile(await spell('rank-3/subjugate-undead'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'trait', slug: 'undead', present: true}, {kind: 'level-at-most-caster', offset: -4}]);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => [plan.resolution.outcomes[degree].noteEffects[0].minionControl, plan.resolution.outcomes[degree].noteEffects[0].duration.value]), [[true, 1], [true, 10]]);
    const constraints = {...plan.targeting.actorConstraints, casterLevel: 9};
    const undead = level => ({level, type: 'npc', traits: new Set(['undead']), isOfType: () => true, system: {details: {level: {value: level}}, traits: {value: ['undead']}}});
    assert.deepEqual([validateActorTarget(constraints, undead(5)).eligible, validateActorTarget(constraints, undead(6)).eligible], [true, false]);
});

test('Sudden Recollection and Rewrite Memory: the failing rows are the GM\'s note until the GM ends it', async () => {
    for (const path of ['rank-3/sudden-recollection', 'rank-4/rewrite-memory']) {
        const plan = compile(await spell(path));
        assert.equal(inspectSavePlan(plan).supported, true, path);
        assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects.map(note => note.duration.mode)), [['unlimited'], ['unlimited']], path);
        assert.deepEqual([plan.resolution.outcomes.success.noteEffects ?? [], plan.resolution.outcomes.criticalSuccess.noteEffects ?? []], [[], []]);
    }
});
