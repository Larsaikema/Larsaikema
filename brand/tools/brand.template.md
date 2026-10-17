# Klapklaar · merkboek

Versie 7 · 17 oktober 2026

Dit merkboek is voor iedereen die met het merk werkt: eigenaar, ontwerper, copywriter, drukker en theme-bouwer. Hier staan de
regels en de reden erachter. Het visuele overzicht staat in [`brand-sheet.html`](brand-sheet.html) (screenshot `brand-sheet.png`).
Maten per productiemethode, kleur- en garenreferenties, bestanden, de overdracht aan de Shopify-theme, de logotest en het
herbouwen staan in [`technisch.md`](technisch.md). Alle waarden staan machineleesbaar in [`tokens.json`](tokens.json).

> **Vóór registratie, druk of bestelling** doet de eigenaar drie controles die vanuit de bouwomgeving niet konden: de naam toetsen
> (KvK, BOIP/EUIPO, SIDN, DNS Belgium), het merk naast Outmate en Statafelshop leggen, en het logo met 20 mensen testen. Checklists en
> beslisregels: §12.

## In één oogopslag

| | |
|---|---|
| **Naam** | Klapklaar |
| **Belofte** | Je kiest je maat, wij zorgen dat het klaarstaat. |
| **Tagline** | In één klap feestklaar. |
| **Logo** | KLAPKLAAR in getekende kapitalen. De tweede A van ‘klaar’ is een partytent: steil dak met een punt, een luifel met schulpen op de hoogte van de A-dwarsbalk, twee dunne palen. |
| **Beeldmerk** | Dezelfde tent-A, los. Lampion op Inkt of Inkt op Lampion. |
| **Kleur** | Lampion (oranje) is het merk en de koopknop. Inkt is tekst en de hoofdknop voor de rest. Zand, Wit en Linnen zijn de vlakken. Zon = voordeel, Polder = klaar, Oker = wachten, Bordeaux = fout. |
| **Letter** | Figtree voor alles (`figtree_n4` tekst, `figtree_n8` koppen, `figtree_n9` campagne). Logo en lock-up-teksten zijn getekend. |
| **Toon** | Je en jij. Nuchter. Eerst het antwoord, dan de uitleg. Hooguit één knipoog per scherm. |
| **Beeld** | Fotorealistische productrenders op Linnen, in de echte stockkleuren; later echte foto’s van opbouw en gebruik |

### Wat er in versie 7 veranderde (kritiek op v6)

| Kritiek | Wat v7 doet |
|---|---|
| De tent-A las als een portiek of bank-icoon (laag fronton, dikke balk, twee zuilen); klein een ‘n met een hoedje’ | Nieuwe tent: steil dak ({{PITCH}}°) met een punt, geen dakrand, een luifel met schulpen, palen van {{POLE_RATIO}} × de stok die iets binnen de luifel staan (§3.1–3.2) |
| De luifel lag hoger dan de dwarsbalk van de gewone A, dus de twee A’s leken verschillende letters | Bovenkant luifel = bovenkant dwarsbalk, onderkant schulpen = onderkant dwarsbalk (§3.2) |
| De punt van de tent lag precies op de kapitaalhoogte en leek lager dan K, L, P en R | De piek steekt {{PEAK_OVER}} eenheden ({{PEAK_PCT}} %) boven de kapitaalhoogte uit |
| P–K was het grootste gat; het logo las ‘KLAP KLAAR’ | Letterafstand per paar op het oog; P–K is nu kleiner dan K–LA (§3.2) |
| De Klaproos-tent op Inkt haalde maar 3,04:1 en verdween in de footer | Lampion haalt 4,68:1 op Inkt en 3,15:1 op Zand |
| Klaproos en het rood van de tenten lagen 8° hue uit elkaar bij gelijke lichtheid: het leek een vergissing | Merkkleur naar oranje: ΔE<sub>00</sub> {{DE_RENDER}} van het tentrood, en geen easy-up-kleur van de leverancier is oranje (§4.2) |
| Inkt had te veel taken; vier gevulde Inkt-blokken op de productpagina | De koopknop is Lampion en alleen hij; chips, btw-schakelaar en badges zijn licht (§4.3) |
| ZAKELIJK en de luifelbalk stonden in Barlow Condensed, bijna-gelijk aan het logo | Die teksten zijn met de logoletters getekend; Barlow Condensed is weg (§5) |
| Sectienummers in 14 px Klaproos, verzendlabel in volle kleur, stippelrand met twee betekenissen | Sheet volgt de eigen regels: geen merkkleur als tekst, label zwart, stippelrand alleen voor uploaden |
| Garen-, flex/flock-, Pantone U-referenties ontbraken; Polder en Zon op textiel niet vastgelegd | technisch.md §4: Pantone C/U/TCX, Madeira, Isacord, Gunold voor alle vijf drukkleuren; flex/flock: procedure (geen open data gevonden) |
| Bus en doos waren platte schema’s | 3D-renders van bus, doos en draagtas (§11) |
| Tent-icoon was een portiek, statafel-icoon een I-balk | Nieuwe iconen (§9) |
| Vergelijking met Outmate en Statafelshop leeg | Gevuld waar bronnen zijn (naam, productnamen, claims, toon); logo en kleur van beide nog niet vastgesteld (§12.2) |

---

## 1. Naam en betekenis

**Klapklaar** (klapklaar.nl, klapklaar.be en @klapklaar; beschikbaarheid nog niet gecontroleerd, §12).
Tagline: **In één klap feestklaar.**

| Laag | Betekenis | Waarom het werkt |
|---|---|---|
| **klap** | uitklappen | Een easy-up en een klapstatafel zet je in één beweging neer. Het woord doet wat het product doet. |
| **in één klap** | in één keer | Tent, statafels, rokken, verlichting en meubilair komen uit één winkel, in één bestelling, voor particulier en zakelijk. |
| **klaar** | gereed, ‘klaar is Kees’ | Past bij de nuchtere toon. De naam gaat over klaar zijn en niet over één product, dus hij dekt het hele assortiment. |

Negen letters, twee lettergrepen, en je schrijft het zoals je het zegt. Er zit geen Engelse ‘-mate’ in en geen generieke ‘-shop’.

**Bekende risico’s en hoe we ermee omgaan**

- ‘Klap’ betekent ook een klap, of iets dat in elkaar klapt. Dat is precies waar mensen bang voor zijn bij goedkope easy-ups in de
  wind. Gebruik ‘klap’ daarom nooit bij wind, storm, stevigheid of garantie; daar spreken de specificaties (staal of aluminium,
  buisdikte, gewichten, haringen).
- Bij de samenstelling maken mensen makkelijk typefouten (klapklar, klap-klaar). Registreer die domeinen mee (§12).
- Als woordmerk voor tenten (klasse 22) en klaptafels (klasse 20) kan ‘klapklaar’ als beschrijvend gezien worden. Het beschermbare
  deel is het beeld: de getekende tent-A in het logo en als beeldmerk (§12.4).

## 2. Positionering, doelgroepen en merkbelofte

**Positionering.** Klapklaar is de nuchtere Nederlandse webshop voor alles waarmee je een feest of evenement opbouwt: easy-up-,
stretch-, opblaasbare en stertenten, statafels met rokken en hoezen, verlichting, meubilair en accessoires. Alles is ook te
krijgen met je eigen logo erop. We verkopen aan particulieren en aan bedrijven, in één winkel met twee routes.

**Waarin we verschillen**

1. **Maat en specificatie eerst.** Op elke kaart en elke productpagina staan eerst de maat, het materiaal, het gewicht en de
   levertijd, en pas daarna de sfeer. Bij twijfel helpt een maatgids die het voor je uitrekent.
2. **Eén keer bestellen.** Tent, tafel, rok, verlichting en haringen komen in één winkelwagen, en we wijzen je op wat erbij hoort.
3. **Zakelijk is een volwaardige route.** Prijzen excl. btw, staffels, offertes, een drukproef vóór productie en betalen op
   factuur [claim]. Dat is geen contactformulier achteraf.
4. **Eerlijk.** We verzinnen niets: geen sterren zonder reviews, geen ‘nr. 1’, geen nepvoorraad.

| Doelgroep | Wie | Wat ze nodig hebben | Waar het merk dat laat zien |
|---|---|---|---|
| **Consument** | tuinfeest, verjaardag, bruiloft, buurtfeest, markt | snel kiezen, de juiste maat, weten wanneer het komt, makkelijk opzetten | maatgids, specregel op elke kaart, voorraadstatus, opzetuitleg |
| **Vereniging en school** | sportclub, carnaval, schoolfeest | budget, meerdere stuks, logo erop, factuur | staffelprijzen, ‘Met jouw logo’, betalen op factuur [claim] |
| **Horeca** | terras, festivalbar, catering | stevig, uniform, snel nabestellen | Professional-lijn, vaste kleuren, nabestellen via het account |
| **Eventbureau en verhuur** | tientallen tenten en tafels, eigen bedrukking | prijs excl. btw, offerte, drukproef, levering op locatie | Klapklaar Zakelijk (§6), offerteflow, staffeltabellen |

**Merkbelofte: _Je kiest je maat, wij zorgen dat het klaarstaat._** Daar horen drie bewijzen bij:

- elke productpagina noemt maat, materiaal, gewicht en levertijd;
- elke bedrukking begint met een drukproef ter akkoord;
- elke zakelijke vraag krijgt een offerte op maat.

Levertijden, betaalvormen en reactietijden zijn claims die de eigenaar zelf invult en bevestigt (§13).

**Wat we niet zijn:** niet de schreeuwerige goedkoopste, niet ‘nr. 1’, en niet hip om het hip zijn.

---

## 3. Logo

### 3.1 Het idee

**KLAPKLAAR**, in stevige getekende kapitalen. De tweede A van ‘klaar’ is een partytent van voren gezien. De eerste A is dicht, de
tweede staat uitgeklapt: zo lees je KLAAR en zie je wat er gebeurt.

- **Een partytent, geen gebouw.** Het dak is steil ({{PITCH}}°) en loopt uit in een punt, met de randen een fractie naar binnen
  gebogen zoals gespannen doek. Er is geen dakrand en geen balk: het doek loopt door in de luifel. De luifel heeft schulpen tussen
  de palen. De palen zijn dun ({{POLE_RATIO}} × de stok van de letters) en staan 18 eenheden binnen de luifelhoeken, zodat je ziet
  dat het doek over het frame hangt. Alles wat een fronton, een architraaf of een zuil zou maken (laag dak, vlakke balk, dikke
  poten) is weg.
- **Twee keer dezelfde letter.** De bovenkant van de luifel ligt precies op de bovenkant van de dwarsbalk van de gewone A, en de
  punten van de schulpen precies op de onderkant ervan. Het oog leest de luifel dus als de dwarsbalk van een A.
- **Optisch gecorrigeerd.** De punt steekt {{PEAK_OVER}} eenheden ({{PEAK_PCT}} %) boven de kapitaalhoogte uit, zoals bij elke puntige
  letter; anders lijkt de tent lager dan de vlakke K, L, P en R.
- **Eén woord.** De letterafstand is per paar op het oog gezet (§3.2). P–K is het kleinste gat na A–tent en tent–R, zodat er geen
  breuk tussen KLAP en KLAAR ontstaat.
- **L en A haken in elkaar.** De voet van de L loopt over in het been van de A (in KLAP en in KLAAR). Dat sluit het gat dat LA
  normaal geeft, en het is een detail dat niemand kan natypen.
- **Getekend, niet getypt.** Geen enkele letter komt uit een font, ook niet de teksten in de lock-ups (§3.8). Wie ‘KLAPKLAAR’ typt,
  in welke letter ook, krijgt dit logo niet.

### 3.2 Constructie (gemeten)

Eenheden: kapitaalhoogte {{CAP}}. Alle waarden zijn gemeten uit de getekende contouren (`tools/kkgeo.py`, `tools/logo-meta.json`).

{{T_STROKES}}

{{T_ANGLES}}

**De tent naast de gewone A**

{{T_TENT}}

**Letterafstanden.** ‘Kortste afstand’ is de kleinste ruimte tussen de contouren; ‘wit per regel’ is de gemiddelde witruimte per
scanregel, waarbij wit dieper dan 210 eenheden in een letter niet meetelt. Vormen die openvallen (de wig van de K, de schuine A, het
dak en de ingesprongen palen van de tent, het wit onder de P-boog) staan dichter op hun buur dan twee rechte stokken.

{{T_GAPS}}

Breedte/hoogte van logo.svg: {{ASPECT}}.

### 3.3 Versies

| Versie | Bestand | Waar |
|---|---|---|
| **Standaard** | `logo.svg` (Inkt-letters, Lampion-tent) | op Zand en Wit |
| **Op donker** | `logo-inverse.svg` (Zand-letters, Lampion-tent) | op Inkt |
| **Op Lampion** | `svg/logo-on-lampion.svg` (één kleur Inkt) | op een Lampion-band |
| **Eén kleur** | `svg/logo-mono.svg` (`currentColor`), `svg/print-wordmark.svg` (zwart = drukkleur) | op Linnen, foto, stempel, gravure, doek, folie |
| **Klein** | `svg/logo-klein*.svg` (meer letterruimte, palen 86, twee schulpen) | 96–159 px op scherm, klein borduur- en flockwerk |
| **Luifel** | `svg/logo-luifel.svg`, `svg/logo-luifel-inverse.svg`, `svg/print-luifel.svg` (met de balk ‘PARTYTENTEN · STATAFELS’) | luifel, bus, marktplaatstegel, beursstand, doos |
| **Zakelijk** | `svg/logo-zakelijk.svg`, `svg/logo-zakelijk-inverse.svg` (één kleur, label ‘ZAKELIJK’) | offertes, facturen, Zakelijk-pagina’s |
| **Beeldmerk** | `mark.svg` (Lampion op Inkt), `svg/mark-lampion.svg`, `svg/mark-zand.svg`, `svg/mark-symbool.svg`, `svg/mark-mono.svg`, `svg/mark-klein.svg` | avatar, app-icoon, statafelrok, sticker |
| **Favicon** | eigen tekeningen voor 16 en 32 px | browsertab (§3.7) |

### 3.4 Welke versie bij welke maat

| Op scherm | Versie |
|---|---|
| {{SWITCH_P}} | `logo.svg` |
| {{SWITCH_K}} | `logo-klein` |
| kleiner | het beeldmerk (vanaf 40 px; 24–39 px `mark-klein`) of het favicon |

Onder 160 px worden drie schulpen van 40 eenheden kleiner dan 1,3 px en vloeien ze samen, en een paal van 70 wordt dunner dan
2,2 px; logo-klein heeft twee bredere schulpen, palen van 86 en 34 eenheden extra ruimte en houdt het tot 96 px.

**In de theme-header:** desktop {{HEADER_D}}; mobiel (390 px) {{HEADER_M}}. De letters volgen de tekstkleur van het
kleurschema; de tent is Lampion (§3.6).

**Op doek en drukwerk** bepalen de dunste vorm (luifelband en palen) en de kleinste opening de minimummaat. Vuistregels: borduren
van logo.svg vanaf {{EMB_P}} mm breed, `logo-klein` vanaf {{EMB_K}} mm, het beeldmerk vanaf {{EMB_M}} mm. Sublimatie op luifel of rok
vanaf {{SUB_P}} mm. De volledige tabel per methode staat in technisch.md §3. Het zijn werkaannames: leg ze voor aan je borduurder of
drukker.

### 3.5 Vrije ruimte

Houd rondom het logo minstens **de halve letterhoogte** vrij, gemeten vanaf de buitenkant van letters en tent. Op scherm
nooit minder dan 12 px. Bij het beeldmerk is het vlak zelf de vrije ruimte; rond het vlak een kwart van zijn breedte.

### 3.6 Kleur van het logo

| Achtergrond | Letters | Tent |
|---|---|---|
| Zand, Wit | Inkt | Lampion |
| Inkt | Zand | Lampion |
| Lampion | Inkt | Inkt (één kleur) |
| Linnen, foto | Inkt | Inkt (één kleur: Lampion op Linnen is 2,68:1, te zwak) |
| Zakelijk, offerte, factuur | Inkt | Inkt (één kleur, met label ZAKELIJK) |
| Doek, folie, borduursel, karton | de drukkleur | de drukkleur |

De tent is altijd Lampion of de kleur van de letters. Nooit Zon, Polder, rood of een verloop.

### 3.7 Beeldmerk en favicon

Het **beeldmerk** is de tent-A los, precies zoals in het woord. Wie het logo kent, kent het teken; en omdat het één dichte vorm
zonder losse delen is, blijft het ook op de bolling van een stretchrok een tent. Gebruik het als Lampion-tent op een Inkt-vlak
(`mark.svg`), Inkt-tent op een Lampion-vlak (`svg/mark-lampion.svg`), Lampion-tent op Zand (`svg/mark-zand.svg`) of zonder vlak
(`svg/mark-symbool.svg`, `svg/mark-mono.svg`, `svg/print-mark.svg`). Onder 40 px: `svg/mark-klein.svg` met palen van 96 en twee
schulpen.

Het **favicon** is geen verkleind logo, maar een eigen tekening op het pixelraster, zwaarder dan het beeldmerk:

- **32 px:** dak met punt (55°), een luifel van 2,5 px met twee schulpen, palen van 3 px;
- **16 px:** dak, een luifel van 1,5 px met één schulp, palen van 2 px;
- **winkelwagen gevuld:** een Zand-stip met een Inkt-ring rechtsboven.

In de theme komen alleen PNG’s; zie technisch.md §6.

### 3.8 Lock-ups en tekst bij het logo

- **Luifel:** het woordmerk boven een Lampion-balk met ‘PARTYTENTEN · STATAFELS’ in Inkt. De descriptor is getekend met dezelfde
  stok, balk, diagonaal en buishoek als het logo (`tools/kkgeo.py`: Z, E, I, J, T, N, S, F, Y, punt en plus). Voor wie het merk nog
  niet kent: op een luifel, bus of marktplaatstegel zegt de balk wat we verkopen.
- **Zakelijk:** het woordmerk in één kleur met een Inkt-label ‘ZAKELIJK’ op volle letterhoogte, de letters uitgespaard.
- Andere tekst staat **nooit** direct tegen het logo. De tagline mag als zin in koppen en tekst, op minstens de vrije ruimte.

### 3.9 Op tent, rok, bus en doos

- **Eén kleur.** Op doek, folie en karton is het logo één kleur: Zand of wit op rood en zwart doek, Inkt of zwart op wit doek, Inkt
  op kraft.
- **Luifel:** `svg/print-wordmark.svg`, gecentreerd op alle vier de zijden. De letterhoogte is 50–60 % van de luifelhoogte, en
  het woordmerk is nooit breder dan de helft van een zijde. Bij een luifel van 21 cm hoog: letterhoogte 11–12 cm, het woordmerk
  wordt dan ongeveer 85 cm breed (28 % van een zijde van 3 m). Een telefoonnummer of website hoort op de zijwand, niet op de luifel.
- **Statafelrok (stretch):** het beeldmerk (`svg/print-mark.svg`), 13 cm breed bij Ø 80 cm, met het midden op 28–30 cm boven de
  vloer, op het vlakste stuk tussen twee voeten. In een plooi of op een voet knikt de stretch het beeld (render:
  `img/statafelrok-stretch-zwart-print-hero.webp`).
- **Borduren:** logo.svg vanaf {{EMB_P}} mm, `print-wordmark-klein.svg` vanaf {{EMB_K}} mm, het beeldmerk vanaf {{EMB_M}} mm.
  Garenkleuren: technisch.md §4.
- **Bestelbus:** geprinte wrap-folie (de merkkleuren kloppen dan): `svg/logo-luifel.svg` op de zijkant, ongeveer 1/3 van de hoogte
  van de laadruimte, en een Lampion-plint van 20–30 cm langs de onderkant. Achterdeuren: alleen het beeldmerk, de website en het
  telefoonnummer (render: `img/app-bestelbus.webp`).
- **Doos:** `svg/print-luifel.svg` in Inkt (flexo) op de lange zijden, het beeldmerk op de kopse kanten, papiertape met het
  woordmerk in Inkt (render: `img/app-verpakking.webp`).

### 3.10 Niet doen

Het logo niet uitrekken, smaller maken, draaien, omlijnen, van een schaduw of verloop voorzien, of in een font naschrijven. Geen
andere A als tent, geen tweede tent, geen vlag of paal op het dak. De tent niet in een andere kleur dan Lampion of de lettertint.
Geen tekst tegen het logo, behalve de twee lock-ups. Niet op een drukke foto zonder vlak.

### 3.11 Leest het als een tent? Silhouettoets en mensentest

De kritiek op v6 was dat de tent-A klein las als het ‘bank/museum’-icoon. Een grove meting (`tools/recognition.py`): het silhouet
zwart op wit, ingepast in een vierkant, vergeleken met een generiek landmark-pictogram (fronton, balk, vier zuilen, voet) en een
generiek huis (dak, muren, deur), beide zelf getekend naar de gangbare vorm. IoU = overlap van de vlakken (1 = gelijk).

{{T_RECOG}}

Op 32 px zakt de overlap met het landmark-icoon van {{REC_L32_6}} (v6) naar {{REC_L32_7}} (v7); met het huis van {{REC_H32_6}} naar {{REC_H32_7}}.
Een driehoek met een gevuld vlak eronder blijft deels op een huis lijken: deze maat ziet het verschil tussen open palen en dichte
muren maar half. Daarom telt de **mensentest**: 20 mensen, 5 seconden per beeld, op 16, 32 en 132 px, gemengd met het landmark- en
huisicoon. Protocol, beslisregel en formulier: technisch.md §10. **Nog niet gedaan.**

---

## 4. Kleur

### 4.1 Palet: elf kleuren, één betekenis

{{T_PALETTE}}

**Hover-tinten** zijn regels, geen extra kleuren: {{T_DERIVED}}. De koopknop krijgt bij hover geen andere kleur maar een Inkt-rand
van 2 px.

### 4.2 Regels

- **Lampion is het merk en de aankoop.** Het logo, de luifelbalk bovenaan elke pagina, campagnebanden, de vlaggenlijn en de
  luifelstreep onder één woord van een grote kop. In de winkel is Lampion **alleen** de koopknop (‘In mijn winkelwagen’, ‘Naar
  winkelwagen’, ‘Afrekenen’) en de teller op de winkelwagen: oranje betekent ‘jouw aankoop’. Op een productpagina is de koopknop het
  enige gevulde Lampion-vlak. Lampion is nooit tekst, nooit een status, nooit een badge en staat nooit op Linnen.
- **Inkt is tekst en verder.** Elke andere hoofdactie (‘Bekijk partytenten’, ‘Offerte aanvragen’, ‘Ontwerp je hoes’, ‘Aanmelden’) is
  een gevulde Inkt-knop; de tweede keuze is omlijnd. Gekozen opties, de btw-schakelaar en badges zijn **niet** gevuld Inkt, zodat de
  koopknop niet hoeft te concurreren.
- **Eén betekenis per kleur.** Polder betekent alleen ‘klaar’: op voorraad, toegevoegd, gelukt. Zon betekent alleen voordeel. Oker
  alleen wachten, Bordeaux alleen fout. Een fout lijkt dus nooit op een knop (Bordeaux ligt ΔE<sub>00</sub> 36,8 van Lampion).
- **Status heeft een vorm, niet alleen een kleur.** Op voorraad: volle stip. Leverbaar over x weken: halve stip. Uitverkocht: open
  ring. Altijd met tekst. Meldingen: een Wit vlak met een 4 px linkerrand, een icoon en een vetgedrukte kop in de statuskleur.
- **Drie vlakken met elk een taak.** Zand is de pagina, Wit is wat je aanraakt (kaarten, velden, chips, meldingen), Linnen is het
  beeldvlak en de rustige band (heroband, staffeltabel, Zakelijk). Ze liggen in dezelfde warme tint.
- **Tekst:** Inkt, met Kiezel voor secundaire tekst. Links zijn Inkt en onderstreept. Accent in een kop is een Lampion-onderstreping
  (de ‘luifelstreep’), nooit Lampion-tekst.
- **Stippelrand betekent alleen ‘sleep hier je bestand’.** Niet leverbaar is een lichte Lijn-rand met doorgestreept label; de kaart
  ‘Met jouw logo’ herken je aan badge, ‘vanaf’-prijs en de knop ‘Ontwerp je hoes’.
- **Productkleur is geen merkkleur.** Een tent of rok heeft de kleur die de leverancier levert (‘Rood’, ‘Zwart’, ‘Wit’). Die heet in
  de winkel naar het product, nooit ‘Lampion’. Lampion ligt ver van het rood van de tenten:

{{T_SEPARATION}}

De enige stockkleur die op Lampion lijkt is de stretchrok ‘Oranje’ (ΔE<sub>00</sub> {{DE_ROK}}). Die rok verkopen we gewoon als
‘Oranje’, maar we tonen hem nooit in merkbeeld (hero, campagne, social) naast het logo.

### 4.3 Kleurschema’s en knopstanden

Zes schema’s, op de plekken die de theme heeft. Eis per stand: het label haalt minstens 4,5:1 op zijn vulling en de vorm (vulling of
rand) minstens 3:1 tegen de achtergrond; koopknop, hoofdknop (rust en hover) en omlijnd (rust en hover) zijn per schema allemaal
verschillend.

{{T_SCHEMES}}

{{N_SCHEME_CHECKS}} standen gecontroleerd, {{N_SCHEME_FAILS}} onder de eis. Focus is altijd een ring van 3 px in de focuskleur
van het schema (Inkt op licht en op Lampion, Zand op Inkt), met 2 px afstand. De koopknop bestaat alleen op Zand en Wit.

**Optiechips op de productpagina** (‘Kies je maat’): rust Wit met 1,5 px Kiezel-rand; hover Inkt-rand en een lichte tint; **gekozen:
Linnen vlak, 2 px Inkt-rand, vet label en een vinkje**; niet leverbaar: Lijn-rand, label in Kiezel en doorgestreept, voor een
schermlezer ‘niet leverbaar’. Kleurswatches: gekozen = 2 px Inkt-ring met 2 px tussenruimte, en de kleurnaam staat ernaast.
**Btw-schakelaar:** een segmentknop op Linnen; het gekozen segment is Wit met een Inkt-rand en vet label.

### 4.4 WCAG 2.1-contrast van elk gebruikt paar

Berekend met de WCAG-formule voor relatieve luminantie. Eisen: tekst 4,5:1; UI-delen (knopvlakken, randen, focusringen, iconen,
stippen) 3:1. Lampion komt alleen als vlak of vorm voor, nooit als tekst. **{{N_PAIRS}} paren, {{N_FAILS}} onder de eis.**

**Tekst**

{{T_CONTRAST_TEXT}}

**UI-delen**

{{T_CONTRAST_UI}}

**Niet toegestaan** (staat erbij zodat niemand het probeert):

{{T_FORBIDDEN}}

**Vlakken onderling** (decoratief, geen tekstcontrast):

{{T_SURFACES}}

### 4.5 Doek, folie, papier en garen

- **Doek.** Tenten, zijwanden en rokken komen in de stockkleuren van de leverancier. We beloven nergens Lampion-doek. Onze eigen
  tenten (beurs, showroom, campagnebeeld) zijn stockrood, zwart of wit met het logo in één kleur.
- **Papier.** Lampion als Pantone 4010 C of de klassieke 1595 C, Inkt als Black 3 C; Pantone U, CMYK en alle referenties in
  technisch.md §4. Op ongestreken papier verschuift Lampion in CMYK zichtbaar (en Inkt kan daar niet zo diep): gebruik een steunkleur
  of teken een drukproef af.
- **Folie.** Geplotte folie (Oracal 651): Lampion 651-036, Inkt 651-070, Zand 651-010. Merkkleuren op de bus in geprinte wrap-folie
  met drukproef, ΔE<sub>00</sub> ≤ 3.
- **Garen en textielprint.** Madeira, Isacord en Gunold voor alle vijf drukkleuren (Lampion, Inkt, Zand, Polder, Zon) en Pantone TCX
  voor geprint textiel: technisch.md §4. Flex en flock: kies op de kleurkaart van de leverancier (procedure in technisch.md §4).
- **Karton.** Bruin golfkarton met één kleur Inkt (flexo). Geen Zand of Lampion: dat verdwijnt op kraft.
- Alle referenties zijn digitale benaderingen. Teken ze af op echte stalen voordat je iets bestelt.

---

## 5. Typografie

**Figtree** zet alles: koppen, tekst, prijzen, maten, formulieren en campagnes. Rustig, open, met echte tabelcijfers en een gewone
nul (Ø 80 cm). Er is geen tweede font meer: de kapitalen naast het logo (ZAKELIJK, PARTYTENTEN · STATAFELS) zijn met de logoletters
getekend, zodat er nooit een bijna-gelijke letter naast het woordmerk staat.

| Rol | Font en gewicht | Shopify `font_picker`-handle | CSS-fallback |
|---|---|---|---|
| Campagnekop | Figtree Black 900 | `figtree_n9` (via `font_modify` op `type_header_font`) | `"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| Display, H1, H2 | Figtree ExtraBold 800 | `figtree_n8` (instelling `type_header_font`) | idem |
| H3, H4, kaarttitels, knoppen, prijzen | Figtree Bold 700 | `figtree_n7` (via `font_modify`) | idem |
| Labels, navigatie | Figtree SemiBold 600 | `figtree_n6` | idem |
| Tekst | Figtree Regular 400 | `figtree_n4` (instelling `type_body_font`) | idem |

Bron van de handles: een kopie van Shopify’s tabel ‘Available fonts’ (shopify.dev) met `figtree_n3`–`n9`, plus Figtree op
Shopify’s font-CDN (technisch.md §8). shopify.dev zelf was niet bereikbaar: kies Figtree in de theme-editor om het te bevestigen.
Figtree is SIL OFL; staat het er onverhoopt niet in, dan staat `fonts/Figtree-VF.ttf` klaar om zelf te hosten.

**Campagne:** Figtree Black in zinsopbouw (geen kapitalen), strak gespatieerd (−0,035 em), vanaf 32 px, hooguit zes woorden, op
Lampion altijd Inkt. Kapitalen zijn voorbehouden aan het getekende logo.

**Schaal** (desktop / mobiel, px):

| Stijl | Maat | Gewicht | Regelhoogte |
|---|---|---|---|
| Campagne | 80 / 48 | 900 | 0,95 · −0,035 em |
| Display | 64 / 40 | 800 | 1,0 · −0,025 em |
| H1 | 48 / 34 | 800 | 1,05 · −0,02 em |
| H2 | 36 / 28 | 800 | 1,1 · −0,015 em |
| H3 | 22 / 20 | 700 | 1,2 |
| H4 | 18 / 17 | 700 | 1,3 |
| Tekst groot / tekst | 19 / 17 en 17 / 16 | 400 | 1,55 |
| Klein | 14 | 400 | 1,45 |
| Label | 15 | 600 | 1,3 |
| Eyebrow | 13 / 12 | 700, kapitalen, +0,08 em | 1,2 |
| Prijs | 20 / 19 | 700, tabelcijfers | 1,2 |
| Knop | 16 | 700 | 1,0 |

**Cijfers en notatie.** Zet `font-variant-numeric: tabular-nums` op prijzen, maten, aantallen, staffels, ordernummers en
levertijden. Schrijf `€ 1.145,00` (spatie na €, punt voor duizendtallen, komma voor centen), `3 × 3 m` (met een echt maalteken),
`Ø 80 cm`, `320 g/m²` en `2–3 weken` (met een en-dash). Btw schrijf je klein: ‘incl. btw’ en ‘excl. btw’.

**Wanneer de centen weg mogen.** In de winkel (productkaart, productpagina, winkelwagen, checkout, offerte, factuur, pakbon) staat een
prijs altijd met centen: `€ 319,00`. In marketing (het prijschip in de hero, banners, social, advertenties, e-mailkoppen) mag ‘vanaf
€ 319’, maar alleen als de centen echt ,00 zijn. Nooit afronden (€ 318,95 blijft € 318,95) en nooit ‘€ 319,-’.

---

## 6. Klapklaar Zakelijk

Hetzelfde merk met een andere toon, voor horeca, eventbureaus, verhuurbedrijven, scholen en verenigingen. Sober: **geen Lampion**,
geen vlaggenlijn, geen campagneletter en geen knipoog.

- **Kleur:** Linnen-vlakken en Inkt (schema 4). De hoofdknop is Inkt, ook voor ‘Offerte aanvragen’.
- **Logo:** `svg/logo-zakelijk.svg`: het woordmerk in één kleur Inkt met het getekende label ‘ZAKELIJK’.
- **Prijzen:** standaard excl. btw, met de schakelaar ‘incl. btw / excl. btw’ en een staffeltabel in tabelcijfers.
- **Waar:** `page.zakelijk`, `page.offerte`, de drukproef- en uploadflow, de B2B-catalogus, de offerte-pdf en facturen.
- **Volume-nudge op de productpagina:** ‘**Zakelijk?** Vanaf 10 stuks maken we een offerte op maat, op factuur.’ met de link
  ‘Offerte aanvragen’. De drempel van 10 en ‘op factuur’ zijn claims.
- **Staffel op de productkaart:** bij de badge ‘Staffelprijs’ staat de staffel, bijvoorbeeld ‘Vanaf 5 st. € 629,00 · vanaf 10 st.
  € 589,00 p.st.’ (voorbeeldbedragen).
- **Met jouw logo:** een eigen kaart in het raster met de badge ‘Met jouw logo’, ‘vanaf € 39,95 per stuk’, de knop ‘Ontwerp je
  hoes’ en ‘Upload je logo, je krijgt eerst een drukproef ter akkoord. Vanaf 10 st. staffelprijs.’ [voorbeeldprijs, claims].
- **Beeld:** opstellingen met meerdere stuks (`img/scene-zakelijk.webp`: een 3 × 6 m Professional met logo en vier bedrukte hoezen,
  voorbeeld), later echte foto’s van zakelijke opstellingen.
- **Toon:** volledig en precies. Schrijf ‘Je offerte staat klaar’, niet ‘Klaar is Kees!’.

---

## 7. Toon van stem

Schrijf alsof je de buurman helpt een tent op te zetten. Gebruik overal **je en jij**. Algemene voorwaarden, facturen en offertes
zijn zakelijk en volledig: ook daar je en jij, maar zonder knipoog.

1. **Eerst het antwoord** (maat, prijs, levertijd), dan de uitleg.
2. **Concreet, nooit vaag.** Schrijf ‘3 × 3 m, Ø 80 cm, 40 mm aluminium’ en nooit ‘ruim assortiment’.
3. **Hooguit één knipoog per scherm.** De knipoog zit in de werkwoorden (klappen, klaarzetten, staan), niet in uitroeptekens.
4. **Niets verzinnen.** Geen sterren, geen ‘nr. 1’, geen ‘duizenden tevreden klanten’.
5. **Elke lever-, betaal- of serviceclaim** is een theme-instelling die de eigenaar invult en bevestigt. Hieronder gemarkeerd met
   **[claim]**.
6. **‘Klap’ nooit bij wind, storm, stevigheid of garantie.** Daar spreken de specificaties.
7. **Geen ‘hij’ of ‘het’ in een sjabloon.** In een tekst die voor elk product werkt, weet je niet of het product een de-woord is
   (de tent) of een het-woord (het verlengsnoer, het kussen, het pakket). Noem het product, of gebruik een zin zonder
   verwijswoord: ‘Staat in je winkelwagen.’ en ‘Mail me als dit weer op voorraad is.’ In een tekst voor één product mag het wel.

### 7.1 Wel en niet

| Wel | Niet |
|---|---|
| Dakdoek van 320 g/m² polyester. | Onverwoestbare topkwaliteit! |
| Deze rok past op statafels van Ø 70–85 cm. | Universele pasvorm voor elke tafel. |
| Kies je maat, wij doen de rest. | Ontdek ons ongeëvenaarde assortiment!! |
| Staat in een paar minuten, met twee man. | Klapt in één klap in elkaar. |
| Zet elke poot vast met haringen of een voetgewicht. | Bestand tegen elk weertype. |
| Staat in je winkelwagen. | Klaar! Hij staat erin. (fout bij het verlengsnoer) |
| Prijs excl. btw: € 263,64. | Nr. 1 van Nederland · 4,9 sterren · 10.000 tevreden klanten |
| Leverbaar over 2–3 weken. | Bijna uitverkocht! Nog maar 2! (tenzij het echt zo is en uit de voorraad komt) |
| Oeps, dat ging mis. Probeer het nog een keer. | Error 422: Unprocessable entity |

### 7.2 Microcopy per onderdeel van de winkel

**Luifelbalk (Lampion, Inkt-tekst):** ‘Snel in huis in NL & BE’ [claim] · ‘Zakelijk bestellen op factuur’ [claim] · ‘Eigen logo? Eerst
een drukproef’. Rechts: ‘Offerte aanvragen’ · ‘Klantenservice’ · ‘Zakelijk’.

**Header:** zoekveld ‘Zoek op product, maat of artikelnummer’ · iconen ‘Offerte’, ‘Account’, ‘Winkelwagen’ · menu: Partytenten ·
Statafels · Rokken & hoezen · Met jouw logo · Accessoires · Meubilair · Verlichting · Actie (Zon-label) · Zakelijk. Mobiel: ‘Menu’ en
‘Sluiten’. De teller op de winkelwagen is Lampion met een Inkt-cijfer; voor schermlezers ‘Winkelwagen, 2 producten’.

**Hero (home):** ‘Uitklappen. Neerzetten. Feest.’ · ‘Easy-up tenten, statafels met rokken, verlichting en meubilair. Voor je
tuinfeest, je club of je evenement.’ · knoppen ‘Bekijk partytenten’ (Inkt) en ‘Naar statafels’ (omlijnd) · onder de knoppen:
‘Voor bedrijf, club of verhuur? Vraag een offerte op maat aan.’ · prijschip op het beeld: ‘Easy-up partytent 3 × 3 m · Premium ·
320 g/m² — vanaf € 319’ [prijs: voorbeeld; marketingnotatie, §5].

**Collectiepagina:** titel = categorie (‘Easy-up partytenten’) · intro van 1–2 zinnen over waarvoor en welke maten · teller
‘24 producten’ · ‘Filteren’ · ‘Sorteer op: Aanbevolen / Prijs laag-hoog / Prijs hoog-laag / Nieuwste’ · geen resultaten: ‘Geen
tenten met deze combinatie. Haal een filter weg of bekijk alle partytenten.’ · filterchips met ‘Wis alles’.

**Productkaart:** titel · specregel (‘Aluminium frame · 320 g/m² dakdoek’, ‘Voor Ø 70–85 cm · stretch’) · swatches met ‘+3’ · prijs
met centen (actie: Zon-label met doorgestreepte van-prijs) · staffelregel bij de badge ‘Staffelprijs’ · voorraadregel · omlijnde
knop ‘In winkelwagen’ (één variant) of ‘Kies je maat’ (meer varianten) · badges ‘Actie −12%’ (Zon), ‘Nieuw’ (Wit, Inkt-rand),
‘Met jouw logo’ (Linnen, upload-icoon) en ‘Staffelprijs’ (Wit, Kiezel-rand).

**Productpagina:** eyebrow = categorie · titel · specregel · prijs met ‘incl. btw / excl. btw’ · voorraad ‘Op voorraad’, ‘Leverbaar
over 2–3 weken’ of ‘Tijdelijk uitverkocht’ · levering ‘Morgen in huis bij bestelling vóór 14:00’ [claim] · optielabels ‘Maat’,
‘Diameter’, ‘Kleur: Rood’, ‘Rok: Strik wit’ · ‘Maatgids’ met ‘Twijfel je over de maat? De maatgids rekent het voor je uit.’ · ‘Aantal’
met − en + (‘Eén minder’, ‘Eén meer’) · **koopknop** (Lampion) ‘In mijn winkelwagen · € 339,80’ (live totaal) → ‘Toevoegen…’ → Polder
met vinkje ‘Toegevoegd’ (1,5 s) · uitverkocht: ‘Uitverkocht’ (uitgeschakeld) en ‘Mail me als dit weer op voorraad is’ (alleen met een
app) · zakelijk-nudge (§6) · onder de knop ‘14 dagen bedenktijd (niet bij bedrukt maatwerk)’ [claim, laten controleren door een
jurist] en ‘Vraag? Bel of app ons’ [claim] · tabbladen ‘Beschrijving’, ‘Specificaties’, ‘Levering & retour’, ‘Opzetten & onderhoud’ ·
veiligheid: ‘Staat stevig, ook als het waait. Zet elke poot vast met haringen of een voetgewicht van 15 kg. Bij harde wind: dak
eraf.’ · reviews alleen als een review-app echte gegevens levert; anders niets, ook geen lege sterren.

**Met jouw logo (bedrukking):** kaart ‘Statafelhoes met jouw logo · vanaf € 39,95 per stuk’ [prijs: voorbeeld] · ‘Upload je logo,
je krijgt eerst een drukproef ter akkoord. Vanaf 10 st. staffelprijs.’ · knop ‘Ontwerp je hoes’ of ‘Ontwerp je tent’ (Inkt) · uploadzone
(de enige stippelrand) ‘Sleep je logo hierheen of kies een bestand (PDF, AI, EPS of SVG)’ · hulptekst ‘Geen vectorbestand? Stuur een
PNG van minimaal 2000 px breed, dan maken we het drukklaar.’ [claim] · melding (Oker) ‘Eerst je akkoord, dan drukken we. De levertijd
gaat in na je akkoord.’ · positie ‘Voorkant’, ‘Rondom’, ‘Topcover’ · voor klantlogo’s gelden dezelfde minimummaten als voor ons logo
(technisch.md §3).

**Toegevoegd (toast of drawer):** ‘Staat in je winkelwagen.’ · ‘Statafelrok stretch Ø 80 cm, zwart · 1 ×’ · ‘Naar winkelwagen’
(koopknop) en ‘Verder winkelen’ (omlijnd) · aanvulling ‘Nog een statafel erbij?’ of ‘Vergeet de haringen niet’.

**Winkelwagen:** ‘Je winkelwagen (2)’ · per regel titel, variant, aantal en ‘Verwijderen’ · drempel ‘Nog € 23,10 tot gratis
verzending’ / ‘Je verzending is gratis’ [claim] · ‘Opmerking bij je bestelling (bv. leverdatum of locatie)’ · ‘Subtotaal (incl. btw)’
· ‘Verzendkosten berekenen we bij het afrekenen’ · koopknop ‘Afrekenen’ · zakelijk: ‘Liever een offerte voor deze winkelwagen?’.

**Lege winkelwagen:** ‘Nog niks in je winkelwagen.’ · ‘Zonde van een goed feest. Begin bij de partytenten, of kijk wat er in de
actie zit.’ · knop ‘Bekijk partytenten’ (Inkt).

**Zoeken:** kopjes ‘Producten’, ‘Categorieën’ en ‘Pagina’s’ · ‘Alle resultaten voor ‘3x3’’ · geen resultaten: ‘Niks gevonden voor
‘partytnt’. Check de spelling, of zoek op maat (3x3) of product (statafel).’

**Fouten en validatie:** ‘Oeps, dat ging mis. We konden je winkelwagen niet bijwerken. Probeer het nog een keer, of bel of app ons:
dan regelen we het samen.’ · ‘Vul je e-mailadres in.’ · ‘Vul je hele postcode in, dan weten we waar de tent heen moet.’ · ‘Dit
e-mailadres klopt niet helemaal. Check de @ en de punt.’ · ‘Er zijn er nog 3 op voorraad. We hebben je aantal aangepast.’ · ‘Dit
bestand is groter dan 20 MB. Stuur een kleinere versie, of mail het naar ons.’ [limiet: claim].

**Offerte en contact:** ‘Offerte op maat aanvragen’ · velden ‘Bedrijfsnaam’, ‘Contactpersoon’, ‘E-mailadres’, ‘Telefoon’, ‘Aantal’,
‘Gewenste leverdatum’, ‘Logo uploaden’ en ‘Toelichting’ · knop ‘Offerte aanvragen’ (Inkt) · gelukt: ‘Je offerteaanvraag is binnen. We
sturen je binnen één werkdag een offerte.’ [claim] · contact ‘Stel je vraag’ · ‘Bedankt, we hebben je bericht. We reageren binnen één
werkdag.’ [claim].

**Nieuwsbrief:** ‘Eerst weten wanneer er actie is?’ · ‘Je e-mailadres’ · ‘Aanmelden’ · ‘Aangemeld. Je hoort van ons als er iets te
vieren valt.’ · geen kortingsbelofte, tenzij die bestaat.

**Account:** ‘Inloggen’, ‘Je bestellingen’, ‘Bestelling #1042’, ‘Adressen’ en ‘Uitloggen’ · zakelijk: ‘Je offertes’ en ‘Nabestellen’.

**404:** ‘Deze pagina is ingeklapt.’ · ‘De link klopt niet (meer). Zoek wat je nodig hebt, of begin bij de partytenten.’ · ‘Naar de
homepage’ en ‘Bekijk partytenten’. Dit is de enige plek waar ‘klap’ negatief mag: het gaat over een pagina, niet over een tent.

**Wachtwoordpagina:** ‘We zetten de laatste tenten neer.’ · ‘Laat je e-mailadres achter, dan hoor je het als we open zijn.’

**Cadeaubon:** ‘Je cadeaubon van € 50,00’ · ‘Gebruik de code bij het afrekenen.’ · ‘Code kopiëren’ en ‘Gekopieerd’.

**Footer (Inkt) en vertrouwen:** kolommen ‘Winkel’, ‘Zakelijk’, ‘Hulp’ en ‘Over Klapklaar’ · ‘Bel of app ons’ met openingstijden
[claim] · ‘Veilig betalen’ met de iconen van de ingeschakelde betaalmethoden · ‘Algemene voorwaarden’, ‘Privacy’, ‘Cookies’,
‘Retourneren’, KvK- en btw-nummer en adres [claim] · reviewscore en keurmerk alleen met een echte bron (§8.5).

**Alt-teksten:** ‘[product], [kleur], [standpunt]’, bijvoorbeeld ‘Easy-up partytent 3 × 3 m rood, schuin vooraanzicht’. Bij een
voorbeeldopdruk: ‘… met voorbeeldopdruk Klapklaar op de luifel’.

---

## 8. Beeld: art direction voor productrenders en foto’s

Tot er echte foto’s zijn, is elk productbeeld een fotorealistische 3D-render (`renders/`). Cartoons, vlakke illustraties en
stockfoto’s komen niet in de winkel.

### 8.1 Productrenders

- **Achtergrond:** naadloos **Linnen #ECE4D6**, precies de kleur van het beeldvlak in de productkaart. Warm en rustig: wit doek
  houdt tekening, zwart lycra houdt glans, en in de Shopping-lijst valt een warme tegel op tussen witte tenten op wit. Geen
  sfeerbeeld als hoofdbeeld, geen tekst of badges in het beeld (badges zijn HTML).
- **Standpunten** (lens 22° verticaal, ongeveer een 85 mm-portretlens; het product vult 80% van het beeld):
  1. hoofdbeeld: schuin voor, 34° van voren gedraaid, camera 17° boven het product;
  2. vooraanzicht: 0°, 6° erboven (luifel recht, voor de opdruk);
  3. zij- of achteraanzicht: 90°, 6° erboven;
  4. detail: hoekstuk en schaar, voetplaat, rokzoom, strik, bladrand;
  5. variant: met zijwanden (altijd één zijde open en het dak in beeld, camera 22° erboven, anders lees je een container),
     ingeklapt (driekwart van boven, 52° gedraaid en 24° erboven, zodat je de gevouwen poten ziet; nooit op de kant, dan lees je een
     peddel), met gewichten;
  6. opstelling: tent met statafels, voor hero, Zakelijk en social.
- **Licht:** een grote softbox linksboven, koepellicht voor diepte, een zachte contactschaduw onder voeten en zomen die naar
  rechtsachter loopt. Geen harde slagschaduw, geen randlicht, geen spiegelende vloer.
- **Kleur:** de render gebruikt de stockkleur van de leverancier (catalogus: Rood `#B5161E`, Zwart, Wit …) en wordt bij de eerste
  levering vergeleken met een echte stofstaal. Nooit Lampion als doekkleur renderen.
- **Formaat:** vierkante master van 2000 × 2000 px, WebP q88 met een JPEG-fallback. Banners en opstellingen 1800 × 1100.
- **Varianten:** dezelfde camera, positie en licht, zodat een klik op een swatch het beeld wisselt zonder dat het verspringt.
- **Eerlijk:** de render toont alleen wat in de doos zit. Een opdruk staat alleen bij bedrukte producten, en een voorbeeldopdruk heet
  ‘voorbeeld’ in de alt-tekst en bij het product.

### 8.2 Google Shopping en de feed

Het standaardbeeld van elk product is de render zonder opdruk op Linnen. Bij een tent die ook in rood leverbaar is, zet je de rode
variant als eerste beeld (`img/tent-3x3-rood-hero.webp`): rood op warm Linnen valt op tussen witte tenten op wit, en het is
gewoon het echte product. De versie met Klapklaar op de luifel (`img/tent-3x3-rood-logo-hero.webp`) is voor de pagina over bedrukte
tenten (als voorbeeld), banners en social. Controleer de beeldeisen van Google Merchant Center vóór de livegang [claim].

### 8.3 Merkbeeld op de homepage

De hero van de winkel is een witte tent met het logo in Inkt op de luifel en twee statafels (`img/scene-hero.webp`): dan is het enige
oranje op de pagina het merk zelf (logo, luifelbalk, koopknop), en staat er geen rode tent naast een oranje balk. De rode tent hoort
in de productlijst en de feed, waar hij als product opvalt.

### 8.4 Praktijkfoto’s (zodra ze er zijn)

Renders laten vorm en kleur zien, maar geen bewijs dat het in het echt zo staat. De eigenaar werkt in de eventverhuur, dus
fotografeer echte opbouw en echt gebruik.

- **Shotlijst:** (1) opbouw met twee man, handen aan de schaar, de tent half uitgeklapt; (2) tuinfeest rond 18:00: een tent met
  statafels in stretch en een prikkabel; (3) club, horeca of beurs: een rij tenten of een terras met het logo op de luifel;
  (4) details in gebruik: een voetgewicht op de voetplaat, een haring in het gras, de strik van een rok; (5) een zakelijke opstelling
  met tientallen bedrukte hoezen.
- **Echt:** eigen events en klanten met schriftelijke toestemming (ook voor herkenbare personen en hun logo’s), met plaats en datum in
  het bijschrift. Geen stockfoto’s en geen logo’s gemonteerd op de tenten van iemand anders.
- **Licht:** daglicht of laag avondlicht van opzij, nooit flits recht van voren. Zet de witbalans op het doek met een grijskaart in
  de eerste opname.
- **Kader:** 4:3 of 3:2, horizon recht, product op een derde, op ooghoogte (35–50 mm-equivalent, geen groothoek). Minstens 2400 px
  aan de korte kant.
- **Plek in de winkel:** de band ‘In gebruik’ op de home, beeld 5–6 in de galerij van de productpagina (nooit beeld 1: dat blijft de
  render op Linnen), de Zakelijk-pagina en de collectiekop.

### 8.5 Vertrouwen: vaste plekken, alleen met echte gegevens

| Plek | Wat | Regel |
|---|---|---|
| Footer (Inkt) | betaalmethoden | iconen uit Shopify, alleen de methoden die aanstaan |
| Footer en productpagina | ‘Bel of app ons’ met openingstijden | theme-instelling [claim]; leeg betekent niet tonen |
| Footer | KvK- en btw-nummer, adres, retouradres | theme-instelling [claim] |
| Footer en productpagina | reviewscore | alleen via een review-app met echte reviews; anders niets, ook geen lege sterren |
| Footer | Thuiswinkel Waarborg of een ander keurmerk | alleen met lidmaatschap [claim], met logo en link van de organisatie zelf |
| Productpagina, onder de knop | bedenktijd | ‘14 dagen bedenktijd (niet bij bedrukt maatwerk)’ [claim]; laat de tekst juridisch controleren |

---

## 9. Iconen en vlaggenlijn

- **Iconen:** lijniconen op een raster van 24 px, lijn 2 px (1,75 px op 20 px), ronde uiteinden en hoeken, altijd `currentColor` en
  één kleur. Geen gevulde of meerkleurige iconen, geen emoji.
- **Tent-icoon:** een partytent zoals het logo: dak met punt en naar binnen gebogen randen, een rij schulpen, twee rechte palen. Geen
  vlakke balk, geen zuilen.
- **Statafel-icoon:** een rond blad als ellips (in perspectief), de stretchrok die insnoert en uitwaaiert naar de voet. Geen vlakke
  bovenlijn: dan lees je een I-balk of tekstcursor.
- 25 iconen staan als `<symbol>` in `brand-sheet.html` (bron: `tools/icons.svg`): levering, factuur, app ons, maatgids, logo
  uploaden, drukproef, haring, wind, tent, statafel, verlichting, zakelijk, winkelwagen, zoeken, account, meer, minder, klaar, info,
  let op, levertijd, bellen, retour, menu en sluiten.
- Een icoon staat altijd naast tekst of heeft een `aria-label`.
- **Vlaggenlijn:** een feestelijke scheiding op home, actie en de bestelbevestiging. Op licht `svg/vlaggenlijn.svg` (Lampion), op
  Inkt `svg/vlaggenlijn-inkt.svg` (Lampion en Zand). **Niet** in Zakelijk, bij een offerte, in de checkout of bij een foutmelding.

## 10. Vorm, ruimte en beweging

Alle waarden staan in `tokens.json`.

- **Radii:** badge 4, knop, chip en invoerveld 8, kaart en beeld 12, paneel 16. Stevig, niet bubbelig.
- **Randen:** een kaart heeft een 1 px Lijn-rand; invoervelden en chips 1,5 px Kiezel; de uploadzone 1,5 px gestippeld (de enige
  stippelrand).
- **Ruimte:** een raster van 4 px (4 tot 128). Paginamarge 16 / 24 / 40, container maximaal 1360, 12 kolommen op desktop, 8 op
  tablet en 4 op mobiel, ruimte tussen secties 48 op mobiel en 96 op desktop, aanraakdoelen minstens 44 px; de koopknop 52 px hoog.
- **Schaduw:** alleen bij hover op een kaart, op de sticky header, de drawer en de toast, en als inzet bij een ingedrukte knop.
- **Beweging: uitklappen.** Drawers en accordeons gaan in 220 ms open met `cubic-bezier(.16,1,.3,1)`, zonder te stuiteren. De
  koopknop wordt Polder met vinkje ‘Toegevoegd’ in 140 ms, de toast verschijnt in 220 ms en hover duurt 140 ms. Met
  `prefers-reduced-motion` alleen opacity, hooguit 140 ms.

---

## 11. Toepassingen buiten de winkel

### 11.1 Social en advertenties

| Formaat | px | Waar |
|---|---|---|
| Vierkant | 1080 × 1080 | feed, carrousel, Meta-advertentie |
| Portret | 1080 × 1350 | feed (meeste ruimte in de tijdlijn) |
| Staand | 1080 × 1920 | stories, reels; houd 250 px boven en onder vrij voor de interface |
| Liggend | 1200 × 628 | linkadvertentie, Google Display |

**Sjabloon (alle formaten, ook de story):** marge 6 % rondom. Onderaan de **luifelbalk**: een Lampion-band van 12 % van de hoogte
(story 10 %, boven de vrije zone van 250 px) met het logo in Inkt links en het domein `klapklaar.nl` rechts. Erboven het product op
Linnen (render of foto), en linksboven hooguit zes woorden in Figtree Black, Inkt. Een prijschip (Wit, Inkt-tekst, tabelcijfers,
‘vanaf € 319’ alleen bij ,00) mag rechtsonder in het beeld. Actie: een Zon-label met het voordeel, nooit een rode ster of ‘!!!’. Eén
boodschap per beeld, tekst samen hooguit een vijfde van het vlak. Zakelijke advertenties (LinkedIn, Google): geen luifelbalk, maar
Linnen met het Zakelijk-logo, en een concreet aanbod (‘40 statafelhoezen met je logo: offerte binnen één werkdag’ [claim]).

**Profielfoto:** `mark.svg` (Lampion-tent op Inkt); het platform maakt er zelf een cirkel van, het beeldmerk past daarbinnen.

### 11.2 E-mail en nieuwsbrief

- **Breedte 600 px**, Zand buitenrand, Wit inhoud. Bovenaan het logo op 160 px breed (PNG op 2×, `img/logo-email-320.png`), links.
- **Opbouw:** heroband met één render (600 × 360) en één kop; daaronder hooguit drie blokken (product 2 × 2 of tekst + knop); onderaan
  de footer in Inkt met Zand-tekst, adres en afmelden.
- **Letters:** Figtree als webfont waar het werkt, anders Arial / Helvetica (`font-family: Figtree, Arial, Helvetica, sans-serif`).
  Kop 28/32 vet, tekst 16/24, prijzen met centen en zonder tabelcijfers (mailclients negeren ze).
- **Knop:** Inkt met Wit label, 48 px hoog, als tabelcel (‘bulletproof’), geen afbeelding van een knop. In de verlaten-winkelwagenmail
  is de knop ‘Afrekenen’ Lampion met Inkt-label (de koopknop).
- **Shopify-notificaties** (bevestiging, verzending, offerte): zet in Instellingen → Meldingen de accentkleur op Inkt `#1D2420` en het
  logo op 160 px. Onderwerpregels: ‘Je bestelling #1042 is binnen’, ‘Je bestelling is onderweg’, ‘Je drukproef staat klaar’.
- **Toon:** zoals de winkel; in transactiemail geen knipoog bij geld of problemen.

### 11.3 Verpakking en verzendlabel

- **Doos:** bruin golfkarton, één kleur Inkt (flexo). `svg/print-luifel.svg` op de lange zijden, ongeveer de helft van de breedte;
  het beeldmerk op de kopse kanten. Binnenflap: ‘Uitklappen. Neerzetten. Feest.’ met een QR-code naar de opzetvideo [als die er is].
  Render: `img/app-verpakking.webp`.
- **Tape:** bruine papiertape met het woordmerk in Inkt.
- **Draagtas van een tent:** het woordmerk in één kleur (Zand of wit op zwart), 25 cm breed, op de lange zijde.
- **Verzendlabel:** 100 × 150 mm (A6) uit het verzendplatform, **zwart op wit** (thermische printers drukken alleen zwart); ons deel
  alleen het afzenderblok met het beeldmerk in zwart (15 mm) en het retouradres. Hanteersymbolen ‘deze kant boven’ en ‘zwaar: 2
  personen’ als lijnicoon, met tekst.
- **Pakbon:** A4, Figtree, logo linksboven, ordernummer en artikellijst in tabelcijfers, prijzen met centen, onderaan ‘Vragen? Bel
  of app ons’ [claim].

### 11.4 Banners en campagnegrid

- **Raster:** 12 kolommen in een container van 1360 px met 24 px tussenruimte (desktop); 4 kolommen met 16 px marge (mobiel).
- **Homebanner:** 1440 × 560 desktop, 390 × 520 mobiel. Tekst in kolom 1–6 op een Linnen- of Lampion-vlak, beeld in kolom 7–12. Op
  mobiel staat de tekst boven het beeld, nooit over het product heen.
- **Collectiekop:** 1440 × 280 / 390 × 200: titel en intro links, een uitgesneden render rechts.
- **Campagnes:** seizoensbanner op een Lampion-band (schema 5) met een kop in Figtree Black, Inkt; actie met een Zon-label; Zakelijk
  altijd Linnen + Inkt. Hooguit één campagneband per pagina, en nooit een vlaggenlijn in dezelfde band.
- **Beeldbestanden:** 2× (2880 × 1120), WebP, het brandpunt in Shopify gezet zodat het product bij het bijsnijden blijft staan.

---

## 12. Vóór livegang: wat de eigenaar nog doet

### 12.1 Naamtoets (± 45 minuten)

Niet gedaan: ook in deze ronde weigerde de bouwomgeving elke webzoekopdracht (het zoekbudget was op), en DNS werkt er niet.

1. **KvK Handelsregister** (kvk.nl → zoeken): ‘klapklaar’, ‘klap klaar’ en ‘klapklar’. **Stop** bij een actieve handelsnaam in feest,
   verhuur, tenten, meubilair of detailhandel.
2. **BOIP** (boip.int → merken zoeken) en **EUIPO TMview** (tmdn.org/tmview): KLAPKLAAR en wat erop lijkt (KLAP-KLAAR, KLAPKLAR),
   woord- en beeldmerken, in de Nice-klassen 11 (verlichting), 20 (meubilair, statafels), 22 (tenten, zeilen), 24 (textiel: rokken,
   hoezen) en 35 (detailhandel). **Stop** bij een ingeschreven of aangevraagd merk dat erop lijkt in die klassen. Zoek bij de
   beeldmerken ook op een tent als letter A (Wenen-classificatie 7.1.24 tenten en 27.5 letters).
3. **SIDN** (sidn.nl → whois) en **DNS Belgium** (dnsbelgium.be → whois): klapklaar.nl, klapklaar.be, klapklar.nl, klap-klaar.nl,
   .com en .eu. Een bezet domein is geen reden om te stoppen, wel om uit te zoeken wie het heeft.
4. **Web:** ‘klapklaar’ los en met ‘partytent’ of ‘statafel’; Instagram (@klapklaar), bol.com en Marktplaats.
5. Alles schoon? Leg het merk voor aan een merkenadviseur (§12.4).

### 12.2 Naast Outmate en Statafelshop leggen

Wat uit bronnen vaststaat staat hieronder ingevuld (bronnen in `reference/dossier.md` en `reference/assortment.json`). Het logo en de
kleuren van beide winkels konden niet worden bekeken: outmate.nl en statafelshop.nl zijn vanuit de bouwomgeving geblokkeerd en het
zoekbudget was op. Die cellen vult de eigenaar in (± 15 minuten): open beide sites, pik de hoofdkleur van het logo en de koopknop met
een kleurpipet, en reken ΔE<sub>00</sub> uit met `python3 tools/compare.py '#hex'`.

| | Klapklaar | Outmate | Statafelshop |
|---|---|---|---|
| Naam en klank | Nederlands samengesteld woord, klap-klaar | Engels ‘out’ + ‘mate’; voorheen partytentkopen.nl (dossier §1) | beschrijvend, ‘statafel’ + ‘shop’ (dossier §1) |
| Productnamen | beschrijvend: ‘Easy-up partytent 3 × 3 m Premium’ | merknamen op ‘-mate’ en plaatsnamen: Starmate, AirMate, Times Square, Tundra (dossier, ‘Do not copy’) | Amerikaanse plaats- en rivierenamen: New York, Savannah, Colorado (assortment.json `meta.naming_rule`) |
| Toon en claims | je/jij, geen superlatieven, geen scores | ‘Door eigen import de goedkoopste!’, ‘Nr.1 aanbieder in NL en BE’ (dossier, ‘Do not copy’) | ‘je’ (statafelshop.nl/product/stretchrok-met-eigen-opdruk/); ‘de grootste statafelwebshop in Europa’, ‘Wij scoren een 9,6’ (dossier) |
| Winkel | één winkel NL + BE met Markets | WooCommerce, vier à vijf zustersites (outmate.be, outmateair.nl, outmatestretch.nl) (dossier §1) | WooCommerce-achtige paden naast een oude winkel, .be-spiegel (dossier §1) |
| Logovorm | KLAPKLAAR in getekende kapitalen, de tweede A is een partytent | niet vastgesteld | niet vastgesteld |
| Hoofdkleur (hex) | Lampion #E66414 met Inkt #1D2420 en Zand #FBF6EC | niet vastgesteld | niet vastgesteld |
| Knopkleur | koopknop Lampion, verder Inkt | niet vastgesteld | niet vastgesteld |
| Productbeeld | renders op Linnen #ECE4D6 | niet vastgesteld | niet vastgesteld |

**Beslisregel.** Ligt de hoofdkleur van Outmate of Statafelshop binnen ΔE<sub>00</sub> 15 van Lampion, of gebruikt een van beide een
tent als letter of een oranje koopknop naast een oranje logo, ga dan niet live maar schuif eerst de kleur. Alles staat in
`tools/tokens.py`; logo, sheet en boek bouwen in één keer opnieuw (technisch.md §9).

### 12.3 Als de naam niet vrij is

**Reservenamen** (niet getoetst): **Staklaar** (sta(tafel) + klaar, ‘staat klaar’) en **Tentklaar**. Beide eindigen op -klaar en
hebben een A in ‘klaar’: de tent-A, de constructie, de kleuren, de letters, iconen, renders, toon en alle componenten blijven.
Opnieuw: de letters vóór ‘KLAAR’ (`tools/kkgeo.py` heeft al S, T, E en N), de tagline en de woordgrapjes met ‘klap’.

### 12.4 Wat deponeren

Een inschatting, geen juridisch advies: laat een merkenadviseur meekijken.

1. Het **beeldmerk** (de tent-A, `mark.svg`) als beeldmerk: het meest onderscheidend.
2. Het **logo** als gecombineerd woord-/beeldmerk: KLAPKLAAR met de tent-A. De getekende tent-A maakt het onderscheidend, ook als
   het woord alleen zwak is.
3. Het **woordmerk alleen** is het zwakst: voor tenten (22) en klaptafels (20) kan ‘klapklaar’ als beschrijvend gelden.

**Typo-domeinen:** klapklar.nl en klap-klaar.nl (beschikbaarheid niet gecontroleerd).

### 12.5 Mensentest van het logo

Twintig mensen die het merk niet kennen (bijvoorbeeld via PartyHuren), 5 seconden per beeld, op 16, 32 en 132 px. Vraag ‘Wat zie
je?’ en noteer letterlijk. Protocol en beslisregel: technisch.md §10. Pas het logo pas toe op doek en bus als ten minste 14 van de
20 mensen op 32 px een tent of partytent noemen en hooguit 3 een gebouw, bank of museum.

### 12.6 Kleuren en doek aftekenen

Teken de kleurreferenties af op echte stalen, zonder scherm erbij (procedure en invultabel: technisch.md §4). Vraag de
doekleverancier om stalen van zijn stockkleuren en kies het rood, zwart en wit voor de eigen tenten op het oog. Vergelijk de renders
daarna met die stalen.

---

## 13. Claims om te bevestigen

Alles hieronder is een voorbeeld of belofte die de eigenaar bevestigt of aanpast. Deze punten staan ook in
`docs/claims-to-confirm.md`.

| Claim | Waar | Wat te doen |
|---|---|---|
| Naam Klapklaar, klapklaar.nl en .be, @klapklaar | overal | Naamtoets §12.1 vóór registratie of druk |
| Logo leest als tent | logo, beeldmerk, favicon | Mensentest §12.5 vóór druk en bus |
| Stockkleuren doek (Rood, Zwart, Wit …) | swatches, renders | Stalen van de leverancier; renders vergelijken |
| ‘14 dagen bedenktijd (niet bij bedrukt maatwerk)’ | productpagina, onder de knop | Termijn als instelling; uitzondering juridisch laten controleren |
| ‘Bel of app ons, ma–vr’ met nummer | productpagina, footer | Echt nummer en openingstijden invullen, anders verbergen |
| KvK, btw-nummer, adres, retouradres | footer, pakbon | Invullen |
| Thuiswinkel Waarborg of een ander keurmerk | footer | Alleen met lidmaatschap |
| Reviewscore | kaart, productpagina, footer | Alleen via een review-app met echte reviews |
| Betaalmethoden (iDEAL, Bancontact, kaarten, op factuur) | footer, winkelwagen | Alleen wat in Shopify aanstaat; ‘op factuur’ alleen met een factuurapp of B2B |
| ‘Snel in huis in NL & BE’, ‘morgen in huis bij bestelling vóór 14:00’ | luifelbalk, productpagina | Levertijdinstellingen in de theme |
| ‘Offerte binnen één werkdag’ | Zakelijk, offerte, advertenties | Alleen als het zo werkt |
| Staffelprijzen en ‘vanaf 10 stuks’ | Zakelijk, kaarten | Bedragen zijn voorbeelden; stel de korting echt in Shopify in |
| ‘Geen vectorbestand? … dan maken we het drukklaar’ en de uploadlimiet van 20 MB | bedrukking | Alleen als je dat aanbiedt |
| QR-code naar een opzetvideo | verpakking | Alleen als de video er is |
| Prijzen in de brand sheet (€ 319,00, € 39,95, € 169,90 …) | brand sheet | Voorbeelden |
