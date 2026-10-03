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



// Rank 2, batch 80 (2026-10-01): Rite of Cleansing Flame (the ritual-outcome family).

test('Rite of Cleansing Flame: the area cure, the casters\' bonus, the curse and its locked save', async () => {
    const plan = compile(await spell('rank-2/rite-of-cleansing-flame'));
    const ritual = plan.resolution.ritualOutcome;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, ritual.base.areaCure.traits], ['ritual-outcome', 'automatic', ['emotion', 'mental']]);
    const {criticalSuccess: cs, success: s, failure: f, criticalFailure: cf} = ritual.outcomes;
    assert.deepEqual([cs.base, s.base, f.base, cf.base], [true, true, true, true]);
    assert.deepEqual([cs.casterEffects[0].duration.value, /Critical Success/.test(cs.casterEffects[0].name)], [30, true]);
    assert.deepEqual([/Failure/.test(f.casterEffects[0].name), f.casterEffects[0].kindNote], [true, 'This is a curse effect.']);
    assert.deepEqual([cf.casterEffects[0].uuid === f.casterEffects[0].uuid, cf.casterSaves[0].statistic, cf.casterSaves[0].dc, cf.casterSaves[0].failure.slug, cf.casterSaves[0].failure.value],
        [true, 'fortitude', 17, 'drained', 1]);
});

test('Rite of Cleansing Flame: changed rules are not read', async () => {
    const source = await spell('rank-2/rite-of-cleansing-flame');
    for (const [from, to] of [['weakness 5 to cold and unholy', 'weakness 10 to cold and unholy'], ['+1 status bonus against emotion and mental effects', '+2 status bonus against emotion and mental effects'],
        ['detrimental emotion and mental effects;', 'detrimental emotion and mental effects and 3d6 damage;'], ['dc:17] save or be permanently', 'dc:17] save or take 4d6 damage and be permanently']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'ritual-outcome', from);
    }
    // A changed save DC is read.
    const plan = compile(withText(source, html => html.replace('dc:17]', 'dc:19]')));
    assert.equal(plan.resolution.ritualOutcome.outcomes.criticalFailure.casterSaves[0].dc, 19);
});
