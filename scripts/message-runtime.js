// Messaging spells (Message, Sending, Dream Message): the caster's words whispered to the target's owners and the GM,
// with the text's word limit, range and one reply in its window. A dream message waits until the GM marks the target
// asleep. Players' replies and the GM's deliveries go through the lead GM (the "message-*" ongoing requests).
import { isExecutableMessagePlan } from "./message-core.js";
import { messageAtRank, wordCount } from "../src/compiler/message-compiler.js";
import { tokenDistance } from "./token-distance.js";
import { actorFromTarget, escapeHTML, randomID } from "./runtime-utils.js";

const MODULE_ID = "pf2e-automatic-resolution";

function recipients(...actors) {
    return game.users.filter(user => user.isGM || actors.some(actor => actor?.testUserPermission?.(user, "OWNER"))).map(user => user.id);
}

function sceneToken(actor) {
    return actor?.getActiveTokens?.(false, true)?.find(token => token.parent?.id === canvas?.scene?.id) ?? actor?.getActiveTokens?.(false, true)?.[0] ?? null;
}

function checkWords(text, limit, approximate, label) {
    const words = wordCount(text);
    if (!words) throw new Error(`${label}: write the message first.`);
    if (limit != null && !approximate && words > limit) throw new Error(`${label}: ${words} words; the spell allows ${limit} or fewer.`);
    return words;
}

/** Where the reply window ends: the end of the target's next turn in the running encounter (null outside one). */
function replyDeadline(targetActor) {
    const combat = game.combat;
    if (!combat?.started) return null;
    const index = combat.turns.findIndex(turn => turn.actor?.uuid === targetActor.uuid);
    if (index < 0) return null;
    return { combatId: combat.id, round: index > combat.turn ? combat.round : combat.round + 1, turn: index };
}

function withinDeadline(deadline) {
    if (!deadline) return true;
    const combat = game.combat;
    if (!combat?.started || combat.id !== deadline.combatId) return false;
    return combat.round < deadline.round || (combat.round === deadline.round && combat.turn <= deadline.turn);
}

export class MessageRuntime {
    ongoing = null;

    supports(plan) { return isExecutableMessagePlan(plan); }

    /** Send the message (or hold a dream message for the GM). `text` skips the dialog. */
    async start(spell, plan, { sourceActor = spell?.actor, castRank = spell?.rank, targets = null, text = null, sourceMessageId = null } = {}) {
        if (!this.supports(plan)) throw new Error(`${plan?.source?.name ?? "Spell"} is not an executable messaging spell.`);
        const message = messageAtRank(plan.resolution.message, castRank);
        const name = plan.source.name;
        const actors = [...new Set([...(targets ?? game.user.targets)].map(target => actorFromTarget(target) ?? target?.actor ?? target).filter(actor => actor?.uuid))];
        if (!actors.length) throw new Error(`${name}: target the creature${message.maxTargets > 1 ? "s" : ""} to send the message to.`);
        if (actors.length > message.maxTargets) throw new Error(`${name}: at rank ${castRank} the spell reaches ${message.maxTargets} creature${message.maxTargets === 1 ? "" : "s"}.`);
        if (actors.some(actor => actor.uuid === sourceActor.uuid)) throw new Error(`${name}: the target must be another creature.`);
        // "Range 120 feet": each target's token must be that close to the caster's.
        if (message.range != null) {
            const from = sceneToken(sourceActor);
            for (const actor of actors) {
                const to = sceneToken(actor);
                if (!from || !to || to.parent?.id !== from.parent?.id) throw new Error(`${name}: the caster and ${actor.name} need tokens on the same scene to measure the ${message.range}-foot range.`);
                if (tokenDistance(from, to) > message.range) throw new Error(`${name}: ${actor.name} is more than ${message.range} feet away.`);
            }
        }
        text ??= await this.#prompt(`${name} — Message`, message.words, message.wordsApproximate, `To ${actors.map(actor => actor.name).join(", ")}`);
        if (text == null) return { status: "cancelled" };
        checkWords(text, message.words, message.wordsApproximate, name);
        const castId = randomID();
        const cards = [];
        for (const actor of actors) {
            const state = { castId, spellName: name, casterUuid: sourceActor.uuid, casterName: sourceActor.name, targetUuid: actor.uuid, targetName: actor.name,
                text, words: wordCount(text), reply: message.reply ? { ...message.reply, range: message.range, text: null } : null, delivery: message.delivery,
                delivered: message.delivery === "immediate", deadline: message.delivery === "immediate" && message.reply?.window === "reaction-or-next-turn" ? replyDeadline(actor) : null };
            const whisper = state.delivered ? recipients(sourceActor, actor) : recipients(sourceActor);
            cards.push(await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: sourceActor }), whisper, content: this.#html(state),
                flags: { [MODULE_ID]: { kind: "spell-message", message: state } } }));
        }
        if (sourceMessageId) try { await game.messages.get(sourceMessageId)?.setFlag(MODULE_ID, "messageCast", castId); } catch (error) { console.warn(`${MODULE_ID} | The message was sent, but the spell card could not be marked.`, error); }
        return { status: message.delivery === "immediate" ? "sent" : "pending", castId, messageIds: cards.map(card => card.id) };
    }

    /** The target's one reply, in its window (and range, for Message). */
    async reply({ messageId, text }, user = game.user) {
        if (this.ongoing && !this.ongoing.isCoordinator()) return this.ongoing.request("message-reply", { messageId, text });
        const card = game.messages.get(messageId), state = card?.getFlag(MODULE_ID, "message");
        if (!state?.reply) throw new Error("This message can't be answered.");
        if (!state.delivered) throw new Error(`${state.spellName}: the message hasn't been delivered yet.`);
        if (state.reply.text != null) throw new Error(`${state.spellName}: ${state.targetName} has already replied.`);
        const target = await fromUuid(state.targetUuid), caster = await fromUuid(state.casterUuid);
        if (!user.isGM && !target?.testUserPermission(user, "OWNER")) throw new Error(`Only ${state.targetName}'s owner can reply.`);
        if (!withinDeadline(state.deadline)) throw new Error(`${state.spellName}: the reply had to come by the end of ${state.targetName}'s next turn.`);
        if (state.reply.withinRange) {
            const from = sceneToken(target), to = sceneToken(caster);
            if (!from || !to || from.parent?.id !== to.parent?.id || tokenDistance(from, to) > state.reply.range)
                throw new Error(`${state.spellName}: ${state.targetName} must be within ${state.reply.range} feet of ${state.casterName} to reply.`);
        }
        checkWords(text, state.reply.words, false, state.spellName);
        const next = { ...state, reply: { ...state.reply, text, words: state.reply.words, at: game.time.worldTime } };
        await card.update({ content: this.#html(next), [`flags.${MODULE_ID}.message`]: next });
        return { status: "replied", text };
    }

    /** The GM marks a dream message's target asleep: the message is delivered and the spell ends for it. */
    async deliver({ messageId }, user = game.user) {
        if (this.ongoing && !this.ongoing.isCoordinator()) return this.ongoing.request("message-deliver", { messageId });
        if (!user.isGM) throw new Error("Only the GM decides when the target is asleep.");
        const card = game.messages.get(messageId), state = card?.getFlag(MODULE_ID, "message");
        if (!state || state.delivered) throw new Error("There is no dream message waiting here.");
        const target = await fromUuid(state.targetUuid), caster = await fromUuid(state.casterUuid);
        const next = { ...state, delivered: true, deliveredAt: game.time.worldTime };
        await card.update({ content: this.#html(next), whisper: recipients(caster, target), [`flags.${MODULE_ID}.message`]: next });
        return { status: "delivered" };
    }

    bind(message, root) {
        const state = message.getFlag(MODULE_ID, "message");
        if (!state) return;
        const target = fromUuidSync(state.targetUuid);
        const replyButton = root.querySelector("[data-message-action='reply']");
        if (replyButton && !replyButton.dataset.bound) {
            replyButton.dataset.bound = "true";
            replyButton.hidden = !(game.user.isGM || target?.testUserPermission?.(game.user, "OWNER"));
            replyButton.addEventListener("click", async () => {
                const text = await this.#prompt(`${state.spellName} — Reply`, state.reply.words, false, `To ${state.casterName}${state.reply.withinRange ? " (you must be able to see them)" : ""}`);
                if (text == null) return;
                try { await this.reply({ messageId: message.id, text }); } catch (error) { ui.notifications.error(error.message); }
            });
        }
        const deliverButton = root.querySelector("[data-message-action='deliver']");
        if (deliverButton && !deliverButton.dataset.bound) {
            deliverButton.dataset.bound = "true";
            deliverButton.hidden = !game.user.isGM;
            deliverButton.addEventListener("click", async () => { try { await this.deliver({ messageId: message.id }); } catch (error) { ui.notifications.error(error.message); } });
        }
    }

    async #prompt(title, limit, approximate, subtitle) {
        const hint = limit == null ? "" : approximate ? ` (roughly ${limit} words)` : ` (${limit} words or fewer)`;
        return await foundry.applications.api.DialogV2.prompt({ window: { title },
            content: `<p>${escapeHTML(subtitle)}${hint}</p><textarea name="text" rows="4" style="width:100%" autofocus></textarea>`,
            ok: { label: "Send", callback: (_event, button) => String(button.form.elements.text.value ?? "").trim() }, rejectClose: false }) ?? null;
    }

    #html(state) {
        const quote = text => `<blockquote>${escapeHTML(text)}</blockquote>`;
        const replyPart = !state.reply ? "" : state.reply.text != null
            ? `<p><strong>${escapeHTML(state.targetName)} replies:</strong></p>${quote(state.reply.text)}`
            : state.delivered ? `<p>${escapeHTML(state.targetName)} can reply once${state.reply.words ? ` (${state.reply.words} words or fewer)` : " (a brief response)"}${state.reply.window === "reaction-or-next-turn" ? ", as a reaction or a free action on their next turn, if they can see the caster and are within range" : ", immediately"}.</p>
                <button type="button" data-message-action="reply"><i class="fa-solid fa-reply"></i> Reply</button>` : "";
        const waiting = state.delivered ? "" : `<p>Waiting: ${escapeHTML(state.targetName)} receives it the next time they sleep (at once if asleep now). The GM delivers it.</p>
            <button type="button" data-message-action="deliver"><i class="fa-solid fa-moon"></i> Deliver (${escapeHTML(state.targetName)} is asleep)</button>`;
        const done = state.delivery === "when-asleep" && state.delivered ? `<p>Delivered; the spell ends for ${escapeHTML(state.targetName)}, and ${escapeHTML(state.casterName)} knows it was sent.</p>` : "";
        return `<div class="pf2e-auto-message"><p><strong>${escapeHTML(state.spellName)}</strong>: ${escapeHTML(state.casterName)} → ${escapeHTML(state.targetName)} (${state.words} word${state.words === 1 ? "" : "s"})</p>${quote(state.text)}${waiting}${done}${replyPart}</div>`;
    }
}
