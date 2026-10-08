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


// Rank 6, batch 24 (2026-10-05): feature group 7, part 1 — teleports on the battle map (teleport-spells.js, teleport-runtime.js): Unexpected
// Transposition, Collective Transposition, Magnetic Dominion, All is One, One is All, Proximal Shift.
import { inspectParts } from '../scripts/basic-save-core.js';

const referencedSpells = new Map();
for (const dir of await readdir(new URL('spells/spells/', base))) for (const file of await readdir(new URL(`spells/spells/${dir}/`, base))) {
    const source = JSON.parse(await readFile(new URL(`spells/spells/${dir}/${file}`, base), 'utf8'));
    if (source._id) referencedSpells.set(`Compendium.pf2e.spells-srd.Item.${source._id}`, source);
}
const compileWith = source => compileAbility(source, { nativeEffectCatalog: effects, referencedSpells });

test("Unexpected Transposition and Collective Transposition: the save, then the card's swap (both immune) or its teleport within the area", async () => {
    const swap = compile(await spell("rank-6/unexpected-transposition"));
    assert.equal(supported(swap), true);
    assert.deepEqual([swap.resolution.controls.degrees, swap.resolution.controls.parts[0].mode, swap.resolution.controls.parts[0].who, swap.resolution.controls.parts[0].immunity.duration],
        [["failure", "criticalFailure"], "swap", "caster", { value: 1, unit: "minutes" }]);
    assert.ok(swap.resolution.reminders.some(reminder => /triggering attack/.test(reminder.text)));
    const shuffle = compile(await spell("rank-6/collective-transposition"));
    assert.equal(supported(shuffle), true);
    const part = shuffle.resolution.controls.parts[0];
    assert.deepEqual([shuffle.resolution.controls.degrees, part.within, part.from, part.entirely], [["criticalSuccess", "failure", "criticalFailure"], 30, "caster", true]);
    const forged = structuredClone(shuffle); forged.resolution.controls.parts[0].within = "far";
    assert.equal(supported(forged), false);
});

test("Magnetic Dominion: the save, the card's relocation within 100 feet, and 8th-rank Magnetic Repulsion on the caster by its own route", async () => {
    const plan = compileWith(await spell("rank-9/magnetic-dominion"));
    assert.equal(supported(plan), true);
    const parts = Object.fromEntries(plan.resolution.controls.parts.map(part => [part.key, part]));
    assert.deepEqual([parts.relocate.within, parts.cast.kind, parts.cast.rank, parts.cast.name], [100, "cast-spell", 8, "Magnetic Repulsion"]);
    // Without the referenced spell, the plan isn't claimed.
    assert.notEqual(compile(await spell("rank-9/magnetic-dominion")).resolution.controls?.parts?.[1]?.kind, "cast-spell");
});

test("All is One, One is All and Proximal Shift: cards of movement parts — swaps and shared Hit Points; the jump, the crater's save, the debris' basic save and its terrain", async () => {
    const meld = compile(await spell("rank-8/all-is-one-one-is-all"));
    assert.equal(meld.resolution.kind, "incarnate");
    assert.deepEqual(meld.resolution.incarnate.phases.map(phase => phase.kind), ["teleport", "hp-share"]);
    assert.deepEqual(inspectParts(meld.resolution.incarnate.phases), []);
    const shift = compile(await spell("rank-6/proximal-shift"));
    const phases = Object.fromEntries(shift.resolution.incarnate.phases.map(phase => [phase.key, phase]));
    assert.deepEqual(Object.keys(phases), ["crater", "jump", "debris", "terrain"]);
    assert.deepEqual([phases.jump.who, phases.jump.within], ["caster", 60]);
    assert.equal(phases.crater.plan.resolution.sharedDamage.formula, "(5)[bludgeoning]");
    assert.equal(phases.debris.plan.resolution.check.basic, true);
    assert.deepEqual([phases.terrain.place, phases.terrain.rounds], [{ type: "emanation", value: 5 }, 10]);
    assert.deepEqual(inspectParts(shift.resolution.incarnate.phases), []);
});
