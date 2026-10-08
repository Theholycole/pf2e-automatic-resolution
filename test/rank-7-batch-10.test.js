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


// Rank 7, batch 10 (2026-10-03): Entrancing Eyes.
import { isExecutableLingeringPlan as eyesReady } from "../scripts/basic-save-core.js";

test("Entrancing Eyes: the caster's emanation (turn-end Will saves); a critical success immune to this casting; the critical failure's note; the Sustain focus a GM control", async () => {
    const plan = compile(await spell("rank-7/entrancing-eyes"));
    assert.equal(eyesReady(plan), true);
    assert.deepEqual([plan.resolution.temporaryImmunity.byCaster, plan.resolution.temporaryImmunity.degrees, plan.resolution.lingering.gmAction.actions], [true, ["criticalSuccess"], ["focus"]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.value]), [["stupefied", 4], ["fascinated", null]]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.noteEffects.map(note => note.label), ["Entranced", "Focused"]);
});
