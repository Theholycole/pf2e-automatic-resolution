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

// Rank 3, batch 18 (2026-10-02): Safe Passage, Soothing Blossoms — more area Effects.

test('Safe Passage: a drawn area (its Area paragraph); PF2e\'s toggle, +2 and the resistance by rank', async () => {
    const plan = proved(await spell('rank-3/safe-passage'));
    assert.ok(plan);
    assert.deepEqual([plan.resolution.effectNote.recipient, plan.resolution.effectNote.drawnArea], ['area', '10-foot-wide, 10-foot-tall, 60-foot-long section of terrain']);
    assert.ok(!plan.automation.pendingCapabilities.includes('area-paragraph'));
    assert.equal(proved(withText(await spell('rank-3/safe-passage'), html => html.replace('resistance 5 to all damage', 'resistance 6 to all damage'))), null);
    assert.equal(proved(withText(await spell('rank-3/safe-passage'), html => html.replace('increases to 10,', 'increases to 12,'))), null);
});

test('Soothing Blossoms: PF2e\'s degree adjustment and the assisted recovery the module rolls', async () => {
    const plan = proved(await spell('rank-3/soothing-blossoms'));
    assert.ok(plan);
    assert.equal(plan.resolution.effectNote.proof.assistedRecovery, true);
    assert.equal(plan.resolution.effectNote.proof.notes.length, 2);
    assert.equal(proved(withText(await spell('rank-3/soothing-blossoms'), html => html.replace('a poison or disease effect', 'a poison effect'))), null);
});
