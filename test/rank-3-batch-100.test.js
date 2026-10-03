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


// Rank 3, batch 100 (2026-10-03): Mad Monkeys (the caster picks the mischief; the module rolls the Steal or each targeted creature's save and applies
// its row: immunity, Deafened for a round or a minute, the flat-check note for a round or until the spell ends).

test("Mad Monkeys: the three mischiefs", async () => {
    const plan = compile(await spell("rank-3/mad-monkeys"));
    assert.equal(plan.resolution.kind, "mischief-modes");
    const [steal, din, gym] = plan.resolution.mischief.modes;
    assert.deepEqual([steal.kind, steal.minus], ["steal", 10]);
    assert.deepEqual([din.kind, din.statistic, din.immunityMinutes, din.failure.condition, din.failure.unit, din.criticalFailure.unit], ["save", "fortitude", 10, "deafened", "rounds", "minutes"]);
    assert.deepEqual([gym.statistic, gym.failure.unit, gym.criticalFailure.untilSpellEnds], ["reflex", "rounds", true]);
    assert.match(gym.failure.note, /DC 5 flat check/);
    // A row the module doesn't read leaves the spell unread.
    const other = compile(withText(await spell("rank-3/mad-monkeys"), html => html.replace("is Deafened for 1 minute", "is Deafened and Clumsy 1 for 1 minute")));
    assert.notEqual(other.resolution.kind, "mischief-modes");
});
