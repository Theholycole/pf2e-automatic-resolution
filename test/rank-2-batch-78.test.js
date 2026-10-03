import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {illusoryAt} from '../src/compiler/illusory-creature.js';

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



// Rank 2, batch 78 (2026-10-01): Illusory Creature.

test('Illusory Creature: the image, its Strike, Disbelieve, and its heightening', async () => {
    const plan = compile(await spell('rank-2/illusory-creature'));
    const image = plan.resolution.illusoryCreature;
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['illusory-creature', 'automatic']);
    assert.deepEqual([image.maxSize, image.rangeFeet, image.actions, image.saveOffset, image.strike.type, image.strike.nonlethal], ['lg', 500, 2, 10, 'mental', true]);
    assert.deepEqual([image.disbelieve.healHalf, image.disbelieve.immune], [true, true]);
    assert.deepEqual(illusoryAt(image, 2, 2), {maxSize: 'lg', formula: '3d4'});
    assert.deepEqual(illusoryAt(image, 3, 2), {maxSize: 'huge', formula: '4d4'});
    assert.deepEqual(illusoryAt(image, 6, 2), {maxSize: 'grg', formula: '7d4'});
});

test('Illusory Creature: changed rules are not read', async () => {
    const source = await spell('rank-2/illusory-creature');
    for (const [from, to] of [['Large or smaller', 'Huge or smaller'], ['spell DC – 10', 'spell DC – 5'], ['The illusion\'s Strikes are nonlethal.', 'The illusion\'s Strikes are lethal.'],
        ['it recovers from half the damage', 'it recovers from all the damage'], ['increases by 1d4', 'increases by 1d4 and it gains 10 Hit Points']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        if (from === 'Large or smaller') { assert.equal(plan.resolution.illusoryCreature.maxSize, 'huge'); continue; }
        if (from === 'spell DC – 10') { assert.equal(plan.resolution.illusoryCreature.saveOffset, 5); continue; }
        assert.notEqual(plan.resolution.kind, 'illusory-creature', from);
    }
});
