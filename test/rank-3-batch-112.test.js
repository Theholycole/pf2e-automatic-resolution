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


// Rank 3, batch 112 (2026-10-03): Wall of Wind (a lingering line the GM places, difficult terrain for walking; a creature flying into it saves; the rows'
// movement GM notes, the critical failure's 10-foot push the card's; the wall's other effects a reminder).

test("Wall of Wind: the line, the flyer's save and the push", async () => {
    const plan = compile(await spell("rank-3/wall-of-wind"));
    const lingering = plan.resolution.lingering;
    assert.deepEqual([lingering.area.type, lingering.area.value, lingering.events.join(), lingering.terrain.movement.join()], ["line", 60, "enter", "walk"]);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.forcedMovement, { kind: "push", distance: 10, upTo: false, optional: false, direction: "any", sourceText: "As failure, and the creature is pushed 10 feet away from the wall." });
    for (const degree of ["success", "failure", "criticalFailure"]) assert.equal(plan.resolution.outcomes[degree].noteEffects.at(-1).label, "Wall of wind");
    assert.match(plan.resolution.reminders.at(-1).text, /−2 circumstance penalty/);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // A different push isn't read.
    const other = compile(withText(await spell("rank-3/wall-of-wind"), html => html.replace("pushed 10 feet", "pushed 20 feet up")));
    assert.notEqual(other.resolution.outcomes?.criticalFailure?.forcedMovement?.distance, 10);
});
