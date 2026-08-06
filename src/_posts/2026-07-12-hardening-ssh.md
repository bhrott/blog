---
layout: post
title:  "Hardening SSH Beyond Disabling Root Login"
date:   2026-07-12 08:20:00 -0300
categories: defense hardening
tags: [ssh, blue-team, hardening]
description: >-
  SSH hardening beyond disabling root login: key-only auth, an SSH CA instead of
  authorized_keys, AllowGroups, modern ciphers, and a bastion in front of it all.
---
"Disable root login and use keys" is where most SSH hardening guides stop. That
is table stakes. If SSH is your front door to production, it deserves more than
two lines in a setup script.

<!--more-->

The changes that actually move the needle:

- **Key-only auth**: `PasswordAuthentication no`. No password, no brute force.
- **Principals, not keys**: use an SSH CA so you rotate access without touching
  `authorized_keys` on every host.
- **Restrict who and where**: `AllowGroups`, and bind to a management interface.
- **Modern crypto only**: drop legacy ciphers and MACs.

Then put the whole thing behind a bastion and log every session. Defense is
about removing options from the attacker, one line of config at a time.
