# Live gap analysis: our assortment against Outmate.nl and Statafelshop.nl

Status: 2026-10-18. Category-manager review of `catalog/catalog.json` (166 products, 3,105 variants, built
2026-10-18 13:03) against the live capture of both reference shops made the same morning (08:18–10:00 UTC).

**Sources and limits**

- Outmate: 1,000 products known. 400 product pages were read in full (options, variants, add-on blocks,
  specs, delivery and shipping lines, staffels, upload fields). The other 600 come from store data only
  (title, category, price range, options). Statafelshop: all 208 products read in full. Both shops' menus
  (desktop, mobile and footer) were captured, plus 29 non-product pages.
- The capture itself is private and stays out of the repo. This document puts the findings in our own words.
  It quotes no product copy, block titles or descriptions from either shop. Category labels in §1 appear
  only so each menu entry can be mapped, and prices are facts.
- Prices are incl. 21% btw. Where a reference product has a price range, the lowest price is the base
  colour or size and the highest is usually the print or "full colour" option.
- Images are out of scope for this phase (some of ours are still draft cards).
- Effort is not the same as severity. Several blockers and highs are small catalog edits.

**Verdict in one paragraph.** At category level we match or beat both shops on almost everything. Every
Outmate tent system, Statafelshop's whole textile and pakket logic, and the bedrukt range are present. Our
PDP data is richer than both: staffels, FAQ, included/excluded lists, variant-matched add-ons and
configurators. The gaps sit one level down:

- Colour is missing on the whole buizenframe/opslag system.
- The statafel and terrastafel decor-and-frame matrix is thin.
- Wooden banquet, conference and exam tables are missing.
- Size ladders are short for buizenframe and storage tents.
- Some price families sit far below market: transportkarren, biertafels/bierbanken, hypar and koppelgoot.
  The entry HDPE statafel sits above it.
- Shipping cost per product is not modelled.
- Two add-on mappings ship the wrong part, and these are the blockers.

Whole categories we lack exist on Outmate's side only: koelkasten/vriezers, tentvloeren and garderoberekken.

Counts in the graded list (§8): **2 blocker · 12 high · 22 medium · 13 low.**

---

## 1. Navigation coverage

Legend: **full** = we sell the same product type at comparable depth · **partial** = type present, depth
or variants clearly smaller · **none** = we sell nothing of this type.

### 1a. Outmate main menu (13 top items, 3 levels)

| Their top item › group › entry | Our collection(s) / product(s) | Coverage | Note |
|---|---|---|---|
| Partytent › Partytenten › all + PE Basic / PVC Classic / PVC Premium / PVC Ultimate / PVC Professional | `partytenten-buizenframe` → `partytent-pe-basis-buizenframe`, `-pvc-500-comfort`, `-pvc-550-premium`, `-pvc-550-compleet`, `-pvc-620-professional` | partial | All 5 quality lines mapped. **No colour option at all** (they sell up to ~10 colourways per line). Size ladders shorter (§3.1). Their "partytenten" means buizenframe tents; ours means all tents (fine, but the landing intro should say it). |
| Partytent › Onderdelen › Dakzeilen | `buizenframe-onderdelen` → `dakzeil-partytent-buizenframe` | partial | 16 sizes × 4 cloths, white only; they also have 4×10 and 5×4 and colours. |
| … › Zijwanden en zeilen | `zijwand-partytent-2-m-pvc` | partial | 2 m panels only. Missing: 1.5 m panel, long walls 4–10 m (PE) and 3–10 m (PVC, 220 cm), colours. |
| … › Eindwanden | `eindwand-en-tussenwand-partytent` | partial | PVC white 3–8 m. Missing: PE eindwanden, colours. |
| … › Koppelstukken | `koppelstukken-en-buizen-38-mm` | partial | 4 connector types vs 15 (roof angles 110/120/140°, ridge-brace, ground-frame variants, 50 cm straight). |
| … › Partytent buizen | same product | partial | 4 tube lengths vs ~20. |
| … › Betonblokken | `gewichten-en-verankering` → `betonblok-ballast-tent` | full | 120–1000 kg + truss version. They add block covers, a seat-top for blocks, a flagpole-socket version, a truss base plate. |
| … › Bevestigingsmaterialen | `haringen-en-bevestigingsmateriaal-partytent`, `tentelastieken-met-bal`, `spanbanden-en-haringen-easy-up` | partial | They list ~50 small parts (elastic packs short/long in white/black, eye bolts, loose ratchet straps 9–20 m, screw eyes, velcro, ridge clamps…). |
| Partytent › Accessoires › Tussenwanden | `eindwand-en-tussenwand-partytent` | full | |
| … › Stormbandensets | `stormbandenset-partytent` | partial | They offer 1/2/3 sets × tent width × peg length (50/75/100 cm). |
| … › Opbergtassen | `opbergtassenset-partytent` | full | They also sell single bags by dimension. |
| … › Regengoten | `regengoot-partytent` | partial | One gutter for easy-up and buizenframe alike; they sell separate buizenframe gutters 3–12 m at roughly double the easy-up price. Fit claim to confirm. |
| … › Reparatie en onderhoud | `reparatieset-tentdoek` | partial | No PE repair kit (we sell PE tents), no eyelet set. |
| Easy up › Premium / Professional | `easy-up-premium`, `easy-up-professional` | full | Same sizes and colours. Premium "full colour" missing (we only print the valance on Premium). |
| Easy up › Accessoires › Zijwanden en zijwandenset | `zijwanden`, `zijwandenset-easy-up(-heavy-duty-pvc)` | full | |
| … › Transport en beschermtassen | `tassen-en-wielsets` | full | They split covers per roof cloth (PVC/polyester). |
| … › Regengoten en verbindingsgoten | `regengoot-partytent`, `verbindingsstrook-easy-up`, `koppelset-easy-up` | full | Their joining strip comes in the tent colours; ours in white/black. |
| … › Bevestigingsmaterialen | `easy-up-onderdelen` (verzwaring/verankering) | full | |
| … › Inrichting | `led-vloedlicht-easy-up`, `elektrische-heater-partytent` | full | |
| Easy up › Onderdelen › Frames / Dakzeilen | `los-frame-easy-up-*`, `frame-onderdelen-easy-up`, `dakzeil-easy-up` | full | They list ~30 single frame parts; we have 15 variants (enough for the common breaks). |
| Tuinpaviljoen › Lite / Steel | `overkappingen-en-schaduwdoeken` → `tuinpaviljoen-aluminium` | partial | Aluminium 3×3 / 3×4 in anthracite only. No steel line, no 4×4, no second colour. |
| Tuinpaviljoen › Zijwanden / Toebehoren | `zijwanden-tuinpaviljoen` | partial | No concrete footings / adjustable feet. |
| Opslagtent › Classic / Premium / Professional | `opslagtenten` → `opslagtent-pvc` (3 lines × 6 sizes), `carport-opslagtent-vast-frame` | partial | They have 16 sizes per line on two of the three lines, and colours (grey/green/black). Carport: we have 1 of 3 lengths. |
| Opslagtent › onderdelen / accessoires | same as buizenframe | partial | as above |
| Opblaasbaar › tenten / zijwanden-luifels-tunnels / accessoires | `opblaasbare-tenten` + 7 accessory products | full | Wall types: we have closed + door; they add window and single-zip. Pro walls: see blocker B2. |
| Stretchtent › complete / hypar | `stretchtenten` → `stretchtent-compleet`, `hypar-schaduwzeil-stretch` | full | Hypar priced far below market (H8). Missing 4.5×7.5 and 10.5×12. |
| Stretchtent › onderdelen (doeken, zijwanden, bevestiging, koppelgoten, palen) | `stretchdoek-los`, `zijwand-stretchtent`, `onderdelen-stretchtent`, `koppelgoot-stretchtent`, `palen-stretchtent` | partial | Bevestiging depth (M5). Koppelgoot lengths and price (H8). 5 m pole missing. |
| Stertent › enkele mast / dubbelmast | `stertenten` | full | Same sizes, same colours. |
| Stertent › zijwanden / accessoires | `zijwanden-stertent` | partial | **Walls white only, see B1.** No star-tent pegs or peg puller. |
| Zeilen en doeken › zijwanden en zeilen / schaduwdoeken | `overkappingzeil-op-maat`, `zijwand-overkapping-pvc`, `schaduwdoek` | full | Missing a 50 cm wall extension piece, shade sail 4×2 and triangle 4 m, fixing set. |
| Verlichting › prikkabels / ledlampen / lichtslangen / kerst | `verlichting`, `prikkabels`, `lampen-en-lichtslangen` | partial | Prikkabel configuration and single coloured LED lamps (M6). |
| Verlichting › onderdelen | `onderdelen-prikkabel-en-lichtslang`, dimmer, tijdschakelaar | partial | No droppers, link connectors, clips, power strips, 5–30 m extension leads. |
| Tafels en stoelen › Barkrukken | `barkrukken` (6) | partial | They have 20 models, often in 5–8 colours. Ours 1–4 colours each. |
| … › Barrels | `statafel-wijnvat-houtlook`, `wijnvat-set-statafel-barkrukken` | full | They also sell the barrel stool on its own. |
| … › Biertafels en bierbanken | `tafels` → `biertafelset`, `bierbank-220`, `biertafelsets-10-stuks` | partial | Sizes 2 vs 8. Frame colours missing. Prices far below (H7). |
| … › Klaptafels | `klaptafel-hdpe-rechthoekig`, `klaptafel-hdpe-rond` | partial | No wooden banquet, round Ø122/153/183, half/quarter round, oval, conference or exam tables (H5). |
| … › Statafels | `statafels` (6) | partial | Decor and frame-colour matrix (H3). |
| … › Stoelen | `stoelen-en-banken` (7) | partial | No resin wedding chair. Few colours (M9). |
| … › Terrastafels | `tafels` → `terrastafel-inklapbaar` | partial | No round terrace tables, no decor matrix (H4). |
| … › Accessoires meubilair (biertafel-, sta/terras-, stoel-, barkruk-, klaptafel-onderdelen, rokken en hoezen) | `statafel-onderdelen`, `voetdoppen-set-van-4`, `zitkussen-stoel-en-barkruk`, `tafelhoezen` | partial | No beer-table frame sets or locking clips, no folding-table frames or levelling legs (M19). |
| … › Transportkarren | `transportkarren` (6) | partial | Prices (H6). Fewer special trolleys (barriers, market stalls, coat racks, fridges, exam and conference tables). |
| Inrichting › Verwarmingen (gas / elektrisch / accessoires) | `verwarming` (6) | full | |
| Inrichting › Vloeren, tapijten en lopers › Kunststof vloeren | – | **none** | Roll-out tent floor (M13). |
| … › Lopers | `loper-per-meter` | partial | 3 colours vs 8, one quality vs two, no 50 m rolls, no white (M11). |
| Inrichting › Koelkasten en vriezers | – | **none** | 11 SKUs: bar fridges 128/198/320 l, stainless uprights, chest freezer, 1,000 l bottle cooler, fridge trolleys (H10). |
| Inrichting › Garderoberekken | – | **none** | Coat rack on wheels + trolley (M13). |
| Inrichting › Afzetpalen | `evenement` → `afzetpaal-met-trekband`, `afzetpaal-met-logo` | partial | No belt-colour option, no rope-and-post system, wall units, sign holders or trolley (M12). |
| Inrichting › Marktkramen | `marktkraam-2-m` | partial | No frame colour, scalloped edge, skirt, spare parts or trolley (L10). |
| Service / Showroom | pages `contact`, `veelgestelde-vragen`, `showroom-en-afhalen` (unpublished until owner confirms) | full | |

### 1b. Statafelshop product menu (13 categories) and top links

| Their category | Our collection(s) | Coverage | Note |
|---|---|---|---|
| Statafels (26) | `statafels` (6 products, 116 variants) | partial | Fewer models is fine. The decor and frame-colour matrix is the gap (H3). |
| Statafelhoezen (6) | `statafelrokken`, `stretch-statafelrokken`, `statafelhoezen-met-strik`, `topcovers-en-beschermplaten`, `bedrukte-statafelhoezen` | full, deeper | We have 24 stretch colours vs 22, with/without topcover, strik, kleden, beschermplaten, logo. Only their gold/silver price tier is missing (M22). |
| Barkrukken (9) | `barkrukken` | full | Their colourful metal stool comes in 8 colours (M9). |
| Actiepakketten (45) | `actiepakketten` (17) | partial | Kar + N chairs/stools/folding chairs and buffet 10/25 packs missing (M20). |
| Stoelen (2 + stapel/klap 13) | `stoelen-en-banken` | partial | Resin wedding chair; chair stretch cover (M9). |
| Terrastafels (11) | `tafels` (merged landing) | partial | Round terrace tables; own collection (H4). |
| Biertafelsets (9) | `tafels` → `biertafelset`, `biertafelsets-10-stuks` | partial | Sizes 220×50/60/67/70/80 vs ours 50/70; prices (H7). |
| Tafels (11) | `tafels` | partial | Wooden banquet rect/round, conference T/U-frame, exam table (H5). |
| Banken (6) | `stoelen-en-banken` → `bank-houten-frame`, `bierbank-220` | full | |
| Transportkarren (23) | `transportkarren` | partial | Prices (H6). Model-specific trolleys are theirs by design; ours are generic. |
| Onderdelen (54) | `statafel-onderdelen` | partial | They sell per-model parts (supports, centre pieces, tube clamps, parasol caps, screw sets). Ours are generic. Fine for our own models (L13). |
| Textiel | `statafelrokken`, `tafelhoezen` | partial | Missing the chair cover (M9). |
| Diverse | `evenement`, `topcovers-en-beschermplaten` | full | |
| Top links: Over, Blog, Zakelijk, Contact | `over-ons`, blog `advies`, `zakelijk`, `contact` | full | |

### 1c. Inspiration and info links in the menus

| Reference topic | Ours | Status |
|---|---|---|
| Manuals, tent differences, PE vs PVC, cleaning, easy-up set-up, easy-up printing, how to make a prikkabel | `handleidingen`, `verschil-partytenten`, articles `pe-of-pvc-partytent`, `partytent-onderhouden-en-opbergen`, `easy-up-partytent-opzetten`, `bedrukken` + `logo-aanleveren-voor-bedrukking`, `prikkabel-op-maat-berekenen` | covered |
| What to check when buying a tent; buizenframe set-up tips | partly in `zijwanden-kiezen`, `easy-up-premium-of-professional`, `hoeveel-mensen-in-een-partytent` | partial |
| Ground frame and ridge reinforcement explained; choosing a storage tent; shade-sail FAQ; wedding in a stretch tent; build your own beer table; statafel buying guide | – (statafel guide partly in `hoeveel-statafels-per-gast`) | missing (L8) |
| Stretch-tent rental, project gallery | – | intentionally out of scope (no rental, no fabricated projects) |

---

## 2. Their assortment as product types: variant dimensions and price bands

Counts are products in the capture. Bands are their lowest to highest list price for the type (excluding
multi-packs unless stated). "Ours" gives our matching handles, variant dimensions and band.

### 2.1 Partytenten (tents)

| Product type | Outmate | Statafelshop | Variant dimensions they use | Their band | Ours | Our band |
|---|---|---|---|---|---|---|
| Easy-up steel (Premium) | 3 | – | size 3×3/3×4.5/3×6 · 7 colours + full colour | €299–459 (full colour to €999) | `easy-up-partytent-premium-*` (3) + logo-on-valance | €279–449 |
| Easy-up alu polyester (Professional) | 8 | – | 8 sizes · 7 colours + full colour (2×2 and 5×5 black only) | €599–1,449 (full colour to €2,325) | `easy-up-partytent-professional-*` (8) + logo + full colour product | €499–1,249 |
| Easy-up alu heavy-duty PVC | 6 | – | 6 sizes · white/black + full colour | €789–1,769 (to €2,939) | Uitvoering `Heavy duty PVC` on the same products | €719–1,499 |
| Buizenframe PE | 6 | – | 6 sizes · white | €279–525 | `partytent-pe-basis-buizenframe` | €249–479 |
| Buizenframe PVC basic line | 17 | – | 17 sizes 3×3–6×12 · up to 7 colourways (two-tone) | €395–1,199 | `partytent-pvc-500-comfort` (12 sizes, white) | €399–1,049 |
| Buizenframe PVC 550 line | 18 | – | 18 sizes up to 8×12 · up to 10 colourways | €439–1,850 | `partytent-pvc-550-premium` (13 sizes, white) | €399–1,699 |
| Buizenframe PVC complete/anthracite line | 6 | – | 6 sizes · anthracite-white / grey-white | €486–1,017 | `partytent-pvc-550-compleet` (5 sizes) | €499–1,099 |
| Buizenframe PVC heavy (220 cm sides) | 6 | – | 6 sizes · white / grey-white | €569–1,725 | `partytent-pvc-620-professional` (4 sizes) | €869–1,599 |
| Storage tent, 3 lines | 38 | – | 16 sizes per line (heavy line 6) · white, grey, green, black, grey-white | €399–1,699 | `opslagtent-pvc` (6 sizes × 3 lines, white) | €379–1,499 |
| Carport storage tent | 3 | – | 3 lengths · grey/green | €599–979 | `carport-opslagtent-vast-frame` (1) | €629 |
| Stretch tent complete | 11 | – | 9 sizes + made-to-measure · taupe/sand · standard/heavy rigging | €2,630–16,350 | `stretchtent-compleet` (8 sizes × wood/alu poles × 4 colours) | €2,395–13,925 |
| Stretch cloth only | 9 | – | 9 sizes · taupe/sand | €2,100–10,710 | `stretchdoek-los` (6 sizes), `stretchdoek-op-maat` | €1,795–9,695 |
| Hypar stretch shade | 3 | – | 3 sizes · 6 colours | €2,219–4,990 | `hypar-schaduwzeil-stretch` | €995–1,895 (H8) |
| Star tent single / double mast | 5 / 4 | – | 5 / 4 sizes · white/black/sand + full colour | €989–3,278 / €2,500–7,200 | `stertent-enkele-mast`, `stertent-dubbele-mast` | €899–2,649 / €2,295–5,649 |
| Inflatable tents (4 families) | 11 | – | sizes 3×3–12×12 · 8 frame colours · standard/extra-high (3×3) · valance on/off | €1,250–9,950 | 4 products, 133 variants | €1,095–8,995 |
| Garden pavilion (2 lines) | 5 | – | 3×3/3×4/4×4 · closed/mesh wall sets as options | €695–1,389 | `tuinpaviljoen-aluminium` (2 sizes) | €649–749 |

### 2.2 Tent parts and accessories

| Product type | Their count | Dimensions | Their band | Ours | Our band |
|---|---|---|---|---|---|
| Easy-up single walls (closed/window/door) | 30 | width 2–8 m (6 m split per tent depth) · 7 colours + full colour · print side inside/outside | €69–339 (print to €1,035) | 3 products × 7 widths × 7 colours + HD PVC + printed wall | €39.95–209 |
| Easy-up half walls + required tube profile and connectors | 11 | width 3/4/4.5 m · colours | €49–259 (profile €24–39) | `halve-zijwand-easy-up` (cord-tensioned, no profile) | €34.95–69.95 |
| Easy-up wall sets | 14 | per tent size · colours · two set types on long tents | €219–1,799 | `zijwandenset-easy-up(-heavy-duty-pvc)` | €199–469 |
| Easy-up roof cloths | 14 | per size · polyester/HD · colours + full colour | €129–615 | `dakzeil-easy-up` 61 variants + printed | €79–729 |
| Easy-up frames + single parts | 41 | per size / per part | €1.15–1,199 | 2 frame products + 15 parts | €4.95–1,019 |
| Covers, wheels, gutters, joining strips, weights | ~30 | per size, per cloth type, colours | €12.50–59 | 9 products | €9.95–89 |
| Buizenframe roof cloths | 27 | ~22 sizes · PE/PVC/heavy · colours | €89–599 | `dakzeil-partytent-buizenframe` | €89–649 |
| Buizenframe wall panels / long walls / end walls / partition walls | 8 / 9 / 12 / 4 | 1.5–2 m panels (200/220 cm), long walls 3–10 m, end walls 3–8 m PE/PVC · colours | €24–239 | 2 products (2 m panel; end/partition wall) white | €13.95–99.95 |
| Connectors / tubes | 15 / 20 | type × angle / length | €7.50–12.50 | `koppelstukken-en-buizen-38-mm` (8 variants) | €6.95–11.95 |
| Ballast blocks + extras | 13 | 120–1,000 kg · anchor layout · truss/flagpole versions · covers | €27.50–389 | `betonblok-ballast-tent` (7) | €99–299 |
| Stretch fixings | 12 | pegs 100/120 cm, pole caps, centre-pole base, rope set, ratchet strap, peg puller | €0.53–345 | `onderdelen-stretchtent` (4) | €4.49–49.95 |
| Stretch couplers | 1 (9 lengths) | 4.5–21 m | €199–899 | `koppelgoot-stretchtent` (3/6 m) | €69.95–119 |
| Star-tent walls / sets | 12 | per size · closed/window/roll-up door · 3 colours + full colour | €139–3,999 | `zijwanden-stertent` (36 variants, white) | €115–949 |
| Inflatable walls | 13 | per model and size · closed/window/door/single-zip · print side | €179–699 | `zijwand-opblaasbare-*` (2 products) | €159–519 |

### 2.3 Tables and seating

| Product type | Outmate | Statafelshop | Dimensions they use | Their band | Ours | Our band |
|---|---|---|---|---|---|---|
| Round folding statafel (Ø70/80/85) | ~12 | ~14 | top Ø · **top decor** (white, granite-look, speckled, slate, vintage wood, plain wood, brushed metal, compact HPL) · **frame colour** (black, white, chrome, hammer-black, beige, light grey) · parasol hole | €95–164 | `statafel-inklapbaar-professional` (Ø × 5 decors × in/outdoor × parasol hole; black frame), `statafel-met-kruisvoet` | €89.95–159 |
| Entry HDPE/blow-mould statafel Ø80 | 2 | 1 (+2-pack) | white/black | €45–49 (2-pack €74) | `statafel-inklapbaar-hdpe-80` | €54.95 (H9) |
| Square / wide statafel | ~10 | ~7 | 60/70/80 square, 120×60/70, 160×60, 180×70 · compact-HPL decors · frame colour | €137–435 | `statafel-vierkant-stapelbaar`, `statafel-rechthoekig-inklapbaar` | €119–189 |
| Design statafels (marble/gold, self-levelling base) | ~6 | 3 | finish × frame | €195–381 | – | – (M14) |
| Terrace tables (twins of the statafels) | 17 | 10 | round Ø60–85, square 60/70, wide 120 · same decors and frames | €72.50–336 | `terrastafel-inklapbaar` (60/70/120×70) | €89.95–199 (H4) |
| Folding / banquet tables | ~35 | 6 | HDPE 122/180/183; wooden top rect 122–220, round Ø122–183, half/quarter round, oval, square 140; conference 120–180×80 with T- or U-frame; exam 90×60 | €72.60–332 | `klaptafel-hdpe-rechthoekig`, `klaptafel-hdpe-rond` | €59.95–219 (H5) |
| Beer table / bench / set | 15 | 9 | length 180/220 · width 50/60/67/70/80 · standard/brewery grade · frame colour | table €115–233, bench €67.50–97, set €225–357 | `biertafelset`, `bierbank-220` | table €89.95–139, bench €39.95–49.95, set €169–235 (H7) |
| Bar stools | 20 | 10 | model · 3–8 colours · seat type (metal/wood/faux leather) | €32.75–167 | 6 models | €34.95–129 |
| Stacking / folding chairs | ~30 | 13 | model · 2–8 colours · resin wedding chair | €22.39–149 | 5 models | €17.95–79.95 (M9) |

### 2.4 Textile, transport, pakketten, lighting, heating, event, interior

| Product type | Their count | Dimensions | Their band | Ours | Our band |
|---|---|---|---|---|---|
| Stretch statafel skirt (+ topcover) | Outmate 1, Statafelshop 1 (+ loose topcover, strik skirt, theme skirt) | 2 sizes · 21–22 colours · gold/silver premium tier | €14.99 (no cover) / €33.82–58.71 | `statafelrok-stretch` 96 v (24 colours × with/without cover) + 5 related | €15.95–19.95 |
| Tafelkleed / buffet-table cover / chair cover | 3 | colours | €18.09–42.29 | `statafelkleed`, `stretchhoes-klaptafel` (no chair cover) | €15.95–39.95 |
| Beer-set covers (3-piece) | 8 | 8 sizes · ~10 colours | €24.99 | `hoes-biertafelset` (2 sizes, 3 colours) | €9.95–44.95 (M10) |
| Printed statafel cover / printed protection plate | 2 | size | €75.63–119.79 | 3 products | €69.95–219 |
| Trolleys (loose) | Outmate 41, Statafelshop 23 | per furniture model and capacity | statafel €339–799, folding table €482–599, chairs €299–665, bar stools €354–690, beer sets €579–817 | 6 products, 11 variants | €149–429 (H6) |
| Kar + N items packs | Outmate 10, Statafelshop 27 | item × count (5–50) × colour | €780–3,891 | 7 kar packs | €639–2,349 |
| Other packs (table + skirt, table + stools, 10/25 buffet tables) | Statafelshop 10 | colour of skirt, optional extras | €54–5,197 | 10 | €47.95–1,979 |
| Prikkabels ready-made | 21 | 5–100 m · white/black · 1 or 2 sockets per m · lead length · end piece | €29.25–385 | `prikkabel-e27` (10/20/30/50 m), `prikkabel-op-maat` | €39.95–159 |
| LED lamps E27 | 22 | colour (8) · clear/milky · filament · dimmable · IP65 · colour temperature | €1.29–2.69 (sets €5.99–9.95) | `led-lamp-e27` (4 variants) | €1.29–4.95 |
| Lighting parts | 24 | droppers 20–50 cm, end hooks/caps, link plugs, connectors, clips, plugs, cable per m, power strips, extension leads 5–30 m, dimmers, timers, smart plug | €0.49–57.95 | 3 products (10 variants) | €1.39–24.95 |
| Heaters electric / gas / covers | 5 / 5 / 3 | model · wattage | €79–149 / €149–199 / €19.50–27.50 | 3 / 3 / 1 | €109–149 / €109–329 / €19.95 |
| Barrier posts and ropes | 37 | finish · belt colour (3) · belt length · rope colour (~10) · rope type · wall units · sign holders | €2.30–196 | 2 products | €49.95–69.95 |
| Runners / tape / carpet tiles | 18 | colour (8) · two qualities · per m or 50 m roll | €8.99–13.99/m, €439/50 m | `loper-per-meter` (3 colours) | €7.95–14.95/m |
| Market stall + parts | 11 | frame finish · roof colour (6) · scalloped edge · skirt · printed | €523–1,096 | `marktkraam-2-m` (5) | €479–729 |
| Fridges / freezers / trolleys | 11 | capacity · type | €325–2,215 | – | – (H10) |
| Coat racks / trolley, tent floor | 2 / 1 | – | €399–750 / €29 | – | – (M13) |

---

## 3. Variants and sizes on the core lines

### 3.1 Buizenframe tents (sizes we lack · price delta on shared sizes)

| Our line ↔ their line | Sizes they have and we lack | Shared-size price delta (ours vs theirs) |
|---|---|---|
| `partytent-pe-basis-buizenframe` ↔ PE | none | −9 to −11% |
| `partytent-pvc-500-comfort` ↔ basic PVC | 3×3, 4×4, 4×10, 5×4, 5×6 | 0 to −18%; 5×12 +15%, 6×10 +2% |
| `partytent-pvc-550-premium` ↔ 550 line | 4×10, 5×4, 5×10, 5×12, 6×10 | −5 to −11%; 5×6 +3% |
| `partytent-pvc-550-compleet` ↔ anthracite complete line | 3×6 | **+3 to +9%** (ours dearer) |
| `partytent-pvc-620-professional` ↔ heavy 220 cm | 3×4, 3×6 | −6 to −7%; 4×6 **+12%** |
| all lines | **colour**: none of ours has a `Kleur` option; theirs offer 1–10 colourways | – |

### 3.2 Storage tents

`opslagtent-pvc` has 6 sizes (3×4, 3×6, 4×6, 4×8, 5×10, 6×12) on each of 3 lines. Their basic and 550 lines
each have 16 sizes. We lack 3×8, 4×4, 4×10, 5×4, 5×6, 5×8, 5×12, 6×6, 6×8 and 6×10, plus the colours grey,
green, black and grey-white. Shared sizes are −4 to −17%, and 4×6 on the heavy line is +6%. The carport
lacks the 3.3×7.2 and 3.3×9.6 lengths.

### 3.3 Easy-up (ours vs theirs, base colour)

| Size | Premium | Professional polyester | Professional HD PVC |
|---|---|---|---|
| 2×2 | – | €499 vs €599 (−17%) | – |
| 3×3 | €279 vs €299 (−7%) | €599 vs €679 (−12%) | €719 vs €789 (−9%) |
| 3×4.5 | €359 vs €379 (−5%) | €719 vs €789 (−9%) | €869 vs €1,025 (−15%) |
| 3×6 | €449 vs €459 (−2%) | €949 vs €1,149 (−17%) | €1,149 vs €1,359 (−15%) |
| 4×4 | – | €749 vs €839 (−11%) | €889 vs €979 (−9%) |
| 4×6 | – | €999 vs €1,125 (−11%) | €1,199 vs €1,389 (−14%) |
| 4×8 | – | €1,249 vs €1,449 (−14%) | €1,499 vs €1,769 (−15%) |
| 5×5 | – | €1,199 vs €1,399 (−14%) | – |

Sizes and colours match. We offer the 2×2 in 3 colours and the 5×5 in 4, where they stock black only.
That is a supplier claim to confirm (L4).

### 3.4 Statafel finish matrix

Statafelshop's round models come in about 8 top decors and white or black frames. Outmate's come in about 8
decors and up to 5 frame colours. The single most common look in both is a white top on a white frame.
Ours is 5 decors (Wit, Zwart, Antraciet, Graniet, Berken) on a black frame only. Under a stretch skirt the
frame is hidden, but for terraces, horeca and bare use the matrix decides the sale.

---

## 4. Prices that are clearly off-market

Our pricing policy (`catalog.json → pricing_policy`): same or better spec, 5–15% below the reference, never
below the observed market floor. Sets 10–12% below their parts.

| Item | Ours | Outmate | Statafelshop | Delta | Grade |
|---|---|---|---|---|---|
| Transportkar statafels klein / groot | €269 / €369 | €339 (5–12) / €415.50 (10–15) | €387.20 / €465.85 | −21 to −31% / −11 to −21% | H6 |
| Transportkar 10 klaptafels 183 | €249 | €599 | €496 (buffet tables) | −50 to −58% | H6 |
| Transportkar 24 barkrukken / 30 klapstoelen | €229 / €199 | €380.50 / €299 | €399–690 / €417–448 | −33 to −67% | H6 |
| Transportkar 20 / 40 stapelstoelen | €179 / €279 | – | €435.60 / €554.18 | −50 to −59% | H6 |
| Transportkar biertafelsets | €299 | €579–589 | €816.75 | −48 to −63% | H6 |
| Pack 24 barkrukken + kar / 40 stoelen + kar | €959 / €1,789 | €1,299–1,575 | €1,712 / €2,540 | −26 to −44% / −30% | H6 |
| Bierbank standaard / brouwerij | €39.95 / €49.95 | €72.50 | €81.68 / €96.74 | −45 to −52% | H7 |
| Biertafel 220×70 standaard | €109 | €159 | €114.89–178.48 | −5 to −31% | H7 |
| Biertafelset 220×70 standaard | €185 | €292.50 | ~€225–289 | −18 to −37% | H7 |
| Set vs its parts (biertafel + 2 banken) | €169 vs €169.85 | – | – | 0.5–2% saving, policy 10–12% | H7 |
| Hypar 4.5×4.5 / 6×6 / 7.5×7.5 | €995 / €1,395 / €1,895 | €2,219 / €3,500 / €4,850 | – | −55 to −62% | H8 |
| Koppelgoot stretchtent 6 m | €119 | €249 | – | −52% | H8 |
| Statafel HDPE Ø80 | €54.95 | €45–49 | €45 (2-pack €74) | **+12 to +22%** | H9 |
| Hoezen biertafelset (set of 3) | €39.95–44.95 | €24.99 | – | +60 to +80% | M10 |
| Topcover stretch | €7.95 | – | €13.25 | −40% | L3 |
| Stretchrok gold/silver | €19.95 | – | €58.71 (premium tier) | flat vs tier | M22 |
| Stormbandenset 3 m | €18.95 | €29 (1 set) | – | −35% | L3 |
| Prikkabel 10/20/30/50 m | €39.95/69.95/99/159 | €49/87/126/199 | – | −19 to −22% | L3 |
| Zijwandenset easy-up 3×3 / HD | €199 / €299 | €249 / €399 | – | −20% / −25% | L3 |

Everything else on the shared-size checks sits inside or near the −5…−15% band. That covers easy-up, PE/550
tents, stretch, star and inflatable tents, opslag, betonblok 500–1,000 kg, statafels, klaptafels, barkrukken
and stretchrokken.

---

## 5. Cross-sell and add-on logic

### 5.1 What they do

- **Outmate** puts 1–4 product blocks on each PDP. Each block is a list of linked products with their own
  quantity fields and a shared add-to-cart. Across the 400 read pages we counted 110 distinct block
  headings. They fall into these patterns (paraphrased):
  1. **Accessory discount with the main product.** 10% off a fixed set (walls for a tent size; storage bags
     plus storm straps for buizenframe tents; walls for inflatables; a skirt with one statafel model). About
     70 PDPs.
  2. **Parts list of this product.** Every part that belongs to the tent or statafel model, each with a
     quantity field. About 64 statafel and table pages, plus tents.
  3. **Handy extras and frequently bought together.** Weights, wheels, gutter, straps, cover and joining strip
     on easy-ups. Partition wall, gutter and extra wall panel on buizenframe tents.
  4. **Contextual prompts.** Ballast as an alternative to pegs (stretch). Coupling two stretch tents
     (gutter). Easy transport (trolley on statafels). Seating that fits around this table (stools/chairs on
     statafels and terrace tables). Required companion part (the tube profile for half walls). Siblings
     (other walls of the same width). Cover for this block. "Fits these tents" (reverse compatibility).
     Alternatives.
  5. **Optional extras via an options plugin** on about 60 pages: print side, valance yes/no, extra height,
     file upload.
  - The blocks are **not variant-aware**. The 3×3 tent shows "from" prices of the 3×3 walls, and the shopper
    picks the colour again.
- **Statafelshop**: related products (138 PDPs) and upsells (30). Bundles (39) let the shopper pick the skirt
  colour and size for every table in the bundle and offer **optional bundle extras** (add a skirt or a
  protection plate per table, priced per piece). Statafel PDPs themselves carry no accessory add-ons.

### 5.2 What we do, and how it compares

| Logic | Ours | Verdict |
|---|---|---|
| Variant-matched add-ons (same Maat + Kleur, right weight set per leg count, skirt per Ø, no topcover with parasol hole) | `addon_varianten` on 2,061 of 3,105 variants, 69 products | **better** than both |
| Quantities that scale with the product (pegs and weights per leg on buizenframe/opslag; stars per point) | `addon_aantallen` | **better**, except stretchtent (flat 1/2/1 on every size, M4) |
| Once per order line (trolley with N tables) | `addon_eenmalig` on 16 | **better** |
| Bundles with exact components and "you save" | `componenten` on every bundle variant (17 bundles, 1,366 variants) | **match**. Their per-table optional extras inside a bundle are missing (M20). |
| Reverse compatibility ("fits on") | `past_op` on 76 + storefront filter `systeem` | **match** |
| Siblings by size | `andere_maten` on the split easy-up lines | **match** |
| Accessory discount when bought with the main product | – | **gap** (M1) |
| Parts list of this product on the main PDP | – (only reverse `past_op` on the parts) | **gap** (M2) |
| Seating around a table | only `terrastafel-inklapbaar` → stapelstoel and `statafel-rechthoekig-inklapbaar` → barkruk. Round statafels have none. | **gap** (M3) |
| Coupling and fixing prompts on stretch tents (koppelgoot, onderdelen) | `stretchtent-compleet.complementary` is empty | **gap** (M4) |
| Required companion part (half-wall profile) | – (our half wall uses a sewn tension cord) | **confirm** (M18) |
| Alternatives on discontinued items | `alternatieven` 0/166 (fallback `past_op`) | fine for launch |
| **Correct add-on target** | wrong on star-tent walls and inflatable Pro walls | **blockers** (B1, B2) |

---

## 6. PDP data richness

| Field | Outmate (400 read) | Statafelshop (208) | Ours (166) | Verdict |
|---|---|---|---|---|
| Spec rows | median 12, mean 15, max 43. Groups: dimensions/weight, materials, use (persons, set-up time, warranty), **packing and shipping** (method, box size, box count), technical | median 2 (height, top size, colours, folding) | median 10, mean 12, max 34. Grouped, on all 166 | ≈ Outmate, far above Statafelshop. **Packing data** (`verpakt`) only 17/166 (M15). |
| Delivery / stock line | per variant: dispatch date, expected restock date, "coming soon", "temporarily / permanently sold out", print lead after proof | same-day before cutoff, sold-out with notify form, low-stock count | theme promise from `cutoff_time` + transit settings. `levertijd` on 18, print lead from `drukopties`, `availability_status` contract (0 used). Notify form in theme. | match. No **expected-restock date** field (L9). |
| Shipping cost on PDP | 399/400. Product-specific, with quantity tiers on heavy items (statafels per 1/2/3+, ballast per block, stretch parts) | none | 2 class rates from theme settings (pakket €6.95, pallet €59). `verzendkosten` override 0/166. | **gap for heavy goods** (H11) |
| Staffel | 12/400 (bench covers, long pegs, block covers) | 0 | 147/166 (`staffel_mode` quote until discounts exist) | **we lead** |
| Downloads | 145/400: tents, walls 22/39, end walls 9/9, easy-up roofs 5/7, star walls 4/10, statafels 3/26 | 0 | 30/166, tents only | gap on walls and parts (M16) |
| FAQ on PDP | 0 | 0 | 166/166 | **we lead** |
| What's in the box / not included | in prose | – | `included` 143, `excluded` 130 | **we lead** |
| Reviews | tab on 183 pages. 450 products with real ratings | site-level score in USP bar | review-app metafields only (none fabricated) | owner action (review app). Not a catalog gap. |
| Quote request | button on every PDP (company, VAT, CoC, latest delivery date, file upload) | – | theme `product-quote` + `page.offerte` | match |
| Print upload | containers present, but the live check on a full-colour easy-up found no field. Upload only via quote form. | none on the printed skirt | `bedrukbaar` + `drukopties` + line-item upload on 14 | **we lead** |
| Size guide link | – | – | `maatgids` on 20 | **we lead** |
| Configurator (m², per m) | on-measure products via options plugin | – | 3 (`stretchdoek-op-maat`, `overkappingzeil-op-maat`, `prikkabel-op-maat`) | match |

---

## 7. Where we already beat both (keep, do not regress)

- Stretch skirts: 24 colours × 2 sizes × with/without topcover, strik covers in 10 colours, a loose bow, a
  floor-length cloth, square and rectangular stretch covers, beschermplaten in 10 sizes. Statafelshop has about 11
  textile SKUs.
- Packs: every bundle variant carries exact components. The easy-up starter and complete packs have no
  counterpart at Outmate.
- Add-ons are matched per variant and scale with legs and points. Neither shop does that.
- Staffels on 89% of products, FAQ on 100%, included/excluded lists, size guides, print workflow with proof
  and positions.
- Category structure: one landing per tent system, with a parts collection per system and a `systeem` filter.

---

## 8. Graded gap list

### Blocker (wrong data that ships the wrong part)

**B1 · Star-tent wall add-on offers white walls on black and sand tents.** `zijwanden-stertent` has no
`Kleur` (its copy states the walls are white). Yet `stertent-enkele-mast` and `-dubbele-mast` variants in
Zwart and Zandkleur (and full colour) carry the white `…-SET` as their add-on. This breaks the CONTRACT rule
that an add-on without a matching colour is left out, not substituted. Outmate sells star-tent walls and wall
sets in all three tent colours plus print. Fix: add `Kleur` Wit/Zwart/Zandkleur (+ printed via `drukopties`)
to `zijwanden-stertent`, price as today, and map `addon_varianten` per colour. Interim: drop the add-on from
non-white variants.

**B2 · The add-on wall on the inflatable Pro is the standard-height wall.** `zijwand-opblaasbare-promotietent`
has no Pro-height variant. Its copy asks Pro buyers to write a note in the order, while
`opblaasbare-promotietent-pro` attaches the standard SKUs (`KK-ZW-AIR-4M-DI` …) as its add-on. Ticking the
box orders a wall that does not fit. Outmate sells walls per model. Fix: add `Uitvoering`
`Standaard`/`Pro (hogere doorloop)` (or a separate product), give the Pro its own SKUs, and remove the
note-in-order instruction.

### High

**H1 · No colour on the whole buizenframe / opslag system.** The tents, dakzeilen, 2 m panels and eind- and
tussenwanden are all white. Outmate sells its basic and 550 lines in up to 10 colourways: white, grey-white,
anthracite-white, blue-white, green-white, red-white, sand-white, grey, green and black. Storage tents come in
grey, green and black, and every part follows the tent colour. Fix: add `Kleur` with two-tone values in our
own naming (`Grijs-wit`, `Antraciet-wit`, `Blauw-wit`, `Groen-wit`, `Rood-wit`, `Zandkleur-wit`, plus `Grijs`,
`Groen`, `Zwart` for opslag), and the same values on `dakzeil-partytent-buizenframe`,
`zijwand-partytent-2-m-pvc` and `eindwand-en-tussenwand-partytent`. Wire colour-matched add-ons. Add each
value to the `swatch_colors` default (two-tone needs a split swatch or a pattern image, see §9).

**H2 · Size ladders for buizenframe, storage and carport tents.** Missing:

- PVC 500: 3×3, 4×4, 4×10, 5×4, 5×6
- PVC 550: 4×10, 5×4, 5×10, 5×12, 6×10
- PVC 620: 3×4, 3×6
- compleet: 3×6
- opslag (each line): 3×8, 4×4, 4×10, 5×4, 5×6, 5×8, 5×12, 6×6, 6×8, 6×10
- carport: 3.3×7.2, 3.3×9.6
- dakzeil: 4×10, 5×4

Shoppers who know their footprint and land on a missing size leave.

**H3 · Statafel decor and frame-colour matrix.** Five decors on black only, against about 8 decors and up to
5 frame colours in both shops, where white-on-white is the default event look. Fix: on
`statafel-inklapbaar-professional` (and its pack and terrace twin), split `Kleur` (top) from a new frame
colour and add 3–4 decors under our own Dutch names, e.g. `Gespikkeld grijs`, `Leisteen`, `Vintage hout`,
`Eiken`. The frame colour could go in `Uitvoering` (combined with in/outdoor) or replace the parasol-hole
split, since Shopify allows only 3 options. Keep the compact-HPL outdoor family as the second step.

**H4 · Terrastafels.** We have one folding square/rectangular product. Both shops run a full terrace line
that mirrors their statafels (round Ø60–85, square 60/70, wide 120, same decors and frames), and
Statafelshop has it as a top-level category. Fix: add a round folding terrace table Ø70/80/85 (75 cm) on
the Professional base, extend the decor matrix to it, and give `terrastafels` its own collection and menu
entry instead of the merged `tafels` landing.

**H5 · Banquet, conference and exam tables.** We have HDPE rectangular and round Ø150/180 only.

- Statafelshop's "Tafels" category sells wooden banquet tables 122/183 and round Ø122/153/165/183,
  conference tables 120–180×80 with T- or U-frame (frame and top colour), and an exam table.
- Outmate adds half-round, quarter-round, oval, square 140 and 153/220 lengths (35 SKUs).
- These are core for catering, weddings, schools and offices, all audiences named in the brief.

Fix: add `bankettafel-houten-blad` (rect + round sizes), `vergadertafel-inklapbaar` (size × frame type ×
colour) and `examentafel-90x60`, plus their trolleys.

**H6 · Transportkarren priced 20–67% below both shops.** See §4 for every row. The bundles that embed the
karren inherit the gap (24 barkrukken + kar −26 to −44%, 40 stoelen + kar −30%). This breaks the policy
floor and signals a lower-grade product. Fix: re-base the trolley prices to 5–15% under the lower reference
and recompute the bundles.

**H7 · Biertafels and bierbanken priced 20–52% below market, sets barely cheaper than parts, short size
range.** The bench costs €39.95/49.95 against €72.50–96.74. The set saves 0.5–2% against a policy of
10–12%. We have 2 sizes against 5–8 (180 cm; 220×60/67/80), and no frame colours. Fix: re-base, apply the
set discount, add sizes and frame colours (`Kleur onderstel` via `Uitvoering`).

**H8 · Stretch accessories off-market and mis-sized.**

- Hypar at €995–1,895 is 55–62% under the only reference (€2,219–4,990) with a similar inclusion list.
- Koppelgoot at 3/6 m for €69.95/119 sits against 4.5–21 m at €199–899 (6 m: €249). Our lengths do not fit
  our own tent sides (4.5, 7.5, 10.5, 15, 19.5 m).

Fix: re-base the hypar. Give the koppelgoot lengths 4.5, 6, 7.5, 9, 10.5, 15 and 19.5 m at reference minus
10%.

**H9 · Entry HDPE statafel above market.** €54.95 against €45 in both shops, and €74 for a 2-pack at
Statafelshop. It is the "vanaf" anchor of the statafel collection and of most ads. Fix: €42.95–44.95, plus a
2-pack and a 4-pack (`set` tag).

**H10 · Koelkasten and vriezers: a whole Outmate menu subcategory with no coverage.** 11 SKUs from €325 to
€2,215: glass-door bar fridges 128/198/320 l, stainless uprights, a chest freezer, a 1,000 l rolling bottle
cooler and fridge trolleys. These serve the horeca and event audiences of the brief. Fix: add 4–6 products
(bar fridge 3 sizes, bottle cooler, chest freezer, trolley) under `meubilair` or a new `inrichting`
collection with an Inrichting menu group.

**H11 · Shipping cost is not modelled per product.** One €59 pallet rate covers a 3×4.5 easy-up, a 1,000 kg
block, a 10.5×19.5 stretch tent and "15 statafels + kar". Outmate prints a product-specific shipping line on
399/400 PDPs, with tiers by quantity on heavy goods (ballast €75–135 per block; statafels 1/2/3+). Fix: set
`verzendkosten` on heavy and oversize items (betonblokken, stretch/ster/zeshoek tents, kar packs, biertafel
10-packs). Extend the contract with a tier field (e.g. `verzendkosten_staffel` json
`[{"vanaf":1,"bedrag":…}]`) and the matching Shopify rates. List everything in `docs/claims-to-confirm.md`.

**H12 · Buizenframe spare-parts depth.**

- Connectors: 4 types against 15 (3- and 4-way at 110°, 120° and 140°, ridge-brace pieces, ground-frame
  corner/side/end, 50 cm straight).
- Tubes: 4 lengths against about 20.
- "Parts available" is one of Outmate's headline promises, and our 5 buizenframe lines need the angles of
  their own roof pitches.

Fix: derive the connector and tube list from our own bouwtekeningen per line and size, and sell each type as
a variant.

### Medium

- **M1 · Accessory discount with the main product.** Outmate gives 10% off on about 70 PDPs. Options: a
  Shopify automatic discount "accessoire bij tent" plus a flag (e.g. `addon_korting` 10) the PDP can show, or
  state that the starter and complete packs are the discounted route.
- **M2 · Parts list on the main PDP.** Add `onderdelen` (list.product_reference) to tents and statafels,
  generated in `build.py` from the reverse of `past_op`, and render a "Losse onderdelen" block.
- **M3 · Seating cross-sell on round statafels.** Add a barkruk ×4 add-on (colour-matched where possible) to
  `statafel-inklapbaar-professional`, `-met-kruisvoet` and `-hdpe-80`, and stools/chairs to every terrace
  table.
- **M4 · Stretch-tent add-ons.** Quantities are flat on every size (1 wand 3 m, 2 palen, 1 block 500 kg)
  and `complementary` is empty. Scale the wall and pole counts by size, link `koppelgoot-stretchtent` and
  `onderdelen-stretchtent`, and keep the ballast-via-quote wording.
- **M5 · Stretch fixings.** Missing: round pegs 100/120 cm, pole caps (plastic/rubber), a centre-pole foot
  plate, galvanised hooks and eye nuts, a peg puller, a 5 m pole, and a standard/heavy rigging choice.
- **M6 · Prikkabel and LED depth.**
  - Lengths 5/15/25/40/60–100 m.
  - 1 or 2 sockets per metre, and lead length to the first socket.
  - End piece choice: cap, hook or link plug, so strings can be chained.
  - Single LED lamps in 8 colours plus extra-warm 2,000 K, IP65 and dimmable 2–3 W.
  - Parts: droppers 20–50 cm, link plugs and connectors, clips, power strips, extension leads 5–30 m.
- **M7 · Easy-up Premium full colour.** Outmate prints the whole Premium. We print the valance only. Add
  `easy-up-partytent-premium-full-colour-bedrukt` (3 sizes).
- **M8 · Buizenframe long walls and PE end walls.** Long side walls 4–10 m (PE with windows) and 3–10 m (PVC,
  220 cm), a 1.5 m panel, and PE eindwanden 3/4/5 m.
- **M9 · Seating range and chair textile.**
  - Resin wedding chair (white/black) with a trolley and a 25/26-piece pack, sold by both shops.
  - Colourful metal barkruk and stapelstoel in 6–8 colours (ours 3).
  - Chair stretch cover, plus a chair + cover pack (Statafelshop).
- **M10 · Biertafelset covers.** 8 sizes and about 10 colours at €24.99 per set of 3, against our 2 sizes and
  3 colours at €39.95–44.95. Add 180 cm and 220×60/80 sizes and more colours, and re-price.
- **M11 · Lopers.** Add white (wedding aisle), blue, bordeaux, green, pink and sand, a second quality, and a
  50 m roll variant. Add gaffer tape and carpet tape as accessories.
- **M12 · Afzetpalen depth.** Belt colour (zwart/rood/blauw) on `afzetpaal-met-trekband`. A post with round
  top for ropes plus velvet or twisted ropes in about 8 colours. Wall belt units, an A4 sign holder, and a
  barrier trolley.
- **M13 · Tentvloer and garderoberek.** Two Outmate menu entries with no coverage: a roll-out tent floor (per
  m²) with carpet tiles, and a coat rack on wheels with a coat-rack trolley.
- **M14 · Design statafels.** Optional second step: a marble or gold-frame line and a self-levelling base.
  Present in both shops at €195–381.
- **M15 · Packing data.** `verpakt` (box size, box count, freight or parcel) on 17/166 only. Outmate gives it
  on nearly every tent and heavy item. Fill it for all `pallet` products and tents.
- **M16 · Downloads beyond tents.** Add mounting sheets for easy-up walls and wall sets, buizenframe eind- and
  tussenwanden, star-tent walls and statafels (set-up and safety).
- **M17 · Garden pavilion.** A steel line, a 4×4 size, a second colour (mocha/sand), and concrete footings
  plus adjustable feet.
- **M18 · Half-wall mounting.** Outmate requires a horizontal tube profile with inline, corner and double
  connectors. Ours relies on a sewn tension cord. Confirm with the supplier. If a profile is needed, add it
  and link it as a required add-on.
- **M19 · Table parts.** DIY beer-table frame sets (table and bench, 50/60 cm), locking clips, floor
  protectors, folding-table frame sets and levelling legs.
- **M20 · Packs.**
  - Folding tables + kar in 10/20/25/30.
  - Folding chairs + kar (25/50).
  - Bar stools + kar at 15/30.
  - Buffet tables 10/25 with skirts, plates and kar (we have one buffet config).
  - Optional per-table extras inside a statafel + kar pack (skirt, plate), as Statafelshop does.
- **M21 · Regengoot fit.** One gutter is offered for easy-up and buizenframe, while Outmate sells a separate
  buizenframe gutter at about twice the price. Confirm the fit or split it into two products.
- **M22 · Metallic stretch skirts.** Statafelshop prices gold and silver at a premium tier (+74%). Ours are
  flat €19.95. Add a price tier for `Goud`/`Zilver` (or confirm it is the same cloth).

### Low

- **L1** Stretch tent and stretch cloth sizes 4.5×7.5 and 10.5×12. A rigging choice (standard/heavy).
- **L2** Easy-up cover per roof cloth (PVC vs polyester). Joining strip in all tent colours. Storm-strap
  sets with peg length and 1/2/3 sets.
- **L3** Prices slightly outside the −5…−15% band:
  - below: easy-up Pro 2×2 and 3×6 (−17%), prikkabels (−19…−22%), topcover (−40%), statafelhoes met strik
    (−23%), zijwandensets (−20…−25%), stormbandenset (−35%)
  - above: PVC 620 4×6 (+12%), 550 compleet (+3…+9%), PVC 500 5×12 (+15%), carport (+5%)
- **L4** Colours we list beyond what the reference stocks (supplier must confirm): easy-up Pro 2×2 (3
  colours) and 5×5 (4), zeshoektent in 4 colours, stretch tents in white/black. Add them to
  `docs/claims-to-confirm.md`.
- **L5** Shade sails 4×2 rectangle and 4×4×4 triangle. A fixing set.
- **L6** A 50 cm extension piece for the overkapping wall.
- **L7** Star-tent pegs and a peg puller.
- **L8** Info content: ground frame and ridge brace explained, storage-tent chooser, shade-sail FAQ, wedding
  in a stretch tent, build your own beer table, a statafel buying guide. All original, as blog articles.
- **L9** An expected-restock date (e.g. `verwacht_op`, date). `availability_status` is still unused on all
  166.
- **L10** Market stall: frame finish, scalloped edge, skirt, spare roof, skirt and top, and a trolley.
- **L11** A budget 1,500 W electric heater at about €79 (Outmate's cheapest).
- **L12** Kerstverlichting with or without a lead cable.
- **L13** Loose statafel tops in square and rectangular sizes. Parasol caps and blade supports as parts.

---

## 9. Notes for the builder (colour naming and contract)

- **Colour names** follow `catalog/CONTRACT.md` and `brand/brand.md` v7 §4.2:
  - Use capitalised Dutch cloth colours. Never a brand palette name as a product colour (`Lampion`, the old
    `Klaproos`, `Inkt`, `Linnen`, `Polder`, `Zon`, `Oker`, `Kiezel`). Today's 32 `Kleur` values pass.
    `Wit` and `Bordeaux` coincide with palette tokens but name the cloth, which §4.2 allows.
  - Two-tone tent colours: name them `Grijs-wit`, `Antraciet-wit` and so on (roof-side order), not their
    "Grijs / wit" spelling.
  - Table decors: use our own descriptive Dutch names, not the laminate trade names both shops use (`Leisteen`
    for slate, `Gespikkeld grijs` for speckled, `Vintage hout`, `Eiken`).
  - Every new value needs an entry in the theme's `swatch_colors` default. Two-tone values need a split swatch
    or a pattern image linked through `shopify.color-pattern`.
  - The only stock colour close to Lampion is `Oranje` (stretch skirt, and now also inflatable frames and
    LED/lichtslang). Sell it as `Oranje`, and keep it out of brand imagery next to the logo.
- **Option budget.** Shopify allows 3 options. On statafels, frame colour plus top decor plus in/outdoor
  plus parasol hole will not fit. Fold in/outdoor into the decor family (compact HPL decors are outdoor by
  nature), or split per frame colour into `andere_maten`-style sibling products.
- **Contract additions these fixes need** (update theme, catalog and seed together):
  - `onderdelen` (list.product_reference) for M2
  - a tiered shipping field for H11
  - optional `addon_korting` for M1
  - `verwacht_op` (date) for L9
- **Every price change** above goes into `docs/claims-to-confirm.md`, as the brief requires.
