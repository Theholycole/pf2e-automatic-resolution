import assert from "node:assert/strict";
import test from "node:test";

import {
    debugCast,
    debugEnabled,
    debugLatestCast,
    debugLog,
    registerDebugSetting
} from "../scripts/debug.js";

test("debug logging is opt-in and can print persisted cast state", t => {
    const priorGame = globalThis.game;
    const priorFoundry = globalThis.foundry;
    const priorConsole = {
        debug: console.debug,
        group: console.group,
        groupCollapsed: console.groupCollapsed,
        groupEnd: console.groupEnd,
        info: console.info,
        log: console.log,
        table: console.table
    };
    let setting = null;
    let enabled = false;
    const calls = [];
    globalThis.game = {
        settings: {
            register: (_scope, _key, config) => { setting = config; },
            get: () => enabled
        },
        messages: { contents: [], get: () => null }
    };
    globalThis.foundry = { utils: { deepClone: structuredClone } };
    for (const method of Object.keys(priorConsole)) console[method] = (...args) => calls.push([method, ...args]);
    t.after(() => {
        globalThis.game = priorGame;
        globalThis.foundry = priorFoundry;
        Object.assign(console, priorConsole);
    });

    registerDebugSetting();
    assert.equal(setting.default, false);
    assert.equal(setting.scope, "client");
    assert.equal(debugEnabled(), false);
    debugLog("cast-1", "disabled event");
    assert.equal(calls.length, 0);

    enabled = true;
    debugLog("cast-1", "enabled event", { target: "Actor.target" });
    assert.equal(calls.some(call => call[0] === "debug" && call[1].event === "enabled event"), true);

    const state = {
        castId: "cast-1",
        spellName: "Test Spell",
        targets: [{
            name: "Target",
            actorUuid: "Actor.target",
            tokenUuid: null,
            degree: "failure",
            applicationStatus: "pending",
            hpBefore: null,
            hpAfter: null,
            effectUuids: []
        }]
    };
    const card = {
        getFlag: () => state,
        flags: {}
    };
    globalThis.game.messages.contents.push(card);
    const snapshot = debugCast(card);
    assert.deepEqual(snapshot, state);
    assert.notEqual(snapshot, state);
    assert.equal(calls.some(call => call[0] === "table"), true);
    assert.deepEqual(debugLatestCast(), state);
});
