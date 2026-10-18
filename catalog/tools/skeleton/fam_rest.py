# Meubilair, verlichting, verwarming, inrichting & evenement, cadeaubon.
from kk_base import *
from fam_acc import simple, eu_all

def build():
    global EU_TENTS
    EU_TENTS = eu_all()
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
    def seat(h, title, ptype, tags, kleuren, price, grams, sku, model, params, default, kenmerk, specs, covers, brief, kw, ref, base=30, extra_imgs=(), mf_extra=None):
        vs = [variant(f'KK-MEU-{sku}-{COLOR_CODE[k]}', [k], price, grams, inv(base, k + sku, k)) for k in kleuren]
        imgs, vmap = kleur_images(h, kleuren, model, lambda k: dict(params, color=render_color(k)), default, list(extra_imgs),
                                  status='existing' if model == 'barStool' else 'needs-model', p2=3)
        mf = {'kenmerk_kort': kenmerk, 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': round(grams / 1000, 1), 'specificaties': specs}
        mf.update(mf_extra or {})
        simple(h, title, ptype, tags, [opt('Kleur', kleuren)], vs, imgs, mf, covers, 'meubilair', brief, kw, ref, vmap=vmap)
    seat('barkruk-velours-stapelbaar', 'Barkruk velours stapelbaar', 'Barkruk', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
         ['Grijs', 'Groen', 'Marineblauw', 'Camel'], 37.95, 6000, 'BKV', 'barStool', {'style': 'velours', 'height': 0.76, 'back': True}, 'Grijs',
         'Velours zitting met rug · zithoogte 76 cm · stapelbaar tot 5 · binnen',
         [sp('Kruk', 'Zithoogte', '76 cm (bij statafel 107–110 cm)'), sp('Kruk', 'Zitting', 'Gestoffeerd met velours, lage rugleuning'),
          sp('Kruk', 'Frame', 'Staal, zwart gepoedercoat, voetsteun rondom'), sp('Stapelen', 'Aantal', 'Tot 5 stuks'), sp('Gebruik', 'Binnen', 'Ja, niet buiten laten staan')],
         ['tafels-stoelen.barkrukken'], 'Zachte, warme barkruk voor binnen: receptie, lounge, bedrijfsfeest; velours in 4 kleuren; stapelbaar tot 5; staffel vanaf 10.',
         ['barkruk velours', 'barkruk gestoffeerd', 'barkruk met rugleuning'], {'outmate': 'Mundo velours stapelbaar €167 per 4 (€41,75 p.st.) · Louis gestoffeerd €129–€139', 'ours': 37.95})
    seat('barkruk-pe-rotan', 'Barkruk PE-rotan voor buiten', 'Barkruk', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'],
         ['Zwart', 'Bruin', 'Grijs'], 84.95, 5000, 'BKR', 'barStool', {'style': 'rotan', 'height': 0.76, 'back': True}, 'Zwart',
         'Aluminium frame · PE-rotan vlechtwerk · zithoogte 76 cm · buiten',
         [sp('Kruk', 'Zithoogte', '76 cm'), sp('Kruk', 'Frame', 'Aluminium, gepoedercoat (roest niet)'), sp('Kruk', 'Zitting en rug', 'PE-rotan, UV-bestendig vlechtwerk'),
          sp('Kruk', 'Voetsteun', 'Ja, aluminium'), sp('Gebruik', 'Buiten', 'Ja, regen- en UV-bestendig')],
         ['tafels-stoelen.barkrukken'], 'Barkruk voor terras en buitenbar die buiten kan blijven staan: aluminium frame dat niet roest, PE-rotan dat tegen zon en regen kan.',
         ['barkruk rotan', 'barkruk buiten', 'terras barkruk'], {'note': 'geen Outmate/Statafelshop-referentie; markt PE-rotan barkrukken ca. €79–€129', 'ours': 84.95}, base=12)
    seat('barkruk-draad-stapelbaar', 'Barkruk draad stapelbaar', 'Barkruk', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
         ['Zwart', 'Wit'], 129.0, 7000, 'BKD', 'barStool', {'style': 'draad', 'height': 0.76}, 'Zwart',
         'Gelast draadstaal · zithoogte 76 cm · stapelbaar tot 8 · binnen en buiten',
         [sp('Kruk', 'Zithoogte', '76 cm'), sp('Kruk', 'Materiaal', 'Gelast staaldraad, gepoedercoat'), sp('Kruk', 'Rug', 'Lage rugleuning van draad'),
          sp('Stapelen', 'Aantal', 'Tot 8 stuks'), sp('Gebruik', 'Binnen en buiten', 'Ja')],
         ['tafels-stoelen.barkrukken'], 'Design-barkruk van draadstaal voor horeca en events, stapelbaar tot 8, binnen en buiten; zitkussen optioneel.',
         ['draad barkruk', 'barkruk draadstoel', 'barkruk stapelbaar zwart'], {'outmate': 'Paxi draadstoel zwart €147,50 (stapelbaar tot 8)', 'ours': 129.0}, base=15,
         mf_extra={'addons': ['zitkussen-stoel-en-barkruk']})
    seat('barkruk-chroom-stapelbaar', 'Barkruk chroom met kunstleren zitting', 'Barkruk', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
         ['Zwart', 'Wit', 'Antraciet'], 59.95, 6200, 'BKC', 'barStool', {'style': 'chroom', 'height': 0.76}, 'Zwart',
         'Verchroomd frame · kunstleren zitting · zithoogte 76 cm · stapelbaar tot 6',
         [sp('Kruk', 'Zithoogte', '76 cm (bij statafel 107–110 cm)'), sp('Kruk', 'Frame', 'Staal, verchroomd, buis Ø 25 mm, voetring rondom'),
          sp('Kruk', 'Zitting', 'Rond, Ø 36 cm, schuim met kunstleer, afneembaar'), sp('Stapelen', 'Aantal', 'Tot 6 stuks'),
          sp('Gebruik', 'Binnen', 'Ja; buiten alleen kort en droog (chroom en kunstleer)')],
         ['tafels-stoelen.barkrukken'], 'Klassieke horecakruk met verchroomd frame en een kunstleren zitting in zwart, wit of antraciet; veegt schoon, stapelbaar tot 6; staffel vanaf 10.',
         ['barkruk chroom', 'barkruk rvs', 'barkruk kunstleer'], {'statafelshop': 'barkrukken met RVS/chroom frame (8 modellen; prijs per model niet bevestigd)',
                                                                 'band': 'chroom barkruk met kunstleren zitting €49–€89', 'ours': 59.95}, base=20)
    seat('kruk-laag-stapelbaar', 'Lage kruk stapelbaar', 'Kruk', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement', 'gebruik:tuinfeest'],
         ['Zwart', 'Wit', 'Antraciet'], 27.95, 3500, 'KRL', 'barStool', {'style': 'metaal', 'height': 0.45}, 'Zwart',
         'Zithoogte 45 cm · gepoedercoat staal · stapelbaar tot 10',
         [sp('Kruk', 'Zithoogte', '45 cm (bij tafels van 72–76 cm)'), sp('Kruk', 'Materiaal', 'Staal, gepoedercoat'), sp('Stapelen', 'Aantal', 'Tot 10 stuks'),
          sp('Gebruik', 'Binnen en buiten', 'Ja')],
         ['tafels-stoelen.stoelen'], 'Lage kruk bij een gewone tafel, biertafel of als extra zitplek op een feest; stapelbaar, binnen en buiten.',
         ['lage kruk', 'kruk stapelbaar', 'kruk metaal'], {'note': 'geen referentie bij Outmate/Statafelshop; markt €20–€35', 'ours': 27.95}, base=40)
    seat('stapelstoel-metaal', 'Stapelstoel metaal', 'Stoel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
         ['Zwart', 'Wit', 'Antraciet'], 42.95, 4800, 'STM', 'chair', {'style': 'metaal'}, 'Zwart',
         'Gepoedercoat staal · stapelbaar tot 10 · binnen en buiten',
         [sp('Stoel', 'Zithoogte', '45 cm'), sp('Stoel', 'Materiaal', 'Staal, gepoedercoat'), sp('Stapelen', 'Aantal', 'Tot 10 stuks'),
          sp('Gebruik', 'Binnen en buiten', 'Ja, met afwateringsgaatjes in de zitting')],
         ['tafels-stoelen.stoelen'], 'Bistro-stapelstoel voor terras, kantine en verhuur; past bij onze lage kruk en metalen barkruk.',
         ['stapelstoel metaal', 'bistrostoel', 'terrasstoel stapelbaar'], {'outmate': 'Hamburg stapelstoel zwart €48,50', 'ours': 42.95}, base=40,
         mf_extra={'addons': ['zitkussen-stoel-en-barkruk']})
    seat('banquetstoel-gestoffeerd', 'Banquetstoel gestoffeerd stapelbaar', 'Stoel', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'],
         ['Zwart', 'Antraciet', 'Bordeaux', 'Marineblauw'], 49.95, 6500, 'BQS', 'chair', {'style': 'banquet'}, 'Zwart',
         'Gestoffeerde zitting en rug · stalen frame · stapelbaar tot 10',
         [sp('Stoel', 'Zithoogte', '46 cm'), sp('Stoel', 'Zitting en rug', 'Gestoffeerd, polyester stof, vlekbestendig behandeld'),
          sp('Stoel', 'Frame', 'Staal, zwart gepoedercoat'), sp('Stapelen', 'Aantal', 'Tot 10 stuks'), sp('Gebruik', 'Binnen', 'Ja')],
         ['tafels-stoelen.stoelen'], 'Klassieke congres- en diner-stapelstoel: gestoffeerd, stapelbaar tot 10, voor zalen, bruiloften en verhuur.',
         ['banquetstoel', 'congresstoel stapelbaar', 'gestoffeerde stapelstoel'], {'outmate': 'Louis stapelstoel €122,55 bij 10–25 st (luxer model)', 'ours': 49.95}, base=30)
    BNK = {'120 x 40 cm': 169.0, '180 x 40 cm': 219.0}
    BNKK = ['Antraciet', 'Zandkleur']
    vs = [variant(f'KK-MEU-BNK-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 12000 + 6000 * i, inv(6, m + k + 'bnk', k)) for i, (m, p) in enumerate(BNK.items()) for k in BNKK]
    imgs, vmap = kleur_images('bank-houten-frame', BNKK, 'bench', lambda k: {'length': 1.8, 'frame': 'eiken', 'seat': render_color(k)}, 'Antraciet', status='needs-model', p2=3)
    simple('bank-houten-frame', 'Bank met houten frame en gestoffeerde zitting', 'Bank', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Maat', list(BNK)), opt('Kleur', BNKK)], vs, imgs,
           {'kenmerk_kort': 'Massief eiken frame · gestoffeerde zitting · 120 of 180 cm', 'staffelkorting': ST_MEUBEL, 'verzending': 'pallet',
            'specificaties': [sp('Bank', 'Zithoogte', '46 cm'), sp('Bank', 'Frame', 'Massief eikenhout, geolied'), sp('Bank', 'Zitting', 'Schuimrubber met stoffen bekleding'),
                              sp('Afmetingen', 'Maten', '120 x 40 cm (2 personen) of 180 x 40 cm (3 personen)')], 'garantie': '2 jaar'},
           ['tafels-stoelen.banken'], 'meubilair', 'Bank voor lounge, receptie en horeca: warm eiken frame met gestoffeerde zitting; 2 of 3 zitplaatsen; binnen.',
           ['bank horeca', 'zitbank hout', 'lounge bank'], {'statafelshop': 'Banken: houten frame, stoffen zitting (prijs niet gevonden)', 'ours': BNK}, vmap=vmap)
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
    # one render per blad colour (the wit one keeps its file name)
    lb_imgs = [img('los-statafelblad-hero.webp', 'hero', 1, 'tableTop', {'diameter': 0.8, 'top': 'wit'}, 'hero', 'Wit', 'existing')] + \
              [img(f'los-statafelblad-{slug(k)}-hero.webp', 'variant', 2, 'tableTop', {'diameter': 0.8, 'top': {'Zwart': 'zwart', 'Antraciet': 'antraciet', 'Berken': 'berken'}[k]},
                   'hero', k, 'existing') for k in LBK if k != 'Wit']
    simple('los-statafelblad', 'Los statafelblad', 'Meubelonderdeel', ['zakelijk'], [opt('Maat', list(LB)), opt('Kleur', LBK)], vs,
           lb_imgs,
           {'kenmerk_kort': 'Vervangend blad met kantenband · Ø 70, 80 of 85 cm', 'past_op': ['statafel-inklapbaar-professional'], 'verzending': 'pakket'},
           ['tafels-stoelen.meubel-onderdelen'], 'meubilair', 'Blad beschadigd of andere look? Nieuw blad op hetzelfde onderstel.', ['statafelblad los', 'statafel blad vervangen'],
           {'note': 'Statafelshop verkoopt losse bladen (prijs onbekend)', 'ours': LB}, vmap={i['kleur']: i['file'] for i in lb_imgs})
    # spare parts per model, like the onderstel / middenstuk / schroeven Statafelshop sells (merchandising review)
    OSP = [('Onderstel compleet', 54.95, 'ONS', 8200), ('Schuifring met draaiknop', 9.95, 'SR', 300), ('Bladscharnier en schroeven', 7.95, 'BS', 250)]
    simple('onderdelen-statafel', 'Onderdelen statafel inklapbaar', 'Meubelonderdeel', ['zakelijk'], [opt('Uitvoering', [o[0] for o in OSP])],
           [variant(f'KK-MEU-OSTF-{c}', [n], pr, g, inv(10, c + 'ostf')) for n, pr, c, g in OSP],
           [img('onderdelen-statafel-hero.webp', 'hero', 1, 'statafel', {'diameter': 0.8, 'height': 1.1, 'top': 'wit', 'frame': 'zwart', 'base': 'klap', 'noTop': True}, 'detail', None, 'existing',
                alt='onderstel compleet met schuifring en bladscharnier, zonder blad',
                extra={'detail': {'target': [0, 0.54, 0], 'size': 1.42, 'azimuth': 34, 'elevation': 8, 'aperture': 0}})],
           {'kenmerk_kort': 'Onderstel, schuifring of scharnier · voor onze inklapbare statafels', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'past_op': ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80']},
           ['tafels-stoelen.meubel-onderdelen'], 'meubilair',
           'Kapotte ring of verbogen poot? Vervang het onderdeel in plaats van de hele statafel: onderstel compleet, schuifring met draaiknop, bladscharnier met schroeven; welk onderdeel waar zit.',
           ['onderdelen statafel', 'onderstel statafel', 'statafel onderstel los'], {'statafelshop': 'onderstel, middenstuk en schroeven per model (prijzen niet gevonden)',
                                                                                   'ours': {o[0]: o[1] for o in OSP}})
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
           ['tafels-stoelen.klaptafels'], 'meubilair', 'Banket- en bruiloftstafel; aantal personen per maat; rond kleed tot de grond: Ø 300 cm op Ø 150, Ø 330 cm op Ø 180.',
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
           {'kenmerk_kort': 'Heavy duty wielen · grijs hamerslag · 5 of 15 ingeklapte statafels', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80'],
            'specificaties': [sp('Kar', 'Groot', 'ca. 126 x 97 x 113 cm, tot 15 statafels Ø80'), sp('Kar', 'Klein', 'ca. 65 x 95 x 114 cm, tot 5 statafels')]},
           ['tafels-stoelen.trolleys'], 'meubilair', 'Statafels verplaatsen en opslaan zonder sjouwen; capaciteit per model.', ['transportkar statafels', 'trolley statafel'],
           {'statafelshop': 'klein €311,58 · groot €434,39', 'outmate': '10 st €589', 'ours': {t[0]: t[1] for t in TK2}})
    TK3 = [('Voor 10 klaptafels 183 cm', 249.0, 'KLT', 35), ('Voor 24 barkrukken', 229.0, 'BKR', 30), ('Voor 30 klapstoelen', 199.0, 'KLS', 26)]
    simple('transportkar-klaptafels-en-stoelen', 'Transportkar voor klaptafels en stoelen', 'Transportkar', ['zakelijk', 'pallet'], [opt('Uitvoering', [t[0] for t in TK3])],
           [variant(f'KK-MEU-TKK-{c}', [n], p, kg * 1000, inv(3, c + 'tkk')) for n, p, c, kg in TK3],
           [img('transportkar-klaptafels-en-stoelen-hero.webp', 'hero', 1, 'trolley', {'kind': 'klaptafel', 'loaded': 0}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Zwenkwielen met rem · voor klaptafels, barkrukken of klapstoelen', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['klaptafel-hdpe-rechthoekig', 'klapstoel', 'barkruk-stapelbaar-metaal', 'barkruk-houten-zitting', 'barkruk-velours-stapelbaar',
                        'barkruk-pe-rotan', 'barkruk-draad-stapelbaar', 'barkruk-chroom-stapelbaar']},
           ['tafels-stoelen.trolleys'], 'meubilair', 'Eén kar per meubeltype; capaciteit en afmetingen.', ['transportkar klaptafels', 'trolley stoelen'],
           {'outmate': 'trolley klaptafel rond 180 vanaf €482,50', 'ours': {t[0]: t[1] for t in TK3}})

    # ------------------------------------------------------------ verlichting
    PK = {'10 m': (39.95, 1.2), '20 m': (69.95, 2.3), '30 m': (99.0, 3.4), '50 m': (159.0, 5.6)}
    PKK = ['Zwart', 'Wit']
    vs = [variant(f'KK-LCHT-PK-{code(m)}-{COLOR_CODE[k]}', [m, k], p, kg * 1000, inv(15, m + k + 'pk', k)) for m, (p, kg) in PK.items() for k in PKK]
    imgs, vmap = kleur_images('prikkabel-e27', PKK, 'prikkabel', lambda k: {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': True, 'cable': render_color(k)}, 'Zwart',
                              [img('prikkabel-e27-zwart-uit.webp', 'detail', 3, 'prikkabel', {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': False}, 'hero', 'Zwart', 'existing', alt='lampen uit')], status='existing', p2=3)
    simple('prikkabel-e27', 'Prikkabel E27', 'Prikkabel', ['gebruik:tuinfeest', 'gebruik:horeca', 'gebruik:evenement'], [opt('Maat', list(PK)), opt('Kleur', PKK)], vs, imgs,
           {'kenmerk_kort': 'Fitting elke meter · IP44 · max. 25 W per fitting', 'verzending': 'pakket', 'addons': ['led-lamp-e27'], 'staffelkorting': ST_PRIK,
            'specificaties': [sp('Kabel', 'Spanning', '230 V, 16 A'), sp('Kabel', 'Fittingen', 'E27, elke 1 m'), sp('Kabel', 'Beschermingsklasse', 'IP44'), sp('Lamp', 'Max. vermogen', '25 W per fitting')]},
           ['verlichting.prikkabels'], 'verlichting', 'Sfeerverlichting voor tuin en terras: lengte = aantal fittingen, lampen apart (of als set); doorkoppelen binnen het maximum.',
           ['prikkabel', 'prikkabel 10 meter', 'lichtsnoer buiten'], {'outmate': '10 m €49 · 20 m €87 · 30 m €126', 'ours': {m: v[0] for m, v in PK.items()}}, vmap=vmap)
    vs = [variant(f'KK-LCHT-PKM-{COLOR_CODE[k]}', [k], 4.49, 120, None, tracked=False, policy='continue', qrule={'min': 5, 'max': 200, 'increment': 1}) for k in PKK]
    simple('prikkabel-op-maat', 'Prikkabel op maat (per meter)', 'Prikkabel', ['zakelijk', 'gebruik:horeca'], [opt('Kleur', PKK)], vs,
           [img('prikkabel-op-maat-hero.webp', 'hero', 1, 'prikkabel', {'bulbs': 14, 'spacing': 0.5, 'sag': 0.2, 'on': True}, 'hero', 'Zwart', 'existing'),
            # witte kabel: the prikkabel E27 render with the white cable (same cable and fittings)
            img('prikkabel-e27-wit-hero.webp', 'variant', 3, 'prikkabel', {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': True, 'cable': 'wit'}, 'hero', 'Wit', 'existing',
                extra={'shared_with': 'prikkabel-e27'})],
           {'kenmerk_kort': 'Jouw lengte tot 200 m · fittingafstand naar keuze · gemonteerd', 'levertijd': 'Levertijd 3–5 werkdagen', 'verzending': 'pakket'},
           ['verlichting.prikkabels'], 'verlichting',
           'Lengte in de configurator (aantal = meters, min. 5 m); fittingafstand, aanloop en eindstuk als keuzes; maatwerk kan niet retour.',
           ['prikkabel op maat'], {'outmate': 'op maat vanaf €9', 'ours': '€4,49 per meter, min. 5 m'},
           vmap={'Zwart': 'prikkabel-op-maat-hero.webp', 'Wit': 'prikkabel-e27-wit-hero.webp'})
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
            'staffelkorting': ST_SLANG, 'addon_modus': 'per-regel',
            'specificaties': [sp('Slang', 'LEDs', '36 per meter'), sp('Slang', 'Diameter', '13 mm'), sp('Slang', 'Beschermingsklasse', 'IP44')]},
           ['verlichting.lichtslangen'], 'verlichting', 'Lichtslang per hele meter (aantal = meters); aansluitsnoer met stekker apart (onderdelen).',
           ['led lichtslang', 'lichtslang buiten'], {'outmate': 'warm wit €8,95–€9,99 per m; 20 m €58', 'ours': '€7,95 per meter'}, vmap=vmap)
    LSS = {'15 m': (44.95, 2900), '20 m': (54.95, 3800)}
    simple('led-lichtslang-set-warm-wit', 'LED-lichtslang warm wit, set van 15 of 20 m', 'Lichtslang', ['gebruik:tuinfeest', 'gebruik:horeca'], [opt('Maat', list(LSS))],
           [variant(f'KK-LCHT-LSS-{code(m)}', [m], pr, g, inv(10, m + 'lss')) for m, (pr, g) in LSS.items()],
           [img('led-lichtslang-set-warm-wit-hero.webp', 'hero', 1, 'ropeLight', {'color': render_color('Warm wit'), 'length': 5, 'on': True}, 'hero', 'Warm wit', 'existing',
                alt='warm wit, brandend, op de haspel')],
           {'kenmerk_kort': 'Vaste rol 15 of 20 m · warm wit · stekker en eindkap gemonteerd', 'verzending': 'pakket', 'staffelkorting': ST_PRIK,
            'specificaties': [sp('Slang', 'LEDs', '36 per meter, warm wit (ca. 2200 K)'), sp('Slang', 'Diameter', '13 mm'), sp('Slang', 'Beschermingsklasse', 'IP44'),
                              sp('Set', 'Inbegrepen', 'Lichtslang op lengte, aansluitsnoer met stekker en eindkap gemonteerd')]},
           ['verlichting.lichtslangen'], 'verlichting',
           'Klaar om in te pluggen: vaste lengte 15 of 20 m warm wit met stekker en eindkap; goedkoper per meter dan los op maat; voor wie geen eigen lengte nodig heeft.',
           ['lichtslang 20 meter', 'lichtslang warm wit set', 'led lichtslang 15 m'], {'outmate': 'lichtslang 20 m set €58', 'ours': {m: v[0] for m, v in LSS.items()}})
    simple('kerstverlichting-10-m', 'Kerstverlichting 10 m, 100 LEDs', 'Kerstverlichting', ['gebruik:horeca'], [opt('Uitvoering', ['Warm wit', 'Warm wit fonkelend'])],
           [variant('KK-LCHT-KV-WW', ['Warm wit'], 29.95, 700, 40), variant('KK-LCHT-KV-FK', ['Warm wit fonkelend'], 32.95, 700, 30)],
           [img('kerstverlichting-10-m-hero.webp', 'hero', 1, 'stringLights', {'kind': 'kerst', 'count': 100, 'on': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Doorkoppelbaar · IP65 · 2200 K', 'verzending': 'pakket'},
           ['verlichting.kerstverlichting'], 'verlichting', 'Professionele kerstverlichting voor gevel, boom en terras; doorkoppelbaar.', ['kerstverlichting buiten', 'kerstverlichting doorkoppelbaar'],
           {'outmate': '€33,99 / €35', 'ours': {'Warm wit': 29.95, 'Warm wit fonkelend': 32.95}})
    simple('led-vloedlicht-easy-up', 'LED-vloedlicht voor easy-up 30 W', 'Tentverlichting', ['zakelijk', 'gebruik:evenement', 'gebruik:markt'], [],
           [variant('KK-LCHT-VL30', [], 74.95, 1400, 20)],
           [img('led-vloedlicht-easy-up-hero.webp', 'hero', 1, 'floodLight', {'watt': 30, 'clamp': True}, 'hero', None, 'existing'),
            img('led-vloedlicht-easy-up-in-tent.webp', 'in-gebruik', 3, 'items', {'items': [{'model': 'easyUpTent', 'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit'},
                                                                                         {'model': 'floodLight', 'watt': 30, 'mountedOn': 'leg'}]}, 'low', None, 'needs-model',
                alt='aan de poot van een easy-up (tent niet inbegrepen)')],
           {'kenmerk_kort': '30 W · 2.400 lumen · klem voor poten tot 50 mm · IP65', 'verzending': 'pakket', 'past_op': list(EU_TENTS),
            'specificaties': [sp('Lamp', 'Vermogen', '30 W LED'), sp('Lamp', 'Lichtstroom', 'ca. 2.400 lumen, 4000 K'), sp('Lamp', 'Beschermingsklasse', 'IP65'),
                              sp('Bevestiging', 'Klem', 'Voor zeskantpoten van 40 en 50 mm, kantelbaar'), sp('Aansluiting', 'Kabel', '3 m met stekker, 230 V')],
            'garantie': '1 jaar'},
           ['easy-up-accessoires.easy-up-inrichting', 'verlichting.prikkabels'], 'verlichting',
           'Werklicht en sfeerlicht in de tent: klemt aan de poot, 2.400 lumen; voor markt, opbouw in het donker en avondevenementen.',
           ['led lamp partytent', 'verlichting easy up', 'vloedlicht tent'], {'outmate': 'Easy-up LED-vloedlicht 30 W €129', 'ours': 74.95,
                                                                            'note': 'onder Outmate gezet: 30 W LED-vloedlicht is elders een standaardartikel (eigenaar beoordeelt)'})
    PO = [('E27-fitting zwart', 1.39, 'FZ'), ('E27-fitting wit', 1.49, 'FW'), ('Eindkap', 1.95, 'EK'), ('Stekkerdimmer tot 280 W', 9.95, 'SD'),
          ('Dimmer met afstandsbediening tot 500 W', 24.95, 'DA'), ('Tijdschakelaar', 7.95, 'TS'), ('Aansluitsnoer lichtslang met stekker', 9.95, 'AS'), ('Verlengkabel 10 m zwart', 12.95, 'VK'),
          ('Rubberkabel per meter zwart (2 x 1,5 mm²)', 1.95, 'KPM')]
    simple('onderdelen-prikkabel-en-lichtslang', 'Onderdelen prikkabel en lichtslang', 'Verlichting onderdeel', [], [opt('Uitvoering', [p[0] for p in PO])],
           [variant(f'KK-LCHT-OND-{c}', [n], p, 110 if c == 'KPM' else 100, inv(60, c + 'po')) for n, p, c in PO],
           [img('onderdelen-prikkabel-en-lichtslang-hero.webp', 'hero', 1, 'lightParts', {'parts': ['fitting', 'eindkap', 'dimmer']}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Fittingen, dimmers, timer, snoeren en kabel per meter', 'verzending': 'pakket',
            'past_op': ['prikkabel-e27', 'prikkabel-op-maat', 'led-lichtslang', 'led-lichtslang-set-warm-wit']},
           ['verlichting.verlichting-onderdelen'], 'verlichting', 'Reserve-onderdelen en slimme extra’s (dimmer, timer).', ['dimmer prikkabel', 'fitting prikkabel'],
           {'outmate': 'fitting €1,50–€1,69 · dimmer €9,99', 'ours': {p[0]: p[1] for p in PO}})

    # ------------------------------------------------------------ verwarming
    simple('elektrische-heater-partytent', 'Elektrische heater voor partytent', 'Verwarming', ['gebruik:horeca', 'gebruik:evenement'],
           [opt('Uitvoering', ['1500 W met klem voor easy-up', '1500 W met afstandsbediening en LED-lamp', '2100 W IP24 met beugel'])],
           [variant('KK-VRW-EL-1500', ['1500 W met klem voor easy-up'], 109.0, 3500, 12), variant('KK-VRW-EL-1500AB', ['1500 W met afstandsbediening en LED-lamp'], 119.0, 3800, 8),
            variant('KK-VRW-EL-2100', ['2100 W IP24 met beugel'], 149.0, 4200, 8)],
           [img('elektrische-heater-partytent-hero.webp', 'hero', 1, 'heater', {'kind': 'elektrisch', 'watt': 1500, 'clamp': True}, 'hero', None, 'existing'),
            img('elektrische-heater-partytent-in-tent.webp', 'in-gebruik', 3, 'items', {'items': [{'model': 'easyUpTent', 'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit'},
                                                                                              {'model': 'heater', 'kind': 'elektrisch', 'mountedOn': 'leg'}]}, 'low', None, 'needs-model', alt='aan de poot van een easy-up (tent niet inbegrepen)')],
           {'kenmerk_kort': 'Infrarood · 3 standen · tot ca. 14–19 m²', 'verzending': 'pakket', 'past_op': list(EU_TENTS),
            'specificaties': [sp('Heater', '1500 W', '600/900/1500 W, ca. 14 m², klem voor 40–50 mm poot'),
                              sp('Heater', '1500 W met afstandsbediening', '3 standen, ca. 10 m², met LED-lamp, ophangbeugel'),
                              sp('Heater', '2100 W', '900/1420/2100 W, max. 19 m², IP24')], 'garantie': '1 jaar'},
           ['verwarming.elektrisch', 'easy-up-accessoires.easy-up-inrichting'], 'verwarming', 'Warmte zonder gas in de tent; vermogen per m², afstand tot doek, alleen op een geaarde groep.',
           ['heater partytent', 'terrasverwarming elektrisch'], {'outmate': 'easy-up heater 1500 W €129', 'ours': {'1500 W': 109, '2100 W': 149}})
    simple('infraroodbrander-elektrische-heater', 'Vervangende infraroodbrander voor elektrische heater', 'Verwarming', ['gebruik:horeca', 'gebruik:evenement'],
           [opt('Uitvoering', ['Voor 1500 W heater', 'Voor 2100 W heater'])],
           [variant('KK-VRW-BR-1500', ['Voor 1500 W heater'], 29.95, 400, 15), variant('KK-VRW-BR-2100', ['Voor 2100 W heater'], 39.95, 500, 10)],
           [img('infraroodbrander-elektrische-heater-hero.webp', 'hero', 1, 'heaterElement', {'watt': 1500}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'Vervangend infraroodelement · 1500 of 2100 W · zelf te wisselen', 'verzending': 'pakket', 'past_op': ['elektrische-heater-partytent'],
            'garantie': '6 maanden',
            'specificaties': [sp('Element', 'Voor 1500 W heater', 'Halogeen-infraroodbuis 1500 W, past in beide 1500 W-uitvoeringen'),
                              sp('Element', 'Voor 2100 W heater', 'Carbon-infraroodbuis 2100 W, voor de 2100 W IP24'),
                              sp('Montage', 'Wisselen', 'Stekker eruit, laten afkoelen, beschermrooster los (4 schroeven), buis wisselen'),
                              sp('Levering', 'Inbegrepen', 'Infraroodbuis met 2 klemveren')]},
           ['verwarming.verwarming-accessoires'], 'verwarming',
           'Reservebrander zodat je heater na een kapotte buis niet afgeschreven is; welke buis bij welke heater; wisselen zonder gereedschap behalve een schroevendraaier; nooit aanraken met blote handen (vet op halogeen).',
           ['infraroodbrander heater', 'vervangende brander terrasheater', 'infrarood lamp heater'], {'outmate': 'vervangende infrarood brander (prijs niet gevonden)', 'ours': {'1500 W': 29.95, '2100 W': 39.95}})
    simple('terrasheater-gas-13-kw', 'Terrasheater op gas 13 kW', 'Verwarming', ['gebruik:horeca', 'pallet'], [],
           [variant('KK-VRW-GAS-13', [], 179.0, 22000, 6)],
           [img('terrasheater-gas-13-kw-hero.webp', 'hero', 1, 'heater', {'kind': 'gas', 'style': 'paddenstoel'}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'RVS · 13 kW · omvalbeveiliging · gasfles apart', 'verzending': 'pallet', 'garantie': '1 jaar'},
           ['verwarming.gas'], 'verwarming', 'Klassieke paddenstoelheater voor buiten; nooit in een gesloten tent; gasfles en drukregelaar niet inbegrepen.',
           ['terrasheater gas', 'gasheater terras'], {'note': 'geen referentieprijs gevonden', 'ours': 179})
    simple('loungeheater-gas', 'Loungeheater op gas', 'Verwarming', ['gebruik:horeca', 'gebruik:tuinfeest'],
           [opt('Uitvoering', ['Staand model 9 kW', 'Tafelmodel 3 kW'])],
           [variant('KK-VRW-LOUNGE-9', ['Staand model 9 kW'], 249.0, 16000, 6), variant('KK-VRW-LOUNGE-3', ['Tafelmodel 3 kW'], 109.0, 6500, 10)],
           [img('loungeheater-gas-hero.webp', 'hero', 1, 'heater', {'kind': 'gas', 'style': 'lounge'}, 'hero', None, 'existing'),
            img('loungeheater-gas-tafelmodel.webp', 'variant', 3, 'heater', {'kind': 'gas', 'style': 'tafel'}, 'hero', None, 'existing', alt='tafelmodel')],
           {'kenmerk_kort': 'Lage gasheater op zithoogte · staand 9 kW of tafelmodel 3 kW', 'verzending': 'pakket', 'garantie': '1 jaar',
            'specificaties': [sp('Heater', 'Staand model', '9 kW, ca. 75 cm hoog, gasfles van max. 10 kg in de voet'),
                              sp('Heater', 'Tafelmodel', '3 kW, op een tafel, met slang naar een losse gasfles'),
                              sp('Gas', 'Brandstof', 'Propaan, drukregelaar 37 mbar meegeleverd'), sp('Veiligheid', 'Beveiliging', 'Thermokoppeling en omvalbeveiliging'),
                              sp('Gebruik', 'Waar', 'Alleen buiten of in een open overkapping, nooit in een gesloten tent')]},
           ['verwarming.gas'], 'verwarming', 'Warmte op zithoogte voor lounge en terras; staand of tafelmodel; nooit in een gesloten tent; gasfles apart.',
           ['loungeheater', 'tafelheater gas', 'terrasverwarming gas'], {'outmate': 'area lounge heater en table lounge heater 3000 W (prijzen niet gevonden)', 'ours': {'staand': 249, 'tafel': 109}},
           vmap={'Staand model 9 kW': 'loungeheater-gas-hero.webp', 'Tafelmodel 3 kW': 'loungeheater-gas-tafelmodel.webp'}, vby='Uitvoering')
    simple('flameheater-gas-9-kw', 'Flameheater op gas 9 kW', 'Verwarming', ['gebruik:horeca', 'gebruik:evenement', 'pallet'], [],
           [variant('KK-VRW-FLAME-9', [], 329.0, 32000, 5)],
           [img('flameheater-gas-9-kw-hero.webp', 'hero', 1, 'heater', {'kind': 'gas', 'style': 'flame'}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'Zichtbare vlam in glazen buis · 9 kW · ca. 225 cm hoog · gasfles apart', 'verzending': 'pallet', 'garantie': '1 jaar',
            'specificaties': [sp('Heater', 'Vermogen', '9 kW, traploos regelbaar'), sp('Heater', 'Hoogte', 'ca. 225 cm'), sp('Heater', 'Glazen buis', 'Gehard glas, vlam zichtbaar'),
                              sp('Gas', 'Brandstof', 'Propaan, gasfles van max. 10 kg in de voet'), sp('Veiligheid', 'Beveiliging', 'Thermokoppeling en omvalbeveiliging'),
                              sp('Gebruik', 'Waar', 'Alleen buiten, nooit in een tent of onder een laag dak')]},
           ['verwarming.gas'], 'verwarming', 'Sfeer én warmte bij de ingang of op het terras: vlam in een glazen buis; afstand tot doek en dak; alleen buiten.',
           ['flameheater', 'heater met vlam', 'piramide heater gas'], {'outmate': 'flame heater 9000 W (prijs niet gevonden)', 'ours': 329})
    simple('beschermhoes-terrasheater', 'Beschermhoes terrasheater', 'Verwarming', ['gebruik:horeca'], [],
           [variant('KK-VRW-HOES', [], 19.95, 700, 20)],
           [img('beschermhoes-terrasheater-hero.webp', 'hero', 1, 'heaterCover', {}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Waterdicht · met rits en trekkoord', 'verzending': 'pakket', 'past_op': ['terrasheater-gas-13-kw', 'flameheater-gas-9-kw']},
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
           [img('afzetpaal-met-logo-hero.webp', 'hero', 1, 'stanchion', {'finish': 'rvs', 'belt': 'rood', 'beltPrint': {'svg': 'brand/tools/print-wordmark-klein.json', 'color': '#FBF6EC'}, 'pair': True},
                'hero', None, 'needs-model', alt='met voorbeeldopdruk Klapklaar op de band')],
           {'kenmerk_kort': 'Jouw logo op de band · vanaf 10 stuks · drukproef vooraf', 'bedrukbaar': True,
            'drukopties': {'posities': ['Trekband (herhalend)'], 'aanlevering': AANLEVERING, 'levertijd': '2–3 weken na akkoord drukproef', 'min_aantal': 10},
            'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd 2–3 weken na akkoord drukproef', 'verzending': 'pakket'},
           ['inrichting-evenement.afzetpalen'], 'inrichting', 'Afzetten én zichtbaar zijn: logo herhalend op de band; minimaal 10 stuks.', ['afzetpaal bedrukt', 'afzetpaal logo'],
           {'outmate': 'bedrukte trekband min. 10 st (prijs niet gevonden)', 'ours': 69.95})
    MK = ['Wit', 'Rood', 'Blauw', 'Groen']
    MKU = ['Effen kap', 'Bedrukte kap']
    vs = [variant(f'KK-INR-MKR-{COLOR_CODE[k]}', [MKU[0], k], 479.0, 45000, inv(4, k + 'mkr', k)) for k in MK]
    vs.append(variant('KK-INR-MKR-BDR-WIT', [MKU[1], 'Wit'], 729.0, 46000, None, tracked=False))
    imgs, vmap = kleur_images('marktkraam-2-m', MK, 'marketStall', lambda k: {'w': 2, 'canopyColor': render_color(k), **render_finish(k)}, 'Rood', status='needs-model', p2=3)
    imgs.append(img('marktkraam-2-m-bedrukte-kap.webp', 'variant', 2, 'marketStall', {'w': 2, 'canopyColor': 'wit', 'canopyPrint': {'artwork': 'brand/img/voorbeeld-fullcolour.png'}},
                    'hero', 'Wit', 'needs-model', alt='met een voorbeeldontwerp op de bedrukte kap'))
    simple('marktkraam-2-m', 'Marktkraam 2 m gegalvaniseerd', 'Marktkraam', ['zakelijk', 'pallet', 'bedrukbaar', 'gebruik:markt'], [opt('Uitvoering', MKU), opt('Kleur', MK)], vs, imgs,
           {'kenmerk_kort': 'Gegalvaniseerd frame · 2 m tafel · PVC-kap, effen of bedrukt', 'verzending': 'pallet', 'garantie': '1 jaar',
            'staffelkorting': ST_MARKT, 'bedrukbaar': True,
            'drukopties': {'posities': ['Kap (dak en randen, full colour)'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1,
                           'optie': 'Uitvoering', 'zonder': ['Effen kap']}},
           ['inrichting-evenement.marktkramen'], 'inrichting', 'Voor scholen, verenigingen en markten: opzetten zonder gereedschap; kap in kleur, bedrukt via offerte.',
           ['marktkraam kopen', 'marktkraam 2 meter', 'marktkraam bedrukt'], {'outmate': '€533–€599 (kap standaard of bedrukt)', 'ours': {'effen': 479, 'bedrukt': 729}}, vmap=vmap,
           extra={'variant_image_sku': {'KK-INR-MKR-BDR-WIT': 'marktkraam-2-m-bedrukte-kap.webp'}})
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
         'images': [img('cadeaubon-hero.webp', 'hero', 1, 'giftCard', {'design': 'brand', 'generator': 'catalog/tools/giftcard.py'}, 'hero', None, 'generated', alt='Klapklaar cadeaubon')],
         'metafields': {'kenmerk_kort': 'Digitaal · direct in je mail · te besteden aan alles'},
         'covers': [], 'family': 'cadeaubon', 'weight': 1,
         'copy_brief': 'Digitale cadeaubon; geldigheid is een owner-claim (wettelijk minimum controleren).', 'seo_keywords': ['cadeaubon partytent'], 'price_ref': {}})

def top_param_patio(k):
    return {'Zwart': 'zwart', 'Wit': 'wit', 'Houtlook': 'houtlook'}[k]
