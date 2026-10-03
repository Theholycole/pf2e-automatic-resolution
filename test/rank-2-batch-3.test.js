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


// Rank 2, batch 3 (2026-09-30): the effect before the table with each row's duration now carries its stated conditions and modifiers.
test('degree durations with stated rules: Revealing Light (Dazzled; Concealed for an invisible creature), Brand the Impenitent (toggled AC penalty; unlimited), Penumbral Shroud (+1 vs light)', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const light = compile(await spell('rank-2/revealing-light'));
    assert.equal(inspectSavePlan(light).supported, true);
    const fail = light.resolution.outcomes.failure.noteEffects[0];
    assert.deepEqual([fail.duration.value, fail.duration.unit], [1, 'minutes']);
    assert.deepEqual(fail.rules.map(rule => [rule.key, rule.flag, rule.predicate ?? null]), [['GrantItem', 'conditionDazzled', null], ['GrantItem', 'conditionConcealed', ['self:condition:invisible']]]);
    assert.deepEqual(light.resolution.outcomes.success.noteEffects[0].duration.value, 2);
    assert.equal(light.resolution.outcomes.criticalSuccess.noteEffects?.length ?? 0, 0);
    assert.ok(validNoteEffect(fail));
    const brand = compile(await spell('rank-2/brand-the-impenitent'));
    assert.equal(inspectSavePlan(brand).supported, true);
    const critical = brand.resolution.outcomes.criticalFailure.noteEffects[0];
    assert.deepEqual([critical.duration.mode, critical.rules.map(rule => rule.key)], ['unlimited', ['RollOption', 'FlatModifier']]);
    assert.deepEqual([critical.rules[1].selector, critical.rules[1].value, critical.rules[1].predicate], ['ac', -1, ['attacker-follows-caster-faith']]);
    assert.ok(validNoteEffect(critical));
    const shroud = compile(await spell('rank-1/penumbral-shroud'));
    assert.deepEqual(shroud.resolution.outcomes.failure.noteEffects[0].rules, [{key: 'FlatModifier', selector: 'saving-throw', type: 'status', value: 1, predicate: ['item:trait:light']}]);
    // Kept strict: a row the pattern doesn't know, or an unstated condition.
    assert.equal(inspectSavePlan(compile(withText(await spell('rank-2/revealing-light'), text => text.replace('for 2 rounds.', 'for 2 rounds and takes 1d6 fire damage.')))).supported, false);
    assert.equal(inspectSavePlan(compile(withText(await spell('rank-2/brand-the-impenitent'), text => text.replace('-1 status penalty', '-1 status penalty and 2d6 damage')))).supported, false);
});
