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



// Rank 2, batch 69 (2026-10-01): Mark of Blood.

test('Mark of Blood: the weapon\'s next hit, the Will save, the mark and Seek by outcome', async () => {
    const plan = compile(await spell('rank-2/mark-of-blood'));
    const mark = plan.resolution.bloodMark;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, mark.statistic, mark.durationSeconds], ['blood-mark', 'automatic', 'will', 60]);
    assert.deepEqual(mark.marks, {criticalSuccess: null, success: 'none', failure: 'check', criticalFailure: 'auto'});
    assert.deepEqual(mark.seek, {against: 'will', withinFeet: 5280});
    assert.deepEqual(mark.damageTypes, ['piercing', 'slashing']);
});

test('Mark of Blood: changed rows or trigger are not read', async () => {
    const source = await spell('rank-2/mark-of-blood');
    for (const [from, to] of [['are automatically successful', 'gain a +2 bonus'], ['The next creature you successfully Strike', 'Each creature you successfully Strike'], ['On a critical failure, the curse ends', 'On a failure, the curse ends']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'blood-mark', from);
    }
});
