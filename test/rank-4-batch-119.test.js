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


// Rank 4, batch 119 (2026-10-03): Shielding Formation (PF2e's Effect proved: the caster and allies gain it on ending a turn in the caster's emanation;
// switching on its resistance ends it after that damage, with 10 minutes' immunity; the caster's use blocks a new casting).

test("Shielding Formation: the proved area Effect", async () => {
    const plan = compile(await spell("rank-4/shielding-formation"));
    assert.equal(plan.resolution.kind, "effect-note");
    assert.equal(plan.automation.level, "automatic");
    const proof = plan.resolution.effectNote.proof;
    assert.equal(plan.resolution.effectNote.recipient, "area");
    assert.deepEqual(proof.recipient, { actor: "area", allies: true, includeCaster: true, centre: "caster" });
    assert.equal(proof.memberTurnEnd, true);
    assert.deepEqual(proof.shieldUse, { option: "shielding-formation-resistance" });
    assert.deepEqual(proof.immunity, { value: 10, unit: "minutes" });
    assert.equal(proof.casterUseBlocksCasting, true);
    // A different resistance isn't proved.
    const other = compile(withText(await spell("rank-4/shielding-formation"), html => html.replace("resistance 10 to all damage", "resistance 5 to all damage")));
    assert.notEqual(other.automation.level, "automatic");
});
