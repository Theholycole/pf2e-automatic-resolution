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


// Rank 7, batch 20 (2026-10-05): feature group 10 — attack shapes (attack-shapes.js): Ray of Corruption, Deity's Strike, Pierce the Sky, Doom Mark,
// Ravenous Darkness, Comet Charge, Unbreaking Wave Containment.
import { inspectIncarnatePlan, isExecutableSavePlan } from '../scripts/basic-save-core.js';

const referencedSpells = new Map();
for (const dir of await readdir(new URL('spells/spells/', base))) for (const file of await readdir(new URL(`spells/spells/${dir}/`, base))) {
    const source = JSON.parse(await readFile(new URL(`spells/spells/${dir}/${file}`, base), 'utf8'));
    if (source._id) referencedSpells.set(`Compendium.pf2e.spells-srd.Item.${source._id}`, source);
}
const compileWith = source => compileAbility(source, { nativeEffectCatalog: effects, referencedSpells });
const phasesOf = phases => Object.fromEntries(phases.map(phase => [phase.key, phase]));
const card = async path => { const plan = compileWith(await spell(path)); assert.equal(plan.resolution.kind, "incarnate", path); assert.deepEqual(inspectIncarnatePlan(plan), [], path); return plan; };

test("Ray of Corruption: the attack, then the save a degree worse on a critical hit, its rows' persistent acid; the rank in both pools", async () => {
    const plan = await card("rank-7/ray-of-corruption");
    const ray = phasesOf(plan.resolution.incarnate.phases).ray;
    assert.deepEqual([ray.kind, ray.critWorse, ray.range, ray.plan.resolution.check.statistic], ["attack-save", true, 60, "fortitude"]);
    assert.equal(ray.plan.resolution.sharedDamage.formula, "{(6 + 1 * (@item.rank - 7))d12[poison],(6 + 1 * (@item.rank - 7))d12[spirit]}");
    assert.ok(JSON.stringify(ray.plan.resolution.outcomes.criticalFailure).includes("4d12"));
});

test("Deity's Strike and Pierce the Sky: the weapon's attack and the line's save; the arrows (three, one penalty) and the lines between", async () => {
    const deity = phasesOf((await card("rank-7/deitys-strike")).resolution.incarnate.phases);
    assert.deepEqual([deity.strike.kind, deity.strike.plan.resolution.sharedDamage.formula, deity.wave.plan.resolution.sharedDamage.formula],
        ["attack", "((ternary(gte(@item.rank,9),8,7))d12)[force]", "(ternary(gte(@item.rank,9),6,5))d6[spirit]"]);
    const sky = phasesOf((await card("rank-9/pierce-the-sky")).resolution.incarnate.phases);
    assert.deepEqual([sky.arrows.count, sky.arrows.plan.resolution.sharedDamage.formula], [3, "{6d12[electricity],6d6[sonic]}"]);
    assert.deepEqual([sky.lines.between, sky.lines.formula, sky.lines.type, sky.lines.events, sky.lines.oncePerRound, sky.lines.rounds], [true, "12", "electricity", ["enter", "turn-start"], true, 10]);
});

test("Doom Mark and Unbreaking Wave Containment: the card's record holds the marks (and their payoff) or the Sustained hold", async () => {
    const doom = await card("rank-6/doom-mark");
    assert.deepEqual(doom.resolution.incarnate.lasting, { seconds: 60, sustained: false });
    assert.deepEqual(doom.resolution.incarnate.markTrigger.conditions.map(entry => [entry.slug, entry.value]), [["off-guard", null], ["clumsy", 1]]);
    const dart = phasesOf(doom.resolution.incarnate.phases).dart;
    assert.equal(dart.plan.resolution.sharedDamage.formula, "((6 + 1 * (@item.rank - 6))d8)[void]");
    const wave = await card("rank-9/unbreaking-wave-containment");
    assert.deepEqual(wave.resolution.incarnate.lasting, { seconds: 600, sustained: true });
    const parts = phasesOf(wave.resolution.incarnate.phases);
    assert.deepEqual([parts.bind.count, parts.bind.plan.resolution.outcomes.criticalSuccess.effects.map(effect => effect.slug)], [4, ["immobilized", "restrained"]]);
    assert.ok(isExecutableSavePlan(parts.crush.plan));
});

test("Ravenous Darkness and Comet Charge: the teeth's darkness and attack; the charge for each element (the metal attack for rust)", async () => {
    const teeth = phasesOf((await card("rank-6/ravenous-darkness")).resolution.incarnate.phases).teeth;
    assert.deepEqual([teeth.darkness.rank, teeth.statistic, teeth.formula, teeth.gnaw, teeth.speedPenalty, teeth.seconds], [4, "fortitude", "4d6", "1d6", 10, 60]);
    const comet = await card("rank-7/comet-charge");
    const choices = comet.resolution.incarnate.options.choices;
    assert.deepEqual(choices.map(choice => choice.key), ["comet-of-acid", "comet-of-fire", "comet-of-ice", "comet-of-lightning", "comet-of-rust", "comet-of-splinters"]);
    const rust = phasesOf(choices.find(choice => choice.key === "comet-of-rust").phases);
    assert.deepEqual([rust.charge.feet, rust.charge.metalAttack, rust["attack-metal"].plan.resolution.sharedDamage.formula], [120, "attack-metal", "10d10[slashing]"]);
    const acid = phasesOf(choices[0].phases);
    assert.equal(acid.attack.plan.resolution.sharedDamage.formula, "{6d6[acid],4d6[persistent,acid]}");
});
