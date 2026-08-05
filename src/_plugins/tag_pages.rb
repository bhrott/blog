# frozen_string_literal: true

# Builds an archive page per tag at /tags/<slug>/, listing every post carrying
# that tag. jekyll-archives does this too, but it is one more dependency for
# what amounts to a loop over `site.tags`.
#
# The slug has to match the one _includes/post-card.html builds with Liquid's
# `slugify` filter, which is the same Jekyll::Utils.slugify used here.
#
# NOTE: these are real Jekyll::Page objects, so they land in `site.pages`. Any
# template looping over site.pages sees them — minima's nav does exactly that,
# which is why _config.yml pins `header_pages` instead of letting the theme fall
# back to "every page with a title".
module TagPages
  class TagPage < Jekyll::Page
    def initialize(site, tag, posts)
      @site = site
      @base = site.source
      @dir  = File.join("tags", Jekyll::Utils.slugify(tag))
      @name = "index.html"

      process(@name)

      @data = {
        "layout" => "tag",
        "tag"    => tag,
        # Drives <title> in head.html; the on-page heading is styled separately.
        "title"  => "##{tag}",
        "posts"  => posts,
      }
    end
  end

  class Generator < Jekyll::Generator
    safe true

    def generate(site)
      site.tags.each do |tag, posts|
        site.pages << TagPage.new(site, tag, posts.sort_by { |post| -post.date.to_f })
      end
    end
  end
end
