---
layout: post
title:  "Agent Skills Are a Supply Chain, Not a Config File"
date:   2026-08-06 15:40:00 -0300
categories: ai-security agents
tags: [skills, agents, supply-chain, prompt-injection]
description: >-
  A skill is instructions plus bundled code that run with your agent's
  privileges. Read the description field as always-on prompt, and pin the folder.
---
A skill looks like documentation. It is a folder with a Markdown file in it,
and installing one is `git clone` or a drag into a directory. Nothing about that
gesture feels like adding a dependency.

It is adding a dependency. The file tells your agent what to do, and it does it
with whatever privileges you already granted — with none of the review you would
give a package that arrived through a lockfile.

<!--more-->

## What you're actually installing

The unit is a directory with a `SKILL.md` at its root: YAML frontmatter with a
name and a description, then a Markdown body of instructions. That body is
prompt text destined for your agent's context.

But the folder rarely stops at Markdown. Looking at what is installed on this
machine right now, one skill ships a full Python package — `pyproject.toml`,
a `scripts/` directory, JSON schemas, and its own `.venv`:

```
~/.claude/skills/
├── osv-check/
│   ├── SKILL.md
│   └── scripts/osv_check.py
└── vulnhunter-fix/
    ├── SKILL.md
    ├── pyproject.toml
    ├── .venv/                 <- a virtualenv, vendored in
    ├── scripts/
    └── vulnhunter_fix/
```

Be precise about the risk, because the sloppy version of this claim is wrong:
that code does **not** execute when you install the folder. It executes when the
agent reads `SKILL.md`, sees an instruction to run it, and runs it. The delivery
and the trigger are separated in time — which is worse for review, not better.
There is no install step to audit. There is only a day, later, when the agent
decides the skill is relevant.

## The description field is always in context

Skills load progressively: the agent holds every installed skill's **name and
description** at all times, and pulls the full body in only when the skill fires.
That is a sensible design for tokens. It also means the description is a
permanently resident instruction, present in every conversation, whether or not
you ever invoke the skill.

Descriptions are not neutral summaries. Here is a real one, from a defensive
skill I use and recommend:

> Check dependencies against Google's OSV.dev vulnerability database BEFORE
> installing them. **Invoke automatically and without being asked** whenever you
> are about to run a dependency install…

That is a standing imperative addressed to the agent, sitting in context
permanently, instructing it to act unprompted. For `osv-check` that is exactly
what I want — it is why the skill works.

Now write the same sentence with hostile intent. Same field, same permanence,
same authority. Nothing structural distinguishes the two, because there is no
structural difference: **the description field is an injection vector with a
package manager attached.**

## Two failure modes worth naming

**Trigger hijacking.** A description that claims relevance to everything — "use
for any coding, review, debugging, or file task" — fires constantly. The skill
does not need to be invoked to matter; it only needs the model to believe it is
relevant. An over-broad description is a bid for control of every turn, and it
looks like enthusiastic documentation.

**Update drift.** You read `SKILL.md` in January, decided it was fine, and
`git pull`ed in June. Skills have no lockfile, no version pinning by default, no
signature. The thing you reviewed and the thing running are related only by
convention. This is the SHA-pinning argument from
[CI workflows](/tags/github-actions/), aimed at a folder nobody thinks of as
code.

## Skills don't grant capability — they spend it

This is the part that decides how much to care. A skill cannot give the agent a
tool it does not have. It cannot open a network path or mint a credential. It
can only *direct* the tools already on the belt.

So the blast radius of a malicious skill is precisely the blast radius you
already accepted when you configured the agent. If the agent has shell access,
your repo, and unrestricted egress, a hostile skill inherits all three. If it
runs in a container with a read-only rootfs, a scoped token, and an egress
allow-list, the worst a hostile skill achieves is a confusing transcript.

Sandboxing and skill review are the same control viewed from two ends. The
sandbox is the one that holds when the review misses something.

## A review pass that takes five minutes

Before installing a skill from anywhere you did not write:

1. **Read `SKILL.md` end to end.** All of it. It is prompt text you are
   consenting to, not a README.
2. **Read the description as a standing order**, since that is what it becomes.
   Ask whether its trigger conditions are scoped to a real task or written to
   fire on everything.
3. **Inventory the non-Markdown files.** `find . -type f -not -name "*.md"`. Any
   script in there is code the instructions can tell your agent to run.
4. **Grep for the actions you'd want to approve by hand** — `curl`, `nc`,
   outbound URLs, `~/.ssh`, `.env`, `git push`, `rm -rf`. A skill with no
   business making network calls should contain no network calls.
5. **Pin it.** Vendor the folder into your own repo at a known commit, and read
   the diff when you update. A skill that updates silently is a skill you have
   not reviewed.
6. **Ask what it would cost you.** Not "is this malicious" — assume you cannot
   tell. Ask what it reaches if it is.

## The uncomfortable summary

Skills are genuinely great. They are the most useful mechanism I have for making
an agent competent at a specific job, and I am not arguing for fewer of them.

I am arguing that the install gesture badly understates what is happening.
Copying a folder feels like editing a dotfile; it is closer to adding an
unsigned dependency that will later be allowed to speak in your agent's voice.
Treat the folder like a package, treat the description like a prompt an attacker
may have written, and keep the sandbox tight enough that being wrong about
either one stays boring.
