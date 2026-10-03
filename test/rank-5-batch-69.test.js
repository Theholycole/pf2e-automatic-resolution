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


// Rank 5, batch 69 (2026-10-03): Establish Ward (the placed burst: the caster Quickened inside, Slowed 1 outside; the card's spell-attack Strikes of the
// picked physical type, the area and dice raised every 2 ranks).

test("Establish Ward: the ward", async () => {
    const plan = compile(await spell("rank-5/establish-ward"));
    assert.equal(plan.resolution.kind, "ward");
    const data = plan.resolution.ward;
    assert.deepEqual([data.seconds, data.radius, data.strike.dice, data.strike.faces, data.strike.range], [60, 30, 3, 8, "melee"]);
    assert.deepEqual(data.strike.types, ["bludgeoning", "piercing", "slashing"]);
    assert.deepEqual([data.inside.name, data.outside.name, data.outside.value], ["Quickened", "Slowed", 1]);
    assert.deepEqual(data.step, { interval: 2, feet: 5, dice: 1 });
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/establish-ward"), html => html.replace("while outside the area.", "while outside the area and Clumsy 1.")));
    assert.notEqual(other.resolution.kind, "ward");
});
