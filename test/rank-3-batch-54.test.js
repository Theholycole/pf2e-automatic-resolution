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


// Rank 3, batch 54 (2026-10-02): Overwhelming Memory (the text's Will save; the caster picks the memory on the card: its condition — or a note
// Effect for "can't use reactions" — on the success, failure and critical-failure rows until the start of the caster's next turn; Stupefied 2/3
// for the spell's duration on the failure rows).

test("Overwhelming Memory: the caster's memory on the affected rows", async () => {
    const plan = compile(await spell("rank-3/overwhelming-memory"));
    assert.deepEqual(plan.resolution.check, { statistic: "will", basic: false, dcSource: "source-actor" });
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    assert.deepEqual(inspectSavePlan(plan).blockers, []);
    assert.deepEqual(plan.resolution.casterChoice.values, ["gleeful", "romantic", "terrifying", "tragic"]);
    assert.deepEqual(plan.resolution.casterChoice.rows, ["success", "failure", "criticalFailure"]);
    const tagged = degree => (plan.resolution.outcomes[degree].effects ?? []).filter(e => e.option).map(e => [e.option, e.slug, e.value ?? null, e.duration.anchor]);
    assert.deepEqual(tagged("success"), [["romantic", "fascinated", null, "source-turn"], ["terrifying", "frightened", 1, "source-turn"], ["tragic", "dazzled", null, "source-turn"]]);
    assert.deepEqual(tagged("criticalSuccess"), []);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects.map(n => [n.option, n.label]), [["gleeful", "Can't use reactions"]]);
    const own = degree => (plan.resolution.outcomes[degree].effects ?? []).filter(e => !e.option).map(e => [e.slug, e.value, e.duration.mode]);
    assert.deepEqual(own("success"), []);
    assert.deepEqual(own("failure"), [["stupefied", 2, "sustained"]]);
    assert.deepEqual(own("criticalFailure"), [["stupefied", 3, "sustained"]]);
    // A row tagged with only some options isn't executable.
    const broken = structuredClone(plan);
    broken.resolution.outcomes.failure.effects = broken.resolution.outcomes.failure.effects.filter(e => e.option !== "tragic");
    assert.notDeepEqual(inspectSavePlan(broken).blockers, []);
    // An option holding two conditions isn't read.
    const two = compile(withText(await spell("rank-3/overwhelming-memory"), html => html.replace("They can't use reactions.", "They are @UUID[Compendium.pf2e.conditionitems.Item.TkIyaNPgTZFBCCuh]{Dazzled} and @UUID[Compendium.pf2e.conditionitems.Item.AdPVz7rbaVSRxHFg]{Fascinated}.")));
    assert.equal(two.resolution.casterChoice, undefined);
});
