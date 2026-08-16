#!/usr/bin/env bash
#
# Renders tools/og-card.html to src/assets/og-default.png, the site-wide
# og:image / twitter:image (wired up in src/_config.yml).
#
# Run this after editing og-card.html. The PNG is committed to the repo, so the
# GitHub Actions build never has to render anything — this is a local, manual
# step, not part of `jekyll build`.
#
# Headless Chrome does the rasterising because it is the one renderer already on
# a Mac that understands the same CSS the site does. No ImageMagick, no rsvg.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/src/assets/og-default.png"

chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$chrome" ]]; then
  echo "error: Google Chrome not found at $chrome" >&2
  exit 1
fi

# --window-size must match the body dimensions in og-card.html (1200x630).
# --hide-scrollbars stops a scrollbar gutter from eating the right edge.
# --virtual-time-budget holds the screenshot until the two Google Fonts the card
# uses have downloaded; without it the title rasterises in the fallback face.
# That makes this step need network access, unlike the rest of the build.
"$chrome" \
  --headless \
  --disable-gpu \
  --hide-scrollbars \
  --force-device-scale-factor=1 \
  --window-size=1200,630 \
  --virtual-time-budget=10000 \
  --screenshot="$out" \
  "file://$root/tools/og-card.html" 2>/dev/null

echo "wrote $out"
