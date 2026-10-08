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



const proved = source => { const plan = compile(source); return plan.resolution.kind === 'effect-note' && plan.automation.level === 'automatic' ? plan : null; };

// Rank 5, batch 6 (2026-10-02): Unblinking Flame Aura, Mind of Menace.

test('Unblinking Flame Aura: the caster heals 3 × the rank; PF2e\'s Effect carries +2 Perception and cold resistance stepping by 2', async () => {
    const plan = proved(await spell('rank-5/unblinking-flame-aura'));
    assert.ok(plan);
    assert.deepEqual(plan.resolution.effectNote.selfHeal.perRank, 3);
    // A heal step that isn't the formula's is refused, as is a resistance step the Effect doesn't follow.
    assert.equal(proved(withText(await spell('rank-5/unblinking-flame-aura'), html => html.replace('an additional 3 Hit Points', 'an additional 4 Hit Points'))), null);
    assert.equal(proved(withText(await spell('rank-5/unblinking-flame-aura'), html => html.replace('increases by 2', 'increases by 3'))), null);
});

test('Mind of Menace: the item\'s Will save is the granted reaction\'s; the caster holds the Effect with Fight with Fear', async () => {
    const plan = proved(await spell('rank-3/mind-of-menace'));
    assert.ok(plan);
    assert.equal(plan.resolution.effectNote.recipient, 'source');
    // A spell text naming a save keeps that save its own (not this route).
    assert.equal(proved(withText(await spell('rank-3/mind-of-menace'), html => html.replace('This spell wards', 'This spell, with a Will save, wards'))), null);
});
