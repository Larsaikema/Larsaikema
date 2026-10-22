# Backlog: header (functional critic, 2026-10-22)

Scope: the USP bar (`sections/announcement-bar.liquid`), the header row (`sections/header.liquid`: search, btw toggle,
Offerte, account, cart), the desktop mega menu and the mobile menu drawer. Tested on :4100 at 1440×900 and 390×844.
Also checked at 320, 360, 768, 990, 1024, 1180, 1280×720 and 1366×768, plus touch tablets at 1024, 1180 and 1366.

What was tested in Playwright:
- **Mega menu:** hover on all 9 items, chevron click, Enter and Space, Tab into and out of a panel, Esc (focus goes
  back to the chevron), and the tallest panel at low heights (it scrolls inside).
- **Links:** all 243 unique links in the header group return 200 with 0 Liquid errors, and the filter links return
  products.
- **Drawer:** focus on open, all 9 panels, the accordions, Esc one level and then closed, the backdrop, scroll lock,
  and focus going back to the Menu button.
- **Search:** the empty state, '3x3', 'statafelrok', the typo 'partytnt', the SKU prefix 'KK-', and 'Ø80'.
  ArrowDown with aria-activedescendant, then Enter on an option, Enter with no option, and Esc followed by Enter.
- **btw toggle:** prices follow it in the cards, the hero and the predictive results (279/1,21 = 230,58), and the
  choice survives a reload.
- **Cart:** add to cart updates the count and the aria-label ('Winkelwagen, 1 product'), and a count of 120 fits the
  bubble.
- **Other:** sticky scroll-up, the /en locale, and the countdown at 9 fixed clock times (Friday after the cutoff,
  Saturday, 24 and 31 December, the DST Sunday, 1 minute before the cutoff, and mobile wording). Every case was right.
- **Contact settings filled in a temporary overlay server:** the phone panel in the bar, WhatsApp in the menu bar from
  1200 px, the drawer contact rows and the opening hours.

Results: 0 console errors, 0 Liquid errors, no horizontal overflow, no duplicate ids and no dangling aria references.
theme-check PASS, with 0 offences in header files. No blocker and no high was found. Everything below is medium or low.

## Medium

- **Search start popup: the CSS/JS load race is still there, and it is worse than first reported.**
  The cause: `predictive-search.js` and `section-header-search.css` are requested together on the first touch or
  focus. When the JS runs first, `connectedCallback` → `first()` → `open(true, start)` un-hides the start popup while it
  is still unstyled and in normal flow. The search field gets squeezed to about 95 px, and a bare list of links and
  thumbnails covers the header and hero. `--predictive-top` is also taken from that tall host (`this.getBoundingClientRect()`).
  Once the CSS lands, the result depends on the width:
  - Mobile: the popup is fixed at top 630 px with a max-height of about 202 px. It is detached from the field and cut
    off until the shopper types.
  - Desktop: the popup is capped at 286 px tall, because `max-height` uses the wrong top.

  Repro (deterministic): in Playwright, `page.route(/section-header-search\.css/, r => setTimeout(() => r.continue(), 1500))`,
  then load `/` at 390×844 and tap the search field. Read `--predictive-top` from `<predictive-search>`: it is
  `629.58px`, where normal is 148 px. Desktop 1440 gives `598.4px` and a popup height of 286. Screenshots:
  `race-mobile-before.png` and `race-mobile-after.png` in `$SCRATCH/crit-header/now/`.

  Fix: let predictive-search.js wait for the CSS promise (`KK.hdr.load(css)`) before the first `open()`. Also compute
  the top from the `<form>` or input, not the host, or recompute it on every `open()` after the CSS is ready.

- **Using the header pushes every PDP, collection and search page over the CSS budget, and most over the JS budget.**
  Figures are in KiB, at load → after one menu hover or drawer open plus typing '3x3' in search, with inline CSS
  counted.

  | Page | CSS | JS |
  |---|---|---|
  | `/` | 86.8 → 92.9 | |
  | `/collections/partytenten` | 87.4 → 93.5 | 67.3 → 74.3 |
  | `/products/easy-up-partytent-premium-3x3` | 88.6 → 94.7 | 70.1 → 77.1 |
  | `/search?q=statafel` | 85.8 → 91.9 | 67.3 → 74.3 |
  | Mobile PDP | 88.9 → 95.1 | 70.1 → 76.7 |

  Budgets are CSS 90 KB and JS 70 KB. The header's own share:
  - CSS: `section-header.css` 12.0 KB, `-mega.css` 6.2, `-search.css` 6.3 (was 3.5 last round), `-loc.css` 1.3,
    `-drawer.css` 6.6.
  - JS: `section-header.js` 10.6 KB, `-mega.js` 3.0, `predictive-search.js` 4.1, `-drawer.js` 2.6.

  Repro: `node $SCRATCH/crit-header/now/b1.mjs`. The PDP is already at 70.1 KiB JS at load (PDP piece).

  Fix ideas:
  - Move the countdown wording logic out of `section-header.js`. `delivery-countdown.js` is loaded on every page anyway.
  - Trim `-search.css` back.
  - Merge `-mega.js` and `predictive-search.js`.

- **On a touch screen of 990 px or wider (iPad landscape), the only way to open a mega panel is a 21 px chevron.**
  Tapping the label goes to the category. `.nav__toggle` is 21×46 px from 990 to 1199 px and 29×46 px from 1200 px.
  That is below brand.md §10 (touch targets at least 44 px).
  Repro: open a context of 1024×768 with `hasTouch`, `isMobile` and an iPad UA. `matchMedia('(hover:hover) and
  (pointer:fine)')` is false, and all 9 toggles measure `21x46` (`$SCRATCH/crit-header/now/t1.mjs`).
  Fix: on `(hover:none)` make the whole item the disclosure (the panel starts with 'Alles in …'), or widen the hit area
  to at least 44 px with padding or a pseudo-element.

## Low

- **The menu button has no 'Menu' label on a phone (brand.md §7.2: 'Mobiel: ‘Menu’ en ‘Sluiten’').** The label is
  hidden below 750 px, while the drawer does show 'Sluiten'.
  Repro: open `/` at 390×844. Top left is a bare hamburger. At 768 the label is visible (`w768.png`, `w320.png`).

- **On `/pages/offerte` the header's 'Offerte' action is not marked as current.** Instead,
  `aria-current="page"` sits on 'Offerte vanaf 10 stuks' in the Met jouw logo panel.
  Repro: `curl -s :4100/pages/offerte` and check `.header__action--quote`: no aria-current, and the only one in
  `<sticky-header>` is on `hlinks__link` 'Offerte vanaf 10 stuks'.
  Fix: give the action `aria-current="page"` and an active style when `request.path` equals `quote_url`.

- **A click on the dimmed page under a pinned mega panel also clicks what is beneath it.** `.header__scrim` has
  `pointer-events:none`.
  Repro: at 1440, click the Partytenten chevron (the panel pins, bottom edge at 601), then click (899, 679). The panel
  closes and the page goes to `/products/easy-up-partytent-premium-3x3` (`s1.mjs`). The click should only close the
  panel.

- **Verlichting › 'Onderdelen' looks like a category but opens one product.** The heading links to
  `/products/onderdelen-prikkabel-en-lichtslang`, and that product's own link ('Fittingen, eindkap en kabel per meter')
  is dropped as a duplicate.
  Repro: hover Verlichting at 1440 and click 'Onderdelen'. The same happens in the drawer.
  Fix (catalog menu data): point the heading at a collection, or make it plain and keep the product link.

- **Some products have different menu names, and one name promises the wrong product.**
  - `pakket-10-statafels-stretchrokken-transportkar` is '10 statafels met rokken en kar' under Statafels and
    'Statafels met rokken en kar' under Pakketten.
  - `onderdelen-stretchtent` is 'Palen en onderdelen' under Partytenten › Stretchtenten but 'Spanmateriaal
    stretchtent' under Accessoires. A separate product 'Palen stretchtent' (`/products/palen-stretchtent`) exists, so
    'Palen en onderdelen' promises poles and opens the spanmateriaal.

  Repro: collect `sticky-header .mega a[href^="/products/"]` and group the labels by href.

- **Two Accessoires headings do not match where they lead.**
  - 'Bevestigingsmateriaal', and in the drawer 'Alles in Bevestigingsmateriaal', opens the collection titled
    'Gewichten en verankering'.
  - The 'Alle onderdelen' column holds only 'Zijwanden' and 'Tassen en wielsets', which reads as if all parts were
    walls and bags. Both already appear under 'Voor easy-up'.

  Repro: hover Accessoires at 1440 (`d-mega-4.png`), or open Accessoires › Bevestigingsmateriaal in the drawer
  (`m-panel-4c.png`).

- **There is no way from the header into the advice hub, Over ons or Contact.** `/blogs/advies` appears only in the
  page body and footer. The drawer has only Veelgestelde vragen and Klantenservice. Statafelshop has Blog, Over and
  Contact in its header, and Outmate has an inspiration column in every panel.
  Repro: run `grep -c 'href="/blogs/advies"'` over the `<sticky-header>` and `#MenuDrawer` markup: 0.
  Fix: add a servicelink block 'Advies' to the USP bar (the drawer copies it), or an advice column or link per panel.

- **Inline CSS in the header markup.**
  - `sections/header.liquid` lines 387 and 389: `style="margin-top:20px;font-size:14.5px;…"` on `.mdrawer__hours`,
    and `style="margin:0"`.
  - `snippets/header-contact.liquid` prints a `<style>` block in the body when a phone or WhatsApp is set.

  Repro: fill Thema-instellingen › Contact (phone, opening hours) and inspect the drawer and the menu bar.
  Fix: move both into `section-header-drawer.css` and `section-header.css`.

- **The header markup is heavy on every page.** The header group is 162 KB of HTML (19 KB gzip) with 2 150 elements,
  46 % of the home DOM. That is up from 150 KB and 1 928 elements. It holds 132 inline SVGs, and the drawer alone is
  83 KB.
  Repro: `curl -s :4100/`, then measure from the first `shopify-section-sections` to `<main`.
  Fix: an SVG `<use>` sprite for repeated chevrons and arrows, or render the drawer panels lazily.

- **The country and language chooser flashes unstyled before its CSS arrives.** `section-header-loc.css` loads on
  first reach. A keyboard user (focus → Enter) or a fast click opens the `<details>` before it lands, and the USP bar
  stretches to 248 px with bare chips.
  Repro: delay `/section-header-loc\.css/` by 1.5 s with `page.route`, focus `.utility-bar .hloc__summary` and press
  Enter (`race-loc.png`).
  Fix: keep the panel `hidden` until the CSS is ready, or inline its few rules in `section-header.css`.

- **The first hover on the desktop menu gives no feedback until `section-header-mega.js` arrives.** The script loads
  on the first pointerenter of the nav, and the CSS hover fallback is off once JS runs. In the preview the first panel
  opened 1.3–2.3 s after hovering on cold loads (`st2.mjs`).
  Fix: preload the 3 KB script during idle together with `-mega.css`, or show the busy state on hover as well as on
  click.

- **Some mega panels show the same link twice.** A panel with no promotion block shows a collection fallback card
  ('Partytenten · 32 producten · Bekijk alles'). It repeats the 'Alles in Partytenten 32 →' link at the top of the same
  panel. This affects Partytenten, Rokken & hoezen, Accessoires, Meubilair, Verlichting and Pakketten.
  Repro: hover Partytenten at 1440 (`d-mega-0.png`).
  Fix: show the picture card without a second link, or drop it when 'Alles in …' is shown.

- **The USP bar's pause button is first on screen but last in the Tab order.** It is drawn at the far left (x = 30)
  but reached after all three USP messages.
  Repro: at 1440, Tab from the skip link: the order is 3 messages, then 'Wisselende berichten pauzeren'.
  Fix: put the button before `<usp-rotator>` in the markup.
