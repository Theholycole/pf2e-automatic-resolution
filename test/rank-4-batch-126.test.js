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


// Rank 4, batch 126 (2026-10-03): Life's Flowing River (the lingering line; the damage only for undead and nindoru creatures, at the cast rank; Prone and
// the push; the river difficult terrain per creature until its next turn; a critical success immune until then).

test("Life's Flowing River: the river", async () => {
    const plan = compile(await spell("rank-4/lifes-flowing-river"));
    const { isExecutableLingeringPlan, damageMultiplierForTarget } = await import("../scripts/basic-save-core.js");
    assert.equal(isExecutableLingeringPlan(plan), true);
    const area = plan.resolution.lingering;
    assert.deepEqual([area.events.sort(), area.area, area.rowTerrain.until], [["enter", "turn-start"], { type: "line", value: 120 }, "next-turn-start"]);
    assert.deepEqual(plan.resolution.damageTraits.traits, ["undead", "nindoru"]);
    assert.equal(plan.resolution.sharedDamage.formula, "(4 + 1*floor((@item.rank - 4)/1))d6[mental]");
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 1, unit: "rounds", expiry: "turn-start" });
    assert.equal(plan.resolution.outcomes.criticalFailure.forcedMovement.distance, 20);
    assert.equal(damageMultiplierForTarget({ damageTraits: plan.resolution.damageTraits }, { traitDamage: false, degree: "failure" }), 0);
    // Unproved trait damage isn't supported.
    const broken = structuredClone(plan); broken.resolution.damageTraits.sourceText = "other";
    assert.equal(isExecutableLingeringPlan(broken), false);
});
