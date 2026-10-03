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



// Rank 3, batch 23 (2026-10-02): Bottomless Stomach, Peaceful Bubble, Hunter's Vision, Shared Invisibility.

test('Condition mentions that are the GM\'s: a trigger state, a rest rule, what the caster sees through', async () => {
    for (const path of ['rank-3/bottomless-stomach', 'rank-4/peaceful-bubble', 'rank-5/hunters-vision']) {
        const plan = compile(await spell(path));
        assert.deepEqual([plan.resolution.kind, plan.automation.pendingCapabilities], ['spell-note', []], path);
    }
    // A rest rule that grants a condition instead is not a mention.
    assert.notEqual(compile(withText(await spell('rank-4/peaceful-bubble'), html => html.replace('reduce their', 'increase their'))).resolution.kind, 'spell-note');
});

test('Shared Invisibility: the caster and up to 5 willing creatures Invisible (10 and 1 hour from 5th)', async () => {
    const plan = compile(await spell('rank-3/shared-invisibility'));
    assert.deepEqual([plan.resolution.kind, plan.automation.pendingCapabilities, plan.resolution.conditionNote.recipient, plan.resolution.conditionNote.condition.slug], ['condition-note', [], 'self-and-targets', 'invisible']);
    const {spellNoteTargetLimit} = await import('../scripts/note-effects.js');
    assert.deepEqual([spellNoteTargetLimit('you and up to 5 willing creatures', ''), spellNoteTargetLimit('you and up to 5 willing creatures', 'The targets increase to you and up to 10 willing creatures.')], [6, 11]);
});
