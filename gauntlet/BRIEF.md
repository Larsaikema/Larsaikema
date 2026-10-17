# Master brief — eigen-merk Shopify webshop (partytenten + statafels)

Every agent working on this project reads this file first. It is the single source of truth for
decisions. If something here conflicts with your own taste, this file wins; if something here is
impossible, say so in your result instead of silently deviating.

## 1. Goal

Build a **complete Shopify webshop** for a **new, original Dutch brand** that sells what
**Outmate.nl** (partytenten: easy-up Premium/Professional, stretchtenten, opblaasbare tenten,
stertenten, onderdelen & accessoires, bedrukte tenten, meubilair, verlichting) and
**Statafelshop.nl** (statafels, statafelrokken/-hoezen stretch & strik, statafelkleden, bedrukte
hoezen, actiepakketten, zakelijk/B2B) sell — with at least their full assortment depth and every
shopping feature they offer — but with its own name, identity, copy, imagery and a better
experience. Outmate.nl is run by Outmate BV (Staphorst); Statafelshop.nl by Deadan.com bv (Oosteind)
— two separate companies (corrected after round-4 research). The owner is Lars (works at
PartyHuren, an event-rental company) — the audience is consumers *and* businesses (horeca,
eventbureaus, verhuurbedrijven, verenigingen, scholen).

"Complete" means the owner can, without a developer:
1. upload `dist/<brand>-theme.zip` to Shopify (Online Store 2.0 theme, fully editable in the theme editor),
2. import `catalog/export/products.csv` (or run `scripts/seed/` against the Admin API) to get every
   product, variant, image, collection, page, menu and metafield,
3. follow `docs/` to configure markets, BTW, verzending, betaalmethoden, apps and B2B.

## 2. The gauntlet (how quality is enforced)

Prompt being executed (per the gauntlet-loop skill):

> Build a complete Shopify webshop for a new, original Dutch brand selling partytenten, statafels,
> statafelrokken and accessories, with the full assortment and every feature of Outmate.nl and
> Statafelshop.nl. The bar is twofold: Outmate.nl and Statafelshop.nl for assortment, features and
> content depth (pulled through web search, because direct access is blocked in this environment),
> and Shopify's own flagship Horizon theme, set up by a skilled merchant with exactly the same
> products, for look, feel and UX. Get the real things first and compare against them directly.
> Break this into the smallest pieces that can be judged on their own. For each piece, fan out a
> builder and a separate critic with fresh context. The critic screenshots ours and Horizon at
> desktop and mobile, strips the labels, picks the better one blind, checks feature parity against
> the reference inventory, and names the single biggest remaining gap. The critic is harsh; praise
> is not useful. Loop on each piece until the critic picks ours blind. Keep a live progress page.
> Fan out subagents and ultracode.

Roles — never mix them:
- **Builder**: changes files. Never judges its own work.
- **Blind judge**: sees ONLY two screenshot sets labelled A and B. Does not open the repo, does not
  know which is ours, answers "A or B is the better storefront for this piece, and why", plus the
  single biggest weakness of the loser and of the winner. Never a score out of 10.
- **Functional critic**: fresh context, knows which is ours, opens the actual rendered output
  (HTML, screenshots, browser interaction), checks against `reference/features.json`, Shopify
  correctness and this brief. Harsh. Returns pass/fail + the single biggest gap.
- A piece is DONE only when ≥2 of 3 blind judges pick ours AND the functional critic passes.

## 3. Environment facts (do not waste time re-discovering)

- Paths: `REPO=/home/user/Larsaikema`, `SCRATCH=/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad`,
  `VENDOR=$SCRATCH/vendor`.
- Outbound network is restricted. **Blocked:** outmate.nl, statafelshop.nl, shopify.com/dev, google
  fonts, unsplash, npm registry, pypi, every CDN. **WebFetch does not work** (DNS fails).
  **WebSearch works** — it is the only way to read the reference shops (ask it precise questions
  about specific URLs like `https://www.outmate.nl/product/...`). **git clone of public GitHub repos works.**
- No package installs possible. Available: node 22, global `playwright` 1.56 (load with
  `createRequire(import.meta.url)(\`${execSync('npm root -g')}/playwright\`)` or
  `NODE_PATH=$(npm root -g)`), Chromium at `/opt/pw-browsers` with WebGL2 via
  `--use-angle=swiftshader --enable-unsafe-swiftshader`, prettier, typescript, eslint, ruby 3.3
  (stdlib only, no webrick), python 3.13 with pillow, numpy, lxml, bs4, jinja2, pandas, openpyxl.
- Vendored (in `$VENDOR`, read-only references, NEVER commit Horizon or Dawn code into the repo):
  - `liquid/` — Shopify's real Liquid gem 5.14 (MIT). Needs `$VENDOR/strscan_shim.rb` required
    first (adds `StringScanner#peek_byte/scan_byte`). The preview tool vendors a copy under
    `tools/preview/vendor/liquid` (with LICENSE).
  - `horizon/` — Shopify Horizon 4.3 (the visual bar; license forbids redistribution → it stays in scratch).
  - `dawn/` — Shopify Dawn (reference for correct Liquid/Shopify API usage).
  - `threejs/build/three.module.js` + `threejs/examples/jsm/**` — for 3D product renders.
  - `gfonts/ofl/<family>/` — Google Fonts TTFs (inter, manrope, dmsans, spacegrotesk,
    bricolagegrotesque, fraunces, instrumentsans/serif, archivo, unbounded, syne, outfit,
    plusjakartasans, familjengrotesk, schibstedgrotesk, hankengrotesk, figtree, worksans, rubik,
    sora, lexend, redhatdisplay, onest, geologica, bebasneue, anton, oswald, barlow(condensed),
    archivonarrow, epilogue, chivo, karla, montserrat, poppins, assistant, playfairdisplay,
    dmserifdisplay, youngserif, gloock, ibmplexsans, publicsans, mulish, nunitosans, opensans, lato, raleway).
- Machine: 4 CPUs. Keep heavy processes few; reuse the long-running preview servers.

## 4. Architecture decisions (fixed)

- **Own theme, written from scratch** in `theme/` (Online Store 2.0): JSON templates, sections with
  classic section blocks, `@app` blocks in product-info / main sections, section groups
  (`header-group.json`, `footer-group.json`), `config/settings_schema.json` + `settings_data.json`,
  `locales/nl.default.json` (storefront default) + `locales/en.json`, schema labels in Dutch/English
  plain strings (no schema locale files needed). Vanilla JS custom elements, no build step, no
  frameworks, no external CDNs. Per-section CSS/JS assets. Dawn/Horizon may be *consulted* for
  correct Shopify API usage; do not copy their code wholesale.
- Shopify features to use properly: `image_url`/`image_tag` with srcset, `money` filters, product
  form with `/cart/add.js`, Section Rendering API for cart drawer/updates, predictive search
  `/search/suggest.json`, storefront filtering (`collection.filters`), `sort_by`, option-value
  swatches (`value.swatch`), metafields (`product.metafields.custom.*`), line-item properties
  (incl. file upload for custom print), `{% form 'customer' %}` newsletter, `{% form 'contact' %}`,
  `localization` form, new customer accounts (`routes.account_url`), gift card, password page,
  404, search, blog/article, list-collections, page templates (`page.zakelijk`, `page.contact`,
  `page.faq`, `page.offerte` …), structured data (`structured_data` filter / JSON-LD).
- **Preview renderer** (`tools/preview/`): Ruby + vendored Liquid, renders any theme dir against a
  JSON store fixture, implements Shopify objects/filters/tags + AJAX endpoints, so we can screenshot
  and click through both our theme and Horizon locally. Our theme is served on **:4100**, the
  Horizon bar on **:4200**. Servers re-read files on every request (edit → reload).
- **Catalog single source of truth**: `catalog/catalog.json` → generates `catalog/export/products.csv`
  (Shopify product CSV format), `catalog/preview-data.json` (renderer fixture) and seed-script input.
- **Images**: no photos can be downloaded. Product images are **3D renders** made with three.js in
  headless Chromium (`renders/`), saved as WebP/JPG in `catalog/images/`. Repo is public, so images
  can be referenced in the CSV via `https://raw.githubusercontent.com/Larsaikema/Larsaikema/claude/shopify-webshop/catalog/images/<file>`.
- Repo root must NOT get a `README.md` (this is the owner's GitHub profile repo; a root README
  would appear on his profile). Use `LEESMIJ.md` at root and `docs/` instead.

## 5. Repo layout

```
LEESMIJ.md            overview (NL)
brand/                brand book (brand.md), logo SVGs, tokens.json
reference/            dossier.md + features.json (reference inventory with source URLs)
catalog/              catalog.json, images/, export/products.csv, build script
renders/              three.js render scenes + runner
theme/                the Shopify theme
tools/preview/        local Shopify preview renderer (Ruby)
tools/shoot.mjs       Playwright screenshot / A-B tool
scripts/seed/         Admin API seeding script (Node, no deps)
docs/                 setup guides (NL), claims-to-confirm.md
gauntlet/             BRIEF.md, verdicts/, screens/, progress.json
dist/                 packaged theme zip
```

## 6. Honesty & legal rules (hard)

- **No fabricated social proof**: no invented reviews, star ratings, review counts, testimonials,
  customer counts, awards, "bekend van", trust-badge scores. Review UI reads standard review-app
  metafields (`reviews.rating`, `reviews.rating_count`) and renders nothing when absent. Fixtures
  contain no ratings.
- **Original work only**: never copy Outmate/Statafelshop text, images, logos or layout verbatim;
  match their *features and assortment*, not their words. Brand must not resemble theirs.
- Business claims (levertijd, "voor 14:00 besteld = vandaag verzonden", garantie, retour, gratis
  verzending drempel, prices) are theme settings / catalog data the owner can change, and every
  such claim is listed in `docs/claims-to-confirm.md`.
- Prices are realistic suggestions based on the reference market; flagged for owner review.
- Dutch copy: natural, warm-professional, je/jij (not u) unless the brand book decides otherwise;
  correct Dutch spelling (partytent, statafel, statafelrok, easy-up, zijwand, BTW/btw consistently).

## 7. Quality bars (measurable half)

- Liquid render errors: 0 on every template. JS console errors: 0. 404 assets: 0.
- Mobile 390×844 and desktop 1440×900 both first-class; no horizontal scroll.
- Lighthouse-like budget: CSS ≤ 90 KB, JS ≤ 70 KB per page (uncompressed, theme assets only),
  LCP image preloaded/eager with `fetchpriority="high"`, everything else lazy.
- WCAG 2.1 AA: contrast, focus states, keyboard nav for menus/drawers/swatches, labels, alt text.
