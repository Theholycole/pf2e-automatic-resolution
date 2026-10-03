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


// Rank 4, batch 58 (2026-10-02): Weaponize Secret (Will: a failure leaves the caster a rune discharged when that creature attacks the caster —
// 7d6 mental, +2d6 a rank; a critical failure also 1d6 persistent mental, +1 a rank, which the discharge ends).

test("Weaponize Secret: the rune and its discharge", async () => {
    const { inspectSavePlan, isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/weaponize-secret"));
    const rune = d => plan.resolution.outcomes[d].noteEffects.map(n => n.triggeredDamage);
    assert.deepEqual(rune("failure").map(t => [t.trigger, t.dice, t.die, t.type, t.frequency, t.endsSpell, t.endsPersistent ?? null]), [["attack-against-caster", 7, 6, "mental", "once", true, null]]);
    assert.deepEqual(rune("criticalFailure").map(t => t.endsPersistent), ["mental"]);
    assert.ok([...rune("failure"), ...rune("criticalFailure")].every(isTriggeredDamage));
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.damage.formulas.map(f => f.formula), ["(1d6 + @item.rank - 4)[persistent,mental]"]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another discharge isn't read.
    const other = compile(withText(await spell("rank-4/weaponize-secret"), html => html.replace("as a reaction", "as a free action")));
    assert.equal(other.compilerEvidence.secretRune, undefined);
});
