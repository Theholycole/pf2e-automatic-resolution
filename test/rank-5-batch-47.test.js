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


// Rank 5, batch 47 (2026-10-02): Sawtooth Terrain (Reflex, a lingering 20-foot burst of difficult terrain: in it at the cast or ending a turn in it;
// half / full + bleed / double + double bleed; the Speed penalty — −10 / −15 — a note with PF2e's modifier until the GM ends it).

test("Sawtooth Terrain: the lingering terrain and saves, the rows' bleed, the Speed notes", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/sawtooth-terrain"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial, plan.resolution.lingering.terrain?.difficulty], [["turn-end"], true, 2]);
    assert.deepEqual([plan.resolution.outcomes.success.damage.multiplier, plan.resolution.outcomes.failure.damage.shared.multiplier, plan.resolution.outcomes.criticalFailure.damage.shared.multiplier], [0.5, 1, 2]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].damage.formulas[0].formula),
        ["(floor((@item.level -1)/2))d6[persistent,bleed]", "(2*((floor((@item.level -1)/2))d6))[persistent,bleed]"]);
    assert.deepEqual(["failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].noteEffects.map(n => [n.rules[0].selector, n.rules[0].value, n.duration.mode])),
        [[["land-speed", -10, "unlimited"]], [["land-speed", -15, "unlimited"]]]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "turn-end" })).blockers ?? [], []);
    // Another success row isn't read.
    const other = compile(withText(await spell("rank-5/sawtooth-terrain"), html => html.replace("half damage and no persistent damage", "half damage and half persistent damage")));
    assert.equal(other.compilerEvidence.sawtoothRows, undefined);
});
