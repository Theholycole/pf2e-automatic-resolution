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


// Rank 3, batch 38 (2026-10-02): Envenom Companion (PF2e's Effect on the companion; the damaged creature's Fortitude save a card button whose
// Clumsy value rises every 3 ranks; no familiars).

test('Envenom Companion: the Effect, the triggered save per rank, no familiars', async () => {
    const plan = compile(await spell('rank-3/envenom-companion'));
    assert.equal(plan.resolution.kind, 'effect');
    assert.equal(plan.automation.level, 'automatic');
    assert.equal(plan.nativeEffects.onUse[0].recipient.actor, 'target');
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'not-familiar'}]);
    const [action] = plan.resolution.grantedActions;
    assert.deepEqual(action.byRank.map(entry => [entry.minRank, entry.plan.resolution.outcomes.failure.effects[0].value]), [[3, 1], [6, 2], [9, 3]]);
    assert.ok(action.byRank.every(entry => supported(entry.plan)));
    // Another condition rider isn't read as the button.
    const other = compile(withText(await spell('rank-3/envenom-companion'), html => html.replace("it's also @UUID[Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm]{Clumsy 1}", "it's also Drained 1")));
    assert.notEqual(other.resolution.kind, 'effect');
});
