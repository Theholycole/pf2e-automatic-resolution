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


// Rank 8, batch 8 (2026-10-04): Maze of Locked Doors, Medusa's Wrath.

test("Maze of Locked Doors: each result's trapped note for its own time (1 round, 1 minute, 10 minutes); the hallway's doors and checks on the card", async () => {
    const plan = compile(await spell("rank-7/maze-of-locked-doors"));
    assert.equal(supported(plan), true);
    const span = degree => plan.resolution.outcomes[degree].noteEffects.map(note => `${note.duration.value} ${note.duration.unit}`).join();
    assert.deepEqual([span("success"), span("failure"), span("criticalFailure")], ["1 rounds", "1 minutes", "10 minutes"]);
    assert.match(plan.resolution.outcomes.failure.noteEffects[0].text, /bypassed 2 doors/);
    assert.match(plan.resolution.reminders.map(reminder => reminder.text).join(" "), /Athletics DC 30 to Force Open/);
});

test("Medusa's Wrath: the caster's Strike decides the row; a hit row's Slowed escalates with the item's Fortitude save to Petrified", async () => {
    const plan = compile(await spell("rank-8/medusas-wrath"));
    assert.equal(supported(plan), true);
    assert.equal(plan.resolution.check.statistic, "strike");
    const slowed = degree => plan.resolution.outcomes[degree].effects.find(effect => effect.slug === "slowed");
    assert.deepEqual([slowed("criticalSuccess").value, slowed("success").value], [2, 1]);
    assert.deepEqual(slowed("criticalSuccess").recurringSave.steps, { criticalSuccess: -1, success: -1, failure: 1, criticalFailure: 2 });
    assert.equal(slowed("success").recurringSave.statistic, "fortitude");
    assert.equal(slowed("success").recurringSave.atActions.slug, "petrified");
    assert.equal(plan.resolution.outcomes.failure.effects.length, 0);
});
