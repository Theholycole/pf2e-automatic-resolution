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


// Rank 3, batch 40 (2026-10-02): Radiant Globe (attackers shooting through the globe: the GM's control with the Fortitude save's rows — Dazzled,
// Blinded on a critical failure; the destroyed ammunition a note).

test('Radiant Globe: the GM control, the rows and the note', async () => {
    const plan = compile(await spell('rank-3/radiant-globe'));
    const lingering = plan.resolution.lingering;
    assert.deepEqual(lingering.events, []);
    assert.deepEqual(lingering.gmAction.actions, ['shoot']);
    assert.equal(lingering.notes.length, 1);
    assert.equal(plan.resolution.outcomes.failure.effects[0].slug, 'dazzled');
    assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].slug, 'blinded');
    assert.deepEqual(plan.resolution.outcomes.success.effects, []);
    // Another critical-failure clause isn't read.
    const other = compile(withText(await spell('rank-3/radiant-globe'), html => html.replace('for 1 round on a critical failure', 'until the spell ends on a critical failure')));
    assert.equal(other.resolution.lingering, undefined);
});
