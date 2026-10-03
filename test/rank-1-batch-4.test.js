import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {parsePenaltyRow, preamblePenalty} from '../src/compiler/degree-choice-effect.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const supported = plan => inspectSavePlan(plan).supported;
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

test('Appeal to Authority: the degree Effect gives each row\'s penalty; success adds an end-of-turn Will save that ends it', async () => {
    const plan = compileAbility(await spell('rank-1/appeal-to-authority'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const rule = degree => plan.resolution.outcomes[degree].nativeEffects[0].outcomeRule;
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => rule(degree).selectionValue), [-1, -1, -2]);
    assert.deepEqual(rule('success').recurringSave, {mode: 'end', statistic: 'will'});
    assert.equal(rule('failure').recurringSave, undefined);
});

test('Draw Ire: "the penalty" from before the table; the success row\'s own Effect ends after the target\'s next turn', async () => {
    const plan = compileAbility(await spell('rank-1/draw-ire'), {nativeEffectCatalog: await catalog()});
    assert.equal(supported(plan), true, JSON.stringify(inspectSavePlan(plan).blockers));
    const success = plan.resolution.outcomes.success.nativeEffects[0].outcomeRule;
    assert.deepEqual([success.kind, success.durationAnchor, success.penalty.qualifier], ['penalty-effect', 'target-turn', 'against creatures other than you']);
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].nativeEffects[0].outcomeRule.selectionValue), ['-1', '-2']);
});

test('penalty rows: narration only before the penalty, and qualifiers must be known', () => {
    const preamble = preamblePenalty('You deal 1d10 mental damage to the creature and cause it to take a -1 status penalty to attack rolls against creatures other than you.').penalty;
    assert.ok(parsePenaltyRow('The target takes full damage and the penalty.', {preamble}));
    assert.equal(parsePenaltyRow('The target takes full damage and the penalty. It is also slowed 1.', {preamble}), null);
    assert.equal(parsePenaltyRow('The target is stunned 1, taking a –1 status penalty to saves against your emotion effects.'), null);
    assert.equal(preamblePenalty('It takes damage and cause it to take a -1 status penalty to attack rolls against dragons.'), null);
});
