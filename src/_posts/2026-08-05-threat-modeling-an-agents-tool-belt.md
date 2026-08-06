---
layout: post
title:  "Threat Modeling an Agent's Tool Belt"
date:   2026-08-05 09:30:00 -0300
categories: ai-security agents
tags: [agents, mcp, least-privilege]
description: >-
  An agent's real attack surface is its tools. Classify each one by reach and
  reversibility, then sandbox, allow-list egress, and gate what cannot be undone.
---
Everyone wants to threat model the model. Wrong altitude. The model is a text
generator that has never touched your infrastructure. What touched it was the
`bash` tool you handed over three sprints ago.

An agent's attack surface is exactly the union of its tools' capabilities. Nothing
more, and — this is the part teams forget — nothing less, including the
capabilities that emerge only when two innocuous tools are combined.

<!--more-->

## Classify every tool on two axes

Before adding a tool, place it on this grid. It takes thirty seconds and it
decides everything downstream.

| | **Reversible** | **Irreversible** |
|---|---|---|
| **Local reach** | read a file, run a test | delete a file, `git push --force` |
| **External reach** | fetch a public URL | send email, charge a card, deploy |

The top-left quadrant can run unattended. The bottom-right needs a human, every
time, no exceptions, no "remember my choice for this session."

The dangerous quadrant is top-right: reversible but externally reaching. A
`fetch` tool looks harmless — it only *reads*, after all — until you notice that
the URL it reads is attacker-chosen and the query string can carry whatever the
model just learned. Any tool that makes an outbound request is an exfiltration
tool. Classify it that way.

## Composition creates capabilities nobody granted

Tools are not independent. Reason about them as a set:

- `read_file` + `http_fetch` = arbitrary local file exfiltration.
- `list_env` + anything outbound = credential theft.
- `write_file` scoped to the repo + a CI pipeline on push = remote code
  execution, on a delay.

That last one is worth sitting with. An agent restricted to editing files in one
repository has, transitively, the privileges of your build system — which, per
the CI post, holds every secret you own. "It can only edit files" is not a
boundary if something downstream executes those files.

## Sandbox at the OS, not in the prompt

`Only modify files under /workspace` is a wish. Make it a property of the
environment instead: run the agent in a container with the workspace as its only
writable mount, no host network, and a proxy that enforces an egress allow-list.

```yaml
# The parts that actually constrain the agent.
services:
  agent:
    image: agent-runtime:pinned-sha
    read_only: true                    # rootfs immutable
    tmpfs: [/tmp]
    cap_drop: [ALL]
    security_opt: [no-new-privileges:true]
    volumes:
      - ./workspace:/workspace:rw      # the only writable path
    networks: [egress-proxy]           # no direct internet
    environment:
      HTTPS_PROXY: http://egress-proxy:3128
```

Everything the agent can reach is now enumerable by reading a config file, not
by reasoning about what a model might decide to do. That is the difference
between a control and a preference.

## Third-party tool servers are dependencies

An MCP server you install is code running with your agent's privileges, holding
whatever token you configured it with. It deserves the same scrutiny as any
other dependency, plus one concern that is specific to this ecosystem: **the
tool descriptions themselves enter the model's context.** A malicious server can
put instructions in a tool's description field, and the agent reads them as
authoritative.

Before wiring one up:

- Pin the version. A tool definition that changes silently is an injection
  vector with a delivery mechanism.
- Read the tool descriptions, not just the README. That text is prompt input.
- Give it a scoped token. A GitHub MCP server that only needs issues should not
  hold a PAT with `repo` and `workflow`.
- Assume anything it returns is untrusted content, because it is.

## Log the tool calls, not the conversation

When something goes wrong, the transcript tells you what the agent said. The
tool call log tells you what it *did*. Record, for every invocation: the tool,
the full arguments, the caller identity, the timestamp, and whether a human
approved it.

That log is your incident timeline, your abuse detector, and — the underrated
one — your least-privilege audit. Nine tools granted and three ever called is a
question worth asking at the end of every month.

Give the agent the smallest tool belt that lets it finish the job, make the
irreversible entries ask permission, and put a wall around the rest that does
not depend on anyone being persuasive.
