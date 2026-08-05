---
layout: post
title:  "The Linux Privilege Escalation Checklist I Actually Use"
date:   2026-07-10 16:45:00 -0300
categories: post-exploitation linux
tags: [privesc, linux, enumeration]
---
You have a shell. It is `www-data`. Now what? Automated tools like `linpeas`
are great, but knowing what they check makes you faster and quieter when they
are not an option.

<!--more-->

My manual first pass, in order:

```bash
id; sudo -l                 # easy wins live here
find / -perm -4000 2>/dev/null   # SUID binaries
cat /etc/crontab; ls -la /etc/cron.*
uname -a                    # kernel exploits, last resort
```

`sudo -l` alone solves more boxes than any kernel exploit. Misconfigured sudo
rules, writable cron scripts, and SUID binaries with GTFOBins entries are where
the real escalations hide. Reach for kernel exploits last: they are loud and
they crash things.
