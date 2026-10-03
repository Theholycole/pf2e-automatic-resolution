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



// Rank 2, batch 18 (2026-09-30): behaviour while the row's condition lasts, as notes tied to that condition (With Friends like These).

test('With Friends like These: Sickened, with its behaviour as notes that end with the sickened condition', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-2/with-friends-like-these'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual(failure.noteEffects.map(note => [note.label, note.whileCondition, note.duration.mode]), [['No allies', 'sickened', 'unlimited']]);
    assert.deepEqual(criticalFailure.noteEffects.map(note => note.label).sort(), ['Movement', 'No allies']);
    // The critical failure's "as long as it is sickened" isn't a second condition.
    assert.deepEqual(criticalFailure.effects.map(effect => [effect.slug, effect.value]), [['sickened', 2]]);
    assert.ok(criticalFailure.noteEffects.every(validNoteEffect));
    assert.equal(validNoteEffect({...failure.noteEffects[0], duration: {mode: 'fixed', value: 1, unit: 'minutes'}}), false);
});

test('A behaviour sentence tied to a condition the row doesn\'t apply isn\'t read', async () => {
    const plan = compile(withText(await spell('rank-2/with-friends-like-these'), html => html.replace('While sickened this way', 'While frightened this way')));
    assert.equal(plan.resolution.outcomes.failure.noteEffects, undefined);
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    assert.equal(inspectSavePlan(plan).supported, false);
});
