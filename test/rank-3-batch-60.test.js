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


// Rank 3, batch 60 (2026-10-02): Positive Attunement (PF2e's two variants: Healing — a living target heals 1d8 now and at the end of each of the
// caster's turns while Sustained; Damage — an undead (or void-healing) target's Will save: a success once, a failure now and at the end of each of the
// caster's turns, a critical failure double each time; +1d8 every 3 ranks).

const mergeDeep = (target, source) => { for (const [key, value] of Object.entries(source ?? {})) target[key] = value && typeof value === 'object' && !Array.isArray(value)
    && target[key] && typeof target[key] === 'object' ? mergeDeep(target[key], value) : structuredClone(value); return target; };
const variant = (source, name) => {
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.name === `Positive Attunement (${name})`);
    const item = structuredClone(source); item.system = mergeDeep(item.system, structuredClone(overlay.system)); delete item.system.overlays;
    return item;
};

test("Positive Attunement: the healing and damage variants", async () => {
    const source = await spell("rank-3/positive-attunement");
    const healing = compile(variant(source, "Healing"));
    assert.equal(healing.resolution.kind, "turn-healing");
    assert.deepEqual([healing.resolution.turnHealing.immediate, healing.resolution.turnHealing.events, healing.resolution.turnHealing.sustained, healing.resolution.turnHealing.living],
        [true, ["source-turn-end"], true, true]);
    const damage = compile(variant(source, "Damage"));
    assert.deepEqual(inspectSavePlan(damage).blockers, []);
    assert.deepEqual(damage.resolution.turnHazard.multipliers, { failure: 1, criticalFailure: 2 });
    assert.deepEqual(damage.targeting.actorConstraints.predicates, [{ kind: "undead-or-void-healing" }]);
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => damage.resolution.outcomes[d].damage.multiplier), [1, 1, 2]);
    // A turn hazard on a row the text doesn't state isn't executable.
    const broken = structuredClone(damage); broken.resolution.turnHazard.multipliers.criticalSuccess = 1;
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
});
