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


// Rank 5, batch 37 (2026-10-02): Grisly Growths (10d6 piercing to the target, basic Fortitude; unless it critically succeeds, the creatures within
// 30 feet of it, it included, save Will: Sickened 1 / Sickened 2, then temporarily immune for 1 hour).

test("Grisly Growths: the second save around the target", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/grisly-growths"));
    const follow = plan.resolution.areaFollowUp;
    assert.deepEqual([follow.radius, follow.unless, follow.plan.resolution.check.statistic, follow.plan.resolution.temporaryImmunity.duration], [30, ["criticalSuccess"], "will", { value: 1, unit: "hours" }]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => follow.plan.resolution.outcomes[d].effects.map(e => [e.slug, e.value])), [[["sickened", 1]], [["sickened", 2]]]);
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const broken = structuredClone(plan); broken.resolution.areaFollowUp.radius = 0;
    assert.equal(inspectSavePlan(broken).supported, false);
    // Another gate isn't read.
    const other = compile(withText(await spell("rank-5/grisly-growths"), html => html.replace("unless the initial target critically succeeds", "if the initial target fails")));
    assert.equal(other.resolution.areaFollowUp, undefined);
});
