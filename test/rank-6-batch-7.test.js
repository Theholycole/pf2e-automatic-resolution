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


// Rank 6, batch 7 (2026-10-03): Nature's Reprisal, Phantasmal Calamity.

test("Nature's Reprisal: 6 poison per hazardous square an enemy enters, +1 per rank; the plant terrain is the GM's", async () => {
    const plan = compile(await spell("rank-6/natures-reprisal"));
    const data = plan.resolution.hazardArea;
    assert.equal(plan.automation.level, "automatic");
    assert.deepEqual([data.control.kind, data.control.flat, data.control.type, data.control.enemiesOnly, data.control.step.flat, data.terrain], ["per-square", 6, "poison", true, 1, false]);
    assert.equal(data.notes.length, 1);
});

test("Phantasmal Calamity: the basic damage; a critical failure's Reflex save, failed: Stunned 1 minute with a turn-end Will save, and the belief note", async () => {
    const plan = compile(await spell("rank-6/phantasmal-calamity"));
    const [followUp] = plan.resolution.outcomes.criticalFailure.followUps;
    assert.equal(followUp.check.statistic, "reflex");
    assert.equal(plan.resolution.outcomes.failure.followUps.length, 0);
    for (const degree of ["failure", "criticalFailure"]) {
        const [stun] = followUp.outcomes[degree].effects;
        assert.deepEqual([stun.slug, stun.duration.value, stun.duration.unit, stun.recurringSave.statistic, stun.recurringSave.mode], ["stunned", 1, "minutes", "will", "end"]);
        assert.match(followUp.outcomes[degree].noteEffects[0].text, /believes it's trapped/);
    }
    assert.equal(followUp.outcomes.success.effects.length, 0);
});
