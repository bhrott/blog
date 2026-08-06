---
layout: post
title:  "Recon Fundamentals: Getting the Most Out of Nmap"
date:   2026-07-01 09:00:00 -0300
categories: recon tooling
tags: [nmap, scanning, enumeration]
description: >-
  Nmap recon past the default scan: an -sn sweep for live hosts, a top-1000 SYN
  scan for the surface, then deep version detection on what matters.
---
Every engagement starts the same way: you have a scope and almost no context.
Nmap is still the fastest way to turn a list of hosts into an actual picture of
the attack surface, but most people never move past `nmap -sV target`.

<!--more-->

Start broad, then go deep. A quick `-sn` sweep tells you what is alive; a
top-1000 SYN scan tells you where to look; and `-sV --version-intensity 9` on the
handful of interesting ports tells you what you are actually dealing with.

```bash
# Alive hosts, no port scan
nmap -sn 10.10.0.0/24 -oG alive.gnmap

# Service + default scripts on the survivors
nmap -sV -sC -p- --min-rate 2000 10.10.0.42 -oA full-42
```

Save everything with `-oA`. Future-you, three hosts deep and out of coffee, will
be grateful for the greppable output.
