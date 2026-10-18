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
