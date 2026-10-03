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


// Rank 3, batch 118 (2026-10-03): Invoke the Harrow (the caster's suit and boon or bane; the failing rows' Effect for the duration with its repeat save;
// from 6th the doubled values, a minute and two successes).

test("Invoke the Harrow: the twelve options and the 6th-rank rows", async () => {
    const plan = compile(await spell("rank-3/invoke-the-harrow"));
    const choice = plan.resolution.casterChoice;
    assert.equal(choice.values.length, 12);
    assert.deepEqual(choice.rows, ["failure", "criticalFailure"]);
    const notes = plan.resolution.outcomes.failure.noteEffects.filter(note => note.choiceGroup === "caster-option");
    assert.equal(notes.length, 12);
    assert.deepEqual(notes.find(note => note.option === "keys boon").rules, [{ key: "FlatModifier", selector: "ac", type: "status", value: 1 }]);
    const high = plan.resolution.heightenedVariants[0];
    assert.equal(high.minRank, 6);
    const bane = high.outcomes.failure.noteEffects.find(note => note.option === "hammers bane");
    assert.equal(bane.rules[0].alterations[0].value, 2);
    assert.equal(bane.endSave.successes, 2);
    assert.equal(supported(plan), true);
    // A different boon isn't read.
    const other = compile(withText(await spell("rank-3/invoke-the-harrow"), html => html.replace("+1 status bonus to AC", "+2 status bonus to AC and speed")));
    assert.equal(other.resolution.casterChoice?.values?.length ?? 0, 0);
});
