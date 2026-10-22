# Backlog: home (functional critic, fresh context, 2026-10-22)

Scope: `/` on :4100 in Playwright at 1440×900 and 390×844. Also checked at 320, 360, 768, 900, 1024, 1280 and 1920 wide,
with JS off, in English, in BE, and with a fake clock. The fake-clock times were: Thursday 13:59 and 14:01, Friday 15:00,
Saturday, Sunday at the DST switch, and 24 December before and after 14:00.

What I tested:
- all 433 links (all 200, 0 Liquid errors)
- hero size pills (all land on filtered collections that are not empty)
- the 4 occasion chips (24 products each)
- both tab sections: mouse, Arrow keys, Home, End, wrap-around, and the counts against `products.json`
- quick add: multi-variant (dialog), single-variant (direct `/cart/add`), configurator and print cards link to the PDP; desktop and mobile; focus returns to the card CTA after Escape
- the Particulier/Zakelijk switch: header, B2B band, all three in sync, VAT maths right, kept after reload
- the newsletter: empty, invalid, valid, and focus on the success message
- footer accordions on mobile, and the country/language form
- text contrast (0 failures at both sizes)
- a full keyboard pass: 149 stops, all with a visible ring (cards via focus-within)
- duplicate ids and ARIA references (none broken)
- JSON-LD (Organization and WebSite)
- theme-check (0 errors)

There are no console errors, no 404s and no horizontal scroll at any width. The dispatch copy is correct at every fake
time, including the holidays and the weekend.

Most items from the 2026-10-18 backlog are fixed: the heading copy, the newsletter focus, promo price consistency, the
mobile B2B switch, the countdown with the stock check, the promo h2, tabs `block:select`, the staffel wording, the
Zakelijk-mode text, the 320 mini-tiles, the hero alt text and the 1024 hero gap. Carried-over items are marked
"(carried)".

Note: during this review another builder was editing `snippets/product-card.liquid` and `assets/base.css`. Card layout
inside the rows changed while I was testing, so card styling is not judged here.

## Medium

- **Quick add loses the chosen colour when you switch size.** In the dialog, the Maat pills of an `andere_maten` line
  load the sibling product (`data-qa-load`), but the dialog comes back on the sibling's first variant. The contract
  (`andere_maten`) says the size pills keep the same `Kleur`/`Uitvoering`.
  - Repro: `/` at 1440 › Kies je partytent › quick add on "Easy-up partytent Premium 3 × 3 m" › pick Zwart › click
    "3 × 4,5 m". The dialog shows "Kleur: Rood". Click "In mijn winkelwagen" and `/cart.js` holds
    `easy-up-partytent-premium-3x4-5 · 3 x 4,5 m / Rood`.
  - Fix: in `assets/quick-add.js`, after `load()`, re-check the inputs whose option name and value match the previous
    selection (or pass `?variant=` for the matching sibling variant, as the PDP pills do).

- **The Easy-up tile claims "Staat in een paar minuten, met twee man" for all 15 easy-ups.** Our own catalog
  contradicts this for the bigger sizes. Setup copy for `easy-up-partytent-professional-4x6`, `-4x8` and `-5x5` says
  "Zet hem op met vier personen, één per hoek: frame en dak wegen samen 66–84 kg". For 3 × 4,5, 3 × 6 and 4 × 4 it says
  "met vier gaat het rustiger". This is an unconditional claim about handling and safety. The collection kenmerk was
  already reworded to "met 2 personen" in a catalog round.
  - Repro: `/` › Wat zet jij neer? › Easy-up partytenten benefit (`templates/index.json` › `categories.blocks.c1.settings.benefit`).
  - Fix: limit the claim, for example "Van 2 × 2 tot 5 × 5 m, klein staat er in een paar minuten", or "Staat in een paar
    minuten (3 × 3 m met twee personen)". Also drop the gendered "twee man" in favour of "twee personen", as the catalog
    does.

- **The CSS budget is broken.** At load, the external theme CSS is 86,390 B and the theme's inline `<style>` (fonts and
  scheme tokens) is 6,370 B. That is 92,760 B (90.6 KiB), over the 90 KB of BRIEF §7. After a quick add, which opens the
  cart drawer, `component-quick-add.css` (3.8 KB) and `component-cart.css` (9.1 KB) load lazily. That brings the page to
  105.6 KB.
  - Repro: load `/`, sum the `/assets/*.css` response bodies and the `<style>` text, without Shopify's payment-button
    style. Then quick add the first card.
  - Fix: trim `base.css` (36.1 KB; it is shared, so coordinate) and `section-header.css` + `section-header-mega.css`
    (18.2 KB). Load the mega CSS only on first hover or focus. Drop the hero `.price__alt` markup instead of hiding it.

- **The "Met jouw logo" tile only leads to printed tents.** The tile is titled "Met jouw logo". It links to
  `/collections/bedrukte-partytenten` (tents, zijwand, dakzeil, ster and opblaasbaar) and shows "vanaf €399,00". The
  header item with the same name goes to the `/pages/bedrukken` hub, which also covers bedrukte statafelhoezen and
  tafelhoezen. Printed statafelhoezen are Statafelshop's core B2B line, and a shopper looking for one from this tile
  lands on tents only. Two screens lower, the same page lists printed items "vanaf €109,00" and "vanaf €119,00", so the
  tile's "vanaf €399" reads as the entry price for printing.
  - Repro: `/` › Wat zet jij neer? › Met jouw logo.
  - Fix: point the tile at `/pages/bedrukken` (or a `met-jouw-logo` collection that holds both), and set its
    `price_product` to the cheapest printed product (`statafelhoes-stretch-met-logo`). Or rename the tile to
    "Partytent met jouw logo".

- **No terrastafels on the home page body.** Feature `home.category-product-rows` (must) lists "Statafel & terrastafel",
  and Outmate's home has a Statafel & Terrastafel promo. Ours has no terrastafel tab, tile or promo. The 6 terrastafels
  (`/collections/terrastafels`) are only reachable through the Statafels mega menu or Meubilair.
  - Repro: `/`, search the page body (`main`) for "terras". The hits are the occasion chip "Horeca en terras" and two
    promo texts. There is no link to any terrastafel product or collection.
  - Fix: add a "Terrastafels" tab block to the `tafels` product-tabs section (collection `terrastafels`), or add a
    mini-tile.

## Low

- **The tile image alt text pollutes the link names (carried).** `snippets/image.liquid` does `alt | default: image.alt`,
  so the `alt: ''` that `collection-list.liquid` passes falls back to the file's alt. The Statafels tile reads
  "Statafel inklapbaar Professional Ø 80 cm, Wit, schuin vooraanzicht (onderdeel van dit pakket) Statafels Rond Ø 70–85
  cm …".
  - Repro: inspect the accessible name of the 2nd tile on `/`.
  - Fix: add a `decorative: true` parameter that forces `alt=""`.
- **The "Statafels" copy undersells the range.** The tile says "Rond Ø 70–85 cm, ook vierkant en rechthoekig". The
  tafels intro says "Statafel Ø 70, 80 of 85 cm". The collection also has the wijnvat statafel at Ø 100 cm.
  - Repro: `/` › Statafels tile and the Statafels, rokken en barkrukken intro.
  - Fix: "Rond Ø 70–100 cm, ook vierkant en rechthoekig", and "Statafels van Ø 70 tot 100 cm, vierkant of rechthoekig, …".
- **The hero chip title breaks inside the size.** At 1024 wide, the chip reads "Easy-up partytent Premium 3" on one line
  and "× 3 m" on the next. Cards use ` ` around the ×, but `hero.liquid` prints the title as is.
  - Repro: `/` at 1024×900, the product chip under the hero render.
  - Fix: apply the same `replace: ' x ', times_nb` and nbsp treatment to `chip_product.title` and `product_label`.
- **The setting "Ook de andere prijs klein tonen" (default on) has no effect on the home page.** Cards and the logo
  products pass `secondary: false`. The hero chip renders the excl. line and hides it with
  `.hero__product-price .price__alt{display:none!important}`. Only the quick-add dialog shows both prices. An owner who
  ticks the setting sees nothing change on `/`.
  - Repro: theme editor › Prijzen & btw › toggle the setting, then look at `/`.
  - Fix: either honour the setting in the hero, cards and iwt list, or say in the setting's `info` that cards and the home
    page always show one price. Render `secondary: false` in the hero instead of hiding the line with CSS.
- **The promo tiles have no visible call to action on mobile.** Below 750 px, "Bekijk de pakketten" and "Stel je zeil
  samen" are `display:none`. The whole tile is a link, but nothing shows that.
  - Repro: `/` at 390 › Pakketten / Op maat tiles.
  - Fix: keep a compact arrow button, or underline the title, on mobile.
- **The card action says "Ontwerp met je logo" on plain products.** In the "Ster & opblaasbaar" tab, all 4 cards
  announce "Ontwerp met je logo: …", although the default variant of each is plain ("Effen doek", "Dak in framekleur",
  plain wanden). Owner: `snippets/product-card.liquid`.
  - Repro: `/` › Kies je partytent › Ster & opblaasbaar, then read the `aria-label` of `.card__cta`.
  - Fix: use "Ontwerp met je logo" only when every variant is printed (no `drukopties.zonder` match). Otherwise use
    "Kies je maat" or "Kies je uitvoering".
- **The newsletter maps every server error to "Dit e-mailadres klopt niet helemaal."** `footer-newsletter-form.liquid`
  ignores `form.errors.messages`, and after the reload the error is neither focused nor announced. Dawn prints
  `form.errors.translated_fields` and `messages`.
  - Repro: on Shopify, post an address Shopify rejects for another reason.
  - Fix: print `form.errors.messages['email']` when present, and give the error `role="alert"` (or focus the field) on
    load.
- **`section-product-tabs.css` and `.js` are emitted twice (carried).** There are two product-tabs sections on `/`.
  - Repro: view source and count the `section-product-tabs` tags (2 + 2).
  - Fix: emit the tags once (a flag in the first instance, or move them to the layout for `index`).
- **The blog section renders empty without a blog (carried).** `sections/blog-posts.liquid` prints the h2 and an empty
  `<ul>` when no blog is chosen or the blog has no articles.
  - Repro: theme editor › Blogartikelen › clear Blog.
  - Fix: wrap the section in `{% if b != blank and b.articles_count > 0 %}`.
- **The footer columns differ from brand.md §7.2 (carried).** The brand book lists Winkel, Zakelijk, Hulp and Over
  Klapklaar. The footer has Winkel, Hulp, Over Klapklaar and Direct contact. "Hulp" also lists "Maatadvies
  statafelrokken" but not "Maatadvies partytenten" (menu data).
  - Repro: footer of `/`.
  - Fix: add a `footer-zakelijk` menu block (offerte, staffel, bedrukken, zakelijk) and the partytent size advice, or
    align the brand book.
- **An empty social list renders.** `<ul class="footer__social" role="list"></ul>` is printed when no social URL is
  filled in.
  - Repro: the footer brand column on `/`.
  - Fix: render the `ul` only when at least one `settings.social_*` is set.
