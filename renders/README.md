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
- `legs`: `premium` (zeskant 40 → 34 mm zwart gepoedercoat staal, zwarte nylon hoekstukken, dakrand 2,10 m, schaar 58 cm diep) of
  `professional` (zeskant 50 → 44 mm aluminium, aluminium hoekstukken, zwaardere profielen, 2,14 m, schaar 60 cm). De schaardiepte is zo gekozen dat
  elk kruis mét scharnierbout ~9 cm onder de valancezoom zichtbaar is: elke zijde leest als X-schaar, niet als zigzag.
  `frameFinish`: `powder` (zwart staal) of `alu`; standaard volgt het de lijn.
- `color`: kleurnaam of `#hex` (dak, valance, wanden). `wallColor` voor afwijkende wanden. Wit doek wordt
  op ~85 % albedo gezet (PVC, leest als wit en niet als lichtgrijs). **Donker doek krijgt zijn echte waarde:**
  albedo = de kleurstaal (antraciet 5 %, grijs 16 %), alleen echt zwart wordt van 1,2 % naar 1,6 % getild.
  Alle donkere en middenkleuren krijgen **hetzelfde licht en dezelfde belichting** (0,72; geen extra key of
  belichting voor zwart), dus zwart, antraciet en grijs zijn drie verschillende producten: belicht dakvlak
  zwart ~40–50, antraciet ~80, grijs ~135; afgewend vlak zwart ~20 (sRGB-luminantie). Zwart krijgt vorm uit
  één brede zachte glans van de overhead-scrim op de PVC-coating, niet uit meer licht. Controle:
  `python3 renders/tools/check-tent-values.py` (zie *Toonbewaking*).
  Wit wordt belicht als gefotografeerd wit PVC: een hogere, iets naar rechts gerichte key laat het belichte
  vlak van ~247 in het midden **afvallen naar ~225–235 bij de linkergraat en de dakrand**, zodat de
  linkerbovencontour ook in een collectieraster tegen de #EFEDE8-achtergrond leest; de verticale valance
  blijft duidelijk donkerder (~205–220) dan de dakvlakken, het afgewende vlak ~195–215.
- `walls`: per zijde (`front`, `back`, `left`, `right`) één type, of een lijst per vak van 3/4 m
  (`"back":["window","door"]`). Alle indelingen staan gecentreerd in hun vak:

  | type | wat je ziet |
  |---|---|
  | `closed` | dichte wand |
  | `window` | één rechthoekig PVC-raam (max 1,5 m breed, 0,86–1,56 m hoog) met gestikte doekrand; donker rokerig helder folie (~70 % doorkijk: de schemerige binnenkant en het frame vaag zichtbaar) met één brede, zachte, licht golvende reflectie (geen glansstrepen) |
  | `windows` (`church`) | twee kerkraampjes met roede en marges van ≥ 0,5 m tot de poten |
  | `door` | deur van ~1 m. **`doorState` standaard `"auto"`: dicht in hero/front/side/back** (rits, stormflap en deurrand lezen van buiten; het hoofdbeeld opent nooit met een donker gat), **half open in `detail`**. Met `"half"` is het **rechterblad losgeritst, opgerold tot de deurkop en vastgegespt**: van buiten een donkere opening met de oprol erboven (zichtbaar in hero en thumbnail), het linkerblad dicht met rits, stormflap en hangende band; door de opening zie je de binnenkant (vloer, frame, ramen aan de overkant). Met `"doorState":"closed"`: deuropening met gestikte deurrand (platte 4 cm band van 0,7 mm met scherpe randen, dubbel stiksel), verticale rits in het midden (twee geweven tapes, ~520 in elkaar grijpende gegoten tanden per kant op 3,4 mm steek, schuiver als wig met brug, trekker met gat en trekkoord), stormflap: een platte band van 5 cm links van de rits met een omgevouwen rand van 2 mm, die maar ~3 mm van de rits staat (fijne schaduwlijn op de tanden), verstevigingsdriehoek, twee oprolbanden van echte singelband (dikte, afgeronde zelfkant, randstiksel, boxstiksel bovenaan) met kliksluiting (female huis met ribbel en drukknoppen opzij, male tong met sleuf) |
  | `door-open` | deur open: opening tot 1,96 m, opgerolde deur met twee lussen erboven |
  | `panorama` | breed PVC-raam over bijna het hele vak |
  | `rolled` | hele wand opgerold onder de valance (met drie banden) |
  | `open` / `none` | geen wand op die zijde |

  Wanden hangen aan de dakrand (bovenkant achter de valance; daar is de bolling zacht begrensd zodat geen
  plooi door de rok steekt) en zijn een paar cm te lang: tussen de poten **rust de zoom op de grond en knikt
  onregelmatig naar buiten**, bij de poten (klittenband) is hij ~2 cm opgetrokken. Verder: gevouwen
  onderzoom, verstevigde zijbanden, spanningsrimpels vanuit de bovenhoeken, onregelmatige verticale
  valplooien (ruis, geen sinussen; naar de zoom vrijer en licht uitwaaierend), smalle plooien die vanaf elk
  klittenbandlipje bovenaan ~0,8 m naar beneden uitlopen, een buik van ~3 cm tussen de poten. Panelen eindigen
  op de poothartlijn: op een hoek blijft een smalle sleuf waarin de poot en de **velcrobanden** zichtbaar
  zijn — van elke wandrand loopt op drie hoogtes een band van 5 cm in een lus om de poot. PVC-ramen:
  gestikte doekrand, donker rokerig folie (~70 % doorkijk, geen clearcoat, gedempte omgevingsreflectie), strak
  met een lange zachte golving, met **één brede, zachte, licht golvende reflectieband** per raam (engine `sheet`:
  een Gauss-band van ~35 cm, door de golving van het folie licht gebogen): op zwart doek leest het raam als
  donkere rookfolie met het frame er vaag achter, niet als glanzend glas-icoontje. Meng in één productbeeld
  geen kerkraampjes en rechthoekige ramen. De valplooien zijn breed en zacht (15–50 cm uit elkaar, hellingen
  ~5–8°: diep genoeg om in de wandglans van de hero als zachte licht/donker-banen te lezen; geen fijne
  verticale streepjes, geen diagonale arcering in de bovenhoeken).

  **Binnenkant (≥ 3 hangende wanden):** de rig krijgt `interior` (zie Rig) met de **openingen** van de tent
  (open deur gewicht 1, raam 0,4, panorama 0,6): licht komt binnen door de openingen. Naar binnen gerichte
  vlakken (binnenkant wanden, onderkant dak, binnenkant valance) houden het schaduwlicht (key, koepel) plus
  fill/rim/bounce en omgevingslicht × 0,45 in de verre hoeken tot × 1 bij een opening, en spiegelen een zachte
  binnen-ambient (0,75 → 1,8 bij een opening): zwart doek binnen leest zo ~15–25 in plaats van een zwart gat. De
  vloer binnen de wanden gaat naar 4 % (3 wanden 10 %) en loopt bij een opening op tot 35 % (afval over 1,4 m):
  vlak achter een open deur licht, achterin donker. Ramen lezen daardoor als donkere rookfolie met een
  reflectie, nooit als matglas. Voor een productfoto "met zijwanden" zet je **de zijden die de camera niet ziet
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
buigen**; de spanten buigen ~2 cm. Vanuit elke hoekzak lopen **vier ondiepe, rechte spanningsrimpels**
(3,5–5 mm, zonder dalen ernaast, twee per vlak op 5–13° naast de graat); de holte tussen spant en graat blijft
één gladde curve (geen trechter vanuit de hoek). Drie zachte ruggen per vlak vanuit de topkap. Getapete en dubbel
gestikte graat- en middennaden (die stoppen waar de dakrandvouw begint) met een **naadwelt** in het midden van de
tape (graat 6,8 × 2,4 mm, spant 5,2 × 1,7 mm, glanzender dubbele laag): 2–3 px op 2000 px, dus de naden lezen
ook in het hoofdbeeld. Versterkingslappen op de hoeken en
de top (afgeronde driehoek op de hoeken, cirkel op de top, beide met een gelijkmatig dubbel stiksel op 6 en
12 mm van de rand; onder de stijve dubbele laag lopen de spanningsruggen uit, zodat de randen recht blijven).
Rond de topkap is het doek strak: de holval van de panelen loopt binnen ~35 cm van de kap naar nul (geen
"hoorntjes" van de spantruggen naast de kap) en de graten verzachten er tot ~11 cm (het doek ligt om een ronde
kap), zodat de ronde toplap ook als cirkel leest; ook de graatnaad blijft binnen ~45 cm van de kap één gladde
ronde graat (de holval van de panelen rondt daar even breed af als de graat, en de spanningsruggen vanuit de
kap blijven ≥ 0,2 rad naast de graatlijn: geen geknepen vouw achter de kap). De **topkap** zelf is een lage
koepel (Ø 12 cm, ~6 mm boven het doek) in de doekkleur, glad (zonder weefselkaart, die las als geperforeerd grijs
onderdeel). **Dakrand:** het dak wordt over de laatste ~6 cm strak over de
schaar getrokken (lichte bolle schouder) en slaat dan in een **scherpe vouw van 4 mm** om naar de valance;
één stiksel 7 mm onder de vouw, geen bies, geen worst. De dakrand is met klittenband aan de poten en aan elk
bovenste schaarknooppunt (~1 m) bevestigd en **zakt daartussen ~4 mm door**: de valance volgt dat festoen. Tussen twee vakken
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
Valance: dunne rok van vier rechte panelen met **genaaide hoeknaden**; de hoek is bovenaan strak (1,6 cm) en
rondt naar de zoom af tot ~3 cm (geen messcherpe doos) en schopt daar licht uit; bovenaan strak aan de
dakrandvouw genaaid, lichte uitwaaiering, buik van ~1 cm, zachte onregelmatige **verticale valplooien**
(golflengtes ~20–70 cm, groeien naar de zoom), een **festoen van ~6 mm** tussen de bevestigingspunten (4 mm uit
de dakrand + ~2 mm in de zoom), en een omgeslagen zoom van 2 cm: van buiten de echte ~2 mm dikke rand plus een
**dubbel gestikte zoomband** (stiksels op 5 en 13,5 mm die het doek in twee groefjes trekken, het doek ertussen
bolt licht op, de rand van de binnenlaag tekent als ribbel op 19 mm): de band met twee lijnen blijft na het
verkleinen naar 2000 px zichtbaar.

**Frame-afwerking:** Premium-poten zijn satijn zwart gepoedercoat (ruwheid 0,4 onder een satijnen laklaag);
twee hoge striplichten in de studio-omgeving geven elk facet een eigen waarde met een fijne glanslijn op de
ribben, zodat zeskant en de stap van buiten- naar binnenbuis ook op 2000 px lezen. Professional is **geborsteld,
helder geanodiseerd aluminium**: metaal, ruwheid 0,2, sterke anisotropie (0,85) langs de buis (een lange
streep-highlight in de borstelrichting), en op de zeskantpoten **zwarte vlaggen** in de reflectie (engine
`envFlag`: de omgeving wordt × 0,14 gespiegeld waar de gereflecteerde straal tussen 62° en 118° naast de camera
wijst). Aangrenzende facetten spiegelen richtingen 120° uit elkaar, dus de facetten wisselen licht/donker, in
elke stand van de poot: "aluminium Pro 50" leest als een ander materiaal dan het zwarte staal van Premium 40. **Voetplaat:** thermisch
verzinkt staal (metalness 0,8, gevlekte ruwheid per zinkkristal), 6 mm met 1 mm afgeschuinde randen, vier
**echte doorlopende pengaten** (de vloer is erdoor zichtbaar), driehoekige schetsen van 3 mm, een M8-bout met
moer door de koker, en een onzichtbare contact-proxy die achter/opzij een strakke contactschaduw geeft (de
plaat ligt óp de vloer in plaats van erop geplakt).

**Standaardbeelden per tent:** `hero` + `detail`. Het detail is een close-up van de hoek die het dichtst
bij de hero-camera staat (hoekstuk, schuif, schaar met bouten, valancezoom, doekstructuur) van net onder
dakrandhoogte, met een kleine scherptediepte zodat de achterkant van het frame wegvalt. Heeft de tent een
deur, dan is het detail de deur van buiten (opgerold en vastgegespt blad, rits van het dichte blad,
stormflap, deurrand, oprolbanden, doorkijk naar binnen), met een strijklicht van opzij zodat het reliëf ook
op zwart doek tekent.

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
- `print: {svg, color, width, y, azimuth}` (stretch): logo op het vlakke deel van een paneel tussen twee voeten
  (`azimuth` in graden, standaard het paneelmidden het dichtst bij de hero-camera), volgt de rok.

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

Batch: `node renders/render.mjs --batch renders/batches/furniture.jsonl` (Linnen `#ECE4D6`, paden naar `catalog/images/`).

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

Batch: `node renders/render.mjs --batch renders/batches/parts.jsonl` (paden naar `catalog/images/`).

### Verlichting en heaters (eigen bestanden, vervangen de stubs)
Gedeelde helpers: `js/lightKit.js` (hardware: E27-voet met echte schroefdraad, prikfitting `festoonSocket`,
platte kabel, `rubberPlug`, `euroPlug`, `legClamp`, `diecast`, `litDiffuser`), `js/lightGlow.js` (licht
zonder ruis) en `js/bulbKit.js` (G45-lampen die echt branden).

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
| `prikkabel` | `bulbs, spacing, on, cable (zwart/wit), lamp (filament/opal/colour), lamps, plug` | **flat-lay**: de hele kabel ligt gecentreerd op de studiovloer in een losse slang (rijen dwars door het beeld met ronde keerbochten, ~3 cm natuurlijke slingering, licht gebogen rijen); aantal rijen en rijafstand volgen uit de kabellengte zodat de opstelling ~80 % van een vierkant (hero, 30° hoog) of een banner van 1800 × 1100 (`front`, 28°: alle lampen in beeld) vult. Elke fitting ligt op zijn kant (kop, lip en bol raken de vloer, as ~4° omhoog), de platte kabel draait over ~15 cm op zijn kant de kop in; lampen wijzen naar de camera, elk met een warme lichtplas voor de bol (achter de fitting beschaduwd). Stekker op de vloer rechtsvoor, eindkap achteraan. `detail` = sfeerclose-up van de middelste rijen (collectiebeeld) |
| `ledBulb` | `type (melkglas/filament/gekleurd), on, count, colors` | G45 E27 rechtop op het contact; gekleurd = set van 5 in twee verspringende rijen in regenboogvolgorde, met gekleurde lichtplassen |
| `ropeLight` | `color, length, on, diameter, cord` | lichtslang Ø 13 mm, 36 LED's/m (emissief patroon), ~3,5 losse lussen die over elkaar heen klimmen, connector + snoer + eurostekker, heldere eindkap (echt glas) |
| `stringLights` | `kind (kerst), count, spacing, length, on, color, wire` | twee getwiste aders, lamphouder + 5 mm LED per 10 cm; elke houder ligt op zijn kant, 25-55° van de draad af, afwisselend links en rechts (de draad loopt de voet in); losse rozet van lussen, 31 V-stekkertrafo |
| `floodLight` | `watt, on, clamp, color, mountedOn` | gegoten behuizing met koelribben, brandend front met de SMD-matrix (8 × 6) als zachte vlekken, gehard dekglas (echte reflectie), U-beugel met sterknoppen; pootklem ervoor; kabel + stekker. `mountedOn:"leg"` = aan een staande poot |
| `heater` | `kind, style (paddenstoel/flame/lounge/tafel), watt, on, clamp, color, mountedOn` | zie kop van `models/heater.js`. RVS: geborsteld (anisotroop, korrel in de lengte) in de studio-omgeving. Paddenstoel/tafel: gloeiend straalscherm met perforatie, drie naadstrips, donkere randen en een hete band boven het midden; gasknop met chromen rand, greep en witte wijzer, piëzoknop in een chromen kraag. Flame/lounge: vlam als licht in een echte kwartsbuis + amberen gloed in de buis |
| `heaterCover` | `color, zip, heater` | 600D-hoes (`softGoods.fabric600`: basket-weave, garenlaag, coatingglans) over de paddenstoelheater: strak over de reflector, schoudernaad en vier paneelnaden met dubbel stiksel, valplooien, zachte plooien waar het trekkoord de zoom samentrekt (zoomband met stiksel), rits met schuiver, koordstopper, een singelband-handvat waarvan beide uiteinden plat op de hoes zijn gestikt (box-X) |

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
  "toneMapping": "neutral|agx|aces|linear", "shoulder": 0.76, "envIntensity": 0.9,
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
- Materiaal-`userData` die de engine begrijpt: `envSpec` (sterkte van de omgevingsreflectie),
  `translucency` (doorschijnend doek), `macro` (tweede normaallaag), `weave` (`{repeats, boost, roughVar,
  matte}`: afstandsafhankelijk weefselreliëf + glansvariatie), `stochasticAlpha` (doorkijkfolie),
  `interior` (zie boven), `dye` (0–1: geverfd doek wordt in de schaduw dieper en verzadigder),
  `sheet` (`{L, H, c, strength}` op folie met alphaMap: één brede, zachte, licht golvende reflectieband per
  raam), `envFlag` (`{k, a0, a1}`: zwarte vlaggen voor kaal metaal: omgevingsreflectie × `k` waar de
  gereflecteerde straal tussen `a0` en `a1` graden naast de camera wijst; zeskantfacetten wisselen licht/donker).
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
Wit doek: `neutral` met `shoulder` 0,88, een hogere key (−70°, 40°, op 2,3× gericht iets rechts van het
midden, bundel 34°) zodat het belichte vlak naar links en naar de dakrand afvalt, vulling 2,2, een lage
reflectiekaart vóór (`bounce` −20°/−25°, 1,5) die de valance licht ophaalt, belichting 0,58. **Alle andere
kleuren (zwart inbegrepen): hetzelfde licht en `auto` met `max` 0,72**, d.w.z. één vaste belichting voor
donkere en middenkleuren (lichte kleuren iets minder). Vulling 3,0 (afgewende vlakken ~55 % van het belichte
vlak: diepere schaduwtint). **Met wanden:** de key-bundel is 60° en op halve wandhoogte gericht (de wand aan de
key-kant krijgt licht tot aan de zoom), en de studio krijgt per wand een grote zachte kaart op de plek die de wand
spiegelt: een verticaal vlak, van 17° boven gezien, spiegelt de studio ~15° ónder de horizon op twee keer zijn
hoek met de camera (linkerwand ~−68°, rechterwand ~+112°). Zwart doek leest bijna alleen via die glans (diffuus
1,6 %), dus de kaart aan de key-kant is sterk (zwart 14, middenkleuren 7, wit 3,4; afgewende kant 2,6 / 1,3) en
staat iets naar de camera toe (−52° / +100°, 40° / 36° breed, zachte rand): elke wand spiegelt de aflopende
schouder van zijn kaart, dus één brede glansgradiënt per wand, en elke valplooi (een paar graden kanteling)
verschuift die gradiënt tot een zachte licht/donker-baan. Belichte wand zwart ~43, afgewende ~22: de twee
vlakken van de hoek scheiden, en plooien, paneelnaden, de zoom op de vloer en de velcrosleuven lezen. Studio-omgeving: twee hoge striplichten links (−100°) en rechts (136°)
voor de zeskantpoten. Vloer: `groundSplit` met `shadowFloor` 0,6, een strakke contactschaduw (`h0` 3 cm) en een brede
contacthalo (`wide`: `h0` 5 cm, σ 2,8 cm, sterkte 0,42); met wanden is de hemelocclusie sterker (0,5).
`front` krijgt een eigen scherende key van links (−50°, 30°) die het vlak op de spantnaad splitst, zonder
vulling en met de hemelkap naar links gekanteld (de schaduwkant blijft los van de achtergrond); `detail`
een richtingslicht met een lichtere vulling (3,5), bij een deur scherend van opzij.

Gemeten (sRGB-luminantie; achtergrond #EFEDE8 = 237):

| beeld | meting |
|---|---|
| `tent-3x3-wit-hero` | belicht vlak tot 246 (holte 221 → 246 van graat naar spant), rechterhelft voorvlak 227–236, afgewend vlak 204–221; silhouet links ≥ 15 niveaus onder de achtergrond (mediaan 218), rechts ≥ 23 (mediaan 208) |
| dak-close-up 34°/35° | elk half paneel een gradiënt: voorvlak 219 → 245, afgewend vlak 188 → 205 en 193 → 218 |
| `tent-3x3-wit-front` | linkerhelft 243–249, rechterhelft 207 → 228 (holte); silhouet links +6…12, rechts −9…−14 |
| `tent-3x6-zwart-zijwanden-hero` | belicht dakvlak 40–50, afgewend ~20–25 (één zachte glans, geen spiegelplassen); deur als donkere opening met oprol |
| toonbewaking 3×3 Premium hero | belicht dak zwart 48 / antraciet 81 / grijs 135; afgewend zwart 19; valance zwart 28 ≤ frame 31; zie `tools/check-tent-values.py` |
| `tent-3x3-wit-hero` (nieuw) | belicht vlak ~247 bij de spant, 222–234 naar linkergraat en dakrand; valance 200–228 (links donkerder); afgewend vlak 190–215 |
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
poot die het dichtst bij de camera staat, dicht wanddoek laag tussen de poten op de belichte/afgewende wand
(`wallLit`/`wallShade`), en de deur (`doorway`: dicht = het deurblad, opgerold = wat je door de opening ziet);
`js/main.js` projecteert ze naar pixels en geeft ze terug in de render-info, `--json`). Faalt als zwart niet
zwart is (belicht dak 30–55, afgewend 10–30), als het belichte dak tussen zwart, antraciet en grijs < 25
niveaus verschilt, als zwart doek lichter is dan het zwarte frame ernaast, als de belichte wand onder 30 komt
(doel 35–50: daaronder smelten wand, valance en zoomschaduw samen tot één zwarte doos), het dichte deurblad
onder 30, de afgewende wand buiten 15–30 (doel 18–25) of < 10 niveaus onder de belichte wand ligt, of als de
binnenkant door de opgerolde deur buiten 12–60 valt (doel 15–35: geen zwart gat). `--only zwart-wanden,zwart-deur`
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
  doek aan naden, stiksels, doorhang en glans, niet aan de draad.
- **Wit doek** wordt lineair (zonder schouder) getoond, zodat het belichte vlak tot ~250 kan zonder dat de
  doorhang wegvalt; speculaire highlights op aluminium klippen daardoor eerder naar wit (gewenst).
- **Scherptediepte** in `detail` is een gemiddelde over lensposities; bij weinig samples (< 40) is de
  vervaging korrelig. De tent vraagt daarom 60 samples voor `detail`.
- **De overige modellen** (klaptafel, biertafelset, accessoires, stretch-/ster-/opblaastent, prikkabel)
  zijn eenvoudiger en nog niet op cataloguskwaliteit beoordeeld.
- **Rendertijd** op 4 CPU-kernen (SwiftShader): ca. 25–105 s per statafelbeeld en 2–5 min per tentbeeld
  op 2000 px / 40 samples (tentdetail met 60 samples het langst, tot ~8 min met zijwanden).
