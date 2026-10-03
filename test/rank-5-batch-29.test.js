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


// Rank 5, batch 29 (2026-10-02): Freezing Rain (a sustained burst of difficult terrain; no save when cast; the first Sustain each round may freeze
// the rain: each creature inside takes 4d6 cold (+1d6 a rank) by its Reflex save, Slowed 1 / 2 for 1 round on the failing rows; moving the area and
// choosing to freeze are the caster's, through the review).

test("Freezing Rain: the frozen rain on Sustain", async () => {
    const { lingeringTriggerEvents } = await import("../src/compiler/lingering-area-compiler.js");
    const plan = compile(await spell("rank-5/freezing-rain"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.initial, lingering.sustained, lingering.terrain.difficulty], [["sustain"], false, true, 2]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value]), [["slowed", 2]]);
    assert.ok(lingering.notes.some(note => /move the area up to 20 feet/.test(note)));
    assert.deepEqual(lingeringTriggerEvents("The first time you Sustain the spell each round, each creature in the area"), ["sustain"]);
    // Another freeze damage than the item's isn't read.
    const other = compile(withText(await spell("rank-5/freezing-rain"), html => html.replace("takes 4d6 cold damage", "takes 5d6 cold damage")));
    assert.equal(other.compilerEvidence.freezingRain, undefined);
});
