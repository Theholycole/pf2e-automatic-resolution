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


// Rank 3, batch 86 (2026-10-03): Weapon Tide (PF2e's variants: the basic save of the caster's damage type; with 3 actions the card's difficult terrain;
// the two rounds' difficult and hazardous terrain, its damage of the chosen type on entering or ending a turn there, once a turn, heightened).

test("Weapon Tide: the chosen type, the 3-action terrain and the two rounds' hazardous terrain", async () => {
    const { isWaveTerrain } = await import("../scripts/basic-save-core.js");
    const source = await spell("rank-3/weapon-tide");
    const base = compile(source);
    assert.equal(supported(base), true);
    assert.deepEqual(base.resolution.casterChoice, { kind: "damage-type", values: ["bludgeoning", "piercing", "slashing"], label: "Damage type" });
    assert.deepEqual([base.resolution.areaTerrain.durationSeconds, base.resolution.areaTerrain.whenActions, base.resolution.areaTerrain.hazard], [60, 3, undefined]);
    const rounds = structuredClone(source); rounds.system.area.value = 60; rounds.system.damage.Fzo5orCYaqq1ePCN.formula = "6d6";
    const two = compile(rounds);
    assert.equal(supported(two), true);
    const hazard = two.resolution.areaTerrain.hazard;
    assert.deepEqual([hazard.events, hazard.oncePerTurn, hazard.type, hazard.formula], [["enter", "turn-end"], true, "chosen", "(2+floor((@item.rank-3)/2)*1)d6"]);
    const bad = structuredClone(two); bad.resolution.areaTerrain.hazard.formula = "2d6+alert(1)";
    assert.equal(isWaveTerrain(bad), false);
    // A variant whose data is neither (another area), or an initial heightening PF2e's data doesn't have, isn't read.
    const odd = structuredClone(source); odd.system.area.value = 45;
    assert.equal(compile(odd).compilerEvidence.weaponWave, undefined);
    const step = compile(withText(source, html => html.replace("initial damage increases by 4d6", "initial damage increases by 3d6")));
    assert.equal(step.compilerEvidence.weaponWave, undefined);
});
