# Klapklaar merkboek

Versie 4, 17-10-2026. Dit is de bron voor naam, logo, kleur, reproductie, typografie, beeld en toon van de webshop.
Het visuele overzicht staat in [`brand-sheet.html`](brand-sheet.html) (screenshot: `brand-sheet.png`).
Kleuren, kleurschema’s met knopstanden, reproductiereferenties, fonts, radii, spacing, schaduwen, motion en componentstaten
staan machineleesbaar in [`tokens.json`](tokens.json). Alle tabellen met getallen in dit document worden uit de metingen
gegenereerd (`tools/build_md.py`); brand.md en de brand sheet halen ze uit dezelfde bestanden.

> **Naam: NIET GETOETST.** KvK, BOIP/EUIPO en SIDN zijn niet gecontroleerd. In deze ronde geprobeerd en geweigerd:
> WebSearch (“this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)”)
> en de registers zelf via rdap.sidn.nl, rdap.dns.be, dns.google en cloudflare-dns.com (proxy: 403). Er is dus geen bewijs
> dat ‘Klapklaar’ vrij of bezet is. **Jouw beurt:** het toetspakket in §11.1 (± 45 minuten, met beslisregel).
>
> **Niet naast Outmate en Statafelshop gelegd.** Hun logo’s en huisstijlkleuren staan niet in `reference/dossier.md` en konden
> niet opgehaald worden (outmate.nl en statafelshop.nl zijn geblokkeerd). Het vergelijkingsblad in §11.2 is klaar om in te vullen.
>
> **Kleuren op doek, folie en papier: NIET FYSIEK AFGETEKEND.** §4.5 geeft per materiaal de dichtstbijzijnde stockkleur met ΔE
> en een aftekenprocedure. Bestel niets in merkkleur voordat die is doorlopen.

## Wat is er veranderd sinds v3

| Kritiek op v3 | Wat v4 doet |
|---|---|
| Naam niet getoetst, merk niet naast de twee referentiewinkels gelegd | Opnieuw geprobeerd en opnieuw geweigerd (zie boven). Nu een uitvoerbaar toetspakket met beslisregel (§11.1), een vergelijkingsblad (§11.2) en een plan B dat het grootste deel van het merk laat staan: beide reservenamen eindigen op -klaar (§11.3) |
| Logo niet stofvast: dakpunten van 21°, een inkeping van ~40° tussen vlag en dak, minimummaten gebaseerd op de paal die onder de vlag verdween | Dak eindigt in een verticale dakrand van 65, vlag met een stompe punt van 65 en 67 eenheden vrij van het dak, arm van de k onder 21° afgesneden. Kleinste buitenhoek 62°. Minimummaten uit een rastertest die in v3 precies die twee fouten vindt en in v4 geen (§3.2) |
| Poot van de k 16,4 dik tegen stok 13 | Arm en poot op loodrechte dikte getekend: 122 en 126 (0,94–0,97 S) |
| Letterafstanden 56–72 willekeurig, ‘kl’ los | Optische spatiëring (Tracy): recht–recht 88, rond–recht 64, open kant van de k 44. Alle afstanden gemeten en gepubliceerd (§3.2) |
| Onder ~120 px leest de band boven de aa als macron + dakje (‘klapklāār’); letters lijken op Mona Sans | De tent staat nu op de basislijn: dak, band en twee poten, de aa staat eronder. Mona Sans is weg; koppen en tekst zijn Figtree, ver van het hoekige woordmerk (§3.1, §5) |
| Header-logo: §3.3 zegt tweekleurig, §12 zegt `logo-mono` | Eén regel: `svg/logo-inline.svg` inline, letters `currentColor`, tent `class="kk-tent"` met `fill: var(--logo-tent)` (§12) |
| Hover verdwijnt op donkere schema’s; secundaire knop op Zakelijk verandert niet | Hover, ingedrukt en focus per schema in `tokens.json` → `color_schemes`, 30 standen gecontroleerd op label- én vormcontrast, 0 fout (§4.3) |
| ‘Toegevoegd’ dubbelzinnig (Polder in de rol, Klaproos in de knop) | Toegevoegd = Polder-vlak, Zand-label, vinkje. Overal hetzelfde |
| Kleuren buiten het palet (#2E8B57, #E7E3DA); Zon-stip in het winkelwagen-favicon | Voorraadstip Polder, uitgeschakeld = Kiezel-stippelrand, winkelwagenstip Polder. Zon is alleen vlag en voordeel |
| Linnen en Studio niet te onderscheiden, zes bijna-witte vlakken | Vier vlakken (Zand, Duin, Steen, Wit), ΔE-tabel in §4.4. Linnen, Studio, Mos, Foutroze en Okerlicht zijn weg; meldingen staan op Wit met een gekleurde rand |
| 16-px-favicon nooit gebruikt; winkelwagen-favicon zonder JS | `<head>`-markup met 16/32/192 PNG’s en zonder SVG-link, plus de JS voor de winkelwagenstand (§3.7, §12) |
| Overlap van Zon-vlag en Zand-dak in mark.svg | Geen overlap meer; regel voor druk: twee kleuren raken elkaar nooit, dus geen trap nodig (§3.4) |
| brand.md en sheet spraken elkaar tegen (ΔE 12 tegen 11, ‘naast een gekalibreerd scherm’) | Eén bron voor alle getallen; ongestreken proef-ΔE 11,5; aftekenen zonder scherm (§4.5) |
| Alleen renders op grijs, geen praktijkbeeld, geen plek voor echte keurmerken | Regie en shotlijst voor praktijkfoto’s, opstelling-renders als tussenstap, en vaste plekken voor betaalmethoden, contact, bedrijfsgegevens, reviews en keurmerk die leeg blijven zonder echte data (§8.5, §8.6) |
| Rode tent naast rode koopknop op de kaarten | Geen gevulde Klaproos-knop op productkaarten; één Klaproos-knop per kolom (§4.2) |
| `mona_sans_n8` alleen via een kopie van de fontlijst | Figtree n4–n8, elk gewicht gevonden als Shopify-CDN-pad in echte winkels (§5) |

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

**Bekende risico’s.** ‘Klap’ betekent ook een klap of iets dat in elkaar klapt: precies de angst bij goedkope easy-ups in de
wind. Daarom (§7) nooit ‘klap’ bij wind, storm, stevigheid of garantie; daar spreken de specificaties. De samenstelling lokt
typefouten uit (klapklar, klap-klaar): registreer die domeinen mee (§11). Als woordmerk voor tenten en klaptafels kan
‘klapklaar’ als beschrijvend gezien worden; het beschermbare deel is de tent (§11.4).

## 2. Positionering, doelgroepen en merkbelofte

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

Geen letter komt uit een font. `tools/kk.py` construeert elke vorm uit lijnen en Bézier-curves; `tools/build.py` schrijft de
SVG’s; `tools/measure.py` meet wat doek en druk ermee doen. Eenheden: x-hoogte 500.

- **De tent staat op de basislijn.** Een easy-up van voren: twee poten tot op de basislijn, de luifelband (bovenrand op de
  stokhoogte van k en l, 712), een opening, het dak onder 21° met een verticale dakrand, een paal met een wimpel. De dubbele aa
  staat eronder. v3 had alleen dak en band boven de aa; onder ~120 px las dat als ‘klapklāār’.
- **Twee maten.** *STOK* = 130: letterstokken en de luifelband. *DUN* = 65: tentpoten, paal, dakrand en de opening tussen dak
  en band. Kommen boven en onder 112 (optische correctie), arm en poot van de k 122 en 126 loodrecht.
- **Eén hoek: 21°.** Het dak, de bovenkant van k en l, de onderkant van de p, het eind van de r-arm en (nieuw) het eind van de
  k-arm. De k-arm volgt de rechterhelling van het dak.
- **Stofvast.** Geen buitenhoek scherper dan 62° (de teen van de k), geen naaldpunten: de dakrand is 65 hoog (hoek
  111°), de wimpel heeft een stompe punt van 65, de wimpel hangt 67 eenheden boven het dak (loodrecht gemeten).
- **Vierkant-ronde kommen** (superellips, handle 0,66), eenverdiepings-a.
- Alle paden zijn echte, niet-overlappende contouren (buitenkant met de klok mee, binnenvormen ertegenin).

### 3.2 Gemeten

**Lijndiktes** (eenheden, loodrecht op de lijn):

| Lijn | Eenheden | × STOK |
|---|---:|---:|
| stok (k, l, a, p, r stam) | 130 | 1,00 |
| kom boven/onder (a, p) | 112 | 0,86 |
| arm k (loodrecht) | 122 | 0,94 |
| been k (loodrecht) | 126 | 0,97 |
| arm r (verticaal) | 121 | 0,93 |
| luifelband | 130 | 1,00 |
| tentpoot | 65 | 0,50 |
| vlaggenstok | 65 | 0,50 |

**Kortste afstand tussen losse vormen** in logo.svg (exact, tussen de contouren):

| Tussen | Eenheden |
|---|---:|
| k–l (klap) | 44 |
| k–l (klaar) | 44 |
| a – poot (links) | 56 |
| a–a (klaar) | 64 |
| l–a (klap) | 64 |
| p–k (klap|klaar) | 64 |
| band – dak (opening) | 65 |
| a – poot (rechts) | 72 |
| l – poot (links) | 72 |

Spatiëring volgens de Tracy-methode: rechte zijkant 44, ronde zijkant 0,45 daarvan, de open kant van de k 0. Dat geeft
recht–recht 88, rond–recht 64 en k–l 44: gelijk wit, niet gelijke afstanden. De tentpoten zijn dun en horen bij de aa:
l–poot 72, poot–a 56, a–poot 72, poot–r 72.

**Stof- en druktest.** `measure.py` rastert het logo (2 eenheden per pixel) en doet twee morfologische tests. *Openen* met een
schijf vindt lijnen die smaller zijn dan de schijf en punten scherper dan ~50°. *Sluiten* vindt kieren die smaller zijn dan
de schijf en inkepingen scherper dan ~40° (het kruis van de k, 45°, valt erbuiten). Dezelfde test op v3 en v4:

| Bestand | Dunste vorm | Nauwste opening | Waar |
|---|---:|---:|---|
| v3 logo.svg | naaldpunt | naaldkier | dakpunt van 21° bij de dakrand; inkeping tussen vlag en dak |
| v4 logo.svg | 68 | 56 | tentpoot (bouwmaat 65); a–poot (bouwmaat 56) |
| v3 mark.svg | naaldpunt | naaldkier | dakpunt van 21° |
| v4 mark.svg | 68 | 64 | poot en paal; band–dak |

‘Naaldpunt’ en ‘naaldkier’ betekenen: al gevonden bij de kleinste schijf. Hoeken in v4: kleinste punt 62°, kleinste
inkeping 46°.

### 3.3 Bestanden

| Bestand | Gebruik |
|---|---|
| `logo.svg` | Standaard: Inkt-letters, Klaproos-tent. Op Zand, Wit, Duin, Steen. Vanaf 143 px breed. |
| `logo-inverse.svg` | Zand-letters, Zon-tent. Op Polder en Inkt. |
| `svg/logo-inline.svg` | **Theme-header** (inline): letters `currentColor`, tent `class="kk-tent"` (§12). |
| `svg/logo-on-klaproos.svg` | Eén kleur Zand. Op Klaproos (dakdoek, luifel, rode vlakken). |
| `svg/logo-mono.svg` | `currentColor`, één pad. Stempel, gravure, eenkleurig drukwerk. |
| `svg/logo-klein.svg`, `-klein-inverse.svg`, `-klein-inline.svg`, `-klein-mono.svg` | **Klein werk**: 93–142 px op scherm; borduren en flock onder de minimummaat van logo.svg (§3.5, §4.6). |
| `svg/logo-luifel.svg`, `svg/logo-luifel-inverse.svg` | **Luifel-lock-up**: woordmerk + descriptorbalk ‘PARTYTENTEN · STATAFELS’ in kapitalen. Luifel, bus, marktplaatsen, beursstand. Vanaf 160 mm. |
| `svg/logo-zakelijk.svg` | **Klapklaar Zakelijk**: Inkt-letters, Polder-tent, Polder-label ‘ZAKELIJK’. Offertes, facturen, B2B. |
| `mark.svg` | **Beeldmerk**: de k onder de tent, Zand op Klaproos, Zon-vlag (alleen digitaal). Avatar, app-icoon. |
| `svg/mark-polder.svg`, `svg/mark-zand.svg`, `svg/mark-mono.svg` | Varianten van het beeldmerk. |
| `svg/mark-klein.svg`, `svg/mark-klein-mono.svg` | Beeldmerk uit één stuk voor klein borduur- en flockwerk. |
| `svg/print-wordmark.svg`, `svg/print-wordmark-klein.svg`, `svg/print-mark.svg`, `svg/print-mark-klein.svg` | **Drukbestanden**, één kleur (zwart = inkt), één pad. |
| `favicon.svg`, `favicon-32.png` | 32-rastertekening: de k onder de tent. |
| `favicon-192.png` | PWA / Android: het beeldmerk (vector, niet de pixeltekening). |
| `svg/favicon-16.svg`, `img/favicon-16.png` | 16-rastertekening: de tent alleen. |
| `svg/favicon-cart.svg`, `svg/favicon-cart-16.svg`, `img/favicon-cart-32.png`, `img/favicon-cart-16.png` | Winkelwagen gevuld: Polder-stip met Zand-rand linksboven. |
| `svg/apple-touch-icon.svg`, `img/apple-touch-icon-180.png`, `img/mark-512.png` | iOS-icoon (vol vlak, iOS rondt zelf af), social avatar. |
| `svg/pennant.svg`, `svg/vlaggenlijn.svg` | Vlaggetje en vlaggenlijn met stompe punten (motief, scheider). |

### 3.4 Gebruik

- **Vrije ruimte:** rondom minimaal de x-hoogte van de a (1 x). Boven het vlaggetje ook 1 x.
- **Wisselregel op scherm:** `logo.svg` vanaf 143 px breed; `logo-klein` van 93 tot 142 px;
  daaronder het beeldmerk (vanaf 33 px) of het favicon. Berekend uit de gemeten kleinste lijn ≥ 2 px en opening ≥ 1,5 px.
- **Theme-header:** desktop `svg/logo-inline.svg` op 168 px; mobiel (390 px) `svg/logo-klein-inline.svg` op 108 px. Footer op
  Polder: hetzelfde inline logo met `--logo-tent: #FFC23A` en Zand als tekstkleur.
- **Kleur van de tent:** Klaproos (op licht), Zon (op Polder of Inkt), Polder (Zakelijk) of gelijk aan de letters (eenkleurig).
  Nooit Klaproos op Klaproos of op Polder.
- **Twee kleuren op doek, folie en papier:** letters en tent hebben elk één kleur en liggen minstens 56 eenheden uit
  elkaar; de vlag heeft altijd de kleur van de tent. Er is dus geen overlap en geen trap nodig. De Zon-vlag op een Zand-paal
  (`mark.svg`, favicon) raakt de paal en bestaat alleen op schermen.
- **Niet:** uitrekken, smaller maken, draaien, omlijnen, schaduw, verloop; de tent los gebruiken (behalve als beeldmerk of
  vlaggetje); het woord zelf typen in een font; de tent boven een ander woord zetten; gezette kleine letters direct bij het logo.

### 3.5 Klein werk: `logo-klein` en `mark-klein`

| | logo.svg | logo-klein.svg | mark.svg | mark-klein.svg |
|---|---|---|---|---|
| Dak en luifelband | los, opening 65 | één vorm | los, opening 65 | één vorm |
| Poten en paal | 65 | 100 | 65 | 100 |
| Wimpel (h × b, punt) | 160 × 220, punt 65 | 220 × 270, punt 96 | 160 × 220, punt 65 | 220 × 270, punt 96 |
| Letterruimte | optisch | +36 per paar | – | – |
| Kleinste lijn / opening (eenheden) | 65 / 44 | 100 / 80 | 65 / 64 | 100 / 84 |

Wissel naar `logo-klein` zodra `logo.svg` onder zijn minimum komt: borduren onder 95 mm, flock onder 143 mm,
op scherm onder 143 px. `logo-klein` gaat tot 58 mm (borduren), 87 mm (flock) en
93 px; nog kleiner: `mark-klein` (§4.6).

### 3.6 Beeldmerk: de k onder de tent

De k is de eerste letter van Klapklaar, komt twee keer in het woord voor en heeft dezelfde 21°-sneden als het dak. Hij staat
onder dezelfde easy-up als de aa in het woordmerk: poten, band = STOK, opening = DUN, dakrand, paal en wimpel. In een vierkant
Klaproos-vlak is het een herkenbare kleine tent met een letter erin, ook op 32 px.

### 3.7 Favicon

Twee eigen tekeningen, geen verkleind logo:

- **16 px** (`svg/favicon-16.svg`): de tent alleen, uit één stuk (dak, band, poten, paal) in Zand op Klaproos, vlag 3 × 3 px Zon.
  Alle rechte randen op hele pixels.
- **32 px** (`favicon.svg`): de k onder de tent. Tent 24 px breed, poten 2 px, band 3 px, opening dak–band 1 px, paal 2 px,
  k-stok 3 px en 11 px hoog.
- **Winkelwagen** (`svg/favicon-cart*.svg`): Polder-stip met Zand-rand linksboven. Polder = ‘Toegevoegd’.
- **In de `<head>`:** PNG’s met `sizes` 16, 32 en 192, géén `type="image/svg+xml"`-link. Met een SVG-favicon kiezen browsers die SVG
  voor elke maat en wordt de 16-tekening nooit gebruikt. Markup en JS in §12.

### 3.8 Lock-ups en de regel van de a

Het woordmerk heeft een eigen eenverdiepings-a; Figtree heeft een tweeverdiepings-a. Daarom staat er direct bij het logo **nooit
gezette tekst in kleine letters**. Descriptor (luifel) en ‘ZAKELIJK’ zijn in kapitalen (Figtree ExtraBold, omgezet naar paden).
De tagline als zin (‘In één klap feestklaar.’) mag in koppen en tekst, maar niet tegen het logo aan.

### 3.9 Vlaggetje en vlaggenlijn

Het vlaggetje van de paal is het tweede merkteken: opsommingsteken, icoon van de badge ‘Met jouw logo’, motief op tassen. Het
heeft dezelfde stompe punt als in het logo. De vlaggenlijn (`svg/vlaggenlijn.svg`, Klaproos-Zon-Polder-Zon) scheidt secties op
feestelijke momenten: home, actie, bestelbevestiging. **Niet** in Zakelijk, offerte, checkout of bij foutmeldingen.

## 4. Kleur

### 4.1 Palet: dertien kleuren, één rol per kleur

Elke kleur hoort bij één rolfamilie. Klaproos is het merk en de koopknop, en verschijnt alleen als vlak. Zon is de vlag en het
voordeel. Polder is vertrouwen en alles wat ‘klaar’ is. Fouten zijn Bordeaux en nooit een gevuld vlak.

| Naam | Hex | Rolfamilie | Rol |
|---|---|---|---|
| Klaproos | `#C83812` | merk & kopen | Het merkrood, alleen als vlak: de tent in het logo, het Klaproos-dakdoek en de primaire knop (In mijn winkelwagen, Afrekenen). Eén gevulde Klaproos-knop per kolom; nooit op productkaarten in een raster (daar is de Klaproos-tent zelf het rood). Als tekst alleen koppen ≥ 24 px op Zand of Wit. |
| Klaproos donker | `#982A0E` | merk & kopen | Alleen de ingedrukte stand (:active) van de primaire knop. |
| Zon | `#FFC23A` | vlag & voordeel | De vlag: het vlaggetje (digitaal), de tent van het logo op Polder en Inkt, de Actie-badge en het actieprijs-label, altijd met Inkt-tekst. Nooit tekst op licht, nooit een melding of stip. |
| Polder | `#154F3E` | vertrouwen & klaar | Donkere vlakken (utility-balk, footer), secundaire en Zakelijk-knop, en alles wat ‘klaar’ betekent: Op voorraad (stip), Toegevoegd (knop), succesmelding, de winkelwagen-stip in het favicon. |
| Inkt | `#1D2420` | tekst | Tekst, koppen, links (onderstreept), omlijnde knop, focusring op licht, hover van de primaire knop op lichte schema’s, badge Met jouw logo. |
| Kiezel | `#5D625C` | tekst | Secundaire tekst (specs, btw-regel, doorgestreepte van-prijs), randen van invoervelden, uitgeschakelde knop (stippelrand + label). |
| Zand | `#FBF6EC` | vlak | Paginaachtergrond; tekst, knop en focusring op Polder en Inkt. |
| Duin | `#F2E8D5` | vlak | Warm vlak: heroband, chips, geneste kaarten. |
| Steen | `#EFEDE8` | vlak | Koel, rustig vlak: achtergrond van elke productrender (naadloos met het beeldvlak van de kaart) én van Klapklaar Zakelijk, staffel- en specificatietabellen. Vervangt Linnen en Studio uit v3. |
| Wit | `#FFFFFF` | vlak | Productkaarten, invoervelden, drawers en meldingen; label op Klaproos- en Polder-knoppen. |
| Lijn | `#E4D6BE` | vlak | Decoratieve scheidingslijnen en de 1 px rand om meldingen (draagt geen informatie). |
| Bordeaux | `#8A1538` | fout | Fouten: kop, icoon en 4 px linkerrand van een foutmelding, tekst en rand van een veld met fout. Nooit een gevuld vlak, nooit een knop. |
| Oker | `#865800` | wachten | Levertijd en let-op: ‘Leverbaar over 2–3 weken’ (tekst + halve stip), kop, icoon en linkerrand van een let-op-melding. |

**Weg sinds v3:** Linnen (#ECEEE8, samengevoegd in Steen), Studio (#EFEDE8, heet nu Steen), Mos, Foutroze en Okerlicht
(meldingen staan op Wit met een gekleurde rand), en de twee kleuren buiten het palet: #2E8B57 (voorraadstip, nu Polder) en
#E7E3DA (uitgeschakeld, nu een Kiezel-stippelrand).

### 4.2 Regels

- **Het rood zit in het doek.** Op productkaarten in een raster staat nooit een gevulde Klaproos-knop: het product (vaak een
  Klaproos-tent) is het rood. Snel toevoegen is een omlijnde Inkt-knop of icoonknop (+); hover: Inkt-vlak met Zand-label.
- **Eén gevulde Klaproos-knop per kolom:** op de productpagina de koopknop in de koopkolom (het beeld staat links op Steen), in
  de winkelwagen ‘Afrekenen’, in de hero één primaire knop naast een omlijnde.
- **Primaire knop op licht:** Klaproos met Wit. Hover Inkt (verschil met rust 3,04:1, ook zonder kleurzien te zien).
  Ingedrukt Klaproos donker. Focus 3 px Inkt-ring, 2 px afstand. Bezig: ‘Toevoegen…’. Klaar: **Polder-vlak, Zand-label, vinkje,
  ‘Toegevoegd’**, 1,5 s. Uitgeschakeld: transparant, 2 px Kiezel-stippelrand, Kiezel-label, `aria-disabled`.
- **Andere schema’s:** zie §4.3; elke stand staat in `tokens.json` → `color_schemes`.
- **Tekst:** Inkt; secundair Kiezel. Links zijn Inkt en onderstreept (1,5 px, offset 3 px; hover 3 px). Klaproos als tekst alleen
  in koppen ≥ 24 px vet op Zand of Wit; nooit op Duin of Steen.
- **Prijs:** Inkt, Figtree 700, tabular. **Actieprijs:** in een Zon-label met vlaggetjes-inkeping, Inkt-tekst; van-prijs Kiezel
  doorgestreept.
- **Voorraad:** drie vormen, niet alleen drie kleuren: Op voorraad = Polder + volle stip; Leverbaar over x weken = Oker + halve
  stip; Uitverkocht = Kiezel + open ring. Altijd met tekst.
- **Meldingen:** Wit vlak, 1 px Lijn-rand, 4 px linkerrand + icoon + vetgedrukte kop in de statuskleur, uitleg in Inkt.
  Fout = Bordeaux, let op = Oker, gelukt = Polder.
- **Onderscheid kopen/fout:** Klaproos (tint 44°) is altijd een gevuld vlak met Wit; Bordeaux (tint 13°) is altijd
  tekst, icoon en rand. ΔE<sub>00</sub> tussen beide: 23,8.

### 4.3 Kleurschema’s met elke knopstand

Zes schema’s. Per schema: achtergrond, tekst, primaire knop in rust, hover en ingedrukt, en de tweede (omlijnde) knop in rust en
hover. Eis per stand: label ≥ 4,5:1 op zijn vulling, vorm (vulling of rand) ≥ 3:1 tegen de schemaachtergrond. Hover moet altijd
zichtbaar verschillen: een andere vulling of vol ↔ omlijnd.

| Schema | Achtergrond / tekst | Primair: rust → hover → ingedrukt | Tweede knop: rust → hover | Kleinste label / vorm |
|---|---|---|---|---|
| scheme-1 · Pagina | zand / inkt (14,71:1) | klaproos `#C83812` met wit → inkt `#1D2420` met wit → klaproos donker `#982A0E` met wit | transparant met inkt, rand inkt → inkt `#1D2420` met zand | 5,21:1 / 4,84:1 |
| scheme-2 · Kaart | wit / inkt (15,84:1) | klaproos `#C83812` met wit → inkt `#1D2420` met wit → klaproos donker `#982A0E` met wit | transparant met inkt, rand inkt → inkt `#1D2420` met zand | 5,21:1 / 5,21:1 |
| scheme-3 · Duin | duin / inkt (13,04:1) | klaproos `#C83812` met wit → inkt `#1D2420` met wit → klaproos donker `#982A0E` met wit | transparant met inkt, rand inkt → inkt `#1D2420` met zand | 5,21:1 / 4,29:1 |
| scheme-4 · Zakelijk (Steen) | steen / inkt (13,54:1) | polder `#154F3E` met zand → wit `#FFFFFF` met polder, rand polder → inkt `#1D2420` met zand | transparant met inkt, rand inkt → inkt `#1D2420` met zand | 8,78:1 / 8,09:1 |
| scheme-5 · Polder | polder / zand (8,78:1) | zand `#FBF6EC` met inkt → transparant met zand, rand zand → wit `#FFFFFF` met inkt | transparant met zand, rand zand → zand `#FBF6EC` met inkt | 8,78:1 / 8,78:1 |
| scheme-6 · Inkt | inkt / zand (14,71:1) | klaproos `#C83812` met wit → zand `#FBF6EC` met inkt → duin `#F2E8D5` met inkt | transparant met zand, rand zand → zand `#FBF6EC` met inkt | 5,21:1 / 3,04:1 |

30 standen gecontroleerd, 0 onder de eis. In v3 werd hover op het Inkt-schema Inkt (de knop verdween) en
veranderde de Inkt-knop op Zakelijk niet bij hover.

### 4.4 Vlakken uit elkaar houden

| Paar | ΔE<sub>00</sub> | Contrast |
|---|---:|---:|
| Zand – Duin | 4,7 | 1,13:1 |
| Zand – Steen | 3,0 | 1,09:1 |
| Zand – Wit | 5,1 | 1,08:1 |
| Duin – Steen | 6,1 | 1,04:1 |
| Duin – Wit | 9,6 | 1,22:1 |
| Steen – Wit | 4,4 | 1,17:1 |

Zand = pagina, Wit = kaart, invoer en melding, Duin = warm accent (hero, chips), Steen = koel en rustig (productbeeld, Zakelijk,
tabellen). Steen ligt het dichtst bij Zand: gebruik het als band over de volle breedte of binnen een kaart, niet als losse tegel op
Zand zonder rand.

### 4.5 Reproductie: kleurreferenties per materiaal

Per kleur de dichtstbijzijnde stockkleur in elk systeem, met CIEDE2000 tegen de merkkleur. **Dit zijn digitale benaderingen uit
open datasets, niet fysiek afgetekend.** Kies de definitieve referentie met de procedure hieronder.

| Kleur | sRGB | CIELAB D50 | CMYK gestreken (FOGRA39) | CMYK ongestreken (FOGRA29) | Pantone C | Pantone TCX (textiel) | RAL Classic (bron B / bron A) | Oracal 651 |
|---|---|---|---|---|---|---|---|---|
| **Klaproos** | `#C83812` | 46,6 / 56,4 / 54,0 | C14 M89 Y100 K4 | C10 M93 Y100 K3 | 2349 C (ΔE 1,6); alt. 173 C (3,5) | 17-1449 TCX Pureed Pumpkin (ΔE 2,0) | RAL 2001 Red orange (2,2) / RAL 2002 Vermilion (4,2) | 651-047 orange red (ΔE 2,3) |
| **Zon** | `#FFC23A` | 82,5 / 13,9 / 72,0 | C0 M28 Y83 K0 | C0 M21 Y83 K0 | 136 C (ΔE 1,2); alt. 1225 C (2,0) | 13-0759 TCX Solar Power (ΔE 2,2) | RAL 1028 Melon yellow (6,5) / RAL 1021 Colza yellow (3,4) | 651-021 yellow (ΔE 3,6) |
| **Polder** | `#154F3E` | 29,6 / -23,0 / 4,4 | C87 M42 Y73 K45 | C91 M45 Y75 K33 | 6161 C (ΔE 1,6); alt. 3305 C (2,7) | 19-5420 TCX Evergreen (ΔE 3,4) | RAL 6016 Turquoise green (3,3) / RAL 6028 Pine green (3,9) | 651-613 forest green (ΔE 4,3) |
| **Inkt** | `#1D2420` | 13,4 / -4,1 / 1,6 | C76 M61 Y66 K78 | C84 M73 Y62 K64 | Black 3 C (ΔE 1,9); alt. 419 C (2,9) | 19-5708 TCX Jet Set (ΔE 3,1) | RAL 7021 Black grey (5,6) / RAL 9017 Traffic black (6,3) | 651-070 black (ΔE 8,8) |
| **Zand** | `#FBF6EC` | 97,1 / 0,5 / 5,4 | C2 M4 Y9 K0 | C2 M4 Y7 K0 | 9224 C (ΔE 2,8); alt. 9285 C (3,3) | 11-0607 TCX Sugar Swizzle (ΔE 2,1) | RAL 9001 Cream (2,9) / RAL 9001 Cream (3,4) | 651-010 white (ΔE 8,1) |

- **Pantone U** (ongestreken papier): zelfde nummer met U, maar de U-staal oogt doffer en lichter. Kies op de Formula Guide
  Uncoated naast de afgetekende C-staal.
- **Pantone TPG:** gebruik hetzelfde nummer als de TCX-referentie; TPG is niet apart digitaal vergeleken.
- **Ongestreken papier:** Klaproos verschuift in proces-CMYK zichtbaar (proef-ΔE<sub>00</sub> 11,5 tegen het scherm).
  Visitekaartjes en briefpapier op ongestreken stock: als Pantone-steunkleur drukken, of een drukproef aftekenen.
- **RAL:** de twee bronnen verschillen per kleur. Vergelijk fysiek op de RAL K7-waaier voordat je frames, borden of een bus laat lakken.
- **Inkt in folie:** de dichtstbijzijnde Oracal-kleur is gewoon zwart. Voor belettering is dat de bedoeling: Oracal 070 zwart.
- **Zand als drukkleur:** op doek als steunkleur (TCX-referentie); op papier niet bedrukken maar crème/naturel papier kiezen.

**Toleranties (voorstel):** drukwerk op gestreken papier ΔE<sub>00</sub> ≤ 2 tegen de afgetekende Pantone C; textiel en folie
ΔE<sub>00</sub> ≤ 3 tegen de afgetekende TCX-staal of folie.

**Aftekenen vóór de eerste productie**

1. Bestel de waaiers: Pantone Formula Guide C + U, Pantone FHI Cotton TCX (of het staalboek van de doekleverancier), RAL K7,
   Oracal 651/751-kleurkaart.
2. Gebruik geen scherm en geen afdruk van dit document of de brand sheet als kleurreferentie: een scherm of printer is geen standaard.
3. Leg per kleur de drie dichtstbijzijnde stalen uit de tabel naast elkaar, in D50-licht (lichtbak) en in daglicht. Kies er één
   op het oog, zonder scherm erbij.
4. Vraag de doekleverancier een lab-dip of stofstaal van Klaproos (doel: de gekozen TCX, ΔE<sub>00</sub> ≤ 3) en van de
   opdrukkleur Zand op Klaproos en Inkt.
5. Noteer per kleur in onderstaande tabel en in `tokens.json` → `print.colors` wat gekozen is, door wie en wanneer. Pas daarna
   stockkleuren, doek en bus-belettering bestellen.

| Kleur | Papier (Pantone C) | Textiel (TCX / lab-dip) | Lak (RAL) | Folie (Oracal) | Afgetekend door | Datum |
|---|---|---|---|---|---|---|
| Klaproos | | | | | | |
| Zon | | | | | | |
| Polder | | | | | | |
| Inkt | | | | | | |
| Zand | | | | | | |

**Bronnen en methode.** sRGB → CIELAB met de standaardformules (D65, Bradford naar D50); ΔE = CIEDE2000; code in
`tools/color3.py`, uitvoer in `tools/_repro.json`. CMYK met Pillow/LittleCMS, relatief colorimetrisch + zwartpuntcompensatie,
profielen Adobe ‘Coated FOGRA39 (ISO 12647-2:2004)’ en ‘Uncoated FOGRA29 (ISO 12647-2:2004)’. Datasets (alle onofficieel; aantallen: pantone_c 3219, pantone_tcx 2310, ral_a 215, ral_b 213, oracal651 61):

- Pantone Solid Coated 2024 (3219 kleuren), Lab D50, onofficieel: gemeten uit de kleurvoorbeelden op pantone.com (README van de repo): https://github.com/aj90909/unofficial-pantone-solid-coated-2024-v5/blob/3d6ad83683cebc13ec859a675eae2a4c29bfd4d8/output.json
- Pantone FHI Cotton TCX, naam + sRGB-hex, onofficieel: https://github.com/pedroduke/pantone-tcx/blob/566d68d90f35047a6a1dfca28786b149269184e1/src/pantoneColors.js
- RAL Classic, sRGB-hex (bron A): https://github.com/ieskudero/ral-colors/blob/55e9cfc3d0b333af74c56acad6bd1aeee840d83a/RAL/classic.js
- RAL Classic, sRGB-hex (bron B; de repo noemt het zelf "preview HEX approximate"): https://github.com/office952/workos-vscode/blob/a1c28854dbeee553c8420c4639c8145ebe9d9230/frontend/src/lib/colorRegistry/import/sources/ral_standard.csv
- ORACAL 651 snijfolie, sRGB "parsed from ORAFOL ORACAL 651 product page (sample colors)": https://github.com/office952/workos-vscode/blob/a1c28854dbeee553c8420c4639c8145ebe9d9230/frontend/src/lib/colorRegistry/import/sources/oracal651-orafol.txt
- Adobe "Coated FOGRA39 (ISO 12647-2:2004)", git-lfs sha256 da2b9b59...ce77: https://github.com/ConRes/conres.io/blob/800dbc48d23cc3305c5176296a369e6af23ee1ab/testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/CoatedFOGRA39.icc
- Adobe "Uncoated FOGRA29 (ISO 12647-2:2004)", git-lfs sha256 9af0eb03...c392: https://github.com/ConRes/conres.io/blob/800dbc48d23cc3305c5176296a369e6af23ee1ab/testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/UncoatedFOGRA29.icc

### 4.6 Minimummaten per methode

Breedte van het hele logo of symbool. Minimale breedte = vereiste lijn (of opening) ÷ aandeel van de kleinste lijn (of opening)
in de breedte, de grootste van de twee. Gemeten (tools/logo-meta.json): logo.svg kleinste lijn 65 (tentpoot en paal), kleinste opening 44 (k–l) op 4180 breed; logo-klein 100 / 80 op 4610; mark 65 / 64 op 1050; mark-klein 100 / 84 op 1110. Lijn = de kleinste van bouwmaat en rastermeting; opening = de kleinste van alle afstanden tussen losse vormen, de vrije ruimte onder de vlag en de rastermeting (§3.2).

| Methode | Kleinste lijn / opening (aanname) | logo.svg | logo-klein | mark | mark-klein |
|---|---|---:|---:|---:|---:|
| Borduren (satijnsteek) | 1,2 / 1 mm | 95 mm | 58 mm | 20 mm | 14 mm |
| Flock-transfer (geplot) | 1,5 / 1,5 mm | 143 mm | 87 mm | 25 mm | 20 mm |
| Flex-/snijfolie (textiel, geplot) | 1 / 1 mm | 95 mm | 58 mm | 17 mm | 14 mm |
| Snijfolie op bus/bord (Oracal) | 1,5 / 1,5 mm | 143 mm | 87 mm | 25 mm | 20 mm |
| Zeefdruk op textiel | 0,5 / 0,6 mm | 57 mm | 35 mm | 10 mm | 8 mm |
| DTF-transfer | 0,5 / 0,5 mm | 48 mm | 29 mm | 9 mm | 7 mm |
| Sublimatie / digitaal op polyester (luifel, rok) | 0,3 / 0,3 mm | 29 mm | 18 mm | 5 mm | 4 mm |
| Offset / digitaal op papier | 0,15 / 0,15 mm | 15 mm | 9 mm | 3 mm | 2 mm |
| Scherm (1x) | 2 px / 1,5 px | 143 px | 93 px | 33 px | 23 px |

**De mm-waarden per methode zijn werkaannames** (gangbare vuistregels voor satijnsteek, flock, flex, snijfolie, zeefdruk, DTF,
sublimatie en offset), niet met een leverancier gecontroleerd. Leg deze tabel voor aan je borduurder, drukker en belettering;
vul hun echte minimum in `tools/build.py` → `METHODS` in en draai `build.py` opnieuw. Luifel-lock-up pas vanaf 160 mm breed.

### 4.7 WCAG 2.1-contrast van elk gebruikt paar

Berekend met de WCAG-formule voor relatieve luminantie (`tools/contrast.py`, `tools/tokens.py`). Tekst 4,5:1, display-tekst
≥ 24 px vet 3:1, UI-delen (randen, knopvlakken, focusringen, iconen, stippen) 3:1. **52 paren, 0 onder de eis.**

| Voorgrond | Achtergrond | Gebruik | Ratio | Eis | Resultaat |
|---|---|---|---:|---:|---|
| inkt `#1D2420` | zand `#FBF6EC` | Lopende tekst op pagina | 14,71:1 | 4,5:1 | AAA |
| inkt `#1D2420` | duin `#F2E8D5` | Tekst op heroband en chips | 13,04:1 | 4,5:1 | AAA |
| inkt `#1D2420` | wit `#FFFFFF` | Tekst op kaarten, velden, meldingen | 15,84:1 | 4,5:1 | AAA |
| inkt `#1D2420` | steen `#EFEDE8` | Zakelijk-blokken, badges op het beeldvlak | 13,54:1 | 4,5:1 | AAA |
| inkt `#1D2420` | zon `#FFC23A` | Actie-badge en actieprijs-label | 9,83:1 | 4,5:1 | AAA |
| kiezel `#5D625C` | zand `#FBF6EC` | Specs, btw-regel | 5,79:1 | 4,5:1 | AA |
| kiezel `#5D625C` | duin `#F2E8D5` | Specs op Duin | 5,13:1 | 4,5:1 | AA |
| kiezel `#5D625C` | wit `#FFFFFF` | Specs op kaart, van-prijs | 6,24:1 | 4,5:1 | AA |
| kiezel `#5D625C` | steen `#EFEDE8` | Specs in Zakelijk, bijschrift op beeldvlak | 5,33:1 | 4,5:1 | AA |
| polder `#154F3E` | zand `#FBF6EC` | Op voorraad, links in Zakelijk | 8,78:1 | 4,5:1 | AAA |
| polder `#154F3E` | wit `#FFFFFF` | Op voorraad op kaart, succesmelding (kop) | 9,46:1 | 4,5:1 | AAA |
| polder `#154F3E` | duin `#F2E8D5` | Op voorraad op Duin | 7,78:1 | 4,5:1 | AAA |
| polder `#154F3E` | steen `#EFEDE8` | Zakelijk-koppen, badge Staffelprijs | 8,09:1 | 4,5:1 | AAA |
| bordeaux `#8A1538` | wit `#FFFFFF` | Foutmelding (kop), veldfout onder invoerveld | 9,35:1 | 4,5:1 | AAA |
| bordeaux `#8A1538` | zand `#FBF6EC` | Veldfout op pagina | 8,68:1 | 4,5:1 | AAA |
| bordeaux `#8A1538` | steen `#EFEDE8` | Veldfout in Zakelijk-formulier | 8,00:1 | 4,5:1 | AAA |
| oker `#865800` | zand `#FBF6EC` | Leverbaar over 2–3 weken | 5,72:1 | 4,5:1 | AA |
| oker `#865800` | wit `#FFFFFF` | Levertijd op kaart, let-op-melding (kop) | 6,16:1 | 4,5:1 | AA |
| oker `#865800` | duin `#F2E8D5` | Levertijd op Duin | 5,07:1 | 4,5:1 | AA |
| oker `#865800` | steen `#EFEDE8` | Levertijd in Zakelijk | 5,26:1 | 4,5:1 | AA |
| wit `#FFFFFF` | klaproos `#C83812` | Primaire knop | 5,21:1 | 4,5:1 | AA |
| wit `#FFFFFF` | inkt `#1D2420` | Primaire knop, hover (licht schema) | 15,84:1 | 4,5:1 | AAA |
| wit `#FFFFFF` | klaproos donker `#982A0E` | Primaire knop, ingedrukt | 7,86:1 | 4,5:1 | AAA |
| zand `#FBF6EC` | polder `#154F3E` | Secundaire/Zakelijk-knop, Toegevoegd, footer, utility-balk, badge Nieuw | 8,78:1 | 4,5:1 | AAA |
| wit `#FFFFFF` | polder `#154F3E` | Secundaire knop (wit label) | 9,46:1 | 4,5:1 | AAA |
| zand `#FBF6EC` | inkt `#1D2420` | Badge Met jouw logo, omlijnde knop hover, donkere banden | 14,71:1 | 4,5:1 | AAA |
| inkt `#1D2420` | zand `#FBF6EC` | Primaire knop op Polder (Zand vlak, Inkt label), hover op Inkt | 14,71:1 | 4,5:1 | AAA |
| polder `#154F3E` | wit `#FFFFFF` | Zakelijk-knop hover (omlijnd: Wit vlak, Polder label) | 9,46:1 | 4,5:1 | AAA |
| zon `#FFC23A` | inkt `#1D2420` | Vlag en actie op Inkt | 9,83:1 | 4,5:1 | AAA |
| zon `#FFC23A` | polder `#154F3E` | Vlag en actie op Polder | 5,87:1 | 4,5:1 | AA |
| klaproos `#C83812` | zand `#FBF6EC` | Display-kop op pagina (≥ 24 px vet) | 4,84:1 | 3,0:1 | AA groot |
| klaproos `#C83812` | wit `#FFFFFF` | Display-kop op kaart (≥ 24 px vet) | 5,21:1 | 3,0:1 | AA groot |
| kiezel `#5D625C` | wit `#FFFFFF` | Rand invoerveld, stippelrand uitgeschakelde knop (UI-deel) | 6,24:1 | 3,0:1 | voldoet (UI) |
| kiezel `#5D625C` | zand `#FBF6EC` | Rand invoerveld op pagina (UI-deel) | 5,79:1 | 3,0:1 | voldoet (UI) |
| kiezel `#5D625C` | duin `#F2E8D5` | Rand invoerveld / uitgeschakeld op Duin (UI-deel) | 5,13:1 | 3,0:1 | voldoet (UI) |
| kiezel `#5D625C` | steen `#EFEDE8` | Rand invoerveld in Zakelijk (UI-deel) | 5,33:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | zand `#FBF6EC` | Primaire knop tegen pagina (UI-deel) | 4,84:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | duin `#F2E8D5` | Primaire knop tegen Duin (UI-deel) | 4,29:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | wit `#FFFFFF` | Primaire knop tegen kaart (UI-deel) | 5,21:1 | 3,0:1 | voldoet (UI) |
| klaproos `#C83812` | inkt `#1D2420` | Primaire knop op Inkt-vlak (UI-deel) | 3,04:1 | 3,0:1 | voldoet (UI) |
| inkt `#1D2420` | zand `#FBF6EC` | Hover-knop, focusring op licht (UI-deel) | 14,71:1 | 3,0:1 | voldoet (UI) |
| inkt `#1D2420` | wit `#FFFFFF` | Focusring op kaart (UI-deel) | 15,84:1 | 3,0:1 | voldoet (UI) |
| inkt `#1D2420` | duin `#F2E8D5` | Focusring op Duin (UI-deel) | 13,04:1 | 3,0:1 | voldoet (UI) |
| inkt `#1D2420` | steen `#EFEDE8` | Focusring, omlijnde knop in Zakelijk (UI-deel) | 13,54:1 | 3,0:1 | voldoet (UI) |
| polder `#154F3E` | zand `#FBF6EC` | Secundaire knop / Toegevoegd tegen pagina (UI-deel) | 8,78:1 | 3,0:1 | voldoet (UI) |
| polder `#154F3E` | wit `#FFFFFF` | Toegevoegd tegen kaart, voorraadstip (UI-deel) | 9,46:1 | 3,0:1 | voldoet (UI) |
| polder `#154F3E` | steen `#EFEDE8` | Zakelijk-knop en hover-rand tegen Steen (UI-deel) | 8,09:1 | 3,0:1 | voldoet (UI) |
| zand `#FBF6EC` | polder `#154F3E` | Focusring, Zand-knop en hover-rand op Polder (UI-deel) | 8,78:1 | 3,0:1 | voldoet (UI) |
| zand `#FBF6EC` | inkt `#1D2420` | Focusring en hover-vlak op Inkt (UI-deel) | 14,71:1 | 3,0:1 | voldoet (UI) |
| bordeaux `#8A1538` | wit `#FFFFFF` | Linkerrand + icoon foutmelding, rand veld met fout (UI-deel) | 9,35:1 | 3,0:1 | voldoet (UI) |
| oker `#865800` | wit `#FFFFFF` | Linkerrand + icoon let-op, halve stip levertijd (UI-deel) | 6,16:1 | 3,0:1 | voldoet (UI) |
| oker `#865800` | zand `#FBF6EC` | Halve stip levertijd op pagina (UI-deel) | 5,72:1 | 3,0:1 | voldoet (UI) |
| polder `#154F3E` | klaproos `#C83812` | Winkelwagen-stip in het favicon (met 1,5 px Zand-ring) | 1,82:1 | – | herkenbaar door de Zand-ring (Zand op Klaproos 4,84:1, Polder op Zand 8,78:1) |

**Niet toegestaan** (staat erbij zodat niemand het probeert):

| Voorgrond | Achtergrond | Wat | Ratio | |
|---|---|---|---:|---|
| zon | zand | Zon als tekst of rand op licht | 1,50:1 | niet gebruiken |
| zon | wit | Zon als tekst of rand op wit | 1,61:1 | niet gebruiken |
| klaproos | duin | Klaproos als tekst op Duin (ook niet als kop) | 4,29:1 | niet gebruiken |
| klaproos | steen | Klaproos als tekst op Steen | 4,45:1 | niet gebruiken |
| klaproos | inkt | Klaproos-tekst op Inkt | 3,04:1 | niet gebruiken |
| klaproos | polder | Klaproos op Polder (ook als knop of tent) | 1,82:1 | niet gebruiken |
| kiezel | inkt | Kiezel op donker | 2,54:1 | niet gebruiken |
| kiezel | polder | Kiezel op Polder | 1,52:1 | niet gebruiken |
| polder | inkt | Polder op Inkt (knop verdwijnt) | 1,67:1 | niet gebruiken |
| wit | bordeaux | Bordeaux als gevuld vlak (fout is nooit een knop) | 9,35:1 | niet gebruiken |
| zon | klaproos | Zon-tent op Klaproos (logo op Klaproos is één kleur Zand) | 3,23:1 | niet gebruiken |

## 5. Typografie: één familie, Figtree

| Rol | Gewicht | Shopify `font_picker`-handle | CSS-fallback |
|---|---|---|---|
| Display, H1, H2 | ExtraBold 800 | `figtree_n8` (instelling `type_header_font`) | `"Figtree", "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| H3, H4, kaarttitels, knoppen, prijzen | Bold 700 | `figtree_n7` (via `font_modify: 'weight', '700'`) | idem |
| Labels, navigatie | SemiBold 600 | `figtree_n6` | idem |
| Tekst | Regular 400 | `figtree_n4` (instelling `type_body_font`) | idem |
| Descriptor in lock-ups | ExtraBold, kapitalen, omgezet naar paden | – | – |

**Waarom één familie.** Het karakter zit in het getekende woordmerk; de letter is gereedschap. Mona Sans (v3) lag te dicht bij
het woordmerk, zodat het logo op ‘getypt’ leek, en was alleen via een kopie van de Shopify-fontlijst bevestigd. Figtree is open
en rond, verschilt duidelijk van de hoekige letters van het logo, heeft een gewone nul (‘Ø 80 cm’) en echte tabelcijfers. Eén
familie laadt sneller en houdt koppen, prijzen en tekst in één ritme. Getest en afgewezen: Mona Sans (v3), Archivo (v2),
Bricolage Grotesque (v1), Barlow (n8 niet als Shopify-pad gevonden; DIN-achtige kommen botsen met het woordmerk).

**Bewijs dat de handles bestaan.** shopify.dev is vanuit deze omgeving geblokkeerd. Shopify maakt `/cdn/fonts/<familie>/<handle>`-
paden alleen voor fonts uit zijn eigen bibliotheek; gevonden in echte winkels:

- `figtree_n4` en `figtree_n7`: https://github.com/mrshahbazdev/shopify-section-factory-clone/blob/f2b6217daa4961e435b959c3d5ec3bc5935c4982/app/sections/featured-collection-9.liquid
- `figtree_n5` en `figtree_n6` op fonts.shopifycdn.com: https://github.com/duckduckgo/tracker-radar/blob/197a396da8b8cdf2df1ded141cb58f2507e446d5/domains/US/shopifycdn.com.json
- `figtree_n8`: https://github.com/LM-3434/aquacorail.ca/blob/a84889e15bf7c7c81207cca64c4d681e144bc95c/assets/screen-settings.css

Betrouwbaarheid: waarschijnlijk (echte uitvoer van winkels, niet de officiële lijst).

**OpenType.** `Figtree[wght].ttf` (OFL) heeft `tnum`, `pnum`, `case` en `frac`. Of de woff2-bestanden van Shopify die features
houden, is niet getest: zet `font-variant-numeric: tabular-nums` en controleer een staffeltabel in de theme-preview. Werkt het niet,
laad dan `fonts/Figtree-VF.ttf` als theme-asset met `@font-face` en `font-display: swap`.

**Schaal** (desktop/mobiel, px): Display 64/40 · H1 48/34 · H2 36/28 (800, regelhoogte 1,0–1,1, spatiëring −0,025 tot −0,015 em)
· H3 22/20 en H4 18/17 (700) · body-lg 19/17 · body 17/16 (regelhoogte 1,55) · small 14 · label 15 (600) · eyebrow 12,5 (700,
kapitalen, +0,08 em) · prijs 20 (700) · knop 16 (700).

**Cijfers en notatie:** `font-variant-numeric: tabular-nums` op prijzen, maten, aantallen, staffels, ordernummers en levertijden.
`€ 1.145,00` (spatie na €, punt voor duizendtallen, komma voor centen), `3 × 3 m` (echt maalteken), `Ø 80 cm`, `320 g/m²`,
`2–3 weken` (en-dash). Btw in kleine letters: ‘incl. btw’ / ‘excl. btw’.

## 6. Klapklaar Zakelijk

Zelfde merk, andere toon, voor horeca, eventbureaus, verhuurbedrijven, scholen en verenigingen.

- **Kleur:** Steen-vlak (schema 4), Polder-knoppen (hover: Wit met Polder-rand), Inkt-tekst. Geen Klaproos-vlakken, geen
  vlaggenlijn, geen knipoog.
- **Logo:** `svg/logo-zakelijk.svg` (Polder-tent en -label).
- **Prijzen:** standaard excl. btw met schakelaar ‘incl. / excl. btw’; staffeltabel met tabelcijfers.
- **Waar:** `page.zakelijk`, `page.offerte`, de drukproef- en uploadflow, de B2B-catalogus, offerte-PDF, facturen.
- **Volume-nudge op de productpagina:** ‘**Zakelijk?** Vanaf 10 stuks maken we een offerte op maat, op factuur.’ met link
  ‘Offerte aanvragen’. Drempel 10 en ‘op factuur’ zijn claims.
- **Staffel op de productkaart:** wie de badge ‘Staffelprijs’ krijgt, toont ook de staffel: ‘Vanaf 5 st. € 629,00 · vanaf 10 st.
  € 589,00 p.st.’ (bedragen: voorbeeld).
- **Beeld:** opstelling-renders met meerdere stuks (`img/scene-zakelijk.webp`: één 3 × 6 m met logo, vier bedrukte hoezen), later
  praktijkfoto’s van echte zakelijke opstellingen (§8.5).

## 7. Toon van stem

Schrijf alsof je de buurman helpt een tent op te zetten. **Je/jij** overal; algemene voorwaarden, facturen en offertes zijn zakelijk
en volledig (nog steeds je/jij, zonder knipoog).

1. **Antwoord eerst** (maat, prijs, levertijd), uitleg daarna.
2. **Concreet, nooit vaag:** ‘3 × 3 m, Ø 80 cm, 40 mm aluminium’, nooit ‘ruim assortiment’.
3. **Hooguit één knipoog per scherm.** De knipoog zit in de werkwoorden (klap, klaar, staat), niet in uitroeptekens.
4. **Niets verzinnen:** geen sterren, geen ‘nr. 1’, geen ‘duizenden tevreden klanten’.
5. **Elke lever-, betaal- of serviceclaim** is een theme-instelling die de eigenaar invult en bevestigt (`docs/claims-to-confirm.md`).
   Hieronder gemarkeerd met **[claim]**.
6. **‘Klap’ nooit bij wind, storm, stevigheid of garantie.** Daar spreken specs: staal/aluminium, buisdikte, gewichten, haringen,
   spanbanden.

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

**Utility-balk (Polder)** — ‘Snel in huis in NL & BE’ [claim] · ‘Zakelijk bestellen op factuur’ [claim] · ‘Eigen logo? Eerst een
drukproef’ · rechts: ‘Offerte aanvragen’ · ‘Klantenservice’ · ‘Zakelijk’. Vinkjes in Zand.

**Header** — zoekveld: ‘Zoek op product, maat of artikelnummer’ · iconen: ‘Offerte’, ‘Account’, ‘Winkelwagen’ · menu: Partytenten ·
Statafels · Rokken & hoezen · Met jouw logo · Accessoires · Meubilair · Verlichting · Actie (Zon-badge) · Zakelijk. Mobiel: ‘Menu’ /
‘Sluiten’. Teller op de winkelwagen: Polder met Zand-cijfer.

**Hero (home)** — ‘Uitklappen. Neerzetten. Feest.’ · ‘Easy-up tenten, statafels met rokken, verlichting en meubilair. Voor je
tuinfeest, je club of je evenement.’ · knoppen ‘Bekijk partytenten’ / ‘Naar statafels’ · onder de knoppen: ‘Voor bedrijf, club of
verhuur? Vraag een offerte op maat aan.’ · prijschip op het beeld: ‘Easy-up partytent 3 × 3 m · Premium · 320 g/m² — vanaf € 319’
[prijs: voorbeeld].

**Collectiepagina** — titel = categorie (‘Easy-up partytenten’) · intro 1–2 zinnen met waarvoor en welke maten · teller
‘24 producten’ · ‘Filteren’ · ‘Sorteer op: Aanbevolen / Prijs laag-hoog / Prijs hoog-laag / Nieuwste’ · geen resultaten: ‘Geen
tenten met deze combinatie. Haal een filter weg of bekijk alle partytenten.’ · filterchips ‘Wis alles’.

**Productkaart** — titel · specregel (‘Aluminium frame · 320 g/m² dakdoek’, ‘Voor Ø 70–85 cm · stretch’) · swatches ‘+3’ · prijs
(actie: Zon-label + doorgestreepte van-prijs) · staffelregel bij badge ‘Staffelprijs’ · voorraadregel · omlijnde knop ‘In
winkelwagen’ (één variant) of ‘Kies je maat’ (varianten) · badges: ‘Actie −12%’ (Zon), ‘Nieuw’ (Polder), ‘Met jouw logo’ (Inkt +
vlaggetje), ‘Staffelprijs’ (Steen).

**Productpagina** — eyebrow = categorie · titel · specregel · prijs met ‘incl. btw / excl. btw’ · voorraad: ‘Op voorraad’,
‘Leverbaar over 2–3 weken’, ‘Tijdelijk uitverkocht’ · levering: ‘morgen in huis bij bestelling vóór 14:00’ [claim] · optielabels
‘Maat’, ‘Diameter’, ‘Kleur: Klaproos’, ‘Rok: Strik wit’ · niet-leverbare optie: doorgestreept, schermlezer ‘niet leverbaar’ ·
‘Maatgids’ + ‘Twijfel je over de maat? De maatgids rekent het voor je uit.’ · aantal ‘Aantal’ met −/+ (‘Eén minder’, ‘Eén meer’) ·
knop ‘In mijn winkelwagen · € 339,80’ (live totaal) → ‘Toevoegen…’ → Polder + vinkje + ‘Toegevoegd’ (1,5 s) · uitverkocht:
‘Uitverkocht’ (uitgeschakeld) + ‘Mail me als hij terug is’ (alleen met app) · zakelijk-nudge (§6) · onder de knop: ‘14 dagen
bedenktijd (niet bij bedrukt maatwerk)’ [claim, juridisch laten controleren] en ‘Vraag? Bel of app ons’ [claim] · tabbladen
‘Beschrijving’, ‘Specificaties’, ‘Levering & retour’, ‘Opzetten & onderhoud’ · veiligheid: ‘Staat stevig, ook als het waait. Zet
elke poot vast met haringen of een voetgewicht van 15 kg. Bij harde wind: dak eraf.’ · reviews alleen als een review-app data
levert; anders niets (geen lege sterren).

**Met jouw logo (bedrukking)** — kaart: ‘Statafelhoes met jouw logo · vanaf € 39,95 per stuk’ [prijs: voorbeeld] · ‘Upload je logo,
je krijgt eerst een drukproef ter akkoord. Vanaf 10 st. staffelprijs.’ · knop (Polder) ‘Ontwerp je hoes’ / ‘Ontwerp je tent’ ·
upload ‘Logo uploaden (PDF, AI, EPS of SVG)’ · hulptekst ‘Geen vectorbestand? Stuur een PNG van minimaal 2000 px breed, dan maken
wij hem drukklaar.’ [claim] · melding ‘Eerst je akkoord, dan drukken we. De levertijd gaat in na je akkoord.’ · positie ‘Voorkant’,
‘Rondom’, ‘Topcover’ · bij klantlogo’s geldt dezelfde maatvoering als in §8.4.

**Toegevoegd (toast/drawer)** — ‘Klaar! Hij staat erin.’ · ‘Statafelrok stretch Ø 80 cm, zwart, ligt in je winkelwagen.’ · ‘Naar
winkelwagen’ / ‘Verder winkelen’ · upsell ‘Nog een statafel erbij?’ of ‘Vergeet de haringen niet’.

**Winkelwagen** — ‘Je winkelwagen (2)’ · regel: titel, variant, aantal, ‘Verwijderen’ · drempel ‘Nog € 23,10 tot gratis verzending’
/ ‘Je verzending is gratis’ [claim] · ‘Opmerking bij je bestelling (bv. leverdatum of locatie)’ · ‘Subtotaal (incl. btw)’ ·
‘Verzendkosten berekenen we bij het afrekenen’ · ‘Afrekenen’ (de enige Klaproos-knop) · zakelijk: ‘Liever een offerte voor deze
winkelwagen?’.

**Lege winkelwagen** — ‘Nog niks in je winkelwagen.’ · ‘Zonde van een goed feest. Begin bij de partytenten, of kijk wat er in de
actie zit.’ · ‘Bekijk partytenten’.

**Zoeken** — kopjes ‘Producten’, ‘Categorieën’, ‘Pagina’s’ · ‘Alle resultaten voor ‘3x3’’ · geen resultaten: ‘Niks gevonden voor
‘partytnt’. Check de spelling, of zoek op maat (3x3) of product (statafel).’

**Fouten en validatie** — ‘Oeps, dat ging mis. We konden je winkelwagen niet bijwerken. Probeer het nog een keer, of bel of app ons:
dan regelen we het samen.’ · ‘Vul je e-mailadres in.’ · ‘Vul je hele postcode in, dan weten we waar de tent heen moet.’ · ‘Dit
e-mailadres klopt niet helemaal. Check de @ en de punt.’ · ‘Er zijn er nog 3 op voorraad. We hebben je aantal aangepast.’ · ‘Dit
bestand is groter dan 20 MB. Stuur een kleinere versie of mail hem naar ons.’ [limiet: claim].

**Offerte en contact** — ‘Offerte op maat aanvragen’ · velden ‘Bedrijfsnaam’, ‘Contactpersoon’, ‘E-mailadres’, ‘Telefoon’, ‘Aantal’,
‘Gewenste leverdatum’, ‘Logo uploaden’, ‘Toelichting’ · ‘Offerte aanvragen’ · succes: ‘Klaar! Je offerteaanvraag is binnen. We
sturen je binnen één werkdag een offerte.’ [claim] · contact: ‘Stel je vraag’ · ‘Bedankt, we hebben je bericht. We reageren binnen
één werkdag.’ [claim].

**Nieuwsbrief** — ‘Eerst weten wanneer er actie is?’ · ‘Je e-mailadres’ · ‘Aanmelden’ · ‘Aangemeld. Je hoort van ons als er iets te
vieren valt.’ · geen kortingsbelofte tenzij die bestaat.

**Account** — ‘Inloggen’, ‘Je bestellingen’, ‘Bestelling #1042’, ‘Adressen’, ‘Uitloggen’ · zakelijk: ‘Je offertes’, ‘Nabestellen’.

**404** — ‘Deze pagina is ingeklapt.’ · ‘De link klopt niet (meer). Zoek wat je nodig hebt, of begin bij de partytenten.’ · ‘Naar de
homepage’ / ‘Bekijk partytenten’. (De enige plek waar ‘klap’ negatief mag: het gaat over een pagina.)

**Wachtwoordpagina** — ‘We zetten de laatste tenten neer.’ · ‘Laat je e-mailadres achter, dan hoor je het als we open zijn.’

**Cadeaubon** — ‘Je cadeaubon van € 50’ · ‘Gebruik de code bij het afrekenen.’ · ‘Code kopiëren’ / ‘Gekopieerd’.

**Footer en vertrouwen** — kolommen ‘Winkel’, ‘Zakelijk’, ‘Hulp’, ‘Over Klapklaar’ · ‘Bel of app ons’ + openingstijden [claim] ·
‘Veilig betalen’ met de iconen van de ingeschakelde methoden · ‘Algemene voorwaarden’, ‘Privacy’, ‘Cookies’, ‘Retourneren’, KvK- en
btw-nummer, adres [claim] · reviewscore en keurmerk alleen met echte bron (§8.6).

**Alt-teksten** — ‘[product], [kleur], [standpunt]’: ‘Easy-up partytent 3 × 3 m Klaproos, schuin vooraanzicht’. Bij een
voorbeeldopdruk: ‘… met voorbeeldopdruk Klapklaar op de luifel’.

## 8. Beeld

Tot er echte foto’s zijn, is elk productbeeld een fotorealistische 3D-render uit `renders/` (three.js, headless Chromium).
Cartoons, vlakke illustraties en stockfoto’s komen niet in de winkel.

### 8.1 Productrenders: opbouw

- **Achtergrond:** naadloos **Steen #EFEDE8**, exact gelijk aan het beeldvlak van de productkaart. Nooit wit-op-wit, geen sfeerbeeld
  als hoofdbeeld, geen tekst of badges in het beeld (badges zijn HTML).
- **Formaat:** vierkant master 2000 × 2000 px, WebP q88 (JPEG-fallback). Hero-banners en opstellingen 1800 × 1100.
- **Standpunten** (lens 22°, product vult 80%): 1 hoofdbeeld `hero` (azimut 34°, elevatie 17°) · 2 vooraanzicht `front` 0°/6° ·
  3 zij/achter `side` 90°/6° of `back` · 4 detail (hoekstuk + schaar, rokzoom, strik, bladrand) · 5 variant (ingeklapt, met
  zijwanden, met gewichten) · 6 opstelling (tent met statafels) · daarna praktijkfoto’s (§8.5).
- **Licht:** softbox linksboven met zachte, convergerende schaduw; koepellicht voor occlusie; contactschaduw onder voeten en zomen;
  belichting per materiaal (wit doek houdt tekening, zwart lycra houdt glans).
- **Varianten:** exact dezelfde camera, positie en licht, zodat een swatch-klik het beeld wisselt zonder te verspringen.
- **Eerlijk:** de render toont alleen wat in de doos zit. Opdruk alleen bij bedrukte producten; een voorbeeldopdruk heet ‘voorbeeld’
  in de alt-tekst en bij het product.

### 8.2 Kleur in de render

Merk- en variantkleuren worden in de render **gemeten**, niet geschat: `tools/measure_render.py` neemt de verzadigde productpixels,
deelt ze in lichtheidsbanden en middelt in lineair licht. Eis: het belichte vlak ligt binnen ΔE<sub>00</sub> 3 van de staal.

| Beeld | Belicht vlak | Middentoon | Schaduwvlak | Staal |
|---|---|---|---|---|
| v4 `img/tent-3x3-klaproos-hero.webp` | #C2350D (ΔE 1,5) | #B53007 (ΔE 4,5) | #AA2D05 (ΔE 6,8) | #C83812 |

De render gebruikt afwerking `"finish": "mat"` (mat gecoat polyester: weinig clearcoat, getinte glans) en ingangskleur
**#AF2D03** voor Klaproos (`tokens.json` → `render`). Herhaal de meting als het licht of de renderer verandert
(`tools/calibrate.py`). v4 is opnieuw gerenderd met de renderer van 17-10-2026 (andere doekmaterialen dan in v3).

### 8.3 Google Shopping en feed

Het standaardbeeld van elke tent die in Klaproos leverbaar is, is de **Klaproos-variant zonder opdruk** op Steen
(`img/tent-3x3-klaproos-hero.webp`): valt op tussen witte tenten op wit en is toch het echte product. Zet die variant als eerste.
**Voorwaarde [claim]:** de doekleverancier levert Klaproos (lab-dip, §4.5). Levert hij alleen zijn eigen ‘rood’, render dan die
gemeten kleur en noem hem ‘Rood’, niet Klaproos. De versie mét Klapklaar op de luifel (`img/tent-3x3-klaproos-logo-hero.webp`) is
alleen voor de bedrukte-tent-pagina (als voorbeeld), banners en social. Controleer de actuele Google Merchant Center-beeldeisen
vóór livegang (konden in deze sessie niet opgezocht worden).

### 8.4 Bedrukking in beeld en op het product

- **Luifel:** `print-wordmark.svg` in één kleur (Zand op Klaproos of Inkt, Inkt op wit). Hoogte 54% van de luifel: op een luifel
  van 21 cm (maat leverancier controleren) 11,3 cm hoog en 32 cm breed, 11% van een zijde van 3 m. Nooit breder
  dan de helft van een zijde. Gecentreerd, op alle vier de zijden. Groter: luifel-lock-up op dak of zijwand.
- **Statafelrok:** `print-mark.svg` (de k onder de tent) 15 cm breed op Ø 80, hart op 27 cm boven de vloer, **op het vlakste deel van
  de rok: halverwege een voet en het midden van het paneel**. Niet op een voet en niet in de plooi tussen twee voeten: daar knikt de
  stretch het beeld (getest in de render, drie posities). Laat de leverancier de positie bevestigen met een proefhoes. Klantlogo’s
  volgen dezelfde regel. Borduren of flock onder 14 mm: `mark-klein`.
- **Bestelbus:** `logo-luifel.svg` op de zijkant, logohoogte ≈ 1/3 van de laadruimte, breedte ≈ 55%; Klaproos-plint van 15–20 cm
  als luifelband; achterdeuren alleen beeldmerk + telefoonnummer. Folie: de afgetekende kleur (§4.5).
- **Renderer:** opdruk vanaf SVG-pad en de afwerking `mat` zitten in `tools/renders-svgprint.patch`. De patch is op 17-10-2026 opnieuw
  gemaakt tegen de werkkopie van `renders/` (de doekmaterialen zijn daar intussen veranderd). Specs: `tools/make_jobs.py` →
  `tools/render-jobs.jsonl`.

### 8.5 Praktijkfoto’s (zodra ze er zijn)

Renders geven vorm en kleur, maar geen vertrouwen dat het in het echt zo staat. Naast gevestigde winkels is dat het grootste gat.
De eigenaar werkt in de eventverhuur: fotografeer echte opbouw en echt gebruik.

- **Shotlijst:** (1) opbouw met twee man, handen aan de schaar, tent half uitgeklapt; (2) tuinfeest rond 18:00, Klaproos-tent met
  statafels in stretch en prikkabel; (3) club, horeca of beurs: rij tenten of terras met logo op de luifel; (4) details in gebruik:
  voetgewicht op de voetplaat, haring in gras, strik van de rok; (5) zakelijke opstelling met tientallen bedrukte hoezen.
- **Echt:** eigen events en klanten met schriftelijke toestemming (ook voor herkenbare personen en hun logo’s), plaats en datum in
  het bijschrift. Geen stockfoto’s, geen gemonteerde logo’s op andermans tenten.
- **Licht:** daglicht of laag avondlicht van opzij; nooit flits recht van voren. Witbalans op het doek: neem in de eerste opname de
  Klaproos-staal mee en corrigeer daarop.
- **Kader:** 4:3 of 3:2, horizon recht, product op een derde, ooghoogte (35–50 mm-equivalent, geen groothoekvertekening).
  Minstens 2400 px aan de korte kant.
- **Plek in de winkel:** home-band ‘In gebruik’, beeld 5–6 in de galerij van de productpagina (nooit beeld 1: dat blijft de render
  op Steen), Zakelijk-pagina, collectiekop. Tot ze er zijn: opstelling-renders (`img/scene-hero.webp`, `img/scene-zakelijk.webp`).

### 8.6 Vertrouwen: vaste plekken, alleen met echte data

| Plek | Wat | Regel |
|---|---|---|
| Footer (Polder) | Betaalmethoden | Iconen uit Shopify (`shop.enabled_payment_types` + `payment_type_svg_tag`), alleen wat aan staat |
| Footer + productpagina | Bel of app ons, openingstijden | Theme-instelling [claim]; leeg = niet tonen |
| Footer | KvK- en btw-nummer, adres, retouradres | Theme-instelling [claim] |
| Footer + productpagina | Reviewscore | Alleen via een review-app die `reviews.rating` / `reviews.rating_count` vult; anders niets, geen lege sterren |
| Footer | Thuiswinkel Waarborg of ander keurmerk | Alleen met lidmaatschap [claim]; logo en link van de organisatie zelf |
| Productpagina, onder de knop | Bedenktijd | ‘14 dagen bedenktijd (niet bij bedrukt maatwerk)’ [claim]; laat de tekst juridisch controleren |

Stijl: Inkt- of Zand-iconen van 24 px met een label, rustig in de footer of op Steen; geen badges, sterren of ‘veilig!’-schilden
zonder bron.

## 9. Iconen

- 24 px raster, lijn 2 px (1,75 px op 20 px), platte uiteinden, ronde hoeken, hoekradius 2 px, `currentColor`.
- Alleen het vlaggetje mag Zon zijn. Geen gevulde of meerkleurige iconen, geen emoji.
- 23 iconen als `<symbol>` in `brand-sheet.html`: levering, factuur, app ons, maatgids, logo uploaden, drukproef, haring, wind,
  tent, statafel, verlichting, zakelijk, winkelwagen, zoeken, account, meer, minder, klaar, info, let op, levertijd, bellen, retour;
  plus het vlaggetje. Het tent-icoon volgt het logo (dakrand, poten, stompe vlag).
- Iconen staan altijd naast tekst (header-iconen hebben een zichtbaar label of `aria-label`).

## 10. Vorm, ruimte en beweging (zie `tokens.json`)

- **Radii:** badge 4, knop en invoerveld 8, kaart en beeld 12, paneel 16, chip rond. Stevig, niet bubbelig.
- **Ruimte:** 4-px-raster (4–128). Paginamarge 16/24/40, container max. 1360, sectie-afstand 48 mobiel / 96 desktop, aanraakdoel
  minimaal 44 px.
- **Schaduw:** alleen bij hover op kaarten, sticky header, drawer en toast. Geen schaduw op knoppen.
- **Beweging:** ‘uitklappen’: drawers en accordeons 220 ms `cubic-bezier(.16,1,.3,1)`, geen bounce; knop → Polder + vinkje
  ‘Toegevoegd’ 140 ms; toast 220 ms; hover 140 ms. Met `prefers-reduced-motion` alleen opacity ≤ 140 ms.

## 11. Naam, merkrecht en onderscheid

### 11.1 Naamtoets (jouw beurt, ± 45 minuten)

In deze ronde geprobeerd en geweigerd: WebSearch (budget op) en de registers via rdap.sidn.nl, rdap.dns.be, dns.google en
cloudflare-dns.com (proxy 403). Er is geen bewijs dat ‘Klapklaar’ vrij of bezet is. De deep-link-formaten van de registers zijn niet
gecontroleerd; begin op de hoofdpagina.

1. **KvK Handelsregister** (kvk.nl → zoeken): ‘klapklaar’, ‘klap klaar’, ‘klapklar’. **Stop** bij een actieve handelsnaam in feest,
   verhuur, tenten, meubilair of detailhandel.
2. **BOIP** (boip.int → merken zoeken) en **EUIPO TMview** (tmdn.org/tmview): KLAPKLAAR en gelijkende (KLAP-KLAAR, KLAPKLAR), woord- en
   beeldmerken, Nice-klassen 11 (verlichting), 20 (meubilair, statafels), 22 (tenten, zeilen), 24 (textiel: rokken, hoezen), 35
   (detailhandel). **Stop** bij een ingeschreven of aangevraagd gelijkend merk in die klassen.
3. **SIDN** (sidn.nl → whois) en **DNS Belgium** (dnsbelgium.be → whois): klapklaar.nl, klapklaar.be, plus klapklar.nl,
   klap-klaar.nl, .com en .eu. Bezet is geen stop, wel een signaal om verder te kijken wie het is.
4. **Web**: ‘klapklaar’ los en met ‘partytent’ of ‘statafel’; Instagram @klapklaar; bol.com; Marktplaats.
5. Alles schoon? Leg het merk voor aan een merkenadviseur (§11.4) en vul de reservenaam-kolom niet meer in.

### 11.2 Vergelijking met Outmate en Statafelshop (invullen)

Open https://www.outmate.nl en https://www.statafelshop.nl, maak een screenshot van header en een productpagina, en vul in:

| | Klapklaar | Outmate | Statafelshop |
|---|---|---|---|
| Naam / klank | klap-klaar, 2 lettergrepen, Nederlands | | |
| Logo-vorm | getekend woordmerk, tent met poten en vlag over de aa | | |
| Hoofdkleur (hex) | Klaproos #C83812, met Polder #154F3E en Zon #FFC23A | | |
| Letter | getekend woordmerk; Figtree | | |
| Toon | je/jij, nuchter, één knipoog | | |

**Beslisregel:** lijkt één rij sterk op een van beide (zelfde kleurfamilie als hoofdkleur, zelfde motief, verwisselbare naam), dan
niet live gaan maar dat onderdeel aanpassen. Wat het dossier wel zegt: beide winkels zijn van Outmate BV (Staphorst), en Outmate
levert tenten in o.a. zwart, wit, blauw, grijs, zand, groen en rood. Hun huisstijlkleur en logo zijn onbekend.

### 11.3 Als de naam niet vrij is

**Reservenamen** (niet getoetst): **Staklaar** (sta(tafel) + klaar, ‘staat klaar’) en **Tentklaar** (direct, zwakker als merk). Beide
eindigen op -klaar. **Blijft staan:** de tent boven de aa van ‘klaar’ en zijn hele constructie, kleuren, Figtree, iconen, renders,
toon (‘klaar’), alle componenten en tokens. **Opnieuw:** de letters vóór ‘laar’ (bij Staklaar: s en t, nieuw te tekenen), de letter in
het beeldmerk, de tagline en de ‘klap’-woordgrapjes. `tools/_naamwissel.svg` laat zien wat blijft.

### 11.4 Wat deponeren

Inschatting, geen juridisch advies; laat een merkenadviseur meekijken.

1. Het **beeldmerk** (de k onder de tent met poten en vlag, `mark.svg`) als beeldmerk.
2. Het **complete logo** als gecombineerd woord-/beeldmerk.
3. Het **woordmerk** alleen: voor tenten (22) en klaptafels (20) kan ‘klapklaar’ als beschrijvend gezien worden (‘klaar door
   uitklappen’), met kans op weigering of een zwakke inschrijving. Het beschermbare deel is de tent.

**Typo-domeinen:** klapklar.nl, klap-klaar.nl (beschikbaarheid niet gecontroleerd).

## 12. Voor de theme- en catalogusbouwers

- `tokens.json` → CSS custom properties en `settings_schema.json`-defaults. Per kleurschema staan rust, hover, ingedrukt en focus in
  `color_schemes`; `shopify_color_schemes` geeft per schema de hex-waarden.
- **Header-logo (één regel):** neem `svg/logo-inline.svg` (desktop) en `svg/logo-klein-inline.svg` (onder 750 px) inline op in
  `snippets/logo.liquid`. Letters zijn `fill="currentColor"` (volgen de tekstkleur van het schema), de tent heeft `class="kk-tent"`.
  CSS: `.kk-tent{fill:var(--logo-tent)}` met `--logo-tent: #C83812` op schema 1–3, `#154F3E` op Zakelijk-pagina’s en `#FFC23A` op
  schema 5 en 6. Gebruik `logo-mono` niet in de header.
- **Favicon:** zet de PNG’s als theme-assets (`favicon-16.png`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`,
  `favicon-cart-16.png`, `favicon-cart-32.png`) en neem dit op in `layout/theme.liquid`:

```liquid
{%- liquid
  assign fav = ''
  if cart.item_count > 0
    assign fav = '-cart'
  endif
-%}
<link rel="icon" type="image/png" sizes="16x16" href="{{ 'favicon' | append: fav | append: '-16.png' | asset_url }}" data-favicon="16">
<link rel="icon" type="image/png" sizes="32x32" href="{{ 'favicon' | append: fav | append: '-32.png' | asset_url }}" data-favicon="32">
<link rel="icon" type="image/png" sizes="192x192" href="{{ 'favicon-192.png' | asset_url }}">
<link rel="apple-touch-icon" href="{{ 'apple-touch-icon.png' | asset_url }}">
```

  Geen `type="image/svg+xml"`-link. Na een AJAX-wijziging moet de winkelwagenstand mee. De theme werkt de teller bij in
  `KK.updateCartCount(count)` (`theme/assets/global.js`, aangeroepen na `/cart/add.js` en `/cart/change.js`); zet daar de
  favicons om in plaats van de huidige ene SVG-link:

```liquid
<script>
  window.KK = window.KK || {};
  KK.favicons = {
    16: { base: {{ 'favicon-16.png' | asset_url | json }}, cart: {{ 'favicon-cart-16.png' | asset_url | json }} },
    32: { base: {{ 'favicon-32.png' | asset_url | json }}, cart: {{ 'favicon-cart-32.png' | asset_url | json }} }
  };
</script>
```

```js
// in KK.updateCartCount(count), vervangt het blok met link[data-favicon] en KK.faviconCart
document.querySelectorAll('link[data-favicon]').forEach((l) => {
  const f = KK.favicons && KK.favicons[l.dataset.favicon];
  if (f) l.href = count > 0 ? f.cart : f.base;
});
```

- **Knoppen:** primaire knop per schema volgens §4.3; ‘Toegevoegd’ = Polder; productkaarten zonder gevulde Klaproos-knop (§4.2).
- **Iconen:** neem de `<symbol>`’s uit `brand-sheet.html` over als snippet `icon-sprite.liquid`.
- **Actieprijs:** Zon-label met `clip-path: polygon(0 0,100% 0,calc(100% - 9px) 50%,100% 100%,0 100%)`, Inkt-tekst, tabular.
- **Fonts:** `type_header_font` = `figtree_n8`, `type_body_font` = `figtree_n4`; 700 en 600 via `font_modify`.
- **Productbeelden:** renders volgens §8 met de patch `tools/renders-svgprint.patch`.

## 13. Claims uit dit merkboek (voor `docs/claims-to-confirm.md`)

Alles wat hieronder staat, is een voorbeeld of een belofte die de eigenaar moet bevestigen of aanpassen. Deze punten horen ook
in `docs/claims-to-confirm.md` (dat bestand beheert de theme-bouwer; staan ze er nog niet in, voeg ze toe).

| Claim | Waar | Wat te doen |
|---|---|---|
| Naam Klapklaar, klapklaar.nl/.be, @klapklaar | overal | Naamtoets §11.1 vóór registratie of druk |
| Klaproos-doek leverbaar (lab-dip) | Shopping-beeld, Klaproos-varianten | Bij de doekleverancier navragen (§4.5, §8.3) |
| ‘14 dagen bedenktijd (niet bij bedrukt maatwerk)’ | productpagina onder de knop | Termijn = instelling `return_days`; uitzondering voor maatwerk juridisch laten controleren |
| ‘Bel of app ons, ma–vr’ + nummer | productpagina, footer | Echt nummer en openingstijden invullen, anders verbergen |
| KvK, btw-nummer, adres, retouradres | footer | Invullen |
| Thuiswinkel Waarborg of ander keurmerk | footer | Alleen met lidmaatschap |
| Reviewscore | kaart, productpagina, footer | Alleen via een review-app met echte reviews |
| Betaalmethoden (iDEAL, Bancontact, kaarten, op factuur) | footer, winkelwagen | Alleen wat in Shopify aan staat; ‘op factuur’ alleen met een factuurapp of B2B |
| ‘Snel in huis in NL & BE’, ‘morgen in huis bij bestelling vóór 14:00’ | utility-balk, productpagina | Levertijdinstellingen in de theme |
| ‘Offerte binnen één werkdag’, ‘vaste contactpersoon’ | Zakelijk, offerte | Alleen als het zo werkt |
| Staffelprijzen en ‘vanaf 10 stuks’ | Zakelijk, kaarten | Bedragen zijn voorbeelden; korting echt instellen in Shopify |
| Prijzen in de brand sheet (€ 319, € 39,95, € 169,90 …) | brand sheet | Voorbeelden |

## 14. Herbouwen

```bash
cd brand/tools
VENDOR=<map met gfonts/ofl/figtree> python3 build.py ..        # logo-, merk- en favicon-SVG's, metingen, logo-meta.json, print-json
python3 -I color3.py <colorsrc> ../tools/_repro.json '{"klaproos":"#C83812","zon":"#FFC23A","polder":"#154F3E","inkt":"#1D2420","zand":"#FBF6EC"}'
python3 tokens.py ..                                            # tokens.json + _contrast.json
python3 make_jobs.py ..                                         # render-jobs.jsonl met de printpaden van build.py
# productbeelden: kopie van renders/ + patch (cd <kopie> && patch -p1 < brand/tools/renders-svgprint.patch)
node <kopie>/renders/render.mjs --batch render-jobs.jsonl --samples 32   # schrijft naar brand/img
python3 finish_imgs.py ../img ..                                # uitsnede + kleurmeting (_render_check.json)
node rasterize.mjs ..                                           # favicon- en icoon-PNG's (Playwright)
python3 build_sheet.py .. && node shot.mjs file://$PWD/../brand-sheet.html ../brand-sheet.png 1440 900 1
python3 build_md.py ..                                          # dit document (tabellen uit tokens en metingen)
```

`<colorsrc>` bevat de klonen van de bronnen in §4.5 (commits vermeld) en de twee ICC-profielen. Het font in `fonts/` (Figtree) valt
onder de SIL Open Font License 1.1 (`fonts/OFL-Figtree.txt`). `tools/kk_v3.py` is alleen het archief van de v3-geometrie voor de
vergelijking in §3.2.
