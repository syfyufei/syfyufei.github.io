# Sun Yufei (Adrian) — Personal Academic Site

> Hand-over document for any LLM (or human) maintaining this site. Read this end-to-end before making structural changes. Read sections 5–7 before any content edit.

---

## 0. TL;DR

A **plain static site** at `syfyufei.github.io`. Served by GitHub Pages straight from the repo root — **no build step, no toolchain**. The owner is a political-science PhD candidate who explicitly rejected SSGs (Hugo, Quarto, Astro) and asked for an architecture an LLM can maintain by hand-editing files.

Almost all content lives in `data/*.json`. Each page is a hand-written HTML shell that fetches its JSON and clones a `<template>` to render the list. One stylesheet, one script, six HTML pages.

```
push to main → GitHub Pages serves files as-is → visitors see them
```

---

## 1. Philosophy & non-negotiables

These are not arbitrary; the owner explicitly chose them. **Do not propose to undo any of these without an explicit user request.**

| Constraint | Reason |
|---|---|
| **No build step** | "Did the LLM run the build?" is a class of bug we never want |
| **No SSG (Hugo / Quarto / Astro / Eleventy)** | Owner had Hugo before, lost the source, ended up with un-maintainable output. Wants raw files |
| **No package.json / node_modules / npm scripts** | Same reason |
| **No framework (React / Vue / Svelte)** | Overkill for a personal site; framework drift breaks LLM maintenance over years |
| **Absolute paths only** (`/style.css`, not `style.css`) | This is a user-domain GitHub Pages site (`syfyufei.github.io/`); always served from root. Absolute paths keep links consistent regardless of page depth |
| **No category/tag archive pages** | Tags live as a `tags: []` field on each item and render as badges. No `/categories/methodology/` etc. |
| **No RSS, no sitemap** | Low value for a small academic site; not worth the extra source-of-truth |
| **Two webfonts via Google Fonts CDN** | Crimson Pro (headings) + Inter (body), loaded from `fonts.googleapis.com` on all 6 pages, with system fonts as fallback inside `--serif`/`--sans`. Still no self-hosted `/fonts/` or `/webfonts/` dir, no FontAwesome. Inline SVG for the four social icons |
| **One runtime JS dependency** | jsvectormap from CDN, only on `globalization.html` |
| **Header/footer duplicated across pages** | Deliberate. JS includes would break with-JS-disabled browsers and add machinery. Editing 6 copies when nav changes is fine |

**Vocabulary preference (Chinese)**: do **not** use the word "骨架". Use "最小版本"、"基础结构" instead. (Also captured in the user's MEMORY.md.)

---

## 2. File map

```
├── index.html              Home (fully static, hand-written)
├── about.html              About page (fully static, bilingual EN+ZH)
├── academia.html           Hub: Publications + Projects + Courses (3 JSON sources)
├── engineering.html        Hub: Software (1 JSON source; room to grow more categories)
├── globalization.html      Hub: full-viewport interactive world map + travel notes
├── 404.html                Static 404
├── style.css               Single hand-written stylesheet (CSS vars + dark mode + map styles)
├── render.js               ~80-line vanilla JS: fetch JSON → clone <template>
├── data/
│   ├── publications.json   _schema doc at top; arrays: journal_en, journal_zh, conference, blog
│   ├── projects.json       _schema doc at top; array: items
│   ├── software.json       _schema doc at top; array: items
│   ├── courses.json        _schema doc at top; array: items
│   └── travel.json         _schema doc at top; array: items (each has country_code)
├── img/
│   ├── adrian.png          Profile photo (hero on home, sidebar on about)
│   ├── logo.jpg            Brand logo (used as og:image fallback)
│   ├── logo.ico            Favicon
│   └── favicon.ico         Favicon (legacy duplicate, harmless)
├── .github/workflows/pages.yml  GitHub Actions workflow that deploys the repo root to Pages
├── .nojekyll               Disables Jekyll processing on GitHub Pages
├── .gitignore              Includes YToo_SS.yaml (local Clash config) and resume artifacts (resume.*, make_resume.js)
├── .surgeignore            Excludes non-site files (CLAUDE.md, .github, resume artifacts) from Surge deploys
└── CLAUDE.md               This file
```

Anything outside this list is wrong — most likely Hugo residue someone reintroduced.

---

## 3. Navigation & site map

The nav has exactly 5 items, in this order:

```
Home  ·  About  ·  Academia  ·  Engineering  ·  Globalization
```

Mapped to:

| Nav item | File | Renders content from |
|---|---|---|
| Home | `index.html` | (static — hero + intro + CTA to About) |
| About | `about.html` | (static — bilingual self-intro) |
| Academia | `academia.html` | `data/publications.json`, `data/projects.json`, `data/courses.json` (all on one page, three sections) |
| Engineering | `engineering.html` | `data/software.json` (single section; extend as needed) |
| Globalization | `globalization.html` | `data/travel.json` + interactive world map |

**The three hub pages are organized around three identity facets**: scholar (Academia), maker (Engineering), traveler (Globalization). When extending a hub, prefer adding a new `<section class="hub-section">` over creating a new top-level page. The 5-item nav is the contract with the user.

---

## 4. The header & footer pattern

Every HTML page has a near-identical `<header class="site">` and `<footer class="site">`. The only differences are:

1. **`class="active"` on the current page's nav link** — set by hand per page
2. **`<title>` tag** — page-specific

When you change anything in the header (e.g. add a nav item, rename "About") or the footer (e.g. add a social link, update © year), **edit all 6 files**:

```
index.html · about.html · academia.html · engineering.html · globalization.html · 404.html
```

Use `Grep` to confirm you didn't miss one. Pattern to verify nav consistency:

```
grep -c '"/academia.html"' *.html   # should print 6
```

**Why duplicated, not included?** The owner explicitly preferred this. JS-based includes break for users with JS disabled and add load-order complexity. Hand-duplicating 6 short blocks is cheaper than maintaining an include system.

---

## 5. Data layer (`data/*.json`)

Every JSON file has a `_schema` object as its first key. The schema is **for humans/LLMs, not consumed by code** — `render.js` ignores it. **When adding fields, update the schema first, then the items.**

### 5.1 publications.json

Four arrays grouped by publication type. Hub page `academia.html` renders all four with section headers.

```json
{
  "_schema": {...},
  "journal_en":  [/* English peer-reviewed */],
  "journal_zh":  [/* Chinese peer-reviewed */],
  "conference":  [/* conference presentations */],
  "blog":        [/* blogs and columns */]
}
```

Each entry:

| Field | Required | Notes |
|---|---|---|
| `title` | yes | String. Chinese book-title quotes 《》 fine; **escape `"` as `\u201c` / `\u201d`** for curly quotes since straight `"` breaks JSON |
| `authors` | yes | String, rendered as-is (e.g., `"Hu, Yue, Yufei Sun, and Donald Lien"`) |
| `year` | yes | Number, or `null` for undated |
| `venue` | yes | Journal/conference + issue/pages |
| `url` | optional | Primary link (article, PDF, blog post). When set, `title` becomes a hyperlink |
| `tags` | optional | `string[]` — rendered as badges |
| `note` | optional | Indexing info (`"SSCI Q1"`, `"CSSCI"`, `"北大核心"`, etc.) — rendered as a small bordered chip |

**To add a peer-reviewed Chinese article**: append to `journal_zh`. That's the only edit.

### 5.2 projects.json

```json
{
  "_schema": {...},
  "items": [
    {
      "title": "Local Governance in China",
      "summary": "How can Chinese local governments retain autonomy in a pressure-based system?",
      "tags": ["local-governance", "pressure-based-system"]
    }
  ]
}
```

Required: `title`, `summary`. Optional: `tags`, `url`.

### 5.3 software.json

```json
{
  "_schema": {...},
  "items": [
    {
      "title": "regioncode",
      "summary": "An R package for China studies…",
      "url": "https://cran.r-project.org/package=regioncode",
      "tags": ["r-package", "geocode"]
    }
  ],
  "specialties": ["Data scraping", "Geocode conversion", "Latent variable analysis", "Data visualization"]
}
```

Required: `title`, `summary`. Optional: `url`, `tags`.
`specialties` is currently unused by render.js but kept for future side-panel rendering.

### 5.4 courses.json

```json
{
  "_schema": {...},
  "intro": "Political Science is for Everyone's Pleasure…",
  "items": [
    { "title": "R Workshop", "institution": "University of Tokyo", "year": 2024, "track": "Research Methodologies" }
  ]
}
```

Required: `title`, `institution`, `year`, `track`. `track` should be one of: `"Comparative Politics"`, `"Research Methodologies"`, `"Language Studies"` (or add a new track if needed — also remember to update CSS if you want a different color per track).

### 5.5 travel.json

```json
{
  "_schema": {...},
  "items": [
    {
      "place":        "Vietnam",
      "subtitle":     "Ho Chi Minh City",
      "country_code": "VN",
      "date":         "2023",
      "quote":        "...",
      "video":        "https://www.youtube.com/embed/HHP_zWgSRK0",
      "diary":        "https://syfyufei.github.io/travel/Vietnam.html"
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `place` | yes | Country/region name as displayed |
| `country_code` | **yes if you want the map to highlight it** | ISO 3166-1 alpha-2 (`AE`, `VN`, `TH`, `MY`, `NL`, `BE`, `JP`, `FR`, `CN`, …). Used both for map series + as the `<article id>` so map clicks can scroll |
| `subtitle` | optional | City or region |
| `date` | optional | `YYYY-MM` or `YYYY` |
| `quote` | optional | A short evocative line |
| `video` | optional | YouTube **embed** URL (`/embed/...`, not `/watch?v=...`) |
| `diary` | optional | External long-form diary URL |

**To add a new country to the map**: just append the entry with a correct `country_code`. The map auto-updates on next reload.

---

## 6. Render layer (`render.js`)

~80 lines, no dependencies. Public API:

```js
renderList(jsonPath, listSel, tplSel, opts?)
```

- `jsonPath`: e.g. `"/data/publications.json"`
- `listSel`: CSS selector for the container that will receive cloned items (e.g. `"#list"`, `"#pubs"`)
- `tplSel`: CSS selector for the `<template>` element (e.g. `"#item"`, `"#pub-item"`)
- `opts.key`: which array key in the JSON to render (default `"items"`)
- `opts.groups`: array of `{key, title}` to render multiple grouped sections (used by Publications)

### 6.1 The data-attribute DSL — complete reference

Inside any `<template>`, these attributes are recognized:

| Attribute | Behavior | Example |
|---|---|---|
| `data-field="x"` | Sets `textContent` to `item.x`. **Removes the element if `item.x` is null/empty.** | `<h3 data-field="title"></h3>` |
| `data-link="x"` | Wraps the element's existing children in `<a href={item.x} target="_blank" rel="noopener">`. No-op if `item.x` is falsy | `<h3 data-link="url" data-field="title"></h3>` |
| `data-tags` | Replaces innerHTML with `<span class="tag">…</span>` per `item.tags[]`. Removes the element if `tags` is empty | `<div data-tags></div>` |
| `data-if="x"` | Removes the element if `!item.x` (use to hide whole subtree when a field is missing) | `<p data-if="note">…</p>` |
| `data-attr="attr:key[, attr:key]…"` | Sets one or more HTML attributes from item fields | `data-attr="src:video"` → `iframe.src = item.video`<br>`data-attr="id:country_code"` → `article.id = item.country_code`<br>`data-attr="href:diary"` → `a.href = item.diary` |

**Implementation note**: `data-attr` parses comma-separated `attr:key` pairs. Whitespace is trimmed. `data-tags` is hard-coded to use `item.tags`; if you ever need a tag-like list under another name, generalize this in render.js.

### 6.2 Multiple lists on one page

`academia.html` calls `renderList` three times for three different `(json, container, template)` triples. There is no shared state between calls — each is independent. This is the intended pattern when you want a single hub page combining several data sources.

---

## 7. Style layer (`style.css`)

Single hand-written stylesheet. **Read it top-to-bottom before making style changes — it's organized into labeled sections.**

### 7.1 Design tokens (CSS variables)

All theming is at `:root`:

```css
--bg, --bg-alt, --fg, --muted, --accent, --accent-warm, --border, --card, --link, --link-hover
--serif (heading font stack — Crimson Pro, then system serif fallback)
--sans  (body font stack — Inter, then system fonts as fallback)
--max        (max content width, 1200px)
--max-narrow (narrow content width, 760px)
--header-h   (sticky header height, 72px)
```

Dark mode is automatic via `@media (prefers-color-scheme: dark)` overriding the same variables. Never hard-code colors outside the `:root` blocks.

### 7.2 Layout primitives

- `.wrap` — content max-width container (`var(--max)` + horizontal padding)
- `.card` — outlined block with hover-lift; used by every list item
- `.tag` — small rounded badge in `--accent` color
- `.note` — small bordered chip used for "SSCI Q1" / "CSSCI" indexing labels
- `.hub-section` — vertical-margin spacer + bordered `<h2>`; used to divide multiple lists on a single hub page
- `.section-intro` — muted lead paragraph under page `<h1>`

### 7.3 Hero patterns

Two distinct hero styles:

| Class | Used on | Behavior |
|---|---|---|
| `.hero` | `index.html` | Two-column (text + circular avatar). Stacks on mobile |
| `.hero-map` | `globalization.html` | Full-viewport map (`calc(100svh - 68px)`, min 520px) with absolutely-positioned overlay title and animated scroll hint |

### 7.4 Responsive

Single breakpoint at **720px** (where the home hero stacks). Everything else is fluid via `clamp()` and `auto-fill` grids. **Do not introduce a `1024px` desktop breakpoint** — it just adds untested combinations.

---

## 8. The interactive map (`globalization.html`)

### 8.1 Library

**jsvectormap v1.5.3** — MIT, ~40 KB JS + 102 KB world map data + 2 KB CSS, all from jsDelivr CDN. Pinned by version in the `<script>` and `<link>` tags. Don't bump versions casually — re-test the API.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsvectormap@1.5.3/dist/css/jsvectormap.min.css">
<script src="https://cdn.jsdelivr.net/npm/jsvectormap@1.5.3/dist/js/jsvectormap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jsvectormap@1.5.3/dist/maps/world.js"></script>
```

### 8.2 Initialization flow

1. Page loads → `renderList("/data/travel.json", "#list", "#item")` renders the entries below the map. Each `<article>` gets `id="<country_code>"` via `data-attr="id:country_code"`.
2. Same JSON is fetched again (browser cache hit, free) to extract the set of visited country codes.
3. `getComputedStyle(:root)` reads `--accent` and `--border`, so the map respects light/dark mode.
4. `new jsVectorMap({...})` — visited countries get `--accent` fill; unvisited get `--border` color. Hover boosts opacity. Region click smooth-scrolls to the matching `<article>` and plays a brief background-color animation.
5. Resize listener (debounced 150ms) calls `map.updateSize()` so the map re-fits when the viewport changes.

### 8.3 Failure mode

If the CDN is blocked (firewalls, offline preview), `typeof jsVectorMap === "undefined"` is detected and the map container shows a graceful fallback message. The travel entries below still render normally because they don't depend on the map library.

### 8.4 Adding a new country

```json
{
  "place": "Japan",
  "subtitle": "Tokyo & Kyoto",
  "country_code": "JP",
  "date": "2024-08",
  "quote": "...",
  "video": "https://www.youtube.com/embed/...",
  "diary": "https://syfyufei.github.io/travel/Japan.html"
}
```

Append to `data/travel.json → items`. That's the only edit. Map highlights it on next page load.

### 8.5 Don't put pin markers on the map

The owner asked for "country fill" semantics, not pins. Resist the urge to add `markers: [...]`. If a pin-style entry is ever needed (e.g., a single city when the country wasn't really "visited"), discuss with the user first.

---

## 9. Cookbook — common tasks

### "Add a new publication"
Append to the appropriate array in `data/publications.json`. Done.

### "Add a new project / software / course / travel entry"
Append to `items` in the matching `data/*.json`. Done.

### "Update my bio paragraph on the home page"
Edit the `<p class="intro">` in `index.html`. The bilingual long version on `about.html` is a separate edit.

### "Add a new social-media icon"
1. Find an inline SVG (Simple Icons / FontAwesome SVG paths). Add an `<a>` to the `.social` div in **all 6 HTML files**.
2. After change, `grep -c 'aria-label="GitHub"' *.html` (or whatever) should print 6.

### "Rename a nav item / add a new top-level page"
1. Decide if it's really a new top-level page or a new section in an existing hub. Default to "section in existing hub".
2. If genuinely new: create the HTML file (copy `engineering.html` as a template), add nav link to all 6 files, update this CLAUDE.md's nav table.

### "Change the color theme"
Edit the CSS variables in `:root` and `@media (prefers-color-scheme: dark)` in `style.css`. The map picks up `--accent` automatically.

### "Update copyright year in footer"
Search-replace `© 2026` across all 6 HTML files. (Yes, six edits — the duplication is the design.)

### "I want to disable the map temporarily"
Comment out the three `<script>` / `<link>` tags for jsvectormap in `globalization.html`. The fallback message will show; entries below still render.

---

## 10. Anti-patterns (do NOT do these)

- ❌ **Don't introduce a build step.** Even a "tiny Python pre-render script" is a slippery slope.
- ❌ **Don't add Hugo / Quarto / Astro back.** Owner explicitly rejected these.
- ❌ **Don't add `package.json` or `node_modules`.**
- ❌ **Don't extract header/footer into a JS partial.** The duplication is intentional. See §1.
- ❌ **Don't add `/categories/` or `/tags/` archive pages.** Tags live on items, not in archives.
- ❌ **Don't change absolute paths to relative.** This is a user-domain GitHub Pages site; absolute paths are the right call.
- ❌ **Don't add a CSS framework** (Tailwind, Bootstrap, Tachyons). One hand-written stylesheet is the architecture.
- ❌ **Don't hard-code colors outside `:root`.** Always go through CSS variables so dark mode keeps working.
- ❌ **Don't use the Chinese word "骨架"** in user-facing text or in conversations with this user.
- ❌ **Don't commit `.DS_Store`, `YToo_SS.yaml`, or other local-only files.** They're in `.gitignore`.

---

## 11. Local preview & deployment

### Preview

```bash
python3 -m http.server 8765
# open http://localhost:8765/
```

The site **must** be served from the repo root because all paths are absolute (`/style.css`, `/data/*.json`). Opening `index.html` with `file://` will not work — those paths resolve to filesystem root.

### Deployment

Two deployment targets, both serving the repo root as-is (still **no build step**):

1. **GitHub Pages** at `https://syfyufei.github.io/` — deployed by `.github/workflows/pages.yml` on every push to `main` (build_type = "workflow"). `.nojekyll` disables Jekyll. ⚠️ Known issue (June 2026): pushes have not been creating workflow runs (`gh run list` is empty) and the live Pages URL 404s — likely an account-level Actions problem. Surge is the working mirror until this is resolved.
2. **Surge** at `https://syfyufei.surge.sh/` — deployed manually from the repo root with `surge . syfyufei.surge.sh` (CLI installed, logged in as syfyufei@gmail.com). `.surgeignore` keeps non-site files (CLAUDE.md, .github, resume artifacts) out of the upload. Surge serves `404.html` for missing pages automatically.

Push to `main` keeps the repo canonical; run the `surge` command after pushing to update the live mirror.

### Quick verification checklist

```bash
# 1. JSON parses
for f in data/*.json; do python3 -c "import json; json.load(open('$f'))" && echo "OK $f"; done

# 2. Every page returns 200
for p in / /about.html /academia.html /engineering.html /globalization.html /404.html; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:8765$p"
done

# 3. No stale Hugo references
grep -E 'hugo|blogophonic|/categories/|/tags/|index\.xml|sitemap\.xml' *.html  # should be empty

# 4. Nav consistency (every hub link should appear 6 times — one per HTML file)
for link in / /about.html /academia.html /engineering.html /globalization.html; do
  echo "$link: $(grep -l "href=\"$link\"" *.html | wc -l)"
done
```

---

## 12. Decisions log (why things are the way they are)

- **Why "Academia / Engineering / Globalization" and not "Publications / Projects / Software / Courses / Travel"?** The owner reorganized around three identity facets (scholar / maker / traveler) for narrative coherence. The 5-section flat nav was busy.
- **Why not "Glocalization" (more accurate term)?** Owner chose `Globalization` for being more universally readable; jargon precision wasn't the priority.
- **Why is `library_llm/` not in the project list?** It was an internal task, not a research project. Excluded from `data/projects.json` deliberately.
- **Why is `static/` not present?** Used to host an old courses page's stylesheet. Deleted during the refactor; courses content moved into `data/courses.json`.
- **Why is `YToo_SS.yaml` (Clash proxy config) gitignored?** Was committed by accident in the Hugo era. Now lives only as a local working file.
- **Why is the map height `calc(100svh - 68px)` and not `100vh`?** `svh` (small viewport height) is stable on mobile when the URL bar shows/hides; `100vh` jumps. The `68px` accounts for the sticky header.

---

*Last meaningful refactor: April 2026 — full migration from Hugo output to hand-written static site.*
