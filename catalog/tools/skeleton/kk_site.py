# Collections, menus, pages, blog, filters.
import re
from urllib.parse import quote_plus

ONDERDELEN_TYPES = ['Zijwand', 'Zijwandenset', 'Dakzeil', 'Verzwaring', 'Verankering', 'Tas & wielset', 'Regengoot & koppeling', 'Frame-onderdeel']
# parts and accessories of the stretch-, ster- and opblaasbare tenten: in Accessoires and Alle onderdelen too (merchandising review
# 2026-10-18: partytent-onderdelen held only easy-up and buizenframe parts, so the 'Past op' values Stretchtent, Stertent and
# Opblaasbare tent were nearly empty there)
SYSTEEM_ONDERDELEN_TYPES = ['Stretchtent onderdeel', 'Stretchtent zijwand', 'Stertent zijwand', 'Opblaasbare tent accessoire']
TEXTIEL_TYPES = ['Statafelrok', 'Topcover', 'Statafelhoes met strik', 'Strik', 'Statafelkleed', 'Tafelhoes', 'Beschermplaat']
TENT_TYPES = ['Easy-up partytent', 'Partytent', 'Opslagtent', 'Stretchtent', 'Stertent', 'Opblaasbare tent']
MEUBEL_TYPES = ['Barkruk', 'Kruk', 'Stoel', 'Bank', 'Klaptafel', 'Terrastafel', 'Biertafelset', 'Bierbank', 'Transportkar', 'Meubelonderdeel', 'Stoelhoes']
# catalog round 2026-10-18: inrichting next to the afzetpalen, marktkraam and lopers (Outmate menu Inrichting: koelkasten en vriezers, garderobe, vloeren)
INRICHTING_TYPES = ['Afzetpaal', 'Marktkraam', 'Loper', 'Koeling', 'Tentvloer', 'Kapstok']
LICHT_TYPES = ['Prikkabel', 'LED-lamp', 'Lichtslang', 'Kerstverlichting', 'Tentverlichting', 'Verlichting onderdeel']

def r(col, rel, cond):
    return {'column': col, 'relation': rel, 'condition': cond}

def types(ts):
    return [r('type', 'equals', t) for t in ts]

C = []
# Collection image (tile, list-collections, mega menu, collection banner): the first of these product renders that is a real
# render (catalog/build.py skips draft placeholders), else the hero of the first member product with a real render.
COLL_IMG = {
    'partytenten': ['easy-up-partytent-professional-3x3-rood-hero.webp'],
    'easy-up-partytenten': ['easy-up-partytent-professional-3x6-rood-hero.webp', 'easy-up-partytent-professional-3x3-rood-hero.webp'],
    'easy-up-premium': ['easy-up-partytent-premium-3x3-rood-hero.webp', 'easy-up-partytent-premium-3x6-rood-hero.webp'],
    'easy-up-professional': ['easy-up-partytent-professional-4x4-rood-hero.webp', 'easy-up-partytent-professional-3x3-rood-hero.webp'],
    'partytenten-buizenframe': ['partytent-pvc-550-premium-hero.webp', 'partytent-pe-basis-buizenframe-hero.webp'],
    'opslagtenten': ['opslagtent-pvc-hero.webp', 'carport-opslagtent-vast-frame-hero.webp'],
    'stretchtenten': ['stretchtent-compleet-zandkleur-hero.webp', 'stretchdoek-op-maat-hero.webp'],
    'stertenten': ['stertent-enkele-mast-wit-hero.webp', 'stertent-dubbele-mast-wit-hero.webp'],
    'opblaasbare-tenten': ['opblaasbare-promotietent-rood-hero.webp', 'opblaasbare-zeshoektent-wit-hero.webp'],
    'ster-en-opblaasbare-tenten': ['stertent-enkele-mast-wit-hero.webp', 'opblaasbare-promotietent-rood-hero.webp'],
    'overkappingen-en-schaduwdoeken': ['tuinpaviljoen-aluminium-hero.webp', 'schaduwdoek-antraciet-hero.webp'],
    'bedrukte-partytenten': ['easy-up-partytent-professional-met-logo-op-de-luifel-rood-hero.webp', 'easy-up-partytent-professional-full-colour-bedrukt-hero.webp'],
    'accessoires': ['zijwandenset-easy-up-wit-hero.webp', 'voetgewicht-easy-up-15-kg-hero.webp'],
    'partytent-onderdelen': ['zijwandenset-easy-up-wit-hero.webp', 'voetgewicht-easy-up-15-kg-hero.webp'],
    'easy-up-onderdelen': ['zijwandenset-easy-up-wit-hero.webp', 'voetgewicht-easy-up-15-kg-hero.webp'],
    'buizenframe-onderdelen': ['zijwand-partytent-2-m-pvc-hero.webp', 'eindwand-en-tussenwand-partytent-hero.webp', 'koppelstukken-en-buizen-38-mm-hero.webp'],
    'onderdelen-stretch-ster-en-opblaasbare-tenten': ['zijwand-stretchtent-hero.webp', 'zijwanden-stertent-hero.webp', 'onderdelen-stretchtent-hero.webp',
                                                      'pomp-opblaasbare-tent-hero.webp'],
    'zijwanden': ['zijwandenset-easy-up-wit-hero.webp', 'zijwand-easy-up-met-raam-wit-hero.webp'],
    'gewichten-en-verankering': ['voetgewicht-easy-up-15-kg-hero.webp', 'haringen-en-bevestigingsmateriaal-partytent-hero.webp'],
    'tassen-en-wielsets': ['wieltas-easy-up-hero.webp', 'beschermhoes-easy-up-hero.webp'],
    'statafels': ['statafel-inklapbaar-professional-wit-hero.webp', 'statafel-inklapbaar-hdpe-80-wit-hero.webp'],
    'statafelrokken': ['statafelrok-stretch-zwart-hero.webp', 'statafelhoes-met-strik-wit-hero.webp'],
    'stretch-statafelrokken': ['statafelrok-stretch-zwart-hero.webp'],
    'statafelhoezen-met-strik': ['statafelhoes-met-strik-wit-hero.webp'],
    'statafelkleden': ['statafelkleed-rond-tot-de-grond-wit-hero.webp', 'statafelkleed-wit-hero.webp'],
    'bedrukte-statafelhoezen': ['statafelhoes-stretch-met-logo-zwart-hero.webp', 'beschermplaat-met-opdruk-hero.webp'],
    'actiepakketten': ['pakket-4-statafels-met-stretchrokken-zwart-hero.webp', 'compleet-pakket-easy-up-professional-rood-hero.webp'],
    'meubilair': ['barkruk-stapelbaar-metaal-zwart-hero.webp', 'klaptafel-hdpe-rechthoekig-hero.webp', 'biertafelset-hero.webp'],
    'verlichting': ['prikkabel-e27-zwart-hero.webp', 'prikkabel-op-maat-hero.webp'],
    'verwarming': ['elektrische-heater-partytent-hero.webp', 'terrasheater-gas-13-kw-hero.webp'],
    'evenement': ['marktkraam-2-m-rood-hero.webp', 'afzetpaal-met-trekband-hero.webp'],
    'zakelijk': ['compleet-pakket-easy-up-professional-rood-hero.webp', 'pakket-4-statafels-met-stretchrokken-zwart-hero.webp'],
    'barkrukken': ['barkruk-stapelbaar-metaal-zwart-hero.webp', 'barkruk-velours-stapelbaar-grijs-hero.webp'],
    'stoelen-en-banken': ['stapelstoel-cross-back-eiken-hero.webp', 'banquetstoel-gestoffeerd-zwart-hero.webp', 'stapelstoel-metaal-zwart-hero.webp'],
    'tafels': ['klaptafel-hdpe-rechthoekig-hero.webp', 'biertafelset-hero.webp', 'terrastafel-inklapbaar-zwart-hero.webp'],
    'transportkarren': ['transportkar-statafels-gevuld.webp', 'transportkar-statafels-hero.webp'],
    'terrastafels': ['terrastafel-inklapbaar-zwart-hero.webp', 'terrastafel-rond-inklapbaar-wit-hero.webp'],
    'koelkasten-en-vriezers': ['barkoelkast-glazen-deur-hero.webp', 'koelkast-rvs-horeca-hero.webp'],
    'prikkabels': ['prikkabel-e27-zwart-hero.webp', 'prikkabel-op-maat-hero.webp'],
    'lampen-en-lichtslangen': ['led-lichtslang-warm-wit-hero.webp', 'led-lichtslang-set-warm-wit-hero.webp', 'led-lamp-e27-hero.webp'],
    'topcovers-en-beschermplaten': ['beschermplaat-statafel-hero.webp', 'topcover-stretch-statafel-zwart-hero.webp'],
    'tafelhoezen': ['stretchhoes-klaptafel-zwart-hero.webp', 'stretchhoes-klaptafel-met-logo-hero.webp'],
    'statafel-onderdelen': ['onderdelen-statafel-hero.webp', 'transportkar-statafels-hero.webp', 'los-statafelblad-hero.webp'],
    'all': ['easy-up-partytent-professional-3x3-rood-hero.webp'],
}

# Collection images that are not a product image: rendered for the collection tile / banner only (image-jobs kind
# 'collection'); the file goes first in the collection's image_candidates.
COLL_RENDER = {
    'gewichten-en-verankering': {'file': 'collectie-gewichten-en-verankering.webp', 'alt': 'Voetgewichten op de poten van een easy-up partytent',
                                 'render': {'model': 'easyUpTent', 'params': {'w': 3, 'd': 3, 'color': 'rood', 'legs': 'professional', 'weights': {'count': 3}},
                                            'angle': 'detail', 'detail': {'target': [1.45, 0.45, 1.45], 'size': 1.6, 'azimuth': 34, 'elevation': 14, 'aperture': 0}}},
    'verlichting': {'file': 'collectie-verlichting.webp', 'alt': 'Prikkabel met brandende lampen',
                    'render': {'model': 'prikkabel', 'params': {'bulbs': 10, 'spacing': 0.5, 'sag': 0.25, 'on': True, 'cable': 'zwart'},
                               'angle': 'detail', 'detail': {'size': 1.2, 'aperture': 0}}},
}

def col(handle, title, parent, rules=None, disjunctive=False, products=None, sort='manual', brief='', kenmerken=None, ext=False, metafields_brief=None):
    d = {'handle': handle, 'title': title, 'parent': parent, 'sort_order': sort,
         'type': 'smart' if rules else 'manual', 'rules': rules, 'disjunctive': disjunctive if rules else None,
         'products': products, 'brief': brief, 'metafields': {'intro': None, 'seo_tekst': None, 'kenmerken': kenmerken},
         'contract_extension': ext,
         'image_candidates': ([COLL_RENDER[handle]['file']] if handle in COLL_RENDER else []) + COLL_IMG.get(handle, []),
         'image_render': COLL_RENDER.get(handle)}
    C.append(d)
    return d

def build_collections(bedrukte_tenten, bedrukte_hoezen, easy_up_onderdelen, buizenframe_onderdelen, systeem_onderdelen):
    col('partytenten', 'Partytenten', None, types(TENT_TYPES), True, sort='best-selling',
        brief='Overzicht van alle tenten: easy-up, buizenframe, stretch, ster en opblaasbaar; help kiezen op gebruik en maat.',
        kenmerken=['Easy-up 2 × 2 tot 5 × 5 m', 'Staal of aluminium', 'Zijwanden in dezelfde kleur', 'Met jouw logo'])
    col('easy-up-partytenten', 'Easy-up partytenten', 'partytenten', types(['Easy-up partytent']), sort='manual',
        brief='Vouwtenten in twee lijnen: Premium (staal 40 mm) en Professional (aluminium 50 mm); maten en kleuren, wat zit erin.',
        kenmerken=['In 2 minuten staand met 2 personen', 'Premium of Professional', '7 kleuren', 'Zijwanden en gewichten passend'])
    col('easy-up-premium', 'Easy-up Premium (staal)', 'easy-up-partytenten', [r('type', 'equals', 'Easy-up partytent'), r('title', 'contains', 'Premium')],
        brief='Staal 40 mm, 320 g/m² dak: voor tuin, club en markt een paar keer per jaar.')
    col('easy-up-professional', 'Easy-up Professional (aluminium)', 'easy-up-partytenten', [r('type', 'equals', 'Easy-up partytent'), r('title', 'contains', 'Professional')],
        brief='Aluminium 50 mm, polyester of heavy duty PVC: voor verhuur, horeca en wekelijks gebruik.')
    col('partytenten-buizenframe', 'Partytenten met buizenframe', 'partytenten', types(['Partytent']), ext=True,
        brief='Klassieke buizenframe-tenten van 3 × 3 tot 8 × 12 m in vijf doekkwaliteiten; verschil PE en PVC uitleggen.')
    col('opslagtenten', 'Opslagtenten', 'partytenten', types(['Opslagtent']), ext=True,
        brief='Tijdelijke opslag en carport: PVC 500, 550 of 620 en welke bij hoe lang gebruik past.')
    col('stretchtenten', 'Stretchtenten', 'partytenten', [r('type', 'starts_with', 'Stretchtent')],
        brief='Stretchtenten compleet, doeken (ook op maat), zijwanden, palen en onderdelen.')
    col('stertenten', 'Stertenten', 'partytenten', [r('type', 'starts_with', 'Stertent')], brief='Stertenten met één of twee masten plus zijwanden.')
    col('opblaasbare-tenten', 'Opblaasbare tenten', 'partytenten', [r('type', 'starts_with', 'Opblaasbare tent'), r('title', 'contains', 'opblaasbare tent')], True,
        brief='Opblaasbare promotie- en partytenten, in kleur of met full colour dak; pompen en wanden.')
    col('ster-en-opblaasbare-tenten', 'Ster- en opblaasbare tenten', 'partytenten', [r('type', 'starts_with', 'Stertent'), r('type', 'starts_with', 'Opblaasbare tent'),
                                                                                     r('title', 'contains', 'opblaasbare tent')], True,
        ext=True, brief='Blikvangers voor events: stertenten met één of twee masten en opblaasbare tenten, met hun wanden, luifels en pompen.',
        kenmerken=['Stertent Ø 8 tot 13 × 21 m', 'Opblaasbaar in 5–10 minuten', 'Effen of full colour', 'Wanden en luifels passend'])
    col('overkappingen-en-schaduwdoeken', 'Overkappingen en schaduwdoeken', 'partytenten', types(['Schaduwdoek', 'Overkapping']), True, ext=True,
        brief='Schaduwdoeken, verandazeil op maat, zijwanden voor overkappingen en een aluminium tuinpaviljoen.')
    col('bedrukte-partytenten', 'Bedrukte partytenten', 'partytenten', products=bedrukte_tenten,
        brief='Met jouw logo of in full colour: luifel, dak, zijwand, opblaasbaar; drukproef vooraf en levertijd na akkoord.',
        kenmerken=['Logo uploaden bij bestellen', 'Eerst een drukproef', 'Vanaf 1 stuk', 'Staffel vanaf 10'])
    # the marktkraam (€479–€729) is no accessory: it lives in 'evenement' with the afzetpalen and lopers
    col('accessoires', 'Accessoires', None, types(ONDERDELEN_TYPES + SYSTEEM_ONDERDELEN_TYPES + ['Verwarming', 'Tentverlichting', 'Afzetpaal', 'Loper']), True,
        brief='Alles om je tent compleet te maken en je evenement in te richten: wanden, verankering, tassen, verwarming, afzetpalen.')
    col('partytent-onderdelen', 'Partytent-onderdelen', 'accessoires', types(ONDERDELEN_TYPES + SYSTEEM_ONDERDELEN_TYPES), True,
        brief='Wanden, daken, verankering, tassen, goten en frame-onderdelen voor easy-up, buizenframe, stretch-, ster- en opblaasbare tenten; pasvorm per lijn, filter op systeem.')
    col('easy-up-onderdelen', 'Onderdelen en accessoires voor easy-up', 'partytent-onderdelen', products=easy_up_onderdelen, ext=True,
        brief='Alles wat op een easy-up past: wanden, daken, gewichten, tassen, goten, frame-onderdelen, licht en warmte; per maat en lijn (Premium 40 mm, Professional 50 mm).',
        kenmerken=['Past op Premium en Professional', 'Zelfde kleuren als de tenten', 'Per maat te kiezen'])
    col('buizenframe-onderdelen', 'Onderdelen voor buizenframe-tenten', 'partytent-onderdelen', products=buizenframe_onderdelen, ext=True,
        brief='Wanden van 2 m (PVC of PE, 200 of 220 cm), eind- en tussenwanden, dakzeilen, koppelstukken en buizen van 38 mm, stormbanden, opbergtassen en regengoten.',
        kenmerken=['Buizen en koppelstukken 38 mm', 'Wanden 200 of 220 cm hoog', 'PVC of PE'])
    col('onderdelen-stretch-ster-en-opblaasbare-tenten', 'Onderdelen voor stretch-, ster- en opblaasbare tenten', 'partytent-onderdelen', products=systeem_onderdelen, ext=True,
        brief='Zijwanden, palen, spanmateriaal en koppelgoten voor stretchtenten, zijwanden voor stertenten, en pompen, wanden, luifels, tunnels, tassen, licht en watergewicht voor opblaasbare tenten.',
        kenmerken=['Pasvorm per tent vermeld', 'Stretch, ster en opblaasbaar', 'Ballastadvies op aanvraag'])
    col('verwarming', 'Verwarming', 'accessoires', types(['Verwarming']), ext=True,
        brief='Elektrische heaters voor in de tent en gasheaters voor buiten (terras, lounge, vlam), met hoes en reservebrander; afstand tot doek en waar het mag.',
        kenmerken=['Elektrisch in de tent', 'Gas alleen buiten', 'Vermogen per m²'])
    col('evenement', 'Evenement en inrichting', None, types(INRICHTING_TYPES), True, ext=True,
        brief='Inrichting voor events, zaal en markt: afzetpalen met band of koord, marktkramen, lopers, tentvloer en tapijttegels, kapstokken en koelkasten.',
        kenmerken=['Afzetpalen met band of koord', 'Koelkasten en flessenkoelers', 'Vloer en garderobe'])
    col('koelkasten-en-vriezers', 'Koelkasten en vriezers', 'evenement', [r('type', 'equals', 'Koeling'), r('title', 'contains', 'koelkasten')], True, ext=True,
        brief='Barkoelkasten met glazen deur, staande en RVS-horecakoelkasten, een koel-vrieskist, de verrijdbare flessenkoeler en de karren om ze te rijden.',
        kenmerken=['128 tot 1.000 liter', 'Glazen of dichte deur', 'Kar voor koelkast en kist'])
    col('zijwanden', 'Zijwanden', 'partytent-onderdelen', types(['Zijwand', 'Zijwandenset']) + [r('title', 'contains', 'zijwand')], True,
        brief='Losse wanden en sets: dicht, raam, deur; polyester of PVC; welke lengte bij welke tent.',
        kenmerken=['Dicht, raam of deur', 'Klittenband', 'Set goedkoper dan los'])
    col('gewichten-en-verankering', 'Gewichten en verankering', 'partytent-onderdelen', types(['Verzwaring', 'Verankering']), True,
        brief='Voetgewichten, zandzakken, haringen, spanbanden, stormbanden en ballast; altijd verankeren.',
        kenmerken=['15 kg per poot op verharding', 'Haringen op gras', 'Bij harde wind: dak eraf'])
    col('tassen-en-wielsets', 'Tassen en wielsets', 'partytent-onderdelen', types(['Tas & wielset']) + [r('title', 'starts_with', 'Opbergtas')], True,
        brief='Beschermhoezen, wieltassen, wielsets en opbergtassen, ook de tas met wielen voor de opblaasbare tent.')
    col('statafels', 'Statafels', None, types(['Statafel']),
        brief='Inklapbaar, vast of stapelbaar; Ø70, Ø80 of Ø85 cm, 110 cm hoog; hoeveel personen per maat.',
        kenmerken=['110 cm hoog', 'Ø70, Ø80, Ø85 cm', 'Hittebestendig blad', 'Staffel vanaf 10'])
    col('statafelrokken', 'Statafelrokken en -hoezen', None, types(TEXTIEL_TYPES), True,
        brief='Stretch, met strik, kleden, topcovers, tafelhoezen en beschermplaten; maatadvies voorop.',
        kenmerken=['24 kleuren stretch', 'Maat Ø60–70 of Ø80–85 cm', 'Wasbaar op 30 °C', 'Staffel vanaf 10'])
    col('stretch-statafelrokken', 'Stretch statafelrokken', 'statafelrokken', types(['Statafelrok', 'Topcover']), True, ext=True,
        brief='Strakke stretchrokken met of zonder topcover en losse topcovers.')
    col('statafelhoezen-met-strik', 'Statafelhoezen met strik', 'statafelrokken', types(['Statafelhoes met strik', 'Strik']), True,
        brief='Los vallende hoezen met strik voor bruiloft en gala; losse strik in contrastkleur.')
    col('statafelkleden', 'Statafelkleden', 'statafelrokken', types(['Statafelkleed']), brief='Kleden over de stretchrok of rond tot de grond.')
    col('bedrukte-statafelhoezen', 'Bedrukte statafelhoezen', 'statafelrokken', products=bedrukte_hoezen,
        brief='Statafelhoes, beschermplaat of tafelhoes met jouw logo; upload, drukproef, staffel.',
        kenmerken=['Vanaf 1 stuk', 'Drukproef vooraf', 'Tot 25% staffel'])
    col('statafel-onderdelen', 'Statafel-onderdelen en transport', 'statafels',
        products=['onderdelen-statafel', 'los-statafelblad', 'voetdoppen-set-van-4', 'transportkar-statafels', 'beschermplaat-statafel'], ext=True,
        brief='Onderstel, schuifring, scharnier, los blad, voetdoppen, beschermplaat en de kar voor de inklapbare statafels.',
        kenmerken=['Per onderdeel te bestellen', 'Past op onze inklapbare statafels', 'Kar voor 5 of 15 statafels'])
    col('topcovers-en-beschermplaten', 'Topcovers en beschermplaten', 'statafelrokken', types(['Topcover', 'Beschermplaat']), True, ext=True,
        brief='Losse topcover stretch in 24 kleuren en transparante beschermplaten (rond, vierkant, rechthoekig, ook bedrukt).',
        kenmerken=['24 kleuren topcover', 'Rond, vierkant of rechthoekig', 'Ook met jouw opdruk'])
    col('tafelhoezen', 'Tafelhoezen', 'statafelrokken', types(['Tafelhoes']), ext=True,
        brief='Stretchhoezen voor klaptafels en biertafelsets, effen of met logo.',
        kenmerken=['Strak tot de grond', 'Klaptafel 122, 183 of 244 cm', 'Ook met jouw logo'])
    # title 'Pakketten' (handle stays): no compare-at price and no badge:actie anywhere, so 'Actie' promised a sale that is not there
    col('actiepakketten', 'Pakketten', None, [r('tag', 'equals', 'set')],
        brief='Vaste combinaties voor één pakketprijs (statafels met rokken en kar, tentpakketten); pakketprijs t.o.v. losse prijs, geen tijdelijke actie.')
    col('meubilair', 'Meubilair', None, types(MEUBEL_TYPES), True,
        brief='Barkrukken, stoelen, klaptafels, biertafelsets, terrastafels en transportkarren.')
    col('barkrukken', 'Barkrukken', 'meubilair', types(['Barkruk']), ext=True,
        brief='Barkrukken met zithoogte 76 cm bij een statafel van 107–110 cm: metaal, hout, velours, chroom, draad en PE-rotan.',
        kenmerken=['Zithoogte 76 cm', 'Stapelbaar tot 10', 'Kar voor 24 krukken'])
    col('stoelen-en-banken', 'Stoelen, krukken en banken', 'meubilair', types(['Stoel', 'Kruk', 'Bank', 'Bierbank']), True, ext=True,
        brief='Klapstoelen, stapelstoelen, banquetstoelen, lage krukken en banken op zithoogte ca. 45 cm.',
        kenmerken=['Stapelbaar of plat opvouwbaar', 'Zithoogte ca. 45 cm', 'Staffel vanaf 10'])
    col('tafels', 'Klaptafels, bankettafels, terrastafels en biertafelsets', 'meubilair', types(['Klaptafel', 'Terrastafel', 'Biertafelset', 'Bierbank']), True, ext=True,
        brief='Tafels om aan te zitten: HDPE-klaptafels, bankettafels met houten blad (recht, rond, halfrond, kwartrond, ovaal, vierkant), conferentie- en examentafels, terrastafels, biertafelsets en bierbanken.',
        kenmerken=['Inklapbaar', 'Recht, rond en aansluitvormen', 'Binnen en buiten'])
    col('terrastafels', 'Terrastafels', 'meubilair', types(['Terrastafel']), ext=True,
        brief='Terrastafels op 75 cm, de terrasversie van elke statafel: rond op het onderstel van de statafel, vierkant en breed stapelbaar (zwart, RVS of wit onderstel), HPL op een zuilvoet, met klapblad en wiebelvrij; zelfde bladen en decors; kar voor na sluitingstijd.',
        kenmerken=['Zelfde bladen als de statafel', 'Stapelbaar, klapblad of zuilvoet', 'Onderstel zwart, wit of RVS', 'Binnen en buiten (compact HPL)'])
    col('transportkarren', 'Transportkarren', 'meubilair', types(['Transportkar']), ext=True,
        brief='Karren voor statafels (5 of 15), klaptafels, barkrukken en klapstoelen.',
        kenmerken=['5 of 15 statafels', 'Klaptafels, barkrukken, klapstoelen', 'Levering op pallet'])
    col('verlichting', 'Verlichting', None, types(LICHT_TYPES) + [r('title', 'starts_with', 'Prikkabelset')], True,
        brief='Prikkabels (ook als set met lampen), LED-lampen, lichtslangen, kerstverlichting, tentverlichting en onderdelen.')
    col('prikkabels', 'Prikkabels', 'verlichting', [r('type', 'equals', 'Prikkabel'), r('title', 'starts_with', 'Prikkabelset')], True, ext=True,
        brief='Prikkabels E27 per lengte, op maat en als set met LED-lampen.',
        kenmerken=['Fitting elke meter', 'IP44, voor buiten', 'Ook op maat tot 200 m'])
    col('lampen-en-lichtslangen', 'Lampen, lichtslangen en tentverlichting', 'verlichting', types(['LED-lamp', 'Lichtslang', 'Kerstverlichting', 'Tentverlichting']), True, ext=True,
        brief='LED-lampen E27, lichtslang per meter of als rol, kerstverlichting en verlichting voor easy-up en opblaasbare tent.',
        kenmerken=['Zuinige LED', 'IP44 of beter', 'Ook voor in de tent'])
    col('zakelijk', 'Zakelijk', None, [r('tag', 'equals', 'zakelijk')],
        brief='Selectie voor horeca, verhuur, events en verenigingen: staffels, offerte, op factuur [claim].')
    col('all', 'Alle producten', None, [r('vendor', 'equals', 'Klapklaar')], sort='best-selling', brief='Het hele assortiment.')
    return C

def f(handle, opt, val):
    return f'/collections/{handle}?filter.v.option.{opt}={quote_plus(val)}'

def t(handle, *ptypes):
    """Collection filtered on one or more product types (repeated filter.p.product_type = OR in Shopify filtering)."""
    return f'/collections/{handle}?' + '&'.join(f'filter.p.product_type={quote_plus(pt)}' for pt in ptypes)

def L(title, type_, handle=None, url=None, items=None):
    d = {'title': title, 'type': type_}
    if handle:
        d['handle'] = handle
    if url:
        d['url'] = url
    if items:
        d['items'] = items
    return d

def P(title, h):
    return L(title, 'product', h)

def build_menus():
    maten = ['2 x 2 m', '3 x 3 m', '3 x 4,5 m', '3 x 6 m', '4 x 4 m', '4 x 6 m', '4 x 8 m', '5 x 5 m']
    # owner 2026-10-31: the statafel and furniture assortment first, tents small (only what has a real photo shows; catalog/build.py
    # drops menu links to products and collections the storefront does not show)
    from kk_base import PRODUCTS
    def maten(ptype):
        vals = []
        for p in PRODUCTS:
            if p['product_type'] == ptype:
                for o in p['options']:
                    if o['name'] == 'Maat':
                        vals += [v for v in o['values'] if v not in vals]
        def key(v):
            n = [float(x.replace(',', '.')) for x in re.findall(r'\d+(?:,\d+)?', v)]
            return (0 if v.startswith('Ø') else 1, n)
        return sorted(vals, key=key)
    def of(ptype, drop):
        return [P(p['title'].replace(drop, '', 1).strip().capitalize(), p['handle']) for p in PRODUCTS
                if p['product_type'] == ptype and p.get('supplier') == 'mebu']
    main = [
        L('Statafels', 'collection', 'statafels', items=[
            L('Statafels', 'collection', 'statafels', items=of('Statafel', 'Statafel')),
            L('Per maat', 'collection', 'statafels', items=[L(m.replace(' x ', ' × '), 'http', url=f('statafels', 'maat', m)) for m in maten('Statafel')] +
              [L('Hoeveel statafels heb ik nodig?', 'article', 'advies/hoeveel-statafels-per-gast')]),
            L('Terrastafels', 'collection', 'terrastafels', items=of('Terrastafel', 'Terrastafel')),
            L('Transport en onderdelen', 'collection', 'statafel-onderdelen', items=[
                P('Transportkarren voor statafels', 'transportkar-statafels-inklapbaar'), P('Onderstel', 'onderstel-statafel-inklapbaar'),
                P('Los statafelblad', 'statafelblad-los'), P('Onderdelen', 'onderdelen-statafel-en-terrastafel'),
                P('Voetdoppen', 'voetdoppen-statafel-stoel-en-barkruk')]),
        ]),
        L('Rokken & hoezen', 'collection', 'statafelrokken', items=[
            L('Stretchrokken', 'collection', 'stretch-statafelrokken', items=[
                P('Statafelrok stretch met topcover', 'statafelrok-stretch-met-topcover'), P('Losse topcover', 'topcover-statafel-stretch'),
                P('Nederland-thema', 'statafelrok-stretch-nederland-thema')]),
            L('Rokken met strik', 'collection', 'statafelhoezen-met-strik', items=[P('Statafelrok met strik', 'statafelrok-met-strik')]),
            L('Statafelkleden', 'collection', 'statafelkleden', items=[P('Statafelkleed', 'statafelkleed-polyester')]),
            L('Topcovers en beschermplaten', 'collection', 'topcovers-en-beschermplaten', items=[
                P('Losse topcover', 'topcover-statafel-stretch'), P('Beschermplaat transparant', 'beschermplaat-transparant'),
                P('Beschermplaat bedrukt', 'beschermplaat-bedrukt')]),
            L('Tafel- en stoelhoezen', 'collection', 'tafelhoezen', items=[
                P('Stretchhoes buffettafel', 'stretchhoes-buffettafel-183-x-76-cm'), P('Stoelhoes banquetstoel', 'stoelhoes-stretch-banquetstoel')]),
            L('Welke maat past?', 'page', 'maatadvies-statafelrokken', items=[L('Maatadvies', 'page', 'maatadvies-statafelrokken'),
                                                                                L('Welke statafelrok past?', 'article', 'advies/welke-statafelrok-past')]),
        ]),
        L('Meubilair', 'collection', 'meubilair', items=[
            L('Barkrukken', 'collection', 'barkrukken', items=of('Barkruk', 'Barkruk') + of('Kruk', '')),
            L('Stoelen', 'collection', 'stoelen-en-banken', items=of('Stoel', '')),
            L('Tafels', 'collection', 'tafels', items=of('Klaptafel', '') + of('Biertafelset', '') + of('Bierbank', '')),
            L('Transportkarren', 'collection', 'transportkarren', items=[
                P('Voor statafels', 'transportkar-statafels-inklapbaar'), P('Voor barkrukken', 'transportkar-barkrukken-metaal-stapelbaar'),
                P('Voor stapelstoelen', 'transportkar-stapelstoelen-kunststof'), P('Voor klapstoelen', 'transportkar-klapstoelen-kunststof'),
                P('Voor banquetstoelen', 'transportkar-banquetstoelen'), P('Voor bankettafels', 'transportkar-bankettafels-rechthoekig'),
                P('Voor biertafelsets', 'transportkar-biertafelsets-220-cm'), L('Alle transportkarren', 'collection', 'transportkarren')]),
            L('Evenement en inrichting', 'collection', 'evenement', items=[
                P('Afzetpaal met trekband', 'afzetpaal-met-oprolbare-trekband'), P('Afzetpaal met koord', 'afzetpaal-met-koord'),
                P('Afzetkoord velours', 'afzetkoord-velours'), P('Loper per meter', 'loper-per-meter'), P('Kapstok verrijdbaar', 'kapstok-verrijdbaar'),
                L('Koelkasten en vriezers', 'collection', 'koelkasten-en-vriezers'), L('Verwarming', 'collection', 'verwarming'),
                L('Verlichting', 'collection', 'verlichting')]),
        ]),
        L('Partytenten', 'collection', 'partytenten', items=[
            L('Partytenten', 'collection', 'partytenten', items=[
                L('Easy-up partytenten', 'collection', 'easy-up-partytenten'), L('Partytenten met buizenframe', 'collection', 'partytenten-buizenframe'),
                L('Stretchtenten', 'collection', 'stretchtenten'), L('Accessoires', 'collection', 'accessoires')]),
        ]),
        L('Zakelijk', 'page', 'zakelijk', items=[
            L('Klapklaar Zakelijk', 'page', 'zakelijk', items=[L('Zo bestel je zakelijk', 'page', 'zakelijk'), L('Offerte aanvragen', 'page', 'offerte'),
                                                               L('Zakelijk assortiment', 'collection', 'zakelijk'), L('Bedrukken', 'page', 'bedrukken')]),
        ]),
    ]
    return [
        {'handle': 'main-menu', 'title': 'Hoofdmenu', 'items': main},
        {'handle': 'footer-assortiment', 'title': 'Winkel', 'items': [
            L('Statafels', 'collection', 'statafels'), L('Terrastafels', 'collection', 'terrastafels'),
            L('Statafelrokken en -hoezen', 'collection', 'statafelrokken'), L('Barkrukken', 'collection', 'barkrukken'),
            L('Stoelen', 'collection', 'stoelen-en-banken'), L('Tafels', 'collection', 'tafels'), L('Transportkarren', 'collection', 'transportkarren'),
            L('Evenement en inrichting', 'collection', 'evenement'), L('Partytenten', 'collection', 'partytenten'), L('Pakketten', 'collection', 'actiepakketten'),
            L('Alle producten', 'collection', 'all')]},
        {'handle': 'footer-klantenservice', 'title': 'Hulp', 'items': [
            L('Contact', 'page', 'contact'), L('Veelgestelde vragen', 'page', 'veelgestelde-vragen'), L('Verzenden en bezorgen', 'page', 'verzenden-en-bezorgen'),
            L('Retourneren', 'page', 'retourneren'), L('Garantie', 'page', 'garantie'), L('Betaalmethoden', 'page', 'betaalmethoden'),
            L('Maatadvies statafelrokken', 'page', 'maatadvies-statafelrokken'), L('Offerte aanvragen', 'page', 'offerte'), P('Cadeaubon', 'cadeaubon'),
            L('Mijn account', 'http', url='/account')]},
        {'handle': 'footer-klapklaar', 'title': 'Over Klapklaar', 'items': [
            L('Over ons', 'page', 'over-ons'), L('Zakelijk', 'page', 'zakelijk'), L('Bedrukken', 'page', 'bedrukken'), L('Advies & inspiratie', 'blog', 'advies')]},
        {'handle': 'footer-juridisch', 'title': 'Juridisch', 'items': [
            L('Algemene voorwaarden', 'policy', 'terms-of-service'), L('Privacy', 'policy', 'privacy-policy'), L('Cookies', 'http', url='/policies/privacy-policy#cookies')]},
    ]

PAGES = [
    ('over-ons', 'Over ons', None, 'Wie Klapklaar is en waarom (nuchter, geen verzonnen cijfers): kies je maat, wij zorgen dat het klaarstaat; banden met eventverhuur alleen noemen als de eigenaar dat wil.'),
    ('contact', 'Contact', 'contact', 'Contactformulier "Stel je vraag", bel/app-blok, openingstijden en reactietijd [claims], KvK/btw [claim]; link naar FAQ en offerte.'),
    ('zakelijk', 'Zakelijk bestellen', 'zakelijk', 'Klapklaar Zakelijk: prijzen excl. btw-schakelaar, staffels, offerte vanaf 10 stuks, op factuur [claim], drukproef, levering op locatie [claim]; Linnen/Polder-stijl.'),
    ('offerte', 'Offerte aanvragen', 'offerte', 'Offerteformulier (bedrijfsnaam, contactpersoon, e-mail, telefoon, aantal, leverdatum, logo uploaden, toelichting); reactie binnen één werkdag [claim].'),
    ('bedrukken', 'Bedrukken met jouw logo', 'bedrukken', 'Hoe bedrukken werkt: product kiezen, logo uploaden, drukproef, akkoord, productie; bestandseisen, levertijd na akkoord [claim], staffels.'),
    ('veelgestelde-vragen', 'Veelgestelde vragen', 'faq', 'FAQ in groepen (bestellen, levering, retour, maat kiezen, bedrukken, zakelijk) met FAQPage-structured data; elk antwoord volgt de theme-claims.'),
    ('verzenden-en-bezorgen', 'Verzenden en bezorgen', None, 'Eén tabel: pakket vs pallet, kosten NL/BE, gratis-drempel, verzenddagen, cutoff, levertijd maatwerk/bedrukt [alle claims].'),
    ('retourneren', 'Retourneren', None, '14 dagen bedenktijd, hoe aanmelden, kosten retour [claim]; uitgezonderd: maatwerk en bedrukte producten; geld terug binnen 14 dagen.'),
    ('garantie', 'Garantie', None, 'Wettelijke garantie plus onze termijn per lijn (frame Premium/Professional) [claim]; wat niet onder garantie valt (storm, slijtage, verkeerd verankeren).'),
    ('betaalmethoden', 'Betaalmethoden', None, 'iDEAL, Bancontact, creditcard, PayPal, Apple Pay [owner kiest]; zakelijk op factuur [claim]; geen toeslagen.'),
    ('maatadvies-statafelrokken', 'Maatadvies statafelrokken', None, 'Bladdiameter meten → maat (Ø60–70 / Ø80–85), tafelhoogte 105–115 cm, stretch vs strik vs kleed; tabel + tekening.'),
    ('showroom-en-afhalen', 'Showroom en afhalen', None, 'ALLEEN publiceren als de eigenaar een afhaallocatie bevestigt: adres, op afspraak, tijden [claims]. Standaard: niet gepubliceerd.'),
]

ARTICLES = [
    ('easy-up-partytent-opzetten', 'Easy-up partytent opzetten: zo staat hij in een paar minuten', 'Stap voor stap met twee personen, dak vóór het uitschuiven, hoogte instellen, direct verankeren; foto-/renderstappen.'),
    ('welke-statafelrok-past', 'Welke statafelrok past op jouw statafel?', 'Blad meten, hoogte checken, stretch vs strik vs kleed, topcover wel/niet; link naar maatadvies.'),
    ('hoeveel-statafels-per-gast', 'Hoeveel statafels heb je nodig per gast?', 'Rekenregel per Ø (Ø70: 4–5, Ø80: 6 staand), receptie vs feest, mix met zitplaatsen; rekenvoorbeeld 50 en 100 gasten.'),
    ('partytent-onderhouden-en-opbergen', 'Partytent onderhouden en opbergen', 'Droog opbergen (schimmel), schoonmaken zonder agressieve middelen, scharnieren checken, onderdelen vervangen.'),
    ('partytent-verankeren-bij-wind', 'Partytent verankeren bij wind', 'Haringen vs gewichten, hoeveel kg per poot, spanbanden, wanneer het dak eraf moet; nooit "klap" bij wind (merkregel).'),
    ('logo-aanleveren-voor-bedrukking', 'Bedrukken: zo lever je je logo aan', 'Vector vs PNG ≥ 300 dpi, kleuren (Pantone/CMYK), maatvoering per product, drukproef lezen.'),
    ('easy-up-premium-of-professional', 'Easy-up Premium of Professional: welke past bij jou?', 'Staal 40 mm vs aluminium 50 mm, gewicht, gebruiksfrequentie, wat erin zit; vergelijkingstabel.'),
    ('hoeveel-mensen-in-een-partytent', 'Hoeveel mensen passen er in een partytent?', 'Ca. 1 zittend of 1,5 staand per m², tabel per maat, ruimte voor buffet/bar.'),
    ('pe-of-pvc-partytent', 'PE of PVC: welk tentdoek kies je?', 'Gewicht per m², levensduur, brandvertragend, wanneer PE genoeg is.'),
    ('stretchtent-of-stertent', 'Stretchtent of stertent?', 'Vorm, opzetten, ruimte rondom, capaciteit en budget naast elkaar.'),
    ('prikkabel-op-maat-berekenen', 'Prikkabel op maat: zo bereken je lengte en fittingen', 'Ophangpunten meten, doorhang, fittingafstand, totaal vermogen per groep.'),
    ('zijwanden-kiezen', 'Zijwanden kiezen voor je partytent', 'Dicht, raam, deur, half; polyester vs PVC; welke lengte op welke zijde.'),
    # catalog round 3 (L8): info content the reference has and we did not
    ('grondframe-en-nokversteviging', 'Grondframe en nokversteviging: wat doen ze en wanneer heb je ze nodig?', 'Wat ze doen, bij welke lijn ze erbij zitten, wanneer nodig (lang staan, > 6 m, verhuur), opbouw met grondframe.'),
    ('opslagtent-kiezen', 'Opslagtent kiezen: welk doek, welke maat en hoe zet je hem neer?', 'Doek naar duur, maat naar inhoud + looppad, plek vlak en vast, opslagtent vs carport.'),
    ('schaduwdoek-vragen', 'Schaduwdoek ophangen: de vragen die iedereen stelt', 'Waterdoorlatend vs waterdicht, afschot, ophangpunten, vorm en maat, wind, winter.'),
    ('bruiloft-in-een-stretchtent', 'Trouwen in een stretchtent: zo pak je het aan', 'm² per gast, open of dicht, inrichting, licht, weer en wind, planning.'),
    ('biertafelset-samenstellen', 'Je eigen biertafelset samenstellen: set, losse delen of zelf bouwen', 'Lengte en breedte, kwaliteit, set vs los vs onderstel onder eigen blad, aankleden, aantallen.'),
    ('statafel-kopen-koopgids', 'Statafel kopen: de koopgids', 'Inklappen, stapelen of vast; bladsoorten; maat; onderstel en hoogte; aankleden; vervoer.'),
]

# Search & Discovery filter set (fixture + docs). Standing item b (catalog round 2026-10-18): no tag filter (it showed raw values like
# 'zakelijk', 'pallet' and 'gebruik:horeca'); 'Gebruik' reads custom.gebruik, the readable labels catalog/build.py derives from the
# gebruik:* tags; a boolean metafield reads Ja / Nee (value_labels, the way Search & Discovery labels a true/false filter).
FILTERS = [
    {'source': 'availability', 'label': 'Beschikbaarheid'}, {'source': 'price', 'label': 'Prijs'},
    {'source': 'option', 'name': 'Maat', 'label': 'Maat'}, {'source': 'option', 'name': 'Kleur', 'label': 'Kleur'},
    {'source': 'option', 'name': 'Uitvoering', 'label': 'Uitvoering'}, {'source': 'product_type', 'label': 'Soort'},
    {'source': 'metafield', 'owner': 'product', 'namespace': 'custom', 'key': 'gebruik', 'label': 'Gebruik'},
    {'source': 'metafield', 'owner': 'product', 'namespace': 'custom', 'key': 'systeem', 'label': 'Past op'},
    {'source': 'metafield', 'owner': 'product', 'namespace': 'custom', 'key': 'bedrukbaar', 'label': 'Met jouw logo',
     'value_labels': {'true': 'Ja', 'false': 'Nee'}},
]


# Shopify Standard Product Taxonomy (version 2026-11-unstable, github.com/Shopify/product-taxonomy dist/en/categories.txt), checked
# against the taxonomy file: (full path, category id). products.csv carries the full path in 'Product Category'; the seed script uses
# gid://shopify/TaxonomyCategory/<id>. Products with a Kleur option sit in a category with the 'color' attribute where one fits, so Kleur
# can be linked to shopify.color-pattern (CONTRACT); exceptions (no colour attribute in the closest category) are listed in
# docs/claims-to-confirm.md. A handle entry wins over the product type.
# Renamed handles keep their old URL working (Online Store > Navigation > URL Redirects > Import export/redirects.csv): the
# opblaasbare partytent also sells 3 x 4,5 and 3 x 6 m, the voetgewicht is also the buizenframe add-on (merchandising review 3)
REDIRECTS = [
    {'from': '/products/opblaasbare-partytent-3x3-waterpoten', 'to': '/products/opblaasbare-partytent-met-waterpoten'},
    {'from': '/products/voetgewicht-easy-up-15-kg', 'to': '/products/voetgewicht-partytent-15-kg'},
    # catalog round 4: the loose bierbank is sold in 180 and 220 cm, so its handle no longer names one length
    {'from': '/products/bierbank-220', 'to': '/products/bierbank'},
]

TAXONOMY_VERSION = '2026-11-unstable'
PRODUCT_CATEGORY_BY_TYPE = {
    'Easy-up partytent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'Partytent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'Stretchtent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'Stertent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'Opblaasbare tent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'Opslagtent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Sheds, Garages & Carports', 'hg-12-2-6-5'),
    'Marktkraam': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'Zijwand': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories', 'hg-12-2-6-2'),
    'Zijwandenset': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Enclosure Kits', 'hg-12-2-6-2-1'),
    'Stretchtent zijwand': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'Stertent zijwand': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'Dakzeil': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Tops', 'hg-12-2-6-2-3'),
    'Frame-onderdeel': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Frames', 'hg-12-2-6-2-2'),
    'Verzwaring': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy Weights', 'hg-12-2-6-2-5'),
    'Verankering': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy Anchor Kits', 'hg-12-2-6-2-8'),
    'Tas & wielset': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories', 'hg-12-2-6-2'),
    'Regengoot & koppeling': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories', 'hg-12-2-6-2'),
    'Stretchtent onderdeel': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories', 'hg-12-2-6-2'),
    'Opblaasbare tent accessoire': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories', 'hg-12-2-6-2'),
    'Overkapping': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories', 'hg-12-2-6-2'),
    'Schaduwdoek': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Umbrellas & Sunshades > Sunshades', 'hg-12-2-8-2'),
    'Statafel': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'Klaptafel': ('Furniture > Tables > Folding Tables', 'fr-24-3'),
    'Terrastafel': ('Furniture > Outdoor Furniture > Outdoor Tables > Bistro Tables', 'fr-15-6-2'),
    'Biertafelset': ('Furniture > Outdoor Furniture > Outdoor Furniture Sets', 'fr-15-2'),
    'Bierbank': ('Furniture > Outdoor Furniture > Outdoor Seating > Outdoor Benches > Picnic Benches', 'fr-15-4-1-10'),
    'Barkruk': ('Furniture > Chairs > Table & Bar Stools > Bar Stools', 'fr-7-12-2'),
    'Kruk': ('Furniture > Chairs > Table & Bar Stools', 'fr-7-12'),
    'Stoel': ('Furniture > Chairs > Kitchen & Dining Room Chairs > Dining Chairs', 'fr-7-9-1'),
    'Bank': ('Furniture > Benches', 'fr-3'),
    'Transportkar': ('Hardware > Tools > Dollies & Hand Trucks > Platform Dollies', 'ha-15-13-3'),
    'Meubelonderdeel': ('Furniture > Table Accessories', 'fr-23'),
    'Statafelrok': ('Home & Garden > Linens & Bedding > Table Linens > Table Skirts', 'hg-15-3-5'),
    'Statafelhoes met strik': ('Home & Garden > Linens & Bedding > Table Linens > Table Skirts', 'hg-15-3-5'),
    'Topcover': ('Home & Garden > Linens & Bedding > Table Linens > Tablecloths', 'hg-15-3-6'),
    'Strik': ('Home & Garden > Linens & Bedding > Table Linens', 'hg-15-3'),
    'Statafelkleed': ('Home & Garden > Linens & Bedding > Table Linens > Tablecloths', 'hg-15-3-6'),
    'Tafelhoes': ('Home & Garden > Linens & Bedding > Table Linens > Table Skirts', 'hg-15-3-5'),
    'Beschermplaat': ('Furniture > Table Accessories > Table Tops', 'fr-23-2'),
    'Prikkabel': ('Home & Garden > Lighting > Light Ropes & Strings', 'hg-13-8'),
    'Lichtslang': ('Home & Garden > Lighting > Light Ropes & Strings', 'hg-13-8'),
    'Kerstverlichting': ('Home & Garden > Lighting > Light Ropes & Strings > String Lights', 'hg-13-8-2'),
    'LED-lamp': ('Home & Garden > Lighting > Light Bulbs > LED Light Bulbs', 'hg-13-7-4'),
    'Tentverlichting': ('Home & Garden > Lighting > Flood & Spot Lights', 'hg-13-3'),
    'Verlichting onderdeel': ('Home & Garden > Lighting Accessories', 'hg-14'),
    'Verwarming': ('Home & Garden > Household Appliances > Climate Control Appliances > Patio Heaters', 'hg-9-1-11'),
    'Afzetpaal': ('Hardware > Fencing & Barriers > Safety & Crowd Control Barriers > Retractable Belts', 'ha-3-8-4'),
    'Koeling': ('Home & Garden > Kitchen & Dining > Kitchen Appliances > Refrigerators > Commercial Refrigerators', 'hg-11-7-41-1'),
    'Stoelhoes': ('Home & Garden > Decor > Slipcovers', 'hg-3-60'),
    'Tentvloer': ('Hardware > Building Materials > Flooring & Carpet', 'ha-2-5'),
    'Kapstok': ('Furniture > Benches > Storage & Entryway Benches > Coat Racks', 'fr-3-2-2'),
    'Loper': ('Home & Garden > Decor > Rugs', 'hg-3-57'),
    'Cadeaubon': ('Gift Cards', 'gc'),
}
PRODUCT_CATEGORY_BY_HANDLE = {
    'stoelverbinder': ('Furniture > Chair Accessories', 'fr-6'),   # catalog round 4
    'koel-vrieskist-liggend': ('Home & Garden > Kitchen & Dining > Kitchen Appliances > Freezers > Chest Freezers', 'hg-11-7-20-1'),
    'afzetpaal-met-koord': ('Hardware > Fencing & Barriers > Safety & Crowd Control Barriers', 'ha-3-8'),
    'afzetkoord-velours': ('Hardware > Fencing & Barriers > Safety & Crowd Control Barriers', 'ha-3-8'),
    'onderdelen-afzetsysteem': ('Hardware > Fencing & Barriers > Safety & Crowd Control Barriers', 'ha-3-8'),
    'transportkar-koelkasten': ('Hardware > Tools > Dollies & Hand Trucks > Appliance Dollies', 'ha-15-13-1'),
    'bevestigingsset-schaduwdoek': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Umbrellas & Sunshades', 'hg-12-2-8'),
    'funderingsset-tuinpaviljoen': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories', 'hg-12-2-6-2'),
    'tuinpaviljoen-aluminium': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Gazebos', 'hg-12-2-6-1-2'),
    'carport-opslagtent-vast-frame': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Sheds, Garages & Carports > Carports', 'hg-12-2-6-5-1'),
    'overkappingzeil-op-maat': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Tops', 'hg-12-2-6-2-3'),
    'zijwanden-tuinpaviljoen': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'stretchdoek-los': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Tops', 'hg-12-2-6-2-3'),
    'stretchdoek-op-maat': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Tops', 'hg-12-2-6-2-3'),
    'hypar-schaduwzeil-stretch': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Umbrellas & Sunshades > Sunshades', 'hg-12-2-8-2'),
    'palen-stretchtent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy Poles', 'hg-12-2-6-2-4'),
    'haringen-en-bevestigingsmateriaal-partytent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy Stakes', 'hg-12-2-6-2-7'),
    'bedrukte-zijwand-easy-up': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'zijwand-partytent-2-m-pvc': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'eindwand-en-tussenwand-partytent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'zijwand-opblaasbare-promotietent': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'zijwand-opblaasbare-partytent-met-waterpoten': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy & Gazebo Side Walls', 'hg-12-2-6-2-6'),
    'kerstverlichting-10-m': ('Home & Garden > Lighting > Light Ropes & Strings > String Lights', 'hg-13-8-2'),
    'led-lichtslang-set-warm-wit': ('Home & Garden > Lighting > Light Ropes & Strings > Rope Lights', 'hg-13-8-1'),
    'statafel-inklapbaar-hdpe-80': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'zitkussen-stoel-en-barkruk': ('Home & Garden > Decor > Chair & Sofa Cushions', 'hg-3-15'),
    'los-statafelblad': ('Furniture > Table Accessories > Table Tops', 'fr-23-2'),
    'onderdelen-statafel': ('Furniture > Table Accessories > Table Bases', 'fr-23-6'),
    'statafel-met-kruisvoet': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'statafel-vierkant-stapelbaar': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'statafel-wijnvat-houtlook': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'klapstoel': ('Furniture > Chairs > Folding Chairs & Stools > Folding Chairs', 'fr-7-6-1'),
    'kruk-laag-stapelbaar': ('Furniture > Chairs > Table & Bar Stools', 'fr-7-12'),
    'beschermhoes-terrasheater': ('Home & Garden > Household Appliance Accessories > Patio Heater Accessories > Patio Heater Covers', 'hg-8-10-1'),
    'infraroodbrander-elektrische-heater': ('Home & Garden > Household Appliance Accessories > Patio Heater Accessories', 'hg-8-10'),
    'led-verlichting-opblaasbare-tent': ('Home & Garden > Lighting > Flood & Spot Lights', 'hg-13-3'),
    'onderdelen-prikkabel-en-lichtslang': ('Home & Garden > Lighting Accessories', 'hg-14'),
    'pakket-statafel-met-stretchrok': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'pakket-statafel-hdpe-met-stretchrok': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'pakket-4-statafels-met-stretchrokken': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'pakket-statafels-met-transportkar': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'pakket-5-statafels-stretchrokken-transportkar': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'pakket-10-statafels-stretchrokken-transportkar': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'pakket-15-statafels-stretchrokken-transportkar': ('Furniture > Outdoor Furniture > Outdoor Tables > Bar Tables', 'fr-15-6-1'),
    'terraspakket-statafel-barkrukken': ('Furniture > Furniture Sets > Kitchen & Dining Furniture Sets > Bar & Pub Table Sets', 'fr-10-3-2'),
    'wijnvat-set-statafel-barkrukken': ('Furniture > Furniture Sets > Kitchen & Dining Furniture Sets > Bar & Pub Table Sets', 'fr-10-3-2'),
    'buffetpakket-klaptafels-stretchhoezen': ('Furniture > Tables > Folding Tables', 'fr-24-3'),
    'biertafelsets-10-stuks': ('Furniture > Outdoor Furniture > Outdoor Furniture Sets', 'fr-15-2'),
    'starterspakket-easy-up-premium': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'compleet-pakket-easy-up-professional': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopies & Gazebos > Canopies', 'hg-12-2-6-1-1'),
    'pakket-24-barkrukken-met-transportkar': ('Furniture > Chairs > Table & Bar Stools > Bar Stools', 'fr-7-12-2'),
    'pakket-40-stapelstoelen-met-transportkar': ('Furniture > Chairs > Kitchen & Dining Room Chairs > Dining Chairs', 'fr-7-9-1'),
    # catalog round 5
    'pakket-20-stapelstoelen-met-transportkar': ('Furniture > Chairs > Kitchen & Dining Room Chairs > Dining Chairs', 'fr-7-9-1'),
    'pakket-50-klapstoelen-met-transportkar': ('Furniture > Chairs > Kitchen & Dining Room Chairs > Dining Chairs', 'fr-7-9-1'),
    'pakket-10-biertafels-met-transportkar': ('Furniture > Outdoor Furniture > Outdoor Furniture Sets', 'fr-15-2'),
    'pakket-buffettafel-met-stretchhoes': ('Furniture > Tables > Folding Tables', 'fr-24-3'),
    'pakket-10-ronde-klaptafels-met-transportkar': ('Furniture > Tables > Folding Tables', 'fr-24-3'),
    'pakket-klaptafels-met-transportkar': ('Furniture > Tables > Folding Tables', 'fr-24-3'),
    'pakket-30-klapstoelen-met-transportkar': ('Furniture > Chairs > Kitchen & Dining Room Chairs > Dining Chairs', 'fr-7-9-1'),
    'pakket-15-of-30-barkrukken-met-transportkar': ('Furniture > Chairs > Table & Bar Stools > Bar Stools', 'fr-7-12-2'),
    'pakket-26-weddingstoelen-met-transportkar': ('Furniture > Chairs > Kitchen & Dining Room Chairs > Dining Chairs', 'fr-7-9-1'),
    'pakket-klapstoelen-met-stoelhoezen': ('Furniture > Chairs > Kitchen & Dining Room Chairs > Dining Chairs', 'fr-7-9-1'),
    'tentelastieken-met-bal': ('Home & Garden > Lawn & Garden > Outdoor Living > Outdoor Structures > Canopy & Gazebo Accessories > Canopy Anchor Kits', 'hg-12-2-6-2-8'),
    'prikkabelset-led': ('Home & Garden > Lighting > Light Ropes & Strings', 'hg-13-8'),
}


def product_category(p):
    return PRODUCT_CATEGORY_BY_HANDLE.get(p['handle']) or PRODUCT_CATEGORY_BY_TYPE.get(p['product_type'])
