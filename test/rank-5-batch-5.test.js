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
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };



// Rank 5, batch 5 (2026-10-02): Anchoring Air, Earthbind, Warshard Shot.

test('Anchoring Air: PF2e\'s degree Effect, until the end of the attacker\'s turn; the critical failure adds Immobilized to the failure', async () => {
    const plan = compile(await spell('rank-4/anchoring-air'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const rule = degree => plan.resolution.outcomes[degree].nativeEffects.map(effect => [effect.outcomeRule.selectionValue, effect.outcomeRule.durationAnchor, effect.outcomeRule.durationOffset]);
    assert.deepEqual([rule('success'), rule('failure'), rule('criticalFailure')], [[['success', 'target-turn', 0]], [['failure', 'target-turn', 0]], [['failure', 'target-turn', 0]]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ['immobilized']);
    const wrong = compile(withText(await spell('rank-4/anchoring-air'), html => html.replace("–2 circumstance penalty to the triggering Strike's", "–3 circumstance penalty to the triggering Strike's")));
    assert.equal(inspectSavePlan(wrong).supported, false);
});

test('Earthbind: each failing row\'s safe fall is the GM\'s, with the grounding note', async () => {
    const plan = compile(await spell('rank-3/earthbind'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].forcedMovement?.kind), ['fall', 'fall', 'fall']);
    const forged = structuredClone(plan); forged.resolution.outcomes.success.forcedMovement.safe = false;
    assert.equal(inspectSavePlan(forged).supported, false);
    const forged2 = structuredClone(plan); forged2.resolution.outcomes.success.forcedMovement.distance = 200;
    assert.equal(inspectSavePlan(forged2).supported, false);
});

test('Warshard Shot: the AC penalty needs the row\'s persistent damage of that type', async () => {
    const plan = compile(withText(await spell('rank-5/warshard-shot'), html => html.replace('taking this persistent spirit damage', 'taking this persistent fire damage')));
    assert.equal(inspectSavePlan(plan).supported, false);
});
