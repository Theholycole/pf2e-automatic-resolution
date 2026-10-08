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



const proved = source => { const plan = compile(source); return plan.resolution.kind === 'effect-note' && plan.automation.level === 'automatic' ? plan : null; };

// Rank 4, batch 8 (2026-10-02): Shroud of the Mantis, Life Connection, Divine Dragon's Watch.

test('Shroud of the Mantis: the caster Invisible with Invisibility\'s restrictions (10 minutes from 6th, 1 hour from 8th)', async () => {
    const plan = compile(await spell('rank-4/shroud-of-the-mantis'));
    assert.deepEqual([plan.resolution.kind, plan.resolution.conditionNote.recipient, plan.resolution.conditionNote.condition.slug, plan.resolution.conditionNote.heightenedDurations.length], ['condition-note', 'source', 'invisible', 2]);
});

test('Life Connection and Divine Dragon\'s Watch: PF2e\'s Effect grants the caster the reaction; its dice grow with the rank', async () => {
    const life = proved(await spell('rank-3/life-connection'));
    assert.ok(life);
    assert.equal(life.resolution.effectNote.recipient, 'source');
    assert.ok(life.resolution.effectNote.proof.notes.some(note => /Once you use Defend Life, the spell ends/.test(note)));
    const watch = proved(await spell('rank-5/divine-dragons-watch'));
    assert.ok(watch);
    // A step the Effect's dice don't follow is refused.
    assert.equal(proved(withText(await spell('rank-5/divine-dragons-watch'), html => html.replace('increases by 1d4', 'increases by 2d4'))), null);
});
