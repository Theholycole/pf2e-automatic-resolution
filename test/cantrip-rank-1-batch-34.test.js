import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {degreeObjectRules} from '../src/compiler/degree-choice-effect.js';
import {inspectCompiledNativeOutcomeEffect} from '../scripts/native-outcome-effects.js';

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

test('Overstuff: PF2e\'s Effect preset to {badge, degree} per row, carrying the row\'s Sickened', async () => {
    const plan = compile(await spell('rank-1/overstuff'));
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const expected = {success: {badge: 1, degree: 'success'}, failure: {badge: 1, degree: 'failure'}, criticalFailure: {badge: 2, degree: 'critical-failure'}};
    for (const [degree, value] of Object.entries(expected)) {
        const outcome = plan.resolution.outcomes[degree];
        const [effect] = outcome.nativeEffects;
        assert.deepEqual([effect.outcomeRule.kind, effect.outcomeRule.selectionFlag, effect.outcomeRule.selectionValue], ['degree-object-effect', 'overstuff', value]);
        // The row's Sickened is the Effect's GrantItem: not applied twice.
        assert.equal(outcome.effects[0].slug, 'sickened');
        assert.ok(outcome.effects[0].carriedBy);
        assert.deepEqual(inspectCompiledNativeOutcomeEffect(effect, {degree}), {supported: true, reason: null, selection: {flag: 'overstuff', value}});
    }
    assert.equal(plan.resolution.outcomes.criticalSuccess.nativeEffects.length, 0);
    const shape = degreeObjectRules(plan.resolution.outcomes.failure.nativeEffects[0].document.mechanics.rules);
    assert.deepEqual([shape.condition, shape.speeds, shape.addendum], ['sickened', [{selector: 'land-speed', type: 'status', value: -10}], 'success']);
});

test('degree-object Effects: kept strict', async () => {
    const source = await spell('rank-1/overstuff');
    // A Speed penalty the preamble doesn't state (or states differently) blocks.
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('–10-foot', '–5-foot')))).supported, false);
    // A row whose condition value isn't the Effect's badge blocks.
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('{Sickened 2}', '{Sickened 3}')))).supported, false);
    // The success extra on another row isn't the addendum's.
    assert.equal(inspectSavePlan(compile(withText(source, text => text.replace('The target is sickened 1.', 'The target is sickened 1, but if it spends an action to end the condition, it succeeds automatically.')))).supported, false);
    // Shape changes: a rule the proof doesn't know, or a ChoiceSet value with another key.
    const rules = structuredClone(compile(source).resolution.outcomes.failure.nativeEffects[0].document.mechanics.rules);
    assert.equal(degreeObjectRules([...rules, {key: 'FlatModifier', selector: 'ac', type: 'status', value: -1}]), null);
    const odd = structuredClone(rules); odd[0].choices[0].value.extra = 1;
    assert.equal(degreeObjectRules(odd), null);
});
