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


// Rank 7, batch 5 (2026-10-03): Regenerate, Incarnate Tempest of Shades, Summon Stampede.

test("Regenerate: PF2e's regeneration proved against the text", async () => {
    const plan = compile(await spell("rank-7/regenerate"));
    assert.deepEqual([plan.resolution.kind, plan.automation.level], ["effect-note", "automatic"]);
});

test("Incarnate Tempest of Shades and Summon Stampede: both phases save cards", async () => {
    for (const path of ["rank-7/incarnate-tempest-of-shades", "rank-7/summon-stampede"]) {
        const plan = compile(await spell(path));
        assert.equal(plan.resolution.kind, "incarnate", path);
        assert.ok(plan.resolution.incarnate.phases.every(phase => supported(phase.plan)), path);
    }
    const stampede = compile(await spell("rank-7/summon-stampede"));
    const depart = stampede.resolution.incarnate.phases.find(phase => phase.key === "depart");
    assert.equal(depart.plan.resolution.sharedDamage.formula, "8d8[bludgeoning]");
    assert.match(depart.reminder, /counteract all difficult terrain/);
});
