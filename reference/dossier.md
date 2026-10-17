# Referentiedossier / Reference dossier — Outmate.nl & Statafelshop.nl

Status: 2026-10-17, **round 4 merged**. Synthesized from the 5 first-round research agents (raw
output: `$SCRATCH/research-raw.json`), three 8-agent follow-up rounds that could not search, and
**round 4**: 5 agents, 125 WebSearch calls, raw output `$SCRATCH/research-raw-2.json`. Round 4
gathered the first Statafelshop.nl data, market price bands and most of the Outmate gaps (see §0).
Companion files: `reference/features.json` (functional bar, 147 items) and
`reference/assortment.json` (assortment bar, 14 categories / 88 subcategories, plus
`market_price_bands`).

**Rerun note.** Round 4 worked because its searches ran first, in a turn with a fresh search
budget. What is still open is listed in §14.9 (Statafelshop) and §16 (everything). A next rerun
should again run first and alone in a fresh turn, one agent per remaining block.

**Brief correction needed.** `gauntlet/BRIEF.md` §1 says both reference shops are run by Outmate BV
(Staphorst). Statafelshop's own company details name **Deadan.com bv** (KvK 62007211), with
addresses in Noord-Brabant, and no source ties it to Outmate (§1). This merge does not edit the
brief; the owner or orchestrator should correct it.

## 0. Read this first: how this was gathered and what it does not cover

- **Method.** WebFetch and curl to the reference shops are blocked (BRIEF §3). Everything below
  comes from **WebSearch index snippets** of outmate.nl and its sister sites. The snapshots range
  from about 1 month to more than 2 years old. Prices are therefore **indicative**, and where two
  snapshots disagree both values are given.
- **Confidence labels.** **confirmed** means a snippet states it directly. **likely** means it was
  summarised or inferred from URL patterns. **UNCONFIRMED** means search could not verify it, and
  nothing marked that way may be presented as fact.
- **Statafelshop.nl: no data until round 4.** In the first round, both the Statafelshop agent and
  the market-pricing agent ran into the shared per-turn limit of 200 WebSearch calls before running
  a single query. The synthesizer retried and was also refused, and the three follow-up rounds
  below failed the same way. Until round 4, every Statafelshop statement came from
  `gauntlet/BRIEF.md` §1. Round 4 replaced those statements with sourced facts (§14); what is
  still unknown is listed in §14.9.
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
- **Round 4 (2026-10-17): the searches ran.** Five agents ran first, in a turn with a fresh budget,
  and used 125 WebSearch calls (mostly mode "extended", with `allowed_domains` set per shop):
  - three on Statafelshop: navigation, operator and service (25 calls); textiles (30); statafels,
    actiepakketten, trolleys and policies (25);
  - one on market price calibration outside Outmate (20; §15);
  - one on the Outmate gaps: policies, the buizenframe and opslagtent price matrix, furniture,
    lighting and side-wall prices (25).

  The raw output is in `$SCRATCH/research-raw-2.json`. Every fact is a search-tool summary of
  snippets, some about a year old, and a summary can blend two pages. Where snapshots disagree,
  both values are kept. The confidence labels are the agents' own, cross-checked between agents
  in this merge. **Main correction:** Statafelshop is not shown to be an Outmate shop (§1), so
  Outmate facts are no longer offered as Statafelshop proxies. The Outmate €14,99 rok in
  particular must not stand in for Statafelshop, which charges about twice that (§14.3).
- **Rerun lesson (confirmed by round 4).** Parallel agents share one 200-call budget per turn.
  Searches run only when they go first in a turn with a fresh budget (a new user message starts
  one), or after the owner raises `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`. Re-sending a fan-out
  in a spent turn failed in three follow-up rounds; round 4, sent first in a fresh turn, worked.
- **Market price calibration** beyond Outmate: gathered in round 4 from VVEP, bol.com, Praxis,
  Gamma, partytent.nl, vouwtent.eu, biertafelplaza, statafelwinkel, print shops and stretch-tent
  sellers. See §15 and assortment.json `market_price_bands`.
- **Do not copy.** The following must not be reused (BRIEF §6): Outmate's review counts
  (/reviews/ showed 3232), product ratings, Trustpilot scores, their wording, and their
  unverifiable superlatives ("Door eigen import de goedkoopste!", "Nr.1 aanbieder in NL en BE").
  Their model names (Starmate, AirMate, Times Square, Tundra, …) appear here only to identify
  reference items. The same applies to Statafelshop: its homepage rating ("Wij scoren een 9,6",
  "Ruim 10.000 tevreden klanten"), its Feedback Company and Trusted Shops scores, its superlatives
  ("de grootste statafelwebshop in Europa", "al meer dan 15 jaar de #1"), its wording, and its model
  names (New York, Savannah, Colorado, Indus, …; full list in assortment.json `meta.naming_rule`).

## 1. Company & platform

| Item | Finding | Source | Conf. |
|---|---|---|---|
| Operator | Outmate B.V., KvK 76398021, BTW NL860611541B01. Postal address d'Olde Dijk 7A, 7951 LE Staphorst. Warehouse/pickup Esakker 5, 7951 SV Staphorst. | https://www.outmate.nl/contact/ · https://www.outmate.nl/service/ | confirmed |
| History | Selling party tents via webshops since 2014; inflatables since 2020; stretch tents since 2018. Private partner of a South African stretch-fabric maker since 2021. | https://www.outmateair.nl/contact-en-over-ons/ · https://www.outmatestretch.nl/contact-en-over-ons/ | confirmed |
| Platform | WordPress + WooCommerce, imported with WP All Import. Filters probably run on FacetWP (`?_frame=zwart`, `?_pa_kleur=`), which is inferred. Cookie banner wording matches Complianz, also inferred. Site built by Optimus Websites (Staphorst). | https://www.outmate.nl/wp-content/uploads/wpallimport/files/38cp.pdf · https://www.outmate.nl/conditie/nieuw___nl-be___nl-be/ | confirmed / likely |
| Legacy brand | Rebranded from partytentkopen.nl. Many SEO titles still end in "- Partytentkopen.nl". partytentkopen.nl serves the same site; whether it 301-redirects is UNCONFIRMED. | https://www.outmate.nl/product-categorie/partytenten/partytenten-pvc-classic/ · https://www.partytentkopen.nl/alle/ | confirmed / likely |
| Sister shops | outmate.be (BE mirror, same URL structure). outmateair.nl (inflatables, higher prices: Alpha 3x3 €1.400 there vs €1.250 on outmate.nl). outmatestretch.nl (stretch tents). partytentkopen.be. Explicit cross-links between the sites are UNCONFIRMED. | https://www.outmate.be/product-categorie/partytenten/ · https://www.outmateair.nl/product-categorie/promotietenten/ | confirmed |
| Marketplaces | Outmate brand stores on bol.com (NL+BE); also listed on beslist.nl, lionshome.nl and Marktplaats. | https://www.bol.com/nl/nl/b/outmate/605686588/ | confirmed |
| Statafelshop.nl operator | **Not shown to be Outmate.** The site's company details name Deadan.com bv, KvK 62007211, phone +31 (0)40-4015010 and info@statafelshop.nl. No BTW number was found, and no source ties Statafelshop to Outmate. This contradicts BRIEF §1. | https://statafelshop.nl/bedrijfsgegevens | likely |
| Statafelshop.nl addresses | Provincialeweg 30, 4909 AK Oosteind (contact and "Over Statafelshop" pages). The contact page also gives Wilhelminakanaal Zuid 140, 4903 RA Oosterhout under the orders heading, and the vacatures and strikrokken pages give Veldweg 1, 5715 PP Lierop. Which address is current, and which one is the pickup point, is unresolved. | https://www.statafelshop.nl/contact/ · https://www.statafelshop.nl/vacatures | confirmed / likely |
| Statafelshop.nl platform | WooCommerce-style paths (`/product-categorie/<slug>/`, `/product/<slug>/`, `/winkel/`, `/blog/YYYY/MM/DD/`) are indexed alongside legacy short slugs with Magento-style layered-nav URLs (`/strikrokken`, `/aanbiedingen`, `/diversen/kleur-blad/wit/sort-by/position/sort-direction/asc`). An old shop runs at oud.statafelshop.nl. Which scheme is live is unconfirmed; the site may have been replatformed. | https://www.statafelshop.nl/statafel-kopen-in-venlo/ · https://statafelshop.nl/diversen/kleur-blad/wit/sort-by/position/sort-direction/asc | likely / unconfirmed |
| statafelshop.be | A BE mirror with the same structure. Its FAQ names the Statafelshop.nl brand and a Dutch bank account, so it is likely the same operator. BE prices were not gathered. | https://www.statafelshop.be/contact/ | likely |

**Takeaway for us.** Outmate runs four or five overlapping storefronts. Duplicate products carry
different prices and the company data is inconsistent across them. One coherent store with NL+BE
Markets is an obvious way to do better. Statafelshop has the same kind of mess: two URL schemes,
an old shop, three addresses, and USP claims that contradict its own FAQ (§14.8).

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

**Statafelshop.nl global UX** (round 4):
- **Header.** A search field with popular-search shortcuts (statafels, statafelhoezen,
  barkrukken, actiepakketten, stoelen), the category menu (§3), and the phone line presented as
  direct contact with staff (https://www.statafelshop.nl/, likely). Autocomplete was not observed.
- **USP bar.** "Voor 14u besteld, dezelfde dag verzonden", "2 jaar garantie op alle artikelen" and
  "Gratis retourneren". Other pages add "24-uurs levering", "Diverse aanbiedingen" and "Gratis
  verzenden" (likely). Several of these contradict the shop's own FAQ (§14.8).
- **Trust.** A homepage rating block, "Wij scoren een 9,6" with "Ruim 10.000 tevreden klanten";
  the provider is unknown and the phrase could not be re-confirmed (unconfirmed). External
  profiles exist at Feedback Company and Trusted Shops. No Kiyoh, WebwinkelKeur or Trustpilot
  profile was found. None of these numbers may be reused.
- **Contact channels.** Phone, e-mail, chat and WhatsApp ("Mail, bel, app of chat ons even!",
  https://www.statafelshop.nl/product-categorie/terrastafels/, likely). Opening hours were not found.
- **Account.** "Mijn Account" > "Bestellingen" holds the BTW invoice download and the Track & Trace
  links (https://www.statafelshop.nl/contact/, likely).
- **Footer.** Customer-service topics Bestellen en bezorgen, Betalen, Garantie en reparatie and
  Ruilen en retourneren appear on pages (unconfirmed where). The full footer, a newsletter and the
  homepage section order were not obtained.

## 3. Navigation tree (Outmate.nl and Statafelshop.nl)

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

\*\* Kerstverlichting has its own category URL, found in round 4:
https://www.outmate.nl/product-categorie/verlichting/kerstverlichting/ (likely).

All 82 category URLs in `$SCRATCH/raw_cats.txt` are now mapped in assortment.json (offline census,
2026-10-17; no query ran). Koppelgoten, Palen en palensets and Tuinpaviljoen zijwanden were seen by
name only, so their own URLs are UNCONFIRMED and those nodes point to their parent URL.

Primary sources: https://www.outmate.nl/product-categorie/stretchtenten-en-onderdelen/,
https://www.outmate.nl/product-categorie/tafels-en-stoelen/,
https://www.outmate.nl/product-categorie/partytent-onderdelen/ and
https://www.outmate.nl/product-categorie/verlichting/.

**Statafelshop.nl navigation** (round 4, https://www.statafelshop.nl/, likely). The main menu
"Shop" lists these categories in this order:

```
Statafels          /product-categorie/statafels/        filters: bladkleur, onderstel kleur, bladdiameter
Statafelhoezen     /product-categorie/statafelhoezen/   stretchrok + topcover · strikrok · losse topcover ·
                                                        stretchhoes met eigen opdruk · EK/WK rok (sale)
Barkrukken         /product-categorie/barkrukken/       (alias /barkrukken)
Actiepakketten     /product-categorie/actiepakketten/   (alias /aanbiedingen)
Stoelen            /product-categorie/stoelen/          (alias /horeca-stoelen)
Terrastafels       /product-categorie/terrastafels/
Biertafelsets      /product-categorie/biertafelsets/
Tafels             /product-categorie/tafels/           buffettafels (blow mold), bankettafel rond
Banken             (URL not observed)
Transportkarren    /product-categorie/transportkarren/
Onderdelen         /product-categorie/onderdelen/       onderstel · buisbeugel
Textiel            /product-categorie/textiel/          overlaps Statafelhoezen; adds tafelkleden and the buffet stretchhoes
Diverse            /product-categorie/diverse/          beschermplaten (alias /diversen)
Info pages: Over Statafelshop · Blog · Zakelijk (/zakelijk/) · Contact (with the FAQ)
```

Strik, kleden, topcovers and bedrukte hoezen have no menu item of their own. There is no "horeca
meubilair" or "accessoires" item, and trolleys are called "Transportkarren". All products are also
listed at `/winkel/`. The paths guessed in earlier rounds (`/statafels/`, `/statafelrokken/`,
`/statafelhoezen/`, `/statafelkleden/`, `/actiepakketten/`) are not the observed ones; `/zakelijk/`
does exist. Sources: https://www.statafelshop.nl/product-categorie/textiel/,
https://www.statafelshop.nl/product-categorie/transportkarren/ and
https://www.statafelshop.nl/product-categorie/onderdelen/onderstel/.

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
  - Sizes run 3x3–8x12 (category title). **8x12 is a PVC Premium tent** at €1.850: 96 m², 200 cm
    side height, shipping €42,50, snapshots "Tijdelijk uitverkocht"
    (https://www.outmate.nl/product/partytent-8x12-premium-pvc-brandvertragend/, likely).
  - Round-4 prices, incl. btw (likely; a range means two snapshots disagree). The full grid is in
    assortment.json `partytenten-buizenframe.size_line_matrix`.

    | Line (canopy) | Prices seen |
    |---|---|
    | PE Basic (200 g/m²) | 3x4 €279 · 3x6 €349 · 4x4 €335 · 4x6 €389 · 4x8 €439 · 5x10 €525 |
    | PVC Classic (500 g/m²) | 3x6 €529 · 4x6 €559–569 · 5x8 €729 · 6x6 €729 · 6x8 €725. Also exist without a price: 3x4, 3x8, 4x8, 5x4, 5x10, 5x12, 6x10, 6x12 |
    | PVC Premium (550 g/m², 860N) | 3x3 €439 · 3x6 €589–639 · 3x8 €789 · 4x4 €579 · 4x6 €719–735 · 4x8 €869 · 5x8 €949 · 6x6 €875 · 6x8 €949 · 6x12 €1.499 · 8x12 €1.850. Also exist without a price: 3x4, 5x6 |
    | PVC Ultimate (550 g/m², walls included) | 3x4 from €486 (was €539) · 4x4 €539 · 4x6 €657 (was €729) · 4x8 from €809 (was €915) · 5x10 €1.017 (was €1.129). 4x6 and 5x10 are "Permanent uitverkocht" |
    | PVC Professional (620 g/m², 930N, 38 mm) | 4x8 €1.049 · 5x10 €1.275 · 6x12 €1.725. 4x6 exists without a price; no 6x8 was found; 3x4 is known only as a replacement roof |

    Sources: the five line category URLs (§3),
    https://www.outmate.nl/product/partytent-3x6-classic-pvc-brandvertragend/ and
    https://www.outmate.nl/product/partytent-4x8-professional-pvc-brandvertragend/. Some category
    headings do not match their items (a €949 Premium item is labelled 6x6 under a 6x8 heading),
    so check the PDP before using a price.
  - Ultimate side walls: the 4x4 includes 6 side panels (4 of 2 m with a window) plus end walls
    with ritsen, and the 5x10 includes 10 PVC walls with windows. Whether the 3x4 and 4x8 include
    walls is UNCONFIRMED.
  - Frame: 38 mm galvanised tubes with a 1,2 mm wall, per the spare-tube category text, not per
    line (https://www.outmate.nl/product-categorie/partytent-onderdelen/, likely). Side walls attach
    with klittenband per a category facet; which lines use it is UNCONFIRMED.
  - Fire-retardant: Premium yes (confirmed). Classic is "brandvertragend gecertificeerd" with
    thermally welded seams and UV resistance (likely, round 4). Professional is likely (slug
    "pvc-brandvertragend"). PE Basic is UNCONFIRMED.
  - Per-line wall thickness, side-wall set-up, capacity, weight and shipping are still
    UNCONFIRMED. The per-line table on https://www.outmate.nl/het-verschil-tussen-de-partytenten/
    was never retrieved. Cells not in the matrix are UNCONFIRMED.
- **Opslagtenten** come in four tiers, each with its own category URL: PVC Classic (short-term
  use), PVC Premium (longer use, e.g. during a renovation), PVC Professional (620 g/m²) and a
  carport/opslagtent PVC Professional with a fixed frame
  (https://www.outmate.nl/product-categorie/opslagtenten/, confirmed).
  - Round-4 prices, incl. btw (likely; several come only from category pages where some headings
    do not match their items):

    | Tier | 3x4 | 4x6 | 4x8 | 5x10 | 6x12 |
    |---|---|---|---|---|---|
    | PVC Classic | €399 | €559 | €669 | €839 | €1.199 |
    | PVC Premium | €499 | €719 | €869 | €1.125 | €1.399 |
    | PVC Professional | €569 | €775 | not found | €1.175 | €1.699 |

    A 3x6 exists in Premium and Professional (no price). The carport/opslagtent Professional
    3,3x4,8 is on sale at €599 (was €859), "binnenkort leverbaar", with removable front and back
    panels and PVC roof and walls. Source: https://www.outmate.nl/product-categorie/opslagtenten/.
  - The Classic 3x4 is brandvertragend per its slug and has 1 jaar garantie
    (https://www.outmate.nl/product/opslagtent-3x4-classic-pvc-brandvertragend/, likely).
  - Side and ridge heights and the door type (rolluik or rits) are still UNCONFIRMED.
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
    Statafelshop's round inklapbare statafels (Ø70/Ø80/Ø85, 107 or 110 cm) are in §14.2.
  - Terras- and klaptafels. Round-4 klaptafel prices (likely): HDPE rond 180 cm lichtgrijs
    €254,50 (30 kg, steel frame; trolley from €482,50 with 10% off when bought with the tables),
    rond 150 cm €188,50, 180x76 vouwbaar €95,50. The Foldtable 200x60 shows €959 with an offerte
    button and staffel 5–12,5% (https://www.outmate.nl/product/foldtable-200x60cm/); that price
    looks high for one table and may be a set, so verify. A Ø183 round and a 183/91 kwartrond
    (wooden top) also exist.
  - Barkrukken (round-4 prices, likely):
    - Paxi (black wire) €147,50; Louis from €139 (another listing €129), stackable up to 8;
      Mundo €167, sold per 4. These three share a staffel of 5% from 10, 6,25% from 26 and 7,5%
      from 49 pieces (https://www.outmate.nl/product/barkruk-paxi-draadstoel-zwart/).
    - Hamburg stapelbaar metaal zwart €32,75 (was €39; one page gives €32,75–€46,95), stackable up
      to 10, staffel 2,5% from 4, 4% from 9 and 5,5% from 31; shipping €12,50 for 1 and €25 for 2+
      (https://www.outmate.nl/product/barkruk-stapelbaar-metaal-zwart-hamburg/).
    - Inklapbare barkruk with rugleuning and kunstleer seat €69,99. No hamerslag price was found.
  - Stoelen (round 4, likely): stapelstoel Cross Back €92,50 on the PDP ("vanaf €62,50" in the
    category), Hamburg zwart €48,50, Louis €122,55 per chair at 10–25 pieces; a Cross Back seat
    cushion is sold separately (https://www.outmate.nl/product-categorie/tafels-en-stoelen/stoelen/).
    No klapstoel product was found. "Biertafels en bierbanken" is only a menu label; set widths,
    contents and prices are UNCONFIRMED (no biertafelset price found in round 4).
  - Trolleys for every item. The only priced one is €589 for 10 statafels; the stoelen/barkrukken
    trolley holds 18 (https://www.outmate.nl/product/stapelstoelen-trolley-cross-back/, price
    UNCONFIRMED).
  - Bundles: 10x statafel + trolley €2.299 (sale €1.969); barrel set €775; a "Supercombi 24x
    barkruk Hamburg + trolley" exists (price not captured).
- **Statafelrokken** (details and sources in §14.3):
  - **Statafelshop**: the stretchrok always comes with a topcover, in two sizes (Klein Ø60–70 and
    Standaard Ø80–90, for tables 105–115 cm high) and 22 colours, from €33,82 (€27,95 excl.). The
    strikrok comes in 6 colours for Ø70–90 at €30,19 or €35,03 (two snapshots). Also sold: loose
    topcovers, tafelkleden Ø130 and 140x140 at €18,09, a buffet stretchhoes 183x76, a printed
    stretchhoes Ø80/Ø85 at €119,79 and transparent beschermplaten. No staffels.
  - **Outmate** (a different operator, not a proxy): the stretch rok costs €14,99. It fits 70–85 cm
    tops, includes a top cover, is made of 90/10 polyester/lycra 190 g/m², and comes in zwart, wit,
    turquoise and "exclusive" colours (https://www.outmate.nl/product/statafelrok-stretch/, likely).
    The full colour list, any exclusive-colour surcharge, care instructions and staffel/set prices
    are UNCONFIRMED. Outmate's "Rokken en hoezen" category also holds biertafelset hoezen (sizes and
    price UNCONFIRMED).
- **Verlichting**:
  - Prikkabels: 230 V, 16 A, E27, IP44. Round-4 prices (likely): zwart 10 m from €49, 20 m from
    €87 (range up to €135,25), 30 m €126 with an offerte button; wit 10 m €49 and 20 m €87; a 25 m
    wit exists. Made to measure up to 200 m from €9, ready in 3–5 werkdagen
    (https://www.outmate.nl/product-categorie/verlichting/prikkabels/).
  - LED lamps E27 (round 4, mostly sale prices, likely): warm wit 1 W €1,49, filament dimbaar 1 W
    €1,29 and 2 W €1,99, set of 5 gekleurd €5,99; 100+ pieces €1,20. Kelvin values are UNCONFIRMED
    (https://www.outmate.nl/product-categorie/verlichting/led-lampen/).
  - LED lichtslangen: 36 LEDs/m, 1,5 W/m, IP44; per metre about €15 (sale €8,95–€9,99 for warm wit),
    whole metres only with a live total; fixed 15 m and 20 m (€58) in warm wit 2200K. Colours:
    warm wit, geel, oranje, rood, groen, blauw.
  - Kerstverlichting has its own category
    (https://www.outmate.nl/product-categorie/verlichting/kerstverlichting/, likely): professionele
    kerstverlichting 10 m with 100 LEDs, warm wit from €33,99 or fonkelend from €35; IP65,
    doorkoppelbaar, 2200K.
  - Parts: cable 2x1,5 mm² €1,79–€1,85 per metre, 2x2,5 mm² €1,89; E27 fittings €1,50–€1,69;
    dimmer for the socket (up to 280 W) €9,99; also remote dimmers, timers and wifi plugs. No
    bouwlampen or schijnwerpers were found (searched, not proof).
- **Verwarming**: electric heaters of 1500 and 2100 W (easy-up heater €129); gas heaters of
  13 kW, 3000 W and 9000 W (prices, gas type and product URLs UNCONFIRMED).
- **Inrichting**:
  - Afzetpalen in messing or RVS with a 2 m belt, or messing with an oval head for a rope. The
    printed belt version needs at least 10 pieces. The price per post, the rope price and the
    printed-belt price are UNCONFIRMED.
  - Marktkraam 2 m, €533–599.
  - Rode loper, made to measure up to 60 m.
- **Onderdelen**: everything is sold separately, including roofs, walls, tubes (€9–12,50),
  connectors (€7,50–9,99), pegs, storm-strap sets and concrete blocks of 120–1000 kg. Round-4
  additions (likely):
  - Buizenframe side walls of 2 m with a window: Classic €24 (was €27,50, 30 cm tochtflap),
    Premium from €26, Premium with ritsen €45, Professional 2,2 m high €29 (was €39) or €49 with
    ritsen, closed Premium €28; €7,95 shipping per wall. Long walls (PE 6/8/10 m, PVC 220 cm high
    3/4/10 m) exist without a captured price.
  - Opbergtassensets: €65 for 3 m wide tents, €69 for 4 m. Stormbandensets (2 sets): from €52,50
    (3 m) and €62,50 (4 m); 3 sets for the 4x8 opslagtent €89.
  - Roofs: 4x8 PE Basic €169, 8x12 PVC Premium €559. Tubes: 216 cm €11,75, 159 cm €9. Regengoot
    8 m €84 (fit unconfirmed).
  - Easy-up: zandzakken set of 4 (10 kg each) €19,99; watergewichtzakken 4x20 kg €99 (sold out);
    frame 2x2 Professional €499.

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
- Statafelshop's homepage elements (search shortcuts, category list, actiepakket teaser, rating
  block, USP bar) are in §2; its section order was not established.

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
- **Statafelshop** (round 4): the statafels category filters on bladkleur (graniet, wit,
  antraciet, punti), onderstel kleur and bladdiameter (70/80/85 cm), with a count per value
  (https://www.statafelshop.nl/product-categorie/statafels/, likely). Cards show incl. and excl.
  btw, "vanaf" and an "Aanbieding!" label with a struck-through price (confirmed). Sort options and
  pagination were not observed.

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
   - Statuses: Tijdelijk uitverkocht, Binnenkort leverbaar, Pre-order, and (round 4) "Permanent
     uitverkocht" next to a struck-through price
     (https://www.outmate.nl/product-categorie/partytenten/partytent-pvc-ultimate-edition/, likely).
   - A holiday notice on the PDP: "Door de vakantiedrukte kan het echter voorkomen dat een
     bestelling iets later wordt verzonden" (likely).
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
19. **Round-4 additions** (likely):
    - Some PDPs show an "Offerte aanvragen" button next to the price (Prikkabel 30 meter,
      Foldtable 200x60; https://www.outmate.nl/product/prikkabel-30-meter/).
    - Order multiples: Barkruk Mundo is sold per 4
      (https://www.outmate.nl/product/barkruk-stapelbaar-mundo/).
    - Live price calculators on per-metre products: the lichtslang op maat takes whole metres and
      shows the total at the bottom of the form (https://www.outmate.nl/product/led-lichtslang-geel/).
    - Easy-up box contents are still UNCONFIRMED: wheels are "Optioneel, wielen beschikbaar" (sold
      separately), the spanriemen set's "bewaartasje" is a pouch for the set itself, and no included
      tent bag was found. No separate easy-up wieltas or opbergtas product was found either (only
      beschermhoezen); that is not proof that none exists.

**Statafelshop product pages** (round 4, https://www.statafelshop.nl/product/stretchrok-topcover/):
- Variable products with a "vanaf" price incl. and excl. btw, and options per attribute (Maat:
  Klein/Standaard; Kleur) (likely).
- A spec table with rows such as "Kleur stretchrok", "Kleur strikrok", "Afmeting blad", "Strak of
  Los", Hoogte, Kleur tafelblad, Kleur onderstel and "Inklapbaar of Stapelbaar"
  (https://www.statafelshop.nl/product/statafel-new-york/, confirmed).
- A plain quantity field with no staffel (likely).
- The stock line "Op voorraad, voor 14u besteld, dezelfde dag verzonden" (confirmed). Personalised
  items show "Gepersonaliseerde producten hebben een langere levertijd" instead (confirmed).
- Whether colours show as swatches or as a dropdown was not determined, and no kleurstalen service
  was found.

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
  canopy and the afzetpaal belt. Printed statafelhoezen were seen on Statafelshop, not on Outmate
  (below).

**Statafelshop print** (round 4; https://www.statafelshop.nl/product/stretchrok-met-eigen-opdruk/):
- **Products.** "Stretchhoes met eigen opdruk" in Ø80 or Ø85, from €119,79 (€99 excl.), likely; the
  same price pair also appears for a buffet table with stretchrok, so a summariser mix-up is not
  fully ruled out. The old shop listed it at €114,95. "Beschermplaat met eigen opdruk" comes in
  Ø68/Ø78/Ø83 from €75,63 (€62,50 excl.), likely.
- **Ordering.** There is no upload on the product page. The customer orders, receives an e-mail
  with the order details, and then sends the images or photos (likely).
- **Lead time.** The PDP says "Gepersonaliseerde producten hebben een langere levertijd"
  (confirmed). One page gives 7–14 days and another 2–3 weeks (likely). Printed items are excluded
  from same-day dispatch.
- **Not found:** print method, print positions, file requirements, a proof step, an MOQ or a print
  surcharge.
- **Our upload-at-order with a proof step is a clear improvement.**

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
  - The prikkabel op maat gemonteerd configurator asks for the distance from the plug to the first
    fitting (cm), the number of fittings, the distance between fittings (cm), the distance from the
    last fitting to the end, and the end piece (eindkap, contrastekker or eindhaak). It starts at
    €9 and is ready in 3–5 werkdagen. An "in onderdelen" variant ships the loose parts
    (https://www.outmate.nl/product/prikkabel-op-maat-gemonteerd/, likely).
  - The new terms exclude maatwerk from the herroepingsrecht, and the old terms give "op maat
    gemaakte prikkabels" as an example (https://www.outmate.nl/algemene-voorwaarden-nieuw/, likely).

## 9. Cart, shipping, checkout, payment

- **Shipping model** (https://www.outmate.nl/levertijd-en-verzendkosten/, confirmed):
  - Product prices exclude shipping, and each product shows its own shipping cost.
  - **Only the highest shipping cost per order is charged.**
  - BE rates update automatically when the country is chosen in checkout, and the PDP shipping
    prices on outmate.nl apply to NL (confirmed). Round-4 BE amounts from outmate.be PDPs (about 1
    year old, likely): €9,99 for easy-up roofs and walls (NL €7,95) and €59 for easy-up
    Professional tents (NL €39–€42,50)
    (https://www.outmate.be/product/easy-up-4x8m-professional-heavy-duty-pvc/). The full class table
    is still UNCONFIRMED (the classes below come from product and category pages).
  - The levertijd is a "streefdoel": workday orders are meant to ship the same day, and each PDP
    shows an indication (confirmed).
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
  - Freight orders: the customer picks an afleverdag in checkout, and the carrier e-mails an
    estimated time on the day. Parcels usually arrive the next workday between 9:00 and 18:00
    (https://www.outmate.nl/levertijd-en-verzendkosten/, likely).
  - Freight rules for kerbside vs. inside delivery, help with unloading, and rescheduling are
    UNCONFIRMED.
  - Status: likely.
- **Checkout**:
  - Account or guest checkout ("reken af zonder account",
    https://www.outmate.nl/bestellen-annuleren/).
  - The order is final on confirmation, and prepayment is required in full.
- **Payment methods** (page about 3 years old):
  - iDEAL, Bancontact, Belfius, KBC-Betaalknop, creditcard, Apple Pay, PayPal and
    bankoverschrijving (round 4 adds DIRECTebanking to the list, confirmed).
  - SofortBanking and Giropay are also listed. **These are probably outdated methods, so verify
    with the payment provider; our note.**
  - Some methods carry a **% surcharge**. We will not copy that (no native Shopify support; EU
    rules restrict surcharges for consumers — verify).
  - **Op rekening** is only for (semi-)government and larger organisations, via Peppol e-factuur
    with an OIN number. The new terms give non-consumers 30 days after the invoice date (the old
    terms said 8) (https://www.outmate.nl/algemene-voorwaarden-nieuw/, likely).
  - Pay at pickup in cash or by pin.
  - No Klarna, in3, Afterpay, Billink or other pay-later was found.
  - The PSP is unknown; the method mix fits Mollie.
- **Pickup**: at the warehouse, by appointment only (https://www.outmate.nl/service/).

**Statafelshop.nl** (round 4, https://www.statafelshop.nl/contact/ unless noted):
- **Shipping.** "altijd € 15,- excl. btw" (€18,15 incl.) per order (confirmed), yet many product
  and category pages show "Gratis verzenden" with no threshold stated (likely). The shop picks the
  method: 1–2 statafels go by DHL with Track & Trace (also shown in the account), and larger orders
  go on a pallet with its own transporter, with a delivery-date e-mail and another just before
  delivery. Someone else may accept with valid ID, some deliveries need a signature, and damage
  must be noted on the vrachtbrief (likely). PostNL and DPD are not mentioned.
- **Cut-off.** "Op voorraad, voor 14u besteld, dezelfde dag verzonden" on stock items (confirmed),
  plus a "binnen 24 uur in huis, of het nu 1 of 1000 artikelen zijn" claim
  (https://www.statafelshop.nl/statafel-kopen/, likely).
- **Payment.** iDEAL, PayPal, Bancontact (mainly for BE), creditcard (Mastercard, Visa, American
  Express), Sofort and bankoverschrijving; Giropay is also mentioned. The method is chosen in the
  last checkout step. No Klarna, in3, achteraf or op rekening was found (likely).
- **Pickup.** "Of haal je bestelling direct af" (confirmed). Which address and which hours apply
  is unknown.
- **statafelshop.be.** The FAQ gives the same €15 excl., while its PDPs say "Gratis verzenden"
  (https://www.statafelshop.be/product/biertafel-standaard-kwaliteit/, likely).

## 10. Service & policies

| Page | Content | Source | Conf. |
|---|---|---|---|
| Service / contact | Contact form, phone, e-mail. Mon–Fri 08:00–12:00 and 13:00–16:30, weekends closed. "Alleen geopend op afspraak", and hours may differ, so call ahead. | https://www.outmate.nl/service/ | confirmed |
| Showroom | See and test tents, statafels and furniture. Visits by appointment via "Plan je bezoek". A temporary holiday-closure notice was seen. | https://www.outmate.nl/showroombezoek/ | confirmed |
| Bestellen & annuleren | Cancelling is mostly impossible after ordering. E-mail ASAP or refuse the delivery; unshipped orders can be cancelled. | https://www.outmate.nl/bestellen-annuleren/ | confirmed |
| Retour / herroeping | 14 days from receipt for certain products, then 14 days to send the item back. Return shipping is paid by the customer. Refund includes the original delivery cost, within 14 days, to the original payment method. Waardevermindering may be charged. The model form still shows old partytentkopen contact details. Round-4 procedure: give notice by post or e-mail (the model form can be filled in electronically), send the item back within 14 days of the notice, refund within 14 days of the notice if it arrives in good order. No return portal or RMA number was found. A separate /herroepingsrecht/ page and a 2018 PDF exist. Whether printed (Full Colour) items are excluded: no clause found (UNCONFIRMED). | https://www.outmate.nl/retourinformatie/ · https://www.outmate.nl/herroepingsrecht/ | likely |
| Maatwerk | Not returnable, not even when the customer entered wrong dimensions. The new terms exclude maatwerk from the herroepingsrecht. | https://www.outmate.nl/product/overkapping-veranda-zeil-op-maat/ · https://www.outmate.nl/algemene-voorwaarden-nieuw/ | confirmed / likely |
| Garantie & klachten | Round 4 read /garantie-klachten/. Consumers get the **wettelijke garantie**; some products also carry a **fabrieksgarantie** stated in the product documentation, e.g. "1 jaar, slijtageonderdelen uitgesloten" (confirmed). Only a gegronde klacht is covered; opzet, verkeerd gebruik, gebrekkig onderhoud, water-, val- or stootschade and normale slijtage are excluded. Claims go via the contact form or info@outmate.nl, with an ontvangstbevestiging within 2 werkdagen and an expected answer date; after the 14-day bedenktijd, photos of the product and the defect are needed. Disputes: Keurmerk Instituut mediation and the EU ODR platform (no Keurmerk badge seen). Not storm- or snow-tested. The warranty article in the terms applies only to business buyers; repair does not restart the period and the warranty is not transferable. | https://www.outmate.nl/garantie-klachten/ · https://www.outmate.nl/product/partytent-3x3-premium-pvc-brandvertragend/ | confirmed / likely |
| Algemene voorwaarden | An OLD and a NEW version both exist. New terms (about 4 months old): eigendomsvoorbehoud until all claims are paid, including earlier and future agreements; non-consumers pay within 30 days of the invoice date (old: 8 days); liability for business customers is capped at what the aansprakelijkheidsverzekering pays out, with no liability for staff and third parties except for opzet or bewuste roekeloosheid. The old terms also cap liability at the invoice amount (direct damage only) and require consumers to prepay. | https://www.outmate.nl/algemene-voorwaarden-nieuw/ · https://www.outmate.nl/algemene-voorwaarden/ | likely |
| Privacy & cookies | A combined statement from 2018. | https://www.outmate.nl/privacy-en-veiligheid/ | confirmed |
| Reviews page | "Shopervaring" with a site-review count (not to be reused). | https://www.outmate.nl/reviews/ | confirmed |
| FAQ | Product pages have no FAQ tab. A targeted round-4 search found no dedicated FAQ / "veelgestelde vragen" page (only blog guides, manuals and the contact page), which is not proof that none exists. FAQ-like guide: "Waar moet je op letten bij de aanschaf van een partytent" (1 person seated or 1,5 standing per m²; plan an extra metre around the tent). | https://www.outmate.nl/waar-moet-je-op-letten-bij-de-aanschaf-van-een-partytent/ | unconfirmed |

**Statafelshop.nl policies** (round 4):

| Topic | Content | Source | Conf. |
|---|---|---|---|
| Retour | 14 days, at the customer's cost ("de kosten voor de retourzending zijn voor jouw rekening", confirmed). Items must be unused, in the original packaging and with the pakbon, registered via an online retourformulier; the purchase price excl. shipping is refunded after inspection. **This contradicts the "Gratis retourneren" USP.** The ruilgarantie applies only to the shop's own mistakes. | https://www.statafelshop.nl/contact/ · https://www.statafelshop.nl/waar-bezorgen-wij-veel-van-onze-statafels/ | confirmed / likely |
| Garantie | "2 jaar garantie op alle artikelen" plus the statutory guarantee. One page shows a stray "10 jaar garantie". A "Garantie en reparatie" help page was listed but not read. | https://www.statafelshop.nl/statafel-kopen/ | likely |
| FAQ | On the contact page: shipping, returns and payment. | https://www.statafelshop.nl/contact/ | likely |
| Other pages | Terms and privacy were not retrieved. An accessibility page (/toegankelijkheid) and a vacatures page exist. | https://www.statafelshop.nl/statafel-kopen-in-venlo/ · https://www.statafelshop.nl/vacatures | confirmed / likely |

All levertijd, garantie, retour and verzending values are **business claims**. In our shop they
become owner-editable settings and are listed in `docs/claims-to-confirm.md` (BRIEF §6).

## 11. B2B / zakelijk

What was confirmed or is likely on Outmate:
- The offerte button in the header, and an offerte form on PDPs with company, BTW and KvK fields.
- A BE intra-community VAT note.
- Op factuur for organisations via Peppol; the site also mentions "op factuur betalen voor
  bedrijven" (https://www.outmate.nl/product/test-2/, likely). The new terms set a 30-day invoice
  term for non-consumers (round 4, likely).
- An "Offerte aanvragen" button next to the price on some PDPs (round 4, likely).
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

**Statafelshop zakelijk** (round 4, https://www.statafelshop.nl/zakelijk/, likely):
- You can request an offerte first. Invoices are e-mailed and are always BTW-facturen, and they can
  also be downloaded from the account.
- Prices are shown incl. and excl. btw (incl. first in the snippets); there is no toggle.
- Target customers: verhuurbedrijven, horeca and particulieren.
- Advisors help with large orders or items you cannot find, and delivery happens on the agreed day,
  inside or outside opening hours. Transportkarren are promoted for storage and transport.
- Op rekening, staffels, a business-account application and the offerte form fields were **not
  found**, so they must not be claimed.
- **Actiepakketten** are a real category; contents and prices are in §14.4.

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
- Round 4: a DIY guide "Zelf een prikkabel maken?" (https://www.outmate.nl/zelf-een-prikkabel-maken/,
  confirmed) and the buying guide "Waar moet je op letten bij de aanschaf van een partytent"
  (https://www.outmate.nl/waar-moet-je-op-letten-bij-de-aanschaf-van-een-partytent/).

**Statafelshop content & SEO** (round 4):
- **Guides** (existence confirmed; topics likely):
  - /statafel-kopen/ (criteria: height matched to the barkrukken, bladdiameter, a stable onderstel,
    a krasvast and temperatuurbestendig blad, inklapbaarheid, a rok);
  - /statafelkleed-kopen/ (stretchrok vs strikrok vs loose kleed, colours, care);
  - /statafelhoes-kopen/ ("Statafelhoes of statafelrok kopen");
  - /wat-is-de-juiste-hoogte-statafel/ (107 vs 110 cm);
  - /goedkope-statafel-kopen/ (Savannah Ø70 for 4–5 standing, Ø80 for 6);
  - /statafel-met-rok/, /statafelkleed/, /partytafel/, /hangtafel-kopen/, /barstoel-kopen/,
    /klapstoel-kopen/, /biertafel-kopen/ and /waar-bezorgen-wij-veel-van-onze-statafels/.
- **City pages** "Statafel kopen in <stad>" for venlo, arnhem, amsterdam, assen, groningen,
  amersfoort, utrecht, maastricht, den-haag, delft, hengelo, ede, almere, oss, haarlem, apeldoorn
  and zwolle, plus /bezorggebied/{arnhem,assen,almere,zwolle}
  (https://www.statafelshop.nl/statafel-kopen-in-venlo/, confirmed).
- **Blog** with dated posts, e.g.
  https://www.statafelshop.nl/blog/2024/11/27/de-verschillende-benamingen-van-een-statafel-welke-zijn-er-zoal/
  (confirmed).
- Heading structures were not obtained. Never copy the wording.

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
10. **Claims that match the policy.** Statafelshop's USP bar promises "Gratis retourneren" and
    "Gratis verzenden" while its FAQ charges return costs and a flat €15 excl. shipping, and one
    page says 10 years' warranty instead of 2 (§14.8). Each of our claims comes from one owner
    setting, so the bar, PDP and policy pages always say the same thing.
11. **Print upload and proof at order.** Statafelshop asks for photos by e-mail after the order and
    shows no proof step (§8). Upload in the PDP plus a proof before production is better.
12. **Staffels on textiles.** The market offers quantity prices on rokken and topcovers;
    Statafelshop does not (§15).
13. **A fit helper.** Statafelshop sells two size bands (Ø60–70 / Ø80–90) for tables 105–115 cm
    high, but explains this only in text. A tafelmaat → rokmaat helper on the PDP removes doubt.

## 14. Statafelshop.nl — round-4 findings and remaining gaps

**Status.** Round 4 (2026-10-17) gathered the first Statafelshop data: three agents and 80
WebSearch calls with `allowed_domains` set to statafelshop.nl/.be. The raw output is blocks 0–2 of
`$SCRATCH/research-raw-2.json`. The four earlier attempts ran no query (§0).
- **Age.** The answers are search-tool summaries of snippets, many of them about 330 days old or
  older. Prices and stock may therefore be stale.
- **Blending.** A summary can blend two pages. Conflicts are kept side by side and labelled.
- **Operator.** Statafelshop is run by Deadan.com bv, not by Outmate (§1). Outmate values are
  therefore not used as Statafelshop proxies anywhere.
- **Claims to confirm.** Every Statafelshop value that ends up in our catalog or theme is still an
  owner-confirmed suggestion and must be listed in `docs/claims-to-confirm.md`. Statafelshop's
  model names must not be reused.

### 14.1 Operator, platform and global UX

These are in §1 (operator, addresses, platform, statafelshop.be), §2 (header, USP bar, trust,
contact, account, footer) and §3 (navigation).

### 14.2 Statafels

Source: https://www.statafelshop.nl/product-categorie/statafels/ unless noted. Prices are incl. /
excl. btw.
- **Heights.** 107 or 110 cm only ("Kies uit 107cm of 110cm",
  https://www.statafelshop.nl/wat-is-de-juiste-hoogte-statafel/, likely).
- **Tops.** Round tops come in Ø70/Ø80/Ø85; no round Ø60 was found (confirmed). Tops are
  epoxy-coated with a kantenband or bumper edge.
- **Folding.** Every round model is inklapbaar.
- **Not found** (searched, not proof): a statafel with an HDPE or blow-mold top, a statafel with
  wheels, and any max-load figure (the only kg rating is 150 kg on the Kruk Indus laag).

| Reference model (theirs) | Top / height | Notes | Price | Conf. |
|---|---|---|---|---|
| New York | Ø80 wit, 110 cm, grijs hamerslag | kliksysteem, light | €45,00 / €37,19 | confirmed |
| New York + stretchrok met topcover | idem | rok colour choice | €71,39 / €59,00 (older €95,53) | likely |
| Savannah | Ø70/Ø80/Ø85 wit, 110 cm | Ø70 for 4–5 standing, Ø80 for 6 | from €102,79 / €84,95 | confirmed sizes / likely price |
| Savannah Ø80 + stretchrok | idem | "Aanbieding" | €120,94 / €99,95 | likely |
| Sacramento | Ø70/Ø80/Ø85, antraciet/pizarra/punti, 110 cm | indoor and outdoor; parasolgat variant | from €102,79 / €84,95 | likely |
| Toronto (new) | Ø70/Ø80/Ø85, 110 cm | URL not returned | from €140,30 / €115,95 | likely |
| Oregon | Ø80 antraciet, 107 cm | one header says 110 | €96,74 / €79,95 | likely |
| Columbus | Ø80 antraciet, 110 cm | 32 mm tube, heat-resistant to 180 °C, 13,2 kg, 133 cm folded | €108,84 / €89,95 (another €81,95 excl.) | likely |
| Colorado | Ø85 graniet, 107 cm, zwart frame | outdoor, heat-resistant to 180 °C | €104,00 / €85,95 | likely |
| Hudson · Missouri | Ø85, 107 cm (punti · wit) | Missouri weather-resistant | €106,42 / €87,95 each | likely |
| Ohio | Ø85, 110 cm | 13,2 kg, 138 x 85 cm folded | €112,47 / €92,95 (old listing) | likely |
| Christiaan | Ø85, 107 cm, alu frame | URL from statafelshop.be | €84,95 excl. | unconfirmed |
| Yukon | 80x80 or Ø85, 110 cm | | from €113,68 / €93,95 | likely |
| Indus · Indus Breed | 60x60/70x70 · 120x60/120x70, 107 cm | stapelbaar, many top finishes | €122,95 excl. · €209,00 excl. | likely |
| Kansas | 60x60/70x70, 110 cm, RVS or zwart frame | tops hout, wit/zwart compact, wit/zwart melamine | from €163,29 / €134,95 (stale) | confirmed options |
| Purus | 160x60 vurenhout, 110 cm | "MINIMALE afname 4 stuks" | €204,49 / €169,00 | likely |
| Montana breed | wide, top fixed with a turn knob | same €209 excl. as Indus Breed, possibly conflated | €209,00 excl. | unconfirmed |

Japura exists on statafelshop.be and on the old site (€96,74 incl.). A hangtafel page exists
(https://statafelshop.nl/hangtafel). The category filters are listed in §6.

### 14.3 Textiles (statafelhoezen, kleden, topcovers, beschermplaten)

Sources: https://www.statafelshop.nl/product-categorie/statafelhoezen/ and
https://www.statafelshop.nl/product-categorie/textiel/.
- **Care.** All hoezen are "wasbaar op 30 graden, kleurvast en kreukbestendig" (likely).
- **No staffels.** No staffel or set price appears on any textile page (likely); bulk buyers are
  sent to Zakelijk.

| Product | Options | Price incl. / excl. | Conf. |
|---|---|---|---|
| Stretchrok + topcover (bestseller) | Klein Ø60–Ø70 / Standaard Ø80–Ø90 (Ø85 falls under Standaard), for tables 105–115 cm high; 100% polyester; topcover always included; 22 colours: Antraciet, Appelgroen, Aqua blauw, Blauw, Bordeaux, Caramel, Chocolade, Donker roze, Dune, Ecru, Geel, Goud, Grijs, Groen, Marine blauw, Oranje, Paars, Rood, Turquoise, Wit, Zilver, Zwart (other pages say 21, 20 or 19) | from €33,82 / €27,95; same for both sizes per one search only | confirmed |
| Strikrok | Antraciet, Blauw, Bordeaux, Ecru, Wit, Zwart; Ø70–Ø90; "Los"; less elastic, so it forms a plooi with a strik in the middle; no separate strik colour | from €30,19 / €24,95 **or** €35,03 / €28,95 (two snapshots) | confirmed / likely |
| EK/WK stretchrok Nederland | Klein / Standaard | €48,34 (was €54,45) / €39,95 | likely |
| Losse topcover (stretch) | Klein / Standaard; about 22 colours (older copy: 15) | from €12,04 / €9,95 **or** €13,25 / €10,95; schema range up to €58,71 (unexplained) | likely |
| Losse topcover rood/wit/blauw | Ø130 polyester | €23,60 / €19,50 | likely |
| Tafelkleed rond / vierkant | Ø130 / 140x140; Blauw, Bordeaux, Ecru, Wit, Zwart; 100% polyester; laid over a stretchrok; no floor-length kleed | €18,09 / €14,95 | confirmed |
| Stretchhoes buffettafel | 183x76; Wit / Zwart | €42,29 / €34,95 | confirmed |
| Stretchhoes met eigen opdruk | Ø80 / Ø85 (flow in §8) | from €119,79 / €99,00 | likely |
| Beschermplaat (transparent PVC) | Ø68 / Ø78 / Ø83; 182x75 for buffet tables | from €18,09 / €14,95; €30,19 / €24,95 | likely |
| Beschermplaat met eigen opdruk | Ø68 / Ø78 / Ø83 | from €75,63 / €62,50 | likely |

Not found: fabric weight (g/m²) or elastane share, any biertafelhoes, a separate strik-colour
choice, swatches vs dropdown, and a kleurstalen service. One page claims 11 strik colours
(unconfirmed).

### 14.4 Actiepakketten and transportkarren

Actiepakketten: https://www.statafelshop.nl/product-categorie/actiepakketten/ (alias
/aanbiedingen). Many sets show "tijdelijk niet op voorraad".

| Package | Price incl. / excl. | Conf. |
|---|---|---|
| 1 statafel Colorado + 1 stretchrok met topcover (colour of choice, standaard) + 4 barkrukken Angara (/product/actiepakket-vi/) | €411,40 (was €445,11) / €340,00 | confirmed |
| transportkar + 5 statafels Savannah (Ø70/80/85); a rok per table can be chosen at from €33,82 each, inclusion unclear; "Gratis verzenden" | €780,45 / €645,00 | likely |
| transportkar klein + 7 statafels Colorado | €966,79 / €799,00 | likely |
| transportkar klein + statafels Colorado + stretchrokken (/product/actiepakket/) | €1.148,29 / €949,00 | likely |
| transportkar groot + 15 statafels Colorado (/product/actiepakket-iv/) | €1.692,79 / €1.399,00 | confirmed |
| transportkar groot + statafels Colorado + stretchrokken | €1.650,00 excl. (single source) | likely |
| 25 buffettafels + stretchrokken + beschermplaten + transportkar | €5.196,95 / €4.295,00 | likely |
| 10 biertafels standaard / brouwerij | from €1.017,55 / €840,95 · from €1.376,92 / €1.137,95 | likely |
| transportkar + 6 statafels Yukon | sold out, price not found | likely |

The homepage teases an actiepakket "vanaf €69,95". No "4 statafels + 4 rokken" package was found.
A set of 7 statafels with 7 kleden is mentioned without a price. Savings per package are not
stated.

Transportkarren (https://www.statafelshop.nl/product-categorie/transportkarren/) have heavy duty
wielen and an impact-resistant powder coating:
- **Groot.** L 125,5 x B 97 x H 113 cm, grijs hamerslag; holds 15 Colorado/Hudson/Missouri, 12
  Yukon/Ohio or 10 Savannah/Sacramento (confirmed). €434,39 / €359,00 on the PDP; the category page
  shows €465,85 / €385,00.
- **Klein.** 65 x 95 x 114 cm; holds 5 Savannah/Sacramento; €311,58 / €257,50 (another block €320
  excl.) (likely).
- **Mississippi.** Up to 10 tables, 115 x 70 x 129 cm, €435 excl. (likely).
- **Other carts.** For Kansas, Indus, buffettafel rond, stapelstoel Waal (20/40), klapstoel Moezel
  (33), klapstoel Donau (50), barkruk Indus (24) and barkruk Angara/Amoer (up to 30). They are sold
  empty or filled; several are out of stock.

### 14.5 Other categories

- **Barkrukken.** 8 high models, including Indus (stapelbaar, from about €39 incl.), Amoer (chrome
  frame), Angara and Rotan (PE rotan, outdoor). A Kruk Indus laag is rated 150 kg (unconfirmed).
- **Stoelen.** Klapstoelen (Donau, Moezel) and the stapelstoel Waal (/product-categorie/stoelen/,
  alias /horeca-stoelen). No prices were retrieved.
- **Banken.** A bench with a wooden frame and fabric seat; the URL was not observed.
- **Terrastafels.** Three round inklapbare terrastafels and the Terrastafel Kansas RVS (60x60 or
  70x70, wood or melamine top).
- **Tafels.** Buffettafel Blow Mold 180x76 (74 cm, light grey, folding) €85,85 / €70,95; 122x61
  €74,96 / €61,95; with stretchhoes €119,79 / €99,00; a bankettafel rond also exists.
- **Biertafelsets.** Biertafel standaard kwaliteit 220x50 €94,95 excl.; biertafelset standaard
  €185,95 excl.; a brouwerij kwaliteit; 10-piece sets. The landing page says "tafels en tafelsets
  vanaf €104,-".
- **Onderdelen.** Parts per model (middenstuk Savannah; voetdop and schroeven Sacramento; onderstel
  Missouri, Colorado and Oregon; voetdop Colorado) and a los tafelblad in several sizes. Its
  subcategories are onderstel and buisbeugel.
- **Diverse.** Beschermplaten (§14.3).

### 14.6 Service, shipping, payment and B2B

These are in §9 (shipping, cut-off, payment, pickup), §10 (returns, warranty, FAQ) and §11
(zakelijk). Their headlines:
- **Shipping.** A flat €15 excl. / €18,15 incl., by DHL or pallet.
- **Cut-off.** "voor 14u besteld, dezelfde dag verzonden".
- **Returns.** 14 days at the customer's cost.
- **Warranty.** 2 jaar.
- **Payment.** iDEAL, PayPal, Bancontact, creditcard, Sofort and bankoverschrijving.
- **Zakelijk.** Offerte, BTW-facturen and an incl./excl. price display; no op rekening and no
  staffels.

### 14.7 Content and SEO

These are in §12: the guides, 17 city pages, the bezorggebied pages and the blog.

### 14.8 Contradictions on the site itself

Do not copy these claims without the owner deciding which one is true for our brand:
- **Returns.** The "Gratis retourneren" USP conflicts with the FAQ's 14-day returns at the
  customer's cost.
- **Shipping.** "Gratis verzenden" badges conflict with the FAQ's flat €15 excl. This applies on
  .nl and .be.
- **Warranty.** "2 jaar garantie" conflicts with a stray "10 jaar garantie" on /statafel-kopen/ and
  /goedkope-statafel-kopen/.
- **Colour counts.** The stretchrok shows 22, 21, 20 or 19 colours depending on the page. The
  strikrok shows 6 on the PDP and 11 on one page.
- **Prices.** Strikrok, losse topcover and transportkar groot each show two prices.
- **Addresses.** Three addresses appear (Oosteind, Oosterhout, Lierop).

### 14.9 Still unknown (rerun list)

Run these as one agent, first and alone in a fresh turn, with mode "extended" and
`allowed_domains: ["statafelshop.nl"]` (item 9: statafelshop.be). Use one query per item and
record the source URL for every fact.
1. **Operator.** Which address is current and which is the pickup point. Whether
   https://statafelshop.nl/bedrijfsgegevens still names Deadan.com bv, and the BTW number.
2. **Homepage.** The section order, the full footer link list, a newsletter, opening hours, and the
   review provider behind "Wij scoren een 9,6".
3. **Platform.** Which URL scheme is live (WooCommerce `/product-categorie/` vs the legacy short
   slugs vs oud.statafelshop.nl), plus the sort options, pagination and search autocomplete.
4. **Statafels.** Price per Ø on Savannah, Sacramento and Toronto; weight, max load and folded size
   per model; the Christiaan, Toronto and Indus Breed URLs; Montana vs Indus Breed.
5. **Textiles.**
   - The current strikrok and losse-topcover prices.
   - The €58,71 top of the topcover schema range.
   - Fabric g/m².
   - Whether colours show as swatches.
   - The 11-colour strik claim.
   - Whether the 5x Savannah package includes rokken.
6. **Print.** A drukproef, the MOQ, print method and positions, and file requirements, asked
   directly on https://www.statafelshop.nl/product/stretchrok-met-eigen-opdruk/.
7. **Other categories.** Prices for barkrukken (other than Indus), stoelen, banken and terrastafels;
   the Banken and Transportkarren category URLs; part prices.
8. **Policy pages.** The "Garantie en reparatie" page, the terms and privacy pages, and what lies
   behind the "Gratis verzenden" badges (a per-product rule or a threshold).
9. **statafelshop.be.** BE prices and BE shipping per product.

## 15. Market price calibration

Prices are incl. 21% btw unless noted. The Outmate and Statafelshop references are from this
dossier; the market data is from round 4, block 3 of `$SCRATCH/research-raw-2.json` (20 searches,
snippets only). The structured version is in assortment.json `market_price_bands`. Rental prices
(partyrijk.nl, spijkerman.eu, rentmen.be) do not calibrate retail.

**Outmate reference prices**:

| Product | Outmate ref. | Source |
|---|---|---|
| Easy-up 3x3 budget/steel | from €299 | https://www.outmate.nl/product-categorie/easy-up-partytenten/easy-up-partytenten-premium/ |
| Easy-up 3x3 pro alu, polyester / HD PVC | from €679 / €789 | https://www.outmate.nl/product-categorie/easy-up-partytenten/easy-up-partytenten-professional/ |
| Easy-up 3x6 pro alu, polyester / HD PVC | from €1.149 / €1.359 | idem |
| Zijwandenset 3x3 polyester | from €249 | https://www.outmate.nl/product/zijwandenset-easy-up-3x3m-pvc-gecoat-polyester-heavy-duty-pvc/ |
| Voetgewicht 15 kg | €49,95 | https://www.outmate.nl/product/voetgewicht-voor-vouwtenten/ |
| Partytent 3x8 PVC 550 | €789 | https://www.outmate.nl/product/partytent-3x8-premium-pvc-brandvertragend/ |
| Partytent 8x12 PVC Premium | €1.850 | https://www.outmate.nl/product/partytent-8x12-premium-pvc-brandvertragend/ |
| Opslagtent 3x4 Classic / Premium / Professional | €399 / €499 / €569 | https://www.outmate.nl/product-categorie/opslagtenten/ |
| Stretchtent 6x6 complete | from €3.425 | https://www.outmate.nl/product/stretchtent-6x6-meter-premiumstretch-lus-verbinding/ |
| Stertent 10 m | from €1.029 | https://www.outmate.nl/product/stertent-10m-diameter-starmate-professional/ |
| Inflatable 3x3 | €1.250 | https://www.outmate.nl/product/opblaasbare-promotietent-airmate-alpha-3x3m/ |
| Statafel opklapbaar 70x70 | from €147 | https://www.outmate.nl/product/opklapbare-statafel-tundra-70-x-70-cm/ |
| Statafelrok stretch | €14,99 | https://www.outmate.nl/product/statafelrok-stretch/ |
| Prikkabel 10 m | from €49 | https://www.outmate.nl/product/prikkabel-10-meter/ |
| LED lichtslang 20 m | €58 | https://www.outmate.nl/product/led-lichtslang-20-meter-warm-wit-36-leds-per-meter-lichtsnoer-voor-buiten-2200k/ |

**Market bands** (round 4, likely unless noted):

| Product | Segment: observed range (examples) | Reference shops | Suggested band (agent's proposal) |
|---|---|---|---|
| Easy-up 3x3 | Budget steel: €65–€160 (bol.com, Praxis, Gamma). With walls: €160–€210 (Tristar, Vonroc, LifeGoods). Semi-pro: €229–€359 (partytent.nl Premium €229; VVEP Go Rent Easy 40 mm staal €359,31; vouwtent.eu Premium AluHex 45 mm €350, €500 with walls and bag). Pro 40 mm alu: €549–€669 (VVEP Comfort). Pro 50 mm alu: €525–€769 (VVEP Pro €648,98 / €768,96 PVC; vouwtent.eu AluHexPRO €750 incl. walls; bol.com "professional" with 4 walls €525). | Outmate €299 / €679 / €789 | budget €99–€179; semi-pro €229–€359; pro €549–€799 |
| Easy-up 3x6 | Semi-pro: partytent.nl Premium €499. Pro 50 mm alu: €699–€1.229 (partytent.nl PVC Professional €699; VVEP Pro polyester €1.049,01 special / €1.139,76 regular, ripstop PVC €1.229). Consumer 3x6 prices were not returned. | Outmate €459 / €1.149 / €1.359 | semi-pro €449–€549; pro €699–€1.359 |
| Zijwanden 3x3 (set of 4) | Per 3 m wall: €50–€69 (VVEP €50,22 dicht / €59,90 ingang or raam; partytent.nl PVC met ramen €69). Set: E-Z UP Duralon €175 (bol.com); €200–€276 built from single walls. | Outmate from €249 | €175–€279 |
| Gewichten (set of 4) | Fillable 4x10 kg bags: €21–€25 (Relaxdays). Plastic water feet: €50 (ACAZA). Steel 15 kg plate: €50–€55 each, so about €200–€220 for 4. | Outmate €49,95 each; zandzakken set €19,99 | — |
| Statafelrok stretch Ø80 | Budget without topcover: €12,50–€18 (biertafelplaza €12,50 sale and €17,50; bol.com €15,99–€18). With topcover: €23–€30 (VVEP €22,93, conflicting snippet €29,34; Cover Up €24,95; D2 €23,95–€29,95; set of 4 €70,95). Topcover staffel at biertafelplaza: €7,50 each, €30 for 5, €55 for 10. | Outmate €14,99; Statafelshop €33,82 | €15–€34 incl. topcover; staffels are common |
| Inklapbare statafel Ø80 | DIY: €46–€80 (Praxis Practo €45,90; Gamma €57,99 with a 4,5 cm HDPE top; VVEP Budget €45,92 / Basic €57,48; bol.com €59,80–€79,99). Horeca mid: €97–€109 (VVEP New Classic €102,79 and Maan €96,74). Heavy: VVEP Easy High €272,25 (24 kg). Premium printed alu: statafelwinkel.nl Rhino €295 incl. print and topcover (175 kg load). | Statafelshop New York €45; Oregon €96,74; Savannah from €102,79; Columbus €108,84 | — |
| Bedrukte statafelhoes, 1 piece | €88–€125 excl. (Drukwerkdeal €89,50; PrintTable €87,95; VKF Renzel €103,60–€114,50; Withagen €125); La Parada from €51,26 (volume, basis unclear, unconfirmed). Printed buffet stretchhoes: €149–€204 (TecTronic, staffel from 5). | Statafelshop €99 excl. / €119,79 incl. | about €99 excl. / €119 incl., with staffel |
| Bedrukte easy-up 3x3 | €566–€795, mostly excl. or basis unclear (Partytent-Online €566,22 excl.; Mijn Reclamevlag €694,25; Partytenten Discounter €695; Eclipse €795). | Outmate: price inside the Full Colour variant | — |
| Stretchtent 10x15 | New: €8.517–€10.950 incl. / €7.039–€9.050 excl. (Tentopia; Eurostretchtents €7.425; Blaze BE). Used: €3.000 (Marktplaats, unconfirmed). Rental: €1.235–€1.575. | Outmate 10,5x15 €11.710 (top of the market) | — |

**Caveats**:
- **partytent.nl** uses Outmate's exact product naming at lower prices (3x3 Premium €229 vs €299;
  3x6 Professional €699 vs from €1.149). It may be an affiliated or reseller shop; this is
  unverified.
- **VVEP vs Statafelshop.** VVEP New Classic and Maan cost the same, to the cent, as Statafelshop's
  Savannah and old Japura. They may share a supplier, or the snippets were conflated.
- **Not found:** easyup.nl Endeavor and easyup-tenten.nl Solid 50 prices, Gamma One Touch 3x6, VVEP
  3x6 Easy/Comfort, and a 3x6 zijwanden set price.
- **Still unknown:** pay-later adoption in the niche, and common same-day cut-off times beyond
  Statafelshop's 14:00.

## 16. Open questions (for owner / rerun)

1. **Statafelshop.nl:** see §14.9.
2. **BRIEF §1 correction.** Statafelshop is run by Deadan.com bv, not by Outmate BV, as far as the
   sources show (§1). The brief should be updated by the owner or orchestrator; this merge did not
   edit it.
3. **Market bands still missing:** see the "Not found" caveat in §15.
4. **Partytent buizenframe** (round 4 filled most of the matrix):
   - Classic prices for 3x4, 3x8, 4x8, 5x4, 5x10, 5x12, 6x10 and 6x12.
   - Premium 3x4 and 5x6 prices.
   - Professional 4x6, and whether a 3x4 tent exists.
   - Whether the Ultimate 3x4 and 4x8 include walls.
   - PE Basic fire-retardancy.
   - Per-line wall thickness, side walls, capacity, weight and shipping.
   - Opslagtent heights and doors, Professional 4x8, and the 3x6 prices.
   - Rerun order: the comparison guide https://www.outmate.nl/het-verschil-tussen-de-partytenten/,
     then the missing PDP slugs (/product/partytent-{size}-classic-pvc-brandvertragend/,
     /product/partytent-4x6-professional-pvc-brandvertragend/). outmate.be mirrors the URLs.
5. **Easy-up**, still open after round 4:
   - What ships in the box. Wheels are optional; no included bag was found.
   - The frame warranty term.
   - Premium clearance, total height, capacity, 3x3 weight and packed size.
   - Professional 3x4,5 capacity and packed length × width.
   - Rerun the two PDP URLs first:
     https://www.outmate.nl/product/easy-up-partytent-3x3m-premium-pvc-gecoat-polyester/ and
     https://www.outmate.nl/product/easy-up-3x45m-professional-pvc-gecoat-polyester/.
6. **Print surcharge.** The surcharge, and whether volume print pricing exists. Neither shop states
   one.
7. **Outmate WhatsApp or live chat.** Whether outmate.nl has either. Statafelshop has both (§2).
8. **Outmate storefront.** Not re-run in round 4:
   - A newsletter, a USP bar, footer payment icons, social links and a Trustpilot widget.
   - The /mijn-account/ dashboard, and whether registration asks for bedrijfsnaam, BTW or KvK.
   - Search suggestions and the https://www.outmate.nl/?s=partytent layout.
   - Sort (`?orderby=`), pagination, and price and stock filters.
   - Product compare and recently viewed.
9. **Outmate payment.** The current payment provider. Whether Sofort, Giropay and DIRECTebanking
   are still offered. Which methods carry a surcharge, and how much.
10. **Outmate prices still missing:**
    - Klapstoel and biertafelset (neither was found in round 4).
    - The hamerslag barkruk.
    - The Foldtable €959 (verify; it may be a set).
    - The Cross Back trolley and the Supercombi 24x Hamburg.
    - Gas heaters (and gas type and product URLs).
    - Afzetpalen (per post, rope, printed belt at MOQ 10).
    - Opbergtas 200 cm, tussenwand, and the long buizenframe side walls.

    Existence checks never run, so no "not found" may be claimed:
    - Cadeaubon/gift card.
    - An outlet, sale, B-keuze or occasion range.
    - The grondframes and reparatiesets URLs.
    - Floors or grondzeilen beyond lopers.
    - Promotietenten or bedrukte tenten as their own outmate.nl category.
    - Pagodetenten, parasols, beachflags/vlaggen and dranghekken.
    - The rest of the "Zeilen en zeildoeken" menu group.
    - The own URLs of Koppelgoten, Palen en palensets and Tuinpaviljoen zijwanden.
    - The full /product-categorie/ census and the /alle/ product list.

    Round-4 checks that did run (the kerstverlichting URL was found; the rest were searched and not
    found) are logged in assortment.json `existence_checks` with `query_ran: true`.
11. **Outmate policies still missing.** Whether printed (Full Colour) items are excluded from
    returns (no clause found), and the freight unloading, kerbside and rescheduling rules.
12. **Owner decisions:**
    - Do we replicate "highest shipping cost only" (Outmate), use a flat rate (Statafelshop's €15
      excl.), or use classes? The first needs an app or a tiered approximation.
    - Do we offer op factuur (Shopify B2B is Plus-only)? Statafelshop does not; Outmate does, for
      organisations.
    - Do we offer pay-at-pickup, showroom visits and rental?
    - Do we offer staffels on statafelrokken? The market does; Statafelshop does not.
    - Which same-day cut-off do we promise? Statafelshop uses 14:00 on stock items.
13. **Our own terms.** The real lead times, cut-off time, warranty and return terms for our brand.
    These go into `docs/claims-to-confirm.md`. Statafelshop's contradictions (§14.8) show why each
    claim needs a single source.
