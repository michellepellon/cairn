#!/usr/bin/env node
// Repo checks that `claude plugin validate --strict` does not cover:
// skill name/directory agreement, relative links, and manifest version drift.
// `claude plugin validate` still owns YAML parsing; this deliberately does not.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

const marketplace = JSON.parse(
  readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8')
);

for (const entry of marketplace.plugins) {
  if (typeof entry.source !== 'string') continue; // externally hosted, not ours to check
  const pluginDir = join(root, entry.source);
  const manifestPath = join(pluginDir, '.claude-plugin/plugin.json');

  if (!existsSync(manifestPath)) {
    fail(entry.source, `marketplace entry "${entry.name}" has no plugin.json`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  // `claude plugin tag` refuses to cut a release when these disagree.
  if (manifest.name !== entry.name)
    fail(manifestPath, `name "${manifest.name}" != marketplace entry "${entry.name}"`);
  if (manifest.version !== entry.version)
    fail(manifestPath, `version "${manifest.version}" != marketplace entry "${entry.version}"`);

  const skillsDir = join(pluginDir, 'skills');
  if (!existsSync(skillsDir)) continue;

  for (const skill of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!skill.isDirectory()) continue;
    const skillPath = join(skillsDir, skill.name, 'SKILL.md');
    if (!existsSync(skillPath)) {
      fail(join(entry.source, 'skills', skill.name), 'missing SKILL.md');
      continue;
    }
    const text = readFileSync(skillPath, 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) {
      fail(skillPath, 'missing YAML frontmatter');
      continue;
    }
    // Only the `name` scalar is read here; full parsing is validate's job.
    const name = fm[1].match(/^name:[ \t]*(\S+)[ \t]*$/m)?.[1];
    if (!name) fail(skillPath, 'frontmatter has no single-line `name`');
    else if (name !== skill.name)
      fail(skillPath, `name "${name}" != directory "${skill.name}"`);
  }

  // Relative links in every markdown file under the plugin must resolve.
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) {
        const md = readFileSync(p, 'utf8');
        for (const [, target] of md.matchAll(/\]\((\.\/[^)#]+)\)/g)) {
          // Format docs illustrate paths in a consumer's repo; those are examples.
          if (target.startsWith('./src/')) continue;
          if (!existsSync(join(dirname(p), target)))
            fail(p, `broken relative link -> ${target}`);
        }
      }
    }
  };
  walk(pluginDir);
}

if (errors.length) {
  console.error(`✘ ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ❯ ${e.replace(root + '/', '')}`);
  process.exit(1);
}
console.log('✔ skill checks passed');
