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


// Rank 4, batch 21 (2026-10-02): Commanding Lash (Command's effect borrowed: its rows; the −2 save question; 1-hour immunity; "until the end of
// your target's next turn") and Electrified Crystal Ward (rank 3: a note placing PF2e's Electric Latch Rune hazard, its damage at the rank).

test('Commanding Lash: Command\'s rows, the save question and the immunity', async () => {
    const command = await spell('rank-1/command');
    const plan = compileAbility(await spell('rank-4/commanding-lash'), {nativeEffectCatalog: effects, referencedSpells: new Map([[`Compendium.pf2e.spells-srd.Item.${command._id}`, command]])});
    assert.equal(supported(plan), true);
    assert.deepEqual(plan.resolution.temporaryImmunity.duration, {value: 1, unit: 'hours'});
    assert.match(plan.resolution.attackAdjustment.question, /Frightened, Stupefied, or taking persistent damage/);
    assert.ok(plan.resolution.outcomes.criticalFailure.noteEffects.length);
    // Without the referenced spell it isn't read.
    assert.equal(supported(compile(await spell('rank-4/commanding-lash'))), false);
});

test('Electrified Crystal Ward: a note with the hazard\'s damage', async () => {
    const plan = compile(await spell('rank-3/electrified-crystal-ward'));
    assert.equal(plan.resolution.kind, 'spell-note');
    assert.match(plan.resolution.note.text, /hazard's damage: 3d12 electricity/);
});
