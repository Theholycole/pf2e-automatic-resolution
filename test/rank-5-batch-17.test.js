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


// Rank 5, batch 17 (2026-10-02): Blood Feast (a spell attack "dealing 12d6 piercing damage, depending on your spell attack roll"; temporary Hit
// Points for 1 minute equal to half the piercing damage the target takes; "If you are a gug, …" is the caster's question on the card that adds
// 2d6 piercing and 1d8 to the critical hit's persistent bleed).

test("Blood Feast: the attack, the temporary Hit Points and the gug question", async () => {
    const plan = compile(await spell("rank-5/blood-feast"));
    assert.equal(plan.resolution.check.statistic, 'spell-attack');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.equal(plan.resolution.casterBenefit.fraction, 0.5);
    assert.equal(plan.resolution.casterBenefit.damageType, 'piercing');
    assert.deepEqual(plan.resolution.casterBenefit.duration, {value: 1, unit: 'minutes'});
    assert.deepEqual(plan.resolution.diceUpgrade.adds, {dice: {count: 2, faces: 6, type: 'piercing'}, persistent: {count: 1, faces: 8, type: 'bleed'}});
    assert.equal(plan.resolution.outcomes.failure.damage.mode, 'none');
    // The added dice must be the spell's own damage type.
    const other = compile(withText(await spell("rank-5/blood-feast"), html => html.replace('increase the piercing damage by 2d6', 'increase the fire damage by 2d6')));
    assert.notEqual(other.resolution.check?.statistic === 'spell-attack' && other.automation.pendingCapabilities.length === 0 && other.resolution.diceUpgrade, true);
    const forged = structuredClone(plan); forged.resolution.diceUpgrade.adds.dice.type = 'fire';
    assert.ok(inspectSavePlan(forged).blockers.some(b => b.code === 'dice-upgrade'));
});
