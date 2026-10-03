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


// Rank 4, batch 93 (2026-10-02): Cloak of Light (a sustained 5-foot emanation around the caster, the caster out of it; a creature starting its turn in it is
// exposed in Heal's dual mode — a living one regains the roll, an undead one saves; the caster's light a TokenLight Effect).

test("Cloak of Light: the adjacent creatures' turn-start heal or harm", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/cloak-of-light"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.area, lingering.events, lingering.excludeCaster, lingering.sustained], ["caster", { type: "emanation", value: 5 }, ["turn-start"], true, true]);
    assert.deepEqual([plan.resolution.dualMode, lingering.casterLight.bright, lingering.casterLight.dim], [{ energy: "vitality" }, 30, 60]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "turn-start" })).blockers ?? [], []);
    const bad = structuredClone(plan); bad.resolution.lingering.casterLight.dim = 10;
    assert.equal(isExecutableLingeringPlan(bad), false);
    const other = compile(withText(await spell("rank-4/cloak-of-light"), html => html.replace("recover 4d6 Hit Points", "recover 4d8 Hit Points")));
    assert.equal(other.compilerEvidence.holyCloak, undefined);
});
