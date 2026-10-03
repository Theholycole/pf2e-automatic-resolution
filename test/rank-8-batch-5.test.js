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


// Rank 8, batch 5 (2026-10-03): Canticle of Everlasting Grief, Warp Mind.

test("Canticle of Everlasting Grief: each row's damage and PF2e's Effect proved (suppressed bonuses, the row's Frightened granted, its duration, the allies' aura); no separate Frightened", async () => {
    const plan = compile(await spell("rank-8/canticle-of-everlasting-grief"));
    assert.equal(inspectSavePlan(plan).supported, true);
    for (const [degree, multiplier, value] of [["success", 0.5, 1], ["failure", 1, 3], ["criticalFailure", 2, 4]]) {
        const outcome = plan.resolution.outcomes[degree];
        assert.equal(outcome.damage.multiplier, multiplier);
        assert.equal(outcome.effects.length, 0);
        assert.deepEqual([outcome.nativeEffects[0].outcomeRule.kind, outcome.nativeEffects[0].outcomeRule.frightened.value], ["grief-curse-effect", value]);
    }
    assert.equal(plan.resolution.outcomes.criticalFailure.nativeEffects[0].outcomeRule.allies, 15);
});

test("Warp Mind: a success Confused until its first action next turn; 10 minutes' immunity after any result; the instant-effects reminder", async () => {
    const plan = compile(await spell("rank-7/warp-mind"));
    assert.equal(inspectSavePlan(plan).supported, true);
    const [confused] = plan.resolution.outcomes.success.effects;
    assert.deepEqual([confused.slug, confused.endsWhen[0].action], ["confused", "next-turn-action"]);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, { value: 10, unit: "minutes" });
    assert.match(plan.resolution.reminders[0].text, /Dispel Magic/);
});
