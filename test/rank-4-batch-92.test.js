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


// Rank 4, batch 92 (2026-10-02): Draw the Lightning (the target's basic Reflex save, the GM confirming it's taller or higher; the caster's answer for a cloudy or
// stormy sky adds 2d12; PF2e's Effect on the caster — its weapon choice, the toggle and the 1d12 (2d12 from 8th) on that weapon's first Strike each round).

test("Draw the Lightning: the bolt, the storm's dice and the charged weapon", async () => {
    const plan = compile(await spell("rank-4/draw-the-lightning"));
    assert.deepEqual([plan.resolution.check.basic, plan.resolution.diceUpgrade.adds.dice], [true, { count: 2, faces: 12, type: "electricity" }]);
    assert.deepEqual([plan.resolution.casterRowEffect.kind, plan.resolution.casterRowEffect.degrees.length, plan.resolution.casterRowEffect.heightened], ["weapon-cast", 4, { rank: 8, dice: 2 }]);
    assert.ok(plan.targeting.actorConstraints.predicates.some(p => p.kind === "gm-confirmed" && /taller than you or higher than you/.test(p.question)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another die isn't proven.
    const bad = structuredClone(plan); bad.resolution.casterRowEffect.dieSize = "d10";
    assert.ok((inspectSavePlan(bad).blockers ?? []).some(b => /caster's Effect/.test(b.message)));
    const other = compile(withText(await spell("rank-4/draw-the-lightning"), html => html.replace("cloudy or stormy sky", "clear sky")));
    assert.equal(other.compilerEvidence.drawLightning, undefined);
});
