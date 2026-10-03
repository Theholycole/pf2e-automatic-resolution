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


// Rank 5, batch 74 (2026-10-03): Forceful Hand (the hand's statistics by rank; the end-of-turn entries' cover; the replacements Swat, Grasp, Punch, Crush and
// Crush's Constrict plan).

test("Forceful Hand: the hand", async () => {
    const plan = compile(await spell("rank-5/forceful-hand"));
    assert.equal(plan.resolution.kind, "force-hand");
    const data = plan.resolution.forceHand;
    assert.deepEqual(data.ranks.map(entry => [entry.rank, entry.ac, entry.hp, entry.size]), [[5, 25, 50, "med"], [6, 27, 60, "med"], [7, 30, 70, "lg"], [8, 32, 80, "lg"], [9, 35, 90, "lg"]]);
    assert.deepEqual(data.modes.map(mode => [mode.key, mode.cover, mode.bonus, mode.selectors.join()]), [["manipulate-attack", "lesser", 1, "ac"], ["move", "standard", 2, "ac,reflex,stealth"], ["concentrate", "greater", 4, "ac,reflex,stealth"]]);
    assert.deepEqual(Object.values(data.replacements).map(entry => [entry.key, entry.kind]), [["swat", "push"], ["grasp", "grapple"], ["punch", "strike"], ["crush", "crush"]]);
    assert.equal(data.replacements.crush.constrictPlan.resolution.sharedDamage.formula, "6d8[force]");
    assert.ok(supported(data.replacements.crush.constrictPlan));
    // An unrecognised clause isn't read.
    const other = compile(withText(await spell("rank-5/forceful-hand"), html => html.replace("can't recover HP by any means.", "can't recover HP by any means and is invisible.")));
    assert.notEqual(other.resolution.kind, "force-hand");
});
