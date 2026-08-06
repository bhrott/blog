---
layout: post
title:  "Threat Modeling for Developers Who Hate Meetings"
date:   2026-07-24 09:50:00 -0300
categories: appsec process
tags: [threat-modeling, sdlc, design]
description: >-
  A twenty-minute threat model developers can run themselves: four questions, a
  data-flow sketch, STRIDE as a prompt, and mitigations that live with the spec.
---
Threat modeling has a branding problem. Say the words and developers picture a
three-hour whiteboard session with a security team that has never read the code.
It does not have to be that. You can do a useful pass in twenty minutes.

<!--more-->

The whole exercise fits in four questions, straight from the Threat Modeling
Manifesto:

1. **What are we building?** A quick data-flow sketch, not a UML thesis.
2. **What can go wrong?** Walk the flows with STRIDE as a prompt.
3. **What are we going to do about it?** Concrete mitigations, ranked.
4. **Did we do a good job?** Revisit when the design changes.

Do it at design time, per feature, in the same doc as the spec. A threat model
that lives next to the code gets updated. One that lives in a wiki dies there.
