# Klapklaar merkboek

Versie 3, 17-10-2026. Dit is de bron voor naam, logo, kleur, reproductie, typografie, beeld en toon van de webshop.
Het visuele overzicht staat in [`brand-sheet.html`](brand-sheet.html) (screenshot: `brand-sheet.png`).
Kleuren, reproductiereferenties, fonts, radii, spacing, schaduwen, motion en componentstaten staan machineleesbaar in
[`tokens.json`](tokens.json).

> **Status van de naam: NIET GETOETST.** KvK, BOIP/EUIPO en SIDN zijn niet gecontroleerd (§11). Ook in deze ronde
> was het zoekbudget op. Doe die toets voordat je iets registreert, bestelt, laat drukken of een domein koopt.
>
> **Status van de kleuren op doek, folie en papier: NIET FYSIEK AFGETEKEND.** §4.4 geeft per materiaal de
> dichtstbijzijnde stockkleur met ΔE en een aftekenprocedure. Bestel niets in merkkleur voordat die is doorlopen.

## Wat is er veranderd sinds v2

| Kritiek op v2 | Wat v3 doet |
|---|---|
| Geen reproductiepagina: geen Pantone, TCX, RAL, Oracal of CMYK, geen minimummaten per methode, geen klein logo | §4.4 kleurreferenties per materiaal met ΔE, bronnen en aftekenlijst; §4.5 minimummaten per methode, berekend uit de geometrie; `logo-klein` en `mark-klein` uit één stuk (§3.4) |
| De Klaproos-render week af van de staal (#E05038 tegen #BE3A1D) | Afwerking ‘mat’ in de renderer en een gemeten ingangskleur: het belichte dakvlak meet nu #CD3916 tegen staal #C83812, ΔE<sub>00</sub> 1,2 (§8.2) |
| Beeldmerk ‘aa onder de tent’ kort de naam niet af en leest los als ‘AA’ | Beeldmerk is nu de k onder de tent (§3.5) |
| Op 112–125 px loopt de kier tussen dak en band dicht, de vlag wordt een vlek, de l raakt de band | Eén openingsmaat van 65 (was 26 en 32); vlag vast aan een paal van 65 breed; wisselregel: onder 121 px `logo-klein` (§3.3) |
| `favicon-16.svg` niet op het pixelraster; tellers van de a op 32 px dicht | Nieuwe 16- en 32-rastertekeningen, alle rechte randen op hele pixels; 32 px toont de k, zonder tellers (§3.6) |
| ‘Eén streekdikte’ maar een paal van 3 tegen 13; ‘elke kleur één taak’ maar Zon had zeven taken; ‘Erin!’ tegen ‘Toegevoegd’ | Twee benoemde maten (stok 130, opening 65); één rol per kleur en Zon alleen nog vlag + actie (§4.1); één label ‘Toegevoegd’ in boek en tokens |
| Getypte tagline met andere a direct onder het logo; ‘Zakelijk’ in lichter gewicht | Regel: naast het logo alleen kapitalen of de lock-ups (§3.7, §5); Zakelijk is een Polder-label in kapitalen |
| Archivo + Figtree te weinig contrast; `archivo_n8` onbevestigd | Mona Sans (hoekig) + Figtree (rond); beide handles staan in de Shopify-fontlijst; zelf-host-fallback beschreven (§5) |
| Hover 1,36:1 van de rusttoestand; Klaproos op Duin 4,53:1; actieprijs alleen een badge; Bordeaux en Klaproos lijken op elkaar | Hover = Inkt (3,04:1 verschil); Klaproos nooit als gewone tekst; actieprijs in een Zon-label; fout is Bordeaux #8A1538, ΔE<sub>00</sub> 23,8 van Klaproos en nooit een vlak (§4) |
| Brand sheet: diagram en iconen liepen uit hun kaart, ‘App ons’ brak, Haring leek een cursor, Zakelijk-kaart leeg, Staffelprijs zonder staffel, bus als cartoon | Alles opnieuw opgebouwd en gecontroleerd op 1440 en 390 px zonder overloop; 21 iconen, nieuwe haring; staffelregel op de kaart; bus als plaatsingsschema met maatlijnen |

---

## 1. Naam en betekenis

**Klapklaar** · klapklaar.nl / klapklaar.be / @klapklaar (geen van deze is gecontroleerd op beschikbaarheid).
Tagline: **In één klap feestklaar.**

| Laag | Betekenis | Waarom het werkt |
|---|---|---|
| **klap** | uitklappen | Een easy-up en een klapstatafel staan in één beweging. Het woord doet wat het product doet. |
| **in één klap** | in één keer | Tent, statafels, rokken, verlichting en meubilair in één bestelling, voor particulier en zakelijk. |
| **klaar** | gereed, ‘klaar is Kees’ | Past bij de nuchtere toon. De naam gaat over klaar zijn, niet over één product, en dekt het hele assortiment. |

9 letters, 2 lettergrepen, geschreven zoals je hem zegt. Geen Engelse ‘-mate’, geen generieke ‘-shop’.

**Bekende risico’s.** ‘Klap’ betekent ook een klap of iets dat in elkaar klapt: precies de angst bij goedkope easy-ups
in de wind. Daarom (§7) nooit ‘klap’ bij wind, storm, stevigheid of garantie; daar spreken de specificaties. De
samenstelling lokt typefouten uit (klapklar, klap-klaar): registreer die domeinen mee (§11).

## 2. Positionering en merkbelofte

**Voor wie:** iedereen die iets organiseert.

| Doelgroep | Wie | Wat ze nodig hebben | Waar het merk dat laat zien |
|---|---|---|---|
| **Consument** | tuinfeest, verjaardag, bruiloft, buurtfeest, markt | snel kiezen, juiste maat, weten wanneer het er is, simpel opzetten | maatgids, specregel op elke kaart, voorraadstatus, opzetuitleg |
| **Vereniging / school** | sportclub, carnaval, schoolfeest | budget, meerdere stuks, logo erop, factuur | staffelprijzen, ‘Met jouw logo’, betalen op factuur [claim] |
| **Horeca** | terras, festivalbar, catering | duurzaam, uniform, snel nabesteld | Professional-lijn, vaste kleuren, nabestellen via account |
| **Eventbureau / verhuur** | tientallen tenten en tafels, eigen bedrukking | prijs excl. btw, offerte, drukproef, levering op locatie | Klapklaar Zakelijk (§6), offerteflow, staffeltabellen |

**Merkbelofte:** *Je kiest je maat, wij zorgen dat het klaarstaat.* Elke productpagina noemt maat, materiaal, gewicht en
levertijd vóór er sfeer komt; elke bedrukking begint met een drukproef; elke zakelijke vraag krijgt een offerte op maat.
Levertijden, betaalvormen en reactietijden zijn claims die de eigenaar invult en bevestigt (`docs/claims-to-confirm.md`).

**Wat we niet zijn:** niet de goedkoopste roep-winkel, niet ‘nr. 1’, niet hip om het hip-zijn. Geen verzonnen sterren,
reviews, klantaantallen of keurmerken.

## 3. Logo

### 3.1 Constructie

Geen letter komt uit een font. `tools/kk.py` construeert elke vorm uit lijnen en Bézier-curves; `tools/build.py`
schrijft de SVG’s en meet de kleinste lijn en opening. Eenheden: x-hoogte 500.

- **Twee maten.** *Stok* = 130: letterstokken en de luifelband. *Opening* = 65 (een halve stok): de kier tussen dak en
  band, de ruimte tussen de tweede l en de band, en de dikte van de vlaggenstok. Kommen zijn bovenaan en onderaan 112
  dik (optische correctie van de stok); de arm van de k is 125 dik.
- **Vierkant-ronde kommen** (superellips, handle 0,66): stevig, ‘stalen buis’. De a is eenverdiepings.
- **21°.** Het dak heeft een helling van 21°. Dezelfde hoek snijdt de bovenkant van k en l en de onderkant van de p af.
  Dat detail is zichtbaar vanaf ongeveer 300 px breed en op luifels en bussen; kleiner draagt de tent het merk.
- **De tent staat op de letters.** De luifelband is één stok dik, zijn bovenrand ligt op de stokhoogte van k en l
  (712), en hij is precies zo breed als de dubbele aa. Het dak overspant de band.
- **Vlag op de paal.** Een wimpel vast aan de middenpaal maakt het een feesttent en geen huis (‘de vlag kan uit’).
- Alle paden zijn echte, niet-overlappende contouren (buitenkant met de klok mee, binnenvormen ertegenin).

### 3.2 Bestanden

| Bestand | Gebruik |
|---|---|
| `logo.svg` | Standaard: Inkt-letters, Klaproos-tent. Op Zand, Wit, Duin, Linnen, Studio. Vanaf 121 px breed. |
| `logo-inverse.svg` | Zand-letters, Zon-tent. Op Polder en Inkt. |
| `svg/logo-on-klaproos.svg` | Zand, vlag Zon. Op Klaproos. |
| `svg/logo-mono.svg` | `currentColor`. Theme-header (inline SVG, kleur via CSS), stempel, gravure. |
| `svg/logo-klein.svg`, `-klein-inverse.svg`, `-klein-mono.svg` | **Klein werk**: 76–120 px op scherm; borduren en flock onder de minimummaat van logo.svg (§3.4, §4.5). |
| `svg/logo-luifel.svg`, `svg/logo-luifel-inverse.svg` | **Luifel-lock-up**: woordmerk + descriptorbalk ‘PARTYTENTEN · STATAFELS’ in kapitalen, één stok onder de p. Luifel, bus, marktplaatsen, beursstand. Vanaf 160 mm. |
| `svg/logo-zakelijk.svg` | **Klapklaar Zakelijk**: Inkt-letters, Polder-tent, Polder-label ‘ZAKELIJK’ op de x-hoogte. Offertes, facturen, B2B. |
| `mark.svg` | **Beeldmerk**: de k onder de tent, Zand op Klaproos, vlag Zon. Avatar, app-icoon, stempel. |
| `svg/mark-polder.svg`, `svg/mark-zand.svg`, `svg/mark-mono.svg` | Varianten van het beeldmerk. |
| `svg/mark-klein.svg`, `svg/mark-klein-mono.svg` | Beeldmerk uit één stuk voor klein borduur- en flockwerk. |
| `svg/print-wordmark.svg`, `svg/print-wordmark-klein.svg`, `svg/print-mark.svg`, `svg/print-mark-klein.svg` | **Drukbestanden**, één kleur (zwart = inkt), één pad. |
| `favicon.svg`, `favicon-32.png`, `favicon-192.png` | Favicon, getekend op het 32-raster (§3.6). |
| `svg/favicon-16.svg`, `img/favicon-16.png` | 16-rastertekening: tent uit één stuk met vlag. |
| `svg/favicon-cart.svg`, `img/favicon-cart-32.png` | Favicon met Zon-stip linksboven, bij een gevulde winkelwagen. |
| `img/apple-touch-icon-180.png`, `img/mark-512.png` | iOS-icoon (vol vlak), social avatar. |
| `svg/pennant.svg`, `svg/vlaggenlijn.svg` | Vlaggetje en vlaggenlijn (motief, scheider). |

### 3.3 Gebruik

- **Vrije ruimte:** rondom minimaal de x-hoogte van de a (1 x). Boven het vlaggetje ook 1 x.
- **Wisselregel op scherm:** `logo.svg` vanaf 121 px breed; `logo-klein` van 76 tot 120 px; daaronder het
  beeldmerk (vanaf 26 px) of het favicon. Berekend uit kleinste lijn ≥ 2 px en kleinste opening ≥ 1,5 px (§4.5).
- **Theme-header:** desktop `logo.svg` op 160–176 px breed; mobiel (390 px) `logo-klein` op 100–110 px. Footer op Polder:
  `logo-inverse.svg`.
- **Kleur van de tent:** Klaproos (op licht), Zon (op Polder of Inkt), Polder (Zakelijk) of gelijk aan de letters
  (eenkleurig). Nooit Klaproos op Klaproos.
- **Niet:** uitrekken, smaller maken, draaien, omlijnen, schaduw, verloop; de tent los gebruiken (behalve als beeldmerk of
  vlaggetje); het woord zelf typen in een font; de tent boven een ander woord zetten; gezette kleine letters direct bij het
  logo (§3.7).

### 3.4 Klein werk: `logo-klein` en `mark-klein`

| | logo.svg | logo-klein.svg | mark.svg | mark-klein.svg |
|---|---|---|---|---|
| Dak en luifelband | los, opening 65 | één vorm | los, opening 65 | één vorm |
| Vlag | aan paal van 65 | aan paal van 130 | aan paal van 65 | aan paal van 130 |
| Letterruimte | normaal | +40 per paar | – | – |
| Opening k–band | – | – | 65 | 130 |
| Kleinste lijn / opening (eenheden) | 65 / 56 | 112 / 96 | 65 / 65 | 112 / 130 |

De klein-versies hebben geen kier die dichtloopt, geen losse snipper bij het wieden van folie en geen sprongsteek over een
kier bij borduren. Wissel naar `logo-klein` zodra `logo.svg` onder zijn minimum komt: borduren onder 73 mm, flock
onder 105 mm, op scherm onder 121 px. `logo-klein` zelf gaat tot 46 mm (borduren), 67 mm (flock) en
76 px; nog kleiner: `mark-klein` (§4.5).

### 3.5 Beeldmerk: de k onder de tent

De k is de eerste letter van Klapklaar, komt twee keer in het woord voor en heeft dezelfde 21°-snede als het dak. Hij
staat onder dezelfde tent als de aa in het woordmerk: band = stok, opening = 65, dakhoek 21°, vlag op de paal. De aa uit
v2 kortte de naam niet af en las los als ‘AA’ (in Nederland ook Anonieme Alcoholisten), wat op een statafelrok bij een
borrel ongelukkig is.

### 3.6 Favicon

Twee eigen tekeningen, geen verkleind logo:

- **16 px** (`svg/favicon-16.svg`): tent uit één stuk (dak, band, twee poten, paal) in Zand op Klaproos, vlag 3 × 3 px Zon.
  Alle coördinaten zijn hele pixels; alleen de dakhellingen zijn schuin.
- **32 px** (`favicon.svg`): de k onder de tent. Band 22 × 3 px, opening dak–band 1 px, paal 2 px, k-stok 4 px; stok,
  band, basislijn en x-hoogte op hele pixels. Geen tellers (de a’s van v2 werden spleetjes).
- **Winkelwagen** (`svg/favicon-cart.svg`): Zon-stip met Inkt-rand linksboven, waar de tekening leeg is.

### 3.7 Lock-ups en de regel van de a

Het woordmerk heeft een eigen eenverdiepings-a; Mona Sans en Figtree hebben een tweeverdiepings-a. Daarom staat er direct
bij het logo **nooit gezette tekst in kleine letters**. Descriptor (luifel), ‘ZAKELIJK’ en een tagline-lock-up zijn in
kapitalen (Figtree ExtraBold, omgezet naar paden). De tagline als zin (‘In één klap feestklaar.’) mag in koppen en
tekst, maar niet tegen het logo aan.

### 3.8 Vlaggetje en vlaggenlijn

Het vlaggetje van de paal is het tweede merkteken: opsommingsteken, icoon van de badge ‘Met jouw logo’, motief op tassen.
De vlaggenlijn (`svg/vlaggenlijn.svg`, Klaproos-Zon-Polder-Zon) scheidt secties op feestelijke momenten: home, actie,
bestelbevestiging. **Niet** in Zakelijk, offerte, checkout of bij foutmeldingen.

## 4. Kleur

### 4.1 Palet: één rol per kleur

Elke kleur hoort bij één rolfamilie. Klaproos is het merk en de koopknop, en verschijnt alleen als vlak. Zon is de vlag:
feest en voordeel. Polder is vertrouwen. Fouten zijn Bordeaux en nooit een gevuld vlak.

| Naam | Hex | Rolfamilie | Rol |
|---|---|---|---|
| Klaproos | `#C83812` | merk & kopen | Het merkrood. Alleen als vlak: dak in het logo, primaire knop (In mijn winkelwagen), het Klaproos-dakdoek. Als tekst alleen in koppen vanaf 24 px op Zand of Wit. |
| Klaproos donker | `#982A0E` | merk & kopen | Alleen de ingedrukte stand (:active) van de primaire knop. |
| Zon | `#FFC23A` | feest & voordeel | De vlag: vlaggetje en dak van het logo op donker, Actie-badge en actieprijs-label (altijd met Inkt-tekst). Verder niets. |
| Polder | `#154F3E` | vertrouwen | Donkere vlakken (utility-balk, footer), secundaire knop, Op voorraad / Toegevoegd (met icoon), Klapklaar Zakelijk. |
| Inkt | `#1D2420` | tekst | Tekst, koppen, links (onderstreept), omlijnde knop, focusring op licht en de hover-stand van de primaire knop. |
| Kiezel | `#5D625C` | tekst | Secundaire tekst (specs, btw-regel, doorgestreepte van-prijs) en randen van invoervelden (>= 3:1). |
| Zand | `#FBF6EC` | vlak | Paginaachtergrond (warmer dan wit, zodat witte kaarten loskomen); tekst en focusring op donker. |
| Duin | `#F2E8D5` | vlak | Warme vlakken: heroband, chips, geneste kaarten. |
| Linnen | `#ECEEE8` | vlak | Rustig koel vlak voor Zakelijk, offerte, staffels en specificatietabellen. |
| Studio | `#EFEDE8` | vlak | Achtergrond van elke productrender en van het beeldvlak in productkaarten (naadloos). |
| Wit | `#FFFFFF` | vlak | Productkaarten, invoervelden, drawers; tekst op de primaire knop. |
| Lijn | `#E4D6BE` | vlak | Decoratieve scheidingslijnen (draagt geen informatie). |
| Bordeaux | `#8A1538` | fout | Fouten: kop, icoon en linkerrand van foutmeldingen, veldfout-tekst en -rand. Nooit een gevuld vlak, nooit een knop. |
| Foutroze | `#FBEAEA` | fout | Achtergrond van foutmeldingen. |
| Oker | `#865800` | wachten | Levertijd en let-op: "Leverbaar over 2–3 weken" (tekst + stip), kop van let-op-meldingen. |
| Okerlicht | `#FFF4DA` | wachten | Achtergrond van let-op-meldingen (drukproef nodig, levertijd). |
| Mos | `#E4EEE8` | vertrouwen | Achtergrond van succesmeldingen (Polder-tekst). |

**Wijzigingen t.o.v. v2.** Klaproos #BE3A1D → **#C83812**: gekozen zodat er in elk reproductiesysteem een stockkleur binnen
ΔE<sub>00</sub> ≈ 2,3 ligt (Pantone 2349 C 1,6; TCX 17-1449 2,0; RAL 2001 2,2 volgens bron B; Oracal 651-047 2,3, §4.4) en
Wit erop 5,21:1 haalt. Klaproos donker #9A2F17 → #982A0E (alleen nog ingedrukt). Bordeaux #8C1D2B → #8A1538: blauwer, verder
van Klaproos. Zon heeft geen taken meer als vinkje, focusring, voorraadstip of knop op donker.

### 4.2 Regels

- **Primaire knop:** Klaproos met Wit. Hover: Inkt (verschil met rust 3,04:1, dus ook zonder kleurzien te zien).
  Ingedrukt: Klaproos donker. Focus: 3 px Inkt-ring, 2 px afstand. Bezig: ‘Toevoegen…’. Klaar: vinkje + ‘Toegevoegd’, 1,5 s.
- **Secundaire knop:** Polder met Zand, hover Inkt. **Omlijnd:** Inkt-rand, hover Inkt-vlak met Zand-tekst.
- **Op Polder:** primaire knop Zand met Inkt-tekst (Klaproos haalt daar 1,82:1). **Op Inkt:** Klaproos mag (3,04:1).
- **Tekst:** Inkt; secundair Kiezel. Links zijn Inkt en onderstreept (1,5 px, offset 3 px; hover 3 px).
  Klaproos als tekst alleen in koppen vanaf 24 px op Zand of Wit.
- **Prijs:** Inkt, Figtree 700, tabular. **Actieprijs:** in een Zon-label met vlaggetjes-inkeping, Inkt-tekst; van-prijs
  Kiezel doorgestreept. Zo scan je acties in een raster zonder dat ze op een knop of fout lijken.
- **Voorraad:** Op voorraad = Polder + groene stip. Leverbaar over x weken = Oker + Oker-stip. Uitverkocht = Kiezel + open
  cirkel. Altijd tekst, nooit alleen kleur.
- **Meldingen:** getint vlak + linkerrand 5 px + icoon + vetgedrukte kop. Fout = Foutroze/Bordeaux, let op =
  Okerlicht/Oker, succes = Mos/Polder.
- **Focus:** 3 px, 2 px afstand. Inkt op licht, Zand op Polder en Inkt.
- **Onderscheid kopen/fout:** Klaproos (tint 44°) is altijd een gevuld vlak met witte tekst; Bordeaux (tint 13°)
  is altijd tekst, icoon en rand op Foutroze. ΔE<sub>00</sub> tussen beide: 23,8.

### 4.3 Shopify-kleurschema’s

Zes schema’s in `tokens.json` → `shopify_color_schemes`: 1 pagina (Zand), 2 kaart (Wit), 3 Duin, 4 Zakelijk (Linnen,
Polder-knop), 5 Polder (Zand-knop), 6 Inkt (Klaproos-knop). Elk schema haalt AA op tekst en knoplabel en 3:1 voor het
knopvlak.

### 4.4 Reproductie: kleurreferenties per materiaal

Per kleur de dichtstbijzijnde stockkleur in elk systeem, met CIEDE2000 tegen de merkkleur. **Dit zijn digitale
benaderingen uit open datasets, niet fysiek afgetekend.** Kies de definitieve referentie met de procedure hieronder.

| Kleur | sRGB | CIELAB D50 | CMYK gestreken (FOGRA39) | CMYK ongestreken (FOGRA29) | Pantone C | Pantone TCX (textiel) | RAL Classic (bron B / bron A) | Oracal 651 |
|---|---|---|---|---|---|---|---|---|
| **Klaproos** | `#C83812` | 46,6 / 56,4 / 54,0 | C14 M89 Y100 K4 | C10 M93 Y100 K3 | 2349 C (ΔE 1,6); alt. 173 C (3,5) | 17-1449 TCX Pureed Pumpkin (ΔE 2,0) | RAL 2001 Red orange (2,2) / RAL 2002 Vermilion (4,2) | 651-047 orange red (ΔE 2,3) |
| **Zon** | `#FFC23A` | 82,5 / 13,9 / 72,0 | C0 M28 Y83 K0 | C0 M21 Y83 K0 | 136 C (ΔE 1,2); alt. 1225 C (2,0) | 13-0759 TCX Solar Power (ΔE 2,2) | RAL 1028 Melon yellow (6,5) / RAL 1021 Colza yellow (3,4) | 651-021 yellow (ΔE 3,6) |
| **Polder** | `#154F3E` | 29,6 / -23,0 / 4,4 | C87 M42 Y73 K45 | C91 M45 Y75 K33 | 6161 C (ΔE 1,6); alt. 3305 C (2,7) | 19-5420 TCX Evergreen (ΔE 3,4) | RAL 6016 Turquoise green (3,3) / RAL 6028 Pine green (3,9) | 651-613 forest green (ΔE 4,3) |
| **Inkt** | `#1D2420` | 13,4 / -4,1 / 1,6 | C76 M61 Y66 K78 | C84 M73 Y62 K64 | Black 3 C (ΔE 1,9); alt. 419 C (2,9) | 19-5708 TCX Jet Set (ΔE 3,1) | RAL 7021 Black grey (5,6) / RAL 9017 Traffic black (6,3) | 651-070 black (ΔE 8,8) |
| **Zand** | `#FBF6EC` | 97,1 / 0,5 / 5,4 | C2 M4 Y9 K0 | C2 M4 Y7 K0 | 9224 C (ΔE 2,8); alt. 9285 C (3,3) | 11-0607 TCX Sugar Swizzle (ΔE 2,1) | RAL 9001 Cream (2,9) / RAL 9001 Cream (3,4) | 651-010 white (ΔE 8,1) |

- **Pantone U** (ongestreken papier): zelfde nummer met U, maar de U-staal oogt doffer en lichter. Er was geen betrouwbare
  digitale U-dataset; kies op de Formula Guide Uncoated naast de afgetekende C-staal.
- **Pantone TPG** (papieren staal voor textiel en interieur): gebruik hetzelfde nummer als de TCX-referentie (bv. 17-1449 TPG
  naast 17-1449 TCX) om met ontwerpers en drukkers te communiceren; TPG is niet apart digitaal vergeleken.
- **Ongestreken papier:** Klaproos verschuift in proces-CMYK zichtbaar (proefdruk-ΔE ≈ 12 tegen het scherm).
  Visitekaartjes en briefpapier op ongestreken stock: als Pantone-steunkleur drukken, of een drukproef aftekenen.
- **RAL:** de twee bronnen verschillen per kleur (zie tabel). Vergelijk fysiek op de RAL K7-waaier voordat je
  frames, borden of een bus laat lakken.
- **Inkt in folie:** de dichtstbijzijnde Oracal-kleur is gewoon zwart (ΔE ≈ 9). Voor belettering is dat de bedoeling:
  gebruik Oracal 070 zwart.
- **Zand als drukkleur:** op doek als steunkleur (TCX-referentie); op papier niet bedrukken maar crème/naturel papier kiezen.

**Toleranties (voorstel):** drukwerk op gestreken papier ΔE<sub>00</sub> ≤ 2 tegen de afgetekende Pantone C; textiel en
folie ΔE<sub>00</sub> ≤ 3 tegen de afgetekende TCX-staal of folie.

**Aftekenen vóór de eerste productie**

1. Bestel de waaiers: Pantone Formula Guide C + U, Pantone FHI Cotton TCX (of het staalboek van de doekleverancier),
   RAL K7, Oracal 651/751-kleurkaart.
2. Gebruik deze pagina of de brand sheet niet als kleurreferentie: een printer of scherm is geen standaard.
3. Leg per kleur de drie dichtstbijzijnde stalen naast elkaar in D50-licht (lichtbak) en daglicht. Kies er één.
4. Vraag de doekleverancier een lab-dip of stofstaal van Klaproos (doel: de gekozen TCX, ΔE<sub>00</sub> ≤ 3) en van de
   opdrukkleur Zand op Klaproos en Inkt.
5. Noteer per kleur in onderstaande tabel en in `tokens.json` → `print.colors` wat gekozen is, door wie en wanneer.
   Pas daarna stockkleuren, doek en bus-belettering bestellen.

| Kleur | Papier (Pantone C) | Textiel (TCX / lab-dip) | Lak (RAL) | Folie (Oracal) | Afgetekend door | Datum |
|---|---|---|---|---|---|---|
| Klaproos | | | | | | |
| Zon | | | | | | |
| Polder | | | | | | |
| Inkt | | | | | | |
| Zand | | | | | | |

**Bronnen en methode.** sRGB → CIELAB met de standaardformules (D65, Bradford naar D50); ΔE = CIEDE2000; code in
`tools/color3.py`, uitvoer in `tools/_repro.json`. CMYK met Pillow/LittleCMS 2.19, relatief colorimetrisch +
zwartpuntcompensatie, profielen Adobe ‘Coated FOGRA39 (ISO 12647-2:2004)’ en ‘Uncoated FOGRA29 (ISO 12647-2:2004)’.
Datasets (alle onofficieel; aantallen: pantone_c 3219, pantone_tcx 2310, ral_a 215, ral_b 213, oracal651 61):

- Pantone Solid Coated 2024 (3219 kleuren), Lab D50, onofficieel: gemeten uit de kleurvoorbeelden op pantone.com (README van de repo): https://github.com/aj90909/unofficial-pantone-solid-coated-2024-v5/blob/3d6ad83683cebc13ec859a675eae2a4c29bfd4d8/output.json
- Pantone FHI Cotton TCX, naam + sRGB-hex, onofficieel: https://github.com/pedroduke/pantone-tcx/blob/566d68d90f35047a6a1dfca28786b149269184e1/src/pantoneColors.js
- RAL Classic, sRGB-hex (bron A): https://github.com/ieskudero/ral-colors/blob/55e9cfc3d0b333af74c56acad6bd1aeee840d83a/RAL/classic.js
- RAL Classic, sRGB-hex (bron B; de repo noemt het zelf "preview HEX approximate"): https://github.com/office952/workos-vscode/blob/a1c28854dbeee553c8420c4639c8145ebe9d9230/frontend/src/lib/colorRegistry/import/sources/ral_standard.csv
- ORACAL 651 snijfolie, sRGB "parsed from ORAFOL ORACAL 651 product page (sample colors)": https://github.com/office952/workos-vscode/blob/a1c28854dbeee553c8420c4639c8145ebe9d9230/frontend/src/lib/colorRegistry/import/sources/oracal651-orafol.txt
- Adobe "Coated FOGRA39 (ISO 12647-2:2004)", git-lfs sha256 da2b9b59...ce77: https://github.com/ConRes/conres.io/blob/800dbc48d23cc3305c5176296a369e6af23ee1ab/testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/CoatedFOGRA39.icc
- Adobe "Uncoated FOGRA29 (ISO 12647-2:2004)", git-lfs sha256 9af0eb03...c392: https://github.com/ConRes/conres.io/blob/800dbc48d23cc3305c5176296a369e6af23ee1ab/testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/UncoatedFOGRA29.icc

### 4.5 Minimummaten per methode

Breedte van het hele logo of symbool. Berekend uit de geometrie: minimale breedte = vereiste lijn (of opening) ÷ aandeel
van de kleinste lijn (of opening) in de logobreedte, de grootste van de twee. Kleinste lijn en opening: logo.svg 65 (vlaggenstok) en 56 (k–l) op 3908 breed; logo-klein 112 en 96 op 4228; mark 65 en 65 op 816; mark-klein 112 en 130. Openingen zijn gemeten als kortste afstand tussen twee losse vormen (`tools/build.py` → `min_gap`).

| Methode | Kleinste lijn / opening (aanname) | logo.svg | logo-klein | mark | mark-klein |
|---|---|---:|---:|---:|---:|
| Borduren (satijnsteek) | 1,2 / 1 mm | 73 mm | 46 mm | 16 mm | 9 mm |
| Flock-transfer (geplot) | 1,5 / 1,5 mm | 105 mm | 67 mm | 19 mm | 11 mm |
| Flex-/snijfolie (textiel, geplot) | 1 / 1 mm | 70 mm | 45 mm | 13 mm | 8 mm |
| Snijfolie op bus/bord (Oracal) | 1,5 / 1,5 mm | 105 mm | 67 mm | 19 mm | 11 mm |
| Zeefdruk op textiel | 0,5 / 0,6 mm | 42 mm | 27 mm | 8 mm | 4 mm |
| DTF-transfer | 0,5 / 0,5 mm | 35 mm | 23 mm | 7 mm | 4 mm |
| Sublimatie / digitaal op polyester (luifel, rok) | 0,3 / 0,3 mm | 21 mm | 14 mm | 4 mm | 3 mm |
| Offset / digitaal op papier | 0,15 / 0,15 mm | 11 mm | 7 mm | 2 mm | 2 mm |
| Scherm (1x) | 2 px / 1,5 px | 121 px | 76 px | 26 px | 15 px |

**De mm-waarden per methode zijn werkaannames** (gangbare vuistregels voor satijnsteek, flock, flex, snijfolie, zeefdruk,
DTF, sublimatie en offset), niet met een leverancier gecontroleerd. Leg deze tabel voor aan je borduurder, drukker en
belettering; vul hun echte minimum in `tools/build.py` → `METHODS` in en draai `build.py` opnieuw. Luifel-lock-up pas vanaf
160 mm breed (descriptor-kaphoogte dan 6,2 mm).

### 4.6 WCAG 2.1-contrast van elk gebruikt paar

Berekend met de WCAG-formule voor relatieve luminantie (`tools/contrast.py`, `tools/tokens.py`). Tekst 4,5:1, display-tekst
≥ 24 px vet 3:1, UI-delen (randen, knopvlakken, focusringen, iconen) 3:1. **52 paren, 0 onder de eis.**

| Voorgrond | Achtergrond | Gebruik | Ratio | Eis | Resultaat |
|---|---|---|---:|---:|---|
| inkt `#1D2420` | zand `#FBF6EC` | Lopende tekst op pagina | 14,71:1 | 4,5:1 | AAA |
| inkt `#1D2420` | duin `#F2E8D5` | Tekst op heroband/chips | 13,04:1 | 4,5:1 | AAA |
| inkt `#1D2420` | wit `#FFFFFF` | Tekst op kaarten/velden | 15,84:1 | 4,5:1 | AAA |
| inkt `#1D2420` | linnen `#ECEEE8` | Zakelijk-blokken | 13,55:1 | 4,5:1 | AAA |
| inkt `#1D2420` | studio `#EFEDE8` | Badges op het beeldvlak | 13,54:1 | 4,5:1 | AAA |
| inkt `#1D2420` | zon `#FFC23A` | Actie-badge en actieprijs-label | 9,83:1 | 4,5:1 | AAA |
| inkt `#1D2420` | foutroze `#FBEAEA` | Uitleg in foutmelding | 13,62:1 | 4,5:1 | AAA |
| inkt `#1D2420` | okerlicht `#FFF4DA` | Uitleg in let-op-melding | 14,49:1 | 4,5:1 | AAA |
| inkt `#1D2420` | mos `#E4EEE8` | Uitleg in succesmelding | 13,35:1 | 4,5:1 | AAA |
| kiezel `#5D625C` | zand `#FBF6EC` | Specs, btw-regel | 5,79:1 | 4,5:1 | AA |
| kiezel `#5D625C` | duin `#F2E8D5` | Specs op Duin | 5,13:1 | 4,5:1 | AA |
| kiezel `#5D625C` | wit `#FFFFFF` | Specs op kaart, van-prijs | 6,24:1 | 4,5:1 | AA |
| kiezel `#5D625C` | linnen `#ECEEE8` | Specs in Zakelijk | 5,33:1 | 4,5:1 | AA |
| kiezel `#5D625C` | studio `#EFEDE8` | Bijschrift op beeldvlak | 5,33:1 | 4,5:1 | AA |
| polder `#154F3E` | zand `#FBF6EC` | Op voorraad, links in Zakelijk | 8,78:1 | 4,5:1 | AAA |
| polder `#154F3E` | wit `#FFFFFF` | Op voorraad op kaart | 9,46:1 | 4,5:1 | AAA |
| polder `#154F3E` | duin `#F2E8D5` | Op voorraad op Duin | 7,78:1 | 4,5:1 | AAA |
| polder `#154F3E` | linnen `#ECEEE8` | Zakelijk-koppen | 8,09:1 | 4,5:1 | AAA |
| polder `#154F3E` | mos `#E4EEE8` | Succesmelding (kop) | 7,97:1 | 4,5:1 | AAA |
| bordeaux `#8A1538` | foutroze `#FBEAEA` | Foutmelding (kop) | 8,04:1 | 4,5:1 | AAA |
| bordeaux `#8A1538` | wit `#FFFFFF` | Veldfout onder invoerveld | 9,35:1 | 4,5:1 | AAA |
| bordeaux `#8A1538` | zand `#FBF6EC` | Veldfout op pagina | 8,68:1 | 4,5:1 | AAA |
| oker `#865800` | zand `#FBF6EC` | Leverbaar over 2–3 weken | 5,72:1 | 4,5:1 | AA |
| oker `#865800` | wit `#FFFFFF` | Leverbaar over 2–3 weken (kaart) | 6,16:1 | 4,5:1 | AA |
| oker `#865800` | okerlicht `#FFF4DA` | Let-op-melding (kop) | 5,63:1 | 4,5:1 | AA |
| oker `#865800` | duin `#F2E8D5` | Levertijd op Duin | 5,07:1 | 4,5:1 | AA |
| wit `#FFFFFF` | klaproos `#C83812` | Primaire knop | 5,21:1 | 4,5:1 | AA |
| wit `#FFFFFF` | inkt `#1D2420` | Primaire knop, hover | 15,84:1 | 4,5:1 | AAA |
| wit `#FFFFFF` | klaproos donker `#982A0E` | Primaire knop, ingedrukt | 7,86:1 | 4,5:1 | AAA |
| zand `#FBF6EC` | polder `#154F3E` | Secundaire knop, footer, utility-balk | 8,78:1 | 4,5:1 | AAA |
| wit `#FFFFFF` | polder `#154F3E` | Secundaire knop (wit label) | 9,46:1 | 4,5:1 | AAA |
| zand `#FBF6EC` | inkt `#1D2420` | Met jouw logo-badge, donkere banden | 14,71:1 | 4,5:1 | AAA |
| inkt `#1D2420` | zand `#FBF6EC` | Primaire knop op Polder (Zand vlak, Inkt label) | 14,71:1 | 4,5:1 | AAA |
| zon `#FFC23A` | inkt `#1D2420` | Accent op Inkt (vlag, actie) | 9,83:1 | 4,5:1 | AAA |
| zon `#FFC23A` | polder `#154F3E` | Accent op Polder (vlag, actie) | 5,87:1 | 4,5:1 | AA |
| klaproos `#C83812` | zand `#FBF6EC` | Display-kop op pagina (>= 24 px) | 4,84:1 | 3,0:1 | AA groot |
| klaproos `#C83812` | wit `#FFFFFF` | Display-kop op kaart (>= 24 px) | 5,21:1 | 3,0:1 | AA groot |
| kiezel `#5D625C` | wit `#FFFFFF` | Rand invoerveld (UI-deel) | 6,24:1 | 3,0:1 | voldoet (UI) |
| kiezel `#5D625C` | zand `#FBF6EC` | Rand invoerveld op pagina (UI-deel) | 5,79:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | zand `#FBF6EC` | Primaire knop tegen pagina (UI-deel) | 4,84:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | duin `#F2E8D5` | Primaire knop tegen Duin (UI-deel) | 4,29:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | wit `#FFFFFF` | Primaire knop tegen kaart (UI-deel) | 5,21:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | linnen `#ECEEE8` | Primaire knop tegen Linnen (UI-deel) | 4,46:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | inkt `#1D2420` | Primaire knop op Inkt-vlak (UI-deel) | 3,04:1 | 3,0:1 | voldoet (UI) |
| inkt `#1D2420` | zand `#FBF6EC` | Hover-knop / focusring op licht (UI-deel) | 14,71:1 | 3,0:1 | voldoet (UI) |
| polder `#154F3E` | zand `#FBF6EC` | Secundaire knop tegen pagina (UI-deel) | 8,78:1 | 3,0:1 | voldoet (UI) |
| polder `#154F3E` | linnen `#ECEEE8` | Primaire knop Zakelijk tegen Linnen (UI-deel) | 8,09:1 | 3,0:1 | voldoet (UI) |
| zand `#FBF6EC` | polder `#154F3E` | Focusring + Zand-knop op Polder (UI-deel) | 8,78:1 | 3,0:1 | voldoet (UI) |
| zand `#FBF6EC` | inkt `#1D2420` | Focusring op Inkt (UI-deel) | 14,71:1 | 3,0:1 | voldoet (UI) |
| bordeaux `#8A1538` | foutroze `#FBEAEA` | Linkerrand + icoon foutmelding (UI-deel) | 8,04:1 | 3,0:1 | voldoet (UI) |
| bordeaux `#8A1538` | wit `#FFFFFF` | Rand van een veld met fout (UI-deel) | 9,35:1 | 3,0:1 | voldoet (UI) |
| oker `#865800` | zand `#FBF6EC` | Stip "leverbaar over x weken" (UI-deel) | 5,72:1 | 3,0:1 | voldoet (UI) |

**Niet toegestaan** (staat erbij zodat niemand het probeert):

| Voorgrond | Achtergrond | Wat | Ratio | |
|---|---|---|---:|---|
| zon | zand | Zon als tekst of rand op licht | 1,50:1 | niet gebruiken |
| zon | wit | Zon als tekst of rand op wit | 1,61:1 | niet gebruiken |
| klaproos | duin | Klaproos als gewone tekst (alleen display >= 24 px op Zand/Wit) | 4,29:1 | niet gebruiken |
| klaproos | inkt | Klaproos-tekst op Inkt | 3,04:1 | niet gebruiken |
| klaproos | polder | Klaproos op Polder (ook als knop) | 1,82:1 | niet gebruiken |
| kiezel | inkt | Kiezel op donker | 2,54:1 | niet gebruiken |
| wit | bordeaux | Bordeaux als gevuld vlak (fout is nooit een knop) | 9,35:1 | niet gebruiken |

## 5. Typografie

| Rol | Font | Shopify `font_picker`-handle | CSS-fallback |
|---|---|---|---|
| Display, H1, H2 | Mona Sans ExtraBold | `mona_sans_n8` | `"Arial Black", "Helvetica Neue", Arial, sans-serif` |
| H3, H4, kaarttitels | Mona Sans Bold | `mona_sans_n7` | idem |
| Tekst | Figtree Regular | `figtree_n4` | `"Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| Labels, navigatie | Figtree SemiBold | `figtree_n6` | idem |
| Knoppen, prijzen | Figtree Bold | `figtree_n7` | idem |
| Descriptor in lock-ups | Figtree ExtraBold, kapitalen, omgezet naar paden | – | – |

**Waarom:** Mona Sans is een zware grotesk met vierkante schouders: hij past bij het geconstrueerde woordmerk en bij stalen
frames, en geeft een tent van € 679 of 40 bedrukte hoezen gewicht. Hij heeft een gewone nul, zodat ‘Ø 80 cm’ in een
producttitel leesbaar blijft. Figtree is rond, open en vriendelijk voor lopende tekst. Hoekig tegen rond houdt de twee uit
elkaar. Getest en afgewezen: Hubot Sans (nul met streep: ‘Ø 80’ leest als ‘Ø 8Ø’), Archivo (v2, te dicht bij Figtree),
Bricolage Grotesque (v1, modieus).

**Bewijs dat de handles bestaan.** shopify.dev is vanuit deze omgeving geblokkeerd. De tabel ‘Available fonts’ van
https://shopify.dev/docs/storefronts/themes/architecture/settings/fonts#available-fonts staat als kopie (opgehaald
2026-09-22) in https://github.com/itsmylife44/shopify-theme-builder/blob/0d6d758a5a1ea120e6f1d8caf40c06a29fa48f0f/skills/shopify-theme-builder/studio/server/shopify-fonts.json
(261 families). Daarin: Mona Sans `mona_sans_n2`…`n9` (+ cursief), Figtree `figtree_n3`…`n9`. Daarnaast eerder gezien:
Figtree n4/n6/n7 als font-CDN-pad in echte winkels
(https://github.com/mrshahbazdev/shopify-section-factory-clone/blob/f2b6217daa4961e435b959c3d5ec3bc5935c4982/app/sections/featured-collection-9.liquid).
Betrouwbaarheid: waarschijnlijk (kopie van de officiële lijst, niet de lijst zelf).

**Zelf hosten als nood.** Ontbreekt een handle in de theme-editor, dan laadt het theme `fonts/MonaSans-VF.ttf` en
`fonts/Figtree-VF.ttf` (SIL OFL 1.1, licenties in `fonts/`) als theme-asset met `@font-face` en `font-display: swap`.

**Schaal** (desktop/mobiel, px): Display 64/40 · H1 48/34 · H2 36/28 (800, regelhoogte 1,0–1,1, spatiëring −0,02 tot
−0,01 em) · H3 22/20 en H4 18/17 (700) · body-lg 19/17 · body 17/16 (regelhoogte 1,55) · small 14 · label 15 (600) ·
eyebrow 12,5 (700, kapitalen, +0,08 em) · prijs 20 (700) · knop 16 (700).

**Cijfers en notatie:** `font-variant-numeric: tabular-nums` op prijzen, maten, aantallen, staffels, ordernummers en
levertijden. `€ 1.145,00` (spatie na €, punt voor duizendtallen, komma voor centen), `3 × 3 m` (echt maalteken), `Ø 80 cm`,
`320 g/m²`, `2–3 weken` (en-dash). Btw in kleine letters: ‘incl. btw’ / ‘excl. btw’.

## 6. Klapklaar Zakelijk

Zelfde merk, andere toon, voor horeca, eventbureaus, verhuurbedrijven, scholen en verenigingen.

- **Kleur:** Linnen-vlak (schema 4), Polder-knoppen, Inkt-tekst. Geen Klaproos-vlakken, geen vlaggenlijn, geen knipoog.
- **Logo:** `svg/logo-zakelijk.svg` (Polder-tent en -label).
- **Prijzen:** standaard excl. btw met schakelaar ‘incl. / excl. btw’; staffeltabel met tabular cijfers.
- **Waar:** `page.zakelijk`, `page.offerte`, de drukproef- en uploadflow, de B2B-catalogus, offerte-PDF, facturen.
- **Volume-nudge op de productpagina:** ‘**Zakelijk?** Vanaf 10 stuks maken we een offerte op maat, op factuur.’ met
  link ‘Offerte aanvragen’. Drempel 10 en ‘op factuur’ zijn claims.
- **Staffel op de productkaart:** wie de badge ‘Staffelprijs’ krijgt, toont ook de staffel: ‘Vanaf 5 st. € 629,00 ·
  vanaf 10 st. € 589,00 p.st.’ (bedragen: voorbeeld).

## 7. Toon van stem

Schrijf alsof je de buurman helpt een tent op te zetten. **Je/jij** overal; algemene voorwaarden, facturen en offertes zijn
zakelijk en volledig (nog steeds je/jij, zonder knipoog).

1. **Antwoord eerst** (maat, prijs, levertijd), uitleg daarna.
2. **Concreet, nooit vaag:** ‘3 × 3 m, Ø 80 cm, 40 mm staal’, nooit ‘ruim assortiment’.
3. **Hooguit één knipoog per scherm.** De knipoog zit in de werkwoorden (klap, klaar, staat), niet in uitroeptekens.
4. **Niets verzinnen:** geen sterren, geen ‘nr. 1’, geen ‘duizenden tevreden klanten’.
5. **Elke lever-, betaal- of serviceclaim** is een theme-instelling die de eigenaar invult en bevestigt
   (`docs/claims-to-confirm.md`). Hieronder gemarkeerd met **[claim]**.
6. **‘Klap’ nooit bij wind, storm, stevigheid of garantie.** Daar spreken specs: staal/aluminium, buisdikte, gewichten,
   haringen, spanbanden.

### 7.1 Wel / niet

| Wel | Niet |
|---|---|
| Dakdoek van 320 g/m² polyester. | Onverwoestbare topkwaliteit! |
| Deze rok past op statafels van Ø 70–85 cm. | Universele pasvorm voor elke tafel. |
| Kies je maat, wij doen de rest. | Ontdek ons ongeëvenaarde assortiment!! |
| Staat in een paar minuten, met twee man. | Klapt in één klap in elkaar. |
| Zet elke poot vast met haringen of een voetgewicht. | Bestand tegen elk weertype. |
| Prijs excl. btw: € 263,64. | Nr. 1 van Nederland · 4,9 sterren · 10.000 tevreden klanten |
| Leverbaar over 2–3 weken. | Bijna uitverkocht! Nog maar 2! (tenzij het echt zo is en uit de voorraad komt) |
| Oeps, dat ging mis. Probeer het nog een keer. | Error 422: Unprocessable entity |

### 7.2 Microcopy per onderdeel van de winkel

**Utility-balk (Polder)** — ‘Snel in huis in NL & BE’ [claim] · ‘Zakelijk bestellen op factuur’ [claim] · ‘Eigen logo?
Eerst een drukproef’ · rechts: ‘Offerte aanvragen’ · ‘Klantenservice’ · ‘Zakelijk’. Vinkjes in Zand.

**Header** — zoekveld: ‘Zoek op product, maat of artikelnummer’ · iconen: ‘Offerte’, ‘Account’, ‘Winkelwagen’ · menu:
Partytenten · Statafels · Rokken & hoezen · Met jouw logo · Accessoires · Meubilair · Verlichting · Actie (Zon-badge) ·
Zakelijk. Mobiel: ‘Menu’ / ‘Sluiten’.

**Hero (home)** — ‘Uitklappen. Neerzetten. Feest.’ · ‘Easy-up tenten, statafels met rokken, verlichting en meubilair.
Voor je tuinfeest, je club of je evenement.’ · knoppen ‘Bekijk partytenten’ / ‘Naar statafels’ · onder de knoppen: ‘Voor
bedrijf, club of verhuur? Vraag een offerte op maat aan.’ · prijschip op het beeld: ‘Easy-up partytent 3 × 3 m · Premium ·
320 g/m² — vanaf € 319’ [prijs: voorbeeld].

**Collectiepagina** — titel = categorie (‘Easy-up partytenten’) · intro 1–2 zinnen met waarvoor en welke maten · teller
‘24 producten’ · ‘Filteren’ · ‘Sorteer op: Aanbevolen / Prijs laag-hoog / Prijs hoog-laag / Nieuwste’ · geen resultaten:
‘Geen tenten met deze combinatie. Haal een filter weg of bekijk alle partytenten.’ · filterchips ‘Wis alles’.

**Productkaart** — titel · specregel (‘40 mm staal · 320 g/m² dakdoek’, ‘Voor Ø 70–85 cm · stretch’) · swatches ‘+3’ ·
prijs (actie: Zon-label + doorgestreepte van-prijs) · staffelregel bij badge ‘Staffelprijs’ · voorraadregel · knop
‘In mijn winkelwagen’ (bij varianten: ‘Kies je maat’) · badges: ‘Actie −12%’ (Zon), ‘Nieuw’ (Polder), ‘Met jouw logo’
(Inkt + vlaggetje), ‘Staffelprijs’ (Linnen).

**Productpagina** — eyebrow = categorie · titel · specregel · prijs met ‘incl. btw / excl. btw’ · voorraad: ‘Op voorraad’,
‘Leverbaar over 2–3 weken’, ‘Tijdelijk uitverkocht’ · levering: ‘morgen in huis bij bestelling vóór 14:00’ [claim] ·
optielabels ‘Maat’, ‘Diameter’, ‘Kleur: Klaproos’, ‘Rok: Strik wit’ · niet-leverbare optie: doorgestreept, schermlezer
‘niet leverbaar’ · ‘Maatgids’ + ‘Twijfel je over de maat? De maatgids rekent het voor je uit.’ · aantal ‘Aantal’ met −/+
(‘Eén minder’, ‘Eén meer’) · knop ‘In mijn winkelwagen · € 339,80’ (live totaal) → ‘Toevoegen…’ → vinkje + ‘Toegevoegd’
(1,5 s) · uitverkocht: ‘Uitverkocht’ (uitgeschakeld) + ‘Mail me als hij terug is’ (alleen met app) · zakelijk-nudge (§6) ·
tabbladen ‘Beschrijving’, ‘Specificaties’, ‘Levering & retour’, ‘Opzetten & onderhoud’ · veiligheid: ‘Staat stevig, ook als
het waait. Zet elke poot vast met haringen of een voetgewicht van 15 kg. Bij harde wind: dak eraf.’ · reviews alleen als
een review-app data levert; anders niets (geen lege sterren).

**Met jouw logo (bedrukking)** — kaart: ‘Statafelhoes met jouw logo · vanaf € 39,95 per stuk’ [prijs: voorbeeld] · ‘Upload
je logo, je krijgt eerst een drukproef ter akkoord. Vanaf 10 st. staffelprijs.’ · knop ‘Ontwerp je hoes’ / ‘Ontwerp je
tent’ · upload ‘Logo uploaden (PDF, AI, EPS of SVG)’ · hulptekst ‘Geen vectorbestand? Stuur een PNG van minimaal 2000 px
breed, dan maken wij hem drukklaar.’ [claim] · melding ‘Eerst je akkoord, dan drukken we. De levertijd gaat in na je
akkoord.’ · positie ‘Voorkant’, ‘Rondom’, ‘Topcover’ · bij klantlogo’s geldt dezelfde maatvoering als in §8.4.

**Toegevoegd (toast/drawer)** — ‘Klaar! Hij staat erin.’ · ‘Statafelrok stretch Ø 80 cm, zwart, ligt in je winkelwagen.’ ·
‘Naar winkelwagen’ / ‘Verder winkelen’ · upsell ‘Nog een statafel erbij?’ of ‘Vergeet de haringen niet’.

**Winkelwagen** — ‘Je winkelwagen (2)’ · regel: titel, variant, aantal, ‘Verwijderen’ · drempel ‘Nog € 23,10 tot gratis
verzending’ / ‘Je verzending is gratis’ [claim] · ‘Opmerking bij je bestelling (bv. leverdatum of locatie)’ ·
‘Subtotaal (incl. btw)’ · ‘Verzendkosten berekenen we bij het afrekenen’ · ‘Afrekenen’ · zakelijk: ‘Liever een offerte
voor deze winkelwagen?’.

**Lege winkelwagen** — ‘Nog niks in je winkelwagen.’ · ‘Zonde van een goed feest. Begin bij de partytenten, of kijk wat er
in de actie zit.’ · ‘Bekijk partytenten’.

**Zoeken** — kopjes ‘Producten’, ‘Categorieën’, ‘Pagina’s’ · ‘Alle resultaten voor ‘3x3’’ · geen resultaten: ‘Niks
gevonden voor ‘partytnt’. Check de spelling, of zoek op maat (3x3) of product (statafel).’

**Fouten en validatie** — ‘Oeps, dat ging mis. We konden je winkelwagen niet bijwerken. Probeer het nog een keer, of bel of
app ons: dan regelen we het samen.’ · ‘Vul je e-mailadres in.’ · ‘Vul je hele postcode in, dan weten we waar de tent heen
moet.’ · ‘Dit e-mailadres klopt niet helemaal. Check de @ en de punt.’ · ‘Er zijn er nog 3 op voorraad. We hebben je aantal
aangepast.’ · ‘Dit bestand is groter dan 20 MB. Stuur een kleinere versie of mail hem naar ons.’ [limiet: claim].

**Offerte en contact** — ‘Offerte op maat aanvragen’ · velden ‘Bedrijfsnaam’, ‘Contactpersoon’, ‘E-mailadres’,
‘Telefoon’, ‘Aantal’, ‘Gewenste leverdatum’, ‘Logo uploaden’, ‘Toelichting’ · ‘Offerte aanvragen’ · succes: ‘Klaar! Je
offerteaanvraag is binnen. We sturen je binnen één werkdag een offerte.’ [claim] · contact: ‘Stel je vraag’ · ‘Bedankt, we
hebben je bericht. We reageren binnen één werkdag.’ [claim].

**Nieuwsbrief** — ‘Eerst weten wanneer er actie is?’ · ‘Je e-mailadres’ · ‘Aanmelden’ · ‘Aangemeld. Je hoort van ons als
er iets te vieren valt.’ · geen kortingsbelofte tenzij die bestaat.

**Account** — ‘Inloggen’, ‘Je bestellingen’, ‘Bestelling #1042’, ‘Adressen’, ‘Uitloggen’ · zakelijk: ‘Je offertes’,
‘Nabestellen’.

**404** — ‘Deze pagina is ingeklapt.’ · ‘De link klopt niet (meer). Zoek wat je nodig hebt, of begin bij de partytenten.’ ·
‘Naar de homepage’ / ‘Bekijk partytenten’. (De enige plek waar ‘klap’ negatief mag: het gaat over een pagina.)

**Wachtwoordpagina** — ‘We zetten de laatste tenten neer.’ · ‘Laat je e-mailadres achter, dan hoor je het als we open
zijn.’

**Cadeaubon** — ‘Je cadeaubon van € 50’ · ‘Gebruik de code bij het afrekenen.’ · ‘Code kopiëren’ / ‘Gekopieerd’.

**Footer** — kolommen ‘Winkel’, ‘Zakelijk’, ‘Hulp’, ‘Over Klapklaar’ · ‘Bel of app ons’ [claim: nummer, tijden] ·
‘Algemene voorwaarden’, ‘Privacy’, ‘Cookies’, ‘Retourneren’, KvK- en btw-nummer [claim].

**Alt-teksten** — ‘[product], [kleur], [standpunt]’: ‘Easy-up partytent 3 × 3 m Klaproos, schuin vooraanzicht’. Bij een
voorbeeldopdruk: ‘… met voorbeeldopdruk Klapklaar op de luifel’.

## 8. Productbeeld (render-regie)

Er zijn geen foto’s. Elk productbeeld is een fotorealistische 3D-render uit `renders/` (three.js, headless Chromium).
Cartoons en vlakke illustraties komen niet in de winkel.

### 8.1 Opbouw

- **Achtergrond:** naadloos **Studio #EFEDE8**, exact gelijk aan het beeldvlak van de productkaart. Nooit wit-op-wit,
  geen sfeerfoto als hoofdbeeld, geen tekst of badges in het beeld (badges zijn HTML).
- **Formaat:** vierkant master 2000 × 2000 px, WebP q88 (JPEG-fallback). Hero-banners 1800 × 1100.
- **Standpunten** (lens 22°, product vult 80%): 1 hoofdbeeld `hero` (azimut 34°, elevatie 17°) · 2 vooraanzicht
  `front` 0°/6° · 3 zij/achter `side` 90°/6° of `back` · 4 detail (hoekstuk + schaar, rokzoom, strik, bladrand) · 5 in
  gebruik (ingeklapt, met zijwanden, met statafels eronder) · 6 optioneel `top` of `low`.
- **Licht:** softbox linksboven met zachte, convergerende schaduw; koepellicht voor occlusie; contactschaduw onder voeten
  en zomen; belichting per materiaal (wit doek houdt tekening, zwart lycra houdt glans).
- **Varianten:** exact dezelfde camera, positie en licht, zodat een swatch-klik het beeld wisselt zonder te verspringen.
- **Eerlijk:** de render toont alleen wat in de doos zit. Opdruk alleen bij bedrukte producten; een voorbeeldopdruk heet
  ‘voorbeeld’ in de alt-tekst en bij het product.

### 8.2 Kleur in de render

Merk- en variantkleuren worden in de render **gemeten**, niet geschat: `tools/measure_render.py` neemt de verzadigde
productpixels, deelt ze in lichtheidsbanden en middelt in lineair licht. Eis: het belichte vlak ligt binnen
ΔE<sub>00</sub> 3 van de staal.

| Beeld | Belicht vlak | Middentoon | Schaduwvlak | Staal |
|---|---|---|---|---|
| v3 `img/tent-3x3-klaproos-hero.webp` | #CD3916 (ΔE 1,2) | #BB3312 (ΔE 3,1) | #9C280B (ΔE 9,9) | #C83812 |
| v2 (staal #BE3A1D) | #E2887F (ΔE 23,2) | #E7553D (ΔE 11,8) | #D5482D (ΔE 6,3) | #BE3A1D |

Oorzaak van de afwijking in v2: witte glans (sheen en clearcoat) op het doek en een automatische belichting die
donkere kleuren ophaalt. Oplossing: afwerking `"finish": "mat"` voor bedrukbaar polyester en de gemeten ingangskleur
**#9B2502** voor Klaproos (`tokens.json` → `render`). Herhaal de meting als het licht of de renderer verandert
(`tools/calibrate.py`).

### 8.3 Google Shopping en feed

Het standaardbeeld van elke tent die in Klaproos leverbaar is, is de **Klaproos-variant zonder opdruk** op Studio-grijs
(`img/tent-3x3-klaproos-hero.webp`): valt op tussen witte tenten op wit en is toch het echte product. Zet die variant als
eerste variant. **Voorwaarde [claim]:** de doekleverancier levert Klaproos (lab-dip, §4.4). Levert hij alleen zijn eigen
‘rood’, render dan die gemeten kleur en noem hem ‘Rood’, niet Klaproos. De versie mét Klapklaar op de luifel
(`img/tent-3x3-klaproos-logo-hero.webp`) is alleen voor de bedrukte-tent-pagina (als voorbeeld), banners en social.
Controleer de actuele Google Merchant Center-beeldeisen vóór livegang (konden in deze sessie niet opgezocht worden).

### 8.4 Bedrukking in beeld en op het product

- **Luifel:** `print-wordmark.svg` in één kleur (Zand op Klaproos of Inkt, Inkt op wit). Hoogte 54% van de luifel:
  op een luifel van 21 cm (maat leverancier controleren) 11,3 cm hoog en 34 cm breed, 11% van een zijde van 3 m. Nooit
  breder dan de helft van een zijde. Gecentreerd, op alle vier de zijden. Groter: luifel-lock-up op dak of zijwand.
- **Statafelrok:** `print-mark.svg` 15 cm breed op Ø 80, hart op 27 cm boven de vloer, **op het vlakste deel van de rok:
  halverwege een voet en het midden van het paneel**. Niet op een voet en niet in de plooi tussen twee voeten: daar knikt
  de stretch het beeld (getest in de render, drie posities). Laat de leverancier de positie bevestigen met een proefhoes.
  Klantlogo’s volgen dezelfde regel. Borduren of flock onder 20 mm: `mark-klein`.
- **Bestelbus:** `logo-luifel.svg` op de zijkant, logohoogte ≈ 1/3 van de laadruimte, breedte ≈ 55%; Klaproos-plint van
  15–20 cm als luifelband; achterdeuren alleen beeldmerk + telefoonnummer. Folie: de afgetekende Oracal-kleur (§4.4).
- **Renderer:** opdruk vanaf SVG-pad zit in `tools/renders-svgprint.patch` (svgPrintTexture, `valancePrint: {d, vb,
  color, sides, pad}`, `statafelCover.print: {d, vb, color, width, y, azimuth}`) en de afwerking `finish: "mat"`. De patch
  past schoon op `renders/` van 17-10-2026 (`git apply --check` gecontroleerd). Specs: `tools/render-jobs.jsonl`.

## 9. Iconen

- 24 px raster, lijn 2 px (1,75 px op 20 px), platte uiteinden, ronde hoeken, hoekradius 2 px, `currentColor`.
- Alleen het vlaggetje mag Zon zijn. Geen gevulde of meerkleurige iconen, geen emoji.
- 21 iconen als `<symbol>` in `brand-sheet.html`: levering, factuur, app ons, maatgids, logo uploaden, drukproef, haring,
  wind, tent, statafel, verlichting, zakelijk, winkelwagen, zoeken, account, meer, minder, klaar, info, let op, levertijd;
  plus het vlaggetje.
- Iconen staan altijd naast tekst (header-iconen hebben een zichtbaar label of `aria-label`).

## 10. Vorm, ruimte en beweging (zie `tokens.json`)

- **Radii:** badge 4, knop en invoerveld 8, kaart en beeld 12, paneel 16, chip rond. Stevig, niet bubbelig.
- **Ruimte:** 4-px-raster (4–128). Paginamarge 16/24/40, container max. 1360, sectie-afstand 48 mobiel / 96 desktop,
  aanraakdoel minimaal 44 px.
- **Schaduw:** alleen bij hover op kaarten, sticky header, drawer en toast. Geen schaduw op knoppen.
- **Beweging:** ‘uitklappen’: drawers en accordeons 220 ms `cubic-bezier(.16,1,.3,1)`, geen bounce; knop → vinkje
  ‘Toegevoegd’ 140 ms; toast 220 ms; hover naar Inkt 140 ms. Met `prefers-reduced-motion` alleen opacity ≤ 140 ms.

## 11. Naam, merkrecht en onderscheid

**Naamtoets: NIET GEDAAN.** De enige zoekpoging in deze ronde (‘klapklaar’) werd geweigerd: ‘this turn’s web search budget
is used up (limit: 200 WebSearch calls per turn, shared by every agent)’. DNS vanuit de sandbox werkt niet. Er is dus geen
bewijs dat ‘Klapklaar’ vrij of bezet is. Vóór gebruik:

- KvK Handelsregister: handelsnaam ‘Klapklaar’ en varianten.
- BOIP en EUIPO (TMview): KLAPKLAAR als woord- én beeldmerk in klassen 11 (verlichting), 20 (meubilair, statafels),
  22 (tenten, zeilen), 24 (textiel: rokken, hoezen) en 35 (detailhandel).
- SIDN (klapklaar.nl), DNS Belgium (klapklaar.be), plus .com en .eu.
- Web, Instagram, bol.com, Marktplaats: ‘klapklaar’ alleen, en met ‘partytent’ of ‘statafel’.
- Visueel: logo’s van Nederlandse tentverhuurders en -winkels met een dak boven de letters (veelvoorkomend motief).

**Wat deponeren** (inschatting, geen juridisch advies; laat een merkenadviseur meekijken):
1. Het **beeldmerk** (de k onder de tent met vlag, `mark.svg`) als beeldmerk.
2. Het **complete logo** als gecombineerd woord-/beeldmerk.
3. Het **woordmerk** alleen: voor tenten (22) en klaptafels (20) kan ‘klapklaar’ als beschrijvend gezien worden (‘klaar
   door uitklappen’), met kans op weigering of een zwakke inschrijving.

**Typo-domeinen:** klapklar.nl, klap-klaar.nl (beschikbaarheid niet gecontroleerd).
**Reservenamen** (niet getoetst): **Staklaar** (sta(tafel) + klaar, ‘staat klaar’), **Tentklaar** (direct, minder
onderscheidend).

**Onderscheid van Outmate en Statafelshop:** naam, letters, beeldmerk en kleuren zijn eigen werk. Hun huisstijlkleuren en
logo’s staan niet in `reference/dossier.md` (dat noemt alleen de tentkleuren van Outmate: zwart, wit, blauw, grijs,
zandkleur, groen, rood en full-colour) en konden niet opgezocht worden. Een visuele vergelijking is **nog niet gedaan**.

## 12. Voor de theme- en catalogusbouwers

- `tokens.json` → CSS custom properties en `settings_schema.json`-defaults (kleurschema’s, fonts, componentstaten).
- Header: inline `svg/logo-mono.svg` (Inkt) vanaf 121 px; op mobiel `svg/logo-klein-mono.svg` (wissel met CSS op het
  breekpunt 750 px). Footer: `logo-inverse.svg`.
- Favicon-instelling: `favicon-32.png` (Shopify schaalt zelf). Daarnaast `<link rel="icon" type="image/svg+xml"
  href="favicon.svg">` en wissel naar `svg/favicon-cart.svg` als `cart.item_count > 0`. Apple: `img/apple-touch-icon-180.png`.
- Iconen: neem de `<symbol>`’s uit `brand-sheet.html` over als snippet `icon-sprite.liquid`.
- Actieprijs: Zon-label met `clip-path: polygon(0 0,100% 0,calc(100% - 9px) 50%,100% 100%,0 100%)`, Inkt-tekst, tabular.
- Productbeelden: renders volgens §8 met de patch `tools/renders-svgprint.patch` (`git apply brand/tools/renders-svgprint.patch`).

## 13. Herbouwen

```bash
cd brand/tools
VENDOR=<map met gfonts/ofl/figtree> python3 build.py ..       # logo-, merk- en favicon-SVG's, logo-meta.json, print-json
python3 -I color3.py <colorsrc> ../tools/_repro.json '{"klaproos":"#C83812","zon":"#FFC23A","polder":"#154F3E","inkt":"#1D2420","zand":"#FBF6EC"}'
python3 tokens.py ..                                           # tokens.json + _contrast.json
# productbeelden (eenmalig: cd <repo> && git apply brand/tools/renders-svgprint.patch)
node ../../renders/render.mjs --batch render-jobs.jsonl --samples 32   # schrijft naar brand/img
python3 finish_imgs.py ../img ..                               # cover-uitsnede + kleurmeting (_render_check.json)
python3 calibrate.py ../../renders '#C83812' '#9B2502' /tmp     # alleen als licht of renderer verandert
node rasterize.mjs ..                                          # favicon- en icoon-PNG's (Playwright)
python3 build_sheet.py .. && node shot.mjs file://$PWD/../brand-sheet.html ../brand-sheet.png 1440 900 1
python3 build_md.py ..                                         # dit document (tabellen uit tokens en metingen)
```

`<colorsrc>` bevat de klonen van de bronnen in §4.4 (commits vermeld) en de twee ICC-profielen. Fonts in `fonts/` (Mona Sans,
Figtree) vallen onder de SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
