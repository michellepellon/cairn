#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const usage = `usage: setup.js <name>

Renders CLAUDE.md.template to CLAUDE.md, replacing <NAME_PLACEHOLDER> with
<name>, and substitutes the same placeholder in place across skills/.

  -h, --help  show this message`;

const name = process.argv[2];
if (name === '-h' || name === '--help') {
  console.log(usage);
  process.exit(0);
}
if (!name) {
  console.error(usage);
  process.exit(1);
}

const root = path.resolve(__dirname);
const files = [];

const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else files.push(p);
  }
};
const skills = path.join(root, 'skills');
if (fs.existsSync(skills)) walk(skills);

const template = path.join(root, 'CLAUDE.md.template');
if (!fs.existsSync(template)) {
  console.error('missing CLAUDE.md.template');
  process.exit(1);
}
fs.writeFileSync(
  path.join(root, 'CLAUDE.md'),
  fs.readFileSync(template, 'utf8').replaceAll('<NAME_PLACEHOLDER>', name)
);
console.log('wrote CLAUDE.md');

let changed = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const out = src.replaceAll('<NAME_PLACEHOLDER>', name);
  if (out !== src) {
    fs.writeFileSync(f, out);
    console.log(`updated ${path.relative(root, f)}`);
    changed++;
  }
}
if (changed) console.log(`${changed} skill file(s) updated`);
