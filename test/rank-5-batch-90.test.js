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


// Rank 5, batch 90 (2026-10-03): Ember Doppelgänger (the duplicate's statistics; the blast's basic save of the damage at the rank).

test("Ember Doppelgänger: the duplicate", async () => {
    const plan = compile(await spell("rank-5/ember-doppelgänger"));
    assert.equal(plan.resolution.kind, "ember-double");
    const data = plan.resolution.emberDouble;
    assert.deepEqual([data.seconds, data.ac, data.hp, data.stride, data.burst, data.reach], [60, 10, 50, 30, 10, 30]);
    assert.deepEqual(data.immune, ["critical-hits", "precision", "immobilized", "prone", "restrained"]);
    assert.deepEqual(data.weakness, { value: 10, types: ["cold", "water"] });
    assert.equal(data.blastPlan.resolution.sharedDamage.formula, "(6 + 1*(@item.rank - 5))d6[fire]");
    assert.ok(supported(data.blastPlan));
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/ember-doppelgänger"), html => html.replace("weakness 10 to cold and water.", "weakness 10 to cold and water, and it can fly.")));
    assert.notEqual(other.resolution.kind, "ember-double");
});
