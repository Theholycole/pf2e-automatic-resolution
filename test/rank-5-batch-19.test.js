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


// Rank 5, batch 19 (2026-10-02): Wronged Monk's Wrath (each action count's PF2e variant: its two damage types and emanation as the text states,
// with the save's riders written out as the basic save's four rows — failure Deafened 1 round; critical failure 2d12 persistent electricity and
// Deafened 1 minute).

const merge = (target, source) => { for (const [key, value] of Object.entries(source ?? {})) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' ? merge(target[key], value) : structuredClone(value); return target; };
const variantOf = (source, time) => {
    const [, overlay] = Object.entries(source.system.overlays).find(([, entry]) => entry.system?.time?.value === time);
    const copy = structuredClone(source); merge(copy.system, overlay.system); delete copy.system.overlays;
    for (const entry of Object.values(copy.system.damage ?? {})) if (!Array.isArray(entry.kinds)) entry.kinds = ['damage'];
    return copy;
};

test("Wronged Monk's Wrath: each action count's rows", async () => {
    const source = await spell("rank-5/wronged-monks-wrath");
    for (const [time, force, area] of [['1', '2d6', 5], ['2', '3d6', 10], ['3', '4d6', 20]]) {
        const plan = compile(variantOf(source, time));
        assert.equal(plan.resolution.kind, 'save', time);
        assert.deepEqual(plan.automation.pendingCapabilities, [], time);
        assert.deepEqual(inspectSavePlan(plan).blockers, [], time);
        assert.equal(plan.resolution.check.basic, false);
        assert.equal(Number(plan.targeting.area.value), area);
        assert.equal(plan.resolution.outcomes.failure.effects[0].slug, 'deafened');
        assert.equal(plan.resolution.outcomes.criticalFailure.effects[0].duration.unit, 'minutes');
        assert.equal(plan.resolution.outcomes.criticalFailure.damage.formulas[0].formula, '2d12[persistent,electricity]');
        assert.equal(plan.resolution.sharedDamage.components.find(c => c.type === 'force').formula, force);
    }
    // A variant whose data disagrees with the text isn't read.
    const wrong = variantOf(source, '2'); wrong.system.damage['0'].formula = '5d6';
    assert.notDeepEqual(compile(wrong).automation.pendingCapabilities, []);
});
