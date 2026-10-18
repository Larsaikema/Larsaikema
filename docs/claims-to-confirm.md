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


## Catalogus: prijzen, specificaties en nieuwe producten (catalogusreview oktober 2026)

Deze punten staan als data in de catalogus (`catalog/tools/skeleton/*.py`, `catalog/parts/*.json`). Ze zijn met reden
gekozen, maar nog niet bij de leverancier of de eigenaar getoetst. Pas aan vóór livegang als het niet klopt.

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Brandvertragend | Niet meer in titels, SEO-teksten of kenmerk. Alleen in de specificatietabel als "Volgens de leverancier; certificaat volgt" (easy-up doek en wanden, heavy duty PVC, PVC-buizenframetenten, stertenten). PE-basistent: "Brandvertragend: Nee". | Certificaat (bv. DIN 4102 B1 / EN 13501-1 / M2) per doek opvragen; daarna de norm in de spec zetten en pas dan in kenmerk of titel. |
| Zijwandenset heavy duty PVC | 3 x 3 m € 299 (was € 359), 3 x 4,5 m € 339, 3 x 6 m € 379, 4 x 4 m € 349, 4 x 6 m € 409, 4 x 8 m € 469: ca. 28 % onder de losse wanden (2 dicht + raam + deur 3 m = € 403,85), zodat de set goedkoper is dan los kopen. | Inkoopprijs set vs. losse wanden; marge bij € 299. |
| Partytent PVC 550 Premium | 5 x 8 m € 849, 6 x 6 m € 819, 6 x 8 m € 899 (6 x 8 nu boven 5 x 8, 6 x 6 boven 4 x 8: prijs volgt de oppervlakte). | Inkoop per maat. |
| Full colour stertent | Toeslagladder enkele mast: Ø8 € 1.849 · Ø10 € 2.049 · Ø12 € 2.249 · Ø14 € 2.449 · Ø16 € 2.649; dubbele mast € 3.899 · € 4.549 · € 5.149 · € 5.649. | Drukprijs per maat bij de drukker. |
| Full colour opblaasbare tenten | Afgerond op de prijsladder (… 49 / … 99): promotietent 3 x 3 € 1.349 · 4 x 4 € 1.949 · 5 x 5 € 2.599 · 6 x 6 € 3.349; Pro 4 x 4 € 2.599 · 5 x 5 € 3.399 · 6 x 6 € 3.899. | Drukprijs. |
| Staffelkortingen | Eén rond schema per familie: tenten 3/5/10 st. = 3/5/8 %; grote tenten, karren en grote pakketten 2/5 st. = 3/5 %; textiel, wanden en kleine onderdelen 10/25/50 = 5/10/15 %; bedrukt 10/25/50/100 = 10/15/20/25 %; meubilair 10/25/50 = 5/8/12 %; klaptafels en prikkabels 5/10/25 = 5/8/12 %; per meter 25/50/100 = 5/10/15 %; gewichten 3/6 = 5/10 %; lampen 50/100 = 10/20 %. Elk zakelijk product heeft een staffel. Actiepakketten volgen hun familie en zijn op elk aantal goedkoper dan de losse delen. | Marges per familie; de automatische kortingen in Shopify gelijk zetten. |
| Statafel inklapbaar Professional | Uitvoering Binnen / Buiten (compact HPL, + € 25), met of zonder parasolgat (+ € 10); kleur Graniet (steenlook, + € 10), Berken alleen binnen (+ € 15). | Leverbaarheid compact HPL en graniet-decor bij de leverancier; toeslagen. |
| Statafel met kruisvoet / vierkant | Kruisvoet ook 107 cm hoog; blad compact HPL 12 mm. Vierkant ook met geborsteld RVS onderstel (+ € 30). | Leverbaarheid 107 cm en RVS; HPL-dikte. |
| Zijwand buizenframe 2 m | Nu ook 2 x 2,2 m (zijhoogte 220 cm, PVC 620 Professional): € 28,95 / € 28,95 / € 44,95; PE met raam € 14,95, PE dicht € 13,95. Eindwand/tussenwand ook voor zijhoogte 220 cm (4, 5 en 6 m, + € 10). | Maten en prijzen bij de leverancier. |
| Halve zijwand easy-up | Ook 5 m (€ 48,95) en 8 m (€ 69,95), in alle 7 tentkleuren. | Leverbaarheid per kleur. |
| Rond tafelkleed tot de grond | Ø 300 cm € 34,95 (statafels en klaptafel rond Ø 150) en Ø 330 cm € 39,95 (klaptafel rond Ø 180). | Maten bij de leverancier. |
| Compleet pakket easy-up Professional | 6 maten (ook 3 x 4,5, 4 x 6, 4 x 8 m met voetgewichten "Set van 6") en uitvoering Heavy duty PVC (wanden HD, alleen Wit/Zwart). | Samenstelling en prijzen per maat. |
| Nieuwe producten | LED-verlichting 12 W voor opblaasbare tent € 104,95 · vervangende infraroodbrander € 29,95 (1500 W) / € 39,95 (2100 W) · barkruk chroom met kunstleren zitting € 59,95 · dakondersteuning Premium € 9,95 / Professional € 14,95 · staander compleet Professional 3 m € 44,95 / 4 m € 49,95. | Leverancier, specificaties en prijs per product; LED-wattage en aansluiting. |
| Add-ons "1 per bestelling" | Transportkar bij statafels staat in `custom.addon_eenmalig`: hij wordt één keer toegevoegd, los van het aantal tafels. | Of dat de gewenste upsell is. |
