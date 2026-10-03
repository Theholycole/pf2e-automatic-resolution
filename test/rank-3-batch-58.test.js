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


// Rank 3, batch 58 (2026-10-02): Dive and Breach (the splashes' basic Reflex save on the creatures the caster targets — 3d10 bludgeoning, +1d10 a
// rank, each creature once; the Leaps a note for the player).

test("Dive and Breach: the splashes' basic save", async () => {
    const plan = compile(await spell("rank-3/dive-and-breach"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual([plan.resolution.outcomes.success.damage.multiplier, plan.resolution.outcomes.criticalFailure.damage.multiplier], [0.5, 2]);
    assert.equal(plan.resolution.dataNotes.length, 2);
    assert.match(plan.resolution.dataNotes[1], /a creature in both takes the damage once/);
    // Another splash rule isn't read.
    const other = compile(withText(await spell("rank-3/dive-and-breach"), html => html.replace("creatures in multiple splash zones take damage only once", "creatures in both splash zones take damage twice")));
    assert.notDeepEqual(inspectSavePlan(other).blockers, []);
});
