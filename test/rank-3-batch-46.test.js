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


// Rank 3, batch 46 (2026-10-02): Elemental Annihilation Wave (the 2-action variant: the basic Reflex save, the trait option a card note; the
// 3-action variant: the basic save's four rows with the pushes — 5 feet on a failure, 10 and Prone on a critical failure — each row's push
// growing by its own distance per 2 ranks; the text's bludgeoning step, 3d6, over PF2e's 1d6: the card adds the missing dice).

const merge = (target, source) => { for (const [key, value] of Object.entries(source ?? {})) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' ? merge(target[key], value) : structuredClone(value); return target; };
const variantOf = (source, time) => {
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.system?.time?.value === time);
    const copy = structuredClone(source); merge(copy.system, overlay.system); delete copy.system.overlays;
    for (const entry of Object.values(copy.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    return copy;
};

test("Elemental Annihilation Wave: the 2- and 3-action variants", async () => {
    const source = await spell("rank-3/elemental-annihilation-wave");
    const two = compile(variantOf(source, '2'));
    assert.deepEqual(two.automation.pendingCapabilities, []);
    assert.equal(two.resolution.check.basic, true);
    assert.ok(two.resolution.dataNotes.some(note => /replace the air trait/.test(note)));
    const three = compile(variantOf(source, '3'));
    assert.deepEqual(three.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(three).blockers, []);
    assert.equal(three.resolution.check.basic, false);
    assert.equal(three.resolution.outcomes.failure.forcedMovement.distance, 5);
    assert.deepEqual([three.resolution.outcomes.failure.forcedMovement.heightening.feet, three.resolution.outcomes.criticalFailure.forcedMovement.heightening.feet], [5, 10]);
    assert.equal(three.resolution.outcomes.criticalFailure.forcedMovement.distance, 10);
    assert.ok(three.resolution.outcomes.criticalFailure.effects.some(effect => effect.slug === 'prone'));
    // PF2e heightens the bludgeoning by 1d6 per step; the text says 3d6: the card adds 2d6 per step.
    for (const plan of [two, three]) assert.deepEqual(plan.resolution.sharedDamage.heighteningCorrection, [{type: 'bludgeoning', faces: 6, perStep: 2, interval: 2, baseRank: 3}]);
    // A trait the spell doesn't have isn't the option.
    const other = variantOf(source, '2'); other.system.description.value = other.system.description.value.replace('replace the air trait', 'replace the cold trait');
    assert.notDeepEqual(compile(other).automation.pendingCapabilities, []);
});
