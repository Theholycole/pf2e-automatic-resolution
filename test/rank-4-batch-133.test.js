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


// Rank 4, batch 133 (2026-10-03): Radiant Heart of Devotion (the remastered sides; the sustained emanation around the caster: the good inside hold the
// bonus and the extra dice, the others save at their turn start — Dazzled, or Blinded for the evil).

test("Radiant Heart of Devotion: the radiance", async () => {
    const plan = compile(await spell("rank-4/radiant-heart-of-devotion"));
    assert.equal(plan.resolution.kind, "radiant-heart");
    const data = plan.resolution.radiantHeart;
    assert.deepEqual([data.radius, data.seconds, data.statistic], [20, 60, "will"]);
    assert.deepEqual(data.good, { bonus: 1, type: "status", dice: 1, faces: 6, damageType: "spirit", step: { interval: 2, dice: 1 } });
    assert.deepEqual([data.neutral.name, data.evil.name, data.neutral.rounds], ["Dazzled", "Blinded", 1]);
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-4/radiant-heart-of-devotion"), html => html.replace("an additional 1d6 spirit damage.", "an additional 1d6 spirit damage and they are quickened.")));
    assert.notEqual(other.resolution.kind, "radiant-heart");
});
