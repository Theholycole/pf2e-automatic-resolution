// Live smoke test for every cantrip and rank 1 spell (pftest world only): each spell's PF2e chat card is posted from a fixture caster and the
// module's resolve button is clicked, trying the targets the spell accepts (an enemy, an ally, both, none). Dialogs are answered with their
// first choice, template placement is replaced by a region at the enemy, and a save card is rolled and finalized. Each spell is classed as
// "ok", "refused" (the module's own stated refusal: a target or requirement it checks) or "error" (anything else: an exception, a timeout,
// no button). Fixtures, Effects, regions, walls, lights, summoned actors and Ongoing records are removed after each spell.
const NS = "pf2e-automatic-resolution";
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function autoAnswer() {
    const seen = new WeakSet();
    return setInterval(() => {
        for (const app of [...foundry.applications.instances.values(), ...Object.values(ui.windows)]) {
            const el = app.element?.[0] ?? app.element;
            if (!el?.querySelectorAll || !el.isConnected) continue;
            const name = app.constructor.name;
            if (/CheckModifiersDialog|DamageModifierDialog/.test(name)) { ([...el.querySelectorAll("button")].find(b => /^Roll/.test(b.textContent.trim())))?.click(); continue; }
            if (/ChoiceSet|PickAThing/.test(name)) {
                const pick = el.querySelector("button.select-button, .choice-buttons button, button[value], [data-choice]");
                if (pick) { pick.click(); continue; }
                // A dropdown (PF2e's svelecte): the first option by the keyboard (down, Enter), then Save.
                if (seen.has(app)) continue;
                const input = el.querySelector("input.sv-input--text");
                if (!input) continue;
                seen.add(app);
                input.focus();
                input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
                setTimeout(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })), 300);
                setTimeout(() => [...el.querySelectorAll("button")].find(button => /^(?:Save|Confirm|Select)$/.test(button.textContent.trim()))?.click(), 700);
                continue;
            }
            if (/Dialog/.test(name)) {
                if (seen.has(app)) continue;
                seen.add(app);
                for (const select of el.querySelectorAll("select")) if (!select.value && select.options.length) select.selectedIndex = 0;
                const button = el.querySelector('button[data-action="yes"], button[data-action="ok"]') ?? [...el.querySelectorAll("footer button, .dialog-buttons button, .form-footer button")][0];
                setTimeout(() => button?.click(), 150);
            }
        }
    }, 250);
}

/** Spells of the pftest world's PF2e compendium that are cantrips or rank 1 (not rituals). */
export async function smokeList() {
    const pack = game.packs.get("pf2e.spells-srd");
    const index = await pack.getIndex({ fields: ["system.level.value", "system.traits.value", "system.ritual"] });
    return index.filter(entry => !entry.system?.ritual && ((entry.system?.traits?.value ?? []).includes("cantrip") || Number(entry.system?.level?.value) <= 1))
        .map(entry => ({ id: entry._id, name: entry.name })).sort((a, b) => a.name.localeCompare(b.name));
}

// `entries` ([{name, rank}]) casts those spells heightened to that rank (a level 2r−1 caster, since PF2e caps a creature's spell ranks)
// and records the Effects each cast made (name, level, duration), for checking heightened versions.
export async function smoke({ from = 0, count = 1000, only = null, casterType = "npc", entries = null } = {}) {
    const api = game.modules.get(NS).api;
    const home = canvas.scene;
    const scene = await Scene.create({ name: "PFTEST Smoke field", width: 3000, height: 3000, grid: { size: 100, distance: 5 }, padding: 0 });
    await scene.view(); for (let i = 0; i < 40 && canvas.scene?.id !== scene.id; i++) await wait(150); await wait(800);
    const npc = async (name, alliance, x, y, extra = {}) => {
        const actor = await Actor.create({ name: `PFTEST Smoke ${name}`, type: "npc", flags: { [NS]: { phase23AfflictionFixture: true } },
            system: { details: { level: { value: 3 }, alliance }, attributes: { hp: { value: 60, max: 60 }, ac: { value: 18 } }, saves: { fortitude: { value: 8 }, reflex: { value: 8 }, will: { value: 8 } }, traits: { value: ["humanoid"] }, ...extra } });
        const [token] = await scene.createEmbeddedDocuments("Token", [{ ...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x, y }]);
        return { actor, token };
    };
    let caster;
    if (casterType === "character") {
        const actor = await Actor.create({ name: "PFTEST Smoke caster", type: "character", flags: { [NS]: { phase23AfflictionFixture: true } }, system: { details: { alliance: "party", level: { value: 3 } } } });
        const weapon = (name, extra) => ({ name, type: "weapon", system: { equipped: { carryType: "held", handsHeld: 1 }, category: "simple", traits: { value: [] }, ...extra } });
        await actor.createEmbeddedDocuments("Item", [weapon("Club", { damage: { dice: 1, die: "d6", damageType: "bludgeoning" }, group: "club", baseItem: "club" }),
            weapon("Staff", { damage: { dice: 1, die: "d4", damageType: "bludgeoning" }, group: "club", baseItem: "staff" }),
            weapon("Shortbow", { damage: { dice: 1, die: "d6", damageType: "piercing" }, group: "bow", baseItem: "shortbow", range: 60, equipped: { carryType: "held", handsHeld: 2 } })]);
        const [token] = await scene.createEmbeddedDocuments("Token", [{ ...actor.prototypeToken.toObject(), actorId: actor.id, actorLink: true, x: 1000, y: 1000 }]);
        caster = { actor, token };
    } else caster = await npc("caster", "party", 1000, 1000);
    const ally = await npc("ally", "party", 1100, 1000);
    const enemy = await npc("enemy", "opposition", 1000, 1100);
    const [entry] = await caster.actor.createEmbeddedDocuments("Item", [{ name: "Smoke casting", type: "spellcastingEntry", system: { tradition: { value: "arcane" }, prepared: { value: "innate" }, spelldc: { dc: 20, value: 10 } } }]);
    const actors = [caster.actor, ally.actor, enemy.actor];
    const baseItems = new Map(actors.map(actor => [actor.id, new Set(actor.items.map(item => item.id))]));

    // Template placement: a region at the enemy (a circle for bursts and emanations, a band for lines, a square otherwise).
    const spellProto = CONFIG.PF2E.Item.documentClasses.spell.prototype;
    const originalPlace = spellProto.placeTemplate;
    let placed = 0;
    spellProto.placeTemplate = async function () {
        const area = this.system?.area ?? {}, size = scene.grid.size, feet = Number(area.value ?? 5) / scene.grid.distance * size;
        const shift = placed++ * (feet * 2 + size);
        const cx = enemy.token.x + size / 2 + shift, cy = enemy.token.y + size / 2;
        const shape = area.type === "line" ? { type: "rectangle", x: cx, y: cy - size / 2, width: feet, height: size }
            : ["burst", "emanation", "cone"].includes(area.type) ? { type: "circle", x: cx, y: cy, radius: feet }
            : { type: "rectangle", x: enemy.token.x, y: enemy.token.y, width: Math.max(size, feet), height: Math.max(size, feet) };
        const [region] = await scene.createEmbeddedDocuments("Region", [{ name: `PFTEST Smoke ${this.name}`, shapes: [shape], color: "#aa4444" }]);
        return region;
    };
    const errors = [];
    const originalError = ui.notifications.error.bind(ui.notifications);
    // (Noise that isn't the spell's: the window-size warning, and old cards whose fixture actor is gone.)
    const noise = /ERROR\.RESOLUTION|screen resolution|does not exist in actors/i;
    ui.notifications.error = (message, options) => { if (!noise.test(String(message))) errors.push(String(message)); return originalError(message, options); };
    const onError = event => errors.push(`uncaught: ${event.reason?.stack ?? event.reason ?? event.message}`);
    window.addEventListener("unhandledrejection", onError);
    const answering = autoAnswer();

    const cleanupAfter = async () => {
        for (const actor of actors) {
            const extra = actor.items.filter(item => !baseItems.get(actor.id).has(item.id)).map(item => item.id);
            if (extra.length) await actor.deleteEmbeddedDocuments("Item", extra).catch(() => null);
            await actor.update({ "system.attributes.hp.value": actor.system.attributes.hp.max, "system.attributes.hp.temp": 0 }).catch(() => null);
        }
        for (const record of api.ongoing.records().filter(r => r.status === "active" && actors.some(actor => actor.uuid === r.sourceActorUuid)))
            await api.ongoing.request("end", { castId: record.castId, revision: record.revision }).catch(() => null);
        await wait(300);
        const drop = async (type, list) => { const ids = list.map(doc => doc.id); if (ids.length) await scene.deleteEmbeddedDocuments(type, ids).catch(() => null); };
        await drop("Region", scene.regions.contents);
        await drop("Wall", scene.walls.contents);
        await drop("AmbientLight", scene.lights.contents);
        await drop("Token", scene.tokens.filter(token => ![caster.token.id, ally.token.id, enemy.token.id].includes(token.id)));
        for (const actor of game.actors.filter(a => a.flags?.[NS]?.summoned)) await actor.delete().catch(() => null);
        for (const [token, x, y] of [[caster.token, 1000, 1000], [ally.token, 1100, 1000], [enemy.token, 1000, 1100]])
            if (token.x !== x || token.y !== y) await token.update({ x, y }, { teleport: true, animate: false }).catch(() => null);
        for (const dialog of [...foundry.applications.instances.values()].filter(app => /Dialog/.test(app.constructor.name))) await dialog.close().catch(() => null);
    };

    const pack = game.packs.get("pf2e.spells-srd");
    const byName = entries ? new Map((await pack.getIndex()).map(row => [row.name, row._id])) : null;
    const list = entries ? entries.map(entry => ({ id: byName.get(entry.name), name: entry.name, rank: entry.rank })).filter(entry => entry.id)
        : (await smokeList()).filter(spell => !only || only.includes(spell.name)).slice(from, from + count);
    const results = [];
    const refusal = (name, message) => message.startsWith(`${name}:`) || message.startsWith(`${name} `);
    try {
        for (const spell of list) {
            const source = (await pack.getDocument(spell.id)).toObject(); delete source._id;
            source.system.location = { value: entry.id, ...(spell.rank ? { heightenedLevel: spell.rank } : {}) };
            if (spell.rank) await caster.actor.update({ "system.details.level.value": Math.max(3, spell.rank * 2 - 1) });
            const [item] = await caster.actor.createEmbeddedDocuments("Item", [source]);
            // (The spell stays through the retries: the cleanup between them removes only what casting added.)
            baseItems.get(caster.actor.id).add(item.id);
            const tries = [[enemy.token], [ally.token], [ally.token, enemy.token], [caster.token], []];
            let outcome = null, saveDamage = null;
            for (const targets of tries) {
                errors.length = 0;
                canvas.tokens.setTargets(targets.map(token => token.id));
                let message;
                try { message = await item.toMessage(undefined, { create: true }); } catch (error) { errors.push(`toMessage: ${error.message}`); }
                // (A card can be drawn twice, in the log and as a pop-up: any copy with the button.)
                const find = async id => { for (let i = 0; i < 24; i++) { await wait(250); const roots = [...document.querySelectorAll(`[data-message-id="${id}"]`)];
                    const withButton = roots.find(root => root.querySelector(".pf2e-auto-runtime-resolve"));
                    if (withButton) return { root: withButton, button: withButton.querySelector(".pf2e-auto-runtime-resolve") };
                    const noted = roots.find(root => root.querySelector(".pf2e-auto-coverage-note, button[data-action=\"spell-variant\"]"));
                    if (noted && i >= 8) return { root: noted, button: null }; }
                    return { root: document.querySelector(`[data-message-id="${id}"]`), button: null }; };
                let { root, button } = await find(message?.id);
                // A variant card: its first variant's card, posted as PF2e's variant button does (a scripted click doesn't reach PF2e's listener).
                const variantButton = !button ? document.querySelector(`[data-message-id="${message?.id}"] button[data-action="spell-variant"]`) : null;
                if (variantButton) {
                    const overlayIds = String(variantButton.dataset.overlayIds ?? "").split(",").map(id => id.trim()).filter(Boolean);
                    try { const posted = await item.loadVariant({ overlayIds })?.toMessage(undefined, { create: true }); if (posted) ({ root, button } = await find(posted.id)); }
                    catch (error) { errors.push(`variant: ${error.message}`); }
                }
                if (!button) { outcome = { status: errors.length ? "error" : "no-button", detail: errors.join(" | ") || (root?.querySelector(".pf2e-auto-coverage-note")?.textContent ?? "no module button") }; break; }
                const before = new Set(game.messages.contents.map(m => m.id));
                button.click();
                let settled = false;
                for (let i = 0; i < 60 && !settled; i++) { await wait(250); settled = !button.querySelector(".fa-spinner") && !/Resolving/.test(button.textContent); }
                await wait(600);
                // A save card: roll every save and finalize (applies the rows).
                const card = game.messages.contents.find(m => !before.has(m.id) && m.flags?.[NS]?.basicSaveState);
                if (card && !errors.length) {
                    try {
                        const state = () => game.messages.get(card.id).getFlag(NS, "basicSaveState");
                        for (const target of state().targets) if (target.attackAdjustment && target.attackAdjustment.status !== "answered" && state().attackAdjustment?.choices?.length)
                            await api.saves.correctTarget(game.messages.get(card.id), target.id, { action: "attack-adjustment", degree: String(state().attackAdjustment.choices[0].value), expectedRevision: target.revision }).catch(error => errors.push(`answer: ${error.message}`));
                        for (const target of state().targets) if (target.eligible !== false && !target.excluded && !["healing", "ally", "splash"].includes(target.mode))
                            await api.saves.rollSave(game.messages.get(card.id), target.id, { skipDialog: true }).catch(error => errors.push(`rollSave: ${error.message}`));
                        await api.saves.finalize(game.messages.get(card.id)).catch(error => { if (!refusal(spell.name, error.message)) errors.push(`finalize: ${error.message}`); });
                        await wait(500);
                        // (For heightened checks: the rolled damage and what each target lost.)
                        const final = state();
                        saveDamage = { formula: final.damage?.formula ?? null, total: final.damage?.total ?? null,
                            targets: final.targets.map(target => `${target.name.replace("PFTEST Smoke ", "")} ${target.degree ?? "-"}: ${target.hpBefore != null && target.hpAfter != null ? target.hpBefore - target.hpAfter : "?"} HP`) };
                    } catch (error) { errors.push(`save card: ${error.message}`); }
                }
                if (!settled) errors.push(`timed out (15 s)${[...foundry.applications.instances.values()].filter(app => /Dialog|Prompt|ChoiceSet/.test(app.constructor.name)).map(app => `: ${app.title}`).join("")}`);
                const own = errors.length && errors.every(message => refusal(spell.name, message));
                // (Retry with other targets only for a refusal about targeting, not one that merely names the target.)
                if (own && /\btarget(?:s|ed)?\b|\bselect\b|willing|companion or eidolon|isn't an eidolon|isn't dying|wielder|1 ally and 1 enemy|an ally\b|isn't your ally|can't be healed by|requires the [a-z]+ trait|isn't grabbed|within \d+ feet of|no skill check to improve/i.test(errors.join(" ")) && targets !== tries.at(-1)) {
                    await cleanupAfter();
                    continue;
                }
                outcome = !errors.length ? { status: "ok", detail: card ? "save card finalized" : button.textContent.trim().slice(0, 60) } : own ? { status: "refused", detail: errors.join(" | ") } : { status: "error", detail: errors.join(" | ") };
                break;
            }
            const made = actors.flatMap(actor => actor.itemTypes.effect.filter(effect => !baseItems.get(actor.id).has(effect.id))
                .map(effect => `${actor.name.replace("PFTEST Smoke ", "")}: ${effect.name} (level ${effect.system.level?.value ?? "?"}, ${effect.system.duration?.value} ${effect.system.duration?.unit})`));
            results.push({ name: spell.name, ...(spell.rank ? { rank: spell.rank } : {}), ...outcome, detail: String(outcome?.detail ?? "").slice(0, 500), ...(entries ? { effects: made, ...(saveDamage ? { saveDamage } : {}) } : {}) });
            await cleanupAfter();
            baseItems.get(caster.actor.id).delete(item.id);
            await caster.actor.deleteEmbeddedDocuments("Item", [item.id]).catch(() => null);
            globalThis.__smokeProgress = { done: results.length, of: list.length, last: spell.name };
            globalThis.__smokeResults = results;
        }
    } finally {
        clearInterval(answering);
        window.removeEventListener("unhandledrejection", onError);
        ui.notifications.error = originalError;
        spellProto.placeTemplate = originalPlace;
        canvas.tokens.setTargets([]);
        await cleanupAfter();
        if (canvas.scene?.id !== home.id) { await home.view(); for (let i = 0; i < 40 && canvas.scene?.id !== home.id; i++) await wait(150); }
        for (const actor of actors) await actor.delete().catch(() => null);
        await scene.delete().catch(() => null);
        for (const message of game.messages.filter(m => m.speaker?.alias?.startsWith?.("PFTEST Smoke") || actors.some(actor => m.speaker?.actor === actor.id))) await message.delete().catch(() => null);
    }
    return results;
}
