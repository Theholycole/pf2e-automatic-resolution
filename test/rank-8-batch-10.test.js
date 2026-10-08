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

const supported = plan => inspectSavePlan(plan).supported;


// Rank 8, batch 10 (2026-10-04): the GM-handled spells (user ruling) and the world-scale ones' GM options.
import { isExecutableSavePlan as gmSaveReady } from "../scripts/basic-save-core.js";
import { GM_HANDLED } from "../src/compiler/user-rulings.js";

const GROUP_SIX = ["rank-8/earthquake", "rank-9/upheaval", "rank-7/restore-ground", "rank-9/trim-the-blight", "rank-7/call-of-the-quenching", "rank-9/under-sunless-skies",
    "rank-10/veil-of-broken-reality", "rank-9/astral-labyrinth", "rank-10/theogeny", "rank-8/shipwreck"];
const GROUP_TWELVE = ["rank-6/scrying", "rank-8/unrelenting-observation", "rank-9/forest-of-gates", "rank-6/hags-fruit", "rank-6/temporal-ward", "rank-6/aura-of-the-unremarkable"];

test("GM-handled (user ruling 2026-10-04): the sixteen world-scale and information/travel/ward spells are GM notes whispered to the GM", async () => {
    // (The 2026-10-04 ruling's sixteen; the third-party ones of the same kinds carry their own ruling date, 2026-10-06.)
    assert.equal(Object.values(GM_HANDLED).filter(entry => !entry.ruling).length, 16);
    for (const path of [...GROUP_SIX, ...GROUP_TWELVE]) {
        const plan = compile(await spell(path));
        assert.equal(plan.resolution.kind, "spell-note", path);
        assert.ok(plan.resolution.note.gmHandled, path);
    }
});

test("GM options: each world-scale spell that can affect creatures offers them (a save option compiles to an executable save); Shipwreck has none", async () => {
    const expected = { "rank-8/earthquake": ["shaking-ground", "fissures", "collapse"], "rank-9/upheaval": ["collapse"], "rank-9/trim-the-blight": ["blighted"],
        "rank-7/call-of-the-quenching": ["allies", "enemy-turn"], "rank-9/under-sunless-skies": ["allies", "enemies"], "rank-10/veil-of-broken-reality": ["save"],
        "rank-9/astral-labyrinth": ["save"], "rank-10/theogeny": ["allies-holy", "foes-holy", "allies-unholy", "foes-unholy"], "rank-8/shipwreck": [] };
    for (const [path, keys] of Object.entries(expected)) {
        const options = compile(await spell(path)).resolution.note.gmHandled.options;
        assert.deepEqual(options.map(option => option.key), keys, path);
        for (const option of options.filter(option => option.kind === "save")) assert.equal(gmSaveReady(option.plan), true, `${path} ${option.key}`);
    }
});
