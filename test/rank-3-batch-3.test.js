import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {sustainedSaveDamageAt} from '../src/compiler/sustained-save-damage.js';

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



// Rank 3, batch 3 (2026-10-02): Personal Blizzard.

test('Personal Blizzard: the rows, the lingering failure and the flat heightening', async () => {
    const plan = compile(await spell('rank-3/personal-blizzard'));
    const data = plan.resolution.sustainedSaveDamage;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, data.statistic, data.type, data.durationSeconds], ['sustained-save-damage', 'automatic', 'fortitude', 'cold', 60]);
    assert.deepEqual(sustainedSaveDamageAt(data, 'success', 3, 3), {direct: '1d6[cold]', persistent: null});
    assert.deepEqual(sustainedSaveDamageAt(data, 'failure', 3, 3), {direct: '1d6[cold]', persistent: '1d6[persistent,cold]'});
    assert.deepEqual(sustainedSaveDamageAt(data, 'criticalFailure', 3, 3), {direct: '2d6[cold]', persistent: '2d6[persistent,cold]'});
    assert.deepEqual(sustainedSaveDamageAt(data, 'failure', 5, 3), {direct: '(1d6+2)[cold]', persistent: '(1d6+2)[persistent,cold]'});
    assert.deepEqual(sustainedSaveDamageAt(data, 'criticalFailure', 5, 3), {direct: '(2d6+4)[cold]', persistent: '(2d6+4)[persistent,cold]'});
});

test('Personal Blizzard: changed rules are not read', async () => {
    const source = await spell('rank-3/personal-blizzard');
    for (const [from, to] of [['damage, and the spell ends.', 'damage and is Dazzled, and the spell ends.'], ['The persistent damage automatically ends when the spell ends.', 'The persistent damage lasts.'],
        ['increase to 2d6.', 'increase to 2d6 and it is Slowed 1.'], ['increase by 1 (2 on a critical failure)', 'increase by 1d6 (2d6 on a critical failure)']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'sustained-save-damage', from);
    }
    const plan = compile(withText(source, html => html.replace('increase to 2d6.', 'increase to 3d6.')));
    assert.equal(plan.resolution.sustainedSaveDamage.criticalFailure.formula, '3d6');
});
