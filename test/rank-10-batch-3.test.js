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


// Rank 10, batch 3 (2026-10-05): the end of feature group 5 — Avatar (a deity's battle form behind PF2e's choice on the module's Effect) and
// Metamorphosis (the caster's own polymorph spells from the form's card).

test("Avatar: PF2e's choice of the 21 deities, a BattleForm for each (size, AC, temporary Hit Points, speeds, Strikes, immunities); the rest notes", async () => {
    const plan = compile(await spell("rank-10/avatar"));
    assert.equal(plan.resolution.kind, "generated-form");
    const rules = plan.resolution.generatedForm.rules;
    assert.equal(rules[0].key, "ChoiceSet");
    assert.equal(rules[0].choices.length, 21);
    const gorum = rules.find(rule => rule.key === "BattleForm" && rule.predicate[0] === "avatar:gorum");
    assert.deepEqual([gorum.overrides.size, gorum.overrides.armorClass.modifier, gorum.overrides.tempHP, gorum.overrides.speeds.land, gorum.overrides.immunities], ["huge", "25 + @actor.level", 30, 70, [{ type: "immobilized" }]]);
    assert.deepEqual(gorum.overrides.strikes.greatsword.damage, { dice: 6, die: "d12", modifier: 6, damageType: "slashing" });
    const nethys = rules.find(rule => rule.predicate?.[0] === "avatar:nethys");
    assert.deepEqual(nethys.overrides.strikes["raw-magic"].traits, ["unarmed", "versatile-cold", "versatile-electricity", "versatile-fire"]);
    assert.equal(rules.find(rule => rule.predicate?.[0] === "avatar:asmodeus").overrides.speeds.fly, 70);
    assert.ok(plan.resolution.gmNotes.some(note => /Iomedae: a shield/.test(note)));
    // A trait the reader doesn't know isn't guessed.
    const changed = compile(withText(await spell("rank-10/avatar"), html => html.replace("(reach 15 feet), <strong>Damage</strong> 6d10+6 bludgeoning", "(reach 15 feet, sweep), <strong>Damage</strong> 6d10+6 bludgeoning")));
    assert.notEqual(changed.resolution.kind, "generated-form");
});

test("Metamorphosis: the module's Effect and the form's card — the caster's polymorph spells up to 8th rank, 40 temporary Hit Points, each form once", async () => {
    const plan = compile(await spell("rank-9/metamorphosis"));
    assert.equal(plan.resolution.kind, "generated-form");
    assert.deepEqual(plan.resolution.controls.parts.map(part => [part.kind, part.maxRank, part.tempHP]), [["cast-form", 8, 40]]);
    const changed = compile(withText(await spell("rank-9/metamorphosis"), html => html.replace("40 temporary Hit Points rather than", "40 temporary Hit Points in addition to")));
    assert.notEqual(changed.resolution.kind, "generated-form");
});
