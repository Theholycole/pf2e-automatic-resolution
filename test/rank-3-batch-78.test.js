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


// Rank 3, batch 78 (2026-10-02): Skyglass Prison (Immobilized or Restrained until the creature Escapes, the success's until the start of the caster's next
// turn; each held row's note deals the shards — PF2e's damage at the cast rank — when it Escapes or the cage breaks, ending the cage; the cage a reminder).

test("Skyglass Prison: the shards when the cage breaks", async () => {
    const { isTriggeredDamage } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-3/skyglass-prison"));
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => plan.resolution.outcomes[d].effects.map(e => [e.slug, e.endsWhen?.[0]?.event])),
        [[["immobilized", "escape"]], [["immobilized", "escape"]], [["restrained", "escape"]]]);
    for (const d of ["success", "failure", "criticalFailure"]) {
        const [note] = plan.resolution.outcomes[d].noteEffects;
        assert.deepEqual([note.triggeredDamage.trigger, note.triggeredDamage.dice, note.triggeredDamage.die, note.triggeredDamage.type, note.triggeredDamage.endsSpell], ["cage-broken", 3, 4, "slashing", true]);
    }
    assert.equal(plan.resolution.outcomes.success.noteEffects[0].duration.anchor, "source-turn");
    assert.ok(plan.resolution.reminders.some(r => /\+10 for each rank above 3/.test(r.text)));
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // A broken cage that doesn't end it is refused.
    assert.equal(isTriggeredDamage({ ...plan.resolution.outcomes.failure.noteEffects[0].triggeredDamage, endsSpell: false }), false);
    // Another cage isn't read.
    const other = compile(withText(await spell("rank-3/skyglass-prison"), html => html.replace("You can Dismiss this spell to destroy the cage.", "")));
    assert.equal(other.compilerEvidence.glassCage, undefined);
});
