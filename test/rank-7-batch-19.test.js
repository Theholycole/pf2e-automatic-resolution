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


// Rank 7, batch 19 (2026-10-05): the end of feature group 8 — Control Sand and Vibrant Vibrato (mode-cards.js: an area's own save, a held shield, a
// growing sandstorm; a save kept per creature with its turn-end damage and the shattering sound on leaving).
import { inspectParts } from '../scripts/basic-save-core.js';
const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));

test("Control Sand: the sandstorm's Fortitude save (Dazzled while inside, 10 minutes' immunity); Sand Shield's stats, Sandblast's save, Sandstorm's 30 feet and 6d4", async () => {
    const plan = compile(await spell("rank-7/control-sand"));
    assert.equal(plan.resolution.kind, "incarnate");
    assert.deepEqual(inspectParts(plan.resolution.incarnate.phases), []);
    const hazard = plan.resolution.incarnate.area.base.hazard;
    assert.deepEqual([hazard.events, hazard.conditionSave.statistic, hazard.conditionSave.rows.failure.expiry, hazard.conditionSave.immunity.seconds], [["enter", "turn-start"], "fortitude", "leave-area", 600]);
    const phases = phasesOf(plan);
    assert.deepEqual([phases["sand-shield"].state.shield.hardness, phases["sand-shield"].state.shield.hp, phases["sand-shield"].state.shield.acBonus], [14, 21, 0]);
    assert.deepEqual([phases.sandstorm.state.radius, phases.sandstorm.state.child.formula, phases.sandstorm.state.child.basic], [30, "6d4", "reflex"]);
    assert.deepEqual(phases["sandblast-action"].plan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["dazzled"]);
});

test("Vibrant Vibrato: the chosen radius up to 40 feet; one Will save kept per creature; 5d10 sonic at the end of its turns; the shattering sound's dice by rank", async () => {
    const plan = compile(await spell("rank-7/vibrant-vibrato"));
    assert.equal(plan.resolution.kind, "incarnate");
    const area = plan.resolution.incarnate.area;
    assert.deepEqual([area.radius, area.chooseRadius, area.base.hazard.events], [40, true, ["enter", "turn-end"]]);
    const kept = area.base.hazard.remembered;
    assert.deepEqual([kept.rows.success.turnEnd, kept.rows.success.leave, kept.rows.failure.leave, kept.rows.criticalFailure.leave], [{ formula: "5d10", type: "sonic" }, undefined, { multiplier: 1, stunned: 1 }, { multiplier: 2, stunned: 3 }]);
    assert.deepEqual(kept.leaveDice, { base: 5, die: "10", type: "sonic", step: 1, baseRank: 7 });
});
