# Polish backlog — recurring blind-judge weaknesses (pieces already won)

Collected from the re-verification against the corrected Horizon bar (all five pieces still won 3/3).
These are the weaknesses judges named for *our* side; fix them in the polish phase without regressing the wins.

## Product pages (tent, rok, print)
- Buy box is overloaded; the add-to-cart button sits too low (desktop: bottom of first screen; mobile: 1.5–3 screens
  down). Keep only the decisions before the CTA (size, colour, quantity, price, delivery line). Move add-ons,
  staffel, "Past op", USP checklist, payment/contact rows below the CTA or fold them.
- "Niet inbegrepen" is said three times (Handig erbij, Wat zit erin, Beschrijving) — say it once.
- The bulk-price (staffel) box is irrelevant to a one-tent consumer — show it in Zakelijk mode or collapsed.
- Desktop has no sticky buy bar after the main CTA scrolls away (print PDP).
- Mobile sticky bar truncates the ETA ("di 20 okt in h…").
- Statafelrok: the Goud/Zilver €6 surcharge is only in the description — show it on those swatches.
- Statafelrok: "Alle 24 kleuren" grid repeats the swatch picker and is clipped at the right edge on mobile.
- Print PDP: the four proof steps appear twice (buy box and description); "Logo op 1 kant" chip wraps awkwardly on mobile.
- Staffel tiers are quote-only — consider making tier pricing purchasable (automatic discounts) so 25-piece orders can check out.

## Cart (drawer + page)
- Shipping contradiction: "Verzending binnen NL (indicatie) €6,95" is added to a bold total while the next line says
  "Verzendkosten berekenen we bij het afrekenen". Commit to the shipping rate (or show "gratis vanaf €X") or leave it out of the total.
- Drawer is dense (confirmation strip + three upsells + four summary lines above the CTA); mobile cart page puts
  overview/trust below cross-sells.

## Content
- Article hero image is a grey placeholder box with alt text (image job missing/draft) — needs a real render.
- FAQ topic chips on mobile load pre-scrolled.

## Global
- Header height: ~128 px sticky on desktop (two rows), ~105 px on mobile; consider hide-on-scroll-down.
- Stock contradiction ("Uit voorraad … morgen verzonden" vs "Leverbaar over 2–3 weken") — resolved by demo stock in
  catalog v2; re-check after.
