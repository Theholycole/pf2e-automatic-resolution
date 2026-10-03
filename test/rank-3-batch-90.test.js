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


// Rank 3, batch 90 (2026-10-03): Stone Lance (the spell attack's rows: the hit's damage and a Speed penalty until it Escapes — the spell's time at most —,
// the critical hit's Immobilized too; the persistent bleed when it Escapes, heightened; off-the-ground creatures a GM reminder).

test("Stone Lance: a Speed penalty until Escape, Immobilized on a critical hit, bleed on Escape", async () => {
    const plan = compile(await spell("rank-3/stone-lance"));
    assert.equal(supported(plan), true);
    assert.equal(plan.resolution.check.statistic, "spell-attack");
    const outcomes = plan.resolution.outcomes;
    assert.deepEqual(["criticalSuccess", "success"].map(degree => outcomes[degree].modifiers.map(modifier => [modifier.value, modifier.modifierType, modifier.duration.mode])),
        [[[-10, "circumstance", "escape"]], [[-10, "circumstance", "escape"]]]);
    assert.deepEqual(outcomes.criticalSuccess.effects.map(effect => [effect.slug, effect.endsWhen?.[0]?.event]), [["immobilized", "escape"]]);
    assert.deepEqual(plan.resolution.escapeDamage, { base: 3, perRank: 1, baseRank: 3, type: "bleed", sourceText: plan.resolution.escapeDamage.sourceText });
    const bad = structuredClone(plan); bad.resolution.escapeDamage.base = 0;
    assert.equal(supported(bad), false);
    // A penalty that isn't tied to Escaping, or another heightening, isn't read.
    const other = compile(withText(await spell("rank-3/stone-lance"), html => html.replace("unless it Escapes", "for 1 round")));
    assert.equal(other.compilerEvidence.impalingLance, undefined);
    const step = compile(withText(await spell("rank-3/stone-lance"), html => html.replace("by 2d6 and", "by 3d6 and")));
    assert.equal(step.compilerEvidence.impalingLance, undefined);
});
