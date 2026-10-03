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


// Rank 5, batch 58 (2026-10-02): Instant Minefield (up to 6 mines drawn as the squares of a region, for 10 minutes; the GM's control when one explodes opens
// one basic Reflex card of PF2e's fire and piercing entries for the creatures it catches; after the sixth, the spell ends; finding and seeing them a note).

test("Instant Minefield: each mine's one card", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-5/instant-minefield"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.events, lingering.mines.count, lingering.mines.emanation, lingering.durationSeconds], ["placed", [], 6, 5, 600]);
    assert.equal(plan.resolution.sharedDamage.components.length, 2);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan)).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.lingering.mines.count = 0;
    assert.equal(isExecutableLingeringPlan(bad), false);
    const other = compile(withText(await spell("rank-5/instant-minefield"), html => html.replace("Choose up to 6 unoccupied squares", "Choose up to 6 occupied squares")));
    assert.equal(other.compilerEvidence.minefield, undefined);
});
