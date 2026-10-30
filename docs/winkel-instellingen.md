# Winkelinstellingen in Shopify (vóór livegang)

Wat je in de Shopify-admin zelf instelt: dit gaat niet via het thema, de CSV of het seed-script. Doe dit in een
winkel met een wachtwoord (Online Store › Voorkeuren › Wachtwoordbeveiliging) en haal het wachtwoord pas weg na een
testbestelling. Bedragen en beloftes komen uit [`claims-to-confirm.md`](claims-to-confirm.md): wat je daar wijzigt,
wijzig je hier ook.

## 1. Winkelgegevens

Instellingen › Winkelgegevens: naam **Klapklaar**, contact-e-mail, bedrijfsnaam, adres, KvK- en btw-nummer
(staan ook in Thema-instellingen › Contact & bedrijf, voor de footer). Standaardvaluta **EUR**, eenheden **metrisch, kg**.

## 2. Markten en talen

Instellingen › Markten:

| Markt | Land | Valuta | Opmerking |
|---|---|---|---|
| Primair | Nederland | EUR | |
| België | België | EUR | eigen verzendzone (zie 4); prijzen gelijk, of een vaste aanpassing als je dat wilt |

Talen: **Nederlands** als standaardtaal. Engels kan later (het thema heeft `locales/en.json`); laat het uit tot de
productteksten vertaald zijn. De land- en taalkiezer in de footer verschijnt vanzelf zodra er meer dan één markt of taal is.

## 3. Belastingen (btw)

Instellingen › Belastingen en heffingen:

- **Alle prijzen zijn inclusief btw** aanzetten (de CSV-prijzen zijn incl. 21 %).
- Nederland en België: 21 % (Shopify vult dit in). Zet bij België "Btw opnemen in prijzen" aan, zodat een Belgische
  klant dezelfde eindprijs ziet.
- Zakelijke klanten in België met een geldig btw-nummer (btw verlegd): zonder Shopify Plus (B2B) gaat dit via
  belastingvrijstelling op het klantprofiel. Spreek met je boekhouder af hoe je dit wilt doen voordat je het aanbiedt.
- De schakelaar Particulier / Zakelijk in het thema toont alleen prijzen excl. btw; hij verandert niets aan de checkout.

## 4. Verzending

**Via het script:** `node scripts/seed/seed.mjs shipping` zet alles hieronder in één keer goed (profielen, zones Nederland en
België, gewichtstarieven en welke producten in welk profiel zitten), uit dezelfde regels als de productpagina's. Daarna hoef je
hier alleen nog een toeslag voor België te zetten als je die wilt. Met de hand gaat het zo:

Instellingen › Verzending en bezorging. Het thema toont per product de verzendkosten uit de catalogus; **de checkout
moet dezelfde bedragen rekenen**. Zet gewichtsafhankelijke tarieven (de CSV geeft elke variant zijn gewicht):

| Tarief | Gewicht van de bestelling | Bedrag incl. btw |
|---|---|---|
| Pakket | 0 – 31,5 kg (kleine producten) | € 6,95 |
| Groot pakket | tot 25 kg / tot 40 kg (statafels, tafels) | € 19,95 / € 39,90 |
| Pallet | tot 150 / 400 / 700 / 1.000 kg | € 49 / € 79 / € 129 / € 175 |
| Meer pallets | tot 2.000 / 3.000 kg | € 350 / € 525 |

De volledige regels (pakketten, betonblokken per stuk, wat als pakket mag) staan in `claims-to-confirm.md` onder
"Verzendkosten per product". Kies tussen:

- **Eén algemeen profiel met gewichtsklassen** (eenvoudigst; Shopify telt dan het totaalgewicht), of
- **meerdere profielen** (pakket, pallet) — Shopify telt profielen dan op. Het thema rekent in de winkelwagen met de
  hoogste regel; controleer of je checkout hetzelfde doet, anders kies je de eerste optie.

België: dezelfde klassen in de zone België, eventueel met een toeslag (thema-instelling `transit_days_be_extra` voor de
levertijd). Gratis verzending vanaf een bedrag? Stel het tarief in Shopify in én vul de thema-instelling
"Gratis verzending vanaf" in; anders laat je die op 0.

Afhalen (alleen als je een afhaallocatie hebt): Verzending › Lokaal afhalen, en zet de pagina `showroom-en-afhalen` online.

## 5. Betalen

Instellingen › Betalingen:

- **Shopify Payments** (iDEAL, Bancontact, creditcard, Apple Pay, Google Pay) of **Mollie** via de Mollie-app als je
  dat al gebruikt (handig voor je bestaande administratie en afletteren).
- **Achteraf betalen**: Klarna via Shopify Payments of Mollie.
- **Betalen op factuur voor organisaties**: handmatige betaalmethode "Op factuur" met een duidelijke voorwaarde (bijv.
  alleen voor geverifieerde zakelijke klanten), of via een app. Het thema noemt "Zakelijk op factuur" in de USP-balk:
  zet die tekst uit als je dit niet aanbiedt.
- Zet de betaallogo's in de footer aan/uit via Thema-instellingen (het thema toont de methodes die Shopify meldt).

## 6. Klantaccounts, checkout en privacy

- Instellingen › Klantaccounts: **Klantaccounts (nieuwe versie)** — het thema heeft geen oude accountpagina's.
- Instellingen › Checkout: gastcheckout aan; telefoonnummer optioneel; "Opmerking bij bestelling" aan (het thema
  gebruikt de notitie van de winkelwagen); bedrijfsnaam als optioneel veld (handig voor zakelijke klanten).
- Instellingen › Privacy van klanten: cookiebanner aan (het thema laadt zelf geen tracking).
- Instellingen › Beleid: algemene voorwaarden, privacy, retourbeleid (minimaal 14 dagen bedenktijd; maatwerk en
  bedrukte producten uitgezonderd), verzendbeleid. De footer linkt ernaar via menu `footer-juridisch`.

## 7. Apps (optioneel)

| Wens | Aanpak |
|---|---|
| Reviews met sterren | Een review-app die `reviews.rating` / `reviews.rating_count` vult (bijv. Judge.me, Kiyoh-koppeling). Het thema toont sterren pas als die er zijn — er staan geen verzonnen reviews in de winkel. |
| Staffelkorting die echt in de checkout zit | Kortingen › Automatische korting per aantal (of Shopify B2B op Plus). Zet daarna de thema-instelling `staffel_mode` van "offerte" naar "korting". |
| Korting op add-ons bij een tent | Kortingen › Koop X krijg Y (zie `claims-to-confirm.md`, "Korting op add-ons"). Zet daarna de blokinstelling `show_addon_korting` aan. |
| Filters | Search & Discovery (gratis, van Shopify) — zie `theme-setup.md` §1. |

## 8. Laatste controle

1. Testbestelling met iDEAL (of Bogus Gateway in testmodus): een easy-up met zijwanden, een statafel met rok, een
   bedrukt product met logo-upload. Check de verzendkosten, de btw-regel en de bevestigingsmail.
2. Mobiel: menu, zoeken op "3x3", filter op kleur, winkelwagen.
3. `docs/claims-to-confirm.md` helemaal doorgelopen (levertijden, garantie, telefoon, KvK, voorraad).
4. Domein gekoppeld (Instellingen › Domeinen), wachtwoord eraf.
