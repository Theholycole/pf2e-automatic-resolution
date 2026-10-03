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

// Rank 4, batch 14 (2026-10-02): Font of Serenity — the caster's allies in the burst hold PF2e's Effect (+1 status to saves against emotion,
// +1 per 4 ranks by the text: an override where PF2e's value differs); the touch counteract is the card's button.

test('Font of Serenity: allies in the area, the text\'s bonus by rank, the counteract button', async () => {
    const plan = proved(await spell('rank-4/font-of-serenity'));
    assert.ok(plan);
    const proof = plan.resolution.effectNote.proof;
    assert.deepEqual(proof.recipient, {actor: 'area', allies: true});
    assert.deepEqual(proof.ruleOverrides, [{index: 0, key: 'FlatModifier', patch: {value: '1 + floor((@item.level - 4) / 4) * 1'}}]);
    assert.match(proof.counteract.target, /emotion effect/);
    // Another trait than the Effect's predicate is refused.
    assert.equal(proved(withText(await spell('rank-4/font-of-serenity'), html => html.replace('against emotion effects', 'against fear effects'))), null);
});
