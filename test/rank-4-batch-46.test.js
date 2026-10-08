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


// Rank 4, batch 46 (2026-10-02): Freezing Touch (5d4 persistent cold scaled by the Fortitude result — the card scales the persistent formula;
// a failure Immobilized for 1 minute or until it Escapes, a critical failure also Off-Guard while immobilized; the fire-trait escape a GM note).

test("Freezing Touch: scaled persistent damage", async () => {
    const plan = compile(await spell("rank-4/freezing-touch"));
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.equal(plan.resolution.sharedDamage.persistentScaled, true);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].damage.multiplier), [0.5, 1, 2]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => e.slug), ["immobilized", "off-guard"]);
    assert.equal(plan.resolution.outcomes.failure.noteEffects[0].label, "Fire loosens it");
    // Scaling without the stated rows is blocked.
    const broken = structuredClone(plan); delete broken.compilerEvidence.persistentRows;
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
});
