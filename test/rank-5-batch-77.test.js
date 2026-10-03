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


// Rank 5, batch 77 (2026-10-03): Spiritual Guardian (the guardian's Hit Points and dice by rank; the Attack's types; the protection's amount).

test("Spiritual Guardian: the guardian", async () => {
    const plan = compile(await spell("rank-5/spiritual-guardian"));
    assert.equal(plan.resolution.kind, "guardian");
    const data = plan.resolution.guardian;
    assert.deepEqual([data.seconds, data.size, data.hp, data.moveFeet, data.absorb], [60, "med", 50, 120, 10]);
    assert.deepEqual(data.attack, { dice: 3, faces: 8, types: ["bludgeoning", "piercing", "slashing", "spirit"] });
    assert.deepEqual(data.step, { interval: 2, dice: 1, hp: 20 });
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/spiritual-guardian"), html => html.replace("You and your allies can flank with the guardian.", "You and your allies can flank with the guardian and gain cover.")));
    assert.notEqual(other.resolution.kind, "guardian");
});
