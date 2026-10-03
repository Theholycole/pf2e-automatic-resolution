import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

const base = new URL('../.cache/pf2e-test-fixtures/', import.meta.url);
const spell = async path => JSON.parse(await readFile(new URL(`spells/spells/${path}.json`, base), 'utf8'));
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };
async function catalog() {
    const map = new Map();
    const walk = async dir => { for (const entry of await readdir(dir, {withFileTypes: true})) {
        const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
        if (entry.isDirectory()) await walk(path);
        else if (entry.name.endsWith('.json')) { const e = JSON.parse(await readFile(path, 'utf8')); const rules = e.system?.rules ?? [];
            map.set(e.name, {id: e._id, name: e.name, type: e.type, automation: {ruleKeys: [...new Set(rules.map(r => r.key))], requiresConfiguration: false, removesAfterRoll: false},
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Incendiary Aura: PF2e\'s aura Effect as the marker; a creature in it that takes fire damage catches on fire', async () => {
    const plan = compileAbility(await spell('rank-1/incendiary-aura'), {nativeEffectCatalog: await catalog()});
    assert.equal(plan.resolution.kind, 'retaliation');
    const data = plan.resolution.retaliation;
    assert.match(data.effect.label, /Incendiary Aura/);
    assert.deepEqual([data.triggers.length, data.triggers[0].damage], [1, {formula: '(ceil(@item.level/2)+1)d4', type: 'fire', persistent: true}]);
});

test('Incendiary Aura: kept strict', async () => {
    const effects = await catalog();
    const source = await spell('rank-1/incendiary-aura');
    // Without PF2e's Effect in the catalog, or with another rule, it isn't read.
    assert.notEqual(compileAbility(source, {nativeEffectCatalog: new Map()}).resolution.kind, 'retaliation');
    assert.notEqual(compileAbility(withText(source, text => text.replace('damage.</p>', 'damage. It is also Dazzled.</p>')), {nativeEffectCatalog: effects}).resolution.kind, 'retaliation');
});
