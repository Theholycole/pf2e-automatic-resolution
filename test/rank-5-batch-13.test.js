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


// Rank 5, batch 13 (2026-10-02): Toxic Cloud and Incendiary Fog ("functions as Mist" on a basic-save cloud: Mist's concealment; Toxic Cloud's
// start-of-turn damage to breathing creatures and its drift; Incendiary Fog's ignition, the GM's control, after which the spell ends).

test('Toxic Cloud and Incendiary Fog: Mist\'s concealment, the turn damage and the ignition', async () => {
    const mist = await spell('rank-2/mist');
    const refs = new Map([[`Compendium.pf2e.spells-srd.Item.${mist._id}`, mist]]);
    const toxic = compileAbility(await spell('rank-5/toxic-cloud'), {nativeEffectCatalog: effects, referencedSpells: refs});
    assert.equal(toxic.automation.level, 'automatic');
    assert.equal(toxic.resolution.lingering.concealment, true);
    assert.deepEqual(toxic.resolution.lingering.events, ['turn-start']);
    assert.equal(toxic.resolution.lingering.notes.length, 2);
    const fog = compileAbility(await spell('rank-5/incendiary-fog'), {nativeEffectCatalog: effects, referencedSpells: refs});
    assert.equal(fog.automation.level, 'automatic');
    assert.deepEqual(fog.resolution.lingering.events, []);
    assert.equal(fog.resolution.lingering.gmAction.endsSpell, true);
    // Without the referenced spell neither is read.
    assert.notEqual(compile(await spell('rank-5/toxic-cloud')).automation.level, 'automatic');
    assert.notEqual(compile(await spell('rank-5/incendiary-fog')).automation.level, 'automatic');
});
