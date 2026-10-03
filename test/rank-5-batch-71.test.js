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


// Rank 5, batch 71 (2026-10-03): Flammable Fumes (the cloud's poison on entering or starting a turn, once per round; the blast's basic Reflex at the cast
// rank, a round after the cast, ending the spell).

test("Flammable Fumes: the cloud and the blast", async () => {
    const plan = compile(await spell("rank-5/flammable-fumes"));
    assert.equal(plan.resolution.kind, "fume-cloud");
    const data = plan.resolution.fumeCloud;
    assert.deepEqual([data.seconds, data.delayRounds, data.interval], [60, 1, 2]);
    assert.deepEqual(data.hazard, { dice: 2, faces: 6, type: "poison", step: 1 });
    assert.deepEqual(data.blast, { dice: 10, faces: 6, type: "fire", statistic: "reflex", step: 2 });
    assert.equal(data.blastPlan.resolution.sharedDamage.formula, "(10 + 2*floor((@item.rank - 5)/2))d6[fire]");
    assert.ok(supported(data.blastPlan));
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/flammable-fumes"), html => html.replace("only once per round.", "only once per round and is sickened.")));
    assert.notEqual(other.resolution.kind, "fume-cloud");
});
