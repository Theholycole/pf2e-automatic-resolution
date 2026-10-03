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


// Rank 4, batch 61 (2026-10-02): Channel Arrogance (Will, 5d10 mental: success half and Fascinated 1 round; failure full, Fascinated 1 round and the
// flat check on speech (a note); critical failure double for 1 minute; a 1-action cast's result one degree better, the GM's answer).

test("Channel Arrogance: the quick cast and the praise", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/channel-arrogance"));
    assert.equal(plan.resolution.degreeAdjustment.predicate.kind, "gm-confirmed");
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [plan.resolution.outcomes[d].damage.multiplier, plan.resolution.outcomes[d].effects.map(e => [e.slug, e.duration.value, e.duration.unit])]),
        [[0.5, [["fascinated", 1, "rounds"]]], [1, [["fascinated", 1, "rounds"]]], [2, [["fascinated", 1, "minutes"]]]]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.label, n.duration.unit])), [[["Blurted praise", "rounds"]], [["Blurted praise", "minutes"]]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another quick-cast effect isn't read.
    const other = compile(withText(await spell("rank-4/channel-arrogance"), html => html.replace("one degree of success better", "two degrees of success better")));
    assert.equal(other.compilerEvidence.praiseRows, undefined);
});
