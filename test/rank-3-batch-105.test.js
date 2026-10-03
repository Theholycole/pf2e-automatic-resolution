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
const withText = (source, replace) => { const copy = structuredClone(source); copy.system.description.value = replace(copy.system.description.value); return copy; };

const supported = plan => inspectSavePlan(plan).supported;


// Rank 3, batch 105 (2026-10-03): Consecrate Flesh (PF2e's Effect — weakness, unarmed spirit — is the retaliation's marker, with the text's healing
// dice on the caster's spell healing; Retaliate deals the item's damage to whoever touches the caster).

test("Consecrate Flesh: the holy body", async () => {
    const plan = compile(await spell("rank-3/consecrate-flesh"));
    assert.equal(plan.resolution.kind, "retaliation");
    const data = plan.resolution.retaliation;
    assert.equal(data.triggers[0].damage.formula, "1d6");
    assert.equal(data.triggers[0].damage.type, "spirit");
    assert.deepEqual(data.ruleAdditions, [{ key: "DamageDice", selector: "spell-healing", diceNumber: "max(1,floor(@item.level/3))", dieSize: "d4", label: data.effect.label, predicate: ["item:type:spell"] }]);
    assert.deepEqual(plan.automation.pendingCapabilities, []);
    // A weakness PF2e's Effect doesn't give isn't read.
    const other = compile(withText(await spell("rank-3/consecrate-flesh"), html => html.replace("weakness 5 to unholy", "weakness 10 to unholy")));
    assert.notEqual(other.automation.pendingCapabilities.length, 0);
});
