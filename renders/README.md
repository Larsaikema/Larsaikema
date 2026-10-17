# renders/ — productfoto's als 3D-packshots

Geen enkele productfoto is in deze omgeving beschikbaar, dus **elke productafbeelding van de shop
komt uit deze pipeline**: parametrische three.js-modellen, gerenderd in headless Chromium
(SwiftShader WebGL2, puur CPU) met een studio-opstelling die op een catalogusfoto lijkt.

```
renders/
  render.mjs          CLI: spec(s) -> .webp / .jpg / .png
  encode.py           Pillow-encoder (WebP q88 method 6, JPEG progressive, PNG optimised)
  scene.html          pagina die de CLI aanstuurt (ook handmatig te openen, zie onderaan)
  js/engine.js        studio: lichtopstelling, accumulatie, vloer-schaduwvanger, tone mapping
  js/camera.js        camerapresets + automatische kadrering
  js/materials.js     PBR-materialen + kleurnamen (wit, zwart, rood, …)
  js/textures.js      procedurele textures (weefsel, tricot, geborsteld alu, berken, print)
  js/geom.js          geometrie-helpers (buizen, profielen, oppervlakken, merge)
  js/rng.js           deterministische random/Halton/R2-reeksen
  models/*.js         productbouwers (easyUpTent, statafel, statafelCover, + overige)
  vendor/three/       three.js r186 (MIT, zie vendor/three/LICENSE)
  samples/            voorbeeldrenders + samples.jsonl (de specs waarmee ze gemaakt zijn)
```

## Snel starten

```bash
# één afbeelding
node renders/render.mjs --spec '{"model":"easyUpTent","w":3,"d":3,"color":"wit"}' \
     --out catalog/images/tent-3x3-wit-hero.webp

# spec uit bestand, ander standpunt en achtergrond
node renders/render.mjs --spec specs/tent.json --out out.jpg --angle front --bg '#FFFFFF'

# batch (JSONL of JSON-array; elke regel een spec met "out", pad relatief t.o.v. het batchbestand)
node renders/render.mjs --batch renders/samples/samples.jsonl   # 2000 px, 40 samples (tent-detail: 60)
```

| optie | standaard | betekenis |
|---|---|---|
| `--spec` | — | inline JSON of pad naar JSON-bestand |
| `--out` | — | uitvoerpad; extensie bepaalt formaat (`.webp`, `.jpg`, `.png`) |
| `--batch` | — | JSONL/JSON-array met specs (+ `out`) |
| `--size` | 2000 | vierkante uitvoer in px (overschrijft spec) |
| `--angle` | hero | `hero`, `front`, `side`, `back`, `top`, `low`, `detail` |
| `--bg` | #EFEDE8 | achtergrondkleur (exact deze kleur buiten de schaduw) |
| `--samples` | 40 | aantal geaccumuleerde frames (kwaliteit ↔ tijd) |
| `--quality` | 88 / 90 | WebP- / JPEG-kwaliteit |
| `--ss` | 1 | supersampling-factor (render groter, Lanczos-verkleining); zelden nodig |
| `--concurrency` | 1 | parallelle browserpagina's (2 helpt iets op 4 cores) |
| `--verbose` / `--json` | — | paginalog / render-info (camera, timings) als JSON |

Benodigd: Node 22 met (globale) `playwright` en Chromium, `python3` met Pillow. Geen netwerk.
De CLI start zelf een statische server op een vrije poort en een headless Chromium met
`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

**Deterministisch:** alle jitter komt uit vaste Halton/R2-reeksen en geseede PRNG's; dezelfde spec
geeft dezelfde pixels. Er wordt nergens `Math.random()` gebruikt.

**Tijd (4 CPU's, SwiftShader):** 2000 px / 40 samples ≈ 1–3 min per beeld (tent met wanden het
zwaarst). Voor proefrenders: `--size 900 --samples 12` (≈ 10–20 s).

## Spec-formaat

Een spec is een JSON-object. Gereserveerde sleutels zijn render-instellingen; **alle andere sleutels
gaan als parameters naar de modelbouwer** (of zet ze expliciet onder `"params"`).

| sleutel | betekenis |
|---|---|
| `model` | naam van de bouwer (zie hieronder) |
| `params` | optioneel: modelparameters expliciet (anders: alle niet-gereserveerde sleutels) |
| `angle` | camerapreset |
| `size`, `imageWidth`, `imageHeight` | uitvoerformaat (standaard vierkant `size`) |
| `bg`, `samples` | achtergrond, aantal frames |
| `camera` | overrides op de preset, bv. `{"azimuth":50,"elevation":20,"fill":0.75}` |
| `rig` | overrides op de lichtopstelling (zie *Licht*) |
| `items` | meerdere producten in één beeld: `[{"model":…, "position":[x,y,z], "rotationY":deg, …params}]` |
| `detail` | eigen detail-close-up: `{"target":[x,y,z],"size":m,"azimuth":deg,"elevation":deg}` |
| `rotationY` | draai het hele product (graden) |
| `out` | uitvoerpad (alleen in batches) |

Let op: modelparameters mogen dus niet `size` heten; afmetingen heten `w`, `d`, `diameter`, `length` enz.

## Modellen

### `easyUpTent` — easy-up / vouwtent
`{ w, d, color, legs, walls, weights, valancePrint, wallColor, height, valanceDrop }`

- `w`, `d` (m): 3×3, 3×4.5, 3×6, 4×4, 4×6, 4×8 … De lange zijde komt automatisch naar voren (`"orient":"keep"` om dat uit te zetten).
  Zijden > 4 m krijgen een tussenpoot (3×4.5/3×6/4×6/4×8 = 6 poten) en per vak een eigen piek, maar
  het dak blijft **één doek** met een zachte, doorhangende kil boven de middenschaar.
- `legs`: `premium` (zeskant 40 → 34 mm, nylon hoekstukken, dakrand 2,10 m, schaar 50 cm diep) of
  `professional` (zeskant 50 → 44 mm, aluminium hoekstukken, zwaardere profielen, 2,14 m, schaar 56 cm).
- `color`: kleurnaam of `#hex` (dak, valance, wanden). `wallColor` voor afwijkende wanden. Wit doek wordt
  op ~80 % albedo gezet (PVC), zwart op ~6,7 % met glans, zodat beide op een lichte achtergrond tekening houden.
- `walls`: per zijde (`front`, `back`, `left`, `right`) één type, of een lijst per vak van 3/4 m
  (`"back":["window","door"]`). Alle indelingen staan gecentreerd in hun vak:

  | type | wat je ziet |
  |---|---|
  | `closed` | dichte wand |
  | `window` | één rechthoekig PVC-raam (max 1,5 m breed, 0,86–1,56 m hoog) met gestikte doekrand |
  | `windows` (`church`) | twee kerkraampjes met roede en marges van ≥ 0,5 m tot de poten |
  | `door` | deuropening van ~1 m met gestikte deurrand (4 cm band, dubbel stiksel), verticale spiraalrits in het midden (3 cm tape, glanzende spiraal, schuiver met trekker en lus), stormflap van 4,5 cm die een schaduwlijn geeft, verstevigingsdriehoek + twee oprolbanden met gesp |
  | `door-open` | deur open: opening tot 1,96 m, opgerolde deur met twee lussen erboven |
  | `panorama` | breed PVC-raam over bijna het hele vak |
  | `rolled` | hele wand opgerold onder de valance (met drie banden) |
  | `open` / `none` | geen wand op die zijde |

  Wanden hangen aan de dakrand (bovenkant achter de valance), lopen 4,5 cm boven de grond af (zichtbare
  voetplaten), hebben een gevouwen onderzoom, verstevigde zijbanden, spanningsrimpels vanuit de bovenhoeken,
  brede verticale valplooien, smalle plooien die vanaf elk klittenbandlipje bovenaan ~0,5 m naar beneden
  uitlopen, een bolling van ~1,7 cm en gevulde velcrobanden (5 cm) rond de poten. PVC-ramen: gestikte
  doekrand, ~70 % doorlaat met een lichte melkwaas, glanzend en licht golvend zodat de softbox er als
  onregelmatige streep in spiegelt.

  **Hoofdbeeld met wanden:** de hero-camera ziet twee aangrenzende zijden van buiten (34° = voor+rechts,
  −34° = voor+links, 146° = achter+rechts, −146° = achter+links). De bouwer kiest het paar met de meest
  waardevolle wanden (deur > ramen > dicht), zodat elke betaalde optie **van buiten** te zien is; bij gelijke
  stand blijft 34°. `"heroAzimuth": 34` dwingt een standpunt af. Zet ramen en deur dus op twee
  aangrenzende zijden (bv. `{"back":["window","door"],"left":"windows","right":"closed"}`); drie
  verschillende wanden op drie zijden kunnen nooit allemaal van buiten in één beeld.
  Vorm: `{"front":"door","back":"closed"}`, `["back:window", …]` of `"all"` (alles dicht).
- `weights`: aantal stapelbare voetgewichten per poot (rond, sleuf om de poot, gat voor de voetkoker,
  greepgat), liggend óp de voetplaat — `2` of `{"count":2}`.
- `valancePrint`: `"MIJN LOGO"` of `{text, color, font, weight, sides:["front","back"]}`; de print volgt
  het golvende valancedoek.
- `valanceDrop` (m): standaard 0,21 (premium) / 0,22 (professional).

Constructie (zie kop van `models/easyUpTent.js`): telescopische zeskantpoten met zichtbare stap van
buiten- naar binnenbuis, gegoten kraag, drukknop in de onderste van vier verstelgaten; hoog vast hoekstuk
dat onder de valance uitsteekt; schuif met trekpen en ring; X-schaar van platte profielen (2–4 kruisen per
zijde) met bolkopbouten en nylon knooppunten; binnendiagonalen naar centrale hub; telescopische middenpaal
en vier dakspanten per vak. Hoekstukken en schuiven zijn strak spuitgegoten (Premium: glasvezel-nylon,
satijn, kleine radius, 45°-afschuining, twee verstevigingsribben per buitenvlak, ingegoten merkplaatje
`KLAPKLAAR PREMIUM 40`) of gegoten aluminium (Professional: groter, grijs satijn met gietkorrel, zwaardere
ribben, twee zeskantbouten per vlak, `PRO 50`). Dak: piramide per vak met zachte ribben langs de spanten,
licht holle vlakken (de spanten buigen onder de doekspanning), ~5 cm doorhang tussen spant en graat,
lange zachte spanningsrimpels die vanuit de hoekzakken uitwaaieren (leesbaar op 2000 px), getapete en
dubbel gestikte graat- en middennaden, versterkingslappen op de hoeken en de top (zelfde doek, alleen
stiksels en een randje), golvende dakrand tussen de klittenbandpunten, afgeronde doekhoeken.
Doek: PVC-coating als clearcoat (wit 0,30 / zwart 0,55 sterk), vezelglans in de kleur van het doek, de
600D-weefselnormalmap voor close-ups én een tweede, procedurele macrolaag (garenstrepen in schering en
inslag, verdikkingen, lichte golving van de coating, ruwheidsvariatie) die op catalogusformaat blijft
staan. Valance: één doorlopende, genaaide rok rond een afgeronde rechthoek (hoekradius 2,6 cm bij de
dakbies tot 4,8 cm bij de zoom, zachte hoeknaad), lichte uitwaaiering, buik van ~1 cm tussen de poten die
naar de zoom toeneemt, zachte valgolven, zoom die tussen de bevestigingspunten een paar mm doorhangt, bies
op de aansluiting met het dak en een omgeslagen zoom met stiksel op 2 cm.

**Standaardbeelden per tent:** `hero` + `detail`. Het detail is een close-up van de hoek die het dichtst
bij de hero-camera staat (hoekstuk, schuif, schaar met bouten, valancezoom, doekstructuur) van net onder
dakrandhoogte, met een kleine scherptediepte zodat de achterkant van het frame wegvalt. Heeft de tent een
deur, dan is het detail de deur van buiten (rits, schuiver, stormflap, deurrand, oprolbanden), met een
strijklicht van opzij zodat het reliëf ook op zwart doek tekent.

### `statafel`
`{ diameter, height, top, frame, base, legs, folded, footAngle }`

- `diameter`: 0.6 / 0.7 / 0.8 / 0.85 (m, of in cm), `height` 1.10.
- `top`: `berken` (multiplex 18 mm, zichtbare lagen), `hdpe` / `hdpe-grijs` (45 mm blow-moulded), `wit` / `zwart` (gelamineerd).
- `frame`: `zwart`, `wit`, `antraciet`, `chroom`, `alu`.
- `base`: `klap` (inklapbaar: kolom, onderhub, 4 poten + schoren naar schuifkraag, scharnierend blad),
  `kruis` (horeca, vaste 4-stervoet), `rond` (horeca, ronde voetplaat). `legs`: 3 of 4.
- `folded: true`: blad verticaal, poten langs de kolom opgeklapt.

### `statafelCover`
`{ type, color, diameter, topcover, waistY, waistR, hemLift, sashColor, bowAngle, tableTop }`

- `type: "stretch"`: lycra die het blad omspant, taps naar een strakke taille en uitwaaiert over de 4 voeten
  (zandloper), vrije zoom die tussen de voeten omhoog boogt, fijne spanningsplooien bij de taille.
  `topcover: "wit"` (of `true`) voegt een losse topcover in een andere kleur toe.
- `type: "strik"`: los polyester, bij de taille samengebonden met een sjerp + strik (2 lussen, 2 staarten
  met zwaluwstaart), rok tot de grond met onregelmatige plooien. `sashColor` voor een contrasterende sjerp.
- `type: "kleed"`: rond tafelkleed dat over het blad tot op de grond valt, met godetplooien en lichte poel.

### Overige (eenvoudiger, al bruikbaar)
`klaptafel {length,width,height,color,frame}`, `biertafelset {length,tableWidth,frame}`,
`gewichten {count,stacks,color}`, `haringen {count,length}`, `spanbanden {color}`, `wielset`,
`draagtas {height,color,logo}`, `prikkabel {bulbs,spacing,sag,on}`, `stretchtent {w,d,color,poles,anchors}`,
`stertent {diameter,points,height,color}`, `opblaasbareTent {w,legs,height,color,canopyColor}`.

## Camera

`js/camera.js` — vaste lens (22° verticale FOV, weinig vertekening), vaste kijkrichting per preset en
automatische kadrering: de geprojecteerde omhullende van het product wordt gecentreerd en vult 80 % van
het beeld. Daardoor staan alle producten in de catalogus even groot en op dezelfde plek.

| preset | azimut | elevatie | gebruik |
|---|---|---|---|
| `hero` | 34° | 17° | hoofdbeeld: 3/4 van rechtsvoor, licht van boven |
| `front` | 0° | 6° | vooraanzicht op ooghoogte |
| `side` | 90° | 6° | zijaanzicht |
| `back` | 214° | 17° | achterkant |
| `top` | 0° | 62° | bovenaanzicht schuin |
| `low` | 28° | 3° | laag standpunt (binnenkant dak) |
| `detail` | per product | | close-up van het kenmerkende detail (tent: de hoek rechtsvoor van net onder de dakrand, met scherptediepte; statafel: bladrand; strik: de strik) |

Een bouwer kan per preset een betere kadrering voorstellen via `view: { hero: {azimuth, elevation} }`
(bv. de ingeklapte statafel). `spec.camera` gaat altijd voor.

`detail`-velden (`spec.detail` overschrijft wat de bouwer voorstelt, veld voor veld):
`{ target:[x,y,z], size, azimuth, elevation, fov?, aperture?, focus?, shift?:[sx,sy] }` —
`aperture` = lensstraal in meter (scherptediepte; 0 = alles scherp), `focus` = scherpstelafstand
(standaard: afstand tot `target`), `shift` = beeldverschuiving als fractie van het halve beeld.

Een bouwer kan ook een **lichtopstelling** voorstellen: `rig: { default: {…}, hero: {…}, detail: {…} }`
(samengevoegd in die volgorde; `spec.rig` gaat altijd voor). De tent gebruikt dat voor zijn eigen
belichting (zie hieronder).

## Licht en beeldopbouw (`js/engine.js`)

Elke afbeelding is het gemiddelde van N frames. Per frame:

- camera-jitter met een Gaussisch subpixelfilter → anti-aliasing (beter dan 2× supersampling);
- het sleutellicht (softbox links-boven, t.o.v. de camera) springt binnen een kegel → zachte, convergerende schaduwen;
- twee "koepel"-lichten met schaduw over de bovenhemel (R2-reeks, cosinusgewogen) → hemellicht en
  occlusie (binnenkant tent, onder het blad);
- vul-, strijk- en vloerkaatslicht zonder schaduw, plus een reflectie-omgeving (PMREM): standaard
  three's RoomEnvironment; met `rig.env: "studio"` een eigen donkere studio (`js/studioEnv.js`: zwarte
  vlaggen, lichte vloer met een lichtpoel vóór de set, een overhead-scrim, key-softbox, strijkstrip en
  witte reflectiekaart, alles camera-relatief). Zwart glanzend doek spiegelt dan alleen de scrim als één
  zachte glansband en zeskantbuizen krijgen afwisselend lichte en donkere facetten;
- het sleutellicht kan een **spot op echte afstand** zijn (`key.distance` of `key.distanceRel`): licht valt
  dan kwadratisch af over grote producten, zodat elk tentdakvlak een eigen waarde met een zachte gradiënt krijgt;
- PVC-ramen gebruiken gestratificeerde stochastische transparantie (per pixel een golden-ratio-reeks over de frames).

De **vloer is een schaduwvanger**. Per beeld worden eenmalig drie vloerkaarten gebakken (top-down,
in de UV-ruimte van de vloer, daarna licht vervaagd zodat dunne onderdelen geen strepen geven):

1. **hemel-occlusie / AO** — 64 cosinusgewogen richtingen over de halve bol;
2. **softbox-schaduw van het sleutellicht** — 64 richtingen binnen de kegel van de softbox;
3. **contactschaduw** — de laagste hoogte van het product boven elk vloerpunt (van onderaf gerenderd),
   omgezet naar `exp(-h / 3 cm)` en vervaagd: donkere, zachte randjes waar voeten en zomen de vloer raken.

De vloer krijgt de fractie licht die hij ontvangt; de compositie zet de achtergrondkleur × die fractie
neer en tone-mapt alleen het product (Khronos PBR Neutral: kleuren blijven productecht). Buiten de
schaduw is de achtergrond daardoor **exact** `--bg` (geen dither), zodat beelden naadloos op een
gelijkgekleurde productkaart staan.

`rig`-overrides (alle velden optioneel):

```json
{ "exposure": "auto", "exposureAuto": { "ref": 0.2, "base": 0.86, "power": 0.22, "min": 0.6, "max": 1.25 },
  "toneMapping": "neutral|agx|aces|linear", "envIntensity": 0.9,
  "key":   { "azimuth": -48, "elevation": 56, "intensity": 3.0, "cone": 10, "mapSize": 2048 },
  "dome":  { "count": 2, "intensity": 1.6, "maxZenith": 62 },
  "fill":  { "azimuth": 72, "elevation": 18, "intensity": 0.35 },
  "rim":   { "azimuth": 160, "elevation": 38, "intensity": 0.6 },
  "bounce":{ "intensity": 0.5 },
  "groundAmbient": 0.25, "shadowStrength": 0.92, "keyShadow": 0.4,
  "groundAO": { "strength": 0.8, "samples": 64, "keySamples": 64, "res": 1024, "blur": 2.2 },
  "contact":  { "strength": 0.62, "h0": 0.03, "res": 512, "blur": 1.6 },
  "floorKey": { "azimuth": -15, "elevation": 80, "cone": 16 },
  "shadowFloor": 0.7, "edgeFade": 0.07, "envRotation": null, "groundSplit": false,
  "dome":  { "tilt": 30, "tiltAzimuth": -62 },
  "env": "room|studio", "envStudio": { "surround": 0.03, "floor": { "front": 0.55 }, "boxes": [ … ] },
  "key":   { "distanceRel": 1.78, "aimRel": [0.04, 0.36, 0.69], "angle": 46, "penumbra": 0.4 } }
```

- `key.distance` (m) / `key.distanceRel` (× halve diagonaal van het product) — maakt van de key een
  spotlicht op die afstand (intensiteit = verlichtingssterkte op het richtpunt). `key.aim` (wereld) of
  `key.aimRel` (`[rechts, omhoog, naar de camera]` × halve diagonaal, in het camerakader) bepaalt het
  richtpunt; `angle`/`penumbra` de bundel. Zonder afstand blijft de key een richtingslicht.
- `groundSplit` — de zachte knik van `shadowFloor` geldt alleen voor de key-schaduw; hemelocclusie
  (`groundAO.strength`) vermenigvuldigt daarna, zodat de vloer binnen dichte wanden duidelijk donkerder
  wordt dan onder een open tent.

- `floorKey` — richting van de **vloerschaduw** van het sleutellicht, los van het modellicht (klassieke
  packshot-aanpak): het product krijgt vorm van links-voor, de schaduw valt bijna recht naar beneden en blijft
  binnen de voetafdruk.
- `shadowFloor` — de open-vloerschaduw wordt nooit donkerder dan deze fractie van de achtergrond (zachte knik;
  0,7 ≈ sRGB 200 op #EFEDE8). De contactschaduw onder voeten valt hier bewust buiten.
- `edgeFade` (standaard 0,07) — vloerschaduw loopt binnen 7 % van de beeldrand uit naar exact `--bg`,
  zodat tegels naadloos in een productraster op een #EFEDE8-pagina staan (0 = uit; de tent zet dit uit
  voor `detail`).
- `dome.tilt` — kantelt de hemelkap naar de kant van het sleutellicht (negatieve vulling aan de andere
  kant): de afgewende dakvlakken van een wit doek blijven duidelijk donkerder dan het belichte vlak.
- `envRotation` — draait de reflectie-omgeving (graden, t.o.v. de camera); voor donker doek zo gekozen dat
  het belichte dakvlak de lichte kant van de ruimte spiegelt.

**Tentbelichting** (voorgesteld door `easyUpTent`, `tentRig()` in het model): studio-omgeving (`env:
"studio"`), sleutel als softbox-spot op 1,78× de halve productdiagonaal van links-voor (−33°, 30°), gericht
op de voorste dakrand, zodat het naar de camera gekeerde dakvlak laag op het vlak het helderst is en naar
de top en de verre graat afloopt; grote lage vulling van rechts (76°, 8°) voor het afgewende vlak; hemelkap
30° gekanteld; vloerschaduw van bijna recht boven; `groundSplit` met `shadowFloor` 0,6 en een contactschaduw
van ~3 cm rond voetplaten, gewichten en wandzomen. De lichtverhoudingen zijn niet op gevoel gekozen maar
opgelost uit per-licht-renders (lineair teruggerekend en gemengd op doelwaarden per vlak). Per kleur:
wit belichting 0,67; zwart een sterkere key/vulling met maar 0,13 reflectie (zwart blijft zwart en spiegelt
alleen de scrim als glansband); overige kleuren `auto`. `front` krijgt een eigen, gevederde key van net
links van de lens (vlak licht in het midden, aflopend naar beide graten) en `detail` een richtingslicht —
bij een deur scherend van opzij.

Gemeten (sRGB-luminantie, achtergrond #EFEDE8 = 237): `tent-3x3-wit-hero` belicht dakvlak 225–232 met
gradiënt naar de top, afgewend vlak 211–216, valance 229 / 196, silhouet overal ≥ 11 niveaus van de
achtergrond, vloer onder het dak ≈ 190, open vloer ≈ 233. `tent-3x6-zwart-zijwanden-hero`: dak 59–66
(belicht) / 48 (afgewend), valance 41–49, wanden 32–39, vloer langs de wand ≈ 216.

`keyShadow` (aandeel van de softbox in het vloerlicht) wordt standaard uit de lichtsterktes berekend.
**Belichting `auto`:** zoals een fotograaf per product belicht, wordt de belichting afgeleid uit de
oppervlak-gewogen albedo van het product (wit doek ≈ 0,65, rood ≈ 0,87, zwart ≈ 1,1). Witte producten
houden zo tekening in de hoge lichten; de achtergrond blijft exact `--bg`. Een vast getal schakelt dit uit.
Lichtrichtingen zijn relatief t.o.v. de camera (draaischijf-principe): elk standpunt krijgt dezelfde
lichtopbouw.

## Een product toevoegen

1. Maak `models/mijnProduct.js` met `export function mijnProduct(params) { … return { object, detail, meta, view }; }`
   - eenheden in meters, Y omhoog, product staat op y = 0, voorkant richting +Z;
   - verzamel onderdelen per materiaal in een `G.PartBin()` en roep `bins.build(group)` aan
     (één mesh per materiaal = snel);
   - gebruik de helpers in `js/geom.js`: `tube`, `hexTube`, `flatBar`, `prism(profiel, a, b)`,
     `roundedBox`, `surface(fn(u,v,out), nu, nv)` voor doek, `lathe(punten)`;
   - gebruik materialen uit `js/materials.js` (`tentFabric`, `lycra`, `polyCloth`, `aluminium`,
     `steelPowder`, `chrome`, `galvanised`, `nylon`, `rubber`, `hdpe`, `birchFace`, `laminate`,
     `pvcWindow`, `castIron`…). Kleuren via `M.resolveColor('rood')` of `#hex`;
   - geef stof-uv's in meters (weefselschaal klopt dan vanzelf);
   - `detail` = het onderdeel waaraan een koper de kwaliteit afleest.
2. Registreer de bouwer in `models/index.js`.
3. Proefrender: `node renders/render.mjs --spec '{"model":"mijnProduct"}' --out /tmp/x.png --size 900 --samples 12`
   en bekijk hero, front en detail. Daarna 2000 px / 40 samples voor de catalogus.

Interactief bekijken (handig bij modelleren): serveer `renders/` en open
`scene.html?spec={"model":"statafel"}&samples=8&size=1000`.

## Bekende beperkingen

- **Doek is procedureel, geen doeksimulatie.** Plooien, doorhang en spanningsrimpels zijn wiskundig
  opgebouwd (geloofwaardig op hero-formaat; in close-ups zichtbaar gestileerd, vooral de strik).
- **Geen echt lichttransport door doek of tussen oppervlakken.** Doorschijnendheid van een wit dak is
  benaderd; kleurbloeding (rode hoes kleurt de vloer) en inter-reflecties ontbreken. Vul-, strijk- en
  omgevingslicht hebben geen schaduw, dus binnenkanten van gesloten tenten zijn iets te licht.
- **Vloer = compositing-model** (gebakken AO + softbox-schaduw + contactschaduw), geen path tracer.
  Zeer lange of meervoudige schaduwen van complexe opstellingen (`items`) zijn benaderingen.
- **Constructiedetails volgen gangbare bouwwijzen** (zeskantpoten, schaar, binnendiagonalen naar
  centrale hub, klapstatafel met schuifkraag en schoren). Controleer tegen de werkelijke leverancier en
  pas `SPEC` in `models/easyUpTent.js` / `statafelDims()` aan waar het afwijkt (bv. dakvorm 3×4,5).
- **Weefsel/tricot-normalmaps** zijn alleen in `detail`-beelden zichtbaar; op 2000 px hero lees je het
  doek aan naden, stiksels, doorhang en glans, niet aan de draad.
- **Een wit, recht belicht dakvlak** blijft vrij vlak: het zit in de schouder van de tone-mapping (≈ 245).
  Doorhang en ribben lees je vooral op het afgewende vlak.
- **Scherptediepte** in `detail` is een gemiddelde over lensposities; bij weinig samples (< 40) is de
  vervaging korrelig. De tent vraagt daarom 60 samples voor `detail`.
- **De overige modellen** (klaptafel, biertafelset, accessoires, stretch-/ster-/opblaastent, prikkabel)
  zijn eenvoudiger en nog niet op cataloguskwaliteit beoordeeld.
- **Rendertijd** op 4 CPU-kernen (SwiftShader): ca. 25–105 s per statafelbeeld en 2–5 min per tentbeeld
  op 2000 px / 40 samples (tentdetail met 60 samples het langst, tot ~8 min met zijwanden).
