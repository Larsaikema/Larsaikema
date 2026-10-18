# Backlog: pdp-print (functional critic, 2026-10-18)

Scope: `/products/statafelhoes-stretch-met-logo` on :4100 (2 maten × Logo op 1 kant / Logo op 2 kanten / Full colour
rondom × 6 kleuren, 26 varianten). Tested in Playwright at 1440×900 and 390×844, with a no-JS pass and a spot check of
the shared print reveal on `/products/stertent-enkele-mast`.

What was tested:
- Variants by click and by arrow keys, `?variant=` deep links, and Full colour rondom with a non-white Kleur.
- The upload block:
  - .docx, a 22 MB PNG, 4 mixed files (PNG, PDF, SVG, JPG), a duplicate, and a 6th file.
  - Remove by keyboard, and drag-and-drop on the drop zone and next to it.
  - "Ik lever mijn logo later aan", and the remark field.
- An empty submit from the main button and from the mobile sticky bar.
- Multipart `/cart/add.js` with 4 files, and the line properties in `/cart.js`, the drawer and `/cart` (JS and no-JS).
- The staffel box in quote mode (incl. and excl. btw), "Eerder nodig?" into the inline offerte, and zoom with Esc.
- The JSON-LD, theme-check, contrast of the print texts, nl/en locale keys and CSS/JS byte totals.

The core flow works, with 0 console errors and 0 Liquid errors:
- Choose, upload or "later", add, and see the properties in the cart.
- An empty submit is blocked with an announced message.
- Files survive a variant change.
- The no-JS form posts the file.

No blocker or high items. All medium and low items follow.

## Medium

- **The buy button is below the first screen at 1440×900.** The upload block (about 370 px) sits between the swatches
  and the button.
  - Repro: load the PDP at 1440×900 and read `document.querySelector('[data-add-button]').getBoundingClientRect()`. It
    gives top 1144 and bottom 1200, against a viewport of 900. The Horizon bar has its button at y≈686.
  - The desktop sticky bar only appears after the main button has scrolled out, and then only on scroll-up.
  - Fix: on desktop, collapse the block until the first interaction. Keep the drop zone, but put the drawing and the
    help text behind "Waar komt mijn logo?". Or let the sticky card show from load while the main button is below the
    fold.
- **Dropping a file on the placement drawing opens the file and leaves the PDP.**
  - The drawing shows a dashed box with an upload arrow, so it looks like a drop target. brand.md §4.2 says a dashed
    edge means only "sleep hier je bestand".
  - Only `[data-print-drop]` handles `dragover` and `drop`.
  - Repro: in Playwright, dispatch `dragover` and `drop` with a File on `[data-mock]` or on `.print__intro`. Both
    events report `defaultPrevented: false`, and no file is added. In a real browser, Chrome then navigates to the
    dropped image or PDF, and the chosen options and files are lost.
  - Fix:
    - Make the whole `[data-print]` fieldset (or the document, while a file is dragged) accept the drop and call
      `add()`.
    - Draw the logo zone in the mock with a solid or tinted outline, not dashed.
- **The buy area has no "geen bedenktijd" notice for print.**
  - `snippets/product-usps.liquid` drops the "14 dagen bedenktijd" line for bedrukbaar products ("they have their own
    notice"). With `show_steps` on, the print block shows no such notice, unlike maatwerk (`maatwerk_text`, tied to the
    button with `aria-describedby`).
  - The no-return rule is only in the description ("Lees verder" on mobile), in the closed "Levering & retour"
    accordion and in the cart sidebar.
  - brand.md §7.2 asks for "14 dagen bedenktijd (niet bij bedrukt maatwerk)" under the button.
  - Repro: search the buy column (title to staffel box) for "bedenktijd" or "retour": there is no hit.
  - Fix: render a short line in the service block for print variants, such as "Bedrukt voor jou: geen bedenktijd.
    Daarom eerst een drukproef.", and tie it to the button like `Maatwerk-…`.
- **A print template cannot be downloaded (must feature `product.print-template-download`).**
  - Full colour rondom only offers "Vraag het sjabloon voor je maat aan" (`/pages/bedrukken#sjabloon`), a contact
    form, so the designer waits for a mail before starting.
  - The theme already links a `custom.downloads` file whose URL contains `sjabloon` or `template`. The catalog has no
    downloads on this product.
  - Repro: choose Full colour rondom and read the caption under the drawing. There is no download link, and the
    product has no Downloads section.
  - Fix (catalog): generate `sjabloon-statafelhoes-stretch-met-logo-<maat>.pdf` (panel outline, feet, seams, safe zone,
    plus a filled-in example) and attach it to `downloads`. Keep "vraag aan" as the fallback.
- **The print variants give no idea of when the hoezen arrive.**
  - The ETA line reads "Levertijd 10–15 werkdagen na akkoord drukproef". No step or FAQ says how fast the drukproef
    comes (step 2: "Digitaal, per mail"; FAQ "Wanneer heb ik de rokken?": "Na je bestelling krijg je per mail een
    drukproef").
  - The "Nodig op een vaste datum? Check of het lukt" date check is hidden on purpose for print.
  - The main use (beurs, bedrijfsfeest) is date-bound, and the reference sites state a total window ("binnen 14–21
    dagen geleverd").
  - Repro: any variant. Compare `.delivery__need`, which keeps `hidden`, with `/products/statafelrok-stretch` on a
    backorder variant.
  - Fix:
    - Add a theme setting `proof_days` (claim, e.g. "drukproef binnen 1 werkdag"), show it in step 2 and in the FAQ.
    - Let the date check run for print with the window: today + proof_days + 10–15 werkdagen + transit, worded as
      "bij akkoord op de dag van de proef".
- **The CSS and JS budgets are exceeded on this PDP.**
  - On load: CSS is 83,578 B in `/assets/*.css` plus 7,443 B inline, which is 91,021 B. JS is 71,047 B plus 4,866 B
    inline.
  - The print-only files add 8,768 B: `product-print.js` 4,189, `section-main-product-print.css` 2,854 and
    `section-main-product-mock.css` 1,725.
  - After the first add (`component-cart.css` 9,061), CSS is 100,082 B at 1440 and 100,615 B at 390.
  - After one hover on "Partytenten" (`section-header-mega.js` 3,048), JS is 74,095 B.
  - Repro: Playwright, sum the `/assets/*.css|js` response bodies on load, after a hover on the menu and after "later"
    + add.
  - Fix: inline the mock CSS into the print CSS and trim both. The cart and base CSS overrun is shared with pdp-tent
    and pdp-rok.
- **"Past op" does not follow the chosen Maat, on a product that cannot be returned.**
  - Repro: choose "Ø 60–70 cm". The row still lists "Statafel inklapbaar HDPE Ø80 cm"
    (`/products/statafel-inklapbaar-hdpe-80`), which only comes in Ø80.
  - The other chips link to the table's default variant, not its Ø70 variant.
  - This is shared with pdp-rok (backlog item "Past op does not follow the chosen Maat").
  - Fix: filter `past_op` by the selected size, and link `?variant=` to the matching table size.

## Low

- **A stale error stays after a file is removed.**
  - Repro: add 4 files, then 2 more. "Je kunt maximaal 5 bestanden toevoegen." appears, and 5 are kept.
  - Remove one with the × button: the message stays visible.
  - Fix: clear `[data-print-error]` in the remove handler.
- **The upload error is not tied to the field.** The error box is `role="alert"`, but the file input gets no
  `aria-invalid` and no `aria-describedby` to the error. The drop zone border stays Kiezel instead of Bordeaux (brand.md
  §4.2: text and border of a field with an error).
  - Repro: click the buy button without a file, then inspect `.print__file` and `.print__drop`.
- **The colour swatches under Full colour rondom are announced as "niet leverbaar".** Clicking one does not fail: it
  switches Uitvoering to "Logo op 1 kant" and the price from €139 to €109.
  - Repro: choose Full colour rondom and read the swatch labels: "Zwart, niet leverbaar", and so on. Then click Zwart.
  - The live region does read the new variant ("Ø80-85 cm, Logo op 1 kant, Zwart. €109,00").
  - Fix: label them "Zwart, niet bij Full colour rondom", so the switch is expected.
- **The gallery has no Full colour rondom example and no back view for "Logo op 2 kanten".** The €139 all-over print
  is only shown as a small gradient in the drawing. Repro: choose Full colour rondom: the gallery stays on the white rok
  with one small logo. Fix (renders): add a full colour example render and a back view, and set the variant image of
  the `-FC-WIT` variants.
- **The Full colour preview stretches an uploaded logo over the whole rok.** `preserveAspectRatio="xMidYMid slice"`
  crops a plain logo to fill the drawing. Repro: Full colour rondom, then upload a wide logo PNG. Fix: in rondom mode,
  show a single file that is not a full design at its own aspect ratio on a white rok, or caption "Voorbeeld van je
  ontwerp, niet op schaal".
- **A low-resolution logo is not flagged.** The help text asks for a PNG of at least 2000 px wide, but a 300 px web
  logo is accepted without a hint, which costs a drukproef round trip. Repro: `assets/product-print.js` only checks the
  extension and the size, so a 300 × 150 PNG is added with no message. Fix: read `naturalWidth` from the object URL (PNG and JPG) and show a soft Oker hint, such as "Dit bestand
  is 300 px breed; we nemen contact op als het niet scherp genoeg is", without blocking.
- **"Ik lever mijn logo later aan" does not say where to send the logo.** Repro: tick the box. Nothing appears that
  names the address or asks to quote the order number. Fix: on tick, show a help line such as "Mail je logo na je
  bestelling naar {{ settings.email }}, met je bestelnummer."
- **The product JSON-LD says `InStock` for made-to-order print variants.** The PDP says 10–15 werkdagen after the
  proof. Repro: read the offers in the Product JSON-LD: all 26 say `https://schema.org/InStock`. Fix: use
  `https://schema.org/MadeToOrder` (or `BackOrder`) for print variants. The missing `shippingDetails` and
  `hasMerchantReturnPolicy` (no returns for print) are shared with pdp-tent.
- **The staffel copy reads as automatic, but the staffel only comes through an offerte (`staffel_mode: quote`).**
  - The USP reads "Vanaf 1 stuk, met staffelprijs vanaf 10".
  - The description and FAQ say "Vanaf 10 stuks geldt een staffelprijs; je ziet hem in de tabel bij de prijs".
  - The cart charges full price: €1.290,00 for 10 × Logo op 2 kanten, with the hint "€1.161,00 met offerte".
  - Fix (catalog copy): "Vanaf 10 stuks staffelprijs via een offerte". Or let the copy follow the setting.
- **Keyboard focus on the hidden file input does not bring the drop zone into view.** Repro: at 1440×900, focus the
  Wit swatch and press Tab. The 1 px input sits at y=864, so the browser does not scroll, and only the top edge of the
  focused drop zone shows. Fix: on `focus`, call `scrollIntoView({block:'nearest'})` on `.print__drop`.
- **A screen reader hears the file name and size run together.** The list item is `<span>logo.png</span><span>14
  kB</span>`, read as "logo.png14 kB" in the live region. Fix: add a visually hidden ", " or put the size in
  parentheses.
- **"sleep ze hierheen" shows on touch screens**, where you cannot drag. Repro: 390×844 with `hasTouch`: the drop zone
  title reads "Kies je bestanden of sleep ze hierheen". Fix: use `@media (hover: none)` with a shorter label, "Kies je
  bestanden".
- **The English strings disagree.** `product.print_file_too_big` says "choose ‘I will send my logo later’", while the
  checkbox reads "I'll send my logo later". Repro: `locales/en.json`.
- **The page names the product both "rok" and "hoes".** The eyebrow says "STATAFELROK" (product type), the title says
  "Statafelhoes", and the copy says "stretchrok" and "Kleuren rok". Repro: first screen. Fix: pick one per page, or make
  the eyebrow the collection ("Met jouw logo").
- **The drawing caption uses printers' jargon.** "hart ca. 27 cm boven de vloer" uses "hart" for the centre of the
  logo. Repro: the caption under the drawing. Fix: "midden van je logo ca. 27 cm boven de vloer".
