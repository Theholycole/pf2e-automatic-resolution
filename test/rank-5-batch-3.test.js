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



// Rank 5, batch 3 (2026-10-02): Banishment.

test('Banishment: the extra-action cost is the caster\'s question; Stunned 1 on the caster; banished rows', async () => {
    const plan = compile(await spell('rank-5/banishment'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.attackAdjustment.choices.map(choice => choice.value), [-2, 0]);
    assert.match(plan.resolution.attackAdjustment.question, /^Did you spend an extra action while Casting this Spell and add a cost/);
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(outcomes.criticalSuccess.casterConditions.map(c => [c.slug, c.value]), [['stunned', 1]]);
    assert.deepEqual([outcomes.success.effects.length, outcomes.success.rowNotes ?? []], [0, []]);
    assert.deepEqual([outcomes.failure.rowNotes[0].kind, outcomes.criticalFailure.rowNotes[0].kind], ['banished', 'banished']);
});

test('Banishment: a different extra-action benefit is not read as the option', async () => {
    const plan = compile(withText(await spell('rank-5/banishment'), html => html.replace('a –2 circumstance penalty to its save', 'a –2 circumstance penalty to its AC')));
    assert.notEqual(plan.resolution.attackAdjustment?.sourceText, 'You can spend an extra action while Casting this Spell and add a cost to the spell to give the creature a –2 circumstance penalty to its AC.');
    assert.equal(inspectSavePlan(plan).supported, false);
});
