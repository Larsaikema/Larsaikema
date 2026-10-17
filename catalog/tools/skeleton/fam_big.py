# Stretch-, ster- en opblaasbare tenten; schaduwdoeken, overkappingen en tuinpaviljoen.
from kk_base import *
from fam_acc import simple

def build():
    # ------------------------------------------------------------ stretch
    SK = ['Zandkleur', 'Taupe', 'Wit', 'Zwart']
    STC = {'4,5 x 6 m': (2395, 2630, 85), '6 x 6 m': (3095, 3425, 110), '6 x 10,5 m': (5195, 5805, 180), '7,5 x 10,5 m': (6195, 6830, 225),
           '9 x 10,5 m': (7395, 8149, 270), '10,5 x 15 m': (9895, 11710, 420)}
    PU = ['Houten palen', 'Aluminium palen']
    vs = [variant(f'KK-TENT-ST-{code(m)}-{"HT" if u == PU[0] else "AL"}-{COLOR_CODE[k]}', [m, u, k], p if u == PU[0] else round(p * 1.08 / 10) * 10 - 5,
                  kg * 1000, None, tracked=False) for m, (p, om, kg) in STC.items() for u in PU for k in SK]
    imgs, vmap = kleur_images('stretchtent-compleet', SK, 'stretchtent', lambda k: {'w': 6, 'd': 6, 'color': render_color(k), 'poles': 'hout', 'anchors': True}, 'Zandkleur',
                              [img('stretchtent-compleet-zandkleur-low.webp', 'detail', 3, 'stretchtent', {'w': 6, 'd': 6, 'color': 'zand', 'poles': 'hout'}, 'low', 'Zandkleur')], p2=2)
    simple('stretchtent-compleet', 'Stretchtent compleet met palen', 'Stretchtent', ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Maat', list(STC)), opt('Uitvoering', PU), opt('Kleur', SK)], vs, imgs,
           {'kenmerk_kort': 'Stretchdoek 750 g/m² · lussen elke 75 cm · palen en spanbanden inbegrepen',
            'specificaties': [sp('Doek', 'Materiaal', 'Elastisch polyester, PVC-gecoat, 750 g/m², waterdicht, UV-bestendig'), sp('Doek', 'Brandklasse', 'M2 (certificaat bij levering)'),
                              sp('Doek', 'Bevestiging', 'Lussen elke 75 cm'), sp('Levering', 'Inbegrepen', 'Doek, palenset, spanbanden met haringen, opbergtas'),
                              sp('Opzetten', 'Benodigd', 'Minimaal 2 m vrije ruimte rondom; 2–4 personen')],
            'levertijd': 'Levertijd 3–4 weken', 'verzending': 'pallet', 'staffelkorting': None, 'garantie': '1 jaar op het doek'},
           ['stretchtenten.stretch-compleet', 'stretchtenten.stretch-lusverbinding'], 'stretch',
           'Organische vorm voor horeca en events: hoe hoog en laag spannen werkt, wat erbij zit, ruimte rondom, opzettijd; verankering bij wind.',
           ['stretchtent kopen', 'stretchtent 6x6', 'stretch tent 10x15'], {'outmate': {m: v[1] for m, v in STC.items()}, 'band': '10x15 nieuw €8.517–€10.950 incl.', 'ours': {m: v[0] for m, v in STC.items()}}, vmap=vmap)
    SD = {'4,5 x 6 m': 1795, '6 x 6 m': 2195, '7,5 x 10,5 m': 4395, '10,5 x 15 m': 7495}
    vs = [variant(f'KK-TENT-SD-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 30000 + 4000 * i, None, tracked=False) for i, (m, p) in enumerate(SD.items()) for k in SK]
    imgs, vmap = kleur_images('stretchdoek-los', SK, 'foldedFabric', lambda k: {'color': render_color(k), 'kind': 'stretch'}, 'Zandkleur', status='needs-model', p2=3)
    simple('stretchdoek-los', 'Stretchdoek los', 'Stretchtent', ['zakelijk', 'pallet'], [opt('Maat', list(SD)), opt('Kleur', SK)], vs, imgs,
           {'kenmerk_kort': 'Alleen het doek · 750 g/m² · lussen elke 75 cm', 'levertijd': 'Levertijd 3–4 weken', 'verzending': 'pallet'},
           ['stretchtenten.stretch-doeken'], 'stretch', 'Voor wie al palen en spanmateriaal heeft of een doek wil vervangen.',
           ['stretchdoek', 'stretchtent doek los'], {'outmate': '6x6 €2.474 · 7,5x10,5 €4.999', 'ours': SD}, vmap=vmap)
    vs = [variant(f'KK-TENT-SOM-{COLOR_CODE[k]}', [k], 59.95, 1000, None, tracked=False, qrule={'min': 20, 'max': 400, 'increment': 1}) for k in SK]
    simple('stretchdoek-op-maat', 'Stretchdoek op maat (per m²)', 'Stretchtent', ['zakelijk', 'gebruik:evenement'], [opt('Kleur', SK)], vs,
           [img('stretchdoek-op-maat-hero.webp', 'hero', 1, 'stretchtent', {'w': 7.5, 'd': 9, 'color': 'zand', 'poles': 'alu'}, 'hero', 'Zandkleur')],
           {'kenmerk_kort': 'Jouw lengte × breedte · prijs per m² · min. 20 m²', 'levertijd': 'Levertijd 4–6 weken na akkoord tekening', 'verzending': 'pallet'},
           ['stretchtenten.stretch-op-maat'], 'stretch',
           'Maatwerk: aantal = m² (lengte × breedte, afgerond), maten als regel-eigenschappen; we sturen eerst een tekening ter akkoord; maatwerk kan niet retour.',
           ['stretchtent op maat', 'stretchdoek op maat'], {'outmate': 'vanaf €999 (configurator)', 'ours': '€59,95 per m², min. 20 m²'},
           extra={'line_item_properties': ['Lengte (m)', 'Breedte (m)', 'Palenset (ja/nee)', 'Spanmateriaal (spanbanden/touwensets)', 'Toelichting']})
    SW = [('2 m', 'Startwand met 2 palen', 389), ('2 m', 'Uitbreidingswand', 339), ('3 m', 'Startwand met 2 palen', 449), ('3 m', 'Uitbreidingswand', 399)]
    simple('zijwand-stretchtent', 'Zijwand stretchtent', 'Stretchtent zijwand', ['zakelijk'], [opt('Maat', ['2 m', '3 m']), opt('Uitvoering', ['Startwand met 2 palen', 'Uitbreidingswand'])],
           [variant(f'KK-ZW-ST-{code(m)}-{"S" if "Start" in u else "U"}', [m, u], p, 9000 if 'Start' in u else 6000, None, tracked=False) for m, u, p in SW],
           [img('zijwand-stretchtent-hero.webp', 'hero', 1, 'sideWall', {'length': 3, 'height': 2.3, 'type': 'panorama', 'color': 'zwart', 'material': 'pvc', 'poles': 2}, 'hero', 'Zwart', 'needs-model')],
           {'kenmerk_kort': 'Zwart PVC 580 g/m² · raamfolie · aan elkaar te koppelen', 'levertijd': 'Levertijd 2–3 weken', 'verzending': 'pallet'},
           ['stretchtenten.stretch-zijwanden'], 'stretch', 'Startwand (met eigen palen) plus uitbreidingswanden: zo bouw je een dichte zijde.',
           ['zijwand stretchtent'], {'outmate': '2 m START €425 / UITBR. €375 · 3 m €489 / €439', 'ours': {f'{m} {u}': p for m, u, p in SW}})
    SO = [('Spanband met ratel', 6.95, 'SPR', 700), ('Touwenset 3-punts met RVS karabijnen', 49.95, 'TS3', 2500), ('Paalverbinder met bout', 4.49, 'PV', 300),
          ('Oogmoeren M12 (4 stuks)', 5.95, 'OM4', 200), ('Koppelgoot 3 m', 69.95, 'KG3', 2200), ('Koppelgoot 6 m', 119.0, 'KG6', 4200)]
    simple('onderdelen-stretchtent', 'Onderdelen stretchtent', 'Stretchtent onderdeel', ['zakelijk'], [opt('Uitvoering', [s[0] for s in SO])],
           [variant(f'KK-STR-OND-{c}', [n], p, g, inv(15, c)) for n, p, c, g in SO],
           [img('onderdelen-stretchtent-hero.webp', 'hero', 1, 'stretchParts', {'parts': ['spanband', 'touwenset', 'paalverbinder']}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Spanbanden, touwensets, paalverbinders en koppelgoten', 'verzending': 'pakket'},
           ['stretchtenten.stretch-onderdelen', 'stretchtenten.stretch-koppelgoten'], 'stretch', 'Losse onderdelen en koppelgoten (twee stretchtenten waterdicht verbinden).',
           ['onderdelen stretchtent', 'koppelgoot stretchtent'], {'outmate': 'touwenset €59,95 · spanband €7,95 · paalconnector €4,99', 'ours': {s[0]: s[1] for s in SO}})
    PL = [('2,5 m', 'Kastanjehout', 59.95), ('3 m', 'Kastanjehout', 69.95), ('4 m', 'Kastanjehout', 89.95),
          ('2,5 m', 'Aluminium', 79.95), ('3 m', 'Aluminium', 94.95), ('4 m', 'Aluminium', 119.0)]
    simple('palen-stretchtent', 'Palen stretchtent', 'Stretchtent onderdeel', ['zakelijk'], [opt('Maat', ['2,5 m', '3 m', '4 m']), opt('Uitvoering', ['Kastanjehout', 'Aluminium'])],
           [variant(f'KK-STR-PAAL-{code(m)}-{"HT" if u == "Kastanjehout" else "AL"}', [m, u], p, 8000 if u == 'Kastanjehout' else 4500, inv(8, m + u)) for m, u, p in PL],
           [img('palen-stretchtent-hero.webp', 'hero', 1, 'tentPoles', {'material': 'hout', 'length': 3, 'count': 2}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Kastanjehout Ø 80–100 mm of aluminium Ø 50 mm', 'verzending': 'pallet'},
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
    STK = ['Wit', 'Zwart', 'Zandkleur']
    ST1 = {'Ø8 m': (899, 989, 53), 'Ø10 m': (979, 1029, 58), 'Ø12 m': (1149, 1225, 62), 'Ø14 m': (1279, 1350, 67), 'Ø16 m': (1429, 1500, 75)}
    vs = [variant(f'KK-TENT-SR-{code(m)}-{COLOR_CODE[k]}', [m, k], p, kg * 1000, inv(2, m + k)) for m, (p, om, kg) in ST1.items() for k in STK]
    imgs, vmap = kleur_images('stertent-enkele-mast', STK, 'stertent', lambda k: {'diameter': 10, 'points': 6, 'height': 5, 'color': render_color(k)}, 'Wit', p2=2)
    simple('stertent-enkele-mast', 'Stertent enkele mast', 'Stertent', ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:tuinfeest'], [opt('Maat', list(ST1)), opt('Kleur', STK)], vs, imgs,
           {'kenmerk_kort': 'Aluminium mast 75 mm · 320 g/m² doek · 1 mast',
            'specificaties': [sp('Mast', 'Materiaal', 'Geanodiseerd aluminium Ø 75 mm, wand 2,5 mm, telescopisch'), sp('Doek', 'Materiaal', 'Polyester PVC-gecoat 320 g/m², brandvertragend'),
                              sp('Levering', 'Inbegrepen', 'Doek, mast, haringen 50 cm, opbergtas, onderdelenzak, meetkoord')],
            'verzending': 'pallet', 'garantie': '1 jaar op mast en doek'},
           ['stertenten.stertent-rond'], 'ster', 'Opvallende vorm met één mast: maten met ingang en capaciteit, opzetten met meetkoord, met 2 personen.',
           ['stertent kopen', 'stertent 10 meter'], {'outmate': {m: v[1] for m, v in ST1.items()}, 'ours': {m: v[0] for m, v in ST1.items()}}, vmap=vmap)
    ST2 = {'8 x 13 m': (2295, 2500, 106), '10 x 16 m': (2649, 2900, 130), '12 x 19 m': (2949, 3200, 160), '13 x 21 m': (3249, 3500, 185)}
    STK2 = ['Wit', 'Zandkleur']
    vs = [variant(f'KK-TENT-SRD-{code(m)}-{COLOR_CODE[k]}', [m, k], p, kg * 1000, None, tracked=False) for m, (p, om, kg) in ST2.items() for k in STK2]
    imgs, vmap = kleur_images('stertent-dubbele-mast', STK2, 'stertent', lambda k: {'diameter': 10, 'length': 16, 'masts': 2, 'points': 8, 'height': 6, 'color': render_color(k)}, 'Wit', status='needs-param', p2=3)
    simple('stertent-dubbele-mast', 'Stertent dubbele mast', 'Stertent', ['zakelijk', 'pallet', 'gebruik:evenement'], [opt('Maat', list(ST2)), opt('Kleur', STK2)], vs, imgs,
           {'kenmerk_kort': '2 aluminium masten · 320 g/m² doek · tot 150 personen staand', 'levertijd': 'Levertijd 2–3 weken', 'verzending': 'pallet'},
           ['stertenten.stertent-dubbelmast'], 'ster', 'Langgerekte stertent voor grotere groepen: capaciteit per maat, opzetten met 2–3 personen in een half uur.',
           ['stertent dubbele mast', 'stertent 8x13'], {'outmate': {m: v[1] for m, v in ST2.items()}, 'ours': {m: v[0] for m, v in ST2.items()}}, vmap=vmap)
    SZ = {'Ø8 m': (125, 429), 'Ø10 m': (135, 509), 'Ø12 m': (145, 619), 'Ø14 m': (155, 729)}
    vs = [variant(f'KK-ZW-SR-{code(m)}-{"L" if i == 0 else "SET"}', [m, u], v[i], (3000 if i == 0 else 30000 + 4000 * j), inv(3 if i == 0 else 1, m + u))
          for j, (m, v) in enumerate(SZ.items()) for i, u in enumerate(['Losse wand met raam', 'Set rondom'])]
    simple('zijwanden-stertent', 'Zijwanden stertent', 'Stertent zijwand', ['zakelijk'], [opt('Maat', list(SZ)), opt('Uitvoering', ['Losse wand met raam', 'Set rondom'])], vs,
           [img('zijwanden-stertent-hero.webp', 'hero', 1, 'stertent', {'diameter': 10, 'points': 6, 'height': 5, 'color': 'wit', 'walls': 'panorama'}, 'hero', 'Wit', 'needs-param')],
           {'kenmerk_kort': '215 cm hoog · klittenband · panorama of dicht', 'verzending': 'pakket', 'past_op': ['stertent-enkele-mast']},
           ['stertenten.stertent-zijwanden'], 'ster', 'Wanden rondom of per vak: set (panorama + oproldeuren) of los.',
           ['zijwanden stertent'], {'outmate': 'los 8 m €139 · set 8 m €475 · 10 m €559 · 12 m €675 · 14 m €799', 'ours': SZ})

    # ------------------------------------------------------------ opblaasbaar
    AK = ['Klaproos', 'Wit', 'Zwart', 'Blauw', 'Groen', 'Oranje']
    AU = ['Dak in framekleur', 'Full colour bedrukt dak']
    def air(h, c, title, sizes, extra_fc, brief, covers, om, kw, w_default=3):
        vs = []
        for i, (m, (p, kg)) in enumerate(sizes.items()):
            for j, u in enumerate(AU):
                for k in AK:
                    sku = f'KK-AIR-{c}-{code(m)}-{"K" if j == 0 else "FC"}-{COLOR_CODE[k]}'
                    vs.append(variant(sku, [m, u, k], p + (extra_fc[i] if j else 0), kg * 1000, None, tracked=False))
        imgs, vmap = kleur_images(h, AK, 'opblaasbareTent', lambda k: {'w': w_default, 'color': render_color(k), 'canopyColor': render_color(k), **render_finish(k)}, 'Klaproos', p2=3)
        imgs.append(img(f'{h}-full-colour.webp', 'variant', 2, 'opblaasbareTent', {'w': w_default, 'color': 'wit', 'canopyPrint': {'artwork': 'brand/img/voorbeeld-fullcolour.png'}}, 'hero', None, 'needs-param',
                        alt='met voorbeeldontwerp op het dak'))
        simple(h, title, 'Opblaasbare tent', ['zakelijk', 'bedrukbaar', 'gebruik:evenement', 'gebruik:markt'], [opt('Maat', list(sizes)), opt('Uitvoering', AU), opt('Kleur', AK)], vs, imgs,
               {'kenmerk_kort': 'Luchtframe · in 5–10 minuten staand · dak in kleur of full colour', 'bedrukbaar': True,
                'drukopties': {'posities': ['Dak (alle vlakken)'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1, 'varianten': ['Full colour bedrukt dak']},
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
    vs = [variant(f'KK-AIR-WP-33-{COLOR_CODE[k]}', ['3 x 3 m', k], 1349.0, 22000, None, tracked=False) for k in WK]
    imgs, vmap = kleur_images('opblaasbare-partytent-3x3-waterpoten', WK, 'opblaasbareTent', lambda k: {'w': 3, 'legs': 'water', 'height': 3.2, 'color': render_color(k)}, 'Wit', status='needs-param', p2=3)
    simple('opblaasbare-partytent-3x3-waterpoten', 'Opblaasbare partytent 3 x 3 m met waterpoten', 'Opblaasbare tent', ['gebruik:tuinfeest', 'gebruik:evenement'],
           [opt('Maat', ['3 x 3 m']), opt('Kleur', WK)], vs, imgs,
           {'kenmerk_kort': 'Hogedruk-staanders · met water te verzwaren · rugzak', 'verzending': 'pakket', 'levertijd': 'Levertijd 2–3 weken', 'vergelijk_groep': 'opblaasbare-tent',
            'addons': ['pomp-opblaasbare-tent']},
           ['opblaasbare-tenten.air-partytent'], 'opblaasbaar', 'Partytent met opblaasbare poten die je met water verzwaart; uit te breiden met wanden.',
           ['opblaasbare partytent 3x3'], {'outmate': '€1.529 (actie, was €1.699)', 'ours': 1349})
    ZH = {'8 x 8 m': 4495, '10 x 10 m': 6495, '12 x 12 m': 8995}
    ZK = ['Wit', 'Zwart', 'Klaproos', 'Blauw']
    vs = [variant(f'KK-AIR-HEX-{code(m)}-{COLOR_CODE[k]}', [m, k], p, (55 + 20 * i) * 1000, None, tracked=False) for i, (m, p) in enumerate(ZH.items()) for k in ZK]
    imgs, vmap = kleur_images('opblaasbare-zeshoektent', ZK, 'opblaasbareTent', lambda k: {'w': 8, 'shape': 'hexagon', 'color': render_color(k), **render_finish(k)}, 'Wit', status='needs-param', p2=3)
    simple('opblaasbare-zeshoektent', 'Opblaasbare zeshoektent', 'Opblaasbare tent', ['zakelijk', 'pallet', 'bedrukbaar', 'gebruik:evenement'], [opt('Maat', list(ZH)), opt('Kleur', ZK)], vs, imgs,
           {'kenmerk_kort': 'Zes luchtpoten · tot 6 m hoog · dak met rits verwisselbaar', 'bedrukbaar': True,
            'drukopties': {'posities': ['Dak', 'Luifels'], 'aanlevering': AANLEVERING, 'levertijd': LT_DRUK, 'min_aantal': 1},
            'levertijd': 'Levertijd 3–4 weken', 'verzending': 'pallet', 'vergelijk_groep': 'opblaasbare-tent'},
           ['opblaasbare-tenten.air-hexagon'], 'opblaasbaar', 'Grote opblaasbare blikvanger voor festivals en beurzen; dak verwisselbaar, luifels optioneel via offerte.',
           ['opblaasbare tent zeshoek', 'opblaasbare eventtent groot'], {'outmate': '8x8 €4.950 · 10x10 €7.250 · 12x12 €9.950', 'ours': ZH}, vmap=vmap)
    AW = {'3 m': (159, 179), '4 m': (189, 209), '5 m': (219, 239), '6 m': (249, 269)}
    vs = [variant(f'KK-ZW-AIR-{code(m)}-{"DI" if i == 0 else "DE"}', [m, u], v[i], 3000 + 800 * j, inv(3, m + u)) for j, (m, v) in enumerate(AW.items()) for i, u in enumerate(['Dicht', 'Met deur'])]
    simple('zijwand-opblaasbare-promotietent', 'Zijwand opblaasbare promotietent', 'Opblaasbare tent accessoire', ['zakelijk'], [opt('Maat', list(AW)), opt('Uitvoering', ['Dicht', 'Met deur'])], vs,
           [img('zijwand-opblaasbare-promotietent-hero.webp', 'hero', 1, 'opblaasbareTent', {'w': 3, 'color': 'wit', 'walls': {'back': 'closed'}}, 'hero', 'Wit', 'needs-param',
                alt='aan een opblaasbare promotietent (tent niet inbegrepen)')],
           {'kenmerk_kort': 'Met rits aan het luchtframe · dicht of met deur', 'verzending': 'pakket',
            'past_op': ['opblaasbare-promotietent', 'opblaasbare-promotietent-pro', 'opblaasbare-partytent-3x3-waterpoten']},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar', 'Wand per zijde met rits; ook bedrukbaar via offerte.', ['zijwand opblaasbare tent'],
           {'outmate': 'zijwand dicht €179 · raam/deur €199', 'ours': AW})
    simple('pomp-opblaasbare-tent', 'Pomp voor opblaasbare tent', 'Opblaasbare tent accessoire', [], [opt('Uitvoering', ['Elektrische pomp', 'Handpomp'])],
           [variant('KK-AIR-POMP-EL', ['Elektrische pomp'], 69.95, 2200, 10), variant('KK-AIR-POMP-HA', ['Handpomp'], 34.95, 1500, 15)],
           [img('pomp-opblaasbare-tent-hero.webp', 'hero', 1, 'airPump', {'kind': 'elektrisch'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Elektrisch (230 V) of hand · met verloopstukken', 'verzending': 'pakket',
            'past_op': ['opblaasbare-promotietent', 'opblaasbare-promotietent-pro', 'opblaasbare-partytent-3x3-waterpoten', 'opblaasbare-zeshoektent']},
           ['opblaasbare-tenten.air-accessoires'], 'opblaasbaar', 'Elektrisch voor snel opbouwen, handpomp als reserve of zonder stroom.', ['pomp opblaasbare tent'],
           {'outmate': 'elektrisch €75 · hand €39', 'ours': {'Elektrische pomp': 69.95, 'Handpomp': 34.95}})

    # ------------------------------------------------------------ schaduw & overkapping
    SCH = {'3 x 3 m': (34.95, 39.95), '4 x 4 m': (44.95, 54.95), '5 x 5 m': (59.95, 74.95), '5 x 3 m': (49.95, 59.95), '6 x 4 m': (59.95, 74.95),
           '3 x 3 x 3 m': (27.95, 32.95), '5 x 5 x 5 m': (42.95, 52.95)}
    SCK = ['Antraciet', 'Zandkleur']
    vs = [variant(f'KK-SCH-{code(m)}-{"WD" if i == 0 else "WDI"}-{COLOR_CODE[k]}', [m, u, k], v[i], 1500 + 300 * j, inv(6, m + u + k))
          for j, (m, v) in enumerate(SCH.items()) for i, u in enumerate(['Waterdoorlatend', 'Waterdicht']) for k in SCK]
    imgs, vmap = kleur_images('schaduwdoek', SCK, 'shadeSail', lambda k: {'shape': 'vierkant', 'w': 4, 'd': 4, 'color': render_color(k)}, 'Antraciet', status='needs-model', p2=3)
    simple('schaduwdoek', 'Schaduwdoek', 'Schaduwdoek', ['gebruik:tuinfeest', 'gebruik:horeca'], [opt('Maat', list(SCH)), opt('Uitvoering', ['Waterdoorlatend', 'Waterdicht']), opt('Kleur', SCK)], vs, imgs,
           {'kenmerk_kort': 'HDPE 95% UV-blokkering of waterdicht polyester · RVS-ringen', 'verzending': 'pakket',
            'specificaties': [sp('Doek', 'Waterdoorlatend', 'HDPE, blokkeert ca. 95% UV'), sp('Doek', 'Waterdicht', 'PU-gecoat polyester; span met min. 30° helling')]},
           ['schaduw-overkapping.schaduwdoeken'], 'schaduw', 'Schaduw voor tuin en terras: verschil waterdoorlatend/waterdicht (helling!), vierkant vs driehoek, ophangpunten.',
           ['schaduwdoek', 'schaduwdoek waterdicht', 'schaduwdoek driehoek'], {'outmate': '3x3 €39 · 5x3 €59 · 5x5 €69', 'ours': SCH}, vmap=vmap)
    OKK = ['Wit', 'Antraciet', 'Zwart', 'Transparant']
    vs = [variant(f'KK-OVK-OM-{COLOR_CODE[k]}', [k], 32.95, 600, None, tracked=False, qrule={'min': 2, 'max': 200, 'increment': 1}) for k in OKK]
    simple('overkappingzeil-op-maat', 'Overkappingzeil op maat (per m²)', 'Overkapping', ['gebruik:horeca'], [opt('Kleur', OKK)], vs,
           [img('overkappingzeil-op-maat-hero.webp', 'hero', 1, 'tarp', {'w': 4, 'h': 2.5, 'color': 'transparant', 'eyelets': True}, 'hero', 'Transparant', 'needs-model')],
           {'kenmerk_kort': 'PVC 580 g/m² op maat · prijs per m² · ogen rondom', 'levertijd': 'Levertijd 3–5 weken', 'verzending': 'pakket'},
           ['schaduw-overkapping.overkapping-zeil-op-maat'], 'schaduw',
           'Zeil voor veranda of overkapping op jouw maat (tolerantie 1–2 cm): aantal = m², maten als regel-eigenschappen; maatwerk kan niet retour.',
           ['overkapping zeil op maat', 'veranda zeil'], {'outmate': 'vanaf €35 (configurator)', 'ours': '€32,95 per m², min. 2 m²'},
           extra={'line_item_properties': ['Breedte (cm)', 'Hoogte (cm)', 'Ramen (ja/nee)', 'Ritsen (ja/nee)', 'Toelichting']})
    OZ = {'3 m': 99, '4 m': 135, '6 m': 175, '8 m': 229, '10 m': 249}
    OZK = ['Wit', 'Antraciet']
    vs = [variant(f'KK-OVK-ZW-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 3500 + 1500 * i, inv(3, m + k)) for i, (m, p) in enumerate(OZ.items()) for k in OZK]
    imgs, vmap = kleur_images('zijwand-overkapping-pvc', OZK, 'sideWall', lambda k: {'length': 4, 'height': 2.5, 'type': 'panorama', 'zips': True, 'color': render_color(k), 'material': 'pvc'}, 'Wit', status='needs-model', p2=3)
    simple('zijwand-overkapping-pvc', 'Zijwand overkapping PVC met raam en ritsen', 'Overkapping', ['gebruik:horeca'], [opt('Maat', list(OZ)), opt('Kleur', OZK)], vs, imgs,
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
