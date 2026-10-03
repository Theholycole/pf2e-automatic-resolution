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


// Rank 4, batch 91 (2026-10-02): Call the Ten (the targets' basic Fortitude save; for each target the caster's answer on the card — shielded: no save, PF2e's
// Spell Effect with its resistance heightened; attacked: it saves).

test("Call the Ten: the shielded targets' Effect, the attacked targets' save", async () => {
    const { proveBolsterEffect } = await import("../src/compiler/bolster-split.js");
    const plan = compile(await spell("rank-4/call-the-ten"));
    const bolster = plan.resolution.bolster;
    assert.equal(plan.resolution.check.basic, true);
    assert.deepEqual([bolster.claim.kind, bolster.claim.types, bolster.claim.value, bolster.claim.step], ["resistance", ["physical", "spirit"], 3, { interval: 2, add: 2, baseRank: 4 }]);
    assert.equal(plan.targeting.target, "up to 10 creatures");
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    // Another resistance step isn't proven.
    assert.equal(proveBolsterEffect(bolster.document.mechanics, { ...bolster.claim, step: { ...bolster.claim.step, add: 3 } }), false);
    const other = compile(withText(await spell("rank-4/call-the-ten"), html => html.replace("which are shielded", "which are healed")));
    assert.equal(other.compilerEvidence.spiritChoice, undefined);
});
