# Data contract — catalogus ⇄ thema (Klapklaar)

The theme (`theme/`), the catalog (`catalog/catalog.json` → CSV / seed script / preview fixture) and the
seed script all follow this contract. Change it only deliberately, and update all three sides.

## Product options (max 3, Dutch names, exact spelling)

| Option | Values (format) | Used on |
|---|---|---|
| `Maat` | `3 x 3 m`, `3 x 4,5 m`, `3 x 6 m`, `4 x 4 m`, `4 x 6 m`, `4 x 8 m` · tables `Ø80 cm` · covers `Ø80-85 cm` | tents, tables, covers, walls |
| `Kleur` | `Wit`, `Zwart`, `Antraciet`, `Blauw`, `Rood`, `Groen`, … (capitalised Dutch) | everything with colour |
| `Uitvoering` | `Premium` / `Professional`, `Met topcover` / `Zonder topcover`, `Met raam` / `Dicht` / `Met deur` | where relevant |

Colour swatches: the theme uses `value.swatch.color` when present (seed script links `Kleur` to the
`shopify.color-pattern` category metafield); otherwise it falls back to the theme setting `swatch_colors`
(textarea, one `Naam: #hex` per line). Every colour used in the catalog must be listed in that setting's default.

## Product metafields (namespace `custom`)

| key | type | purpose / theme use |
|---|---|---|
| `kenmerk_kort` | single_line_text_field | one-line spec on product cards ("40 mm hexagon · 5 standen · PVC-gecoat") |
| `usps` | list.single_line_text_field | 3–4 product USPs with check icons under the buy button |
| `specificaties` | json | `[{"groep":"Frame","label":"Materiaal","waarde":"Aluminium 6063"}, …]` → spec table (grouped) |
| `staffelkorting` | json | `[{"vanaf":10,"korting":5},{"vanaf":25,"korting":10}]` → staffel table + live "jouw prijs" hint. Real discount = Shopify automatic discount (docs). |
| `addons` | list.product_reference | accessory upsells as checkboxes on PDP, added in the same `/cart/add.js` call |
| `past_op` | list.product_reference | compatibility ("Past op: Easy-up Premium 3 x 3 m") |
| `levertijd` | single_line_text_field | overrides the default delivery promise ("Levertijd 2–3 weken") |
| `verzending` | single_line_text_field | `pakket` (default) or `pallet` → delivery copy + shipping profile |
| `bedrukbaar` | boolean | shows the logo-upload / drukpositie block (line-item properties) |
| `drukopties` | json | `{"posities":["Voorkant","Rondom"],"aanlevering":"PDF, AI, EPS, SVG of PNG ≥ 300 dpi","levertijd":"10–15 werkdagen na akkoord drukproef","min_aantal":1}` |
| `downloads` | list.file_reference | handleiding / productblad PDFs |
| `faq` | json | `[{"vraag":"…","antwoord":"…"}]` → PDP FAQ accordion + FAQPage JSON-LD |
| `vergelijk_groep` | single_line_text_field | e.g. `easy-up` → comparison table Premium vs Professional |
| `gewicht_kg` | number_decimal | spec + shipping |
| `verpakt` | single_line_text_field | packed dimensions |
| `garantie` | single_line_text_field | e.g. "2 jaar op frame" (owner-confirmed claim) |

Standard review-app metafields `reviews.rating` / `reviews.rating_count` are read when present; the catalog
never sets them (no fabricated reviews).

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
`opblaasbare-tenten` · `stertenten` · `bedrukte-partytenten` · `partytent-onderdelen` · `zijwanden` ·
`gewichten-en-verankering` · `tassen-en-wielsets` · `statafels` · `statafelrokken` · `statafelhoezen-met-strik` ·
`statafelkleden` · `bedrukte-statafelhoezen` · `actiepakketten` · `meubilair` · `verlichting` · `accessoires` ·
`zakelijk` (smart: tag = zakelijk) · `all`.

## Menus (handles)

`main-menu` (3 levels: category → subcategory → links), `footer-assortiment`, `footer-klantenservice`,
`footer-klapklaar` (over ons, zakelijk, bedrukken, blog), `footer-juridisch` (voorwaarden, privacy, cookies).

## Pages (handle → template suffix)

`over-ons` → page · `contact` → page.contact · `zakelijk` → page.zakelijk · `offerte` → page.offerte ·
`bedrukken` → page.bedrukken · `veelgestelde-vragen` → page.faq · `verzenden-en-bezorgen` → page ·
`retourneren` → page · `garantie` → page · `betaalmethoden` → page · `maatadvies-statafelrokken` → page ·
`showroom-en-afhalen` → page (only if the owner confirms a pickup location; otherwise left unpublished).

## Blog

Handle `advies` (title "Advies & inspiratie"), original how-to articles (opzetten easy-up, welke statafelrok past,
hoeveel statafels per gast, partytent onderhouden en opbergen, partytent verankeren bij wind, bedrukken: zo lever je je logo aan).

## Theme settings that hold business claims (all owner-editable, listed in docs/claims-to-confirm.md)

`cutoff_time` (default `14:00`), `shipping_days` (ma–vr), `holidays` (dates), `free_shipping_threshold`
(EUR), `return_days`, `warranty_text`, `vat_rate` (21), `price_display` (`incl` | `excl` | `toggle`),
`usp_*` texts, `phone`, `whatsapp`, `email`, `kvk`, `btw_nummer`, `address`.
