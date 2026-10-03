import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {expandCompactDegreeTable} from '../src/compiler/compact-degree-table.js';
import {inspectSavePlan, isExecutableLingeringPlan, lingeringExposurePlan} from '../scripts/basic-save-core.js';
import {inspectGeneratedSpeedProof} from '../scripts/generated-outcome-modifier.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
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

test('Sea of Thought: a start-of-turn save whose Speed penalty lasts until the creature leaves the area; knocked Prone on a critical failure', async () => {
    const plan = compileAbility(await spell('rank-3/sea-of-thought'));
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.terrain.difficulty], [['turn-start'], 2]);
    const failure = plan.resolution.outcomes.failure.modifiers[0];
    assert.deepEqual([failure.value, failure.modifierType, failure.duration.mode, failure.duration.escape ?? false], [-10, 'circumstance', 'leave-area', false]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['prone']);
    assert.equal(plan.resolution.outcomes.success.modifiers?.length ?? 0, 0);
    // A leave-area penalty's proof is valid only for a lingering area.
    assert.equal(inspectGeneratedSpeedProof({...plan.compilerEvidence.generatedSpeedPenalties, lingering: undefined}, plan.resolution.outcomes).supported, false);
});

test('Entangling Flora: the penalty ends on leaving or an Escape, Immobilized for 1 round or until it Escapes, PF2e\'s link set aside', async () => {
    const plan = compileAbility(await spell('rank-2/entangling-flora'), {nativeEffectCatalog: await catalog()});
    assert.equal(isExecutableLingeringPlan(plan), true, JSON.stringify(inspectSavePlan(lingeringExposurePlan(plan)).blockers));
    assert.equal(plan.resolution.outcomes.failure.modifiers[0].duration.escape, true);
    const [immobilized] = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual([immobilized.slug, immobilized.duration.value, immobilized.endsWhen[0].event], ['immobilized', 1, 'escape']);
    assert.equal(plan.compilerEvidence.areaEffectLink.reference, 'Spell Effect: Entangling Flora');
    assert.match(plan.resolution.lingering.notes[0], /contain plants/);
});

test('area inline results: only after a trigger in the area, and only in this shape', async () => {
    const adapted = (text, statistic = 'reflex') => ({defense: {kind: 'save', basic: false, statistic}, targeting: {area: {type: 'burst', value: 10}}, descriptionHTML: `<p>${text}</p>`});
    const trigger = 'Each round that a creature starts its turn in the area, it must attempt a Reflex save.';
    const results = 'On a failure, it takes a –10-foot circumstance penalty to its Speeds until it leaves the area, and on a critical failure, it\'s also Immobilized for 1 round.';
    assert.ok(expandCompactDegreeTable(adapted(`${trigger} ${results}`)).areaResults);
    assert.equal(expandCompactDegreeTable(adapted(`${trigger} ${results}`, 'will')), null, 'another save');
    assert.equal(expandCompactDegreeTable(adapted(`You pick a target. ${results}`)), null, 'no area trigger');
    // An unread "difficult terrain" sentence before a degree table blocks the spell (preamble:terrain) — Web itself is read whole since rank 2
    // batch 75 (its own family), so a changed Web still shows the block.
    const source = await spell('rank-2/web');
    source.system.description.value = source.system.description.value.replace('it must attempt an', 'it must at once attempt an');
    const web = compileAbility(source);
    assert.ok(web.automation.pendingCapabilities.includes('preamble:terrain'));
});
