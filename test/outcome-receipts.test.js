import test from "node:test";
import assert from "node:assert/strict";
import { applyDamageWithReceipt, confirmedDamageSummary } from "../scripts/native-damage-receipt.js";
import { correctSaveTarget, recordProvisionalSave, targetOutcomeConditions } from "../scripts/basic-save-core.js";

function fixture() {
    const effect = { kind: "condition", slug: "clumsy", name: "Clumsy", value: 1, duration: { mode: "fixed", value: 1, unit: "minutes" } };
    return { status: "collecting", outcomes: { failure: { effects: [effect] }, success: { effects: [] } }, targets: [
        { id: "target", degree: "failure", applicationStatus: "pending", revision: 0 }
    ] };
}

test("condition corrections preserve originals and remain target-local; rerolls invalidate them", () => {
    const state = fixture();
    const target = state.targets[0];
    correctSaveTarget(state, "target", { action: "condition", conditionIndex: 0, changes: { value: 3, duration: { mode: "fixed", value: 2, unit: "rounds", expiry: "turn-end" } } }, "gm");
    assert.equal(targetOutcomeConditions(state, target)[0].value, 3);
    assert.equal(target.conditionOverrides[0].original.value, 1);
    assert.equal(state.outcomes.failure.effects[0].value, 1);
    recordProvisionalSave(state, "target", { degree: "failure" });
    assert.equal(targetOutcomeConditions(state, target)[0].value, 1);
});

test("condition corrections reject stale, unsupported and applied changes", () => {
    const state = fixture();
    const correction = { action: "condition", conditionIndex: 0, changes: { value: 2 } };
    assert.throws(() => correctSaveTarget(state, "target", { ...correction, expectedRevision: 8 }, "gm"), /changed/);
    assert.throws(() => correctSaveTarget(state, "target", { ...correction, changes: { value: 0 } }, "gm"), /positive/);
    assert.throws(() => correctSaveTarget(state, "target", { ...correction, changes: { slug: "dead" } }, "gm"), /Unsupported/);
    state.status = "completed";
    assert.throws(() => correctSaveTarget(state, "target", correction, "gm"), /locked/);
});

test("changing a degree clears condition adjustments and restore returns the calculated outcome", () => {
    const state = fixture();
    correctSaveTarget(state, "target", { action: "condition", conditionIndex: 0, changes: { value: 2 } }, "gm");
    correctSaveTarget(state, "target", { action: "condition", conditionIndex: 0, changes: {} }, "gm");
    assert.equal(targetOutcomeConditions(state, state.targets[0])[0].value, 1);
    correctSaveTarget(state, "target", { action: "condition", conditionIndex: 0, changes: { value: 2 } }, "gm");
    correctSaveTarget(state, "target", { action: "degree", degree: "success" }, "gm");
    assert.deepEqual(state.targets[0].conditionOverrides, {});
});

test("native receipts use PF2e damageTaken including overkill and temp HP, never HP delta", async t => {
    const previous = { Hooks: globalThis.Hooks, game: globalThis.game };
    t.after(() => Object.assign(globalThis, previous));
    const hooks = new Map();
    globalThis.Hooks = { on(event, fn) { hooks.set(event, fn); return fn; }, off(event) { hooks.delete(event); } };
    globalThis.game = { user: { id: "gm" } };
    const actor = { uuid: "Actor.a", async applyDamage({ rollOptions }) {
        hooks.get("updateActor")(this, {}, { damageTaken: 30 }, "gm");
        hooks.get("createChatMessage")({ id: "receipt", flags: { pf2e: {
            appliedDamage: { uuid: this.uuid, updates: [{ path: "system.attributes.hp.value", value: 5 }, { path: "system.attributes.hp.temp", value: 2 }] },
            context: { type: "damage-taken", options: [...rollOptions] }
        } } });
    } };
    const receipt = await applyDamageWithReceipt(actor, {}, "cast-step");
    assert.equal(receipt.damage, 30);
    assert.equal(hooks.size, 0);
    const state = { status: "completed", targets: [{ damageResults: [{ receipt }, { receipt }] }] };
    assert.deepEqual(confirmedDamageSummary(state), { damage: 30, healing: 0, incomplete: false });
    state.status = "review";
    assert.equal(confirmedDamageSummary(state).incomplete, true);
});

test("native persistent-only receipt contributes zero and ambiguous concurrent updates require review", async t => {
    const previous = { Hooks: globalThis.Hooks, game: globalThis.game };
    t.after(() => Object.assign(globalThis, previous));
    const hooks = new Map();
    globalThis.Hooks = { on(event, fn) { hooks.set(event, fn); return fn; }, off(event) { hooks.delete(event); } };
    globalThis.game = { user: { id: "gm" } };
    let ambiguous = false;
    const actor = { uuid: "Actor.a", async applyDamage({ rollOptions }) {
        if (ambiguous) for (let i = 0; i < ambiguous; i++) hooks.get("updateActor")(this, {}, { damageTaken: 10 }, "gm");
        hooks.get("createChatMessage")({ id: "receipt", flags: { pf2e: {
            appliedDamage: { uuid: this.uuid, updates: [], persistent: ["condition"] },
            context: { type: "damage-taken", options: [...rollOptions] }
        } } });
    } };
    assert.equal((await applyDamageWithReceipt(actor, {}, "step")).damage, 0);
    ambiguous = 1;
    await assert.rejects(applyDamageWithReceipt(actor, {}, "unrelated-update"), /unambiguous/);
    ambiguous = 2;
    await assert.rejects(applyDamageWithReceipt(actor, {}, "step2"), /unambiguous/);
    assert.equal(hooks.size, 0);
});

test("legacy or missing receipts remain incomplete and healing never subtracts from damage", () => {
    assert.deepEqual(confirmedDamageSummary({ status: "completed", targets: [{ damageResults: [
        { total: 500 }, { receipt: { status: "confirmed", applicationId: "h", damage: 0, healing: 15 } }
    ] }] }), { damage: 0, healing: 15, incomplete: true });
});

test('healing uses the native undo receipt after the HP cap, including a full-health recipient',async t=>{
 const previous={Hooks:globalThis.Hooks,game:globalThis.game};t.after(()=>Object.assign(globalThis,previous));const hooks=new Map();
 globalThis.Hooks={on(event,fn){hooks.set(event,fn);return fn;},off(event){hooks.delete(event);}};globalThis.game={user:{id:'gm'}};let restored=1;
 const actor={uuid:'Actor.a',async applyDamage({rollOptions}){hooks.get('updateActor')(this,{}, {damageTaken:-16},'gm');hooks.get('createChatMessage')({id:'receipt',flags:{pf2e:{appliedDamage:{uuid:this.uuid,isHealing:true,updates:restored?[{path:'system.attributes.hp.value',value:-restored}]:[]},context:{type:'damage-taken',options:[...rollOptions]}}}});}};
 assert.equal((await applyDamageWithReceipt(actor,{},'overheal')).healing,1);restored=0;assert.equal((await applyDamageWithReceipt(actor,{},'full')).healing,0);
});
