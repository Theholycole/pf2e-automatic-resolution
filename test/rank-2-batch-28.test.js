import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

import {compileAbility} from '../src/compiler/index.js';

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



// Rank 2, batch 28 (2026-10-01): a spell attack with trait extras, a weapon question and a sunlight dice question (Sun Blade); a two-entry spell
// attack with the caster's healing each time the target takes bleed damage (Draw Blood).

test('Sun Blade: the attack, each trait\'s extra damage, the weapon question and the sunlight upgrade', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const plan = compile(await spell('rank-2/sun-blade'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual(plan.resolution.conditionalDamage.map(entry => [entry.trait, entry.formula]), [['unholy', '(@item.rank - 1)d4[spirit]'], ['undead', '(@item.rank - 1)d4[vitality]']]);
    assert.match(plan.resolution.castGate.question, /wielding a sword or spear/);
    assert.equal(plan.resolution.diceUpgrade.faces, 6);
    const forged = structuredClone(plan); delete forged.compilerEvidence.attackDiceUpgrade;
    assert.equal(inspectSavePlan(forged).supported, false);
    const other = compile(withText(await spell('rank-2/sun-blade'), text => text.replace('from d4 to d6', 'from d4 to d8')));
    assert.equal(other.resolution.diceUpgrade, undefined);
});

test('Draw Blood: piercing and persistent bleed on a hit, and the healing note on the hit rows', async () => {
    const {inspectSavePlan} = await import('../scripts/basic-save-core.js');
    const {validNoteEffect} = await import('../scripts/note-effects.js');
    const plan = compile(await spell('rank-2/draw-blood'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const note = plan.resolution.outcomes.success.noteEffects[0];
    assert.deepEqual([note.triggeredHealing, note.duration.value, note.duration.unit], [{formula: 'max(2,@item.rank)', trigger: 'bleed-damage'}, 1, 'minutes']);
    assert.ok(validNoteEffect(note));
    assert.equal(validNoteEffect({...note, triggeredHealing: {formula: '@actor.level', trigger: 'bleed-damage'}}), false);
    assert.deepEqual(plan.resolution.outcomes.failure.noteEffects ?? [], []);
});
