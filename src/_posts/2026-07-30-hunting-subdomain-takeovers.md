---
layout: post
title:  "Hunting Subdomain Takeovers With a 40-Line Script"
date:   2026-07-30 09:15:00 -0300
categories: recon
tags: [dns, recon, bugbounty]
---
A subdomain takeover happens when DNS still points somewhere the organization no
longer controls. The CNAME survives; the bucket, the app, the CDN distribution
behind it does not. Anyone who claims that dangling target now serves content on
a hostname your users still trust.

The scary part is how cheap this is to find at scale.

<!--more-->

## Why dangling records survive

Teams spin up a staging app on a PaaS, point `staging.example.com` at it, ship
the feature, and delete the app. Nobody deletes the DNS record, because DNS lives
in a different console, owned by a different team, behind a different ticket
queue.

> The vulnerability is not technical debt. It is organizational debt that happens
> to be expressed in a zone file.

## Finding the candidates

Pull every record, then keep only the ones whose target does not resolve:

```bash
#!/usr/bin/env bash
set -euo pipefail

domain="$1"

# Enumerate from certificate transparency, dedupe, then check each CNAME.
curl -s "https://crt.sh/?q=%25.${domain}&output=json" \
  | jq -r '.[].name_value' \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/^\*\.//' \
  | sort -u \
  | while read -r host; do
      target=$(dig +short CNAME "$host" | head -1)
      [ -z "$target" ] && continue

      if ! dig +short "$target" | grep -q .; then
        printf '[DANGLING] %-45s -> %s\n' "$host" "$target"
      fi
    done
```

## Confirming without claiming

A non-resolving CNAME is a candidate, not a finding. Confirm by fingerprinting
the error the provider returns:

| Provider | Fingerprint | Claimable |
|---|---|---|
| S