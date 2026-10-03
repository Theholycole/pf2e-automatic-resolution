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


// Rank 4, batch 120 (2026-10-03): Necrotic Radiation (a square's or an object holder's turn-end damage at the cast rank; an attended object's holder
// saves first, its result the spell's time).

test("Necrotic Radiation: the imbued object or square", async () => {
    const plan = compile(await spell("rank-4/necrotic-radiation"));
    assert.equal(plan.resolution.kind, "imbued-hazard");
    const data = plan.resolution.imbuedHazard;
    assert.deepEqual(data.byDegree, { criticalSuccess: 0, success: 60, failure: 600, criticalFailure: 86400 });
    assert.deepEqual([data.type, data.statistic, data.seconds], ["void", "reflex", 86400]);
    const { imbuedHazardFormula } = await import("../src/compiler/imbued-hazard.js");
    assert.deepEqual([4, 5, 6, 8].map(rank => imbuedHazardFormula(data, rank, 4)), ["2d6", "2d6", "3d6", "4d6"]);
    // Different times aren't read.
    const other = compile(withText(await spell("rank-4/necrotic-radiation"), html => html.replace("The spell lasts 10 minutes.", "The spell lasts 10 minutes and it is Sickened.")));
    assert.notEqual(other.resolution.kind, "imbued-hazard");
});
