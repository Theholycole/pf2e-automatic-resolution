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


// Rank 5, batch 94 (2026-10-03): the user's rulings on the last rank 3–5 gaps — Restraining Chains (unnamed save: Reflex), Ravening Maw (no rows: a failure
// gives the effect), Elemental Tempest (the caster confirms the legacy evocation), Conglomerate of Limbs (the thrall rules).

test("Restraining Chains: Reflex for the unnamed save, Clumsy and the hold until it Escapes", async () => {
    const chains = compile(await spell("rank-3/restraining-chains"));
    assert.equal(chains.resolution.kind, "save");
    assert.equal(chains.resolution.check.statistic, "reflex");
    const { outcomes } = chains.resolution;
    assert.deepEqual(outcomes.failure.effects.map(effect => [effect.slug, effect.value]), [["clumsy", 1]]);
    assert.deepEqual(outcomes.criticalFailure.effects.map(effect => [effect.slug, effect.value]), [["clumsy", 2]]);
    for (const degree of ["success", "failure", "criticalFailure"]) assert.equal(outcomes[degree].noteEffects.find(note => note.label === "Chained").escape, true);
    assert.match(outcomes.success.noteEffects[0].text, /20 feet/);
    // A save row that isn't a restraint isn't given Reflex.
    const other = compile(withText(await spell("rank-3/restraining-chains"), html => html.replace("can only move up to 20 feet away", "is dazzled 20 feet away")));
    assert.notEqual(other.resolution.check?.statistic, "reflex");
});

test("Ravening Maw: the hunger on a failure, its healing and damage at the rank", async () => {
    const maw = compile(await spell("rank-5/ravening-maw"));
    assert.equal(maw.resolution.kind, "cannibal-hunger");
    const data = maw.resolution.cannibalHunger;
    assert.deepEqual(data.degrees, { criticalSuccess: false, success: false, failure: true, criticalFailure: true });
    assert.deepEqual([data.statistic, data.seconds, data.radius, data.ally, data.other, data.starve], ["will", 18, 30, { dice: 5, die: 8, step: 1 }, { dice: 5, die: 4, step: 1 }, { dice: 5, die: 4, type: "mental", step: 1 }]);
    const other = compile(withText(await spell("rank-5/ravening-maw"), html => html.replace("the target regains 5d8 HP", "the target regains 5d8 HP and 2 temporary HP")));
    assert.notEqual(other.resolution.kind, "cannibal-hunger");
});

test("Elemental Tempest: the storm the caster confirms", async () => {
    const tempest = compile(await spell("rank-4/elemental-tempest"));
    assert.equal(tempest.resolution.kind, "spell-storm");
    assert.deepEqual(tempest.resolution.spellStorm, { slots: "wizard", school: "evocation", types: ["acid", "cold", "electricity", "fire"], radius: 10, perRank: { dice: 1, die: 6 }, combine: true });
});

test("Conglomerate of Limbs: the thrall by the thrall rules", async () => {
    const limbs = compile(await spell("rank-4/conglomerate-of-limbs"));
    assert.equal(limbs.resolution.kind, "giant-thrall");
    const data = limbs.resolution.giantThrall;
    assert.deepEqual([data.size, data.hp, data.speed, data.hpStep, data.strikes, data.reach, data.save, data.holdRounds, data.seconds], ["huge", 40, 25, { every: 1, add: 10 }, 2, 10, "fortitude", 1, 60]);
    assert.deepEqual(data.thrall.immunities, ["bleed", "death-effects", "disease", "mental", "poison"]);
    const other = compile(withText(await spell("rank-4/conglomerate-of-limbs"), html => html.replace("a Speed of 25 feet.", "a Speed of 25 feet and AC 20.")));
    assert.notEqual(other.resolution.kind, "giant-thrall");
});
