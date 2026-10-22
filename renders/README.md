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
  tools/check-tent-values.py   toonbewaking tentdoek (zwart/antraciet/grijs, zwart doek vs. frame)
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
- `legs`: `premium` (zeskant 40 → 34 mm zwart gepoedercoat staal, zwarte nylon hoekstukken, dakrand 2,10 m, schaar 68 cm diep,
  profielen 32 × 15 mm) of `professional` (zeskant 50 → 44 mm aluminium, aluminium hoekstukken, profielen 42 × 19 mm, 2,14 m,
  schaar 70 cm). De schaardiepte is zo gekozen dat elk kruis mét scharnierbout ~14 cm onder de valancezoom ligt; van de
  hero-camera (17° boven, door de uitwaaiering en buik van de valance) zie je het **~11–13 cm onder de zoom** (gemeten met de
  probes `trussCross`/`hemAtCross`), dus elke zijde leest als rij ruiten (X-schaar), niet als zigzag "W". Bij 58 cm lag het
  kruis in beeld precies op de zoomlijn.
  `frameFinish`: `powder` (zwart staal) of `alu`; standaard volgt het de lijn.
- `color`: kleurnaam of `#hex` (dak, valance, wanden). `wallColor` voor afwijkende wanden. Wit doek wordt
  op ~85 % albedo gezet (PVC, leest als wit en niet als lichtgrijs). **Donker doek krijgt zijn echte waarde:**
  albedo = de kleurstaal (antraciet 5 %, grijs 16 %), alleen echt zwart wordt van 1,2 % naar 1,6 % getild.
  **Donker doek wordt belicht zoals een fotograaf zwart product belicht** (art direction 18 okt 2026: bij 0,72
  was de zwarte 3×6 met wanden één onleesbare donkere schuur, wanden 42–56, dakvlakken 16–46): `auto` met
  `max` 1,02 voor donkere kleuren (zwart, antraciet, donkerblauw; middenkleuren blijven 0,72), plus een brede
  zachte scrim hoog achter de set die elk naar de camera gekeerd dakvlak als **één zachte glansband**
  spiegelt. Zwart: belicht dakvlak ~60–65, afgewend ~29–34; belichte wand ~66, afgewende wand ~31; de volgorde
  zwart < antraciet < grijs blijft (elk ≥ 25 niveaus). Graatnaden, de kil tussen twee pieken en de dakrand
  dragen een **glanzender naadmateriaal** (welt 9,5 × 3,4 mm op donker doek, ruwheid 0,24): hun ronde kroon
  spiegelt de scrim, dus op zwart loopt langs elke graat, de kil en de dakrand één dunne lichte lijn die de
  vlakken scheidt. Controle: `python3 renders/tools/check-tent-values.py` (zie *Toonbewaking*).
  Wit wordt belicht als gefotografeerd wit PVC: een hogere key, hoog op het vlak naar de nok gericht met een
  zachte bundel van 38°, en belichting 0,52 (bij 0,58 lag het hele belichte vlak in de schouder van de
  toonkromme op ~248: een vlakke, gegoten plaat; een smallere, lager gerichte bundel zette er een spotlicht op
  en liet de linkerhoek naar ~165 zakken: een grijze vignet) laten het belichte vlak van ~246 hoog bij de spant
  **gelijkmatig afvallen naar ~230 langs de dakrand en ~200–220 langs de linkergraat** (~190 in de uiterste
  hoek): elk hol half paneel leest, en de linkerbovencontour leest ook in een collectieraster tegen de
  #EFEDE8-achtergrond. **Schaduwkant** (r8): een sterkere vulling (4,4) en reflectiekaart vóór (3,6) tillen het
  afgewende dakvlak en beide valances naar **~212–225** (bij 174–200 las wit doek als vaal grijs); het belichte
  vlak blijft ~246, en de achtergrond wordt achter de kap zacht ~5 % donkerder (`backdropShade`, loopt naar de
  beeldrand uit naar exact #EFEDE8), zodat de belichte linkerbovencontour blijft staan. Het detail houdt zijn
  eigen belichting 0,58.
- `walls`: per zijde (`front`, `back`, `left`, `right`) één type, of een lijst per vak van 3/4 m
  (`"back":["window","door"]`). Alle indelingen staan gecentreerd in hun vak:

  | type | wat je ziet |
  |---|---|
  | `closed` | dichte wand |
  | `window` | één rechthoekig PVC-raam (max 1,5 m breed, 0,86–1,56 m hoog) met een **gestikte bies van 3,6 cm** (dubbele laag, 2,2 mm dik, iets glanzender dan de wand, twee stiksels); helder folie (~70 % doorkijk) over een donkere binnenkant waarin de overkant en het frame vaag te zien zijn, met **één schone diagonale reflectieband** (~45°, ~15 cm, nauwelijks golvend) |
  | `windows` (`church`) | twee kerkraampjes met roede en marges van ≥ 0,5 m tot de poten |
  | `door` | deur van ~1 m. **`doorState` standaard `"auto"`: dicht in hero/front/side/back** (rits, stormflap en deurrand lezen van buiten; het hoofdbeeld opent nooit met een donker gat), **half open in `detail`**. Met `"half"` is het **rechterblad losgeritst, opgerold tot de deurkop en vastgegespt**: van buiten een donkere opening met de oprol erboven (zichtbaar in hero en thumbnail), het linkerblad dicht met rits, stormflap en hangende band; door de opening zie je de binnenkant (vloer, frame, ramen aan de overkant). Met `"doorState":"closed"`: deuropening met gestikte deurrand (platte 4 cm band van 0,7 mm met scherpe randen, dubbel stiksel), verticale rits in het midden (twee geweven tapes, ~520 in elkaar grijpende gegoten tanden per kant op 3,4 mm steek, schuiver als wig met brug, trekker met gat en trekkoord), stormflap: een platte band van 5 cm links van de rits met een omgevouwen rand van 2 mm, die maar ~3 mm van de rits staat (fijne schaduwlijn op de tanden), verstevigingsdriehoek, twee oprolbanden van echte singelband (dikte, afgeronde zelfkant, randstiksel, boxstiksel bovenaan) met kliksluiting (female huis met ribbel en drukknoppen opzij, male tong met sleuf) |
  | `door-open` | deur open: opening tot 1,96 m, opgerolde deur met twee lussen erboven |
  | `panorama` | breed PVC-raam over bijna het hele vak |
  | `rolled` | hele wand opgerold onder de valance (met drie banden) |
  | `open` / `none` | geen wand op die zijde |

  Wanden hangen aan klittenbandlipjes langs de dakrand (~1 m uit elkaar; bovenkant achter de valance, daar is de
  bolling zacht begrensd zodat geen plooi door de rok steekt) en zijn met banden aan de poten gesnoerd. Polyester
  onder zijn eigen gewicht: tussen twee lipjes **zakt het doek in een ondiepe kettinglijn** (twee geneste U-plooien
  die net onder de valancezoom zichtbaar worden), onder elk lipje loopt een **brede bolle valplooi** naar de zoom
  met een zacht dal ertussen (**2–4 onregelmatige plooien per paneel van 3 m**: afstand, diepte en helling per
  plooi anders, naar de zoom iets dieper; hellingen ~8–10°, zodat de wandglans in een paar zachte licht/donker-banen
  breekt), een buik van ~1,6 cm, en de panelen zijn een paar cm te lang: tussen de poten **rust de zoom op de
  vloer en knikt in een kleine golf naar buiten**, bij de poten (banden) ~2 cm opgetrokken. Geen regelmatige fijne
  verticale banen meer (die lazen als golfplaat). Verder: gevouwen onderzoom, verstevigde zijbanden,
  spanningsrimpels vanuit de bovenhoeken. Panelen eindigen
  op de poothartlijn: op een hoek blijft een smalle sleuf waarin de poot en de **velcrobanden** zichtbaar
  zijn — van elke wandrand loopt op drie hoogtes een band van 5 cm in een lus om de poot. PVC-ramen:
  gestikte bies van 3,6 cm, helder folie (~70 % doorkijk, geen clearcoat, gedempte omgevingsreflectie) met
  **één schone diagonale reflectieband** per raam (engine `sheet` met `dir` [0,74, 0,67], `sigma` 7,5 cm,
  `wave` 0,15). Het folie werpt de schaduw van de key (in de schaduwpass ondoorzichtig binnen het raam): geen
  zonnevlek door het raam op de vloer en de binnenkant van de overkant (die las als een lichte schuine plaat en
  grijze rookstrepen achter het folie). Meng in één productbeeld geen kerkraampjes en rechthoekige ramen.

  **Binnenkant (≥ 3 hangende wanden):** de rig krijgt `interior` (zie Rig) met de **openingen** van de tent
  (open deur gewicht 1, raam 0,16, panorama 0,3): licht komt binnen door de openingen. Naar binnen gerichte
  vlakken (binnenkant wanden, onderkant dak, binnenkant valance) houden het schaduwlicht (key, koepel) plus
  fill/rim/bounce en omgevingslicht × 0,06 in de verre hoeken tot × 0,4 bij een opening, en spiegelen een zachte
  binnen-ambient (0,35 → 1,2 bij een opening): door een raam is de binnenkant **donker**, met de overkant en het
  frame vaag zichtbaar. De vloer binnen vier wanden gaat naar 0,7 % (3 wanden 5 %) en loopt bij een opening op
  tot 30 % (afval over 1,4 m). Het `detail` met opgerolde deur laat meer licht binnen (`k` 0,16 → 0,7,
  ambient 1,3 → 2,6, afval over 2,8 m): door de deuropening lezen vloer, frame en overkant (geen zwart gat).
  Voor een productfoto "met zijwanden" zet je **de zijden die de camera niet ziet
  op `closed`** (de samples doen dat: `{"back":["window","door"],"left":"window","front":"closed","right":"closed"}`),
  anders zie je door de ramen witte kaarten: de ramen aan de overkant met de studio erachter.

  **Hoofdbeeld met wanden:** de hero-camera ziet twee aangrenzende zijden van buiten (34° = voor+rechts,
  −34° = voor+links, 146° = achter+rechts, −146° = achter+links). De bouwer kiest het paar met de meest
  waardevolle wanden (deur > ramen > dicht), zodat elke betaalde optie **van buiten** te zien is; bij gelijke
  stand blijft 34°. `"heroAzimuth": 34` dwingt een standpunt af. Zet ramen en deur dus op twee
  aangrenzende zijden (bv. `{"back":["window","door"],"left":"windows","right":"closed"}`); drie
  verschillende wanden op drie zijden kunnen nooit allemaal van buiten in één beeld.
  Vorm: `{"front":"door","back":"closed"}`, `["back:window", …]` of `"all"` (alles dicht).
- `weights`: aantal stapelbare voetgewichten per poot — `2` of `{"count":2}`. Rubber-gecoate schijven
  (Ø 25 cm, 3,4 cm) gestapeld **óp de voetplaat** (6 mm hoger), met een zichtbare naad tussen de schijven,
  een gegoten opstaande rand, een ingegoten `10 KG`-plaatje bovenop, een **verhoogd `10 KG`-plaatje op de
  rand** (letters ~2 cm, lichtgrijs ingevuld: leesbaar op hero-formaat), halfglanzende coating (de afgeschuinde
  randen vangen licht, dus de naad tussen de schijven leest als donkere groef tussen twee lichte randen) en
  een eigen contactschaduw. Bij de **poot die het dichtst bij de camera staat wijzen sleuf en greepgaten naar
  de camera** (~34° naar links gedraaid, het randplaatje ~20° rechts ervan): de koper ziet hoe de schijf om de poot schuift; bij de andere poten wijzen ze weg.
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
ribben, twee zeskantbouten per vlak, `PRO 50`). Dak: piramide per vak; elk dakvlak bestaat uit twee
halve panelen die tussen spant (rug over de spantbuis, ~1,6 cm afgerond) en graat **holvallen: ~9 cm op een
vak van 3 m** (3 % van de vakbreedte, schaalt mee), nul aan de top en aan de dakrand. De graatnaden dragen
de spanning van hoekzak naar top en zakken maar ~4 cm door, zodat de **silhouetten licht naar binnen
buigen**; de spanten buigen ~2 cm, en elk vak heeft een flauwe lange golving (~4 mm over 30–60 cm: geen
perfecte schaal). Vanuit elke hoekzak (waar het doek over de pootkop getrokken wordt) waaieren **vier radiale
spanningsplooien** uit: ze beginnen aan de rand van de stijve hoeklap en lopen 30–60 cm uit, elk een zachte rug
van 14–18 mm met ondiepe dalen ernaast, 9–23° naast de graat. Rond de topkap **vier radiale plooien per vlak**
(9–13 mm, 25–45 cm) waar het doek om de kap verzameld is. Getapete en dubbel
gestikte graat- en middennaden (die stoppen waar de dakrandvouw begint) met een **naadwelt** in het midden van de
tape (graat en kil 6,8 × 2,4 mm, op donker doek 9,5 × 3,4 mm in het glanzende naadmateriaal; spant 5,2 × 1,7 mm):
2–3 px op 2000 px, dus de naden lezen ook in het hoofdbeeld. Versterkingslappen op de hoeken en
de top (afgeronde driehoek op de hoeken, cirkel op de top, beide met een gelijkmatig dubbel stiksel op 6 en
12 mm van de rand; onder de stijve dubbele laag lopen de spanningsruggen uit, zodat de randen recht blijven).
Rond de topkap is het doek strak: de holval van de panelen loopt binnen ~35 cm van de kap naar nul (geen
"hoorntjes" van de spantruggen naast de kap) en de graten verzachten er tot ~11 cm (het doek ligt om een ronde
kap), zodat de ronde toplap ook als cirkel leest; ook de graatnaad blijft binnen ~45 cm van de kap één gladde
ronde graat (de holval van de panelen rondt daar even breed af als de graat, en de spanningsruggen vanuit de
kap blijven ≥ 0,2 rad naast de graatlijn: geen geknepen vouw achter de kap). De **topkap** zelf is een lage
koepel (Ø 12 cm, ~6 mm boven het doek) in de doekkleur, glad (zonder weefselkaart, die las als geperforeerd grijs
onderdeel). **Dakrand:** het dak wordt over de laatste ~6 cm strak over de
schaar getrokken (lichte bolle schouder) en slaat dan in een vouw van 4 mm om naar de valance; in die naad zit een
**paspel** (koord van 7 mm in doekkleur, glanzend naadmateriaal) en 7 mm eronder een stiksel: de overgang dak/valance
leest op hero-formaat als genaaide rand (op zwart een dunne lichte lijn langs de hele dakrand). De dakrand is met
klittenband aan de poten en aan elk bovenste schaarknooppunt (~1 m) bevestigd en **zakt daartussen ~3,5–4 mm door**:
de valance volgt dat festoen. Tussen twee vakken
(3×6, 4×8) wordt de zachte kil naar de dakrand toe scherper, zodat de dakrand recht blijft.
Doek: `M.pvcCloth(color)` (PVC-gecoat polyester; ook `M.pvcPatch` voor dubbele lagen en `M.pvcThread`):
geen clearcoat (die gaf plasvormige softbox-reflecties), **één coating voor alle kleuren** (wit apart):
ruwheid 0,5, `envSpec` 0,5, zodat elk dakvlak dezelfde brede zachte glans van de overhead-scrim krijgt (op zwart
de vorm, op kleur een lichtere, minder verzadigde glans op het belichte vlak). Geverfd doek (`dye`, kleuren met
chroma) wordt in de schaduw dieper en verzadigder (engine-hook: het diffuse licht in de schaduw wordt nog eens
door de genormaliseerde kleur gefilterd, één extra kaatsing op hetzelfde doek). Dubbele lagen (`pvcPatch`:
hoeklappen, toplap, naadwelten) zijn een fractie glanzender, zodat ze door hun glans lezen. Vezelglans in de kleur
van het doek, een **isotrope platbinding** als normalmap (draad 1 mm, herhaling 2 mm) en een **zwakke macrolaag**
(garenspanning, verdikkingen, coating-golving; sterkte 0,12–0,135 en ruwheidsvariatie 0,06, ~30 % van eerder:
sterker leest het als stucwerk / sinaasappelhuid, leer of vilt in plaats van PVC-gecoat polyester). De fijne
regelmatige platbinding en één gelijkmatige coatingglans dragen het oppervlak. De engine (`weave`) bepaalt per pixel hoeveel
weefselherhalingen erop vallen: dichtbij (detail, ~0,5–1 mm/px) wordt het reliëf versterkt en varieert de
glans van de coating over garenkoppen en flanken; is het weefsel onoplosbaar klein, dan wordt de normalmap
vlak en wordt de glanslob iets matter (geen moiré, geen stippenraster). Licht doek laat licht door
(`translucency` 0,62 bij wit): de onderkant van een wit dak is lichtgrijs-wit, met het frame en de
naden/lappen (dubbele laag) donkerder ertegen. Alle doek-uv's zijn in meters óp het oppervlak gemeten,
dus het weefsel rekt nergens uit. Wit doek: albedo 85 %. Stiksels: toon-op-toon garen (op wit gelijk aan
het doek, op zwart een fractie lichter) dat leest door reliëf: elke steek duikt aan beide uiteinden het doek
in (naaldgaten donkerder via vertexkleur), steeklengte ±8 %, lijn slingert ~0,15 mm.
Valance: een **losse textielflap per zijde**: op elke hoek zijn twee flappen alleen over de bovenste ~6 cm aan
elkaar genaaid (naad + trens), daaronder opent een **spleet** naar de zoom (~1,8 cm breed onderaan), en de vrije
hoeken hangen elk op hun eigen manier (één ~4 mm naar buiten): geen massieve doos-hoek. De hoek is bovenaan strak
(1,6 cm) en rondt naar de zoom af tot ~3 cm; bovenaan strak aan de dakrandvouw genaaid, lichte uitwaaiering, buik
van ~1 cm, zachte onregelmatige **verticale valplooien** (~6 mm, golflengtes ~20–70 cm, groeien naar de zoom), een
**schulp van ~9 mm** tussen de bevestigingspunten (~3,5 mm uit de dakrand + ~5,8 mm in de zoom: de zoom is nooit
een liniaalrechte lijn), en een omgeslagen zoom van 2 cm: van buiten de echte ~2 mm dikke rand plus een
**dubbel gestikte zoomband** (stiksels op 5 en 13,5 mm die het doek in twee groefjes trekken, het doek ertussen
bolt licht op, de rand van de binnenlaag tekent als ribbel op 19 mm): de band met twee lijnen blijft na het
verkleinen naar 2000 px zichtbaar.

**Frame-afwerking:** Premium-poten en -schaar zijn satijn zwart gepoedercoat (ruwheid 0,4 onder een satijnen laklaag,
een fijne, zwakke sinaasappelhuid: stippel van 4 mm, sterkte 0,022; de bibliotheekstandaard van 2,5 cm / 0,08 spiegelde
onder de laklaag als vlekkerig camouflagepatroon op de brede vlakken van de schaarprofielen en las als vuil);
twee hoge striplichten in de studio-omgeving geven elk facet een eigen waarde met een fijne glanslijn op de
ribben, zodat zeskant en de stap van buiten- naar binnenbuis ook op 2000 px lezen. Professional is **geborsteld,
helder geanodiseerd aluminium**: metaal, ruwheid 0,2, sterke anisotropie (0,85) langs de buis (een lange
streep-highlight in de borstelrichting), en op de zeskantpoten **zwarte vlaggen** in de reflectie (engine
`envFlag`: de omgeving wordt × 0,28 gespiegeld waar de gereflecteerde straal tussen 62° en 118° naast de camera
wijst). Aangrenzende facetten spiegelen richtingen 120° uit elkaar, dus de facetten wisselen licht/donker, in
elke stand van de poot: "aluminium Pro 50" leest als een ander materiaal dan het zwarte staal van Premium 40. **Voetplaat:** thermisch
verzinkt staal (metalness 0,8, gevlekte ruwheid per zinkkristal), 6 mm met 1 mm afgeschuinde randen, vier
**echte doorlopende pengaten** (de vloer is erdoor zichtbaar), driehoekige schetsen van 3 mm, een M8-bout met
moer door de koker, en een onzichtbare contact-proxy die achter/opzij een strakke contactschaduw geeft (de
plaat ligt óp de vloer in plaats van erop geplakt).

**Standaardbeelden per tent:** `hero` + `detail`. Het detail van een open tent is de hoek die het dichtst
bij de hero-camera staat, **van ~17° boven de dakrand** (de dakhoek met zijn spanningsplooien en hoeklap, de
gespleten valancehoek, hoekstuk, X-schaar naar beide kanten, schuif met trekring en de bovenkant van de poot),
met een kleine scherptediepte; van onder de dakrand las de onderkant van het dak als een vlakke grijze plaat.
Heeft de tent een deur, dan is het detail **de hoek van de deurwand, van voetplaat tot deurkop** (~2,3 m): de
hoekpoot in de sleuf tussen twee wanden met de klittenbanden eromheen, de verzinkte voetplaat, en de half
geopende deur ernaast (rits, stormflap, opgerold en vastgegespt blad, doorkijk naar binnen), met een strijklicht
van opzij en een kaart rechts zodat ook de zijwand om de hoek leest.

### `statafel`
`{ diameter, height, top, frame, base, legs, folded, lean, leanYaw, leanTilt, footAngle, noTop, shape }`

- `diameter`: 0.6 / 0.7 / 0.8 / 0.85 (m, of in cm), `height` 1.10.
- `top`: `berken` (multiplex 18 mm: één fysiek geschaald, laag-contrast schilfineer, `birchTopFace()` =
  `upholstery2.birchPly` als **schoon blad zonder speldenknoesten** (die lazen op catalogusformaat als vuilstipjes),
  onder een **satijnlak** (clearcoat 0,72 / ruwheid 0,15: het zachte achterscherm van de kale-tafelstudio spiegelt
  als lakglans over de achterste helft van het blad), ook op de onderkant en op vierkante bladen; lagen op de rand), `hdpe` / `hdpe-grijs` (45 mm blow-moulded), `wit` / `zwart` / `antraciet` / `houtlook` /
  `graniet` (gelamineerd).
- `frame`: `zwart`, `wit`, `antraciet` (satijn poedercoat zonder stippelruis, `statafelLook.satinPowder`; zwart =
  ~4 % albedo `#222427` onder een satijnen toplaag (clearcoat 0,8 / 0,13): de striplichten links en rechts en het
  achterscherm (`STATAFEL_ENV_KAAL`) geven brede zachte glansbanen op kolom, ovale poten en schoren, zodat hun
  buisvorm en ovale doorsnede leesbaar blijven in plaats van silhouetten), `chroom`, `alu`.
- `base: "klap"` (inklapbaar), zoals echte klapstatafels gebouwd: Ø50 kolom; onderaan een hub met vier
  **gaffels** (twee wangen per poot) waarin de **ovale poten 30 × 16** op **klinknagels** scharnieren;
  **platte stalen schoren 18 × 4** die met pennen in een gaffel óp de poot en in een gaffel op de **schuifkraag**
  zitten (geen zwevende uiteinden meer); de kraag zit vast met een **sterknop** (vooraan, tussen twee poten);
  **voetdoppen** als glijschoen over het buiseinde met een vlakke zool. Onder het blad: twee gekruiste platte
  steunen en een montageplaat, vastgezet met **bolkopschroeven met kruiskop** (cilindrische kop met afgeronde
  bovenkant, mat verzinkt, geen glimmende sikkels); de **kantelbeugel** is één gezette U-profiel van 4 mm staal:
  rug onder de montageplaat met een **hoeklas** (licht geribbelde las) langs beide zijden, **zetradius 3 mm**
  binnen naar de twee **wangen**, die rond de scharnierbout (zeskantkop + moer, 48 mm onder het blad) en de
  vergrendeling uitgezaagd zijn. De **veerpen met trekknop** zit 31 mm van de bout (ervoor en eronder) met een
  draadbus en contramoer op de wang en grijpt in de (60 mm diepe) kolomkop: knop en boutkop raken elkaar niet.
  `kruis` (horeca, vaste 4-stervoet), `rond` (horeca, ronde voetplaat). `legs`: 3 of 4.
- `folded: true`: blad verticaal (om de scharnierbout), poten langs de kolom opgeklapt (de kraag schuift via
  de schoren mee omhoog, kinematisch berekend). Ingeklapt kan zo'n tafel niet zelfstandig staan (hij rust dan
  alleen op de kolomvoet), dus los in beeld **leunt** hij tegen een **zichtbare wand**: een lichte studiowand een
  tint donkerder dan de vloer (`rig.wallTone {base 0,925, top 0,035, height 1,6}`: de wand is iets donkerder dan
  de vloer en loopt naar boven nog iets af) met een krappe holle hoek (`rig.cove` 3 cm), zodat de hoeklijn
  vloer/wand zichtbaar is en de koper ziet waar de tafel tegenaan leunt; kolomvoet op de vloer, bladrand tegen
  de wand, de mechaniekzijde (kolom, opgeklapte poten, scharnier, knop) naar de camera. De hero kijkt van 52°
  opzij (blad als ellips, kolom en poten ervoor, de wand wijkt in perspectief). `leanYaw` (°, standaard 8)
  draait de tafel t.o.v. de wand, `leanTilt` (°, standaard 11) is de leunhoek. Beide raakpunten krijgen
  contactschaduw (vloer: contactpass; wand: `userData.catcher`). De wand is **gebakken** zoals de vloer
  (`engine._bakeWall`): 160 richtingen over de hele bovenhalve bol + de sleutelkegel, in het wandvlak, vervaagd;
  vloer en wand wegen hun richtingen met een normaal die in de holle hoek naar 45° buigt (geen naad in de
  schaduw). Zonder `wallTone` blijft de wand een naadloze sweep (exact de achtergrondkleur).
  `lean: false` = de kale ingeklapte tafel rechtop (voor de transportkar).
- Detailbeelden (`--angle detail` of `detail-<naam>`): `detail` = het klapmechaniek (schuifkraag met sterknop,
  schoren met gaffels, hub, voetdoppen), `detail-scharnier` = kantelbeugel en scharnier onder het blad van
  schuin onder, `detail-kraag` = kraag + knop, `detail-voet` = een voetdop.

### `statafelCover`
`{ type, color, diameter, topcover, topcoverPrint, print, waistY, waistR, hemLift, sashColor, bowAngle, tableTop, seed }`

- `type: "stretch"` (statafelrok): polyester-elastaan single jersey (`statafelLook.jerseyKnit`: 0,9 mm
  tricotlussen als normal map, uv in meters, in close-ups versterkt via de engine-`weave`-hook, die daar ook
  de flanken van elke lus donkerder maakt (`weave.cav`) en de lustoppen meer vezelglans geeft (`weave.crown`)).
  Gespannen tricot is **satijnglanzend**: het lijf heeft een **anisotrope** glanslob (`anisotropy` 0,38,
  lange as langs uv v = het profiel af: rand → taille → voeten), zodat de studioboxen als **zachte
  spanningsstrepen** langs de rek getrokken worden, roughness ~0,57–0,6, sheen 0,55 in de eigen verfkleur
  (zwart: koel donkergrijs, dus Lycra en geen mat rubber). Daarbovenop het **streak-veld** van de engine
  (`userData.streak`, alleen in de trechter: van net onder de onderste bladarris tot de taille,
  `statafelLook.withStreakEnd`): ~95 onregelmatige radiale strepen rond de rok die glanzender en iets
  spiegelender zijn en de normaal over de streep kantelen (fijne ribbels), uitgedoofd waar ze kleiner dan een
  pixel worden; samen met de geometrische **radiale rekstrepen** (56 stuks, 0,6–2 mm) lezen ze op heroformaat.
  Het vlakke bovenpand en de naadrups gebruiken een isotrope variant (`jerseyKnit(color, {flat: true})`).
  `knitLook {roughness, sheen, sheenColor, sheenRoughness, normal, specularIntensity, envSpec, boost,
  anisotropy, streak}` overschrijft het materiaal voor look-development. Constructie: rond bovenpand, op de
  bovenste bladrand aan het lijf genaaid (naadrups + stiksel op de rand); het lijf omspant de 18 mm rand, loopt
  vanaf de onderste bladrand in een trechter naar een strakke taille en waaiert uit naar de vier voeten.
  Spanning: radiale rekstrepen van de rand naar de taille, onregelmatige **stuiklobben** in de taille,
  **diagonale treklijnen** van de taille naar elke voet en **spanningsrimpels die vanaf elke voetzak waaieren**
  (8–25 cm de baan in, het sterkst bij de zak). Elke voet zit in een **elastische voetzak**: een korte,
  taps toelopende sok over de voetdop (zaknaad net boven de dop op 5,6 cm, elastische rand die de dop
  omsluit, zool net zichtbaar) die met een zachte radius (~2,5 cm) uit de baan overrolt, zonder harde
  kistranden. De hoeken van de zoomboog bij de zakken zijn C1-glad (geen kreuklijn die van de zakhoek naar de
  taille loopt). Tussen de voeten tilt de **omgeslagen zoom** (2 cm, coverstitch in twee rijen, dunne vouwrand
  van 1,2 mm) in een boog (`hemLift`, standaard 11,5 cm, per baan een paar mm anders) met een lichte golving
  van de gerekte zoom (~3–4 cm).
  `topcover: "wit"` (of `true`) = losse topcover over blad en rand, elastische rand net onder de bladrand;
  `topcoverPrint: "stripes-rwb" | "voetbal"`.
- `type: "strik"`: geweven polyester (`statafelLook.wovenCloth`: fijne platbinding als normal map plus de
  **macrolaag** `fabricMacroNormal` via de engine-`macro`-hook: garenspanningsstrepen van 1–6 mm in ketting en
  inslag, slubs en een zachte cockle, die ook de glans laten variëren, zodat het weefsel op heroformaat
  leesbaar is; lichte satijnsheen). Wit wordt belicht op ~236–244 (belichting 0,72, vulkaart 1,0,
  vloerkaatskaart 3,8), zodat de plooien hun verloop houden. Het doek ligt vlak op het blad (eigen planaire uv,
  geen pool in het weefsel), valt over de rand en wordt bij de taille samengebonden: **radiale plooien** vanaf
  de bladrand die naar de sjerp toe vertakken in twee keer zoveel plooitjes en bij de knoop **naar het
  knooppunt convergeren**. Het samengeraapte doek **bolt boven en onder de sjerp uit** (+1,3–2,2 cm) en wordt
  onder de sjerprand ingesnoerd (één raaklijn-continue curve, geen trapjes in de plooien). De **sjerp** heeft
  eigen zachte lengteplooien, een lichte twist en golf in hoogte en breedte, drukt op de plooitoppen (bultjes),
  de randen liggen óp de plooien, en hij versmalt en plooit naar de knoop. Rok: plooitjes onder de sjerp die
  overgaan in ~13 brede zachte plooien van ongelijke breedte en diepte (afgeronde toppen, smalle maar geen
  V-dalen), de zoom raakt de vloer en kickt ~1 cm uit (donkere contactlijn, geen bies, geen plat
  ruchesrandje). Strik: twee **lussen van één laag lint** (zo breed als de sjerp, ~7 cm), open aan boven- en
  onderkant (voor- en achterstreng staan los, randen dun, geen paspel), vlak over de breedte met een lichte
  holling en een twist langs de streng, bij de knoop samengeknepen (fijne plooitjes) met **één diagonale
  knijpvouw** naar de bovenste verre hoek; een **knoop = om de lusvoeten gewikkelde band** (randen die over de
  lusvoeten rijden, twee scheve wikkelvouwen, licht hol gezicht); twee **staarten** die van onder de knoop
  komen (korte twist), op sjerp en rok liggen met hun randen ~2 mm van het doek (zachte contactschaduw, geen
  donkere omtreklijn), het midden overbrugt de plooidalen, het uiteinde komt iets los, en eindigen in een
  **schone zwaluwstaartknip** (kolommen van verschillende lengte, dus een scherpe knip). `sashColor` voor een
  contrasterende sjerp.
- `type: "kleed"`: rond tafelkleed dat over het blad tot op de grond valt, met godetplooien en lichte poel.
- `print: {svg, color, width, y, azimuth}` (stretch): logo op het vlakke deel van een paneel tussen twee voeten
  (`azimuth` in graden, standaard het paneelmidden het dichtst bij de hero-camera), volgt de rok.
- Detailbeelden: `detail` (stretch: bladrand met naad en tricot + bovenkant trechter met rekstrepen; strik: de
  strik), `detail-voet` (stretch: voetzak), `detail-taille` (stretch: de taille).

**Licht voor de hele statafelfamilie** (`js/statafelLook.js` → `statafelRig()`, voorgesteld door beide bouwers):
grote overhead-softbox voor de vloerschaduw (`floorKey` el. 78°, kegel 24°: de schaduw ligt ónder en net achter
het product, blijft in beeld), modelleerlicht linksvoor op 38° (horizontale vlakken krijgen minder dan de rok),
grote frontale vulkaart rechts op ooghoogte, een witte **vloerkaatskaart** linksvoor onder het product (licht de
naar beneden gekeerde delen: trechter onder het blad, strikdrapering; intensiteit 1,7–2,3 voor hoezen), studio-
reflectieomgeving met vaste boxen (donker achter het product, dus een rood blad wordt niet zalmroze en een
zwart blad geen grijze schijf), Neutral tonemapping (verzadigde verfkleuren met een zachtere toe, `rig.toe`
0,5: de kleine kanalen van rood worden niet naar 0 gedrukt, dus geen digitaal puur rood maar geverfd doek met
vorm in de schaduw), contact-AO onder voeten/zoom/hub (smal + brede halo),
gladde vloer-AO (96 + 96 richtingen, σ 2,5 cm, vervaagt naar 1 aan de bake-rand) en belichting per albedo
(wit 0,72 met vulkaart 1,0 en vloerkaart 3,8: belicht wit doek ~236–244, afgekeerde kant ≥ 185; stretchrok met lichtere topcover belicht
voor de topcover). Close-ups (`detail*`) zonder `edgeFade`: de vloer in beeld ligt in de schaduwpoel van het
product en loopt door tot de beeldrand. Controle: `python3 renders/tools/check-statafel-values.py`
(waarden + doekstructuur: luma-spreiding op de belichte trechter ≥ 3).

**Kale tafel en ingeklapte tafel** (`statafel`, onderstel `klap`): de studio krijgt er een **zacht
achterscherm** (az. 180°, el. 16°, 120° × 22°, intensiteit 1,5) en **twee hoge striplichten** links en rechts bij
(`statafelLook.STATAFEL_ENV_KAAL`): lakglans op het berkenblad, glansbanen op kolom, poten en schoren. De
vloerschaduw van de overhead-box is krapper (`floorKey` el. 80°, **kegel 6°**, `keyShadow` 0,55), zodat elke
poot, schoor en voetdop een eigen zachte schaduw legt (160 hemelrichtingen + 128 in de kegel, vervaging
σ 4 mm in plaats van 2,5 cm, zodat dunne poten niet in de poel wegvegen); contact-AO tot ~8 cm hoogte (`h0`
2 cm met 1,8 texel vervaging = donkere lijn rond elke voetdop, brede halo `h0` 8 cm, σ 6 mm, sterkte 0,65).

### Catalogusreview (oktober 2026)
- `easyUpTent`: wandtype `half` (borstwering, `halfWallHeight` standaard 1,0 m, klittenband laag aan de poten);
  `valancePrint {svg|text, color, sides}` drukt een merkbestand uit `js/brandPrints.js` op de luifel;
  `wallPrint {svg, color, side, width, y, both}` drukt het op een hangende wand (`both`: ook binnenzijde).
- `canopyRoof {…, withFrame: true, legs}`: de full-colour bedrukte tent compleet, mét frame, schaduw en licht.
- `easyUpFrame {w, d, legs}`: los frame (zonder dakdoek).
- `statafel`: `shape: "square" | "rect"` (+ `width`, `depth`, `stackable`), bladen `antraciet`, `houtlook`,
  `graniet` (steenlook-laminaat).
- `barStool {style: "chroom"}`: verchroomd frame met kunstleren zitting.
- `buffetCover {length, width, height, color, kind: "klaptafel" | "biertafelset" | "bierbank", print}`: stretchhoes
  voor klaptafel of biertafelset (tafel + 2 banken), zoom boogt tussen de poten, optioneel logo op de voorkant.
- `heater {kind: "gas" | "elektrisch", style: "paddenstoel" | "flame" | "lounge" | "tafel", watt, on, clamp}`,
  `heaterElement {watt}` (losse kwartsbuis), `floodLight {watt, on, clamp}`, `tentLight {watt, on}`.
- Gedeelde hulp voor eenkleurige opdrukken: `js/printDecal.js` (`artTexture`, `decalMaterial`).

### Meubilair (furniture-groep)
Gedeelde helpers in `js/seatKit.js` (naast `js/furniture.js`): stofmaterialen `fabricMat` (geweven polyester:
binding + melange + slubs + 1,5–3 mm heather, zodat bekleding op 1 mm/px als stof leest), `velvetMat`
(pool met crush-mottling en brede sheen), `leatherMat` (kunstleer, nerf), `woodMat` (v2: fijne rechte nerf,
lage-contrast jaarringen, poriën/spiegels per soort; U = langs de nerf, `swapUV` / `uvJitter` per onderdeel),
`rattanMats` (PE-streng in 3 tinten), `holedSheet` (afwateringsgaatjes via alphaMap). Geometrie: `softBlock`
(gekroonde, buikige bekleding met plooien in de hoeken) + `weltPath` (bies precies óp de naad), `roundCushion`,
`weavePanel` (echt over-onder-vlechtwerk van platte strengen), `ribbedTube` (omwikkelde buis), `plyBoard`.
Elke meubelbouwer stelt `S.seatRig()` voor: zes koepellichten met zachte PCF (geen X-vormige schaduwwiggen van
rugstijlen op een vlakke zitting) en de auto-belichting met de echte albedo van getextureerde materialen.

| model | parameters | wat je ziet |
|---|---|---|
| `barStool` | `style` (`metaal`, `draad`, `hout`, `rotan`, `velours`, `chroom`), `height`, `color`, `back`, `stack` | metaal: geperste zitting met afwateringsgaatjes, V-poten (nestelen, stapel 6 cm); draad: gelast rooster + lage draadrug; hout: multiplex 35 × 35 met eiken toplaag; rotan: echt vlechtwerk; velours: bies + channel-rug; chroom: ronde kunstleren zitting op Ø25 chroom (studio-omgeving) |
| `chair` | `style` (`banquet`, `klapstoel`, `crossback`, `metaal`), `color`, `frame` | banquet: rug omsluit de stijlen volledig, bies voor en achter; crossback: beuken, nerf langs elk onderdeel |
| `barrelTable` | `top`, `height`, `finish` | rotatiegegoten PE-vat in eikenlook (duigen, voegen, hoepels, spongat met dop), blad uit één stuk met vijf plankvlakken |
| `tableTop` | `diameter`, `top` | 18 mm HPL met kantenband en schaduwvoeg, iets hoger standpunt en key op afstand |
| `trolley` | `kind` (`statafel` ca. 126 × 97 × 113 hamerslag, `klaptafel` 190 × 75 × 90, `barkruk` 150 × 55 met 3 stapels van 8), `size` (`groot` 15 / `klein` 5), `loaded`, `tableTop` | ingeklapte statafels dwars in de kooi, binnen de eindframes; laden vanaf de camerakant |
| `klaptafel` | `shape`, `diameter`/`length`, `color` (standaard `lichtgrijs`) | ronde tafel met open, zachte vloerschaduw |

Batch: `node renders/render.mjs --batch renders/batches/furniture.jsonl` (alle 156 jobs van deze groep, Linnen `#ECE4D6`, paden naar
`catalog/images/`; preview: `--size 1200 --samples 16 --concurrency 2`).

Ronde 3 (`js/upholstery2.js`, eigen bestand naast `seatKit.js`): het materiaal dat het product benoemt moet als dat
materiaal lezen, niet als CG-vinyl.
- `velvetPile(hex)` (velours): kijkhoekafhankelijke albedo van een pool (vlakken naar de camera donkerder en voller,
  flanken en randen onder een scherende hoek lichter en iets ontzadigd), pool-plekken (crush) die met de kijkrichting
  omslaan, fijne vezelkorrel, brede Charlie-sheen, géén glanslaag. Eigen `onBeforeCompile` + cache-sleutel, geen
  engine-hooks. Velours-barkruk: channel-rug met 5 kanalen van 8,6 cm die tussen scherpe gestikte naden opbollen
  (vertex-AO in de naden), bies op de voornaad, zitting met bies boven en onder en licht gerimpelde naden.
- `wovenFabric(hex)` (banquetstoel, bank): platbinding van gemêleerde garens (tweekleurige vezels, slubs, toon per
  garen, 2 × 2-garenblokjes die op ~1 mm/px als fijne korrel lezen), fuzz-rand onder scherende hoek, grootschalige
  vlekking op een eigen schaal (geen tegelherhaling), mat. `puckerSeams(geo)` rimpelt het doek langs de biesnaden.
- `powder('wit')`: warm wit satijn met weinig omgevingsreflectie (leest als wit gelakt staal, niet als aluminium);
  witte frames (metaal, draad, hout, klapstoel) krijgen belichting ≥ 0,84.
- `birchPly()`: draaigesneden berken (lange, golvende nerf met lage contrast, brede zachte vlam, schaarse
  pin-knoesten en vlekjes, één ovale reparatielap), vlakke uv in meters (`planarUV`), één tegel per blad.
  `F.roundBoard` gaf het middelpunt van de bladvlakken de polaire rand-uv (ringen in elke bladtextuur); nu op straal.
- `barrelTable`: zes duigtinten, duigen donkerder naar de kimmen (vertexkleur, eigen mesh), gelakte hoepels met glans.
- Pakket 10 biertafelsets (`items`): sets 1,9 m hart-op-hart, zodat de banken van naburige sets elkaar niet raken.

Ronde 4 (art direction 18 oktober: elke furniture-job heeft een beeld; eigen bestanden, door de bestaande bouwers aangeroepen):
- `stanchionParts.js` (via `stanchion`): `head: "ovaal"` + `rope` + `pair` = palen voor koord (Ø51, urnkop met vier horizontale
  ogen; `finish` chroom / messing / zwart / wit) met een velours koord (`upholstery2.velvetPile`, Ø32) in een parabool van ~27 cm
  tussen twee ogen, verchroomde hulzen en karabijnhaken; `only: "rope"` = los koord in een hoefijzer op de vloer (hero 38°);
  `parts`: `wandhaak`/`koord` (drie afwerkingen + schroeven en pluggen), `wandunit`/`m` (cassette op wandplaat, band op de vloer,
  sluitplaat; `beltLength` 2 | 3 = label "2 m"/"3 m"), `bordhouder`/`liggend`/`staand` (kantelbaar kliklijstje op een RVS-paal,
  bord "INGANG"; `format` A4 | A3), meerdere = groepsbeeld.
- `biertafelParts.js` (via `biertafelset {only: "onderstel", part}`): `obt`/`obtb`/`obb` (verzinkte poten plat, met scharnierprofiel
  en klikslot), `ks`, `bm5` (slotbouten M8 met moer en ring), `vb8` (voetschoenen), `obk` (zwarte U-frames), `ocf` (T-poten),
  `sp4` (stelpoten met schroefdop); zonder `part` een flat-lay als hoofdbeeld.
- `banquetTable.js` (via `klaptafel` zodra `top` gezet is): `shape` rechthoek / rond / halfrond / kwartrond (kwart ring, 4 = cirkel)
  / ovaal / vierkant, `top` hout (berkenmultiplex 18 mm, lagen op de kant) | berken / `#D9B98C` (melamine berkendecor) | wit |
  lichtgrijs, `frame` u (klapbare U-frames met schoren) | t (conferentietafel), `folded`. Rand = één geveegde band, blad = vlakke plaat.
- `chairs2.js` (via `chair`): `style: "wedding"` (resin klapstoel met spijlenrug en gevoerde zitting), `cover: "stretch"` +
  `coverColor` op de klapstoel (lycra over rug, zitting en vier poten), en ingeklapte stoelen voor de kar.
- `trolley2.js` (via `trolley`): `kind` `klapstoel` (2 banen ingeklapte stoelen: 30 klapstoelen of `chairStyle: "wedding"` 26),
  `afzetpaal` (bak onderin + kamrails), `kapstok`, `koelkast` (plateau met twee spanbanden). `biertafel` gevuld: tafels in de
  middelste baan, banken in een stapel aan weerszijden, alles binnen de eindframes (~1 m hoog bij 10 sets); `statafel` met een
  deellading staat midden in de kooi. `tableTop` berken: `birchPly({clean: true})` (geen lap of knoest in het midden).
  `patioTable`: zichtbare kantelkop met hendel onder het blad; hero op 20° (ronde 5, was 12°: de decorbladen moeten lezen).

Ronde 5 (22 oktober: de laatste 30 furniture-jobs zonder beeld; nieuwe bestanden, door de bestaande bouwers aangeroepen):
- `barrelStool.js` (via `barStool {style: "vat", finish}`): barkruk wijnvat, PE-vat in dezelfde eikenlook als `barrelTable`
  (18 duigen van ongelijke breedte, toon per duig, donkerder naar de kimmen, vier zwarte hoepels met klinknagels, Ø 36/43 cm),
  zitting van drie planken met een dikke ronde kussenrand op de kim, zithoogte 76 cm. Wijnvat-set: `barrelTable` + 4 krukken.
- `js/hplDecors.js` (via `patioTable {top}`): decorbladen `beton`, `graniet`, `leisteen`, `marmer-wit`, `marmer-zwart`, `teak`,
  `eiken-grijs`, `vintage-hout`: één procedurele kleurtextuur (+ reliëf) per blad in meters (tegel 0,8 m, geen herhaling),
  turbulente marmeraders (kern + waas, fijne dwarsaders), leisteen met splijtreliëf, beton met wolken, gaatjes en zandkorrel,
  vintage hout als planken van 9-16 cm met naden, knoesten, spijkergaatjes en restjes witsel in de nerf. Compact-HPL-decors
  (beton, marmer, teak, grijs eiken) tonen de zwarte kern op de kant; de overige een omgezette decorkant.
- `workBoard.js` (via `tableTop` zodra `w`/`d` of een multiplex-`finish` gezet is): rechthoekig los blad plat op de vloer;
  `multiplex-antislip` = berken multiplex 18 mm met donkerbruine fenolfilm en het zeshoekige antislip-reliëf (cellen van 8 mm),
  kanten bruin gelakt over de lagen; `multiplex` = blank gelakt berken.
- `trolley3.js` (via `trolley {kind: "marktkraam"}`): kar voor 6 marktkramen (215 × 110 × 125, verzinkt, Ø160 zwenkwielen,
  latten-bodem, hoge U-eindframes, drie rongen per zijde met bovenregel); `loaded` = kramen: werkbladen plat gestapeld,
  de 25 mm kraambuizen in twee gesjorde bundels langs de zijkanten, de liggers in een korte bundel in het midden en de
  opgevouwen PVC-kappen (`canopyColor`, standaard rood) in twee stapels.
- `klaptafel {top, frame, frameColor}` (`banquetTable.js`): `frameColor` kleurt de poten; `chroom` = verchroomd T-onderstel
  in de lichte standaardomgeving (de vlakke kolommen spiegelen in de donkere studio-omgeving zwart en lezen als gunmetal).
- `trolley {kind: "klapstoel"}` beladen: de kar voor 30 klapstoelen / 26 weddingstoelen krijgt één opgezette stoel ernaast
  (het pakketbeeld, zoals de stapelstoel- en barkrukpakketten; `beside: false` toont alleen de kar); meer dan 30 geladen =
  de lange kar voor 50 (2 × 25), zonder stoel ernaast. `trolley {kind: "klaptafel"}` vol (10, het pakket) of met
  `beside: true` zet één klaptafel op rechtsachter de kar (`beside: false` laat hem weg).
- `chairs3.js` (via `chair` en `barStool`): `chair {style: "bistro-klap", color, folded}` houten klapstoel bistro (massief
  beuken, gelakt eiken / vintage hout met een eigen toon per onderdeel / zwart gebeitst; X-frame, zeven zittinglatten, drie
  gebogen ruglatten; ingeklapt ca. 6 cm, rechtop); `chair {style: "kunststof", color, legs, stack}` PP-kuip uit één stuk
  (lip, schotel, taille, in plan gebogen rug, opgerolde rand, afwateringsgaatje) op een zwart Ø20-frame, `stack` nestelt
  6,5 cm op / 2,2 cm terug; `chair {style: "polycarbonaat", color, translucent}` medaillonstoel met armleuningen uit één
  stuk: transparant = helder PC met Fresnel-gewogen stochastische dekking (vlakken helder, contouren en glans lezen), wit /
  zwart = glanzend opaak; `chair {style: "klapstoel", count, linked}` stoelen in een rij met zwarte stoelverbinders om de
  voorpoten; `barStool {style: "klap", color, back, folded}` inklapbare barkruk (Ø25 X-frame, voetsteun, kunstleren
  zitting en lage rug; ingeklapt ca. 12 cm, rechtop). Inklappen gaat met één helper (`foldFlat`): het achterframe draait om
  het kruispunt op de voorpoten, de zitting om zijn scharnier, daarna staat de platte stoel rechtop.
- `tableSets.js` (via `klaptafel {shape: "kwartrond", count: 4, diameter}`): vier kwartronden rond één middelpunt (cirkel
  Ø 305 met open midden), voegen van 6 mm.
- `stanchionGala.js` (via `stanchion {style: "gala" | "galerie", height, finish, rope, pair}`): luxe palen op een gietijzeren
  voet Ø 35 (getrapte koepel met kraal, vilt eronder), gala 100 cm met bolle kop, galerie 60 / 90 cm met platte kop, twee ogen
  per paal; afwerking goud (messinglook, haken in messing), chroom, zwart.
- `trolley3.js`: `kind: "steekwagen"` (Ø25-frame met handgreeplus, schep 40 × 30, twee luchtbanden Ø 26; `loaded` = stapel
  metalen stoelen met de rug tegen het frame) en `kind: "universeel"` (verzinkt plateau 60 × 60 of 120 × 60 met duwbeugel,
  per stapel twee verschuifbare beugels van ~155 cm in vloerrails, spanband; `loaded: "mixed"` = stapel stoelen + stapel
  barkrukken, beugels ertegenaan en de band erom).

### Overige (eenvoudiger, al bruikbaar)
`klaptafel {length,width,height,color,frame}`, `biertafelset {length,tableWidth,frame}`,
`gewichten {count,stacks,color}`, `haringen {count,length}`, `spanbanden {color}`, `wielset`,
`draagtas {height,color,logo}`, `prikkabel {bulbs,spacing,sag,on}`, `stretchtent {w,d,color,poles,anchors}`,
`stertent {diameter,points,height,color}`, `opblaasbareTent {w,legs,height,color,canopyColor}`.

### Onderdelen & accessoires (eigen bestanden, vervangen de stubs)
Gedeelde helpers in `js/partsKit.js` (profielen langs paden, banden/singel, zachte tassen `softBag` /
`lyingBag`, ritsen en handvatten `bagTools`, opgerolde stroken `rolledStrip`; materialen 600D-oxford,
klittenband, PVC-dekzeil, beton, kastanjehout, thermisch verzinkt met spangle, ABS, bedrukking uit
`brandPrints`). Sets liggen als nette flat-lay of 3/4-groep; elke bouwer stelt een iets hogere hero-hoek voor
waar het product plat ligt.

Ronde 2 (`js/softGoods.js`, alleen gebruikt door deze groep): **zachte waren als genaaid doek** en **metaal/kunststof
zonder naden of draaikolken**.
- `procSurface(mat, {kind})`: oppervlaktedetail in wereldcoördinaten in de fragmentshader (geen uv-naden, geen
  wervelpatroon van `stippleNormal`): `stipple` (gespoten kunststof, rubber, poedercoat), `cast` (zandgietwerk),
  `galv` (thermisch verzinkt: spangle-kristallen als facetten met eigen kanteling, glans en tint), `concrete`
  (zandkorrel, cementhuid-vlekken, kleine luchtbellen). Kant-en-klaar: `moulded`, `rubberSG`, `powderSG`, `aluSG`,
  `castSG`, `galvSG({pre})`, `zincSG`, `concreteSG`.
- Textiel: `fabric600` (600D oxford, basket-weave + garenlaag via de engine-`weave`/`macro`, glans getint door de
  verf), `thread`, `hookTape`/`loopTape`, `pvcTarp` (glanzend PVC-dekzeil met grof scrim).
- `creases(seed, families)`: gerichte plooien (rug/dal met richting, lengte, taps toelopend); `softBox(...)`: genaaid
  tastlichaam (afgeronde panelen, eindpanelen) met `disp`/`warp` voor plooien en uitzakken + `point(f, t)` voor
  ritsen, banden en stiksels; `stitches()`: rijen verhoogde steken; `rollStrip`/`stripPackshot`: opgerolde strook
  (lagen stapelen op de dikke klittenbandranden, telescoperen, vouwlijnen, golfjes) met trog voor de goot.
- `frameProxy`/`noFrame`: kadreren op een deel van de scène (beschermplaat: het blad, niet de hele tafel);
  `stochasticCover`: per-pixel gestratificeerde dekking over de frames.

| model | parameters | wat je ziet |
|---|---|---|
| `draagtas` | `height, color, wheels, logo, shape` | 600D-doek met plooien, paspel, stiksels, ritsen met schuivers. `wheels:true` wieltas: gegoten bak met wielkasten (band, spaaknaaf, asdop, spatbord), bindband, U-rits, handvatten met box-X-stiksel, `logo` op de voorkant; zonder wielen de beschermhoes die over het ingeklapte frame valt (valplooien, gesp onderaan, poten en voetplaten eronder); `shape:"duffel"` liggende, uitgezakte opbergtas met compressiebanden, wielbasis en trolleyframe |
| `easyUpParts` | `parts:[hoekstuk-premium, hoekstuk-professional, middenstuk-professional, schuifstuk(-professional), voetplaat-premium/-professional, staander-premium/-professional]` | zelfde constructie als `easyUpTent`; één `staander-*` ligt diagonaal op de vloer met een vlak van de zeskantbuis boven, hoge flat-lay-hoek zodat drie vlakken lezen |
| `tentCoupler` | `line, count` | dubbele klem: twee gegoten zeskantkragen (40/50 mm) met lijf, gesplitst met lippen, vleugelbout + moer; kleiner in beeld (klein onderdeel) |
| `tubeFittings` | `parts:[2-weg, 3-weg, 4-weg, 3-weg-grond, buis], tubeLength` | Ø 42 thermisch verzinkt (spangle): doorlopende buis of verstek met gelaste aftakkingen, klonterige lasrups langs de zadel-/verstekcurve, gelaste moer + vleugelbout; de verzinkte buis ligt achter de stukken en past helemaal in beeld |
| `connectionStrip` / `rainGutter` | `length, color, width` | opgerolde strook (dakdoek / PVC 650 g/m²) met klittenband en twee stiksels langs beide randen, gelaste eindzoom; strook ligt met golfjes en opkrullend eind, goot opent naar voren als trog met flenzen |
| `tentPoles` | `material (hout/alu), length, count` | kastanjehouten palen met pen, verzinkte banden en een rubber voetdop over de voet |
| `footCaps` | `count, type (statafel/klaptafel/barkruk)` | PE-doppen, rechtop, omgekeerd en op de zij |
| `haringen` | `count, length, type` | hoekijzer 30×30 thermisch verzinkt, liggend op één flens zodat de L leest, punt, rondstaal-haak in de binnenhoek gelast (≥ 40 cm), anders draadharingen |
| `gewichten` | `count, stacks, kg, color` | gietijzeren platen Ø 25 cm met sleuf, rand en gegoten `7,5 KG` |
| `wielset` | `count` | zwenkwielen Ø 100 mm met rem, zeskantkoker en vleugelbout |
| `sandbag` / `waterBag` | `count, color, filled` | gevulde zandzakken: uitgezakt op de vloer, ezelsoren, plooien vanuit de hoeken, lasnaad, klep met rits, klittenbanden open op de vloer / ringvormige PVC-waterzakken met vuldop; klittenband en gesp liggen over de spleet op de zak |
| `concreteBlock` | `weight (140/500/1000), lifting, forks` | betonblok met afschuiningen, verzinkte hijslepel (rondstaal-lus) uit een kom, heftruckgaten; kleiner in beeld met contactschaduw |
| `protectionDisc` | `diameter, print, onCover` | heldere PVC-plaat op een statafel met rok: softbox-reflectie als brede band, lichte glasrand; kadrering op het blad; `print` onder de plaat |
| `repairKit` | `kind (pvc/polyester)` | tube lijm, glanzende PVC-lappen met dikte en snijrand (één omkrullende hoek), schuurpad, stappenkaart |
| `airPump` | `kind` | elektrische pomp met manometer, slang, snoer en verloopstukken |
| `tubeBag` | `count, color` | buizentas 230 cm (buizen tekenen door), zachte doektas, koppelstukkentas met stijve bodem; paspel, ritsen, handvatten |
| `stretchParts` | `parts:[spanband, touwenset, paalverbinder, oogmoeren]` | één doorlopende ratelband: rol op de kant, draait plat, door de gesloten ratel, vast eind met J-haak; touwenset met RVS-ring en karabijnen, paalkap met oogmoer |
| `lightParts` | `parts:[fitting, eindkap, dimmer], color` | dezelfde E27-prikfitting als op de prikkabel (lightKit) op platte kabel, schroefdraad en contact zichtbaar; eindkap; stekkerdimmer met Schuko-contact, draaiknop en stekker |

Batch: `node renders/render.mjs --batch renders/batches/parts.jsonl` (alle 50 beelden van deze groep, achtergrond Linnen
`#ECE4D6` per regel, paden naar `catalog/images/`; preview: `--size 1200 --samples 16`).

Ronde 3 (art direction 18 oktober, `js/partsLook3.js`, eigen bestand; `softGoods.js`/`partsKit.js` ongewijzigd voor de andere
groepen): `cloth600` (mat gecoat 600D: zachte vezelglans, bijna geen spiegeling; de ronde-2-tassen lazen als glanzend rubber),
`pvcSatin` (zijdeglans PVC zonder vlekkerige coating-reliëf), `galvFine` (fijne, laag-contrast spangle, geen grote vlekken),
`castIron` + `plateLabelMat` (gegoten letters met kale, grijze ijzervlakken: `7,5 KG` leesbaar op zwart), `chestnutPole` (één
niet-herhalende hout-textuur per paal: vellen van de schaafmes, nerf, schorsresten, noesten), `ropeGeo`/`ropeMat` (3-strengs
geslagen touw), `gutterPackshot` (regengoot: het losse eind ligt als ronde U-goot), `decalOn` (kleine opdruk op een oppervlak).
- `waterBag`: twee gelaste PVC-ringpanelen als zware waterkussen (plat boven, lasflens buiten en binnen), knijpt bij de rechte
  spleet dicht tot een lasnaad met spanningsplooien, klittenband + gesp over de spleet, vuldop met `MAX 20 L`.
- `sandbag`: uitgezakt (lage las vlak boven de vloer, ezelsoren plat op de vloer, brede bult), klittenbanden over de bovenkant
  teruggevouwen; 2 × 2 met de lange zijde naar achteren.
- `draagtas`: mat doek; beschermhoes met een paar lange valplooien i.p.v. kreukels; wieltas: wielen met loopvlak en donkere naaf in
  een vastzittende wielkast, `detail` = achterkant onderaan van rechtsachter (beide wielen + tilhandgreep); `shape:"duffel"`: geen
  losse steekwagen meer, ingeschoven telescoopgreep in een behuizing op de wieleind.
- `easyUpParts` staander: zeskant met een ribbe boven (`spin` 30), ingeschoven (`collapsed`, zoals geleverd), diagonaal door het beeld
  (`yaw` −29), standpunt 24°; satijn-aluminium zodat de facetten elk een eigen waarde krijgen.
- `gewichten`: gietijzer (zwart gecoat, zandgietstructuur) met grote gegoten `7,5 KG` op kale grijze lettervlakken.
- `tubeFittings`: knolling (buis links, van de camera af; koppelstukken in een kolom ernaast); losse buis diagonaal.
- `protectionDisc`: hele statafel in beeld (geen uitsnede), softbox-reflectie weg van de opdruk; `stretchParts` touwenset: geslagen
  touw met oogsplitsingen; oogmoeren rechtop 2 × 2; `repairKit`: nette flat-lay van boven (48°); `haringen`: waaier.

Ronde 4 (22 oktober 2026, alle 112 catalogusjobs van de groep; gedeelde kleine hardware in `js/partsKit4.js`, eigen bestand:
`placeBin`, `threadRings`, `planarPath`/`bar`, `sHook`, `eyeBolt` (ook als houtschroef-oog), `wallPlug`, `turnbuckle`,
`snapHook`, `chain`, `roundPeg`). Nieuwe parameters:
- `tubeFittings {angle, lip, ground, corner, length, count}`: koppelstukken zoals de catalogus ze noemt. `3-weg` 140° = nokstuk
  (standaard), 110°/120° = dakrandhoekstuk (staander + één dakrandarm in verstek, dakbuis op 20°/30°), 180° = dakvlak (rechte
  buis + ligger); `4-weg` 110°/120° = dakrand (standaard), 140° = nokstuk met twee dakbuizen, 180° = dakvlak-kruis; `lip` = gelaste
  lip met boutgat onder de nok; `2-weg {length: 0.5}` en `{ground: true}` (gelaste haringlip); `3-weg-grond` = T-stuk,
  `{corner: true}` = grondframe-hoekstuk (nu in gebruiksstand, staanderarm omhoog); losse delen `voetplaat` (120 × 120 mm, koker
  Ø 42 met moer + vleugelbout, haringgaten), `klem` (klem nokversteviging: gesplitste band, boutoren, lip) en `knevelbout`
  (M8-vleugelbouten, `count`, twee rijen); `buis {count}` = bundel (3 + 2) met zwarte tape. Het dakrandhoekstuk kiest zelf de
  draaiing waarbij geen arm naar de camera wijst.
- `stretchParts`: `ronde-haring {length}` (Ø 25, slagkop, gelaste ring plat op de vloer), `haringtrekker` (hefboom met rubber
  greep, gelaste voetbeugel, ketting met grijphaak, naast een ronde haring), `paaldop {kind: 'rubber'}` (zware rubberen dop op
  zijn kant zodat de wand leest; standaard PE-dop), `voetplaat` (middenpaal, 400 × 400 × 8, kom met schotten), `haak` (vier
  S-haken), en de RVS-bevestigingsset schaduwdoek `spanschroef`/`karabijn`/`muuroog` (met plug), samen als knolling.
- `lightParts`: `eindhaak` (twee spanveren met karabijn en draadhaak), `koppelstekker` (rubber stekker + contrastekker met open
  klepje), `pendel {length, onCable}` (prikkop, ronde kabel, E27-rubberfitting; zonder `length` de 50 cm-pendel aan een stuk
  platte prikkabel).
- `footCaps {shape: rond|vierkant|ovaal, size (mm), angle: 'schuin'}`: doppen voor stoelen en barkrukken; `schuin` = schuine
  zool (één dop ondersteboven); een paar = rechtop + ondersteboven.
- `haringen {type: 'pen'}` (loperpennen Ø 4 met platte kop Ø 30, twee verspringende rijen) en `{type: 'oog'}` (stertent-haring
  Ø 16 met gesmeed oog).
- `concreteBlock {cover: {color}}` (passende hoes: plooien in de hoeken, paspel, hoeknaden, klittenbandzoom, sleuf met de
  hijslus erdoor), `{seat: {wood}}` (verlijmd hardhouten zitblad 80 × 80 × 10 op het kale blok, zonder hijslus) en
  `{part: 'truss-baseplate', size, thickness}` (verzinkte plaat met M16-gaten en vier conische trusskoppelingen). De hoes en het
  zitblad staan op het blok van 80 × 80 × 40 uit de accessoiretekst.
- `easyUpParts {parts: ['dwarsbuis'], length}`: Ø 25 aluminium dwarsbuis met twee scharnierklemmen voor de zeskantpoot (met
  buiszadel en duimschroef); de buis loopt het beeld uit (`noFrame` op het verre deel) zodat de klemmen leesbaar blijven.
- `rainGutter {clamps: 38}`: buizenframe-goot (ca. 35 cm, gelaste zomen, geen klittenband) met een rij losse klikklemmen voor
  38 mm buis.

Batch: `renders/batches/parts.jsonl` (112 jobs uit `catalog/export/image-jobs.json`, Linnen `#ECE4D6`, paden naar
`catalog/images/`). Waar twee catalogusvarianten dezelfde spec hebben, verfijnt de batch: paaldop `kind` (kunststof / rubber),
ronde haring `length` 1.0 / 1.2. Preview: `--size 1200 --samples 14`; finaal zonder overrides (2000 px, 40 samples).

### Verlichting en heaters (eigen bestanden, vervangen de stubs)
Gedeelde helpers: `js/lightKit.js` (hardware: E27-voet met echte schroefdraad, prikfitting `festoonSocket`,
platte kabel, `rubberPlug`, `euroPlug`, `legClamp`, `diecast`, `litDiffuser`), `js/lightGlow.js` (licht
zonder ruis), `js/bulbKit.js` (G45-lampen die echt branden), `js/heatGlow.js` (ronde 4: hete delen die
*aan* lezen) en `js/poleMount.js` (ronde 4: klemproducten gemonteerd op een stuk easy-up-poot).

**Aan = aan (ronde 4, `js/heatGlow.js`).** Wat gloeit of brandt is het verkoopargument van deze groep, dus:
- *Kleur in uitvoerruimte.* Een emissive van 6 x oranje wordt door de neutral-curve tot bleek perzik
  (de "roze plastic" heaters). `EMBER_GLSL` (`ember(h)`: dof rood, roodoranje, oranje met een gele rand)
  geeft radiantie die na de toonkromme verzadigd oranje blijft; de flamegeometrie idem.
- *Licht op de omgeving.* `spill(material, bronnen, {env})` kloont een materiaal met een emissive term
  `kleur x I x facing^p x R^2/(R^2 + d^2)` vanaf lijnbronnen (segment A-B in het objectframe van het
  onderdeel, dus een gekantelde kop neemt zijn licht mee; `twoSided` voor platen waarvan de normaal beide
  kanten op kan wijzen) en dempt in hetzelfde shaderstuk de studioreflectie (`env`), zodat de gloed
  draagt. Bewust geen `userData.envSpec`: de engine-hook vervangt dan de program-cache-key van het materiaal.
- *Let op bij eigen shaderpatches*: declaraties en functies vóór de shadertekst plakken brak de compilatie
  van het straalscherm (`'#' : invalid character`; het onderdeel verdwijnt stil, zo zag je bij de oude
  heaters alleen de bloom). Voeg ze na `#include <common>` in en render één keer met `--verbose`.

**Licht zonder ruis (`js/lightGlow.js`, `GlowComp`), zonder engine-aanpassing.** De compositie kent geen
gemengde transparantie; de eerste lichtbeelden tekenden glas en gloed daarom met *stochastische dekking*,
wat bij 16-40 frames korrel gaf in elke halo, lamp en vlam. Nu voegt elk lichtproduct één `GlowComp` toe.
Zijn combine-mesh wordt als laatste van elk frame getekend (transparante lijst, `renderOrder` 1000) en doet
vlak daarvoor (`onBeforeRender`): (1) `blitFramebuffer` van het frame tot dan toe naar een kopie;
(2) drie eigen passes met dezelfde gejitterde camera: *inner* (spiegeling van de glaswanden, filament- en
volumegloed, vlammen; additief), *trans* (RGB-transmissie van glas en amberwaas; vermenigvuldigend) en
*bloom* (halo's: kleur + dekking); (3) per aangeraakte pixel de eindradiantie: onder het glas
`onder × T + inner`, en bloom en lichtplassen gemengd naar de lichtkleur **in uitvoerruimte** (zoals een
gefotografeerde gloed, niet opgeteld tot wit). Voor vloer/achtergrond rekent hij de radiantie terug met de
inverse van de Khronos-neutral-curve, zodat `achtergrond × schaduwratio` exact blijft. Glas wordt in de
beauty-pass gemarkeerd met `marker`-meshes (`renderOrder` 1: RGB blijft, alpha +4), dus alleen zichtbaar
(diepte-getest) glas krijgt reflectie en doorkijk. Alles is analytisch of geometrisch: 1 frame of 40 geeft
hetzelfde gladde resultaat. API: `glass(geo, {T, env, rough})`, `halo`, `haloTube`, `volume({sigma})`,
`line` (filament), `surface` (vlam), `floorPool(sources, {k, max, occl})`, `build(centrum)`.
De oude stochastische helpers (`haloSpheres`, `floorGlow`, `clearGlass`) blijven in `lightKit` voor
andere groepen (opblaastent).

**Brandende filamentlamp (`js/bulbKit.js` `g45`):** echt helder glas (bol en steel), vier filamenten met een
witheet-gele kern en amber gloed eromheen (lijngloed in de inner-pass), een amberen waas in de bol die blauw
en groen absorbeert (`volume` met `sigma`) en een zachte amberen bloom; uit: fosforgele strips achter helder glas.

| model | parameters | wat je ziet |
|---|---|---|
| `prikkabel` | `bulbs, spacing, sag, on, cable (zwart/wit), lamp (filament/opal/colour), lamps, plug, layout` | **hero (`layout: 'hanging'`, standaard voor hero/back/side)**: de run hangt zoals hij gebruikt wordt, in bogen (`sag` m diep) onder een gespannen gegalvaniseerde spandraad, met zwarte tie-wraps om de 2 fittingen (3 bij 50 cm), elke fitting loodrecht met de lamp omlaag; de draad loopt licht af van de camera. Camera langs de run vanaf ooghoogte onder de draad (az 34, elev -5, 30 graden lens): de dichtstbijzijnde lamp groot rechtsboven (fitting, E27-hals, filamenten en gloed leesbaar op thumbnailformaat), de run wijkt naar linksonder, alle lampen in beeld, aanloopkabel en draad lopen het beeld uit. De kadrering wordt in de bouwer opgelost (de auto-kadrering convergeert niet voor punten die zo diep liggen) en als vlak proxyvierkant aan de engine gegeven. **Banner (`front`) en collectiebeeld (`detail`): flat-lay**: de hele kabel ligt gecentreerd op de studiovloer in een losse slang (rijen dwars door het beeld met ronde keerbochten, ~3 cm natuurlijke slingering, licht gebogen rijen); aantal rijen en rijafstand volgen uit de kabellengte zodat de opstelling ~80 % van een vierkant (hero, 30° hoog) of een banner van 1800 × 1100 (`front`, 28°: alle lampen in beeld) vult. Elke fitting ligt op zijn kant (kop, lip en bol raken de vloer, as ~4° omhoog), de platte kabel draait over ~15 cm op zijn kant de kop in; lampen wijzen naar de camera, elk met een warme lichtplas voor de bol (achter de fitting beschaduwd). Stekker op de vloer rechtsvoor, eindkap achteraan. `detail` = sfeerclose-up van de middelste rijen (collectiebeeld) |
| `ledBulb` | `type (melkglas/filament/gekleurd), on, count, colors` | G45 E27 rechtop op het contact; gekleurd = set van 5 in twee verspringende rijen in regenboogvolgorde, met gekleurde lichtplassen |
| `ropeLight` | `color, length, on, diameter, cord` | lichtslang Ø 13 mm, 36 LED's/m (emissief patroon), ~3,5 losse lussen die over elkaar heen klimmen, connector + snoer + eurostekker, heldere eindkap (echt glas) |
| `stringLights` | `kind (kerst), count, spacing, length, on, color, wire` | twee getwiste aders, lamphouder + 5 mm LED per 10 cm; elke houder ligt op zijn kant, 25-55° van de draad af, afwisselend links en rechts (de draad loopt de voet in); losse rozet van lussen, 31 V-stekkertrafo |
| `floodLight` | `watt, on, clamp, color, mountedOn` | gegoten behuizing met 13 diepe koelribben, verdiept aluminium LED-board met 8 × 6 SMD-LED's die wit branden met elk een zachte gloed op het board, opstaande rand met helder gehard dekglas (echte reflectie), U-beugel met sterknoppen. **Standaard (klem) gemonteerd**: pootklem om een stuk zeskant easy-up-poot (loopt het beeld uit), beugel als vork op de klemstud, lamp 18 graden omlaag en iets naar links gedraaid zodat koelribben en klem in beeld zijn (`js/poleMount.js`). `clamp:false` = staand op de beugel; `mountedOn:"leg"` = gemonteerd zonder eigen poot (de tent levert die) |
| `heater` | `kind, style (paddenstoel/flame/lounge/tafel), watt, on, clamp, color, mountedOn` | zie kop van `models/heater.js`. RVS: geborsteld (anisotroop, korrel in de lengte) in de studio-omgeving. Paddenstoel/tafel: straalscherm in verzadigd oranje (`ember`) met fijne perforatie, geprägede ribben, drie naadstrips, donkere randen en een hetere band boven het midden; onderkant reflector oranje aangelicht, beschermstangen donker (hittegetint) met oranje flanken, bloom en een warme lichtplas op de vloer (de fles schaduwt eronder); camera op ooghoogte (elev 3-4) zodat de onderkant van de reflector in beeld is. Flame/lounge: vlam als licht in een echte kwartsbuis (de vlam dekt de achtergrond af, licht getinte buis), amberen gloed in de buis, palen/frames/bovenplaat aangelicht, bloom en vloerplas. Elektrisch: standaard gemonteerd op een stuk easy-up-poot met de klem (vork-beugel, 12 graden omlaag, iets van boven zodat de klem achter de behuizing zichtbaar is); de goudkleurige goot vol licht rond een witgouden buis |
| `heaterCover` | `color, zip, heater` | 600D-hoes (`softGoods.fabric600`) over de paddenstoelheater, tot op de vloer: strak over de reflector, schoudernaad en vier paneelnaden als opstaande naad met plooigroefjes en dubbel lichtgrijs contraststiksel, de zachte vouwlijnen van een nieuwe hoes uit de verpakking (onregelmatig), valplooien; #8-spiraalrits (zwarte band, glanzend grijze spiraal, twee stiksels, grote zinken schuiver met koordlus), ronde opgerolde zoom met het koord erin, trekkoord lichtgrijs uit een oogje met een tonvormige koordstopper die voor de zoom op de vloer ligt en eindkapjes; singelband-handvat op de top (box-X) |

Batch (1200 px preview, 14 frames, Linnen): `node renders/render.mjs --batch renders/batches/lighting.jsonl`.

### Merchandising review (18 oktober 2026): beelden per kleur en de laatste producten zonder beeld
- `statafelCover {type: "kleed", drop, over: "stretch", underColor}`: `drop` (m) = kort kleed onder de bladrand in plaats van tot
  de grond (statafelkleed Ø 130 op Ø 80: `0.25`); `over: "stretch"` zet er de statafel met een stretchrok in `underColor` onder.
- `statafelCover {type: "kleed", square, squareRot}`: vierkant kleed met zijde `square` (m, 140 x 140 cm = `1.4`): korter
  aan de zijkanten, vier punten die lager hangen; `squareRot` (graden, standaard 45) = richting van een punt.
- `statafel {noTop: true}`: alleen het onderstel (kruisbeugel en scharnier blijven, geen blad), voor onderdelenfoto's.
- `statafelCover {topcoverPrint: "stripes-rwb" | "voetbal"}`: bedrukte topcover (rood-wit-blauwe banen of voetbalprint, vlak
  over het blad geprojecteerd), voor de oranje themarok.
- `carpetRunner {width, length, lying, color}`: loper van naaldvilt, achteraan losjes opgerold, het eind ligt vlak naar voren
  (`js/softGoods.rollStrip`).
- `seatCushion {color, w, d, h, ties}`: zitkussen 40 x 40 cm met bies boven en onder en twee strikbandjes.
- `sideWall {length, height, color, type: "panorama" | "window" | "closed", zips, poles, rail}`: losse PVC-wand met een echte
  raamopening (helder PVC), gelaste zomen, ogen bovenaan, ritsen langs de zijkanten; `poles: 2` = startwand stretchtent tussen
  twee houten palen, `rail: true` = aan een bovenrail (overkapping).
- Kleurvarianten worden gerenderd op 1200 px, 16–20 samples, achtergrond Linnen `#ECE4D6`, met dezelfde camera als de bestaande
  hero van het product, zodat een klik op een swatch niet verspringt. De cadeaubon is geen render maar een vlakke kaart:
  `python3 catalog/tools/giftcard.py catalog/images/cadeaubon-hero.webp`.

### Tents-other ronde 3 (18 oktober 2026)
- `opblaasbareTent {w, shape: "hexagon", height, color, canopyColor, legs: "water", walls, awning, canopyPrint, light, skipGuys}`
  is herbouwd als **X-frame met zichtbare luchtbuizen**: per hoek één doorlopende dikke buis (Ø 30 cm op 3 × 3, Ø 36 op 4 × 4,
  Ø 46 op de zeshoek van 8 m) die van een bolle voet recht omhoog gaat, door een grote elleboog (straal 0,7–1,25 m, opgebouwd
  uit gelaste segmenten met een naad en een lichte insnoering per segment) naar binnen buigt en als dakboog naar een ronde
  knoop in de top loopt. Het dak hangt **onder** de bogen (de buizen liggen er als dikke ronde ruggen op), de dakrand tussen
  twee poten is een gespannen boog met een smalle bedrukbare band eronder, zodat de zijkanten als bogen lezen. Wanden vullen de
  boog, de luifel hangt aan de band. Alle kleur- en pootvarianten van één maat hebben exact dezelfde kadrering: scheerlijnen en
  haringen tellen niet mee, een vaste footprint (poten + 0,3 m) wel. `skipGuys: "left" | "right"` laat de scheerlijnen aan die
  kant weg (twee tenten met een tunnel). `opblaasbareTunnel {length, color, tentW}` leidt zijn maten af van dezelfde tent.
- `canopyRoof {display: "folded"}`: opgevouwen dak als zeven zachte, met lucht gevulde vouwlagen (afgeronde vouwranden rondom,
  lagen die niet precies op elkaar liggen, kreukels en een vouwlijn op de bovenste laag, zoom met dubbel stiksel).
- `stretchtent` `angle: "low"`: de camera staat **onder het doek** op ooghoogte en kijkt langs de middenpaal omhoog de piek in
  (doek doorschijnender van onderen, meer vulling).
- Wit doek leest wit (belicht ~246–251 op 1200 px, zoals de easy-up): wit stretchdoek belichting 0,98, witte stertent 0,86,
  carport `tentRig2` + 0,72, witte marktkraam 0,6, wit overkappingzeil 0,7. Overkappingzeil hangt met diepere festoenen
  tussen de ogen en lange golven naar de vrije zoom (geen plaat); gordijnen tuinpaviljoen: zachte ronde plooien bij de
  ringen die onder de band overgaan in een paar brede, onregelmatige plooien (geen zigzag).
- Batch (alle 99 beelden van deze groep, eindkwaliteit 2000 px): `node renders/render.mjs --batch renders/batches/tents-other.jsonl`;
  de preview-run gebruikt 1200 px, 14–32 samples en `rig.groundAO {samples: 32, keySamples: 32}`.

### Tents-other ronde 4 (18 oktober 2026)
- **Batch uit de jobs**: `python3 renders/tools/batch_tents_other.py [--preview]` schrijft `renders/batches/tents-other.jsonl`
  (eindkwaliteit, 2000 px) of `tents-other-preview.jsonl` (1200 px, 16–40 samples) met **alle** jobs van de groep uit
  `catalog/export/image-jobs.json` (161), plus de vertalingen die de catalogusspec renderbaar maken: `series` voor de
  buizenframe-lijnen als de job hem niet meegeeft, de verbindingstunnel als eigen item met deurwanden, de advies-banner
  met de tenten verder uit elkaar (scheerlijnen kruisen niet meer).
- `frameTent {stripes: 'wit'}`: tweekleurig doek (Grijs-wit, Rood-wit, …): banen van 50 cm in `color` en `stripes` over
  dak, luifel, gevels én wanden, doorlopend van wand naar dak (naden op de baangrens). `series` onderscheidt de
  producten zichtbaar: `550-compleet` stormbanden met ratels, `550-premium` grondframe + nokversteviging, `620` zijhoogte
  2,2 m, `basis` PE, `500` kaal frame. De skeleton (`catalog/tools/skeleton/fam_acc.py`) geeft `series` nu mee.
- `opblaasbareTent`: zeshoek wordt bijna recht op een zijde en hoger bekeken (azimut 12°, elevatie 24°), zodat de zes
  bogen en poten als zeshoek lezen; `walls: {right|left: 'tunnel'}` = wand met boogvormige deuropening + aanzetrand en
  rits; `height` onder de elleboog (de zijwand-Pro-spec geeft 2,5 m wandhoogte mee) wordt genegeerd; `wallColor`.
  LED-lamp: antraciet armatuur Ø 22 cm, 4000 K, recht van onder in het kruis van de bogen, belichting 0,3.
- `opblaasbareTunnel`: tunnel met rechte stijlen en een halve-ellips gewelf (`tunnelDoor()`), twee luchtbogen als ribben
  buiten op het doek (één met ventiel), doek hangt door tussen de bogen; sluit aan op de deurwanden van beide tenten.
- `canopyRoof {display: 'folded'}`: één dun vel in 13 lagen zigzag gevouwen (U-vouwen links/rechts, losse randen voor en
  achter), standaard mat polyester. Bedrukt dakzeil zonder `note` en zonder `withFrame`: **los dak** zwevend boven de vloer
  met zachte schaduw (geen frame).
- `gardenPavilion {part: 'footings'}`: funderingsset (betonpoer met voetplaat en paalschoen, verstelbare voet, grondanker
  met schroefblad) naast elkaar; gordijnen opnieuw: plooidiepte volgt uit de stofbreedte, onregelmatige plooien, onder de
  embrasse een smalle kolom (geen zandloper), nooit buiten de rail.
- `stretchtent` `low`: oog in het kwadrant rechtsvoor onder het doek, middenpaal heel in beeld tot in de piek.
- `tarp` transparant: dichtere folie met lichte tint, bredere reflectieband, melkwitte zomen.
- `marketStall`: `frame`/`frameColor` (bv. `zwart`), `valance: 'kartel'` (kartelrand: ronde schulpen voor en achter),
  `only: 'kap'` (los dakzeil op het kale frame zonder werkblad, van linksvoor), `skirt: <kleur>` (geplooide rok om de
  voorkant en zijkanten van de toonbank, klittenbandstrook bovenaan).
- `stertent {wallPrint: {artwork}}`: full colour bedrukte zijwanden (voorbeeldontwerp op de dichte band onder de
  panoramavensters); `wallColor` los van de doekkleur.
- 620 Professional (`frameTent {series: '620'}`): hero laag langs de gesloten tent met de rechtergevel opgerold
  (azimut 58°, elevatie 9°), zodat de 2,2 m zijhoogte leest en het beeld niet meer gelijk is aan de 550 Premium.

### Tents-other ronde 5 (22 oktober 2026)
- `frameTent {gableDoor: 'left' | 'right'}` (eindwand): die gevel wordt gesloten door **één eindwand over de volle
  breedte** (de gevel­driehoek van het dakzeil sluit hem tot in de nok) met een **doorgang in het midden** tussen twee
  verticale ritsen met gelaste verstevigingsbanden; `door: 'open'` rolt het deurpaneel op onder de dakrand met twee
  oprolbanden; ogen in de onderzoom voor haringen. De lange zijde krijgt dan geen deur. Camera (hero én front) op de
  gevel vanaf 70° (standaard de linkergevel: het sleutellicht strijkt over de eindwand, de lange zijde wijkt in het
  zachte zijlicht). `batch_tents_other.py` zet `gableDoor` op alle `eindwand-en-tussenwand-partytent-*`-jobs (de
  catalogusspec liet anders de lange zijde zien, niet het product).
- Rollen van tweekleurig doek (`frameTent`, opgerolde deur/wand): de bemonstering langs de rol krijgt een
  hoekpuntpaar op elke baangrens, dus de banden lopen strak om de rol (geen zaagtand waar een baan van kleur wisselt).
- `opblaasbareTent {walls: {back: 'print'}}` of `wallPrint: {artwork, side}`: full colour bedrukte wand in de boog,
  het voorbeeldontwerp rechtop en niet gespiegeld zoals je hem van buiten ziet (embleem in het midden, tekst onderaan).
  Een tent met wanden wordt bekeken van de kant waar de wand **links in beeld, aan de kant van de softbox** staat
  (bij gelijke stand: zelfde aantal wanden van buiten): de wand is het product van die beelden en zijn kleur moet
  lezen (grijs las als antraciet in de schaduw van de boog).
- `stertent {wallPrint}`: alleen de buitenkant bedrukt; 4 mm binnen de bedrukte band ligt een effen binnenzijde,
  zodat je door de panoramavensters op de verre wanden de witte achterkant ziet en geen gespiegelde print.
- `marketStall {skirt}`: zachtere, onregelmatige plooien (flanken ~±30°, geen golfplaat) en een bredere softbox die
  op de toonbank mikt, zodat een witte rok wit leest (was ~150–190, nu ~200–230).
- Nieuwe jobs uit de catalogus v2 (kleurvarianten: tweekleurige buizenframe-lijnen, eindwand, zijwand opblaasbare
  tent 3 m en Pro, dakzeil en rok marktkraam, kartelrand, carport grijs/groen, hypar grijs/rood/zwart, full-colour
  zijwanden stertent) renderen met de bestaande parameters; achtergrond blijft Linnen `#ECE4D6` (brand tokens
  `backdrop`), zoals alle catalogusbeelden.
- Preview (`batch_tents_other.py --preview`): 1200 px, 12–28 samples (buizenframe met wanden 16, stertent met
  wanden 28, paviljoen 18, transparant zeil 20) en `rig.groundAO {samples: 32, keySamples: 32}`; op de gedeelde
  machine kost een frame van 1200 px ~4–5 s en de vloerbake plus shaders ~1 min per job.

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
| `detail` | per product | | close-up van het kenmerkende detail (tent: de hoek rechtsvoor van ~17° boven de dakrand, met scherptediepte; tent met deur: hoekpoot + banden + voetplaat + half open deur; statafel: klapmechaniek; stretchrok: bladrand + tricot; strik: de strik). `detail-<naam>` kiest een benoemde close-up uit `details` van de bouwer (bv. `detail-scharnier`, `detail-voet`) |

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
   omgezet naar `exp(-h / 3 cm)` en vervaagd: donkere, zachte randjes waar voeten en zomen de vloer raken;
4. optioneel een **brede contacthalo** (`contact.wide`): een tweede hoogtepass die ook *contact-proxy's*
   ziet, `exp(-h / h0w)`, Gaussisch vervaagd tot `sigma` meter (tap-afstand verdubbelt per pass, geen
   banding). Een model kan zo'n proxy toevoegen als mesh op render-layer 3 met
   `userData.contactProxy = true` (en `noFrame`): onzichtbaar in beeld en in alle schaduwkaarten, alleen
   de vloer ziet hem. De tent legt er een langs elke wandzoom (strook waarvan de hoogte met de afstand tot
   de zoom oploopt) → een AO-halo van ~10–25 cm langs de wandvoet, binnen en buiten.

De vloer krijgt de fractie licht die hij ontvangt; de compositie zet de achtergrondkleur × die fractie
neer en tone-mapt alleen het product (Khronos PBR Neutral: kleuren blijven productecht). Buiten de
schaduw is de achtergrond daardoor **exact** `--bg` (geen dither), zodat beelden naadloos op een
gelijkgekleurde productkaart staan.

`rig`-overrides (alle velden optioneel):

```json
{ "exposure": "auto", "exposureAuto": { "ref": 0.2, "base": 0.86, "power": 0.22, "min": 0.6, "max": 1.25 },
  "toneMapping": "neutral|agx|aces|linear", "shoulder": 0.76, "toe": 1, "envIntensity": 0.9,
  "key":   { "azimuth": -48, "elevation": 56, "intensity": 3.0, "cone": 10, "mapSize": 2048 },
  "dome":  { "count": 2, "intensity": 1.6, "maxZenith": 62 },
  "fill":  { "azimuth": 72, "elevation": 18, "intensity": 0.35 },
  "rim":   { "azimuth": 160, "elevation": 38, "intensity": 0.6 },
  "bounce":{ "intensity": 0.5 },
  "groundAmbient": 0.25, "shadowStrength": 0.92, "keyShadow": 0.4,
  "groundAO": { "strength": 0.8, "samples": 64, "keySamples": 64, "res": 1024, "blur": 2.2 },
  "contact":  { "strength": 0.62, "h0": 0.03, "res": 512, "blur": 1.6,
                "wide": { "h0": 0.05, "sigma": 0.028, "strength": 0.42 } },
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
- `shoulder` (alleen `neutral`) — waar de hooglichtcompressie begint (Khronos-standaard 0,76). Wit doek
  gebruikt 0,88: het bovenste bereik blijft lineair, zodat de gradiënt van het belichte dakvlak niet in
  vlak papierwit verdwijnt.
- `toe` (alleen `neutral`, standaard 1) — schaal van de zwartniveau-toe van Khronos PBR Neutral. Die toe trekt
  het kleinste kanaal naar 0 (lineair 0,008 → 0,0004): een rood doek wordt dan digitaal puur rood zonder vorm
  in de schaduw. 0,5 voor verzadigde verfkleuren (statafelrokken); neutrale producten houden 1 (diep zwart).
- `cove` (m, standaard 0,35) / `wallBake` — bij een wandvanger (`userData.catcher`, de sweep waar een product
  tegen leunt) wordt de wand gebakken als de vloer (`groundAO.wallSamples`, `wallRes`); vloer en wand buigen
  hun normaal binnen `cove` naar 45°, zodat de schaduw naadloos doorloopt. `wallBake: false` = de oude live
  wandvanger (schaduwkaarten per frame).
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
- `interior` — `{ box: [cx, cz, hx, hz], top, k, kNear, amb, ambNear, floor, floorNear, fall, openings,
  feather }`: een omsloten ruimte (tent met ≥ 3 hangende wanden). Materialen met `userData.interior` (al het
  tentdoek, garen en vensterfolie) bepalen per fragment of ze binnen de box liggen én naar binnen kijken
  (binnenkant wand, onderkant dak); daar worden de niet-schaduwwerpende lichten (fill, rim, bounce) en de
  omgevingsbelichting vermenigvuldigd met `k` (verre hoeken) tot `kNear` (bij een opening), en komt er een
  gespiegelde binnen-ambient bij (`amb` → `ambNear`, radiantie, × `envSpec` van het materiaal: zwart doek
  leest alleen via die glans). `openings`: `[[x, z, gewicht], …]` (max 6; open deur, ramen); de nabijheid van een
  opening valt af over `fall` m. De vloer binnen de footprint gaat × `floor`, bij een opening tot `floorNear`
  (zachte rand van `feather` m). Zonder `interior` verandert er niets.
  Materialen met `userData.interiorSolid` (`{k, kNear}`; frame-onderdelen binnen een tent met vier hangende
  wanden: schaartruss, bouten, knoopblokken, middenpaal, dakspanten) worden binnen de box gedimd **ongeacht hun
  richting**: omgevingslicht en de niet-schaduwwerpende lichten × `k` (0,22) tot `kNear` (0,55) bij een opening.
  Een trussfacet dat naar de camera kijkt (door een raam of de deur gezien) spiegelt in werkelijkheid de donkere
  binnenkant van de tent, niet de studio: zo leest het frame binnen als donker satijnstaal met een paar zachte
  hooglichten, geen lichtgrijze staven of glinsterende boutkoppen (die als witte stipjes door de ramen staken).
  De poten houden het studiolicht: die staan in de klittenband-hoekslippen en zie je van buiten.
- Materiaal-`userData` die de engine begrijpt: `envSpec` (sterkte van de omgevingsreflectie),
  `translucency` (doorschijnend doek), `macro` (tweede normaallaag), `weave` (`{repeats, boost, roughVar,
  matte}`: afstandsafhankelijk weefselreliëf + glansvariatie), `stochasticAlpha` (doorkijkfolie),
  `interior` / `interiorSolid` (zie boven), `dye` (0–1: geverfd doek wordt in de schaduw dieper en verzadigder),
  `sheet` (`{L, H, c, strength, dir?, sigma?, wave?, mod?, off?}` op folie met alphaMap: één reflectieband per
  raam; `dir` = normaal van de band in het (s, y)-vlak van het paneel, `sigma` = halve breedte in m, `wave` =
  golving, `mod` = helderheidsvariatie langs de band; standaard de oude brede, licht golvende band), `envFlag` (`{k, a0, a1}`: zwarte vlaggen voor kaal metaal: omgevingsreflectie × `k` waar de
  gereflecteerde straal tussen `a0` en `a1` graden naast de camera wijst; zeskantfacetten wisselen licht/donker).
- `backdropShade` — `{ at: [x, y, z], rx, ry, k }`: een zachte, iets donkerdere zone van de achtergrond rond het
  geprojecteerde punt `at` (Gauss met stralen `rx`/`ry` als fractie van het beeld, diepte `k`), die naar de
  beeldrand uitloopt naar exact `--bg` (rand van 12 %). Wit doek gebruikt `k` 0,055 achter de kap, zodat het
  belichte silhouet (~246) tegen een achtergrond van ~226–232 blijft staan; de tegelranden blijven #EFEDE8.
- `bounce.azimuth` / `bounce.elevation` (camera-relatief, elevatie < 0 = van onderen): maakt van het
  vloerkaatslicht een lage reflectiekaart vóór het product (wit doek: valance licht ophalen).
- Render-info (`--json`) bevat `probes`: meetpunten die een model in `meta.probes` meegeeft
  (`{naam: [x,y,z] | [[x,y,z], …]}`), geprojecteerd naar beeldpixels.

**Tentbelichting** (voorgesteld door `easyUpTent`, `tentRig()` in het model): studio-omgeving (`env:
"studio"`); sleutel als softbox-spot op 1,78× de halve productdiagonaal van links-voor (−72° t.o.v. de
camera = −38° in de wereld bij de hero, 32° hoog), **gevederd**: een zachte bundel van 40° met volle
penumbra op het voorste dakvlak. Hij scheert over dat vlak, zodat de holte tussen spant en graat als
licht-donkergradiënt leest, en valt af naar de linkergraat, de top en het verre vlak — zo komt het
belichte silhouet van een wit dak los van de achtergrond door afval in plaats van erin weg te lopen.
Vulling van rechts-áchter (100°, 12°): die raakt het voorvlak niet (een vulling van rechts-voor heft de
gradiënt van de holte op) en geeft het verre vlak een eigen, donkerdere waarde met gradiënt. Hemelkap 2,4
naar de sleutelkant gekanteld (25°), vloerschaduw van bijna recht boven (`floorKey`), `keyShadow` 0,46.
Wit doek: `neutral` met `shoulder` 0,88, een hogere key (−70°, 40°, op 2,3×, gericht op `aimRel`
[0,28, 0,8, 0,4]: hoog op het vlak naar de nok, zachte bundel 38°) zodat het belichte vlak gelijkmatig naar
links en naar de dakrand afvalt, vulling 4,4, een lage reflectiekaart vóór (`bounce` −20°/−25°, 3,6) die de
valance en het afgewende vlak naar ~212–225 tilt, `backdropShade` achter de kap, belichting 0,52 (detail 0,58).
**Andere kleuren: hetzelfde licht en `auto`** met `max` 0,72 voor middenkleuren en **1,02 voor donkere kleuren**
(zwart, antraciet, donkerblauw), plus voor donker doek een brede zachte scrim hoog achter de set (180°, 72°,
90 × 26°, 2,2) die de naar de camera gekeerde dakvlakken als één glansband spiegelen. Vulling 3,0 (afgewende
vlakken ~50 % van het belichte vlak: diepere schaduwtint). **Met wanden:** de key-bundel is 60° en op halve wandhoogte gericht (de wand aan de
key-kant krijgt licht tot aan de zoom), en de studio krijgt per wand een grote zachte kaart op de plek die de wand
spiegelt: een verticaal vlak, van 17° boven gezien, spiegelt de studio ~15° ónder de horizon op twee keer zijn
hoek met de camera (linkerwand ~−68°, rechterwand ~+112°). Zwart doek leest bijna alleen via die glans (diffuus
1,6 %), dus de kaart aan de key-kant is sterk (zwart 16, middenkleuren 7, wit 3,4; afgewende kant 1,7 / 1,3) en
staat iets naar de camera toe (−52° / +100°, 40° / 36° breed, zachte rand): elke wand spiegelt de aflopende
schouder van zijn kaart, dus één brede glansgradiënt per wand, en elke valplooi (een paar graden kanteling)
verschuift die gradiënt tot een zachte licht/donker-baan. Belichte wand zwart ~66, afgewende ~31: de twee
vlakken van de hoek scheiden, en plooien, paneelnaden, de zoom op de vloer en de velcrosleuven lezen. Studio-omgeving: twee hoge striplichten links (−100°) en rechts (136°)
voor de zeskantpoten. Vloer: `groundSplit` met `shadowFloor` 0,6, een strakke contactschaduw (`h0` 3 cm) en een brede
contacthalo (`wide`: `h0` 5 cm, σ 2,8 cm, sterkte 0,42); met wanden is de hemelocclusie sterker (0,5).
`front` krijgt een eigen scherende key van links (−50°, 30°) die het vlak op de spantnaad splitst, zonder
vulling en met de hemelkap naar links gekanteld (de schaduwkant blijft los van de achtergrond); `detail`
een richtingslicht met een lichtere vulling (3,5), bij een deur scherend van opzij.

Gemeten (sRGB-luminantie; achtergrond #EFEDE8 = 237):

| beeld | meting |
|---|---|
| **r8 (18 okt 2026, 2000 px)** | |
| `tent-3x3-wit-hero` | belicht dakvlak 246 (240–249), afgewend 222 (213–224), valance belicht 234 / afgewend 211; achtergrond naast de kap 232–236 (`backdropShade`), beeldrand exact 238; schaarkruis ~12 cm onder de zoom |
| `tent-3x6-zwart-zijwanden-hero` | belicht dakvlak 67 (49–75), afgewend 33; belichte wand 66 (54–71), afgewende 32; valance 77 / 45; dichte deur 69; ramen 40 (donkere binnenkant 9–20, reflectieband tot ~110) |
| `tent-3x6-zwart-zijwanden-detail` | wand 65 / zijwand om de hoek 39; binnenkant door de deur 15–24; voetplaat, banden en hoekpoot in beeld |
| `tent-3x3-rood-professional-gewichten-hero` | belicht dakvlak 75, afgewend 48; valance 56 / 50 |
| *eerdere rondes* | |
| `tent-3x3-wit-hero` | belicht vlak tot 246 (holte 221 → 246 van graat naar spant), rechterhelft voorvlak 227–236, afgewend vlak 204–221; silhouet links ≥ 15 niveaus onder de achtergrond (mediaan 218), rechts ≥ 23 (mediaan 208) |
| dak-close-up 34°/35° | elk half paneel een gradiënt: voorvlak 219 → 245, afgewend vlak 188 → 205 en 193 → 218 |
| `tent-3x3-wit-front` | linkerhelft 243–249, rechterhelft 207 → 228 (holte); silhouet links +6…12, rechts −9…−14 |
| `tent-3x6-zwart-zijwanden-hero` (r7, oud) | belicht dakvlak ~43, afgewend ~18; **belichte lange wand ~43** (één brede zachte glans, 37 → 46 over de lengte), **afgewende korte wand ~23**, dichte deur ~46 (rits, stormflap, deurbanden lezen van buiten), PVC-ramen ~32 (rookfolie over de schemerige binnenkant, geen witte kaart) |
| `tent-3x6-zwart-zijwanden-detail` | opgerolde deur: binnenkant door de opening ~22 (geen zwart gat); de schaartruss erachter donker satijnstaal (alleen de diagonaal die licht door de deur vangt licht op); wanden ~45–55 |
| toonbewaking 3×3 Premium hero | belicht dak zwart 48 / antraciet 82 / grijs 136; afgewend zwart 19; valance zwart 28 ≤ frame 46–54 (gemiddeld over de buis); zie `tools/check-tent-values.py` |
| `tent-3x3-wit-hero` (r7) | belicht vlak ~246 hoog bij de spant; dakrand ~230 (191 in de uiterste linkerhoek → 232); linkergraat 246 → 200 (181 in de hoek); valance ~197–205; afgewend vlak ~189–198 (2000 px, 40 samples) |
| voetplaat / gewichten (close-up) | plaatrand 170 → 229 over 3,4 cm; onder de gewichtenstapel 108 → 226 over 3,3 cm |


`keyShadow` (aandeel van de softbox in het vloerlicht) wordt standaard uit de lichtsterktes berekend.
**Belichting `auto`:** zoals een fotograaf per product belicht, wordt de belichting afgeleid uit de
oppervlak-gewogen albedo van het product (wit doek ≈ 0,65, rood ≈ 0,87, zwart ≈ 1,1). Witte producten
houden zo tekening in de hoge lichten; de achtergrond blijft exact `--bg`. Een vast getal schakelt dit uit.
Lichtrichtingen zijn relatief t.o.v. de camera (draaischijf-principe): elk standpunt krijgt dezelfde
lichtopbouw.

### Toonbewaking (`tools/check-tent-values.py`)

```bash
python3 renders/tools/check-tent-values.py [--size 1000] [--samples 16] [--colours] [--keep DIR]
```

Rendert dezelfde 3×3 Premium hero in zwart, antraciet en grijs, een open 3×6 zwart, en de 3×6 zwart met
wanden uit de samples (hero met dichte deur + detail met opgerolde deur) en leest de gerenderde waarden op
meetpunten die de tentbouwer meegeeft (`meta.probes`: belicht/afgewend dakvlak, valance onder beide, as van de
poot die het dichtst bij de camera staat (gemiddeld óver de buis: lichte, midden- en donkere zeskantfacetten;
de as alleen valt soms precies op het donkerste facet), dicht wanddoek laag tussen de poten op de
belichte/afgewende wand (`wallLit`/`wallShade`), de deur (`doorway`: dicht = het deurblad, opgerold = wat je
door de opening ziet) en de PVC-ramen op de zichtbare zijden (`windowPane`);
`js/main.js` projecteert ze naar pixels en geeft ze terug in de render-info, `--json`). Zwart wordt belicht
als gefotografeerd zwart product (art direction 18 okt 2026). Faalt als het belichte zwarte dak buiten 45–80
valt (doel 55–75) of het afgewende buiten 18–40 (doel 25–35), als het belichte dak tussen zwart, antraciet en
grijs < 25 niveaus verschilt, als zwart doek lichter is dan het zwarte frame ernaast, als de belichte wand buiten
55–90 valt (doel 60–85: bij ~40 smolten wanden, valance en zoomschaduw samen tot één donkere schuur), het
dichte deurblad onder 50, de afgewende wand buiten 22–40 (doel 25–35) of < 20 niveaus onder de belichte wand
ligt, het belichte dak van de tent met wanden buiten 50–85, de ramen buiten 10–70 vallen (helder folie over de
donkere binnenkant: geen zwart gat, geen witte studiokaart door een raam aan de overkant), of als de
binnenkant door de opgerolde deur buiten 12–60 valt (doel 15–35: geen zwart gat). Laatste run (800 px, 8
samples): zwart 70 / antraciet 97 / grijs 136, afgewend zwart 35, valance zwart 43 ≤ frame 58; met wanden: dak
64 / 34, wand 66 / 31, dichte deur 68, ramen 38; detail: binnenkant door de deur 15 — **PASS**.
De render-info bevat ook `trussCross` / `trussCross10` / `hemAtCross` (kruispunten van de schaar op de
belichte zijde, 10 cm erboven, en de valancezoom ervoor): daaruit volgt hoeveel cm het kruis in beeld onder de
zoom ligt (hero: ~12 cm). `--only zwart-wanden,zwart-deur`
draait alleen de wandcontrole. `--colours` drukt ook wit/rood/blauw/groen/oranje/geel af
(belicht vs. afgewend: waarde en verzadiging).

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
   - geef stof-uv's in meters, gemeten óp het oppervlak (weefselschaal en -verhouding kloppen dan vanzelf);
   - materiaal-`userData.envSpec` (0–1) dempt alleen de omgevingsreflectie van dat materiaal (doek, garen);
   - een mesh op layer 3 met `userData.contactProxy = true` kleurt alleen de brede contacthalo op de vloer;
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
  doek aan naden, stiksels, doorhang en glans, niet aan de draad. Uitzonderingen die wél op heroformaat lezen:
  de macrolaag van het strikdoek (garenstrepen, slubs) en de spanningsstrepen + anisotrope glans van stretch.
- **Wit doek** wordt lineair (zonder schouder) getoond, zodat het belichte vlak tot ~250 kan zonder dat de
  doorhang wegvalt; speculaire highlights op aluminium klippen daardoor eerder naar wit (gewenst).
- **Scherptediepte** in `detail` is een gemiddelde over lensposities; bij weinig samples (< 40) is de
  vervaging korrelig. De tent vraagt daarom 60 samples voor `detail`.
- **De overige modellen** (klaptafel, biertafelset, accessoires, stretch-/ster-/opblaastent, prikkabel)
  zijn eenvoudiger en nog niet op cataloguskwaliteit beoordeeld.
- **Rendertijd** op 4 CPU-kernen (SwiftShader): ca. 25–105 s per statafelbeeld en 2–5 min per tentbeeld
  op 2000 px / 40 samples (tentdetail met 60 samples het langst, tot ~8 min met zijwanden).
