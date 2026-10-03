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


// Rank 3, batch 85 (2026-10-03): Infectious Ennui (the rows for the sustained spell — Slowed until the end of the target's next turn; Slowed and Frightened
// with the frightened floor while the spell lasts; the spread a save of its own a card starts at the target's turns, immune to this casting; at 5th the
// spread's Slowed lasts as long as the original cast).

test("Infectious Ennui: sustained rows, a frightened floor and a spread save of its own", async () => {
    const plan = compile(await spell("rank-3/infectious-ennui"));
    assert.equal(supported(plan), true);
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(["success", "failure", "criticalFailure"].map(degree => outcomes[degree].effects.map(effect => `${effect.slug}${effect.value}`).join("+")),
        ["slowed1", "slowed1+frightened1", "slowed2+frightened2"]);
    const chain = plan.resolution.chainSave;
    assert.deepEqual([chain.perCast, chain.repeatable, chain.degrees, chain.label, chain.heightened.rank], [true, true, ["failure", "criticalFailure"], "creature within 30 feet of the target", 5]);
    for (const spread of [chain.spreadPlan, chain.heightened.plan]) {
        assert.equal(supported(spread), true);
        assert.deepEqual(spread.resolution.temporaryImmunity.duration, { value: 1, unit: "minutes" });
        assert.equal(spread.lifecycle.sustained, false);
    }
    assert.deepEqual(chain.spreadPlan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.value, effect.duration?.value, effect.duration?.unit]), [["slowed", 1, 1, "rounds"]]);
    assert.equal(chain.heightened.plan.resolution.outcomes.failure.effects[0].duration, null);
    const tampered = structuredClone(plan); delete tampered.resolution.chainSave.spreadPlan.resolution.temporaryImmunity;
    assert.equal(supported(tampered), false);
    // Another spread distance wording, or a different spread condition, isn't read.
    const other = compile(withText(await spell("rank-3/infectious-ennui"), html => html.replace("that creature is slowed 1 for 1 round", "that creature is stunned 1 for 1 round")));
    assert.equal(other.compilerEvidence.spreadingMood, undefined);
    assert.equal(supported(other), false);
});
