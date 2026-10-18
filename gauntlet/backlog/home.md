# Backlog: home (functional critic, fresh context, 2026-10-18, round after the quick-add / USP / footer fixes)

Scope: `/` on :4100 in Playwright at 1440×900 and 390×844, plus 320, 360, 768, 900, 1024, 1280 and 1920 wide, with JS off,
with reduced motion, and in English and BE. Tested: hero size pills (all 8 land on filtered collections with 2–10 products),
product tabs (mouse, Arrow, Home, End), quick add from home cards (mouse and keyboard, desktop and mobile, adds to cart,
opens the drawer, and focus returns to the card CTA), the Particulier/Zakelijk switch on the hero chip, tiles, cards and
promos (it persists after reload), FAQ accordions, footer accordions on mobile, the newsletter (empty, invalid, then
valid), the footer country/language form (BE moves the ETA window by one day; English switches the UI strings), all 341
links (all 200), text contrast (0 failures), the keyboard pass (138 stops, all with a visible ring), headings and
landmarks, ARIA references, overflow at every width, and theme-check (0 errors).

There are no console errors, no Liquid errors, no 404s and no horizontal scroll. CSS is 88.4 KB with the inline styles;
JS is 41.9 KB.

## Medium

- **The newsletter success message loses focus, so screen readers do not hear it (WCAG 4.1.3).** After a valid submit,
  Shopify redirects to `/?customer_posted=true#FooterNewsletter`. The inline script in `snippets/footer-newsletter-form.liquid`
  focuses `[data-newsletter-done]` at about 690 ms. At about 860 ms Chromium handles the fragment: the target `#FooterNewsletter`
  (the form) cannot take focus, so Chromium clears focus to `body`. The `role=status` notice is already in the DOM at
  load, so nothing is announced.
  - Repro: open `http://127.0.0.1:4100/?customer_posted=true#FooterNewsletter` and log `focusin`/`focusout`. You get
    `in notice notice--success`, then `focusout` with `relatedTarget=null`, and `document.activeElement` is BODY.
  - Fix: give the form `tabindex="-1"` (so the fragment target can take focus), or focus the notice after `load` plus a
    frame, or put the fragment id on the notice itself.

- **The category heading copies Statafelshop word for word (BRIEF §6).** "Waar ben je naar op zoek?" is the exact h2
  Statafelshop puts above its category tiles (reference facts: home outline h2 "Waar ben je naar op zoek?"), and ours sits
  in the same place. Outmate also uses it as its search placeholder.
  - Repro: `/` › first heading after the USP strip (`templates/index.json` › `categories.settings.heading`).
  - Fix: use our own line in the brand voice, for example "Wat zet jij neer?" or "Begin bij je feest".

- **Price VAT display is inconsistent, and only half of the must feature `global.price-incl-excl-btw` is there.** The two
  promo tiles show incl. *and* excl. btw ("vanaf €69,95 incl. btw / €57,81 excl. btw"). The hero chip, the 4 category
  tiles and all 32 product cards show only the active mode ("€279,00 incl. btw"). At 390 even the "incl. btw" label is
  visually hidden. Statafelshop shows both figures on every home card. The header switch is a workaround.
  - Repro: `/` at 1440. Compare the Pakketten promo with any card in "Kies je partytent".
  - Fix: choose one rule for the whole page and document it. Either add the compact secondary line (the
    `settings.price_show_secondary` path) to cards, tiles and the chip, or drop it from the promos.

- **On mobile, the homepage tells B2B visitors to use a switch that is not on screen.** The Zakelijk banner says "Prijzen
  excl. btw · Schakel bovenin om naar Zakelijk", and FAQ q3 says "Zet bovenin Zakelijk aan". At 390 the
  Particulier/Zakelijk switch is not in the header bar. It is only inside the Menu drawer, below 9 category rows,
  "Offerte aanvragen" and "Uitgelicht".
  - Repro: `/` at 390×844, scroll to "Klapklaar Zakelijk". There is no switch in the header. Open Menu and scroll to find
    "Zakelijk excl. btw".
  - Fix: render the same switch control inside `sections/b2b-banner.liquid` (benefit 1), and/or reword for mobile ("Zet
    in het menu Zakelijk aan"). The header piece could add a compact switch to the mobile bar.

- **The announcement bar contradicts the page while nothing is in stock.** This comes from the header group but shows on
  `/`. The countdown block says "Uit voorraad: zondag besteld, maandag verzonden" (mobile: "Uit voorraad: maandag
  verzonden"), while every card and both tab lead lines say "Leverbaar over 2–3 weken · Op bestelling, in huis 3 – 12
  nov". The home USP strip already falls back to "Bezorgd in NL en BE" through `stock_only`. The countdown block has no
  such check.
  - Repro: `/` at 1440 on the current fixture (0 stock): compare the top bar with the "Kies je partytent" lead line.
  - Fix: give the countdown block in `sections/announcement-bar.liquid` the same "Alleen bij voorraad" check and a
    fallback text, for example "Bezorgd in NL en BE".

## Low

- **The image snippet ignores `alt: ''`.** `snippets/image.liquid` does `alt | default: image.alt`, so a deliberately empty
  alt falls back to the file's alt. The category tiles and mini-tiles (`collection-list.liquid` passes `alt: ''`) get
  link names like "Easy-up partytent Professional 3 × 6 m, Rood, schuin vooraanzicht Easy-up partytenten Staat in een paar
  minuten…", which starts with a product that is not the tile. Repro: inspect the accessible name of the first category
  tile on `/`. Fix: add a `decorative: true` parameter, or tell `nil` apart from `''`.
- **The promo section has a misleading name and an orphan h3.** `sections/promo-tiles.liquid` labels the whole section
  with the first block's heading (`aria-label="Alles voor je feest in één pakket"`), although it also holds "Een zeil dat
  precies past". Its titles are h3 with no h2 in the section, so in the heading outline they fall under "Kies je
  partytent". Repro: list landmarks and headings on `/`. Fix: add a visually hidden h2 (setting), or make the promo titles
  h2.
- **Product tabs do not react to block selection in the theme editor.** `assets/section-product-tabs.js` has no
  `shopify:block:select` listener, so clicking the "Buizenframe" block in the editor sidebar leaves the Easy-up panel
  showing. Repro: theme editor › Kies je partytent › block Buizenframe. Fix: on `shopify:block:select` inside the
  section, call `select(index)` for the tab with that block id.
- **The CSS budget has almost no room left.** On load: 81.4 KB of external CSS plus 7.0 KB inline is 88.4 KB of 90 KB.
  Opening a quick add and the cart drawer lazy-loads `component-quick-add.css` (3.8 KB) and `component-cart.css` (9.1 KB),
  which brings the page to about 101 KB. Repro: the `themeBytes` in the `tools/shoot.mjs` report, then open a quick add on
  `/`. Fix: trim `base.css` (35.8 KB) or the header CSS before anything else lands on the home page.
- **"Vanaf 10 stuks staffelprijs." is unconditional.** This is the `index.json` tafels `text`. `staffel_mode` is `quote`,
  so the cart charges the unit price and the staffel price comes with an offerte (the PDP says "Staffelprijs met
  offerte"). The wijnvat statafel's first tier is also 3, not 10. Repro: `/` › Statafels, rokken en barkrukken intro.
  Fix: "Vanaf 10 stuks staffelprijs met een offerte."
- **The Zakelijk banner still says "Schakel bovenin om naar Zakelijk" when the visitor is already in Zakelijk mode.**
  Repro: switch to Zakelijk, then scroll to "Klapklaar Zakelijk". Fix: an alternative text with `data-vat-show="excl"`
  ("Je ziet nu alle prijzen excl. btw").
- **The mobile page is long.** It is 10,055 px at 390 wide, against 7,701 px for Horizon. Each tab shows a 2×2 grid of
  large cards, and the 4 guides, FAQ and blog stack on top of that. Repro: full height of `/` at 390. Fix: show 2 cards
  per tab on mobile (or a slider), or show the guides as a compact list.
- **At 1024 px the hero has a gap.** The hero image floats with about 200 px of empty Linnen above it, and the product chip
  sits far below the render. Repro: `/` at 1024×900. Fix: top-align the media column, or stack the hero below about 1100
  px.
- **At 320 px the mini-tile labels touch the tile edges.** "Stretchtenten" and "Overkappingen" run from edge to edge of
  their mini-tiles with no inner padding. Repro: `/` at 320 › Meer in de winkel. Fix: a smaller label size, or 2
  columns below 360 px.
- **The blog section renders empty.** `sections/blog-posts.liquid` prints the heading and an empty `<ul>` when no blog is
  chosen or the blog has no articles. Repro: theme editor › Blogartikelen › clear "Blog". Fix: render only when
  `b != blank and b.articles_count > 0`.
- **The footer columns differ from brand.md §7.2.** The brand book lists Winkel, Zakelijk, Hulp and Over Klapklaar. The
  footer has no Zakelijk column; Zakelijk is a single link under Over Klapklaar. Repro: footer of `/`. Fix: add a menu
  block for a `footer-zakelijk` menu (offerte, staffel, bedrukken, zakelijk), or align the brand book.
- **The hero alt text has a Dutch slip.** "…daaronder een statafel met zwarte stretchrok en een met witte hoes met strik"
  should read "…en een met een witte hoes met strik". Repro: `templates/index.json` › hero › `image_alt`.
- **`section-product-tabs.css` and `section-product-tabs.js` are emitted twice (two product-tabs sections).** The script
  runs twice; the guards hold, but the work is wasted. Repro: view source on `/`. Fix: emit the tags once (for example
  with a flag in the first instance, or by moving them to the layout when the template is index).
