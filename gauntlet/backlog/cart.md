# Backlog: cart (functional critic, 2026-10-18)

Scope: the cart drawer right after an add, and the cart page `/cart`, on :4100 at 1440×900 and 390×844. I also checked
375×667, 320×568 and 844×390 for the drawer layout. Tested in Playwright:
- adding from a PDP by mouse and keyboard, with and without ticked add-ons, from a configurator (stretchdoek op maat,
  m² line) and from a print product with a PDF upload, plus quick add on a collection card
- in the drawer and on the page: + and −, typed quantities (valid, decimal, negative, 0, 99999), remove by mouse, Enter
  and Space, 'Vergeet niet' adds
- reference, delivery date (too early and valid) and note, which persist after a reload; invalid and empty discount
  codes; checkout submit, which is blocked while the delivery date is invalid
- the btw toggle (Zakelijk), country BE, a 422 response and offline errors
- no-JS update, remove and checkout; keyboard focus order and focus rings; contrast; budgets; theme-check

There are no console errors, Liquid errors or overflow on the cart, and theme-check passes. Everything below is
medium or low. Nothing was found at blocker or high.

## Medium

- **'Vergeet niet' offers twice the beschermplaten for statafel + rok.** Repro: open
  `/products/statafel-inklapbaar-professional` (390 or 1440). Tick "Statafelrok stretch Ø60-70 cm / Met topcover / Wit",
  set Aantal 4 and click In mijn winkelwagen. The drawer (and `/cart`) offers "Beschermplaat transparant voor statafel
  Ø68 cm €127,60 (8 × €15,95)" for 4 tables. One click adds 8 plates. Cause: `snippets/cart-addons.liquid` adds up
  `ca_need` over every line. The statafel variant and the statafelrok variant both list the plate in
  `custom.addon_varianten`. The same chain exists for `statafel-inklapbaar-hdpe-80` and `statafel-met-kruisvoet`
  (statafel → statafelrok-stretch → beschermplaat-statafel). Fix options:
  - don't count a line's add-ons when that line's product is itself an add-on of another line in the cart;
  - or take the maximum, not the sum, per add-on product along such a chain;
  - or drop the plate from the rok's `addon_varianten` in the catalog.
- **Rapid taps on − of the bottom line change another line.** Repro, at 390 (mouse at 1440 behaves the same):
  1. Put Easy-up Premium 3x3 (1), Statafel Professional (4) and Easy-up Premium 3x4,5 (1) in the cart.
  2. Open the drawer and scroll its body to the bottom.
  3. Tap − on the last line 4 times, about 250 ms apart.

  The last line is removed, and the statafel drops to 2 or 3 (4 of 4 runs). Cause: after the remove, `cart.render`
  restores `scrollTop`, which clamps because the body is now shorter. The line above then slides under the finger.
  Fix: ignore pointer input on `.cart-lines` for about 400 ms after a re-render that removed a row. Alternatively, keep
  the removed row's height (collapse it with a transition), or don't restore `scrollTop` when the removed row was below
  the viewport.
- **The PDP goes over the JS and CSS budgets once the drawer opens.** Repro: open
  `/products/easy-up-partytent-premium-3x3`, add it to the cart and press + in the drawer.
  - JS assets: 73,264 B, over the 71,680 B limit.
  - CSS assets: 90,479 B, plus 7,042 B of inline `<style>`, which makes 97,521 B against 92,160 B.
  - Before the add, the page is at 68,684 B JS and 88,460 B CSS. The drawer adds `component-cart.css` (9,061 B) and
    `cart-ui.js` (4,580 B); `cart.js` (8,134 B) loads on every page.
  - Collection pages already sit at about 92.6 KB CSS at load (see `collection.md`), so opening the drawer there is
    over the limit too.

  Fix: move the page-only rules from `component-cart.css` to `section-main-cart.css` (the page layout, the column
  labels, the sticky bar). Also trim the selectors that are duplicated with `base.css`, and consider merging
  `cart-ui.js` into `cart.js` with less code.
- **The cart contradicts itself on returns when it holds a made-to-measure line.** Repro: add
  `/products/stretchdoek-op-maat` (configurator defaults) and open `/cart`. The line says "Maatwerk, niet retour", but
  the reassurance list says "14 dagen bedenktijd (niet bij bedrukt maatwerk)". That implies that made-to-measure
  without print does have bedenktijd. The header bar says "(niet bij maatwerk)". Fix: change the `usp_2` default in
  `sections/main-cart.liquid` to "[bedenktijd] dagen bedenktijd (niet bij maatwerk)". Better still, word it per cart:
  when a line has `_maatwerk` or a print property, name the exception. Update `docs/claims-to-confirm.md` line 47 to
  match.
- **The cart error message offers phone and WhatsApp help that isn't set up.** Repro: on `/cart` with items, make
  `/cart/change.js` fail (offline), then click remove or +. The message reads: "Oeps, dat ging mis. We konden je
  winkelwagen niet bijwerken. Probeer het nog een keer, of bel of app ons: dan regelen we het samen." But
  `settings.phone`, `settings.whatsapp` and `shop.phone` are all empty, so no number appears anywhere. This is an
  unconditional service claim that breaks brand rule §7.5 ("leeg betekent niet tonen"). Fix: build
  `KK.strings.cartError` in `layout/theme.liquid` from a base sentence plus a contact tail. Use "bel of app ons" only
  when phone or WhatsApp is set, "mail ons op …" when only the e-mail is set, and nothing otherwise.

## Low

- **The empty cart points to an "actie" that doesn't exist.** The empty `/cart` and the empty drawer say: "Begin bij de
  partytenten, of kijk wat er in de actie zit." There is no Actie collection or menu item: the menu says Pakketten, and
  CONTRACT says pakketten must not read as a sale without a compare-at price or `badge:actie`. Fix
  (`locales/nl.default.json` `cart.empty_text`, and en): "Begin bij de partytenten, of kijk bij de pakketten." Or show
  the sale half only when a sale collection with compare-at prices exists.
- **The quantity field clips quantities of 4 or more digits.** The field is 36 px wide in the drawer and on the page,
  at both 390 and 1440. "1000" shows as "100" plus half a digit, and "99999" shows as "9999". B2B orders of 1000 rokken
  or plates are plausible. Fix: size `.qty__input` to its content (`field-sizing: content` with `min-width: 3ch`, or a
  `--digits` custom property from Liquid).
- **Excl. btw unit prices don't multiply to the line totals.** Repro: switch the header to Zakelijk and add 10 ×
  Statafel Professional.
  - The line shows "€74,34 per stuk", but the total is €743,39 (10 × 74,34 = 743,40).
  - 'Vergeet niet' shows "€164,88 (10 × €16,49)", which works out to 164,90, and "€131,82 (10 × €13,18)", which works
    out to 131,80.

  Cause: unit and line amounts are converted to excl. btw separately. Fix: in excl. mode, derive the shown unit from the
  line (line_excl ÷ qty) or drop the "(n × unit)" breakdown. Do the same in `cart-line.liquid` (per stuk) and
  `cart-addons.liquid` (`upsell_each_html`).
- **The shipping note contradicts the amount above it.** With one shipping class, the drawer and page show "Verzending
  binnen NL (indicatie) €6,95", include it in Totaal, and then add "Verzendkosten berekenen we bij het afrekenen." (the
  `cart.shipping_note_nl` key). Fix: reuse the wording of the mixed case: "Het definitieve bedrag zie je bij het
  afrekenen."
- **Screen readers only hear the main product after an add with add-ons.** Repro: on the statafel PDP, tick the rok
  and add. The live region says "Staat in je winkelwagen. Statafel inklapbaar Professional, … · 4 ×". It doesn't
  mention that the rok line was added too, although both lines are highlighted. Separately, the cart-page toast reads
  "Staat in je winkelwagen.Zijwandenset …" as one status string, with no space between `<strong>` and the line. Fix: in
  `cart.afterAdd`, append the extra lines ("+ Statafelrok stretch · 4 ×") and put a space after the title.
- **Parity gaps with Outmate's cart.** Outmate's cart page has an accordion next to the totals: "zakelijk buiten NL,
  btw verleggen?", "wanneer geleverd?" and "op factuur betalen?". It also has "Leeg winkelwagen". Ours has neither,
  only the reassurance list and the quote link. Fix (optional): a collapsible FAQ block in the `main-cart` aside, fed by
  blocks or a metaobject, so the owner fills only true answers. A "Winkelwagen leegmaken" link via `/cart/clear` is
  optional.
- **The iDEAL/Bancontact reassurance line is fixed text.** "Veilig betalen met iDEAL of Bancontact" is the `usp_1`
  default. It isn't built from `shop.enabled_payment_types`, which the real payment icons right above already use. If
  the owner leaves Bancontact off, the line is wrong. Fix: build the line from the enabled types, or leave `usp_1`
  empty by default.
- **The drawer has no discount code or note row by default** (`show_discount` and `show_extras` are false). Horizon's
  drawer has both. A shopper with a code has to go to `/cart`, or enter it at checkout. Consider turning on the
  collapsed discount row in the drawer; it costs little height.
- **Pakket lines don't say what's inside.** "4 statafels met stretchrokken (pakket)" shows only its title and variant,
  while the PDP lists the components. Fix: under the variant line, render one quiet line from
  `custom.componenten` / `component_aantallen`, such as "4 × statafel Ø70 cm, 4 × stretchrok zwart".
- **The empty drawer's heading gets a focus ring.** After you remove the last line, focus goes to the h2 "Je
  winkelwagen", which then shows the 3 px ring around plain text. Keep the programmatic focus, but drop the ring on
  `[tabindex="-1"]` headings, for example with `outline-offset` or a subtle underline instead.
