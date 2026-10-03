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


import {compileBorrowedColorArmor, colorArmorResistance} from '../src/compiler/color-armor.js';
import {adaptSpellSource} from '../src/compiler/spell-source-adapter.js';

// Rank 7, batch 4 (2026-10-03): Prismatic Armor, Apex Companion.

test("Prismatic Armor: Chromatic Armor in every color, resistance 5 (10 at 9th), a critical failure Blinded", async () => {
    const chromatic = await spell("rank-4/chromatic-armor");
    const referenced = new Map([[`Compendium.pf2e.spells-srd.Item.${chromatic._id}`, chromatic]]);
    const armor = compileBorrowedColorArmor(adaptSpellSource(await spell("rank-7/prismatic-armor")), referenced);
    assert.ok(armor);
    assert.equal(armor.colorArmor.allColors, true);
    assert.deepEqual([colorArmorResistance(armor.colorArmor, 7, 7), colorArmorResistance(armor.colorArmor, 9, 7)], [5, 10]);
    assert.match(armor.colorArmor.save.criticalCondition, /\{Blinded\}$/);
});

test("Apex Companion: PF2e's Effect proved, with the stated reach patched onto its size", async () => {
    const plan = compile(await spell("rank-10/apex-companion"));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ["effect-note", "automatic"]);
    assert.deepEqual(plan.resolution.effectNote.proof.ruleOverrides.map(override => override.patch), [{ reach: { override: 15 } }]);
});
