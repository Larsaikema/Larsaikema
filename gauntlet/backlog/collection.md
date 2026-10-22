# Backlog: collection (functional critic, fresh context, 2026-10-22, round 2)

Scope: `/collections/easy-up-partytenten` and `statafelrokken` (against Outmate `cat-easy-up-partytenten` and Statafelshop
`cat-statafelhoezen`), plus `statafels`, `statafelhoezen-met-strik`, `partytenten`, `partytenten-buizenframe`, `accessoires`,
`gewichten-en-verankering`, `stretchtenten`, `zakelijk`, `bedrukte-partytenten` and `all`, on :4100 at 1440×900 and 390×844
(plus 320/768/1024/1280). Tested in Playwright: Maat pills, Kleur swatches, Uitvoering, the 'Met jouw logo' switch (Space), price
fields ('1.000', 'abc', excl. btw mode, Enter), chips (mouse and keyboard), Wis alles, back/forward, sort by mouse and keyboard
(arrow waits for Enter), 'Bekijk alles', Meer laden / Vorige producten tonen / return from a PDP on page 3, rapid clicks (race),
empty and stale-filter states, phone drawer (dialog, inert, focus trap, Escape, 'Toon N producten'), the floating
Filteren/Sorteren bar with the header hidden, quick add (colour, sibling size, filtered colour preselect) and single-variant add,
card swatch hover, no-JS filter + sort + pagination, contrast scan, focus rings, ARIA snapshots, JSON-LD, theme-check,
`tools/check.mjs --only '/collections/*'` (94 visits, 0 errors).

Verified fixed since the previous backlog: the dead tap band over the floating bar (tap on 'Filteren' at y=6 now opens the
drawer), the Zakelijk tile is `role="presentation"`, its heading is neutral ('Grotere aantallen nodig?'), colour checkboxes read
'Rood (13 producten)' once, `aria-invalid="true"` + `aria-describedby` on a bad price, the 'Tags niet als filter tonen' setting
text, and the 320 px size tag no longer runs into the cart button.

No blocker or high findings this round.

## Medium

- **Quick add: switching size throws away the colour you picked.** Contract (`andere_maten`: each size pill links to the
  sibling variant with the same Kleur/Uitvoering). Repro: 1440 or 390, `/collections/easy-up-partytenten` → first card 'Kies je
  kleur' → pick Zwart → click '3 × 4,5 m' → the panel reloads with 'Kleur: Rood'; 'In mijn winkelwagen' then adds
  `Easy-up partytent Premium 3 x 4,5 m - 3 x 4,5 m / Rood` (checked in `/cart.js`). Cause: `sections/quick-add.liquid` line 64
  renders the sibling pill as `href="{{ sp.url }}" data-qa-load="{{ sp.url }}"` without a variant. Link to the sibling variant
  whose Kleur (and Uitvoering) match the current selection (same lookup as the PDP), or let `quick-add.js` `load()` carry the
  checked option values and pick the matching variant of the sibling.
- **An active filter value behind 'Bekijk alles' is invisible.** Repro: open
  `/collections/accessoires?filter.v.option.maat=3+x+4+m` (a shared link, a reload, or Back after a full page load): the chip
  'Maat: 3 × 4 m' shows above the grid, but in the Maat group the checked pill is item 31 of 62 and carries
  `facet__item--more`, so it is hidden until 'Bekijk alles (62)' is opened; same for `?filter.v.option.kleur=Geel` (value 16 of
  21). The phone drawer opens the same way. `snippets/facets.liquid` line 265: do not give an active value the `--more` class
  (or start the group expanded when an active value sits beyond `limit_n`).
- **`sort_by` from the address is printed unescaped and unvalidated.** Repro: `/collections/easy-up-partytenten?sort_by=bogus`
  → the select shows 'translation missing: nl.collection.sort_options.bogus'; `?sort_by=%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E`
  injects the `<img>` raw in three places in the preview (the `<option value>`, the 'Sorteer op' face, the 'Wis alles' hrefs).
  Whether Shopify passes an unknown `sort_by` through is unverified, but Dawn and Horizon only ever print values taken from
  `collection.sort_options`. `sections/main-collection.liquid` lines 36–48 / 62 / 70 / 202–216 / 296 / 389: accept `sort_by`
  only when it is one of `collection.sort_options` (else the default), and `| escape` it in attributes.
- **Filter groups do not match how shoppers choose (carry-over).** Must `collection.filters-attributes`, should
  `collection.filter-frame-colour`. Repro: `/collections/statafels` shows only Prijs, Maat, Kleur, Gebruik: the 'Uitvoering'
  values (`Binnen, zwart onderstel`, `Buiten (compact HPL), wit onderstel, met parasolgat`, `1 stuk`, `107 cm hoog` …) are mostly
  one-product values, so `snippets/facets.liquid` hides the group and there is no onderstel (zwart / wit / chroom / RVS) or
  binnen / buiten filter, although Statafelshop filters statafels on onderstel kleur and Outmate on 'Materiaal frame'.
  `/collections/easy-up-partytenten` → Uitvoering: Polyester 8 · Heavy duty PVC 8 · Dak en luifel 1 · Dak, luifel en 3
  zijwanden 1, because `easy-up-partytent-premium-full-colour-bedrukt` keeps the print scope in `Uitvoering` while the
  Professional full colour uses `Samenstelling` (CONTRACT.md). Fix in catalog + contract: filterable metafields
  (`custom.onderstel`, `custom.binnen_buiten`, `custom.dakmateriaal`) and the Premium print scope in `Samenstelling`.
- **No filter on what is in stock or on lead time (carry-over).** Should `collection.filter-levertijd`; Horizon on :4200 shows
  'Beschikbaarheid: Op voorraad'. Repro: `/collections/stretchtenten` cards say 'Op voorraad', 'Leverbaar over 2–3 weken',
  'Levertijd 3–4 weken', 'Levertijd 5–7 weken', 'Levertijd 4–6 weken na akkoord tekening'; with continue-selling every variant
  counts as available, so 'Alleen leverbaar' never shows. Add a metafield filter (e.g. `custom.levertijd_klasse`).
- **Maat on Statafelrokken hides the fitting beschermplaat (carry-over).** Repro: `/collections/statafelrokken` → Maat
  'Ø80-85 cm' → 5 products; 'Beschermplaat transparant voor statafel' (Ø68 / Ø78 / Ø83 cm) is gone although Ø78 and Ø83 fit an
  Ø80–85 table. Add a 'Past op blad' (table size) filter or name plate sizes after the table.
- **CSS over budget once the shopper uses the page; JS at the line (carry-over).** Theme files on
  `/collections/easy-up-partytenten`: CSS 79,976 B on load (desktop, with the mega menu) → 92,865 B after quick add + 'In mijn
  winkelwagen' (`component-quick-add.css` 3,828 B + `component-cart.css` 9,061 B), plus ~9.0 KB inline `<style>`; JS 64,563 B
  on load → 69,215 B after quick add (plus 5.6 KB inline). Trim `section-main-collection.css` (18,972 B) / `base.css` so the
  page stays under 90 KB after quick add.
- **The quality-line comparison leaves out the top tier (carry-over).** Must `collection.quality-line-explainer`. Repro: 1440,
  `/collections/partytenten-buizenframe` → 'Vergelijk de uitvoeringen' shows PE Basis, PVC 500 Comfort and PVC 550 Premium only
  (`templates/collection.json` comparison `max: 3`); PVC 620 Professional is missing although the intro names it. Allow 4
  columns (scrolling on phones) or let a collection metafield choose the members.

## Low

- **Comparison picks out-of-context products on mixed collections (carry-over).** `/collections/all` compares easy-up
  Premium vs Professional 3 × 3 m; `/collections/zakelijk` compares 'Partytent PVC 550 Premium' with 'Partytent PVC 550 compleet
  met toebehoren' (a pakket) and 'PVC 620 Professional'; `/collections/bedrukte-partytenten` compares two opblaasbare
  promotietenten while the grid leads with easy-ups with logo; `/collections/statafelrokken` compares 'Statafelrok stretch' with
  its oranje themacover version. Let a collection metafield choose the group; hide the section on `all` and `zakelijk`.
- **Comparison labels break mid-word on phones (carry-over).** Repro: 390, `/collections/easy-up-partytenten` → 'Vergelijk de
  uitvoeringen': 'Eigenschap / pen', 'Doorloopho / ogte', 'Schaararmen', 'Hoekstukken', 'Hoogtestanden', 'Specificaties' wrap
  inside the word (`overflow-wrap: anywhere`; Chromium has no Dutch hyphenation dictionary). Widen the label column on phones or
  set a smaller label size; keep '320 g/m²' together.
- **Card photo and the variant it links to differ (carry-over).** Repro: 390,
  `/collections/statafelrokken?filter.v.option.maat=%C3%9860-70+cm&filter.v.option.kleur=Rood` → 'Statafelrok stretch': photo alt
  '… Rood, met topcover, op een statafel', link and quick add select 'Ø60-70 cm / Zonder topcover / Rood'.
  `snippets/card-variant.liquid`: prefer a matched variant whose other options equal the photo's, or add 'Foto met topcover'.
- **No capacity filter (carry-over).** Outmate's easy-up category filters on 'Aantal personen staand / zittend', 'Hoogte',
  'Doorloophoogte'; ours shows 'ca. 13 staand · 9 zittend' on the card but cannot filter on it. Optional
  `custom.personen_staand` filter.
- **Two phrasings for the same kind of wait on one grid (carry-over, catalog).** `/collections/stretchtenten`: 'Leverbaar over
  2–3 weken' (theme setting) next to 'Levertijd 2–3 weken' / 'Levertijd 3–4 weken' (`custom.levertijd`).
- **Accessoires Maat mixes naming styles (carry-over, catalog).** `/collections/accessoires` → Maat (62 values): '1 m', '1 m
  breed', '2 m', '2 m breed', '2,5 m', '3 m breed', '4,5 m', … Name wall widths one way.
- **`/collections/all` SEO text hard-codes the cutoff time (carry-over, catalog).** 'Een pakket dat op voorraad is en op een
  werkdag vóór 14:00 besteld wordt, gaat dezelfde dag de deur uit.' (collection `all`, `seo_tekst`); `cutoff_time` can change.
- **'Statafelpakketten' chip opens every pakket.** Repro: `/collections/statafels` → chip 'Statafelpakketten' →
  `/collections/actiepakketten` (24 products: easy-up starter packs, stoelen, prikkabels, biertafels …). Point the menu link at a
  statafel-only collection or rename the link 'Pakketten' (menu data).
- **Statafels kenmerk 'HPL-blad hittebestendig' reads as true for every table.** `/collections/statafels` head list; the
  collection also holds the HDPE table, the wijnvat (houtlook) and the hoogglans design table. Reword ('Buitenbladen van compact
  HPL') or list it in `docs/claims-to-confirm.md` (collection metafield `custom.kenmerken`).
- **`docs/theme-setup.md` line 13 still describes a tag filter.** First column: "Gebruik toont `gebruik:horeca` als 'Horeca'
  (interne tags blijven weg, sectie-instelling 'Tags niet als filter tonen')", while the same row and CONTRACT.md say Gebruik
  reads `custom.gebruik`. Reword the first column.
- **Card action is icon-only on phones (carry-over).** 390, any card: the round cart+ button has no visible text; brand book
  §7.2 asks for 'In winkelwagen' / 'Kies je maat'.
- **One btw price per card.** With `price_display: toggle` cards show only the chosen mode; at ≤ 230 px card width (390 and
  768 px) the 'incl. btw' label is hidden too and the Particulier/Zakelijk switch sits in the menu drawer, so a tablet shopper
  sees a bare '€279,00'. Statafelshop cards show both. Consider keeping 'incl. btw' on narrow cards.
- **No-JS price filter sends Dutch decimals unchanged (carry-over).** Without JavaScript '279,50' is submitted as
  `filter.v.price.gte=279,50` and the field pattern rejects '1.000'.
- **Facet rendering is heavy on big collections (carry-over).** curl, same machine, back to back: `/collections/all` 15.2 s on
  :4100 vs 8.8 s on Horizon :4200; `/collections/zakelijk` 11.6 s vs 5.8 s; `easy-up-partytenten` 0.46 s vs 0.48 s. Profile
  `snippets/facets.liquid` / `facet-value-order` and the double `card-variant` + `delivery-promise` render per card.
- **'Meer laden' during 'Vorige producten tonen' drops the earlier request.** Repro: `/collections/accessoires?page=3`, click
  'Vorige producten tonen' and at once 'Meer laden': result 29 items (pages 3–4), the page-2 request is aborted
  (`facets.js` `begin()` shares one AbortController); the button stays, a second click works.
- **Every filter URL carries the default sort.** Repro: click a Maat pill → `?filter.v.option.maat=3+x+3+m&sort_by=manual`;
  'Wis alles' links to `?sort_by=manual`. Leave `sort_by` out when it equals `collection.default_sort_by` (shorter shared links).
