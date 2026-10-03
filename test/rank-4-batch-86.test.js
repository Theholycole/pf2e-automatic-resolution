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


// Rank 4, batch 86 (2026-10-02): Implement of Destruction (the enemy's Will save; each row a note whose controls deal the weapon's added damage when it hits
// — once after a success, persistent on each hit after a failure — or critically hits, adding Doomed 1, while that persistent damage lasts after a failure).

test("Implement of Destruction: the weapon's hits as triggered damage", async () => {
    const { isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/implement-of-destruction"));
    const td = d => plan.resolution.outcomes[d].noteEffects[0].triggeredDamage;
    assert.deepEqual([td("success").frequency, td("success").dice, td("success").persistent ?? false, td("success").endsSpell], ["once", 2, false, true]);
    assert.deepEqual([td("failure").frequency, td("failure").dice, td("failure").persistent, td("failure").criticalCondition.whilePersistent, td("failure").heightening.dice], ["each", 2, true, true, 1]);
    assert.deepEqual([td("criticalFailure").dice, td("criticalFailure").criticalCondition.whilePersistent, td("criticalFailure").heightening.dice], [4, false, 2]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates.map(p => p.kind), ["enemy-of-caster"]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Persistent damage only once is refused.
    assert.equal(isTriggeredDamage({ ...td("failure"), frequency: "once" }), false);
    // Another heightening isn't read.
    const other = compile(withText(await spell("rank-4/implement-of-destruction"), html => html.replace("by 2d6 on a critical failure", "by 3d6 on a critical failure").replace("by 1d6 on a failure", "by 1d8 on a failure")));
    assert.equal(other.compilerEvidence.destructionImplement, undefined);
});
