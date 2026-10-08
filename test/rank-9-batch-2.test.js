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


// Rank 9, batch 2 (2026-10-03, user decisions): adventure rituals left to the GM; Catch Your Name and Telepathic Demand as commands to the GM.

test("an adventure ritual no route resolves is the GM's: its text whispered as a note (Terminate Bloodline, Mindscape Shift)", async () => {
    for (const path of ["rank-6/terminate-bloodline", "rank-3/mindscape-shift"]) {
        const plan = compile(await spell(path));
        assert.deepEqual([plan.resolution.kind, plan.resolution.note.gmRitual, plan.automation.level], ["spell-note", true, "automatic"], path);
    }
});

test("Catch Your Name: the speaker's Will save; a failure whispers the GM to give the private name and location", async () => {
    const plan = compile(await spell("rank-6/catch-your-name"));
    assert.equal(inspectSavePlan(plan).supported, true);
    for (const degree of ["failure", "criticalFailure"]) assert.equal(plan.resolution.outcomes[degree].noteEffects[0].reveal.kind, "gm-command");
    assert.equal(plan.resolution.outcomes.success.noteEffects?.length ?? 0, 0);
});

test("Telepathic Demand: Suggestion's rows as GM commands; immune 1 day on a success, 30 days on a critical success; earlier contact the GM's question", async () => {
    const plan = compile(await spell("rank-9/telepathic-demand"));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.temporaryImmunity.byDegree, { criticalSuccess: { value: 30, unit: "days" }, success: { value: 1, unit: "days" } });
    assert.deepEqual([plan.resolution.outcomes.failure.noteEffects[0].duration.unit, plan.resolution.outcomes.criticalFailure.noteEffects[0].duration.unit], ["minutes", "hours"]);
    assert.equal(plan.targeting.actorConstraints.predicates[0].kind, "gm-confirmed");
});
