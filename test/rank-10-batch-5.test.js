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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 10, batch 5 (2026-10-05): feature group 13 — revival (revival-cards.js, scripts/revival-runtime.js): Raise Dead, Revival, Shock to the System,
// Moment of Renewal.
import { inspectIncarnatePlan } from '../scripts/basic-save-core.js';

const referencedSpells = new Map();
for (const dir of await readdir(new URL('spells/spells/', base))) for (const file of await readdir(new URL(`spells/spells/${dir}/`, base))) {
    const source = JSON.parse(await readFile(new URL(`spells/spells/${dir}/${file}`, base), 'utf8'));
    if (source._id) referencedSpells.set(`Compendium.pf2e.spells-srd.Item.${source._id}`, source);
}
const phasesOf = plan => Object.fromEntries(plan.resolution.incarnate.phases.map(phase => [phase.key, phase]));
const card = async path => { const plan = compileAbility(await spell(path), { nativeEffectCatalog: effects, referencedSpells }); assert.equal(plan.resolution.kind, "incarnate", path); assert.deepEqual(inspectIncarnatePlan(plan), [], path); return plan; };

test("Raise Dead and Revival: the levels by rank, 1 Hit Point and the week's debilitation; Revival's healing and Raise Dead's debilitation for the raised", async () => {
    const raise = phasesOf(await card("rank-6/raise-dead")).raise;
    assert.deepEqual([raise.levels, raise.hp, raise.debilitation.days, raise.debilitation.conditions.map(entry => `${entry.slug} ${entry.value}`)],
        [{ 6: 13, 7: 15, 8: 17, 9: 19, 10: 21 }, 1, 7, ["clumsy 2", "drained 2", "enfeebled 2"]]);
    const revival = await card("rank-10/revival");
    const revive = phasesOf(revival).revive;
    assert.deepEqual([revive.formula, revive.debilitation.days, revival.resolution.incarnate.lasting], ["10d8+40", 7, { seconds: 60, sustained: true }]);
});

test("Shock to the System and Moment of Renewal: the healing and the innate spell by rank, the cloud; the day's recovery for up to 6", async () => {
    const shock = phasesOf(await card("rank-7/shock-to-the-system")).shock;
    assert.deepEqual([shock.formula, shock.wounded, shock.innate.name, shock.innate.rank, shock.innate.step, shock.cloud.slug, shock.seconds],
        ["(8 + 2 * (@item.rank - 7))d8", 1, "Thunderstrike", 5, 1, "hidden", 60]);
    const renewal = phasesOf(await card("rank-8/moment-of-renewal")).renewal;
    assert.deepEqual([renewal.count, renewal.hours, renewal.immuneDays], [6, 24, 1]);
});
