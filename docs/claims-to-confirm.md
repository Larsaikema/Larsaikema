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
| Levering | `shipping_cost_pakket` / `shipping_cost_pallet` | € 6,95 / € 59,00 | regel "Verzendkosten …" op de productpagina en de regel "Verzending binnen NL" / "Palletlevering binnen NL" in winkelwagen en drawer, opgeteld in het "Totaal" (buiten NL: "Zie je bij afrekenen" en "Totaal zonder verzending"). De hoogste verzendkosten in de winkelwagen tellen: per product `custom.verzendkosten` (zoals op de productpagina) of anders het tarief van zijn klasse; pakket gratis boven `free_shipping_threshold`. Moet gelijk zijn aan je tarieven in Shopify › Verzending (één tarief per zending, zie reference cart.highest-shipping-only); de winkelwagen telt het op in het totaal met "(indicatie)" in de regelnaam en de regel "Verzendkosten berekenen we bij het afrekenen." eronder; een afwijkend tarief geeft dus een ander bedrag bij het afrekenen |
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
  maandag verzonden", op een feestdag "Uit voorraad: nu besteld, dinsdag verzonden", op een smal scherm korter maar altijd met "Uit voorraad"
  en vóór de besteltijd altijd met de tijd erbij: "Uit voorraad: nog 3 u 13 min, vandaag verzonden" (past dat niet op één regel, dan loopt de tekst door op een tweede regel); volgt `cutoff_time`,
  `shipping_days` en `holidays`), "Offerte op maat [reactietijd]" (`[reactietijd]` wordt het deel "binnen …" van
  `response_time`, dus "binnen één werkdag"; zonder "binnen" in die tekst valt het weg) en "[bedenktijd] dagen
  bedenktijd (niet bij maatwerk)" (`[bedenktijd]` wordt `return_days`). Uitgeschakeld blok: "Snel in huis in NL & BE".
  "Zakelijk bestellen op factuur" staat **niet** meer standaard in de balk: zet dat pas terug als je factuurbetaling hebt
  (factuur-app of Shopify B2B), of als je het alleen via een offerte aanbiedt en dat er zo bij zet.
- Megamenu-promoties (header, blokken "Megamenu-promotie"): Statafels "Logo op één of twee kanten, of full colour rondom.
  Vanaf 1 stuk, staffelprijs vanaf 10." (de staffel van bedrukt textiel begint bij 10 stuks, zie Catalogus › Staffelkortingen); Met jouw logo
  "Drukproef vooraf" en "Eerst je akkoord, dan drukken we." (de drukproef-werkwijze van Bedrukken); Zakelijk "Offerte op maat"
  en "Voor je bedrijf, club of verhuur: grote aantallen, bedrukking en prijzen excl. btw in één voorstel."
- Hoofdmenu (navigatie › main-menu, uit de catalogus): de link "Offerte vanaf 10 stuks" onder Met jouw logo › Zo werkt
  bedrukken. Pas de tekst aan als je ook kleinere aantallen bedrukt.
- Home en collecties: USP-strook (home: "Vóór [besteltijd] besteld, vandaag verzonden": `[besteltijd]` wordt `cutoff_time`; dat
  blok staat op "Alleen bij voorraad", dus zolang geen enkel product echt op voorraad is (alle varianten 0 + `continue`, de
  standaard uit de CSV) staat er "Bezorgd in NL en BE · De verwachte leverdatum staat bij elk product";
  collecties: "Bezorgd in NL en BE", omdat daar ook producten staan die nabesteld worden). Op de home staat geen "op factuur"
  meer (USP "Prijzen ook excl. btw · Zakelijk: staffel en offerte op maat"; op collecties staat standaard "Zakelijk bestellen:
  prijzen ook excl. btw, of vraag een offerte"), zonder belofte over factuurbetaling; zet "op factuur" pas terug met een
  factuur-app of Shopify B2B. Zakelijk-banner ("Staffelprijzen bij grotere aantallen", "Offerte op maat … levering op locatie"),
  FAQ-antwoorden (maat per gast volgt de pagina Maatadvies partytenten). Vanaf-prijzen op de categorietegels en de
  Pakketten-tegel komen van het product dat per tegel is gekozen (Vanaf-prijs van dit product); controleer ze als je prijzen of
  het assortiment wijzigt.
- Winkelwagenpagina: "Veilig betalen met iDEAL of Bancontact" en "[bedenktijd] dagen bedenktijd (niet bij bedrukt maatwerk)"
  (`[bedenktijd]` wordt `return_days`) (Zekerheid 1–3 in de sectie Winkelwagen; leeg = weg). "Zakelijk bestellen op factuur"
  staat er niet meer standaard: zet het in Zekerheid 3 zodra je factuurbetaling hebt (factuur-app of Shopify B2B).
- Winkelwagenpagina, onder Afrekenen: "Afrekenen kan als gast of met je account." (sectie Winkelwagen, vinkje "Regel
  'Afrekenen kan als gast of met je account'", standaard aan). Klopt alleen als klantaccounts optioneel zijn (Shopify ›
  Instellingen › Klantaccounts); zet het vinkje anders uit.
- Winkelwagen, "Referentie, leverdatum of opmerking": het veld "Gewenste leverdatum" is een wens, geen afspraak. Het komt als
  bestelattribuut "Gewenste leverdatum" (en "Referentie") bij de bestelling (Bestellingen › bestelling › Aanvullende
  details); Shopify en je vervoerder doen er niets mee, dus plan het zelf in of mail de klant als het niet lukt. De vroegste
  datum die het veld toestaat is de laatste dag van de verwachte levering die de winkelwagen toont (zelfde instellingen als
  hierboven); een eerdere datum wordt niet opgeslagen en houdt Afrekenen tegen tot hij is aangepast of leeg is. Bij een
  winkelwagen met alleen een cadeaubon staat het veld er niet. Uitzetten: sectie Winkelwagen › "Veld 'Gewenste leverdatum'".
- Zakelijk-pagina: staffelvoorbeeld (10/25/50 stuks: 5/10/15%), "Op factuur", "Levering op locatie", de reactietijd onder de
  knoppen (`response_time`) en de vragen in de sectie Veelgestelde vragen van die pagina: "Betalen kan binnen de termijn op de
  factuur", "Zet je aantallen in een offerteaanvraag, dan rekenen we met de staffelprijs" (past bij `staffel_mode` = offerte),
  "Bij elke bedrukking eerst een digitale drukproef", "Grote aantallen per pallet, op een dag die we samen afspreken" en de btw
  voor zakelijke leveringen in België.
- Offertepagina: "Prijzen excl. btw", "Staffelkorting vanaf 10 stuks", "Op factuur voor bedrijven en verenigingen", onder de
  knop en na versturen "[reactietijd] Je krijgt prijzen incl. en excl. btw" (`response_time` + sectie-instellingen), en de
  btw-uitleg die verschijnt als het land niet Nederland is (sectie-instelling "Btw-uitleg bij levering buiten Nederland", zelfde
  tekst als op de productpagina: laat je boekhouder hem bevestigen). Het vinkje "Ik wil ballastadvies" belooft advies of een
  eerlijke doorverwijzing, zoals de paginatekst Ballastadvies zegt.
- Bedrukken: "Levertijd 10–15 werkdagen na akkoord drukproef", PNG ≥ 2000 px wordt drukklaar gemaakt.
- Formulieren: "We reageren / sturen binnen één werkdag een offerte" (locale `forms.contact_success`, `quote.success`).
- Productpagina, bedrukken: stappen "Je krijgt een digitale drukproef per mail", "Pas na jouw akkoord gaan we drukken".
- Productpagina, uitverkocht: "Mail me als dit weer op voorraad is" en na verzenden "Dank je, je aanvraag is binnen. We laten
  het je weten zodra dit weer op voorraad is." (locale `product.notify_success`). Zonder app is dit het gewone contactformulier: elke aanvraag komt als mail
  binnen (onderwerp "Mail me als dit weer op voorraad is", met product, variant en artikelnummer) en **jij mailt de klant zelf**
  zodra er weer voorraad is. Wil je dat niet met de hand doen: installeer een back-in-stock-app, zet in de productpagina (blok
  Koopknop) "'Mail me als dit weer op voorraad is' bij uitverkocht" uit en voeg het app-blok toe.
- Productpagina, staffel (`staffel_mode` = offerte): "Staffelprijs met offerte" en "Deze prijzen krijg je met een offerte,
  ook als particulier of vereniging." plus je reactietijd (`response_time`); vanaf het eerste staffelaantal vergelijkt de regel
  eronder de offerteprijs met de stukprijs in de winkelwagen. Maak je de staffels als automatische korting
  aan, zet `staffel_mode` dan op Automatisch: de productpagina zegt dan dat de korting in de winkelwagen staat.
- Productpagina, offerteformulier (blok Offerteformulier, instelling "Btw-uitleg bij levering buiten Nederland"): kiest de
  bezoeker een ander land dan Nederland, dan staat er "Bedrijf in België of elders in de EU met een geldig btw-nummer? Dan
  krijg je een offerte zonder Nederlandse btw: de btw wordt verlegd (intracommunautaire levering)." Laat je boekhouder
  bevestigen dat je zo factureert (geldig btw-nummer controleren in VIES, ICP-opgave); anders de tekst aanpassen of leegmaken.
- Productpagina, add-ons (blok Handig erbij): "Korting bij de tent" is standaard leeg. Vul het pas in als de korting als
  automatische korting in Shopify staat (bv. 10% op zijwanden bij aankoop van een tent), anders belooft de pagina iets wat
  de winkelwagen niet doet.
- Productpagina, nabestelling (voorraad 0, beleid doorverkopen): onder "Leverbaar over 2–3 weken" staat "Niet uit voorraad:
  deze uitvoering bestellen we voor je bij." (blok Voorraad en levering, instelling `backorder_note`; leeg = weg), plus
  "Wel uit voorraad: …" met de varianten van hetzelfde product die wel voorraad hebben. "Nodig op een vaste datum?" vergelijkt
  de datum van de klant met het verwachte leverbereik ("Dat lukt" / "Dat wordt krap" / "Dat halen we waarschijnlijk niet")
  en zet die datum in het offerteformulier ("Gewenste leverdatum"). Klopt "we bestellen hem voor je bij" niet voor je
  inkoop, pas de tekst aan of maak hem leeg.
- Productpagina, pallet: "Verwacht in huis: wo 21 – vr 23 okt" (een bereik van `transit_days_pallet` min en plus één werkdag,
  passend bij de standaardtekst "meestal binnen 2–4 werkdagen"; levering op afspraak).
- Collectiepagina, regel boven het raster: wacht meer dan de helft van de producten op dezelfde levertekst (nu overal
  "Leverbaar over 2–3 weken" uit `delivery_text_backorder`, of dezelfde `custom.levertijd`), dan staat er één regel
  boven het raster met het leverbereik dat de productpagina ook toont: "Op bestelling, in huis 3 – 12 nov" (met ", tenzij
  anders vermeld" als andere kaarten iets anders zeggen; zonder JavaScript of zonder getal in de tekst staat de levertekst
  zelf er: "Leverbaar over 2–3 weken") (de weken of werkdagen uit de tekst plus `transit_days_pakket` /
  `_pallet`, gerekend met `cutoff_time`, `shipping_days`, `delivery_days`, `holidays` en `transit_days_be_extra`; staan
  pakket en pallet in hetzelfde raster, dan het bereik dat beide dekt). Een bedrukkingslevertijd ("… na akkoord drukproef")
  krijgt nooit een datum en blijft heel op zijn eigen kaart. "Eerder nodig? Vraag het ons" linkt naar de contactpagina.
  Klopt de levertekst niet, pas dan de instelling of `custom.levertijd` aan; het bereik rekent mee.
- Maatwerk (configurator): "geen bedenktijd, niet retourneren" (wettelijke uitzondering voor maatwerk; zet het ook in je
  voorwaarden), maattolerantie en minimale afname uit `custom.configurator`, levertijd uit `custom.levertijd`.
- Garantie en klachten (page.garantie): wettelijke garantie, "extra garantie op het frame" (verwijst naar `custom.garantie`
  per product), wat er niet onder valt, reactietijd uit `response_time`.
- Pakketten (collectie `actiepakketten`, in menu en titel ‘Pakketten’): "Je bespaart € x" rekent het thema uit de losse prijzen van de onderdelen; controleer dat de
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
| Brandvertragend | Nergens meer in de winkel: niet in titels, SEO, kenmerk of USP's, en sinds de merchandising review ook niet meer in de specificatietabellen (de waarde 'certificaat volgt' las als een interne notitie). Op 18 oktober ook weggehaald: 'brandklasse M2 (certificaat bij levering)' bij stretchtent compleet, stretchdoek los en op maat en de collectie stretchtenten (USP, SEO, tekst, spectabel), en 'PVC-tenten / easy-up-daken / heavy duty PVC zijn brandvertragend' in de FAQ-pagina en de blogs 'PE of PVC' en 'Zijwanden kiezen'. De FAQ zegt: we zetten het pas op de pagina als de leverancier norm en brandklasse met een certificaat bevestigt. PE-basistent: "Brandvertragend: Nee". | Certificaat (bv. EN 13501-1, DIN 4102 B1 of M2) per doek opvragen; daarna norm en klasse in de specificaties zetten (`catalog/parts`), pas daarna eventueel in kenmerk of titel. |
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
| Easy-up tenten | Hooguit vier vinkjes: zijwandenset in dezelfde maat en kleur (heavy duty PVC bij een PVC-dak; sinds catalogusronde 4 ook voor de 2 x 2 m Professional, die nu een zijwandenset van 2 x 2 m heeft), voetgewichten (set per aantal poten), spanbanden en haringen en een vierde vinkje (Premium: wieltas; Professional, ook met logo en full colour: LED-vloedlicht 30 W, want de wieltas zit al in de doos en een beschermhoes deed dubbel). Spanbanden en haringen: bij de Premium één set per 4 poten (er zitten er geen in de doos); bij de Professional met 6 of 8 poten één extra set voor de middenpoten (de 4 in de doos zijn voor de hoeken), bij 4 poten geen. Regengoot, koppelset, verbindingsstrook, zandzakken en heater staan in de winkelwagen-aanbevelingen. | Of de tas en de voetgewichten de juiste standaard zijn, en of de extra set spanbanden bij 6 en 8 poten klopt. |
| Statafel inklapbaar Professional, HDPE, kruisvoet | Rok en strikhoes krijgen dezelfde standaardkleur: de bladkleur als die als textielkleur bestaat (wit, zwart, antraciet), anders zwart (graniet, berken, lichtgrijs). Uitvoering met parasolgat: de rok **zonder** topcover, geen strikhoes en geen beschermplaat (die dekken het gat af). | Of zwart de gewenste standaard is. |
| Statafel vierkant en rechthoekig, terrastafel | Beschermplaat in dezelfde maat (nieuw: 60 x 60, 70 x 70, 80 x 80, 120 x 60, 120 x 70, 160 x 60 cm, € 16,95–€ 25,95) en barkrukken (4 bij vierkant, 6 of 8 bij rechthoekig) of stapelstoelen (2, 4 of 6 bij de terrastafel), in de framekleur als die bestaat, anders zwart. | Platen op maat bij de leverancier; aantallen krukken/stoelen per tafel. |
| Barkrukken | Transportkar 'Voor 24 barkrukken' als add-on, één per bestelregel (`custom.addon_eenmalig`), bij de vijf stapelbare krukken; niet meer bij de PE-rotan kruk (stapelt niet, review 3), die krijgt het zitkussen. Zitkussen ook bij de houten zitting en de draadkruk. Capaciteit per kruk staat in de tekst en in 'Niet inbegrepen' boven de add-ons: 24 (metaal, draad), 18 (houten zitting, chroom), 15 (velours). | Stapelhoogtes en capaciteit per kruk bij de leverancier. |
| Printed easy-ups | De tenten met logo en full colour staan nu ook in `past_op` van voetgewicht, beschermhoes, wieltas, zijwandenset, spanbanden en bedrukte zijwand (ze worden daar al als add-on aangeboden). | Pasvorm (zelfde frame). |

### Producten, varianten en prijzen

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Statafels met stretchrokken en kar | Opgesplitst in drie producten: 5 statafels + kleine kar, 10 en 15 statafels + grote kar. Elk met Maat (Ø70, Ø80, Ø85), blad (wit, zwart, antraciet, berken) en dezelfde 8 rokkleuren als de andere statafelpakketten. Prijs = 89% van los, afgerond op …9: 5 statafels € 719–€ 839, 10 statafels € 1.299–€ 1.529, 15 statafels € 1.789–€ 2.129. Oude handle `pakket-statafels-stretchrokken-transportkar` bestaat niet meer. | Of de kleine kar 5 statafels Ø85 neemt en de grote 15 × Ø85; prijzen. |
| Terraspakket | Vervangen door review 3: weer alle 24 rokkleuren, blad wit, zwart, antraciet of berken. | – |
| Onderdelen statafel (nieuw) | Onderstel compleet € 54,95, schuifring met draaiknop € 9,95, bladscharnier met schroeven € 7,95; past op de statafel inklapbaar Professional en de HDPE-statafel. | Pasvorm op de HDPE-statafel, prijzen, gewicht onderstel (ca. 8 kg). |
| LED-lichtslang warm wit 15 of 20 m (nieuw) | Vaste rol met stekker en eindkap: € 44,95 / € 54,95 (per meter blijft € 7,95; Outmate 20 m € 58). | Leverancier en prijs. |
| Rubberkabel per meter (onderdelen prikkabel) | H05RN-F 2 x 1,5 mm², € 1,95 per meter. | Type, prijs, en of je kabel zonder stekker los wilt verkopen. |
| Betonblok ballast | Nu 120, 140, 240, 500, 750 en 1000 kg (€ 99, 109, 149, 219, 259, 299) en 500 kg met M16-inserts voor een truss-voetplaat (€ 239). | Maten, prijzen en insert-maat bij de leverancier. |
| Opslagtent PVC | Nieuw: 3 x 6 m en PVC 620 Professional in 4 x 8 m. Prijzen sinds review 3 in één richting t.o.v. de partytent gezet (zie hieronder). | Leverbaarheid en prijzen. |
| Zijwanden stertent | Per vak nu ook dicht (€ 10 onder de raamwand) en met oproldeur (€ 20 erboven), naast met raam en de set rondom. | Leverancier en prijzen. |
| Opblaasbare partytent met waterpoten | Ook 3 x 4,5 m (6 poten, € 1.749) en 3 x 6 m (8 poten, € 2.149); titel zonder maat. Handle sinds review 3 `opblaasbare-partytent-met-waterpoten`, met een redirect van de oude URL (zie hieronder). | Of de leverancier de verlengde maten levert; gewicht en capaciteit. |
| Opblaasbare promotietent, Pro en luifel | Framekleuren Geel en Grijs erbij (8 kleuren); de luifel ook in Antraciet (9 kleuren), voor de partytent met waterpoten. | Kleurstaal en levertijd. |
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

## Catalogus: accessoirelogica en scope (merchandising review 2, 18 oktober 2026)

Na de tweede review zijn de add-ons buiten de easy-ups per tent op maat gezet en zijn de gaten in maten, kleuren, scope en
staffels gedicht. Alles staat als data in `catalog/tools/skeleton/*.py` en `catalog/parts/*.json`.

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Ballast buizenframe- en opslagtenten | Add-on: 1 × voetgewicht 15 kg ('1 stuk') per staander, net als de lange haring: 4 (3 m lang), 6 (4 m), 8 (6 m), 10 (8 m), 12 (10 m), 14 (12 m). De tekst bij tent, collectie, voetgewicht en blog 'verankeren bij wind' zegt: 1 per staander beschut, 2 (30 kg) met wanden in de wind; evenement, open terrein of weken laten staan: ballastadvies via offerte. **Dit vervangt het eerdere advies 'minimaal 50 kg per staander'** (dat paste bij geen enkele add-on). Het voetgewicht heet nu 'Voetgewicht partytent 15 kg' (handle sinds review 3 `voetgewicht-partytent-15-kg`, redirect van `voetgewicht-easy-up-15-kg`) en staat in `past_op` van alle buizenframe-tenten en de opslagtent (systeem Buizenframe). | Het ballastadvies per staander bij de leverancier laten bevestigen (pasvorm om de ronde staander van 38 mm, op de voetplaat). Wil je strenger blijven (50 kg), dan moet de add-on 4 × 1 stuk per staander worden of naar betonblokken. |
| Betonblokken | Nergens meer een vinkje (was 1 × 140 kg bij elke buizenframe-tent, 1 × 500 kg bij elke stretchtent, 7–12 × 140 kg bij stertenten, 1 × 140 kg bij de carport). Tent-, betonblok- en collectieteksten verwijzen naar ballastadvies via de offertepagina; de offertepagina heeft een alinea 'Ballastadvies'. De winkel rekent geen ballast uit. | Wie het ballastadvies geeft (eigenaar, leverancier of constructeur) en binnen welke termijn. |
| Zeshoektent | Add-on watergewichtzakken: 5 / 6 / 8 sets van 4 × 20 kg (8 x 8 / 10 x 10 / 12 x 12 m) = 3 / 4 / 5 zakken per poot, afgeleid van het eigen advies 50 / 75 / 100 kg per poot. Zijwand in de kleur van de tent (Rood en Blauw toegevoegd, € 349–€ 519). | Ballastadvies en de kleuren Rood/Blauw bij de leverancier. |
| Dakzeil buizenframe | Elke maat en elk doek van onze buizenframe-tenten en opslagtenten: 38 varianten, 3 x 3 tot 8 x 12 m. PE en PVC 550 standaard (levertijd 1–2 weken); PVC 500 en PVC 620 op aanvraag (3–4 weken; dat staat in de Uitvoering, omdat het contract geen levertijd per variant kent). Prijzen PVC 550 € 149 (3 x 3) tot € 649 (8 x 12), PVC 500 ca. 8 % lager (€ 149–€ 499), PVC 620 ca. 12 % hoger (€ 189–€ 609), PE € 89–€ 199. Staffel 10/25/50. | Welke daken je echt op voorraad houdt; prijzen; of het dak van de opslagtent gelijk is aan het partytentdak van dezelfde maat; daken van 6 x 12 en 8 x 12 m wegen 45–60 kg (pakketdienst of vracht). |
| Opslagtent | Uitvoering heet nu PVC 500 Comfort / PVC 550 Premium / PVC 620 Professional (namen van de tentlijnen; SKU's ongewijzigd). | – |
| Printed easy-ups | Professional met logo (€ 649 / € 1.349), full colour (2 x 2 € 799 / € 1.099, 5 x 5 € 1.649 / € 2.229) en bedrukt dakzeil (€ 319 / € 599) ook in 2 x 2 en 5 x 5 m. Bedrukte zijwand ook 2 m (€ 119 / € 179), 5 m (€ 209 / € 309) en 8 m (€ 299 / € 439): de 4 x 8 m 'Dak en luifel' krijgt nu een wand van 8 m als add-on. | Drukprijzen en drukformaat per maat. |
| Stretchtent, stertent, carport | Stretch sinds review 3: startwand 3 m + 2 randpalen 2,5 m + 1 betonblok 500 kg als begin (geen koppelgoot meer: die verbindt alleen twee tenten); ster = zijwanden rondom + lange haring per punt; carport = geen add-on (keilbouten of ballastadvies). | – |
| Biertafelset en bierbank | Hoes biertafelset heeft nu een Uitvoering: Set (tafel en 2 banken, € 39,95 / € 44,95), Alleen tafel (€ 24,95 / € 27,95) en Alleen bank (220 x 25 cm, € 9,95). De biertafel 'Alleen tafel' krijgt de tafelhoes, de losse bierbank de bankhoes. Titel 'Hoes biertafelset, biertafel of bierbank'. | Leverancier en prijzen van losse tafel- en bankhoezen. |
| Statafel vierkant en rechthoekig | Nieuw product: stretchhoes voor vierkante en rechthoekige statafels (60 x 60 € 29,95, 70 x 70 € 32,95, 80 x 80 € 34,95, 120 x 60 € 44,95, 120 x 70 € 46,95, 160 x 60 € 52,95; wit, zwart, antraciet), als add-on bij beide. Statafelkleed 140 x 140 past ook op de vierkante. De transportkar voor statafels heeft een variant 'Plateau, voor 5 gestapelde statafels' (€ 149, ca. 90 x 90 cm) als add-on (1 per bestelregel) bij de stapelbare vierkante. Menu Statafels › Per maat noemt ook 60 x 60 tot 160 x 60 cm. | Leverancier, pasvorm met voetzakken, prijzen; draagvermogen en maat van de plateaukar. Renders ontbreken nog (image-jobs). |
| Wijnvat en marktkraam | Wijnvat: add-ons 4 × barkruk met houten zitting en beschermplaat Ø 78 cm. Marktkraam: add-on zandzakken (set van 4); de marktkraam staat in `past_op` van de zandzakken. | – |
| Opblaasbare partytent met waterpoten | Luifel alleen in de kleur van de tent (Antraciet krijgt nu een antraciet luifel in plaats van zwart). Kenmerk promotietent: 'dak in framekleur of full colour' (standaard is Dak in framekleur). | – |
| Zakelijk | Tag `zakelijk` (dus in /collections/zakelijk) ook op zijwandenset easy-up, losse zijwanden dicht/raam/deur, halve zijwand, dakzeil easy-up, statafel HDPE, prikkabel E27, LED-lamp E27, pomp, hoes biertafelset, bierbank, dakzeil buizenframe en de nieuwe stretchhoes. De pomp kreeg daardoor de staffel 10/25/50 = 5/10/15 %. | – |
| Staffels op reserveonderdelen | 10/25/50 = 5/10/15 % op dakzeil easy-up, dakzeil buizenframe, zijwand buizenframe 2 m, eind- en tussenwand, stormbandenset, haringen en bevestigingsmateriaal, beschermhoes, opbergtassenset en regengoot. | Marges; automatische korting in Shopify gelijk zetten. |
| Menu en collecties | Hoofdmenu 'Actie' heet nu 'Pakketten' (er is geen compare-at-prijs of `badge:actie`), de collectie `actiepakketten` heet 'Pakketten'. Nieuwe collectie `onderdelen-stretch-ster-en-opblaasbare-tenten` (kolom 'Voor stretch-, ster- en opblaasbare tenten' onder Accessoires); `partytent-onderdelen` en `accessoires` nemen nu ook de typen Stretchtent onderdeel, Stretchtent zijwand, Stertent zijwand en Opblaasbare tent accessoire mee; de opbergtas voor opblaasbare tenten staat in Tassen en wielsets. | Thema: de header-instelling 'Menu-item met actielabel' (`deal_items`) staat nog op 'Actie' en past nu op geen menu-item; leeg laten of bewust 'Pakketten' kiezen. |
| Statafelpakket HDPE (nieuw) | Statafel HDPE Ø80 + stretchrok met topcover (sinds review 3 in alle 24 kleuren): € 69,95 (los € 74,90, 6,6 % minder; onder de 10–12 % van het prijsbeleid om onder de instap van ca. € 70 te blijven). | Pakketprijs en marge. |

## Catalogus: transport, opslag en feitencontrole (merchandising review 3, 18 oktober 2026)

De derde review vond het grootste gat bij transport en opslag van meubilair, precies wat verhuur, catering, horeca en
verenigingen kopen, plus een reeks feit- en datafouten. Structuur en prijzen staan in `catalog/tools/skeleton/*.py`
(`python3 -I catalog/tools/skeleton/build.py catalog/skeleton.json reference/assortment.json`), teksten in `catalog/parts/*.json`.
**Elke prijs, maat, capaciteit en elk gewicht hieronder is een voorstel of productdefinitie: bevestigen bij leverancier en eigenaar.**

### Voorraad en levertijd: `catalog/stock.csv` (nieuw, door jou in te vullen)

| Wat er nu staat | Wat je doet |
|---|---|
| Alle verzonden varianten importeren met 0 op voorraad en beleid doorverkopen, en 139 producten hebben geen `custom.levertijd`: elke kaart en productpagina zegt daardoor 'Leverbaar over 2–3 weken'. Er staat **geen verzonnen voorraad** in de catalogus. Nieuw is `catalog/stock.csv` (`SKU,Product,Variant,Voorraad`) met alle 300 varianten van de snellopers: statafelrok stretch, topcover, statafelhoes met strik, statafel inklapbaar Professional en elke maat easy-up Premium en Professional. De kolom Voorraad is leeg. | Vul **Voorraad** in met je echte telling (of exporteer hem uit je voorraadsysteem in hetzelfde formaat; komma of puntkomma mag) en draai `python3 catalog/build.py`. Een ingevuld aantal gaat naar `Variant Inventory Qty` in `products.csv` en naar de preview: het thema toont dan voor die variant de verzendregel met besteltijd ('voor 14:00 besteld, vandaag verzonden', `cutoff_time`) in plaats van 'Leverbaar over 2–3 weken'. Een leeg vak blijft 0 + doorverkopen. Meer producten erbij: `python3 catalog/build.py --stock-template` voegt de snellopers toe en laat ingevulde waarden staan; andere SKU's mag je met de hand toevoegen. Alternatief zonder telling: een levertijd per productklasse in `custom.levertijd`, maar alleen als de leverancier die bevestigt. |

### Transportkarren en pakketten (nieuw)

| Product | Wat er nu staat | Te bevestigen |
|---|---|---|
| Transportkar voor stapelstoelen | Voor 20 (€ 179, ca. 105 x 58 cm, 24 kg) of 40 stapelstoelen (€ 279, ca. 105 x 112 cm, 38 kg), stapels van 10; past op stapelstoel metaal, banquetstoel (10 hoog) en cross back (8 hoog: 16 / 32). Add-on (1 per bestelregel) 'Voor 20' bij alle drie de stoelen. | Leverancier, maten, prijs; of de kar voor 40 door je klantdeuren moet (hij is 112 cm breed). |
| Transportkar voor ronde klaptafels | 10 ronde klaptafels Ø150 of Ø180 cm op hun rand, € 429, ca. 120 x 102 x 100 cm, 42 kg; add-on bij de ronde klaptafel. Referentie: Outmate trolley klaptafel rond 180 vanaf € 482,50. | Leverancier, maten, prijs. |
| Transportkar voor biertafelsets | 10 sets (10 tafels + 20 banken) plat gestapeld, € 299, ca. 230 x 82 x 105 cm, 55 kg, verzinkt; add-on bij de biertafelset, optie in het pakket van 10. Geen referentieprijs bij Statafelshop; Duitse markt ca. € 250–€ 450. | Leverancier, maten, prijs, capaciteit in brouwerijkwaliteit. |
| Transportkar voor terrastafels | 10 terrastafels 60 x 60 of 70 x 70 cm, of 6 van 120 x 70 cm, blad rechtop; € 249, ca. 140 x 80 x 100 cm, 32 kg; add-on bij de terrastafel. Referentie Statafelshop sta- en terrastafelkar klein € 311,58 / groot € 434,39. | Leverancier, maten, prijs. |
| 10 ronde klaptafels met transportkar | Ø150 € 1.899 (los € 2.119), Ø180 € 2.349 (los € 2.619); ca. 10 % onder los; staffel 2/5 = 3/5 %. Add-on: 10 ronde kleden tot de grond. | Pakketprijs en marge. |
| 40 stapelstoelen met transportkar | Zwart, wit of antraciet: € 1.789 (los € 1.997); add-on: 40 zitkussens. | Pakketprijs en marge. |
| Biertafelsets 10 stuks | Nu ook in brouwerijkwaliteit en met of zonder transportkar (optie Samenstelling): € 1.499 (50 cm standaard zonder kar) tot € 2.349 (70 cm brouwerij met kar), 89 % van los. | Prijzen. |
| Bestaande karren gekoppeld | Klapstoel → kar 'Voor 30 klapstoelen'; klaptafel 183 x 76 cm → kar 'Voor 10 klaptafels 183 cm' (1 per bestelregel). | – |

De optie **Samenstelling** (Set: tafel en 2 banken / Alleen tafel; Zonder / Met transportkar) is een bewuste contractuitbreiding
(`catalog/CONTRACT.md`): Uitvoering draagt bij de biertafels de kwaliteit. Het thema toont hem als gewone knoppen.

### Biertafels: standaard en brouwerijkwaliteit

| Wat er nu staat | Te bevestigen |
|---|---|
| Biertafelset, bierbank en het pakket van 10 hebben Uitvoering **Standaard** (25 mm vurenhout, gelakt) of **Brouwerijkwaliteit** (35 mm vurenhout met afgeronde randen, 2 x gelakt, zwaarder verzinkt onderstel met extra dwarsverbinding). Set 220 x 50: € 169 / € 215; set 220 x 70: € 185 / € 235 (de 70 cm set ging van € 199 naar € 185, zodat een set altijd goedkoper is dan tafel + 2 banken los); alleen tafel € 89,95 / € 109 en € 119 / € 139; bank € 39,95 / € 49,95. De hoes past op beide en komt als add-on mee. | **Leveranciersclaim**: dikte, afwerking, onderstel en gewichten (brouwerij set 34 / 39 kg, bank 8,5 kg); prijzen. |

### Add-ons en feiten die niet klopten

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Stretchtent | Geen koppelgoot meer als add-on (die verbindt alleen twee tenten). Wel: startwand 3 m, 2 randpalen 2,5 m in het paalmateriaal van de tent, 1 betonblok 500 kg als begin; de tekst zegt dat het aantal per ankerpunt uit het ballastadvies via offerte komt. | Of 1 blok als start de juiste standaard is. |
| Easy-up Professional met 6 of 8 poten | Ook met logo en full colour: extra set spanbanden en haringen (1) als add-on, zoals de tekst en FAQ al aanraadden (4 in de doos, voor de hoekpoten). | – |
| Easy-up Professional 5 x 5 m | FAQ voetgewichten: 'Neem de set van 8' (€ 309, tegen 2 x € 159 = € 318), gelijk aan de add-on. | – |
| Compleet pakket easy-up Professional | Nu 8 maten: 2 x 2 m (€ 759, 4 losse wanden van 2 m in de opstelling van de set, rood/wit/zwart) en 5 x 5 m (€ 1.599, set van 8 voetgewichten, rood/wit/zwart/antraciet) erbij, alleen polyester. Bij 6/8 poten de extra spanbanden als add-on. | Of de losse 2 m-wanden de 2 x 2 m sluiten zoals een set. |
| Gewicht printed easy-ups | `custom.gewicht_kg` leeg op Professional met logo, full colour en Premium met logo (was 22 / 22 / 27 kg, de kleinste maat): de spec toont het variantgewicht (tot 84–90 / 41 kg). | – |
| Opslagtent vs partytent PVC | In één richting: in dezelfde maat en hetzelfde doek is de opslagtent altijd ca. 4–7 % goedkoper dan de buizenframe-partytent (dichte wanden zonder ramen, één roldeur; de partytent heeft raamwanden en een deur met rits). Nieuwe opslagprijzen (PVC 500 / 550 / 620): 3 x 4 m 379/439/529 · 3 x 6 m 449/519/619 · 4 x 6 m 479/639/819 · 4 x 8 m 559/759/919 · 5 x 10 m 749/989/1.129 · 6 x 12 m 999/1.309/1.499. Beide teksten leggen het verschil uit. | Prijzen en marge. |
| Statafelpakketten | Rok in alle 24 kleuren (was 8). Pakketten met 3 maten: blad wit, zwart of antraciet (216 varianten; berken eruit, want onder de topcover zie je het blad niet en 288 varianten zou boven de 250 komen die Liquid `product.variants` teruggeeft). Terraspakket (1 maat): 24 rokken x 4 bladen incl. berken. | – |
| Zakelijk | Tag `zakelijk` + staffel op de heaters (terras, flame, lounge, elektrisch), overkappingzeil, zijwand overkapping, schaduwdoek en wijnvatstatafel; tag op terraspakket, wijnvat-set en Premium met logo; tag op zijwand 2 m, eind-/tussenwand, stormbanden- en opbergtassenset, zodat /collections/zakelijk de wanden van de zakelijke PVC-tenten toont. | Staffels als automatische korting instellen. |

### Losse onderdelen met een eigen pagina en beeld

| Wat er nu staat | Te bevestigen |
|---|---|
| Uit de mengproducten gehaald, elk met eigen titel, SEO en render: **Dimmer voor prikkabel en lichtslang** (stekkerdimmer tot 280 W € 9,95, met afstandsbediening tot 500 W € 24,95; IP20), **Tijdschakelaar voor prikkabel en lichtslang** (€ 7,95; IP44, 3.680 W), **Koppelgoot stretchtent** (3 m € 69,95, 6 m € 119; PVC 650 g/m², ca. 60 cm breed, klittenband) en **Tentelastieken met bal** (25 stuks € 9,95). SKU's zijn meeverhuisd. In de mengproducten die blijven heeft elke uitvoering een eigen beeld: fittingen en eindkap, spanband / touwenset / paalverbinder / oogmoeren, elke haring en elk koppelstuk of buis, en het aansluitsnoer, de verlengkabel, de kabel per meter en de draaiharing (nieuw rendermodel `renders/models/miscParts.js`). | Specificaties van dimmer, tijdschakelaar, koppelgoot en elastieken bij de leverancier. |

### Nieuwe handles en redirects

| Oud | Nieuw | Waarom |
|---|---|---|
| `/products/opblaasbare-partytent-3x3-waterpoten` | `/products/opblaasbare-partytent-met-waterpoten` | Het product verkoopt ook 3 x 4,5 en 3 x 6 m. |
| `/products/voetgewicht-easy-up-15-kg` | `/products/voetgewicht-partytent-15-kg` | Het is ook de add-on per staander van de buizenframe- en opslagtenten (menu: 'Voetgewicht per staander'). |

`catalog/export/redirects.csv` importeer je in Shopify via **Online Store › Navigatie › URL-omleidingen › Importeren**; het
seed-script maakt dezelfde omleidingen (`node scripts/seed/seed.mjs redirects`, docs/import-en-seed.md). `past_op`, add-ons, menu's, teksten en blogs verwijzen al naar de nieuwe handles.

### Beelden

- Nieuw gerenderd: de stretchhoes voor vierkante en rechthoekige statafels (zwart, wit, antraciet en 160 x 60), de plateaukar,
  de zijwand van de zeshoektent in rood en blauw, de vier nieuwe karren (leeg en gevuld), de twee nieuwe pakketten, de
  losgehaalde onderdelen en de beelden per uitvoering. De luifel van de promotietent in antraciet bestond al.
- Een product waarvan de render (nog) ontbreekt, staat zonder beeld in de export en nooit met een beeld in een andere kleur
  (`catalog/build.py` houdt ontbrekende bestanden tegen; `validate.py` meldt het).

## Catalogus: catalogusronde 2026-10-22 (bevindingen tegen de live-referentie)

Deze ronde legde de prijzen naast de live-gegevens van de referentie (18 oktober 2026, alleen getallen) en zette verzendkosten per
gewicht voor elk product. Alles staat als data in `catalog/tools/skeleton/*.py` (nieuw: `fam_r4.py`) en `catalog/parts/*.json`; elk product
heeft zijn eigen punten in `claims` (zoek op ‘Catalogusronde 2026-10-22’).

### Verzendkosten volgen het gewicht van de gekozen uitvoering

| Wat er nu staat | Wat je doet |
|---|---|
| Elk product met een uitvoering die met een paar stuks boven 31,5 kg komt, heeft eigen staffels in `custom.verzendkosten_staffel`: een set van 4 voetgewichten (60 kg) € 49, een dakzeil van 8 × 12 m (61 kg) € 49, een opblaasbare promotietent van 5 × 5 m (32 kg) € 49. Boven 31,5 kg gaat niets als pakket. | **Zet in Shopify dezelfde gewichtsafhankelijke tarieven** (pakket tot 31,5 kg € 6,95; daarboven de palletklassen). |
| De productpagina toont nu de verzendkosten van de gekozen uitvoering en het gekozen aantal ("Verzendkosten bij 3 stuks € 79,00 · vanaf 7 stuks € 129,00"); de regel ‘Pakketdienst / Palletvervoer’ volgt het gewicht van de uitvoering. | Niets; controleer na het instellen van de tarieven één zware uitvoering in de checkout. |
| Betonblokken van 120 en 140 kg: € 49 per stuk (was € 45, onder het palletminimum). Nieuwe blokken met vlaggenmastkoker: € 75 (500 kg) en € 135 (1000 kg) per stuk. | Bevestig de vrachtprijzen per blok. |

### Prijzen naar de live-referentie

| Product | Was | Nu | Referentie (live) |
|---|---|---|---|
| Palen stretchtent, kastanjehout 2,5 / 3 / 4 / 5 m | € 59,95 / 69,95 / 89,95 / 109 | € 25,95 / 30,95 / 43,95 / 70,95 (aluminium € 34,95 / 41,95 / 58,95 / 94,95) | hout € 29 / 35 / 49 / 79 |
| Stretchtent compleet 6 × 10,5 en 7,5 × 10,5 m; los stretchdoek 6 maten | € 5.195 / 6.195 | € 5.095 / 5.895; doek omhoog (bijv. 6 × 10,5 m € 4.095), zodat doek + palen + afspanning de tent niet onderbieden | tent € 5.805 / 6.830 |
| Flameheater 9 kW · loungeheater staand 9 kW · terrasheater 13 kW | € 329 · € 249 · € 179 | € 179 · € 149 · € 159 | flame 11 kW € 199 · lounge 11 kW € 169 · RVS 13 kW € 179 (antraciet € 149) |
| LED-vloedlicht easy-up 30 W | € 74,95 | € 119 | € 129 |
| Tuinpaviljoen staal (nu de zware lijn: staanders 120 × 120 mm, dak 8 mm) | € 519–719 | € 829 / 929 / 1.079 | stalen lijn € 925 / 1.039 / 1.204,50 |
| Zijwanden tuinpaviljoen dicht / gaas | € 119–159 / € 99–129 | € 70,95–88,95 / € 61,95–79,95 | € 79–99 / € 69–89 |
| Funderingsset tuinpaviljoen: betonpoeren / stelvoeten (per 4) | € 59,95 / 49,95 | € 119 / 44,95 | € 35 / 12,50 per stuk |
| Regengoot buizenframe 3–12 m | € 49,95–159 | € 52,95–88,95 | € 59–99 |
| Zijwand opblaasbare promotietent 3 / 4 / 5 / 6 m (dicht / overige) | € 159–269 | € 159/179 · 259/269 · 349/359 · 439/449; bedrukt € 229–489 | € 179/199 · 295 · 399 · 499 |
| Zijwand Pro 4 / 5 / 6 m | € 209–289 | € 269/279 · 359/369 · 449/459; bedrukt € 329–499 | € 299 / 399 / 499 |
| Zijwand zeshoektent 8 / 10 / 12 m | € 349–519 | € 599–699 · 729–849 · 849–979 | 8 m-wand € 699 |
| Dakzeil PVC 550 (18 maten) · PVC 620 · PE | 3 × 3 € 149 … 8 × 12 € 649 | 3 × 3 € 139 … 8 × 12 € 519 (PVC 620 ca. 15% hoger, PE € 79,95–159) | PVC € 159 … € 559 |
| Opslagtent PVC (alle maten) | 5–8% onder de partytent | gelijk aan de partytent in hetzelfde doek, binnen 5–15% onder de referentie | opslagtent € 399–1.699 |
| Eindwand / tussenwand / 220 cm | eindwand + € 5 / + € 10 | elk een eigen prijs (eindwand 8 m € 64,95: de referentie verkoopt de 8 m onder de 6 m) | € 49–119 |
| Prikkabel E27, 2 fittingen per meter; 60–90 m nieuw | 10 m € 62,95 … 40 m € 189 | 10 m € 69,95 … 100 m € 539; 60/70/80/90 m € 209/239/269/309 (1 per meter) | € 78,25 … € 247; € 237,50–345 |
| Easy-up full colour Professional · Premium | 3 × 3 € 949 · 4 × 8 € 1.749 · Premium 3 × 3 € 649 | € 829 · € 2.089 · € 559 (elke maat ca. 10% onder de referentie) | € 925 · € 2.325 · € 625 |
| Schaduwdoek waterdoorlatend / waterdicht | doorlatend onder waterdicht | doorlatend boven waterdicht, beide ca. 10% onder de referentie | € 39–79 |
| Wandunit afzetsysteem 2 m · afzetpaal zwart / messing | € 39,95 · € 49,95 / 54,95 | € 25,95 · € 33,95 / 46,95 | € 27,50–29 · € 37,50 / 52 |
| Overig (prijzen naar de referentie) | | reparatieset € 14,95/13,95 · PE-zijwand lang € 44,95–79,95 · los statafelblad 70 × 70 / 120 × 70 € 58,95/76,95 · kar 20 stapelstoelen € 389 · afstandsdimmer € 37,95 · tijdschakelaar € 6,95 · infraroodbrander € 13,95/18,95 · PE-rotan barkruk € 129 · dimbare IP65-lamp € 2,29/2,49 · kwartronde klaptafel 152 cm € 129 | |

**Te bevestigen:** alle nieuwe prijzen (eigenaar) en de specificaties van de stalen paviljoenlijn en de wandtypes (leverancier).

### Assortiment erbij

| Wat | Producten | Te bevestigen |
|---|---|---|
| Stoelen | stapelstoel kunststof (€ 24,95, 6 kleuren), transparante stoel polycarbonaat (€ 119), houten klapstoel bistro (€ 64,95), inklapbare barkruk met rugleuning (€ 62,95) | modellen, kleuren, stapelhoogtes, hoeveel er op de karren passen |
| Stoelverbinders | per stoelmodel (klapstoel € 0,79, stapelstoel metaal en banquet € 1,95, kunststof € 1,49, weddingstoel-reserve € 1,39), als add-on één per stoel op klapstoel, stapelstoelen en banquetstoel | passen per model; de shop noemt geen brandveiligheidsregel (vraag het na bij de locatie) |
| Ballast | hoes per blokmaat (€ 24,95–33,95), houten zitblad (€ 159), truss-voetplaat 6/10 mm (€ 89/119); betonblok met vlaggenmastkoker 500/1000 kg (€ 269/349) | maten, kokermaat en verloopringen |
| Klaptafels in vormen | halfrond Ø140 (€ 96,95), kwartrond 170/80 (€ 169), set van 4 kwartronden voor Ø 305 cm (€ 489) | maten |
| Wanden opblaasbare tenten | met raam, enkele rits en full colour bedrukt (drukproef, 10–15 werkdagen na akkoord, maatwerk: niet retour) op alle drie de wandproducten | leverbaarheid en drukprocedé |
| Easy-up 2 × 2 m | zijwandenset 2 × 2 m (€ 189), nu de wand-add-on van de Professional 2 × 2 m | samenstelling |
| Hoes biertafel 220 × 67 cm | eigen hoes (set € 24,95, tafel € 14,95) | maat |
| Barkruk houten zitting | frame ook wit en antraciet | leverbaarheid |

### Add-ons, opties en namen

- **Transportkar voor koelkasten** volgt nu het aantal (één kar per koelkast); hij ging 1 keer per bestelling mee.
- Geen beschermplaat meer als add-on op de HDPE-statafel en het HDPE-pakket (afwasbaar blad); geen klaptafelkar op de bankettafel van 220 cm.
- Opties met één waarde zijn weg: Kleur op de barkoelkast (zwart) en de koel- en vrieskist (wit), Uitvoering ‘Polyester’ op de Professional 2 × 2
  en 5 × 5 m. De kleur staat in de specificaties. `validate.py` meldt zo'n optie voortaan als fout.
- **Dakzeil PVC 620 en PVC 500 heten ‘(maakwerk, 3–4 weken)’** in plaats van ‘(op aanvraag)’: dat las als ‘prijs op aanvraag’ terwijl de
  prijs erbij staat.
- **Nieuwe handle:** `bierbank` (was `bierbank-220`; hij verkoopt 180 en 220 cm). De oude URL gaat via `export/redirects.csv` naar de nieuwe.
- **Korting op add-ons (−10% met je tent):** het label staat nu in het thema, maar **uit** (blok ‘Handig erbij’, vinkje ‘−10% met je tent bij de
  add-ons tonen’). Zet het pas aan als de automatische korting in Shopify bestaat.

### Downloads

91 van 228 producten hebben nu downloads (was 60): nieuwe opbouw- en veiligheidshandleidingen en productbladen voor de gasheaters en de
elektrische heater, de dakzeilen, de verankering (voetgewichten, zandzakken, watergewicht, spanbanden, stormbanden, haringen, betonblokken),
alle transportkarren en de statafelrokken, topcover, stretchhoes, hoes met strik en het statafelkleed. **Laat de veiligheidstekst van de
gasheaters nalezen tegen de handleiding van de fabrikant** (drukregelaar, afstanden, gasfles).

### Preview-voorraad

De demovoorraad in de preview is opnieuw verdeeld: 84% op voorraad, 8% laag (1–3), 7% in nabestelling. De CSV blijft 0 met doorverkopen.

## Catalogus: catalogusronde 4 (18 oktober 2026)

Deze ronde voegde 40 producten toe, gaf de buizenframe-tenten kleuren en maten zoals de referentie, zette verzendkosten per product en
liet losse onderdelen nooit goedkoper zijn dan het complete product. Alles staat als data in `catalog/tools/skeleton/*.py` en
`catalog/parts/*.json`. Elk product heeft zijn eigen punten in het veld `claims` (in `catalog/catalog.json` en `catalog/parts/*.json`). Hieronder staat wat je in één
keer moet bevestigen of instellen.

### Voorraad in de preview is demo, de CSV blijft 0

| Wat er nu staat | Wat je doet |
|---|---|
| De previewfixture (`catalog/preview-data.staging.json`, `meta.demo_stock: true`) heeft demovoorraad, zodat alle voorraadstanden te beoordelen zijn: de meeste varianten op voorraad, een paar laag (1–3), een paar in nabestelling (0). | Niets: dit is alleen voor de preview. |
| `export/products.csv` houdt **Inventory Qty 0** en beleid **continue** (doorverkopen). | **Jij zet de echte voorraad** in `catalog/stock.csv` (of in Shopify). Pas daarna toont de winkel 'Op voorraad'. |

### Verzendkosten per product (H11, met aantallen sinds catalogusronde 3)

De bedragen hangen af van het **gewicht van de zending** (aantal × gewicht per stuk), zoals gewichtsafhankelijke tarieven in Shopify werken.

| Klasse | Gewicht van de zending | Bedrag (incl. btw) | Waar |
|---|---|---|---|
| Pakket | tot 31,5 kg | € 6,95 (theme-instelling `shipping_cost_pakket`) | kleine producten, textiel, onderdelen |
| Groot pakket | tot 25 kg · tot 40 kg | € 19,95 · € 39,90 | statafels, terrastafels en klaptafels die als pakket gaan; daarboven pallet |
| Pallet | tot 150 / 400 / 700 / 1.000 kg | € 49 / € 79 / € 129 / € 175 | tenten, karren, koeling, tafels op pallet, pakketten |
| Meer pallets | tot 2.000 / 3.000 kg | € 350 / € 525 | grote aantallen; daarboven vracht op offerte |
| Betonblok, per stuk | — | € 45 (120/140 kg) · € 59 (240 kg) · € 75 (500 kg) · € 99 (750 kg) · € 135 (1000 kg), vanaf 4 stuks −15 % | `betonblok-ballast-tent` |

Voorbeelden: 1 statafel € 19,95, 2 statafels € 39,90, 3 tot 11 statafels € 49, 25 statafels € 79; 4 betonblokken van 1000 kg € 459; een
stretchtent 10,5 × 19,5 m € 129; een buizenframe-tent 8 × 12 m € 79. **Een pakket kost nooit minder verzending dan zijn zwaarste onderdeel
los**, in minstens dezelfde klasse (het starterspakket Premium gaat dus op een pallet zoals de tent van 3 × 4,5 en 3 × 6 m; 4 statafels met
rokken ook). Boven 31,5 kg gaat niets als pakket.

Ze staan in `custom.verzendkosten` (tekst, "vanaf") en `custom.verzendkosten_staffel` (per variant en aantal); het winkelwagen-overzicht
rekent per regel met het aantal. **Zet in Shopify per verzendprofiel dezelfde gewichtsafhankelijke tarieven** (Pakket, Groot pakket,
Pallet), anders klopt de productpagina niet met de checkout. Boven 3.000 kg per bestelling: een vrachtofferte.

### Korting op add-ons bij een tent (M1)

`custom.addon_korting` zet bij de tenten "−10 % met je tent" naast wanden, tassen en storm- en spanbanden. **Die korting bestaat pas als
je hem in Shopify maakt** (Kortingen › Koop X, krijg Y; zie de tabel 'Automatische kortingen bij add-ons' hierboven). Tot die tijd: zet
het blok uit in de theme-editor, of maak de korting eerst.

### Kleuren en maten

| Onderwerp | Wat er nu staat | Te bevestigen |
|---|---|---|
| Buizenframe-tenten (H1, H2) | PE Basis wit/groen-wit/blauw-wit; PVC 500 in 17 maten, wit + 6 tweekleurig; PVC 550 Premium 18 maten, 8 kleuren; compleet 6 maten, wit/grijs-wit/antraciet-wit; PVC 620 6 maten, wit/grijs-wit. 'Grijs-wit' = banen in grijs en wit, dak en wanden gelijk. | Leverbaarheid per kleur en maat; dat de banen op dak en wanden gelijk vallen. |
| Opslagtent | 16 maten (PVC 620: 6), wit, grijs, groen of zwart (PVC 620 wit/grijs); prijs 5–8 % onder de partytent in hetzelfde doek. | Kleuren en prijzen. |
| Wanden en daken in de tentkleur | Zijwand 1,5/2 m, wand uit één stuk, eindwand (ook PE), dakzeil in twee producten (PVC 550/620 en PE/PVC 500), in de kleuren van de tenten. | Leverbaarheid. |
| Stertent-wanden (B1) | In wit, zwart en zandkleur, zoals de tent. | Leverbaarheid. |
| Wanden opblaasbare tent (B2) | Standaard wand in de framekleur van de tent (8 kleuren + antraciet); de Pro heeft een eigen, hogere wand (250–270 cm), ook in de framekleur. | Hoogtes, kleuren en prijzen 209–289. |
| Statafel Professional (H3) | 9 bladdecors (+ € 10 steenlook, + € 15 houtlook en berken), onderstel zwart, wit of chroom (+ € 15, binnen). | Decors en toeslagen. |
| Biertafels (H7) | 180/220 cm × 50–80 cm, standaard, brouwerij en brouwerij met zwart onderstel; set 10–12 % onder tafel + 2 banken. | Prijzen en gewichten. |
| Prijsladder | Een grotere maat is nergens goedkoper dan een kleinere (validate.py waarschuwt). Daarvoor aangepast: PVC 500 3 × 6 / 4 × 6 / 4 × 8 / 5 × 6 m, PVC 550 5 × 6 / 5 × 10 / 6 × 10 m, easy-up Professional 4 × 6 m (€ 1.049 / € 1.239) en los frame 4 × 6 m (€ 869). | Of je de referentiedips liever volgt. |

### Losse onderdelen nooit goedkoper dan het geheel (standing item d)

- Buizenframe-tenten, opslagtent en nu ook de **stretchtent compleet** hebben per variant een stuklijst (`custom.stuklijst`). Bij de
  stretchtent: los doek, palenset, een spanband met ratel en een haring van 75 cm **per lus** (elke 75 cm), en bij de zware afspanning
  een touwenset en een ronde haring van 100 cm per paal. Het losse stretchdoek staat sinds catalogusronde 3 ca. 10 % onder de
  referentie (4,5 × 6 m € 1.895 tot 10,5 × 19,5 m € 12.445) en doek + palen + afspanning blijft boven de tent. Aluminium kost wat de aluminium palen meer kosten.
  **Bevestig de palensets, het aantal lussen en de afspanning met de leverancier.**
- Statafel: onderstel compleet € 56,95, zodat onderstel + los blad altijd ≥ de statafel is.
- Easy-up Professional: los frame 2 × 2 m € 469 en 3 × 6 m € 859, zodat frame + dak ≥ de tent is.
- `validate.py` controleert ook dat elke add-on past (`past_op` noemt het product, of beide passen op dezelfde basis) en dat een add-on
  zonder kleuroptie nooit op een tent van een andere kleur wordt aangeboden.

### Pakketten

- Nieuw: klaptafels per 10/20/30 met kar, 30 klapstoelen met kar, 15 of 30 barkrukken met kar, 26 weddingstoelen met kar, 10
  klapstoelen met stoelhoezen (€ 214,95: een prijs op ,95 omdat afronden op 9 hem 12,5 % onder los zou zetten). Buffetpakket ook met 25 tafels.
- De tabel 'Los of in het pakket' bouwt build.py bij elke build uit de bundeldata. De FAQ's noemen geen bedragen meer.

### Nieuwe producten (40)

Elke prijs, specificatie en capaciteit is een productdefinitie voor jou en de leverancier.

| Groep | Producten |
|---|---|
| Buizenframe | dakzeil PE en PVC 500, zijwand uit één stuk (3–10 m), buizen 38 mm (19 lengtes), regengoot met klemmen |
| Opblaasbaar, schaduw, tuin | zijwand voor de Pro, bevestigingsset RVS voor schaduwdoek, funderingsset tuinpaviljoen |
| Tafels en stoelen | ronde terrastafel, bankettafel rechthoekig en rond, klaptafels in vormen, conferentietafel, examentafel, weddingstoel, onderdelen biertafel en klaptafel |
| Textiel en print | easy-up Premium full colour (€ 649–€ 1.249, drukproef vooraf), stretch stoelhoes |
| Koeling (H10) | barkoelkast met glazen deur, koelkast staand, RVS-koelkast, koel- en vrieskist, flessenkoeler 1000 l, transportkar voor koeling. **We noemen geen energielabel of verbruik zonder datasheet.** Flesjes per inhoud zijn een richtlijn. |
| Evenement | afzetpaal voor koord, velours koord, wandhaken/wandunits/bordhouders, transportkar afzetpalen, tentvloer per meter, tapijttegel, verrijdbare kapstok + kar, tape voor loper en vloer, dwarsbuis halve zijwand |
| Licht | LED-lamp gekleurd of 2000 K per stuk, dimbare LED-lamp IP65 |

### Filters in Search & Discovery

De tagfilter is weg. Zet in **Search & Discovery** de filters op: beschikbaarheid, prijs, Maat, Kleur, Uitvoering, productsoort,
`custom.gebruik` ('Gebruik'), `custom.systeem` ('Past op') en `custom.bedrukbaar` ('Met jouw logo'). **Geef de booleaanse filter de
labels Ja / Nee** in de app; anders toont Shopify 'true' / 'false'.

### Verpakking (M15)

`custom.verpakt` geeft bij producten zonder bekende doosmaat de vorm en het gewicht ("Pakket · 1 doos · ca. 4,2 kg", "Vracht op pallet
(120 x 80 cm) · ca. 150 kg"). Het aantal colli is niet geschat. Vul doosmaten en colli aan zodra de leverancier ze geeft.

## Catalogus: catalogusronde 3 (18 oktober 2026, beoordeelde bevindingen)

Alles staat als data in `catalog/tools/skeleton/*.py` en `catalog/parts/*.json`; elk product heeft zijn eigen punten in `claims`.
`python3 catalog/validate.py` controleert de regels hieronder bij elke build.

### Prijzen terug in de band (5–15 % onder de referentie)

| Wat | Was | Nu |
|---|---|---|
| Zijwand easy-up polyester (dicht / raam / deur) | 2 m € 39,95 … 8 m € 109,95 (20–42 % onder) | 2 m € 59,95 / € 61,95 · 3 m € 61,95 / € 76,95 · 4 m € 79,95 / € 92,95 · 4,5 m € 83,95 / € 96,95 · 5 m € 89,95 / € 104,95 · 6 m € 96,95 / € 119 · 8 m € 129 / € 159 (deur = dicht, zoals bij de referentie) |
| Halve zijwand | 3 m € 34,95 … | 3 m € 43,95 · 4 m € 52,95 · 4,5 m € 53,95 · 5 m € 56,95 · 6 m € 62,95 · 8 m € 79,95 |
| Zijwand heavy duty PVC (dicht/deur · raam) | 4 m € 114,95, 8 m € 189 | 3 m € 99 / € 109 · 4 m € 139 / € 149 · 4,5 m € 149 / € 159 · 6 m € 179 / € 209 · 8 m € 259 / € 269 |
| Zijwandenset polyester | 4×4 € 229, 4×8 € 329 | 3×3 € 219 · 3×4,5 € 249 · 3×6 € 309 · 4×4 € 269 · 4×6 € 329 · 4×8 € 379 · 5×5 € 269 (de referentie zet 5×5 onder 4×4; wij houden de ladder) |
| Zijwandenset heavy duty PVC | 3×6 € 379 … 4×8 € 469 | 3×3 € 359 · 3×4,5 € 419 · 3×6 € 519 · 4×4 € 469 · 4×6 € 559 · 4×8 € 699 |
| Dakzeil easy-up | 2×2 € 79, HD 4×4 € 279 (+19 %), HD 4×6 € 379 | polyester 2×2 € 119 … 5×5 € 269; HD 3×3 € 199, 4×4 € 219, 4×6 € 469, 4×8 € 549 |
| Los frame Professional | 3×4,5 € 599, 5×5 € 999 | 3×3 € 529, 3×4,5 € 669, 4×4 € 629, 5×5 € 1.079 (frame + dak blijft boven de tent) |
| Easy-up Premium 3×6 / Professional HD 4×4 | € 449 / € 889 | € 435 / € 839 (zodat los frame + dak niet goedkoper is dan de tent) |
| Stretchtent compleet 10,5 × 10,5 / 12 / 15 / 19,5 | € 8.595 / 9.195 / 9.895 / 12.895 | € 8.295 / 8.995 / 10.595 / 13.795 |
| Stretchdoek los | 4,5×6 € 1.595 … 10,5×15 € 7.695 | 4,5×6 € 1.895 · 4,5×7,5 € 1.995 · 6×6 € 2.245 · 6×10,5 € 3.895 · 7,5×10,5 € 4.695 · 9×10,5 € 5.795 · 10,5×10,5 € 6.795 · 10,5×12 € 7.695 · 10,5×15 € 9.645 · 10,5×19,5 € 12.445 |
| Stretchdoek op maat | € 59,95 per m² | € 69,95 per m² (nooit goedkoper per m² dan een doek uit voorraad) |
| Conferentietafel | T € 149–209 onder U € 169–229 | U zwart € 149–199 · T zwart € 179–219 · T chroom (nieuw) € 229–279 |
| Betonblok | 120 kg € 99, 240 kg € 149, truss € 239 | 120 kg met vorkuitsparing € 119 · 140 kg € 109 · 240 kg € 169 · truss € 269 |
| PVC 550 Premium / compleet | compleet 2–5 % boven de referentie | Premium 4×4 € 495, 4×6 € 615, 4×8 € 745, 5×4 € 609, 5×10 € 959 · compleet € 509 / 624 / 765 / 965 |
| Klapstoel · kar 40 stapelstoelen | € 17,95 · € 449 | € 19,95 · € 499 |
| Prikkabel op maat | € 4,49 per meter voor elke afstand | per fittingafstand: 50 cm € 7,49 · 75 cm € 6,49 · 100 cm € 5,49 · 150 cm € 4,99 · 200 cm € 4,79 |
| Pendels prikkabel | 50 cm € 3,95 | 20 cm € 2,69 · 30 cm € 3,15 · 40 cm € 3,95 · 50 cm € 5,35 |
| Terrastafel inklapbaar | 60×60 € 89,95, 70×70 € 99,95, 120×70 € 199 | € 109 / € 119 / € 269, compact HPL + € 45 / € 80 |

### Nieuwe producten (16) en nieuwe uitvoeringen

| Groep | Wat |
|---|---|
| Bevestigingsmateriaal | spanband met ratel 9/13/15/20 m; oogbouten en schroefogen (ook met elastiek); klittenband zelfklevend 50 mm; zeilringen 12 mm met slaggereedschap; dakhaken; spanschroeven M6/M8; schroevenset; tentelastieken nu kort en lang, wit en zwart |
| Statafels | statafel breed stapelbaar 140 en 180 × 70 cm; design statafel marmerlook Ø70 (hoogglans of compact HPL, goud of zwart onderstel); design statafel HPL met zuilvoet (rond of vierkant, 6 decors, 3 onderstelkleuren); vierkante en terrastafel nu binnen (7 decors) of compact HPL buiten (12 decors); rechthoekige statafel 6 decors en 180 × 70 cm; wijnvat Ø100 cm |
| Barrels | barkruk wijnvat (€ 89); wijnvat-set nu met 4 wijnvat-krukken, Ø80 of Ø100 |
| Marktkraam | zwart frame, kap met kartelrand, kap in zwart; los dakzeil, rok, werkblad en transportkar voor 6 kramen |
| Overig | loper op rol 50 m; carport in wit, grijs of groen met haringen en spanbanden als add-on; hypar in 6 kleuren (zwart en rood + € 95–225); bedrukte stertentwanden (los of rondom); opblaasbare 3 × 3 m extra hoog (220 cm, + € 95; wanden en luifel passen alleen op de standaardhoogte) |

**Bevestig met de leverancier**: decors en toeslagen van compact HPL, het witte en zandkleurige onderstel, het verchroomde T-onderstel,
de vorkuitsparing op het blok van 120 kg, het kartelrand-dak en het zwarte marktkraamframe, alle maten en gewichten van de nieuwe producten.

### Kleurnamen

- 'Houtlook' bestaat niet meer: het eikendecor heet overal 'Eiken' (ook de cross back-stoel: beukenhout met eikenkleurige lak).
- Nieuwe decors: Betonlook, Wit marmer, Zwart marmer, Grijs eiken, Teak (staan in `swatch_colors`).
- Geen merkkleurnaam (Lampion, Klaproos, Inkt, Zand, Linnen, …) als productkleur, SKU, bestandsnaam of alt-tekst: `validate.py` controleert het.

### Downloads (M16)

60 van 222 producten hebben nu een download (was 31): productbladen voor zijwanden, wandensets, buizenframe-wanden, stertentwanden en alle
statafels, en een **opbouw- en veiligheidshandleiding** voor dezelfde wanden en statafels (`node catalog/tools/productblad.mjs
--handleidingen`). De handleidingen geven algemene aanwijzingen; laat ze nalezen voordat ze bij een evenement met publiek gebruikt worden.

### Te beslissen door jou

- **Loper op rol 50 m (€ 359)** staat 18 % onder de referentie (€ 439) omdat hij gelijk is aan 50 m per meter met staffel. Jij kiest: zo laten, of de 50 m-staffel van de loper per meter verlagen en de rol duurder maken.
- **Tuinpaviljoen 'Staal'** staat bij ons onder Aluminium (€ 519–719), terwijl de stalen lijn van de referentie hun premiumlijn is (3×3 € 925). Vraag de leverancier of ons staal de lichte of de zware uitvoering is en prijs het daarna.
- **Carport 3,3 × 9,6 m (€ 989)** staat boven de actieprijs van de referentie (€ 750, normaal € 1.099).
- **Statafelrok bij een statafel**: de add-on volgt de bladkleur (wit bij wit, anders zwart). Een andere van de 24 kleuren kies je op de rokpagina; een kleurkeuze in de add-on staat op de theme-backlog.

## Catalogus: catalogusronde 5 (22 oktober 2026, beoordeelde bevindingen)

Alles hieronder is een voorstel voor jou en de leverancier. Specificaties zijn productdefinities; prijzen liggen ca. 5–15 % onder de live-referentie
(Outmate en Statafelshop, opname 18 oktober 2026) tenzij anders vermeld. `python3 catalog/validate.py` draait schoon.

### Verwijzingen naar Shopify: het seed-script (nieuw)

De add-ons per variant, de pakketinhoud en "Je bespaart", de maatwissel tussen de easy-ups, de bouwtekening, onderdelen, maatgids en downloads staan niet in
`products.csv`: die hebben de ID's nodig die Shopify pas na de import geeft. `node scripts/seed/seed.mjs` zet ze via de Admin API, samen met collecties,
menu's, pagina's, blog en redirects. Volgorde en rechten: `docs/import-en-seed.md`. Te doen door jou: een eigen app met Admin API-token aanmaken en het script
draaien (eerst `--dry-run`).

### Nieuwe producten (15)

| Product | Prijs | Te bevestigen |
|---|---|---|
| Zijwand opblaasbare partytent met waterpoten (3 / 4,5 / 6 m, 220 cm hoog, wit, zwart, antraciet; dicht, raam, deur, rits of full colour, drukzijde binnen of buiten) | dicht € 179 / 299 / 459, raam/deur/rits € 199 / 309 / 469, full colour € 229 / 349 / 499 | Hoogte en pasvorm op de waterpoten-tent; de tent biedt nu de wand voor de lange zijde aan (4,5 m bij 3 x 4,5, 6 m bij 3 x 6). De gewone zijwand is alleen nog voor de promotietent (190 cm) en niet meer in antraciet. |
| Terrastafel vierkant stapelbaar (60/70/80 cm, 75 cm hoog, onderstel zwart, RVS of wit) | € 129 / 139 / 149 binnen zwart; RVS + € 30, compact HPL + € 55 | Stapelhoogte (tot 6), gewichten, RVS en wit onderstel. |
| Terrastafel breed stapelbaar (120 x 60, 120 x 70, 140 x 70, 180 x 70 cm) | € 229 / 249 / 289 / 349; compact HPL + € 80 / 90 / 110 | Maten en stapelbaarheid. |
| Terrastafel HPL met zuilvoet (Ø70 of 70 x 70 cm) | € 169 / 179, decor + € 10 | Zelfde zuil en voetplaat als de statafel. |
| Wiebelvrije terrastafel en statafel (zelfstellende voeten, 75 of 110 cm) | terras € 229–259, sta + € 40 | Werking en bereik (ca. 15 mm per voet) van het onderstel. |
| Steekwagen voor stapelstoelen | € 109 | Capaciteit (ca. 12 stoelen, 150 kg). |
| Transportkar universeel (enkel / dubbel) | € 369 / € 479 | Beugelhoogte en draagvermogen. |
| Klaptafel met banken, rolbaar 200 x 60 cm | € 859 | Werking met gasveren, gewicht 62 kg. |
| Onderdelen voor stoelen en barkrukken (zittingen, beugels, voetdoppen per model) | € 2,49–€ 20,95 | Pasvorm per model. |
| Luxe afzetpaal gala en galerie (zwart, goud, chroom) | € 82,95–€ 94,95 | Voet en of ze in de afzetpalenkar passen. |
| Bevestigingspennen voor loper, 25 stuks | € 10,95 | — |
| 20 stapelstoelen met kar · 50 klapstoelen met kar (nieuwe kar voor 50 klapstoelen, € 369) · 10 biertafels zonder banken met kar · buffettafel met stretchhoes | ca. 10 % onder los | Kar voor 50 klapstoelen. |

### Uitbreidingen van bestaande producten

- **Stertent dubbele mast** ook in **Zwart** (alle vier maten, zelfde prijs), met zwarte wanden; add-ons per kleur.
- **Bedrukte easy-ups in heavy duty PVC**: de Professional full colour (3 x 3 tot 4 x 8 m, € 1.079–€ 2.799, met 3 wanden € 1.759–€ 3.819) en met logo op de
  luifel (wit of zwart, HD-tent + € 150). Bij de full colour tent is het doek nu de optie Uitvoering en wat er bedrukt wordt de optie Samenstelling.
  **Bevestigen met de drukker dat HD PVC full colour bedrukt kan worden.**
- **Bedrukt dakzeil** in heavy duty PVC (€ 999–€ 2.529), en de polyester prijzen opnieuw ca. 10 % onder de referentie (€ 539–€ 1.499, was € 319–€ 729): met de
  oude prijzen was een los frame + bedrukt dak goedkoper dan de full colour tent (Premium alle maten, Professional 3 x 4,5, 4 x 6, 4 x 8). `validate.py` controleert dat nu.
- **Stormbandenset**: haringen 50, 75 of 100 cm en 1, 2 of 3 sets; prijzen terug in de band (75 cm, 3 m breed € 31,95, was € 25,95).
- **Beschermhoes easy-up** per dakdoek (polyester of PVC-dak, PVC + € 1). **Verbindingsstrook** in de 7 tentkleuren. **Halve zijwand** ook in heavy duty PVC
  (3 / 4 / 4,5 m, wit of zwart). **Lopers** ook in roze, bordeaux en zandkleur. **Afzetpaal met trekband** ook als set van 2 en met magneetsluiting.
- **Prikkabel E27**: eindkap, eindhaak met spanveer (nieuw onderdeel, € 4,95) en bij zwart een verlengkabel van 5 m als opties onder de knop.
- **Statafels met transportkar (pakket)**: naast rok en beschermplaat nu ook een hoes met strik per tafel als optie.

### Prijzen aangepast

| Product | Was | Nu | Waarom |
|---|---|---|---|
| Klaptafel HDPE 122 x 61 cm | € 59,95 | € 67,95 | 20–30 % onder de marktbodem (€ 74,96 / € 85,50) |
| Transportkar afzetpalen 12 / 16 | € 649 / € 829 | € 779 / € 869 | 18–30 % onder de referentie (€ 922,50 / € 1.010,50) |
| Opbergtassenset 5 / 6 / 8 m breed | € 69,95 / 79,95 / 94,95 | € 79,95 / 89,95 / 104,95 | 19–21 % onder de referentie (€ 89 / € 99) |
| Stertent full colour Ø16 m | € 2.649 | € 2.949 | 19 % onder € 3.278 |
| Stertent dubbele mast full colour 8x13 / 10x16 / 12x19 / 13x21 | € 3.899 / 4.549 / 5.149 / 5.649 | € 4.699 / 5.619 / 6.069 / 6.479 | 22–27 % onder € 5.225–€ 7.200 |
| Eindwand 8 m | € 64,95 | € 94,95 | lag onder de 6 m (€ 79,95), een eigenaardigheid uit de referentielijst; meer doek en een hogere gevel |
| Statafel vierkant stapelbaar 60 / 70 / 80 cm | € 119 / 129 / 139 | € 139 / 149 / 159 | 13–20 % onder Indus € 148,77 en Times Square € 159; de terrastafel-tweeling ligt € 10 lager |

### Specificaties gelijkgetrokken met de keuze

- **Barkruk stapelbaar metaal**: de specificatie Kleur noemt nu alle 7 kleuren uit de keuze (zwart, wit, antraciet, rood, blauw, groen, taupe). **Bevestig dat
  de leverancier rood, blauw, groen en taupe levert**; anders halen we die uit de keuze. Deze kruk staat als standaard-add-on (4 stuks) bij elke ronde statafel.
- **Stretchhoes vierkante en rechthoekige statafel**: specificatie, USP en SEO noemen nu de 10 kleuren uit de keuze, en de maten 140 x 70 en 180 x 70 cm.
  **Bevestig de 10 kleuren per maat.**

### Kleuren die de referentie niet voert (eigenaarsactie, geen datafout)

Onze kleurkeuze gaat op een paar plekken verder dan wat de referentie op voorraad heeft. De producten zeggen al "leverbaarheid per kleur en maat bevestigen";
bevestig ze met de leverancier vóór de lancering, of haal de kleur uit de keuze:

- **Buizenframe-tenten** (PE Basis, PVC 500 Comfort, PVC 550 Premium en Compleet, PVC 620 Professional) en hun dakzeilen en wanden: elke maat in 7–8
  kleurstellingen, waar Outmate per maat 1–5 voert (bijvoorbeeld Classic 6 x 12 alleen in wit en grijs/wit).
- **Stretchtenten** in wit en zwart (de referentie voert alleen taupe en zandkleur).
- **Hypar schaduwzeil** in 6 kleuren.
- Nieuw in deze ronde: stertent dubbele mast in zwart, verbindingsstrook in 7 kleuren, lopers in roze, bordeaux en zandkleur.
