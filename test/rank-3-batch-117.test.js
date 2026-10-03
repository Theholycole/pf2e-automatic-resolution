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


// Rank 3, batch 117 (2026-10-03): Circle of Protection (an aura around the touched creature for every creature inside: toggled +1 against the chosen
// alignment, +3 against its controlling effects and summoned attackers — distinct slugs; an hour from 4th; the summoned creatures' Will save a note).

test("Circle of Protection: the toggled bonuses for everyone inside", async () => {
    const plan = compile(await spell("rank-3/circle-of-protection"));
    assert.equal(plan.resolution.kind, "protection-circle");
    const data = plan.resolution.protectionCircle;
    assert.deepEqual([data.radius, data.seconds, data.heightened.rank, data.heightened.seconds, data.low, data.high], [10, 60, 4, 3600, 1, 3]);
    assert.deepEqual(data.choices, ["chaotic", "evil", "good", "lawful"]);
    const { circleMember } = await import("../src/compiler/protection-circle.js");
    const member = circleMember(data, "evil");
    const slugs = member.rules.filter(rule => rule.key === "FlatModifier").map(rule => rule.slug);
    assert.equal(new Set(slugs).size, 2);
    // A different bonus isn't read.
    const other = compile(withText(await spell("rank-3/circle-of-protection"), html => html.replace("increases to +3", "increases to +4 and more")));
    assert.notEqual(other.resolution.kind, "protection-circle");
});
