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


// Rank 8, batch 11 (2026-10-04): incarnates by parts (feature group 1) — the nineteen rank 6–10 incarnates and named summons the narrower readers
// don't take, each manifestation's Arrive and Depart read into parts: saves (with riders, explicit rows, clouds, repeats, alternatives, a tradition's
// damage type), spell attacks, no-save damage and healing, generated Effects (a d20 limit, a fortune, granted conditions), PF2e's linked Effects,
// conditions reduced, a spell the manifestation casts, and a concealing cloud.
import { inspectIncarnatePlan } from "../scripts/basic-save-core.js";
import { readdirSync, readFileSync } from "node:fs";

const spellsRoot = new URL('spells/spells/', base);
const referencedSpells = new Map();
for (const rank of readdirSync(spellsRoot)) for (const file of readdirSync(new URL(`${rank}/`, spellsRoot))) {
    const source = JSON.parse(readFileSync(new URL(`${rank}/${file}`, spellsRoot), 'utf8'));
    if (source._id) referencedSpells.set(`Compendium.pf2e.spells-srd.Item.${source._id}`, source);
}
const compileRef = source => compileAbility(source, {nativeEffectCatalog: effects, referencedSpells});
const INCARNATES = ["rank-10/garden-of-the-green-mans-growth", "rank-10/summon-oliphaunt-of-jandelay", "rank-10/conquering-soldiers", "rank-10/incarnate-kaiju", "rank-10/jassims-allegiance",
    "rank-6/incarnate-wild-rose", "rank-7/final-fate-of-the-locust-host", "rank-7/incarnate-ancient-specter", "rank-8/incarnate-archmage", "rank-8/incarnate-deific-herald", "rank-8/holy-host",
    "rank-8/summon-elemental-herald", "rank-8/summon-warden-of-the-wild", "rank-8/unholy-army", "rank-9/beseech-arcanotheign", "rank-8/summon-irii", "rank-9/call-fluxwraith",
    "rank-9/incarnate-draconic-legion", "rank-9/summon-ancient-fleshforged"];
const partsOf = (plan, choice = null) => choice ? plan.resolution.incarnate.options.choices.find(entry => entry.key === choice || entry.label.startsWith(choice)).phases : plan.resolution.incarnate.phases;
const part = (plan, key, choice = null) => partsOf(plan, choice).find(entry => entry.key === key);
const effectsAt = (entry, degree) => (entry.plan.resolution.outcomes[degree].effects ?? []).map(effect => `${effect.slug}${effect.value ?? ""}`);

test("Incarnates by parts: all nineteen compile, every part checked as the runtime carries it out", async () => {
    for (const path of INCARNATES) {
        const plan = compileRef(await spell(path));
        assert.equal(plan.resolution?.kind, "incarnate", path);
        assert.deepEqual(inspectIncarnatePlan(plan), [], path);
    }
});

test("Incarnates by parts: no-save damage, healing, the turn-start squeeze and the d20 limits", async () => {
    const garden = compileRef(await spell("rank-10/garden-of-the-green-mans-growth"));
    const vines = part(garden, "depart");
    assert.deepEqual(effectsAt(vines, "failure"), ["grabbed"]);
    assert.deepEqual(vines.plan.resolution.outcomes.criticalFailure.noteEffects.map(note => [note.whileCondition, note.turnStartDamage]), [["restrained", {formula: "4d6", type: "bludgeoning"}]]);
    const archmage = compileRef(await spell("rank-8/incarnate-archmage"));
    assert.deepEqual([part(archmage, "arrive").kind, part(archmage, "arrive").formula, part(archmage, "arrive").count], ["damage", "3d4+3[force]", 5]);
    const irii = compileRef(await spell("rank-8/summon-irii"));
    assert.deepEqual(part(irii, "arrive", "Fate").d20Clamp, {min: 10, types: ["attack-roll", "perception-check", "saving-throw", "skill-check"]});
    assert.deepEqual(part(irii, "depart", "Fate").plan.resolution.outcomes.failure.noteEffects[0].d20Clamp.max, 10);
    assert.deepEqual(part(irii, "arrive", "Fortune").rules, [{key: "RollTwice", selector: ["damage", "perception", "saving-throw"], keep: "higher"}]);
    const beseech = compileRef(await spell("rank-9/beseech-arcanotheign"));
    assert.deepEqual([part(beseech, "depart-1").kind, part(beseech, "depart-1").formula, part(beseech, "depart-1").count], ["heal", "5d12", 1]);
    // (The rose's formulas read the cast rank: its Heightened entries.)
    const rose = compileRef(await spell("rank-6/incarnate-wild-rose"));
    assert.equal(part(rose, "arrive").plan.resolution.sharedDamage.formula, "(max(3,floor(@item.rank/2)))d12[piercing]");
    assert.deepEqual([part(rose, "depart").kind, part(rose, "depart").formula], ["damage", "{(max(2,floor(@item.rank/2)-1))d6[persistent,poison]}"]);
});

test("Incarnates by parts: clouds, repeats, alternatives, a tradition's damage type, cast spells and a fixed counteract", async () => {
    const army = compileRef(await spell("rank-8/unholy-army"));
    const smoke = part(army, "arrive", "demons");
    assert.equal(smoke.linger, true);
    assert.deepEqual([smoke.plan.resolution.lingering.events, smoke.plan.resolution.lingering.concealment, smoke.plan.resolution.lingering.durationSeconds], [["enter", "turn-start"], true, 60]);
    const chains = part(army, "arrive", "velstracs");
    assert.deepEqual(chains.plan.resolution.outcomes.failure.noteEffects.map(note => [note.whilePersistent, note.rules[0].value]), [["bleed", -10]]);
    const host = compileRef(await spell("rank-8/holy-host"));
    assert.equal(part(host, "depart", "angels").kind, "cloud");
    assert.deepEqual(part(host, "depart", "angels").memberRules.map(rule => rule.predicate[0]), ["self:trait:unholy", "self:trait:holy"]);
    const kaiju = compileRef(await spell("rank-10/incarnate-kaiju"));
    assert.deepEqual(part(kaiju, "arrive", "Vorgozen").repeat, {trigger: "an enemy Casts a Spell within 60 feet of Vorgozen", unless: "it's already sickened"});
    const warden = compileRef(await spell("rank-8/summon-warden-of-the-wild"));
    assert.deepEqual(partsOf(warden, "Warden of Oceans").filter(entry => entry.alternative).map(entry => entry.alternative.label), ["if summoned in a body of water", "if summoned outside of a body of water"]);
    assert.equal(part(warden, "arrive", "Warden of Forests").immunityRounds, 1);
    assert.deepEqual(partsOf(warden, "Warden of Peaks").filter(entry => entry.kind === "cast-spell").map(entry => [entry.name, entry.durationRounds]), [["Fly", 3], ["Unfettered Movement", 3]]);
    const legion = compileRef(await spell("rank-9/incarnate-draconic-legion"));
    assert.deepEqual(legion.resolution.incarnate.options.choices.map(choice => choice.key), ["arcane", "divine", "occult", "primal"]);
    assert.deepEqual(part(legion, "arrive-1", "primal").plan.resolution.casterChoice.values, ["fire", "poison"]);
    const herald = compileRef(await spell("rank-8/incarnate-deific-herald"));
    assert.deepEqual([part(herald, "depart", "holy").name, part(herald, "depart", "holy").rank, !!part(herald, "depart", "holy").overlayId], ["Heal", 5, true]);
    assert.deepEqual(part(herald, "depart", "unholy").plan.resolution.reminders.map(reminder => [reminder.kind, reminder.modifier, reminder.rank]), [["counteract-fixed", 25, 8]]);
    assert.deepEqual(part(herald, "arrive", "unsanctified").grants.map(grant => grant.slug), ["quickened"]);
});

test("Incarnates by parts: explicit rows, a shunt into the future, a GM's degree question, spell attacks", async () => {
    const specter = compileRef(await spell("rank-7/incarnate-ancient-specter"));
    assert.deepEqual(effectsAt(part(specter, "arrive"), "criticalFailure"), ["prone", "dazzled"]);
    assert.deepEqual(part(specter, "arrive").plan.resolution.outcomes.criticalFailure.noteEffects.map(note => note.label), ["Can't Stand"]);
    const flux = compileRef(await spell("rank-9/call-fluxwraith"));
    const shunt = part(flux, "arrive").plan.resolution.outcomes.failure.noteEffects[0];
    assert.deepEqual([shunt.duration.valueRoll, shunt.recurringSave], ["1d4", {timing: "turn-end", mode: "end", statistic: "will"}]);
    assert.deepEqual(part(flux, "depart").plan.resolution.outcomes.failure.effects.map(effect => effect.whileCondition ?? null), [null, "frightened"]);
    const flesh = compileRef(await spell("rank-9/summon-ancient-fleshforged"));
    assert.equal(part(flesh, "arrive", "Bone Breaker").plan.resolution.degreeAdjustment.predicate.kind, "gm-confirmed");
    assert.deepEqual([part(flesh, "depart", "Thorn Caller").kind, part(flesh, "depart", "Thorn Caller").count], ["attack", 6]);
    // A sentence the reader doesn't take refuses the whole spell (no partial incarnate).
    const changed = compileRef(withText(await spell("rank-8/incarnate-archmage"), html => html.replace("automatically dealing", "maybe dealing")));
    assert.notEqual(changed.resolution?.kind, "incarnate");
});
