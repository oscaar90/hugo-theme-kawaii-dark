# hugo-theme-kawaii-dark

A Hugo theme built for technical portfolios. Dark base, minimal structure, kawaii color accents.

Designed around a portfolio-first layout: hero section, metrics grid, full CV page, and a tag-driven blog. No categories, no unnecessary complexity.

![Hugo](https://img.shields.io/badge/Hugo-0.110+-pink?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)

> Work in progress. Some features are still being developed. See [PENDIENTE.md](PENDIENTE.md) for open issues and planned work.

---

## Features

- Portfolio hero with CTA and metrics grid
- Full CV page with achievements, skill areas and contact
- Blog driven by tags only — no categories
- Syntax highlighting (Nord palette)
- Tailwind CSS — customizable via `tailwind.config.js`
- Responsive

---

## Requirements

- Hugo Extended 0.110.0 or later
- Node.js 18+ (for Tailwind CSS build)

---

## Installation

### As a Git submodule (recommended)

```bash
git submodule add https://github.com/oscaar90/hugo-theme-kawaii-dark.git themes/kawaii-dark
```

Then set the theme in your `hugo.toml` or `config.toml`:

```toml
theme = "kawaii-dark"
```

### Manual

Clone or download this repo into your site's `themes/kawaii-dark/` directory.

---

## Quick start

An `exampleSite/` is included to preview the theme locally:

```bash
cd exampleSite
hugo server --themesDir ../.. --port 1313
```

---

## Configuration

Copy `exampleSite/config.toml` into your site as a starting point. Below is a reference of the available params.

### Basic

```toml
baseURL      = "https://example.com/"
languageCode = "es-ES"
title        = "Your Name"
theme        = "kawaii-dark"

[taxonomies]
  tag = "tags"

[params]
  description    = "Your site description."
  footer_tagline = "Something short and yours."
```

### Hero section

```toml
[params]
  hero_label           = "Your main goal or tagline"
  hero_title           = "Your headline.<br>Can span two lines."
  hero_description     = "A couple of lines about what you do."
  hero_cta             = "Read the blog"
  hero_cta_url         = "/blog"
  hero_secondary       = "About me"
  hero_secondary_url   = "/about"
```

### Metrics grid

```toml
[[params.metrics]]
  value = "10+"
  label = "years of experience"

[[params.metrics]]
  value = "50+"
  label = "projects shipped"
```

### Social links

```toml
[params.social]
  github   = "https://github.com/yourusername"
  linkedin = "https://linkedin.com/in/yourusername"
```

### CV page

```toml
[params.cv]
  declaration      = "A short paragraph about who you are professionally."
  years            = "10"
  chips            = ["SRE & Infrastructure", "Automation", "Security"]
  available        = true
  available_label  = "Open to new opportunities"

  [[params.cv.logros]]
    metric = "~40%"
    title  = "Reduced critical incidents"
    detail = "Short description of what you did and the context."

  [[params.cv.areas]]
    name  = "Infrastructure & SRE"
    items = [
      "Item one",
      "Item two"
    ]

  [[params.cv.no_soy]]
    item = "Something you are not or do not do."

  [params.cv.cta]
    text     = "Does what you read match what you need?"
    label    = "Let's talk"
    email    = "you@example.com"
    linkedin = "https://linkedin.com/in/yourusername"
```

### Syntax highlighting

```toml
[markup]
  [markup.highlight]
    style      = "nord"
    lineNos    = false
    tabWidth   = 2
    codeFences = true
```

---

## Navigation menu

```toml
[menu]
  [[menu.main]]
    name   = "Blog"
    url    = "/blog"
    weight = 10

  [[menu.main]]
    name   = "Tags"
    url    = "/tags"
    weight = 20

  [[menu.main]]
    name   = "CV"
    url    = "/cv"
    weight = 40
```

---

## Known issues

See [PENDIENTE.md](PENDIENTE.md).

---

## License

MIT — see [LICENSE](LICENSE).

Built by [Óscar Sánchez Pérez](https://oscarai.tech).
