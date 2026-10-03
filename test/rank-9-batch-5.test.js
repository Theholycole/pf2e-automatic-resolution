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


// Rank 9, batch 5 (2026-10-03): Voracious Gestalt.
import { isExecutableLingeringPlan as gestaltReady, lingeringExposurePlan as gestaltTurn, heightenedPlanAt as gestaltAt } from "../scripts/basic-save-core.js";

test("Voracious Gestalt: the caster's emanation (cast, turn end); its turn dice from the cast rank; a soul the GM adds grows it 20 feet and adds 1d6", async () => {
    const plan = compile(await spell("rank-9/voracious-gestalt"));
    assert.equal(gestaltReady(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.centre, lingering.initial, lingering.events, lingering.excludeCaster], ["caster", true, ["turn-end"], true]);
    assert.deepEqual([lingering.turnDamage.offset, lingering.turnDamage.faces, lingering.turnDamage.type], [-3, 6, "void"]);
    assert.deepEqual([lingering.soulGrowth.feet, lingering.soulGrowth.dice, lingering.soulGrowth.faces], [20, 1, 6]);
    assert.equal(gestaltTurn(gestaltAt(plan, 9), { event: "turn" }).resolution.sharedDamage.formula, "6d6[void]");
    assert.equal(plan.resolution.sharedDamage.components[0].formula, "14d6");
    assert.match(lingering.notes.join(" "), /living creatures the caster chooses/);
});
