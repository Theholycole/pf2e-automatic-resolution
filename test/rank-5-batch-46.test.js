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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 5, batch 46 (2026-10-02): Slither (Reflex, a lingering 20-foot burst: in it at the cast or ending a turn in it; failure 3d6 piercing and the
// persistent poison at the cast rank, Grabbed until it Escapes; critical failure double and Restrained; the snakes' AC and HP a reminder).

test("Slither: the lingering area's saves, the rows' damage and hold until it Escapes", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/slither"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial, plan.resolution.lingering.dismissible], [["turn-end"], true, true]);
    assert.deepEqual(plan.resolution.outcomes.failure.damage.formulas.map(f => f.formula), ["3d6[piercing]", "(floor((@item.rank - 3)/2))d6[persistent,poison]"]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.damage.formulas.map(f => f.formula), ["(2*(3d6))[piercing]", "(2*((floor((@item.rank - 3)/2))d6))[persistent,poison]"]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.endsWhen[0].event])), [[["grabbed", "escape"]], [["restrained", "escape"]]]);
    assert.ok(plan.resolution.reminders.some(r => /destroyed by 12 or more damage/.test(r.text)));
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "turn-end" })).blockers ?? [], []);
    // Other structured damage isn't replaced.
    const item = await spell("rank-5/slither"); Object.values(item.system.damage)[0].formula = "4d6";
    assert.equal(compile(item).compilerEvidence.graspingSnakes, undefined);
});
