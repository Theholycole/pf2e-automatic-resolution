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

// Rank 4, batch 4 (2026-10-02): Downpour, Anointed Ground — areas whose occupants hold PF2e's Effect while inside.

test('Downpour: the area holds PF2e\'s fire resistance (stepped) plus the stated Concealed; the rest are GM notes', async () => {
    const plan = proved(await spell('rank-4/downpour'));
    assert.ok(plan);
    assert.equal(plan.resolution.effectNote.recipient, 'area');
    assert.deepEqual(plan.resolution.effectNote.proof.ruleAdditions.map(rule => rule.uuid), ['Compendium.pf2e.conditionitems.Item.DmAIPqOBomZ7H95W']);
    assert.equal(plan.resolution.effectNote.proof.notes.length, 2);
    assert.equal(proved(withText(await spell('rank-4/downpour'), html => html.replace('fire resistance 10', 'fire resistance 12'))), null);
    assert.equal(proved(withText(await spell('rank-4/downpour'), html => html.replace('increases by 2', 'increases by 3'))), null);
});

test('Anointed Ground: the caster\'s creature-type pick is PF2e\'s ChoiceSet; both modifiers are against that trait', async () => {
    const plan = proved(await spell('rank-3/anointed-ground'));
    assert.ok(plan);
    assert.equal(plan.resolution.effectNote.recipient, 'area');
    assert.deepEqual(plan.resolution.effectNote.proof.areaChoice, {index: 0, flag: 'creatureType', choices: ['aberration', 'celestial', 'dragon', 'fiend', 'monitor', 'undead']});
    assert.equal(proved(withText(await spell('rank-3/anointed-ground'), html => html.replace('monitors, or undead', 'or undead'))), null);
    assert.equal(proved(withText(await spell('rank-3/anointed-ground'), html => html.replace('+1 status bonus to AC', '+2 status bonus to AC'))), null);
});
