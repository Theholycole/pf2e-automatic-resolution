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


// Rank 3, batch 55 (2026-10-02): Soul Cutter (a melee spell attack with one paragraph per action count: each PF2e variant's own dice and riders as
// the attack's rows — Enfeebled 1 on a hit for 2 actions; 3 actions: half damage and Enfeebled 1 on a miss; the text's spirit type rolled over the
// variants' bludgeoning; the reach a note).

const mergeDeep = (target, source) => { for (const [key, value] of Object.entries(source ?? {})) target[key] = value && typeof value === 'object' && !Array.isArray(value)
    && target[key] && typeof target[key] === 'object' ? mergeDeep(target[key], value) : structuredClone(value); return target; };
const variant = (source, time) => {
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.system?.time?.value === time);
    const item = structuredClone(source); item.system = mergeDeep(item.system, structuredClone(overlay.system)); delete item.system.overlays;
    return item;
};

test("Soul Cutter: each action count's attack rows, typed by the text", async () => {
    const source = await spell("rank-3/soul-cutter");
    const rows = plan => Object.fromEntries(Object.entries(plan.resolution.outcomes).map(([degree, outcome]) => [degree,
        [outcome.damage?.multiplier ?? 0, ...(outcome.effects ?? []).map(effect => `${effect.slug} ${effect.value}`)]]));
    const [one, two, three] = ["1", "2", "3"].map(time => compile(variant(source, time)));
    for (const plan of [one, two, three]) {
        assert.equal(plan.resolution.check.statistic, "spell-attack");
        assert.deepEqual(inspectSavePlan(plan).blockers, []);
        assert.equal(plan.resolution.sharedDamage.typeOverride.to, "spirit");
        assert.equal(plan.resolution.sharedDamage.typeOverride.from, "bludgeoning");
    }
    assert.deepEqual(rows(one), { criticalSuccess: [2], success: [1], failure: [0], criticalFailure: [0] });
    assert.deepEqual(rows(two), { criticalSuccess: [2, "enfeebled 1"], success: [1, "enfeebled 1"], failure: [0], criticalFailure: [0] });
    assert.deepEqual(rows(three), { criticalSuccess: [2, "enfeebled 1"], success: [1, "enfeebled 1"], failure: [0.5, "enfeebled 1"], criticalFailure: [0] });
    assert.ok(three.resolution.dataNotes.includes("The target must be within 30 feet."));
    // A type override is checked against the data.
    const broken = structuredClone(two); broken.resolution.sharedDamage.typeOverride.from = "fire";
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
    // A variant whose heightening step isn't the text's isn't read.
    const other = variant(source, "1"); other.system.heightening.damage[Object.keys(other.system.damage)[0]] = "2d6";
    assert.notEqual(compile(other).resolution.check?.statistic, "spell-attack");
});
