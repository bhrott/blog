---
layout: post
title:  "The OWASP Top 10 as It Actually Shows Up in Pentests"
date:   2026-07-18 10:40:00 -0300
categories: web appsec
tags: [owasp, web, methodology]
---
The OWASP Top 10 is a great awareness document and a mediocre testing
methodology. After enough assessments you notice the list does not match the
frequency of what you actually find.

<!--more-->

In practice, the categories that pay the bills:

1. **Broken Access Control** — IDORs and missing authorization checks, by a
   wide margin the most common serious finding.
2. **Injection** — less SQLi than it used to be, more template and NoSQL.
3. **Security Misconfiguration** — verbose errors, default creds, open buckets.

Cryptographic failures and SSRF round out the list, but if you only had time to
test one thing, it would be access control. Nobody writes authorization tests,
so nobody's authorization actually works.
