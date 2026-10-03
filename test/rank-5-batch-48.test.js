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


// Rank 5, batch 48 (2026-10-02): Consuming Darkness (Reflex, a sustained lingering 10-foot emanation: enemies entering or starting a turn in it; half /
// full / double void; −5 / −10-foot Speeds until it leaves; Immobilized for 1 round or until it Escapes; the radius +5 feet on each round's first Sustain).

test("Consuming Darkness: the lingering saves, Speed penalties until it leaves, and the growth on Sustain", async () => {
    const { isExecutableLingeringPlan, isSustainGrowth, lingeringExposurePlan, inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/consuming-darkness"));
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([plan.resolution.lingering.events, plan.resolution.lingering.initial, plan.resolution.lingering.enemiesOnly, plan.resolution.lingering.sustainGrowth.feet], [["enter", "turn-start"], false, true, 5]);
    assert.equal(isSustainGrowth(plan.resolution.lingering), true);
    assert.equal(isSustainGrowth({ ...plan.resolution.lingering, sustained: false }), false);
    assert.deepEqual(["success", "failure"].map(d => plan.resolution.outcomes[d].modifiers.map(m => [m.value, m.modifierType, m.duration.mode])), [[[-5, "circumstance", "leave-area"]], [[-10, "circumstance", "leave-area"]]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.endsWhen[0].event]), [["immobilized", "escape"]]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "turn-start" })).blockers ?? [], []);
    // Another growth isn't read.
    const other = compile(withText(await spell("rank-5/consuming-darkness"), html => html.replace("the radius increases by 5 feet", "the radius may increase by 5 feet")));
    assert.equal(other.compilerEvidence.consumingShadow, undefined);
});
