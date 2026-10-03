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


// Rank 4, batch 30 (2026-10-02): Precious Metals (PF2e's material and item choices, the Hardness alterations with their heightened step, the
// material change; notes for the example, the GM's other effects and the value).

test('Precious Metals: the material choice, Hardness and the material change proved', async () => {
    const plan = compile(await spell('rank-4/precious-metals'));
    assert.equal(plan.resolution.kind, 'effect-note');
    assert.equal(plan.automation.level, 'automatic');
    // A material PF2e doesn't offer isn't proved; nor a different Hardness.
    const other = compile(withText(await spell('rank-4/precious-metals'), html => html.replace('silver, or steel.', 'silver, steel, or mithral.')));
    assert.notEqual(other.automation.level, 'automatic');
    const hard = compile(withText(await spell('rank-4/precious-metals'), html => html.replace('increased to 10 if it was lower', 'increased to 12 if it was lower')));
    assert.notEqual(hard.automation.level, 'automatic');
});
