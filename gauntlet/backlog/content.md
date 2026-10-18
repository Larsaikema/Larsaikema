# Backlog: content (functional critic, 2026-10-18)

Scope: `/pages/bedrukken` (page.bedrukken), `/pages/veelgestelde-vragen` (page.faq) and the buying guide
`/blogs/advies/welke-statafelrok-past` (article), on :4100 at 1440×900 and 390×844, plus 320, 768, 1024 and 1180 for
layout. I tested these in Playwright:
- bedrukken: the group filter chips by mouse and keyboard, a whole-card click (it lands on the print variant, for example
  `stertent-enkele-mast?variant=…` Full colour), the template link (it picks the form topic and focuses the select),
  "Of stel eerst je vraag", the contact form (empty, invalid e-mail with values kept, success), and the btw toggle on
  card prices
- FAQ: search (21 terms, the empty state, Esc), the topic nav and chips with scrollspy, deep links `#vraag`, the
  accordions by keyboard, and the sticky aside
- article: the side and inline TOC, share (copy, mail, WhatsApp), the product lists, and the btw toggle
- for all three: link status (all 200, all anchors present), JSON-LD, the heading outline, contrast, focus rings,
  overflow, no-JS, budgets (CSS 69–78 KB, JS 48 KB) and theme-check (pass)

No blocker or high defects. There are no console errors, Liquid errors or overflow. Every price on the bedrukken cards
is the cheapest print variant. Draft article images ('render volgt') are ignored. Everything below is medium or low.

## Medium

- **Staffel claims contradict the default `staffel_mode` = quote.** The content pages say the staffel price simply
  applies:
  - FAQ and the bedrukken FAQ, "Kan ik één stuk laten bedrukken?": "Vanaf 10 stuks krijg je staffelprijs."
  - article, "Veel tafels aankleden?": "Vanaf 10 stuks geldt bij rokken, topcovers en hoezen een staffelprijs".
  - bedrukken hero proof: "Staffelprijs vanaf 10 stuks". The quote tile next to it says "Voor meer dan 10 stuks … maken
    we een offerte" and ticks "Staffelprijs vanaf 10 stuks", which also contradicts itself.

  With the default setting the cart charges the unit price, and the PDP says "Staffelprijs met offerte".

  Repro:
  1. `POST /cart/add.js` with 10 × `statafelrok-stretch` (variant 40000258187610).
  2. `/cart.js` shows total 19950 and no discount, while the article promised a staffel price.

  Fix options:
  - word it as "staffelprijs met een offerte (of automatisch, als die korting aanstaat)";
  - or render it from `settings.staffel_mode`, for example with a `[staffel]` placeholder like `[bedenktijd]`.
- **"Op factuur" stated as fact in the FAQ and its FAQPage JSON-LD.** Two answers state it:
  - "Hoe kan ik betalen?": "Zakelijke klanten met een goedgekeurd account kunnen op factuur betalen".
  - "Kan ik achteraf betalen?": "… met een goedgekeurd zakelijk account op factuur betalen".

  The rest of the shop deliberately removed "Zakelijk bestellen op factuur" by default until an invoice app or B2B
  exists (docs/claims-to-confirm.md, USP balk and Winkelwagen). Repro: open `/pages/veelgestelde-vragen`, open both
  questions, then view-source the `FAQPage` script. Fix: make it conditional ("als je factuurbetaling hebt
  aangezet"), or drop it from the default answers and list the line under "aanzetten zodra" in claims-to-confirm.
- **Two FAQ sources that disagree, with real questions missing from the live FAQ.**
  - `catalog/export/pages.json` › `veelgestelde-vragen.template.faq_groups` holds 32 questions. Nothing consumes
    them (no seed script reads `faq_groups`).
  - `theme/templates/page.faq.json` ships 29 questions with different wording.
  - The live FAQ lacks: guest checkout or an account, "Zijn de prijzen incl. btw?", cadeaubon, "Komt alles tegelijk?"
    (part deliveries), "Wat zit er bij een easy-up?", parts for another brand, "Kunnen jullie op een vaste dag
    leveren?" and an explicit "annuleren" question.
  - Outmate's FAQ answers "geen orderbevestiging ontvangen" and "twee bestellingen op één dag, twee keer
    verzendkosten?"; we have neither.

  Repro: on `/pages/veelgestelde-vragen`, search `orderbevestiging`, `cadeaubon`, `tegelijk`, `vaste dag` and
  `account aanmaken`, which all give 0. `gast` only hits "Welke maat partytent" (keyword "gasten"). Fix: merge into one
  source (the template) and add the missing ones; delete or mark the unused catalog copy.

## Low

- **Article height claim.** "Onze statafels zijn 110 cm hoog en vallen er precies tussen" (Stap 2,
  `/blogs/advies/welke-statafelrok-past`) is not true for every statafel. The catalog has kruisvoet 107/110,
  vierkant 107 and wijnvat 105, and the statafels collection text says "105 tot 110 cm". Fix: "Onze ronde statafels
  zijn 107 of 110 cm hoog".
- **Article products truncated and duplicated.**
  - `custom.producten` has 5 products. The sidebar shows 3 (`limit: 3`) and the grid 4 (`limit: 4`). So
    `beschermplaat-statafel`, which the text recommends twice (Snel overzicht, Schoon houden), never appears as a
    product.
  - Below 1100 px the inline mini list (after Stap 2) and the grid at the end both carry the heading "Producten uit dit
    artikel". At 390 the same 3 products appear twice.
- **Mail share subject shows plus signs.** `mailto:?subject={{ article.title | url_encode }}` gives
  `subject=Welke+statafelrok+past…`. Mail clients do not decode `+` in mailto (RFC 6068), so the subject reads
  "Welke+statafelrok+past+op+jouw+statafel?". Repro: article › Delen › mail icon. Fix: `| url_encode | replace: '+', '%20'`
  for subject and body.
- **Article mini product list has no btw label.** The sidebar and inline "Producten uit dit artikel" prices show
  "vanaf €15,95" or, with Zakelijk on, "vanaf €13,18" with no "incl. btw" or "excl. btw". The cards below the article do
  show it. Repro: header › Zakelijk, then look at the article sidebar.
- **Rok and hoes naming on bedrukken.**
  - The H1 is "Jouw logo op je tent of statafelrok" and the CTA "Ontwerp je statafelrok".
  - The CTA goes to `bedrukte-statafelhoezen`, the card is "Statafelhoes met logo" and the product is
    `statafelhoes-stretch-met-logo`.
  - The catalog page data (`pages.json` › bedrukken.template) says "tent of statafel" and "Ontwerp je statafelhoes".
  - Brand book §7.2 says "Ontwerp je hoes".

  Fix: use one word for the printed product throughout.
- **Bedrukken ignores the page body.** `templates/page.bedrukken.json` sets `intro`, so the page text in Online Store ›
  Pages never shows. A merchant who edits that text sees no change. The body only feeds the meta-description fallback,
  where its two paragraphs join as "…10–15 werkdagen.Vanaf 1 stuk" when the SEO description is empty. Fix: leave
  `intro` empty in the template, or note it in the setting info.
- **Hard-coded claims that do not follow settings.**
  - The FAQ intro (page body) says "dan krijg je binnen één werkdag antwoord" while the contact card next to it uses
    `settings.response_time`.
  - "In België is je pakket meestal een werkdag later bij je" is fixed text while `transit_days_be_extra` is a setting.
  - Neither is listed in claims-to-confirm.

  Repro: change `response_time` or `transit_days_be_extra`; the FAQ text stays the same.
- **The btw-switch answer is wrong on mobile and at checkout.** The answer says "Zet de schakelaar bovenin de winkel op
  Zakelijk, dan zie je overal de prijs excl. btw". Below 990 px the switch is inside the Menu drawer, not at the top,
  and checkout still shows incl. btw. Fix: "bovenin (op je telefoon in het menu) … in de winkel".
- **"Wat kost verzenden?" overstates the cart.** The answer says "Je ziet de verzendkosten in je winkelwagen, vóór je
  afrekent". The cart shows an NL indication ("Het definitieve bedrag zie je bij het afrekenen"). Fix: "een indicatie
  in je winkelwagen, het bedrag bij het afrekenen".
- **"Kan ik een bedrukt product retour sturen? Nee." is unconditional** (bedrukken FAQ). A misprint or defect is still
  covered by the legal warranty. Fix: "Niet binnen de bedenktijd … Klopt de opdruk niet met de goedgekeurde proef of is
  er iets kapot, dan lossen we het op." This needs legal review, like the other bedenktijd text.
- **Form notices are not focused after the reload.** After the bedrukken contact form posts (success, or the server
  error for `test@voorbeeld`), focus stays on `<body>`. The notice has `tabindex="-1"` and `role=status` / `role=alert`,
  but a live region present at page load is not announced. Repro: submit the form and read `document.activeElement`
  (BODY). Fix: focus the notice on load, the way Dawn uses `autofocus` on its form status.
- **`&amp;` in the FAQPage JSON-LD.** "Kan ik mijn zending volgen?" reads "track &amp; trace-link" because
  `strip_html` keeps the entity. Repro: view-source `/pages/veelgestelde-vragen`. Fix: decode `&amp;` after
  `strip_html`.
- **Dead controls without JS.** With JS off, the FAQ search field and the article's "Link kopiëren" button are visible
  and do nothing; the print filter bar is hidden correctly. Fix: render both `hidden` and unhide them in
  `connectedCallback`.
- **Mobile FAQ search results are far from the field.** At 390×844, typing in the search leaves the 4 "Direct regelen"
  tiles and the topic chips between the field and the results. The first result or the empty state ("Geen vraag
  gevonden") starts at about y = 830, behind the on-screen keyboard. Repro: type `xyzzy`. Fix: hide the tiles and chips
  while a query is active, or put the results right under the field.
- **Bedrukken at 768 px.**
  - The hero image stacks full width as a ~640 px square, with the "Voorbeeldopdruk" badge far above the tent and a
    large empty Linnen area, so "Zo werkt het" starts after about 1.3 screens.
  - In the 4-column steps, "Stap 2" sits higher than the other step labels because its text wraps more.

  Fix: cap the hero media height at tablet and top-align the step bodies.
- **The FAQ search clear button is off-brand.** The native WebKit cancel "×" renders in the default blue (390 shot). Fix:
  style or replace `::-webkit-search-cancel-button`.
- **The buying guide is not linked from the rok PDP.** `/products/statafelrok-stretch` has no in-content link to "Welke
  statafelrok past" (only the global menu and the maatgids page). The `statafelrokken` collection text links "hoeveel
  statafels per gast" instead. features.json `content.statafel-guide` asks for links from the statafel and statafelrok
  PDPs (catalog data).
- **Copy nit.** "Geen vector? Wij maken hem drukklaar." in bedrukken stap 2: logo and bestand are het-woorden. Fix:
  "dan maken we het drukklaar".
- **Share button details.** "Link kopiëren" uses the `file` (document) icon instead of a link icon. The swap to "Link
  gekopieerd" has no live region, so a screen reader hears nothing. Repro: article › Delen.
- **FAQ section default text promises a phone.** The default `text` is "Staat je vraag er niet bij? Bel of app ons.",
  shown in a newly added FAQ section even when `phone` and `whatsapp` are empty. Fix: a default that does not name a
  channel.
- **Uneven print card footers.**
  - Cards without a "vanaf" price (Marktkraam €729, Afzetpaal €69,95) put the price and CTA on one row; the others stack
    them.
  - "Statafelhoes met logo" has no print-position fact line; its positions live in Uitvoering.
  - At 1440 the cards in a row have different footers.
