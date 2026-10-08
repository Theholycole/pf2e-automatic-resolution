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


import {validNoteRule} from '../scripts/note-effects.js';

// Rank 8, batch 2 (2026-10-03): Arctic Rift, Time Beacon, Project Image, Migration, Wall of Force.

test("Arctic Rift: a critical failure Immobilized and Slowed 1 until it Escapes; the ice's reminder", async () => {
    const plan = compile(await spell("rank-8/arctic-rift"));
    assert.ok(supported(plan));
    const critical = plan.resolution.outcomes.criticalFailure.effects;
    assert.deepEqual(critical.map(effect => [effect.slug, effect.lifetimeProof.escape]), [["immobilized", true], ["slowed", true]]);
    assert.ok(plan.resolution.reminders.some(reminder => reminder.kind === "object-hold" && /60 Hit Points \(\+5 per rank above 8\)/.test(reminder.text)));
});

test("Time Beacon and Project Image: notes (Time Beacon's counteract on the card)", async () => {
    const beacon = compile(await spell("rank-7/time-beacon"));
    assert.equal(beacon.resolution.kind, "spell-note");
    assert.equal(compile(await spell("rank-7/project-image")).resolution.kind, "spell-note");
});

test("Migration: the targets' five Speeds of 40 feet", async () => {
    const plan = compile(await spell("rank-8/migration"));
    assert.equal(plan.resolution.kind, "spell-note");
    const rules = plan.resolution.note?.rules ?? plan.resolution.spellNote?.rules ?? [];
    assert.deepEqual(rules.map(rule => rule.selector), ["land", "burrow", "climb", "fly", "swim"]);
    assert.ok(rules.every(validNoteRule));
});

test("Wall of Force: a wall that blocks movement, not sight; 60 HP, +20 per 2 ranks", async () => {
    const plan = compile(await spell("rank-6/wall-of-force"));
    assert.equal(plan.resolution.kind, "scene-walls");
    const data = plan.resolution.sceneWalls;
    assert.deepEqual([data.lengthFeet, data.blocksMove, data.blocksSight, data.stats.hp, data.stats.hpStep.add, data.stats.hpStep.interval], [50, true, false, 60, 20, 2]);
});
