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


// Rank 4, batch 32 (2026-10-02): Perfected Body (the caster's failed save one degree better: on a module card being resolved, or PF2e's last
// failed save for the GM).

test('Perfected Body: the save upgrade', async () => {
    const plan = compile(await spell('rank-4/perfected-body'));
    assert.equal(plan.resolution.kind, 'save-upgrade');
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.saveUpgrade.map, {criticalFailure: 'failure', failure: 'success'});
    assert.deepEqual(plan.resolution.saveUpgrade.traits, ['morph', 'poison', 'polymorph']);
    assert.deepEqual(plan.resolution.saveUpgrade.conditions, ['Clumsy', 'Doomed', 'Enfeebled', 'Petrified', 'Sickened']);
    // Another upgrade isn't read.
    const other = compile(withText(await spell('rank-4/perfected-body'), html => html.replace('a success if you rolled a failure', 'a critical success if you rolled a failure')));
    assert.notEqual(other.resolution.kind, 'save-upgrade');
});
