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


// Rank 4, batch 39 (2026-10-02): Mutilate (5d8 slashing, Fortitude, written out as the basic save's rows with the critical failure's persistent
// bleed (1d8 + rank − 4); the caster's own 1d4 slashing once per cast; the 3-action 5-foot burst a card note).

test("Mutilate: the rows, the caster's damage and the burst note", async () => {
    const plan = compile(await spell("rank-4/mutilate"));
    assert.equal(plan.resolution.kind, 'save');
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.deepEqual(plan.resolution.casterDamage, {formula: '1d4', type: 'slashing', sourceText: plan.resolution.casterDamage.sourceText});
    assert.equal(plan.resolution.outcomes.criticalFailure.damage.formulas[0].formula, '(1d8 + @item.rank - 4)[persistent,bleed]');
    assert.ok(plan.resolution.dataNotes.some(note => /5-foot burst/.test(note)));
    // A forged caster damage isn't accepted.
    const forged = structuredClone(plan); forged.resolution.casterDamage.formula = '2d4'; forged.resolution.casterDamage.sourceText = 'You take 2d4.';
    assert.ok(inspectSavePlan(forged).blockers.some(b => b.code === 'caster-damage'));
    // A bleed formula that doesn't start at the spell's rank isn't read.
    const other = compile(withText(await spell("rank-4/mutilate"), html => html.replace('@item.level -4', '@item.level -3')));
    assert.notDeepEqual(other.automation.pendingCapabilities, []);
});
