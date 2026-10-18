# Backlog: collection (functional critic, 2026-10-18)

Scope: `/collections/easy-up-partytenten` (main subject), plus `statafelrokken`, `statafels`, `bedrukte-statafelhoezen`,
`bedrukte-partytenten`, `accessoires`, `partytenten`, `zakelijk` and `all`, on :4100 at 1440×900 and 390×844, plus
320/360/768/1000/1024/1280 for overflow. Tested in Playwright: filters (pills, swatches, list, switch, price with Dutch
notation and swap), sorting by mouse and keyboard, chips, Wis alles, back and forward, Meer laden, return from a PDP,
phone drawer (focus trap, Escape, Toon N producten), floating bar, quick add, single-variant add, VAT toggle, no-JS
filtering and contrast. There are no console errors, Liquid errors or horizontal overflow, and theme-check passes.

The blocker (the lead line's delivery date) is in the critic verdict, not here. Everything below is medium or low.

## Medium

- **The CSS budget is exceeded once inline theme CSS is counted.** `tools/shoot.mjs` counts inline `<style>` toward the
  budget. Repro: `node tools/shoot.mjs --url http://127.0.0.1:4100/collections/easy-up-partytenten --out x --device desktop`
  reports css=84,090 B and inlineCss=9,157 B. Of the inline CSS, 8,485 B comes from the theme (font-face and variables
  6,370, comparison 2,010, lead rule 105). That gives 92.6 KB at load, against a limit of 92,160 B. After opening quick
  add and focusing search, the external CSS alone is 91,443 B. `section-main-collection.css` (24.8 KB) is the largest
  section stylesheet, so trim it, or move the comparison's 2 KB inline CSS into it and cut elsewhere.
- **No way to filter on what is in stock or ships soon.** This is the should feature `collection.filter-levertijd`
  (Statafelshop has a 'Voorraadstatus' select). With continue-selling variants, Shopify counts every variant as
  available, so `facets.liquid` always drops 'Alleen leverbaar' (count = total). There is also no metafield
  lead-time filter. Repro: on any collection, no availability or lead-time facet is rendered. Add a product metafield
  filter (for example `custom.levertijd` class: 'Op voorraad' / '2–3 weken' / 'Na drukproef') and document it.
- **'Uitvoering' mixes unrelated attributes, and there is no frame-colour facet** (should feature
  `collection.filter-frame-colour`). Repro: `/collections/statafels` → Uitvoering lists Binnen · Binnen, met
  parasolgat · Buiten (compact HPL) · Buiten (compact HPL), met parasolgat · 110 cm hoog · 107 cm hoog · Zwart
  onderstel · RVS onderstel, one product each. `/collections/easy-up-partytenten` → Polyester · Heavy duty PVC · Dak en
  luifel · Dak, luifel en 3 zijwanden. A shopper cannot filter on onderstel colour or roof material as such. Fix:
  separate options or metafield filters (Onderstel, Dakmateriaal, Bedrukking) per CONTRACT, or hide the group where
  most values hold one product (the existing single-value rule needs more than 8 values, and these have 4 and 8).
- **The Maat filter on Statafelrokken hides the fitting beschermplaat.** Repro: `/collections/statafelrokken` → Maat
  has 22 pills: Ø60-70, Ø68, Ø78, Ø80-85, Ø83, Ø130, Ø300, Ø330 cm, then 14 rectangles. Pick 'Ø80-85 cm' for an
  Ø80 table, and 'Beschermplaat transparant voor statafel' (sizes Ø68/Ø78/Ø83) disappears, although its Ø78 or Ø83
  fits. Statafelshop filters by 'Afmeting blad'. Map plate and topcover sizes to the table size they fit (a 'Past op
  blad' metafield filter), or name the option values after the table size.
- **The comparison table does not fit two products on a phone.** Repro: 390×844, `/collections/easy-up-partytenten`,
  scroll to 'Vergelijk de uitvoeringen'. `.comparison__wrap` is 412 px wide in a 356 px box, so the second product
  is cut ('Easy-up partytent Professiona… m', price clipped to '€59…') and every row needs a sideways scroll. The
  must feature `collection.quality-line-explainer` loses the side-by-side read on phones. Narrow the label column
  (or stack it above each row) so 2 products fit at 360–390 px.
- **The setup docs leave out 4 of the 9 filters the theme is built for.** `docs/theme-setup.md:13` tells the owner to
  create only Beschikbaarheid, Prijs, Kleur, Maat and Uitvoering. The fixture (`catalog/preview-data.json` →
  `filters`) and the theme logic also use Soort (product type), Gebruik (tags, relabelled by
  `facet-value-label`), Past op (`custom.systeem`, matched by name in the `filter_scope` setting) and Met jouw logo
  (`custom.bedrukbaar`, rendered as a switch). If the owner follows the docs, the 'Met jouw logo' filter (should
  feature `collection.filter-printed`) never appears. Add all 9 with their exact labels and the needed metafield
  'filterable' definitions.

## Low

- **The price chip is wrong when the minimum is above the range.** Repro:
  `/collections/easy-up-partytenten?filter.v.price.gte=5000` → the chip reads 'Prijs: €2.349 – €5.000', but the
  shopper asked for 'vanaf €5.000'. `sections/main-collection.liquid:248-254` defaults the missing max to
  `range_max` and then swaps the two. Show 'vanaf €x' / 'tot €y' when only one bound is set.
- **An invalid price is dropped silently.** Repro: type 'abc' in Prijs › Van and press Enter. The price filter
  disappears from the URL and all 14 products show again. The field only gets `aria-invalid`, and the hint
  'Alleen cijfers, bijvoorbeeld 1000 of 279,50' exists only as a `title` attribute, so there is no visible error
  text (WCAG 3.3.1, secondary path). Show `collection.price_format` as a visible message under the fields.
- **The Gebruik facet lists values that match every product.** Repro: `/collections/easy-up-partytenten` → Gebruik:
  Evenement 14 and Markt 14 of 14 products. Leave out a value whose count equals the total, and drop the group when
  only one narrowing value remains.
- **The phone drawer shows 'Wis alles' twice.** Repro: 390, apply Maat 3 × 3 m and open Filteren. 'Wis alles'
  shows as a link in the head and as a button in the foot. Keep one, the foot button.
- **The empty-state copy lowercases the collection title.** Repro: `/collections/zakelijk?filter.v.price.gte=99999`
  → 'Niks in zakelijk met deze combinatie.' (also 'Niks in alle producten…', 'Niks in pakketten…'). The brand book
  §7.2 line is 'Geen tenten met deze combinatie. Haal een filter weg of bekijk alle partytenten.' Use a noun that
  does not depend on the title, or the title as written.
- **Head layout with 2 sibling chips.** Repro: 1440, `/collections/bedrukte-statafelhoezen`. The aside (two stacked
  chips plus 3 USPs) is taller than the title block, so the breadcrumbs and H1 start at y≈238 instead of y≈190 (as
  on `easy-up-partytenten`), below an empty band. Align the head grid to the top, or keep 2 chips on one row.
- **'Vaste datum? Vraag het ons' is detached from its line on phones.** Repro: 390, any collection. The link sits on
  the '14 producten' row, right-aligned, and the lead line wraps underneath on its own.
- **The comparison table writes sizes with 'x'.** Repro: comparison › Afmetingen › Maat '3 x 3 m', while the cards
  and the head say '3 × 3 m'. Apply the same `replace: ' x ', ' × '` as the card title.
- **The card CTA is icon-only on phones.** Repro: 390, any card. The round cart+ button shows no text, and on a
  multi-variant product it opens a chooser rather than adding (brand book §7.2: an outlined button 'In winkelwagen' /
  'Kies je maat'). On desktop the label appears on hover or focus only. Consider the text label at least on
  multi-variant cards.
- **The Zakelijk promo band counts as a product in the list.** `<li class="promo-band">` sits inside
  `ul.product-grid[role=list]`, so a screen reader announces 15 items for 14 products. Give it `role="presentation"`
  plus an inner `<aside>`, or render it outside the list.
