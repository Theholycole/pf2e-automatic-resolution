import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {isExecutableLingeringPlan} from '../scripts/basic-save-core.js';

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



// Rank 3, batch 10 (2026-10-02): Iron Rain.

test('Iron Rain: the damage when cast, then difficult terrain for the spell, the pick-up note', async () => {
    const plan = compile(await spell('rank-3/iron-rain'));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([isExecutableLingeringPlan(plan), lingering.initial, lingering.events, lingering.terrain, lingering.durationSeconds],
        [true, true, [], {difficulty: 2, movement: ['walk'], hazardous: false}, 60]);
    assert.ok(/pick up one of the knives/.test(lingering.notes[0]));
});

test('Iron Rain: changed damage, terrain or heightening is not read', async () => {
    const source = await spell('rank-3/iron-rain');
    for (const [from, to] of [['3 persistent bleed damage', '4 persistent bleed damage'], ['creating difficult terrain that lasts', 'creating hazardous terrain that lasts'],
        ['wield it as a mundane dagger.', 'wield it as a mundane dagger, dealing 1d4 damage to itself.'], ['persistent bleed damage increases by 1.', 'persistent bleed damage increases by 2.']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.equal(Boolean(plan.resolution.lingering?.terrain) && isExecutableLingeringPlan(plan), false, from);
    }
});
