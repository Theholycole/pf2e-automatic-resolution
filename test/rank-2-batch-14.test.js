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



// Rank 2, batch 14 (2026-09-30): a sustained spell with no listed duration lasts up to 10 minutes; Prone with no timer outlives the
// spell; "It then takes the effects of a failure."; a row's stated penalty as the module's note modifier; "As failure, but …".

test('A sustained spell with no listed duration: up to 10 minutes', async () => {
    const {compileItemDuration} = await import('../src/compiler/index.js');
    const spec = compileItemDuration('', {sustained: true});
    assert.deepEqual([spec.mode, spec.maximum.value, spec.maximum.unit, spec.maximum.ruleDefault], ['sustained', 10, 'minutes', true]);
});

test('Laughing Fit: notes and Slowed while sustained; the critical failure\'s Prone without a timer and the failure\'s effects too', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/laughing-fit'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {failure, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual(failure.effects.map(effect => [effect.slug, effect.value]), [['slowed', 1]]);
    assert.deepEqual(criticalFailure.effects.map(effect => [effect.slug, effect.duration ?? null]), [['prone', null], ['slowed', null]]);
    assert.equal(criticalFailure.thenFailureText, 'It then takes the effects of a failure.');
    assert.ok(criticalFailure.noteEffects.some(note => /can't use actions or reactions for 1 round/.test(note.text) && note.duration.value === 1));
    assert.ok(criticalFailure.noteEffects.some(note => /can't use reactions/.test(note.text) && note.duration.sustained));
});

test('Calm: the success row\'s penalty is the module\'s note modifier (PF2e\'s Effect replaced), the critical failure keeps the failure\'s note', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/calm'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const {success, criticalFailure} = plan.resolution.outcomes;
    assert.deepEqual(success.noteEffects[0].rules, [{key: 'FlatModifier', selector: 'attack-roll', type: 'status', value: -1}]);
    assert.equal(success.noteEffects[0].duration.sustained, true);
    assert.ok(Object.values(plan.resolution.outcomes).every(outcome => !(outcome.nativeEffects ?? []).length));
    assert.match(plan.resolution.dataNotes.join(' '), /Spell Effect: Calm gives the same penalty/);
    assert.equal(criticalFailure.noteEffects.length, 1);
    assert.match(criticalFailure.noteEffects[0].text, /But: Hostility doesn't end the effect\.$/);
});
