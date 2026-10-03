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



// Rank 2, batch 45 (2026-10-01): Cauterize Wounds.

test('Cauterize Wounds: the immutable fire, PF2e\'s lower recovery DC, the repeat', async () => {
    const plan = compile(await spell('rank-2/cauterize-wounds'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['cauterize', 'automatic']);
    const {persistentType, damage, maxTargets, durationSeconds} = plan.resolution.cauterize;
    assert.deepEqual([persistentType, damage, maxTargets, durationSeconds], ['bleed', '1[fire]', 5, 60]);
    assert.notEqual(compile(withText(await spell('rank-2/cauterize-wounds'), html => html.replace('one target of the spell', 'every target of the spell'))).resolution.kind, 'cauterize');
});
