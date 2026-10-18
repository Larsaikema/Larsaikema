# Backlog: pdp-tent (functional critic, 2026-10-18)

Scope: `/products/easy-up-partytent-premium-3x3` (main subject), plus `-professional-3x3`, `-premium-3x6`,
`-professional-4x8` and the logo versions, on :4100 at 1440×900 and 390×844 (Playwright: variants, keyboard, add-ons,
add to cart, sticky bar, zoom, quote form, stock states from a private fixture copy with stock 12 / 0 deny / 2 deny).
No blockers or highs found. Everything below is medium or low.

## Medium

- **Every gallery thumbnail is labelled "1".** `sections/main-product.liquid:170` uses
  `'product.gallery_thumb' | t: index: pos | plus: 1`. The `plus: 1` runs on the translated string
  ("Toon afbeelding 0"), so Liquid returns 1, and Shopify does the same. Repro: open the PDP at 1440 and inspect
  `.gallery__thumb`: all 7 have `aria-label="1"`. A screen reader says "1, knop" seven times (WCAG 2.4.6). Fix: put
  `pos | plus: 1` in an `assign` before the `t` filter.
- **The excl. btw price is missing on phones and in the add-on rows.** This is the must feature
  `global.price-incl-excl-btw`, which names accessory blocks explicitly. Repro: at 390 px in the default incl. mode,
  the main price shows only "€279,00 incl. btw": `section-main-product.css:43` hides `.price__alt` below 750 px
  whenever the mini toggle is present. At any width, the "Handig erbij" rows (`+ €199,00`) and the size pills show only
  the price for the current mode. The toggle is the only way to see the excl. amount.
- **The plain easy-up PDP has no route to the logo or full-colour versions.** Outmate offers "Full
  Colour-bedrukking" right in the colour picker (feature `product.print-option-reveal`). Ours has separate products
  (`easy-up-partytent-premium-met-logo-op-de-luifel`, `-professional-met-logo-op-de-luifel`, `-full-colour-bedrukt`),
  but nothing inside `<product-info>` on the plain 3×3 links to them. The only links are in the mega menu, and the
  quote text "met je logo?" does not link either. Repro: on the premium 3×3, search product-info for links containing
  "logo" or "bedruk": there are none.
- **The JS budget is over on the printable easy-up PDPs.** Repro:
  `node tools/shoot.mjs --url http://127.0.0.1:4100/products/easy-up-partytent-premium-met-logo-op-de-luifel --out x --device desktop`
  reports js=72,431 B. The budget is 70 KB (71,680 B). The plain tent is at 68,684 B, and `product-print.js`
  (3,747 B) pushes it over. Trim `product-form.js` (15.6 KB) or `variant-picker.js` (10.4 KB), or lazy-load
  `delivery-countdown.js` (5.9 KB).
- **The buy button is below the fold on common laptop screens.** Repro: at 1366×768 the button sits at y=835–891,
  and at 1024×768 at y=928. The delivery block (stock, expected date, shipping cost) is lower still. "Handig erbij"
  (two rows plus intro, about 200 px) sits between the colour swatches and the button. Outmate shows price, delivery
  line and button in the first screen. Consider collapsing the add-ons to one line ("+ zijwanden, haringen …
  toevoegen") above 990 px, or moving the stock and delivery line above the add-ons.
- **The downloads hold only the productblad.** Feature `product.downloads` (must) lists opzetinstructie,
  specificatieblad, template, treksterkte and brandveiligheid. Repro: the Downloads card on the premium 3×3 has one
  PDF, "Productblad …". There is no `opbouwhandleiding-easy-up-partytent-*.pdf` in `catalog/images/`. The setup steps
  exist only inline and in a blog article. Add an opzetinstructie PDF per size, or at least one per line.
- **Shift+Tab can leave the focused element hidden under the header.** The header reappears when you scroll up.
  Repro at 1440: scroll to the recommendations and Shift+Tab upwards. The focused element ends up at top 38–72 px,
  under the 128 px header ("Kies je kleur: …" card links, "Easy-up partytent opzetten", "Meer over verzenden"). Cause:
  `section-header.js` sets `--header-h` to 0 while the header is hidden, so `html{scroll-padding-top:var(--header-h)}`
  is 0 at the moment the browser scrolls focus into view. Then the scroll up brings the header back over it. This
  touches shared and header code; one fix is to keep `scroll-padding-top` at the full header height. Also seen once at
  1440: the main buy button focused at y=818 under the floating sticky card (top 806).

## Low

- **Ticked add-ons are lost after a sold-out variant.** Repro (stock fixture with Wit = 0/deny): tick Zijwandenset on
  Rood, click Wit (sold out, so the add-on block is removed), then click Rood again. The add-on is unticked.
  `swapAddons` only carries ticks between two rendered lists.
- **"Nog iets erbij?" recommends the Starterspakket easy-up Premium, which contains this same tent.** A shopper who
  adds both gets two tents. Repro: the premium 3×3 PDP, first card of "Nog iets erbij?". Leave bundles that contain
  the current product out of the complementary row, or give them a heading like "Liever als set?".
- **The two stock wordings for a sold-out colour differ.** The screen-reader text is "Wit, niet leverbaar" while the
  visible status is "Tijdelijk uitverkocht". Repro: stock fixture, Wit swatch label on the premium 3×3.
- **The Wit swatch boundary is too faint.** Its ring is `rgba(29,36,32,.42)` over `#f3f3f0`, which comes to about
  2.6:1 against Zand `#FBF6EC` (non-text contrast wants 3:1). Repro: the Kleur row, Wit swatch at 1440.
- **The buy button label wraps to three lines at 320 px and from 750 to about 820 px.** It reads "In mijn /
  winkelwagen / €279,00" (button 162–224 px wide next to a 138 px quantity stepper). Repro: viewport 768×1024 or
  320×640, scroll to the button.
- **The breadcrumb always reads Home / Partytenten / product.** It skips "Easy-up partytenten" and "Easy-up
  Premium", even on `/collections/easy-up-premium/products/easy-up-partytent-premium-3x3`. Outmate shows the full path.
- **An FAQ answer names a collection without linking it.** The answer to "Kan ik onderdelen nabestellen?" names
  "Frame-onderdelen easy-up" as plain text. Link it (`/collections/easy-up-onderdelen`).
- **The logo-tent key facts are awkward.** On `easy-up-partytent-premium-met-logo-op-de-luifel` they read "Opzetten:
  3 x 3 m: 2; 3 x 4,5 en 3 x 6 m: 2, liefst 4 personen": "x" instead of "×", the facts do not follow the chosen size,
  and Oppervlak and Capaciteit are missing. Repro: open that PDP at 1440 and look under the photo.
- **The hover preview fights keyboard selection.** With the mouse resting on one swatch while the keyboard selects
  another (focus the Kleur radio, ArrowRight), the re-rendered swatch labels fire `pointerover`. "Kleur:" and the
  gallery then show the hovered colour, not the selected one, until the mouse moves. Repro: click Wit, leave the mouse
  there, press ArrowRight: the label stays "Wit" while `?variant=` is Zwart.
- **Add-on rows have no product link and a fixed quantity.** The shopper cannot open the add-on's page, and cannot
  order, say, two sets of spanbanden for one tent: the quantity is always `addon_aantallen` × aantal. Outmate lets you
  set a quantity per accessory.
- **The notify form promises an automatic mail.** "Mail me als dit weer op voorraad is" and "Top, we mailen je zodra
  dit weer op voorraad is." show without a back-in-stock app, as a contact-form fallback the owner must follow up by
  hand. brand.md §7.2 says this form appears "alleen met een app". Repro: a sold-out variant. Either soften the
  success copy ("We laten het je weten") or show it only when an app block is present.
- **The Product JSON-LD has no shipping or return data.** `shippingDetails` and `hasMerchantReturnPolicy` are
  missing, although both values exist as theme settings (Google merchant listings recommend them).
- **`product-recommendations.js` is included twice.** Two `<script>` tags come from the two recommendation sections.
  It is harmless thanks to the define guard and the cache, but it is noise.

## Builder round (2026-10-18, after the 4–2 split with live Outmate)

Fixed:
- Gallery thumbnails read "Toon afbeelding 1 … 7" (`thumb_n` assigned before the `t` filter).
- Excl. btw price now also shows on phones under the main price, next to the mini toggle.
- Plain PDPs link to the printed version in the colour legend: "Met jouw logo vanaf €399,00 ›" (variant_picker setting
  `print_collections`, snippet `product-print-alt`; also statafelrok, klaptafelhoes, zijwand, dakzeil).
- JS budget: print PDP 69,400 B, plain PDP 66,029 B (spaces squeezed out of product-form.js, variant-picker.js,
  product-print.js, AST-identical; download sizes moved into variant-picker.js, download-size.js no longer on the PDP).
- Ticked add-ons survive a sold-out variant; swatch hover preview follows pointermove (no longer overrides the keyboard).
- Buy label stays on two lines at 320 px and 750–839 px; Wit swatch ring raised to about 4:1 on the PDP.
- Notify success copy no longer promises an automatic mail.
- New: backorder note under "Leverbaar over 2–3 weken" ("Niet uit voorraad: deze uitvoering bestellen we voor je bij.",
  plus "Wel uit voorraad: …" variants) and "Nodig op een vaste datum? Check of het lukt" (date vs expected window,
  fills the offerte form's Gewenste leverdatum).

Still open (not in this piece's files): breadcrumb depth (snippets/breadcrumbs), FAQ link (catalog), JSON-LD shipping and
return data (snippets/structured-data), Starterspakket in "Nog iets erbij?" (sections/product-recommendations), extra
download PDFs (catalog), scroll-padding under the hiding header (section-header.js), buy button below the fold at 1366×768.
