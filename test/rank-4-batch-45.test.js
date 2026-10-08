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


// Rank 4, batch 45 (2026-10-02): Entangle Fate (2 to 4 creatures, Will: Off-Guard until its next turn / for 3 rounds; Stupefied 1 — and on a critical
// failure Enfeebled 1 and Clumsy 1 — only when at least two targets failed).

test("Entangle Fate: conditions gated on two failures", async () => {
    const { targetOutcomeConditions } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/entangle-fate"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    const slugs = degree => plan.resolution.outcomes[degree].effects.map(e => `${e.slug}${e.choiceGroup ? "*" : ""}`);
    assert.deepEqual(slugs("failure"), ["off-guard", "stupefied*"]);
    assert.deepEqual(slugs("criticalFailure"), ["off-guard", "stupefied*", "enfeebled*", "clumsy*"]);
    const state = degrees => ({ outcomes: plan.resolution.outcomes, targets: degrees.map((degree, index) => ({ id: String(index), degree })) });
    const applied = (degrees, index) => targetOutcomeConditions(state(degrees), state(degrees).targets[index]).map(e => e.slug);
    assert.deepEqual(applied(["failure", "success"], 0), ["off-guard"]);
    assert.deepEqual(applied(["failure", "criticalFailure"], 0), ["off-guard", "stupefied"]);
    assert.deepEqual(applied(["failure", "criticalFailure"], 1), ["off-guard", "stupefied", "enfeebled", "clumsy"]);
    // A gate of one isn't executable.
    const broken = structuredClone(plan); broken.resolution.outcomes.failure.effects[1].groupGate.minimum = 1;
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
});
