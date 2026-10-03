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


// Rank 3, batch 88 (2026-10-03): Cyclone Rondo (a placed area of difficult terrain for the sustained spell; its creatures save or fall Prone when it
// appears; on each Sustain the GM moves it and the creatures it covers take the basic save of the damage at the cast rank).

test("Cyclone Rondo: Prone when it appears, a basic save of its own on each Sustain", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/cyclone-rondo"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.initial, lingering.events, lingering.centre, lingering.sustained, lingering.terrain.difficulty], [true, ["sustain"], "placed", true, 2]);
    assert.equal(lingering.sustainBasic.formula, "(4+(@item.rank - 3)*1)d6[untyped]");
    const initial = lingeringExposurePlan(plan, { event: "initial" });
    assert.deepEqual(["failure", "criticalFailure"].map(degree => initial.resolution.outcomes[degree].effects.map(effect => effect.slug)), [["prone"], ["prone"]]);
    assert.equal(initial.resolution.check.basic, false);
    const sustain = lingeringExposurePlan(plan, { event: "sustain" });
    assert.equal(supported(sustain), true);
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(degree => [sustain.resolution.outcomes[degree].damage.multiplier, sustain.resolution.outcomes[degree].effects.length]),
        [[0, 0], [0.5, 0], [1, 0], [2, 0]]);
    const bad = structuredClone(plan); bad.resolution.lingering.sustainBasic.formula = "(4+@actor.level)d6[untyped]";
    assert.equal(isExecutableLingeringPlan(bad), false);
    // A heightening PF2e's data doesn't have isn't read.
    const other = compile(withText(await spell("rank-3/cyclone-rondo"), html => html.replace("increases by 1d6", "increases by 2d6")));
    assert.equal(other.compilerEvidence.whirlwind, undefined);
});
