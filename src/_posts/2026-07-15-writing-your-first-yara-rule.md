---
layout: post
title:  "Writing Your First YARA Rule That Isn't Garbage"
date:   2026-07-15 13:00:00 -0300
categories: blue-team threat-hunting
tags: [yara, detection, malware]
---
YARA rules are easy to write and hard to write *well*. A rule that matches your
one sample is trivial; a rule that catches the family without lighting up on
every benign file is the actual skill.

<!--more-->

The anatomy is simple:

```
rule Suspicious_Downloader
{
    strings:
        $ua  = "Mozilla/4.0 (compatible; MSIE 6.0)"
        $c2  = { 68 74 74 70 3A 2F 2F }  // "http://"
    condition:
        $ua and $c2
}
```

The trap is over-fitting to strings that any packer will scramble. Anchor on
*behavioural* artifacts — mutex names, hardcoded config keys, unusual import
combinations — not on a byte sequence the next build will change.
