# Backlog: contract changes for the theme (catalog round, 2026-10-18)

Source of truth: `catalog/CONTRACT.md` (changed in this round). The catalog side is built and validates
(`python3 catalog/build.py`, `python3 catalog/validate.py`: 0 errors). Every item below is new or changed data that the theme has to
read or show. The preview fixture (`catalog/preview-data.staging.json`, with `catalog/preview-data.json` as a symlink to it) already
carries all of it.

## New product metafields (namespace `custom`)

| Key | Type | What the theme does with it |
|---|---|---|
| `verzendkosten_staffel` | json | The PDP shows the shipping amount for the selected variant: `per_optie.waarden[<value of per_optie.optie>]` when present, otherwise `staffel`. For `eenheid: "per stuk"` (betonblokken) it also shows the tier for the chosen quantity. The cart estimate takes the amount per line. The existing `verzendkosten` line ("Verzendkosten op dit product: vanaf € …") stays as the summary. |
| `addon_korting` | json | `{"procent": 10, "op": [handles]}` on the tents. Next to each add-on whose handle is in `op`, show "−10% met je tent". The discount itself is a Shopify automatic discount that the owner sets up. The theme must not change the price itself. |
| `onderdelen` | list.product_reference | The parts list on the main PDP ("Onderdelen en accessoires voor deze tent"). This is the reverse of `past_op` and is built by build.py. Bundles are left out. |
| `verwacht_op` | date | "Verwacht op 12 november" next to the stock line for `binnenkort` / `pre-order` or a sold-out variant. It is empty in the catalog, so the owner fills it in. |
| `gebruik` | list.single_line_text_field | Readable shop-by-use labels (`Tuinfeest`, `Horeca`, `Evenement`, `Markt`). The **Gebruik** filter reads this field and never the `gebruik:*` tags. |

## Changed or extended fields

- **Variant `stuklijst` (json)**: rows `{groep, onderdeel, handle, sku, aantal}`. These were already on the buizenframe tents and the
  opslagtent. They are now also on every variant of the **stretchtent compleet**, with the groups `Doek`, `Palen` and `Afspanning`. Render
  them as a parts table, one row per part, linking to `/products/<handle>?variant=<id of sku>`. Group the rows by `groep`.
- **`verpakt`**: where no box size is known, this now gives the shipping form and weight: "Pakket · 1 doos · ca. 4,2 kg" or
  "Vracht op pallet (120 x 80 cm) · ca. 150 kg". Bundles add "elk onderdeel in eigen verpakking". There is no colli count any more, so
  render the string as it is.
- **Bundles**: the body may contain an empty `<table data-kk="set-vs-los"></table>`. build.py fills it from the bundle data, with one row
  per price-relevant option and the columns *Los* / *In het pakket* / *verschil*. The theme styles the table and must not compute it.
  Bundle FAQs no longer quote amounts.

## Option values the swatches and pickers must handle

- **Two-tone cloths**: `Grijs-wit`, `Antraciet-wit`, `Blauw-wit`, `Groen-wit`, `Rood-wit`, `Zandkleur-wit` (banen in de kleur en wit). The
  `swatch_colors` default in `theme/config/settings_schema.json` now has gradient values for them
  (`linear-gradient(135deg,#6E7276 50%,#F3F3F0 50%)`). The swatch snippet must use `background:var(--swatch)`, not `background-color`.
  The fixture leaves `value.swatch` out for these values, so the theme setting has to draw them.
- **Table top finishes**: `Leisteen`, `Eiken`, `Vintage hout`, `Wit gespikkeld` (and the existing `Graniet`, `Berken`).
- **Colours now on walls and covers**: the inflatable walls (`Rood` … `Grijs`, `Antraciet`), the stertent walls (`Wit`, `Zwart`,
  `Zandkleur`), and stoelhoes, velours koord, tapijttegel, LED-lamp colours (`Warm wit`, `Roze`, `Paars`). Every value is in `swatch_colors`
  (validate.py checks this).
- **Uitvoering values with two facts in one**: statafel and terrastafel `Binnen, zwart onderstel` … `Buiten (compact HPL), zwart onderstel,
  met parasolgat`; biertafel `Brouwerijkwaliteit, zwart onderstel`; HDPE statafel `1 stuk` / `Set van 2` / `Set van 4`; prikkabel
  `1 fitting per meter` / `2 fittingen per meter`; kerstverlichting `… met aansluitkabel` / `… zonder aansluitkabel`; stretchtent
  `… palen, zware afspanning`. The pills must wrap and must not truncate.
- **Sizes**: a size can now be a triangle (`4 x 4 x 4 m`). Keep the existing size-sort, which sorts by area within a shape.

## Collections, filters and menus

- New collections: `terrastafels` (child of `meubilair`, with its own column in the Statafels menu) and `koelkasten-en-vriezers` (child
  of `evenement`). `evenement` is now titled "Evenement en inrichting". The menus are updated in the catalog.
- Filters: the tag filter is gone. **Gebruik** reads `custom.gebruik`. Boolean metafield filters carry `value_labels`
  (`{"true": "Ja", "false": "Nee"}`), and the preview renderer (`tools/preview/lib/drops/collection.rb`) shows those labels. The live theme
  shows the labels that Search & Discovery sets. These labels must be entered in the admin (see docs).

## Preview fixture

- The fixture has `meta.demo_stock: true` with a note and counts. Most variants are in stock, some are low (1–3) and some are on
  backorder (0, policy continue), so every stock state can be judged in the preview. `export/products.csv` keeps Inventory Qty 0 and policy
  continue until the owner sets the real stock (`catalog/stock.csv`, docs/claims-to-confirm.md). The theme must not treat the demo stock as
  real.

---

# Catalog round 3 (2026-10-18, graded findings): what the theme still has to read

The catalog side builds and validates clean (`python3 catalog/build.py`, `python3 catalog/validate.py`: 0 errors). The grader's high finding
was that **the theme reads none of the round-2026-10-18 fields**. One part is fixed in this round, the rest is listed here in priority
order with the exact data the PDP has to render. The PDP files (`sections/main-product.liquid`, `snippets/product-addons.liquid`,
`snippets/delivery-promise.liquid`) were being edited by the PDP piece during this round, so the catalog engineer did not touch them.

## Done in this round

- `snippets/cart-shipping.liquid` reads `custom.verzendkosten_staffel` per line: the variant's `per_optie` value (else `staffel`), the last
  tier with `vanaf` ≤ the line quantity, `per stuk` × quantity, and the highest line counts. Checked in the preview cart: 4 × betonblok
  1000 kg € 459, stretchtent 10,5 × 19,5 m € 129, buizenframe 8 × 12 m € 79, 25 statafels € 79 (were € 45 / € 49 / € 49 / € 19,95).

## To do on the PDP (priority order)

1. **Shipping line per variant and quantity** (`custom.verzendkosten_staffel`): show the amount for the selected variant at the chosen
   quantity next to the delivery promise ("Verzending bij 3 stuks: € 49,00"), and update it when the quantity or variant changes
   (product-form.js already knows both). The same lookup as cart-shipping: `per_optie.waarden[<value of per_optie.optie>]` else `staffel`;
   last row with `vanaf` ≤ quantity; `eenheid: "per stuk"` multiplies by the quantity. Since round 3 every pallet and table product
   carries quantity tiers (weight classes of the whole shipment), so a flat amount is wrong from 2 pieces on.
2. **Bouwtekening** (variant metafield `custom.stuklijst`, on 611 variants: buizenframe tents, opslagtent, stretchtent compleet): a parts
   table per `groep` (Frame, Doek, Palen, Afspanning), columns Onderdeel and Aantal, each row a link to `/products/<handle>?variant=<id>`
   where the id is the variant of that product with `sku` = the row's `sku` (`all_products[row.handle]`; a stuklijst uses at most 8
   distinct handles, under the 20-lookup limit). Swap it on variant change (data-dynamic like the price block). Collapsible tab
   "Bouwtekening" under the description is enough.
3. **Parts list** (`custom.onderdelen`, product references, on 84+ products: the reverse of `past_op`): "Onderdelen en accessoires voor
   deze tent" as a small product-card row or link list on the PDP (tents, statafels, marktkraam). Bundles are already left out.
4. **Add-on discount label** (`custom.addon_korting` = `{"procent": 10, "op": [handles]}`, 25 tents): in the add-on block, next to each
   add-on whose handle is in `op`, the text "−10% met je tent" (no price change: the discount is a Shopify automatic discount the owner
   still has to create; the theme setting or block toggle should hide the label until it exists).
5. **Expected date** (`custom.verwacht_op`, date): "Verwacht op 12 november" next to the stock line for `binnenkort`, `pre-order` or a
   sold-out variant. Empty in the catalog until the owner fills it in.
6. **Add-on colour choice (UX, low)**: a statafel offers the rok/strik in one colour (Wit at Wit, else Zwart). A colour select inside the
   add-on row (the add-on product's own `Kleur` values, the variant `addon_varianten` entry as the default) would let the shopper pick one
   of the 24 colours without leaving the PDP. No data change needed: `addon_varianten` gives the default, the add-on product its variants.

## New data in round 3 the theme should handle

- **Option values**: decors `Betonlook`, `Wit marmer`, `Zwart marmer`, `Grijs eiken`, `Teak` (added to the `swatch_colors` default in
  `theme/config/settings_schema.json`); `Houtlook` is no longer used by any Kleur option. Uitvoering values got longer: `Buiten (compact
  HPL), zandkleur onderstel`, `Hoogglans, geborsteld goud onderstel`, `Gegalvaniseerd frame, kap met kartelrand`, `Dak in framekleur,
  extra hoog (220 cm)`, `Set rondom, full colour bedrukt`, `Fitting om de 50 cm`. Pills must wrap.
- **Maat** `50 x 1 m` (loper op rol), `180 x 70 cm` / `140 x 70 cm` (statafels), `Ø100 cm` (wijnvat).
- **Print**: `zijwanden-stertent` is `bedrukbaar` now (`drukopties.optie: Uitvoering`, `zonder` = the plain walls).
- **Downloads**: 60 products carry `custom.downloads` (productblad and/or opbouwhandleiding PDFs); the Downloads block and the page
  Handleidingen pick them up as before.
- **Wall sets**: the `<table data-kk="set-vs-los">` in `zijwandenset-easy-up(-heavy-duty-pvc)` is rebuilt by build.py from the loose wall
  prices (same markup as the bundles): style it, do not compute it.
