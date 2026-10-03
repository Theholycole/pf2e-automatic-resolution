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


// Rank 3, batch 64 (2026-10-02): Cup of Dust (Fortitude: critical success immune for 1 hour; success Fatigued for 1 round; failure Fatigued and
// 1d4 damage each hour (2d4 on a critical failure, +1d4 / +2d4 every 3 ranks) by the GM's control, for the day).

test("Cup of Dust: the hourly thirst", async () => {
    const { inspectSavePlan, isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/cup-of-dust"));
    const notes = degree => plan.resolution.outcomes[degree].noteEffects.map(note => note.triggeredDamage);
    assert.deepEqual(notes("failure").map(t => [t.trigger, t.dice, t.die, t.type, t.heightening]), [["hourly", 1, 4, "untyped", { interval: 3, dice: 1 }]]);
    assert.deepEqual(notes("criticalFailure").map(t => [t.dice, t.heightening.dice]), [[2, 2]]);
    assert.ok(notes("failure").every(isTriggeredDamage));
    assert.deepEqual(plan.resolution.temporaryImmunity.degrees, ["criticalSuccess"]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another quenching isn't read.
    const other = compile(withText(await spell("rank-3/cup-of-dust"), html => html.replace("until it quenches its thirst", "until it rests")));
    assert.equal(other.resolution.outcomes.failure.noteEffects?.some(note => note.triggeredDamage) ?? false, false);
});
