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



// Rank 3, batch 13 (2026-10-02): proved Effect + note spells (Battlefield Persistence, Tempest Cloak, Repel Metal).

test('Battlefield Persistence, Tempest Cloak, Repel Metal: proved against PF2e\'s Effects', async () => {
    const proof = source => { const plan = compile(source); return [plan.resolution.kind, plan.automation.level, plan.resolution.effectNote?.proof]; };
    const [bp, tc, rm] = [await proof(await spell('rank-3/battlefield-persistence')), await proof(await spell('rank-3/tempest-cloak')), await proof(await spell('rank-4/repel-metal'))];
    assert.deepEqual([bp[0], bp[1], bp[2].endsAfterSave, bp[2].notes.length], ['effect-note', 'automatic', true, 1]);
    assert.deepEqual([tc[1], tc[2].claims.length, tc[2].notes.length], ['automatic', 3, 1]);
    assert.deepEqual([rm[1], rm[2].endsAfterAttack, rm[2].immunity], ['automatic', true, {value: 10, unit: 'minutes'}]);
});

test('a changed bonus is not proved', async () => {
    const source = await spell('rank-3/tempest-cloak');
    const plan = compile(withText(source, html => { assert.ok(html.includes('+2 circumstance bonus to its AC')); return html.replace('+2 circumstance bonus to its AC', '+3 circumstance bonus to its AC'); }));
    assert.equal(plan.resolution.effectNote?.proof, undefined);
});
