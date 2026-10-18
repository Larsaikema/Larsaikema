# Backlog: pdp-rok (functional critic, 2026-10-18)

Scope: `/products/statafelrok-stretch` on :4100 (2 maten × 2 uitvoeringen × 24 kleuren, 96 varianten), tested in
Playwright at 1440×900 and 390×844, with spot checks at 320, 1024×800 and 1280×800.

What was tested:
- Variants by click and by arrow keys, and `?variant=` deep links.
- The add-on swap for Met and Zonder topcover, the quantity field (0, -4, 2.5, empty, 99999, Enter) and the staffel
  box, in incl. and excl. btw.
- Add to cart with add-ons, the drawer, Esc and focus return.
- "Meerdere kleuren tegelijk bestellen": empty submit, 4 colours, a size switch, add-ons, and back to one colour.
- The colour grid, gallery and zoom, the sticky bar, the offerte link from the staffel box, and the no-JS path.
- Contrast, the aria snapshot, JSON-LD, theme-check, in-page links and CSS/JS byte totals.

No blocker or high items. All medium and low items follow.

## Medium

- **The PDP delivery promise ignores the quantity, ticked add-ons and the colours in a mix.** The drawer corrects
  it, but the PDP shows the in-stock date up to that point.
  - Repro a: choose Ø80-85 / Met topcover / Camel (fixture stock 2, policy continue) and set aantal 5. The PDP still
    reads "Nog 2 op voorraad · di 20 okt in huis". After the add, the drawer reads "Leverbaar over 2–3 weken ·
    verwacht in huis 3 – 10 nov".
  - Repro b: choose Ø 60–70 cm / Met topcover / Wit and tick Beschermplaat (Ø68, stock 0). The add-on row has no
    lead-time note and the card says "We verzenden morgen". The drawer reads "Beschermplaat … is nog niet op
    voorraad: verwacht in huis 3 – 10 nov".
  - Repro c: choose Ø 60–70 cm / Met topcover, open "Meerdere kleuren", and enter Wit 4, Zwart 3, Goud 2 and Rood 1
    (Rood stock 0). The Rood cell has no marker, and the sticky bar reads "Op voorraad · di 20 okt in huis".
  - Fix:
    - When the quantity is above `inventory_quantity` (policy continue), show the later window, or "2 direct, 3 over
      2–3 weken".
    - Give a backorder add-on row its lead-time note.
    - Mark backorder colours in the mix cells, and let the stock line take the slowest ETA in the mix.
- **In "Meerdere kleuren" mode the add-on row shows the wrong colour and the wrong price.**
  - Repro: choose Zonder topcover, open "Meerdere kleuren", enter Goud 3 and Paars 2, and tick Topcover.
  - The row reads "Topcover … Ø80-85 cm / Wit · 5 × €10,95 + €54,75".
  - The cart gets 3 Goud topcovers at €13,95 and 2 Paars topcovers at €10,95, which is €63,75.
  - The buy button (€161,50) and the cart are right.
  - Fix: in mix mode, render the row as "5 topcovers, in de kleur van elke rok" with the summed price that
    `ext()` in `assets/product-mix.js` already computes.
- **The beschermplaat add-on for Ø80-85 cm is always Ø78 cm, which contradicts our own maatgids.**
  - `/pages/maatadvies-statafelrokken` maps blad Ø 85 cm to beschermplaat Ø83 cm, the Ø83 variant exists (stock 85),
    and Klapklaar sells Ø85 statafels.
  - Repro: Ø80-85, "Handig erbij" row "Beschermplaat … Ø78 cm".
  - Fix: offer Ø78 and Ø83 on the Ø80-85 variants (catalog `addon_varianten`) with a hint "Ø78 bij blad Ø80, Ø83
    bij blad Ø85", or put a small plate-size choice in the row.
- **"Past op" does not follow the chosen Maat.**
  - Repro: click "Ø 60–70 cm". The row still lists "Statafel inklapbaar HDPE Ø80 cm", which only comes in Ø80.
  - The Professional and kruisvoet chips link to the product's default variant, not to its Ø70 variant.
  - Fix: filter `past_op` by the selected size (skip products without a matching Maat), and link to the matching
    `?variant=`.
- **The JS budget is exceeded after the multi-colour panel and an add to cart.**
  - JS:
    - On load: 66,858 B.
    - After "Meerdere kleuren" (`product-mix.js` 4,651 B) and an add (`cart-ui.js` 4,580 B): 76,089 B at 390.
    - At 1440, where `section-header-mega.js` (3,048 B) also loads: 79,137 B.
  - CSS:
    - On load: 81,145 B plus 8,954 B inline.
    - After `product-mix.css` and `component-cart.css`: 91,500 B plus 8,954 B inline.
  - Repro: Playwright, sum `decodedBodySize` of `/assets/*.js` and `*.css`. Load the page, click "Meerdere kleuren",
    click "Terug naar één kleur", click the buy button, then measure.
  - Fix: trim `variant-picker.js` and `product-form.js`, or build the mix into `product-form.js` only for mix
    products. The cart CSS overrun is shared with pdp-tent.
- **The buy button is below the fold on common laptops, and the desktop sticky bar only appears on scroll-up.**
  - The `[data-add-button]` top is at y=852 at 1280×800 and at y=902 at 1024×800. At 1440×900 it is at 805.
  - At ≥990 px, `.sticky-buy` stays at opacity 0 with `aria-hidden` while you scroll down past the button. It shows
    only after scrolling up more than 200 px (`initSticky` in `product-form.js`).
  - Fix: show the desktop sticky card when the main button starts below the fold, or tighten the option area at
    ≥990.
- **At 1024 px the size pills wrap.**
  - "Ø 60–70 cm" drops to its own row.
  - The maatgids help squeezes into a narrow column beside the pills over 4 lines ("Twijfel je over de / maat? De
    / maatgids rekent / het voor je uit.").
  - Repro: 1024×800, the Maat row.
  - Fix: place `.vp__help` under the pills below about 1200 px.

## Low

- **The delivery card's pack line is garbled.** It reads "Pakketdienst · verpakt Pakket · 1 doos · ca. 0,52–0,65 kg
  · 0,7 kg" (0,5 kg for Zonder), which gives two weights and the phrase "verpakt Pakket".
  - The spec table has a group "Levering" (Verzending: Pakket) and a separate group "Verzending" (Verpakt: Pakket · 1
    doos · ca. 0,52–0,65 kg).
  - Fix: one line from the variant weight ("Pakket · 1 doos · ca. 0,65 kg"), and one group.
- **The colour radios have doubled accessible names: "Wit Wit", "Crème Crème" and so on.** The tiles in "Alle 24
  kleuren" are a second `<label for>` of each radio. Repro: aria snapshot of the Kleur group. Fix: give the input an
  `aria-label` with the colour name, or make the tiles buttons that check the radio.
- **The mix error stays visible after it is fixed.** Repro: open "Meerdere kleuren", click "Alles op 0", click the
  buy button, then enter Goud 3. "Vul bij minstens één kleur een aantal in." stays visible. Fix: hide it on input.
- **The mix "Alles op 0" button wraps at 390.** It reads "Alles op / 0". Fix: `white-space: nowrap`.
- **The colour surcharge cannot be seen before you click.** Zilver and Goud cost €6 more (€25,95 / €21,95), and the
  swatches give no hint. Fix: add a line under the Kleur legend, "Zilver en Goud: + €6,00", or a small tag on those
  swatches.
- **The staffel rounding does not add up.**
  - Wit Met topcover, aantal 25: "€17,95 per stuk" but "Voor 25 stuks: €449,00" (25 × €17,95 = €448,75).
  - Excl. btw, aantal 10: "€12,52 per stuk" but "€125,21".
  - Fix: compute the total from the rounded unit price that is shown.
- **The add-on row lags the variant.** For about 0.3–0.6 s after a Maat switch, the beschermplaat row still reads
  "Ø78 cm + €16,95" while its value is already the Ø68 variant (until the section HTML returns). Repro: click "Ø
  60–70 cm" and read the row within 500 ms. Fix: swap the spec and price text from the variant JSON together with the
  value.
- **The drawer suggests a topcover the shopper already has.** "Vergeet niet" offers a Topcover for a rok "Met
  topcover", because of the product-level `addons` fallback in the cart piece.
  - Repro: add Ø 60–70 cm / Met topcover / Wit with the beschermplaat, then read the drawer.
  - Fix (cart piece and catalog): skip product add-ons that the line's variant does not list in `addon_varianten`.
- **There is no statafelkleed cross-sell.** Feature `product.statafelkleed` (should) asks for a "leg er een kleed
  over" link on the stretchrok PDP.
  - Repro: neither "Handig erbij", "Nog iets erbij?" nor "Goed om te weten" mentions `statafelkleed` (Ø130).
  - Fix: one line in "Goed om te weten", or an add-on row.
- **"Wat zit erin" does not follow the Uitvoering.** With "Zonder topcover" selected it still lists "Topcover in
  dezelfde kleur (bij ‘Met topcover’)". Fix: hide or strike that row per variant.
- **A colour-tile click on mobile jumps to the top of the page.** The page jumps to `scrollY` 0, the photo, which is
  about 1,300 px above the buy button. Repro: 390, "Alle 24 kleuren", tap Fuchsia. Fix: scroll only as far as the
  picker, with the photo in the gallery updated.
- **The description has two knipogen.** "in één keer feestklaar" and "Klaar is Kees." break brand.md §7 ("hooguit één
  knipoog per scherm"). Fix: drop "Klaar is Kees." from the catalog `description`.
- **Variant labels use two formats.** The raw variant title "Ø80-85 cm / Marineblauw" shows in the add-on spec, the
  quote line and the cart, while the picker reads "Ø 80–85 cm". Fix: run the same `lab()` formatting everywhere.
- **"De maatgids rekent het voor je uit" promises a calculator.** The maatgids page is a static table. Fix: add a small
  "Ø van je blad" input on `/pages/maatadvies-statafelrokken`, or word it "De maatgids helpt je kiezen" (brand.md
  copy change).
- **The mobile first viewport has no option and no buy button.** At 390×844 it shows the breadcrumb, search, the
  photo, title, price and stock. Maat starts at y≈850 and the buy button at 1312, while Horizon shows the Maat pills
  in the first viewport. Fix: a lower photo ratio on mobile PDPs, or a compact title and price block.
- **The Product JSON-LD `description` runs the size-table text together.** It reads "Diameter bladKies
  maatKlapklaar-statafelØ 60–70 cm…". Fix: replace `</td>`/`</th>`/`</tr>` with spaces before `strip_html`, or leave
  tables out.
- **The USP reads as an automatic discount.** The USP "Staffelprijs vanaf 10 stuks" sits there while `staffel_mode` is
  quote, and the box below says "Staffelprijs met offerte". Fix: "Staffelprijs vanaf 10 stuks, met offerte" while
  `staffel_mode` = quote (catalog `usps`, or the theme appends it).
