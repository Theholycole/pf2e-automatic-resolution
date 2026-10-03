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


// Rank 3, batch 103 (2026-10-03): Ki Cutting Sight (the caster's check against the target's DC; on a success PF2e's Effect, its toggle replaced by a
// mark on the target, used up by the first damage roll against it).

test("Ki Cutting Sight: a check that readies marked damage", async () => {
    const plan = compile(await spell("rank-3/ki-cutting-sight"));
    assert.equal(plan.resolution.kind, "check-mark");
    const data = plan.resolution.checkMark;
    assert.deepEqual([data.statistic, data.against, data.option, data.markSlug], ["perception", "fortitude", "ki-cutting-sight", "ki-cutting-sight"]);
    assert.match(data.effect.uuid, /^Compendium\.pf2e\.spell-effects\.Item\.[A-Za-z0-9]+$/);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // Dice that differ from PF2e's Effect aren't read.
    const other = compile(withText(await spell("rank-3/ki-cutting-sight"), html => html.replace("you deal 4d10 additional", "you deal 5d10 additional")));
    assert.notEqual(other.resolution.kind, "check-mark");
});
