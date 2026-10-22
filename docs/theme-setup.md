# Thema Klapklaar: wat de winkel nodig heeft

Dit document hoort bij `theme/` (Online Store 2.0). Het zegt wat er in Shopify aan moet staan voordat het thema
werkt zoals bedoeld, welke bestanden je zelf uploadt en welke onderdelen nog in andere documenten komen. Claims
(levertijd, factuur, garantie) staan in [`claims-to-confirm.md`](claims-to-confirm.md).

## 1. Harde eisen

| Eis | Waarom | Waar in Shopify |
|---|---|---|
| **Nieuwe klantaccounts** | Het thema heeft geen `templates/customers/*.liquid`. Inloggen, bestellingen, adressen en retouren lopen via de accountpagina's die Shopify zelf host; de header linkt naar `routes.account_url`. Met de oude (klassieke) klantaccounts krijgt een klant na 'Inloggen' een kale standaardpagina. | Instellingen › Klantaccounts › Klantaccounts: **aan**, versie **Klantaccounts** (niet 'Klassiek'). |
| **Metafield-definities** uit `catalog/CONTRACT.md` | Het thema leest `product.metafields.custom.*` (o.a. `kenmerk_kort`, `specificaties`, `staffelkorting`, `addons`, `andere_maten`, `bedrukbaar`, `drukopties`, `downloads`, `faq`, `configurator`, `componenten`). Zonder definitie van het juiste type geeft `.value` niets terug. | Instellingen › Aangepaste gegevens › Producten (`node scripts/seed/seed.mjs definitions`, vóór de CSV-import; zie `docs/import-en-seed.md`). |
| **Search & Discovery** | Filters op collectie- en zoekpagina komen uit `collection.filters`. Het thema herkent ze aan hun naam: Kleur als kleurstalen, Maat als knoppen op maatvolgorde, Gebruik toont `gebruik:horeca` als 'Horeca' (interne tags blijven weg, sectie-instelling 'Tags niet als filter tonen'), Met jouw logo als schakelaar, Past op alleen op de collecties uit de sectie-instelling 'Filters alleen op deze collecties'. | App Search & Discovery › Filters, in deze volgorde en met precies deze namen: **Beschikbaarheid** (heet in de winkel 'Alleen leverbaar'), **Prijs**, **Maat** (optie Maat), **Kleur** (optie Kleur), **Uitvoering** (optie Uitvoering), **Soort** (producttype), **Gebruik** (metaveld `custom.gebruik`, leesbare labels als 'Horeca'; nooit de producttags), **Past op** (metaveld `custom.systeem`) en **Met jouw logo** (metaveld `custom.bedrukbaar`, waarden Ja / Nee). Zet bij de drie metavelden in Instellingen › Aangepaste gegevens › Producten 'Filteren in Search & Discovery' aan, anders kun je ze niet als filter kiezen. |
| **Menu's** `main-menu` (3 niveaus), `footer-assortiment`, `footer-klantenservice`, `footer-klapklaar`, `footer-juridisch` | Header, megamenu, collectie-chips en footer lezen deze handles. | Online Store › Navigatie. |
| **Pagina's met sjabloon** (zie CONTRACT) | `zakelijk`, `offerte`, `bedrukken`, `contact`, `veelgestelde-vragen`, `garantie`, `handleidingen`, `verschil-partytenten` krijgen hun eigen sjabloon (`page.zakelijk` …). | Online Store › Pagina's › sjabloon kiezen. |

Een link in een sectie naar een pagina, product, collectie of artikel dat (nog) niet bestaat, toont het thema niet
(`snippets/link-exists.liquid`): een ontbrekende pagina geeft dus geen 404, maar wel een verdwenen knop. Controleer
na de import of de knoppen op home, Bedrukken en Zakelijk er staan.

## 2. Afbeeldingen die je zelf uploadt

De standaardinstellingen van home, header (megamenu), Bedrukken en Zakelijk wijzen naar bestanden in
**Content › Bestanden**. Upload ze met precies deze naam (de bron staat in `brand/img/` of in de thema-assets
`theme/assets/fallback-*.webp`):

| Bestandsnaam in Shopify | Gebruikt in | Bron |
|---|---|---|
| `scene-hero.webp` | home: hero | `theme/assets/fallback-scene-hero.webp` |
| `scene-zakelijk.webp` | Zakelijk: beeldblok | `theme/assets/fallback-scene-zakelijk.webp` |
| `tent-3x3-rood-logo-hero.webp` | home: bedrukken-blok, megamenu Partytenten, Bedrukken | `theme/assets/fallback-tent-logo.webp` |
| `tent-3x3-rood-logo-front.webp` | Bedrukken: optie 'Dak of zijwand' | `theme/assets/fallback-tent-front.webp` |
| `statafelrok-stretch-zwart-print-hero.webp` | megamenu Statafels, Bedrukken | `theme/assets/fallback-rok-logo.webp` |

Ontbreekt een bestand, dan toont het thema de meegeleverde render (`fallback-*.webp`, instelling 'Standaardbeeld' per
blok); de beeldkiezer in de editor is dan leeg. Het seed-script (`node scripts/seed/seed.mjs files`) uploadt deze vijf bestanden onder deze namen.

## 3. Kleuren en merkversies

Alle kleuren staan in Thema-instellingen › Kleuren: het palet (11 merkkleuren), de **rollen** (
winkelwagenteller, badges Nieuw en Met jouw logo, gekozen optie, het label van menu-item Actie, de luifelstreep, logo op Zakelijk-pagina's) en zes
kleurschema's (1 Pagina, 2 Kaart, 3 Linnen, 4 Zakelijk, 5 Lampion, 6 Inkt), elk met koopknop, hoofdknop en omlijnde knop. De standaardwaarden zijn merkboek v7
(`brand/tokens.json`: `shopify_color_schemes`, `shopify_color_settings`). Een nieuwe merkversie is een wijziging in
`theme/config/settings_data.json` (of in de editor), geen codewijziging.

`settings_data.json` heeft naast `current` een preset **Klapklaar** met dezelfde waarden (nodig als je het thema ooit
als Theme Store-thema indient).

## 4. Productlijnen per maat

Een lijn die per maat een eigen product is (`easy-up-partytent-premium-3x3`, `-3x4-5`, `-3x6`) krijgt op elk product
`custom.andere_maten` (lijst met de andere maten). De productpagina toont de maten dan als keuzeknoppen bij 'Maat' en
houdt de gekozen kleur vast; de kaart in de collectie toont '3 maten: …' en 'Kies je kleur'.

## 5. Nog te schrijven (eigenaar: stap 6, docs)

Deze onderdelen uit `reference/features.json` regelt Shopify zelf of een app; het thema doet er niets voor en ze
krijgen elk een eigen handleiding in `docs/`:

| Feature | Handleiding |
|---|---|
| `global.cookie-consent` | Shopify Customer Privacy-banner (Instellingen › Privacy van klanten); het thema laadt geen tracking. |
| `global.markets-nl-be` | Markets NL + BE in EUR, BE-verzendzone; de taal/land-kiezer in de footer staat al klaar. |
| `cart.highest-shipping-only` | Keuze: één algemeen verzendprofiel met gewichtsklassen, of een carrier-app; Shopify telt profielen op. |
| `checkout.guest`, `checkout.payment-methods`, `checkout.invoice-organisations`, `checkout.be-rates`, `checkout.track-trace`, `checkout.reverse-charge-be` | Checkout-instellingen, Shopify Payments of Mollie, betalen op factuur, btw verlegd voor BE-bedrijven. |
| `service.terms` | Algemene voorwaarden als Shopify-beleid; de footer linkt via menu `footer-juridisch`. |
