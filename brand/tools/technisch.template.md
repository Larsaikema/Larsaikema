# Klapklaar · technische bijlage

Versie 5 · 17 oktober 2026 · bij [`brand.md`](brand.md)

Deze bijlage is voor ontwerpers, drukkers en de theme-bouwer. Hier staan de constructie en metingen van het logo, alle bestanden,
de minimummaten per productiemethode, de kleurreferenties per materiaal, de renders, de overdracht aan de Shopify-theme, de
wijzigingen sinds v4, de bronnen en hoe je alles opnieuw bouwt. Regels en uitleg staan in brand.md; waarden staan in `tokens.json`.

## 1. Logo-constructie

`tools/kk.py` construeert elke vorm uit lijnen en kubische Bézier-curves (geen fontcontouren). `tools/build.py` schrijft de
SVG’s en `tools/measure.py` meet wat doek en druk ermee doen. Eenheden: x-hoogte 500.

| Maat | Waarde | Waarvoor |
|---|---:|---|
| x-hoogte | 500 | |
| stokhoogte k, l | 712 | bovenrand luifelband = stokhoogte |
| onderstok p | −165 | plat (v4: −196 met een schuine snede) |
| STOK | 130 | letterstokken, luifelband |
| DUN | 65 | tentpoten, dakrand, opening tussen dak en band |
| dakhelling | 24° (koorde) | ook de snede van k, l en de armen van k en r |
| doorhang van het dak | controlepunten 0,10 × halve breedte onder de koorde | max. doorhang ≈ 0,075 × halve breedte |
| doorhang op het pixelraster | favicon 16 px: 3 px hoog dak | optische correctie, geen nieuwe hoek |

**Lijndiktes** (eenheden, loodrecht op de lijn):

{{STROKES}}

**Spatiëring.** Tracy-methode: rechte zijkant {{TRACY_N}}, ronde zijkant 0,45 daarvan, de open kant van de k 0. Dat geeft recht–recht
88, rond–recht 64 en k–l 44. De tentpoten staan **verder** van de letters dan de letters van elkaar: 1,30 × de recht–recht-afstand
aan een rechte zijkant en 1,15 × aan de ronde kant van de a. logo.svg: l–poot {{LEG_OUT}}, poot–a {{LEG_IN}}, a–poot {{LEG_IN2}},
poot–r {{LEG_OUT}}. logo-klein (+36 letterruimte): {{KLEIN_LEGS}}.

**Kortste afstand tussen losse vormen** in logo.svg (exact, tussen de contouren):

{{GAPS}}

**Groeperen de poten met de letters?** Kleinste afstand poot–letter gedeeld door de recht–recht-letterafstand van dezelfde versie.
Onder 1 vallen de poten in één kleur en bij kleine maten of onscherpte samen met de letters (‘klIaaIr’).

| Versie | Kleinste poot–letter | Recht–recht letters | Verhouding |
|---|---:|---:|---:|
| v4 logo.svg | {{V4_LEG}} | 88 | {{V4_RATIO}} |
| v5 logo.svg | {{V5_LEG}} | 88 | {{V5_RATIO}} |
| v5 logo-klein | {{V5K_LEG}} | 124 | {{V5K_RATIO}} |

**Stof- en druktest.** `measure.py` rastert het logo op 2 eenheden per pixel en doet twee morfologische tests. *Openen* met een schijf
vindt lijnen die smaller zijn dan de schijf en punten scherper dan ~50°. *Sluiten* vindt kieren die smaller zijn dan de schijf en
inkepingen scherper dan ~40°.

{{RCHECK}}

Hoeken (rechte randen): kleinste buitenhoek {{MIN_TIP}}° (de teen van de k), kleinste inkeping {{MIN_NOTCH}}° (het kruis van de k).

**Bounding box.** Zonder paal en vlag en met de kortere p is het logo breder ten opzichte van zijn hoogte: {{ASPECT_V4}} (v4) → {{ASPECT_V5}}
(v5). In een header met een vaste logohoogte van 48 px is de x-hoogte nu {{XH48_V5}} px (v4: {{XH48_V4}} px).

## 2. Bestanden

| Bestand | Inhoud | Gebruik |
|---|---|---|
| `logo.svg` | Inkt-letters, Klaproos-tent | standaard, op licht |
| `logo-inverse.svg` | Zand-letters, Zon-tent | op Polder en Inkt |
| `mark.svg` | de k onder de tent, Zand op een Klaproos-vlak (512) | avatar, app-icoon |
| `favicon.svg` | 32-pixeltekening | bron van `favicon-32.png` |
| `favicon-32.png`, `favicon-192.png` | favicon 32 px; beeldmerk 192 px (PWA, Android) | theme-assets |
| `svg/logo-inline.svg`, `svg/logo-klein-inline.svg` | letters `currentColor`, tent `class="kk-tent"` | bron van `handoff/logo.liquid` |
| `svg/logo-on-klaproos.svg` | één kleur Zand | op Klaproos |
| `svg/logo-mono.svg`, `svg/logo-klein-mono.svg` | één pad, `currentColor` | eenkleurig |
| `svg/logo-klein.svg`, `svg/logo-klein-inverse.svg` | klein werk | {{MIN_KLEIN_PX}}–{{MIN_LOGO_PX_1}} px, klein borduurwerk |
| `svg/logo-luifel.svg`, `svg/logo-luifel-inverse.svg` | woordmerk met de balk ‘PARTYTENTEN · STATAFELS’ | luifel, bus, marktplaatstegel |
| `svg/logo-zakelijk.svg` | Inkt-letters, Polder-tent, Polder-label ‘ZAKELIJK’ | offertes, facturen, B2B |
| `svg/mark-polder.svg`, `svg/mark-zand.svg`, `svg/mark-mono.svg`, `svg/mark-klein.svg`, `svg/mark-klein-mono.svg` | varianten van het beeldmerk | |
| `svg/print-wordmark.svg`, `svg/print-wordmark-klein.svg`, `svg/print-mark.svg`, `svg/print-mark-klein.svg` | drukbestanden: één kleur (zwart = drukkleur), één pad | drukker, borduurder, belettering |
| `svg/favicon-16.svg`, `svg/favicon-cart.svg`, `svg/favicon-cart-16.svg`, `svg/apple-touch-icon.svg` | bronnen van de PNG’s | |
| `img/favicon-16.png`, `img/favicon-cart-16.png`, `img/favicon-cart-32.png`, `img/apple-touch-icon-180.png`, `img/mark-512.png` | PNG’s | theme-assets, social |
| `svg/vlaggenlijn.svg`, `svg/vlaggenlijn-inkt.svg` | vlaggenlijn voor licht (Klaproos) en voor Inkt (Klaproos, Zon, Zand) | sectiescheiding |
| `img/*.webp` | productrenders en opstellingen | brand sheet, catalogus, feed |
| `handoff/logo.liquid`, `handoff/favicon-head.liquid`, `handoff/favicon-cart.js` | kant-en-klaar voor de theme (§6) | |
| `fonts/Figtree-VF.ttf`, `fonts/OFL-Figtree.txt` | Figtree (SIL OFL 1.1) | alleen als de Shopify-handle ontbreekt |

Alle SVG’s hebben een `viewBox` en een `<title>`, en geen `<text>`, `<image>`, `<use>`, `<style>` of externe verwijzingen
(gecontroleerd met lxml: `tools/check_svg.py`, uitvoer `tools/_svg_check.json`). De paden zijn per constructie niet-overlappende
contouren (buitenkant met de klok mee, binnenvormen ertegenin), dus geschikt voor plotter en snijfolie.

## 3. Minimummaten per methode

Breedte van het hele logo of symbool. Minimale breedte = de vereiste lijn (of opening) gedeeld door het aandeel van de kleinste
lijn (of opening) in de breedte; de grootste van de twee telt. {{FEATURES}}

| Methode | Kleinste lijn / opening (aanname) | logo.svg | logo-klein | mark | mark-klein |
|---|---|---:|---:|---:|---:|
{{MINSIZES}}

**De mm-waarden per methode zijn werkaannames** (gangbare vuistregels voor satijnsteek, flock, flex, snijfolie, zeefdruk, DTF,
sublimatie en offset), niet gecontroleerd met een leverancier. Leg deze tabel voor aan je borduurder, drukker en belettering, zet
hun echte minimum in `tools/build.py` → `METHODS` en bouw opnieuw. De luifel-lock-up pas vanaf 160 mm breed.

## 4. Kleurreproductie

Per kleur de dichtstbijzijnde stockkleur in elk systeem, met CIEDE2000 tegen de merkkleur. **Dit zijn digitale benaderingen uit open
datasets, niet fysiek afgetekend.**

| Kleur | sRGB | CIELAB D50 | CMYK gestreken (FOGRA39) | CMYK ongestreken (FOGRA29) | Pantone C | Pantone TCX (textiel) | RAL Classic (bron B / bron A) | Oracal 651 |
|---|---|---|---|---|---|---|---|---|
{{REPRO}}

- **Pantone U** (ongestreken papier): hetzelfde nummer met U, maar de U-staal oogt doffer en lichter. Kies op de Formula Guide
  Uncoated naast de afgetekende C-staal.
- **Ongestreken papier:** Klaproos verschuift in proces-CMYK zichtbaar (proef-ΔE<sub>00</sub> {{UNC_DE}} tegen het scherm). Druk
  visitekaartjes en briefpapier op ongestreken papier als Pantone-steunkleur, of teken een drukproef af.
- **RAL:** de twee bronnen verschillen per kleur. Vergelijk fysiek op de RAL K7-waaier voordat je frames, borden of een bus laat
  lakken.
- **Inkt in folie:** de dichtstbijzijnde Oracal-kleur is gewoon zwart, en voor belettering is dat de bedoeling (Oracal 070).
- **Zand als drukkleur:** op doek als steunkleur (TCX-referentie). Op papier niet bedrukken, maar crème of naturel papier kiezen.
- **Polder donker** (#0E3A2D) en **Klaproos donker** (#982A0E) zijn alleen knopstanden op schermen en worden nooit gedrukt.

**Toleranties (voorstel):** drukwerk op gestreken papier ΔE<sub>00</sub> ≤ 2 tegen de afgetekende Pantone C; textiel en folie
ΔE<sub>00</sub> ≤ 3 tegen de afgetekende TCX-staal of folie.

**Aftekenen vóór de eerste productie**

1. Bestel de waaiers: Pantone Formula Guide C + U, Pantone FHI Cotton TCX (of het staalboek van de doekleverancier), RAL K7 en de
   Oracal 651/751-kleurkaart.
2. Gebruik geen scherm en geen afdruk van dit document of van de brand sheet als kleurreferentie.
3. Leg per kleur de drie dichtstbijzijnde stalen uit de tabel naast elkaar, in D50-licht (lichtbak) en in daglicht. Kies er één op
   het oog, zonder scherm erbij.
4. Vraag de doekleverancier om een lab-dip of stofstaal van Klaproos (doel: de gekozen TCX, ΔE<sub>00</sub> ≤ 3) en van de
   opdrukkleur Zand op Klaproos en op Inkt.
5. Noteer per kleur in de tabel hieronder en in `tokens.json` → `print.colors` wat gekozen is, door wie en wanneer. Bestel pas
   daarna stockkleuren, doek en busbelettering.

| Kleur | Papier (Pantone C) | Textiel (TCX / lab-dip) | Lak (RAL) | Folie (Oracal) | Afgetekend door | Datum |
|---|---|---|---|---|---|---|
| Klaproos | | | | | | |
| Zon | | | | | | |
| Polder | | | | | | |
| Inkt | | | | | | |
| Zand | | | | | | |

**Methode.** sRGB → CIELAB met de standaardformules (D65, Bradford naar D50); ΔE = CIEDE2000; code in `tools/color3.py`, uitvoer
in `tools/_repro.json`. CMYK met Pillow/LittleCMS, relatief colorimetrisch met zwartpuntcompensatie, profielen Adobe ‘Coated
FOGRA39 (ISO 12647-2:2004)’ en ‘Uncoated FOGRA29 (ISO 12647-2:2004)’. {{SOURCES}}

## 5. Productrenders

- **Renderer:** `renders/` (three.js, headless Chromium). Opdruk vanaf een SVG-pad en de doekafwerking `mat` zitten in de patch
  `tools/renders-svgprint.patch`, gemaakt tegen de werkkopie van `renders/` van 17-10-2026.
- **Opdrachten:** `tools/make_jobs.py` schrijft `tools/render-jobs.jsonl` met de printpaden uit `tools/print-*.json` (gemaakt door
  build.py). De v5-renders gebruiken het nieuwe woordmerk op de luifel en het nieuwe beeldmerk op de rok.
- **Klaproos in de render:** ingangskleur {{K_ALBEDO}}, afwerking `mat`. Gemeten met `tools/measure_render.py`: de verzadigde
  dakpixels, verdeeld in lichtheidsbanden en gemiddeld in lineair licht. Eis: het belichte vlak ligt binnen ΔE<sub>00</sub> 3 van de
  staal.

| Beeld | Belicht vlak | Middentoon | Schaduwvlak | Staal |
|---|---|---|---|---|
{{RENDERCHECK}}

De schaduwzijde is bewust donkerder: dat komt door het licht en is geen kleurfout.

## 6. Overdracht aan de theme

De theme (`theme/`) gebruikt nog brand v3 en v4. Dit verandert er; de bestanden in `handoff/` zijn klaar om over te nemen.

### 6.1 Assets kopiëren (bron → `theme/assets/`)

| Bron in `brand/` | Naam in `theme/assets/` |
|---|---|
| `img/favicon-16.png` | `favicon-16.png` |
| `favicon-32.png` | `favicon-32.png` |
| `favicon-192.png` | `favicon-192.png` |
| `img/apple-touch-icon-180.png` | `apple-touch-icon-180.png` |
| `img/favicon-cart-16.png` | `favicon-cart-16.png` |
| `img/favicon-cart-32.png` | `favicon-cart-32.png` |
| `svg/logo-zakelijk.svg` | `logo-zakelijk.svg` (nieuwe viewBox: {{ZAK_VB}}) |
| `svg/vlaggenlijn.svg` | `vlaggenlijn.svg` (nieuwe viewBox: 0 0 240 44) |
| `svg/vlaggenlijn-inkt.svg` | `vlaggenlijn-inkt.svg` |

**Verwijderen** uit `theme/assets/`: `favicon.svg`, `favicon-cart.svg` en `apple-touch-icon.png` (vervangen door
`apple-touch-icon-180.png`).

### 6.2 Wat er in de theme moet veranderen

| Bestand in `theme/` | Nu | Wordt |
|---|---|---|
| `layout/theme.liquid` r. 25–27 (de `else`-tak) | `favicon-32.png` + `<link type="image/svg+xml" href="favicon.svg" data-favicon>` + `apple-touch-icon.png` | inhoud van `handoff/favicon-head.liquid` |
| `layout/theme.liquid` r. 72 | `faviconCart: {{ 'favicon-cart.svg' \| asset_url \| json }}` | weg; de favicons staan in `KK.favicons` (zie `handoff/favicon-head.liquid`) |
| `layout/password.liquid` r. 8 | SVG-favicon | dezelfde vier `<link>`-regels als in theme.liquid |
| `assets/global.js` r. 86–90 | wisselt één SVG-link | het blok uit `handoff/favicon-cart.js` |
| `snippets/logo.liquid` | v3-paden (met vlag) | `handoff/logo.liquid` (zelfde parameters en klassen, v5-paden) |
| `sections/page-zakelijk.liquid` r. 13 | `width="584" height="129"` | {{ZAK_WH}} |
| `assets/base.css` r. 92 | `background:url("vlaggenlijn.svg") repeat-x center/160px 44px` | `…/240px 44px`; op Inkt `vlaggenlijn-inkt.svg`; nooit op Polder |
| knopstijlen (`assets/base.css`) | hover per schema | `color_schemes` in `tokens.json`: primaire hover = Klaproos donker (Polder donker op Zakelijk), omlijnde hover = tint, ingedrukt = inzet-schaduw (§6.4) |
| productkaart | — | `border.card` (1 px Lijn) om de kaart; het Steen-beeldvlak staat erin |

### 6.3 Header-logo

Neem `handoff/logo.liquid` over als `snippets/logo.liquid`. De letters zijn `fill="currentColor"` en de tent heeft
`class="logo-svg__roof"` met `fill: var(--logo-roof, var(--c-klaproos))`, zoals nu. Zet `--logo-roof` op `var(--c-polder)` voor
Zakelijk-pagina’s en op `var(--c-zon)` in schema 5 en 6 (de footer doet dat al). Breedte: desktop {{HEADER_DESK}}, mobiel
{{HEADER_MOB}} (`settings.logo_width` en `logo_width_mobile`).

### 6.4 Knoppen per kleurschema (CSS)

Shopify-kleurschema’s hebben geen velden voor hover. Leg de waarden uit `tokens.json` → `shopify_color_schemes` vast als CSS-variabelen
per schema:

```css
.color-scheme-1, .color-scheme-2, .color-scheme-3 { --btn-bg:#C83812; --btn-fg:#FFFFFF; --btn-bg-hover:#982A0E; --btn-border-hover:#982A0E; --btn-bg-active:#982A0E; --btn2-fg:#1D2420; }
.color-scheme-1 { --btn2-bg-hover:{{TINT_ZAND}}; }  .color-scheme-2 { --btn2-bg-hover:{{TINT_WIT}}; }  .color-scheme-3 { --btn2-bg-hover:{{TINT_DUIN}}; }
.color-scheme-4 { --btn-bg:#154F3E; --btn-fg:#FBF6EC; --btn-bg-hover:#0E3A2D; --btn-border-hover:#0E3A2D; --btn-bg-active:#0E3A2D; --btn2-fg:#1D2420; --btn2-bg-hover:{{TINT_STEEN}}; }
.color-scheme-5 { --btn-bg:#FBF6EC; --btn-fg:#1D2420; --btn-bg-hover:#FFC23A; --btn-border-hover:#FFC23A; --btn-bg-active:#FFC23A; --btn2-fg:#FBF6EC; --btn2-bg-hover:{{TINTD_POLDER}}; }
.color-scheme-6 { --btn-bg:#C83812; --btn-fg:#FFFFFF; --btn-bg-hover:#C83812; --btn-border-hover:#FBF6EC; --btn-bg-active:#982A0E; --btn2-fg:#FBF6EC; --btn2-bg-hover:{{TINTD_INKT}}; }

.button { background:var(--btn-bg); color:var(--btn-fg); border:2px solid var(--btn-bg);
          transition:background-color .14s cubic-bezier(.2,0,0,1), border-color .14s cubic-bezier(.2,0,0,1); }
.button:hover { background:var(--btn-bg-hover); border-color:var(--btn-border-hover); }
.button:active { background:var(--btn-bg-active); border-color:var(--btn-border-hover); box-shadow:inset 0 2px 0 rgba(0,0,0,.28); transform:translateY(1px); }

/* omlijnde knop: twee klassen, zodat de regels hierboven hem nooit rood of donker maken */
.button.button--secondary { background:transparent; color:var(--btn2-fg); border-color:var(--btn2-fg); }
.button.button--secondary:hover { background:var(--btn2-bg-hover); border-color:var(--btn2-fg); }
.button.button--secondary:active { background:var(--btn2-bg-hover); border-color:var(--btn2-fg); box-shadow:inset 0 2px 0 rgba(0,0,0,.14); }

.button:focus-visible { outline:3px solid var(--focus); outline-offset:2px; }
@media (prefers-reduced-motion: reduce) { .button { transition:none; } .button:active { transform:none; } }
```

### 6.5 Favicon

`handoff/favicon-head.liquid` zet de beginstand met `cart.item_count` en geeft de vier PNG-paden aan `KK.favicons`.
`handoff/favicon-cart.js` vervangt het favicon-blok in `KK.updateCartCount(count)`. Geen `type="image/svg+xml"`-link: met een
SVG-favicon kiest de browser die ene tekening voor elke maat, en dan wordt de 16-px-tekening nooit gebruikt.

### 6.6 Fonts en tokens

- `config/settings_schema.json`: `type_header_font` standaard `figtree_n8`, `type_body_font` `figtree_n4`; 700 en 600 via
  `font_modify`.
- `tokens.json` → CSS custom properties: kleuren, `border.card`, `border.media`, radii, spacing, schaduwen (ook `button-pressed`) en
  motion.
- Iconen: neem de `<symbol>`’s uit `brand-sheet.html` over als snippet `icon-sprite.liquid`.
- Actieprijs: Zon-label met `clip-path: polygon(0 0,100% 0,calc(100% - 9px) 50%,100% 100%,0 100%)`, Inkt-tekst, tabelcijfers.

## 7. Wat er in v5 veranderd is

| Kritiek op v4 | Wat v5 doet |
|---|---|
| Hover van de koopknop werd Inkt met Wit, de omlijnde knop werd bij hover Inkt met Zand: twee gelijke zwarte knoppen | Primaire hover = Klaproos donker #982A0E (Wit 7,86:1), ingedrukt = inzet-schaduw. Omlijnde hover = lichte tint (8% Inkt). Zakelijk: Polder donker. Per schema zijn rust en hover van beide knoppen alle vier verschillend (gecontroleerd in tokens.py) |
| De vlaggenlijn Klaproos-Zon-Polder-Zon leest als een Pan-Afrikaanse of Rasta-vlag | Polder is eruit. Op licht één kleur Klaproos in twee lengtes (de vorm varieert, niet de kleur), op Inkt Klaproos, Zon en Zand. Nooit op Polder |
| In één kleur groepeerden de poten met de letters (‘klIaaIr’) | Poot–letter is nu minstens 1,15 × de recht–recht-letterafstand in elke versie (v4: 0,64 ×). Zie §1 |
| De brand book las als een technisch logboek | Gesplitst: brand.md (regels, voor iedereen) en technisch.md (deze bijlage). Geen omgevingsmeldingen in brand.md |
| ‘Klaar! Hij staat erin.’ en ‘Mail me als hij terug is’ kloppen niet bij het-woorden | Regel 7 in brand.md §7: geen ‘hij/het’ in sjablonen. Nieuwe teksten ‘Staat in je winkelwagen.’ en ‘Mail me als dit weer op voorraad is’ |
| Dak met paal en vlag leek een circustent of kermiskraam; de stompe vlag leek een bijl | Paal en vlag zijn weg. Zonder vlag las het rechte dak als een garage, dus het dak is nu van doek: de hellingen hangen door (koorde 24°). De klein-versie houdt de opening tussen dak en band (dicht las als een schuur) |
| Diagonaal silhouet (hoge tent rechtsboven, lange p met schuine snede linksonder) | De vlag is weg, de p is korter (−165) en plat. Verhouding van de bounding box {{ASPECT_V4}} → {{ASPECT_V5}} |
| Figtree is een veelgebruikte letter | Als bewuste keuze vastgelegd in brand.md §5 |
| Zand en Steen liggen te dicht bij elkaar (ΔE 3,0) | `border.card` en `border.media` zijn token-default: Steen staat altijd in een Wit kaart met 1 px Lijn-rand |
| Bestandsnamen in de overdracht klopten niet; de theme liet nog een SVG-favicon zien | §6: exacte bron- en assetnamen, wat er per regel in de theme verandert, en kant-en-klare bestanden in `handoff/` |
| Naam niet getoetst, niet naast Outmate en Statafelshop gelegd | Nog steeds niet mogelijk vanuit de bouwomgeving (§8). In brand.md §11 staan nu een checklist en een vergelijkingsblad met beslisregel. De status blijft ‘goedgekeurd onder voorbehoud’ |

## 8. Bronnen en logboek

**Fonthandles.** shopify.dev is vanuit de bouwomgeving geblokkeerd. Shopify maakt `/cdn/fonts/<familie>/<handle>`-paden alleen voor
fonts uit zijn eigen bibliotheek. Gevonden in de uitvoer van echte winkels (betrouwbaarheid: waarschijnlijk):

- `figtree_n4` en `figtree_n7`: https://github.com/mrshahbazdev/shopify-section-factory-clone/blob/f2b6217daa4961e435b959c3d5ec3bc5935c4982/app/sections/featured-collection-9.liquid
- `figtree_n5` en `figtree_n6` op fonts.shopifycdn.com: https://github.com/duckduckgo/tracker-radar/blob/197a396da8b8cdf2df1ded141cb58f2507e446d5/domains/US/shopifycdn.com.json
- `figtree_n8`: https://github.com/LM-3434/aquacorail.ca/blob/a84889e15bf7c7c81207cca64c4d681e144bc95c/assets/screen-settings.css

**OpenType.** `Figtree[wght].ttf` heeft `tnum`, `pnum`, `case` en `frac`. Of de woff2-bestanden van Shopify die features houden, is
niet getest. Zet `font-variant-numeric: tabular-nums` en controleer een staffeltabel in de theme-preview.

**Naamtoets en vergelijking: wat geprobeerd is.** In v4 en opnieuw in v5 (17-10-2026) weigerde de bouwomgeving de zoekopdracht
(het zoekbudget voor deze sessie was op), en de registers (rdap.sidn.nl, rdap.dns.be) en DNS waren niet bereikbaar. outmate.nl en
statafelshop.nl zijn vanuit de omgeving geblokkeerd, en hun logo’s en huisstijlkleuren staan niet in `reference/dossier.md`. Er is dus
geen bewijs dat ‘Klapklaar’ vrij of bezet is, en geen visuele vergelijking. Dat gebeurt in brand.md §11.

**Ondernemingen.** Outmate.nl: Outmate B.V., Staphorst (https://www.outmate.nl/contact/). Statafelshop.nl noemt Deadan.com bv als
bedrijf (https://statafelshop.nl/bedrijfsgegevens). Beide via `reference/dossier.md`.

## 9. Herbouwen

```bash
cd brand/tools
export VENDOR=<map met gfonts/ofl/figtree/Figtree[wght].ttf>
python3 build.py ..                 # logo-, merk- en favicon-SVG's, metingen (logo-meta.json), printpaden
python3 -I color3.py <colorsrc> ../tools/_repro.json '{"klaproos":"#C83812","zon":"#FFC23A","polder":"#154F3E","inkt":"#1D2420","zand":"#FBF6EC"}'
python3 tokens.py ..                # tokens.json + _contrast.json (paren, knopstanden)
python3 make_jobs.py ..             # render-jobs.jsonl met de printpaden van build.py
# productbeelden: kopie van renders/ + patch (cd <kopie> && patch -p1 < brand/tools/renders-svgprint.patch)
node <kopie>/render.mjs --batch render-jobs.jsonl --samples 32
python3 finish_imgs.py ../img ..    # uitsnede + kleurmeting (_render_check.json)
node rasterize.mjs ..               # favicon- en icoon-PNG's (Playwright)
python3 handoff.py ..               # handoff/logo.liquid, favicon-head.liquid, favicon-cart.js
python3 build_md.py ..              # brand.md en technisch.md (tabellen uit tokens en metingen)
python3 build_sheet.py .. && node shot.mjs file://$PWD/../brand-sheet.html ../brand-sheet.png 1440 900 1
python3 check_svg.py ..             # viewBox, geen <text>, geen externe verwijzingen
```

`<colorsrc>` bevat de klonen van de bronnen in §4 (commits vermeld) en de twee ICC-profielen. Het font in `fonts/` (Figtree) valt
onder de SIL Open Font License 1.1 (`fonts/OFL-Figtree.txt`). `tools/kk_v4.py` is alleen het archief van de v4-geometrie voor de
vergelijking in §1.
