---
layout: post
title:  "Your CI Pipeline Is the Softest Target You Own"
date:   2026-08-01 08:45:00 -0300
categories: devsecops ci
tags: [supply-chain, github-actions, oidc]
description: >-
  CI runners hold every secret and nobody threat models them. Pin your actions,
  understand pull_request_target, and trade long-lived cloud keys for OIDC.
---
Your production database has a WAF, an audit log, and a quarterly review. Your CI
runner has a copy of the credentials to it, executes arbitrary code from every
branch, and has never once been threat modeled.

Attackers noticed this asymmetry years ago. Build systems are where the secrets
are, and unlike production, nobody is watching them.

<!--more-->

## The trust boundary everyone draws in the wrong place

The mental model most teams carry is "CI runs our code." It does not. CI runs
whatever the workflow file says to run, in an environment holding every secret
that workflow can reach, triggered by events that outsiders can sometimes cause.

Three of those inputs are attacker-influenced more often than people expect:

1. **The code on the branch**, including the workflow file itself on forks.
2. **The dependency tree**, whose install scripts run before your tests do.
3. **The third-party actions** you pinned to a mutable tag.

## `pull_request_target` is a loaded gun

GitHub gives you two events for pull requests, and the dangerous one is the one
people reach for when they want a bot comment to work on forks:

| Event | Checks out | Has secrets | Safe with fork PRs |
|---|---|---|---|
| `pull_request` | fork's code | no | yes |
| `pull_request_target` | base repo's code | **yes** | only if you don't check out the fork |

The trap is combining `pull_request_target` with an explicit checkout of the
PR head. That single combination hands a stranger's code your full secret
context:

```yaml
# DANGEROUS — arbitrary fork code, running with repository secrets.
on: pull_request_target

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}   # <-- attacker's code
      - run: npm ci && npm test                            # <-- their scripts
```

`npm ci` alone is enough. A `preinstall` script in the fork's `package.json`
runs before a single test does, with `secrets` in the environment.

If you need privileged work on fork PRs, split it: an unprivileged workflow
builds and uploads an artifact, a separate `workflow_run` job consumes it
without ever executing fork code.

## Unpinned actions are unsigned code

`uses: some-org/some-action@v3` is a *tag*, and tags move. Whoever controls that
repository — or whoever compromises the maintainer's account — can repoint `v3`
at new code that runs inside your runner tomorrow. Pin the commit:

```yaml
# The tag is a comment. The SHA is the contract.
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

Let Dependabot bump the SHAs so this stays maintainable. The point is not that
you never update — it is that updating is a reviewed commit rather than
something that happens to you overnight.

## Stop storing cloud keys entirely

The best fix for a leaked long-lived AWS key is not rotating it faster. It is
not having one. OIDC federation lets the runner exchange a short-lived,
workflow-scoped token for cloud credentials that expire in minutes:

```yaml
permissions:
  id-token: write     # required to mint the OIDC token
  contents: read      # everything else stays read-only

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::111122223333:role/deploy
      aws-region: us-east-1
```

Then constrain the trust policy on the IAM side so only the branch you actually
deploy from can assume the role:

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:sub":
      "repo:acme/api:ref:refs/heads/main"
  }
}
```

Get that `sub` condition wrong — a wildcard, or omitting it — and any repository
on GitHub can assume your role. It is the single most important line in the
setup, and the one most often copy-pasted loosely.

## A pipeline hardening pass that takes an afternoon

- Set `permissions: contents: read` at the top of every workflow; grant more
  per-job, never globally.
- Pin every third-party action to a full commit SHA.
- Audit every `pull_request_target` and `workflow_run` workflow for a fork
  checkout.
- Replace static cloud keys with OIDC, with a `sub` condition on branch.
- Treat `secrets` in a job as a declaration that the job runs trusted code only.
- Turn on branch protection for the workflow files themselves. A PR that edits
  `.github/workflows/` deserves a human.

None of this is exotic. It is the same least-privilege reasoning you already
apply to production — pointed at the machine that builds production.
