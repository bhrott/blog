---
layout: post
title:  "Five Secrets-Management Mistakes I Find in Every Codebase"
date:   2026-07-27 17:10:00 -0300
categories: appsec devsecops
tags: [secrets, devsecops, vault]
description: >-
  Five secrets-management mistakes in nearly every codebase: keys in git
  history, .env files baked into images, shared credentials, no rotation.
---
Every team says they take secrets seriously. Then you `git log -p` for the word
"password" and find the API key someone committed in 2021, rotated never. Here
are the five failures I see on repeat.

<!--more-->

1. **Secrets in git history.** Rotating the key is not enough; the old one lives
   in every clone forever. Scrub the history *and* rotate.
2. **`.env` files in the image.** They end up in `docker history`. Use runtime
   injection.
3. **One secret to rule them all.** Shared credentials mean shared blast radius.
4. **No rotation.** A secret you cannot rotate in a hurry is a liability.
5. **Logging the secret.** Debug logs are the most-read exfil channel there is.

A secrets manager fixes maybe three of these. The other two are discipline.
