# Referentiedossier / Reference dossier — Outmate.nl & Statafelshop.nl

Status: 2026-10-17. Synthesized from 5 research agents (raw output:
`$SCRATCH/research-raw.json`), plus merges of three 8-agent follow-up rounds that could not search
(see §0). Companion files: `reference/features.json` (functional bar, 143 items) and
`reference/assortment.json` (assortment bar, 14 categories / 85 subcategories).

## 0. Read this first: how this was gathered and what it does not cover

- **Method.** WebFetch and curl to the reference shops are blocked (BRIEF §3). Everything below
  comes from **WebSearch index snippets** of outmate.nl and its sister sites. The snapshots range
  from about 1 month to more than 2 years old. Prices are therefore **indicative**, and where two
  snapshots disagree both values are given.
- **Confidence labels.** **confirmed** means a snippet states it directly. **likely** means it was
  summarised or inferred from URL patterns. **UNCONFIRMED** means search could not verify it, and
  nothing marked that way may be presented as fact.
- **Statafelshop.nl: no data at all.** Both the Statafelshop agent and the market-pricing agent
  ran into the shared per-turn limit of 200 WebSearch calls before running a single query. The
  synthesizer retried and was also refused. Every Statafelshop statement in these files is
  therefore taken from `gauntlet/BRIEF.md` §1 and is marked **UNCONFIRMED (brief)**. The query
  plan for a rerun is in §14.
- **First follow-up round (2026-10-17): also blocked.** Eight follow-up agents were sent out: four on
  Statafelshop (navigation/operator/statafels, covers, print/bundles/B2B, service/shipping/UX)
  and four on Outmate gaps (buizenframe matrix, furniture/lighting prices, account/search/footer,
  policies/easy-up box contents). Every one was refused with "web search budget is used up"
  before its first query, and none worked around the limit. **No new evidence was gathered.**
  The merge only (a) adds Outmate details that were already sourced in `research-raw.json` but
  not yet in these files, (b) fixes two over-claims (see features.json `product.statafelrok-fit`
  and `b2b.ex-vat-first`), and (c) lists, per question, what is still UNCONFIRMED. Outmate facts
  offered as Statafelshop proxies stay labelled as Outmate. They are not Statafelshop data and
  must not be merged into Statafelshop entries.
- **Second follow-up round (2026-10-17): also blocked.** Eight more agents: four on Statafelshop
  (covers and textiles; statafels, actiepakketten and trolleys; print, B2B and statafelshop.be;
  operator, service, shipping and UX) and four on Outmate (buizenframe and opslagtent matrix;
  furniture, lighting and heating prices plus existence checks; policies; easy-up box contents
  plus account/search/footer UX). Every first query was refused by the same shared 200-call
  budget, so this is the **third Statafelshop attempt with no data**. **No new evidence was
  gathered.** The merge only (a) adds easy-up spec values that were already sourced in
  `research-raw.json` but missing here (§4, §7), (b) adds existence checks that were never run
  (cadeaubon, outlet/B-keuze, kerstverlichting URL, floors beyond lopers; §16), (c) fixes one
  citation (features.json `b2b.zakelijk-page`) and adds `checkout.gift-card` (brief-required), and
  (d) records the Ultimate slug spelling (§3). Values the agents copied from these files were not
  re-checked and keep their original labels.
- **Third follow-up round (2026-10-17): also blocked.** Eight agents: three on Statafelshop
  (operator, navigation and policies; statafels, textiles and trolleys; print, B2B and
  statafelshop.be) and five on Outmate (buizenframe and opslagtent matrix; category census and
  existence checks; furniture, lighting, heating and afzetpaal prices; policies, payment and the
  offerte page; storefront UX, account and easy-up box contents). Each first query (mode
  "extended", `allowed_domains` set to the shop) was refused with "this turn's web search budget
  is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)", because the
  searches again did not run first and alone in a fresh turn. This is the **fourth Statafelshop
  attempt with no data**, and `$SCRATCH/research-raw.json` holds no statafelshop.nl URL to fall
  back on. **No new evidence was gathered.** The merge only:
  - maps 13 category URLs that were already sourced (`$SCRATCH/raw_cats.txt`, 82 URLs) but never
    mapped: 11 new subcategories (74 → 85) plus alias paths (§2, §3);
  - logs 16 checks that never ran in assortment.json `existence_checks` (`query_ran: false`; §16);
  - adds `partytenten-buizenframe.size_line_matrix`, a single view of the size × line cells that
    were already sourced (§4);
  - adds a refusal note to the features.json entries that were asked about, and folds in facts
    that were already sourced: the footer lines, the payment-method list, the `?_frame=` facet
    pattern, no wishlist in the header text, sealed Premium seams, sale prices on single products;
  - makes the furniture, lighting and afzetpaal gaps more precise, removes duplicate text in
    features.json (`content.faq`, `header.account`, `service.payment-icons`) and fixes the attempt
    counts.

  No price was added and no Statafelshop entry was created. Every Statafelshop item stays
  UNCONFIRMED (brief), and Outmate proxies stay labelled as Outmate.
- **Rerun lesson.** Parallel agents share one 200-call budget per turn. Run the Statafelshop
  queries (§14) as **one agent, first and alone**, in a turn with a fresh budget (a new user
  message starts one), or after the owner raises `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`.
  Re-sending the same fan-out in a spent turn fails the same way; it has now failed in three
  follow-up rounds.
- **Market price calibration** beyond Outmate (vvep, partyrijk, bol.com, Gamma/Praxis, other
  statafel shops): **none gathered**. See §15.
- **Do not copy.** The following must not be reused (BRIEF §6): Outmate's review counts
  (/reviews/ showed 3232), product ratings, Trustpilot scores, their wording, and their
  unverifiable superlatives ("Door eigen import de goedkoopste!", "Nr.1 aanbieder in NL en BE").
  Their model names (Starmate, AirMate, Times Square, Tundra, …) appear here only to identify
  reference items.

## 1. Company & platform

| Item | Finding | Source | Conf. |
|---|---|---|---|
| Operator | Outmate B.V., KvK 76398021, BTW NL860611541B01. Postal address d'Olde Dijk 7A, 7951 LE Staphorst. Warehouse/pickup Esakker 5, 7951 SV Staphorst. | https://www.outmate.nl/contact/ · https://www.outmate.nl/service/ | confirmed |
| History | Selling party tents via webshops since 2014; inflatables since 2020; stretch tents since 2018. Private partner of a South African stretch-fabric maker since 2021. | https://www.outmateair.nl/contact-en-over-ons/ · https://www.outmatestretch.nl/contact-en-over-ons/ | confirmed |
| Platform | WordPress + WooCommerce, imported with WP All Import. Filters probably run on FacetWP (`?_frame=zwart`, `?_pa_kleur=`), which is inferred. Cookie banner wording matches Complianz, also inferred. Site built by Optimus Websites (Staphorst). | https://www.outmate.nl/wp-content/uploads/wpallimport/files/38cp.pdf · https://www.outmate.nl/conditie/nieuw___nl-be___nl-be/ | confirmed / likely |
| Legacy brand | Rebranded from partytentkopen.nl. Many SEO titles still end in "- Partytentkopen.nl". partytentkopen.nl serves the same site; whether it 301-redirects is UNCONFIRMED. | https://www.outmate.nl/product-categorie/partytenten/partytenten-pvc-classic/ · https://www.partytentkopen.nl/alle/ | confirmed / likely |
| Sister shops | outmate.be (BE mirror, same URL structure). outmateair.nl (inflatables, higher prices: Alpha 3x3 €1.400 there vs €1.250 on outmate.nl). outmatestretch.nl (stretch tents). partytentkopen.be. Explicit cross-links between the sites are UNCONFIRMED. | https://www.outmate.be/product-categorie/partytenten/ · https://www.outmateair.nl/product-categorie/promotietenten/ | confirmed |
| Marketplaces | Outmate brand stores on bol.com (NL+BE); also listed on beslist.nl, lionshome.nl and Marktplaats. | https://www.bol.com/nl/nl/b/outmate/605686588/ | confirmed |
| Statafelshop.nl | Run by Outmate BV per the brief. Nothing verified: the operator, KvK, BTW and address have never been read from a Statafelshop page (check against the Outmate row above once its contact/footer page can be read). Whether statafelshop.be exists as a BE mirror, who runs it and its prices are also unverified. | gauntlet/BRIEF.md §1 | UNCONFIRMED |

**Takeaway for us.** Outmate runs four or five overlapping storefronts. Duplicate products carry
different prices and the company data is inconsistent across them. One coherent store with NL+BE
Markets is an obvious way to do better.

## 2. Global UX: header, footer, banners, contact channels

**Header** (seen on content pages, https://www.outmate.nl/contact/, likely):
- "Zoeken" (search). Live suggestions, whether results mix products with pages or blog posts,
  and the results layout are UNCONFIRMED (https://www.outmate.nl/?s=partytent was never read).
- "Log in" / "Mijn account" (standard WooCommerce). Checkout works with an account or as a guest
  (https://www.outmate.nl/bestellen-annuleren/, confirmed). The privacy statement keeps order data
  while the account exists, which implies accounts hold order history
  (https://www.outmate.nl/privacy-en-veiligheid/, likely). The /mijn-account/ dashboard tabs and
  whether registration asks for bedrijfsnaam, BTW or KvK are UNCONFIRMED. No separate business
  account was found.
- Cart counter ("Winkelwagen")
- "Afrekenen" link
- An **"Offerte aanvragen" button at top right** (confirmed, https://www.outmate.nl/easy-up-tent-bedrukken/). It is meant for larger orders and for organisations with PO or approval flows.
- No wishlist link appears in the header text (likely). Product compare and recently viewed were
  never checked (UNCONFIRMED, not a "not found").

**USP / top bar**: UNCONFIRMED. No USP texts were found, and **no free-shipping threshold exists
anywhere on outmate.nl**. The "gratis verzending vanaf €20/25" seen on bol.com is bol.com's own
policy (https://www.bol.com/nl/nl/b/outmate/605686588/).

**Cookie consent**: a banner with consent categories (likely Complianz). Privacy and cookies share
one statement, "Privacy en veiligheid". It says Google Analytics is used, order data is kept while
the account exists or up to 1 year after the order, and it was last updated 1 April 2018
(https://www.outmate.nl/privacy-en-veiligheid/).

**Footer** (https://www.outmate.nl/conditie/nieuw___nl-be___nl-be/, likely):
- Company name and address, KvK, e-mail, "© 2026 Outmate.nl", "Realisatie: Optimus Websites".
- Probable service links:
  - /service/
  - /contact/
  - /levertijd-en-verzendkosten/
  - /bestellen-annuleren/
  - /retourinformatie/
  - /algemene-voorwaarden-nieuw/
  - /privacy-en-veiligheid/
  - /reviews/
  - /showroombezoek/
- Column titles, payment icons, a newsletter signup and links to the social profiles: UNCONFIRMED.

**Reviews / trust marks**: an on-site review page "Shopervaring" (https://www.outmate.nl/reviews/,
confirmed) plus purchase-gated WooCommerce product reviews. Trustpilot profiles exist, but an
embedded Trustpilot widget is UNCONFIRMED. No Kiyoh or WebwinkelKeur was found. We copy the
feature only, never counts or scores.

**Contact channels**:
- Phone 085 822 0794 and info@outmate.nl (https://www.outmate.nl/service/).
- WhatsApp buttons appear on the sister sites (https://www.outmatestretch.nl/); a WhatsApp button
  on outmate.nl itself is UNCONFIRMED.
- Live chat: only an old review mentions it, so it is UNCONFIRMED.
- Social: facebook.com/outmatebv, instagram.com/outmate.nl and the legacy x.com/partytentnl
  (Partytentkopen.nl) (https://www.instagram.com/outmate.nl/, likely). Whether the shop links to
  them is UNCONFIRMED.

**Data hygiene problems on Outmate**:
- The phone number appears as both 085 822 0794 and 085 855 0794.
- The returns page still lists info@partytentkopen.nl and 06 143 01 250.
- Terms exist twice: "Algemene voorwaarden - OUD" and "-nieuw".
- Category slugs are duplicated, e.g. `accessoires-meubilair` vs `meubilair-accessoires`. The
  "Rokken en hoezen" category alone resolves at three URLs:
  `/product-categorie/meubilair-accessoires/statafelrokken/`, `/product-categorie/statafelrokken/`
  and `/product-categorie/uncategorized/statafelrokken/`.
- The two furniture-accessory parents hold different children: `/accessoires-meubilair/` has
  frame-onderdelen and transportkarren, while `/meubilair-accessoires/` has statafel-onderdelen,
  statafelrokken and stoelen-onderdelen. More alias paths: the misspelt legacy slug
  `/product-categorie/strechtenten/`, and a second zijwanden path
  `/product-categorie/partytent-accessoires/zijwanden/` titled "Zijwanden voor partytenten of je
  veranda" (likely).

Sources: https://www.outmate.nl/retourinformatie/,
https://www.outmate.nl/product-categorie/meubilair-accessoires/statafelrokken/ and
https://www.outmate.nl/product-categorie/partytent-accessoires/zijwanden/. Our shop must not repeat
any of these.

## 3. Navigation tree (Outmate.nl)

The top-level order and mega-menu layout are UNCONFIRMED. Menus also differ from page to page.
The groups below are confirmed from category menus and URLs.

```
Partytenten (buizenframe, 38 mm)        /product-categorie/partytenten/   "Van 3x3 tot 8x12m"
  PE Basic · PVC Classic · PVC Premium · PVC Ultimate edition* · PVC Professional
Easy up partytenten                     /product-categorie/easy-up-partytenten/
  Premium (staal hex 40) · Professional (alu hex 50)
Accessoires Easy Up                     /product-categorie/accessoires-easy-up/
  Zijwanden en zijwandenset · Dakzeilen · Transport en beschermtassen ·
  Bevestigingsmaterialen · Regengoten en verbindingsgoten · Inrichting (heater, LED)
Onderdelen Easy up > Frames en frame onderdelen
Partytent onderdelen                    Dakzeilen · Zijwanden en zeilen · Eindwanden · Koppelstukken ·
                                        Partytent buizen · Betonblokken · Bevestigingsmaterialen
Partytent accessoires                   Regengoten · Tussenwanden · Eindwanden/kopse kanten ·
                                        Stormbandensets · Opbergtassen · Zijwanden · Bevestigingsmaterialen
                                        (+ Grondframes, Reparatiesets: URL unconfirmed)
Opslagtenten                            PVC Classic · PVC Premium · PVC Professional · Wikinger carport
Stretchtenten en onderdelen             Stretchtenten (met lusverbinding) · Stretchtent doeken ·
                                        Zijwanden stretchtent · Onderdelen (Bevestiging, Koppelgoten, Palen)
Stertenten                              enkele mast 8/10/12/14/16 m · dubbelmast 8x13–13x21 · Stertent zijwanden
Opblaasbare partytent & promotietent    Alpha · Beta · Theta · Hexon · Accessoires · Zijwanden, luifels en tunnels
Zeilen en zeildoeken (incl. Schaduwdoeken)  Schaduwdoeken (HDPE / PU-polyester) · (Overkapping zeilen = homepage section)
                                        (anything else in this group, e.g. dekzeilen: unconfirmed)
Tuinpaviljoen                           + Tuinpaviljoen zijwanden
Tafels en stoelen                       Statafels · Klaptafels · Terrastafels · Stoelen · Barkrukken · Barrels ·
                                        Biertafels en bierbanken (menu only) · Barkruk/Klaptafel/Statafel onderdelen
Accessoires meubilair                   Frame onderdelen · Transportkarren · Rokken en hoezen · Statafel onderdelen ·
                                        Stoelen onderdelen
Verlichting                             Prikkabels · Ledlampen · Led lichtslangen · Kerstverlichting**
Verlichting onderdelen > Prikkabel onderdelen
Verwarmingen                            Elektrisch · Gas (URL unconfirmed) · Accessoires
Inrichting                              Afzetpalen · Marktkramen
Vloeren, tapijten en lopers > Lopers    (floors/grondzeilen beyond lopers: not checked)
```

\* The Ultimate slug is singular: `/product-categorie/partytenten/partytent-pvc-ultimate-edition/`,
unlike the other lines (`partytenten-pvc-…`). Use that form in a rerun (not re-checked).

\*\* Kerstverlichting is a menu label only; no category or product URL has been recorded.

All 82 category URLs in `$SCRATCH/raw_cats.txt` are now mapped in assortment.json (offline census,
2026-10-17; no query ran). Koppelgoten, Palen en palensets and Tuinpaviljoen zijwanden were seen by
name only, so their own URLs are UNCONFIRMED and those nodes point to their parent URL.

Primary sources: https://www.outmate.nl/product-categorie/stretchtenten-en-onderdelen/,
https://www.outmate.nl/product-categorie/tafels-en-stoelen/,
https://www.outmate.nl/product-categorie/partytent-onderdelen/ and
https://www.outmate.nl/product-categorie/verlichting/.

**Statafelshop.nl navigation**: UNCONFIRMED. Per the brief, the assortment covers statafels,
statafelrokken/-hoezen (stretch & strik), statafelkleden, bedrukte hoezen, actiepakketten and
zakelijk/B2B. The top menu, footer links and homepage sections have never been read. Paths such
as `/statafels/`, `/statafelrokken/`, `/statafelhoezen/`, `/statafelkleden/`, `/actiepakketten/`
and `/zakelijk/` were only guessed for a query and never checked, so do not assume they exist.

## 4. Assortment summary

The full matrix of variant dimensions, specs, reference prices and accessories is in
`reference/assortment.json`. The headlines:

- **Easy-up** comes in two lines.
  - **Premium** is steel hex 40 mm, 3x3/3x4,5/3x6, €299/€379/€459
    (https://www.outmate.nl/product-categorie/easy-up-partytenten/easy-up-partytenten-premium/).
  - **Professional** is 6063-T5 aluminium hex 50 mm in sizes 2x2–5x5. Each size is sold as two
    separate products by canopy:
    - **PVC-coated polyester 320 g/m²**, from €599 (2x2) to €1.449 (4x8).
    - **Heavy duty PVC 580 g/m²**, from €789 (3x3) to €1.769 (4x8).
    - Source: https://www.outmate.nl/product-categorie/easy-up-partytenten/easy-up-partytenten-professional/.
  - Colours: Zwart, Wit, Blauw, Grijs, Zandkleur, Groen, Rood, plus **Full Colour-bedrukking** as a
    colour value. Heavy duty PVC comes only in Zwart, Wit and Full Colour.
  - Spec examples: 4x6 HD weighs 88 kg, gives 210 cm clearance and holds 36 standing / 24 seated
    (https://www.outmate.nl/product/easy-up-4x6m-professional-heavy-duty-pvc/). The same spec
    snippet gives the Professional polyester 3x4,5 as 300x450x330 cm and 42 kg, and the 3x6 as a
    63 kg frame plus an 11 kg canopy (confirmed).
  - Premium weights: one source gives the 3x4,5 a total of 37 kg
    (https://www.outmate.nl/product/easy-up-partytent-3x45m-premium-pvc-gecoat-polyester/, likely)
    and the 3x6 canopy weighs 11 kg
    (https://www.outmate.nl/product/easy-up-partytent-3x6m-premium-pvc-gecoat-polyester/, likely).
    The 3x3 weight, Premium clearance, total height, capacity and packed size are UNCONFIRMED; only
    "5 hoogtestanden" is known.
  - Premium connectors are hard plastic, and a reviewer says they wear out quickly
    (https://www.outmate.nl/product/easy-up-partytent-3x3m-premium-pvc-gecoat-polyester/,
    confirmed). The Professional uses aluminium connectors.
- **Buizenframe partytenten** come in 5 quality lines by canopy weight: PE 200, PVC 500, 550,
  Ultimate, and 620 g/m².
  - Sizes run 3x3–8x12 (category title); which line offers 8x12 is UNCONFIRMED.
  - Only three prices are sourced: 3x4 PE €279, 3x8 Premium €789 and 6x12 Pro €1.725.
  - Sizes seen without a price: PE 3x6 (assembly PDF), Classic 5x8 (PDF), Premium 3x3 and 4x4,
    Ultimate 4x6 (incl. 6 window walls + 2 end walls). Professional replacement roofs exist in
    3x4/5x10/6x12, which suggests tents in those sizes (likely,
    https://www.outmate.nl/product/partytent-dakzeil-6x12-pvc-professional/).
  - Frame: 38 mm galvanised tubes with a 1,2 mm wall, per the spare-tube category text, not per
    line (https://www.outmate.nl/product-categorie/partytent-onderdelen/, likely). Side walls attach
    with klittenband per a category facet; which lines use it is UNCONFIRMED.
  - Fire-retardant: Premium yes (confirmed); Professional likely (slug "pvc-brandvertragend");
    PE Basic and PVC Classic UNCONFIRMED.
  - The full size × line matrix, per-line wall thickness, side-wall set-up, capacity, weight and
    shipping are UNCONFIRMED. The per-line table on
    https://www.outmate.nl/het-verschil-tussen-de-partytenten/ was never retrieved. The 10 cells
    that are sourced (13 sizes × 5 lines) are collected in assortment.json
    `partytenten-buizenframe.size_line_matrix`. Every other cell is UNCONFIRMED.
- **Opslagtenten** come in four tiers, each with its own category URL: PVC Classic (short-term
  use), PVC Premium (longer use, e.g. during a renovation), PVC Professional (620 g/m²) and a
  carport/opslagtent PVC Professional with a fixed frame
  (https://www.outmate.nl/product-categorie/opslagtenten/, confirmed).
  - Only one size has been seen: the Classic 3x4, brandvertragend per its slug, with 1 jaar
    garantie (https://www.outmate.nl/product/opslagtent-3x4-classic-pvc-brandvertragend/, likely).
  - Every other size, the side and ridge heights, the door type (rolluik or rits) and every price
    are UNCONFIRMED.
  - Buying guides: https://www.outmate.nl/opslagtent-kopen/ and
    https://www.outmate.nl/opslagtent-kopen-welke-past-bij-je/.
- **Stretchtenten** use MK4 All-weather fabric (750 g/m²).
  - Sizes 4,5x6 to 10,5x19,5, from €2.630 (4,5x6) to €11.710 (10,5x15); op maat from €999.
  - Options: poles in kastanje or aluminium; rigging with spanbanden or touwensets.
  - Shipping €175.
  - Source: https://www.outmate.nl/product-categorie/stretchtenten-en-onderdelen/stretchtenten/.
- **Stertenten** come with one mast (8–16 m, from €989–€1.500) or two masts (8x13–13x21,
  €2.500–€3.500). Side-wall sets cost €475–€799.
- **Opblaasbaar** comes in four model families (square A, B, partytent, hexagon).
  - Prices run from €1.250 (3x3) to €9.950 (12x12).
  - Frames come in 8 colours; the roof can be printed and zips off.
  - Accessories are side walls, luifels, tunnels, pumps and LED lights.
- **Schaduwdoeken / overkapping**:
  - Schaduwdoeken in HDPE or PU, €39–€75.
  - Veranda zeil op maat, from €35.
  - Overkapping zijwanden 3–10 m, €109–€269.
  - Tuinpaviljoens, €695–€1.039.
- **Tafels & stoelen**:
  - Statafels: vierkant stapelbaar €159–169, opklapbaar €147–149, barrel Ø100 €399. No round
    statafel product was observed on Outmate, only loose round/square 80/85 cm tops as spare parts
    (https://www.outmate.nl/product-categorie/meubilair-accessoires/statafel-onderdelen/, likely).
    A round inklapbare statafel is assumed for Statafelshop only (UNCONFIRMED); the Ø60/Ø70/Ø80
    sizes come from a research query list, not from any page.
  - Terras- and klaptafels.
  - Barkrukken: five models seen (velours for indoor use; black wire stool, stackable up to 8;
    metal with a wooden seat; hamerslag; and one more with staffelkorting from 10 pieces). Each
    product URL is in assortment.json. All prices, colours and tier percentages are UNCONFIRMED.
  - Stoelen: the category exists, but types and prices are UNCONFIRMED. "Biertafels en bierbanken"
    is only a menu label; set widths, contents and prices are UNCONFIRMED.
  - Trolleys for every item. The only priced one is €589 for 10 statafels; the stoelen/barkrukken
    trolley holds 18 (https://www.outmate.nl/product/stapelstoelen-trolley-cross-back/, price
    UNCONFIRMED).
  - Bundles: 10x statafel + trolley €2.299 (sale €1.969); barrel set €775.
- **Statafelrokken**: the Outmate stretch rok costs €14,99. It fits 70–85 cm tops, includes a top
  cover, is made of 90/10 polyester/lycra 190 g/m², and comes in zwart, wit, turquoise and
  "exclusive" colours (https://www.outmate.nl/product/statafelrok-stretch/, likely). On Outmate the
  full colour list, any exclusive-colour surcharge, care instructions and staffel/set prices are
  UNCONFIRMED. Outmate's "Rokken en hoezen" category also holds biertafelset hoezen (sizes and
  price UNCONFIRMED). Strik hoezen, kleden, separate topcovers, printed covers and actiepakketten
  are from the brief and UNCONFIRMED.
- **Verlichting**:
  - Prikkabels: 230 V, 16 A, E27, IP44, 5–30 m, or made to measure up to 200 m. Prices per
    length and per metre are UNCONFIRMED.
  - LED lamps: wattage is known only for two 1 W sets of 5
    (https://www.outmate.nl/product/set-van-5-gekleurde-ledlampen/); prices and kelvin values are
    UNCONFIRMED.
  - LED lichtslangen: 36 LEDs/m, sold per metre; 20 m costs €58.
  - Parts.
- **Verwarming**: electric heaters of 1500 and 2100 W (easy-up heater €129); gas heaters of
  13 kW, 3000 W and 9000 W (prices, gas type and product URLs UNCONFIRMED).
- **Inrichting**:
  - Afzetpalen in messing or RVS with a 2 m belt, or messing with an oval head for a rope. The
    printed belt version needs at least 10 pieces. The price per post, the rope price and the
    printed-belt price are UNCONFIRMED.
  - Marktkraam 2 m, €533–599.
  - Rode loper, made to measure up to 60 m.
- **Onderdelen**: everything is sold separately, including roofs, walls, tubes (€9–12,50),
  connectors (€7,50–9,99), pegs, storm-strap sets and concrete blocks of 120–1000 kg.

## 5. Homepage (https://www.outmate.nl/)

- **Hero**: the `<title>` and headline are "Partytent?" with the slogan "Ga voor kwaliteit!"
  (confirmed). The hero image or slider is UNCONFIRMED.
- **Entry tiles** (confirmed): Easy partytenten, Buizenframe partytenten, Stretchtenten and Alle
  onderdelen, each with a one-line benefit.
- **Product rows** (likely; order not verified): Easy Up tenten, Stertenten, Statafel &
  Terrastafel, Opblaasbare tenten, Overkapping zeilen ("van 3 m tot 10 m en maatwerk"),
  Partytenten and Stretchtenten.
- **Promo block** "Uniek statafelsets": barrel statafels with barkrukken (confirmed).
- **Product tiles show a concrete dispatch date**, e.g. "Verzending: di 20 okt" (confirmed).
- **Visit block**: Staphorst address plus "Bezoek op afspraak: Plan je bezoek" (confirmed).
- Newsletter, review widget and USP icons: UNCONFIRMED.

## 6. Collection pages & filters

- Collections are nested, with subcategory pages and an intro explaining the quality tiers
  (https://www.outmate.nl/product-categorie/partytenten/partytenten-pvc-professional/).
- **Facets**:
  - Seen: afmeting, kleur, materiaal, bevestiging zeilen (klittenband), materiaal buizen, levertijd
    ("Binnenkort leverbaar"), conditie, fabrieksgarantie and frame colour (`?_frame=zwart`).
  - A **"Bedrukte tent!"** filter (`?_pa_kleur=full-colour-bedrukking-vouwtent`).
  - The attribute archives are indexed by search engines (/afmeting/4x4/, /materiaal/pvc/).
  - The only conditie value seen is "nieuw". Whether an outlet, B-keuze or occasion range exists
    was never checked (UNCONFIRMED, not a confirmed "not found").
  - Sources: https://www.outmate.nl/product-categorie/easy-up-partytenten/easy-up-partytenten-professional/?_pa_kleur=full-colour-bedrukking-vouwtent and https://www.outmate.nl/levertijd/binnenkort-leverbaar/.
- **Cards** show:
  - Incl. and excl. btw prices.
  - "Vanaf: €X" for variable products.
  - Struck-through sale prices.
  - A dispatch line.
  - "Nog 4 voorradig!" low-stock badges.
  - Pre-order labels.
- Product tags such as vouwtent, gewichten, regen-goot, stertent and palentent are also used.
- Sorting and pagination: UNCONFIRMED. They are standard WooCommerce, but nothing was observed
  (no `?orderby=` options, no load-more vs numbered pages, no products-per-page count).
- A price slider and an "op voorraad" filter: UNCONFIRMED.

## 7. Product page features (the most important part)

Primary examples:
https://www.outmate.nl/product/easy-up-partytent-3x3m-premium-pvc-gecoat-polyester/,
https://www.outmate.nl/product/easy-up-3x45m-professional-pvc-gecoat-polyester/ and
https://www.outmate.nl/product/easy-up-4x6m-professional-heavy-duty-pvc/.

1. **Price incl. + excl. btw** side by side, e.g. "€49,95 / €41,28 excl. btw"
   (https://www.outmate.nl/product/voetgewicht-voor-vouwtenten/).
2. **Per-product shipping line**: "De verzendkosten op dit product zijn €X". Some products add a
   quantity rule ("1 stuk: €12,50 | 2+ stuks: €25"). Some name the carrier type ("Pakketdienst"
   or "Vrachttransport") and list box dimensions
   (https://www.outmate.nl/product/partytent-4x4-premium-pvc-brandvertragend/). The labels conflict:
   the same €42,50 shows as "Vrachttransport" on the 4x4 Premium and as "Pakketdienst" on the 3x8
   Premium in one snapshot (https://www.outmate.nl/product/partytent-3x8-premium-pvc-brandvertragend/).
3. **Dispatch line**, computed per product:
   - "Vandaag verzonden", or a dated "Verzending: di 6 okt".
   - "binnen 1-3 werkdagen" for stock, "3-5 werkdagen" for freight, "10-15 werkdagen" for large or
     custom items, and "5-10 dagen na akkoord ontwerp" for print.
   - Statuses: Tijdelijk uitverkocht, Binnenkort leverbaar, Pre-order.
4. **Back-in-stock e-mail** signup when out of stock
   (https://www.outmate.nl/product/3-weg-recht-schuifkoppelstuk/).
5. **Variant UI**:
   - Colour picker, with Full Colour as one of the values.
   - Each **size and each canopy type is its own product**, so switching means navigating to
     another page.
   - Configurable add-ons: pole material, rigging, frame colour, luifel, wheel kit.
6. **Print flow** (https://www.outmate.nl/easy-up-tent-bedrukken/) — see §8.
7. **Spec table** (key·value). Fields seen:
   - Kleur, Afmeting, Materiaal frame ("Staal | Hex 40"), dakzeil, Brandvertragend, Treksterkte
     zeil.
   - Gewicht, Gewicht zeildoek, Gewicht frame.
   - Doorloophoogte, Totale hoogte.
   - Aantal pers. staand/zittend, Benodigde installatietijd.
   - Waterkolom, Waterdicht, Fabrieksgarantie, Materiaal buizen.
   - Source: https://www.outmate.nl/product/stretchtent-45-x-6-meter/.
8. **Downloads**: Opzetinstructie, Specificatieblad, Template voor bedrukking, Voorbeeld ingevuld
   template, Treksterkte berekening and Testrapport brandveiligheid
   (https://www.outmate.nl/product/easy-up-3x45m-professional-pvc-gecoat-polyester/). Premium
   pages carry the fire test report and a print template. There is a manuals hub, a general
   setup PDF (https://www.outmate.nl/wp-content/uploads/2020/10/Easy-up-Professional-Opzetinstructie.pdf)
   and per-product PDFs such as https://www.outmate.nl/wp-content/uploads/2023/01/Partytent-5x8-PVC-Classic.pdf.
9. **Sections**: Beschrijving, Specificaties, Downloads, Reviews. No FAQ tab was found.
10. **Cross-sell**: a "Handige accessoires" or "Ook handig om mee te bestellen" block. It lists:
    - voetgewicht 15 kg (€49,95)
    - spanriemen + haringen (€19,99)
    - wielen
    - regengoten
    - zijwanden
    - onderdelen
11. **Accessory bundle discount**: "10% korting op de volgende accessoires", meaning side walls
    bought with the tent
    (https://www.outmate.nl/product/easy-up-partytent-3x3m-professional-pvc-gecoat-polyester-2/).
    Lamps also get 10% off when bought with a prikkabel. How this is applied at checkout is
    UNCONFIRMED.
12. **Staffelkorting table**, e.g. Foldtable: 2–5 pcs 5% … 20+ pcs 12,5%
    (https://www.outmate.nl/product/foldtable-200x60cm/). Barkrukken have staffels from 10 pieces.
13. **Included / excluded** lists:
    - Tents: "Exclusief zijwanden".
    - Inflatables: 4 sandbags, bag, 4 guy lines and 4 pegs included.
    - Stertent 10 m: doek, bag, mast, 6 pegs and a measuring rope included.
    - Easy-up: nothing confirmed as included. Every accessory is sold separately, so they are
      probably not included (UNCONFIRMED). Indirect evidence: "Set spanriemen en haringen"
      (€19,99: 4 pegs of 30 cm, 4 straps of about 3 m, pouch) is a separate product suggested in
      the PDP cross-sell
      (https://www.outmate.nl/product/set-spanriemen-en-haringen-voor-easy-up-tenten/, likely), as
      are the beschermhoes (from €19,99) and a set of 4 wheels (€35). Whether a wheeled bag ships
      with the tent is UNCONFIRMED. Only the 4x8 easy-up page mentions an "opbergtas", without
      saying what kind or whether it is included (UNCONFIRMED; that page URL was not recorded).
14. **Fit warning on spare parts**: "past alleen op ons frame of identieke frames"
    (https://www.outmate.nl/product/partytent-dakzeil-6x12-pvc-professional/).
15. **Offerte form** on the PDP asks for company, BTW and KvK, with a note about intra-community
    delivery to BE without VAT (https://www.outmate.nl/product/test-2/, likely).
16. **Reviews**: WooCommerce average + count, purchase-gated, with a "geverifieerd" marker. We copy
    the feature only, never the data.
17. **Warranty, safety and care**:
    - "Fabrieksgarantie 1 jaar, slijtageonderdelen uitgesloten". The wording targets
      non-consumers; repair does not restart the warranty period and the warranty is not
      transferable (https://www.outmate.nl/product/partytent-3x3-premium-pvc-brandvertragend/,
      likely). The "1 jaar" value is seen on a buizenframe tent; no easy-up frame value was seen
      (UNCONFIRMED).
    - "Brandvertragend: Ja" plus a fire test report.
    - Colours may fade.
    - Tents are not storm- or snow-tested.
18. Links to guides (setup, differences). An Outmate-hosted video is UNCONFIRMED.

## 8. Custom print (bedrukking) and made-to-measure (maatwerk)

**Print** (https://www.outmate.nl/easy-up-tent-bedrukken/, confirmed):
- **Ordering and pricing.** The customer orders the Full Colour variant, and the price including
  print is visible up front. No separate surcharge or volume tiers were found (UNCONFIRMED).
- **Placement.** Anything from a logo on the valance to a full roof; tents can be printed on
  polyester or Heavy Duty PVC.
- **Upload.** The field is "Upload je materiaal voor bedrukking" and takes multiple files,
  preferably .pdf/.ai/.eps, up to 128 MB
  (https://www.outmate.nl/product/zijwand-2m-met-raam-easy-up-pvc-gecoat-polyester/, likely).
- **Template.** Customers can instead download a template plus a filled-in example.
- **Proof.** Outmate makes a mock-up, the customer approves it, and production starts only after
  approval. A correction round is possible.
- **Technique.** Sublimation print in full colour, on the inside, the outside or both. Double-sided
  print uses two printed cloths joined together.
- **Lead times.** 14–21 days after approval on the landing page (other pages say about 15
  werkdagen), "2-3 weken" on side walls, and "5-10 dagen na akkoord ontwerp" on inflatables. The
  afzetpaal belt takes "2 weken" in one snapshot and "2-4 weken" in another
  (https://www.outmate.nl/product/afzetpaal-bedrukking-op-trekband/), and needs at least 10 pieces.
- **Large quantities** go through the quote button.
- **Printable ranges**: easy-up tents, walls, roofs, stertenten, inflatable roofs, the marktkraam
  canopy and the afzetpaal belt. Statafelhoezen are printable per the brief only (UNCONFIRMED).

**Made-to-measure (maatwerk)**:
- **Overkapping / veranda zeil op maat**
  (https://www.outmate.nl/product/overkapping-veranda-zeil-op-maat/):
  - The configurator takes dimensions, material and colour and shows a live price.
  - From €35; lead time 3–5 weeks; tolerance 1–2 cm.
  - **Not returnable.**
  - The page advises using a PC or tablet. **Our mobile-first configurator should beat this.**
- **Stretchtent op maat** (https://www.outmate.nl/product/stretchtent-zeil-op-maat/):
  - Length and width inputs; with or without palenset; choice of rigging.
  - From €999, ships 10–15 workdays (the category page says 2–8 weeks, a conflict).
- **Per-metre products**: LED lichtslang per metre, prikkabel op maat up to 200 m, rode loper in
  widths of 1, 2 or 4 m up to 60 m, and side walls op maat.

## 9. Cart, shipping, checkout, payment

- **Shipping model** (https://www.outmate.nl/levertijd-en-verzendkosten/, confirmed):
  - Product prices exclude shipping, and each product shows its own shipping cost.
  - **Only the highest shipping cost per order is charged.**
  - BE rates are applied automatically. The BE amounts per class are UNCONFIRMED, and so is the
    full class table on the shipping page (the classes below come from product and category pages).
  - Shopify does not do "max of items" natively; see features.json `cart.highest-shipping-only`.
- **Shipping classes seen**:
  - €7,95 for walls, roofs and schaduwdoeken.
  - €12,50 for 1 / €25 for 2+ easy-up Premium tents.
  - €39–€42,50 for large tents.
  - €75 / €115 for concrete-block freight.
  - €175 for stretch tents.
- **Carriers**:
  - Parcels go by DPD, with T&T sent in the afternoon. A notice warned of 2–3 day DPD delays.
  - Tents and pallets go by Westerman freight. The customer gets a delivery-date confirmation,
    and on the day a time window by 09:00 at the latest.
  - PostNL is not mentioned.
  - Freight rules for kerbside vs. inside delivery, help with unloading, and rescheduling are
    UNCONFIRMED.
  - Status: likely.
- **Checkout**:
  - Account or guest checkout ("reken af zonder account",
    https://www.outmate.nl/bestellen-annuleren/).
  - The order is final on confirmation, and prepayment is required in full.
- **Payment methods** (page about 3 years old):
  - iDEAL, Bancontact, Belfius, KBC-Betaalknop, creditcard, Apple Pay, PayPal and
    bankoverschrijving.
  - SofortBanking and Giropay are also listed. **These are probably outdated methods, so verify
    with the payment provider; our note.**
  - Some methods carry a **% surcharge**. We will not copy that (no native Shopify support; EU
    rules restrict surcharges for consumers — verify).
  - **Op rekening** is only for (semi-)government and larger organisations, via Peppol e-factuur
    with an OIN number.
  - Pay at pickup in cash or by pin.
  - No Klarna, in3, Afterpay, Billink or other pay-later was found.
  - The PSP is unknown; the method mix fits Mollie.
- **Pickup**: at the warehouse, by appointment only (https://www.outmate.nl/service/).

## 10. Service & policies

| Page | Content | Source | Conf. |
|---|---|---|---|
| Service / contact | Contact form, phone, e-mail. Mon–Fri 08:00–12:00 and 13:00–16:30, weekends closed. "Alleen geopend op afspraak", and hours may differ, so call ahead. | https://www.outmate.nl/service/ | confirmed |
| Showroom | See and test tents, statafels and furniture. Visits by appointment via "Plan je bezoek". A temporary holiday-closure notice was seen. | https://www.outmate.nl/showroombezoek/ | confirmed |
| Bestellen & annuleren | Cancelling is mostly impossible after ordering. E-mail ASAP or refuse the delivery; unshipped orders can be cancelled. | https://www.outmate.nl/bestellen-annuleren/ | confirmed |
| Retour / herroeping | 14 days from receipt for certain products, then 14 days to send the item back. Return shipping is paid by the customer. Refund includes the original delivery cost, within 14 days, to the original payment method. Waardevermindering may be charged. The model form still shows old partytentkopen contact details. UNCONFIRMED: whether printed (Full Colour) items are excluded, and whether there is a return portal, RMA number or required e-mail step. | https://www.outmate.nl/retourinformatie/ | likely |
| Maatwerk | Not returnable. | https://www.outmate.nl/product/overkapping-veranda-zeil-op-maat/ | confirmed |
| Garantie & klachten | 1 year fabrieksgarantie, wear parts excluded. Not storm- or snow-tested. Warranty terms are aimed at non-consumers; repair does not restart the period and the warranty is not transferable. A /garantie-klachten/ page exists, but its content was never retrieved, so the consumer vs. business term, the claim procedure and the exclusions on that page are UNCONFIRMED. | https://www.outmate.nl/product/partytent-3x3-premium-pvc-brandvertragend/ · https://www.outmate.nl/garantie-klachten/ | likely |
| Algemene voorwaarden | An OLD and a NEW version both exist. B2B-specific clauses and an eigendomsvoorbehoud clause are UNCONFIRMED (content not retrieved). | https://www.outmate.nl/algemene-voorwaarden-nieuw/ | likely |
| Privacy & cookies | A combined statement from 2018. | https://www.outmate.nl/privacy-en-veiligheid/ | confirmed |
| Reviews page | "Shopervaring" with a site-review count (not to be reused). | https://www.outmate.nl/reviews/ | confirmed |
| FAQ | Never checked. Product pages have no FAQ tab, but nobody searched for a FAQ / "veelgestelde vragen" page, so "not found" must not be claimed. | — | UNCONFIRMED |

All levertijd, garantie, retour and verzending values are **business claims**. In our shop they
become owner-editable settings and are listed in `docs/claims-to-confirm.md` (BRIEF §6).

## 11. B2B / zakelijk

What was confirmed or is likely on Outmate:
- The offerte button in the header, and an offerte form on PDPs with company, BTW and KvK fields.
- A BE intra-community VAT note.
- Op factuur for organisations via Peppol; the site also mentions "op factuur betalen voor
  bedrijven" (https://www.outmate.nl/product/test-2/, likely).
- Prices always show incl. btw first with excl. btw next to them; **no incl/excl toggle** and no
  ex-first view for business buyers was found
  (https://www.outmate.nl/product/voetgewicht-voor-vouwtenten/, confirmed).
- Staffelkorting.
- Bundles aimed at rental companies (N tables + trolley).
- Positioning for horeca, verhuur, schools and care institutions (marktkraam,
  https://www.outmate.nl/product/marktkraam-professional-gegalvaniseerd-zonder-kartelrand/).
- Printed promotional items (inflatable promotion tents, printed tents and belts).

Not found on Outmate: a dedicated zakelijk page, a rental offer for tents in general, and a B2B
account portal (the header has only standard WooCommerce "Mijn account"). These are UNCONFIRMED; search ran out before they were tried. A "stretchtent
huren" page does exist (rental with setup: 6x10,5 €750 ex btw, 21x15 double €2.250 ex btw,
https://www.outmate.nl/stretchtent-huren/).

Statafelshop has a "zakelijk/B2B" section and **actiepakketten** per the brief (UNCONFIRMED).
Whether that page exists, its offerte fields, op rekening, ex-btw display, target segments, a
business login, and every package's contents, price and saving are UNCONFIRMED.

## 12. Content & SEO pages

- Comparison guide: "Het verschil tussen de partytenten" (https://www.outmate.nl/het-verschil-tussen-de-partytenten/).
- Product-line deep dive: "De partytent PVC Professional".
- PE vs PVC explainer.
- Buying guides: "Opslagtent kopen" (https://www.outmate.nl/opslagtent-kopen/) and "… welke past
  bij je" (https://www.outmate.nl/opslagtent-kopen-welke-past-bij-je/).
- Print landing page: "Easy up tent bedrukken".
- How-tos: "Easy up tent opzetten" (https://www.outmate.nl/easy-up-tent-opzetten/) and "Tips voor
  het opzetten van een partytent" (https://www.outmate.nl/tips-voor-het-opzetten-van-een-partytent/).
- Manuals hub: "Handleidingen partytenten".
- Overview page: "/alle/".
- Stretch project gallery and the stretchtent huren page.

**SEO weaknesses to beat**:
- Legacy brand names in titles.
- Duplicate category slugs and the `uncategorized` path.
- Indexed filter archives instead of curated landing pages.
- Old blog content (the comparison page covers only the non-easy-up lines).
- Structured data and breadcrumbs: not observed (UNCONFIRMED).

## 13. Where we can be better (opportunities)

1. **One product per line, with size and canopy as variants or a sibling switcher.** Outmate's
   one-URL-per-size forces page hops.
2. **A mobile-first configurator.** Outmate tells phone users to switch to a PC or tablet.
3. **One consistent shipping-class system**, explained in a single table, so there are no
   conflicting snapshots (regengoot 6 m €49 vs €75).
4. **One NL+BE store using Markets**, with no duplicate sister sites at different prices.
5. **Clean taxonomy and titles, current policies, one phone number and one terms version.**
6. **An honest trust layer.** Reviews come only from a review app; no superlatives.
7. **A clear "what's in the box"** for easy-ups, which Outmate leaves unclear.
8. **Up-to-date comparison content** covering easy-up Premium vs Professional.
9. **Honest connector specs on the budget line.** Outmate's Premium uses hard-plastic connectors
   and a reviewer says they wear out quickly (§4). Name the connector material per line, and
   sell spare connectors.

## 14. Statafelshop.nl — status and rerun plan

**No research ran**, in the first round or in any of the three 2026-10-17 follow-up rounds (four
attempts, all refused by the shared per-turn search budget on their first query; see §0). Do not invent sizes,
colours, prices, staffels, a "voor 14:00 besteld" cut-off or policies. Until the rerun, every
Statafelshop-derived catalog value and theme
claim (statafels, rokken/hoezen/kleden, topcovers, biertafelhoes, logo upload, proof note, print
lead time, MOQ, bundle contents and savings, zakelijk/offerte page, shipping, returns, warranty,
payment, USP texts) is an owner-supplied suggestion listed in `docs/claims-to-confirm.md`, never
presented as matched to the reference.

What the brief asserts (all UNCONFIRMED):
- Statafels.
- Statafelrokken and -hoezen in stretch and strik versions.
- Statafelkleden.
- Bedrukte hoezen.
- Actiepakketten.
- A zakelijk/B2B section.
- A "voor 14:00 besteld = vandaag verzonden" style promise (BRIEF §6 example).

Sourced proxy from Outmate (same operator): the stretch statafelrok at €14,99, fitting 70–85 cm
tops with a top cover included (https://www.outmate.nl/product/statafelrok-stretch/). Outmate's
statafels are square 60x60/70x70 and barrel Ø100.

Rerun these queries with mode "extended" and `allowed_domains: ["statafelshop.nl"]` (item 17:
statafelshop.be) as one agent, first and alone, in a turn with fresh budget, before other agents
use it (or after the owner raises `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`). One query per item;
record the source URL for every fact. Merged and deduplicated from the first round and the eleven
Statafelshop agents of the three follow-up rounds (ready-made query strings from round 3 are in
quotes):
1. Operator: contact/footer page for company name, KvK, BTW and address (compare with §1 Outmate
   row); "over ons" (Outmate, Staphorst).
2. Homepage: menu, footer links, sections in order, USP bar.
3. Statafels category page: models, shapes, Ø sizes (to check: 60/70/80/85, 70x70), prices; then
   one query per product URL found for height (to check: 110 cm), top material, frame (alu/staal,
   inklapbaar or stapelbaar), weight and staffel.
4. Statafelrok stretch: fitting Ø and heights, colours and surcharge, fabric and g/m², strijkvrij
   and wash care, topcover included, price, staffel (1/5+/10+/25+), set prices (4 or 10).
5. Statafelhoes met strik: strik colour, whether the strik is chosen separately, price.
6. Statafelkleed: sizes, floor-length, fabric, care.
7. Topcover / tafelblad hoes; biertafelhoes (sizes to check: 220x50 / 220x70).
8. Bedrukte statafelhoes: print technique, positions (voorkant/rondom/topcover), logo upload (file
   types, max size), drukproef, MOQ, surcharge, lead time. "statafelshop.nl bedrukte statafelhoes
   eigen logo bedrukken"; "statafelshop.nl statafelhoes bedrukken drukproef aanleveren logo bestand
   levertijd".
9. Actiepakketten: contents (number of statafels, which rok/hoes, trolley yes/no), package price,
   compare-at price or saving, variant choices (rok colour, table size). Trolleys: models,
   capacity, price. "statafelshop.nl actiepakket statafels met statafelrokken voordeel";
   "statafelshop.nl actiepakket trolley statafels set prijs".
10. Zakelijk: offerte form, op rekening, excl. btw display, segments, business account.
    "statafelshop.nl zakelijk offerte aanvragen bedrijven"; "statafelshop.nl op rekening bestellen
    bedrijven excl btw".
11. Verzending: costs, free-shipping threshold, "voor .. besteld / vandaag verzonden" cut-off,
    carriers (PostNL/DPD), levertijd.
12. Retour (period, who pays) and garantie.
13. Betaalmethoden (iDEAL, Bancontact, Klarna, in3, Billink/achteraf, op rekening).
14. Klantenservice / FAQ topics.
15. Reviews provider (Kiyoh / Trustpilot / WebwinkelKeur), newsletter, WhatsApp/chat, account.
16. Collection filters and sort options; pagination vs load-more; search autocomplete.
    "statafelshop.nl statafels categorie sorteren filter".
17. statafelshop.be: existence, operator, BE prices, BE shipping. "statafelshop.be statafels
    België verzending prijzen".

## 15. Market price calibration

Only Outmate's prices are sourced; see `assortment.json` → `reference_prices`. They are incl.
21% btw, mostly "vanaf" prices, and come from snapshots of mixed age.

Orientation points for our suggested prices (Outmate consumer prices):

| Product | Outmate ref. | Source |
|---|---|---|
| Easy-up 3x3 budget/steel | from €299 | https://www.outmate.nl/product-categorie/easy-up-partytenten/easy-up-partytenten-premium/ |
| Easy-up 3x3 pro alu, polyester / HD PVC | from €679 / €789 | https://www.outmate.nl/product-categorie/easy-up-partytenten/easy-up-partytenten-professional/ |
| Easy-up 3x6 pro alu, polyester / HD PVC | from €1.149 / €1.359 | idem |
| Zijwandenset 3x3 polyester | from €249 | https://www.outmate.nl/product/zijwandenset-easy-up-3x3m-pvc-gecoat-polyester-heavy-duty-pvc/ |
| Voetgewicht 15 kg | €49,95 | https://www.outmate.nl/product/voetgewicht-voor-vouwtenten/ |
| Partytent 3x8 PVC 550 | €789 | https://www.outmate.nl/product/partytent-3x8-premium-pvc-brandvertragend/ |
| Stretchtent 6x6 complete | from €3.425 | https://www.outmate.nl/product/stretchtent-6x6-meter-premiumstretch-lus-verbinding/ |
| Stertent 10 m | from €1.029 | https://www.outmate.nl/product/stertent-10m-diameter-starmate-professional/ |
| Inflatable 3x3 | €1.250 | https://www.outmate.nl/product/opblaasbare-promotietent-airmate-alpha-3x3m/ |
| Statafel opklapbaar 70x70 | from €147 | https://www.outmate.nl/product/opklapbare-statafel-tundra-70-x-70-cm/ |
| Statafelrok stretch | €14,99 | https://www.outmate.nl/product/statafelrok-stretch/ |
| LED lichtslang 20 m | €58 | https://www.outmate.nl/product/led-lichtslang-20-meter-warm-wit-36-leds-per-meter-lichtsnoer-voor-buiten-2200k/ |

No competitor or market data was gathered (vvep, partyrijk, bol.com, Gamma/Praxis, statafel
shops), so all of it is **UNCONFIRMED**. These are also unknown: pay-later adoption, which trust
marks are used (Thuiswinkel Waarborg, Kiyoh, Trustpilot), and common same-day cut-off times.

## 16. Open questions (for owner / rerun)

1. All Statafelshop.nl facts (see §14).
2. Market price bands outside Outmate.
3. Partytent buizenframe: the full size × quality-line matrix and its prices; which line offers
   8x12; per-line wall thickness, side walls, capacity, weight, shipping and fire-retardancy.
   Rerun, in this order: the comparison guide; the five line category URLs (Ultimate uses the
   singular slug, see §3); the Premium slugs
   /product/partytent-{4x6,4x8,5x8,6x6,6x8,6x12,8x12}-premium-pvc-brandvertragend/; the same
   pattern for Professional (/product/partytent-{size}-professional-pvc-brandvertragend/); the four
   opslagtent category URLs and /opslagtent-kopen-welke-past-bij-je/ (sizes, side and ridge
   heights, doors, prices per tier, Wikinger carport). outmate.be mirrors the URLs.
4. Easy-up: what ships in the box (draagtas/wieltas, haringen, spanbanden), the tent warranty
   term, Premium clearance, total height, capacity, 3x3 weight and packed size, and Professional
   3x4,5 capacity and packed length × width. Rerun the two PDP URLs
   (https://www.outmate.nl/product/easy-up-partytent-3x3m-premium-pvc-gecoat-polyester/ and
   https://www.outmate.nl/product/easy-up-3x45m-professional-pvc-gecoat-polyester/) first.
5. The print surcharge, and whether volume print pricing exists.
6. Whether outmate.nl has a WhatsApp button or live chat.
7. Whether outmate.nl shows a newsletter, USP bar, footer payment icons, social links or a
   Trustpilot widget; the /mijn-account/ dashboard and whether registration asks for
   bedrijfsnaam/BTW/KvK; search suggestions and the https://www.outmate.nl/?s=partytent layout;
   sort (`?orderby=`) and pagination; price and stock filters; product compare and recently viewed
   (never checked; no wishlist in the header text, likely).
8. The current payment provider and method list; whether Sofort/Giropay are still offered.
9. Outmate prices still missing: barkrukken (and tier %), stoelen, biertafelsets + hoes, trolleys
   other than the statafel trolley (including the Cross Back trolley), prikkabels per length and
   per metre, LED lamps (and kelvin values), gas heaters (and gas type and product URLs),
   afzetpalen (per post, rope, printed belt at MOQ 10), opbergtas 200 cm, buizenframe regengoot,
   tussenwand and zijwand per length, opslagtenten and the carport. The product and category URLs
   to rerun, one query each, are in assortment.json (`tafels-stoelen.*`, `verlichting.*`,
   `verwarming.gas`, `inrichting-evenement.afzetpalen`).
   Existence checks never run (so no "not found" may be claimed): cadeaubon/gift card; an outlet,
   sale, B-keuze or occasion range; the kerstverlichting category URL; the grondframes and
   reparatiesets URLs; floors or grondzeilen beyond lopers; promotietenten or bedrukte tenten as
   their own outmate.nl category; pagodetenten; parasols; beachflags/vlaggen; dranghekken; the
   rest of the "Zeilen en zeildoeken" menu group; the own URLs of Koppelgoten, Palen en palensets
   and Tuinpaviljoen zijwanden; the full /product-categorie/ census and the /alle/ product list.
   assortment.json logs these in `existence_checks` (`query_ran: false`, with the prior evidence),
   except the "Zeilen en zeildoeken" group, which is in `open_gaps`, and the three name-only URLs,
   which are in their own nodes' `gaps`.
10. Outmate policies still missing: /garantie-klachten/ content, returns exclusions for printed
    items and the return procedure, the full shipping table and BE amounts, freight unloading
    rules, B2B clauses, eigendomsvoorbehoud and the invoice payment term in the new terms, and
    whether a FAQ page exists. Rerun one query per URL: /garantie-klachten/, /retourinformatie/,
    /levertijd-en-verzendkosten/, /algemene-voorwaarden-nieuw/, then betaalmethoden/FAQ.
11. Owner decisions:
    - Do we replicate "highest shipping cost only"? It needs an app or a tiered approximation.
    - Do we offer op factuur (Shopify B2B is Plus-only)?
    - Do we offer pay-at-pickup, showroom visits and rental?
12. The real lead times, cut-off time, warranty and return terms for our brand. These go into
    `docs/claims-to-confirm.md`.
