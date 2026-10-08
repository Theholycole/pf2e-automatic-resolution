import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {fitGripVariant} from '../src/compiler/glyph-versions.js';
import {inspectSavePlan, isExecutableStoredTriggerPlan, isTriggeredDamage} from '../scripts/basic-save-core.js';
import {validNoteEffect} from '../scripts/note-effects.js';

// Third-party batch 5 (2026-10-06): spell attacks from the text (Staff Striker's grips, Dynamic Divine Lance), Needle of Vengeance+ (a held trigger with a
// critical failure's condition), Old-Mage's Echo (damage by the cast spell's rank), Silence of the Archmage (a flat check on casting), Lurking Doom (the save
// again on each Sustain).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
const spell = name => structuredClone(items.find(item => item.type === 'spell' && item.name === name && item.system.description.value));
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});
function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; }
const variants = name => { const source = spell(name);
    return Object.values(source.system.overlays).map(overlay => { const merged = structuredClone(source); merged.system = mergeDeep(merged.system, structuredClone(overlay.system)); delete merged.system.overlays; return merged; }); };

test("Staff Striker: each grip's variant its own die; the critical hit's optional push away", () => {
    for (const source of variants('Staff Striker')) {
        const plan = compile(source);
        assert.equal(inspectSavePlan(plan).supported, true);
        assert.equal(plan.resolution.check.statistic, 'spell-attack');
        assert.deepEqual(plan.resolution.outcomes.criticalSuccess.forcedMovement, {kind: 'push', distance: 5, upTo: true, optional: true, direction: 'away'});
        const fitted = fitGripVariant(source);
        assert.match(fitted.system.description.value, fitted.flags['pf2e-automatic-resolution'].grip === 'two-hands' ? /you deal 1d8 bludgeoning damage/ : /you deal 1d6 bludgeoning damage/);
    }
});

test("Dynamic Divine Lance: the two- and three-action attacks (Dazzled on the three-action critical hit)", () => {
    const [, two, three] = variants('Dynamic Divine Lance').sort((a, b) => a.system.time.value.localeCompare(b.system.time.value)).map(compile);
    assert.equal(inspectSavePlan(two).supported, true);
    assert.equal(inspectSavePlan(three).supported, true);
    assert.deepEqual(three.resolution.outcomes.criticalSuccess.effects.map(effect => effect.slug), ['dazzled']);
});

test('Needle of Vengeance+: a held trigger; the critical failure Enfeebled 1 for the spell (attached to it)', () => {
    const plan = compile(spell('Needle of Vengeance+'));
    assert.equal(isExecutableStoredTriggerPlan(plan), true);
    assert.equal(plan.resolution.storedTrigger.attachConditions, true);
    const enfeebled = plan.resolution.outcomes.criticalFailure.effects.find(effect => effect.slug === 'enfeebled');
    assert.deepEqual([enfeebled.value, enfeebled.duration.value, enfeebled.duration.unit], [1, 1, 'minutes']);
});

test("Old-Mage's Echo: twice the cast spell's rank, once or each time; Deafened each time on a critical failure", () => {
    const plan = compile(spell("Old-Mage's Echo"));
    assert.equal(inspectSavePlan(plan).supported, true);
    const triggers = ['success', 'failure', 'criticalFailure'].map(degree => plan.resolution.outcomes[degree].noteEffects[0].triggeredDamage);
    assert.deepEqual(triggers.map(trigger => trigger.frequency), ['once', 'each', 'each']);
    assert.ok(triggers.every(isTriggeredDamage));
    assert.equal(triggers[2].timedCondition.slug, 'deafened');
    assert.equal(plan.resolution.outcomes.criticalFailure.effects.length, 0);
});

test("Silence of the Archmage: Stupefied held by the note, the spell penalties and the casting flat check", () => {
    const plan = compile(spell('Silence of The Archmage'));
    assert.equal(inspectSavePlan(plan).supported, true);
    const note = plan.resolution.outcomes.criticalFailure.noteEffects[0];
    assert.deepEqual(note.castFlatCheck, {dc: 11});
    assert.deepEqual(note.rules.map(rule => rule.selector ?? rule.key), ['GrantItem', 'spell-attack-roll', 'spell-dc']);
    assert.ok(validNoteEffect(note));
});

test('Lurking Doom: the save again on each Sustain, ending on a critical success; the concentrate flat check', () => {
    const plan = compile(spell('Lurking Doom'));
    assert.equal(inspectSavePlan(plan).supported, true);
    assert.deepEqual([plan.resolution.repeatable.window, plan.resolution.repeatable.save, plan.resolution.repeatable.attacks], ['sustain', true, 11]);
    assert.equal(plan.resolution.outcomes.criticalSuccess.endsRepeat, true);
    assert.deepEqual(plan.resolution.outcomes.criticalFailure.noteEffects[0].castFlatCheck, {dc: 5, trait: 'concentrate'});
});
