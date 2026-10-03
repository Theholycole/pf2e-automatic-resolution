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



// Rank 2, batch 81 (2026-10-01): Inveigle (the ritual-outcome family).

test('Inveigle: the attitude, its saves, the critical failure and the heightened durations', async () => {
    const plan = compile(await spell('rank-2/inveigle'));
    const ritual = plan.resolution.ritualOutcome;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, ritual.base.attitude.slug, ritual.base.endSave.statistic, ritual.base.negateSave.statistic],
        ['ritual-outcome', 'automatic', 'helpful', 'will', 'will']);
    assert.deepEqual([ritual.target.levelPerRank, ritual.duration.days, ritual.duration.dismissable], [2, 365, true]);
    const {criticalSuccess: cs, success: s, failure: f, criticalFailure: cf} = ritual.outcomes;
    assert.deepEqual([cs.base, cs.endPenalty, s.base, f.base, cf.base, cf.attitude.slug], [true, {value: -4, type: 'status'}, true, false, false, 'hostile']);
    assert.deepEqual([ritual.heightened.minRank, ritual.heightened.durations.map(entry => entry.days), ritual.heightened.notes.length], [6, [7, 30], 2]);
});

test('Inveigle: changed rules are not read', async () => {
    const source = await spell('rank-2/inveigle');
    for (const [from, to] of [['to negate the effect.', 'to negate the effect, and it takes 2d6 mental damage.'], ['becoming hostile to you for the duration.', 'becoming hostile to you and taking 4d6 damage.'],
        ['The base cost is 100 gp.', 'The base cost is 100 gp and the target is stunned 1.'], ['a Will save to end the effect early', 'a Will save each day to end the effect early']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'ritual-outcome', from);
    }
    // A changed attitude and penalty are read.
    const plan = compile(withText(source, html => html.replace('The target is helpful toward you', 'The target is friendly toward you').replace('-4 status penalty', '-2 status penalty')));
    assert.deepEqual([plan.resolution.ritualOutcome.base.attitude.slug, plan.resolution.ritualOutcome.outcomes.criticalSuccess.endPenalty.value], ['friendly', -2]);
});
