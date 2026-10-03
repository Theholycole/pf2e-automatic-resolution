import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';

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



// Rank 3, batch 19 (2026-10-02): Wall of Shadow, Wall of Water — note walls.

test('Wall of Shadow: a note; "treat targets seen through the wall as Concealed" is a mention, not a grant', async () => {
    const plan = compile(await spell('rank-3/wall-of-shadow'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['spell-note', 'automatic']);
    assert.notEqual(compile(withText(await spell('rank-3/wall-of-shadow'), html => html.replace('They treat targets seen through the wall as', 'They become'))).resolution.kind, 'spell-note');
});

test('Wall of Water: a note whose card counteracts magical fires; the "For instance" penalty is the aquatic rules\' example', async () => {
    const plan = compile(await spell('rank-3/wall-of-water'));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ['spell-note', 'automatic']);
    assert.deepEqual(plan.resolution.note.heightenedCounteract.map(entry => [entry.base, entry.target]), [[true, 'any magical fires in its area']]);
    assert.notEqual(compile(withText(await spell('rank-3/wall-of-water'), html => html.replace("If the wall fails to counteract a given fire, it can't counteract that fire for the duration of the spell.", 'The wall can counteract fires again each round.'))).resolution.kind, 'spell-note');
});
