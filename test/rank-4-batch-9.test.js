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



const proved = source => { const plan = compile(source); return plan.resolution.kind === 'effect-note' && plan.automation.level === 'automatic' ? plan : null; };

// Rank 4, batch 9 (2026-10-02): Fire Shield.

test('Fire Shield: PF2e\'s shield and resistance proved (each step), the Shield Block damage a roll at the cast rank', async () => {
    const plan = proved(await spell('rank-4/fire-shield'));
    assert.ok(plan);
    assert.ok(plan.resolution.effectNote.proof.notes.some(note => note.includes('@Damage[(2+floor((@item.level - 4)/2)*1)d6[fire]]')));
    // Wrong statistics are refused: resistance, Hardness, HP, the step.
    for (const [from, to] of [['cold resistance 5', 'cold resistance 10'], ['Hardness 10', 'Hardness 5'], ['has 40 HP', 'has 30 HP'], ['the HP increase by 10', 'the HP increase by 5']])
        assert.equal(proved(withText(await spell('rank-4/fire-shield'), html => html.replace(from, to))), null, from);
});
