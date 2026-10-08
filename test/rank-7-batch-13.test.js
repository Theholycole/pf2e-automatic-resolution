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


// Rank 7, batch 13 (2026-10-04): Darklight.
import { isExecutableLingeringPlan as darkReady } from "../scripts/basic-save-core.js";

test("Darklight: a placed field of darkness for its minute; entering or starting a turn inside is a basic save against both entries; up to four allies spared", async () => {
    const plan = compile(await spell("rank-7/darklight"));
    assert.equal(darkReady(plan), true);
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.centre, lingering.durationSeconds], [["enter", "turn-start"], false, "placed", 60]);
    assert.deepEqual([lingering.darkness.mode, lingering.darkness.modifier, lingering.spared.count], [0, 1, 4]);
    assert.equal(plan.resolution.sharedDamage.components.length, 2);
    assert.match(lingering.notes.join(" "), /greater darkvision/);
});
