# Backlog: collection (functional critic, fresh context, 2026-10-18 evening)

Scope: `/collections/easy-up-partytenten` and `statafelrokken` (main subjects, against Outmate `cat-easy-up-partytenten` and
Statafelshop `cat-statafelhoezen`), plus `statafelhoezen-met-strik`, `statafels`, `terrastafels`, `accessoires`,
`gewichten-en-verankering`, `verlichting`, `easy-up-onderdelen`, `partytenten`, `bedrukte-partytenten`, `actiepakketten`,
`meubilair`, `stretchtenten`, `zakelijk` and `all`, on :4100 at 1440×900 and 390×844 (plus 320/768/1024). Tested in
Playwright: Maat pills, Kleur swatches (incl. 'Bekijk alles'), Uitvoering, the 'Met jouw logo' switch, price fields (Dutch
'1.000', 'abc', excl. btw mode), chips (focus moves to the next chip), Wis alles, back/forward, all four sort orders by mouse and
keyboard (arrow waits for Enter), rapid clicks on three filters, empty and stale-filter states, Meer laden (with filters, then
a new sort), return from a PDP on page 2 (grid and position restored), phone drawer (dialog, focus trap, Escape, Toon N
producten, floating Filteren/Sorteren), quick add (keyboard and mouse, option switch, sibling sizes, preselected filtered
variant, add with quantity 2), single-variant add from the card, no-JS filter + sort, contrast scan, JSON-LD, theme-check,
and `tools/check.mjs --only '/collections/*'` (94 visits: 0 Liquid, console, request or overflow errors).

Fixed since the previous backlog: cards now follow the variant every filter matched (Maat, Uitvoering, price, not only
Kleur: photo, link, price, size tag, quick-add preselect); the price filter works in excl. btw (Zakelijk) mode; the swatch
facet focus ring is now a ring around the whole row; the card's own add button uses the pre-order label.

No blocker or high finding is open. Everything below is medium or low.

## Medium

- **Filter groups do not match how shoppers choose (Uitvoering mixes attributes; no onderstel, binnen/buiten or frame
  facet).** Should feature `collection.filter-frame-colour`, part of must `collection.filters-attributes` (Statafelshop
  filters statafels on bladkleur, onderstel kleur and bladdiameter; Outmate on 'Materiaal frame'). Repro: (1)
  `/collections/easy-up-partytenten` → Uitvoering: Polyester 8 · Heavy duty PVC 6 · Dak en luifel 2 · Dak, luifel en 3
  zijwanden 2 (roof material and print coverage in one list). (2) `/collections/partytenten` → Uitvoering has 14+ values:
  Polyester, PVC 550 Premium, Houten palen, Effen doek, Full colour bedrukt, Dak in framekleur… (3) `/collections/statafels`
  → only Prijs, Maat, Kleur, Gebruik: the onderstel (zwart / wit / chroom / RVS) and Binnen / Buiten (compact HPL) live in
  Uitvoering values that each hold one product ('Binnen, zwart onderstel', 'RVS onderstel', 'Set van 2', '110 cm hoog'), so
  the one-product rule in `snippets/facets.liquid` hides the group and none of it can be filtered. Fix: product metafields
  (for example `custom.dakmateriaal`, `custom.onderstel`, `custom.binnen_buiten`, `custom.frame`) filled by `build.py`,
  enabled as Search & Discovery filters, documented in `docs/theme-setup.md`; keep print coverage out of a filter group
  (or label that group 'Bedrukking').
- **No way to filter on what is in stock now, or on lead time** (should feature `collection.filter-levertijd`; Statafelshop
  sorts on 'Voorraadstatus', Horizon shows 'Op voorraad'). Repro: any collection, e.g. `/collections/gewichten-en-verankering`:
  cards say 'Op voorraad · di 20 okt in huis', 'Leverbaar over 2–3 weken' or 'Levertijd 5–8 werkdagen (vracht)', but with
  continue-selling stock Shopify counts every variant as available, so `snippets/facets.liquid` always drops 'Alleen
  leverbaar'. Add a product/variant metafield filter (e.g. `custom.levertijd_klasse`: 'Op voorraad' / '2–3 weken' / 'Na
  drukproef'), fill it in the catalog and document it.
- **No capacity filter, although the copy tells shoppers to choose by it.** Repro: `/collections/easy-up-partytenten` SEO text
  'Welke maat heb je nodig? … ca. 9 aan tafel of 13 staand' and `/collections/partytenten` intro; capacity only exists in the
  comparison table ('ca. 13 staand / 9 zittend') and on the PDP. Outmate `cat-easy-up-partytenten` filters on 'Aantal personen
  staand', 'Aantal personen zittend' and 'Doorloophoogte'. Add `custom.personen_staand` (or ranges '10–20') as a filter, or put
  the capacity in `kenmerk_kort` on tent cards.
- **Maat on Statafelrokken mixes four product kinds and hides the fitting beschermplaat.** Repro: `/collections/statafelrokken`
  → Maat has 29 values: Ø60-70, Ø68, Ø78, Ø80-85, Ø83, Ø130, Ø300, Ø330 cm and 21 rectangles (60 × 60 … 244 × 76 cm). Pick
  'Ø80-85 cm' for an Ø 80 table and 'Beschermplaat transparant voor statafel' (Ø68/Ø78/Ø83) disappears, although Ø78 and Ø83
  fit. Add a 'Past op blad' (table size) metafield filter, or name plate and cloth values after the table they fit.
- **CSS budget: no headroom on load, over 90 KB once the shopper uses the page.** Repro (bytes of theme CSS incl. inline
  `<style>`): `/collections/easy-up-partytenten` on load 88,445 B desktop / 88,978 B mobile; with a Kleur + price filter
  89,225 / 89,758 B; after opening quick add 93,053 / 93,586 B (`component-quick-add.css` 3,828 B); after 'In mijn
  winkelwagen' 102,114 / 102,647 B (`component-cart.css` 9,061 B). JS is 63,907 B on load and 68,559 B after quick add
  (1.4 KB under 70 KB). Biggest files: `base.css` 35,808 B, `section-main-collection.css` 18,911 B, inline 9.0–9.8 KB (lead,
  chips, load-more and colour-filter rules). Trim `section-main-collection.css` (phone/desktop duplicates; promo band and
  load-more rules can go to small files) so the page stays under 90 KB after quick add.
- **Quick add loses keyboard focus when you switch to another size of the line.** Repro: 1440,
  `/collections/easy-up-partytenten` → focus the title of 'Easy-up partytent Professional 3 × 3 m', Tab to its cart+ button,
  Enter → Shift+Tab to the '2 × 2 m' pill → Enter. The panel loads the 2 × 2 m product but `document.activeElement` is
  `<body>` (same after clicking a size pill with the mouse). `assets/quick-add.js` `load()` refocuses the pill whose text
  matches, and in the new panel that is `<span class="qa__pill is-selected">`, which cannot take focus (WCAG 2.4.3 inside a
  modal). Give the selected size `tabindex="-1"`, or fall back to `.qa__input:checked` / `.qa__add` when the match is not
  focusable.
- **Desktop: a filter chosen low in a tall filter column scrolls the page away from it.** Repro: 1440×900,
  `/collections/accessoires`, scroll to y = 1600, click Gebruik › 'Markt'. `facets.js` `scrollToResults()` scrolls back to the
  results (scrollY 252), and the checkbox that keeps focus now sits at y = 1154, below the 900 px viewport; to pick a second
  value the shopper has to find the group again (keyboard users have a focused control off screen). Also on `partytent-onderdelen`,
  `meubilair`, `zakelijk`, `all` (every column marked `is-tall`). Fix: on desktop, do not scroll when the change came from the
  sidebar (the chips row and count already show the result), or only scroll when the results top is below the fold.

## Low

- **The card CTA is icon-only on phones.** Repro: 390, any card: the round cart+ button has no visible text, and on a
  multi-variant product it opens a chooser (brand book §7.2: an outlined 'In winkelwagen' / 'Kies je maat'). On desktop the
  label shows only on hover or focus.
- **The Zakelijk promo band counts as a product.** `<li class="promo-band">` (`sections/main-collection.liquid` ~line 349) sits
  in `ul.product-grid[role=list]`, so a screen reader announces 16 items for 15 products on `/collections/easy-up-partytenten`.
  Render it as `role="presentation"` with an inner `<aside>`, or outside the list.
- **The Zakelijk promo band copy is a claim not listed in the claims doc.** 'Meer dan 10 nodig? Staffelprijs, prijzen excl.
  btw en een offerte op maat.' (section defaults `promo_heading` / `promo_text`) shows on every collection with more than 6
  products, while `staffel_mode` is 'quote' and 21 of 206 products have no `custom.staffelkorting`. Add it to
  `docs/claims-to-confirm.md` (with where it shows).
- **The comparison picks out-of-context pairs on mixed collections.** Repro: `/collections/zakelijk` compares 'Partytent PVC 550
  Premium' with 'Partytent PVC 550 compleet met toebehoren'; `/collections/bedrukte-partytenten` compares the two opblaasbare
  promotietenten instead of the easy-ups with logo it leads with; `statafelrokken` compares 'Statafelrok stretch' with the
  oranje themacover version. Let a collection metafield (`custom.vergelijk_groep`) choose the group, and hide the section on
  `all` and `zakelijk`.
- **Comparison labels break mid-word on phones.** Repro: 390, `/collections/easy-up-partytenten` → 'Vergelijk de uitvoeringen':
  'Schaararme / n', 'Hoekstukke / n', 'Specificaties', 'Hoogtestanden', 'Eigenschappen', 'Doorloophoogte' all break inside the
  word; the column titles end with a lone 'm' ('Premium 3 × 3 / m') and 'excl. / btw'. Use `hyphens: auto` (`lang="nl"`), a
  wider label column, and non-breaking spaces in sizes.
- **Collection copy hard-codes the cutoff time.** `/collections/all` SEO text: 'Een pakket dat op voorraad is en op een werkdag
  vóór 14:00 besteld wordt, gaat dezelfde dag de deur uit.' `cutoff_time` can change; `docs/claims-to-confirm.md` lists only
  the USP bar, PDP and cards. Reword ('vóór de besteltijd') or list this text in the claims doc.
- **Gebruik filter: docs and contract disagree.** `docs/theme-setup.md` (Search & Discovery row) tells the owner to make
  Gebruik from 'producttags'; `catalog/CONTRACT.md` says the filter reads `custom.gebruik` and 'No tag filter', and the preview
  fixture now uses the metafield. Align the docs (and the 'Tags niet als filter tonen' setting info) with the contract.
- **'Past op' on Easy-up onderdelen reads as if the parts belong to other systems.** Repro: `/collections/easy-up-onderdelen`
  → Past op: Buizenframe 4 · Opblaasbare tent 1 · Stretchtent 1 · Stertent 1; 'Easy-up' matches every product and is hidden.
  Hide the whole group when its most common value matches every product, or keep that value.
- **Maat on Accessoires mixes naming styles.** Repro: `/collections/accessoires` → Maat: '1 m breed', '2 m', '2 m breed', '2,5
  m', '3 m', '3 m breed', '4 m', '4 m breed', … then '3 × 3 m', 'Ø…' (catalog values; 57 in total). Name wall widths one way.
- **Quick add ignores pre-order.** `sections/quick-add.liquid` always says 'In mijn winkelwagen'; a product with
  `custom.availability_status` = `pre-order` should say 'Nu bestellen, later leveren' (CONTRACT; the card button already does).
  Latent: no fixture product has a status.
- **The sale badge does not follow the filtered variant.** `snippets/product-card.liquid` computes 'Actie −x%' from the
  cheapest on-sale variant of the whole product, while the price follows the variant the filters matched; a filtered card
  can show a percentage that belongs to another size. Compute it from `card_price_v` when filters narrow the card. Latent:
  no compare-at prices in the fixture.
- **No-JS price filter sends Dutch decimals unchanged.** Without JavaScript, '279,50' is submitted as
  `filter.v.price.gte=279,50` (Shopify expects a dot), and the field pattern rejects '1.000'. Edge case; a short note under
  the fields or a pattern that only takes whole euros avoids it.
- **Facet rendering is heavy.** Same preview machine, same moment: `/collections/all` 14.6 s on :4100 against 5.4 s on Horizon
  (:4200); `/collections/zakelijk` 15.5 s. Only the ratio counts here. Profile `snippets/facets.liquid` /
  `facet-value-order` (per-filter value loops and sorting over ~90 Maat values) and the double `card-variant` +
  `delivery-promise` render per card (lead-line probe plus the card itself) before launch.
