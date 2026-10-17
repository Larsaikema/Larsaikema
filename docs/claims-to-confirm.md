# Claims om te bevestigen (thema)

Alles hieronder staat in de webshop als **instelling of standaardtekst** die jij kunt wijzigen. Het thema verzint
niets: zet een tekst uit of pas hem aan als hij (nog) niet klopt. Reviews, sterren en klantaantallen toont het
thema alleen als een review-app ze levert.

## Thema-instellingen (Online Store › Thema's › Aanpassen › Thema-instellingen)

| Groep | Instelling | Standaard | Waar zichtbaar |
|---|---|---|---|
| Levering | `cutoff_time` | 14:00 | USP-balk (teller), productpagina, productkaarten |
| Levering | `shipping_days` | ma–vr | idem (berekent de verzend- en leverdatum) |
| Levering | `holidays` | NL-feestdagen 2026–2027 | idem |
| Levering | `transit_days_pakket` / `transit_days_pallet` | 1 / 3 werkdagen | "Verwacht in huis: …", "di 20 okt in huis" op kaarten |
| Levering | `transit_days_be_extra` | +1 werkdag | leverdatum voor bezoekers met land België |
| Levering | `delivery_days` | ma–vr | dagen waarop de vervoerder bezorgt (zaterdag telt niet mee tenzij je `za` toevoegt) |
| Levering | `shipping_cost_pakket` / `shipping_cost_pallet` | € 6,95 / € 59,00 | regel "Verzendkosten …" op de productpagina en de indicatie "Verzending als pakket / Palletlevering" in winkelwagen en drawer (zwaarste klasse in de winkelwagen telt; pakket gratis boven `free_shipping_threshold`); moet gelijk zijn aan je tarieven in Shopify › Verzending |
| Levering | `delivery_text_pakket` / `_pallet` / `_backorder` | zie instellingen | productpagina |
| Levering | `free_shipping_threshold` | € 150 | voortgangsbalk in winkelwagen |
| Levering | `return_days` | 14 | tabblad Levering & retour |
| Levering | `warranty_text` | 2 jaar op het frame | (reserve; productgarantie komt uit `custom.garantie`) |
| Prijzen & btw | `vat_rate` | 21% | prijs excl. btw (alleen weergave; Shopify rekent de echte btw). Het thema volgt Shopify's instelling "Prijzen inclusief btw": staat die uit (bv. een B2B-catalogus), dan is de ingevoerde prijs de excl.-prijs en rekent het thema de incl.-prijs uit |
| Prijzen & btw | `staffel_mode` | Via een offerte | uitleg onder de staffeltabel; zet op "Automatisch" pas als de automatische kortingen bestaan |
| Zakelijk | `b2b_nudge_text` | "Vanaf 10 stuks … op factuur." | productpagina |
| Contact & bedrijf | telefoon, WhatsApp, e-mail, KvK, btw-nummer, adres, openingstijden, reactietijd | leeg / "We reageren binnen één werkdag." | header, footer, contact |

## Standaardteksten in secties (aanpasbaar in de editor)

- USP-balk: "Snel in huis in NL & BE", "Zakelijk bestellen op factuur", "Eigen logo? Eerst een drukproef".
- Home en collecties: USP-strook ("Vóór [besteltijd] besteld, vandaag verzonden": `[besteltijd]` wordt `cutoff_time`), "Zakelijk op factuur", Zakelijk-banner
  ("Staffelkorting vanaf 10 stuks", "Op factuur als je dat wilt"), FAQ-antwoorden.
- Winkelwagenpagina: "Veilig betalen met iDEAL of Bancontact", "Zakelijk bestellen op factuur".
- Zakelijk-pagina: staffelvoorbeeld (10/25/50 stuks: 5/10/15%), "Op factuur", "Levering op locatie".
- Offertepagina: "Prijzen excl. btw", "Staffelkorting vanaf 10 stuks", "Op factuur voor bedrijven en verenigingen".
- Bedrukken: "Levertijd 10–15 werkdagen na akkoord drukproef", PNG ≥ 2000 px wordt drukklaar gemaakt.
- Formulieren: "We reageren / sturen binnen één werkdag een offerte" (locale `forms.contact_success`, `quote.success`).
- Productpagina, bedrukken: stappen "Je krijgt een digitale drukproef per mail", "Pas na jouw akkoord gaan we drukken".
- Maatwerk (configurator): "geen bedenktijd, niet retourneren" (wettelijke uitzondering voor maatwerk; zet het ook in je
  voorwaarden), maattolerantie en minimale afname uit `custom.configurator`, levertijd uit `custom.levertijd`.
- Garantie en klachten (page.garantie): wettelijke garantie, "extra garantie op het frame" (verwijst naar `custom.garantie`
  per product), wat er niet onder valt, reactietijd uit `response_time`.
- Actiepakketten: "Je bespaart € x" rekent het thema uit de losse prijzen van de onderdelen; controleer dat de
  onderdelen (`custom.componenten`) en aantallen kloppen.
- Logo-upload: maximaal 20 MB (product-form.js; Shopify's eigen limiet voor bestanden in winkelwagen-eigenschappen
  controleren).

## Catalogus

Staffelkortingen (`custom.staffelkorting`) zijn alleen een **weergave**. De korting zelf stel je in als automatische
korting (of B2B-prijsafspraak); anders klopt de winkelwagen niet met de tabel.

## Uit het merkboek (brand.md §13)

| Claim | Waar | Wat te doen |
|---|---|---|
| Naam Klapklaar, klapklaar.nl/.be, @klapklaar | overal (logo, titel, footer) | Naamtoets (brand.md §11.1) vóór registratie of druk |
| Klaproos-doek leverbaar | Klaproos-varianten, Shopping-beeld | Bij de doekleverancier navragen; anders de kleur 'Rood' noemen |
| "14 dagen bedenktijd (niet bij bedrukt maatwerk)" | productpagina (tabblad Levering & retour, `return_days`) | Juridisch laten controleren |
| Bel of app ons + openingstijden | header, productpagina, footer | Echt nummer en tijden invullen (Contact & bedrijf), anders leeg laten: dan verdwijnen ze |
| Thuiswinkel Waarborg of ander keurmerk | footer | Alleen met lidmaatschap; het thema toont er geen uit zichzelf |
| Reviewscore | kaart, productpagina | Alleen via een review-app (`reviews.rating`); app-blokken kunnen in de Apps-sectie, op de productpagina, de collectiepagina en de winkelwagen |
| Betaalmethoden | footer, winkelwagen | Het thema toont alleen wat in Shopify aan staat; "op factuur" alleen met een factuur-app of B2B |
| Offerte binnen één werkdag | Zakelijk, offerte | Alleen als het zo werkt (`forms`/`quote` teksten, `response_time`) |

