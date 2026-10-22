# Backlog: collection (functional critic, fresh context, 2026-10-22)

Scope: `/collections/easy-up-partytenten` and `statafelrokken` (against Outmate `cat-easy-up-partytenten` and Statafelshop
`cat-statafelhoezen`), plus `statafels`, `partytenten`, `partytenten-buizenframe`, `accessoires`, `gewichten-en-verankering`,
`easy-up-onderdelen`, `stretchtenten`, `zakelijk`, `bedrukte-partytenten` and `all`, on :4100 at 1440×900 and 390×844 (plus
320/768/1024/1280 overflow). Tested in Playwright: Maat pills, Kleur swatches, Uitvoering, 'Met jouw logo' switch, price fields
('1.000', 'abc', excl. btw mode), chips, Wis alles, back/forward, sort by mouse and keyboard, 'Bekijk alles', Meer laden + return
from a PDP on page 2, empty and stale-filter states, phone drawer (dialog, inert, focus trap, Escape, 'Toon N producten'),
floating Filteren/Sorteren, quick add (mouse, keyboard, size switch, filtered-variant preselect) and single-variant add,
no-JS filter + sort, contrast scan, focus rings, aria snapshot, JSON-LD, theme-check, `tools/check.mjs --only '/collections/*'`.

Fixed since the previous backlog: quick-add focus after a size switch, tall sidebar no longer scrolls away from the value you
clicked, 'Past op' on Easy-up onderdelen keeps 'Easy-up 31', quick add uses the pre-order label, sale badge follows the
filtered variant, Gebruik docs now name `custom.gebruik`, cards show capacity ('ca. 13 staand · 9 zittend').

The one high finding of this round (dead tap band under the hidden sticky header, which kills the floating Filteren/Sorteren
bar on phones) is reported to the orchestrator separately and is not repeated here.

## Medium

- **Filter groups do not match how shoppers choose (carry-over).** Part of must `collection.filters-attributes`, should
  `collection.filter-frame-colour`. Repro: `/collections/easy-up-partytenten` → Uitvoering: Polyester 6 · Heavy duty PVC 6 ·
  Dak en luifel 2 · Dak, luifel en 3 zijwanden 2 (roof material and print coverage in one list). `/collections/statafels` →
  only Prijs, Maat, Kleur, Gebruik: no onderstel (zwart / wit / chroom / RVS) and no binnen / buiten (compact HPL) filter,
  although Statafelshop filters statafels on onderstel kleur and Outmate on 'Materiaal frame'. Fix: product metafields
  (`custom.onderstel`, `custom.binnen_buiten`, `custom.dakmateriaal`) filled by `build.py`, enabled in Search & Discovery,
  documented in `docs/theme-setup.md`; keep print coverage out of Uitvoering (or label it 'Bedrukking').
- **No filter on what is in stock or on lead time (carry-over).** Should `collection.filter-levertijd`; Horizon on :4200 shows
  'Beschikbaarheid: Op voorraad'. Repro: `/collections/stretchtenten` cards say 'Leverbaar over 2–3 weken', 'Levertijd 3–4
  weken', 'Levertijd 5–7 weken', 'Levertijd 4–6 weken na akkoord tekening'; with continue-selling stock every variant counts
  as available, so `snippets/facets.liquid` always drops 'Alleen leverbaar'. Add a metafield filter (e.g.
  `custom.levertijd_klasse`: Op voorraad / 1–3 weken / langer / na drukproef), fill it in the catalog, document it.
- **Maat on Statafelrokken mixes product kinds and hides the fitting beschermplaat (carry-over).** Repro:
  `/collections/statafelrokken` → Maat 'Bekijk alles (31)': Ø60-70, Ø68, Ø78, Ø80-85, Ø83, Ø130, Ø300, Ø330 cm plus 21
  rectangles. Pick 'Ø80-85 cm' (an Ø 80 table): 5 products, and 'Beschermplaat transparant voor statafel' (Ø68/Ø78/Ø83) is
  gone although Ø78 and Ø83 fit. Add a 'Past op blad' (table size) filter or name plate and cloth sizes after the table.
- **CSS over budget once the shopper uses the page; JS at the line with inline code (carry-over).** Measured bytes of theme
  files + inline `<style>` / `<script>` on `/collections/easy-up-partytenten`: CSS on load 88,904 B desktop / 89,258 B phone
  (79,888 / 80,242 files + 9,016 inline); after opening quick add 92,732 / 93,086 B (`component-quick-add.css` 3,828 B);
  after 'In mijn winkelwagen' 101,793 / 102,147 B (`component-cart.css` 9,061 B). JS files 64,510 B on load (+5,621 B inline =
  70,131 B), 69,162 B after quick add (74,783 B with inline). Biggest CSS: `base.css` 36,065 B, `section-main-collection.css`
  18,934 B, inline 9.0–9.6 KB. Trim `section-main-collection.css` (phone/desktop duplicates) so the page stays under 90 KB after
  quick add, and decide whether inline theme code counts toward the 70 KB JS budget.
- **The quality-line comparison leaves out the top tier.** Must `collection.quality-line-explainer`. Repro: 1440,
  `/collections/partytenten-buizenframe` → 'Vergelijk de uitvoeringen' shows PE Basis, PVC 500 Comfort and PVC 550 Premium
  only (`templates/collection.json` comparison `max: 3`); 'Partytent PVC 620 Professional' is missing, although the intro says
  'Basis PE … PVC 500, 550 of 620' and Outmate explains every tier up to Professional 620 on its category page. On the parent
  `/collections/partytenten` the table compares only easy-up Premium vs Professional, so the five buizenframe qualities are
  never compared there. Allow 4 columns (scrolling table on phones) or let a collection metafield pick the group and its
  members.

## Low

- **The Zakelijk promo band is announced as a product (carry-over).** `sections/main-collection.liquid` line 349 renders
  `<li class="promo-band">` inside `ul.product-grid[role=list]`; Playwright aria snapshot of `/collections/easy-up-partytenten`
  lists 16 listitems for 15 products. Give it `role="presentation"` with an inner `<aside>`, or render it outside the list.
- **Promo band copy is a claim not in the claims doc, and '10' does not fit every collection.** Section defaults
  `promo_heading` 'Meer dan 10 nodig?' / `promo_text` 'Staffelprijs, prijzen excl. btw en een offerte op maat.' show on every
  collection with more than 6 products (`docs/claims-to-confirm.md` has no entry). The staffel starts at 3 for tents and at 50
  for lampen (claims doc, Staffelkortingen), so on `/collections/easy-up-partytenten` or `/collections/verlichting` the '10' is
  wrong. List it in the claims doc and make the number neutral ('Grotere aantallen nodig?') or per collection.
- **Colour filter checkboxes say the colour twice to screen readers.** Repro: aria snapshot of the filter column on
  `/collections/easy-up-partytenten` → `checkbox "Rood Rood (13 producten)"`, `"Wit Wit (13 producten)"` … The empty swatch
  span inside the label (`<span class="swatch facet__swatch" title="Rood">`, `snippets/swatch.liquid`) adds its `title` to the
  name. Put `aria-hidden="true"` on the swatch span (or drop its `title`) so it reads 'Rood (13 producten)'.
- **Invalid price input is not exposed as invalid.** Repro: type 'abc' in Prijs › Van: the hint 'Alleen cijfers, bijvoorbeeld
  1000 of 279,50' shows, but `facets.js` `priceOk()` uses `toggleAttribute('aria-invalid', …)`, which writes
  `aria-invalid=""`, and ARIA treats an empty value as false. Use `setAttribute('aria-invalid', 'true')` /
  `removeAttribute`, and point `aria-describedby` of the fields at the hint.
- **Comparison picks out-of-context products on mixed collections (carry-over).** Repro: `/collections/all` compares easy-up
  Premium 3 × 3 m vs Professional 3 × 3 m on 'Alle producten'; `/collections/zakelijk` compares 'Partytent PVC 550 Premium' with
  'Partytent PVC 550 compleet met toebehoren' (a pakket) and 'PVC 620 Professional'; `/collections/bedrukte-partytenten`
  compares two opblaasbare promotietenten although the grid leads with easy-ups with logo; `/collections/statafelrokken`
  compares 'Statafelrok stretch' with its oranje themacover version and 'Statafelhoes met strik'. Let a collection metafield
  choose the group and hide the section on `all` and `zakelijk`.
- **Comparison labels break mid-word on phones (carry-over).** Repro: 390, `/collections/easy-up-partytenten` → 'Vergelijk de
  uitvoeringen': 'Schaararme / n', 'Hoekstukke / n', 'Hoogtestan / den', also 'Specificaties', 'Eigenschappen',
  'Doorloophoogte' wrap inside the word; the column titles end with a lone 'm' ('Premium 3 × 3 / m'). Use `hyphens: auto`
  (`lang="nl"`), a wider label column, and non-breaking spaces in sizes.
- **`/collections/all` SEO text hard-codes the cutoff time (carry-over).** 'Een pakket dat op voorraad is en op een werkdag
  vóór 14:00 besteld wordt, gaat dezelfde dag de deur uit.' (`catalog/export/collections.json`, collection `all`,
  `seo_tekst`). `cutoff_time` can change; reword ('vóór de besteltijd') or list the text in `docs/claims-to-confirm.md`.
- **Card action is icon-only on phones (carry-over).** Repro: 390, any card: the round cart+ button has no visible text;
  on a multi-variant product it opens a chooser. Brand book §7.2 asks for an outlined 'In winkelwagen' / 'Kies je maat'. On
  desktop the label shows only on hover or focus.
- **Card photo and the variant it links to differ.** Repro: 390, `/collections/statafelrokken?filter.v.option.maat=Ø60-70+cm&filter.v.option.kleur=Rood`
  → first card 'Statafelrok stretch': photo alt 'Statafelrok stretch, Rood, met topcover, op een statafel', but the card
  links to and quick add selects 'Ø60-70 cm / Zonder topcover / Rood' at €15,95. `snippets/card-variant.liquid` falls back
  to the first matched variant with a photo; prefer a matched variant whose non-colour options equal the shown one, or say
  'Foto met topcover' like the existing 'Foto in …' note.
- **Two phrasings for the same wait on one grid.** Repro: `/collections/stretchtenten`: 'Leverbaar over 2–3 weken' (theme
  setting `delivery_text_backorder`) next to 'Levertijd 2–3 weken' / 'Levertijd 3–4 weken' (`custom.levertijd`). Brand book
  §7.1 uses 'Leverbaar over 2–3 weken'. Align the catalog values (or have the card prefix them the same way).
- **Accessoires Maat mixes naming styles (carry-over).** Repro: `/collections/accessoires` → Maat (63 values): '1 m', '1 m
  breed', '2 m', '2 m breed', '2,5 m', … '50 × 1 m', 'Ø8 m' … Name wall widths one way in the catalog.
- **No capacity filter (downgraded: cards now show capacity).** Repro: `/collections/easy-up-partytenten` SEO text and the
  comparison tell shoppers to choose by people ('ca. 13 staand / 9 zittend'); Outmate filters on 'Aantal personen staand /
  zittend'. Optional `custom.personen_staand` range filter.
- **320 px: the size tag on the photo runs into the round cart button.** Repro: 320×900, `/collections/easy-up-partytenten`,
  second card: the '3 × 4,5 m' tag ends under the cart+ button. Give `.card__tags` a right margin of the button width at
  narrow card widths.
- **'Tags niet als filter tonen' setting text contradicts the contract.** `sections/main-collection.liquid` schema
  (`hidden_filter_values` info: "Tags als 'gebruik:horeca' tonen we als 'Horeca'") and `docs/theme-setup.md` line 13 ('Gebruik
  toont `gebruik:horeca` als Horeca') still describe a tag filter, while `catalog/CONTRACT.md` says Gebruik reads
  `custom.gebruik` and 'No tag filter'. Reword both.
- **No-JS price filter sends Dutch decimals unchanged (carry-over).** Without JavaScript '279,50' is submitted as
  `filter.v.price.gte=279,50` (Shopify expects a dot) and the field pattern rejects '1.000'. A note under the fields or whole
  euros only.
- **Facet rendering is heavy on big collections (carry-over).** Same preview machine, back to back: `/collections/all` 20.1 s
  on :4100 against 6.7 s on Horizon (:4200); `/collections/zakelijk` 18.6 s vs 8.0 s; `/collections/easy-up-partytenten`
  0.8 s vs 1.5 s (small collections are fine). `tools/check.mjs --only '/collections/*'` timed out (60 s) on `/collections/all`
  and `?page=2` while other builders loaded the machine, and 'Meer laden' on `all` took 18 s. Only the ratio counts; profile
  `snippets/facets.liquid` / `facet-value-order` (~60–90 Maat values sorted per request) and the double `card-variant` +
  `delivery-promise` render per card (lead-line probe plus the card).
