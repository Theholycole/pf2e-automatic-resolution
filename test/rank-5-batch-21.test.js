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


// Rank 5, batch 21 (2026-10-02): Psychic Outburst (PF2e's "2 to 3" variant: 6d10 mental, Will; the push — 10 feet, 20 on a critical failure — only
// when cast with 3 actions, the GM's reminder says so; the two-round variant: a 40-foot emanation, 8d10, enemies only, the push always).

const merge = (target, source) => { for (const [key, value] of Object.entries(source ?? {})) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' ? merge(target[key], value) : structuredClone(value); return target; };
const variantOf = (source, id) => {
    const copy = structuredClone(source); merge(copy.system, source.system.overlays[id].system); delete copy.system.overlays;
    for (const entry of Object.values(copy.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    return copy;
};

test("Psychic Outburst: the two variants' rows and pushes", async () => {
    const source = await spell("rank-5/psychic-outburst");
    const actions = compile(variantOf(source, 'qqkQgujiPGGEtRgk'));
    assert.deepEqual(actions.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(actions).blockers, []);
    assert.equal(actions.resolution.outcomes.failure.forcedMovement.actions, 3);
    assert.equal(actions.resolution.outcomes.criticalFailure.forcedMovement.distance, 20);
    assert.deepEqual(actions.targeting.actorConstraints.predicates, []);
    const rounds = compile(variantOf(source, 'QSYOheFiUgEazxvr'));
    assert.deepEqual(rounds.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(rounds).blockers, []);
    assert.equal(rounds.resolution.outcomes.failure.forcedMovement.actions, undefined);
    assert.ok(rounds.targeting.actorConstraints.predicates.some(predicate => predicate.kind === 'enemy-of-caster'));
    assert.equal(rounds.resolution.sharedDamage.components[0].formula, '8d10');
    // A variant whose data matches neither stated damage isn't read.
    const odd = variantOf(source, 'qqkQgujiPGGEtRgk'); odd.system.damage[Object.keys(odd.system.damage)[0]].formula = '7d10';
    assert.notDeepEqual(compile(odd).automation.pendingCapabilities, []);
});
