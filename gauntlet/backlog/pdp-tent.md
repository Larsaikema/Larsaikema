# Backlog: pdp-tent (functional critic, round 3, 2026-10-18)

Scope: `/products/easy-up-partytent-premium-3x3` on :4100 at 1440×900 and 390×844, with spot checks on
`-premium-3x4-5`, `-professional-3x3`, `-premium-met-logo-op-de-luifel` and `-professional-full-colour-bedrukt`.

Tested with Playwright:
- Variants: click, arrow keys, and a variant switch followed by an immediate buy click.
- Size pills to sibling products, add-ons, the quantity field (0, -5, 2.5, 1000, empty, Enter), staffel, add to cart
  with the drawer, and the sticky bar on desktop and mobile.
- Gallery: thumbnails, arrows, zoom and Esc.
- The VAT toggle, the need-date check, the quote form (empty, valid, België) and the logo upload (no file, .exe, PNG,
  "later").
- Stock states from a private fixture copy on a temporary port: Rood 12 deny, Wit 0 deny, Zwart 2 deny.
- Widths from 320 to 1920 and laptop heights from 720 to 864, plus the no-JS path, contrast, the heading outline,
  theme-check and the CSS/JS byte totals before and after add to cart.

Fixed since round 2:
- Stock and ETA now sit under the price.
- The need-date check says "naar verwachting".
- The 422 parser and the middot link are fixed.
- The thumbnail labels now name the colour, and the guarantee line now names the legal rights.
- The productblad PDFs were regenerated.

No blocker or high items. All medium and low items follow.

## Medium

- **The downloads are still only the productblad, with no opzetinstructie and no print template.** These are must
  features `product.downloads` and `product.print-template-download`.
  - The live reference 3 × 3 Premium page offers an opzetinstructie, a print template, a filled-in example template
    and more.
  - Ours offers one PDF on every easy-up, including the three print PDPs.
  - The full-colour PDP says "Vraag vooraf het sjabloon voor jouw maat op via de bedrukpagina". The template exists
    only on request, which is the workaround.
  - Repro: Downloads card on `/products/easy-up-partytent-premium-3x3` and on `-premium-met-logo-op-de-luifel`. Then
    run `ls catalog/images | grep -iE 'template|sjabloon|opzet'`, which finds nothing.
  - Fix: generate an opzetinstructie PDF per line and a print template per size from catalog data (as
    `catalog/tools/productblad.mjs` does). Add both to `custom.downloads`.
- **The buy button is below the first screen on common laptop viewports.** No buy button shows at all there, because
  the sticky bar appears only after the main button has scrolled out above the header.
  - Repro: read `document.querySelector('[data-add-button]').getBoundingClientRect()`.
  - At 1366×768 and at 1440×789 (a MacBook Chrome viewport) the button is at y=794–850. At 1280×720 it is at 804–860.
  - About 170 px of "Handig erbij" (legend, "Niet inbegrepen" line, two rows) sits between the colour swatches and the
    button.
  - Fix: collapse the add-ons into one summary row from 990 px, or let the sticky card show on load when the main
    button starts below the fold.
- **The shipping line reads "Verzendkosten €6,95" for a 27 kg, 155 cm parcel, with no quantity rule.**
  - The live reference shows €12,50 for 1 and €25 for 2 or more for the same 3 × 3 Premium, labelled
    "Vrachttransport".
  - The drawer charges €6,95 for 2 tents plus 2 zijwandensets, about 56 kg in 4 parcels.
  - Repro: Premium 3 × 3, quantity 2, tick the zijwandenset, add, and read the drawer line "Verzending binnen NL
    (indicatie) €6,95".
  - Fix: set `custom.verzendkosten` on the easy-up tents (the contract has this field), or give the heavy class a
    realistic default. Keep it listed in `docs/claims-to-confirm.md`.
- **The CSS budget is exceeded after the first add to cart.**
  - On load: 82,901 B in `/assets/*.css` plus 7,454 B inline.
  - After the first add, `component-cart.css` (9,061 B) loads. That gives 91,962 B in assets, or 99,416 B with the
    inline CSS, against 90 KB.
  - Repro: Playwright, sum the `/assets/*.css` response bodies, click the buy button, sum again. The mobile figures
    are 92,495 B and 99,949 B.

## Low

- **The JS budget is exceeded on the print PDP after the mega menu loads.** `-premium-met-logo-op-de-luifel` loads
  69,723 B of JS. Hovering the desktop menu adds `section-header-mega.js` (3,048 B), for 72,771 B, plus 4,866 B of
  inline script. Repro: the same byte sum on that PDP after one hover on "Partytenten".
- **"Nog iets erbij?" still recommends the Starterspakket easy-up Premium.** That pack contains this same tent, so a
  shopper who adds both gets two tents. Repro: Premium 3 × 3, first card of the complementary row (the fixture
  `complementary` list). Leave out bundles whose `componenten` include the current product.
- **The breadcrumb ignores the collection and the Easy-up level.**
  - `/collections/easy-up-premium/products/easy-up-partytent-premium-3x3` reads "Home / Partytenten / Easy-up
    partytent Premium 3 × 3 m". The BreadcrumbList JSON-LD has the same gap.
  - The live reference shows "Alle easy-up partytenten > Easy up partytenten - Premium".
- **A sold-out swatch has two different labels.** A screen reader hears "Wit, niet leverbaar", while the visible
  status reads "Tijdelijk uitverkocht". Repro: stock fixture with Wit at 0/deny, then the label of the Wit swatch. Use
  "Wit, tijdelijk uitverkocht".
- **"Mail me als dit weer op voorraad is" shows without a back-in-stock app.** It is the contact-form fallback, and the
  `notify_form` block setting defaults to true. brand.md §7.2 says this form appears only with an app. Repro: any
  sold-out variant. Default the setting to off.
- **The Product JSON-LD has no `shippingDetails` or `hasMerchantReturnPolicy`.** Both values exist as theme settings
  (`shipping_cost_pakket`, `return_days`). Repro: the `application/ld+json` Product block on the PDP.
- **`product-recommendations.js` loads twice.** Each recommendations section prints its own `<script>`. Repro:
  `curl -s :4100/products/easy-up-partytent-premium-3x3 | grep -c product-recommendations.js` gives 2.
- **An FAQ answer names a collection as plain text.** The answer to "Kan ik onderdelen nabestellen?" names
  "Frame-onderdelen easy-up" without a link to `/collections/easy-up-onderdelen` (catalog `faq`).
- **The logo-tent key facts read awkwardly and miss values.**
  - `-premium-met-logo-op-de-luifel` shows "Opzetten 3 × 3 m: 2; 3 × 4,5 en 3 × 6 m: 2, liefst 4 personen".
  - Oppervlak and Capaciteit are missing, and the facts do not follow the chosen Maat.
  - Repro: the strip under the photo at 1440.
- **The add-on rows cannot be opened or sized.**
  - There is no link to the add-on's page, and the quantity is fixed at `addon_aantallen` × aantal.
  - The live reference "Handige accessoires" block has a quantity field per row, for example two sets of weights for
    one tent.
  - Repro: the "Handig erbij" rows on the Premium 3 × 3.
- **Focus stays on the buy button after a missing logo.** On the logo PDP, "In mijn winkelwagen" without a file shows
  "Upload je logo, of kies 'Ik lever mijn logo later aan'." Focus stays on the button, far below the upload field. Move
  focus to the upload field or the "later" checkbox. Repro: `-premium-met-logo-op-de-luifel`, click the buy button.
- **Choosing a different Uitvoering silently changes the colour.**
  - Repro: `-professional-3x3` with Rood selected, then click "Heavy duty PVC". Kleur jumps to Wit, and the
    other colours turn unavailable.
  - The pill gave no hint beforehand, such as "alleen in Wit en Zwart".
  - A ticked zijwandenset becomes the €299 PVC set, so the total rises without a visible note.
- **The focus order of "Nog 2 tonen" does not match the layout.** The button sits visually in the "Handig erbij"
  header, but in the DOM it comes after the rows, so Tab jumps from the second row (y≈739) up to y≈607. Repro: Tab
  from the colour swatches at 1440.
- **The add-on order does not follow the block's own rule.**
  - The schema info says "Wat niet in de doos zit staat altijd bovenaan, goedkoopste eerst".
  - The order is zijwandenset €199 and then spanbanden €17,95.
  - Voetgewichten, which are excluded and needed on hard ground, are hidden behind "Nog 2 tonen" because `visible`
    is 2.
  - Repro: the Premium 3 × 3 add-on list.
- **The need-date check accepts a past date and copies it into the offerte form.** Repro: open "Nodig op een vaste
  datum?" and fill 2026-10-10 (today is 2026-10-18). It answers "Dat halen we waarschijnlijk niet" and sets the quote
  field "Gewenste leverdatum" to 2026-10-10. Clamp to `min`, or ask for a future date.
- **The mobile add-on spec line is cut off.** At 390 px the zijwandenset row reads "3 × 3 m / Rood · 4 wanden: 1
  dicht, 2 met ra…", which hides "1 met deur · 320 g/m²". Let it wrap to 2 lines.
- **The sticky bar loses the low-stock count.** With Zwart at 2/deny, the main line reads "Nog 2 op voorraad · di 20
  okt in huis", while the sticky bar reads "Op voorraad · di 20 okt in huis". Repro: stock fixture, then scroll past
  the button.
- **The spec table and key facts miss a setup time and a waterkolom value.** The live reference lists "Benodigde
  installatie tijd 1-2" minutes, and the feature asks for opzettijd and waterkolom. Ours says "waterdicht" with no
  waterkolom figure, and only "in een paar minuten" in the description. Add an "Opzettijd" row, and a "Waterkolom" row
  only if the supplier confirms the value.
- **The productblad PDF has two formatting slips.** The Uitvoeringen table and the Maat row read "3x3m" instead of
  "3 × 3 m", and the "Afmetingen" heading is orphaned at the bottom of page 1 with its rows on page 2. Repro:
  `pdftotext -layout catalog/images/productblad-easy-up-partytent-premium-3x3.pdf -`.
