// GM notes are seen only by the GM (the user, 2026-10-05: "make all GM notes only visible to the GM").
// - A GM note is an element with the class `pf2e-auto-gm-only`, or a `pf2e-auto-gm-reminder` whose label isn't addressed to the caster or player, or
//   reporting a result ("Caster:", "Strike:", "Moved:").
// - A message made only of GM notes is whispered to the GMs when it's created.
// - Inside a shared card, a player's client removes the GM notes as the card renders, and takes GM asides ("(the GM moves it)", "The GM …" sentences) out of its
//   text (the user, 2026-10-05: "do the same for asides in chat cards").
// - In an Effect's description, the GM notes carry PF2e's `data-visibility="gm"`, which PF2e's description renderer drops for players (marked as the Effect
//   is created or its description changed; the Effects already on the scene are marked once when the world loads).
const PLAYER_LABELS = /^(?:Caster|Strike|Moved):$/;

/** Whether an element is a GM note. */
export function isGmNote(element) {
    if (element?.classList?.contains("pf2e-auto-gm-only")) return true;
    if (!element?.classList?.contains("pf2e-auto-gm-reminder")) return false;
    const label = element.querySelector?.(":scope > strong")?.textContent?.trim() ?? "";
    return !PLAYER_LABELS.test(label);
}

const GM_SELECTOR = ".pf2e-auto-gm-only, .pf2e-auto-gm-reminder";

/** The GM notes in a piece of HTML (outermost only). */
function gmNotesIn(root) {
    return [...root.querySelectorAll(GM_SELECTOR)].filter(element => isGmNote(element) && !element.parentElement?.closest?.(GM_SELECTOR));
}

/** Whether HTML is made only of GM notes (nothing else with text, buttons or images). */
export function onlyGmNotes(html) {
    if (!/pf2e-auto-gm-(?:only|reminder)/.test(String(html ?? ""))) return false;
    const root = document.createElement("div");
    root.innerHTML = String(html);
    const notes = gmNotesIn(root);
    if (!notes.length) return false;
    for (const note of notes) note.remove();
    return !root.textContent.trim() && !root.querySelector("button, img, a[data-uuid], [data-action]");
}

/** As a message is created: one made only of GM notes is whispered to the GMs. */
export function whisperGmNotes(message) {
    if (message.whisper?.length || message.blind) return;
    if (!onlyGmNotes(message.content)) return;
    const gms = game.users.filter(user => user.isGM).map(user => user.id);
    if (gms.length) message.updateSource({ whisper: gms });
}

/** A text with its GM asides taken out: "(the GM …)" parentheses and sentences starting "The GM". */
export function stripAsides(text) {
    return String(text).replace(ASIDE, "").split(/(?<=[.!?])(\s+)(?=[A-Z"])/).filter((part, index, parts) => {
        if (/^\s+$/.test(part)) return !GM_SENTENCE.test(parts[index + 1] ?? "");
        return !GM_SENTENCE.test(part.trim());
    }).join("");
}

/** A card's GM asides taken out of its text and its button labels, text node by text node (the buttons and their handlers untouched). */
function stripCardAsides(root) {
    // (The card's content and its flavor line — "do the same for asides in chat message flavors too".)
    const parts = [...(root.querySelectorAll?.(".message-content, .flavor-text") ?? [])];
    const nodes = [];
    for (const part of parts.length ? parts : [root]) {
        const walker = document.createTreeWalker(part, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) if (/\bGM\b/.test(node.nodeValue)) nodes.push(node);
    }
    // (Roll tooltips: the dice tooltip's text is in the content above; tooltips held in attributes — data-tooltip, title, aria-label — here: "do the same for
    // asides in roll tooltips too".)
    for (const part of parts.length ? parts : [root]) for (const element of [part, ...part.querySelectorAll("[data-tooltip], [data-tooltip-text], [title], [aria-label]")]) {
        if (element.closest?.(`${GM_SELECTOR}, [data-visibility]`)) continue;
        for (const name of ["data-tooltip", "data-tooltip-text", "title", "aria-label"]) {
            const value = element.getAttribute?.(name);
            if (value && /\bGM\b/.test(value)) { const stripped = stripAsides(value); if (stripped !== value) element.setAttribute(name, stripped.trim()); }
        }
    }
    for (const node of nodes) {
        const parent = node.parentElement;
        // (Button labels too — their text only, the handlers untouched; form fields' text is left alone.)
        if (parent?.closest(`${GM_SELECTOR}, [data-visibility], textarea, select`)) continue;
        if (/^GM \/ player:/.test(parent?.closest("p, li")?.querySelector(":scope > strong")?.textContent?.trim() ?? "")) continue;
        const stripped = stripAsides(node.nodeValue);
        if (stripped !== node.nodeValue) node.nodeValue = stripped;
    }
}

/** As a card renders for a player: its GM notes removed and its GM asides taken out of its text (a card left with nothing is hidden). */
export function hideGmNotes(message, html) {
    if (game.user?.isGM) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    stripCardAsides(root);
    const notes = gmNotesIn(root);
    for (const note of notes) note.remove();
    const content = root.querySelector(".message-content");
    if (content && !content.textContent.trim() && !content.querySelector("button, img")) root.style.display = "none";
}

// A GM aside inside a player's text ("… (the GM judges the line of the attack).", "The GM moves it."): taken out of the sentence into a GM note of its own after
// the paragraph (the user, 2026-10-05: "split those asides into separate GM notes").
const ASIDE = /\s*\(([^()]*?\bGM(?:'s)?\b[^()]*?)\)/g;
const BARE_ASIDE = /^(?:the |or |at the )?GM(?:'s)?(?: (?:reminder|control|choice|targets|discretion))?$/i;
const GM_SENTENCE = /^(?:The GM|GM:)\s/;
const ESCAPE = value => String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

/** The GM asides of a paragraph's HTML: { html (without them), notes (plain text) }. */
export function splitAsides(html) {
    const sentences = String(html).split(/(?<=[.!?])\s+(?=[A-Z<@"])/);
    const kept = [], notes = [];
    for (const sentence of sentences) {
        const plain = sentence.replace(/<[^>]+>/g, "").trim();
        if (GM_SENTENCE.test(plain)) { notes.push(plain.replace(/^GM:\s*/, "")); continue; }
        const asides = [...sentence.matchAll(ASIDE)].map(match => match[1].trim());
        if (!asides.length) { kept.push(sentence); continue; }
        const without = sentence.replace(ASIDE, "");
        kept.push(without);
        const bare = without.replace(/<[^>]+>/g, "").trim();
        const stop = text => /[.!?]$/.test(text) ? text : `${text}.`;
        for (const aside of asides) notes.push(BARE_ASIDE.test(aside) ? `${bare.replace(/[.!?]$/, "")} — yours to resolve.` : stop(aside.replace(/^./, character => character.toUpperCase())));
    }
    return { html: kept.join(" "), notes };
}

/** A description's GM notes marked `data-visibility="gm"` (PF2e hides them from players), its GM asides split out first: the new HTML, or null when nothing changed. */
export function markGmNotes(html) {
    const text = String(html ?? "");
    if (!/pf2e-auto-gm-(?:only|reminder)|\bGM\b/.test(text)) return null;
    const root = document.createElement("div");
    root.innerHTML = text;
    let changed = false;
    // (The asides: from each paragraph or list item that isn't itself a GM note, nor one for the GM and the player alike.)
    for (const block of [...root.querySelectorAll("p, li")]) {
        if (block.closest(GM_SELECTOR) || block.closest("[data-visibility]") || /^GM \/ player:/.test(block.querySelector(":scope > strong")?.textContent?.trim() ?? "")) continue;
        const { html: rest, notes } = splitAsides(block.innerHTML);
        if (!notes.length) continue;
        block.innerHTML = rest;
        let after = block;
        for (const note of notes) {
            const element = document.createElement(block.tagName === "LI" ? "li" : "p");
            element.className = "pf2e-auto-gm-reminder";
            element.innerHTML = `<strong>GM:</strong> ${ESCAPE(note)}`;
            after.after(element);
            after = element;
        }
        if (!block.textContent.trim()) block.remove();
        changed = true;
    }
    for (const note of gmNotesIn(root)) if (note.dataset.visibility !== "gm") { note.dataset.visibility = "gm"; changed = true; }
    return changed ? root.innerHTML : null;
}

/**
 * An Effect's name without its GM asides (a name is the same for everyone, so the aside can't be hidden in place): { name, notes } — the asides go to the
 * description as GM notes (the user, 2026-10-05: "do the same for asides in Effect names too").
 */
export function splitNameAsides(name) {
    const text = String(name ?? "");
    const notes = [...text.matchAll(ASIDE)].map(match => match[1].trim());
    if (!notes.length) return { name: text, notes: [] };
    const rest = text.replace(ASIDE, "").replace(/\s{2,}/g, " ").replace(/\s+([:,.])/g, "$1").trim();
    return { name: rest, notes: notes.map(aside => BARE_ASIDE.test(aside) ? `${rest} — yours to resolve.` : /[.!?]$/.test(aside) ? aside.replace(/^./, c => c.toUpperCase()) : `${aside.replace(/^./, c => c.toUpperCase())}.`) };
}

/** A description with GM notes added (marked for the GM only). */
function withNameNotes(description, notes) {
    return `${String(description ?? "")}${notes.map(note => `<p class="pf2e-auto-gm-reminder" data-visibility="gm"><strong>GM:</strong> ${ESCAPE(note)}</p>`).join("")}`;
}

/** As an Effect is made: its name's GM asides moved to its description, and the description's GM notes marked. */
export function markEffectGmNotes(item) {
    if (item.type !== "effect") return;
    const named = splitNameAsides(item.name);
    let description = item.system?.description?.value ?? "";
    if (named.notes.length) { description = withNameNotes(description, named.notes); item.updateSource({ name: named.name || item.name }); }
    const marked = markGmNotes(description) ?? (named.notes.length ? description : null);
    if (marked != null) item.updateSource({ "system.description.value": marked });
}

/** As an Effect's name or description changes: the same. */
export function markEffectGmNotesUpdate(item, changes) {
    if (item.type !== "effect") return;
    const newName = foundry.utils.getProperty(changes, "name");
    const named = typeof newName === "string" ? splitNameAsides(newName) : { notes: [] };
    let value = foundry.utils.getProperty(changes, "system.description.value");
    if (named.notes.length) {
        foundry.utils.setProperty(changes, "name", named.name || newName);
        value = withNameNotes(typeof value === "string" ? value : item.system?.description?.value, named.notes);
    }
    const marked = typeof value === "string" ? markGmNotes(value) ?? (named.notes.length ? value : null) : null;
    if (marked != null) foundry.utils.setProperty(changes, "system.description.value", marked);
}

/** Once, when the world loads (the active GM): the Effects already on actors and scene tokens marked. */
export async function markExistingGmNotes() {
    if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return 0;
    const actors = new Set([...game.actors, ...game.scenes.contents.flatMap(scene => scene.tokens.contents.filter(token => !token.actorLink).map(token => token.actor).filter(Boolean))]);
    let count = 0;
    for (const actor of actors) {
        const updates = [];
        for (const effect of actor.itemTypes?.effect ?? []) {
            const named = splitNameAsides(effect.name);
            const description = named.notes.length ? withNameNotes(effect.system?.description?.value, named.notes) : effect.system?.description?.value;
            const marked = markGmNotes(description) ?? (named.notes.length ? description : null);
            if (marked != null || named.notes.length) updates.push({ _id: effect.id, ...(named.notes.length ? { name: named.name || effect.name } : {}), ...(marked != null ? { "system.description.value": marked } : {}) });
        }
        if (updates.length) { await actor.updateEmbeddedDocuments("Item", updates).catch(() => null); count += updates.length; }
    }
    return count;
}

