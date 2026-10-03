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


// Rank 4, batch 72 (2026-10-02): Unsettling Perspective (Will: the text's 2d10 mental damage — PF2e's item has none — +1d10 every 2 ranks, by the rows;
// Stunned 1 on a critical failure; what the caster learns the GM's to tell, a card reminder).

test("Unsettling Perspective: the text's damage by the rows, Stunned, and the GM's reminder", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/unsettling-perspective"));
    assert.equal(plan.resolution.sharedDamage.formula, "(2+floor((@item.rank - 4)/2)*1)d10[mental]");
    assert.equal(plan.resolution.sharedDamage.textDerived, true);
    assert.deepEqual(["criticalSuccess", "success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].damage.multiplier), [0, 0.5, 1, 2]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value]), [["stunned", 1]]);
    assert.ok(plan.resolution.reminders.some(r => /social status/.test(r.text) && /Recall Knowledge/.test(r.text)));
    assert.ok(plan.resolution.dataNotes.some(n => /no damage entry/.test(n)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another heightening step isn't read.
    const other = compile(withText(await spell("rank-4/unsettling-perspective"), html => html.replace("increases by 1d10", "increases by 1d8")));
    assert.equal(other.compilerEvidence.insightRows, undefined);
});
