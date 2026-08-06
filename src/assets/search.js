// Client-side post search for the home page.
//
// The site is static, so there is no server to query: _includes/search.html
// renders the bar, search.json holds every post, and everything below runs in
// the browser. The index is fetched lazily — on the first keystroke, not on page
// load — so a visitor who never searches never pays for it.
//
// A live query hides the paginated list and shows its own results in place of
// it. That matters: the browse list only ever holds one page of posts, so
// filtering the DOM would silently miss everything on pages 2+.
(function () {
  'use strict';

  var form = document.querySelector('[data-search]');
  if (!form) return;

  var input = form.querySelector('.search-input');
  var status = document.querySelector('[data-search-status]');
  var results = document.querySelector('[data-search-results]');
  // Toggling this element's class is what swaps browse mode for results mode.
  var home = form.closest('.home') || document.body;

  var posts = null;    // the index, once it has arrived
  var loading = null;  // the in-flight fetch, so we only ask for it once

  // Weights per field. A title hit should outrank a passing mention in the body.
  var FIELDS = [
    { key: 'title', weight: 10 },
    { key: 'tagText', weight: 6 },
    { key: 'excerpt', weight: 3 },
    { key: 'body', weight: 1 }
  ];

  var SNIPPET_RADIUS = 90; // characters kept either side of the first body hit

  form.hidden = false; // JavaScript is on; the bar is usable
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // there is nowhere to submit to
  });

  // ---------------------------------------------------------------------------
  // Index
  // ---------------------------------------------------------------------------

  function load() {
    if (posts) return Promise.resolve(posts);

    if (!loading) {
      loading = fetch(form.getAttribute('data-search'))
        .then(function (response) {
          if (!response.ok) throw new Error('search index: HTTP ' + response.status);
          return response.json();
        })
        .then(function (data) {
          posts = data.map(function (post) {
            var tagText = post.tags
              .map(function (tag) { return tag.name; })
              .join(' ');

            // Lowercased copies for matching, so the search itself never has to
            // re-case a string. The originals stay intact for display.
            post.tagText = tagText;
            post.haystack = {
              title: post.title.toLowerCase(),
              tagText: tagText.toLowerCase(),
              excerpt: post.excerpt.toLowerCase(),
              body: post.body.toLowerCase()
            };
            return post;
          });
          return posts;
        });
    }

    return loading;
  }

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  function terms(query) {
    return query.toLowerCase().split(/\s+/).filter(Boolean);
  }

  // Every term has to appear somewhere in the post (AND, not OR) — typing more
  // words narrows the list, which is what a search bar is expected to do.
  function score(post, words) {
    var total = 0;

    for (var i = 0; i < words.length; i++) {
      var hit = 0;

      for (var f = 0; f < FIELDS.length; f++) {
        if (post.haystack[FIELDS[f].key].indexOf(words[i]) !== -1) {
          hit += FIELDS[f].weight;
        }
      }

      if (!hit) return 0;
      total += hit;
    }

    return total;
  }

  function search(words) {
    return posts
      .map(function (post) { return { post: post, score: score(post, words) }; })
      .filter(function (row) { return row.score > 0; })
      // Ties break by date: search.json is already newest-first, and sort is
      // stable in every browser that ships fetch, so equal scores keep that order.
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (row) { return row.post; });
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Appends `text` to `parent` with every match of `words` wrapped in <mark>.
  // Built out of nodes rather than an HTML string so post content can never be
  // interpreted as markup on the way back out.
  function highlight(parent, text, words) {
    var pattern = new RegExp('(' + words.map(escapeRegExp).join('|') + ')', 'gi');
    var last = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last) {
        parent.appendChild(document.createTextNode(text.slice(last, match.index)));
      }

      var mark = document.createElement('mark');
      mark.textContent = match[0];
      parent.appendChild(mark);
      last = match.index + match[0].length;

      if (match[0].length === 0) pattern.lastIndex++; // paranoia: never spin
    }

    if (last < text.length) {
      parent.appendChild(document.createTextNode(text.slice(last)));
    }
  }

  // A window of the excerpt (or body, if the hit is only in there) around the
  // first term that matched, so the result shows *why* it matched.
  function snippet(post, words) {
    var source = post.excerpt || post.body;
    var at = -1;

    for (var i = 0; i < words.length && at === -1; i++) {
      at = source.toLowerCase().indexOf(words[i]);
    }

    if (at === -1) {
      source = post.body;
      for (var j = 0; j < words.length && at === -1; j++) {
        at = source.toLowerCase().indexOf(words[j]);
      }
    }

    if (at === -1) return source.slice(0, SNIPPET_RADIUS * 2) + '…';

    var start = Math.max(0, at - SNIPPET_RADIUS);
    var end = Math.min(source.length, at + SNIPPET_RADIUS);

    return (start > 0 ? '…' : '') +
      source.slice(start, end).trim() +
      (end < source.length ? '…' : '');
  }

  // Mirrors _includes/post-card.html. The two are separate on purpose: this one
  // renders a snippet with highlighting where the card renders the excerpt.
  function card(post, words) {
    var li = document.createElement('li');

    var heading = document.createElement('h3');
    var link = document.createElement('a');
    link.className = 'post-link';
    link.href = post.url;
    highlight(link, post.title, words);
    heading.appendChild(link);
    li.appendChild(heading);

    var text = document.createElement('p');
    highlight(text, snippet(post, words), words);
    li.appendChild(text);

    var foot = document.createElement('div');
    foot.className = 'post-list-foot';

    if (post.tags.length) {
      var tags = document.createElement('ul');
      tags.className = 'post-tags';

      post.tags.forEach(function (tag) {
        var item = document.createElement('li');
        var tagLink = document.createElement('a');
        tagLink.className = 'post-tag';
        tagLink.href = tag.url;
        tagLink.textContent = tag.name;
        item.appendChild(tagLink);
        tags.appendChild(item);
      });

      foot.appendChild(tags);
    } else {
      foot.appendChild(document.createElement('span'));
    }

    var time = document.createElement('time');
    time.className = 'post-list-date';
    time.setAttribute('datetime', post.datetime);
    time.textContent = post.date;
    foot.appendChild(time);

    li.appendChild(foot);
    return li;
  }

  function render(query) {
    var words = terms(query);

    results.textContent = '';

    if (!words.length) {
      home.classList.remove('is-searching');
      results.hidden = true;
      status.textContent = '';
      return;
    }

    home.classList.add('is-searching');

    var matches = search(words);
    results.hidden = matches.length === 0;

    matches.forEach(function (post) {
      results.appendChild(card(post, words));
    });

    status.textContent = matches.length
      ? matches.length + (matches.length === 1 ? ' post' : ' posts') + ' matching "' + query + '"'
      : 'no posts matching "' + query + '"';
  }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------

  // Keeps ?q= in step with the box, so a search can be linked or reloaded.
  // replaceState, not pushState: typing a word should not bury the previous page
  // under one history entry per keystroke.
  function syncUrl(query) {
    if (!window.history || !window.history.replaceState) return;

    var url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState(null, '', url.toString());
  }

  function run() {
    var query = input.value.trim();
    syncUrl(query);

    if (!query) {
      render('');
      return;
    }

    load().then(function () {
      // The box may have moved on while the index was in flight; render what it
      // says now, not what it said when the fetch started.
      render(input.value.trim());
    }).catch(function (error) {
      home.classList.remove('is-searching');
      results.hidden = true;
      status.textContent = 'search is unavailable right now';
      console.error(error);
    });
  }

  input.addEventListener('input', run);

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault(); // some browsers clear the field for us; be consistent
      input.value = '';
      run();
    }
  });

  // "/" focuses the box, the way it does in a pager. Ignored while typing
  // somewhere else, and while a modifier is held, so it never eats a shortcut.
  document.addEventListener('keydown', function (event) {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;

    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      return;
    }

    event.preventDefault();
    input.focus();
    input.select();
  });

  // Arriving with ?q= (a shared link, or a reload) starts searching immediately.
  var initial = new URL(window.location.href).searchParams.get('q');
  if (initial) {
    input.value = initial;
    run();
  }
})();
