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


// Rank 5, batch 36 (2026-10-02): Corrosive Muck (two 10-foot bursts, one more each 2 ranks, of greater difficult terrain for 1 minute; a creature
// starting its turn in a pool or entering one takes 8d6 acid, basic Reflex, once a round; a critical failure also 1d6 persistent acid).

test("Corrosive Muck: the pools", async () => {
    const { isExecutableLingeringPlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/corrosive-muck"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.oncePerRound, lingering.areaCount, lingering.area, lingering.terrain.difficulty, lingering.areaCountStep.interval],
        [["enter", "turn-start"], true, 2, { type: "burst", value: 10 }, 3, 2]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.damage.formulas.map(f => f.formula), ["1d6[persistent,acid]"]);
    assert.equal(isExecutableLingeringPlan(plan), true);
    const broken = structuredClone(plan); broken.compilerEvidence.acidPools = undefined;
    assert.equal(isExecutableLingeringPlan(broken), false);
    // Another heightening isn't read.
    const other = compile(withText(await spell("rank-5/corrosive-muck"), html => html.replace("Create an additional 10-foot burst", "The damage increases by 2d6")));
    assert.equal(other.resolution.lingering, undefined);
});
