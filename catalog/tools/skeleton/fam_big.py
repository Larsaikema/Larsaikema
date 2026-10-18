# Stretch-, ster- en opblaasbare tenten; schaduwdoeken, overkappingen en tuinpaviljoen.
from kk_base import *
from fam_acc import simple


def ladder(x):
    """Round a summed price up to the price ladder ...49 / ...99 (whole euros): 1344 -> 1349, 2598 -> 2599."""
    n = int(-(-x // 1))
    base = n - n % 100
    for step in (49, 99, 149):
        if base + step >= n:
            return base + step

def build():
    # ------------------------------------------------------------ stretch
    SK = ['Zandkleur', 'Taupe', 'Wit', 'Zwart']
    STC = {'4,5 x 6 m': (2395, 2630, 85), '6 x 6 m': (3095, 3425, 110), '6 x 10,5 m': (5195, 5805, 180), '7,5 x 10,5 m': (6195, 6830, 225),
           '9 x 10,5 m': (7395, 8149, 270), '10,5 x 10,5 m': (8595, 9585, 320), '10,5 x 15 m': (9895, 11710, 420), '10,5 x 19,5 m': (12895, None, 540)}
    PU = ['Houten palen', 'Aluminium palen']
    vs = [variant(f'KK-TENT-ST-{code(m)}-{"HT" if u == PU[0] else "AL"}-{COLOR_CODE[k]}', [m, u, k], p if u == PU[0] else round(p * 1.08 / 10) * 10 - 5,
                  kg * 1000, None, tracked=False) for m, (p, om, kg) in STC.items() for u in PU for k in SK]
    imgs, vmap = kleur_images('stretchtent-compleet', SK, 'stretchtent', lambda k: {'w': 6, 'd': 6, 'color': render_color(k), 'poles': 'hout', 'anchors': True}, 'Zandkleur',
                              [img('stretchtent-compleet-zandkleur-low.webp', 'detail', 3, 'stretchtent', {'w': 6, 'd': 6, 'color': 'zand', 'poles': 'hout'}, 'low', 'Zandkleur')], p2=2)
    simple('stretchtent-compleet', 'Stretchtent compleet met palen', 'Stretchtent', ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Maat', list(STC)), opt('Uitvoering', PU), opt('Kleur', SK)], vs, imgs,
           {'kenmerk_kort': 'Stretchdoek 750 g/m² · lussen elke 75 cm · palen en spanbanden inbegrepen',
            'specificaties': [sp('Doek', 'Materiaal', 'Elastisch polyester, PVC-gecoat, 750 g/m², waterdicht, UV-bestendig'),
                              sp('Doek', 'Bevestiging', 'Lussen elke 75 cm'), sp('Levering', 'Inbegrepen', 'Doek, palenset, spanbanden met haringen, opbergtas'),
                              sp('Opzetten', 'Benodigd', 'Minimaal 2 m vrije ruimte rondom; 2–4 personen')],
            'levertijd': 'Levertijd 3–4 weken', 'verzending': 'pallet', 'staffelkorting': ST_GROOT, 'garantie': '1 jaar op het doek'},
           ['stretchtenten.stretch-compleet', 'stretchtenten.stretch-lusverbinding'], 'stretch',
           'Organische vorm voor horeca en events: hoe hoog en laag spannen werkt, wat erbij zit, ruimte rondom, opzettijd; verankering bij wind.',
           ['stretchtent kopen', 'stretchtent 6x6', 'stretch tent 10x15'], {'outmate': {m: v[1] for m, v in STC.items()}, 'band': '10x15 nieuw €8.517–€10.950 incl.', 'ours': {m: v[0] for m, v in STC.items()}}, vmap=vmap)
    SD = {'4,5 x 6 m': 1795, '6 x 6 m': 2195, '7,5 x 10,5 m': 4395, '10,5 x 10,5 m': 5795, '10,5 x 15 m': 7495, '10,5 x 19,5 m': 9695}
    vs = [variant(f'KK-TENT-SD-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 30000 + 4000 * i, None, tracked=False) for i, (m, p) in enumerate(SD.items()) for k in SK]
    # packshot = the cloth spanned on poles (a folded cloth reads as a heap): the stretchtent-compleet render in the same colour; the alt says
    # palen and spanmateriaal are not included
    imgs = [img(f'stretchtent-compleet-{slug(k)}-hero.webp', 'hero' if k == 'Zandkleur' else 'variant', 1 if k == 'Zandkleur' else 3, 'stretchtent',
                {'w': 6, 'd': 6, 'color': render_color(k), 'poles': 'hout', 'anchors': True}, 'hero', k, 'existing', extra={'shared_with': 'stretchtent-compleet'}) for k in SK]
    imgs.sort(key=lambda i: 0 if i['kleur'] == 'Zandkleur' else 1)
    vmap = {i['kleur']: i['file'] for i in imgs}
    simple('stretchdoek-los', 'Stretchdoek los', 'Stretchtent', ['zakelijk', 'pallet'], [opt('Maat', list(SD)), opt('Kleur', SK)], vs, imgs,
           {'kenmerk_kort': 'Alleen het doek · 750 g/m² · lussen elke 75 cm', 'levertijd': 'Levertijd 3–4 weken', 'verzending': 'pallet', 'staffelkorting': ST_GROOT},
           ['stretchtenten.stretch-doeken'], 'stretch', 'Voor wie al palen en spanmateriaal heeft of een doek wil vervangen.',
           ['stretchdoek', 'stretchtent doek los'], {'outmate': '6x6 €2.474 · 7,5x10,5 €4.999', 'ours': SD}, vmap=vmap)
    HANDLES['stretchdoek-los']['metafields']['past_op'] = ['stretchtent-compleet']
    vs = [variant(f'KK-TENT-SOM-{COLOR_CODE[k]}', [k], 59.95, 1000, None, tracked=False, qrule={'min': 20, 'max': 400, 'increment': 1}) for k in SK]
    simple('stretchdoek-op-maat', 'Stretchdoek op maat (per m²)', 'Stretchtent', ['zakelijk', 'gebruik:evenement'], [opt('Kleur', SK)], vs,
           # the other cloth colours: the stretchtent-compleet render in that colour (same cloth; the alt says what is in the box)
           [img('stretchdoek-op-maat-hero.webp', 'hero', 1, 'stretchtent', {'w': 7.5, 'd': 9, 'color': 'zand', 'poles': 'alu'}, 'hero', 'Zandkleur')] +
           [img(f'stretchtent-compleet-{slug(k)}-hero.webp', 'variant', 3, 'stretchtent', {'w': 6, 'd': 6, 'color': render_color(k), 'poles': 'hout', 'anchors': True}, 'hero', k,
                'existing', extra={'shared_with': 'stretchtent-compleet'}) for k in SK if k != 'Zandkleur'],
           {'kenmerk_kort': 'Jouw lengte × breedte · prijs per m² · min. 20 m²', 'levertijd': 'Levertijd 4–6 weken na akkoord tekening', 'verzending': 'pallet'},
           ['stretchtenten.stretch-op-maat'], 'stretch',
           'Maatwerk: aantal = m² (lengte × breedte, afgerond), maten als regel-eigenschappen; we sturen eerst een tekening ter akkoord; maatwerk kan niet retour.',
           ['stretchtent op maat', 'stretchdoek op maat'], {'outmate': 'vanaf €999 (configurator)', 'ours': '€59,95 per m², min. 20 m²'},
           extra={'line_item_properties': ['Lengte (m)', 'Breedte (m)', 'Palenset (ja/nee)', 'Spanmateriaal (spanbanden/touwensets)', 'Toelichting']},
           vmap={'Zandkleur': 'stretchdoek-op-maat-hero.webp', **{k: f'stretchtent-compleet-{slug(k)}-hero.webp' for k in SK if k != 'Zandkleur'}})
    SW = [('2 m', 'Startwand met 2 palen', 389), ('2 m', 'Uitbreidingswand', 339), ('3 m', 'Startwand met 2 palen', 449), ('3 m', 'Uitbreidingswand', 399)]
    simple('zijwand-stretchtent', 'Zijwand stretchtent', 'Stretchtent zijwand', ['zakelijk'], [opt('Maat', ['2 m', '3 m']), opt('Uitvoering', ['Startwand met 2 palen', 'Uitbreidingswand'])],
           [variant(f'KK-ZW-ST-{code(m)}-{"S" if "Start" in u else "U"}', [m, u], p, 9000 if 'Start' in u else 6000, None, tracked=False) for m, u, p in SW],
           [img('zijwand-stretchtent-hero.webp', 'hero', 1, 'sideWall', {'length': 3, 'height': 2.3, 'type': 'panorama', 'color': 'zwart', 'material': 'pvc', 'poles': 2}, 'hero', 'Zwart', 'existing')],
           {'kenmerk_kort': 'Zwart PVC 580 g/m² · raamfolie · aan elkaar te koppelen', 'levertijd': 'Levertijd 2–3 weken', 'verzending': 'pallet',
            'past_op': ['stretchtent-compleet']},
           ['stretchtenten.stretch-zijwanden'], 'stretch', 'Startwand (met eigen palen) plus uitbreidingswanden: zo bouw je een dichte zijde.',
           ['zijwand stretchtent'], {'outmate': '2 m START €425 / UITBR. €375 · 3 m €489 / €439', 'ours': {f'{m} {u}': p for m, u, p in SW}})
    # Merchandising review 3: the koppelgoot (€ 69,95–€ 119) was one Uitvoering among € 4,49 oogmoeren, behind one image and a 'vanaf'
    # price; it is its own product now (own title, SEO and image, like the reference sells it per URL). The small parts keep one
    # product, each Uitvoering with its own image.
    SO = [('Spanband met ratel', 6.95, 'SPR', 700, 'spanband'), ('Touwenset 3-punts met RVS karabijnen', 49.95, 'TS3', 2500, 'touwenset'),
          ('Paalverbinder met bout', 4.49, 'PV', 300, 'paalverbinder'), ('Oogmoeren M12 (4 stuks)', 5.95, 'OM4', 200, 'oogmoeren')]
    SO_IMG = {n: f'onderdelen-stretchtent-{slug(n.split(" (")[0])}.webp' for n, _, _, _, _ in SO}
    simple('onderdelen-stretchtent', 'Onderdelen stretchtent', 'Stretchtent onderdeel', ['zakelijk'], [opt('Uitvoering', [s_[0] for s_ in SO])],
           [variant(f'KK-STR-OND-{c}', [n], p, g, inv(15, c)) for n, p, c, g, _ in SO],
           [img('onderdelen-stretchtent-hero.webp', 'hero', 1, 'stretchParts', {'parts': ['spanband', 'touwenset', 'paalverbinder']}, 'hero', None, 'needs-model')] +
           [img(SO_IMG[n], 'variant', 2, 'stretchParts', {'parts': [part]}, 'hero', None, 'existing') for n, _, _, _, part in SO],
           {'kenmerk_kort': 'Spanbanden, touwensets, paalverbinders en oogmoeren', 'verzending': 'pakket', 'past_op': ['stretchtent-compleet', 'stretchdoek-los']},
           ['stretchtenten.stretch-onderdelen'], 'stretch', 'Losse onderdelen om een stretchdoek af te spannen en te bevestigen; per onderdeel een eigen foto.',
           ['onderdelen stretchtent', 'spanband stretchtent', 'touwenset stretchtent'], {'outmate': 'touwenset €59,95 · spanband €7,95 · paalconnector €4,99', 'ours': {s_[0]: s_[1] for s_ in SO}},
           vmap=SO_IMG, vby='Uitvoering')
    KG = [('3 m', 69.95, 'KG3', 2200), ('6 m', 119.0, 'KG6', 4200)]
    simple('koppelgoot-stretchtent', 'Koppelgoot stretchtent', 'Stretchtent onderdeel', ['zakelijk', 'gebruik:evenement'], [opt('Maat', [k[0] for k in KG])],
           [variant(f'KK-STR-OND-{c}', [m], p, g, inv(15, c)) for m, p, c, g in KG],
           [img('koppelgoot-stretchtent-hero.webp', 'hero', 1, 'rainGutter', {'length': 6, 'color': 'zwart', 'width': 0.6}, 'hero', None, 'existing',
                alt='opgerold, het losse eind open als goot')],
           {'kenmerk_kort': 'Verbindt twee stretchtenten waterdicht · PVC · 3 of 6 m', 'verzending': 'pakket', 'past_op': ['stretchtent-compleet', 'stretchdoek-los'],
            'specificaties': [sp('Goot', 'Materiaal', 'PVC 650 g/m², gelast'), sp('Goot', 'Breedte', 'ca. 60 cm'), sp('Bevestiging', 'Aan het doek', 'Klittenband langs beide randen')]},
           ['stretchtenten.stretch-koppelgoten'], 'stretch', 'Twee stretchtenten tegen elkaar: de goot sluit de naad, het water loopt naar de uiteinden; 3 of 6 m; alleen tussen TWEE tenten.',
           ['koppelgoot stretchtent', 'regengoot stretchtent', 'stretchtenten koppelen'], {'outmate': 'koppelgoot stretchtent (per URL)', 'ours': {k[0]: k[1] for k in KG}})
    PL = [('2,5 m', 'Kastanjehout', 59.95), ('3 m', 'Kastanjehout', 69.95), ('4 m', 'Kastanjehout', 89.95),
          ('2,5 m', 'Aluminium', 79.95), ('3 m', 'Aluminium', 94.95), ('4 m', 'Aluminium', 119.0)]
    simple('palen-stretchtent', 'Palen stretchtent', 'Stretchtent onderdeel', ['zakelijk'], [opt('Maat', ['2,5 m', '3 m', '4 m']), opt('Uitvoering', ['Kastanjehout', 'Aluminium'])],
           [variant(f'KK-STR-PAAL-{code(m)}-{"HT" if u == "Kastanjehout" else "AL"}', [m, u], p, 8000 if u == 'Kastanjehout' else 4500, inv(8, m + u)) for m, u, p in PL],
           [img('palen-stretchtent-hero.webp', 'hero', 1, 'tentPoles', {'material': 'hout', 'length': 3, 'count': 2}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Kastanjehout Ø 80–100 mm of aluminium Ø 50 mm', 'verzending': 'pallet', 'past_op': ['stretchtent-compleet', 'stretchdoek-los']},
           ['stretchtenten.stretch-palensets'], 'stretch', 'Losse palen of uitbreiding van je palenset; hout (sfeer) of aluminium (licht).',
           ['palen stretchtent', 'stretchtent paal'], {'note': 'geen referentieprijs gevonden'})
    HY = {'4,5 x 4,5 m': 995, '6 x 6 m': 1395, '7,5 x 7,5 m': 1895}
    HK = ['Zandkleur', 'Wit', 'Taupe']
    vs = [variant(f'KK-TENT-HYP-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 25000 + 9000 * i, None, tracked=False) for i, (m, p) in enumerate(HY.items()) for k in HK]
    imgs, vmap = kleur_images('hypar-schaduwzeil-stretch', HK, 'stretchtent', lambda k: {'w': 6, 'd': 6, 'color': render_color(k), 'shape': 'hypar', 'poles': 'alu'}, 'Zandkleur', status='needs-param', p2=3)
    simple('hypar-schaduwzeil-stretch', 'Hypar schaduwzeil stretch', 'Stretchtent', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(HY)), opt('Kleur', HK)], vs, imgs,
           {'kenmerk_kort': 'Gedraaid stretchzeil op 4 palen · voor terras en tuin', 'levertijd': 'Levertijd 5–7 weken', 'verzending': 'pallet'},
           ['stretchtenten.hypar-shadow'], 'stretch', 'Schaduw met de stretch-look voor terras of tuin; twee hoge en twee lage punten.',
           ['hypar schaduwzeil', 'stretch schaduwdoek'], {'note': 'geen referentieprijs gevonden', 'ours': HY}, vmap=vmap)

    # ------------------------------------------------------------ stertenten
    # Uitvoering 'Full colour bedrukt' = sublimatieprint op wit doek (drukproef vooraf); effen in de stockkleuren.
    STU = ['Effen doek', 'Full colour bedrukt']
    STK = ['Wit', 'Zwart', 'Zandkleur']
    # full colour: the surcharge on the plain tent grows with the cloth area (Ø8 +950 · Ø10 +1.070 · Ø12 +1.100 · Ø14 +1.170 · Ø16 +1.220)
    ST1 = {'Ø8 m': (899, 989, 53, 1849), 'Ø10 m': (979, 1029, 58, 2049), 'Ø12 m': (1149, 1225, 62, 2249), 'Ø14 m': (1279, 1350, 67, 2449), 'Ø16 m': (1429, 1500, 75, 2649)}
    vs = []
    for m, (p, om, kg, fc) in ST1.items():
        vs += [variant(f'KK-TENT-SR-{code(m)}-{COLOR_CODE[k]}', [m, STU[0], k], p, kg * 1000, inv(2, m + k)) for k in STK]
        vs.append(variant(f'KK-TENT-SR-{code(m)}-FC-WIT', [m, STU[1], 'Wit'], fc, (kg + 1) * 1000, None, tracked=False))
    imgs, vmap = kleur_images('stertent-enkele-mast', STK, 'stertent', lambda k: {'diameter': 10, 'points': 6, 'height': 5, 'color': render_color(k)}, 'Wit', p2=2)
    fc1 = 'stertent-enkele-mast-full-colour.webp'
    imgs.append(img(fc1, 'variant', 2, 'stertent', {'diameter': 10, 'points': 6, 'height': 5, 'color': 'wit', 'canopyPrint': {'artwork': 'brand/img/voorbeeld-fullcolour.png'}},
                    'hero', 'Wit', 'needs-param', alt='full colour bedrukt met een voorbeeldontwerp'))
    simple('stertent-enkele-mast', 'Stertent enkele mast', 'Stertent', ['zakelijk', 'pallet', 'bedrukbaar', 'gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Maat', list(ST1)), opt('Uitvoering', STU), opt('Kleur', STK)], vs, imgs,
           {'kenmerk_kort': 'Aluminium mast 75 mm · 320 g/m² doek · 1 mast',
            'specificaties': [sp('Mast', 'Materiaal', 'Geanodiseerd aluminium Ø 75 mm, wand 2,5 mm, telescopisch'), sp('Doek', 'Materiaal', 'Polyester PVC-gecoat 320 g/m²'),
                              sp('Levering', 'Inbegrepen', 'Doek, mast, haringen 50 cm, opbergtas, onderdelenzak, meetkoord')],
            'bedrukbaar': True,
            'drukopties': {'posities': ['Dak (alle vlakken)'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1,
                           'optie': 'Uitvoering', 'zonder': ['Effen doek']},
            'verzending': 'pallet', 'garantie': '1 jaar op mast en doek', 'staffelkorting': ST_GROOT},
           ['stertenten.stertent-rond'], 'ster', 'Opvallende vorm met één mast: maten met ingang en capaciteit, opzetten met meetkoord, met 2 personen; effen of full colour bedrukt.',
           ['stertent kopen', 'stertent 10 meter', 'stertent bedrukt'],
           {'outmate': {m: v[1] for m, v in ST1.items()}, 'outmate_full_colour': 'Ø8 tot €2.071 · Ø10 tot €2.299 · Ø14 tot €2.588 · Ø16 tot €3.278',
            'ours': {m: v[0] for m, v in ST1.items()}, 'ours_full_colour': {m: v[3] for m, v in ST1.items()}}, vmap=vmap,
           extra={'variant_image_sku': {f'KK-TENT-SR-{code(m)}-FC-WIT': fc1 for m in ST1}})
    ST2 = {'8 x 13 m': (2295, 2500, 106, 3899), '10 x 16 m': (2649, 2900, 130, 4549), '12 x 19 m': (2949, 3200, 160, 5149), '13 x 21 m': (3249, 3500, 185, 5649)}
    STK2 = ['Wit', 'Zandkleur']
    vs = []
    for m, (p, om, kg, fc) in ST2.items():
        vs += [variant(f'KK-TENT-SRD-{code(m)}-{COLOR_CODE[k]}', [m, STU[0], k], p, kg * 1000, None, tracked=False) for k in STK2]
        vs.append(variant(f'KK-TENT-SRD-{code(m)}-FC-WIT', [m, STU[1], 'Wit'], fc, (kg + 2) * 1000, None, tracked=False))
    imgs, vmap = kleur_images('stertent-dubbele-mast', STK2, 'stertent', lambda k: {'diameter': 10, 'length': 16, 'masts': 2, 'points': 8, 'height': 6, 'color': render_color(k)}, 'Wit', status='needs-param', p2=3)
    fc2 = 'stertent-dubbele-mast-full-colour.webp'
    imgs.append(img(fc2, 'variant', 3, 'stertent', {'diameter': 10, 'length': 16, 'masts': 2, 'points': 8, 'height': 6, 'color': 'wit',
                                                    'canopyPrint': {'artwork': 'brand/img/voorbeeld-fullcolour.png'}}, 'hero', 'Wit', 'needs-param',
                    alt='full colour bedrukt met een voorbeeldontwerp'))
    simple('stertent-dubbele-mast', 'Stertent dubbele mast', 'Stertent', ['zakelijk', 'pallet', 'bedrukbaar', 'gebruik:evenement'],
           [opt('Maat', list(ST2)), opt('Uitvoering', STU), opt('Kleur', STK2)], vs, imgs,
           {'kenmerk_kort': '2 aluminium masten · 320 g/m² doek · tot 150 personen staand', 'levertijd': 'Levertijd 2–3 weken', 'verzending': 'pallet',
            'bedrukbaar': True, 'staffelkorting': ST_GROOT,
            'drukopties': {'posities': ['Dak (alle vlakken)'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1,
                           'optie': 'Uitvoering', 'zonder': ['Effen doek']}},
           ['stertenten.stertent-dubbelmast'], 'ster', 'Langgerekte stertent voor grotere groepen: capaciteit per maat, opzetten met 2–3 personen in een half uur; effen of full colour bedrukt.',
           ['stertent dubbele mast', 'stertent 8x13'], {'outmate': {m: v[1] for m, v in ST2.items()}, 'ours': {m: v[0] for m, v in ST2.items()},
                                                         'ours_full_colour': {m: v[3] for m, v in ST2.items()}}, vmap=vmap,
           extra={'variant_image_sku': {f'KK-TENT-SRD-{code(m)}-FC-WIT': fc2 for m in ST2}})
    # walls: per vak (los) or the full set, for every enkele-mast diameter and every dubbelmast size
    SZ = {'Ø8 m': (125, 429), 'Ø10 m': (135, 509), 'Ø12 m': (145, 619), 'Ø14 m': (155, 729), 'Ø16 m': (165, 839),
          '8 x 13 m': (189, 649), '10 x 16 m': (199, 749), '12 x 19 m': (209, 869), '13 x 21 m': (219, 949)}
    # per vak dicht, met raam or met oproldeur (dicht € 10 under the raam, oproldeur € 20 over), or the set rondom
    SZU = [('Losse wand dicht', 'LD', -10, 2800), ('Losse wand met raam', 'L', 0, 3000), ('Losse wand met oproldeur', 'LOD', 20, 3300), ('Set rondom', 'SET', None, None)]
    vs = [variant(f'KK-ZW-SR-{code(m)}-{c}', [m, u], (v[0] + d) if d is not None else v[1], g if g else 30000 + 4000 * j, inv(3 if d is not None else 1, m + u))
          for j, (m, v) in enumerate(SZ.items()) for u, c, d, g in SZU]
    simple('zijwanden-stertent', 'Zijwanden stertent', 'Stertent zijwand', ['zakelijk'], [opt('Maat', list(SZ)), opt('Uitvoering', [u[0] for u in SZU])], vs,
           [img('zijwanden-stertent-hero.webp', 'hero', 1, 'stertent', {'diameter': 10, 'points': 6, 'height': 5, 'color': 'wit', 'walls': 'panorama'}, 'hero', 'Wit', 'needs-param')],
           {'kenmerk_kort': '215 cm hoog · per vak dicht, raam of oproldeur, of rondom', 'verzending': 'pakket', 'past_op': ['stertent-enkele-mast', 'stertent-dubbele-mast'],
            'staffelkorting': ST_GROOT},
           ['stertenten.stertent-zijwanden'], 'ster', 'Wanden rondom of per vak: set (panorama + oproldeuren) of los; voor enkele mast Ø8–Ø16 m en dubbele mast.',
           ['zijwanden stertent'], {'outmate': 'los 8 m €139 · set 8 m €475 · 10 m €559 · 12 m €675 · 14 m €799 · dubbelmast per wand €210–€339', 'ours': SZ})

    # ------------------------------------------------------------ opblaasbaar
    AK = ['Rood', 'Wit', 'Zwart', 'Blauw', 'Groen', 'Oranje', 'Geel', 'Grijs']   # Geel and Grijs: frame colours the reference also sells
    AU = ['Dak in framekleur', 'Full colour bedrukt dak']
    def air(h, c, title, sizes, extra_fc, brief, covers, om, kw, w_default=3):
        vs = []
        for i, (m, (p, kg)) in enumerate(sizes.items()):
            for j, u in enumerate(AU):
                for k in AK:
                    sku = f'KK-AIR-{c}-{code(m)}-{"K" if j == 0 else "FC"}-{COLOR_CODE[k]}'
                    vs.append(variant(sku, [m, u, k], ladder(p + extra_fc[i]) if j else p, kg * 1000, None, tracked=False))
        imgs, vmap = kleur_images(h, AK, 'opblaasbareTent', lambda k: {'w': w_default, 'color': render_color(k), 'canopyColor': render_color(k), **render_finish(k)}, 'Rood', p2=3)
        imgs.append(img(f'{h}-full-colour.webp', 'variant', 2, 'opblaasbareTent', {'w': w_default, 'color': 'wit', 'canopyPrint': {'artwork': 'brand/img/voorbeeld-fullcolour.png'}}, 'hero', None, 'needs-param',
                        alt='met voorbeeldontwerp op het dak'))
        simple(h, title, 'Opblaasbare tent', ['zakelijk', 'bedrukbaar', 'gebruik:evenement', 'gebruik:markt'], [opt('Maat', list(sizes)), opt('Uitvoering', AU), opt('Kleur', AK)], vs, imgs,
               {'kenmerk_kort': 'Luchtframe · in 5–10 minuten staand · dak in kleur of full colour', 'bedrukbaar': True,
                'drukopties': {'posities': ['Dak (alle vlakken)'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1,
                               'optie': 'Uitvoering', 'zonder': ['Dak in framekleur']},
                'specificaties': [sp('Frame', 'Luchtkamers', 'TPU-binnenbuis 250 micron in Dacron 170 g/m², overdrukventielen'), sp('Dak', 'Materiaal', '600D polyester, PU-gecoat'),
                                  sp('Levering', 'Inbegrepen', '4 zandzakken, 4 scheerlijnen, 4 haringen, draagtas; pomp apart')],
                'levertijd': 'Levertijd 2–3 weken (bedrukt: ' + LT_DRUK + ')', 'verzending': 'pakket' if w_default <= 3 else 'pallet', 'staffelkorting': ST_TENT,
                'vergelijk_groep': 'opblaasbare-tent', 'addons': ['pomp-opblaasbare-tent']},
               covers, 'opblaasbaar', brief, kw, {'outmate': om, 'ours': {m: v[0] for m, v in sizes.items()}}, vmap=vmap)
    air('opblaasbare-promotietent', 'PT', 'Opblaasbare promotietent', {'3 x 3 m': (1095, 17), '4 x 4 m': (1595, 24), '5 x 5 m': (2149, 32), '6 x 6 m': (2795, 40)}, [249, 349, 449, 549],
        'Promotietent zonder buizen: opblazen, verzwaren, klaar; frame- en dakkleur of full colour dak met drukproef; pomp apart.', ['opblaasbare-tenten.air-square'],
        '3x3 €1.250 · 4x4 €1.829 · 5x5 €2.450 · 6x6 €3.150', ['opblaasbare partytent', 'opblaasbare promotietent', 'air tent'])
    air('opblaasbare-promotietent-pro', 'PTP', 'Opblaasbare promotietent Pro', {'4 x 4 m': (2249, 20), '5 x 5 m': (2949, 35), '6 x 6 m': (3349, 49)}, [349, 449, 549],
        'Pro-versie met hogere doorloop (tot 270 cm) en dikkere luchtkamers voor beurzen en sportevents.', ['opblaasbare-tenten.air-beta'],
        '4x4 €2.525 · 5x5 €3.325 · 6x6 €3.745', ['opblaasbare eventtent', 'opblaasbare tent pro'], w_default=4)
    WK = ['Wit', 'Zwart', 'Antraciet']
    # 3 x 3 m and the extended 3 x 4,5 / 3 x 6 m (extra pair of water legs per 1,5 m); handle kept, title without the size
    WPM = {'3 x 3 m': (1349.0, 22000), '3 x 4,5 m': (1749.0, 29000), '3 x 6 m': (2149.0, 36000)}
    vs = [variant(f'KK-AIR-WP-{code(m)}-{COLOR_CODE[k]}', [m, k], pr, g, None, tracked=False) for m, (pr, g) in WPM.items() for k in WK]
    # handle renamed (it also sells 3 x 4,5 and 3 x 6 m; redirect from the old URL in export/redirects.csv); render files keep their names
    imgs, vmap = kleur_images('opblaasbare-partytent-3x3-waterpoten', WK, 'opblaasbareTent', lambda k: {'w': 3, 'legs': 'water', 'height': 3.2, 'color': render_color(k)}, 'Wit', status='needs-param', p2=3)
    simple('opblaasbare-partytent-met-waterpoten', 'Opblaasbare partytent met waterpoten', 'Opblaasbare tent', ['gebruik:tuinfeest', 'gebruik:evenement'],
           [opt('Maat', list(WPM)), opt('Kleur', WK)], vs, imgs,
           {'kenmerk_kort': 'Hogedruk-staanders · met water te verzwaren · rugzak', 'verzending': 'pakket', 'levertijd': 'Levertijd 2–3 weken', 'vergelijk_groep': 'opblaasbare-tent',
            'addons': ['pomp-opblaasbare-tent']},
           ['opblaasbare-tenten.air-partytent'], 'opblaasbaar', 'Partytent met opblaasbare poten die je met water verzwaart; uit te breiden met wanden.',
           ['opblaasbare partytent 3x3', 'opblaasbare partytent 3x6'], {'outmate': '3x3 €1.529 (actie, was €1.699); 3x4,5 en 3x6 als uitbreiding', 'ours': {m: v[0] for m, v in WPM.items()}})
    ZH = {'8 x 8 m': 4495, '10 x 10 m': 6495, '12 x 12 m': 8995}
    ZK = ['Wit', 'Zwart', 'Rood', 'Blauw']
    vs = [variant(f'KK-AIR-HEX-{code(m)}-{COLOR_CODE[k]}', [m, k], p, (55 + 20 * i) * 1000, None, tracked=False) for i, (m, p) in enumerate(ZH.items()) for k in ZK]
    imgs, vmap = kleur_images('opblaasbare-zeshoektent', ZK, 'opblaasbareTent', lambda k: {'w': 8, 'shape': 'hexagon', 'color': render_color(k), **render_finish(k)}, 'Wit', status='needs-param', p2=3)
    # printed roof for the zeshoek is quoted (offerte), so the product is not bedrukbaar: no upload block, not in bedrukte-partytenten
    simple('opblaasbare-zeshoektent', 'Opblaasbare zeshoektent', 'Opblaasbare tent', ['zakelijk', 'pallet', 'gebruik:evenement'], [opt('Maat', list(ZH)), opt('Kleur', ZK)], vs, imgs,
           {'kenmerk_kort': 'Zes luchtpoten · tot 6 m hoog · dak met rits verwisselbaar',
            'levertijd': 'Levertijd 3–4 weken', 'verzending': 'pallet', 'vergelijk_groep': 'opblaasbare-tent', 'staffelkorting': ST_GROOT},
           ['opblaasbare-tenten.air-hexagon'], 'opblaasbaar', 'Grote opblaasbare blikvanger voor festivals en beurzen; dak verwisselbaar, luifels optioneel via offerte.',
           ['opblaasbare tent zeshoek', 'opblaasbare eventtent groot'], {'outmate': '8x8 €4.950 · 10x10 €7.250 · 12x12 €9.950', 'ours': ZH}, vmap=vmap)
    AW = {'3 m': (159, 179), '4 m': (189, 209), '5 m': (219, 239), '6 m': (249, 269)}
    vs = [variant(f'KK-ZW-AIR-{code(m)}-{"DI" if i == 0 else "DE"}', [m, u], v[i], 3000 + 800 * j, inv(3, m + u)) for j, (m, v) in enumerate(AW.items()) for i, u in enumerate(['Dicht', 'Met deur'])]
    simple('zijwand-opblaasbare-promotietent', 'Zijwand opblaasbare promotietent', 'Opblaasbare tent accessoire', ['zakelijk'], [opt('Maat', list(AW)), opt('Uitvoering', ['Dicht', 'Met deur'])], vs,
           [img('zijwand-opblaasbare-promotietent-hero.webp', 'hero', 1, 'opblaasbareTent', {'w': 3, 'color': 'wit', 'walls': {'back': 'closed'}}, 'hero', 'Wit', 'needs-param',
                alt='aan een opblaasbare promotietent (tent niet inbegrepen)')],
           {'kenmerk_kort': 'Met rits aan het luchtframe · dicht of met deur', 'verzending': 'pakket',
            'past_op': ['opblaasbare-promotietent', 'opblaasbare-promotietent-pro', 'opblaasbare-partytent-met-waterpoten']},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar', 'Wand per zijde met rits; ook bedrukbaar via offerte.', ['zijwand opblaasbare tent'],
           {'outmate': 'zijwand dicht €179 · raam/deur €199', 'ours': AW})
    simple('pomp-opblaasbare-tent', 'Pomp voor opblaasbare tent', 'Opblaasbare tent accessoire', ['zakelijk'], [opt('Uitvoering', ['Elektrische pomp', 'Handpomp'])],
           [variant('KK-AIR-POMP-EL', ['Elektrische pomp'], 69.95, 2200, 10), variant('KK-AIR-POMP-HA', ['Handpomp'], 34.95, 1500, 15)],
           [img('pomp-opblaasbare-tent-hero.webp', 'hero', 1, 'airPump', {'kind': 'elektrisch'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Elektrisch (230 V) of hand · met verloopstukken', 'verzending': 'pakket',
            'past_op': ['opblaasbare-promotietent', 'opblaasbare-promotietent-pro', 'opblaasbare-partytent-met-waterpoten', 'opblaasbare-zeshoektent']},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar', 'Elektrisch voor snel opbouwen, handpomp als reserve of zonder stroom.', ['pomp opblaasbare tent'],
           {'outmate': 'elektrisch €75 · hand €39', 'ours': {'Elektrische pomp': 69.95, 'Handpomp': 34.95}})
    AIR_SQ = ['opblaasbare-promotietent', 'opblaasbare-promotietent-pro', 'opblaasbare-partytent-met-waterpoten']
    # luifel per tentzijde, in de framekleuren van de promotietenten
    LF = {'3 m': 249, '4 m': 289, '5 m': 329, '6 m': 369}
    LFK = AK + ['Antraciet']
    vs = [variant(f'KK-AIR-LUIF-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 2600 + 500 * i, None, tracked=False) for i, (m, p) in enumerate(LF.items()) for k in LFK]
    imgs, vmap = kleur_images('luifel-opblaasbare-promotietent', LFK, 'opblaasbareTent', lambda k: {'w': 3, 'color': render_color(k), 'canopyColor': render_color(k), 'awning': 'front'},
                              'Rood', status='needs-param', p2=3)
    simple('luifel-opblaasbare-promotietent', 'Luifel voor opblaasbare promotietent', 'Opblaasbare tent accessoire', ['zakelijk', 'gebruik:evenement', 'gebruik:markt'],
           [opt('Maat', list(LF)), opt('Kleur', LFK)], vs, imgs,
           {'kenmerk_kort': 'Opblaasbare luifel per zijde · met rits aan het frame · 1 m diep', 'verzending': 'pakket', 'levertijd': 'Levertijd 2–3 weken',
            'past_op': AIR_SQ,
            'specificaties': [sp('Luifel', 'Diepte', 'ca. 100 cm'), sp('Luifel', 'Frame', 'Eigen luchtkamer met ventiel, opblazen met dezelfde pomp'),
                              sp('Luifel', 'Doek', '600D polyester, PU-gecoat'), sp('Bevestiging', 'Aan de tent', 'Rits en klittenband langs de dakrand')]},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar',
           'Extra schaduw en droogte voor de ingang van je promotietent: luifel per zijde, maat = zijde van de tent, zelfde kleuren als de frames.',
           ['luifel opblaasbare tent', 'luifel promotietent'], {'note': 'Outmate verkoopt luifels (prijs niet gevonden)', 'ours': LF}, vmap=vmap)
    TU = {'3 m breed': 449, '4 m breed': 529}
    TUK = ['Wit', 'Zwart']
    vs = [variant(f'KK-AIR-TUN-{code(m.split()[0] + " m")}-{COLOR_CODE[k]}', [m, k], p, 9000 + 2000 * i, None, tracked=False) for i, (m, p) in enumerate(TU.items()) for k in TUK]
    imgs, vmap = kleur_images('verbindingstunnel-opblaasbare-tent', TUK, 'items', lambda k: {'items': [
        {'model': 'opblaasbareTent', 'w': 3, 'color': render_color(k), 'position': [-2.2, 0, 0]},
        {'model': 'opblaasbareTent', 'w': 3, 'color': render_color(k), 'position': [2.2, 0, 0]}], 'tunnel': {'length': 1.4, 'color': render_color(k)}},
        'Wit', status='needs-model', p2=3)
    simple('verbindingstunnel-opblaasbare-tent', 'Verbindingstunnel voor opblaasbare tenten', 'Opblaasbare tent accessoire', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', list(TU)), opt('Kleur', TUK)], vs, imgs,
           {'kenmerk_kort': 'Droge doorloop tussen twee opblaasbare tenten · ca. 140 cm lang', 'verzending': 'pakket', 'levertijd': 'Levertijd 2–3 weken',
            'past_op': AIR_SQ,
            'specificaties': [sp('Tunnel', 'Lengte', 'ca. 140 cm tussen de tenten'), sp('Tunnel', 'Breedte', '3 of 4 m (de zijde waarop je koppelt)'),
                              sp('Tunnel', 'Frame', 'Twee luchtbogen met ventiel'), sp('Bevestiging', 'Aan de tent', 'Rits langs de dakrand van beide tenten')]},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar',
           'Twee opblaasbare tenten tot één ruimte koppelen: droog van de ene naar de andere tent, breedte = zijde waarop je koppelt.',
           ['verbindingstunnel opblaasbare tent', 'opblaasbare tenten koppelen'], {'note': 'Outmate verkoopt tunnels (prijs niet gevonden)', 'ours': TU}, vmap=vmap)
    OB = {'3 x 3 m': 69.0, '4 x 4 m': 79.0, '5 x 5 m': 89.0, '6 x 6 m': 99.0}
    simple('opbergtas-opblaasbare-tent', 'Opbergtas met wielen voor opblaasbare tent', 'Opblaasbare tent accessoire', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', list(OB))], [variant(f'KK-AIR-TAS-{code(m)}', [m], p, 2400 + 400 * i, inv(4, m + 'airtas')) for i, (m, p) in enumerate(OB.items())],
           [img('opbergtas-opblaasbare-tent-hero.webp', 'hero', 1, 'draagtas', {'height': 1.0, 'color': 'zwart', 'wheels': True, 'shape': 'duffel'}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': '600D polyester · 2 wielen en trekgreep · maat = tentmaat', 'verzending': 'pakket', 'past_op': AIR_SQ,
            'specificaties': [sp('Tas', 'Materiaal', '600D polyester, PVC-gecoat, zwart'), sp('Tas', 'Sluiting', 'Rits rondom, 2 compressiebanden'),
                              sp('Tas', 'Rijden', '2 wielen en een uitschuifbare trekgreep')]},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar',
           'Vervangende of extra tas voor een opblaasbare tent: leeggelopen tent, pomp en zandzakken in één tas; rijden in plaats van tillen.',
           ['tas opblaasbare tent', 'opbergtas promotietent'], {'ours': OB})
    simple('led-verlichting-opblaasbare-tent', 'LED-verlichting 12 W voor opblaasbare tent', 'Tentverlichting', ['zakelijk', 'gebruik:evenement', 'gebruik:markt'], [],
           [variant('KK-AIR-LED-12W', [], 104.95, 900, 12)],
           [img('led-verlichting-opblaasbare-tent-hero.webp', 'hero', 1, 'tentLight', {'watt': 12, 'kind': 'air'}, 'hero', None, 'existing'),
            img('led-verlichting-opblaasbare-tent-in-tent.webp', 'in-gebruik', 3, 'opblaasbareTent', {'w': 3, 'color': 'wit', 'light': {'watt': 12, 'on': True}}, 'low', 'Wit', 'needs-param',
                alt='in een opblaasbare promotietent (tent niet inbegrepen)')],
           {'kenmerk_kort': '12 W LED · ca. 1.200 lumen · klittenband aan het luchtframe', 'verzending': 'pakket', 'past_op': AIR_SQ + ['opblaasbare-zeshoektent'],
            'staffelkorting': ST_TEXTIEL, 'garantie': '1 jaar',
            'specificaties': [sp('Lamp', 'Vermogen', '12 W LED'), sp('Lamp', 'Lichtstroom', 'ca. 1.200 lumen, 4000 K'), sp('Lamp', 'Beschermingsklasse', 'IP44'),
                              sp('Bevestiging', 'Aan de tent', 'Klittenbandlus om het luchtframe, onder de nok'), sp('Aansluiting', 'Kabel', '5 m met stekker, 230 V')]},
           ['opblaasbare-tenten.air-accessoires', 'verlichting.prikkabels'], 'opblaasbaar',
           'Licht in je opblaasbare tent op een avondevent of beurs: 12 W LED onder de nok, klittenband om het luchtframe, 5 m kabel; geen gereedschap.',
           ['verlichting opblaasbare tent', 'led lamp promotietent', 'tentverlichting opblaasbaar'],
           {'outmate': 'LED-verlichting 12 W voor opblaasbare tenten €119', 'ours': 104.95})
    ZHW = {'8 x 8 m': (349, 379), '10 x 10 m': (419, 449), '12 x 12 m': (489, 519)}
    ZWK = ['Wit', 'Zwart', 'Rood', 'Blauw']   # the 4 colours of the zeshoektent (merchandising review: Rood / Blauw tents got Wit walls)
    vs = [variant(f'KK-ZW-HEX-{code(m)}-{"DI" if i == 0 else "DE"}-{COLOR_CODE[k]}', [m, u, k], v[i], 6000 + 1500 * j, None, tracked=False)
          for j, (m, v) in enumerate(ZHW.items()) for i, u in enumerate(['Dicht', 'Met deur']) for k in ZWK]
    imgs, vmap = kleur_images('zijwand-opblaasbare-zeshoektent', ZWK, 'opblaasbareTent', lambda k: {'w': 8, 'shape': 'hexagon', 'color': render_color(k), 'walls': {'back': 'closed'}},
                              'Wit', status='needs-param', p2=3)
    simple('zijwand-opblaasbare-zeshoektent', 'Zijwand opblaasbare zeshoektent', 'Opblaasbare tent accessoire', ['zakelijk', 'gebruik:evenement'],
           [opt('Maat', list(ZHW)), opt('Uitvoering', ['Dicht', 'Met deur']), opt('Kleur', ZWK)], vs, imgs,
           {'kenmerk_kort': 'Eén wand per vak · rits aan het luchtframe · dicht of met deur', 'verzending': 'pakket', 'levertijd': 'Levertijd 2–3 weken',
            'past_op': ['opblaasbare-zeshoektent'],
            'specificaties': [sp('Wand', 'Doek', '600D polyester, PU-gecoat'), sp('Wand', 'Bevestiging', 'Rits langs poten en dakrand'),
                              sp('Wand', 'Met deur', 'Rits in het midden, op te rollen met 2 banden'), sp('Maat', 'Kies', 'De maat van je zeshoektent; 1 wand = 1 van de 6 vakken')]},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar',
           'Wand voor één vak van de zeshoektent (dicht of met deur): achterwand als windscherm of de hele tent rondom dicht; maat = tentmaat.',
           ['zijwand zeshoektent', 'zijwand opblaasbare eventtent'], {'note': 'geen referentieprijs gevonden', 'ours': ZHW}, vmap=vmap)

    # ------------------------------------------------------------ schaduw & overkapping
    SCH = {'3 x 3 m': (34.95, 39.95), '4 x 4 m': (44.95, 54.95), '5 x 5 m': (59.95, 74.95), '5 x 3 m': (49.95, 59.95), '6 x 4 m': (59.95, 74.95),
           '3 x 3 x 3 m': (27.95, 32.95), '5 x 5 x 5 m': (42.95, 52.95)}
    SCK = ['Antraciet', 'Zandkleur']
    vs = [variant(f'KK-SCH-{code(m)}-{"WD" if i == 0 else "WDI"}-{COLOR_CODE[k]}', [m, u, k], v[i], 1500 + 300 * j, inv(6, m + u + k))
          for j, (m, v) in enumerate(SCH.items()) for i, u in enumerate(['Waterdoorlatend', 'Waterdicht']) for k in SCK]
    imgs, vmap = kleur_images('schaduwdoek', SCK, 'shadeSail', lambda k: {'shape': 'vierkant', 'w': 4, 'd': 4, 'color': render_color(k)}, 'Antraciet', status='needs-model', p2=3)
    simple('schaduwdoek', 'Schaduwdoek', 'Schaduwdoek', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:horeca'], [opt('Maat', list(SCH)), opt('Uitvoering', ['Waterdoorlatend', 'Waterdicht']), opt('Kleur', SCK)], vs, imgs,
           {'kenmerk_kort': 'HDPE 95% UV-blokkering of waterdicht polyester · RVS-ringen', 'verzending': 'pakket',
            'specificaties': [sp('Doek', 'Waterdoorlatend', 'HDPE, blokkeert ca. 95% UV'), sp('Doek', 'Waterdicht', 'PU-gecoat polyester; span met min. 30° helling')]},
           ['schaduw-overkapping.schaduwdoeken'], 'schaduw', 'Schaduw voor tuin en terras: verschil waterdoorlatend/waterdicht (helling!), vierkant vs driehoek, ophangpunten.',
           ['schaduwdoek', 'schaduwdoek waterdicht', 'schaduwdoek driehoek'], {'outmate': '3x3 €39 · 5x3 €59 · 5x5 €69', 'ours': SCH}, vmap=vmap)
    OKK = ['Wit', 'Antraciet', 'Zwart', 'Transparant']
    vs = [variant(f'KK-OVK-OM-{COLOR_CODE[k]}', [k], 32.95, 600, None, tracked=False, policy='continue', qrule={'min': 2, 'max': 200, 'increment': 1}) for k in OKK]
    simple('overkappingzeil-op-maat', 'Overkappingzeil op maat (per m²)', 'Overkapping', ['zakelijk', 'gebruik:horeca'], [opt('Kleur', OKK)], vs,
           [img('overkappingzeil-op-maat-hero.webp', 'hero', 1, 'tarp', {'w': 4, 'h': 2.5, 'color': 'transparant', 'eyelets': True}, 'hero', 'Transparant', 'needs-model')]
           + [img(f'overkappingzeil-op-maat-{slug(k)}-hero.webp', 'variant', 3, 'tarp', {'w': 4, 'h': 2.5, 'color': render_color(k), 'eyelets': True}, 'hero', k, 'existing')
              for k in OKK if k != 'Transparant'],
           {'kenmerk_kort': 'PVC 580 g/m² op maat · prijs per m² · ogen rondom', 'levertijd': 'Levertijd 3–5 weken', 'verzending': 'pakket'},
           ['schaduw-overkapping.overkapping-zeil-op-maat'], 'schaduw',
           'Zeil voor veranda of overkapping op jouw maat: breedte × hoogte in m in de configurator, aantal = m² (afgerond, min. 2 m²); maatwerk kan niet retour.',
           ['overkapping zeil op maat', 'veranda zeil'], {'outmate': 'vanaf €35 (configurator, maatwerk geen retour)', 'ours': '€32,95 per m², min. 2 m²'},
           vmap={k: ('overkappingzeil-op-maat-hero.webp' if k == 'Transparant' else f'overkappingzeil-op-maat-{slug(k)}-hero.webp') for k in OKK})
    OZ = {'3 m': 99, '4 m': 135, '6 m': 175, '8 m': 229, '10 m': 249}
    OZK = ['Wit', 'Antraciet']
    vs = [variant(f'KK-OVK-ZW-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 3500 + 1500 * i, inv(3, m + k)) for i, (m, p) in enumerate(OZ.items()) for k in OZK]
    imgs, vmap = kleur_images('zijwand-overkapping-pvc', OZK, 'sideWall', lambda k: {'length': 4, 'height': 2.5, 'type': 'panorama', 'zips': True, 'rail': True, 'color': render_color(k), 'material': 'pvc'}, 'Wit', status='existing', p2=3)
    simple('zijwand-overkapping-pvc', 'Zijwand overkapping PVC met raam en ritsen', 'Overkapping', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(OZ)), opt('Kleur', OZK)], vs, imgs,
           {'kenmerk_kort': '250 cm hoog · PVC 550 g/m² · raam en ritsen', 'verzending': 'pakket'},
           ['schaduw-overkapping.overkapping-zijwanden'], 'schaduw', 'Wand voor veranda of terrasoverkapping: windvrij met zicht; lengtes 3–10 m.',
           ['zijwand overkapping', 'veranda zijwand pvc'], {'outmate': '3 m €109 · 4 m €149 · 6 m €189 · 8 m €249 · 10 m €269', 'ours': OZ}, vmap=vmap)
    simple('tuinpaviljoen-aluminium', 'Tuinpaviljoen aluminium met polycarbonaat dak', 'Overkapping', ['pallet', 'gebruik:tuinfeest'], [opt('Maat', ['3 x 3 m', '3 x 4 m']), opt('Kleur', ['Antraciet'])],
           [variant('KK-OVK-TP-3X3-ANT', ['3 x 3 m', 'Antraciet'], 649.0, 62000, 3), variant('KK-OVK-TP-3X4-ANT', ['3 x 4 m', 'Antraciet'], 749.0, 70000, 3)],
           [img('tuinpaviljoen-aluminium-hero.webp', 'hero', 1, 'gardenPavilion', {'w': 3, 'd': 4, 'color': 'antraciet', 'roof': 'polycarbonaat'}, 'hero', 'Antraciet', 'needs-model')],
           {'kenmerk_kort': 'Aluminium staanders 90 x 90 mm · 6 mm polycarbonaat · gordijnrails', 'verzending': 'pallet', 'levertijd': 'Levertijd 1–2 weken', 'garantie': '2 jaar op het frame'},
           ['schaduw-overkapping.tuinpaviljoen'], 'schaduw', 'Vaste tuinoverkapping die het hele seizoen blijft staan; zelf te monteren, verankeren in de grond.',
           ['tuinpaviljoen aluminium', 'paviljoen 3x4'], {'outmate': 'Lite 3x3 €695 · 3x4 €795–€865', 'ours': {'3 x 3 m': 649, '3 x 4 m': 749}})
    TZ = [('3 x 3 m', 'Dicht', 119), ('3 x 3 m', 'Muggengaas', 99), ('3 x 4 m', 'Dicht', 139), ('3 x 4 m', 'Muggengaas', 115)]
    simple('zijwanden-tuinpaviljoen', 'Zijwanden tuinpaviljoen', 'Overkapping', ['gebruik:tuinfeest'], [opt('Maat', ['3 x 3 m', '3 x 4 m']), opt('Uitvoering', ['Dicht', 'Muggengaas'])],
           [variant(f'KK-OVK-TPZ-{code(m)}-{"DI" if u == "Dicht" else "GAAS"}', [m, u], p, 4000, inv(3, m + u)) for m, u, p in TZ],
           [img('zijwanden-tuinpaviljoen-hero.webp', 'hero', 1, 'gardenPavilion', {'w': 3, 'd': 4, 'color': 'antraciet', 'curtains': 'half-open'}, 'hero', 'Antraciet', 'needs-model',
                alt='aan het tuinpaviljoen (paviljoen niet inbegrepen)')],
           {'kenmerk_kort': 'Gordijnen voor de dubbele rails · dicht of gaas', 'verzending': 'pakket', 'past_op': ['tuinpaviljoen-aluminium']},
           ['schaduw-overkapping.tuinpaviljoen-zijwanden'], 'schaduw', 'Set gordijnen rondom: dicht voor privacy, gaas tegen muggen.', ['zijwanden tuinpaviljoen'],
           {'note': 'geen referentieprijs gevonden'})
