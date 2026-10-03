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



// Rank 4, batch 6 (2026-10-02): Mercurial Stride, Chroma Leach.

test('Mercurial Stride: the caster\'s movement is a reminder; the rows\' inline poison restates the item\'s damage', async () => {
    const plan = compile(await spell('rank-4/mercurial-stride'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.equal(plan.resolution.sharedDamage, null);
    assert.deepEqual(plan.compilerEvidence.restatedItemDamage, ['6d6 poison']);
    assert.deepEqual(plan.resolution.reminders.map(reminder => reminder.kind), ['caster-movement']);
    // A row damage that doesn't restate the item's keeps the item's entry (and the plan blocked).
    const other = compile(withText(await spell('rank-4/mercurial-stride'), html => html.replace('(@item.level+2)d6[poison]', '(@item.level+3)d6[poison]')));
    assert.notEqual(other.resolution.sharedDamage, null);
    assert.equal(inspectSavePlan(other).supported, false);
});

test('Chroma Leach: the move-action save is a 1-round note with the spell DC; the critical failure\'s conditions are permanent', async () => {
    const plan = compile(await spell('rank-4/chroma-leach'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const failure = plan.resolution.outcomes.failure, critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual(failure.noteEffects.map(note => [note.label, note.spellDC, note.duration.value, note.duration.unit]), [['Listless', true, 1, 'rounds']]);
    assert.match(failure.noteEffects[0].text, /@Check\[will\|dc:\{dc\}\|traits:mental,emotion\]/);
    assert.deepEqual(failure.followUps, []);
    assert.deepEqual(critical.effects.map(effect => [effect.slug, effect.value, effect.duration.mode]), [['enfeebled', 2, 'unlimited'], ['drained', 2, 'unlimited']]);
    assert.deepEqual(critical.noteEffects.map(note => note.label), ['Listless', 'Permanent']);
});
