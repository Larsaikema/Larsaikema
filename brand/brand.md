# Klapklaar merkboek

Versie 2, 17-10-2026. Dit is de bron voor naam, logo, kleur, typografie, beeld en toon van de webshop.
Het visuele overzicht staat in [`brand-sheet.html`](brand-sheet.html) (screenshot: `brand-sheet.png`).
Kleuren, fonts, radii, spacing, schaduwen en motion staan machineleesbaar in [`tokens.json`](tokens.json).

> **Status van de naam: NIET GETOETST.** KvK, BOIP/EUIPO en SIDN zijn niet gecontroleerd (zie §11).
> Doe dat voordat je iets registreert, laat drukken of een domein koopt.

---

## 1. Naam en betekenis

**Klapklaar** · klapklaar.nl / klapklaar.be / @klapklaar (geen van deze is gecontroleerd op beschikbaarheid).
Tagline: **In één klap feestklaar.**

De naam heeft drie lagen die een Nederlandse lezer direct snapt:

| Laag | Betekenis | Waarom het werkt |
|---|---|---|
| **klap** | uitklappen | Een easy-up en een klapstatafel staan in één beweging. Het woord doet wat het product doet. |
| **in één klap** | in één keer | Tent, statafels, rokken, verlichting en meubilair in één bestelling, voor particulier en zakelijk. |
| **klaar** | gereed, "klaar is Kees" | Past bij de nuchtere, concrete toon. De naam gaat over klaar zijn, niet over één product, en dekt dus het hele assortiment. |

9 letters, 2 lettergrepen, dubbele k-l-alliteratie, geschreven zoals je hem zegt. Geen Engelse "-mate", geen
generieke "-shop": hij lijkt niet op Outmate of Statafelshop.

**Bekend risico:** "klap" betekent ook een klap of iets dat in elkaar klapt. Dat is precies de angst van kopers van
goedkope easy-ups bij wind. Daarom (zie §7): gebruik "klap" nooit in de buurt van wind, storm, stevigheid of garantie,
en laat elke tent met specificaties (staal/aluminium, buisdikte, gewichten, haringen) zien dat hij blijft staan.

## 2. Positionering en merkbelofte

**Voor wie:** iedereen die iets organiseert.

| Doelgroep | Wie | Wat ze nodig hebben | Waar het merk dat laat zien |
|---|---|---|---|
| **Consument** | tuinfeest, verjaardag, bruiloft, buurtfeest, markt | snel kiezen, juiste maat, weten wanneer het er is, simpel opzetten | maatgids, spec-regel op elke kaart, voorraadstatus, opzetuitleg |
| **Vereniging / school** | sportclub, carnaval, schoolfeest | budget, meerdere stuks, logo erop, factuur | staffelprijzen, "Met jouw logo", betalen op factuur [claim] |
| **Horeca** | terras, festivalbar, catering | duurzaam, uniform, snel nabesteld | Professional-lijn, vaste kleuren, nabestellen via account |
| **Eventbureau / verhuur** | tientallen tenten en tafels, eigen bedrukking | prijs excl. btw, offerte, drukproef, levering op locatie | Klapklaar Zakelijk (§6), offerte-flow, staffeltabellen |

**Merkbelofte:** *Je kiest je maat, wij zorgen dat het klaarstaat.* Concreet betekent dat: elke productpagina noemt
maat, materiaal, gewicht en levertijd voordat er sfeer komt; elke bedrukking start met een drukproef; elke zakelijke
vraag krijgt een offerte op maat. Levertijden, betaalvormen en reactietijden zijn claims die de eigenaar invult en
bevestigt (`docs/claims-to-confirm.md`).

**Wat we niet zijn:** niet de goedkoopste roep-winkel, niet "nr. 1", niet hip om het hip-zijn. Geen verzonnen sterren,
reviews, klantaantallen of keurmerken.

## 3. Logo

### 3.1 Constructie

Geen letter komt uit een font. `tools/kk.py` construeert elke vorm uit lijnen en Bézier-curves; `tools/build.py`
schrijft de SVG's. Regels:

- **Eén streekdikte.** Stok 130 eenheden op een x-hoogte van 500 (zwaar, leesbaar op een luifel op 10 m), horizontaal 112
  (optische correctie).
- **Vierkant-ronde kommen** (superellips, Bézier-handle 0,66 in plaats van 0,55 voor een cirkel): stevig, "stalen
  buis". De a is eenverdiepings met een platte binnenkant tegen de stok.
- **21°.** Het dak heeft een helling van 21°. Dezelfde hoek snijdt de bovenkant van k en l en de onderkant van de p af.
  Dak en letters zijn daardoor één familie: dit is het eigen, niet te typen detail.
- **De tent is onderdeel van de letters.** De luifelband is precies één stok dik (130) en zijn bovenrand ligt op de
  stokhoogte van k en l (712). Het dak overspant exact de dubbele **aa** plus één overstek (22) aan elke kant. De aa
  staat letterlijk onder de tent.
- **Vlaggetje op de piek.** Een wimpel op de middenpaal maakt het een feesttent en geen huis. De wimpel is ook het losse
  merkteken (§3.5).
- Alle paden zijn echte, niet-overlappende contouren (buitenkant met de klok mee, binnenvormen ertegenin): veilig voor
  plotter, vinyl, borduur en zeefdruk.

### 3.2 Bestanden

| Bestand | Gebruik |
|---|---|
| `logo.svg` | Standaard: Inkt-letters + Klaproos-dak. Op Zand, Wit, Duin, Linnen, Studio. |
| `logo-inverse.svg` | Zand-letters + Zon-dak. Op Polder en Inkt. |
| `svg/logo-on-klaproos.svg` | Eén kleur Zand, op Klaproos. |
| `svg/logo-mono.svg` | `currentColor`, één kleur. Voor de theme-header (inline SVG, kleur via CSS), stempels, gravure. |
| `svg/logo-luifel.svg`, `svg/logo-luifel-inverse.svg` | **Luifel-lock-up**: woordmerk + descriptorbalk "PARTYTENTEN · STATAFELS". Voor luifels, bus, marktplaats-tegels, beursstand: overal waar iemand de naam nog niet kent. |
| `svg/logo-zakelijk.svg` | **Klapklaar Zakelijk**: Inkt-woordmerk, Polder-streep en "Zakelijk". Offertes, facturen, B2B-pagina's. |
| `mark.svg` | **Beeldmerk**: aa onder de tent op een Klaproos-vlak met Zon-vlaggetje. Avatar, app-icoon, stempel. |
| `svg/mark-polder.svg`, `svg/mark-zand.svg`, `svg/mark-mono.svg` | Varianten van het beeldmerk. |
| `svg/print-wordmark.svg`, `svg/print-mark.svg` | **Drukbestanden**, één kleur (zwart = inkt), letters en dak in één pad. |
| `favicon.svg`, `favicon-32.png`, `favicon-192.png` | Favicon, optisch zwaarder (stok 172). |
| `svg/favicon-16.svg`, `img/favicon-16.png` | 16 px-pictogram: tent met poten op het pixelraster (letters zijn op 16 px onleesbaar). |
| `svg/favicon-cart.svg` | Favicon met Zon-stip: wisselen via JS als `cart.item_count > 0`. |
| `img/apple-touch-icon-180.png`, `img/mark-512.png` | iOS-icoon (vol vlak), social avatar. |
| `svg/pennant.svg`, `svg/vlaggenlijn.svg` | Vlaggetje en vlaggenlijn (patroon, scheider). |

### 3.3 Gebruik

- **Vrije ruimte:** rondom minimaal de x-hoogte van de a (1 x). Bij de luifel-lock-up ook 1 x boven het vlaggetje.
- **Minimummaat:** `logo.svg` 112 px / 30 mm breed; luifel-lock-up 160 px / 45 mm; beeldmerk 24 px / 8 mm. Kleiner dan
  24 px: het favicon-pictogram.
- **Kleur van het dak:** Klaproos (op licht), Zon (op Polder/Inkt) of gelijk aan de letters (eenkleurig). Nooit een
  andere kleur, nooit Klaproos op Klaproos.
- **Niet:** uitrekken, smaller maken, draaien, omlijnen, schaduw, verloop, het dak los van de letters gebruiken (behalve
  als beeldmerk of vlaggetje), het woord zelf typen in een font, het dak boven een ander woord zetten.
- **Theme-header:** inline `svg/logo-mono.svg` (Inkt via CSS), of `logo.svg` als afbeelding. Hoogte 38–40 px desktop,
  30–32 px mobiel. Footer op Polder: `logo-inverse.svg`.

### 3.4 Op tent, tafel en bus (drukregels)

1. **Eén drukkleur.** Zand op Klaproos of Inkt; Inkt op wit doek. Twee kleuren (Zon-vlaggetje) alleen bij
   digitale/sublimatiedruk.
2. **Luifel:** `print-wordmark.svg`, 60–70% van de luifelhoogte hoog. Op een luifel van ca. 21 cm (maat leverancier
   controleren) is dat 13–14 cm hoog en ±42 cm breed. Nooit breder dan 50% van de zijde. Gecentreerd, op alle vier de
   zijden. Wil je groter: luifel-lock-up op dak of zijwand.
3. **x-hoogte minimaal 4 cm** op alles wat je van afstand moet lezen.
4. **Statafelrok:** `print-mark.svg` (aa onder de tent), 20–24 cm breed op Ø 80 cm, midden op het voorpaneel, hart op
   30–35 cm boven de vloer. Daar is de stretch breed genoeg en vervormt het merk niet. Klantlogo's volgen dezelfde
   maatvoering (zie de render in de brand sheet).
5. **Bestelbus:** luifel-lock-up op de zijkant, logohoogte ongeveer 1/3 van de laadruimte; Klaproos-plint van 15–20 cm
   als "luifelband"; achterdeuren alleen beeldmerk + telefoonnummer.

### 3.5 Vlaggetje en vlaggenlijn

Het vlaggetje van de piek is het tweede merkteken: opsommingsteken, badge-icoon bij "Met jouw logo", favicon-detail,
patroon op rokken en tassen. De vlaggenlijn (`svg/vlaggenlijn.svg`, Klaproos-Zon-Polder-Zon) is de sectiescheider
op feestelijke momenten: home, actie, bestelbevestiging. **Niet** in Zakelijk, offerte, checkout of foutmeldingen.

## 4. Kleur

Elke kleur heeft één taak. Klaproos is knop en dak. Fouten hebben een eigen Bordeaux en zijn nooit een gevuld vlak.
Actie is Zon met Inkt. Zo lijkt een foutmelding nooit op een knop en een actie nooit op een fout.

| Naam | Hex | Rol |
|---|---|---|
| Klaproos | `#BE3A1D` | Merkrood. Dak in het logo, primaire knop (In mijn winkelwagen), merktent (Google Shopping-standaardbeeld). Als tekst alleen voor korte nadruk; gewone links zijn Inkt. |
| Klaproos donker | `#9A2F17` | Hover/ingedrukt van de primaire knop; rode tekst op Duin/Linnen als nadruk nodig is. |
| Zon | `#FFC23A` | Accent: dak in het logo op donker, vlaggetje, Actie-badge (met Inkt-tekst), USP-vinkjes, focusring op donker. Nooit tekst of rand op lichte vlakken. |
| Polder | `#154F3E` | Donkere vlakken (utility-balk, footer), secundaire knop, Op voorraad / Toegevoegd (met icoon), Zakelijk. |
| Inkt | `#1D2420` | Tekst, koppen, outline-knoppen, links (onderstreept), focusring op licht. |
| Zand | `#FBF6EC` | Paginaachtergrond (warmer dan wit, zodat witte kaarten loskomen). |
| Duin | `#F2E8D5` | Warme vlakken: heroband, chips, geneste kaarten. |
| Linnen | `#ECEEE8` | Rustig koel vlak voor Zakelijk, offerte, staffels, specificatietabellen. |
| Studio | `#EFEDE8` | Achtergrond van elke productrender en van het beeldvlak in productkaarten (naadloos). |
| Wit | `#FFFFFF` | Productkaarten, invoervelden, drawers. |
| Kiezel | `#5D625C` | Secundaire tekst (specs, btw-regel, doorgestreepte van-prijs) en randen van invoervelden (>= 3:1). |
| Lijn | `#E4D6BE` | Decoratieve scheidingslijnen (geen informatiedragend element). |
| Bordeaux | `#8C1D2B` | Fouten: tekst, icoon en linkerrand van foutmeldingen, veldfouten. Nooit als gevuld knopvlak. |
| Foutroze | `#FBEAEA` | Achtergrond van foutmeldingen. |
| Oker | `#865800` | Voorraadstatus "Leverbaar over 2-3 weken" (tekst), naast een Zon-stip. |
| Okerlicht | `#FFF4DA` | Achtergrond van let-op-meldingen (levertijd, drukproef nodig). |
| Mos | `#E4EEE8` | Achtergrond van succesmeldingen (Polder-tekst). |

**Wijzigingen t.o.v. v1:** Klaproos is donkerder geworden (#C93C1C → #BE3A1D), zodat hij ook op Duin, Linnen en Studio
AA haalt (4,53–4,71:1 in plaats van 4,17:1). Framboos (sale) is geschrapt: actie is nu Zon + Inkt, zodat er geen derde
rood meer is. Fouten kregen Bordeaux + Foutroze. Nieuw: Linnen (zakelijk), Studio (productbeeld), Oker + Okerlicht
(levertijd), Mos (succes).

### 4.1 Regels

- **Knoppen:** primair = Klaproos met Wit (hover Klaproos donker). Secundair = Polder met Zand. Omlijnd = Inkt-rand.
  In Zakelijk is primair Polder (schema 4).
- **Tekst:** Inkt. Secundair Kiezel. Links zijn Inkt en onderstreept (1,5 px, offset 3 px); hover Klaproos donker.
- **Prijs:** Inkt, Figtree 700, tabular. Van-prijs Kiezel doorgestreept. Actieprijs blijft Inkt; de Zon-badge
  "Actie −12%" draagt de actie.
- **Voorraad:** Op voorraad = Polder + groene stip. Leverbaar over x weken = Oker + Zon-stip met Oker-rand. Uitverkocht =
  Kiezel + open cirkel. Altijd tekst, nooit alleen een kleur.
- **Meldingen:** getint vlak + linkerrand 5 px + icoon + vetgedrukte kop. Fout = Foutroze/Bordeaux, let op =
  Okerlicht/Oker, succes = Mos/Polder.
- **Focus:** 3 px ring, 2 px offset. Inkt op licht, Zon op Polder/Inkt.
- **Nooit:** Zon als tekst of rand op lichte vlakken (1,5:1), Klaproos op Polder of Inkt als tekst, Kiezel op donker.

### 4.2 Shopify-kleurschema's

Zes schema's in `tokens.json` → `shopify_color_schemes`: 1 pagina (Zand), 2 kaart (Wit), 3 Duin, 4 Zakelijk (Linnen,
Polder-knop), 5 Polder (Zon-knop), 6 Inkt (Zon-knop). Elk schema haalt AA op tekst, knoplabel en knop-tegen-vlak.

### 4.3 WCAG 2.1-contrast van elk gebruikt paar

Berekend met de WCAG-formule voor relatieve luminantie (`tools/contrast.py`, `tools/tokens.py`). Tekst moet 4,5:1 halen,
UI-delen (randen, knopvlakken, focusringen, iconen) 3:1. **50 paren, 0 onder de eis.**

| Voorgrond | Achtergrond | Gebruik | Ratio | Eis | Resultaat |
|---|---|---|---:|---:|---|
| inkt `#1D2420` | zand `#FBF6EC` | Lopende tekst op pagina | 14.71:1 | 4.5:1 | AAA |
| inkt `#1D2420` | duin `#F2E8D5` | Tekst op heroband/chips | 13.04:1 | 4.5:1 | AAA |
| inkt `#1D2420` | wit `#FFFFFF` | Tekst op kaarten/velden | 15.84:1 | 4.5:1 | AAA |
| inkt `#1D2420` | linnen `#ECEEE8` | Zakelijk-blokken | 13.55:1 | 4.5:1 | AAA |
| inkt `#1D2420` | studio `#EFEDE8` | Tekst op beeldvlak (badges) | 13.54:1 | 4.5:1 | AAA |
| inkt `#1D2420` | zon `#FFC23A` | Actie-badge | 9.83:1 | 4.5:1 | AAA |
| inkt `#1D2420` | foutroze `#FBEAEA` | Uitleg in foutmelding | 13.62:1 | 4.5:1 | AAA |
| inkt `#1D2420` | okerlicht `#FFF4DA` | Uitleg in let-op-melding | 14.49:1 | 4.5:1 | AAA |
| inkt `#1D2420` | mos `#E4EEE8` | Uitleg in succesmelding | 13.35:1 | 4.5:1 | AAA |
| kiezel `#5D625C` | zand `#FBF6EC` | Specs, btw-regel | 5.79:1 | 4.5:1 | AA |
| kiezel `#5D625C` | duin `#F2E8D5` | Specs op Duin | 5.13:1 | 4.5:1 | AA |
| kiezel `#5D625C` | wit `#FFFFFF` | Specs op kaart, van-prijs | 6.24:1 | 4.5:1 | AA |
| kiezel `#5D625C` | linnen `#ECEEE8` | Specs in Zakelijk | 5.33:1 | 4.5:1 | AA |
| polder `#154F3E` | zand `#FBF6EC` | Op voorraad, links in Zakelijk | 8.78:1 | 4.5:1 | AAA |
| polder `#154F3E` | wit `#FFFFFF` | Op voorraad op kaart | 9.46:1 | 4.5:1 | AAA |
| polder `#154F3E` | duin `#F2E8D5` | Op voorraad op Duin | 7.78:1 | 4.5:1 | AAA |
| polder `#154F3E` | linnen `#ECEEE8` | Zakelijk-koppen | 8.09:1 | 4.5:1 | AAA |
| polder `#154F3E` | mos `#E4EEE8` | Succesmelding | 7.97:1 | 4.5:1 | AAA |
| klaproos `#BE3A1D` | zand `#FBF6EC` | Korte nadruk | 5.11:1 | 4.5:1 | AA |
| klaproos `#BE3A1D` | wit `#FFFFFF` | Korte nadruk op kaart | 5.51:1 | 4.5:1 | AA |
| klaproos `#BE3A1D` | duin `#F2E8D5` | Korte nadruk op Duin | 4.53:1 | 4.5:1 | AA |
| klaproos `#BE3A1D` | linnen `#ECEEE8` | Korte nadruk op Linnen | 4.71:1 | 4.5:1 | AA |
| klaproos `#BE3A1D` | studio `#EFEDE8` | Korte nadruk op beeldvlak | 4.71:1 | 4.5:1 | AA |
| klaproos donker `#9A2F17` | zand `#FBF6EC` | Hover-tekst | 6.98:1 | 4.5:1 | AA |
| klaproos donker `#9A2F17` | duin `#F2E8D5` | Hover-tekst op Duin | 6.19:1 | 4.5:1 | AA |
| bordeaux `#8C1D2B` | foutroze `#FBEAEA` | Foutmelding (kop) | 7.76:1 | 4.5:1 | AAA |
| bordeaux `#8C1D2B` | wit `#FFFFFF` | Veldfout onder invoerveld | 9.03:1 | 4.5:1 | AAA |
| bordeaux `#8C1D2B` | zand `#FBF6EC` | Veldfout op pagina | 8.38:1 | 4.5:1 | AAA |
| oker `#865800` | zand `#FBF6EC` | Leverbaar over 2-3 weken | 5.72:1 | 4.5:1 | AA |
| oker `#865800` | wit `#FFFFFF` | Leverbaar over 2-3 weken (kaart) | 6.16:1 | 4.5:1 | AA |
| oker `#865800` | okerlicht `#FFF4DA` | Let-op-melding (kop) | 5.63:1 | 4.5:1 | AA |
| oker `#865800` | duin `#F2E8D5` | Levertijd op Duin | 5.07:1 | 4.5:1 | AA |
| wit `#FFFFFF` | klaproos `#BE3A1D` | Primaire knop | 5.51:1 | 4.5:1 | AA |
| wit `#FFFFFF` | klaproos donker `#9A2F17` | Primaire knop hover | 7.52:1 | 4.5:1 | AAA |
| zand `#FBF6EC` | klaproos `#BE3A1D` | Logo/merktekst op Klaproos | 5.11:1 | 4.5:1 | AA |
| zand `#FBF6EC` | polder `#154F3E` | Secundaire knop, footer, utility-balk | 8.78:1 | 4.5:1 | AAA |
| wit `#FFFFFF` | polder `#154F3E` | Secundaire knop (wit) | 9.46:1 | 4.5:1 | AAA |
| zand `#FBF6EC` | inkt `#1D2420` | Met jouw logo-badge, donkere banden | 14.71:1 | 4.5:1 | AAA |
| zon `#FFC23A` | inkt `#1D2420` | Accenttekst op Inkt | 9.83:1 | 4.5:1 | AAA |
| zon `#FFC23A` | polder `#154F3E` | Accenttekst/iconen op Polder | 5.87:1 | 4.5:1 | AA |
| kiezel `#5D625C` | wit `#FFFFFF` | Rand invoerveld (UI-deel) | 6.24:1 | 3.0:1 | voldoet (UI) |
| kiezel `#5D625C` | zand `#FBF6EC` | Rand invoerveld op pagina (UI-deel) | 5.79:1 | 3.0:1 | voldoet (UI) |
| klaproos `#BE3A1D` | zand `#FBF6EC` | Knopvlak tegen pagina (UI-deel) | 5.11:1 | 3.0:1 | voldoet (UI) |
| klaproos `#BE3A1D` | duin `#F2E8D5` | Knopvlak tegen Duin (UI-deel) | 4.53:1 | 3.0:1 | voldoet (UI) |
| klaproos `#BE3A1D` | wit `#FFFFFF` | Knopvlak tegen kaart (UI-deel) | 5.51:1 | 3.0:1 | voldoet (UI) |
| polder `#154F3E` | zand `#FBF6EC` | Secundaire knop tegen pagina (UI-deel) | 8.78:1 | 3.0:1 | voldoet (UI) |
| inkt `#1D2420` | zand `#FBF6EC` | Focusring op licht (UI-deel) | 14.71:1 | 3.0:1 | voldoet (UI) |
| zon `#FFC23A` | polder `#154F3E` | Focusring op Polder (UI-deel) | 5.87:1 | 3.0:1 | voldoet (UI) |
| zon `#FFC23A` | inkt `#1D2420` | Focusring op Inkt (UI-deel) | 9.83:1 | 3.0:1 | voldoet (UI) |
| bordeaux `#8C1D2B` | foutroze `#FBEAEA` | Linkerrand + icoon foutmelding (UI-deel) | 7.76:1 | 3.0:1 | voldoet (UI) |

**Niet toegestaan** (staat erbij zodat niemand het probeert):

| Voorgrond | Achtergrond | Wat | Ratio | |
|---|---|---|---:|---|
| zon | zand | Zon als tekst/rand op licht | 1.50:1 | niet gebruiken |
| zon | wit | Zon als tekst/rand op wit | 1.61:1 | niet gebruiken |
| klaproos | inkt | Klaproos-tekst op Inkt | 2.88:1 | niet gebruiken |
| klaproos | polder | Klaproos op Polder | 1.72:1 | niet gebruiken |
| kiezel | inkt | Kiezel op donker | 2.54:1 | niet gebruiken |

## 5. Typografie

| Rol | Font | Shopify `font_picker`-handle | Fallback |
|---|---|---|---|
| Koppen (display, H1, H2) | Archivo ExtraBold | `archivo_n8` | `archivo_n7`, dan `"Helvetica Neue", Arial, sans-serif` |
| Kleine koppen, kaarttitels (H3, H4) | Archivo Bold | `archivo_n7` | idem |
| Tekst | Figtree Regular | `figtree_n4` | `"Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| Labels, navigatie | Figtree SemiBold | `figtree_n6` | idem |
| Knoppen, prijzen | Figtree Bold | `figtree_n7` | idem |

**Waarom Archivo in plaats van Bricolage (v1):** Bricolage Grotesque is een modieus startup-font met eigenwijze
inktvallen; samen met cartoons las dat als een vrolijk consumentenwinkeltje. Archivo is een stevige grotesk met
vierkant-ronde vormen (net als het logo) en heel goede cijfers. Dat geeft de zakelijke koper vertrouwen bij een tent
van € 679 of 40 bedrukte hoezen. Figtree houdt de lopende tekst vriendelijk.

**Bewijs dat de handles in de Shopify-fontbibliotheek zitten** (shopify.dev is geblokkeerd en WebSearch had geen budget
meer; daarom bewijs uit echte theme-code via GitHub-code search, 17-10-2026):
- Archivo n7 wordt geserveerd door Shopify's font-CDN: `/cdn/fonts/archivo/archivo_n7.6f363ab30b12ea00d5e6243ed0e977a11393a3ad.woff2`
  in de `font_face`-uitvoer van een myshopify-winkel —
  https://github.com/wawan507821/wawan507821.github.io/blob/3680d31261d9436889f7613771caef53a0b61f07/0.txt
- Archivo n6 op hetzelfde CDN-pad — https://github.com/IrvingSamuel/GigaGeek/blob/63fb4be52a25c50569d121ae49a5ffa392502ccc/head.php
- `"type_header_font": "archivo_n8"` in een theme-`settings_data.json` —
  https://github.com/toilahuongg/theme-wwc/blob/a09031b4a63d5b8bff4b264085202bf392b64900/config/settings_data.json
  (`archivo_n7` komt in 103 `settings_data.json`-bestanden voor).
- Figtree n4/n5/n6/n7 op het Shopify-font-CDN (uit de v1-ronde, niet opnieuw gecontroleerd):
  https://github.com/duckduckgo/tracker-radar/blob/197a396da8b8cdf2df1ded141cb58f2507e446d5/domains/US/shopifycdn.com.json en
  https://github.com/mrshahbazdev/shopify-section-factory-clone/blob/f2b6217daa4961e435b959c3d5ec3bc5935c4982/app/sections/featured-collection-9.liquid
- **Niet bevestigd:** dat `archivo_n8` als CDN-bestand bestaat (alleen als instelwaarde gezien). Valt het weg, dan
  gebruikt het theme `archivo_n7` (bevestigd) met `font_modify: weight: '800'` als poging, anders 700.

**Schaal** (desktop/mobiel, px): Display 64/40 · H1 48/34 · H2 36/28 (alle 800, regelhoogte 1,0–1,1, spatiëring
−0,02 tot −0,01 em) · H3 22/20 en H4 18/17 (700) · body-lg 19/17 · body 17/16 (regelhoogte 1,55) · small 14 · label 15
(600) · eyebrow 12,5 (700, kapitalen, +0,08 em) · prijs 20 (700) · knop 16 (700).

**Cijfers:** `font-variant-numeric: tabular-nums` op prijzen, maten, aantallen, staffels, ordernummers en levertijden.
Notatie: `€ 1.145,00` (spatie na €, punt voor duizendtallen, komma voor centen), `3 × 3 m` (echt maalteken, spaties),
`Ø 80 cm`, `320 g/m²`, `2–3 weken` (en-dash). Btw altijd kleine letters: "incl. btw" / "excl. btw".

## 6. Klapklaar Zakelijk

Zelfde merk, andere toon, voor horeca, eventbureaus, verhuurbedrijven, scholen en verenigingen.

- **Kleur:** Linnen-vlak (schema 4), Polder-knoppen, Inkt-tekst. Geen Klaproos-vlakken, geen vlaggenlijn, geen knipoog.
- **Logo:** `svg/logo-zakelijk.svg`.
- **Prijzen:** standaard excl. btw met schakelaar "incl. / excl. btw"; staffeltabel met tabular cijfers.
- **Waar:** `page.zakelijk`, `page.offerte`, de drukproef- en uploadflow, de B2B-catalogus, offerte-PDF, facturen.
- **Volume-nudge op de PDP** (consumentenpagina): "**Zakelijk?** Vanaf 10 stuks maken we een offerte op maat, op
  factuur." met link "Offerte aanvragen". Drempel 10 en "op factuur" zijn claims.

## 7. Toon van stem

Schrijf alsof je de buurman helpt een tent op te zetten. **Je/jij** overal; alleen algemene voorwaarden, facturen en
offertes zijn zakelijk en volledig (nog steeds je/jij, maar zonder knipoog).

1. **Antwoord eerst** (maat, prijs, levertijd), uitleg daarna.
2. **Concreet, nooit vaag:** "3 × 3 m, Ø 80 cm, 40 mm staal", nooit "ruim assortiment".
3. **Hooguit één knipoog per scherm.** De knipoog zit in de werkwoorden (klap, klaar, staat), niet in uitroeptekens.
4. **Niets verzinnen:** geen sterren, geen "nr. 1", geen "duizenden tevreden klanten", geen claims die we niet kunnen
   laten zien.
5. **Elke lever-, betaal- of serviceclaim** is een theme-instelling die de eigenaar invult en bevestigt
   (`docs/claims-to-confirm.md`). Hieronder gemarkeerd met **[claim]**.
6. **"Klap" nooit bij wind, storm, stevigheid of garantie.** Daar spreken specs: staal/aluminium, buisdikte, gewichten,
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

**Utility-balk (Polder)** — "Snel in huis in NL & BE" [claim] · "Zakelijk bestellen op factuur" [claim] · "Eigen logo?
Eerst een drukproef" · rechts: "Offerte aanvragen" · "Klantenservice" · "Zakelijk".

**Header** — zoekveld: "Zoek op product, maat of artikelnummer" · iconen: "Offerte", "Account", "Winkelwagen" ·
menu: Partytenten · Statafels · Rokken & hoezen · Met jouw logo · Accessoires · Meubilair · Verlichting · Actie ·
Zakelijk. Mobiel menu-knop: "Menu", sluiten: "Sluiten".

**Hero (home)** — "Uitklappen. Neerzetten. Feest." · "Easy-up tenten, statafels met rokken, verlichting en meubilair.
Voor je tuinfeest, je club of je evenement." · knoppen "Bekijk partytenten" / "Naar statafels" · onder de knoppen:
"Voor bedrijf, club of verhuur? Vraag een offerte op maat aan." · prijschip op het beeld: "Easy-up partytent 3 × 3 m ·
Premium · 320 g/m² — vanaf € 319" [prijs: voorbeeld].

**Collectiepagina** — titel = categorie ("Easy-up partytenten") · intro 1–2 zinnen met waarvoor en welke maten · teller
"24 producten" · filterknop "Filteren" · sorteren "Sorteer op: Aanbevolen / Prijs laag-hoog / Prijs hoog-laag / Nieuwste" ·
geen resultaten na filteren: "Geen tenten met deze combinatie. Haal een filter weg of bekijk alle partytenten." ·
filterchips "Wis alles".

**Productkaart** — titel · spec-regel ("40 mm staal · 320 g/m² dakdoek", "Voor Ø 70–85 cm · stretch") · swatches
"+3" · prijs · voorraadregel · knop "In mijn winkelwagen" (bij varianten: "Kies je maat") · badges: "Actie −12%"
(Zon), "Nieuw" (Polder), "Met jouw logo" (Inkt + vlaggetje), "Staffelprijs" (Linnen).

**Productpagina (PDP)** — eyebrow = categorie · titel · spec-regel · prijs met "incl. btw / excl. btw" ·
voorraad: "Op voorraad", "Leverbaar over 2–3 weken", "Tijdelijk uitverkocht" · levering: "Op voorraad · morgen in huis
bij bestelling vóór 14:00" [claim] · optielabels: "Maat", "Diameter", "Kleur: Klaproos", "Rok: Strik wit" ·
niet-leverbare optie: doorgestreept, schermlezer "niet leverbaar" · maatgids-link "Maatgids" + helper "Twijfel je over
de maat? De maatgids rekent het voor je uit." · aantal: "Aantal" met − en + ("Eén minder", "Eén meer") · knop
"In mijn winkelwagen · € 339,80" (live totaal) → bezig "Toevoegen…" → "Toegevoegd" (vinkje, 1,5 s) · uitverkocht:
"Uitverkocht" (uitgeschakeld) + "Mail me als hij terug is" (alleen met app) · zakelijk-nudge (§6) · tabbladen:
"Beschrijving", "Specificaties", "Levering & retour", "Opzetten & onderhoud" · veiligheid: "Staat stevig, ook als het
waait. Zet elke poot vast met haringen of een voetgewicht van 15 kg. Bij harde wind: dak eraf." · reviews: tonen
alleen als een review-app data levert, anders niets (geen lege sterren).

**Met jouw logo (bedrukking)** — kaart: "Statafelhoes met jouw logo · vanaf € 39,95 per stuk" [prijs: voorbeeld] ·
"Upload je logo, je krijgt eerst een drukproef ter akkoord. Vanaf 10 st. staffelprijs." · knop "Ontwerp je hoes" /
"Ontwerp je tent" · upload: "Logo uploaden (PDF, AI, EPS of SVG)" · hulptekst: "Geen vectorbestand? Stuur een PNG van
minimaal 2000 px breed, dan maken wij hem drukklaar." [claim] · melding: "Eerst je akkoord, dan drukken we. De levertijd
gaat in na je akkoord." · positie: "Voorkant", "Rondom", "Topcover".

**Toegevoegd (toast/drawer)** — "Klaar! Hij staat erin." · "Statafelrok stretch Ø 80 cm, zwart, ligt in je winkelwagen."
· knoppen "Naar winkelwagen" / "Verder winkelen" · upsell "Nog een statafel erbij?" of "Vergeet de haringen niet".

**Winkelwagen (drawer en pagina)** — titel "Je winkelwagen (2)" · regel: titel, variant, aantal, "Verwijderen" ·
drempel: "Nog € 23,10 tot gratis verzending" / "Je verzending is gratis" [claim, drempel instelbaar] · opmerking:
"Opmerking bij je bestelling (bv. leverdatum of locatie)" · subtotaal "Subtotaal (incl. btw)" · "Verzendkosten
berekenen we bij het afrekenen" · knop "Afrekenen" · zakelijk: "Liever een offerte voor deze winkelwagen?".

**Lege winkelwagen** — "Nog niks in je winkelwagen." · "Zonde van een goed feest. Begin bij de partytenten, of kijk
wat er in de actie zit." · knop "Bekijk partytenten".

**Zoeken** — suggesties-kop "Producten", "Categorieën", "Pagina's" · "Alle resultaten voor ‘3x3’" · geen resultaten:
"Niks gevonden voor ‘partytnt’. Check de spelling, of zoek op maat (3x3) of product (statafel)."

**Fouten en validatie** — algemeen: "Oeps, dat ging mis. We konden je winkelwagen niet bijwerken. Probeer het nog een
keer, of bel of app ons: dan regelen we het samen." · veld leeg: "Vul je e-mailadres in." · postcode: "Vul je hele
postcode in, dan weten we waar de tent heen moet." · e-mail ongeldig: "Dit e-mailadres klopt niet helemaal. Check de
@ en de punt." · voorraad te laag: "Er zijn er nog 3 op voorraad. We hebben je aantal aangepast." · bestand te groot:
"Dit bestand is groter dan 20 MB. Stuur een kleinere versie of mail hem naar ons." [limiet: claim/instelling].

**Offerte en contact** — "Offerte op maat aanvragen" · velden "Bedrijfsnaam", "Contactpersoon", "E-mailadres",
"Telefoon", "Aantal", "Gewenste leverdatum", "Logo uploaden", "Toelichting" · knop "Offerte aanvragen" · succes:
"Klaar! Je offerteaanvraag is binnen. We sturen je binnen één werkdag een offerte." [claim] · contact: "Stel je vraag",
succes "Bedankt, we hebben je bericht. We reageren binnen één werkdag." [claim].

**Nieuwsbrief** — "Eerst weten wanneer er actie is?" · veld "Je e-mailadres" · knop "Aanmelden" · succes
"Aangemeld. Je hoort van ons als er iets te vieren valt." · geen beloftes over korting tenzij die bestaat.

**Account** — "Inloggen", "Je bestellingen", "Bestelling #1042", "Adressen", "Uitloggen" · zakelijk: "Je offertes",
"Nabestellen".

**404** — "Deze pagina is ingeklapt." · "De link klopt niet (meer). Zoek wat je nodig hebt, of begin bij de
partytenten." · knoppen "Naar de homepage" / "Bekijk partytenten". (De enige plek waar "klap" in een
negatieve betekenis mag, want het gaat over een pagina, niet over een tent.)

**Wachtwoordpagina** — "We zetten de laatste tenten neer." · "Laat je e-mailadres achter, dan hoor je het als we open
zijn."

**Cadeaubon** — "Je cadeaubon van € 50" · "Gebruik de code bij het afrekenen." · "Code kopiëren" / "Gekopieerd".

**Footer** — kolommen "Winkel", "Zakelijk", "Hulp", "Over Klapklaar" · "Bel of app ons" [claim: nummer, tijden] ·
juridisch "Algemene voorwaarden", "Privacy", "Cookies", "Retourneren", KvK- en btw-nummer [claim].

**Alt-teksten** — "[product], [kleur], [standpunt]": "Easy-up partytent 3 × 3 m Klaproos, schuin vooraanzicht". Bij
een voorbeeldopdruk: "… met voorbeeldopdruk Klapklaar op de luifel".

## 8. Productbeeld (render-regie)

Er zijn geen foto's. Elk productbeeld is een fotorealistische 3D-render uit `renders/` (three.js, headless Chromium).
Cartoons en vlakke illustraties komen niet in de winkel; die lazen in v1 als goedkoop.

- **Achtergrond:** naadloos **Studio #EFEDE8**, exact dezelfde kleur als het beeldvlak van de productkaart (de renderer
  zet buiten de schaduw exact deze kleur). Nooit wit-op-wit, geen sfeerfoto als hoofdbeeld, geen tekst of badges in
  het beeld zelf (badges zijn HTML).
- **Formaat:** vierkant master 2000 × 2000 px, WebP q88 (JPEG-fallback). Hero-banners 1800 × 1100.
- **Standpunten** (vaste lens 22°, product vult 80%):
  1. **Hoofdbeeld:** `hero`, azimut 34°, elevatie 17° (3/4 van rechtsvoor);
  2. **Vooraanzicht:** `front`, 0°/6°;
  3. **Zij/achter:** `side` 90°/6° of `back`;
  4. **Detail:** `detail`, het onderdeel waaraan je kwaliteit afleest (hoekstuk + schaar, rokzoom, strik, bladrand);
  5. **In gebruik:** ingeklapt, met zijwanden, met statafels eronder (`items`-scène);
  6. optioneel `top` of `low` (binnenkant dak).
- **Licht:** softbox linksboven met zachte, convergerende schaduw; koepellicht voor occlusie; zachte contactschaduw
  onder voeten en zomen; belichting per materiaal (wit doek houdt tekening, zwart lycra houdt glans).
- **Varianten:** exact dezelfde camera, positie en licht, zodat een swatch-klik het beeld wisselt zonder te
  verspringen.
- **Eerlijk:** de render toont alleen wat in de doos zit. Een opdruk staat alleen op producten die met opdruk geleverd
  worden; bij een voorbeeldopdruk staat "voorbeeld" in de alt-tekst en bij het product.
- **Google Shopping / feed:** het standaardbeeld van elke tent die in Klaproos leverbaar is, is de **Klaproos-variant
  zonder opdruk** op Studio-grijs (`img/tent-3x3-klaproos-hero.webp`). Die valt op tussen witte tenten op wit en is toch
  het echte product. Zet de Klaproos-variant als eerste variant. De versie mét Klapklaar op de luifel
  (`img/tent-3x3-klaproos-logo-hero.webp`) is alleen voor de bedrukte-tent-pagina (als voorbeeld), banners en social.
  Controleer de actuele Google Merchant Center-beeldeisen (geen overlays, geen watermerk, lichte achtergrond) voor
  livegang: die konden in deze sessie niet opgezocht worden.
- **Bedrukking in beeld:** `print`/`valancePrint` met de echte padbestanden (`tools/print-mark.json`,
  `tools/print-wordmark.json`). De renderer in deze repo kent tot nu toe alleen tekst op de luifel; de uitbreiding voor
  SVG-paden (luifel en statafelrok) staat klaar als `tools/renders-svgprint.patch` (zie §12).

## 9. Iconen

- 24 px raster, lijn 2 px (1,75 px op 20 px), platte uiteinden, ronde hoeken, hoekradius 2 px, `currentColor`.
- Alleen het vlaggetje mag Zon zijn. Geen gevulde of meerkleurige iconen, geen emoji.
- Set in de brand sheet (inline `<symbol>`'s): levering, factuur, app ons, maatgids, logo uploaden, drukproef, haring,
  wind, tent, statafel, zakelijk, winkelwagen, zoeken, account, plus/min, check, info, let op, klok.
- Iconen staan altijd naast tekst (behalve header-iconen, die een zichtbaar label of `aria-label` hebben).

## 10. Vorm, ruimte en beweging (zie `tokens.json`)

- **Radii:** badge 4, knop en invoerveld 8, kaart en beeld 12, paneel 16, chip rond. Stevig, niet bubbelig.
- **Ruimte:** 4-px-raster (4–128). Paginamarge 16/24/40, container max. 1360, sectie-afstand 48 mobiel / 96 desktop,
  aanraakdoel minimaal 44 px.
- **Schaduw:** alleen bij hover op kaarten, sticky header, drawer en toast. Geen schaduw op knoppen.
- **Beweging:** "uitklappen": drawers en accordeons 220 ms `cubic-bezier(.16,1,.3,1)`, geen bounce; knop → vinkje
  140 ms; toast 220 ms. Met `prefers-reduced-motion` alleen opacity ≤ 140 ms.

## 11. Naam, merkrecht en onderscheid

**Naamtoets: NIET GEDAAN.** In deze sessie was het WebSearch-budget op ("limit: 200 WebSearch calls per turn, shared
by every agent") en DNS vanuit de sandbox werkt niet. Er is dus geen enkel bewijs dat "Klapklaar" vrij of bezet is.
Vóór gebruik:

- KvK Handelsregister: handelsnaam "Klapklaar" en varianten.
- BOIP en EUIPO (TMview): woordmerk KLAPKLAAR in klassen 11 (verlichting), 20 (meubilair, statafels), 22 (tenten,
  zeilen), 24 (textiel: rokken, hoezen) en 35 (detailhandel).
- SIDN (klapklaar.nl), DNS Belgium (klapklaar.be), plus .com en .eu.
- Web, Instagram, bol.com: "klapklaar" alleen, en met "partytent" of "statafel".

**Wat deponeren** (inschatting, geen juridisch advies; laat een merkenadviseur meekijken):
1. Het **beeldmerk** (aa onder de tent met vlaggetje) als beeldmerk. Dit is waarschijnlijk het sterkste beschermbare
   deel.
2. Het **complete logo** als gecombineerd woord-/beeldmerk.
3. Het **woordmerk** alleen: voor tenten (klasse 22) en klaptafels (20) kan "klapklaar" als beschrijvend gezien worden
   ("klaar door uitklappen"), met kans op weigering of een zwakke inschrijving.

**Typo-domeinen** om mee te registreren: klapklar.nl, klap-klaar.nl, klapklaar.be (beschikbaarheid niet gecontroleerd).

**Reservenamen** (ook niet getoetst): **Staklaar** (sta(tafel) + klaar, "staat klaar"), **Tentklaar** (direct, minder
onderscheidend).

**Onderscheid van Outmate en Statafelshop:** naam, letters, beeldmerk en kleuren zijn eigen werk. De huisstijlkleuren
en logo's van Outmate en Statafelshop staan niet in `reference/dossier.md` en konden in deze sessie niet opgezocht
worden. Een visuele vergelijking met hun echte huisstijl is dus **nog niet gedaan**; doe die zodra zoeken weer kan.

## 12. Voor de theme- en catalogusbouwers

- `tokens.json` → CSS custom properties en `settings_schema.json`-defaults (kleurschema's, fonts).
- Header-logo: inline `svg/logo-mono.svg` (Inkt), footer `logo-inverse.svg`. Favicon-instelling: `favicon-192.png`.
  Optioneel `<link rel="icon" type="image/svg+xml">` naar `favicon.svg` en wissel naar `svg/favicon-cart.svg` bij een
  gevulde winkelwagen.
- Iconen: neem de `<symbol>`'s uit `brand-sheet.html` over als snippet `icon-sprite.liquid`.
- Productbeelden: renders volgens §8. Drie renders in `img/` (luifel met woordmerk, statafelrok met beeldmerk, de
  hero-scène) gebruiken een renderer-uitbreiding die nog niet in `renders/` zit: opdruk vanaf SVG-pad
  (`TX.svgPrintTexture`, `valancePrint: {d, vb, color, sides, pad}`, `statafelCover` met
  `print: {d, vb, color, width, y, azimuth}`). Hij staat als `tools/renders-svgprint.patch` klaar
  (`git apply brand/tools/renders-svgprint.patch`, 1 regel gewijzigd, de rest toegevoegd; past schoon op `renders/` van
  17-10-2026 17:30). Specs: `valancePrint` met `tools/print-wordmark.json` (kleur `#FBF6EC`, `pad` 0.05), `print` met
  `tools/print-mark.json` (breedte 0.22, y 0.33, azimut 0).
- Vlaggenlijn als sectiescheider: `svg/vlaggenlijn.svg` als `background-repeat: repeat-x`, 160 × 44.

## 13. Herbouwen

```bash
cd brand/tools
VENDOR=<pad naar vendor met gfonts/ofl/figtree> python3 build.py ..   # alle logo-/merk-SVG's + print-json
python3 tokens.py .. > /dev/null                                       # tokens.json + contrast-data
node rasterize.mjs                                                     # favicon-PNG's (Playwright)
python3 build_sheet.py && node shot.mjs file://$PWD/../brand-sheet.html ../brand-sheet.png 1440 900 1
python3 build_md.py                                                    # dit document (tabellen uit tokens)
```

Fonts in `fonts/` (Archivo, Figtree) vallen onder de SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
