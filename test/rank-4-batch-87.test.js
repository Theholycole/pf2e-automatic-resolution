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


// Rank 4, batch 87 (2026-10-02): Bloodspray Curse (the Fortitude save; on a success or worse a 1-minute note whose controls — one per damage type — deal the
// added (rank ÷ 2)d6 of that type when a Strike would deal it 10 or more, once a round; on a failure also the persistent bleed).

test("Bloodspray Curse: the wounding Strike's added damage", async () => {
    const { isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/bloodspray-curse"));
    const td = d => plan.resolution.outcomes[d].noteEffects[0].triggeredDamage;
    assert.deepEqual([td("success").trigger, td("success").types, td("success").threshold, td("success").frequency, td("success").extra ?? null], ["strike-wound", ["piercing", "slashing"], 10, "round", null]);
    assert.deepEqual(td("failure").extra, { formula: "(floor(@item.rank/2))d6", type: "bleed", persistent: true });
    assert.deepEqual(td("criticalFailure").extra.type, "bleed");
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].duration.value, 1);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Once only is refused.
    assert.equal(isTriggeredDamage({ ...td("success"), frequency: "once" }), false);
    // Another heightening isn't read.
    const other = compile(withText(await spell("rank-4/bloodspray-curse"), html => html.replace("increases by 1d6, and the persistent", "increases by 2d6, and the persistent")));
    assert.equal(other.compilerEvidence.bloodspray, undefined);
});
