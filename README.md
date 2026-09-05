# Cairn

My AI-assisted software engineering setup: a Claude Code plugin, plus the
operating agreement I load into every session.

## Why

Agents fail most often at alignment. You think yours understood you; then you
read what it built and discover it never did.

Cairn attacks that where the misunderstanding starts. It interviews you before
it writes anything, and records what you settle while you still remember why.

Design is only the first stage. This repo will grow to cover the whole
development lifecycle, one stage at a time — which is what the name promises. A
cairn goes up one stone at a time, and every stone marks the trail for whoever
walks it next.

## Install

```sh
claude plugin marketplace add michellepellon/cairn
claude plugin install cairn
```

Start a design session with `/cairn:brainstorm`.

## Skills

| Skill | What it does |
|---|---|
| `cairn:brainstorm` | Runs the other three together. Start here. |
| `cairn:grilling` | Interviews you in rounds over a design tree, asking every question whose prerequisites are settled, each with a recommended answer. |
| `cairn:domain-modeling` | Challenges your vocabulary, stress-tests it against concrete scenarios, and writes `CONTEXT.md` and ADRs as decisions land. |
| `cairn:writing` | Strunk's *Elements of Style*, applied to everything the others produce. |

`brainstorm` is slash-only; the rest also fire on their own when relevant.

## Operating agreement

Plugins ship skills, commands, agents, and hooks — never always-on context. So
this half is a manual copy, once per machine:

```sh
cat claude-md/operating-agreement.md >> ~/.claude/CLAUDE.md
```

Write your own preamble above it. `claude-md/personal-preamble.example.md` shows
what belongs there. Mine asserts a working relationship that is mine, not yours,
so rewrite it rather than paste it.

## Development

Symlink the plugin into your skills directory and it loads next session as
`cairn@skills-dir`, with no install step:

```sh
ln -s "$PWD/plugins/cairn" ~/.claude/skills/cairn
```

Run what CI runs before you push:

```sh
claude plugin validate . --strict
claude plugin validate ./plugins/cairn --strict
node scripts/check-skills.mjs
```

`validate` catches malformed manifests and unparseable frontmatter — a skill
whose frontmatter fails to parse loads with empty metadata, silently. It ignores
name/directory mismatches, broken links, and version drift between `plugin.json`
and the marketplace entry. `check-skills.mjs` covers those.
