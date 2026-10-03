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



// Rank 2, batch 41 (2026-10-01): Flame Wisp, Instant Armor.

test('Flame Wisp: counted wisps, PF2e\'s per-Strike dice removed; Instant Armor: the action that calls the armor back', async () => {
    const wisp = compile(await spell('rank-2/flame-wisp'));
    assert.deepEqual([wisp.resolution.kind, wisp.automation.level], ['wisps', 'automatic']);
    const {count, dice, die, type, heightening, ruleOverrides} = wisp.resolution.wisps;
    assert.deepEqual([count, dice, die, type, heightening, ruleOverrides], [3, 1, 4, 'fire', {interval: 2, dice: 1}, [{index: 0, key: 'DamageDice', remove: true}]]);
    const armor = compile(await spell('rank-2/instant-armor'));
    assert.deepEqual([armor.resolution.kind, armor.automation.level, armor.resolution.storedArmor.actionUuid], ['stored-armor', 'automatic', 'Compendium.pf2e.actionspf2e.Item.8b63qGzqSUENQgOT']);
    // Changed text isn't read.
    assert.notEqual(compile(withText(await spell('rank-2/flame-wisp'), html => html.replace('fewer than three wisps', 'fewer than five wisps'))).resolution.kind, 'wisps');
    assert.notEqual(compile(withText(await spell('rank-2/instant-armor'), html => html.replace('the spell ends', 'you gain 5 temporary Hit Points'))).resolution.kind, 'stored-armor');
});
