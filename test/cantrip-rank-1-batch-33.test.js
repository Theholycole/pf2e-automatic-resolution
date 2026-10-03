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

test('Benediction: optional aura growth on Sustain, proved by the Aura radius and badge, and a counteract reminder', async () => {
    const plan = compile(await spell('rank-1/benediction'));
    assert.equal(plan.resolution.kind, 'effect');
    assert.equal(plan.automation.level, 'automatic');
    assert.deepEqual(plan.resolution.sustainGrowth, {feet: 10, maximum: 105, badgeMax: 10, optional: true,
        sourceText: "Once per round on subsequent turns, you can Sustain the spell to increase the emanation's radius by 10 feet."});
    assert.equal(plan.lifecycle.durationSpec.mode, 'fixed');
    assert.match(plan.resolution.gmNotes[0], /^Benediction can counteract malediction/);
});

test('optional growth and counteract reminders: kept strict', async () => {
    const source = await spell('rank-1/benediction');
    // A step the Aura doesn't have, or a first radius other than the spell's emanation, stays blocked.
    assert.notEqual(compile(withText(source, text => text.replace('radius by 10 feet', 'radius by 5 feet'))).resolution.kind, 'effect');
    const wider = structuredClone(source); wider.system.area.value = 20;
    assert.notEqual(compile(wider).resolution.kind, 'effect');
    // Counteracting named by another spell's name isn't this spell's reminder.
    assert.notEqual(compile(withText(source, text => text.replace('Benediction can counteract', 'Bless can counteract'))).resolution.kind, 'effect');
});
