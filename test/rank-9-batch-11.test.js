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


// Rank 9, batch 11 (2026-10-05): feature group 8, part 1 — mode cards (mode-cards.js): Storm Lord, Wrathful Storm, Storm of Vengeance, Musical Shift,
// Dancing Fountain, Impaling Briars.
import { inspectParts } from '../scripts/basic-save-core.js';
const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));

test("Storm Lord: the storm following the caster; Rain's and Wind's generated rules, Fog's concealment, Calm; the bolt's basic save with Deafened", async () => {
    const plan = compile(await spell("rank-9/storm-lord"));
    assert.equal(plan.resolution.kind, "incarnate");
    assert.deepEqual(inspectParts(plan.resolution.incarnate.phases), []);
    const area = plan.resolution.incarnate.area;
    assert.deepEqual([area.radius, area.follow, area.sustained], [100, true, true]);
    const phases = phasesOf(plan);
    assert.deepEqual(phases.rain.state.memberEffect.generated.rules[0], { key: "FlatModifier", selector: ["acrobatics", "perception"], type: "circumstance", value: -2 });
    assert.deepEqual([phases.wind.state.memberEffect.generated.rules[0].value, phases.wind.state.terrain], [-4, { difficulty: 2, movement: ["fly"] }]);
    assert.deepEqual(phases.bolt.plan.resolution.outcomes.failure.effects.map(effect => effect.slug), ["deafened"]);
});

test("Wrathful Storm and Storm of Vengeance: the placed cloud (larger at 10th), PF2e's or the generated −4, the modes never twice in a row", async () => {
    const wrath = compile(await spell("rank-9/wrathful-storm"));
    assert.deepEqual(inspectParts(wrath.resolution.incarnate.phases), []);
    const area = wrath.resolution.incarnate.area;
    assert.deepEqual([area.place, area.radius, area.byRank], [true, 400, [{ minRank: 10, radius: 1000 }]]);
    const phases = phasesOf(wrath);
    assert.ok(Object.values(phases).filter(phase => phase.kind === "mode").every(phase => phase.noRepeat));
    assert.deepEqual([phases["tornado-action"].kind, phases["tornado-action"].feet, phases["lightning-action"].count], ["launch", 40, 10]);
    const venge = compile(await spell("rank-9/storm-of-vengeance"));
    const vPhases = phasesOf(venge);
    assert.deepEqual(vPhases["thunderclap-action"].plan.resolution.outcomes.failure.effects.map(effect => [effect.slug, effect.duration.value]), [["deafened", 10]]);
    assert.equal(vPhases["acid-rain-action"].formula, "4d8[acid]");
});

test("Musical Shift, Dancing Fountain and Impaling Briars: key and time slots on PF2e's Effect; the fountain's displays; the briars' modes and impaling attack", async () => {
    const music = compile(await spell("rank-8/musical-shift"));
    const mPhases = phasesOf(music);
    assert.deepEqual([mPhases.natural.state.slot, mPhases.natural.state.member.enemies, mPhases.triple.state.slot, mPhases.triple.state.member.allies], [1, true, 2, true]);
    const fountain = compile(await spell("rank-7/dancing-fountain"));
    assert.equal(fountain.resolution.incarnate.area.atCaster, true);
    assert.equal(phasesOf(fountain)["power-rings-action"].plan.resolution.check.basic, true);
    const briars = compile(await spell("rank-8/impaling-briars"));
    const bPhases = phasesOf(briars);
    assert.deepEqual([bPhases.impede.state.terrain, bPhases.impale.kind, bPhases.impale.plan.resolution.check.statistic], [{ difficulty: 2 }, "attack", "spell-attack"]);
    assert.deepEqual(inspectParts(briars.resolution.incarnate.phases), []);
});
