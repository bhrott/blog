---
name: write-post
description: Write a new blog post for this Jekyll site (src/_posts). Use when the user asks to write, draft, or create a post — including YouTube video posts, posts about a vulnerability or attack technique, and tool review posts.
---

# Write a blog post

Posts are Jekyll Markdown files in `src/_posts/`. Read one or two recent posts
before writing so the new one matches the voice and formatting.

## 1. Get the inputs

Before writing, make sure you know:

- **Post type**: `video`, `vulnerability` (vulnerability / attack technique),
  `tool-review`, or `general`. Infer it from the request; ask only if unclear.
- **Topic** and the main point the reader should leave with.
- **Video posts**: the YouTube video ID (the `v=` value, not the full URL) and
  the video title. Ask if missing — never invent an ID.
- **Tool reviews**: the tool name and its official site/repo. Look it up and
  confirm the links and commands against the official docs — never guess flags.

## 2. Create the file

- Path: `src/_posts/YYYY-MM-DD-short-kebab-slug.md`, using today's date.
- Front matter (same shape as every existing post):

```yaml
---
layout: post
title:  "Short, Direct Title"
date:   YYYY-MM-DD HH:MM:00 -0300
categories: appsec web
tags: [tag-one, tag-two]
description: >-
  One or two sentences, under ~160 characters. Says what the reader learns.
  Used for SEO and link previews.
---
```

- `categories`: space-separated, 1–2 values. Reuse existing ones first:
  `appsec`, `web`, `devsecops`, `ci`, `ai-security`, `agents`.
- `tags`: 2–4 lowercase kebab-case tags. Reuse existing tags so the tag archive
  pages stay useful — list them with:
  `grep -h '^tags:' src/_posts/*.md`
- Add `talk` to tags for video posts and `tools` for tool reviews.

## 3. Formatting rules

- **Always put `<!--more-->` in the post.** Everything above it is the excerpt on
  the home page (the "read more" split). Without it, the whole post shows up on
  the home page.
- Do not add an `# H1` — the layout renders the title. Use `##` for sections,
  `###` rarely.
- Wrap prose at ~80 columns, like the existing posts.
- Code blocks always get a language (` ```bash `, ` ```python `, ` ```http `).
  Put short comments in the code to explain what matters.
- Use tables for comparisons and `> blockquotes` for one key takeaway.
- Links: plain Markdown `[text](https://...)`. Do not add `target="_blank"` —
  `src/_plugins/external_links.rb` does it for every off-site link.
- In attack examples use fake hosts and identities: `attacker.example`,
  `acme.test`, `alice`, `mallory`. Never target real companies or people.

## 4. Writing style

The reader is a developer or a junior security engineer. They should understand
every paragraph on the first read.

- **Easy language.** Short sentences. Common words. Avoid idioms and wordplay
  that a non-native English reader could miss.
- **Explain jargon the first time.** "IDOR (Insecure Direct Object Reference —
  when you can access another user's data just by changing an ID)".
- **Direct to the point.** Open with the problem in 2–4 short paragraphs. No
  long intros, no history lessons, no filler like "In today's world…".
- **Show, don't describe.** A request, a command, or a code snippet beats a
  paragraph of explanation.
- **One idea per section.** If a section needs a long explanation, split it.
- **End with something actionable**: a checklist, the fix, or the one thing to
  remember. No generic "stay safe" conclusion.
- Keep it short. Most posts should be 600–1200 words. Cut anything that does not
  help the reader understand or act.

## 5. Structure by post type

Use the matching template in `templates/` as the skeleton:

| Type | Template | Required parts |
|---|---|---|
| YouTube video | `templates/video.md` | Short text → video → `<!--more-->` → rest |
| Vulnerability / attack technique | `templates/vulnerability.md` | How it works, real-world attack walkthrough, technical impact, business impact, fix |
| Tool review | `templates/tool-review.md` | Links, most common usage with examples and output first, then other useful actions, references |
| General | `templates/general.md` | Problem → explanation → what to do |

### YouTube video posts

- 2–4 short paragraphs above the video: what the video is about and why it
  matters. That is the whole excerpt.
- Then the video include, then `<!--more-->`, then the rest (key points,
  timestamps if useful, references).
- Include syntax — `id` is the YouTube ID, `title` is the video title (it is the
  iframe's accessible name, so it is required):

```liquid
{% include video.html id="z0_nuioScFY" title="AI-Native SDLC: e agora AppSec?" %}
```

### Vulnerability and attack technique posts

- Must include a **realistic attack walkthrough**: a concrete app (e.g. an
  invoicing SaaS, an e-commerce checkout, a CI pipeline), the attacker's steps
  in order, and the actual requests/payloads/commands at each step.
- Must state the **impact twice**:
  - **Technical impact** — what the attacker gets: data read, account takeover,
    code execution, lateral movement.
  - **Business impact** — what it costs the company: data breach notification,
    LGPD/GDPR fines, fraud losses, downtime, customer trust, compliance findings.
- When a public incident or CVE is a good example, mention it with a link to a
  reliable source. Verify it exists — never invent incidents or CVE numbers.
- Always finish with how to fix and how to test for it.
- Educational only: show the technique clearly, but no ready-to-run exploit
  against real, unpatched software.

### Tool review posts

- Right after the intro: a short **Links** list with the official site/repo and
  docs.
- **Most common usage first**: install, then the 2–4 things people use the tool
  for most, each with a simple command and a trimmed example of the output, plus
  one sentence on how to read that output.
- **Then other useful actions**: less common but valuable flags, configs, CI
  integration.
- Close with a short honest take (when to use it, limits, alternatives) and a
  **References** section.

## 6. Check before finishing

- [ ] Filename date matches `date:` in front matter; timezone is `-0300`.
- [ ] `description` is set and short.
- [ ] `<!--more-->` is present, and in the right place for the post type.
- [ ] Tags reuse existing ones where possible.
- [ ] Every link, command, flag, CVE, and incident was verified, not guessed.
- [ ] A junior developer could follow every section without searching for terms.
- [ ] Build passes, if Ruby/Bundler is available:
  `cd src && bundle exec jekyll build` (or `./serve.sh` to preview at
  http://localhost:4000).

Do not commit or push unless the user asks.
