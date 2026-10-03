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


// Rank 4, batch 27 (2026-10-02): spell notes — Airlift and Animal Vision (an unwilling creature's save that only keeps the spell off it),
// Misty Memory (being counteracted by strong winds), Wisdom of the Winds ("varies" with one option's 8-hour bound); notes keep their whole text.

test('Spell notes: unwilling saves, a passive counteract, an option\'s upper bound', async () => {
    const airlift = compile(await spell('rank-4/airlift'));
    assert.equal(airlift.resolution.kind, 'spell-note');
    assert.match(airlift.resolution.note.text, /unwilling participant can attempt a Reflex save/);
    const vision = compile(await spell('rank-3/animal-vision'));
    assert.equal(vision.resolution.kind, 'spell-note');
    assert.equal(compile(await spell('rank-4/misty-memory')).resolution.kind, 'spell-note');
    const winds = compile(await spell('rank-5/wisdom-of-the-winds'));
    assert.equal(winds.resolution.kind, 'spell-note');
    assert.deepEqual([winds.resolution.note.duration.value, winds.resolution.note.duration.unit], [8, 'hours']);
    assert.match(winds.resolution.note.text, /Voice of the Sky/);
    // An unwilling save that does more than keep the spell off isn't a note.
    const other = compile(withText(await spell('rank-4/airlift'), html => html.replace('to avoid being carried along', 'to avoid being knocked prone')));
    assert.notEqual(other.resolution.kind, 'spell-note');
});
