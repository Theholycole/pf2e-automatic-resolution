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


// Rank 6, batch 10 (2026-10-03): Chromatic Image, Personal Ocean, Cryostasis.

test("Chromatic Image: Mirror Image's images (its own compiled text) with the 1d4 colors' damage and condition for the attacker", async () => {
    const mirror = await spell("rank-2/mirror-image"), chromatic = await spell("rank-6/chromatic-image");
    const plan = compileAbility(chromatic, { nativeEffectCatalog: effects, referencedSpells: new Map([[`Compendium.pf2e.spells-srd.Item.${mirror._id}`, mirror]]) });
    assert.equal(plan.resolution.kind, "image-decoys");
    const { images, colors } = plan.resolution.imageDecoys;
    assert.deepEqual([images, colors.die, colors.rows.map(row => row.label), colors.rows[3].condition.slug], [3, 4, ["Red", "Orange", "Yellow", "Green"], "frightened"]);
    assert.deepEqual(colors.rows[0].damage, ["5[fire]", "5[mental]"]);
    assert.notEqual(compile(chromatic).resolution.kind, "image-decoys", "without the referenced spell it isn't read");
});

test("Personal Ocean: the caster's 1-minute note with the fire counteract; Cryostasis: a dying target's 1-hour note, unlimited from 8th", async () => {
    const ocean = compile(await spell("rank-6/personal-ocean"));
    assert.deepEqual([ocean.resolution.kind, ocean.resolution.note.recipient, ocean.resolution.note.heightenedCounteract[0].target], ["spell-note", "source", "magical fires you move through"]);
    const cryo = compile(await spell("rank-6/cryostasis"));
    assert.deepEqual([cryo.resolution.kind, cryo.resolution.note.recipient, cryo.targeting.actorConstraints.predicates[0].slug, cryo.resolution.note.heightenedDurations[0].mode], ["spell-note", "target", "dying", "unlimited"]);
});
