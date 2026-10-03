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


// Rank 6, batch 1 (2026-10-03): Chain Lightning, Blade Barrier, Explosive Barrage, Flame Vortex, For Love, For Lightning, Living Thunderbolt.

test("Chain Lightning: one basic save, a chain that ends at a critical success", async () => {
    const plan = compile(await spell("rank-6/chain-lightning"));
    assert.equal(plan.resolution.kind, "save");
    assert.deepEqual([plan.resolution.chain.feet, plan.resolution.chain.endsOn], [30, "criticalSuccess"]);
    assert.ok(supported(plan));
});

test("Blade Barrier: a lingering line with the GM's crossing control", async () => {
    const plan = compile(await spell("rank-6/blade-barrier"));
    const { lingering } = plan.resolution;
    assert.deepEqual([lingering.area.type, lingering.area.value, lingering.initial, lingering.events, lingering.gmAction.actions], ["line", 120, true, ["turn-end"], ["pass"]]);
});

test("Explosive Barrage: the basic save with Deafened on a failure", async () => {
    const plan = compile(await spell("rank-6/explosive-barrage"));
    assert.ok(supported(plan));
    assert.deepEqual(plan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit]), [["deafened", 1, "minutes"]]);
    assert.ok(plan.resolution.reminders.some(reminder => /1d4/.test(reminder.text)));
});

test("Flame Vortex: the moving cylinder", async () => {
    const plan = compile(await spell("rank-6/flame-vortex"));
    const { lingering } = plan.resolution;
    assert.deepEqual([lingering.area.type, lingering.events, lingering.initial, lingering.oncePerRound, lingering.terrain.movement, lingering.gmAction.actions], ["cylinder", ["sustain"], true, true, ["fly"], ["vortex"]]);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
});

test("For Love, For Lightning and Living Thunderbolt: the repeated save's button", async () => {
    const love = compile(await spell("rank-6/for-love-for-lightning"));
    assert.equal(love.resolution.kind, "repeat-save");
    assert.equal(love.resolution.repeatSave.sustained, true);
    assert.equal(love.resolution.grantedActions[0].plan.resolution.check.statistic, "reflex");
    const bolt = compile(await spell("rank-6/living-thunderbolt"));
    assert.equal(bolt.resolution.kind, "effect");
    assert.ok(bolt.resolution.ruleAdditions.some(rule => rule.key === "AdjustDegreeOfSuccess" && rule.predicate.includes("action:escape")));
    assert.deepEqual(bolt.resolution.grantedActions[0].plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ["dazzled"]);
});
