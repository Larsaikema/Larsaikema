# Backlog: search (functional critic, round 3, 2026-10-22)

Scope: the predictive dropdown in the header (`sections/predictive-search.liquid`, `snippets/header-search-empty.liquid`,
`assets/predictive-search.js`, `assets/search-fix.js`, `assets/section-header-search.css`) and the search page
(`sections/main-search.liquid`, `snippets/search-head.liquid`, `snippets/search-type-pills.liquid`,
`assets/section-main-search.css`, `templates/search.json`). I tested on :4100 at 1440×900 and 390×844, and also at
1366×768, 1280×720, 1024 and 768 px.

What I tested in Playwright:
- the empty-field panel
- typing: zijwand, statafel, statafelrok, 3x3, Ø80, a SKU, spanband, and the typos partytnt, stataffel and zijwnad
- ArrowUp/Down with aria-activedescendant, Enter on an option and with nothing chosen, Esc, Tab, a click outside, and the
  clear button
- slow network (delayed suggest and delayed stylesheet) and Zakelijk (excl. btw) prices
- on the results page: type pills, filters, chips, sort, Back, 'Meer laden' to the end, quick add (direct and through the
  dialog) and the mobile filter drawer with the sticky bar
- the dead end, the empty /search page, and searches that find only pages (garantie, kvk)
- no JavaScript, hostile terms, theme-check, check.mjs, contrast, and budgets after interaction

Fixed since round 2:
- the sticky Filteren bar on mobile
- the 990–1199 px tile clamp
- NBSP in sizes
- 'suggesties' in the live region
- the no-results dropdown dead end
- the dead-end grid now follows the fix
- the image-less thumb
- ’ in 'Pagina’s'
- a single search field on an empty phone page
- 'Toon N resultaten'
- the Safari mousedown focus

No blocker or high defects are open.

## Medium

- **The first tap on a phone can still open the panel detached from the field (load race; the round-2 fix does not hold).**
  `predictive-search.js` `open()` now measures the input (`i.getBoundingClientRect()`, line 88). That does not help on a
  phone: while `section-header-search.css` is not applied yet, the start panel sits in normal flow inside the form and
  moves the input itself. The input bottom is then at about 381 px, so `--predictive-top` becomes 389 px. Once the CSS
  arrives, the fixed panel floats about 250 px below the field, over the hero, until the shopper types (typing measures
  again). This happens whenever the 5.4 KB script finishes before the 7 KB stylesheet (`section-header.js:197` loads both
  in parallel). In 3 of 5 runs with realistic latencies (CSS 150/JS 120, 200/180, 60/40 ms) the gap was 249 px. Desktop
  is not affected.
  Repro: 390×844. `page.route('**/section-header-search.css*')` delayed 100 ms, tap the empty header field, compare the
  panel top with the input bottom (screenshot `race2-mobile.png`).
  Fix: open only after the stylesheet has loaded (await the `load()` promise of `data-css` before `define`, or before the
  first `open()`), or measure again in a `link.onload` / `requestAnimationFrame` after the CSS applies.

- **A highlight left from earlier makes Enter open a product instead of searching.** `open()` removes
  `aria-activedescendant` but leaves `aria-selected="true"` on the option that was highlighted before. The panel reopens
  through `first()` (focus or click on the field) with that option still highlighted. `onKey` then treats it as chosen
  (line 105), so Enter opens it. The same happens in the empty-field panel.
  Repro: 1440. Type 'zijwand', press ArrowDown 5 times (product 2), click outside the panel, click the field again (the
  product is still outlined, `aria-activedescendant` is gone), press Enter. You land on
  `/products/zijwand-easy-up-met-raam`, not on `/search?q=zijwand`. Empty field: ArrowDown 3×, Esc, click outside, click
  the field, Enter → `/search?q=statafelrok`.
  Fix: in `open()`, reset `[aria-selected=true]` to false in the panel being shown.

- **An option chosen with the keyboard can sit under the sticky 'Alle resultaten' footer.** `scrollIntoView({ block:
  'nearest' })` (line 112) scrolls the option into the panel's own box, and the sticky `.predictive__footer` covers the
  bottom of that box. At 1440×900, 'statafel' and 'partytent' leave the last option ('Maatadvies statafelrokken')
  4–17 px visible out of 80. At 1366×768 and 1280×720 it is hidden completely. On a phone or tablet with a keyboard, every
  category, advice and page option ends up 0 px visible. The focus indicator is then not visible (2.4.7). Mouse scrolling
  does reach everything.
  Repro: type 'statafel', press ArrowDown until `ps-page-1`, and check `elementFromPoint` at its centre (script
  `t21-kbfooter.mjs`).
  Fix: set `scroll-padding-bottom` on the scroll container to the footer height (and the top to the query row), or offset
  the scroll by hand.

- **Pages and advice found after page 1 are never shown, and the last 'Meer laden' click shows nothing.** The head aside
  only lists the pages and articles of the page rendered on the server. `facets.js` `loadMore` only appends
  `[data-product-grid] > li`.
  For 'zijwand' (63 products + 10 pages/articles), page 1 shows 1 article. The other 9 ('Easy-up partytent opzetten',
  'Partytent verankeren bij wind', 'Maatadvies partytenten' …) are on pages 3–4 and never appear. Page 3 still shows
  'Meer laden' (`main-search.liquid:309`, `paginate.next and page_products > 0`). Page 4 holds 0 products, so the third
  click adds nothing while the progress jumps to '73 van 73 resultaten'.
  Repro: `/search?q=zijwand&options%5Bprefix%5D=last`, click 'Meer laden' 3×.
  Fix: on load-more, also merge the fetched page's non-product items into the aside (or a 'Pagina’s en advies' block
  under the grid). Hide the button when the next page has no products, or show its pages instead.

- **The type pills on desktop are cut off and a mouse cannot reach them.** `.search-types__list` (section-main-search.css
  line 22) is `overflow-x:auto` with `scrollbar-width:none` and a fade mask, and has no arrow buttons. For 'zijwand',
  4 of the 8 pills are past the edge at 1440, 5 at 1280 and 6 at 1024. That includes 'Easy-up partytent 15', the largest
  type. A vertical mouse wheel does not scroll the row sideways. The workaround is the Soort filter in the sidebar.
  Repro: 1440, `/search?q=zijwand&options%5Bprefix%5D=last` (crop `pills-1440.png`, `pills-1024.png`).
  Fix: wrap the pills onto a second row under the bar on desktop, or limit them to what fits and add '+N' that opens Soort.

- **The category chips match stop words and letter strings inside other words, so they point at the wrong category.**
  `search-head.liquid:17–38` keeps every word of 3+ letters ('met', 'voor', 'led') and matches with `contains`:
  - 'led' gives one chip, 'Statafelkleden 2 producten' (stataf**el**kl**ed**en), while all 19 results are LED lighting and
    a 'Verlichting' collection exists.
  - 'met logo' gives 'Statafelhoezen met strik' and 'Partytenten met buizenframe' instead of 'Bedrukte partytenten' and
    'Bedrukte statafelhoezen'.
  - 'rok voor marktkraam' adds 'Onderdelen voor buizenframe-tenten'.

  Repro: `/search?q=led`, `/search?q=met+logo`.
  Fix: drop a short stop-word list (met, voor, van, en, de, het, een, op, in, bij, zonder) and match at word starts only
  (after a space or hyphen, or the start of the name), never in the middle of a word. When the match does not hold any of
  the products found, fall back to the share ranking.

- **The page goes over budget once the shopper uses it.** Theme CSS (files plus inline `<style>`) on
  `/search?q=prikkabel` is 88,992 B at load (desktop) and 89,346 B (mobile), just under 90 KB. Opening the header search
  adds `section-header-search.css` (7,032 B, up from 6,270 B in round 2), giving 96,024 B. A quick add then adds
  `component-quick-add.css`, giving 99,852 B. JS goes from 64,532 B to 69,953 B (+ `predictive-search.js`) to
  **74,602 B** (+ `quick-add.js`). On the dead end, JS is 72,247 B after the header search (+ `search-fix.js`).
  Repro: `t5-bytes.mjs` approach. Load the page, focus the header search, type 'stat', run a quick add, then add up the
  `/assets/*` bytes and the `<style>` bytes.
  Fix: trim `section-header-search.css` (back to ≤ 5 KB). Move the inline `<style>` blocks of main-search (search-help
  ~3.2 KB, load-more, active-filters, search-other) into `section-main-search.css` and load only the state's part. Do not
  load `facets.js` (28.6 KB) on the dead end and the empty page; only their start grid needs the quick add, and
  `quick-add.js` can serve it alone.

- **The sizes that match the term are still buried in the Maat filter (shared `snippets/facets.liquid`, collection
  owner).** For 'zijwand', Maat lists 42 tent sizes first. The wall lengths a 'zijwand' shopper needs (2 m … 8 m) are
  values 44–55 of 62. Horizon shows '2 m, 3 m, 4 m …' first for the same store. 'Uitvoering' mixes 73 values.
  Repro: `/search?q=zijwand&options%5Bprefix%5D=last`, open Maat.
  Fix: on the search template, sort the option values by count (descending) or put first the values of the products of the
  top 'Soort'. Keep the order by size on collections.

## Low

- **While a new term loads, the panel keeps the old term's results and footer link, with no loading state.** With the
  suggest request delayed by 2.5 s, typing 'zij' and then 'wand' leaves the 'zij' tiles, '8 suggesties' and 'Alle
  resultaten voor ‘zij’' on screen next to 'zijwand' in the field (`slow-stale.png`). Fix: on input, set `aria-busy` and
  dim the results. Update the footer link to the current term at once.
- **Pressing Esc twice clears the term and opens the panel again; ArrowDown does not reopen it.** The first Esc closes the
  panel. The second triggers the browser's native clearing of a search field, and the `input` handler then opens the
  empty-field panel. After Esc, ArrowDown does nothing (`onKey` returns when `!this.cur`). Fix: `preventDefault` on Esc
  while the field has text and the panel is closed (or keep the text), and let ArrowDown or Alt+ArrowDown open the panel
  again.
- **'Bedoelde je' keeps junk tokens that contain a digit.** `search-fix.js:38` returns any word with a digit unchanged.
  `/search?q=<img src=x onerror=alert(1)>` gives 'Bedoelde je onerror=alert(1)>?' with a link to that search (safe,
  textContent). Also, the dropdown fallback in `predictive-search.js:49` cuts the last word letter by letter. A long
  misspelt last word ('statafel' onmouseover='alert(3)') sends 11 sequential suggest requests before anything changes.
  Fix: keep only tokens of size patterns (`\d+([,.]\d+)?(x|×)\d+`, `ø?\d+`) and SKU-like codes. Cap the fallback at 3
  requests.
- **Units other than 'm' break from their number in dropdown titles.** 'Spanband met ratel, 50 mm' wraps to '50' / 'mm'
  at 1440 (`noimg-desktop.png`). The NBSP binding in `predictive-search.liquid:41–76` only covers ' m'. Fix: also bind
  ' mm', ' cm', ' kg' and 'Ø 80'.
- **'Foto volgt' is the first thing read in an image-less option.** The option's name is 'Foto volgt Spanband met ratel,
  50 mm …', because the placeholder span in `.predictive__noimg` is not aria-hidden. Fix: `aria-hidden="true"` on
  `.predictive__noimg`.
- **The spec line in the desktop tiles is cut in the middle of a unit.** Examples: 'Ramen van helder PVC · 320 g/…',
  'Vaste stalen kruisvoet · 110 of 1…' at 1440 ('statafel', 'zijwand'). Fix: allow 2 lines for `.predictive__meta` on
  desktop, or render only the first part when two do not fit.
- **A search that finds only pages still shows a price filter and price sort.** For 'garantie' (6 pages) and 'kvk', the
  sidebar or drawer holds only 'Prijs €0 – €0', and Sorteren offers 'Prijs laag-hoog' for a list of pages. On mobile, a
  full-width Filteren / Sorteren bar sits above the page list. Fix: set `has_filters` and the sort only when
  `page_products > 0` (or when any filter value count > 0).
- **The type pill count and the result count disagree after a pill is chosen.** Clicking 'Zijwand 9' shows '19 resultaten'
  with 9 cards. The 10 pages and articles stay in the count and the aside. Verify on Shopify whether filtered search drops
  non-products. If it does not, label the bar '9 producten · 10 pagina’s' when a product filter is active.
- **The mobile head row is a `<nav aria-label="Categorieën">` that also holds the advice and page links**
  (`search-head.liquid:174–189`). Fix: a neutral label ('Snel naar'), or split the two groups.
- **The hidden heading 'Producten voor ‘…’' gets an already escaped term in a non-`_html` key**
  (`main-search.liquid:261`, `'search.results_heading' | t: terms: terms_esc`). Shopify escapes non-`_html`
  translations, so 'tent & rok' is read as 'tent &amp; rok'. Fix: pass `terms` (raw), as Dawn does.
- **There are unused and conflicting locale keys.** `search.no_results_html` ('Controleer de spelling …', against the
  brand book's 'Check de spelling') and `search.pages` are not used anywhere. Fix: remove both from `nl.default.json` and
  `en.json`.
- **The category matching loops over the global `collections` without `paginate`** (`search-head.liquid:43`). Dawn
  paginates that loop. There are 44 collections today. Verify Shopify's cap on unpaginated `collections`; a collection past
  it would never be suggested. Fix: `paginate collections by 250` around the loop, or match against the main menu's
  collection links.
- **The results page HTML is heavy.** `/search?q=zijwand` is 462 KB, of which the facets panel is 96 KB (62 Maat + 73
  Uitvoering values, each label rendered twice). Fix: on search, render the first N values per facet and load the rest on
  'Bekijk alles'.
- **(Shared product card, collection owner) On a phone, titles break at the hyphen of 'easy-up'.** Examples: 'Zijwand
  easy-' / 'up dicht' and 'Zijwand easy-' / 'up met raam' at 390 on `/search?q=zijwand`. Fix: in `product-card.liquid`,
  replace 'easy-up' with 'easy‑up' (U+2011) when rendering the title.
