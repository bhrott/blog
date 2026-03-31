---
date: 2026-03-31 07:20
tags:
    - axios
    - supply-chain
    - security
author: ben-hur
---

# Axios Compromised

Axios has been compromised. Versions 1.14.1 and 0.30.4 are malicious and inject a dependency on plain-crypto-js@4.2.1. Look for these versions and remove this dependency.

- Axios: https://security.snyk.io/vuln/SNYK-JS-AXIOS-15850650
- Plain-crypto-js: https://security.snyk.io/vuln/SNYK-JS-PLAINCRYPTOJS-15850652

Snyk Blog Post: https://snyk.io/pt-BR/blog/axios-npm-package-compromised-supply-chain-attack-delivers-cross-platform/


<iframe class="youtube-video" src="https://www.youtube.com/embed/kfc3pA2V_ZM" title="NPM Supply Chain" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>