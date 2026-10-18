# Data contract — catalogus ⇄ thema (Klapklaar)

The theme (`theme/`), the catalog (`catalog/catalog.json` → CSV / seed script / preview fixture) and the
seed script all follow this contract. Change it only deliberately, and update all three sides.

## Product options (max 3, Dutch names, exact spelling)

| Option | Values (format) | Used on |
|---|---|---|
| `Maat` | `3 x 3 m`, `3 x 4,5 m`, `3 x 6 m`, `4 x 4 m`, `4 x 6 m`, `4 x 8 m` · tables `Ø80 cm` · covers `Ø80-85 cm` | tents, tables, covers, walls |
| `Kleur` | `Wit`, `Zwart`, `Antraciet`, `Blauw`, `Rood`, `Groen`, … (capitalised Dutch, the name of the cloth colour; never a brand colour name such as `Lampion` or the old `Klaproos`, brand.md v7 §4.2) | everything with colour |
| `Uitvoering` | `Premium` / `Professional`, `Met topcover` / `Zonder topcover`, `Met raam` / `Dicht` / `Met deur`, `Binnen` / `Buiten (compact HPL)` (statafel), `Polyester` / `Heavy duty PVC` (compleet pakket) | where relevant |

Colour swatches: the theme uses `value.swatch.color` when present (seed script links `Kleur` to the
`shopify.color-pattern` category metafield); otherwise it falls back to the theme setting `swatch_colors`
(textarea, one `Naam: #hex` per line). Every colour used in the catalog must be listed in that setting's default
(also the table-top finish `Graniet`, a stone-look laminate: `Graniet: #77736D`).

## Product category (Shopify Standard Product Taxonomy)

Every product carries `product_category` (full taxonomy path, CSV column `Product Category`) and `product_category_id`
(`gid://shopify/TaxonomyCategory/<id>`, seed script). Products with a `Kleur` option sit in a category with the `color` attribute
where one fits, so `Kleur` can be linked to `shopify.color-pattern`. Mapping: `catalog/tools/skeleton/kk_site.py`.

## Product metafields (namespace `custom`)

| key | type | purpose / theme use |
|---|---|---|
| `kenmerk_kort` | single_line_text_field | one-line spec on product cards ("40 mm hexagon · 5 standen · PVC-gecoat") |
| `usps` | list.single_line_text_field | 3–4 product USPs with check icons under the buy button |
| `specificaties` | json | `[{"groep":"Frame","label":"Materiaal","waarde":"Aluminium 6063"}, …]` → spec table (grouped) |
| `staffelkorting` | json | `[{"vanaf":10,"korting":5},{"vanaf":25,"korting":10}]` → staffel table + live "jouw prijs" hint. Real discount = Shopify automatic discount (docs). |
| `addons` | list.product_reference | accessory upsells as checkboxes on PDP, added in the same `/cart/add.js` call; fallback for variants without `addon_varianten` (see Variant metafields) and the source for cart recommendations |
| `addon_modus` | single_line_text_field | `per-stuk` (default) or `per-regel`: the theme multiplies `addon_aantallen` by the main quantity, except for `per-regel` products (sold per meter or m², and configurator products), where the add-on quantity is per order line |
| `past_op` | list.product_reference | compatibility ("Past op: Easy-up Premium 3 x 3 m") |
| `systeem` | list.single_line_text_field | the tent system(s) a part or accessory belongs to, derived by `build.py` from `past_op` (choices `Easy-up`, `Buizenframe`, `Stretchtent`, `Stertent`, `Opblaasbare tent`). Storefront filter **Past op** on the onderdelen/accessoires collections (`easy-up-onderdelen`, `buizenframe-onderdelen`, `partytent-onderdelen`); seed script enables it as a filterable metafield definition. |
| `addon_eenmalig` | list.product_reference | add-ons (subset of `addons` / `addon_varianten`) that are added **once per order line**, whatever the main quantity (a transportkar with 4 statafels). The PDP renders their checkbox with `data-addon-follow="false"` and the note `product.addon_once` ("1 per bestelling, los van het aantal"); all other add-ons follow the quantity (`addon_aantallen` × aantal). |
| `andere_maten` | list.product_reference | the other sizes of a line that is split into one product per size (`easy-up-partytent-premium-3x3`, `-3x4-5`, `-3x6`); set on every product of the line, listing the others (the product itself may be left out). The PDP shows them as pills in the `Maat` option, sorted by size, each linking to the sibling variant with the same `Kleur`/`Uitvoering`; the card lists the sizes. Every sibling has a `Maat` option with its single size value. |
| `levertijd` | single_line_text_field | overrides the default delivery promise ("Levertijd 2–3 weken") |
| `verzending` | single_line_text_field | `pakket` (default) or `pallet` → delivery copy + shipping profile |
| `bedrukbaar` | boolean | shows the logo-upload / drukpositie block (line-item properties) |
| `drukopties` | json | `{"posities":["Voorkant","Rondom"],"aanlevering":"PDF, AI, EPS, SVG of PNG ≥ 300 dpi","levertijd":"10–15 werkdagen na akkoord drukproef","min_aantal":1}` |
| `downloads` | list.file_reference | handleiding / productblad PDFs: `catalog/images/<opbouwhandleiding\|productblad>-<handle>.pdf`, attached by `build.py` when the file exists; tent productbladen come from `node catalog/tools/productblad.mjs` (catalog data only, no prices) |
| `faq` | json | `[{"vraag":"…","antwoord":"…"}]` → PDP FAQ accordion + FAQPage JSON-LD |
| `vergelijk_groep` | single_line_text_field | e.g. `easy-up` → comparison table Premium vs Professional |
| `gewicht_kg` | number_decimal | spec + shipping |
| `verpakt` | single_line_text_field | packed dimensions |
| `garantie` | single_line_text_field | e.g. "2 jaar op frame" (owner-confirmed claim) |
| `included` | list.single_line_text_field | "Wat zit erin" checklist on the PDP (what is in the box) |
| `excluded` | list.single_line_text_field | same block, struck as "niet inbegrepen" ("Zijwanden (los te bestellen)") |
| `availability_status` | single_line_text_field | empty (normal stock logic) · `binnenkort` (Binnenkort leverbaar, no add to cart while sold out) · `pre-order` (button "Nu bestellen, later leveren") · `permanent-uitverkocht` (page stays for SEO, no add to cart, shows `alternatieven`) |
| `alternatieven` | list.product_reference | replacements shown on a `permanent-uitverkocht` PDP (fallback: `past_op`) |
| `verzendkosten` | single_line_text_field | overrides the per-class shipping-cost line on the PDP ("Verzendkosten op dit product: € 12,50") |
| `maatgids` | page_reference | size guide for this product; the link sits on the size option (Maat / Tafelmaat / Diameter …) only |
| `configurator` | json | made to measure (see below); the variant price is the price per unit (m²) |
| `maatwerk` | boolean | shows the "Maatwerk: niet retour" notice (also implied by `configurator.maatwerk`) |
| `componenten` | list.variant_reference (or list.product_reference) | bundle / actiepakket components; set on each bundle **variant** (fallback: on the product) |
| `component_aantallen` | list.number_integer | quantity per component, same order as `componenten` ([4, 4]) |

`drukopties` also takes `"optie": "Bedrukking"` and `"zonder": ["Zonder logo"]`: a variant whose value for that option is in
`zonder` gets no upload/print fields and no print lead time (default `zonder` list: Zonder logo, Zonder opdruk, Zonder
bedrukking, Geen opdruk, Geen bedrukking, Blanco). The print lead time (`drukopties.levertijd`) replaces the dispatch line
only for print variants, so do not put a print lead time in `levertijd`.

`configurator` (product.configurator-maatwerk / -stretch):

```json
{"type": "oppervlakte", "eenheid": "m²",
 "velden": [{"id": "lengte", "label": "Lengte", "min": 5, "max": 25, "stap": 0.5, "standaard": 10, "eenheid": "m"},
            {"id": "breedte", "label": "Breedte", "min": 4, "max": 20, "stap": 0.5, "standaard": 7.5, "eenheid": "m"}],
 "keuzes": [{"label": "Afspanning", "opties": ["Spanbanden met ratel", "Touwset met haringen"]}],
 "min_afname": 20, "tolerantie": "± 2 cm per meter", "maatwerk": true}
```

The theme multiplies the fields (`type` `oppervlakte`; `lengte` uses the first field only), rounds up to whole units, applies
`min_afname`, and adds the line with quantity = billed units and properties `Afmeting`, `Oppervlakte`, each `keuzes` label,
plus private `_eenheid` / `_maatwerk`. Price-relevant choices (palenset, colour) are variant options; price-neutral ones
are `keuzes`. Give configurator variants inventory policy `continue` (made to order) and a `levertijd`.

Bundles: on Shopify use the Bundles app or plain bundle products; either way fill `componenten` + `component_aantallen` on
every bundle variant with the exact component variants (seed script: `gid://shopify/ProductVariant/<id>`). The PDP lists
the components and shows "Je bespaart € x" only when the summed component prices are higher than the bundle price.

Standard review-app metafields `reviews.rating` / `reviews.rating_count` are read when present; the catalog
never sets them (no fabricated reviews).

## Variant metafields (namespace `custom`)

| key | type | purpose / theme use |
|---|---|---|
| `componenten` | list.variant_reference | bundle components of this bundle variant (see `componenten` above) |
| `component_aantallen` | list.number_integer | quantity per component, same order |
| `addon_varianten` | list.variant_reference | the add-on variants that belong to this variant: zijwandenset in the same `Maat` and `Kleur`, voetgewicht `Set van 6` for a tent with 6 poten, statafelrok `Ø60-70 cm` for a `Ø70 cm` statafel, hoes in the same `Maat` as the tafel. The catalog gives SKUs (like `componenten`); the seed script resolves them to GIDs. The PDP addons block renders the selected variant's list and swaps it (keeping ticked add-ons ticked) when the variant changes; product `addons` is only the fallback. |
| `addon_aantallen` | list.number_integer | quantity per add-on for 1 unit of the main product, same order as `addon_varianten` (prikkabel 20 m → 20 LED-lampen, 3 × 6 m Premium → 2 sets spanbanden); cart quantity = aantal × main quantity unless `addon_modus` = `per-regel` |

Every variant of a product with add-ons gets its own list, so the fallback (first variant of each add-on) is never what lands
in the cart. An add-on that has no matching size or colour for a variant is left out for that variant instead of offering a
wrong one (no 2 × 2 m zijwandenset, so the 2 × 2 m tent gets none).

## Collection metafields (namespace `custom`)

| key | type | use |
|---|---|---|
| `intro` | multi_line_text_field | short intro under the collection title |
| `seo_tekst` | rich_text_field | long buying-guide copy below the grid (SEO), collapsible |
| `kenmerken` | list.single_line_text_field | quick chips/USPs at the top of the collection |

## Tags (lowercase)

`badge:nieuw`, `badge:actie` (only with a compare-at price), `bedrukbaar`, `zakelijk` (shown in B2B
contexts), `pallet` (large shipments), `set` (bundles/actiepakketten), `gebruik:tuinfeest`, `gebruik:horeca`,
`gebruik:evenement`, `gebruik:markt` (shop-by-use filters). Never `bestseller` or similar unverifiable claims.

## Collections (handles)

`partytenten` (parent) · `easy-up-partytenten` · `easy-up-premium` · `easy-up-professional` · `stretchtenten` ·
`opblaasbare-tenten` · `stertenten` · `ster-en-opblaasbare-tenten` (both lines, one menu landing page) · `bedrukte-partytenten` · `partytent-onderdelen` · `zijwanden` ·
`gewichten-en-verankering` · `tassen-en-wielsets` · `statafels` · `statafelrokken` · `statafelhoezen-met-strik` ·
`statafelkleden` · `bedrukte-statafelhoezen` · `actiepakketten` (title and menu label ‘Pakketten’: without a compare-at price or `badge:actie` nothing may read as a temporary sale) · `meubilair` · `verlichting` · `accessoires` ·
`zakelijk` (smart: tag = zakelijk) · `all` ·
`easy-up-onderdelen` and `buizenframe-onderdelen` (manual: parts, walls, weights, lighting and heating whose `custom.systeem` holds `Easy-up` resp. `Buizenframe`; both under Accessoires in the main menu) ·
`onderdelen-stretch-ster-en-opblaasbare-tenten` (manual, same rule for `Stretchtent`, `Stertent` and `Opblaasbare tent`, including their own part types `Stretchtent onderdeel`, `Stretchtent zijwand`, `Stertent zijwand` and `Opblaasbare tent accessoire`, which `partytent-onderdelen` and `accessoires` include too; child of `partytent-onderdelen`, Accessoires column in the main menu) ·
`verwarming` (smart: product type = Verwarming, own menu entry under Accessoires) · `evenement` (afzetpalen, marktkraam, loper; the marktkraam is no longer in `accessoires`).
Landing pages instead of filter URLs in the main menu (merchandising review 2026-10-18), each with its own intro, seo_tekst and
kenmerken: `barkrukken`, `stoelen-en-banken`, `tafels` (Klaptafel, Terrastafel, Biertafelset, Bierbank), `transportkarren` (children of
`meubilair`), `prikkabels`, `lampen-en-lichtslangen` (children of `verlichting`), `topcovers-en-beschermplaten`, `tafelhoezen` (children of
`statafelrokken`), all smart on product type, and `statafel-onderdelen` (manual, child of `statafels`).

Collection image: `build.py` sets the image field in `collections.json` and the preview fixture to the first real render among the
collection's `image_candidates` (kk_site.py) or, failing that, the hero of its first member with a real render; draft
cards are never used. The seed script uploads it as the collection image (`collection.image`).

## Menus (handles)

`main-menu` (3 levels: category → subcategory → links), `footer-assortiment`, `footer-klantenservice`,
`footer-klapklaar` (over ons, zakelijk, bedrukken, blog), `footer-juridisch` (voorwaarden, privacy, cookies).

## Pages (handle → template suffix)

`over-ons` → page · `contact` → page.contact · `zakelijk` → page.zakelijk · `offerte` → page.offerte ·
`bedrukken` → page.bedrukken · `veelgestelde-vragen` → page.faq · `verzenden-en-bezorgen` → page ·
`retourneren` → page · `garantie` → page.garantie (garantie + klachtformulier) · `handleidingen` → page.handleidingen
(lists every product with `downloads`) · `betaalmethoden` → page · `maatadvies-statafelrokken` → page ·
`maatadvies-partytenten` → page · `verschil-partytenten` → page.vergelijking (comparison table from `vergelijk_groep`; the
'Lees het hele verschil' links on product and collection pages point at the blog article `advies/easy-up-premium-of-professional`
and are hidden when their target does not exist) ·
`showroom-en-afhalen` → page (only if the owner confirms a pickup location; otherwise left unpublished).

## Blog

Handle `advies` (title "Advies & inspiratie"). Article metafield `custom.producten` (list.product_reference) fills
"Producten uit dit artikel" per article (fallback: an article tag `collectie:<handle>`). Original how-to articles (opzetten easy-up, welke statafelrok past,
hoeveel statafels per gast, partytent onderhouden en opbergen, partytent verankeren bij wind, bedrukken: zo lever je je logo aan).

## Theme settings that hold business claims (all owner-editable, listed in docs/claims-to-confirm.md)

`cutoff_time` (default `14:00`), `shipping_days` (ma–vr), `delivery_days` (carrier days, ma–vr), `transit_days_pakket` /
`transit_days_pallet` / `transit_days_be_extra`, `shipping_cost_pakket` / `shipping_cost_pallet` (PDP shipping line, must
match the Shopify rates), `staffel_mode` (`quote` until automatic discounts exist), `holidays` (dates), `free_shipping_threshold`
(EUR), `return_days`, `warranty_text`, `vat_rate` (21), `price_display` (`incl` | `excl` | `toggle`),
`usp_*` texts, `phone`, `whatsapp`, `email`, `kvk`, `btw_nummer`, `address`.
