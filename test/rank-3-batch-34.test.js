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


// Rank 3, batch 34 (2026-10-02): Rouse Skeletons (a sustained lingering burst: difficult terrain, the save when the skeletons appear and on each
// Sustain after the GM moves the area).

test('Rouse Skeletons: terrain, the save when cast and on each Sustain', async () => {
    const plan = compile(await spell('rank-3/rouse-skeletons'));
    const lingering = plan.resolution.lingering;
    assert.equal(plan.automation.level, 'automatic');
    assert.equal(lingering.initial, true);
    assert.deepEqual(lingering.events, ['sustain']);
    assert.equal(lingering.sustained, true);
    assert.ok(lingering.terrain);
    assert.equal(lingering.notes.length, 2);
    assert.match(lingering.notes[1], /move the area up to 20 feet/);
    // The terrain sentence isn't silently taken as narration: without its reading, the area isn't read.
    const other = compile(withText(await spell('rank-3/rouse-skeletons'), html => html.replace('The area they fill is difficult terrain.', 'The area they fill is greater difficult terrain.')));
    assert.notEqual(other.automation.level, 'automatic');
});
