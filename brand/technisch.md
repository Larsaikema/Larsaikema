# Klapklaar · technische bijlage

Versie 7.1 · 17 oktober 2026 · bij [`brand.md`](brand.md)

Voor ontwerpers, drukkers en de theme-bouwer: de constructie en metingen van het logo, alle bestanden, minimummaten per
productiemethode, kleur- en garenreferenties per materiaal, de renders, de overdracht aan de Shopify-theme, het werklog, de bronnen,
het herbouwen en het protocol van de logotest. Regels en uitleg staan in brand.md; waarden staan in `tokens.json`.

## 1. Logo-constructie

`tools/kkgeo.py` construeert elke vorm als veelhoek met afgeronde hoeken (kubische Béziers, handvatfactor 0,62 bij 90°) en, voor de
tent, met krommen (`rpath`). Geen fontcontouren. `tools/logo.py` schrijft alle SVG’s en meet ze (`tools/logo-meta.json`). Eenheden:
kapitaalhoogte 700.

**Diktes**

| Vorm | Eenheden | % van de kapitaalhoogte |
|---|---:|---:|
| stok (K, L, P, R, E, F, I, N, T) | 142 | 20,3 % |
| balk (L-voet, P/R-boog, E, F, T, Z) | 118 | 16,9 % |
| A-dwarsbalk | 108,6 | 15,5 % |
| K arm (loodrecht) | 130 | 18,6 % |
| K been (loodrecht) | 136 | 19,4 % |
| diagonaal N, Z, Y (loodrecht) | 146 | 20,9 % |
| tentpaal | 70 | 10 % |
| luifelband (tussen de palen) | 68,6 | 9,8 % |
| schulpdiepte | 40 | 5,7 % |
| paal ingesprongen vanaf de luifelhoek | 18 | 2,6 % |
| hoekradius | 18 | 2,6 % |
| naar binnen gebogen dakrand (midden) | 11 | 1,6 % |
| zware tent-A: paal | 108 | 15,4 % |
| zware tent-A: luifelband | 82 | 11,7 % |
| zware tent-A: schulpdiepte | 50 | 7,1 % |
| zware tent-A: open naad tussen dak en luifel | 72 | 10,3 % |

**Hoeken** (gemeten aan de constructielijnen)

| Hoek | Gemeten |
|---|---:|
| K arm (vanaf horizontaal) | 47,5° |
| K been (vanaf horizontaal) | 59,5° |
| R been (vanaf horizontaal) | 55,8° |
| A benen (vanaf horizontaal) | 70,6° |
| tentdak, koorde top-hoek (vanaf horizontaal) | 56,4° |
| dak zware tent-A (vanaf horizontaal) | 50° |
| tentpalen | 0° |

**De tent-A.** Breedte 604. Alle hoogtes hangen aan de gewone A:

| Hoogte (eenheden) | Tent-A | Gewone A |
|---|---:|---:|
| piek / top | 726 geometrisch, 714,3 na de afronding | 700 (vlakke top) |
| bovenkant luifel = bovenkant dwarsbalk | 250 | 250 |
| onderkant luifelband (tussen de schulpen) | 181,4 | – |
| onderkant schulpen = onderkant dwarsbalk | 141,4 | 141,4 |
| breedte | 604 | 610 |

- **Dak:** van de luifelhoeken (y 250) naar de piek (y 726), elke rand een kubische kromme die halverwege 11 eenheden naar binnen
  buigt (gespannen doek); koorde van hoek naar piek 56,4° (v6: 35°). Piek afgerond met radius 12; de werkelijke top ligt na de
  afronding 14,3 eenheden boven de kapitaalhoogte. Geen dakrand, geen naad: dak en luifel zijn één vorm.
- **Luifel:** loodrecht van y 250 tot y 181,4 aan de buitenkant; tussen de palen drie schulpen (parabolisch, 40 diep) tot y 141,4.
- **Palen:** 70 breed (0,49 × de stok van 142), recht, 18 binnen de luifelhoek.
- **Gebruik:** alleen in twee kleuren vanaf 160 px (`logo.svg`, `logo-inverse.svg`, `svg/logo-inline.svg`, de kleurenluifels).

**De zware tent-A** (`kkgeo.glyph_tent_zwaar`, v7.1): logo-klein, elke één-kleurversie, borduur-, flock-, folie- en stempelwerk, het
beeldmerk en het vierkante icoon. Zelfde breedte (604) en paalinsprong (18) als de slanke tent, zodat hij in hetzelfde vak past.

| Maat (eenheden) | Zware tent-A | Slanke tent-A |
|---|---:|---:|
| dak (vanaf horizontaal) | 50°, rechte randen | 56,4°, randen 11 naar binnen gebogen |
| piek | 716 geometrisch, 707,8 na de afronding | 726 geometrisch, 714,3 na de afronding |
| dakhoeken | 356,1 | 250 (dak loopt over in de luifel) |
| open naad tussen dak en luifel | 72 | – |
| bovenkant luifel | 284,1 | 250 |
| onderkant luifelband (tussen de schulpen) | 202,1 | 181,4 |
| onderkant schulpen = hoogte van de opening tussen de palen | 152,1 | 141,4 |
| luifelband | 82 | 68,6 |
| schulpen | 2 × 50 diep | 3 × 40 diep |
| palen | 108 (0,76 × de stok) | 70 (0,49 × de stok) |
| paal ingesprongen vanaf de luifelhoek | 18 | 18 |
| breedte | 604 | 604 |

- **Dak:** recht, van de dakhoeken naar de piek op 50°; piek afgerond met radius 16. Geen holle randen: dat maakte de slanke tent
  klein tot een circustent.
- **Naad:** open, 72 hoog over de hele breedte. In één kleur scheidt hij dak en luifel, zodat de luifel als dwarsbalk van een A
  leest en het geheel niet tot schoppen of een druppel samensmelt. In logo-klein en het beeldmerk is het ook de kleinste opening, en
  die bepaalt daar de minimummaat (§3); op volle breedte blijft dat het gat tent–R (52).
- **Luifel:** 82 hoog tussen de palen, hoeken afgerond met radius 8; twee parabolische schulpen van 50 diep.
- **Palen:** 108 breed (0,76 × de stok), recht, voeten afgerond met radius 9.
- **logo-klein:** de zware tent en 34 eenheden extra ruimte per letterpaar. **Eén kleur op volle breedte** (`svg/logo-mono.svg`,
  `svg/logo-on-lampion.svg`, `svg/print-wordmark.svg`): de letters van logo.svg met de zware tent in het vak van de slanke; viewBox
  en letterposities zijn gelijk aan logo.svg.

**L en A.** De voet van de L loopt over in het linkerbeen van de A: één contour, geen overlap. De A begint 100 eenheden vóór het einde
van de voet; de voet eindigt binnen het been.

**Lock-upletters.** Z, E, F, I, J, T, N, S, Y, de punt en de plus volgen dezelfde regels: stok 142, balk 118 (E/F-middenbalk ×0,96),
diagonaal 146 loodrecht gemeten (N, Z, Y), bogen van S en J met dezelfde buitenradius (168) en binnenradius als de P-boog, buishoek 18.
In de lock-ups staan ze op 40 % (ZAKELIJK) en 16 % (descriptor) van de logohoogte, met 60–70 eenheden extra letterruimte.

**Letterafstanden** (`kkgeo.KERN`, per paar op het oog gezet en gemeten)

| Tussen | logo.svg: kortste afstand | logo.svg: wit per regel | logo-klein: kortste afstand |
|---|---:|---:|---:|
| K – LA | 64 | 179 | 98 |
| LA – P | 60 | 174 | 94 |
| P – K | 66 | 165 | 100 |
| A – tent | 58 | 248 | 92 |
| tent – R | 52 | 145 | 86 |

**Metingen voor productie.** logo.svg: breedte 5019, dunste vorm 69 (de luifelband tussen de palen), kleinste opening
52. Eén kleur op volle breedte (zware tent): dunste vorm 82 (de luifelband), kleinste opening 52 (tent–R).
logo-klein: breedte 5223, dunste vorm 82, kleinste opening 72 (de naad). Het bovenste binnenvlak van de
gewone A is 100 breed op een kwart van zijn hoogte. Alle hoeken tussen rechte randen zijn ≥ 90° of afgerond; inkepingen, zoals
het kruis van de K en de punten tussen de schulpen, zijn scherp gelaten.

## 2. Bestanden

| Bestand | Inhoud | Gebruik |
|---|---|---|
| `logo.svg` | Inkt-letters, Lampion-tent | standaard, op Zand en Wit |
| `logo-inverse.svg` | Zand-letters, Lampion-tent | op Inkt |
| `mark.svg` | vierkant icoon: zware tent-A, Lampion op Inkt (512) | avatar, app-icoon, bron van `mark-512.png` en `favicon-192.png` |
| `favicon.svg` | vierkant icoon, 32-pixeltekening | bron van `favicon-32.png` |
| `favicon-32.png`, `favicon-192.png` | favicon 32 px; icoon 192 px (PWA, Android) | theme-assets |
| `svg/logo-inline.svg`, `svg/logo-klein-inline.svg` | letters `currentColor`, tent `class="kk-tent"` (slank; klein: zwaar) | bron van `handoff/logo.liquid` |
| `svg/logo-klein.svg`, `svg/logo-klein-inverse.svg` | zware tent-A, meer letterruimte | 96–159 px |
| `svg/logo-on-lampion.svg`, `svg/logo-klein-on-lampion.svg` | één kleur Inkt, zware tent | op Lampion |
| `svg/logo-mono.svg`, `svg/logo-klein-mono.svg` | `currentColor`, zware tent (logo-mono: letters en tent als twee paden, voor de theme) | eenkleurig, op Linnen en foto |
| `svg/logo-luifel.svg`, `svg/logo-luifel-inverse.svg` | woordmerk + Lampion-balk met getekende descriptor | luifel, bus, marktplaatstegel, social |
| `svg/logo-zakelijk.svg`, `svg/logo-zakelijk-inverse.svg` | één kleur, zware tent + getekend label ‘ZAKELIJK’ | offertes, facturen, B2B |
| `svg/mark-lampion.svg`, `svg/mark-zand.svg` | vierkant icoon op Lampion en op Zand | |
| `svg/mark-symbool.svg`, `svg/mark-mono.svg` | beeldmerk zonder vlak (Lampion, `currentColor`) | |
| `svg/print-wordmark.svg`, `svg/print-wordmark-klein.svg`, `svg/print-luifel.svg`, `svg/print-mark.svg`, `svg/print-icon.svg` | drukbestanden: één kleur (zwart = drukkleur), allemaal met de zware tent-A; `print-icon` = het icoon als stempel (tent uitgespaard) | drukker, borduurder, belettering, stempel |
| `svg/favicon-16.svg`, `svg/favicon-cart.svg`, `svg/favicon-cart-16.svg`, `svg/apple-touch-icon.svg` | bronnen van de PNG’s | |
| `img/favicon-16.png`, `img/favicon-cart-16.png`, `img/favicon-cart-32.png`, `img/apple-touch-icon-180.png`, `img/mark-512.png`, `img/logo-email-320.png`, `img/logo-1200.png` | PNG’s | theme-assets, e-mail, social |
| `svg/vlaggenlijn.svg`, `svg/vlaggenlijn-inkt.svg` | vlaggenlijn voor licht en voor Inkt | sectiescheiding |
| `img/*.webp` | productrenders, opstellingen en toepassingen (bus, doos) op Linnen | brand sheet, campagnes, voorbeeld voor de catalogus |
| `handoff/logo.liquid`, `handoff/logo-css.txt`, `handoff/favicon-head.liquid`, `handoff/favicon-cart.js` | kant-en-klaar voor de theme (§6) | |
| `fonts/Figtree-VF.ttf` | Figtree (SIL OFL 1.1) | alleen als de Shopify-handle ontbreekt |

Alle SVG’s hebben een `viewBox` en een `<title>`, en geen `<text>`, `<image>`, `<use>`, `<style>` of externe verwijzingen
(gecontroleerd met lxml: `tools/check_svg.py`, uitvoer `tools/_svg_check.json`). Contouren overlappen niet (buitenkant met de klok
mee, binnenvormen ertegenin); alleen de tekst in de lock-ups is uitgespaard met `fill-rule="evenodd"`.

## 3. Minimummaten per methode

Breedte van het hele logo of symbool (het beeldmerk: de tent zonder vlak). Minimale breedte = vereiste lijn (of opening) gedeeld
door het aandeel van de dunste vorm (of kleinste opening) in de breedte; de grootste van de twee telt. Op scherm geldt bovendien de
visuele grens van brand.md §3.4 (logo.svg vanaf 160 px, logo-klein vanaf 96 px), die strenger is dan het technische minimum hieronder.

| Methode | Kleinste lijn / opening (aanname, mm) | logo.svg (twee kleuren) | print-wordmark.svg (één kleur) | logo-klein, print-wordmark-klein | beeldmerk (print-mark.svg) |
|---|---|---:|---:|---:|---:|
| Borduren (satijnsteek) | 1,2 / 1,0 | 97 mm | 97 mm | 77 mm | 9 mm |
| Flock-transfer (geplot) | 1,5 / 1,5 | 145 mm | 145 mm | 109 mm | 13 mm |
| Flex-/snijfolie (textiel) | 1,0 / 1,0 | 97 mm | 97 mm | 73 mm | 9 mm |
| Snijfolie bus/bord | 1,5 / 1,5 | 145 mm | 145 mm | 109 mm | 13 mm |
| Zeefdruk textiel | 0,5 / 0,6 | 58 mm | 58 mm | 44 mm | 6 mm |
| DTF-transfer | 0,5 / 0,5 | 49 mm | 49 mm | 37 mm | 5 mm |
| Sublimatie (luifel, rok) | 0,3 / 0,3 | 29 mm | 29 mm | 22 mm | 3 mm |
| Offset/digitaal papier | 0,15 / 0,15 | 15 mm | 15 mm | 11 mm | 2 mm |
| Scherm, technisch minimum (1x) | 1,6 px / 1 px | 118 px | 98 px | 102 px | 12 px |

De mm-waarden per methode zijn werkaannames (gangbare vuistregels), niet gecontroleerd met een leverancier. Leg de tabel voor aan je
borduurder, drukker en belettering, zet hun echte minimum in `tools/logo.py` → `METHODS` en bouw opnieuw.

## 4. Kleurreproductie

Per kleur de dichtstbijzijnde stockkleur, met CIEDE2000 tegen de merkkleur. **Digitale benaderingen uit open datasets, niet fysiek
afgetekend.** Linnen, Wit, Lijn, Kiezel, Oker en Bordeaux zijn schermkleuren en worden niet gedrukt.

| Kleur | sRGB | CMYK gestreken (FOGRA39) | CMYK ongestreken (FOGRA29) | Pantone C | Pantone U | Pantone TCX (textiel) | RAL Classic | Oracal 651 |
|---|---|---|---|---|---|---|---|---|
| **Lampion** | `#E66414` | C3 M71 Y99 K0 | C1 M68 Y100 K0 | 4010 C (ΔE 2,1) | 152 U (ΔE 5,4) | 17-1349 TCX Exuberance (ΔE 2,5) | RAL 2008 Bright red orange (5,3) | 651-036 light orange (ΔE 2,2) |
| **Inkt** | `#1D2420` | C76 M61 Y66 K78 | C84 M73 Y62 K64 | Black 3 C (ΔE 1,9) | 5463 U (ΔE 15,5) | 19-5708 TCX Jet Set (ΔE 3,1) | RAL 7021 Black grey (5,6) | 651-070 black (ΔE 8,8) |
| **Zand** | `#FBF6EC` | C2 M4 Y9 K0 | C2 M4 Y7 K0 | 9224 C (ΔE 2,8) | 7527 U (ΔE 7) | 11-0607 TCX Sugar Swizzle (ΔE 2,1) | RAL 9001 Cream (2,9) | 651-010 white (ΔE 8,1) |
| **Polder** | `#154F3E` | C87 M42 Y73 K45 | C91 M45 Y75 K33 | 6161 C (ΔE 1,6) | 3537 U (ΔE 10,2) | 19-5420 TCX Evergreen (ΔE 3,4) | RAL 6016 Turquoise green (3,3) | 651-613 forest green (ΔE 4,3) |
| **Zon** | `#FFC23A` | C0 M28 Y83 K0 | C0 M21 Y83 K0 | 136 C (ΔE 1,2) | 7406 U (ΔE 2,9) | 13-0759 TCX Solar Power (ΔE 2,2) | RAL 1028 Melon yellow (6,5) | 651-021 yellow (ΔE 3,6) |

**Garen** (borduren; Ink/Stitch-paletten, sRGB-benadering per garennummer)

| Kleur | Madeira Polyneon 40 | Isacord 40 | Gunold Poly | Alternatief (2e keus) |
|---|---|---|---|---|
| **Lampion** | 1765 Pumpkin (ΔE 3,2) | 1310 Hunter Orange (ΔE 2,2) | 61457 Fireworks Orange (ΔE 6) | Madeira 1965 Orange (ΔE 4,2) |
| **Inkt** | 1800 Black (ΔE 7,6) | 1375 Dark Charcoal (ΔE 4,7) | 61449 Dark Kelly Green (ΔE 8,8) | Madeira 1705 Dark Army (ΔE 8,7) |
| **Zand** | 1804 Blanc de Blanc (ΔE 3,4) | 2170 Chiffon (ΔE 2,6) | 61071 Off White (ΔE 3) | Madeira 1803 Lily White (ΔE 3,5) |
| **Polder** | 1704 Evergreen (ΔE 3,1) | 5335 Swamp (ΔE 3,6) | 61208 Mallard Green (ΔE 5,2) | Madeira 1985 Green (ΔE 5) |
| **Zon** | 1980 Manila (ΔE 2,5) | 1120 Sunset (ΔE 2) | 61369 Egg Yolk (ΔE 2,2) | Madeira 1683 Buttercup (ΔE 2,7) |

- **Lampion op papier:** 4010 C is de dichtste (ΔE 2,1); de klassieke **1595 C** ligt op ΔE 2,9 en is bij elke drukker voorradig.
  Ongestreken haalt geen Pantone U-kleur Lampion binnen ΔE 5: druk briefpapier op gestreken papier of teken de U-drukproef af.
- **Inkt ongestreken:** zo diep als Inkt komt geen U-kleur (beste ΔE ±16). Op ongestreken papier wordt Inkt Black 6 U of 100 K; dat is
  bewust en mag.
- **Polder en Zon op textiel:** geprint (sublimatie, DTF) via de TCX-referentie in de tabel; geborduurd met het garen uit de
  garentabel (Polder: Madeira 1704 Evergreen of Isacord 5335; Zon: Isacord 1120 of Madeira 1980). Op doek nooit als vlak, alleen als
  accent in een print die al meerkleurig is.
- **Lampion op textiel:** geprint via 17-1349 TCX Exuberance; geborduurd Isacord 1310 of Madeira 1765. Op rood doek nooit Lampion
  (twee warme tinten naast elkaar): daar is het logo één kleur Zand.
- **Flex en flock** (Siser EasyWeed, Poli-Flex, Siser StripFlock en vergelijkbaar): in deze bouwomgeving is geen open kleurdata van
  die series gevonden (GitHub-zoekopdrachten zonder resultaat, webzoeken niet beschikbaar). Kies daarom op de fysieke kleurkaart van
  de leverancier: leg de afgetekende Pantone C ernaast in D50-licht en daglicht, kies de dichtste, en noteer serie en nummer in de
  tabel hieronder. Voor één kleur Zand op donker doek is een gebroken wit gebruikelijk; voor Inkt een zwart.
- **Doek is geen merkkleur.** Tenten, zijwanden en rokken komen in de stockkleuren van de leverancier.
- **Folie:** geplot Lampion 651-036, Inkt 651-070, Zand 651-010; merkkleuren op de bus in geprinte wrap-folie.
- **Karton:** één kleur Inkt (flexo) op bruin; Pantone Black 3 C als referentie.

**Toleranties (voorstel):** drukwerk op gestreken papier ΔE<sub>00</sub> ≤ 2 tegen de afgetekende Pantone C; textiel, folie en garen
ΔE<sub>00</sub> ≤ 3 tegen de afgetekende staal.

**Aftekenen vóór de eerste productie**

1. Bestel de waaiers: Pantone Formula Guide C + U, Pantone FHI (TCX), het staalboek van de doekleverancier, RAL K7, de Oracal
   651-kleurkaart, de garenkaart van je borduurder en de flex/flock-kaart van je textieldrukker.
2. Gebruik geen scherm en geen afdruk van dit document als kleurreferentie.
3. Leg per kleur de dichtstbijzijnde stalen naast elkaar, in D50-licht en in daglicht, en kies op het oog.
4. Noteer per kleur hieronder en in `tokens.json` → `print.colors` wat gekozen is, door wie en wanneer.

| Kleur | Papier (Pantone C/U) | Geprint textiel (TCX) | Garen | Flex/flock | Lak (RAL) | Folie | Afgetekend door | Datum |
|---|---|---|---|---|---|---|---|---|
| Lampion | | | | | | | | |
| Inkt | | | | | | | | |
| Zand | | | | | | | | |
| Polder | | | | | | | | |
| Zon | | | | | | | | |

**Methode.** sRGB → CIELAB (D65, Bradford naar D50), ΔE = CIEDE2000 (`tools/color3.py`, `tools/repro.py`, uitvoer
`tools/_repro.json`). CMYK met Pillow/LittleCMS, relatief colorimetrisch met zwartpuntcompensatie (Adobe Coated FOGRA39 / Uncoated
FOGRA29). Datasets (onofficieel):

- Pantone Solid Coated 2024 (3219 kleuren), Lab D50, onofficieel: gemeten uit de kleurvoorbeelden op pantone.com (README van de repo): https://github.com/aj90909/unofficial-pantone-solid-coated-2024-v5/blob/3d6ad83683cebc13ec859a675eae2a4c29bfd4d8/output.json
- Pantone FHI Cotton TCX, naam + sRGB-hex, onofficieel: https://github.com/pedroduke/pantone-tcx/blob/566d68d90f35047a6a1dfca28786b149269184e1/src/pantoneColors.js
- RAL Classic, sRGB-hex (bron A): https://github.com/ieskudero/ral-colors/blob/55e9cfc3d0b333af74c56acad6bd1aeee840d83a/RAL/classic.js
- RAL Classic, sRGB-hex (bron B; de repo noemt het zelf "preview HEX approximate"): https://github.com/office952/workos-vscode/blob/a1c28854dbeee553c8420c4639c8145ebe9d9230/frontend/src/lib/colorRegistry/import/sources/ral_standard.csv
- ORACAL 651 snijfolie, sRGB "parsed from ORAFOL ORACAL 651 product page (sample colors)": https://github.com/office952/workos-vscode/blob/a1c28854dbeee553c8420c4639c8145ebe9d9230/frontend/src/lib/colorRegistry/import/sources/oracal651-orafol.txt
- Adobe "Coated FOGRA39 (ISO 12647-2:2004)", git-lfs sha256 da2b9b59...ce77: https://github.com/ConRes/conres.io/blob/800dbc48d23cc3305c5176296a369e6af23ee1ab/testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/CoatedFOGRA39.icc
- Adobe "Uncoated FOGRA29 (ISO 12647-2:2004)", git-lfs sha256 9af0eb03...c392: https://github.com/ConRes/conres.io/blob/800dbc48d23cc3305c5176296a369e6af23ee1ab/testing/iso/ptf/2026/packages/color-engine-2026-04-20/tests/fixtures/profiles/cmyk/UncoatedFOGRA29.icc
- PANTONE+ Solid Uncoated (V3), Lab D50 uit een Adobe .acb-kleurboek (X-Rite 2014), onofficieel: https://github.com/jacobbubu/color-books/blob/6edf3a058c0a40017f0c451f1910170433af70db/color-books/PANTONE+ Solid Uncoated-V3.json
- Ink/Stitch-borduurpaletten (GPL-3.0): kleurnaam, nummer en een sRGB-benadering per garen: https://github.com/inkstitch/inkstitch/blob/6555892128e34c390493407d76f0fe9e0f7cf905/palettes/InkStitch Madeira Polyneon.gpl

## 5. Renders

- **Renderer:** `renders/` (three.js in headless Chromium). Opdruk vanaf een SVG-pad zit in de patch `tools/renders-svgprint.patch`;
  de modellen voor bus, doos en draagtas staan in `tools/brandApps.js`. Op een kopie van `renders/`:
  `git apply --exclude='renders/js/materials.js' brand/tools/renders-svgprint.patch`, kopieer `brandApps.js` naar `models/` en
  registreer `bestelbus` en `verpakking` in `models/index.js`.
- **Opdrachten:** `tools/make_jobs.py` schrijft `tools/render-jobs.jsonl`: de opdruk uit `svg/print-wordmark.svg` en
  `svg/print-mark.svg` (Zand op rood en zwart, Inkt op wit), de wrap uit `svg/logo-luifel.svg` (volle kleur), de doos uit
  `svg/print-luifel.svg` en `svg/print-mark.svg` (Inkt), achtergrond Linnen `#ECE4D6`, tenten in stockkleuren.
- **De standaardachtergrond in `renders/` is nog Steen `#EFEDE8` (v5).** Zet `--bg '#ECE4D6'` bij elke catalogusrender, of wijzig de
  standaard in `renders/js/main.js` en `renders/js/engine.js`.
- **Nieuw in v7:** de hero is een witte tent met het logo in Inkt (geen rode tent naast de oranje luifelbalk); bus, doos en draagtas
  zijn 3D-renders in plaats van schema’s.

## 6. Overdracht aan de theme

De theme (`theme/`) gebruikt nog brand v5/v6. Dit verandert er; de bestanden in `handoff/` zijn klaar om over te nemen.

### 6.1 Assets kopiëren (bron → `theme/assets/`)

| Bron in `brand/` | Naam in `theme/assets/` |
|---|---|
| `img/favicon-16.png` | `favicon-16.png` |
| `favicon-32.png` | `favicon-32.png` |
| `favicon-192.png` | `favicon-192.png` |
| `img/apple-touch-icon-180.png` | `apple-touch-icon-180.png` |
| `img/mark-512.png` | `mark-512.png` (logo in de structured data) |
| `img/favicon-cart-16.png` | `favicon-cart-16.png` |
| `img/favicon-cart-32.png` | `favicon-cart-32.png` |
| `svg/logo-zakelijk.svg` | `logo-zakelijk.svg` |
| `svg/vlaggenlijn.svg`, `svg/vlaggenlijn-inkt.svg` | `vlaggenlijn.svg`, `vlaggenlijn-inkt.svg` |

### 6.2 Instellingen en kleurschema’s

- **Kleuren** (`config/settings_data.json` → `current`): de waarden in `tokens.json` → `shopify_color_settings`. Nieuw:
  `color_lampion` `#E66414`; vervallen: `color_klaproos` (zet het tijdelijk op Lampion tot de CSS het niet meer gebruikt).
- **Kleurschema’s:** de zes schema’s in `tokens.json` → `shopify_color_schemes`. Nieuw per schema: `buy_button` (Lampion),
  `buy_button_label` (Inkt) en `buy_button_hover_border` (Inkt); op schema 3–6 is er geen koopknop (`null`). De primaire knop
  (`primary_button`) is Inkt (op Inkt: Zand).
- **Waar welk schema** (`tokens.json` → `shopify_scheme_use`): luifelbalk scheme-5 (Lampion, Inkt-tekst), header scheme-1, footer
  scheme-6 (Inkt), Zakelijk scheme-4 (geen Lampion), heroband scheme-3, kaarten en productinfo scheme-2.
- **Badges en statussen** (CSS): Nieuw = Wit met 1,5 px Inkt-rand; Met jouw logo = Linnen met Inkt en upload-icoon; Staffelprijs = Wit
  met Kiezel-rand; Actie = Zon met Inkt; de winkelwagenteller Lampion met Inkt-cijfer. Polder alleen voor Op voorraad, Toegevoegd en
  succes.
- **Optiechips:** gekozen = Linnen vlak, 2 px Inkt-rand, vet label en vinkje; niet leverbaar = Lijn-rand en doorgestreept label
  (tokens → `components.option-chip`). **Geen stippelrand** behalve de uploadzone.

### 6.3 Header-logo

Neem `handoff/logo.liquid` over als `snippets/logo.liquid` (zelfde parameters, varianten `full`, `klein`, `auto`, `zakelijk`). De
letters zijn `fill="currentColor"`, de tent heeft `class="logo-svg__roof"` met `fill: var(--logo-roof, var(--c-lampion))`; zet
`--logo-roof` per schema op `logo_tent`. Breedte: desktop 200 px, mobiel 132 px (`settings.logo_width` 200, `logo_width_mobile` 132).
Onder 160 px breed toont de snippet logo-klein (met de zware tent).

**Eén kleur, automatisch.** De variant `full` draagt beide tenten: de slanke (`.logo-svg__roof`) en de zware
(`.logo-svg__roof-mono`, `currentColor`, standaard `opacity="0"`). Elk kleurschema krijgt `--logo-tent-mono: 1` als zijn
`logo_tent` gelijk is aan zijn tekstkleur (`color_to_hex`), of als ‘Tent overal in de kleur van de letters’ aan staat; de CSS uit
`handoff/logo-css.txt` toont dan de zware tent in plaats van de slanke. Op Zakelijk-pagina’s volgt `--logo-tent-mono-zakelijk` de
instelling ‘Zakelijk-pagina’s: logo in één kleur’. logo-klein en `zakelijk` hebben alleen de zware tent en hoeven niet te wisselen.

### 6.4 Knoppen (CSS)

```css
.color-scheme-1, .color-scheme-2, .color-scheme-3, .color-scheme-4 { --btn-bg:#1D2420; --btn-fg:#FFFFFF; --btn-bg-hover:#414641; --btn-border-hover:#414641; --btn2-fg:#1D2420; }
.color-scheme-1 { --btn2-bg-hover:#E9E5DC; } .color-scheme-2 { --btn2-bg-hover:#F1F2F2; } .color-scheme-3, .color-scheme-4 { --btn2-bg-hover:#DBD5C7; }
.color-scheme-5 { --btn-bg:#1D2420; --btn-fg:#FFFFFF; --btn-bg-hover:#1D2420; --btn-border-hover:#FBF6EC; --btn2-fg:#1D2420; --btn2-bg-hover:#EA813F; }
.color-scheme-6 { --btn-bg:#FBF6EC; --btn-fg:#1D2420; --btn-bg-hover:#E5E1D8; --btn-border-hover:#E5E1D8; --btn2-fg:#FBF6EC; --btn2-bg-hover:#383D38; }

.button { background:var(--btn-bg); color:var(--btn-fg); border:2px solid var(--btn-bg); transition:background-color .14s cubic-bezier(.2,0,0,1), border-color .14s cubic-bezier(.2,0,0,1); }
.button:hover { background:var(--btn-bg-hover); border-color:var(--btn-border-hover); }
.button:active { box-shadow:inset 0 2px 0 rgba(0,0,0,.28); transform:translateY(1px); }
.button.button--secondary { background:transparent; color:var(--btn2-fg); border-color:var(--btn2-fg); }
.button.button--secondary:hover { background:var(--btn2-bg-hover); }
/* de koopknop: alleen op scheme-1 en scheme-2, één per scherm */
.button.button--buy { background:#E66414; border-color:#E66414; color:#1D2420; min-height:52px; gap:8px; }
.button.button--buy:hover { background:#E66414; border-color:#E66414; box-shadow:inset 0 0 0 2px #1D2420; }
.button.button--buy:active { box-shadow:inset 0 0 0 2px #1D2420, inset 0 2px 0 rgba(0,0,0,.28); }
.button.is-done { background:#154F3E; border-color:#154F3E; color:#FFFFFF; box-shadow:none; }      /* Toegevoegd, 1,5 s */
.button[aria-disabled="true"] { background:#FFFFFF; border:1.5px solid #DDD2BF; color:#5D625C; box-shadow:none; }
.button:focus-visible { outline:3px solid var(--focus); outline-offset:2px; }
.cart-count { background:#E66414; color:#1D2420; }
.option-chip[aria-checked="true"] { background:#ECE4D6; border:2px solid #1D2420; font-weight:700; }
.option-chip.is-unavailable { border-color:#DDD2BF; color:#5D625C; text-decoration:line-through 1.5px; }
.dropzone { border:1.5px dashed #5D625C; }   /* de enige stippelrand */
@media (prefers-reduced-motion: reduce) { .button { transition:none; } .button:active { transform:none; } }
```

### 6.5 Favicon

De favicons zijn het vierkante icoon (brand.md §3.7): 16 en 32 px zijn eigen pixeltekeningen van de zware tent-A, 180 en 192 px het
vectoricoon. `handoff/favicon-head.liquid` zet de beginstand met `cart.item_count` en geeft de PNG-paden aan `KK.favicons`;
`handoff/favicon-cart.js` wisselt ze in `KK.updateCartCount(count)`. Geen `type="image/svg+xml"`-link: anders gebruikt de browser één
tekening voor elke maat en verdwijnt de 16-px-tekening.

### 6.6 Fonts en tokens

- `config/settings_schema.json`: `type_header_font` `figtree_n8`, `type_body_font` `figtree_n4` (900, 700 en 600 via `font_modify`).
  De `font_picker` `type_accent_font` (Barlow Condensed) vervalt.
- Iconen: neem de `<symbol>`’s uit `brand-sheet.html` over als snippet `icon-sprite.liquid` (tent- en statafel-icoon zijn nieuw).
- Productbeelden: renderachtergrond Linnen (§5); het beeldvlak in de kaart is ook Linnen, zodat de render er naadloos in valt.

## 7. Werklog: van v6 naar v7 (en v7.1)

**v7.1 (merkpolish na drie blinde juryleden).** Alleen deze drie punten; kleuren, fonts, woordmerkletters en de tweekleurige
logo.svg bleven gelijk.

| Kritiek op v7 | Wat v7.1 doet | Meting |
|---|---|---|
| Klein en in druk: circustent of schoppen; palen en schulpen te dun voor borduren en flock | Zware tent-A onder 160 px en in elk drukbestand | dak 50° (was 56,4°), palen 108 (was 70/86), band 82, schulpen 2 × 50, naad 72; borduren logo-klein 77 mm (was 92) |
| Geen vierkant icoon | `mark.svg` als icoon (tent op 72 % van het vlak), pixeltekeningen 16 en 32, apple-touch, avatar, stempel | `svg/print-icon.svg`; `mark-klein` en `print-mark-klein` vervallen |
| Eén kleur: ♠ of druppel | Eén kleur = altijd de zware tent; de theme wisselt vanzelf | IoU 32 px: druppel 0,67 → 0,48, schoppen 0,63 → 0,56, landmark 0,39 → 0,45 (§10) |

**v7 (kritiek op v6)**

| Kritiek op v6 | Wat v7 doet | Meting |
|---|---|---|
| Tent-A = portiek (35°-fronton, balk 84, zuilen 122) en klein ‘KLAPKLAnR’ | Steil dak met punt, luifel met schulpen, palen 70 | dak 56,4°, palen 0,49 × stok (v6 0,86), landmark-IoU 32 px 0,53 → 0,39 (§10) |
| Luifel op 37–50 % van boven, dwarsbalk A op 64–81 % | Luifel en schulpen precies op de dwarsbalk | luifel 141,4–250 = dwarsbalk 141,4–250 |
| Geen overshoot op de punt | Piek boven de kapitaalhoogte | +14,3 eenheden (2 %) |
| P–K 99 eenheden, de rest 82–85: ‘KLAP KLAAR’ | Kerning per paar | zie §1, P–K kleiner dan K–LA |
| Inverse tent 3,04:1 | Lampion | 4,68:1 op Inkt |
| Klaproos en stockrood bijna gelijk (8° hue) | Oranje merkkleur | ΔE<sub>00</sub> 21,6 van het renderrood |
| Inkt-overload op de productpagina | Lampion-koopknop; chips, schakelaar en badges licht | één gevuld Lampion-vlak per productpagina |
| Barlow Condensed naast het logo | Getekende lock-up-letters, Barlow weg | 0 fonts in de lock-ups |
| Sheet brak eigen regels | Geen merkkleur als tekst; label zwart; stippelrand alleen upload | |
| Garen, flex/flock, Pantone U ontbraken | Pantone U + Madeira/Isacord/Gunold voor 5 kleuren; flex/flock-procedure | §4 |
| Bus en doos als platte schema’s | 3D-renders | `img/app-bestelbus.webp`, `img/app-verpakking.webp` |
| Iconen tent (portiek) en statafel (I-balk) | Nieuwe tekeningen | `tools/icons.svg` |
| Vergelijking leeg | Ingevuld waar bronnen zijn; logo en kleur van de concurrenten open | brand.md §12.2 |

## 8. Bronnen en logboek

**Fonthandles.** shopify.dev is vanuit de bouwomgeving geblokkeerd. Bewijs (betrouwbaarheid: waarschijnlijk):

- Kopie van Shopify’s tabel ‘Available fonts’ (bron: shopify.dev/docs/storefronts/themes/architecture/settings/fonts#available-fonts,
  opgehaald 2026-09-22) met `figtree_n3`–`n9`:
  https://github.com/itsmylife44/shopify-theme-builder/blob/0d6d758a5a1ea120e6f1d8caf40c06a29fa48f0f/skills/shopify-theme-builder/studio/server/shopify-fonts.json
- Figtree op Shopify’s font-CDN (fonts.shopifycdn.com/figtree/…):
  https://github.com/duckduckgo/tracker-radar/blob/197a396da8b8cdf2df1ded141cb58f2507e446d5/domains/US/shopifycdn.com.json

**Naamtoets en vergelijking: niet gedaan.** Ook in deze ronde (17-10-2026) weigerde de bouwomgeving elke webzoekopdracht (‘web search
budget is used up’), en outmate.nl en statafelshop.nl zijn geblokkeerd. Er is dus geen bewijs dat ‘Klapklaar’ vrij of bezet is, en
geen visuele vergelijking met het logo en de kleuren van Outmate en Statafelshop. Wat wel uit bronnen vaststaat (naam, productnamen,
claims, toon, platform) staat in brand.md §12.2. GitHub-codezoekopdrachten naar Siser EasyWeed- en Poli-Flex-kleurdata gaven geen
bruikbaar resultaat.

**Ondernemingen.** Outmate.nl: Outmate B.V., Staphorst; Statafelshop.nl noemt Deadan.com bv (bronnen in `reference/dossier.md`).

## 9. Herbouwen

```bash
cd brand/tools
python3 logo.py ..                  # alle logo-, icoon-, lock-up-, favicon- en drukbestanden + logo-meta.json
python3 -I repro.py <colorsrc> _repro.json   # Pantone C/U/TCX, RAL, Oracal, garen (bronnen in §4)
python3 tokens.py ..                # tokens.json + _contrast.json (paren, knopstanden)
python3 recognition.py              # silhouettoets: landmark, huis, schoppen, druppel (_recognition_proxy.json)
python3 make_jobs.py ..             # render-jobs.jsonl (Linnen, stockkleuren, printpaden, bus en doos)
node <kopie van renders/ met de patch en brandApps.js>/render.mjs --batch render-jobs.jsonl --samples 32
node rasterize.mjs ..               # PNG's (Playwright)
python3 handoff.py ..               # handoff/logo.liquid, logo-css.txt, favicon-head.liquid, favicon-cart.js
python3 build_md.py ..              # brand.md en technisch.md (tabellen uit tokens en metingen)
python3 build_sheet.py .. && node shot.mjs file://$PWD/../brand-sheet.html ../brand-sheet.png 1440 900 1
python3 check_svg.py ..             # viewBox, title, geen <text>, geen externe verwijzingen
python3 compare.py '#hex'           # concurrentkleur tegen het palet (brand.md §12.2)
```

**Renders opnieuw maken** (v7.1: zes van de zeven jobs dragen de zware tent): kopieer `renders/` naar een kladmap, pas de patch toe met
`git apply --exclude=renders/js/materials.js tools/renders-svgprint.patch` (die hunk, de ‘mat’-afwerking, past niet meer op de
huidige `renders/` en deze jobs gebruiken hem niet), zet `brandApps.js` in `models/` en registreer `bestelbus` en `verpakking` in
`models/index.js`. Eén job duurt met 32 samples ongeveer twee minuten.

`<colorsrc>` bevat de klonen uit §4 (aj90909/unofficial-pantone-solid-coated-2024-v5, jacobbubu/color-books, pedroduke/pantone-tcx,
ieskudero/ral-colors, office952/workos-vscode, inkstitch/inkstitch `palettes/`, ConRes/conres.io ICC-profielen). De fonts in `fonts/`
vallen onder de SIL Open Font License 1.1.

## 10. Logotest: leest de tent-A als partytent?

**Silhouettoets (gedaan, grof).** `tools/recognition.py` legt het silhouet over vier generieke pictogrammen, zelf getekend naar de
gangbare vorm: landmark (fronton, balk, vier zuilen, voet), huis (dak, muren, deur), schoppen (punt, twee ronde lobben, steel) en
druppel (punt, ronde buik), op 16, 32 en 64 px. Score = IoU van de vlakken.

| Vorm (IoU op 16 · 32 · 64 px) | landmark | huis | schoppen ♠ | druppel |
|---|---:|---:|---:|---:|
| v6 tent-A (letter) | 0,58 · 0,53 · 0,52 | 0,71 · 0,63 · 0,6 | 0,51 · 0,46 · 0,44 | 0,39 · 0,38 · 0,37 |
| v6 beeldmerk (tent + statafel) | 0,58 · 0,57 · 0,54 | 0,56 · 0,51 · 0,49 | 0,57 · 0,5 · 0,48 | 0,41 · 0,37 · 0,37 |
| v7 tent-A slank (logo.svg, twee kleuren) | 0,49 · 0,39 · 0,41 | 0,66 · 0,59 · 0,63 | 0,62 · 0,63 · 0,63 | 0,64 · 0,67 · 0,67 |
| v7.1 zware tent-A (klein, één kleur, beeldmerk, icoon) | 0,57 · 0,45 · 0,48 | 0,72 · 0,59 · 0,61 | 0,61 · 0,56 · 0,57 | 0,52 · 0,48 · 0,47 |

**Mensentest (nog te doen).**

1. **Deelnemers:** 20 mensen die het merk niet kennen, 18–70 jaar, half particulier en half zakelijk (bijvoorbeeld klanten en
   collega’s van PartyHuren). Niemand die aan het merk werkte.
2. **Beelden:** het vierkante icoon op 16 en 32 px en het woordmerk-klein op 132 px in een nagebootste mobiele header, elk in kleur
   en in één kleur (Inkt), plus vier afleiders op dezelfde maten: het landmark-, huis-, schoppen- en druppelicoon uit de
   silhouettoets. Volgorde per persoon willekeurig.
3. **Afname:** 5 seconden per beeld op een telefoon met normale helderheid, daarna het scherm uit. Vraag: ‘Wat zag je?’ (open vraag,
   niet sturen). Bij het woordmerk ook: ‘Welk woord stond er?’.
4. **Noteren:** letterlijk antwoord; codeer als tent/partytent/kraam, gebouw/bank/museum/tempel, huis/schuur, schoppen/druppel,
   iets anders, weet niet.
5. **Beslisregel:** het logo gaat op doek en bus als op 32 px ten minste 14 van de 20 mensen ‘tent’ (of partytent, kraam, circustent)
   zeggen, hooguit 3 ‘gebouw/bank/museum/tempel’ en hooguit 2 ‘schoppen/druppel’ (ook in één kleur), en op 132 px ten minste 16
   van de 20 ‘KLAPKLAAR’ lezen. Haalt 16 px het niet, dan alleen de 16-px-tekening aanpassen.
6. **Formulier:**

| Nr. | 16 px | 32 px | 132 px: wat zag je | 132 px: welk woord | Landmark-icoon | Huis-icoon |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| … | | | | | | |
| 20 | | | | | | |
