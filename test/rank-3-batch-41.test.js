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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 3, batch 41 (2026-10-02): Sparkleskin (PF2e's Effect, its per-action bonuses proved; the glitter burst a card button: the Fortitude save of
// the creatures in a 5-foot emanation of the target).

test('Sparkleskin: the Effect and the burst save', async () => {
    const plan = compile(await spell('rank-3/sparkleskin'));
    assert.equal(plan.resolution.kind, 'effect');
    assert.equal(plan.automation.level, 'automatic');
    const [action] = plan.resolution.grantedActions;
    assert.equal(supported(action.plan), true);
    assert.deepEqual(action.plan.targeting.area, {type: 'emanation', value: 5});
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => action.plan.resolution.outcomes[degree].effects[0].duration.value), [1, 3]);
    // A bonus PF2e doesn't give for an action isn't proved.
    const other = compile(withText(await spell('rank-3/sparkleskin'), html => html.replace('+2 status bonus', '+3 status bonus')));
    assert.notEqual(other.automation.level, 'automatic');
});
