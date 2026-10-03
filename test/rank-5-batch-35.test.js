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


// Rank 5, batch 35 (2026-10-02): Blood-Feasting Breath (two 30-foot cones: 5d6 void to living creatures in the first, basic Fortitude; the caster
// and living creatures in the second regain the most any one creature took).

test("Blood-Feasting Breath: the second cone's healing", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/blood-feasting-breath"));
    assert.deepEqual(plan.resolution.healSpread, { measure: "most-lost", caster: true, recipients: "living", sourceText: plan.resolution.healSpread.sourceText });
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "living-creature" }]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const broken = structuredClone(plan); broken.resolution.healSpread.measure = "total";
    assert.equal(inspectSavePlan(broken).supported, false);
    // Another measure isn't read.
    const other = compile(withText(await spell("rank-5/blood-feasting-breath"), html => html.replace("the greatest damage a single creature took", "the total damage creatures took")));
    assert.equal(other.resolution.healSpread, undefined);
});
