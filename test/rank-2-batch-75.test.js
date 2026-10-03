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



// Rank 2, batch 75 (2026-10-01): Web.

import {webRadius} from '../src/compiler/web-area.js';

test('Web: the area by rank, the check (Athletics or Reflex), the penalty and Immobilized', async () => {
    const plan = compile(await spell('rank-2/web'));
    const web = plan.resolution.webArea;
    assert.deepEqual([plan.resolution.kind, plan.automation.level, web.skill, web.statistic, web.penalty, web.afterRounds, web.durationSeconds], ['web-area', 'automatic', 'athletics', 'reflex', 10, 1, 60]);
    assert.deepEqual([2, 3, 4, 7].map(rank => webRadius(web, rank)), [10, 10, 20, 20]);
    assert.equal(web.notes.length, 3);
});

test('Web: changed rows are not read', async () => {
    const source = await spell('rank-2/web');
    for (const [from, to] of [['–10-foot circumstance penalty to its Speeds until', '–15-foot circumstance penalty to its Speeds until'], ['an @Check[athletics] check or Reflex save', 'a Reflex save'], ['is immobilized until the start', 'is restrained until the start']]) {
        const plan = compile(withText(source, html => { assert.ok(html.includes(from), from); return html.replace(from, to); }));
        assert.notEqual(plan.resolution.kind, 'web-area', from);
    }
});
