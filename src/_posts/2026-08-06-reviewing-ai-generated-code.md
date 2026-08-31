---
layout: post
title:  "Reviewing AI-Generated Code Without Rubber-Stamping It"
date:   2026-08-06 11:00:00 -0300
categories: devsecops ai-security
tags: [code-review, sdlc, agents]
description: >-
  AI-generated code fails in a specific shape: plausible, conventional, and
  wrong at the boundaries. Review for trust, taste, and hallucinated packages.
---
The uncomfortable thing about reviewing AI-generated code is that it looks
right. Consistent naming, sensible structure, a docstring on every function. It
reads like code written by someone competent and slightly bored — which is
exactly the reading posture it induces in the reviewer.

Human code announces its risky parts. It has a weird variable name, a commented-
out block, a function that grew to two hundred lines. AI code is uniformly
polished, so your attention has nothing to snag on. The bug is in there wearing
the same clean shirt as everything else.

<!--more-->

## The failure shape

Generated code is fluent about the happy path and vague at the boundaries,
because boundaries are where context lives and context is what the model was
missing. In practice, the recurring defects cluster:

- **Trust boundaries collapse.** Input validated at one layer, then trusted at
  the next, because the model saw both layers as "our code."
- **Error handling that swallows.** A `try/except` that logs and continues,
  turning a failed authorization check into a successful request.
- **Concurrency assumed away.** Check-then-act on a shared resource, correct in
  the single-request test that came with it.
- **The convention is followed, the requirement is not.** It matched your
  codebase's pattern for pagination and quietly dropped the tenant filter that
  the pattern usually carries.

None of these are exotic. They are the same bugs juniors write. The difference
is volume and the absence of a nervous author who says "I wasn't sure about this
part" in the PR description.

## Check the imports first

The cheapest high-value check takes ten seconds. Read the import block and ask
whether every one of those packages exists and is the one you meant.

Models invent plausible package names, and attackers register them — slopsquatting,
the supply-chain attack where the typo is generated rather than typed. Unlike a
human typo, a hallucinated name is *reproducible*: the same wrong package gets
suggested to many developers, which makes squatting it worth an attacker's time.

```bash
# Anything imported but not declared is a question, not a detail.
comm -13 <(jq -r '.dependencies|keys[]' package.json | sort) \
         <(grep -rhoP "from '\K[^'./][^']*" src/ | cut -d/ -f1 | sort -u)
```

Then confirm the survivors are real: check the registry, the repository link,
the download count, the publish date. A package that appeared last month with
forty downloads and no source repository is not a dependency, it is an incident.

## Read it as a diff against intent

Standard review asks "is this code correct?" For generated code, ask a sharper
question: **"what did the author not know?"**

The model did not know your tenancy model, your idempotency requirements, which
of those two similarly-named helpers is deprecated, or that the `user_id` in
that table is the *impersonating* user. Every one of those gaps produces code
that passes review-by-reading and fails in production.

So review the boundaries specifically:

1. Where does untrusted input enter, and where is it first trusted?
2. What happens on the second call with the same arguments?
3. What does this do when the dependency it calls returns an error?
4. Which authorization check does the surrounding code usually carry that this
   one does not?

## Make the machine check the mechanical parts

Reviewer attention is the scarce resource, and it should not be spent on things
a linter can decide. Before a human reads the diff, CI should have already
enforced:

- Dependency review on the lockfile diff, failing on new packages entirely —
  a new dependency should be a deliberate, human-argued change.
- SAST on the changed files, with the taint rules that matter to your app.
- Secret scanning, because generated example configs love a placeholder that
  turns out to be a real key someone pasted.
- Your two-identity access-control tests, which is the layer that catches the
  dropped tenant filter no static rule will notice.

That is the same pipeline you would want anyway. Generated code just raises the
volume enough that "we'll catch it in review" stops being a plan.

## The honest position

I write a lot of code with agents and I would not go back. The productivity is
real. So is the fact that it moves work from *writing* to *verifying*, and
verifying is the part teams are worst at staffing.

Treat the output like a pull request from a fast, well-read contractor who has
never seen your production incidents: worth merging often, never worth merging
unread. The review standard does not change because the author is a machine. If
anything, it has to get more explicit — the machine will not tell you which part
it was unsure about.
