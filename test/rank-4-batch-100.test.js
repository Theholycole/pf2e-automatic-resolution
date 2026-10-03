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


// Rank 4, batch 100 (2026-10-03): Shaken Confidence (the caster names the triggering roll on the card; a failing row's note rolls the next such roll twice,
// keeping the lower, removed after that roll or at the end of the target's next turn; an enemy only).

test("Shaken Confidence: the named roll's misfortune note, once", async () => {
    const { validRowNoteRule } = await import("../scripts/note-effects.js");
    const plan = compile(await spell("rank-4/shaken-confidence"));
    assert.equal(supported(plan), true);
    const choice = plan.resolution.casterChoice;
    assert.deepEqual([choice.kind, choice.rows, choice.values.length, choice.values.slice(0, 3)], ["option", ["failure", "criticalFailure"], 18, ["attack roll", "perception", "acrobatics"]]);
    for (const degree of ["failure", "criticalFailure"]) {
        const notes = plan.resolution.outcomes[degree].noteEffects.filter(note => note.choiceGroup === "caster-option");
        assert.equal(notes.length, 18);
        assert.deepEqual(notes.find(note => note.option === "attack roll").rules, [{ key: "RollTwice", selector: "attack-roll", keep: "lower", removeAfterRoll: true }]);
        assert.deepEqual([notes[0].duration.expiry, notes[0].duration.anchor, notes[0].duration.value], ["turn-end", "target-turn", 1]);
    }
    assert.equal((plan.resolution.outcomes.success.noteEffects ?? []).length, 0);
    assert.deepEqual(plan.targeting.actorConstraints.predicates, [{ kind: "enemy-of-caster" }]);
    assert.equal(validRowNoteRule({ key: "RollTwice", selector: "athletics", keep: "lower", removeAfterRoll: true }), true);
    assert.equal(validRowNoteRule({ key: "RollTwice", selector: "fortitude", keep: "lower", removeAfterRoll: true }), false);
    // Another trigger, or a row that isn't the next roll's misfortune, isn't read.
    const other = compile(withText(await spell("rank-4/shaken-confidence"), html => html.replace("critically fails an attack roll", "fails an attack roll")));
    assert.equal(other.compilerEvidence.misfortuneRows, undefined);
    assert.equal(supported(other), false);
});
