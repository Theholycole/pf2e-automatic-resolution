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


// Rank 9, batch 12 (2026-10-05): feature groups 15 and 16 (support-cards.js, scripts/support-runtime.js): Tangling Creepers, True Target, Sacred Covenant,
// Heartbolt.
import { inspectIncarnatePlan, isExecutableSavePlan } from '../scripts/basic-save-core.js';

const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));
const card = async path => { const plan = compile(await spell(path)); assert.equal(plan.resolution.kind, "incarnate", path); assert.deepEqual(inspectIncarnatePlan(plan), [], path); return plan; };

test("Tangling Creepers and True Target: PF2e's Effect on the creepers' creatures and the vine's attack; PF2e's Effect marking the designated creature", async () => {
    const creepers = await card("rank-6/tangling-creepers");
    const area = creepers.resolution.incarnate.area;
    assert.deepEqual([area.shape, area.radius, area.seconds, area.place, /^Compendium\.pf2e\.spell-effects\.Item\./.test(area.base.memberEffect.uuid)], ["burst", 40, 600, true, true]);
    const vine = phasesOf(creepers).vine;
    assert.deepEqual([vine.kind, vine.plan.resolution.outcomes.success.effects.map(effect => effect.slug)], ["attack", ["immobilized"]]);
    const sight = phasesOf(await card("rank-7/true-target")).designate;
    assert.deepEqual([sight.kind, sight.count, sight.markSlug], ["true-target", 4, "true-target"]);
});

test("Sacred Covenant and Heartbolt: the pact's numbers; the bolt and the plume by rank, each with its undead save", async () => {
    const pact = phasesOf(await card("rank-9/sacred-covenant")).pact;
    assert.deepEqual([pact.count, pact.hp, pact.wounded], [6, 1, 1]);
    const bolt = phasesOf(await card("rank-6/heartbolt")).bolt;
    assert.deepEqual([bolt.radius, bolt.boltFormula, bolt.plumeFormula], [20, "(3 + 1 * floor((@item.rank - 6) / 2))d10 + (15 + 5 * floor((@item.rank - 6) / 2))", "(floor(@item.rank / 2) * 5)"]);
    assert.ok(isExecutableSavePlan(bolt.boltPlan) && isExecutableSavePlan(bolt.plumePlan));
});
