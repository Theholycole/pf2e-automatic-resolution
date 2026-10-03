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



// Rank 3, batch 16 (2026-10-02): Return the Favor, Capital Dividend, Know the Enemy.

const proved = source => { const plan = compile(source); return plan.resolution.kind === 'effect-note' && plan.automation.level === 'automatic' ? plan.resolution.effectNote.proof : null; };

test('three Effect + note spells are proved; a changed step is not', async () => {
    for (const path of ['rank-3/return-the-favor', 'rank-4/capital-dividend', 'rank-4/know-the-enemy']) assert.ok(proved(await spell(path)), path);
    const favor = await spell('rank-3/return-the-favor');
    assert.equal(proved(withText(favor, html => { assert.ok(html.includes('increase by 4')); return html.replace('increase by 4', 'increase by 5'); })), null);
});
