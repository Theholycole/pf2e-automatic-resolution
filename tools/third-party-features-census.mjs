#!/usr/bin/env node
// The third-party ("+" modules) feats, actions, items and effects that build on spells: each sorted into its rule family from its text, and whether the
// module's readers already read it.
//   node tools/third-party-features-census.mjs [OUTPUT] — writes reports/third-party-features-census.json by default; ONLY=name,name prints those entries.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readSpellshapeFeat, readWand } from '../src/compiler/spellshape-readers.js';
import { readItemSpellshape } from '../src/compiler/item-spellshape.js';
import { readItemCasts } from '../src/compiler/item-casts.js';
import { readTextRules, readPassiveCastRider, readFocusRegain, readCastReaction, readActionCast, readSpellstrikeFeature } from '../src/compiler/plus-feature-rules.js';
import { readEssenceActivation } from '../scripts/essence-runtime.js';
import { readEnergyRune } from '../scripts/spellshape-runtime.js';
import { readBackfireAmmo } from '../scripts/plus-ammo-runtime.js';
import { readFocusFeature } from '../scripts/plus-focus-runtime.js';
import { readCounteractFeature } from '../scripts/plus-counteract-runtime.js';
import { readCastAfter } from '../scripts/plus-cast-riders-runtime.js';
import { readHexFamiliar } from '../scripts/plus-hex-familiar-runtime.js';
import { readExploit, readChannelSmite } from '../scripts/plus-exploit-runtime.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = process.argv[2] ?? `${root}reports/third-party-features-census.json`;
const items = JSON.parse(readFileSync(`${root}.cache/third-party-items.json`, 'utf8'));
const plain = item => String(item.system?.description?.value ?? '').replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1').replace(/@(?:Damage|Check|Template)\[[^\]]*\](?:\{([^}]+)\})?/g, '$1').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const traits = item => item.system?.traits?.value ?? [];
const attempt = (reader, item) => { try { return !!reader(item); } catch { return false; } };

// (Families, the first that fits; the patterns are the texts' own phrasings.)
const FAMILIES = [
    ['spellshape', item => traits(item).some(trait => ['spellshape', 'metamagic'].includes(trait))],
    ['wand', item => item.type !== 'feat' && (traits(item).includes('wand') || item.system?.category === 'wand' || /\bwand\b/i.test(item.name))],
    ['staff', item => item.type !== 'feat' && (traits(item).includes('staff') || /\bstaff\b/i.test(item.name))],
    ['scroll', item => item.type === 'consumable' && (item.system?.category === 'scroll' || traits(item).includes('scroll'))],
    ['item-cast', (item, text) => !['feat', 'action', 'effect'].includes(item.type) && /\bcasts?\b|\bCast a Spell\b|\bspell (?:DC|attack)/i.test(text)],
    ['spell-trigger', (item, text) => /Trigger[^;.]*(?:Casts? a Spell|casts a spell|targeted by a spell|a spell (?:targets|affects)|within the area of a spell)/i.test(text)],
    ['cast-rider', (item, text) => /\b(?:When|Whenever|After|The next time|Each time|If) you Cast a Spell\b|\bthe next spell you cast\b|\bspells? you cast\b|\byour next spell\b|\bwhen you cast a\b/i.test(text)],
    ['spellstrike-cascade', (item, text) => /Spellstrike|Arcane Cascade|conflux/i.test(text) || /Spellstrike|Cascade/.test(item.name)],
    ['focus-pool', (item, text) => /Focus Points?\b|focus pool/i.test(text)],
    ['grants-spell', (item, text) => /\byou (?:gain|learn) (?:the )?[A-Z][\w' ]+ (?:hex|spell|cantrip|focus spell)|\byou gain the [a-z' ]+ (?:hex|cantrip)|\badd [a-z' ]+ to your (?:repertoire|spellbook)/i.test(text)],
    ['spell-modifier', (item, text) => /\bspell (?:DC|attack (?:roll|modifier))\b|\bspell damage\b|\bspells? with the [a-z]+ trait\b|\bheighten/i.test(text)],
    ['mentions-spells', (item, text) => /\bspells?\b|\bcantrips?\b|\bhex(?:es)?\b/i.test(text)]
];

const rows = [];
for (const item of items) {
    if (item.type === 'spell') continue;
    const text = plain(item);
    const family = FAMILIES.find(([, test]) => test(item, text))?.[0] ?? null;
    if (!family) continue;
    const read = [['spellshape', readSpellshapeFeat], ['wand', readWand], ['item-spellshape', readItemSpellshape], ['item-casts', readItemCasts], ['text-rules', readTextRules], ['passive-cast', readPassiveCastRider], ['focus-regain', readFocusRegain], ['cast-reaction', readCastReaction], ['action-cast', readActionCast], ['spellstrike-feature', readSpellstrikeFeature], ['essence-activation', readEssenceActivation], ['energy-rune', readEnergyRune], ['backfire-ammo', readBackfireAmmo], ['focus-feature', readFocusFeature], ['counteract-feature', readCounteractFeature], ['cast-after', readCastAfter], ['hex-familiar', readHexFamiliar], ['exploit', readExploit], ['channel-smite', readChannelSmite]]
        .filter(([, reader]) => attempt(reader, item)).map(([name]) => name);
    rows.push({ name: item.name, id: item._id, type: item.type, module: item._pack.split('.')[0], pack: item._pack, family, read, rules: [...new Set((item.system?.rules ?? []).map(rule => rule.key))], length: text.length });
}
const count = key => rows.reduce((totals, row) => ({ ...totals, [row[key]]: (totals[row[key]] ?? 0) + 1 }), {});
const byFamily = Object.fromEntries(Object.entries(count('family')).sort((a, b) => b[1] - a[1]).map(([family, total]) => [family, { total, read: rows.filter(row => row.family === family && row.read.length).length }]));
writeFileSync(output, JSON.stringify({ generated: new Date().toISOString(), total: rows.length, byFamily, byModule: count('module'), rows }, null, 1) + '\n');
if (process.env.ONLY) for (const name of process.env.ONLY.split(',')) { const item = items.find(entry => entry.name === name && entry.type !== 'spell'); console.log(`===== ${name} [${item?._pack}] ${item?.type}\n${item ? plain(item) : 'missing'}\n${JSON.stringify(item?.system?.rules ?? [])}`); }
console.log(JSON.stringify({ total: rows.length, byFamily }));
