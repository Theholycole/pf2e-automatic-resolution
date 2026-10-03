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


// Rank 5, batch 33 (2026-10-02): Invoke Spirits (a sustained 10-foot burst: 2d4 mental + 2d4 void to living creatures, basic Will, when cast
// and wherever it's moved on the first Sustain each round; a critical failure Frightened 2 and Fleeing for 1 round — on a Sustain, no Fleeing).

test("Invoke Spirits: the Sustain's exposures don't flee", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/invoke-spirits"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.initial, lingering.events, lingering.sustainDrops.criticalFailure], [true, ["sustain"], ["fleeing"]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["frightened", "fleeing"]);
    assert.deepEqual(lingeringExposurePlan(plan, { event: "sustain" }).resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["frightened"]);
    assert.deepEqual(lingeringExposurePlan(plan, { event: null }).resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["frightened", "fleeing"]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "living-creature" }]);
    assert.equal(isExecutableLingeringPlan(plan), true);
    // Another exception isn't read.
    const other = compile(withText(await spell("rank-5/invoke-spirits"), html => html.replace("doesn't make them flee", "doesn't frighten them")));
    assert.equal(other.resolution.lingering?.sustainDrops, undefined);
    const broken = structuredClone(plan); broken.resolution.lingering.sustainDrops.criticalFailure = ["stunned"];
    assert.equal(isExecutableLingeringPlan(broken), false);
});
