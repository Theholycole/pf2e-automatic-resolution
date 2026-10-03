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


// Rank 3, batch 80 (2026-10-02): Lightning Lasso (the Reflex rows with PF2e's damage; the failing rows' Immobilized — and Restrained — until the end of the
// caster's next turn or an Escape; each later round's first Sustain deals (rank − 2) × 2 electricity to each target still held and renews its hold).

test("Lightning Lasso: the Sustain's damage to a held target", async () => {
    const plan = compile(await spell("rank-3/lightning-lasso"));
    assert.deepEqual(["success", "failure", "criticalFailure"].map(d => [plan.resolution.outcomes[d].damage.multiplier ?? plan.resolution.outcomes[d].damage.shared?.multiplier,
        plan.resolution.outcomes[d].effects.map(e => [e.slug, e.endsWhen?.[0]?.event ?? null])]),
        [[1, []], [1, [["immobilized", "escape"]]], [1, [["immobilized", "escape"], ["restrained", "escape"]]]]);
    assert.deepEqual([plan.resolution.sustainHold.formula, plan.resolution.sustainHold.type, plan.resolution.sustainHold.degrees], ["(@item.rank -2)*2", "electricity", ["failure", "criticalFailure"]]);
    assert.deepEqual(inspectSavePlan(plan).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.sustainHold.degrees = ["success"];
    assert.ok((inspectSavePlan(bad).blockers ?? []).some(b => /held targets/.test(b.message)));
    const other = compile(withText(await spell("rank-3/lightning-lasso"), html => html.replace("when you Sustain the spell increases by 2", "when you Sustain the spell increases by 3")));
    assert.equal(other.compilerEvidence.sustainedLasso, undefined);
});
