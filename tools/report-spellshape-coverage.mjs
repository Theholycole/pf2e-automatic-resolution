#!/usr/bin/env node
// Spellshape feats and wands the module reads (src/compiler/spellshape-readers.js), from the exported fixtures:
//   node tools/report-spellshape-coverage.mjs [FIXTURES] [OUTPUT]
// Wands are grouped by their base name (ranks together); a plain wand (it only casts its spell) needs nothing read.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readSpellshapeFeat, readWand } from '../src/compiler/spellshape-readers.js';

const root = process.argv[2] ?? fileURLToPath(new URL('../.cache/pf2e-spellshape-fixtures', import.meta.url));
const output = process.argv[3] ?? null;
const load = (dir, file) => JSON.parse(readFileSync(`${root}/${dir}/${file}`, 'utf8'));
const feats = readdirSync(`${root}/feats`).map(file => load('feats', file)).map(source => ({ name: source.name, read: !!readSpellshapeFeat(source) }));
const bases = new Map();
for (const file of readdirSync(`${root}/wands`)) {
    const source = load('wands', file);
    const base = source.name.replace(/\s*\(.*\)$/, '');
    const entry = bases.get(base) ?? { name: base, items: 0, read: 0 };
    entry.items++; if (readWand(source)) entry.read++;
    bases.set(base, entry);
}
const wands = [...bases.values()].map(entry => ({ name: entry.name, items: entry.items, read: entry.read === entry.items ? true : entry.read ? 'partly' : false }));
const report = { feats: { total: feats.length, read: feats.filter(entry => entry.read).length, list: feats }, wands: { total: wands.length, read: wands.filter(entry => entry.read === true).length, list: wands } };
if (output) writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ feats: `${report.feats.read}/${report.feats.total}`, wands: `${report.wands.read}/${report.wands.total}` }));
