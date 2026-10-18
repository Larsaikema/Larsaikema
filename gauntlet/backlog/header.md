# Backlog: header (functional critic, 2026-10-18)

Scope: the USP bar (`sections/announcement-bar.liquid`), the header row with search, btw toggle, Offerte, account and
cart (`sections/header.liquid`), the desktop mega menu and the mobile menu drawer, on :4100 at 1440×900 and 390×844.
I also checked 320, 360, 768, 990, 1024 (also with touch and hover:none), 1100, 1200 and 1280 px. Tested in Playwright:
- mega menu: hover intent, moving between items, a diagonal move into a panel, a click on the chevron that pins the
  panel, a click outside, Esc (focus goes back to the chevron), Enter and Space on the chevron, Tab through a panel and
  out of it (the panel closes), and the busy state
- all 205 unique links in the bar, header, mega panels and drawer: every one returns 200 with 0 Liquid errors
- drawer: open, focus on 'Sluiten', Tab order, opening a panel (focus on 'Terug', root inert), accordions, Esc one level
  back and then closed (focus back on the Menu button, scroll lock released), a click on the backdrop, every panel
- search: the empty state (Populair plus Categorieën), predictive results for '3x3' and 'statafelrok', a typo
  ('partytnt' shows the no-results text), ArrowDown with aria-activedescendant, Esc, submit, and the term kept on /search
- btw toggle (stays excl. after a reload, both toggles in sync), add to cart (bubble, aria-label 'Winkelwagen,
  1 product', favicon, focus goes back), sticky scroll-up with the wheel, country BE and language EN, and no JavaScript
  (the drawer opens through the invoker command, the mega menu through :hover/:focus-within)
- the USP countdown at 11 fixed clock times (before and after the cutoff, weekend, 25 Dec, 31 Dec, just after
  midnight): the dispatch day is right every time
- contrast of every text in the header (all ≥ 4.68:1), theme-check (PASS), budgets

There are no console errors, Liquid errors or horizontal overflow, and no blocker or high was found. Everything below
is medium or low.

## Medium

- **The empty search popup on a phone can open about 480 px below the field, detached from it and cut off.**
  The cause is a load race in `assets/predictive-search.js`: `open()` sets `--predictive-top` from
  `this.getBoundingClientRect().bottom`. When `predictive-search.js` arrives before `section-header-search.css`, the
  start popup is still in the normal flow at that moment, so it makes `<predictive-search>` about 480 px tall and
  `--predictive-top` becomes about 630 px. When the CSS arrives, the popup becomes `position:fixed` at 630 px with a
  max-height of about 200 px. It stays there until the shopper types.
  Repro: at 390×844, load `/` and click the search field right after `load`, before both files have arrived. In
  `t8c.mjs` it happened in 1 of 3 runs: `varTop: "629.578125px"` against 148 px normally. The screenshot is
  `mobile-search-empty.png`.
  Fix: compute the top from the `<form>` or the input instead of the host element, or recompute it once the CSS has
  loaded (wait for both files before the first `open()`).

- **On a touch screen of 990 px or wider (iPad landscape), the only way to open a mega panel is a chevron 21 px
  wide.** Tapping the label goes to the category, by design. The `.nav__toggle` button measures 21×46 px from 990 to
  1199 px and 29×46 px from 1200 px, which is below brand.md §10 (touch targets at least 44 px) and below the 24 px of
  WCAG 2.2 2.5.8.
  Repro: open a context of 1024×768 with `hasTouch`, `isMobile` and an iPad UA. `matchMedia('(hover:hover) and
  (pointer:fine)')` is false. Measure `.nav__toggle`: `21x46` nine times. Tapping 'Statafels' opens the collection,
  and only the 21 px chevron opens the panel.
  Fix: on `(hover:none)` at ≥ 990 px, either make the whole item a disclosure (the panel already starts with
  'Alles in …') or widen the chevron's hit area to at least 44 px with padding or a pseudo-element.

- **Using the header pushes the PDP over the JS budget and over the CSS budget.** The header loads its menu and
  search files on first use (`section-header-mega.css` 6.0 KB, `-mega.js` 3.0 KB, `-search.css` 3.5 KB,
  `predictive-search.js` 3.9 KB, and on mobile `-drawer.css` 6.6 KB plus `-drawer.js` 2.6 KB). It also loads
  `section-header.css` (12.0 KB) and `section-header.js` (10.6 KB) on every page.
  Repro (`t6-budget.mjs`): `/products/statafelrok-stretch` or `/products/easy-up-partytent-premium-3x3` on desktop
  loads JS 65 973 B, which becomes **72 878 B** after hovering the menu and typing in search (budget 70 KB). CSS goes
  from 76 561 B + 7 042 B inline to **86 109 B + 7 042 B = 93.2 KB** (budget 90 KB). On mobile the PDP is at
  83 290 B + 7 042 B = 90.3 KB at load, because the drawer CSS loads while idle. `/collections/partytenten` reaches
  69.1 KB JS after header use.
  The PDP piece shares this problem. On the header side, trim `section-header.js` (the countdown text logic could live
  in `delivery-countdown.js`, which every page loads anyway) and `section-header.css` (move the
  990–1199 px rules and the btw toggle into the lazy files), or merge `-mega.js` and `predictive-search.js`
  (together about 7 KB).

## Low

- **The menu button has no 'Menu' label on a phone.** brand.md §7.2 says 'Mobiel: ‘Menu’ en ‘Sluiten’'. The drawer
  shows 'Sluiten', but below 750 px the opener is only an icon (`.header__action-label` 'Menu' is hidden, and the
  label is only visible from 750 px, `w768.png`).
  Repro: open `/` at 390×844 and look at the top left of the header (`home-mobile.png`).

- **On `/pages/offerte` the menu marks the wrong item as current.** The header's own 'Offerte' action gets no
  current state. Instead the deep link 'Offerte vanaf 10 stuks' (Met jouw logo › Zo werkt bedrukken) gets
  `aria-current="page"`, which a screen reader announces as the current page inside a closed panel.
  Repro: `curl -s :4100/pages/offerte` and look in `<sticky-header>`: the only aria-current is on `hlinks__link`
  'Offerte vanaf 10 stuks'.
  Fix: give the Offerte action `aria-current="page"` and an active style when `request.path` equals the quote URL.

- **A click on the dimmed area under an open mega panel also clicks the page beneath.** `.header__scrim` has
  `pointer-events:none`, so a click meant to close the panel also follows the link or button under it.
  Repro: at 1440, click the 'Partytenten' chevron (the panel stays pinned), then click the dimmed 'Vraag een offerte
  op maat aan.' link at about (250, 619), just below the panel's bottom edge at y = 601. The panel closes and the
  page goes to `/pages/offerte` (verified in `t16-scrim.mjs`). It should only close.

- **Verlichting › 'Onderdelen' looks like a category but opens one product.** The column heading links to
  `/products/onderdelen-prikkabel-en-lichtslang`. The link with that product's own name ('Fittingen, eindkap en
  kabel per meter') is then dropped as a duplicate of the heading, so the shopper never sees what the heading opens.
  Repro: hover 'Verlichting' at 1440, then click 'Onderdelen'. The same thing happens in the drawer under Verlichting
  › Onderdelen.
  Fix (catalog menu data): point the heading at a collection, or make the heading plain and keep the product link.

- **One product has two different menu names.** `pakket-10-statafels-stretchrokken-transportkar` is '10 statafels
  met rokken en kar' under Statafels › Statafelpakketten and 'Statafels met rokken en kar' under Pakketten ›
  Statafelpakketten. That is catalog `menus.json`, but it shows in the header.
  Repro: hover 'Statafels', then 'Pakketten', at 1440 (`d-mega-statafels.png`, `d-mega-7.png`).

- **There is no way into the advice hub ('Advies & inspiratie') or to 'Over ons' / 'Contact' from the header top
  level.** Statafelshop has Blog, Over and Contact in its header. Outmate has an 'Inspiratie nodig?' column in every
  panel. Ours has single advice links in only 4 of the 9 panels (Partytenten, Statafels, Rokken & hoezen, Met jouw
  logo), and the drawer has only Veelgestelde vragen and Klantenservice.
  Repro: open every panel at 1440 and the drawer at 390. No link to `/blogs/advies` appears.
  Fix: a servicelink block 'Advies' in the USP bar, which the drawer copies, or an advice link per panel.

- **Inline CSS in the markup.** `sections/header.liquid` around line 377 renders
  `<div class="mdrawer__hours" style="margin-top:20px;font-size:14.5px;…">` and `<p style="margin:0">`, and
  `snippets/header-contact.liquid` prints a `<style>` block in the body. Both bypass the lazy stylesheet and colour
  schemes.
  Repro: set Thema-instellingen › Contact › Openingstijden and inspect the drawer.
  Fix: move both into `section-header-drawer.css` and `section-header.css`.

- **The header markup is heavy on every page.** The header group is 150 KB of HTML (17 KB gzip) and 1 928 elements,
  65 % of the home DOM. Most of it is the menu twice (desktop panels 51 KB, drawer 77 KB) and 129 inline SVGs
  (44 × chevron-down, 30 × arrow-right). Horizon's header is larger, so this is polish, not a regression against the
  bar.
  Repro: `curl -s :4100/`, then measure from the first `shopify-section-sections` to `<main`.
  Fix: use an SVG `<use href="#icon-…">` sprite for repeated icons, or render the drawer panels lazily.
