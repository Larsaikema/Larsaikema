# Meubilair, verlichting, verwarming, inrichting & evenement, cadeaubon.
from kk_base import *
from fam_acc import simple

def build():
    # ------------------------------------------------------------ zitten
    BK = ['Zwart', 'Wit', 'Antraciet']
    vs = [variant(f'KK-MEU-BKM-{COLOR_CODE[k]}', [k], 34.95, 5500, inv(60, k + 'bkm', k)) for k in BK]
    imgs, vmap = kleur_images('barkruk-stapelbaar-metaal', BK, 'barStool', lambda k: {'style': 'metaal', 'color': render_color(k), 'height': 0.76}, 'Zwart',
                              [img('barkruk-stapelbaar-metaal-zwart-gestapeld.webp', 'detail', 3, 'barStool', {'style': 'metaal', 'color': 'zwart', 'stack': 4}, 'hero', 'Zwart', 'needs-model', alt='4 gestapeld')],
                              status='needs-model', p2=3)
    simple('barkruk-stapelbaar-metaal', 'Barkruk stapelbaar metaal', 'Barkruk', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'], [opt('Kleur', BK)], vs, imgs,
           {'kenmerk_kort': 'Zithoogte 76 cm · stapelbaar tot 10 · binnen en buiten', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 5.5,
            'specificaties': [sp('Kruk', 'Zithoogte', '76 cm (bij statafel 107–110 cm)'), sp('Kruk', 'Materiaal', 'Staal, gepoedercoat'), sp('Kruk', 'Stapelbaar', 'Tot 10 stuks')]},
           ['tafels-stoelen.barkrukken'], 'meubilair', 'Stapelbare horecakruk op de juiste hoogte bij een statafel van 110 cm; staffel vanaf 10.',
           ['barkruk stapelbaar', 'barkruk metaal zwart'], {'outmate': 'Hamburg €32,75 (actie) / €39', 'statafelshop': 'Indus ca. €39', 'ours': 34.95}, vmap=vmap)
    simple('barkruk-houten-zitting', 'Barkruk met houten zitting', 'Barkruk', ['zakelijk', 'gebruik:horeca'], [opt('Kleur', ['Zwart'])],
           [variant('KK-MEU-BKH-ZWA', ['Zwart'], 49.95, 6500, 30)],
           [img('barkruk-houten-zitting-hero.webp', 'hero', 1, 'barStool', {'style': 'hout', 'color': 'zwart', 'height': 0.76}, 'hero', 'Zwart', 'needs-model')],
           {'kenmerk_kort': 'Zwart stalen frame · eiken-look zitting · stapelbaar', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 6.5},
           ['tafels-stoelen.barkrukken'], 'meubilair', 'Warmere uitstraling dan full-metaal; horeca en verhuur.', ['barkruk hout', 'barkruk houten zitting'],
           {'outmate': 'Hamburg met houten zitting (prijs onbekend)', 'ours': 49.95})
    KS = ['Wit', 'Zwart']
    vs = [variant(f'KK-MEU-KLS-{COLOR_CODE[k]}', [k], 17.95, 3200, inv(80, k + 'kls', k)) for k in KS]
    imgs, vmap = kleur_images('klapstoel', KS, 'chair', lambda k: {'style': 'klapstoel', 'color': render_color(k)}, 'Wit', status='needs-model', p2=3)
    simple('klapstoel', 'Klapstoel', 'Stoel', ['zakelijk', 'gebruik:evenement', 'gebruik:tuinfeest'], [opt('Kleur', KS)], vs, imgs,
           {'kenmerk_kort': 'Kunststof zitting · stalen frame · plat opvouwbaar', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 3.2},
           ['tafels-stoelen.stoelen'], 'meubilair', 'Klapstoel voor ceremonies, scholen en feesten; per 10 goedkoper.', ['klapstoel', 'klapstoelen wit'],
           {'note': 'Statafelshop klapstoelen zonder prijs gevonden', 'ours': 17.95}, vmap=vmap)
    CB = ['Houtlook', 'Zwart']
    vs = [variant(f'KK-MEU-CBS-{COLOR_CODE[k]}', [k], 79.95, 5800, inv(20, k + 'cbs', k)) for k in CB]
    imgs, vmap = kleur_images('stapelstoel-cross-back', CB, 'chair', lambda k: {'style': 'crossback', 'color': render_color(k)}, 'Houtlook', status='needs-model', p2=3)
    simple('stapelstoel-cross-back', 'Stapelstoel cross back hout', 'Stoel', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'], [opt('Kleur', CB)], vs, imgs,
           {'kenmerk_kort': 'Massief hout · kruisrug · stapelbaar', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'addons': ['zitkussen-stoel-en-barkruk']},
           ['tafels-stoelen.stoelen'], 'meubilair', 'Bruiloft- en dinerstoel; zitkussen apart.', ['cross back stoel', 'stapelstoel hout'],
           {'outmate': 'Cross Back €92,50 (vanaf €62,50)', 'ours': 79.95}, vmap=vmap)
    ZK = ['Antraciet', 'Zandkleur', 'Zwart']
    vs = [variant(f'KK-MEU-ZK-{COLOR_CODE[k]}', [k], 12.95, 400, inv(30, k + 'zk', k)) for k in ZK]
    imgs, vmap = kleur_images('zitkussen-stoel-en-barkruk', ZK, 'seatCushion', lambda k: {'color': render_color(k)}, 'Antraciet', status='needs-model', p2=3)
    simple('zitkussen-stoel-en-barkruk', 'Zitkussen voor stoel en barkruk', 'Meubelonderdeel', ['gebruik:horeca'], [opt('Kleur', ZK)], vs, imgs,
           {'kenmerk_kort': 'Met strikbandjes · afneembare hoes', 'past_op': ['stapelstoel-cross-back', 'barkruk-houten-zitting', 'barkruk-stapelbaar-metaal'], 'verzending': 'pakket'},
           ['tafels-stoelen.stoelen-onderdelen', 'tafels-stoelen.barkruk-onderdelen'], 'meubilair', 'Comfort en kleur voor stoelen en krukken.', ['zitkussen stoel'], {'ours': 12.95}, vmap=vmap)
    VD = [('Statafel', 'STF'), ('Klaptafel', 'KLT'), ('Barkruk', 'BKR')]
    simple('voetdoppen-set-van-4', 'Voetdoppen voor statafel, klaptafel en barkruk (set van 4)', 'Meubelonderdeel', [], [opt('Uitvoering', [v[0] for v in VD])],
           [variant(f'KK-MEU-VD-{c}', [n], 4.95, 80, inv(50, c + 'vd')) for n, c in VD],
           [img('voetdoppen-set-van-4-hero.webp', 'hero', 1, 'footCaps', {'count': 4}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Kunststof doppen · beschermen je vloer', 'verzending': 'pakket',
            'past_op': ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80', 'klaptafel-hdpe-rechthoekig', 'barkruk-stapelbaar-metaal']},
           ['tafels-stoelen.meubel-onderdelen', 'tafels-stoelen.klaptafel-onderdelen', 'tafels-stoelen.barkruk-onderdelen'], 'meubilair',
           'Kleine vervanging, groot verschil voor je vloer; kies het type meubel.', ['voetdoppen statafel', 'doppen klaptafel'], {'ours': 4.95})
    LB = {'Ø70 cm': 39.95, 'Ø80 cm': 44.95, 'Ø85 cm': 49.95}
    LBK = ['Wit', 'Zwart', 'Antraciet', 'Berken']
    vs = [variant(f'KK-MEU-BLAD-{code(m)}-{COLOR_CODE[k]}', [m, k], p + (10 if k == 'Berken' else 0), 6000, inv(6, m + k + 'blad', k)) for m, p in LB.items() for k in LBK]
    simple('los-statafelblad', 'Los statafelblad', 'Meubelonderdeel', ['zakelijk'], [opt('Maat', list(LB)), opt('Kleur', LBK)], vs,
           [img('los-statafelblad-hero.webp', 'hero', 1, 'tableTop', {'diameter': 0.8, 'top': 'wit'}, 'hero', 'Wit', 'needs-model')],
           {'kenmerk_kort': 'Vervangend blad met kantenband · Ø 70, 80 of 85 cm', 'past_op': ['statafel-inklapbaar-professional'], 'verzending': 'pakket'},
           ['tafels-stoelen.meubel-onderdelen'], 'meubilair', 'Blad beschadigd of andere look? Nieuw blad op hetzelfde onderstel.', ['statafelblad los', 'statafel blad vervangen'],
           {'note': 'Statafelshop verkoopt losse bladen (prijs onbekend)', 'ours': LB})
    # ------------------------------------------------------------ tafels
    KT = [('122 x 61 cm', 'Vast blad', 59.95, 10), ('183 x 76 cm', 'Vast blad', 74.95, 16), ('183 x 76 cm', 'In het midden inklapbaar', 79.95, 15), ('244 x 76 cm', 'Vast blad', 99.0, 23)]
    simple('klaptafel-hdpe-rechthoekig', 'Klaptafel HDPE rechthoekig', 'Klaptafel', ['zakelijk', 'gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Maat', ['122 x 61 cm', '183 x 76 cm', '244 x 76 cm']), opt('Uitvoering', ['Vast blad', 'In het midden inklapbaar'])],
           [variant(f'KK-MEU-KLT-{code(m)}-{"V" if u == "Vast blad" else "K"}', [m, u], p, kg * 1000, inv(30, m + u)) for m, u, p, kg in KT],
           [img('klaptafel-hdpe-rechthoekig-hero.webp', 'hero', 1, 'klaptafel', {'length': 1.83, 'width': 0.76, 'height': 0.74}, 'hero', None, 'existing'),
            img('klaptafel-hdpe-rechthoekig-ingeklapt.webp', 'detail', 3, 'klaptafel', {'length': 1.83, 'width': 0.76, 'folded': True}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'HDPE-blad 74 cm hoog · tot 8 personen (183 cm) · binnen en buiten', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pakket',
            'addons': ['stretchhoes-klaptafel'], 'specificaties': [sp('Blad', 'Materiaal', 'HDPE blow-mould, lichtgrijs/wit'), sp('Onderstel', 'Materiaal', 'Staal, grijs gepoedercoat, inklapbaar')]},
           ['tafels-stoelen.klaptafels'], 'meubilair', 'Werkpaard voor buffet en vergadering: maten met aantal personen, inklapbaar in het midden = koffermodel.',
           ['klaptafel', 'klaptafel 183', 'buffettafel'], {'statafelshop': '180x76 €85,85 · 122x61 €74,96', 'outmate': '180x76 vouwbaar €95,50', 'ours': {f'{m} {u}': p for m, u, p, kg in KT}})
    simple('klaptafel-hdpe-rond', 'Klaptafel HDPE rond', 'Klaptafel', ['zakelijk', 'gebruik:evenement'], [opt('Maat', ['Ø150 cm', 'Ø180 cm'])],
           [variant('KK-MEU-KLR-D150', ['Ø150 cm'], 169.0, 24000, 8), variant('KK-MEU-KLR-D180', ['Ø180 cm'], 219.0, 30000, 8)],
           [img('klaptafel-hdpe-rond-hero.webp', 'hero', 1, 'klaptafel', {'shape': 'rond', 'diameter': 1.8, 'height': 0.74}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'Ronde banket-tafel · 8 (Ø150) of 10 (Ø180) personen', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet'},
           ['tafels-stoelen.klaptafels'], 'meubilair', 'Banket- en bruiloftstafel; aantal personen per maat; kleed tot de grond via offerte.',
           ['ronde klaptafel', 'banket tafel rond'], {'outmate': 'Ø150 €188,50 · Ø180 €254,50', 'ours': {'Ø150 cm': 169, 'Ø180 cm': 219}})
    TT = {'60 x 60 cm': 89.95, '70 x 70 cm': 99.95, '120 x 70 cm': 199.0}
    TK = ['Zwart', 'Wit', 'Houtlook']
    vs = [variant(f'KK-MEU-TER-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 12000 + 5000 * i, inv(8, m + k + 'ter', k)) for i, (m, p) in enumerate(TT.items()) for k in TK]
    imgs, vmap = kleur_images('terrastafel-inklapbaar', TK, 'patioTable', lambda k: {'w': 0.7, 'd': 0.7, 'top': top_param_patio(k), 'frame': 'zwart', 'base': 'kruis'}, 'Zwart', status='needs-model', p2=3)
    simple('terrastafel-inklapbaar', 'Terrastafel inklapbaar', 'Terrastafel', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(TT)), opt('Kleur', TK)], vs, imgs,
           {'kenmerk_kort': '75 cm hoog · klapblad · weerbestendig blad', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket'},
           ['tafels-stoelen.terrastafels'], 'meubilair', 'Terrastafel met klapblad: snel opruimen na sluitingstijd; binnen en buiten.', ['terrastafel inklapbaar', 'horeca terrastafel'],
           {'outmate': '70x70 €132 · 120x70 €299', 'ours': TT}, vmap=vmap)
    BTS = [('220 x 50 cm', 'Set: tafel en 2 banken', 169.0, 28), ('220 x 50 cm', 'Alleen tafel', 89.95, 14), ('220 x 70 cm', 'Set: tafel en 2 banken', 199.0, 32), ('220 x 70 cm', 'Alleen tafel', 109.0, 18)]
    simple('biertafelset', 'Biertafelset', 'Biertafelset', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:evenement'], [opt('Maat', ['220 x 50 cm', '220 x 70 cm']), opt('Uitvoering', ['Set: tafel en 2 banken', 'Alleen tafel'])],
           [variant(f'KK-MEU-BTS-{code(m)}-{"SET" if "Set" in u else "T"}', [m, u], p, kg * 1000, inv(20, m + u)) for m, u, p, kg in BTS],
           [img('biertafelset-hero.webp', 'hero', 1, 'biertafelset', {'length': 2.2, 'tableWidth': 0.5}, 'hero', None, 'existing'),
            img('biertafelset-70-hero.webp', 'variant', 3, 'biertafelset', {'length': 2.2, 'tableWidth': 0.7}, 'hero', None, 'existing', alt='breed blad 70 cm')],
           {'kenmerk_kort': 'Vurenhout · inklapbaar stalen onderstel · 220 cm', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet', 'addons': ['hoes-biertafelset'],
            'specificaties': [sp('Blad', 'Materiaal', 'Vurenhout, gelakt'), sp('Onderstel', 'Materiaal', 'Staal, verzinkt, inklapbaar'), sp('Set', 'Bank', '220 x 25 cm')]},
           ['tafels-stoelen.biertafels'], 'meubilair', 'Klassieke feestset: 50 cm standaard, 70 cm breed voor meer bordruimte; ook alleen de tafel.',
           ['biertafelset', 'biertafel kopen', 'feestset'], {'statafelshop': 'biertafel 220x50 €114,89 · set €225', 'ours': {f'{m} {u}': p for m, u, p, kg in BTS}})
    simple('bierbank-220', 'Bierbank los 220 cm', 'Bierbank', ['gebruik:tuinfeest', 'gebruik:evenement'], [],
           [variant('KK-MEU-BB-220', [], 39.95, 7000, 40)],
           [img('bierbank-220-hero.webp', 'hero', 1, 'biertafelset', {'length': 2.2, 'only': 'bank'}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'Vurenhout 220 x 25 cm · inklapbaar', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pakket', 'past_op': ['biertafelset']},
           ['tafels-stoelen.banken', 'tafels-stoelen.biertafels'], 'meubilair', 'Extra bank bij je biertafel, of los als zitbank op het feest.', ['bierbank', 'bierbank los'],
           {'outmate': 'bierbank onderstel €29,25 bij 4–10 st', 'ours': 39.95})
    TK2 = [('Klein, voor 5 statafels', 269.0, 'K', 38), ('Groot, voor 15 statafels', 369.0, 'G', 55)]
    simple('transportkar-statafels', 'Transportkar voor statafels', 'Transportkar', ['zakelijk', 'pallet'], [opt('Uitvoering', [t[0] for t in TK2])],
           [variant(f'KK-MEU-TKS-{c}', [n], p, kg * 1000, inv(4, c + 'tks')) for n, p, c, kg in TK2],
           [img('transportkar-statafels-hero.webp', 'hero', 1, 'trolley', {'kind': 'statafel', 'size': 'groot', 'loaded': 0}, 'hero', None, 'needs-model'),
            img('transportkar-statafels-gevuld.webp', 'in-gebruik', 2, 'trolley', {'kind': 'statafel', 'size': 'groot', 'loaded': 15}, 'hero', None, 'needs-model', alt='gevuld met 15 statafels (niet inbegrepen)')],
           {'kenmerk_kort': 'Heavy duty wielen · grijs hamerslag · 5 of 15 ingeklapte statafels', 'verzending': 'pallet',
            'past_op': ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80'],
            'specificaties': [sp('Kar', 'Groot', 'ca. 126 x 97 x 113 cm, tot 15 statafels Ø80'), sp('Kar', 'Klein', 'ca. 65 x 95 x 114 cm, tot 5 statafels')]},
           ['tafels-stoelen.trolleys'], 'meubilair', 'Statafels verplaatsen en opslaan zonder sjouwen; capaciteit per model.', ['transportkar statafels', 'trolley statafel'],
           {'statafelshop': 'klein €311,58 · groot €434,39', 'outmate': '10 st €589', 'ours': {t[0]: t[1] for t in TK2}})
    TK3 = [('Voor 10 klaptafels 183 cm', 249.0, 'KLT', 35), ('Voor 24 barkrukken', 229.0, 'BKR', 30), ('Voor 30 klapstoelen', 199.0, 'KLS', 26)]
    simple('transportkar-klaptafels-en-stoelen', 'Transportkar voor klaptafels en stoelen', 'Transportkar', ['zakelijk', 'pallet'], [opt('Uitvoering', [t[0] for t in TK3])],
           [variant(f'KK-MEU-TKK-{c}', [n], p, kg * 1000, inv(3, c + 'tkk')) for n, p, c, kg in TK3],
           [img('transportkar-klaptafels-en-stoelen-hero.webp', 'hero', 1, 'trolley', {'kind': 'klaptafel', 'loaded': 0}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Zwenkwielen met rem · voor klaptafels, barkrukken of klapstoelen', 'verzending': 'pallet',
            'past_op': ['klaptafel-hdpe-rechthoekig', 'barkruk-stapelbaar-metaal', 'klapstoel']},
           ['tafels-stoelen.trolleys'], 'meubilair', 'Eén kar per meubeltype; capaciteit en afmetingen.', ['transportkar klaptafels', 'trolley stoelen'],
           {'outmate': 'trolley klaptafel rond 180 vanaf €482,50', 'ours': {t[0]: t[1] for t in TK3}})

    # ------------------------------------------------------------ verlichting
    PK = {'10 m': (39.95, 1.2), '20 m': (69.95, 2.3), '30 m': (99.0, 3.4), '50 m': (159.0, 5.6)}
    PKK = ['Zwart', 'Wit']
    vs = [variant(f'KK-LCHT-PK-{code(m)}-{COLOR_CODE[k]}', [m, k], p, kg * 1000, inv(15, m + k + 'pk', k)) for m, (p, kg) in PK.items() for k in PKK]
    imgs, vmap = kleur_images('prikkabel-e27', PKK, 'prikkabel', lambda k: {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': True, 'cable': render_color(k)}, 'Zwart',
                              [img('prikkabel-e27-zwart-uit.webp', 'detail', 3, 'prikkabel', {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': False}, 'hero', 'Zwart', 'existing', alt='lampen uit')], status='existing', p2=3)
    simple('prikkabel-e27', 'Prikkabel E27', 'Prikkabel', ['gebruik:tuinfeest', 'gebruik:horeca', 'gebruik:evenement'], [opt('Maat', list(PK)), opt('Kleur', PKK)], vs, imgs,
           {'kenmerk_kort': 'Fitting elke meter · IP44 · max. 25 W per fitting', 'verzending': 'pakket', 'addons': ['led-lamp-e27'],
            'specificaties': [sp('Kabel', 'Spanning', '230 V, 16 A'), sp('Kabel', 'Fittingen', 'E27, elke 1 m'), sp('Kabel', 'Beschermingsklasse', 'IP44'), sp('Lamp', 'Max. vermogen', '25 W per fitting')]},
           ['verlichting.prikkabels'], 'verlichting', 'Sfeerverlichting voor tuin en terras: lengte = aantal fittingen, lampen apart (of als set); doorkoppelen binnen het maximum.',
           ['prikkabel', 'prikkabel 10 meter', 'lichtsnoer buiten'], {'outmate': '10 m €49 · 20 m €87 · 30 m €126', 'ours': {m: v[0] for m, v in PK.items()}}, vmap=vmap)
    vs = [variant(f'KK-LCHT-PKM-{COLOR_CODE[k]}', [k], 4.49, 120, None, tracked=False, qrule={'min': 5, 'max': 200, 'increment': 1}) for k in PKK]
    simple('prikkabel-op-maat', 'Prikkabel op maat (per meter)', 'Prikkabel', ['zakelijk', 'gebruik:horeca'], [opt('Kleur', PKK)], vs,
           [img('prikkabel-op-maat-hero.webp', 'hero', 1, 'prikkabel', {'bulbs': 14, 'spacing': 0.5, 'sag': 0.2, 'on': True}, 'hero', 'Zwart', 'existing')],
           {'kenmerk_kort': 'Jouw lengte tot 200 m · fittingafstand naar keuze · gemonteerd', 'levertijd': 'Levertijd 3–5 werkdagen', 'verzending': 'pakket'},
           ['verlichting.prikkabels'], 'verlichting',
           'Aantal = meters; afstand stekker–1e fitting, aantal fittingen, tussenafstand en eindstuk als regel-eigenschappen; maatwerk kan niet retour.',
           ['prikkabel op maat'], {'outmate': 'op maat vanaf €9', 'ours': '€4,49 per meter, min. 5 m'},
           extra={'line_item_properties': ['Afstand stekker tot 1e fitting (cm)', 'Aantal fittingen', 'Afstand tussen fittingen (cm)', 'Afstand laatste fitting tot eind (cm)', 'Eindstuk (eindkap / contrastekker / eindhaak)']})
    LL = [('Warm wit melkglas 1 W', 1.29, 'MW'), ('Warm wit helder 1 W', 1.29, 'HW'), ('Filament dimbaar 2 W', 1.79, 'FD'), ('Set van 5 gekleurde lampen', 4.95, 'S5')]
    simple('led-lamp-e27', 'LED-lamp E27 onbreekbaar', 'LED-lamp', ['gebruik:tuinfeest', 'gebruik:horeca'], [opt('Uitvoering', [l[0] for l in LL])],
           [variant(f'KK-LCHT-LED-{c}', [n], p, 40 if c != 'S5' else 200, inv(400, c + 'led')) for n, p, c in LL],
           [img('led-lamp-e27-hero.webp', 'hero', 1, 'ledBulb', {'type': 'melkglas', 'on': True}, 'hero', None, 'needs-model'),
            img('led-lamp-e27-gekleurd.webp', 'variant', 3, 'ledBulb', {'type': 'gekleurd', 'count': 5, 'on': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Polycarbonaat kap · 1–2 W · ca. 2200–2700 K', 'staffelkorting': ST_LAMP, 'past_op': ['prikkabel-e27', 'prikkabel-op-maat'], 'verzending': 'pakket'},
           ['verlichting.ledlampen'], 'verlichting', 'Onbreekbare LED-lampen voor buiten; zuinig, dus lange kabels kunnen; staffel vanaf 50.',
           ['led lamp prikkabel', 'onbreekbare lamp e27'], {'outmate': '€1,29–€1,99; set 5 €5,99; 100+ €1,20', 'ours': {l[0]: l[1] for l in LL}})
    LS = ['Warm wit', 'Geel', 'Oranje', 'Rood', 'Groen', 'Blauw']
    vs = [variant(f'KK-LCHT-LS-{COLOR_CODE[k]}', [k], 7.95, 180, None, tracked=False, qrule={'min': 1, 'max': 100, 'increment': 1}) for k in LS]
    imgs, vmap = kleur_images('led-lichtslang', LS, 'ropeLight', lambda k: {'color': render_color(k), 'length': 5, 'on': True}, 'Warm wit', status='needs-model', p2=3)
    simple('led-lichtslang', 'LED-lichtslang (per meter)', 'Lichtslang', ['gebruik:tuinfeest', 'gebruik:horeca'], [opt('Kleur', LS)], vs, imgs,
           {'kenmerk_kort': '36 LEDs per meter · IP44 · 1,5 W per meter · hele meters', 'verzending': 'pakket', 'addons': ['onderdelen-prikkabel-en-lichtslang'],
            'specificaties': [sp('Slang', 'LEDs', '36 per meter'), sp('Slang', 'Diameter', '13 mm'), sp('Slang', 'Beschermingsklasse', 'IP44')]},
           ['verlichting.lichtslangen'], 'verlichting', 'Lichtslang per hele meter (aantal = meters); aansluitsnoer met stekker apart (onderdelen).',
           ['led lichtslang', 'lichtslang buiten'], {'outmate': 'warm wit €8,95–€9,99 per m; 20 m €58', 'ours': '€7,95 per meter'}, vmap=vmap)
    simple('kerstverlichting-10-m', 'Kerstverlichting 10 m, 100 LEDs', 'Kerstverlichting', ['gebruik:horeca'], [opt('Uitvoering', ['Warm wit', 'Warm wit fonkelend'])],
           [variant('KK-LCHT-KV-WW', ['Warm wit'], 29.95, 700, 40), variant('KK-LCHT-KV-FK', ['Warm wit fonkelend'], 32.95, 700, 30)],
           [img('kerstverlichting-10-m-hero.webp', 'hero', 1, 'stringLights', {'kind': 'kerst', 'count': 100, 'on': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Doorkoppelbaar · IP65 · 2200 K', 'verzending': 'pakket'},
           ['verlichting.kerstverlichting'], 'verlichting', 'Professionele kerstverlichting voor gevel, boom en terras; doorkoppelbaar.', ['kerstverlichting buiten', 'kerstverlichting doorkoppelbaar'],
           {'outmate': '€33,99 / €35', 'ours': {'Warm wit': 29.95, 'Warm wit fonkelend': 32.95}})
    PO = [('E27-fitting zwart', 1.39, 'FZ'), ('E27-fitting wit', 1.49, 'FW'), ('Eindkap', 1.95, 'EK'), ('Stekkerdimmer tot 280 W', 9.95, 'SD'),
          ('Dimmer met afstandsbediening tot 500 W', 24.95, 'DA'), ('Tijdschakelaar', 7.95, 'TS'), ('Aansluitsnoer lichtslang met stekker', 9.95, 'AS'), ('Verlengkabel 10 m zwart', 12.95, 'VK')]
    simple('onderdelen-prikkabel-en-lichtslang', 'Onderdelen prikkabel en lichtslang', 'Verlichting onderdeel', [], [opt('Uitvoering', [p[0] for p in PO])],
           [variant(f'KK-LCHT-OND-{c}', [n], p, 100, inv(60, c + 'po')) for n, p, c in PO],
           [img('onderdelen-prikkabel-en-lichtslang-hero.webp', 'hero', 1, 'lightParts', {'parts': ['fitting', 'eindkap', 'dimmer']}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Fittingen, dimmers, tijdschakelaar en aansluitsnoeren', 'verzending': 'pakket', 'past_op': ['prikkabel-e27', 'prikkabel-op-maat', 'led-lichtslang']},
           ['verlichting.verlichting-onderdelen'], 'verlichting', 'Reserve-onderdelen en slimme extra’s (dimmer, timer).', ['dimmer prikkabel', 'fitting prikkabel'],
           {'outmate': 'fitting €1,50–€1,69 · dimmer €9,99', 'ours': {p[0]: p[1] for p in PO}})

    # ------------------------------------------------------------ verwarming
    simple('elektrische-heater-partytent', 'Elektrische heater voor partytent', 'Verwarming', ['gebruik:horeca', 'gebruik:evenement'],
           [opt('Uitvoering', ['1500 W met klem voor easy-up', '2100 W IP24 met beugel'])],
           [variant('KK-VRW-EL-1500', ['1500 W met klem voor easy-up'], 109.0, 3500, 12), variant('KK-VRW-EL-2100', ['2100 W IP24 met beugel'], 149.0, 4200, 8)],
           [img('elektrische-heater-partytent-hero.webp', 'hero', 1, 'heater', {'kind': 'elektrisch', 'watt': 1500, 'clamp': True}, 'hero', None, 'needs-model'),
            img('elektrische-heater-partytent-in-tent.webp', 'in-gebruik', 3, 'items', {'items': [{'model': 'easyUpTent', 'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit'},
                                                                                              {'model': 'heater', 'kind': 'elektrisch', 'mountedOn': 'leg'}]}, 'low', None, 'needs-model', alt='aan de poot van een easy-up (tent niet inbegrepen)')],
           {'kenmerk_kort': 'Infrarood · 3 standen · tot ca. 14–19 m²', 'verzending': 'pakket', 'past_op': [],
            'specificaties': [sp('Heater', '1500 W', '600/900/1500 W, ca. 14 m², klem voor 40–50 mm poot'), sp('Heater', '2100 W', '900/1420/2100 W, max. 19 m², IP24')], 'garantie': '1 jaar'},
           ['verwarming.elektrisch', 'easy-up-accessoires.easy-up-inrichting'], 'verwarming', 'Warmte zonder gas in de tent; vermogen per m², afstand tot doek, alleen op een geaarde groep.',
           ['heater partytent', 'terrasverwarming elektrisch'], {'outmate': 'easy-up heater 1500 W €129', 'ours': {'1500 W': 109, '2100 W': 149}})
    simple('terrasheater-gas-13-kw', 'Terrasheater op gas 13 kW', 'Verwarming', ['gebruik:horeca', 'pallet'], [],
           [variant('KK-VRW-GAS-13', [], 179.0, 22000, 6)],
           [img('terrasheater-gas-13-kw-hero.webp', 'hero', 1, 'heater', {'kind': 'gas', 'style': 'paddenstoel'}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'RVS · 13 kW · omvalbeveiliging · gasfles apart', 'verzending': 'pallet', 'garantie': '1 jaar'},
           ['verwarming.gas'], 'verwarming', 'Klassieke paddenstoelheater voor buiten; nooit in een gesloten tent; gasfles en drukregelaar niet inbegrepen.',
           ['terrasheater gas', 'gasheater terras'], {'note': 'geen referentieprijs gevonden', 'ours': 179})
    simple('beschermhoes-terrasheater', 'Beschermhoes terrasheater', 'Verwarming', ['gebruik:horeca'], [],
           [variant('KK-VRW-HOES', [], 19.95, 700, 20)],
           [img('beschermhoes-terrasheater-hero.webp', 'hero', 1, 'heaterCover', {}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Waterdicht · met rits en trekkoord', 'verzending': 'pakket', 'past_op': ['terrasheater-gas-13-kw']},
           ['verwarming.verwarming-accessoires'], 'verwarming', 'Houdt de heater droog en schoon buiten het seizoen.', ['hoes terrasheater'], {'ours': 19.95})

    # ------------------------------------------------------------ inrichting
    AZ = [('RVS', 49.95, 'RVS'), ('Messinglook', 54.95, 'MES'), ('Zwart', 49.95, 'ZWA')]
    simple('afzetpaal-met-trekband', 'Afzetpaal met trekband 2 m', 'Afzetpaal', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', [a[0] for a in AZ])],
           [variant(f'KK-INR-AZP-{c}', [n], p, 7500, inv(30, c + 'azp')) for n, p, c in AZ],
           [img('afzetpaal-met-trekband-hero.webp', 'hero', 1, 'stanchion', {'finish': 'rvs', 'belt': 'zwart', 'pair': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Oprolbare band 200 cm · verzwaarde voet · koppelbaar', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket'},
           ['inrichting-evenement.afzetpalen'], 'inrichting', 'Rijen en entrees afzetten; koppelbaar in alle richtingen.', ['afzetpaal', 'afzetpalen trekband'], {'note': 'geen Outmate-prijs gevonden'})
    simple('afzetpaal-met-logo', 'Afzetpaal met jouw logo op de trekband', 'Afzetpaal', ['bedrukbaar', 'zakelijk', 'gebruik:evenement'], [opt('Uitvoering', ['RVS', 'Zwart'])],
           [variant(f'KK-BDR-AZP-{c}', [n], 69.95, 7500, None, tracked=False, qrule={'min': 10, 'max': None, 'increment': 1}) for n, c in [('RVS', 'RVS'), ('Zwart', 'ZWA')]],
           [img('afzetpaal-met-logo-hero.webp', 'hero', 1, 'stanchion', {'finish': 'rvs', 'belt': 'klaproos', 'beltPrint': {'svg': 'brand/tools/print-wordmark-klein.json', 'color': '#FBF6EC'}, 'pair': True},
                'hero', None, 'needs-model', alt='met voorbeeldopdruk Klapklaar op de band')],
           {'kenmerk_kort': 'Jouw logo op de band · vanaf 10 stuks · drukproef vooraf', 'bedrukbaar': True,
            'drukopties': {'posities': ['Trekband (herhalend)'], 'aanlevering': AANLEVERING, 'levertijd': '2–3 weken na akkoord drukproef', 'min_aantal': 10},
            'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd 2–3 weken na akkoord drukproef', 'verzending': 'pakket'},
           ['inrichting-evenement.afzetpalen'], 'inrichting', 'Afzetten én zichtbaar zijn: logo herhalend op de band; minimaal 10 stuks.', ['afzetpaal bedrukt', 'afzetpaal logo'],
           {'outmate': 'bedrukte trekband min. 10 st (prijs niet gevonden)', 'ours': 69.95})
    MK = ['Wit', 'Klaproos', 'Blauw', 'Groen']
    vs = [variant(f'KK-INR-MKR-{COLOR_CODE[k]}', [k], 479.0, 45000, inv(4, k + 'mkr', k)) for k in MK]
    imgs, vmap = kleur_images('marktkraam-2-m', MK, 'marketStall', lambda k: {'w': 2, 'canopyColor': render_color(k), **render_finish(k)}, 'Klaproos', status='needs-model', p2=3)
    simple('marktkraam-2-m', 'Marktkraam 2 m gegalvaniseerd', 'Marktkraam', ['zakelijk', 'pallet', 'gebruik:markt'], [opt('Kleur', MK)], vs, imgs,
           {'kenmerk_kort': 'Gegalvaniseerd frame · 2 m tafel · PVC-kap', 'verzending': 'pallet', 'garantie': '1 jaar'},
           ['inrichting-evenement.marktkramen'], 'inrichting', 'Voor scholen, verenigingen en markten: opzetten zonder gereedschap; kap in kleur, bedrukt via offerte.',
           ['marktkraam kopen', 'marktkraam 2 meter'], {'outmate': '€533–€599', 'ours': 479}, vmap=vmap)
    LP = [('1 m breed', 7.95), ('2 m breed', 14.95)]
    LK = ['Rood', 'Zwart', 'Antraciet']
    vs = [variant(f'KK-INR-LOP-{"1" if m.startswith("1") else "2"}-{COLOR_CODE[k]}', [m, k], p, 1200 if m.startswith('1') else 2400, None, tracked=False,
                  qrule={'min': 5, 'max': 60, 'increment': 1}) for m, p in LP for k in LK]
    imgs, vmap = kleur_images('loper-per-meter', LK, 'carpetRunner', lambda k: {'width': 1, 'length': 6, 'color': render_color(k)}, 'Rood', status='needs-model', p2=3)
    simple('loper-per-meter', 'Loper (per meter)', 'Loper', ['zakelijk', 'gebruik:evenement'], [opt('Maat', [l[0] for l in LP]), opt('Kleur', LK)], vs, imgs,
           {'kenmerk_kort': 'Naaldvilt · 1 of 2 m breed · tot 60 m uit één stuk', 'verzending': 'pakket'},
           ['inrichting-evenement.lopers'], 'inrichting', 'Rode (of zwarte) loper per meter: aantal = meters, uit één stuk tot 60 m.', ['rode loper kopen', 'loper per meter'],
           {'outmate': 'rode loper budget 50 m €439', 'ours': {'1 m breed': '€7,95/m', '2 m breed': '€14,95/m'}}, vmap=vmap)

    # ------------------------------------------------------------ cadeaubon
    BG = [25, 50, 100, 250]
    add({'handle': 'cadeaubon', 'title': 'Klapklaar cadeaubon', 'product_type': 'Cadeaubon', 'tags': [], 'gift_card': True, 'template_suffix': None,
         'options': [opt('Bedrag', [f'€ {b}' for b in BG])],
         'variants': [variant(f'KK-CADEAU-{b}', [f'€ {b}'], b, 0, None, tracked=False, shipping=False) for b in BG],
         'images': [img('cadeaubon-hero.webp', 'hero', 1, 'giftCard', {'design': 'brand'}, 'hero', None, 'needs-model', alt='Klapklaar cadeaubon')],
         'metafields': {'kenmerk_kort': 'Digitaal · direct in je mail · te besteden aan alles'},
         'covers': [], 'family': 'cadeaubon', 'weight': 1,
         'copy_brief': 'Digitale cadeaubon; geldigheid is een owner-claim (wettelijk minimum controleren).', 'seo_keywords': ['cadeaubon partytent'], 'price_ref': {}})

def top_param_patio(k):
    return {'Zwart': 'zwart', 'Wit': 'wit', 'Houtlook': 'houtlook'}[k]
