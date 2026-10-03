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


// Rank 3, batch 102 (2026-10-03): Thief of Fortune (affliction care's counteract against a spell Effect, lasting no more than 10 minutes, on the
// targeted creature; a success copies it to the caster and both keep half the remaining time).

test("Thief of Fortune: a siphoning counteract", async () => {
    const plan = compile(await spell("rank-3/thief-of-fortune"));
    assert.equal(plan.resolution.kind, "affliction-care");
    assert.equal(plan.resolution.recipient, "target");
    assert.deepEqual(plan.resolution.operations.map(op => [op.op, op.source, op.siphon, op.maxSeconds]), [["counteract", "spell-effect", true, 600]]);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    const { isExecutableCarePlan } = await import("../scripts/affliction-care-core.js");
    assert.equal(isExecutableCarePlan(plan), true);
    // A siphon without a duration limit isn't executable.
    const loose = structuredClone(plan); delete loose.resolution.operations[0].maxSeconds;
    assert.equal(isExecutableCarePlan(loose), false);
    // A different duration halving isn't read.
    const other = compile(withText(await spell("rank-3/thief-of-fortune"), html => html.replace("counts for two rounds", "counts for three rounds")));
    assert.notEqual(other.resolution.kind, "affliction-care");
});
