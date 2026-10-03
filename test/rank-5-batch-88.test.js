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


// Rank 5, batch 88 (2026-10-03): Summon Healing Servitor (Arrive: PF2e's Effect, its temporary Hit Points proved at both ranks; Depart: the healing and the
// undead's basic save of one roll).

test("Summon Healing Servitor: the servitor", async () => {
    const { servitorDice } = await import("../src/compiler/servitor.js");
    const plan = compile(await spell("rank-5/summon-healing-servitor"));
    assert.equal(plan.resolution.kind, "servitor");
    const data = plan.resolution.servitor;
    assert.deepEqual([data.size, data.speed, data.arrive.radius, data.arrive.tempHP, data.depart.radius, data.depart.statistic], ["Huge", 60, 20, 20, 30, "fortitude"]);
    assert.deepEqual([servitorDice(data, 5, 5), servitorDice(data, 7, 5)], ["3d8", "4d8"]);
    assert.ok(supported(data.harmPlan));
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/summon-healing-servitor"), html => html.replace("heal 3d8 Hit Points.", "heal 3d8 Hit Points and are quickened.")));
    assert.notEqual(other.resolution.kind, "servitor");
});
