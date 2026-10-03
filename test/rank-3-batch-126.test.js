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


// Rank 3, batch 126 (2026-10-03): thralls as tokens by the thrall rules (the user's) — Create Thrall, Bloody Tendrils, Bind Heroic Spirit, Zombie Horde's notes.

test("Create Thrall: two thralls, or one and its Command", async () => {
    const create = compile(await spell("cantrip/create-thrall"));
    assert.equal(create.resolution.kind, "thrall-create");
    assert.deepEqual(create.resolution.thrallCreate, { range: 30, seconds: 60, options: [{ key: "many", count: 2, command: false }, { key: "command", count: 1, command: true }] });
    const other = compile(withText(await spell("cantrip/create-thrall"), html => html.replace("create 2 thralls", "create 2 thralls with 10 Hit Points")));
    assert.notEqual(other.resolution.kind, "thrall-create");
});

test("Bloody Tendrils: its tendrils are thralls the area makes", async () => {
    const tendrils = compile(await spell("rank-3/bloody-tendrils"));
    assert.deepEqual(tendrils.resolution.lingering.thrallTokens, { size: "med", speed: 0, immunities: ["physical"], reach: 10 });
    assert.equal(tendrils.resolution.lingering.maxTargets.count, 3);
});

test("Bind Heroic Spirit: the bound thrall removed, a thrall on each critical hit", async () => {
    const bind = compile(await spell("rank-3/bind-heroic-spirit"));
    assert.equal(bind.resolution.thrallBound, true);
    assert.equal(bind.resolution.thrallOnCrit.count, 1);
    // A spell without the sentence gets neither.
    const other = compile(withText(await spell("rank-3/bind-heroic-spirit"), html => html.replace(/Additionally, whenever you critically hit[^.]+\./, "")));
    assert.equal(other.resolution.thrallOnCrit, undefined);
});

test("Zombie Horde: the thrall-growth note names the module's thrall tokens", async () => {
    const horde = compile(await spell("rank-3/zombie-horde"));
    assert.ok(horde.resolution.lingering.notes.some(note => /module thrall token/.test(note)));
});
