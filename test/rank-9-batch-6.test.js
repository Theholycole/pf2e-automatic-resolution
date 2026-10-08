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


// Rank 9, batch 6 (2026-10-04): Massacre.

test("Massacre: living creatures up to 17th level (19th at 10th rank); death at 0 HP; the success the item's dice; the backlash when nothing dies", async () => {
    const plan = compile(await spell("rank-9/massacre"));
    assert.equal(supported(plan), true);
    const predicates = plan.targeting.actorConstraints.predicates;
    assert.ok(predicates.some(predicate => predicate.kind === "living-creature"));
    assert.deepEqual(predicates.find(predicate => predicate.kind === "level-at-most"), { kind: "level-at-most", level: 17, byRank: { 10: 19 } });
    assert.equal(plan.resolution.postDamageTerminal.kind, "death");
    assert.equal(plan.resolution.outcomes.success.damage.mode, "shared");
    assert.equal(plan.resolution.outcomes.criticalFailure.terminal.kind, "death");
    assert.deepEqual([plan.resolution.backlash.formula, plan.resolution.backlash.caster, plan.resolution.backlash.when], ["30[void]", "30[void]", "none-killed"]);
});
