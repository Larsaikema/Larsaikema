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
| Levering | `shipping_cost_pakket` / `shipping_cost_pallet` | € 6,95 / € 59,00 | regel "Verzendkosten …" op de productpagina en de regel "Verzending binnen NL" / "Palletlevering binnen NL" in winkelwagen en drawer, opgeteld in het "Totaal" (buiten NL: "Zie je bij afrekenen" en "Totaal zonder verzending"). De hoogste verzendkosten in de winkelwagen tellen: per product `custom.verzendkosten` (zoals op de productpagina) of anders het tarief van zijn klasse; pakket gratis boven `free_shipping_threshold`. Moet gelijk zijn aan je tarieven in Shopify › Verzending (één tarief per zending, zie reference cart.highest-shipping-only); de winkelwagen telt het zonder voorbehoud op in het totaal, dus een afwijkend tarief geeft een ander bedrag bij het afrekenen |
| Levering | `delivery_text_pakket` / `_pallet` / `_backorder` | zie instellingen | productpagina, en in winkelwagen en drawer naast Afrekenen (met de verwachte leverdatum) |
| Levering | `free_shipping_threshold` | 0 (geen drempel) | alleen als je een gratis tarief instelt: voortgangsbalk en ‘Je verzending is gratis’ in winkelwagen en drawer, ‘gratis vanaf’ op de productpagina; beide referentiewinkels hebben geen drempel |
| Levering | `return_days` | 14 | tabblad Levering & retour |
| Levering | `warranty_text` | 2 jaar op het frame | (reserve; productgarantie komt uit `custom.garantie`) |
| Prijzen & btw | `vat_rate` | 21% | prijs excl. btw (alleen weergave; Shopify rekent de echte btw). Het thema volgt Shopify's instelling "Prijzen inclusief btw": staat die uit (bv. een B2B-catalogus), dan is de ingevoerde prijs de excl.-prijs en rekent het thema de incl.-prijs uit |
| Prijzen & btw | `staffel_mode` | Via een offerte | uitleg onder de staffeltabel; zet op "Automatisch" pas als de automatische kortingen bestaan |
| Zakelijk | `b2b_nudge_text` | "Vanaf 10 stuks … op factuur." | productpagina |
| Contact & bedrijf | telefoon, WhatsApp, e-mail, KvK, btw-nummer, adres, openingstijden, reactietijd | leeg / "We reageren binnen één werkdag." | header, footer, contact |

## Standaardteksten in secties (aanpasbaar in de editor)

- USP-balk (sectie USP-balk in de header): de besteltijd-teller ("Uit voorraad: bestel binnen 3 u 13 min, vandaag
  verzonden", na de besteltijd "Uit voorraad: na 14:00 besteld, morgen verzonden", in het weekend "Uit voorraad: zondag besteld,
  maandag verzonden", op een feestdag "Uit voorraad: nu besteld, dinsdag verzonden", op een smal scherm korter maar altijd met "Uit voorraad"; volgt `cutoff_time`,
  `shipping_days` en `holidays`), "Zakelijk? Offerte [reactietijd]" (`[reactietijd]` wordt het deel "binnen …" van
  `response_time`, dus "binnen één werkdag"; zonder "binnen" in die tekst staat er "op maat") en "[bedenktijd] dagen
  bedenktijd (niet bij maatwerk)" (`[bedenktijd]` wordt `return_days`). Uitgeschakeld blok: "Snel in huis in NL & BE".
  "Zakelijk bestellen op factuur" staat **niet** meer standaard in de balk: zet dat pas terug als je factuurbetaling hebt
  (factuur-app of Shopify B2B), of als je het alleen via een offerte aanbiedt en dat er zo bij zet.
- Megamenu-promoties (header, blokken "Megamenu-promotie"): Statafels "Logo op één of twee kanten, of full colour rondom.
  Vanaf 1 stuk, staffelprijs vanaf 10." (de staffel van bedrukt textiel begint bij 10 stuks, zie Catalogus › Staffelkortingen); Met jouw logo
  "Drukproef vooraf" en "Eerst je akkoord, dan drukken we." (de drukproef-werkwijze van Bedrukken); Zakelijk "Offerte op maat"
  en "Voor je bedrijf, club of verhuur: grote aantallen, bedrukking en prijzen excl. btw in één voorstel."
- Hoofdmenu (navigatie › main-menu, uit de catalogus): de link "Offerte vanaf 10 stuks" onder Met jouw logo › Zo werkt
  bedrukken. Pas de tekst aan als je ook kleinere aantallen bedrukt.
- Home en collecties: USP-strook (home: "Vóór [besteltijd] besteld, vandaag verzonden": `[besteltijd]` wordt `cutoff_time`;
  collecties: "Bezorgd in NL en BE", omdat daar ook producten staan die nabesteld worden), "Zakelijk op factuur", Zakelijk-banner
  ("Staffelkorting vanaf 10 stuks", "Op factuur als je dat wilt"), FAQ-antwoorden.
- Winkelwagenpagina: "Veilig betalen met iDEAL of Bancontact" en "[bedenktijd] dagen bedenktijd (niet bij bedrukt maatwerk)"
  (`[bedenktijd]` wordt `return_days`) (Zekerheid 1–3 in de sectie Winkelwagen; leeg = weg). "Zakelijk bestellen op factuur"
  staat er niet meer standaard: zet het in Zekerheid 3 zodra je factuurbetaling hebt (factuur-app of Shopify B2B).
- Zakelijk-pagina: staffelvoorbeeld (10/25/50 stuks: 5/10/15%), "Op factuur", "Levering op locatie".
- Offertepagina: "Prijzen excl. btw", "Staffelkorting vanaf 10 stuks", "Op factuur voor bedrijven en verenigingen".
- Bedrukken: "Levertijd 10–15 werkdagen na akkoord drukproef", PNG ≥ 2000 px wordt drukklaar gemaakt.
- Formulieren: "We reageren / sturen binnen één werkdag een offerte" (locale `forms.contact_success`, `quote.success`).
- Productpagina, bedrukken: stappen "Je krijgt een digitale drukproef per mail", "Pas na jouw akkoord gaan we drukken".
- Productpagina, uitverkocht: "Mail me als dit weer op voorraad is" en na verzenden "Top, we mailen je zodra dit weer op
  voorraad is." (locale `product.notify_success`). Zonder app is dit het gewone contactformulier: elke aanvraag komt als mail
  binnen (onderwerp "Mail me als dit weer op voorraad is", met product, variant en artikelnummer) en **jij mailt de klant zelf**
  zodra er weer voorraad is. Wil je dat niet met de hand doen: installeer een back-in-stock-app, zet in de productpagina (blok
  Koopknop) "'Mail me als dit weer op voorraad is' bij uitverkocht" uit en voeg het app-blok toe.
- Productpagina, staffel (`staffel_mode` = offerte): "Staffelprijs met offerte" en "In je winkelwagen betaal je de stukprijs.
  De staffelprijs krijg je met een offerte, ook als particulier of vereniging." Maak je de staffels als automatische korting
  aan, zet `staffel_mode` dan op Automatisch: de productpagina zegt dan dat de korting in de winkelwagen staat.
- Productpagina, add-ons (blok Handig erbij): "Korting bij de tent" is standaard leeg. Vul het pas in als de korting als
  automatische korting in Shopify staat (bv. 10% op zijwanden bij aankoop van een tent), anders belooft de pagina iets wat
  de winkelwagen niet doet.
- Productpagina, pallet: "Verwacht in huis: wo 21 – vr 23 okt" (een bereik van `transit_days_pallet` min en plus één werkdag,
  passend bij de standaardtekst "meestal binnen 2–4 werkdagen"; levering op afspraak).
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
| Bel of app ons + openingstijden | header, productpagina, footer, winkelwagen | Echt nummer en tijden invullen (Contact & bedrijf), anders leeg laten: dan verdwijnen ze (de winkelwagen toont dan "Vragen? Mail …" met het e-mailadres) |
| Thuiswinkel Waarborg of ander keurmerk | footer | Alleen met lidmaatschap; het thema toont er geen uit zichzelf |
| Reviewscore | kaart, productpagina | Alleen via een review-app (`reviews.rating`); app-blokken kunnen in de Apps-sectie, op de productpagina, de collectiepagina en de winkelwagen |
| Betaalmethoden | footer, winkelwagen | Het thema toont alleen wat in Shopify aan staat; "op factuur" alleen met een factuur-app of B2B |
| Offerte binnen één werkdag | Zakelijk, offerte | Alleen als het zo werkt (`forms`/`quote` teksten, `response_time`) |


## Catalogus: prijzen, specificaties en nieuwe producten (catalogusreview oktober 2026)

Deze punten staan als data in de catalogus (`catalog/tools/skeleton/*.py`, `catalog/parts/*.json`). Ze zijn met reden
gekozen, maar nog niet bij de leverancier of de eigenaar getoetst. Pas aan vóór livegang als het niet klopt.

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Brandvertragend | Nergens meer in de winkel: niet in titels, SEO, kenmerk of USP's, en sinds de merchandising review ook niet meer in de specificatietabellen (de waarde 'certificaat volgt' las als een interne notitie). De FAQ zegt: we zetten het pas op de pagina als de leverancier norm en brandklasse met een certificaat bevestigt. PE-basistent: "Brandvertragend: Nee". | Certificaat (bv. EN 13501-1, DIN 4102 B1 of M2) per doek opvragen; daarna norm en klasse in de specificaties zetten (`catalog/parts`), pas daarna eventueel in kenmerk of titel. |
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

## Catalogus: merchandising review (18 oktober 2026)

Wat de review aan de catalogus veranderde en wat je vóór livegang nog moet bevestigen. Alles staat als data in
`catalog/tools/skeleton/*.py` (structuur, prijzen) en `catalog/parts/*.json` (teksten); `python3 catalog/build.py` maakt de exports.

### Voorraad: de aantallen in de CSV zijn geen echte voorraad

| Wat er nu staat | Wat je doet |
|---|---|
| Voorraadaantallen in de CSV zijn voorbeeld: er is nog geen echte telling. Elke verzonden variant staat op 'bijhouden' (`Variant Inventory Tracker` = shopify) met **0** op voorraad en voorraadbeleid **doorverkopen** (`continue`). De winkel toont daardoor nergens 'Op voorraad' of 'Nog x op voorraad', maar de levertekst ('Leverbaar over 2–3 weken', thema-instelling `delivery_text_backorder`) of de `custom.levertijd` van het product. Een zakelijke koper kan altijd het aantal van de staffel in de winkelwagen zetten. | Vóór livegang de echte aantallen invoeren (Producten › Voorraad, of de kolom `Variant Inventory Qty` in de CSV) en per product kiezen: doorverkopen als je kunt nabestellen (`continue`), of stoppen bij 0 (`deny`). Zet `low_stock_threshold` (thema, 'Nog x op voorraad' vanaf) pas boven 0 als de aantallen echt uit je voorraad komen (brand.md §7.1: geen verzonnen schaarste). De cadeaubon is niet bijgehouden. |

### Automatische kortingen bij add-ons (voorstel, nog niet ingesteld)

De pakketten (starterspakket, compleet pakket, prikkabelset, statafelpakketten) zijn al voordeliger dan los. Wie een tent
koopt en de zijwanden als add-on aanvinkt, betaalt nu de volle prijs. Outmate geeft 10% op zijwanden bij een easy-up en 10% op
lampen bij een prikkabel. Voorstel, als automatische korting in Shopify (Kortingen › Korting maken › Koop X, krijg Y):

| Korting | Klant koopt (X) | Klant krijgt (Y) | Waarde | Per bestelling |
|---|---|---|---|---|
| 10% op de zijwandenset bij een tent | 1 product uit `easy-up-partytenten` (Premium, Professional, met logo) | 1 × `zijwandenset-easy-up` of `zijwandenset-easy-up-heavy-duty-pvc` | 10% | onbeperkt (1 set per tent) |
| 10% op losse zijwanden bij een tent | 1 product uit `easy-up-partytenten` | tot 4 × `zijwand-easy-up-dicht`, `-met-raam`, `-met-deur`, `halve-zijwand-easy-up`, `zijwand-easy-up-heavy-duty-pvc` | 10% | onbeperkt (4 wanden per tent) |
| 10% op LED-lampen bij een prikkabel | 1 × `prikkabel-e27` of `prikkabel-op-maat` | tot 50 × `led-lamp-e27` | 10% | onbeperkt |

- Shopify past de korting toe in de winkelwagen; de productpagina noemt hem pas als je in het blok **Handig erbij** het veld
  **Korting bij de tent** invult (bv. "10% korting op zijwanden bij je tent en op LED-lampen bij je prikkabel, automatisch in je
  winkelwagen"). Dat veld staat in de productsjabloon en verschijnt dus bij elk product met add-ons: formuleer het algemeen, of
  maak een aparte productsjabloon voor de tenten. Vul het **niet** in zolang de korting niet bestaat.
- 'Tot 50 lampen' is een benadering: Koop X krijg Y koppelt geen aantal aan de kabellengte (een prikkabel van 20 m heeft 20
  fittingen). Exact per meter kan alleen met een kortingsfunctie (Shopify Functions-app).
- Controleer de stapeling met staffelkortingen (`custom.staffelkorting`) en kortingscodes: Shopify combineert automatische
  kortingen alleen als je dat per korting aanzet.
- De pakketten staan nu bovenaan de winkelwagen-aanbevelingen van de easy-ups (`complementary`): starterspakket bij Premium,
  compleet pakket bij Professional.

### Add-ons per product

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Easy-up tenten | Hooguit vier vinkjes: zijwandenset in dezelfde maat en kleur (heavy duty PVC bij een PVC-dak), voetgewichten (set per aantal poten), spanbanden en haringen (alleen Premium; Professional heeft ze in de doos) en een tas (Premium: wieltas; Professional: beschermhoes, de wieltas zit erbij). Regengoot, koppelset, zandzakken, LED-vloedlicht en heater staan in de winkelwagen-aanbevelingen. De 2 x 2 m heeft geen zijwandenset: de losse 2 m wanden staan in de aanbevelingen. | Of de tas en de voetgewichten de juiste standaard zijn. |
| Statafel inklapbaar Professional, HDPE, kruisvoet | Rok en strikhoes krijgen dezelfde standaardkleur: de bladkleur als die als textielkleur bestaat (wit, zwart, antraciet), anders zwart (graniet, berken, lichtgrijs). Uitvoering met parasolgat: de rok **zonder** topcover, geen strikhoes en geen beschermplaat (die dekken het gat af). | Of zwart de gewenste standaard is. |
| Statafel vierkant en rechthoekig, terrastafel | Beschermplaat in dezelfde maat (nieuw: 60 x 60, 70 x 70, 80 x 80, 120 x 60, 120 x 70, 160 x 60 cm, € 16,95–€ 25,95) en barkrukken (4 bij vierkant, 6 of 8 bij rechthoekig) of stapelstoelen (2, 4 of 6 bij de terrastafel), in de framekleur als die bestaat, anders zwart. | Platen op maat bij de leverancier; aantallen krukken/stoelen per tafel. |
| Barkrukken (alle zes) | Transportkar 'Voor 24 barkrukken' als add-on, één per bestelregel (`custom.addon_eenmalig`); zitkussen bij de barkruk met houten zitting en de draadkruk (en de stapelstoelen metaal en cross back). | Of de kar ook de PE-rotan-, velours- en chroomkrukken stapelt; zo niet, die uit `past_op` en de add-ons halen. |
| Printed easy-ups | De tenten met logo en full colour staan nu ook in `past_op` van voetgewicht, beschermhoes, wieltas, zijwandenset, spanbanden en bedrukte zijwand (ze worden daar al als add-on aangeboden). | Pasvorm (zelfde frame). |

### Producten, varianten en prijzen

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Statafels met stretchrokken en kar | Opgesplitst in drie producten: 5 statafels + kleine kar, 10 en 15 statafels + grote kar. Elk met Maat (Ø70, Ø80, Ø85), blad (wit, zwart, antraciet, berken) en dezelfde 8 rokkleuren als de andere statafelpakketten. Prijs = 89% van los, afgerond op …9: 5 statafels € 719–€ 839, 10 statafels € 1.299–€ 1.529, 15 statafels € 1.789–€ 2.129. Oude handle `pakket-statafels-stretchrokken-transportkar` bestaat niet meer. | Of de kleine kar 5 statafels Ø85 neemt en de grote 15 × Ø85; prijzen. |
| Terraspakket | 8 rokkleuren (was 24), gelijk aan de andere statafelpakketten; alle 24 blijven los leverbaar. | – |
| Onderdelen statafel (nieuw) | Onderstel compleet € 54,95, schuifring met draaiknop € 9,95, bladscharnier met schroeven € 7,95; past op de statafel inklapbaar Professional en de HDPE-statafel. | Pasvorm op de HDPE-statafel, prijzen, gewicht onderstel (ca. 8 kg). |
| LED-lichtslang warm wit 15 of 20 m (nieuw) | Vaste rol met stekker en eindkap: € 44,95 / € 54,95 (per meter blijft € 7,95; Outmate 20 m € 58). | Leverancier en prijs. |
| Rubberkabel per meter (onderdelen prikkabel) | H05RN-F 2 x 1,5 mm², € 1,95 per meter. | Type, prijs, en of je kabel zonder stekker los wilt verkopen. |
| Betonblok ballast | Nu 120, 140, 240, 500, 750 en 1000 kg (€ 99, 109, 149, 219, 259, 299) en 500 kg met M16-inserts voor een truss-voetplaat (€ 239). | Maten, prijzen en insert-maat bij de leverancier. |
| Opslagtent PVC | Nieuw: 3 x 6 m (PVC 500 € 449, 550 € 549, 620 € 619) en PVC 620 Professional in 4 x 8 m (€ 869). | Leverbaarheid en prijzen. |
| Zijwanden stertent | Per vak nu ook dicht (€ 10 onder de raamwand) en met oproldeur (€ 20 erboven), naast met raam en de set rondom. | Leverancier en prijzen. |
| Opblaasbare partytent met waterpoten | Ook 3 x 4,5 m (6 poten, € 1.749) en 3 x 6 m (8 poten, € 2.149); titel zonder maat, handle blijft `opblaasbare-partytent-3x3-waterpoten`. | Of de leverancier de verlengde maten levert; gewicht en capaciteit. |
| Opblaasbare promotietent, Pro en luifel | Framekleuren Geel en Grijs erbij (8 kleuren). | Kleurstaal en levertijd. |
| Badge 'Nieuw' | Weg bij wieltas, statafel HDPE, oranje themarok, losse strik, kleed tot de grond en het 4-statafelpakket: bij de lancering is alles nieuw, dus het label zei niets. | Pas gebruiken voor producten die na de lancering bijkomen. |

### Google Shopping-categorie (Product Category)

Elk product heeft nu een categorie uit de Shopify Standard Product Taxonomy (versie 2026-11-unstable): in de CSV als volledig pad in
`Product Category`, in `catalog.json` ook als ID (`product_category_id`, `gid://shopify/TaxonomyCategory/…`) voor het seed-script.
Tenten: Canopies; wanden, daken, gewichten, frames en tassen: Canopy & Gazebo Accessories (met subcategorie waar die bestaat);
rokken en strikhoezen: Table Skirts; kleden en topcovers: Tablecloths; barkrukken: Bar Stools; statafels: Outdoor Tables › Bar
Tables; klaptafels: Folding Tables; prikkabels en lichtslangen: Light Ropes & Strings; heaters: Patio Heaters; afzetpalen:
Retractable Belts; transportkarren: Platform Dollies; loper: Rugs; cadeaubon: Gift Cards. De mapping staat in
`catalog/tools/skeleton/kk_site.py` (`PRODUCT_CATEGORY_BY_TYPE` / `_BY_HANDLE`).

- Controleer na de import of Shopify elke categorie herkent (onbekende paden geven een importmelding).
- Koppel daarna de optie Kleur aan het categoriemetaveld **Kleur** (`shopify.color-pattern`), zodat swatches en het Google-
  attribuut color gevuld zijn. Categorieën zonder het kenmerk 'color' (daar valt het thema terug op `swatch_colors`):
  Folding Tables (klaptafels), Chair & Sofa Cushions (zitkussen: 'cover-color'), Light Ropes & Strings › String Lights /
  Rope Lights (kerstverlichting, lichtslang-set; de prikkabels met kabelkleur staan in de hoofdcategorie mét kleur), Canopy &
  Gazebo Side Walls (bedrukte en buizenframe-wanden zonder kleuroptie), Gift Cards.

### Productbeelden per kleur

- Een variant krijgt alleen nog een variantafbeelding die zijn eigen kleur toont: zijn eigen render, een andere render van het
  product in dezelfde kleur, of bij een pakket de render van het onderdeel in die kleur (de rok, de tent). Is er nog geen render
  in die kleur, dan blijft `Variant Image` leeg; nooit meer een zwarte rok (met alt-tekst 'Zwart') bij de variant Bordeaux.
- De nieuwe renders (statafelrok in 24 kleuren, topcover, strik, kleden, wanden en luifeltenten per kleur, loper, zitkussen,
  stormbanden, onderdelen) zijn 3D-renders in de stockkleur (brand.md §8.1). Leg ze bij de eerste levering naast een echte
  stofstaal en vervang ze door foto's zodra die er zijn.
- Waar het product zelf geen eigen opname heeft, toont de render het in gebruik en zegt de alt-tekst wat niet inbegrepen is:
  topcover op een stretchrok, losse strik om een hoes, kleed over een rok, buizenframe-wanden aan de PVC 550 Premium, stretchdoek
  op palen. Het vierkante statafelkleed (140 x 140 cm) toont voorlopig het ronde kleed.
- De cadeaubon is een vlakke kaart met het logo (`catalog/tools/giftcard.py`), zonder bedrag.
