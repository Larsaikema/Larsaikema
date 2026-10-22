# scripts/seed

`seed.mjs` zet via de Shopify Admin GraphQL API alles in de winkel wat `catalog/export/products.csv` niet kan dragen: metafield-
definities, pdf-bestanden, pagina's, blog en artikelen, collecties, de verwijzende metafields (add-ons per variant, pakketinhoud,
andere maten, bouwtekening, onderdelen, past op, maatgids, downloads), menu's en redirects. Node 22, geen afhankelijkheden.

```
node scripts/seed/seed.mjs --dry-run                 # offline controle, geen winkel nodig
node scripts/seed/seed.mjs definitions               # vóór de CSV-import
node scripts/seed/seed.mjs                           # na de CSV-import: alle stappen
```

Invoer: `catalog/export/*.json`, `products.csv`, `redirects.csv` en `catalog/images/*.pdf` (gemaakt door `python3 catalog/build.py`).
`mock-admin.mjs` is de nagebootste winkel van `--dry-run`. Handleiding en volgorde: `docs/import-en-seed.md`.
