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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 8, batch 18 (2026-10-05): feature group 9, part 2 — prismatic cards (prismatic-cards.js): Prismatic Spray, Rainbow Fumarole, Prismatic Wall.
import { inspectParts, isExecutableSavePlan } from '../scripts/basic-save-core.js';

const referencedSpells = new Map();
for (const dir of await readdir(new URL('spells/spells/', base))) for (const file of await readdir(new URL(`spells/spells/${dir}/`, base))) {
    const source = JSON.parse(await readFile(new URL(`spells/spells/${dir}/${file}`, base), 'utf8'));
    if (source._id) referencedSpells.set(`Compendium.pf2e.spells-srd.Item.${source._id}`, source);
}
const compileWith = source => compileAbility(source, { nativeEffectCatalog: effects, referencedSpells });
const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));

test("Prismatic Spray: the beam roll's table and potent result, each beam a hidden part (blue and indigo cast Petrify and Warp Mind at 7th)", async () => {
    const plan = compileWith(await spell("rank-7/prismatic-spray"));
    assert.equal(plan.resolution.kind, "incarnate");
    assert.deepEqual(inspectParts(plan.resolution.incarnate.phases), []);
    const phases = phasesOf(plan);
    assert.deepEqual([phases.beams.kind, phases.beams.die, phases.beams.twice, Object.values(phases.beams.table)], ["beam-roll", 8, 8, ["red", "orange", "yellow", "green", "blue", "indigo", "violet"]]);
    for (const color of ["red", "orange", "yellow", "green", "violet"]) assert.ok(phases[color].hidden && isExecutableSavePlan(phases[color].plan), color);
    assert.deepEqual([phases.blue.kind, phases.blue.name, phases.blue.rank, phases.indigo.name], ["cast-spell", "Petrify", 7, "Warp Mind"]);
});

test("Rainbow Fumarole: the rolled color's damage and added effect, \"All\" the caster's pick, the basic Reflex save and difficult terrain", async () => {
    const plan = compileWith(await spell("rank-8/rainbow-fumarole"));
    assert.deepEqual(inspectParts(plan.resolution.incarnate.phases), []);
    const fumarole = phasesOf(plan).fumarole;
    assert.deepEqual([fumarole.kind, fumarole.die, fumarole.all, fumarole.statistic, fumarole.area, fumarole.terrain], ["fumarole", 8, 8, "reflex", { type: "cylinder", value: 20 }, 2]);
    assert.equal(fumarole.colors[1].formula, "{50[fire],2d6[persistent,fire]}");
    assert.deepEqual(fumarole.colors[3].effect, { push: 10 });
    assert.deepEqual([fumarole.colors[5].effect.conditions[0].slug, fumarole.colors[5].effect.rounds, fumarole.colors[4].effect.conditions[0].value], ["paralyzed", 1, 2]);
});

test("Prismatic Wall: the light's save, and passing through runs the seven layers (Chromatic Wall's colors, blue and indigo at 7th)", async () => {
    const plan = compileWith(await spell("rank-8/prismatic-wall"));
    assert.deepEqual(inspectParts(plan.resolution.incarnate.phases), []);
    const phases = phasesOf(plan);
    assert.ok(isExecutableSavePlan(phases.light.plan));
    assert.deepEqual(phases.pass.sequence, ["layer-red", "layer-orange", "layer-yellow", "layer-green", "layer-blue", "layer-indigo", "layer-violet"]);
    assert.ok(phases.pass.sequence.every(key => phases[key].hidden));
    assert.deepEqual([phases["layer-blue"].name, phases["layer-blue"].rank, phases["layer-indigo"].name], ["Petrify", 7, "Warp Mind"]);
});

test("the beam, sequence and fumarole parts are checked: a table naming a missing part, an empty sequence or an unreadable color is refused", async () => {
    const plan = compileWith(await spell("rank-7/prismatic-spray"));
    const broken = structuredClone(plan.resolution.incarnate.phases);
    broken[0].table[1] = "missing";
    assert.equal(inspectParts(broken).length, 1);
    assert.equal(inspectParts([{ key: "pass", title: "Passing", kind: "sequence", sequence: [], traits: [], repeat: { trigger: "x" } }]).length, 1);
    const fumarole = structuredClone(compileWith(await spell("rank-8/rainbow-fumarole")).resolution.incarnate.phases);
    fumarole[0].colors[2].formula = "fifty";
    assert.equal(inspectParts(fumarole).length, 1);
});
