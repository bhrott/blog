---
layout: post
title:  "ToolName: What It Does and How to Use It"
date:   YYYY-MM-DD HH:MM:00 -0300
categories: appsec devsecops
tags: [tools, topic]
description: >-
  What the tool does, who it is for, and the commands you will use most.
---
Two to three short paragraphs: the problem the tool solves and who should use
it. No feature list here.

<!--more-->

## Links

- **Official site:** [toolname.dev](https://example.com)
- **Source code:** [github.com/org/tool](https://github.com/org/tool)
- **Docs:** [Documentation](https://example.com/docs)

## Install

```bash
# The recommended install method from the official docs.
brew install toolname
```

## Most common usage

### 1. The first thing everyone does with it

```bash
toolname scan ./my-project
```

Example output (trimmed):

```text
[HIGH] Hardcoded secret in config/settings.py:12
[MED]  Outdated dependency: requests 2.19.0
2 findings
```

One or two sentences on how to read the output and what to do next.

### 2. The second most common task

Same pattern: command, trimmed output, how to read it.

## Other useful actions

### Run it in CI

```yaml
# .github/workflows/scan.yml
- run: toolname scan . --fail-on high
```

### A useful flag or config

Short explanation and example.

## My take

When to use it, where it falls short, and alternatives worth knowing.

## References

- [Reference title](https://example.com)
