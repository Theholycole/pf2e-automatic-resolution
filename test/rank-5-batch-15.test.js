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


// Rank 5, batch 15 (2026-10-02): Horizon's Veil (the item has no save: the text's turn-end Will save with its rows, on a lingering area of
// difficult terrain; the attacks passing through are a GM note; dismissable).

test("Horizon's Veil: the text's area save, terrain and the note", async () => {
    const plan = compile(await spell("rank-5/horizons-veil"));
    assert.equal(plan.resolution.check.statistic, 'will');
    assert.equal(plan.resolution.check.basic, false);
    const lingering = plan.resolution.lingering;
    assert.deepEqual(lingering.events, ['turn-end']);
    assert.ok(lingering.terrain);
    assert.equal(lingering.dismissible, true);
    assert.equal(lingering.notes.length, 1);
    assert.equal(plan.resolution.outcomes.failure.effects[0].slug, 'slowed');
    // Another save sentence isn't read.
    const other = compile(withText(await spell("rank-5/horizons-veil"), html => html.replace('must succeed at a Will save or become', 'must succeed at a Will save twice or become')));
    assert.notEqual(other.resolution.kind, 'save');
});
