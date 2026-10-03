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



// Rank 4, batch 7 (2026-10-02): Movanic Glimmer, Forgotten Lines, Wordsmith (and Impart Empathy's "1 animal" target).

test('Movanic Glimmer: +2 status to Perception and Will on the note (the Command clause is situational); the target must be an animal', async () => {
    const plan = compile(await spell('rank-4/movanic-glimmer'));
    assert.deepEqual([plan.resolution.kind, plan.automation.pendingCapabilities], ['spell-note', []]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{kind: 'trait', slug: 'animal', present: true}]);
});

test('Forgotten Lines: "varies" with nothing timed is instantaneous; Wordsmith: until the caster Refocuses (no fixed end); text targets are things', async () => {
    const lines = compile(await spell('rank-4/forgotten-lines'));
    assert.deepEqual([lines.resolution.kind, lines.resolution.note.duration, lines.automation.pendingCapabilities], ['spell-note', null, []]);
    const word = compile(await spell('rank-4/wordsmith'));
    assert.deepEqual([word.resolution.kind, word.resolution.note.duration, word.automation.pendingCapabilities], ['spell-note', {mode: 'unlimited'}, []]);
    // A timed rule in the text keeps "varies" unresolved.
    assert.notEqual(compile(withText(await spell('rank-4/forgotten-lines'), html => html.replace('You learn one piece', 'For 1 hour, you learn one piece'))).automation.pendingCapabilities.length, 0);
});
