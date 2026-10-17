# Local Shopify preview renderer

A pure-Ruby stand-in for the Shopify Online Store 2.0 storefront. It renders any theme directory
(our `theme/`, Shopify Horizon, Dawn, …) against a JSON store fixture with Shopify's real Liquid engine
(vendored gem 5.14, MIT, `vendor/liquid`) plus Shopify's tags, objects, filters, section/block pipeline,
AJAX Cart / Section Rendering / predictive search / recommendations APIs. It is the measuring instrument
for the A/B gauntlet, so fidelity to real Shopify behaviour beats convenience.

No gems or packages: Ruby 3.3 stdlib, node 22 + global Playwright, python3 + Pillow (image resizing).

## Quick start

```sh
tools/dev.sh start            # :4100 ours (theme/), :4200 Horizon bar, :4300 Dawn
tools/dev.sh status
tools/dev.sh restart bar      # after changing renderer Ruby code (theme/fixture edits need no restart)
tools/dev.sh stop
```

Data: `$PREVIEW_DATA`, else `catalog/preview-data.json` when it exists, else `tools/preview/fixtures/sample.json`.
The bar (:4200) is Horizon **set up by a merchant**: before starting it, `dev.sh` runs
`tools/preview/bar/merchant_setup.py`, which writes an overlay (`$SCRATCH/bar/horizon-merchant`: Dutch copy instead of the
English demo text, colour swatches on in the variant picker, cart drawer opens after add-to-cart, hero image + a
"Kies een categorie" collection grid on the home page, footer menu headings) that the server applies with `--overlay`.
Horizon itself stays pristine; `BAR_STOCK=1 tools/dev.sh restart bar` serves the fresh-install look.
Images: `$PREVIEW_IMAGES`, else `<fixture dir>/images`. Logs and PID files: `$SCRATCH/logs/preview-<name>.{log,pid}`.
If `theme/layout/theme.liquid` does not exist yet, :4100 serves a clear placeholder page.

Run one server by hand:

```sh
ruby tools/preview/server.rb --theme theme --data tools/preview/fixtures/sample.json --port 4100 [--images DIR] [--bind 0.0.0.0] [--overlay DIR]
```

Theme files and the fixture are re-read on change (mtime caches); only renderer code changes need a restart.

## Tools

| command | what it does |
|---|---|
| `node tools/shoot.mjs --url URL --out PREFIX [--device desktop\|mobile\|both] [--full \| --tiles N] [--actions JSON] [--wait ms] [--reduced-motion]` | screenshots (1440×900 / 390×844, DPR 1) + `PREFIX.report.json` (console/page errors, failed requests, `X-Liquid-Errors` of the page *and* of every section/AJAX response, overflow-x, LCP/DCL/load, theme CSS/JS bytes). `--full` scrolls through the page first so lazy images and scroll-reveal animations run; `--reduced-motion` disables such animations entirely. All scrolling goes through the page's **real scroll container** (Horizon ≥990px scrolls `.page-wrapper`, not the window): tiles scroll it instantly (no smooth-scroll), wait until position, transitions and in-view images settle, continue below a stuck sticky header and stop at the end of the page; `--full` temporarily unlocks an inner scroller so the PNG has the real page height. The report's `capture` field lists scroller, tile offsets and page height |
| `node tools/ab.mjs --piece NAME --round N --path /x [--device both] [--tiles N \| --full] [--order AB\|BA] [--actions JSON \| --actions-ours/--actions-bar]` | blind A/B set: `$SCRATCH/shots/<piece>/r<N>/{A,B}-{desktop,mobile}-<n>.png`; letter→side mapping only in `$SCRATCH/ab-mapping/<piece>-r<N>.json` (outside `shots/`; override with `AB_MAPPING_DIR`). Shot in letter order and all files get the same mtime, so file metadata does not reveal which side is ours. Tiles stop at the end of a page; the shorter side is padded with neutral "einde van de pagina" tiles so A and B always have the same file count |
| `node tools/check.mjs --base http://127.0.0.1:4100 [--no-flows \| --flows-only] [--no-scroll] [--strict] [--only /cart]` | crawls every route type at desktop+mobile, scrolling each page top to bottom through its real scroller (lazy images/sections below the fold are requested and checked; overflow inside an inner scroller counts); exit 1 on Liquid errors, console/page errors, failed requests, overflow, broken images, raw translation keys. Then runs the interaction flows of `tools/flows.mjs` (default on): variant picker → `?variant=` + cart-form id + price change; add to cart → `/cart/add`, header count, line in drawer (or via cart icon/`/cart`), `+` → `/cart/change` + quantity 2, remove → empty; header search → `/search/suggest` + product link; one facet → `filter.*` request + URL. Flows are theme-agnostic (Horizon, Dawn and ours) |

Actions (`--actions`) are a JSON list executed in order: `{"click": sel}` (add `"force": true` for `aria-disabled`
elements such as sold-out swatches), `{"hover": sel}`,
`{"type": [sel, text]}`, `{"fill": [sel, text]}`, `{"press": "Enter"}`, `{"wait": ms|sel}`, `{"scroll": px|sel}`,
`{"select": [sel, value]}`, `{"goto": "/path"}`, `{"eval": "js"}`.

## Routes

Pages: `/`, `/collections`, `/collections/:h` (`?sort_by=`, `?page=`, `filter.v.availability`, `filter.v.price.gte/lte`,
`filter.v.option.<name>`, `filter.p.product_type|vendor|tag`, `filter.p.m.<ns>.<key>`; `/collections/:h/<tag>`),
`/collections/:h/products/:h`, `/products/:h` (`?variant=`, `?option_values=`, `?view=`), `/variants/:id`,
`/cart`, `/search` (`?q=`, `?type=`, Shopify query syntax incl. `id:1 OR id:2`, `tag:`, `-word`), `/pages/:h`,
`/blogs/:b` (`/tagged/:tag`), `/blogs/:b/:a`, `/policies/:h`, `/account*` (simple page: new customer accounts are
hosted by Shopify), `/password`, `/gift_cards/:code`, `/checkout` (summary stub), `/collections/vendors?q=` and
`/collections/types?q=` (automatic vendor/type collection: `collection.current_vendor` / `current_type`),
`/discount/<CODE>?redirect=/cart` (shareable discount link), everything else → `templates/404` (404).
Secondary published locales are served under `/<iso>/…` (e.g. `/en/products/x`).

APIs: `POST /cart/add(.js)` (form, multipart incl. file properties → `/cdn/uploads/…`, JSON incl. `items[]`; all-or-nothing:
a sold-out variant or a quantity above tracked stock with policy `deny` → `422` with the localized Shopify message in
`message` and `description`, e.g. `Je kunt maar 25 Statafelrok stretch - Wit aan je winkelwagen toevoegen.`),
`GET /cart.js|.json`, `POST /cart/change(.js)`, `/cart/update(.js)` (also the cart page form / checkout button),
`/cart/clear(.js)`, discount codes via `/cart/update.js {"discount":"A,B"}` (fixture `discounts[]`: order and
product discounts, minimums, free shipping; `discount_codes` reports `applicable` per code; amounts flow into
`cart_level_discount_applications`, `line_level_discount_allocations`, `final_price`, `total_price`, `total_discount`),
`GET /products/:h.js|.json`, `/products.json`, `GET /search/suggest(.json)` (+`section_id`),
`GET /recommendations/products(.json)` (`product_id`, `limit`, `intent`, `section_id`), Section Rendering API on any page
(`?section_id=` → wrapped HTML, `?sections=a,b` → JSON map; also on cart endpoints with `sections` + `sections_url`),
`POST /contact` (contact + newsletter → `?contact_posted=true` / `?customer_posted=true`, errors survive the redirect),
`POST /localization` (language → `/<iso>` prefix), `POST /password`. Helper: `GET /__preview/routes.json`.

Static: `/assets/<file>` (and `*.liquid` assets rendered), `/compiled_assets/styles.css|scripts.js` (all
`{% stylesheet %}`/`{% javascript %}` bodies, linked from `content_for_header`), `/cdn/images/<file>?width=&height=&crop=&format=`
(Pillow resize, cached in `$SCRATCH/cache/img`), `/cdn/fonts/<family>/<file>` (font_picker handles such as `inter_n4`
map to the vendored Google Fonts TTFs), `/cdn/shopifycloud/storefront/standard-events.js|standard-actions.js`
(local implementations of Shopify's storefront events/actions; `https://cdn.shopify.com/storefront/…` URLs in theme
output are rewritten to these), `/cdn/shopifycloud/shopify/assets/…` (gift card art, qrcode.js stand-in).

## Rendering pipeline (what is implemented)

- Layout (`theme.liquid`, `{% layout 'x' %}` / `none`, JSON template `"layout"`), JSON templates (order, disabled, blocks,
  block_order, static blocks, `wrapper`), template suffixes (`page.contact`, `?view=`), Liquid templates, section groups
  (`{% sections 'header-group' %}` → `sections--<id>__<key>` wrappers with group class + schema `class`/`tag`),
  static `{% section %}` (settings from `settings_data.json` or schema `default`), `content_for_index`.
- Settings: schema defaults + `settings_data.json` (`current` object or preset name), typed values (color objects,
  color schemes/scheme groups, Horizon `color_palette`, fonts, images `shopify://shop_images/…`, resources by handle,
  `url` `shopify://…` links, `liquid` settings), dynamic sources (`{{ settings.color_palette.foreground }}`,
  `{{ closest.product.title }}`), `t:` schema keys from `locales/*.schema.json`.
- Theme blocks: `{% content_for 'blocks' %}`, `{% content_for 'block', type:, id:, closest.product: …, extra params %}`,
  nested blocks, static blocks, `closest.*` resolution, innermost first: value passed with `content_for … closest.x:`
  (also on `content_for 'blocks'`), the block's own resource setting of that type (hotspot product picker), then each
  ancestor block and the section (e.g. Horizon's featured-product-information `settings.product` reaches its
  title/price/variant-picker blocks; product-list `settings.collection` reaches `{{ closest.collection.title }}`),
  finally the template's resource. A `"{{ closest.product }}"` dynamic source in an entity's own setting skips that entity.
- Translations: `locales/<shop locale>.json` over the default file, interpolation, pluralization (`count`), `_html`
  keys unescaped; missing keys render `translation missing: nl.key` and are counted (`X-Translation-Missing`).
- `content_for_header`: `window.Shopify` (shop, locale, currency, country, theme, routes.root, designMode=false,
  PaymentButton/loadFeatures stubs), standard-actions, compiled assets, preloads, dynamic-checkout button CSS.
- Errors: rendered inline exactly like Shopify (`Liquid error (sections/x.liquid line N): …`), counted in
  `X-Liquid-Errors`, summarised in an HTML comment at the end of every page (with any missing translations).
  Unknown filters are errors (strict filters). Unknown object properties render nil like Shopify but are listed
  in the `X-Preview-Unknown-Props` header (and in the comment with `PREVIEW_DEBUG_PROPS=1`) to find drop gaps.

## Known gaps vs real Shopify

- No checkout, customer accounts, automatic discounts, discount combination rules, selling plans, markets pricing or
  app blocks (`@app` blocks render nothing).
- `payment_terms`, `login_button` render nothing; `payment_button` renders Shopify's unbranded "Nu kopen" button.
- `{% stylesheet %}` CSS of *all* sections/blocks/snippets is bundled (Shopify bundles per theme); budgets measured
  this way are an upper bound for themes that put a lot of CSS in those tags.
- Placeholder SVGs are neutral line drawings, not Shopify's exact artwork.
- Search relevance is a simple scorer (title boost, AND words, OR alternatives, field filters). Matching follows
  Shopify's whole-word semantics: words are case/accent-insensitive tokens, every word must match, compound words are
  not split (`tent` does not find `partytent`), prefix matching only on the last word with `options[prefix]=last` and
  always in predictive search. `/search` searches title, type, vendor, tags, variant titles/SKU/barcode and body;
  predictive search defaults to title, product_type, variants.title, vendor (`resources[options][fields]` overrides).
  Sold-out products sort last (`unavailable_products=last`, also `show`/`hide`). No typo tolerance, no synonyms.
  Words also match on a light stem of the shop's primary language (Dutch: `statafels`→`statafel`,
  `partytenten`→`partytent`, `rokken`→`rok`, `hoezen`→`hoes`; English plurals), standing in for Shopify's
  language-aware search (exact Shopify stemming rules are unverified).
- Storefront filters: one filter's values are OR-ed, filters are AND-ed; variant filters (option, availability, price,
  variant metafields) must all hold for the *same* variant; availability=0 means some variant is sold out. Facet counts
  = products that would show with that value selected.

Behaviour chosen from Shopify knowledge without live verification (shopify.dev was unreachable while building):
non-`_html` translations are HTML-escaped; `date: '%B'` with a strftime string prints English names (like Ruby's
strftime) while `date: format: 'name'`, `time_tag` and `metafield_tag` dates localise month/day names; theme
blocks without `"tag": null` get `<div id="shopify-block-<id>" class="shopify-block">`; theme block ids are scoped per
section (`A<hash>__<key>`); `form.id` echoes the posted `contact[id]`; `block`, `section` and `closest` are visible in
snippets rendered from a block; `product.featured_media` is the first media (variant independent); color filters return
color objects for color-object input; related recommendations fill up to `limit` with the closest matches;
translation placeholders that are not passed stay as `{{ name }}` (Horizon fills `{{ count }}` in JS); negative money
is `-€19,95`; `image_url`/`file_url` are protocol-relative on the shop host (`//host/cdn/images/…`, like Shopify's CDN
URLs, so `'https:' | append: url` works); `page_image` = product featured media / collection image / article image /
`shop.social_sharing_image`; `canonical_url` drops variant/filter/sort params, keeps `?page=N`, and products reached via
a collection are canonical at `/products/<handle>`; on a secondary locale (`/en/…`) every resource `url`, menu link and
`shopify://` url setting carries the prefix, and the localization form's `country_code` is remembered (cookie
`localization`) for `localization.country`; variable Google Fonts with an `opsz` axis (Inter 4) are served with the
axis pinned to its default (text design), as Shopify's font library serves static text cuts.

Fixture format: see `FIXTURE_SCHEMA.md`. Regenerate the sample: `python3 tools/preview/fixtures/make_sample.py`.
