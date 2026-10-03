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


// Rank 4, batch 110 (2026-10-03): Pest Swarm (the squadron picked on the card; each Arrive and Depart its own save from the text — the formula for an
// item with no damage, the riders as rows; the spiders' venom its own save at DC 24 handed off; "difficult terrain for 1 round" the card's terrain).

test("Pest Swarm: the squadrons and their phases", async () => {
    const plan = compile(await spell("rank-4/pest-swarm"));
    assert.equal(plan.resolution.kind, "incarnate");
    const choices = plan.resolution.incarnate.options.choices;
    assert.deepEqual(choices.map(choice => choice.key), ["cockroaches", "mosquitoes", "pigeons", "rats", "skunks", "spiders"]);
    for (const choice of choices) for (const phase of choice.phases) assert.equal(supported(phase.plan), true, `${choice.key} ${phase.key}`);
    const phase = (choice, key) => choices.find(entry => entry.key === choice).phases.find(entry => entry.key === key);
    assert.equal(phase("pigeons", "arrive").plan.resolution.sharedDamage.formula, "{2d8[piercing],2d4[slashing]}");
    assert.equal(phase("cockroaches", "depart").plan.resolution.check.basic, false);
    assert.equal(phase("spiders", "arrive-exposure").dc, 24);
    assert.equal(phase("spiders", "arrive-exposure").plan.resolution.afflictionHandoff.name, "Violin Spider Venom");
    assert.equal(phase("rats", "depart").plan.resolution.areaTerrain.durationSeconds, 6);
    assert.equal(phase("spiders", "depart").plan.resolution.outcomes.criticalFailure.modifiers[0].value, -20);
    assert.match(phase("cockroaches", "arrive").reminder, /within 5 feet/);
    // A rider the reader doesn't know isn't read.
    const other = compile(withText(await spell("rank-4/pest-swarm"), html => html.replace("On a critical failure, a creature can't use concentrate", "On a critical failure, a creature can't use any")));
    assert.notEqual(other.resolution.kind, "incarnate");
});
