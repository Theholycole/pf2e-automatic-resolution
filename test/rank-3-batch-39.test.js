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


// Rank 3, batch 39 (2026-10-02): Focusing Hum (a spell note; the caster's untyped Stealth penalty to Hide and Sneak is a rule on it).

import {validNoteRule} from '../scripts/note-effects.js';

test('Focusing Hum: the note and its Stealth penalty rule', async () => {
    const plan = compile(await spell('rank-3/focusing-hum'));
    assert.equal(plan.resolution.kind, 'spell-note');
    const [rule] = plan.resolution.note.rules;
    assert.deepEqual(rule, {key: 'FlatModifier', selector: 'stealth', type: 'untyped', value: -2, predicate: [{or: ['action:hide', 'action:sneak']}]});
    assert.equal(validNoteRule(rule), true);
    // A bonus with no type to another statistic isn't read.
    const other = compile(withText(await spell('rank-3/focusing-hum'), html => html.replace('Stealth checks to', 'Perception checks to')));
    assert.notEqual(other.resolution.kind, 'spell-note');
});
