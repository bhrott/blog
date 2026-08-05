---
layout: post
title:  "A Sane Burp Suite Workflow for Web App Testing"
date:   2026-07-04 14:30:00 -0300
categories: web appsec
tags: [burp, proxy, web]
---
Burp Suite does everything, which is exactly the problem. Opening it with no
plan means an hour of clicking before you have tested a single thing. Here is the
loop I actually use on every web assessment.

<!--more-->

Scope first, always. Set the target scope before you touch the browser so the
proxy history stays clean and Repeater does not drown in third-party noise.

Then it is a tight cycle:

1. **Browse** the app like a real user to populate the site map.
2. **Triage** interesting requests into Repeater.
3. **Mutate** parameters by hand before reaching for Intruder.
4. **Automate** only the repetitive parts.

The mistake juniors make is jumping straight to Intruder. Understanding one
request deeply beats blasting a thousand payloads you cannot interpret.
