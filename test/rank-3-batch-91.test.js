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


// Rank 3, batch 91 (2026-10-03): Tracking Mayflies (a spell Strike: a ranged Strike's card buttons; the GM's "magical target" button makes the target Off-Guard
// for that Strike; a hit Dazzles it for 1 round; the doubled range and the concealment rules are notes).

test("Tracking Mayflies: a ranged spell Strike with the Off-Guard answer and the hit's Dazzled", async () => {
    const plan = compile(await spell("rank-3/tracking-mayflies"));
    assert.equal(plan.resolution.kind, "spell-strike");
    const strike = plan.resolution.spellStrike;
    assert.deepEqual([strike.form, strike.range, strike.count, strike.hitCondition.slug, strike.hitCondition.rounds], ["mayflies", "ranged", 1, "dazzled", 1]);
    assert.match(strike.offGuardQuestion.question, /magic item/);
    assert.equal(strike.notes.length, 5);
    // Another hit condition, or a melee Strike, isn't read.
    const other = compile(withText(await spell("rank-3/tracking-mayflies"), html => html.replace("for 1 round as", "for 2 rounds as")));
    assert.notEqual(other.resolution.spellStrike?.form, "mayflies");
});
