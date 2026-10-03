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


// Rank 3, batch 82 (2026-10-02): Mycological Malady (a sustained spell's disease that ends when the spell ends: handed off to Pseudo Afflictions and
// attached to the cast, so ending the spell ends the disease; the lifted undead immunity a GM reminder).

test("Mycological Malady: a spell-bound disease handed off on a sustained cast", async () => {
    const plan = compile(await spell("rank-3/mycological-malady"));
    assert.equal(supported(plan), true);
    assert.equal(plan.lifecycle.sustained, true);
    const block = plan.resolution.afflictionHandoff;
    assert.deepEqual([block.name, block.traits, block.endsWithSpell, block.stages.length], ["Voidcap Spores", ["disease"], true, 3]);
    assert.deepEqual([plan.resolution.outcomes.failure.affliction.stage, plan.resolution.outcomes.criticalFailure.affliction.stage], [1, 2]);
    assert.deepEqual(plan.resolution.outcomes.success.effects.map(effect => [effect.slug, effect.value]), [["enfeebled", 2]]);
    const reminder = plan.resolution.reminders.find(entry => entry.sourceText.startsWith("Undead that aren't incorporeal"));
    assert.match(reminder.text, /GM's discretion\. The module doesn't check/);
    // Without the sentence tying the disease to the spell, a lasting cast can't hand it off.
    const unbound = compile(withText(await spell("rank-3/mycological-malady"), html => html.replace("This disease ends when the spell ends;", "")));
    assert.ok(unbound.automation.pendingCapabilities.includes("affliction-handoff:lifecycle"));
    // Another lifted immunity (to a different kind) isn't read.
    const other = compile(withText(await spell("rank-3/mycological-malady"), html => html.replace("immunity to this disease", "immunity to this poison")));
    assert.equal(other.compilerEvidence.liftedAfflictionImmunity, undefined);
    assert.equal(supported(other), false);
});
