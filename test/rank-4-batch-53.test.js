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


// Rank 4, batch 53 (2026-10-02): Sanguine Mist (a sustained 10-foot burst: 6d6 void to each living creature but the caster when cast, basic
// Fortitude; concealment; each first Sustain a round (rank − 2)d6 void with another save, and the caster gains temporary Hit Points equal to
// half the most a creature took, for 1 minute).

test("Sanguine Mist: the Sustain feeds the caster", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const plan = compile(await spell("rank-4/sanguine-mist"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.initial, lingering.events, lingering.excludeCaster, lingering.concealment, lingering.sustainDamage.formula], [true, ["sustain"], true, true, "(@item.rank -2)d6[void]"]);
    assert.deepEqual([lingering.casterSiphon.fraction, lingering.casterSiphon.measure, lingering.casterSiphon.lasts], [0.5, "most-lost", { value: 1, unit: "minutes" }]);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "living-creature" }]);
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.ok(lingeringExposurePlan(plan, { event: "sustain" }).resolution.casterSiphon);
    assert.equal(lingeringExposurePlan(plan, { event: null }).resolution.casterSiphon, undefined);
    // Another share of the damage isn't read.
    const other = compile(withText(await spell("rank-4/sanguine-mist"), html => html.replace("equal to half the damage", "equal to the damage")));
    assert.equal(other.resolution.lingering?.casterSiphon, undefined);
    const broken = structuredClone(plan); broken.resolution.lingering.casterSiphon.fraction = 1;
    assert.equal(isExecutableLingeringPlan(broken), false);
});
