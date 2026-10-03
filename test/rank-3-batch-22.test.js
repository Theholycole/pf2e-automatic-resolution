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



// Rank 3, batch 22 (2026-10-02): condition + note and note spells: Invisibility Cloak, Clairvoyance, Clairaudience, Scouting Eye, Drop Dead,
// Beastmaster Trance, Eyes of the Dead, Time Skip.

const kind = async path => { const plan = compile(await spell(path)); return [plan.resolution.kind, plan.automation.level, plan.automation.pendingCapabilities.length]; };

test('Invisible things a spell creates are mentions: Clairvoyance, Clairaudience and Scouting Eye are notes', async () => {
    for (const path of ['rank-4/clairvoyance', 'rank-3/clairaudience', 'rank-5/scouting-eye']) assert.deepEqual(await kind(path), ['spell-note', 'automatic', 0]);
});

test('Granted conditions with a note: the caster Invisible (borrowed restrictions), the target Invisible, the caster Off-Guard, the target Quickened', async () => {
    const cases = [['rank-4/invisibility-cloak', 'source', 'invisible'], ['rank-5/drop-dead', 'target', 'invisible'], ['rank-3/beastmaster-trance', 'source', 'off-guard'],
        ['rank-3/eyes-of-the-dead', 'source', 'off-guard'], ['rank-3/time-skip', 'target', 'quickened']];
    for (const [path, recipient, slug] of cases) {
        const plan = compile(await spell(path));
        assert.deepEqual([plan.resolution.kind, plan.automation.pendingCapabilities, plan.resolution.conditionNote.recipient, plan.resolution.conditionNote.condition.slug], ['condition-note', [], recipient, slug], path);
    }
    assert.deepEqual(compile(await spell('rank-4/invisibility-cloak')).resolution.conditionNote.heightenedDurations.map(entry => [entry.minRank, entry.value, entry.unit]), [[6, 10, 'minutes'], [8, 1, 'hours']]);
    assert.deepEqual(compile(await spell('rank-3/time-skip')).targeting.actorConstraints.predicates, [{kind: 'not-caster'}]);
    // A grant in another shape stays off the route.
    assert.notEqual(compile(withText(await spell('rank-5/drop-dead'), html => html.replace('though it actually turns', 'and it turns'))).resolution.kind, 'condition-note');
});
