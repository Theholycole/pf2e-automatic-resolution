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


// Rank 3, batch 107 (2026-10-03): Ranger's Bramble (Entangling Flora's text for the bramble's area and save; the critical failure row's damage the
// inline persistent bleed; the Escape note).

test("Ranger's Bramble: Entangling Flora's effects plus a critical failure's bleed", async () => {
    const flora = await spell("rank-2/entangling-flora");
    const referencedSpells = new Map([[`Compendium.pf2e.spells-srd.Item.${flora._id}`, flora]]);
    const plan = compileAbility(await spell("rank-3/rangers-bramble"), { nativeEffectCatalog: effects, referencedSpells });
    assert.equal(plan.resolution.kind, "save");
    assert.equal(plan.resolution.lingering?.area?.value, 5);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.damage, { mode: "formulas", formulas: [{ formula: "(max(0,@item.level -1))d4[persistent,bleed]", source: "description-inline" }], rollScope: "outcome" });
    assert.equal(plan.resolution.reminders.at(-1).kind, "borrowed-rider-note");
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // Without the referenced spell it isn't read.
    assert.notEqual(compile(await spell("rank-3/rangers-bramble")).resolution.outcomes?.criticalFailure?.damage?.mode, "formulas");
    // A heightening that differs from the dice isn't read.
    const other = compileAbility(withText(await spell("rank-3/rangers-bramble"), html => html.replace("increases by 1d4", "increases by 1d6")), { nativeEffectCatalog: effects, referencedSpells });
    assert.notEqual(other.resolution.outcomes?.criticalFailure?.damage?.mode, "formulas");
});
