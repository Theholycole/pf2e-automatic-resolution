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


// Rank 4, batch 101 (2026-10-03): Mirror's Misfortune (the duplicate a token when cast; the GM's control rolls the attacker's save; a failing row's
// misfortune on its next attack rolls — two, or four — for an hour, counted by the module; the duplicate shatters and the spell ends).

test("Mirror's Misfortune: the duplicate, the attacker's save and counted misfortune", async () => {
    const { rollConsumes } = await import("../scripts/climb-aid-runtime.js").catch(() => ({}));
    const plan = compile(await spell("rank-4/mirrors-misfortune"));
    assert.equal(plan.resolution.kind, "mirror-duplicate");
    assert.equal(plan.automation.level, "automatic");
    const data = plan.resolution.mirrorDuplicate;
    assert.deepEqual([data.statistic, data.durationSeconds, data.rows.failure.count, data.rows.criticalFailure.count, data.rows.failure.seconds], ["will", 60, 2, 4, 3600]);
    assert.equal(data.rows.success, undefined);
    assert.equal(data.notes.length, 3);
    if (rollConsumes) assert.equal(rollConsumes({ on: "attack-roll", count: 2 }, { type: "attack-roll", options: new Set() }), true);
    // Another row wording, or a duplicate that doesn't end the spell, isn't read.
    const other = compile(withText(await spell("rank-4/mirrors-misfortune"), html => html.replace("next two attack rolls", "next attack rolls")));
    assert.notEqual(other.resolution.kind, "mirror-duplicate");
    const lasting = compile(withText(await spell("rank-4/mirrors-misfortune"), html => html.replace("When the duplicate shatters, the spell ends.", "The duplicate reforms.")));
    assert.notEqual(lasting.resolution.kind, "mirror-duplicate");
});
