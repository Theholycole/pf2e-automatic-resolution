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



// Rank 2, batch 40 (2026-10-01): Thundering Dominance, Imitate Fauna (Effect + note proved).

test('Thundering Dominance and Imitate Fauna are proved against PF2e\'s Effects', async () => {
    const {ruleValueAt} = await import('../src/compiler/effect-note-proof.js');
    const {spellNoteTargetLimit} = await import('../scripts/note-effects.js');
    const dominance = compile(await spell('rank-2/thundering-dominance'));
    assert.equal(dominance.automation.level, 'automatic');
    assert.equal(dominance.resolution.effectNote.proof.claims.length, 3);
    const table = 'match(when(btwn(@item.level, 2, 3), 1), when(btwn(@item.level, 4, 5), 2), when(btwn(@item.level, 6, 7), 3), when(gte(@item.level, 8), 4))';
    assert.deepEqual([2, 4, 8, 10].map(rank => ruleValueAt(table, rank)), [1, 2, 4, 4]);
    const fauna = compile(await spell('rank-2/imitate-fauna'));
    assert.deepEqual([fauna.automation.level, fauna.resolution.effectNote.targetTrait], ['automatic', 'animal']);
    assert.equal(spellNoteTargetLimit('1 willing animal', 'You can target up to six willing animals.'), 6);
    // A cap that doesn't match PF2e's table isn't proved.
    const changed = compile(withText(await spell('rank-2/thundering-dominance'), html => html.replace('maximum of a +4', 'maximum of a +5')));
    assert.equal(changed.automation.level, 'guided');
});
