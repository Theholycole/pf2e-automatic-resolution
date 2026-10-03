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



// Rank 2, batch 61 (2026-10-01): Coiling Dance.

test('Coiling Dance: allies inside hold PF2e\'s Effect; the Escape with the caster\'s Occultism or Religion', async () => {
    const plan = compile(await spell('rank-2/coiling-dance'));
    const aura = plan.resolution.escapeAura;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, aura.radius, aura.durationSeconds], ['escape-aura', 'automatic', 30, 60]);
    assert.deepEqual(aura.escape.conditions, ['grabbed', 'immobilized', 'restrained']);
    assert.deepEqual(aura.escape.skills, ['occultism', 'religion']);
});

test('Coiling Dance: other skills, conditions or traits are not read', async () => {
    const source = await spell('rank-2/coiling-dance');
    for (const [from, to] of [['your Occultism or Religion modifier', 'your Occultism or Wrestling modifier'], ['making their spells and attacks holy', 'making their spells and attacks unholy'],
        ['They can immediately use a reaction', 'They can immediately use an action']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'escape-aura', from);
    }
});
