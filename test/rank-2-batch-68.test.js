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



// Rank 2, batch 68 (2026-10-01): Dancing Shield.

test('Dancing Shield: PF2e\'s shield-bonus choice proved, the target, Shield Block from 4th', async () => {
    const plan = compile(await spell('rank-2/dancing-shield'));
    const note = plan.resolution.effectNote;
    assert.deepEqual([plan.automation.level, note.recipient, note.proof.shieldBlockFromRank], ['automatic', 'target', 4]);
    assert.deepEqual(note.proof.shieldChoice, {flag: 'spellEffectDancingShield', min: 1, max: 3});
});

test('Dancing Shield: another action or reaction is not proved', async () => {
    const source = await spell('rank-2/dancing-shield');
    for (const [from, to] of [['uses the Raise a Shield action', 'uses the Shield Block reaction'], ['In this case, Shield Block protects the target creature', 'In this case, Shield Block protects every creature']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.automation.level, 'automatic', from);
    }
});
