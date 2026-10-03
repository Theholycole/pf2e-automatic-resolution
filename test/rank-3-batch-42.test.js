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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 3, batch 42 (2026-10-02): Trade Items (a note: the unwilling holder's save only keeps the item; an item in a creature's possession is an
// item target).

test('Trade Items: a note with the unwilling save', async () => {
    const plan = compile(await spell('rank-3/trade-items'));
    assert.equal(plan.resolution.kind, 'spell-note');
    assert.equal(plan.automation.level, 'automatic');
    assert.equal(plan.targeting.actorConstraints.complete, true);
    assert.match(plan.resolution.note.text, /prevent the transposition with a successful Reflex save/);
    // An unwilling save with another result isn't a note.
    const other = compile(withText(await spell('rank-3/trade-items'), html => html.replace('prevent the transposition', 'steal both items')));
    assert.notEqual(other.resolution.kind, 'spell-note');
});
