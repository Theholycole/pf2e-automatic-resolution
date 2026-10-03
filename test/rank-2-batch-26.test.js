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



// Rank 2, batch 26 (2026-10-01): athletic maneuvers made with a spell attack roll (Telekinetic Maneuver, Vanish Weapon's reaction Disarm).

test('Telekinetic Maneuver: the four maneuvers with a spell attack roll', async () => {
    const plan = compile(await spell('rank-2/telekinetic-maneuver'));
    assert.equal(plan.resolution.kind, 'spell-maneuver');
    assert.deepEqual(plan.resolution.spellManeuver, {actions: ['disarm', 'shove', 'reposition', 'trip'], melee: false, notes: []});
    const other = compile(withText(await spell('rank-2/telekinetic-maneuver'), text => text.replace('instead of an Athletics check', 'with a +2 bonus')));
    assert.notEqual(other.resolution.kind, 'spell-maneuver');
});

test('Vanish Weapon: a reaction Disarm with a melee spell attack, its trigger, and the GM\'s notes', async () => {
    const plan = compile(await spell('rank-2/vanish-weapon'));
    assert.equal(plan.resolution.kind, 'spell-maneuver');
    const data = plan.resolution.spellManeuver;
    assert.deepEqual([data.actions, data.melee, data.notes.length], [['disarm'], true, 6]);
    assert.match(data.trigger, /melee Strike with a weapon targeting you/);
    const other = compile(withText(await spell('rank-2/vanish-weapon'), text => text.replace('This reaction doesn\'t prevent damage from a successful Strike.', 'The Strike deals no damage.')));
    assert.notEqual(other.resolution.kind, 'spell-maneuver');
});
