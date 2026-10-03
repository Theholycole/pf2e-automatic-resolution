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



// Rank 2, batch 42 (2026-10-01): Vision of Weakness, Spirit Sense.

test('Vision of Weakness: the mark and its modifiers, a reveal, a temporary immunity; Spirit Sense: the added toggle', async () => {
    const vision = compile(await spell('rank-2/vision-of-weakness'));
    assert.equal(vision.automation.level, 'automatic');
    const {proof, recipient, subject} = vision.resolution.effectNote;
    assert.deepEqual([recipient, subject, proof.reveal, proof.immunity], ['source', 'target', 'weaknesses-and-lowest-save', {value: 1, unit: 'days'}]);
    assert.deepEqual(proof.claims.find(claim => claim.rules?.length === 3).rules.sort(), [0, 1, 2]);
    const spirit = compile(await spell('rank-2/spirit-sense'));
    assert.equal(spirit.automation.level, 'automatic');
    assert.deepEqual(spirit.resolution.effectNote.proof.ruleAdditions, [{key: 'RollOption', domain: 'all', option: 'spirit-sense', toggleable: true, label: 'Checks regarding haunts or spirits'}]);
    // A changed bonus isn't proved.
    assert.equal(compile(withText(await spell('rank-2/vision-of-weakness'), html => html.replace('+2 status bonus', '+3 status bonus'))).automation.level, 'guided');
});
