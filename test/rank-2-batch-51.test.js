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



// Rank 2, batch 51 (2026-10-01): Glacial Causeway.

test('Glacial Causeway: the path, the caster\'s exemption, Quickened at the caster\'s turn end', async () => {
    const plan = compile(await spell('rank-2/glacial-causeway'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['causeway', 'automatic']);
    const {area, durationSeconds, casterTurnEnd} = plan.resolution.causeway;
    assert.deepEqual([area, durationSeconds, casterTurnEnd.uuid], [{type: 'line', value: 120}, 60, 'Compendium.pf2e.conditionitems.Item.nlCjDvLMf2EkV2dl']);
    assert.notEqual(compile(withText(await spell('rank-2/glacial-causeway'), html => html.replace('Other creatures', 'All creatures'))).resolution.kind, 'causeway');
});
