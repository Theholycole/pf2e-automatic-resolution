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


// Rank 4, batch 97 (2026-10-02): Personal Runewell (a placed 15-foot cylinder for the minute; the caster and allies inside hold PF2e's Effect — spell damage +
// the spell's rank — while inside; the GM's control when an enemy casts a spell inside opens its basic Reflex card against 4d6 force, +1d6 a rank; a recast ends
// the previous one; Dismiss).

test("Personal Runewell: the allies' Effect and the enemies' bolts", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/personal-runewell"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.area, lingering.memberEffect.allies, lingering.gmAction.actions, lingering.recastEnds, lingering.dismissible],
        ["placed", { type: "cylinder", value: 15 }, true, ["cast"], true, true]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan)).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.lingering.memberEffect.document.mechanics.rules[0].value = 2;
    assert.equal(isExecutableLingeringPlan(bad), false);
    const other = compile(withText(await spell("rank-4/personal-runewell"), html => html.replace("as well as those of your allies", "but not those of your allies")));
    assert.equal(other.compilerEvidence.runewell, undefined);
});
