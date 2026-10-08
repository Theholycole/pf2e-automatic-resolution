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


// Rank 6, batch 21 (2026-10-05): the rest of feature group 2 — Gray Shadow, Shambling Horror, Shadow Illusion, Primal Summons, Patron's Protector,
// Weapon of Judgment, Blessed Boundary.
import { inspectIncarnatePlan } from "../scripts/basic-save-core.js";
import { readdirSync, readFileSync } from "node:fs";

const spellsRoot = new URL('spells/spells/', base);
const referencedSpells = new Map();
for (const rank of readdirSync(spellsRoot)) for (const file of readdirSync(new URL(`${rank}/`, spellsRoot))) {
    const source = JSON.parse(readFileSync(new URL(`${rank}/${file}`, spellsRoot), 'utf8'));
    if (source._id) referencedSpells.set(`Compendium.pf2e.spells-srd.Item.${source._id}`, source);
}
const compileRef = source => compileAbility(source, {nativeEffectCatalog: effects, referencedSpells});

test("Gray Shadow and Shambling Horror: summon parts from the text's creature links", async () => {
    const gray = compile(await spell("rank-6/gray-shadow"));
    assert.deepEqual(inspectIncarnatePlan(gray), []);
    const [summon] = gray.resolution.incarnate.phases;
    assert.deepEqual([summon.kind, summon.actorName, summon.linkedDying, /Gray Shadow/.test(summon.effectUuid)], ["summon", "Greater Shadow", true, true]);
    const horror = compile(await spell("rank-6/shambling-horror"));
    assert.deepEqual(inspectIncarnatePlan(horror), []);
    const [raise] = horror.resolution.incarnate.phases;
    assert.ok(raise.candidates.length >= 20 && raise.candidates.some(entry => entry.name === "Plague Zombie" && entry.level === 1 && entry.size === "med"));
    assert.equal(raise.fromCorpse, true);
});

test("Shadow Illusion: Illusory Creature's route with 3d8 (+1d8 per 2 ranks), up to Gargantuan", async () => {
    const plan = compileRef(await spell("rank-6/shadow-illusion"));
    assert.equal(plan.resolution.kind, "illusory-creature");
    assert.deepEqual([plan.resolution.illusoryCreature.strike.dice, plan.resolution.illusoryCreature.strike.faces, plan.resolution.illusoryCreature.strike.step, plan.resolution.illusoryCreature.maxSize],
        [3, 8, { interval: 2, dice: 1 }, "grg"]);
});

test("Primal Summons, Patron's Protector, Weapon of Judgment, Blessed Boundary: their cards' parts", async () => {
    const primal = compile(await spell("rank-6/primal-summons"));
    assert.deepEqual(primal.resolution.incarnate.phases.map(part => part.kind), ["native-effect"]);
    const patron = compile(await spell("rank-6/patrons-protector"));
    assert.deepEqual(inspectIncarnatePlan(patron), []);
    const [form, check, shove] = patron.resolution.incarnate.phases;
    assert.deepEqual([form.acSet, form.tempHp, form.zeroToOne, form.rules], [{ base: 28, byRank: { 9: 36 } }, { base: 20, byRank: { 9: 30 } }, true, [{ key: "CreatureSize", value: "lg" }]]);
    assert.deepEqual([check.plan.resolution.sharedDamage.formula, check.byRank[0].minRank, check.byRank[0].plan.resolution.sharedDamage.formula], ["4d10[bludgeoning]", 9, "6d10[bludgeoning]"]);
    assert.deepEqual(check.plan.resolution.outcomes.criticalFailure.forcedMovement.distance, 20);
    assert.equal(shove.kind, "effect");
    const judge = compile(await spell("rank-9/weapon-of-judgment"));
    const [strike] = judge.resolution.incarnate.phases;
    assert.deepEqual([strike.kind, strike.plan.resolution.casterChoice.values, strike.byRank[0].minRank], ["attack", ["bludgeoning", "piercing", "slashing", "spirit"], 10]);
    const shell = compile(await spell("rank-6/blessed-boundary"));
    const [crossing] = shell.resolution.incarnate.phases;
    assert.deepEqual([crossing.plan.resolution.sharedDamage.formula, crossing.plan.resolution.outcomes.failure.forcedMovement.direction, crossing.plan.resolution.outcomes.criticalFailure.forcedMovement.distance],
        ["(7+@item.rank - 6)d8[force]", "any", 20]);
});
