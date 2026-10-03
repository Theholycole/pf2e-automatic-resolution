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


// Rank 4, batch 130 (2026-10-03): Phantasmal Protagonist (the theme picked; a token of the stated statistics at the cast rank; the thematic action once a
// round: the hero's spell attack, the ally's temporary Hit Points, the villain's Will save).

test("Phantasmal Protagonist: the protagonist", async () => {
    const plan = compile(await spell("rank-4/phantasmal-protagonist"));
    assert.equal(plan.resolution.kind, "protagonist");
    const data = plan.resolution.protagonist;
    const { protagonistAt } = await import("../src/compiler/protagonist.js");
    assert.deepEqual(protagonistAt(data, 6, 4), { ac: 28, modifier: 18, hp: 150, heroDice: 6, allyDice: 6 });
    assert.equal(supported(data.heroPlan), true);
    assert.equal(data.heroPlan.resolution.check.statistic, "spell-attack");
    assert.equal(data.heroPlan.resolution.sharedDamage.formula, "((4 + 1*floor((@item.rank - 4)/1))d6 + 6)[mental]");
    assert.equal(supported(data.villainPlan), true);
    assert.deepEqual(data.villainPlan.resolution.outcomes.criticalFailure.effects.map(effect => effect.slug), ["slowed"]);
    // A different statistic isn't read.
    const other = compile(withText(await spell("rank-4/phantasmal-protagonist"), html => html.replace("an AC of 22", "an AC of 22 and resistance to all damage")));
    assert.notEqual(other.resolution.kind, "protagonist");
});
