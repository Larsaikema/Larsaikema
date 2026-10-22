# Catalogus in Shopify zetten: CSV-import en seed-script

De catalogus komt in twee delen in je winkel. `catalog/export/products.csv` zet alle producten, varianten, prijzen, foto's en de
gewone metafields neer (teksten, specificaties, staffels, verzendkosten). Wat naar andere objecten in de winkel verwijst, kan pas
gezet worden als die objecten bestaan en Shopify ze een ID (GID) heeft gegeven. Dat doet het seed-script `scripts/seed/seed.mjs`,
via de Admin API. Zonder deze tweede stap mist de winkel:

- de add-ons per variant (zijwandenset in dezelfde maat en kleur, het juiste aantal voetgewichten, de rok die op het blad past):
  `addon_varianten` + `addon_aantallen` op ruim 3.700 varianten, plus `addons` en `addon_eenmalig` per product;
- de pakketinhoud en de regel "Je bespaart €…": `componenten` + `component_aantallen` op ruim 1.400 pakketvarianten;
- de maatwissel tussen de easy-ups die per maat een eigen product zijn (`andere_maten`, 11 producten);
- de bouwtekening per variant (`stuklijst`, 611 varianten), de onderdelenlijst (`onderdelen`), `past_op`, de maatgids-link
  (`maatgids`) en de pdf's (`downloads`: productbladen en handleidingen);
- collecties met intro en koopgids, menu's, pagina's, het blog met artikelen en de redirects.

## Wat je nodig hebt

- Node.js 22 of nieuwer (geen extra pakketten).
- Een eigen app in je winkel met een Admin API-toegangstoken: Instellingen › Apps en verkoopkanalen › Apps ontwikkelen › App maken.
  Geef de app deze Admin API-rechten: `write_products`, `write_files`, `write_content`, `write_online_store_pages`,
  `write_online_store_navigation`, `write_publications`. Installeer de app en kopieer het token (`shpat_…`).

Zet de winkel en het token in je terminal:

```
export SHOPIFY_STORE=jouwwinkel.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...
```

## Volgorde

1. **Definities eerst** (anders slaat Shopify de metafield-kolommen van de CSV over):
   `node scripts/seed/seed.mjs definitions`
2. **CSV importeren**: Producten › Importeren › `catalog/export/products.csv`. Laat "Bestaande producten overschrijven" aan bij
   een latere import. Voorraad staat op 0 met doorverkopen aan: jij vult de echte voorraad in (zie `docs/claims-to-confirm.md`).
3. **De rest**: `node scripts/seed/seed.mjs`. Het script controleert eerst of elk product en elke SKU van de CSV in de winkel
   staat (stap `check`) en stopt netjes als de import nog niet klaar is. Daarna: bestanden, pagina's, blog, collecties,
   verwijzingen, menu's en redirects.
4. **Met de hand** (geen API): zet in Search & Discovery de filters aan die `docs/theme-setup.md` noemt (Gebruik, Past op,
   Met jouw logo met de labels Ja / Nee), en koppel de optie Kleur aan de categorie-metafield Kleur (swatches).

Elke stap kun je los draaien (`node scripts/seed/seed.mjs references menus`) en opnieuw draaien na een wijziging in de catalogus:
bestaande pagina's, collecties, artikelen en menu's worden bijgewerkt, niets wordt dubbel aangemaakt, en metafields worden
overschreven met de nieuwe waarde.

## Eerst proberen zonder winkel

`node scripts/seed/seed.mjs --dry-run` draait alle stappen tegen een nagebootste winkel in het geheugen die precies bevat wat de
CSV aanmaakt. Het controleert elke verwijzing (bestaat het product, de SKU, de pagina, het bestand, heeft het de juiste soort),
de typen tegen de definities, de menu-diepte en de verplichte velden, en meldt wat het in een echte winkel zou zetten.
`python3 catalog/validate.py` draait deze controle ook mee.

## Goed om te weten

- De pdf's worden vanaf je computer geüpload (`catalog/images/*.pdf`). Met `--files-from-url` haalt Shopify ze van de openbare
  GitHub-link; dat werkt alleen als de branch gepusht is.
- Collectie- en artikelafbeeldingen komen van de openbare GitHub-link. Neemt Shopify die niet aan (nog niet gepusht), dan zet het
  script de collectie of het artikel zonder afbeelding neer en meldt het; draai de stap later opnieuw.
- `main-menu` bestaat al in een nieuwe winkel en wordt bijgewerkt; de vier footermenu's worden aangemaakt. Zet ze daarna in de
  thema-editor op de juiste plek in de footer.
- Links naar een beleid (algemene voorwaarden, privacy) worden echte beleidslinks zodra je die teksten in Instellingen › Beleid
  hebt ingevuld; daarvoor blijven het gewone links naar dezelfde URL.
