# lucas-rbnt.github.io

Personal site, built with Jekyll and served on GitHub Pages. It uses a small custom theme with no CSS framework and no JS dependencies.

## Run locally

```sh
bundle install
bundle exec jekyll serve      # → http://localhost:4000
# or: docker compose up
```

## Where things live

| What | Where |
| --- | --- |
| Home page text | `_pages/about.md` |
| Hero terminal lines, socials | `_config.yml` (`taglines`, `author`) |
| Nav links | `_data/navigation.yml` |
| Papers | `_publications/*.md` |
| Teaching | `_teaching/*.md` |
| Styles | `assets/css/site.scss` |
| Canvas, typing, theme, Konami code | `assets/js/site.js` |
| Animated paper figures | `_includes/figures/*.html` |

## Adding a paper

Create `_publications/YYYY-MM-DD-short-name.md`:

```yaml
---
title: "Paper title"
date: 2025-06-01
venue: "MICCAI 2025"
authors: "Lucas Robinet, A. Coauthor, B. Coauthor"
figure: fusion          # disentangle | masked-patches | fusion | default
tldr: "One-line summary."
paperurl: https://arxiv.org/abs/...
codeurl: https://github.com/...
bibtexurl:
slidesurl:
---
Abstract or longer description (shown on the paper's own page).
```

The 3 most recent papers appear on the home page. A file with `published: false` is hidden.

To make a new figure, copy one of the files in `_includes/figures/` (each is an inline SVG animated with CSS) and set `figure:` to its filename. Animations only play while the figure is on screen and are turned off for `prefers-reduced-motion`.
