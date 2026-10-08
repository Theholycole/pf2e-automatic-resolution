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


// Rank 5, batch 31 (2026-10-02): Gluttonous Growth (a sustained burst of difficult terrain, ground and air; a creature beginning its turn inside saves
// unless this spell already holds it Grabbed or Restrained: Grabbed for 1 round / Grabbed / Restrained, until it Escapes; each Sustain deals the held
// creatures 4d6 piercing, +2d6 a rank — the text's step).

test("Gluttonous Growth: the held creatures' Sustain damage", async () => {
    const { heldDamageFormula } = await import("../src/compiler/held-damage.js");
    const plan = compile(await spell("rank-5/gluttonous-growth"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.events, lingering.sustained, lingering.terrain.movement], [["turn-start"], true, ["walk", "fly"]]);
    assert.deepEqual(lingering.skipWhile.slugs, ["grabbed", "restrained"]);
    assert.deepEqual(lingering.heldDamage.entries.map(entry => heldDamageFormula(entry, 7, lingering.heldDamage.baseRank)), ["8d6[piercing]", "8d6[piercing]"]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.endsWhen?.[0]?.event]), [["restrained", "escape"]]);
    // A held damage on a condition the rows don't apply isn't executable.
    const { isExecutableLingeringPlan } = await import("../scripts/basic-save-core.js");
    const broken = structuredClone(plan); broken.resolution.lingering.heldDamage.entries[0].slug = "immobilized";
    assert.equal(isExecutableLingeringPlan(broken), false);
});
