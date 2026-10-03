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


// Rank 3, batch 113 (2026-10-03): Pyrotechnics (two lingering modes, each compiled from its own text: the turn-start Fortitude save then immunity for
// a minute; the card asks the mode; the fire source, the rise or fall, the smoke's penalties and recovery a reminder).

test("Pyrotechnics: two lingering modes", async () => {
    const plan = compile(await spell("rank-3/pyrotechnics"));
    const modes = plan.resolution.lingeringModes;
    assert.deepEqual(modes.map(mode => mode.key), ["fireworks", "smoke-cloud"]);
    for (const mode of modes) {
        assert.deepEqual([mode.plan.resolution.lingering.events.join(), mode.plan.resolution.lingering.area.value, mode.plan.resolution.temporaryImmunity.duration.value], ["turn-start", 20, 1]);
        assert.deepEqual(mode.plan.automation.pendingCapabilities, []);
    }
    assert.deepEqual(modes[0].plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ["blinded"]);
    assert.deepEqual(modes[1].plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ["sickened"]);
    // A different immunity isn't read.
    const other = compile(withText(await spell("rank-3/pyrotechnics"), html => html.replaceAll("immune for 1 minute", "immune for 1 hour and dazzled")));
    assert.equal(other.resolution.lingeringModes, undefined);
});
