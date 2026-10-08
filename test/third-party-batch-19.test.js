import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {compileAbility} from '../src/compiler/compile-ability.js';
import {inspectSavePlan} from '../scripts/basic-save-core.js';
import {prepareNoteEffectSource} from '../scripts/note-effects.js';

// Third-party batch 19 (2026-10-06): Dynamic Caustic Blast (each PF2e variant: the Hardness notes, the burst's table with its persistent acid, the splash ring) and
// Dynamic Telekinetic Projectile (the held weapon's range until the turn ends; the attack by each variant's type).
const items = JSON.parse(fs.readFileSync(new URL('../.cache/third-party-items.json', import.meta.url)));
function mergeDeep(target, patch) { for (const [key, value] of Object.entries(patch)) target[key] = value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? mergeDeep(target[key], value) : value; return target; }
const variants = name => { const source = items.find(item => item.type === 'spell' && item.name === name && item.system.description.value);
    return Object.values(source.system.overlays).map(overlay => { const merged = structuredClone(source); merged.system = mergeDeep(merged.system, structuredClone(overlay.system)); delete merged.system.overlays; if (overlay.name) merged.name = overlay.name; return merged; }); };
const compile = source => compileAbility(source, {nativeEffectCatalog: new Map(), referencedSpells: new Map()});

test('Dynamic Caustic Blast: one action — Hardness notes by rank; two and three — the table with persistent acid; the splash ring with no save', () => {
    const [one, two, splash, blast] = variants('Dynamic Caustic Blast').map(compile);
    assert.equal(inspectSavePlan(one).supported, true);
    globalThis.fromUuidSync ??= () => null;
    const note = one.resolution.outcomes.criticalFailure.noteEffects[0];
    assert.match(prepareNoteEffectSource(note, {castId: 'c', sourceActorUuid: 'Actor.a', targetActorUuid: 'Actor.b', sourceItemName: 'x', castRank: 3}).system.description.value, /reduced by 12/);
    assert.equal(one.targeting.actorConstraints.predicates[0].question, 'Does this creature have Hardness?');
    assert.equal(inspectSavePlan(two).supported, true);
    assert.equal(two.resolution.outcomes.criticalFailure.damage.formulas[0].formula, '(floor((@item.rank + 1)/ 2))[persistent,acid]');
    assert.equal(splash.resolution.kind, 'direct-damage');
    assert.equal(splash.resolution.damage.formula, '(2+floor((@item.rank - 1)/2)*2)[splash,acid]');
    assert.equal(inspectSavePlan(blast).supported, true);
    assert.ok(blast.resolution.reminders.some(reminder => /Splash variant/.test(reminder.text)));
});

test('Dynamic Telekinetic Projectile: the weapon\'s range until the turn ends; each type\'s attack', () => {
    const [one, ...attacks] = variants('Dynamic Telekinetic Projectile').map(compile);
    assert.equal(one.resolution.kind, 'stated-effect');
    assert.equal(one.resolution.statedEffect.untilTurnEnd, true);
    assert.equal(one.resolution.statedEffect.rules[1].value, 10);
    for (const plan of attacks) { assert.equal(inspectSavePlan(plan).supported, true); assert.equal(plan.resolution.check.statistic, 'spell-attack'); }
});
