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



// Rank 5, batch 1 (2026-10-02): You're Mine.

test("You're Mine: the rows, the failure's note, and the rank 7 rows", async () => {
    const plan = compile(await spell('rank-5/youre-mine'));
    assert.deepEqual([inspectSavePlan(plan).supported, plan.resolution.rankGate, plan.resolution.heightenedVariants.length, plan.resolution.heightenedVariants[0].minRank], [true, undefined, 1, 7]);
    assert.equal(plan.resolution.outcomes.failure.noteEffects.length, 1);
    const rows = plan.resolution.heightenedVariants[0].outcomes;
    assert.deepEqual(rows.failure.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit]), [['controlled', 1, 'rounds']]);
    assert.deepEqual(rows.criticalFailure.effects.map(effect => [effect.slug, effect.duration.value, effect.duration.unit, effect.recurringSave.statistic]), [['controlled', 1, 'minutes', 'will']]);
});

test("You're Mine: a changed rank 7 entry falls back to the rank gate", async () => {
    const source = await spell('rank-5/youre-mine');
    const plan = compile(withText(source, html => { assert.ok(html.includes('at the end of each of its turns')); return html.replace('at the end of each of its turns', 'at the start of each of its turns'); }));
    assert.deepEqual([plan.resolution.heightenedVariants, plan.resolution.rankGate?.minRank], [undefined, 7]);
});
