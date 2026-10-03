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
                mechanics: {rules, duration: e.system?.duration ?? null, start: e.system?.start ?? null}}); }
    } };
    await walk(new URL('spell-effects/', base));
    return map;
}

test('Faerie Dust: row Effects, the critical row carrying the failure Effect, "can\'t use reactions" as a GM note beside them', async () => {
    const effects = await catalog();
    const plan = compileAbility(await spell('rank-1/faerie-dust'), {nativeEffectCatalog: effects});
    assert.equal(inspectSavePlan(plan).supported, true, JSON.stringify(inspectSavePlan(plan).blockers));
    const critical = plan.resolution.outcomes.criticalFailure;
    assert.deepEqual(critical.nativeEffects.map(effect => [effect.reference, effect.outcomeRule.degree]).sort(),
        [['Spell Effect: Faerie Dust (Critical Failure)', 'criticalFailure'], ['Spell Effect: Faerie Dust (Failure)', 'criticalFailure']]);
    assert.deepEqual(plan.resolution.outcomes.failure.rowNotes.map(note => note.kind), ['no-reactions']);
    assert.deepEqual(critical.rowNotes.map(note => note.kind), ['no-reactions']);
    // A behaviour note alone, with nothing the row applies, is refused (the user's rule).
    const bare = structuredClone(plan);
    bare.resolution.outcomes.failure.nativeEffects = [];
    assert.ok(inspectSavePlan(bare).blockers.some(blocker => blocker.code === 'row-note'));
    // (Hollow Heart, whose rows are only behaviour, is resolved by note Effects since cantrip/rank-1 batch 6.)
});

function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) { if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object') mergeDeep(target[key], value); else target[key] = value; } return target; }
const variant = (source, time) => { const [, overlay] = Object.entries(source.system.overlays).find(([, o]) => o.system?.time?.value === time);
    const copy = structuredClone(source); copy.system = mergeDeep(copy.system, structuredClone(overlay.system)); delete copy.system.overlays; return copy; };

test('Kinetic Ram: the 1-action variant is a push save; the base spell and the variants with other rules stay blocked', async () => {
    const source = await spell('rank-1/kinetic-ram');
    const one = compileAbility(variant(source, '1'));
    assert.equal(inspectSavePlan(one).supported, true, JSON.stringify(inspectSavePlan(one).blockers));
    assert.deepEqual(['failure', 'criticalFailure'].map(degree => one.resolution.outcomes[degree].forcedMovement.distance), [10, 20]);
    assert.equal(inspectSavePlan(compileAbility(variant(source, '2'))).supported, false, 'doubled push, Prone and damage');
    // The base spell still has every action paragraph: never read as one variant.
    assert.equal(inspectSavePlan(compileAbility(source)).supported, false);
});
