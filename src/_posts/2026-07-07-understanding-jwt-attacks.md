---
layout: post
title:  "Understanding JWT Attacks (and Why alg:none Still Works)"
date:   2026-07-07 11:15:00 -0300
categories: web appsec
tags: [jwt, auth, tokens]
description: >-
  How JWT attacks work: alg none, RS256 to HS256 confusion, and crackable HMAC
  secrets — and why pinning the algorithm server-side stops all three.
---
JSON Web Tokens are everywhere, and so are the ways to abuse them. The classic
`alg: none` bypass is a decade old and yet I still find it in production auth
flows every year.

<!--more-->

The core issue is that the token tells the server how to verify it. If the
server trusts the `alg` header blindly, an attacker can simply change it.

The usual suspects:

- **`alg: none`** — strip the signature, set the algorithm to none, walk in.
- **RS256 → HS256 confusion** — sign with the public key as an HMAC secret.
- **Weak HMAC secrets** — crack `HS256` tokens offline with a wordlist.

The fix is boring and effective: pin the expected algorithm server-side and
never let the token dictate its own verification.
