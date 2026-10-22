# Backlog: b2b (functional critic, 2026-10-22)

Scope: `/pages/zakelijk` (page.zakelijk, sections/page-zakelijk.liquid) and `/pages/offerte` (page.offerte,
sections/page-offerte.liquid, snippets/quote-line-fields.liquid, assets/quote-form.js) on :4100 at 1440×900 and 390×844.
I also checked 320, 360, 768, 1024, 1180 and 1280 for overflow. Tested in Playwright:
- product lines: datalist match → variant select + price, typing, the + and − buttons, adding up to the maximum (12),
  removing a line and renumbering
- prefill with `?product=&variant=&qty=`, `?from=cart`, and the 'Neem je winkelwagen over' button with a cart that holds
  line-item properties
- the Bedrukking pills (mouse and arrow keys), the reveal for country België (btw note) and for ballast advice
- submitting empty, with an e-mail the server rejects, and valid (POST body checked), plus the success states
- the zakelijk account form, the segment links (all 200), FAQ by keyboard, the btw toggle, the anchor CTA, focus order and
  rings, contrast (no text below AA), budgets (CSS 78–79 KB, JS 36 KB on zakelijk and 52 KB on offerte), theme-check
  (clean for these files)

No console errors, Liquid errors, failed requests or horizontal overflow. Nothing is at blocker or high. Everything below
is medium or low.

## Medium

- **A server-side form error wipes the whole quote (offerte) or the account request (zakelijk).** Repro: on
  `/pages/offerte`, fill three lines, the delivery details, Contactpersoon, and the e-mail `jan@bedrijf` (no TLD). The
  browser accepts it because `type=email` allows it. Shopify rejects it and the page reloads with "Dit e-mailadres klopt
  niet helemaal". Every field is now empty: lines, address, name. `/pages/zakelijk#B2BContact` does the same. Fix:
  - give both e-mail inputs the same `pattern="[^@\s]+@[^@\s]+\.[^@\s]+"` that `snippets/product-quote.liquid` already
    uses;
  - refill `name`, `email`, `phone` and `body` from `form.*`, as Dawn's contact-form does;
  - in quote-form.js, keep a sessionStorage draft of the lines and fields and restore it when the page loads with
    `form.errors`.
- **Leaving the offerte page and coming back loses the product lines.** Repro: at 1440, fill line 1 with
  'Easy-up partytent Premium 3 x 3 m', qty 20. Add a line 3 and type in it. Pick "Ja, met ons logo" and click the in-form
  link "Zo werkt bedrukken" (it opens in the same tab). Press Back. Line 1's product is empty while its qty still says
  20, and line 3 is gone. Cause: `[data-line-product]` has `autocomplete="off"`, so the browser does not restore it, and
  JS-added lines are not restored at all. Fix: use the same sessionStorage draft as above, and open "Zo werkt bedrukken"
  in a new tab or a `<details>`.
- **The btw toggle shows two different states for Zakelijk pages and the rest of the shop.** The two states are
  `kk:vat:zakelijk` and `kk:vat`. Repro:
  1. On `/pages/zakelijk` the header shows "Zakelijk · excl. btw" pressed and the pakket cards show excl. prices
     (€82,60).
  2. Click "Statafel met stretchrok (pakket)". The PDP shows "Particulier" pressed and incl. first (€99,95), even
     though the visitor never touched the toggle.
  3. The other way round: on `/collections/statafels` choose Zakelijk, after having chosen Particulier once on
     `/pages/zakelijk`. `/pages/zakelijk` then opens with Particulier.

  Fix: keep the excl. default for Zakelijk pages only while no explicit choice exists. Once the visitor clicks the
  toggle anywhere, write one shared key. A switch from a Zakelijk page carries over to the shop.
- **'Op factuur' is promised by default here but withheld everywhere else.** `docs/claims-to-confirm.md` removed
  "Zakelijk bestellen op factuur" from the bar, home and cart until a factuur-app or Shopify B2B exists. The Zakelijk
  route still promises it in five places:
  - the benefit "Op factuur" in page.zakelijk.json b2;
  - FAQ q2 "Na goedkeuring kun je op factuur bestellen";
  - the page text "Betaal op factuur. Met een goedgekeurd account betaal je binnen de termijn…";
  - the account form text "…en op factuur kunt bestellen";
  - the offerte aside "Op factuur voor bedrijven en verenigingen".

  The page text also says "Een btw-factuur bij elke bestelling", which needs an invoice app. Stock Shopify (non-Plus)
  cannot restrict an invoice payment method to approved accounts. On 390 the benefit text is hidden
  (`.zk-benefit__body>span{display:none}`), so the qualifier "na goedkeuring" disappears and only "Op factuur" remains.
  Fix:
  - drive these lines from one theme setting (e.g. `b2b_invoice_enabled`, default off) or word them as offerte-only
    ("Op factuur via een offerte");
  - show at least a short qualifier on mobile.
- **The België text tells customers to do something they cannot do.** The Zakelijk page text "Bestellen vanuit België"
  says "Zet je btw-nummer in je account". New customer accounts have no btw-nummer field without Shopify B2B, and
  "dan leveren we tegen 0% btw" reads as if checkout does it automatically. Repro: `/pages/zakelijk`, card "Bestellen
  vanuit België". Fix (catalog page body): "Zet je btw-nummer in je offerteaanvraag of mail het ons; na controle
  bestel je zonder Nederlandse btw" and keep the claim note.
- **Segment links are labelled with a narrower name than the collection they open.** Repro: `/pages/zakelijk` › Voor
  wie › Scholen. "Marktkramen 22" opens `/collections/evenement` ("Evenement en inrichting": 22 products of six types,
  7 marktkramen). "Klaptafels 16" opens `/collections/tafels` (klap-, terras-, biertafels and bierbank). The count makes
  it read as 22 marktkramen. Fix: label them "Evenement en inrichting" / "Tafels", or add a `marktkramen` smart
  collection (type = Marktkraam) in the catalog and link that. Same check for future segment blocks: the label should
  match the collection title.
- **No logo upload in either form, while brand.md §7.2 lists 'Logo uploaden' and Outmate's offerte forms take files.**
  The page explains it ("Bestanden kun je hier niet uploaden. Plak een link…"), and the cart import already carries
  uploaded logo URLs. Still, a visitor who starts on `/pages/offerte` has no upload. Option: under Bedrukking add a link
  "Upload je logo bij een product met logo" to the print product with the existing upload flow, or document the
  limitation in claims/docs and drop 'Logo uploaden' from the brand microcopy. Repro: `/pages/offerte` › Bedrukking ›
  "Ja, met ons logo": only a URL field. The pill also carries an upload icon, which suggests an upload.
- **The 'Zakelijk account aanvragen' flow has no next step and no owner procedure.** Repro: submit the form on
  `/pages/zakelijk`. The success message is the generic contact text "Bedankt, we hebben je bericht. We reageren binnen
  één werkdag." It does not say what happens next, for example that the visitor logs in with the same e-mail and sees
  excl. prices once approved. For the owner, nothing in `docs/` explains approving a request: tag the customer
  `zakelijk` (theme setting `b2b_customer_tag`), payment terms, tax exemption for BE. `docs/theme-setup.md` §5 lists
  B2B docs as "nog te schrijven". Fix: give the section its own success text (section setting), and write docs/b2b.md in
  the docs phase.

## Low

- Grammar for one item. Steps:
  1. On `/pages/offerte`, fill one line with Aantal 1. The total under the lines reads "1 regels · 1 stuks" and the
     summary reads "Totaal 1 stuks".
  2. With one product in the cart, the import button reads "Neem je winkelwagen over (1 producten)".

  Add singular settings or locale plurals.
- The price under a matched line does not follow the btw toggle. Repro: open `/pages/offerte?product=easy-up-partytent-premium-3x3&variant=40004181075097&qty=12`.
  The line shows "€230,58 excl. btw per stuk". Click Particulier: it still shows the excl. price. Re-run `showMatch`
  for every line on the toggle's change, or listen for an event from `KK.setVat`.
- Line 1 can be removed, which removes the only `required` product and qty. Repro: on `/pages/offerte`, click the trash
  icon on Regel 1 and fill only name and e-mail. The form validates and sends a request with no products. Keep the first
  remaining line required in `renumber()`.
- Empty lines are sent as blank fields. The POST carries `Regel 2 - product=`, `- uitvoering=`, `- aantal=` and
  `- details=` for an untouched line 2, so the merchant e-mail fills up with empty rows. Disable empty line inputs (and
  empty details) on submit, as the code already does for print and ballast fields.
- A cart with more than 12 lines loses the extra lines on import without a word: `add()` returns null at `max_lines`.
  Show a note ("12 regels overgenomen, zet de rest in Toelichting"), or let the import exceed the maximum.
- Unit products count as pieces. "Loper (per meter)" at 20 adds 20 "stuks" to the summary total. Use the unit, or leave
  unit lines out of the stuks total.
- The datalist holds at most 250 products (`paginate … by 250`; the catalog has 243 now). Once the shop passes 250, the
  rest silently drop out of the suggestions and the variant match. Use `/search/suggest.json` (predictive search) for the
  product field, or a second paginate page.
- Validation messages are the browser defaults ("Please fill out this field." / browser language). The PDP quote form
  uses Dutch messages (`data-msg-required`, `forms.error_required_*`). Reuse them on the offerte and zakelijk forms. The
  logo field `type=url` also rejects "wetransfer.com/…" without `https://` and blocks the submit of an optional field. Use
  `type=text` + `inputmode=url`, or prepend https:// on blur.
- No prefill for a logged-in customer. Dawn fills name, e-mail and phone from `customer`, and for B2B the company too
  (`customer.default_address.company`). A returning business customer retypes everything on both forms.
- The zakelijk success text is the locale string `forms.contact_success` ("…binnen één werkdag"), not
  `settings.response_time`. If the owner changes the reply time, this page still says één werkdag. The offerte success
  does use the setting.
- The account form preselects Branche "Horeca", so visitors who skip it are recorded as horeca. Add an empty first
  option "Kies je branche".
- The FAQ subtext on `/pages/zakelijk` says "Staat je vraag er niet bij? Bel of app ons." while no phone or WhatsApp is
  set (only the e-mail link shows). Make the text conditional, or set the zakelijk FAQ instance's text to "Mail ons".
- Staffel copy promises more than the catalog has:
  - "Een voorbeeld. De exacte staffel staat op elke productpagina." and FAQ q3 "Op elke productpagina staat de staffel"
    are wrong for 21 products without `custom.staffelkorting` (e.g. 'Los frame easy-up Premium', 'Zandzakken voor
    partytent (set van 4)'). Say "op de productpagina's met staffel".
  - The page text "Staffelprijzen vanaf 10 stuks op tenten, statafels, textiel, meubilair…" conflicts with tiers that
    start at 2, 3 or 5 stuks on many products.
- The page body never links the B2B catalog `/collections/zakelijk`. Only the Zakelijk megamenu has "Zakelijk
  assortiment". Add it as the `link_label` of the featured section, or as a fourth CTA.
- "Wat bedrijven bij ons bestellen" suggests an existing business clientele for a brand that has none yet. Use a neutral
  heading such as "Wat je per branche nodig hebt".
- The same four points appear three times on `/pages/zakelijk`: the benefits strip, the "Wat je van ons krijgt" list
  and the FAQ (excl. btw, op factuur, drukproef, levering op locatie). Trim the page-text list to the points the strip
  does not have.
- The meta description runs words together: "Zo werkt Klapklaar ZakelijkVraag een zakelijk account aan…". It is the
  auto excerpt of a page body that starts with an `<h3>`. The offerte page has the same problem. Give both pages an SEO
  description in the catalog/seed (`seo.description`).
- Hardcoded paths ignore the locale. `/pages/offerte` and `/pages/bedrukken` in the FAQ answers (template JSON), and the
  `settings.quote_page | default: '/pages/offerte'` fallback, have no `routes.root` prefix, so `/en/` visitors drop back
  to Dutch.
- On mobile, the "Ballastadvies" explanation sits at the very bottom (after the form). The checkbox "Ik wil
  ballastadvies voor een tent" in step 3 does not point to it. Add a short help line or `aria-describedby` under the
  checkbox.
