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


// Rank 4, batch 76 (2026-10-02): Roar of the Dragon (Will, enemies other than dragons: Frightened 1/2/3, Fleeing 1 round on a critical failure; PF2e's
// Effect on the caster once per cast — +2 circumstance to Diplomacy against dragons that were in the area — with a toggle for that option).

test("Roar of the Dragon: the enemies' Frightened, and the caster's Effect with its toggle", async () => {
    const { inspectSavePlan } = await import("../scripts/basic-save-core.js");
    const { casterRowEffectMatches } = await import("../src/compiler/caster-row-effect.js");
    const plan = compile(await spell("rank-4/roar-of-the-dragon"));
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => `${e.slug}${e.value ?? ""}`)), [["frightened1"], ["frightened2"], ["frightened3", "fleeing"]]);
    const effect = plan.resolution.casterRowEffect;
    assert.deepEqual([effect.kind, effect.skill, effect.type, effect.value, effect.trait, effect.option, effect.duration], ["cast", "diplomacy", "circumstance", 2, "dragon", "roar-of-the-dragon-area", { value: 10, unit: "minutes" }]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "enemy-of-caster" }, { kind: "trait", present: false, slug: "dragon" }]);
    assert.ok(plan.resolution.reminders.some(r => /deep ties to dragonkind/.test(r.text)));
    assert.equal(casterRowEffectMatches(effect.document.mechanics, { ...effect, value: 3 }), false);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another bonus isn't read (PF2e's Effect wouldn't state it).
    const other = compile(withText(await spell("rank-4/roar-of-the-dragon"), html => html.replace("+2 circumstance bonus to Diplomacy", "+3 circumstance bonus to Diplomacy")));
    assert.equal(other.compilerEvidence.dragonRoar, undefined);
});
