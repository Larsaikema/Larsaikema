# Klapklaar — Shopify-webshop voor partytenten en statafels

Een complete webshop voor een nieuw, eigen merk: **Klapklaar** ("In één klap feestklaar"). Assortiment en functies op het
niveau van Outmate.nl en Statafelshop.nl, met een eigen merk, eigen teksten, eigen 3D-productbeelden en een eigen
Shopify-thema.

## Wat er in deze repo zit

| Map | Inhoud |
|---|---|
| `dist/klapklaar-theme.zip` | Het Shopify-thema (Online Store 2.0), klaar om te uploaden. Shopify `theme check`: 0 fouten. |
| `theme/` | De bron van het thema. |
| `catalog/export/products.csv` | Alle producten, varianten, prijzen, beelden en metafields voor Producten › Importeren. |
| `catalog/export/*.json` | Collecties, menu's, pagina's, blog, metafield-definities en verwijzingen voor het seed-script. |
| `catalog/catalog.json` | De bron van de catalogus (`python3 catalog/build.py` maakt de export, `catalog/validate.py` controleert). |
| `catalog/images/` | Productbeelden: echte foto's (`*-foto.webp`, gekoppeld in `catalog/photos.json`), 3D-renders voor de rest, en pdf's (productbladen en handleidingen). |
| `scripts/seed/` | Zet via de Admin API alles neer wat de CSV niet kan (add-ons per variant, pakketinhoud, pagina's, menu's …). |
| `brand/` | Merkboek (`brand.md`), logo's, favicons, kleuren en typografie (`tokens.json`). |
| `docs/` | Handleidingen: zie hieronder. |
| `renders/` | De 3D-renderpijplijn (three.js in headless Chromium) waarmee de productbeelden gemaakt zijn. |
| `tools/` | Lokale Shopify-preview (Ruby + Shopify's Liquid), screenshot-, A/B- en controlescripts. |
| `reference/` | Onderzoek naar de referentiewinkels (in eigen woorden) en de feature- en assortimentslijsten. |
| `gauntlet/` | De werkwijze (`BRIEF.md`) en de backlog met resterende verbeterpunten. |

## In Shopify zetten

1. Winkel aanmaken en instellen: [`docs/winkel-instellingen.md`](docs/winkel-instellingen.md) (markten, btw, verzending, betalen).
2. Thema-eisen en uploads: [`docs/theme-setup.md`](docs/theme-setup.md).
3. Catalogus importeren: [`docs/import-en-seed.md`](docs/import-en-seed.md) —
   `node scripts/seed/seed.mjs definitions` → CSV importeren → `node scripts/seed/seed.mjs`.
   Proefdraaien zonder winkel: `node scripts/seed/seed.mjs --dry-run`.
4. Vóór livegang: [`docs/claims-to-confirm.md`](docs/claims-to-confirm.md) doorlopen (levertijden, garantie, voorraad,
   contactgegevens). Er staan geen verzonnen reviews, klantaantallen of keurmerken in de winkel.

Controleer de naam **Klapklaar** bij KvK, BOIP en SIDN voordat je een domein koopt of iets laat bedrukken.

## Lokaal bekijken

```
tools/dev.sh start                       # :4100 Klapklaar-thema, :4200 Horizon (vergelijking), :4300 Dawn
node tools/check.mjs --base http://127.0.0.1:4100   # alle routes: Liquid-, console- en netwerkfouten + interacties
tools/theme-check.sh theme               # Shopify theme-check (offline)
```

Vereist: Ruby 3.3, Node 22, Python 3 met Pillow, Chromium (Playwright). Zie `tools/preview/README.md`.

## Hoe de kwaliteit bewaakt is

Elk onderdeel van de winkel ging door een "gauntlet": een bouwer en aparte, harde critics, met blinde vergelijkingen
(ons ontwerp naast de lat, zonder te weten welke welke is) tot ons ontwerp won:

- **Thema (10 onderdelen):** header, homepage, collectie, zoeken, zakelijk/offerte, drie productpagina's, winkelwagen en
  contentpagina's. Elk onderdeel won blind van Shopify's eigen Horizon-thema (ingericht met exact dezelfde winkel) én van
  de echte pagina's van Outmate.nl en Statafelshop.nl, zonder blokkerende functionele fouten.
- **Catalogus (243 producten):** getoetst tegen de echte productdata van beide referentiewinkels, tot er geen
  blokkerende of ernstige gaten meer waren.
- **Merk:** gekozen door een blinde jury uit drie concepten en daarna aangescherpt voor druk op stof.

Resterende kleinere punten staan in `gauntlet/backlog/`.
