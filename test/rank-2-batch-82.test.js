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



// Rank 2, batch 82 (2026-10-01): Oil-Slicked Walls (the ritual-outcome family).

test('Oil-Slicked Walls: the Climb DC by degree and the casters\' backlash', async () => {
    const plan = compile(await spell('rank-2/oil-slicked-walls'));
    const ritual = plan.resolution.ritualOutcome;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, ritual.duration.days, ritual.secondary.casters], ['ritual-outcome', 'automatic', 7, 1]);
    const {criticalSuccess: cs, success: s, failure: f, criticalFailure: cf} = ritual.outcomes;
    assert.deepEqual([cs.climb.increase, cs.climb.dropOnFailure, s.climb.increase, s.climb.dropOnFailure, f.base, f.climb], [10, true, 5, false, false, null]);
    assert.deepEqual([cf.slip.days, cf.slip.save, cf.slip.skill, !!cf.slip.exempt], [7, 'reflex', 'acrobatics', true]);
});

test('Oil-Slicked Walls: changed rules are not read', async () => {
    const source = await spell('rank-2/oil-slicked-walls');
    for (const [from, to] of [['also drops anything they are carrying.', 'also drops anything they are carrying and takes 2d6 damage.'],
        ['A caster can Step or', 'A caster takes 1d6 damage and can Step or'], ['against the ritual\'s casting DC or fall', 'against the ritual\'s casting DC or take 3d6 damage and fall']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'ritual-outcome', from);
    }
    // A changed increase is read.
    const plan = compile(withText(source, html => html.replace('walls increases by 5.', 'walls increases by 4.')));
    assert.equal(plan.resolution.ritualOutcome.outcomes.success.climb.increase, 4);
});
