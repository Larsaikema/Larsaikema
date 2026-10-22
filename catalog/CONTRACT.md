# Data contract — catalogus ⇄ thema (Klapklaar)

The theme (`theme/`), the catalog (`catalog/catalog.json` → CSV / seed script / preview fixture) and the
seed script all follow this contract. Change it only deliberately, and update all three sides.

## Product options (max 3, Dutch names, exact spelling)

| Option | Values (format) | Used on |
|---|---|---|
| `Maat` | `3 x 3 m`, `3 x 4,5 m`, `3 x 6 m`, `4 x 4 m`, `4 x 6 m`, `4 x 8 m` · tables `Ø80 cm`, `180 x 70 cm` · covers `Ø80-85 cm` · a rol `50 x 1 m` (length × width) | tents, tables, covers, walls |
| `Kleur` | `Wit`, `Zwart`, `Antraciet`, `Blauw`, `Rood`, `Groen`, … (capitalised Dutch, the name of the cloth colour; never a brand colour name such as `Lampion` or the old `Klaproos`, brand.md v7 §4.2). A two-tone buizenframe cloth is `Grijs-wit`, `Antraciet-wit`, `Blauw-wit`, `Groen-wit`, `Rood-wit`, `Zandkleur-wit` (banen in de kleur en wit, dak and wanden alike; parts carry the same value). Table tops: the finish name (`Graniet`, `Berken`, `Leisteen`, `Eiken`, `Vintage hout`, `Wit gespikkeld`, and the compact-HPL decors `Betonlook`, `Wit marmer`, `Zwart marmer`, `Grijs eiken`, `Teak`); one look has one name everywhere (`Houtlook` is retired: the oak look is `Eiken` on every table and chair). The brand palette names (`Lampion`, `Klaproos`, `Inkt`, `Zand`, `Linnen`, `Lijn`, `Kiezel`, `Zon`, `Polder`, `Oker`) are never a product colour, SKU part, image file name or alt text (`validate.py`) | everything with colour |
| `Uitvoering` | `Premium` / `Professional`, `Met topcover` / `Zonder topcover`, `Met raam` / `Dicht` / `Met deur`, statafel and terrastafel: use + onderstel (+ parasolgat) in one value (`Binnen, zwart onderstel`, `Binnen, wit onderstel`, `Binnen, chroom onderstel`, `Binnen, RVS onderstel`, `Buiten (compact HPL), zwart onderstel`, `Buiten (compact HPL), wit onderstel`, `Buiten (compact HPL), zandkleur onderstel`, `Buiten (compact HPL), zwart onderstel, met parasolgat`, …), design statafel blad + onderstel (`Hoogglans, geborsteld goud onderstel`, `Compact HPL, zwart onderstel`), conferentietafel frame (`T-onderstel zwart`, `T-onderstel chroom`, `U-onderstel zwart`), marktkraam frame + kap (`Gegalvaniseerd frame, kap met kartelrand`, `Zwart frame, bedrukte kap`), prikkabel op maat `Fitting om de 50 cm` … `om de 200 cm` (price per meter), promotietent `Dak in framekleur, extra hoog (220 cm)`, `Polyester` / `Heavy duty PVC` (compleet pakket), `Standaard` / `Brouwerijkwaliteit` / `Brouwerijkwaliteit, zwart onderstel` (biertafelset, bierbank, biertafelsets 10 stuks), pack sizes `1 stuk` / `Set van 2` / `Set van 4` | where relevant |
| `Samenstelling` | what a line or pakket is made of when `Uitvoering` already carries the quality: `Set: tafel en 2 banken` / `Alleen tafel` (biertafelset), `Zonder transportkar` / `Met transportkar` (biertafelsets 10 stuks); catalog round 5: the print scope `Dak en luifel` / `Dak, luifel en 3 zijwanden` of the full colour Professional (its `Uitvoering` is the cloth `Polyester` / `Heavy duty PVC`), the number of sets `1 set` / `2 sets` / `3 sets` (stormbandenset, `Uitvoering` = haringlengte `Haringen 50 cm` / `75 cm` / `100 cm`), `1 stuk` / `Set van 2` / `1 stuk met magneetsluiting` / `Set van 2 met magneetsluiting` (afzetpaal met trekband, `Uitvoering` = finish), `Met beschermplaat` / `Zonder beschermplaat` (buffettafel-pakket) | biertafels (merchandising review 3), printed easy-ups, stormbanden, afzetpalen, pakketten; a plain option to the theme (pills), no swatch, no size guide |

Option hygiene (catalog round 2026-10-22, `validate.py`): no `Kleur`, `Uitvoering` or `Samenstelling` option with a single value (the colour or roof
goes in the specs: the Professional 2 × 2 and 5 × 5 m have no `Uitvoering`, the barkoelkast and the koel- en vrieskist no `Kleur`); a one-value
`Maat` stays allowed (add-on fit and filters use it). No option value reads as 'price on request' on a priced, buyable variant: a made-to-order
cloth is `PVC 620 (maakwerk, 3–4 weken)`, never `(op aanvraag)`. A handle never names one size of a product that sells several (`bierbank`,
not `bierbank-220`; the old URL redirects). Inflatable walls take `Uitvoering` `Dicht` / `Met raam` / `Met deur` / `Enkele rits` / `Full colour bedrukt`
(the printed one in `Kleur` `Wit`, `bedrukbaar`, `drukopties.optie: Uitvoering`). Catalog round 5: the waterpoten tent has its own, higher wall line (`zijwand-opblaasbare-partytent-met-waterpoten`, `Maat` `3 m` /
`4,5 m` / `6 m`, 220 cm high, `Kleur` = the tent's frame colours); its add-on is the wall of the tent's long side. Printed inflatable walls offer the print side
in `drukopties.posities` (`Buitenkant` / `Binnenkant`). New `Uitvoering` values: the cover per roof cloth `Voor polyester dak` / `Voor PVC-dak`
(beschermhoes), the height of the wiebelvrije tafel `Terrastafel 75 cm, zwart onderstel` / `Statafel 110 cm, zwart onderstel`, gala posts `Gala 100 cm, bolle kop` /
`Galerie 60 cm` / `Galerie 90 cm` (with `Kleur` `Zwart` / `Goud` / `Chroom`), the universal kar `Enkel, 1 stapel` / `Dubbel, 2 stapels`, seating spares per model
(`Zitting barkruk inklapbaar, zwart`, `Voetdoppen klapstoel (set van 4)`, …).

Colour swatches: the theme uses `value.swatch.color` when present (seed script links `Kleur` to the
`shopify.color-pattern` category metafield); otherwise it falls back to the theme setting `swatch_colors`
(textarea, one `Naam: #hex` per line). Every colour used in the catalog must be listed in that setting's default
(also the table-top finish `Graniet`, a stone-look laminate: `Graniet: #77736D`). A two-tone value may be a CSS background instead of a hex
(`Grijs-wit: linear-gradient(135deg,#6E7276 50%,#F3F3F0 50%)`); the preview fixture then leaves `value.swatch` out so the theme setting draws it.

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
| `addon_eenmalig` | list.product_reference | add-ons (subset of `addons` / `addon_varianten`) that are added **once per order line**, whatever the main quantity (a transportkar with 4 statafels). The PDP renders their checkbox with `data-addon-follow="false"` and the note `product.addon_once` ("1 per bestelling, los van het aantal"); all other add-ons follow the quantity (`addon_aantallen` × aantal). Only an add-on that carries or serves several pieces (a kar for 30 klapstoelen) is eenmalig; a kar that takes one koelkast follows the quantity (`validate.py`). |
| `andere_maten` | list.product_reference | the other sizes of a line that is split into one product per size (`easy-up-partytent-premium-3x3`, `-3x4-5`, `-3x6`); set on every product of the line, listing the others (the product itself may be left out). The PDP shows them as pills in the `Maat` option, sorted by size, each linking to the sibling variant with the same `Kleur`/`Uitvoering`; the card lists the sizes. Every sibling has a `Maat` option with its single size value. |
| `levertijd` | single_line_text_field | overrides the default delivery promise ("Levertijd 2–3 weken") |
| `verzending` | single_line_text_field | `pakket` (default) or `pallet` → delivery copy + shipping profile |
| `bedrukbaar` | boolean | shows the logo-upload / drukpositie block (line-item properties) |
| `drukopties` | json | `{"posities":["Voorkant","Rondom"],"aanlevering":"PDF, AI, EPS, SVG of PNG ≥ 300 dpi","levertijd":"10–15 werkdagen na akkoord drukproef","min_aantal":1}` |
| `downloads` | list.file_reference | handleiding / productblad PDFs: `catalog/images/<opbouwhandleiding\|productblad>-<handle>.pdf`, attached by `build.py` when the file exists; productbladen come from `node catalog/tools/productblad.mjs [--types …]` (catalog data only, no prices; tents, walls, statafels), opbouw- en veiligheidshandleidingen from `node catalog/tools/productblad.mjs --handleidingen` (the catalog-only product field `handleiding` in the copy parts: titel, intro, voorbereiding, stappen, veiligheid, afbreken, onderhoud; not a metafield) |
| `faq` | json | `[{"vraag":"…","antwoord":"…"}]` → PDP FAQ accordion + FAQPage JSON-LD |
| `vergelijk_groep` | single_line_text_field | e.g. `easy-up` → comparison table Premium vs Professional |
| `gewicht_kg` | number_decimal | spec + shipping |
| `verpakt` | single_line_text_field | packed dimensions, or the shipping form and weight where no box size is known: "Pakket · 1 doos · ca. 4,2 kg", "Vracht op pallet (120 x 80 cm) · ca. 150 kg" (a bundle adds "elk onderdeel in eigen verpakking"); no colli count is guessed |
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
| `verzendkosten_staffel` | json | shipping cost of this product per shipping weight and quantity (catalog round 2026-10-18, quantity tiers since catalog round 3): `{"eenheid": "per zending" \| "per stuk", "staffel": [{"vanaf": 1, "bedrag": 19.95}, {"vanaf": 2, "bedrag": 39.9}, {"vanaf": 3, "bedrag": 49.0}], "per_optie": {"optie": "Maat", "waarden": {"3 x 3 m": [{"vanaf": 1, "bedrag": 49.0}, {"vanaf": 4, "bedrag": 79.0}], …}}}`. Tiers: take the last row whose `vanaf` ≤ the quantity of the order line. **`per zending`**: that `bedrag` is the shipping of the whole order line (it does not multiply; the tiers are the weight classes of the shipment: groot pakket ≤ 25 kg € 19,95, ≤ 40 kg € 39,90, pallet ≤ 150 / 400 / 700 / 1.000 / 2.000 / 3.000 kg € 49 / 79 / 129 / 175 / 350 / 525). **`per stuk`**: `bedrag` × quantity (betonblokken). `per_optie` (when present) gives the tiers of the selected variant's option value (the element-wise maximum over the variants with that value, so the PDP never shows less than checkout); `staffel` is the fallback. `verzendkosten` reads "Verzendkosten op dit product: vanaf € <lowest>". The PDP shows the amount for the selected variant at the chosen quantity; the cart estimate takes it per line at the line quantity (and the highest line counts). A pakket (`set`) ships for at least what its heaviest component costs on its own, in at least that component's class; above 31,5 kg nothing ships as a parcel (`validate.py`, for every product since catalog round 2026-10-22: every product with a variant of which up to 10 pieces pass 31,5 kg carries tiers). Amounts must match the Shopify shipping profile (weight-based rates, docs/claims-to-confirm.md). The PDP (`snippets/delivery-promise.liquid`) shows the selected variant's amount and the next tier, and `assets/product-form.js` updates it for the chosen quantity; a variant above 31,5 kg reads as pallet transport whatever `verzending` says. |
| `addon_korting` | json | `{"procent": 10, "op": ["zijwandenset-easy-up", …]}`: these add-ons (a subset of `addons`) get this discount when bought with this product. The PDP shows "−10% met je tent" next to them, only when the add-on block setting `show_addon_korting` is on (default off, until the discount exists); the discount itself is a Shopify automatic discount (Buy X get Y) the owner sets up (docs). Set on the tents for walls, tassen and storm-/spanbanden. |
| `onderdelen` | list.product_reference | parts and accessories that fit this product: the reverse of `past_op`, generated by `build.py` (bundles left out). The PDP renders it as the parts list ("Onderdelen en accessoires die passen", collapsible tab source `parts`, 12 visible, the rest folded); on a buizenframe tent next to the variant `stuklijst`. |
| `verwacht_op` | date | expected (re)stock or delivery date (`2026-11-12`) for `availability_status` `binnenkort` / `pre-order` or a sold-out variant; the PDP shows "Verwacht op 12 november" after the stock line (states coming / sold out / backorder; month names from `delivery.months`). Owner input, empty in the catalog. |
| `gebruik` | list.single_line_text_field | readable shop-by-use labels derived by `build.py` from the `gebruik:*` tags (choices `Tuinfeest`, `Horeca`, `Evenement`, `Markt`). The storefront filter **Gebruik** reads this metafield, never the raw tags. |

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

### Import path (catalog round 5)

`products.csv` carries every non-reference product metafield as a `Name (product.metafields.custom.<key>)` column. The reference
metafields (`addons`, `addon_eenmalig`, `past_op`, `onderdelen`, `andere_maten`, `alternatieven`, `maatgids`, `downloads`) and all
variant metafields below need the GIDs of products, variants, pages and files that only exist after the import, so they travel in
`export/product-references.json` (handles and SKUs) and `scripts/seed/seed.mjs` sets them through the Admin API (`metafieldsSet`,
25 per call), after `definitions` (before the CSV import) and `files` / `pages`. The same script creates collections, menus, pages,
the blog and the redirects. `node scripts/seed/seed.mjs --dry-run` runs every step against an in-memory store that holds exactly
what the CSV creates and checks every reference and type; `validate.py` runs it (area `seed`). Owner guide: `docs/import-en-seed.md`.

## Variant metafields (namespace `custom`)

| key | type | purpose / theme use |
|---|---|---|
| `componenten` | list.variant_reference | bundle components of this bundle variant (see `componenten` above) |
| `component_aantallen` | list.number_integer | quantity per component, same order |
| `addon_varianten` | list.variant_reference | the add-on variants that belong to this variant (since catalog round 5 a list may hold two or more variants of ONE add-on product, each its own row: the prikkabel offers the eindkap, the eindhaak and a verlengkabel from `onderdelen-prikkabel-en-lichtslang`; the theme keys a ticked row by variant id, not by product id): zijwandenset in the same `Maat` and `Kleur`, voetgewicht `Set van 6` for a tent with 6 poten, statafelrok `Ø60-70 cm` for a `Ø70 cm` statafel, hoes in the same `Maat` as the tafel. The catalog gives SKUs (like `componenten`); the seed script resolves them to GIDs. The PDP addons block renders the selected variant's list and swaps it (keeping ticked add-ons ticked) when the variant changes; product `addons` is only the fallback. |
| `addon_aantallen` | list.number_integer | quantity per add-on for 1 unit of the main product, same order as `addon_varianten` (prikkabel 20 m → 20 LED-lampen, 3 × 6 m Premium → 2 sets spanbanden); cart quantity = aantal × main quantity unless `addon_modus` = `per-regel` |
| `stuklijst` | json | the bouwtekening of this variant (buizenframe tents, opslagtent and stretchtent compleet): `[{"groep": "Frame" \| "Doek" \| "Palen" \| "Afspanning", "onderdeel": "Staander 192 cm (zijhoogte 200 cm)", "handle": "buizen-buizenframe-38-mm", "sku": "KK-FRM-BF-S192", "aantal": 10}, …]`; frame parts, dakzeil and wanden in the variant's maat, doek and kleur; for the stretchtent: the stretchdoek los, the palenset in the chosen paalmateriaal, a spanband and haring per lus, and with the zware afspanning a touwenset and ronde haring per paal. The PDP renders it as a parts table with a link per row (`/products/<handle>?variant=<id of sku>`; the seed script adds `variant_id`, the numeric variant id, to every row, so the theme can link without a lookup): collapsible tab source `parts`, `data-dynamic="bom"`, swapped on variant change. `validate.py` checks the rows resolve and that the parts never cost less than the tent. |

Every variant of a product with add-ons gets its own list, so the fallback (first variant of each add-on) is never what lands
in the cart. An add-on that has no matching size or colour for a variant is left out for that variant instead of offering a
wrong one (no 2 × 2 m heavy duty PVC set, so the 2 × 2 m tent gets the polyester set only; since catalog round 2026-10-22 the polyester `zijwandenset-easy-up` has a 2 × 2 m variant). An add-on with a `past_op` must list the main product (the
standard inflatable wall is not offered on the higher Pro), and an add-on without a `Kleur` option whose specs fix one colour is never
offered on a variant of another colour (`validate.py`, catalog round 2026-10-18).

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
`verwarming` (smart: product type = Verwarming, own menu entry under Accessoires) · `evenement` (title ‘Evenement en inrichting’: afzetpalen, marktkraam, loper, tentvloer, kapstok, koeling; the marktkraam is no longer in `accessoires`) ·
`koelkasten-en-vriezers` (smart: type Koeling or title contains ‘koelkasten’, child of `evenement`) · `terrastafels` (smart: type Terrastafel, child of `meubilair`, own column in the Statafels menu: the terrace line mirrors the statafels).
Landing pages instead of filter URLs in the main menu (merchandising review 2026-10-18), each with its own intro, seo_tekst and
kenmerken: `barkrukken`, `stoelen-en-banken`, `tafels` (Klaptafel, Terrastafel, Biertafelset, Bierbank), `transportkarren` (children of
`meubilair`), `prikkabels`, `lampen-en-lichtslangen` (children of `verlichting`), `topcovers-en-beschermplaten`, `tafelhoezen` (children of
`statafelrokken`), all smart on product type, and `statafel-onderdelen` (manual, child of `statafels`).

Collection image: `build.py` sets the image field in `collections.json` and the preview fixture to the first real render among the
collection's `image_candidates` (kk_site.py) or, failing that, the hero of its first member with a real render; draft
cards are never used. The seed script uploads it as the collection image (`collection.image`).

## Storefront filters (Search & Discovery)

Availability, price, the options `Maat` / `Kleur` / `Uitvoering`, product type (‘Soort’), and the product metafields `custom.gebruik` (‘Gebruik’),
`custom.systeem` (‘Past op’) and `custom.bedrukbaar` (‘Met jouw logo’, values labelled Ja / Nee). No tag filter: tags are internal
(`zakelijk`, `pallet`, `set`). The fixture carries the same set (`filters[]`, with `value_labels` for the boolean).

## Menus (handles)

`main-menu` (3 levels: category → subcategory → links), `footer-assortiment`, `footer-klantenservice`,
`footer-klapklaar` (over ons, zakelijk, bedrukken, blog), `footer-juridisch` (voorwaarden, privacy, cookies).

## Redirects and stock input

`catalog/export/redirects.csv` (columns `Redirect from`, `Redirect to`, Shopify's URL-redirect import) keeps a renamed product handle
working: `build.py` writes it from `skeleton.redirects` and refuses a redirect from a live handle or to a missing one. The seed script
must create the same redirects (`urlRedirectCreate`). `catalog/stock.csv` (`SKU,Product,Variant,Voorraad`) is owner input: a filled
`Voorraad` becomes the variant's `inventory_quantity` (CSV `Variant Inventory Qty`, fixture), an empty one leaves 0 + policy `continue`
(`Leverbaar over 2–3 weken`); the catalog never invents stock. `python3 catalog/build.py --stock-template` adds the fast movers' rows.
The PREVIEW fixture (`preview-data.staging.json`, and `preview-data.json` which is a symlink to it) carries plausible demo stock for the
renderer only (`meta.demo_stock: true`: mostly in stock, some low, some backorder) so every stock state can be judged; products.csv and the
seed script never take it: the owner sets the real stock.

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
