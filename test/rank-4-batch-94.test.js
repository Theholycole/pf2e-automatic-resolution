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


// Rank 4, batch 94 (2026-10-02): Tomorrow's Dawn (a sustained 5-foot emanation around the caster; a nindoru fiend or undead — the GM confirms — starting its
// turn in it saves: Sickened 1 to its turn's end, Sickened 1 and Slowed 1 to its next turn's end, or Sickened 2 and Slowed 1 while the aura lasts; a critical
// success immune for the minute; PF2e's Effect on the caster — its light and mental resistance 5, 10 at 6th, 15 at 8th).

test("Tomorrow's Dawn: the aura's save and the caster's Effect", async () => {
    const { isExecutableLingeringPlan, lingeringExposurePlan } = await import("../scripts/basic-save-core.js");
    const { inspectCasterBenefitClaim } = await import("../scripts/effect-modifier-proof.js");
    const plan = compile(await spell("rank-4/tomorrows-dawn"));
    const lingering = plan.resolution.lingering;
    assert.equal(isExecutableLingeringPlan(plan), true);
    assert.deepEqual([lingering.centre, lingering.area, lingering.events, lingering.excludeCaster], ["caster", { type: "emanation", value: 5 }, ["turn-start"], true]);
    assert.match(lingering.casterEffect.claimText, /mental resistance 5 \(10 at 6th rank, 15 at 8th rank\)/);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.effects.map(e => [e.slug, e.value, e.endsWhen?.[0]?.event ?? null]), [["sickened", 2, null], ["slowed", 1, "area-ended"]]);
    assert.deepEqual(plan.resolution.temporaryImmunity.degrees, ["criticalSuccess"]);
    assert.deepEqual(inspectSavePlan(lingeringExposurePlan(plan, { event: "turn-start" })).blockers ?? [], []);
    // Another heightened resistance isn't proven.
    assert.equal(inspectCasterBenefitClaim(lingering.casterEffect.document, lingering.casterEffect.claimText.replace("15 at 8th", "20 at 8th"), { rank: 4 }).supported, false);
    const other = compile(withText(await spell("rank-4/tomorrows-dawn"), html => html.replace("Any nindoru fiend or undead", "Any fiend")));
    assert.equal(other.compilerEvidence.dawnAura, undefined);
});
