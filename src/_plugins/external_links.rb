# frozen_string_literal: true

require "uri"

# Opens every off-site link in a new tab.
#
# This runs on the rendered HTML rather than on the Markdown source, so it
# covers post and page content *and* the layouts wrapped around it (the social
# icons in the nav, for one) without any link having to carry a
# `{:target="_blank"}` attribute list by hand.
#
# `rel="noopener noreferrer"` rides along with `target="_blank"`: without it the
# opened tab keeps a `window.opener` handle back to this page, and the referrer
# leaks which page the visitor left from.
module ExternalLinks
  # Matches an opening <a> tag and captures its attributes. `<a\s` rather than
  # `<a` so it can't match <abbr>, <address>, and friends.
  ANCHOR = /<a\s+([^>]*?)(\s*\/?)>/i
  HREF   = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i
  REL    = /\brel\s*=\s*(?:"([^"]*)"|'([^']*)')/i
  TARGET = /\btarget\s*=\s*["']/i

  module_function

  def rewrite(html, site_host)
    html.gsub(ANCHOR) do |tag|
      attrs = Regexp.last_match(1)
      tail  = Regexp.last_match(2)

      next tag if attrs =~ TARGET # an explicit target in the source wins

      href_match = attrs.match(HREF)
      next tag unless href_match

      href = href_match[1] || href_match[2]
      next tag unless external?(href, site_host)

      %(<a #{with_rel(attrs)} target="_blank"#{tail}>)
    end
  end

  # Anything that resolves to another host. Relative paths, in-page anchors and
  # `mailto:` all parse with a nil host, so they fall through as internal.
  def external?(href, site_host)
    return false if href.nil? || href.strip.empty?

    host = begin
      URI.parse(href.strip).host
    rescue URI::InvalidURIError
      nil
    end
    return false if host.nil?

    site_host.nil? || normalize(host) != site_host
  end

  # Folds the noopener/noreferrer tokens into any rel the link already has —
  # the social links in the nav carry rel="me", which must survive.
  def with_rel(attrs)
    rel_match = attrs.match(REL)
    existing  = rel_match ? (rel_match[1] || rel_match[2]) : ""
    tokens    = existing.split(/\s+/).reject(&:empty?)
    tokens |= %w[noopener noreferrer]
    rel = %(rel="#{tokens.join(" ")}")

    rel_match ? attrs.sub(REL, rel) : "#{attrs.strip} #{rel}"
  end

  def normalize(host)
    host.downcase.sub(/\Awww\./, "")
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  # HTML only — jekyll-feed's feed.xml goes through this hook too, and its
  # <link> elements are not anchors.
  next unless doc.output_ext == ".html"

  site_host = begin
    URI.parse(doc.site.config["url"].to_s).host
  rescue URI::InvalidURIError
    nil
  end
  site_host = ExternalLinks.normalize(site_host) if site_host

  doc.output = ExternalLinks.rewrite(doc.output, site_host)
end
