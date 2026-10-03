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


// Rank 3, batch 81 (2026-10-02): Bloody Tendrils (the tendril thralls the cast's targets — up to 3, 1 more every 3 ranks; an enemy ending its turn within 10 feet
// of any of them saves against PF2e's 1d12 bludgeoning, +1d12 every 3 ranks; the tendrils' immunity and stillness a note).

test("Bloody Tendrils: the thralls' reach at turn end", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/bloody-tendrils"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.aura, lingering.events, lingering.enemiesOnly, lingering.maxTargets.count, lingering.maxTargets.step],
        ["targets", { feet: 10 }, ["turn-end"], true, 3, { interval: 3, add: 1 }]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "turn-end" })).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.lingering.enemiesOnly = false;
    assert.equal(isExecutableLingeringPlan(bad), false);
    const other = compile(withText(await spell("rank-3/bloody-tendrils"), html => html.replace("reach of 10 feet", "reach of 15 feet").replace("Whenever an enemy", "Whenever a creature")));
    assert.equal(other.compilerEvidence.bloodTendrils, undefined);
});
