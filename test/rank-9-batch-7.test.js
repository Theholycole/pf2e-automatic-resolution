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


// Rank 9, batch 7 (2026-10-05): feature group 3, part 5 — Volcanic Eruption (a card of parts: the column's save with the encasing note, and the heat's
// damage) and Nature's Enmity (the targets' Effect: the Speed penalty and the turn-start animals' attack).
import { inspectIncarnatePlan } from "../scripts/basic-save-core.js";
import { validNoteEffect } from "../scripts/note-effects.js";

test("Volcanic Eruption: the column's save, Encased in rock (Clumsy 1, −10 Speeds, Escape or 50 damage), the heat's spaced rank formula", async () => {
    const plan = compile(await spell("rank-7/volcanic-eruption"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const [column, heat] = plan.resolution.incarnate.phases;
    assert.deepEqual([column.kind, heat.kind, heat.formula], ["save", "damage", "(@item.rank - 4)d6[fire]"]);
    const encased = column.plan.resolution.outcomes.failure.noteEffects.at(-1);
    assert.deepEqual([encased.label, encased.escape, encased.damageLimit, encased.rules.map(r => r.key)], ["Encased in rock", true, 50, ["GrantItem", "FlatModifier"]]);
    assert.equal(column.plan.resolution.outcomes.success.noteEffects?.length ?? 0, 0);
    // (A note ended by damage still needs a positive whole limit.)
    assert.equal(validNoteEffect({ ...encased, damageLimit: 0 }), false);
});

test("Nature's Enmity: up to 5 targets, −10 circumstance Speeds, the DC 8 flat check's attack (2d10 slashing, basic Reflex, Off-Guard)", async () => {
    const plan = compile(await spell("rank-9/natures-enmity"));
    assert.deepEqual(inspectIncarnatePlan(plan), []);
    const [ire] = plan.resolution.incarnate.phases;
    assert.deepEqual([ire.kind, ire.count, ire.rules[0].value, ire.rules[0].type, ire.duration.value, ire.duration.unit], ["effect", 5, -10, "circumstance", 10, "minutes"]);
    assert.deepEqual([ire.turnStartAttack.flat, ire.turnStartAttack.formula, ire.turnStartAttack.type, ire.turnStartAttack.statistic, ire.turnStartAttack.offGuard.rounds], [8, "2d10", "slashing", "reflex", 1]);
});

test("Blessed Boundary's rank formula is spaced so Foundry reads @item.rank (not @item.rank-6)", async () => {
    const plan = compile(await spell("rank-6/blessed-boundary"));
    assert.ok(plan.resolution.incarnate.phases.some(phase => /\(7\+@item\.rank - 6\)d8/.test(phase.plan?.resolution?.sharedDamage?.formula ?? "")));
});
