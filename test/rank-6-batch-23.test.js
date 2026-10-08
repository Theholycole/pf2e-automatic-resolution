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


// Rank 6, batch 23 (2026-10-05): feature group 5, part 4 — forms PF2e has no Effect for (generated-forms.js): Blanket of Stars and Mantle of
// Heaven's Slopes.

test("Blanket of Stars: the module's Effect (+2 to Hide and Sneak, the night-sky toggle's Invisible and Concealed) and the gaze's Will save on a creature ending its turn adjacent", async () => {
    const plan = compile(await spell("rank-6/blanket-of-stars"));
    assert.equal(plan.resolution.kind, "generated-form");
    assert.equal(plan.automation.level, "automatic");
    const form = plan.resolution.generatedForm;
    assert.equal(form.seconds, 600);
    assert.deepEqual(form.rules[0], { key: "FlatModifier", selector: "stealth", type: "status", value: 2, predicate: [{ or: ["action:hide", "action:sneak"] }] });
    assert.deepEqual(form.toggleGrants.map(grant => [grant.selection, grant.name]), [["still", "Invisible"], ["moving", "Concealed"]]);
    const gaze = plan.resolution.formRiders.auras[0];
    assert.deepEqual([gaze.radius, gaze.events, gaze.save.statistic, gaze.save.traits], [5, ["turn-end"], "will", ["mental", "visual"]]);
    assert.deepEqual(gaze.save.rows.criticalFailure.conditions.map(entry => entry.slug), ["confused", "dazzled"]);
    assert.equal(gaze.save.rows.failure.expiry, "turn-end");
    // A row the reader doesn't know isn't read.
    const changed = compile(withText(await spell("rank-6/blanket-of-stars"), html => html.replace("until the end of its next turn.</p>\n<p><strong>Critical", "for 1 minute.</p>\n<p><strong>Critical")));
    assert.notEqual(changed.resolution.kind, "generated-form");
});

test("Mantle of Heaven's Slopes: two option slots on the module's Effect, each option's rules behind either slot; the notes for what no rule states", async () => {
    const plan = compile(await spell("rank-6/mantle-of-heavens-slopes"));
    assert.equal(plan.resolution.kind, "generated-form");
    const rules = plan.resolution.generatedForm.rules;
    const slots = rules.filter(rule => rule.key === "RollOption");
    assert.deepEqual(slots.map(rule => rule.option), ["mantle-of-heavens-slopes-first", "mantle-of-heavens-slopes-second"]);
    assert.deepEqual(slots[0].suboptions.map(option => option.value), ["thresholds-walls", "proeleras-arsenal", "clarions-sanctity", "requiuss-rest", "illumiss-parlance", "iuidicas-verdict"]);
    const strike = rules.find(rule => rule.key === "Strike");
    assert.deepEqual([strike.slug, strike.group, strike.traits, strike.damage.base], ["arsenal", "polearm", ["unarmed", "reach", "shove"], { damageType: "piercing", dice: 1, die: "d10" }]);
    assert.equal(rules.find(rule => rule.key === "FastHealing").value, 2);
    assert.ok(plan.resolution.gmNotes.some(note => /silver/.test(note)) && plan.resolution.gmNotes.some(note => /Shove/.test(note)) && plan.resolution.gmNotes.some(note => /200 feet/.test(note)));
});
