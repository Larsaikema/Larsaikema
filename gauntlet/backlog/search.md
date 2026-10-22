# Backlog: search (functional critic, 2026-10-18)

Scope: the predictive dropdown in the header (`sections/predictive-search.liquid`, `snippets/header-search-empty.liquid`,
`assets/predictive-search.js`, `assets/section-header-search.css`) and the search page (`sections/main-search.liquid`,
`assets/section-main-search.css`, `templates/search.json`), on :4100 at 1440×900 and 390×844, plus 768, 1024 and 1280 px.
I tested these in Playwright:
- the empty-field panel, typing ('zijwand', 'statafel', '3x3', 'Ø80', a SKU, 'retour', 'partytnt'), ArrowUp/Down
  with aria-activedescendant, Enter on an option, Enter with nothing chosen, Esc, Tab, a click outside, the clear
  button, a fast type-and-delete race, Zakelijk (excl. btw) prices
- the results page: filters, chips, sort, 'Meer laden', Back, quick add, the mobile filter drawer, no JavaScript,
  the dead end ('Bedoelde je …?') and the empty /search page
- theme-check, escaping of the term, budgets

The one high finding (mobile: after scrolling, the sticky Filteren/Sorteren bar under the hidden header does not respond
to taps, `assets/section-header.css:43`) is in the verdict, not in this list.

## Medium

- **The page goes over budget once the shopper uses it, and the dead-end and empty pages load facets.js for nothing.**
  Theme CSS is counted with the inline `<style>`. On `/search?q=zijwand` (desktop) it is 79,751 + 7,611 B (87.4 KB) at load.
  After focusing the header search (`section-header-search.css` 6,270 B) it is **93.6 KB**. After a quick add as well
  (`component-quick-add.css` 3,828 B) it is **97.5 KB**. JS goes from 63,907 B to 68,007 B after search and to
  **72,659 B** after quick add (`quick-add.js` 4,652 B).
  `/search?q=xyzqq` and `/search` reach **95.3 / 95.5 KB** CSS after using the header search, and 71,055 B JS
  when `-mega.js` loads. `main-search.liquid:16` loads `facets.js` (27,940 B) on every state, also the dead end and the
  empty page, where there are no facets, sort or 'Meer laden'.
  Repro: the `s10.mjs` approach. Load the page, scroll, click the header search, type 'stat', then add up the
  `content-length` of `/assets/*.css|js` and the `<style>` bytes.
  Fix: render the `facets.js` tag only when `search.performed and dead_end == false`. Move the large inline `<style>`
  blocks (search-help about 3.2 KB, search-page form, load-more) into `section-main-search.css` and trim them. Slim
  `section-header-search.css`: it has grown from 3.5 KB to 6.3 KB since the header verdict.

- **In Safari, clicking 'Alle resultaten voor ‘…’' (and 'Stel je vraag') in the dropdown closes the panel without
  navigating.** This is plausible but only emulated, because there is no WebKit here. `predictive-search.js`
  `focusout` → `setTimeout(() => this.contains(document.activeElement) || this.close())`. In WebKit a link without a
  tabindex is not focusable with the mouse, so mousedown moves focus to `<body>`. The panel gets `hidden` before
  mouseup, and the click never reaches the link. The options are not affected, because they have `tabindex="-1"`.
  Repro (Chromium with the WebKit focus model emulated, `s23.mjs`): type 'statafel', then add a capturing mousedown
  listener that blurs and calls preventDefault for an `<a>` without a tabindex. Press and release on `[data-predictive-all]`
  120 ms apart. The URL stays `/` and the panel is closed. `#ps-product-1` still navigates.
  Fix: `this.addEventListener('mousedown', (e) => e.target.closest('.predictive') && e.preventDefault())` (keeps focus
  in the field, as Dawn effectively does with tabindex on every item), or ignore a focusout with a null relatedTarget
  while a pointer is down inside the panel.

- **The popup can still open detached from the field (load race, still open from the header backlog).** `open()` sets
  `--predictive-top` from `this.getBoundingClientRect().bottom`. When `predictive-search.js` runs before
  `section-header-search.css` has applied, the start panel is still in normal flow. It makes the host about 480 px tall,
  so the fixed popup lands at about 630 px with only 200 px of height.
  Repro (`s25.mjs`): `page.route('**/section-header-search.css*')` delayed by 1.5 s, at 390×844. Tap the field and
  `--predictive-top` = 629.6 px while the input bottom is 140 px (desktop: 598 px). Screenshot `race-slowcss-mobile.png`.
  Fix: measure the `<form>` (or the input) instead of the host, and call `open()` again once the stylesheet has loaded.

- **At 990–1199 px the product tiles in the dropdown cut titles to two lines, so look-alike products cannot be told
  apart.** At 1024 'statafel' shows 'Statafel inklapbaar…' twice (Professional and HDPE Ø80 cm), and also
  'Statafel vierkant…' and 'Statafel rechthoekig…'. The tiles are about 135 px wide next to the side column.
  Repro: viewport 1024×800, type 'statafel', screenshot `w1024-typed.png`.
  Fix: use 2 product columns (or rows like the phone) below 1200 px, or narrow the side column. Never clamp the title
  below what tells products apart.

- **On search, the sizes that match the term are buried in the Maat filter.** For 'zijwand' the Maat facet lists
  40 tent sizes (1,5 × 2 m … 12 × 12 m) first. The wall lengths a 'zijwand' shopper needs ('2 m', '3 m', '4 m', '4,5 m',
  '5 m', '6 m', '8 m') are values 43–55 of 62, behind 'Bekijk alles (62)'. 'Uitvoering' similarly mixes 69 values
  (haringen, sets, PVC grades).
  Repro: `/search?q=zijwand&options%5Bprefix%5D=last`, open Maat. The workaround is the 'Zijwanden' category chip or
  'Bekijk alles'.
  Fix (shared `snippets/facets.liquid`, collection owner): on the search template, sort option values by count
  (descending) or by the products of the top 'Soort', and keep the dimension order for collections.

## Low

- **Sizes in dropdown titles break across lines.** `predictive-search.liquid` sets `times_nb = ' × '` with plain spaces
  (bytes `20 C3 97 20`). `snippets/product-card.liquid:23` uses U+00A0 (`C2 A0 C3 97 C2 A0`). At 1440 'Easy-up partytent
  Professional 3 ×' wraps to '3 m'. Repro: type '3x3' (screenshot `pred-3x3.png`). Fix: copy the card's NBSP
  string, and also bind the unit ('3 m').
- **'Statafelrokken en -hoezen' breaks after the hyphen in the dropdown side column** ('Statafelrokken en -' / 'hoezen')
  at 1440 and 1024. Repro: type 'statafel'. Fix: in the predictive (and search-head chip) title, replace ' -' + letter
  with a non-breaking hyphen (U+2011), or wrap '-hoezen' in `white-space:nowrap`.
- **The live region announces the dropdown item count as 'resultaten'.** 'zijwand' announces '8 resultaten'
  (6 products + 1 category + 1 article), while the results page says '72 resultaten'. The status also keeps the old count
  when the field is emptied and the start panel shows. Repro: read `[data-predictive-status]` after typing 'zijwand'.
  Fix: a separate key ('8 suggesties') and clear the status in `open(true, this.start)`.
- **'Toon N producten' on search counts pages and articles.** The drawer footer says 'Toon 72 producten' for 71 products
  + 1 article ('zijwand'), and 'Toon 19 producten' with Kleur Zwart on 'statafelrok', where 2 of the 19 are pages.
  Repro: 390×844, `/search?q=statafelrok`, Filteren, tick Zwart. Fix: on search, use a 'Toon N resultaten' key or count
  products only.
- **The no-results dropdown is a dead end.** 'partytnt' shows only 'Niks gevonden …' plus the link. The popular
  searches and categories from the empty-field panel are not offered, and the 'Bedoelde je …?' correction exists only
  on the results page. Repro: type 'partytnt' (`pred-nores-desktop.png`). Fix: render the start panel's groups under the
  empty message (the markup already exists in `header-search-empty.liquid`).
- **'Bedoelde je' suggests nonsense for gibberish and fires many requests.** `/search?q=xyzqq%20blabla` → 'Bedoelde je
  blauw?' ('blabla' is cut to 'bla'). 'stataffel rokk zwrat' sends 9 sequential `/search/suggest.json` requests and
  drops 'zwrat' silently. Fix: accept a hit only when the prefix covers at least about 70 % of the word (or edit distance
  ≤ 2), and cap at 2 requests per word.
- **The dead-end 'Misschien zoek je een van deze' always shows Partytenten**, also when the corrected term is about
  statafels ('stataffel' → 'Bedoelde je statafel?' above 4 tents). Fix: when the did-you-mean finds a category, show that
  collection's products, or fall back to `collections.all` best sellers.
- **A product without an image shows an empty Linnen square in the dropdown.** Cards show the tent icon with 'Foto
  volgt'. Repro: type 'rok' → 'Rok voor marktkraam'. Fix: render the same placeholder icon in `.predictive__thumb` when
  `featured_media` is blank.
- **Straight apostrophe in 'Pagina's' / 'Pagina's en advies'** (`locales/nl.default.json` `search.pages`,
  `search.other_results`). The brand book and the rest of the copy use ’ ('Pagina’s'). Fix: use U+2019.
- **The empty /search page shows two identical search fields on a phone** (header plus page field, both 'Zoek op
  product of maat'), and the page field has no suggestions. At 1440 the page field uses the short placeholder although
  the long 'Zoek op product, maat of artikelnummer' fits, so SKU search is not mentioned. Repro: `/search` at 390 and 1440.
  Fix: hide the page form under 990 px (or focus the header field), and use the long placeholder on desktop.
- **Matching categories iterate the global `collections` without pagination** (`main-search.liquid:95`). There are
  44 collections today. Verify Shopify's cap on unpaginated `collections` loops (Dawn wraps them in `paginate`): a
  collection past the cap would silently never be suggested. Fix: wrap the loop in `paginate collections by 250`,
  or match against the main menu's collection links.
- **The search page HTML is 447 KB** (the collection page is 363 KB). The facets panel alone is 94 KB because search
  returns up to 62 Maat and 69 Uitvoering values, each rendered twice (label plus count text). This is not a budget
  item, but it is heavy on a phone. Fix: on search, render only the first N values per facet server-side and load the
  rest on 'Bekijk alles'.
