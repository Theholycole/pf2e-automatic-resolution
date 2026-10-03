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


// Rank 4, batch 88 (2026-10-02): Achaekek's Clutch (the Will save; on a success or worse a note — 1 minute, or unlimited after a failure — whose control deals
// the persistent bleed damage it just gained as slashing damage, once a round; the critical failure's flat-check DC in its note).

test("Achaekek's Clutch: the bleed's amount as slashing damage", async () => {
    const { isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/achaekeks-clutch"));
    const note = d => plan.resolution.outcomes[d].noteEffects[0];
    assert.deepEqual([note("success").triggeredDamage.trigger, note("success").triggeredDamage.persistentType, note("success").triggeredDamage.type, note("success").duration.value],
        ["bleed-gained", "bleed", "slashing", 1]);
    assert.deepEqual([note("failure").duration.mode, note("criticalFailure").duration.mode], ["unlimited", "unlimited"]);
    assert.match(note("criticalFailure").text, /increases to 20 \(15 with particularly effective assistance\)/);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    assert.equal(isTriggeredDamage({ ...note("success").triggeredDamage, frequency: "each" }), false);
    const other = compile(withText(await spell("rank-4/achaekeks-clutch"), html => html.replace("unlimited duration", "duration of 1 day")));
    assert.equal(other.compilerEvidence.mantisMark, undefined);
});
