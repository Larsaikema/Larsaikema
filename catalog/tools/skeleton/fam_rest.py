# Meubilair, verlichting, verwarming, inrichting & evenement, cadeaubon.
from kk_base import *
from fam_acc import simple, eu_all, EU_PRINT

def build():
    global EU_TENTS
    EU_TENTS = eu_all()
    # ------------------------------------------------------------ zitten
    BK = ['Zwart', 'Wit', 'Antraciet', 'Rood', 'Blauw', 'Groen', 'Taupe']   # M9: 7 colours (the reference sells metal stools in 6-8)
    vs = [variant(f'KK-MEU-BKM-{COLOR_CODE[k]}', [k], 34.95, 5500, inv(60, k + 'bkm', k)) for k in BK]
    imgs, vmap = kleur_images('barkruk-stapelbaar-metaal', BK, 'barStool', lambda k: {'style': 'metaal', 'color': render_color(k), 'height': 0.76}, 'Zwart',
                              [img('barkruk-stapelbaar-metaal-zwart-gestapeld.webp', 'detail', 3, 'barStool', {'style': 'metaal', 'color': 'zwart', 'stack': 4}, 'hero', 'Zwart', 'needs-model', alt='4 gestapeld')],
                              status='needs-model', p2=3)
    simple('barkruk-stapelbaar-metaal', 'Barkruk stapelbaar metaal', 'Barkruk', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'], [opt('Kleur', BK)], vs, imgs,
           {'kenmerk_kort': 'Zithoogte 76 cm · stapelbaar tot 10 · binnen en buiten', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 5.5,
            'specificaties': [sp('Kruk', 'Zithoogte', '76 cm (bij statafel 107–110 cm)'), sp('Kruk', 'Materiaal', 'Staal, gepoedercoat'), sp('Kruk', 'Stapelbaar', 'Tot 10 stuks')]},
           ['tafels-stoelen.barkrukken'], 'meubilair', 'Stapelbare horecakruk op de juiste hoogte bij een statafel van 110 cm; staffel vanaf 10.',
           ['barkruk stapelbaar', 'barkruk metaal zwart'], {'outmate': 'Hamburg €32,75 (actie) / €39', 'statafelshop': 'Indus ca. €39', 'ours': 34.95}, vmap=vmap)
    # catalog round 4: the frame in zwart, wit or antraciet (it had one colour, a one-value Kleur option); Kleur = frame colour
    BKHK = ['Zwart', 'Wit', 'Antraciet']
    simple('barkruk-houten-zitting', 'Barkruk met houten zitting', 'Barkruk', ['zakelijk', 'gebruik:horeca'], [opt('Kleur', BKHK)],
           [variant(f'KK-MEU-BKH-{COLOR_CODE[k]}', [k], 49.95, 6500, 30) for k in BKHK],
           [img('barkruk-houten-zitting-hero.webp', 'hero', 1, 'barStool', {'style': 'hout', 'color': 'zwart', 'height': 0.76}, 'hero', 'Zwart', 'needs-model')] +
           [img(f'barkruk-houten-zitting-{slug(k)}-hero.webp', 'variant', 3, 'barStool', {'style': 'hout', 'color': render_color(k), 'height': 0.76}, 'hero', k, 'needs-param')
            for k in BKHK[1:]],
           {'kenmerk_kort': 'Stalen frame in 3 kleuren · eiken-look zitting · stapelbaar', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 6.5,
            'specificaties': [sp('Kruk', 'Zithoogte', '76 cm (bij statafel 107–110 cm)'), sp('Kruk', 'Frame', 'Staal, gepoedercoat: zwart, wit of antraciet'),
                              sp('Kruk', 'Zitting', 'Multiplex met eiken fineer, gelakt'), sp('Stapelen', 'Aantal', 'Tot 8 stuks')]},
           ['tafels-stoelen.barkrukken'], 'meubilair', 'Warmere uitstraling dan full-metaal; horeca en verhuur; frame in zwart, wit of antraciet.',
           ['barkruk hout', 'barkruk houten zitting', 'barkruk wit hout'],
           {'outmate': 'Hamburg met houten zitting (prijs onbekend)', 'ours': 49.95},
           vmap={'Zwart': 'barkruk-houten-zitting-hero.webp', **{k: f'barkruk-houten-zitting-{slug(k)}-hero.webp' for k in BKHK[1:]}})
    # catalog round 3: a barkruk in the style of the wijnvat (the wijnvat-set used the houten-zitting kruk; reference barrel stool € 99)
    simple('barkruk-wijnvat', 'Barkruk wijnvat houtlook', 'Barkruk', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'], [],
           [variant('KK-MEU-BKV', [], 89.0, 7500, 12)],
           [img('barkruk-wijnvat-hero.webp', 'hero', 1, 'barStool', {'style': 'vat', 'finish': 'houtlook', 'height': 0.76}, 'hero', None, 'needs-param',
                alt='kruk in de vorm van een klein wijnvat in houtlook met hoepels')],
           {'kenmerk_kort': 'Vatvormige kruk · zithoogte 76 cm · kunststof in houtlook', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 7.5,
            'past_op': ['statafel-wijnvat-houtlook'],
            'specificaties': [sp('Kruk', 'Zithoogte', '76 cm (bij een statafel van 105–110 cm)'), sp('Kruk', 'Materiaal', 'Polyethyleen (PE) in houtlook met nerf en hoepels, zitting met kussenrand'),
                              sp('Kruk', 'Gebruik', 'Binnen en buiten'), sp('Kruk', 'Stapelbaar', 'Nee')]},
           ['tafels-stoelen.barkrukken', 'tafels-stoelen.barrels-sets'], 'meubilair',
           'De kruk die bij de wijnvat-statafel hoort: zelfde houtlook en hoepels, 76 cm zithoogte; binnen en buiten; niet stapelbaar (eerlijk zeggen).',
           ['barkruk wijnvat', 'barrel kruk', 'wijnvat kruk'], {'outmate': 'Barrel barkruk €99', 'ours': 89.0})
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
         ['Zwart', 'Bruin', 'Grijs'], 129.0, 5000, 'BKR', 'barStool', {'style': 'rotan', 'height': 0.76, 'back': True}, 'Zwart',
         'Aluminium frame · PE-rotan vlechtwerk · zithoogte 76 cm · buiten',
         [sp('Kruk', 'Zithoogte', '76 cm'), sp('Kruk', 'Frame', 'Aluminium, gepoedercoat (roest niet)'), sp('Kruk', 'Zitting en rug', 'PE-rotan, UV-bestendig vlechtwerk'),
          sp('Kruk', 'Voetsteun', 'Ja, aluminium'), sp('Gebruik', 'Buiten', 'Ja, regen- en UV-bestendig')],
         ['tafels-stoelen.barkrukken'], 'Barkruk voor terras en buitenbar die buiten kan blijven staan: aluminium frame dat niet roest, PE-rotan dat tegen zon en regen kan.',
         ['barkruk rotan', 'barkruk buiten', 'terras barkruk'], {'statafelshop': 'Barkruk Rotan €151,25 (live, 2026-10-18)', 'ours': 129.0,
                                                                'rule': 'catalogusronde 4: ca. 15% onder de referentie (was € 84,95, 44% eronder)'}, base=12)
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
         ['Zwart', 'Wit', 'Antraciet', 'Rood', 'Blauw', 'Groen', 'Taupe'], 42.95, 4800, 'STM', 'chair', {'style': 'metaal'}, 'Zwart',
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
    vs = [variant(f'KK-MEU-KLS-{COLOR_CODE[k]}', [k], 19.95, 3200,   # catalog round 3: was 20% under the reference (€ 22,50)
                   inv(80, k + 'kls', k)) for k in KS]
    imgs, vmap = kleur_images('klapstoel', KS, 'chair', lambda k: {'style': 'klapstoel', 'color': render_color(k)}, 'Wit', status='needs-model', p2=3)
    simple('klapstoel', 'Klapstoel', 'Stoel', ['zakelijk', 'gebruik:evenement', 'gebruik:tuinfeest'], [opt('Kleur', KS)], vs, imgs,
           {'kenmerk_kort': 'Kunststof zitting · stalen frame · plat opvouwbaar', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 3.2},
           ['tafels-stoelen.stoelen'], 'meubilair', 'Klapstoel voor ceremonies, scholen en feesten; per 10 goedkoper.', ['klapstoel', 'klapstoelen wit'],
           {'outmate': 'Klapstoel Milo €22,50–€27 (live, 2026-10-18)', 'ours': 19.95}, vmap=vmap)
    CB = ['Eiken', 'Zwart']   # catalog round 3: 'Houtlook' is 'Eiken' everywhere (one Kleur filter value for the oak look)
    vs = [variant(f'KK-MEU-CBS-{COLOR_CODE[k]}', [k], 79.95, 5800, inv(20, k + 'cbs', k)) for k in CB]
    imgs, vmap = kleur_images('stapelstoel-cross-back', CB, 'chair', lambda k: {'style': 'crossback', 'color': render_color(k)}, 'Eiken', status='needs-model', p2=3)
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
    # L13 (catalog round 2026-10-18): square and rectangular bladen too (for the vierkante en rechthoekige statafels and terrastafels)
    # catalog round 4: 70 x 70 and 120 x 70 cm ca. 9% under the reference (€ 65 / € 85; they were 26% / 18% under it); 80 x 80 and 120 x 60 cm
    # follow the ladder (no larger blad under a smaller one)
    LB = {'Ø70 cm': 39.95, 'Ø80 cm': 44.95, 'Ø85 cm': 49.95, '60 x 60 cm': 42.95, '70 x 70 cm': 58.95, '80 x 80 cm': 62.95, '120 x 60 cm': 72.95,
          '120 x 70 cm': 76.95, '160 x 60 cm': 84.95}
    LBK = ['Wit', 'Zwart', 'Antraciet', 'Berken']
    vs = [variant(f'KK-MEU-BLAD-{code(m)}-{COLOR_CODE[k]}', [m, k], p + (10 if k == 'Berken' else 0), 6000 if m.startswith('Ø') else int(eval(m.replace(' cm', '').replace(' x ', '*')) * 1.1),
                  inv(6, m + k + 'blad', k)) for m, p in LB.items() for k in LBK]
    # one render per blad colour (the wit one keeps its file name)
    lb_imgs = [img('los-statafelblad-hero.webp', 'hero', 1, 'tableTop', {'diameter': 0.8, 'top': 'wit'}, 'hero', 'Wit', 'existing')] + \
              [img(f'los-statafelblad-{slug(k)}-hero.webp', 'variant', 2, 'tableTop', {'diameter': 0.8, 'top': {'Zwart': 'zwart', 'Antraciet': 'antraciet', 'Berken': 'berken'}[k]},
                   'hero', k, 'existing') for k in LBK if k != 'Wit']
    simple('los-statafelblad', 'Los statafelblad', 'Meubelonderdeel', ['zakelijk'], [opt('Maat', list(LB)), opt('Kleur', LBK)], vs,
           lb_imgs,
           {'kenmerk_kort': 'Vervangend blad met kantenband · rond, vierkant of rechthoekig', 'verzending': 'pakket',
            'past_op': ['statafel-inklapbaar-professional', 'statafel-vierkant-stapelbaar', 'statafel-rechthoekig-inklapbaar', 'terrastafel-inklapbaar', 'terrastafel-rond-inklapbaar']},
           ['tafels-stoelen.meubel-onderdelen'], 'meubilair', 'Blad beschadigd of andere look? Nieuw blad op hetzelfde onderstel.', ['statafelblad los', 'statafel blad vervangen'],
           {'outmate': 'los blad Ø70 €28,50–€59 · Ø80 €45–€79 · Ø85 €55–€69 · 60x60 €47,50 · 70x70 €65 · 120x70 €85' + ' (live, 2026-10-18)', 'statafelshop': 'los tafelblad €40,54–€67,16 (live, 2026-10-18)', 'ours': LB}, vmap={i['kleur']: i['file'] for i in lb_imgs})
    # spare parts per model, like the onderstel / middenstuk / schroeven Statafelshop sells (merchandising review)
    OSP = [('Onderstel compleet', 56.95, 'ONS', 8200), ('Schuifring met draaiknop', 9.95, 'SR', 300), ('Bladscharnier en schroeven', 7.95, 'BS', 250),
           # L13: parasolgatdop and bladsteun (the cross under the blad)
           ('Afdekdop parasolgat', 3.95, 'PGD', 30), ('Bladsteun (kruis onder het blad)', 12.95, 'BLS', 900)]
    simple('onderdelen-statafel', 'Onderdelen statafel inklapbaar', 'Meubelonderdeel', ['zakelijk'], [opt('Uitvoering', [o[0] for o in OSP])],
           [variant(f'KK-MEU-OSTF-{c}', [n], pr, g, inv(10, c + 'ostf')) for n, pr, c, g in OSP],
           [img('onderdelen-statafel-hero.webp', 'hero', 1, 'statafel', {'diameter': 0.8, 'height': 1.1, 'top': 'wit', 'frame': 'zwart', 'base': 'klap', 'noTop': True}, 'detail', None, 'existing',
                alt='onderstel compleet met schuifring en bladscharnier, zonder blad',
                extra={'detail': {'target': [0, 0.54, 0], 'size': 1.42, 'azimuth': 34, 'elevation': 8, 'aperture': 0}})],
           {'kenmerk_kort': 'Onderstel, schuifring, scharnier, bladsteun, parasoldop', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'past_op': ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80', 'terrastafel-rond-inklapbaar']},
           ['tafels-stoelen.meubel-onderdelen'], 'meubilair',
           'Kapotte ring of verbogen poot? Vervang het onderdeel in plaats van de hele statafel: onderstel compleet, schuifring met draaiknop, bladscharnier met schroeven; welk onderdeel waar zit.',
           ['onderdelen statafel', 'onderstel statafel', 'statafel onderstel los'], {'outmate': 'onderstel statafel €42,50–€106,50 per model · middenstuk €4 · boutenset €3 (live, 2026-10-18)',
                                                                                   'ours': {o[0]: o[1] for o in OSP}})
    # ------------------------------------------------------------ tafels
    # catalog round 5 (low): the 122 x 61 cm sat 20-30% under the market floor (Statafelshop € 74,96, Outmate € 85,50): now ca. 9% under the lower one
    KT = [('122 x 61 cm', 'Vast blad', 67.95, 10), ('183 x 76 cm', 'Vast blad', 74.95, 16), ('183 x 76 cm', 'In het midden inklapbaar', 79.95, 15), ('244 x 76 cm', 'Vast blad', 99.0, 23)]
    simple('klaptafel-hdpe-rechthoekig', 'Klaptafel HDPE rechthoekig', 'Klaptafel', ['zakelijk', 'gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Maat', ['122 x 61 cm', '183 x 76 cm', '244 x 76 cm']), opt('Uitvoering', ['Vast blad', 'In het midden inklapbaar'])],
           [variant(f'KK-MEU-KLT-{code(m)}-{"V" if u == "Vast blad" else "K"}', [m, u], p, kg * 1000, inv(30, m + u)) for m, u, p, kg in KT],
           [img('klaptafel-hdpe-rechthoekig-hero.webp', 'hero', 1, 'klaptafel', {'length': 1.83, 'width': 0.76, 'height': 0.74}, 'hero', None, 'existing'),
            img('klaptafel-hdpe-rechthoekig-ingeklapt.webp', 'detail', 3, 'klaptafel', {'length': 1.83, 'width': 0.76, 'folded': True}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'HDPE-blad 74 cm hoog · tot 8 personen (183 cm) · binnen en buiten', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pakket',
            'addons': ['stretchhoes-klaptafel'], 'specificaties': [sp('Blad', 'Materiaal', 'HDPE blow-mould, lichtgrijs/wit'), sp('Onderstel', 'Materiaal', 'Staal, grijs gepoedercoat, inklapbaar')]},
           ['tafels-stoelen.klaptafels'], 'meubilair', 'Werkpaard voor buffet en vergadering: maten met aantal personen, inklapbaar in het midden = koffermodel.',
           ['klaptafel', 'klaptafel 183', 'buffettafel'], {'statafelshop': '180x76 €85,85 · 122x61 €74,96', 'outmate': '180x76 vouwbaar €95,50 · 122x61 €85,50', 'ours': {f'{m} {u}': p for m, u, p, kg in KT}})
    simple('klaptafel-hdpe-rond', 'Klaptafel HDPE rond', 'Klaptafel', ['zakelijk', 'gebruik:evenement'], [opt('Maat', ['Ø150 cm', 'Ø180 cm'])],
           [variant('KK-MEU-KLR-D150', ['Ø150 cm'], 169.0, 24000, 8), variant('KK-MEU-KLR-D180', ['Ø180 cm'], 219.0, 30000, 8)],
           [img('klaptafel-hdpe-rond-hero.webp', 'hero', 1, 'klaptafel', {'shape': 'rond', 'diameter': 1.8, 'height': 0.74}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'Ronde banket-tafel · 8 (Ø150) of 10 (Ø180) personen', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet'},
           ['tafels-stoelen.klaptafels'], 'meubilair', 'Banket- en bruiloftstafel; aantal personen per maat; rond kleed tot de grond: Ø 300 cm op Ø 150, Ø 330 cm op Ø 180.',
           ['ronde klaptafel', 'banket tafel rond'], {'outmate': 'Ø150 €188,50 · Ø180 €254,50', 'ours': {'Ø150 cm': 169, 'Ø180 cm': 219}})
    # catalog round 3 (H3 for the terrace tables): the decor set of the hoekige statafels (binnen 7, compact HPL buiten 12; 'Houtlook' is
    # 'Eiken' now) and prices ca. 10% under the reference (Outmate 70x70 € 132, 120x70 € 299; Statafelshop Kansas € 148,82-189,96)
    from fam_tafel import HOEK_DECORS, HOEK_DECOR_EXTRA, hoek_combos, hoek_sku, top_param
    TT = {'60 x 60 cm': 109.0, '70 x 70 cm': 119.0, '120 x 70 cm': 269.0}
    TTU = ['Binnen, zwart onderstel', 'Buiten (compact HPL), zwart onderstel']
    TK = HOEK_DECORS
    vs = [variant(f'KK-MEU-TER-{code(m)}-{COLOR_CODE[k]}' + hoek_sku(u), [m, k, u],
                  p + HOEK_DECOR_EXTRA.get(k, 0) + ((80 if m.startswith('120') else 45) if u.startswith('Buiten') else 0),
                  12000 + 5000 * i + (2500 if u.startswith('Buiten') else 0), inv(8, m + k + 'ter' + u, k))
          for i, (m, p) in enumerate(TT.items()) for k, u in hoek_combos(TTU)]
    imgs, vmap = kleur_images('terrastafel-inklapbaar', TK, 'patioTable', lambda k: {'w': 0.7, 'd': 0.7, 'top': top_param(k), 'frame': 'zwart', 'base': 'kruis'}, 'Zwart', status='needs-model', p2=3)
    simple('terrastafel-inklapbaar', 'Terrastafel inklapbaar', 'Terrastafel', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(TT)), opt('Kleur', TK), opt('Uitvoering', TTU)], vs, imgs,
           {'kenmerk_kort': '75 cm hoog · klapblad · binnen of compact HPL buiten · 12 decors', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket',
            'specificaties': [sp('Afmetingen', 'Hoogte', '75 cm'), sp('Blad', 'Binnen', 'HPL-toplaag op 18 mm plaat, 7 decors'),
                              sp('Blad', 'Buiten', 'Compact HPL 12 mm, weer- en UV-bestendig, 12 decors'), sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, klapblad')]},
           ['tafels-stoelen.terrastafels'], 'meubilair', 'Terrastafel met klapblad: snel opruimen na sluitingstijd; binnen en buiten.', ['terrastafel inklapbaar', 'horeca terrastafel'],
           {'outmate': '70x70 €132 · 120x70 €299', 'statafelshop': 'Kansas €148,82–189,96 · Mississippi €151,25–326,64', 'ours': TT, 'opties': '+ € 45 / € 80 compact HPL buiten · + € 10 / € 15 decor'}, vmap=vmap)
    # Catalog round 2026-10-18 (H7): 9 bladmaten (180 and 220 cm long, 50 to 80 cm wide), a zwart gepoedercoat onderstel next to verzinkt,
    # prices ca. 8% under the lower reference (Outmate / Statafelshop: tafel 220 x 70 € 157-159, bank € 72,50-96,74, set 220 x 70 € 292,50) and
    # every set 10% under tafel + 2 banken (the policy; it was 0,5-2%). Uitvoering carries quality and onderstel, Samenstelling the set.
    BT_MATEN = ['180 x 50 cm', '180 x 60 cm', '180 x 70 cm', '180 x 80 cm', '220 x 50 cm', '220 x 60 cm', '220 x 67 cm', '220 x 70 cm', '220 x 80 cm']
    BT_REF_STD = {'180 x 50 cm': 106, '180 x 60 cm': 124, '180 x 70 cm': 135, '180 x 80 cm': 149, '220 x 50 cm': 114.89, '220 x 60 cm': 135,
                  '220 x 67 cm': 150, '220 x 70 cm': 157.24, '220 x 80 cm': 178.48}
    BT_REF_BR = {'180 x 50 cm': 133, '180 x 60 cm': 158, '180 x 70 cm': 177, '180 x 80 cm': 210, '220 x 50 cm': 148.23, '220 x 60 cm': 175.39,
                 '220 x 67 cm': 191.12, '220 x 70 cm': 197.17, '220 x 80 cm': 233.47}
    KWAL = ['Standaard', 'Brouwerijkwaliteit', 'Brouwerijkwaliteit, zwart onderstel']
    BANK_REF = {('180', 'Standaard'): 67.5, ('220', 'Standaard'): 72.5, ('180', 'Brouwerijkwaliteit'): 89.0, ('220', 'Brouwerijkwaliteit'): 96.74}
    def bt_tafel(m, q):
        base = BT_REF_BR[m] if q.startswith('Brouwerij') else BT_REF_STD[m]
        return under(base, 0.08) + (15 if 'zwart' in q else 0)
    def bt_bank(lengte, q):
        return under(BANK_REF[(lengte, 'Brouwerijkwaliteit' if q.startswith('Brouwerij') else 'Standaard')], 0.08) + (8 if 'zwart' in q else 0)
    def bt_set(m, q):
        # H7: a set is 10-12% under tafel + 2 banken; when the x9 rounding would make it more (209 for 242,90), it ends in ,95
        los = bt_tafel(m, q) + 2 * bt_bank(m[:3], q)
        p = under(los, 0.10)
        return p if p >= 0.88 * los - 1e-9 else float(int(0.9 * los)) - 0.05
    BTS = []
    for q in KWAL:
        for m in BT_MATEN:
            w = int(m.split(' x ')[1].split()[0])
            kg_t = round(int(m[:3]) / 220 * (14 + (w - 50) * 0.2) * (1.2 if q.startswith('Brouwerij') else 1))
            BTS.append((m, 'Set: tafel en 2 banken', q, bt_set(m, q), kg_t + 2 * round(int(m[:3]) / 220 * 7 * (1.2 if q.startswith('Brouwerij') else 1))))
            BTS.append((m, 'Alleen tafel', q, bt_tafel(m, q), kg_t))
    def bt_sku(m, u, q):
        return (f'KK-MEU-BTS-{code(m)}-{"SET" if "Set" in u else "T"}' + ('-BR' if q.startswith('Brouwerij') else '') + ('-ZO' if 'zwart' in q else ''))
    BTS_SPEC = [sp('Uitvoering', 'Standaard', 'Blad en banken 25 mm vurenhout, gelakt; onderstel verzinkt staal'),
                sp('Uitvoering', 'Brouwerijkwaliteit', 'Blad en banken 35 mm vurenhout met afgeronde randen, 2 x gelakt; zwaarder verzinkt onderstel met extra dwarsverbinding'),
                sp('Uitvoering', 'Zwart onderstel', 'Brouwerijkwaliteit met zwart gepoedercoat onderstel')]
    simple('biertafelset', 'Biertafelset', 'Biertafelset', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:evenement'],
           [opt('Maat', BT_MATEN), opt('Samenstelling', ['Set: tafel en 2 banken', 'Alleen tafel']), opt('Uitvoering', KWAL)],
           [variant(bt_sku(m, u, q), [m, u, q], p, kg * 1000, inv(20, m + u + q)) for m, u, q, p, kg in BTS],
           [img('biertafelset-hero.webp', 'hero', 1, 'biertafelset', {'length': 2.2, 'tableWidth': 0.5}, 'hero', None, 'existing'),
            img('biertafelset-70-hero.webp', 'variant', 3, 'biertafelset', {'length': 2.2, 'tableWidth': 0.7}, 'hero', None, 'existing', alt='breed blad 70 cm'),
            img('biertafelset-180-hero.webp', 'variant', 3, 'biertafelset', {'length': 1.8, 'tableWidth': 0.6}, 'hero', None, 'needs-param', alt='180 cm lang'),
            img('biertafelset-zwart-onderstel.webp', 'variant', 3, 'biertafelset', {'length': 2.2, 'tableWidth': 0.7, 'frame': 'zwart'}, 'hero', None, 'needs-param',
                alt='brouwerijkwaliteit met zwart onderstel')],
           {'kenmerk_kort': 'Vurenhout · 180 of 220 cm · 50 tot 80 cm breed · ook zwart onderstel', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pallet', 'addons': ['hoes-biertafelset'],
            'specificaties': [sp('Blad', 'Materiaal', 'Vurenhout, gelakt'), sp('Onderstel', 'Materiaal', 'Staal, verzinkt of zwart gepoedercoat, inklapbaar'),
                              sp('Set', 'Bank', '180 of 220 x 25 cm, zelfde lengte als de tafel')] + BTS_SPEC},
           ['tafels-stoelen.biertafels'], 'meubilair', 'Klassieke feestset in 180 of 220 cm en 50 tot 80 cm breed; standaard of brouwerijkwaliteit, ook met zwart onderstel; ook alleen de tafel.',
           ['biertafelset', 'biertafel kopen', 'feestset', 'biertafel brouwerijkwaliteit', 'biertafel 80 cm breed'],
           {'statafelshop': 'biertafel standaard 220x50 €114,89 · x70 €157,24 · x80 €178,48 · brouwerij 220x50 €148,23 tot x80 €233,47 · set standaard €225–€289,13 · brouwerij €284,35–€356,95 · bierbank €81,68 / €96,74',
            'outmate': 'tafel 220x60 €135 · 220x70 €159 · 220x80 €189 · 180x70 €135 · 180x80 €149 · bank 220 €72,50 · 180 €67,50 · set 220x70 €292,50',
            'ours': {f'{m} {u} {q}': p for m, u, q, p, kg in BTS}},
           vmap={'220 x 50 cm': 'biertafelset-hero.webp', '220 x 70 cm': 'biertafelset-70-hero.webp', **{m: 'biertafelset-180-hero.webp' for m in BT_MATEN if m.startswith('180')}},
           vby='Maat', extra={'variant_image_sku': {bt_sku(m, u, q): 'biertafelset-zwart-onderstel.webp' for m, u, q, p, kg in BTS if 'zwart' in q}})
    BB = [(lengte, q) for lengte in ('180', '220') for q in KWAL]
    simple('bierbank', 'Bierbank los 180 of 220 cm', 'Bierbank', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:evenement'],
           [opt('Maat', ['180 x 25 cm', '220 x 25 cm']), opt('Uitvoering', KWAL)],
           [variant('KK-MEU-BB-' + lengte + ('-BR' if q.startswith('Brouwerij') else '') + ('-ZO' if 'zwart' in q else ''), [f'{lengte} x 25 cm', q], bt_bank(lengte, q),
                    int(int(lengte) / 220 * (8500 if q.startswith('Brouwerij') else 7000)), 40) for lengte, q in BB],
           [img('bierbank-220-hero.webp', 'hero', 1, 'biertafelset', {'length': 2.2, 'only': 'bank'}, 'hero', None, 'needs-param')],
           {'kenmerk_kort': 'Vurenhout 180 of 220 x 25 cm · inklapbaar · standaard of brouwerij', 'staffelkorting': ST_KLAPTAFEL, 'verzending': 'pakket', 'past_op': ['biertafelset'],
            'specificaties': [sp('Uitvoering', 'Standaard', 'Zitting 25 mm vurenhout, gelakt; onderstel verzinkt staal'),
                              sp('Uitvoering', 'Brouwerijkwaliteit', 'Zitting 35 mm vurenhout met afgeronde randen, 2 x gelakt; zwaarder verzinkt onderstel'),
                              sp('Uitvoering', 'Zwart onderstel', 'Brouwerijkwaliteit met zwart gepoedercoat onderstel')]},
           ['tafels-stoelen.banken', 'tafels-stoelen.biertafels'], 'meubilair', 'Extra bank bij je biertafel, of los als zitbank op het feest; 180 of 220 cm; standaard of brouwerijkwaliteit.', ['bierbank', 'bierbank los', 'bierbank 180 cm'],
           {'outmate': 'bierbank 220 €72,50 · 180 €67,50 · white wash €79', 'statafelshop': 'standaard €81,68 · brouwerij €96,74', 'ours': {f'{l} {q}': bt_bank(l, q) for l, q in BB}})
    # 'Plateau' added after the merchandising review: the stapelbare vierkante statafel does not go in the kar for folding statafels
    # (5 stacked on a plateau of ca. 90 x 90 cm with 4 zwenkwielen). Variant images per Uitvoering, so the plateau never shows the kar.
    # catalog round 2026-10-18 (H6): repriced 6-10% under the lower reference (Statafelshop klein € 387,20 / € 339 elsewhere, groot € 465,85)
    TK2 = [('Klein, voor 5 statafels', 319.0, 'K', 38), ('Groot, voor 15 statafels', 419.0, 'G', 55), ('Plateau, voor 5 gestapelde statafels', 189.0, 'P', 18)]
    simple('transportkar-statafels', 'Transportkar voor statafels', 'Transportkar', ['zakelijk', 'pallet'], [opt('Uitvoering', [t[0] for t in TK2])],
           [variant(f'KK-MEU-TKS-{c}', [n], p, kg * 1000, inv(4, c + 'tks')) for n, p, c, kg in TK2],
           [img('transportkar-statafels-hero.webp', 'hero', 1, 'trolley', {'kind': 'statafel', 'size': 'groot', 'loaded': 0}, 'hero', None, 'needs-model'),
            img('transportkar-statafels-gevuld.webp', 'in-gebruik', 2, 'trolley', {'kind': 'statafel', 'size': 'groot', 'loaded': 15}, 'hero', None, 'needs-model', alt='gevuld met 15 statafels (niet inbegrepen)'),
            img('transportkar-statafels-plateau.webp', 'variant', 3, 'trolley', {'kind': 'plateau', 'size': 0.9, 'loaded': 5, 'tableShape': 'square'}, 'hero', None, 'needs-param',
                alt='plateaukar met 5 gestapelde vierkante statafels (statafels niet inbegrepen)')],
           {'kenmerk_kort': 'Heavy duty wielen · 5 of 15 ingeklapte statafels, of 5 gestapelde vierkante', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80', 'statafel-vierkant-stapelbaar', 'statafel-design-marmerlook'],
            'specificaties': [sp('Kar', 'Groot', 'ca. 126 x 97 x 113 cm, tot 15 statafels Ø80'), sp('Kar', 'Klein', 'ca. 65 x 95 x 114 cm, tot 5 statafels'),
                              sp('Kar', 'Plateau', 'ca. 90 x 90 cm, 4 zwenkwielen (2 met rem), tot 5 gestapelde vierkante statafels')]},
           ['tafels-stoelen.trolleys'], 'meubilair', 'Statafels verplaatsen en opslaan zonder sjouwen; capaciteit per model.', ['transportkar statafels', 'trolley statafel'],
           {'statafelshop': 'klein €311,58 · groot €434,39', 'outmate': '10 st €589', 'ours': {t[0]: t[1] for t in TK2}},
           vmap={'Klein, voor 5 statafels': 'transportkar-statafels-hero.webp', 'Groot, voor 15 statafels': 'transportkar-statafels-hero.webp',
                 'Plateau, voor 5 gestapelde statafels': 'transportkar-statafels-plateau.webp'}, vby='Uitvoering')
    # H6: repriced ca. 10% under the reference (klaptafelkar € 496-599, barkrukkar 15 / 24 / 30 € 354,50 / € 380,50 / € 506,50, klapstoelkar
    # € 299-345,50); new: 15 and 30 barkrukken (M20), 30 examentafels (€ 378,50), 15 conferentietafels (€ 582,50), 26 weddingstoelen (€ 378,50)
    TK3 = [('Voor 10 klaptafels 183 cm', 449.0, 'KLT', 35), ('Voor 15 barkrukken', 319.0, 'BKR15', 24), ('Voor 24 barkrukken', 339.0, 'BKR', 30),
           ('Voor 30 barkrukken', 449.0, 'BKR30', 38), ('Voor 30 klapstoelen', 269.0, 'KLS', 26), ('Voor 26 weddingstoelen', 339.0, 'WED', 28),
           ('Voor 30 examentafels', 339.0, 'EXA', 34), ('Voor 15 conferentietafels', 519.0, 'CONF', 48)]
    simple('transportkar-klaptafels-en-stoelen', 'Transportkar voor klaptafels en stoelen', 'Transportkar', ['zakelijk', 'pallet'], [opt('Uitvoering', [t[0] for t in TK3])],
           [variant(f'KK-MEU-TKK-{c}', [n], p, kg * 1000, inv(3, c + 'tkk')) for n, p, c, kg in TK3],
           [img('transportkar-klaptafels-en-stoelen-hero.webp', 'hero', 1, 'trolley', {'kind': 'klaptafel', 'loaded': 0}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Zwenkwielen met rem · klaptafels, barkrukken, klap- en weddingstoelen', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            # barkruk-pe-rotan is not stackable (its own copy), so it does not go on the barkrukkenkar (merchandising review 3)
            'past_op': ['klaptafel-hdpe-rechthoekig', 'klapstoel', 'barkruk-stapelbaar-metaal', 'barkruk-houten-zitting', 'barkruk-velours-stapelbaar',
                        'barkruk-draad-stapelbaar', 'barkruk-chroom-stapelbaar']},   # + new tables and the weddingstoel: fam_new
           ['tafels-stoelen.trolleys'], 'meubilair', 'Eén kar per meubeltype; capaciteit en afmetingen.', ['transportkar klaptafels', 'trolley stoelen'],
           {'outmate': 'klaptafels €599 · barkrukken 15 €354,50 · Hamburg €380,50 · 30 €506,50 · klapstoelen €299 (actie, was €345,50) · wedding €378,50 · examentafels 30 €378,50 · conference 15 €582,50',
            'statafelshop': 'buffet- en bankettafels €496,04', 'ours': {t[0]: t[1] for t in TK3}})
    # A kar for every meubeltype the zakelijke koper (verhuur, catering, horeca, vereniging) buys in aantallen (merchandising
    # review 3, 2026-10-18: Statafelshop sells ca. 9 kar models, Outmate a trolley per table or chair type; we had 2). Each one is
    # an addon_eenmalig on its furniture and part of a pakket. Hero = the empty kar (what is in the box); 'gevuld' = loaded, with
    # '(niet inbegrepen)' in the alt. Every price and dimension is an owner/supplier claim (docs/claims-to-confirm.md).
    # catalog round 4: the 20 kar ca. 11% under the reference (Waal 20 € 435,60; it was 38% under it); 40 stays 10% under € 554,18
    TK4 = [('Voor 20 stapelstoelen', 389.0, '20', 24), ('Voor 40 stapelstoelen', 499.0, '40', 38)]   # catalog round 3: 40 was 19% under € 554   # H6: was € 179 / € 279 against € 299-690
    simple('transportkar-stapelstoelen', 'Transportkar voor stapelstoelen', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Uitvoering', [t[0] for t in TK4])],
           [variant(f'KK-MEU-TKST-{c}', [n], pr, kg * 1000, inv(3, c + 'tkst')) for n, pr, c, kg in TK4],
           [img('transportkar-stapelstoelen-20-hero.webp', 'hero', 1, 'trolley', {'kind': 'stapelstoel', 'chairs': 20, 'loaded': 0}, 'hero', None, 'existing'),
            img('transportkar-stapelstoelen-40-hero.webp', 'variant', 2, 'trolley', {'kind': 'stapelstoel', 'chairs': 40, 'loaded': 0}, 'hero', None, 'existing'),
            img('transportkar-stapelstoelen-40-gevuld.webp', 'in-gebruik', 3, 'trolley', {'kind': 'stapelstoel', 'chairs': 40, 'loaded': 40, 'chairStyle': 'metaal', 'chairColor': 'zwart'},
                'hero', None, 'existing', alt='gevuld met 40 metalen stapelstoelen (stoelen niet inbegrepen)')],
           {'kenmerk_kort': 'Stapels van 10 · 20 of 40 stoelen · zwenkwielen met rem', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['stapelstoel-metaal', 'banquetstoel-gestoffeerd', 'stapelstoel-cross-back'],
            'specificaties': [sp('Kar', 'Voor 20', 'ca. 105 x 58 cm, 2 stapels van 10'), sp('Kar', 'Voor 40', 'ca. 105 x 112 cm, 4 stapels van 10')]},
           ['tafels-stoelen.trolleys'], 'meubilair',
           'Stapelstoelen in stapels van 10 rijden en opslaan: metaal en banquet 20/40, cross back (tot 8 hoog) 16/32; welke past door een deur.',
           ['transportkar stapelstoelen', 'trolley stapelstoelen', 'stoelenkar'],
           {'statafelshop': 'transportkar stapelstoel Waal 20/40 st (prijs niet gevonden)', 'outmate': 'stapelstoelen trolley cross back 18 st (prijs niet gevonden)',
            'ours': {t[0]: t[1] for t in TK4}},
           vmap={'Voor 20 stapelstoelen': 'transportkar-stapelstoelen-20-hero.webp', 'Voor 40 stapelstoelen': 'transportkar-stapelstoelen-40-hero.webp'}, vby='Uitvoering')
    simple('transportkar-ronde-klaptafels', 'Transportkar voor ronde klaptafels', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:evenement'], [],
           [variant('KK-MEU-TKR-10', [], 429.0, 42000, 3)],
           [img('transportkar-ronde-klaptafels-hero.webp', 'hero', 1, 'trolley', {'kind': 'rond', 'loaded': 0}, 'hero', None, 'existing'),
            img('transportkar-ronde-klaptafels-gevuld.webp', 'in-gebruik', 2, 'trolley', {'kind': 'rond', 'loaded': 10, 'diameter': 1.8}, 'hero', None, 'existing',
                alt='gevuld met 10 ronde klaptafels van Ø 180 cm (tafels niet inbegrepen)')],
           {'kenmerk_kort': '10 ronde klaptafels Ø150 of Ø180 cm · op hun rand', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['klaptafel-hdpe-rond'], 'specificaties': [sp('Kar', 'Afmetingen', 'ca. 120 x 102 x 100 cm'), sp('Kar', 'Capaciteit', '10 ronde klaptafels')]},
           ['tafels-stoelen.trolleys'], 'meubilair',
           'Tien ronde banket-tafels (Ø 150 of Ø 180 cm) op hun rand: rijden en opslaan zonder rollen of tillen; maten, hoogte gevuld, deurbreedte.',
           ['transportkar ronde tafels', 'trolley ronde klaptafel', 'banket tafel trolley'],
           {'outmate': 'trolley klaptafel rond 180 vanaf €482,50 (10% korting met de tafels)', 'ours': 429.0})
    simple('transportkar-biertafelsets', 'Transportkar voor biertafelsets', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:tuinfeest'], [],
           [variant('KK-MEU-TKB-10', [], 519.0, 55000, 3)],   # H6: was € 299 against € 579-817
           [img('transportkar-biertafelsets-hero.webp', 'hero', 1, 'trolley', {'kind': 'biertafel', 'loaded': 0}, 'hero', None, 'existing'),
            img('transportkar-biertafelsets-gevuld.webp', 'in-gebruik', 2, 'trolley', {'kind': 'biertafel', 'loaded': 10, 'tableWidth': 0.5}, 'hero', None, 'existing',
                alt='gevuld met 10 biertafelsets van 220 × 50 cm, tafels onder en banken erop (sets niet inbegrepen)')],
           {'kenmerk_kort': '10 biertafelsets plat gestapeld · 50 en 70 cm breed', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['biertafelset', 'bierbank', 'biertafelsets-10-stuks'],
            'specificaties': [sp('Kar', 'Afmetingen', 'ca. 230 x 82 x 105 cm'), sp('Kar', 'Capaciteit', '10 sets: 10 tafels en 20 banken')]},
           ['tafels-stoelen.trolleys'], 'meubilair',
           'Tien biertafelsets op één kar: tafels plat onderop, banken erop; voor verenigingen en verhuur; voor 50 en 70 cm brede tafels.',
           ['transportkar biertafels', 'biertafel trolley', 'biertafelwagen'],
           {'outmate': 'biertafelkar 220 cm €579 (actie, was €700) · 180-220 cm €589', 'statafelshop': 'transportkar bierbanksets €816,75', 'ours': 519.0})
    simple('transportkar-terrastafels', 'Transportkar voor terrastafels', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:horeca'], [],
           [variant('KK-MEU-TKT-10', [], 309.0, 32000, 3)],   # H6: was € 249 against € 346,50-387,20
           [img('transportkar-terrastafels-hero.webp', 'hero', 1, 'trolley', {'kind': 'terras'}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'Terrastafels met het blad rechtop · zwenkwielen met rem', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': ['terrastafel-inklapbaar', 'terrastafel-rond-inklapbaar'],
            'specificaties': [sp('Kar', 'Afmetingen', 'ca. 140 x 80 x 100 cm'), sp('Kar', 'Capaciteit', '10 tafels 60 x 60 of 70 x 70 cm, 6 van 120 x 70 cm, 8 ronde tot Ø 85 cm')]},
           ['tafels-stoelen.trolleys'], 'meubilair',
           'Terras na sluitingstijd in één keer naar binnen: tafels met het klapblad rechtop achter elkaar op de kar; capaciteit per maat.',
           ['transportkar terrastafels', 'trolley terrastafel'],
           {'statafelshop': 'transportkar klein voor sta- en terrastafels €387,20 · groot €465,85', 'outmate': 'Madeira 6 stuks €346,50', 'ours': 309.0})

    # ------------------------------------------------------------ verlichting
    # M6 + L3 (catalog round 2026-10-18): 5 to 100 m, 1 fitting per meter or 2 (every 50 cm), ca. 10% under the reference (10 m € 49, 20 m € 87,
    # 30 m € 126); 2 per meter + 40% (twice the fittingen). Aanloopkabel 1,5 m and eindkap on every length; other lead lengths and end pieces
    # on the prikkabel op maat.
    # catalog round 4: 60, 70, 80 and 90 m added (the reference lists them: € 237,50 / 275 / 309 / 345); 50 and 100 m re-based (100 m was 17%
    # under the reference € 385); 2 fittingen per meter ca. 10% under the reference (it was 19-23% under it): its own price per length,
    # ca. 1,6 x the 1-per-meter reference as there. (1 per meter, 2 per meter, kg)
    PK = {'5 m': (24.95, 41.95, 0.7), '10 m': (44.95, 69.95, 1.2), '15 m': (62.95, 97.95, 1.8), '20 m': (78.95, 119.0, 2.3), '25 m': (94.95, 149.0, 2.9),
          '30 m': (109.0, 179.0, 3.4), '40 m': (139.0, 219.0, 4.5), '50 m': (179.0, 279.0, 5.6), '60 m': (209.0, 329.0, 6.7), '70 m': (239.0, 389.0, 7.8),
          '80 m': (269.0, 439.0, 8.9), '90 m': (309.0, 489.0, 10.0), '100 m': (339.0, 539.0, 11.0)}
    PKK = ['Zwart', 'Wit']
    PKU = ['1 fitting per meter', '2 fittingen per meter']
    def pk_price(p, u):
        return p[0] if u == PKU[0] else p[1]
    vs = [variant(f'KK-LCHT-PK-{code(m)}-{COLOR_CODE[k]}' + ('-2PM' if u == PKU[1] else ''), [m, k, u], pk_price((p1, p2), u), kg * 1000 * (1.25 if u == PKU[1] else 1),
                  inv(15, m + k + u + 'pk', k)) for m, (p1, p2, kg) in PK.items() for k in PKK for u in PKU]
    imgs, vmap = kleur_images('prikkabel-e27', PKK, 'prikkabel', lambda k: {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': True, 'cable': render_color(k)}, 'Zwart',
                              [img('prikkabel-e27-zwart-uit.webp', 'detail', 3, 'prikkabel', {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': False}, 'hero', 'Zwart', 'existing', alt='lampen uit')], status='existing', p2=3)
    simple('prikkabel-e27', 'Prikkabel E27', 'Prikkabel', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Maat', list(PK)), opt('Kleur', PKK), opt('Uitvoering', PKU)], vs, imgs,
           {'kenmerk_kort': '5 tot 100 m · fitting elke meter of elke 50 cm · IP44', 'verzending': 'pakket', 'addons': ['led-lamp-e27'], 'staffelkorting': ST_PRIK,
            'specificaties': [sp('Kabel', 'Spanning', '230 V, 16 A'), sp('Kabel', 'Fittingen', 'E27, elke 1 m of elke 50 cm'), sp('Kabel', 'Aanloop', '1,5 m tot de eerste fitting, met stekker'),
                              sp('Kabel', 'Einde', 'Eindkap'), sp('Kabel', 'Beschermingsklasse', 'IP44'), sp('Lamp', 'Max. vermogen', '25 W per fitting')]},
           ['verlichting.prikkabels'], 'verlichting', 'Sfeerverlichting voor tuin en terras: lengte = aantal fittingen, lampen apart (of als set); doorkoppelen binnen het maximum.',
           ['prikkabel', 'prikkabel 10 meter', 'lichtsnoer buiten', 'prikkabel 50 meter', 'prikkabel 80 meter'],
           {'outmate': '1 per meter: 5 m €29,25 · 10 m €49 · 15 m €69 · 20 m €87 · 25 m €102,75 · 30 m €126 · 40 m €160 · 50 m €199 · 60 m €237,50 · 70 m €275 · 80 m €309 · 90 m €345 · 100 m €385; '
                       '2 per meter: 10 m €78,25 · 20 m €135,25 · 25 m €167,25 · 40 m €247 (live, 2026-10-18)',
            'ours': {m: {'1 per meter': v[0], '2 per meter': v[1]} for m, v in PK.items()}}, vmap=vmap)
    # catalog round 3: the fitting distance decides the price (it was € 4,49 per meter with every fitting included, so 10 m at 50 cm cost
    # € 44,90 against € 62,95 for the stock 10 m): per meter at least what the stock prikkabel costs per meter at its shortest length
    # catalog round 4: 50 cm € 8,49 (the stock 5 m with 2 fittingen per meter now costs € 8,39 per meter)
    PKMU = {'Fitting om de 50 cm': (8.49, '50'), 'Fitting om de 75 cm': (6.49, '75'), 'Fitting om de 100 cm': (5.49, '100'),
            'Fitting om de 150 cm': (4.99, '150'), 'Fitting om de 200 cm': (4.79, '200')}
    vs = [variant(f'KK-LCHT-PKM-{COLOR_CODE[k]}' + ('' if c == '100' else f'-{c}'), [k, u], p, 120 + (40 if c == '50' else 0), None, tracked=False, policy='continue',
                  qrule={'min': 5, 'max': 200, 'increment': 1}) for k in PKK for u, (p, c) in PKMU.items()]
    simple('prikkabel-op-maat', 'Prikkabel op maat (per meter)', 'Prikkabel', ['zakelijk', 'gebruik:horeca'], [opt('Kleur', PKK), opt('Uitvoering', list(PKMU))], vs,
           [img('prikkabel-op-maat-hero.webp', 'hero', 1, 'prikkabel', {'bulbs': 14, 'spacing': 0.5, 'sag': 0.2, 'on': True}, 'hero', 'Zwart', 'existing'),
            # witte kabel: the prikkabel E27 render with the white cable (same cable and fittings)
            img('prikkabel-e27-wit-hero.webp', 'variant', 3, 'prikkabel', {'bulbs': 10, 'spacing': 1.0, 'sag': 0.25, 'on': True, 'cable': 'wit'}, 'hero', 'Wit', 'existing',
                extra={'shared_with': 'prikkabel-e27'})],
           {'kenmerk_kort': 'Jouw lengte tot 200 m · fittingafstand naar keuze · gemonteerd', 'levertijd': 'Levertijd 3–5 werkdagen', 'verzending': 'pakket'},
           ['verlichting.prikkabels'], 'verlichting',
           'Lengte in de configurator (aantal = meters, min. 5 m); fittingafstand, aanloop en eindstuk als keuzes; maatwerk kan niet retour.',
           ['prikkabel op maat'], {'outmate': 'op maat vanaf €9', 'ours': {u: v[0] for u, v in PKMU.items()}, 'rule': 'per meter never under the stock prikkabel E27 per meter'},
           vmap={'Zwart': 'prikkabel-op-maat-hero.webp', 'Wit': 'prikkabel-e27-wit-hero.webp'})
    LL = [('Warm wit melkglas 1 W', 1.29, 'MW'), ('Warm wit helder 1 W', 1.29, 'HW'), ('Filament dimbaar 2 W', 1.79, 'FD'), ('Set van 5 gekleurde lampen', 4.95, 'S5')]
    simple('led-lamp-e27', 'LED-lamp E27 onbreekbaar', 'LED-lamp', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:horeca'], [opt('Uitvoering', [l[0] for l in LL])],
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
    # L12: with the aansluitkabel (first string, with stekker) or without (each next string that you koppel door)
    KVU = ['Warm wit, met aansluitkabel', 'Warm wit, zonder aansluitkabel', 'Warm wit fonkelend, met aansluitkabel', 'Warm wit fonkelend, zonder aansluitkabel']
    simple('kerstverlichting-10-m', 'Kerstverlichting 10 m, 100 LEDs', 'Kerstverlichting', ['gebruik:horeca'], [opt('Uitvoering', KVU)],
           [variant('KK-LCHT-KV-WW', [KVU[0]], 29.95, 700, 40), variant('KK-LCHT-KV-WW-ZA', [KVU[1]], 24.95, 550, 40),
            variant('KK-LCHT-KV-FK', [KVU[2]], 32.95, 700, 30), variant('KK-LCHT-KV-FK-ZA', [KVU[3]], 27.95, 550, 30)],
           [img('kerstverlichting-10-m-hero.webp', 'hero', 1, 'stringLights', {'kind': 'kerst', 'count': 100, 'on': True}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Doorkoppelbaar · IP65 · 2200 K', 'verzending': 'pakket'},
           ['verlichting.kerstverlichting'], 'verlichting', 'Professionele kerstverlichting voor gevel, boom en terras; doorkoppelbaar.', ['kerstverlichting buiten', 'kerstverlichting doorkoppelbaar'],
           {'outmate': '€33,99 / €35 (met of zonder aansluitkabel)', 'ours': {'Warm wit met kabel': 29.95, 'zonder': 24.95, 'fonkelend met kabel': 32.95, 'zonder': 27.95}})
    simple('led-vloedlicht-easy-up', 'LED-vloedlicht voor easy-up 30 W', 'Tentverlichting', ['zakelijk', 'gebruik:evenement', 'gebruik:markt'], [],
           [variant('KK-LCHT-VL30', [], 119.0, 1400, 20)],
           [img('led-vloedlicht-easy-up-hero.webp', 'hero', 1, 'floodLight', {'watt': 30, 'clamp': True}, 'hero', None, 'existing'),
            img('led-vloedlicht-easy-up-in-tent.webp', 'in-gebruik', 3, 'items', {'items': [{'model': 'easyUpTent', 'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit'},
                                                                                         {'model': 'floodLight', 'watt': 30, 'mountedOn': 'leg'}]}, 'low', None, 'needs-model',
                alt='aan de poot van een easy-up (tent niet inbegrepen)')],
           {'kenmerk_kort': '30 W · 2.400 lumen · klem voor poten tot 50 mm · IP65', 'verzending': 'pakket', 'past_op': list(EU_TENTS) + EU_PRINT,
            'specificaties': [sp('Lamp', 'Vermogen', '30 W LED'), sp('Lamp', 'Lichtstroom', 'ca. 2.400 lumen, 4000 K'), sp('Lamp', 'Beschermingsklasse', 'IP65'),
                              sp('Bevestiging', 'Klem', 'Voor zeskantpoten van 40 en 50 mm, kantelbaar'), sp('Aansluiting', 'Kabel', '3 m met stekker, 230 V')],
            'garantie': '1 jaar'},
           ['easy-up-accessoires.easy-up-inrichting', 'verlichting.prikkabels'], 'verlichting',
           'Werklicht en sfeerlicht in de tent: klemt aan de poot, 2.400 lumen; voor markt, opbouw in het donker en avondevenementen.',
           ['led lamp partytent', 'verlichting easy up', 'vloedlicht tent'], {'outmate': 'Easy-up LED-vloedlicht 30 W €129 (live, 2026-10-18)', 'ours': 119.0,
                                                                            'rule': 'ca. 8% onder de referentie (catalogusronde 4: € 74,95 zat 42% onder de markt)'})
    # Merchandising review 3: the dimmers and the tijdschakelaar sat as Uitvoeringen next to a € 1,39 fitting, behind one image and a
    # 'vanaf' price; they are their own products now (own title, SEO and image; the reference sells them per URL). What stays are the
    # small spare parts, the fittingen and eindkap with their own image.
    LIGHTS = ['prikkabel-e27', 'prikkabel-op-maat', 'prikkabelset-led', 'led-lichtslang', 'led-lichtslang-set-warm-wit', 'kerstverlichting-10-m']
    PO = [('E27-fitting zwart', 1.39, 'FZ', ('lightParts', {'parts': ['fitting']})), ('E27-fitting wit', 1.49, 'FW', ('lightParts', {'parts': ['fitting'], 'color': 'wit'})),
          ('Eindkap', 1.95, 'EK', ('lightParts', {'parts': ['eindkap']})), ('Aansluitsnoer lichtslang met stekker', 9.95, 'AS', ('miscParts', {'parts': ['aansluitsnoer']})),
          ('Verlengkabel 10 m zwart', 12.95, 'VK', ('miscParts', {'parts': ['verlengkabel']})),
          ('Rubberkabel per meter zwart (2 x 1,5 mm²)', 1.95, 'KPM', ('miscParts', {'parts': ['kabel']})),
          # M6 (catalog round 2026-10-18): pendels, koppelstekker, clips, stekkerdoos and verlengkabels 5-30 m
          # catalog round 3: pendels (lampendroppers) in 20, 30, 40 and 50 cm; the 50 cm was 34% under the reference (€ 5,99)
          ('Pendel 20 cm met E27-fitting', 2.69, 'PD20', ('lightParts', {'parts': ['pendel'], 'length': 0.2})),
          ('Pendel 30 cm met E27-fitting', 3.15, 'PD30', ('lightParts', {'parts': ['pendel'], 'length': 0.3})),
          ('Pendel 40 cm met E27-fitting', 3.95, 'PD40', ('lightParts', {'parts': ['pendel'], 'length': 0.4})),
          ('Pendel 50 cm met E27-fitting', 5.35, 'PD50', ('lightParts', {'parts': ['pendel']})), ('Koppelstekker voor doorkoppelen', 6.95, 'KST', ('lightParts', {'parts': ['koppelstekker']})),
          ('Kabelclips (25 stuks)', 3.95, 'KC25', ('miscParts', {'parts': ['clips']})), ('Stekkerdoos 3-voudig IP44', 14.95, 'SD3', ('miscParts', {'parts': ['stekkerdoos']})),
          ('Verlengkabel 5 m zwart', 8.95, 'VK5', ('miscParts', {'parts': ['verlengkabel']})), ('Verlengkabel 20 m zwart', 22.95, 'VK20', ('miscParts', {'parts': ['verlengkabel']})),
          ('Verlengkabel 30 m zwart', 31.95, 'VK30', ('miscParts', {'parts': ['verlengkabel']})),
          # catalog round 5 (low): an eindhaak to span the last meter of a prikkabel (the reference offers eindkap, eindhaak or koppelstekker)
          ('Eindhaak met spanveer (set van 2)', 4.95, 'EH2', ('lightParts', {'parts': ['eindhaak']}))]
    PO_G = {'EH2': 120, 'FZ': 40, 'FW': 40, 'EK': 20, 'AS': 150, 'VK': 1300, 'KPM': 110, 'PD20': 50, 'PD30': 60, 'PD40': 70, 'PD50': 80, 'KST': 60, 'KC25': 60, 'SD3': 400, 'VK5': 700, 'VK20': 2500, 'VK30': 3700}   # grams (the copy's claim: 100 g on every part was wrong for the verlengkabel)
    PO_IMG = {n: f'onderdelen-prikkabel-en-lichtslang-{slug(n.split(" (")[0])}.webp' for n, _, _, prm in PO}
    simple('onderdelen-prikkabel-en-lichtslang', 'Onderdelen prikkabel en lichtslang', 'Verlichting onderdeel', [], [opt('Uitvoering', [p[0] for p in PO])],
           [variant(f'KK-LCHT-OND-{c}', [n], p, PO_G[c], inv(60, c + 'po')) for n, p, c, _ in PO],
           [img('onderdelen-prikkabel-en-lichtslang-hero.webp', 'hero', 1, 'lightParts', {'parts': ['fitting', 'eindkap']}, 'hero', None, 'existing',
                alt='E27-fitting en eindkap')] +
           [img(PO_IMG[n], 'variant', 2, prm[0], prm[1], 'hero', None, 'existing' if c in ('FZ', 'FW', 'EK', 'AS', 'VK', 'KPM') else 'needs-param') for n, _, c, prm in PO],
           {'kenmerk_kort': 'Fittingen, pendels, koppelstekker, clips, stekkerdoos, verlengkabels', 'verzending': 'pakket',
            'past_op': ['prikkabel-e27', 'prikkabel-op-maat', 'led-lichtslang', 'led-lichtslang-set-warm-wit']},
           ['verlichting.verlichting-onderdelen'], 'verlichting', 'Reserve-onderdelen voor prikkabel en lichtslang: fittingen, eindkap, aansluitsnoer, verlengkabel, kabel per meter.',
           ['fitting prikkabel', 'eindkap prikkabel', 'rubberkabel per meter'],
           {'outmate': 'fitting €1,50–€1,69 · dropper 20 cm €2,99 · 30 cm €3,50 · 40 cm €4,50 · 50 cm €5,99', 'ours': {p[0]: p[1] for p in PO}}, vmap=PO_IMG, vby='Uitvoering')
    # catalog round 4: the remote dimmer ca. 11% under the reference (€ 42,50; it was 41% under it); stekkerdimmer € 9,99 there
    DM = [('Stekkerdimmer tot 280 W', 8.95, 'SD', 150, 'dimmer'), ('Dimmer met afstandsbediening tot 500 W', 37.95, 'DA', 220, 'dimmer-ab')]
    DM_IMG = {'Stekkerdimmer tot 280 W': 'dimmer-voor-prikkabel-stekkerdimmer.webp', 'Dimmer met afstandsbediening tot 500 W': 'dimmer-voor-prikkabel-afstandsbediening.webp'}
    simple('dimmer-voor-prikkabel', 'Dimmer voor prikkabel en lichtslang', 'Verlichting onderdeel', ['gebruik:tuinfeest', 'gebruik:horeca'], [opt('Uitvoering', [d[0] for d in DM])],
           [variant(f'KK-LCHT-OND-{c}', [n], p, g, inv(30, c + 'po')) for n, p, c, g, _ in DM],
           [img(DM_IMG[n], 'hero' if i == 0 else 'variant', 1 if i == 0 else 2, 'lightParts', {'parts': [part]}, 'hero', None, 'existing')
            for i, (n, _, _, _, part) in enumerate(DM)],
           {'kenmerk_kort': 'Tussen stekker en stopcontact · voor dimbare LED-lampen', 'verzending': 'pakket', 'past_op': LIGHTS,
            'specificaties': [sp('Uitvoering', 'Stekkerdimmer tot 280 W', 'Draaiknop op de dimmer; tot 280 W aangesloten vermogen'),
                              sp('Uitvoering', 'Dimmer met afstandsbediening tot 500 W', 'Aan/uit en dimmen met de afstandsbediening (batterij inbegrepen); tot 500 W'),
                              sp('Aansluiting', 'Stekker', 'Randaarde (Schuko), 230 V'), sp('Gebruik', 'Plaats', 'Binnen of droog en overdekt (IP20)')]},
           ['verlichting.verlichting-onderdelen'], 'verlichting',
           'Prikkabel of lichtslang dimmen: dimmer tussen stekker en stopcontact; alleen met dimbare lampen; vermogen optellen; met of zonder afstandsbediening.',
           ['dimmer prikkabel', 'dimmer lichtslang', 'dimmer met afstandsbediening'], {'outmate': 'dimmer voor stopcontact €9,99 · dimmer met afstandsbediening tot 500 W €42,50 (live, 2026-10-18)', 'ours': {d[0]: d[1] for d in DM}},
           vmap=DM_IMG, vby='Uitvoering')
    simple('tijdschakelaar-voor-prikkabel', 'Tijdschakelaar voor prikkabel en lichtslang', 'Verlichting onderdeel', ['gebruik:tuinfeest', 'gebruik:horeca'], [],
           [variant('KK-LCHT-OND-TS', [], 6.95, 180, inv(30, 'TSpo'))],
           [img('tijdschakelaar-voor-prikkabel-hero.webp', 'hero', 1, 'lightParts', {'parts': ['timer']}, 'hero', None, 'existing')],
           {'kenmerk_kort': '24-uursklok per kwartier · IP44 · tot 3.680 W', 'verzending': 'pakket', 'past_op': LIGHTS,
            'specificaties': [sp('Klok', 'Type', 'Mechanisch, 24 uur, 96 pinnen (per kwartier)'), sp('Aansluiting', 'Stekker', 'Randaarde (Schuko), 230 V'),
                              sp('Belasting', 'Maximaal', '16 A (3.680 W)'), sp('Gebruik', 'Plaats', 'Binnen en buiten (IP44)')]},
           ['verlichting.verlichting-onderdelen'], 'verlichting',
           'Verlichting automatisch aan en uit: pinnetjes per kwartier indrukken, tussen stekker en stopcontact; vast schema per dag.',
           ['tijdschakelaar buitenverlichting', 'timer prikkabel', 'tijdklok stopcontact'], {'outmate': 'analoge tijdschakelaar stopcontact €7,99 (live, 2026-10-18)', 'ours': 6.95})

    # ------------------------------------------------------------ verwarming
    simple('elektrische-heater-partytent', 'Elektrische heater voor partytent', 'Verwarming', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Uitvoering', ['1500 W basis met ophangbeugel', '1500 W met klem voor easy-up', '1500 W met afstandsbediening en LED-lamp', '2100 W IP24 met beugel'])],
           [variant('KK-VRW-EL-1500B', ['1500 W basis met ophangbeugel'], 69.95, 3000, 12),   # L11: budget heater (Outmate cheapest € 79)
            variant('KK-VRW-EL-1500', ['1500 W met klem voor easy-up'], 109.0, 3500, 12), variant('KK-VRW-EL-1500AB', ['1500 W met afstandsbediening en LED-lamp'], 119.0, 3800, 8),
            variant('KK-VRW-EL-2100', ['2100 W IP24 met beugel'], 149.0, 4200, 8)],
           [img('elektrische-heater-partytent-hero.webp', 'hero', 1, 'heater', {'kind': 'elektrisch', 'watt': 1500, 'clamp': True}, 'hero', None, 'existing'),
            img('elektrische-heater-partytent-in-tent.webp', 'in-gebruik', 3, 'items', {'items': [{'model': 'easyUpTent', 'w': 3, 'd': 3, 'legs': 'professional', 'color': 'wit'},
                                                                                              {'model': 'heater', 'kind': 'elektrisch', 'mountedOn': 'leg'}]}, 'low', None, 'needs-model', alt='aan de poot van een easy-up (tent niet inbegrepen)')],
           {'kenmerk_kort': 'Infrarood · 3 standen · tot ca. 14–19 m²', 'verzending': 'pakket', 'past_op': list(EU_TENTS),
            'specificaties': [sp('Heater', '1500 W basis', '2 standen (750/1500 W), ca. 12 m², ophangbeugel, aan/uit-trekkoord'),
                              sp('Heater', '1500 W', '600/900/1500 W, ca. 14 m², klem voor 40–50 mm poot'),
                              sp('Heater', '1500 W met afstandsbediening', '3 standen, ca. 10 m², met LED-lamp, ophangbeugel'),
                              sp('Heater', '2100 W', '900/1420/2100 W, max. 19 m², IP24')], 'garantie': '1 jaar'},
           ['verwarming.elektrisch', 'easy-up-accessoires.easy-up-inrichting'], 'verwarming', 'Warmte zonder gas in de tent; vermogen per m², afstand tot doek, alleen op een geaarde groep.',
           ['heater partytent', 'terrasverwarming elektrisch', 'heater 1500 w goedkoop'], {'outmate': 'easy-up heater 1500 W €129 · goedkoopste 1500 W €79', 'ours': {'1500 W basis': 69.95, '1500 W': 109, '2100 W': 149}})
    simple('infraroodbrander-elektrische-heater', 'Vervangende infraroodbrander voor elektrische heater', 'Verwarming', ['gebruik:horeca', 'gebruik:evenement'],
           [opt('Uitvoering', ['Voor 1500 W heater', 'Voor 2100 W heater'])],
           [variant('KK-VRW-BR-1500', ['Voor 1500 W heater'], 13.95, 400, 15), variant('KK-VRW-BR-2100', ['Voor 2100 W heater'], 18.95, 500, 10)],
           [img('infraroodbrander-elektrische-heater-hero.webp', 'hero', 1, 'heaterElement', {'watt': 1500}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'Vervangend infraroodelement · 1500 of 2100 W · zelf te wisselen', 'verzending': 'pakket', 'past_op': ['elektrische-heater-partytent'],
            'garantie': '6 maanden',
            'specificaties': [sp('Element', 'Voor 1500 W heater', 'Halogeen-infraroodbuis 1500 W, past in beide 1500 W-uitvoeringen'),
                              sp('Element', 'Voor 2100 W heater', 'Carbon-infraroodbuis 2100 W, voor de 2100 W IP24'),
                              sp('Montage', 'Wisselen', 'Stekker eruit, laten afkoelen, beschermrooster los (4 schroeven), buis wisselen'),
                              sp('Levering', 'Inbegrepen', 'Infraroodbuis met 2 klemveren')]},
           ['verwarming.verwarming-accessoires'], 'verwarming',
           'Reservebrander zodat je heater na een kapotte buis niet afgeschreven is; welke buis bij welke heater; wisselen zonder gereedschap behalve een schroevendraaier; nooit aanraken met blote handen (vet op halogeen).',
           ['infraroodbrander heater', 'vervangende brander terrasheater', 'infrarood lamp heater'], {'outmate': 'vervangingsbrander / infrarood element easy-up heater €15 (live, 2026-10-18)', 'ours': {'1500 W': 13.95, '2100 W': 18.95},
            'rule': 'catalogusronde 4: was 2 tot 2,7 x de referentie'})
    simple('terrasheater-gas-13-kw', 'Terrasheater op gas 13 kW', 'Verwarming', ['zakelijk', 'gebruik:horeca', 'pallet'], [],
           [variant('KK-VRW-GAS-13', [], 159.0, 22000, 6)],
           [img('terrasheater-gas-13-kw-hero.webp', 'hero', 1, 'heater', {'kind': 'gas', 'style': 'paddenstoel'}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'RVS · 13 kW · omvalbeveiliging · gasfles apart', 'verzending': 'pallet', 'garantie': '1 jaar'},
           ['verwarming.gas'], 'verwarming', 'Klassieke paddenstoelheater voor buiten; nooit in een gesloten tent; gasfles en drukregelaar niet inbegrepen.',
           ['terrasheater gas', 'gasheater terras'], {'outmate': 'Terrasheater HSS 13 kW RVS €179 · mat antraciet €149 (live, 2026-10-18)', 'ours': 159,
                                                    'rule': 'RVS-model ca. 11% onder de RVS-referentie (was gelijk aan de referentie)'})
    simple('loungeheater-gas', 'Loungeheater op gas', 'Verwarming', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'],
           [opt('Uitvoering', ['Staand model 9 kW', 'Tafelmodel 3 kW'])],
           [variant('KK-VRW-LOUNGE-9', ['Staand model 9 kW'], 149.0, 16000, 6), variant('KK-VRW-LOUNGE-3', ['Tafelmodel 3 kW'], 109.0, 6500, 10)],
           [img('loungeheater-gas-hero.webp', 'hero', 1, 'heater', {'kind': 'gas', 'style': 'lounge'}, 'hero', None, 'existing'),
            img('loungeheater-gas-tafelmodel.webp', 'variant', 3, 'heater', {'kind': 'gas', 'style': 'tafel'}, 'hero', None, 'existing', alt='tafelmodel')],
           {'kenmerk_kort': 'Lage gasheater op zithoogte · staand 9 kW of tafelmodel 3 kW', 'verzending': 'pakket', 'garantie': '1 jaar',
            'specificaties': [sp('Heater', 'Staand model', '9 kW, ca. 75 cm hoog, gasfles van max. 10 kg in de voet'),
                              sp('Heater', 'Tafelmodel', '3 kW, op een tafel, met slang naar een losse gasfles'),
                              sp('Gas', 'Brandstof', 'Propaan, drukregelaar 37 mbar meegeleverd'), sp('Veiligheid', 'Beveiliging', 'Thermokoppeling en omvalbeveiliging'),
                              sp('Gebruik', 'Waar', 'Alleen buiten of in een open overkapping, nooit in een gesloten tent')]},
           ['verwarming.gas'], 'verwarming', 'Warmte op zithoogte voor lounge en terras; staand of tafelmodel; nooit in een gesloten tent; gasfles apart.',
           ['loungeheater', 'tafelheater gas', 'terrasverwarming gas'], {'outmate': 'Lounge Heater 11 kW mat antraciet €169 · Flame Lounge Heater 11 kW €199 (live, 2026-10-18); tafelmodel niet gevonden',
            'ours': {'staand': 149, 'tafel': 109}, 'rule': 'staand 9 kW ca. 12% onder de 11 kW lounge heater (minder vermogen)'},
           vmap={'Staand model 9 kW': 'loungeheater-gas-hero.webp', 'Tafelmodel 3 kW': 'loungeheater-gas-tafelmodel.webp'}, vby='Uitvoering')
    simple('flameheater-gas-9-kw', 'Flameheater op gas 9 kW', 'Verwarming', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement', 'pallet'], [],
           [variant('KK-VRW-FLAME-9', [], 179.0, 32000, 5)],
           [img('flameheater-gas-9-kw-hero.webp', 'hero', 1, 'heater', {'kind': 'gas', 'style': 'flame'}, 'hero', None, 'existing')],
           {'kenmerk_kort': 'Zichtbare vlam in glazen buis · 9 kW · ca. 225 cm hoog · gasfles apart', 'verzending': 'pallet', 'garantie': '1 jaar',
            'specificaties': [sp('Heater', 'Vermogen', '9 kW, traploos regelbaar'), sp('Heater', 'Hoogte', 'ca. 225 cm'), sp('Heater', 'Glazen buis', 'Gehard glas, vlam zichtbaar'),
                              sp('Gas', 'Brandstof', 'Propaan, gasfles van max. 10 kg in de voet'), sp('Veiligheid', 'Beveiliging', 'Thermokoppeling en omvalbeveiliging'),
                              sp('Gebruik', 'Waar', 'Alleen buiten, nooit in een tent of onder een laag dak')]},
           ['verwarming.gas'], 'verwarming', 'Sfeer én warmte bij de ingang of op het terras: vlam in een glazen buis; afstand tot doek en dak; alleen buiten.',
           ['flameheater', 'heater met vlam', 'piramide heater gas'], {'outmate': 'Flame heater 11 kW mat antraciet €199 (live, 2026-10-18)', 'ours': 179,
            'rule': 'ca. 10% onder de 11 kW flame heater; ons model is 9 kW (was € 329, +65%)'})
    simple('beschermhoes-terrasheater', 'Beschermhoes terrasheater', 'Verwarming', ['gebruik:horeca'], [],
           [variant('KK-VRW-HOES', [], 19.95, 700, 20)],
           [img('beschermhoes-terrasheater-hero.webp', 'hero', 1, 'heaterCover', {}, 'hero', None, 'needs-model')],
           {'kenmerk_kort': 'Waterdicht · met rits en trekkoord', 'verzending': 'pakket', 'past_op': ['terrasheater-gas-13-kw', 'flameheater-gas-9-kw']},
           ['verwarming.verwarming-accessoires'], 'verwarming', 'Houdt de heater droog en schoon buiten het seizoen.', ['hoes terrasheater'], {'ours': 19.95})

    # ------------------------------------------------------------ inrichting
    # catalog round 4: ca. 10% under the reference per finish (RVS 2 m band € 56 · messing € 52 · mat zwart € 37,50; live data); messing was 6%
    # and zwart 33% over it
    AZ = [('RVS', 49.95, 'RVS'), ('Messinglook', 46.95, 'MES'), ('Zwart', 33.95, 'ZWA')]
    AZK = ['Zwart', 'Rood', 'Blauw', 'Groen', 'Grijs']   # M12: colour of the trekband (Kleur); the post finish stays the Uitvoering
    # catalog round 5 (low): a set of 2 (the reference sells '2x afzetpaal') and a band with a magneetsluiting (reference mat zwart € 87 against
    # € 37,50-47,50 without): Samenstelling, so finish (Uitvoering) and band colour (Kleur) stay as they are. Set van 2: 2 x the price less 5%;
    # magneetsluiting + € 35 per paal. The SKU of the single paal is unchanged.
    AZS = [('1 stuk', 1, 0, ''), ('Set van 2', 2, 0, '-2'), ('1 stuk met magneetsluiting', 1, 35, '-MG'), ('Set van 2 met magneetsluiting', 2, 35, '-2MG')]
    def az_price(p, n, extra):
        t = (p + extra) * n * (0.95 if n > 1 else 1)
        return round(int(t) + 0.95 if t - int(t) >= 0.95 else int(t) - 0.05, 2) if n > 1 else round(p + extra, 2)
    vs = [variant(f'KK-INR-AZP-{c}' + ('' if k == 'Zwart' else f'-{COLOR_CODE[k]}') + ss, [n, k, sn], az_price(p, cnt, ex), 7500 * cnt, inv(30, c + k + 'azp' + sn))
          for n, p, c in AZ for k in AZK for sn, cnt, ex, ss in AZS]
    az_imgs = [img('afzetpaal-met-trekband-hero.webp', 'hero', 1, 'stanchion', {'finish': 'rvs', 'belt': 'zwart', 'pair': True}, 'hero', 'Zwart', 'needs-model')] + \
              [img(f'afzetpaal-met-trekband-{slug(k)}-hero.webp', 'variant', 3, 'stanchion', {'finish': 'rvs', 'belt': render_color(k), 'pair': True}, 'hero', k, 'needs-model')
               for k in AZK if k != 'Zwart']
    simple('afzetpaal-met-trekband', 'Afzetpaal met trekband 2 m', 'Afzetpaal', ['zakelijk', 'gebruik:evenement'],
           [opt('Uitvoering', [a[0] for a in AZ]), opt('Kleur', AZK), opt('Samenstelling', [x[0] for x in AZS])], vs,
           az_imgs,
           {'kenmerk_kort': 'Oprolbare band 200 cm in 5 kleuren · verzwaarde voet · koppelbaar', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket'},
           ['inrichting-evenement.afzetpalen'], 'inrichting', 'Rijen en entrees afzetten; koppelbaar in alle richtingen; band in 5 kleuren.', ['afzetpaal', 'afzetpalen trekband', 'afzetpaal rode band'],
           {'outmate': 'afzetpaal RVS 2 m band €56 · messing €52–€65 · mat zwart €37,50–€56 · 2x mat zwart €72,50 · mat zwart band met magneetsluiting €87 (live, 2026-10-18)', 'ours': {a[0]: a[1] for a in AZ},
            'samenstelling': 'set van 2 = 2 x prijs - 5% · magneetsluiting + € 35 per paal'}, vmap={i['kleur']: i['file'] for i in az_imgs})
    simple('afzetpaal-met-logo', 'Afzetpaal met jouw logo op de trekband', 'Afzetpaal', ['bedrukbaar', 'zakelijk', 'gebruik:evenement'], [opt('Uitvoering', ['RVS', 'Zwart'])],
           [variant(f'KK-BDR-AZP-{c}', [n], 69.95, 7500, None, tracked=False, qrule={'min': 10, 'max': None, 'increment': 1}) for n, c in [('RVS', 'RVS'), ('Zwart', 'ZWA')]],
           [img('afzetpaal-met-logo-hero.webp', 'hero', 1, 'stanchion', {'finish': 'rvs', 'belt': 'rood', 'beltPrint': {'svg': 'brand/tools/print-wordmark-klein.json', 'color': '#FBF6EC'}, 'pair': True},
                'hero', None, 'needs-model', alt='met voorbeeldopdruk Klapklaar op de band')],
           {'kenmerk_kort': 'Jouw logo op de band · vanaf 10 stuks · drukproef vooraf', 'bedrukbaar': True,
            'drukopties': {'posities': ['Trekband (herhalend)'], 'aanlevering': AANLEVERING, 'levertijd': '2–3 weken na akkoord drukproef', 'min_aantal': 10},
            'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd 2–3 weken na akkoord drukproef', 'verzending': 'pakket'},
           ['inrichting-evenement.afzetpalen'], 'inrichting', 'Afzetten én zichtbaar zijn: logo herhalend op de band; minimaal 10 stuks.', ['afzetpaal bedrukt', 'afzetpaal logo'],
           {'outmate': 'afzetpaal met bedrukking op trekband €74 (live, 2026-10-18)', 'ours': 69.95})
    # catalog round 3 (L10): frame gegalvaniseerd or zwart gepoedercoat, kap effen or met kartelrand, or bedrukt (on both frames); 5 kap colours.
    # Reference (Outmate Marktkraam Professional): gegalvaniseerd € 523 / met kartelrand € 533, zwart € 588 / € 599, bedrukt € 961.
    MK = ['Wit', 'Rood', 'Blauw', 'Groen', 'Zwart']
    MKP = {('Gegalvaniseerd', 'effen kap'): 479.0, ('Gegalvaniseerd', 'kap met kartelrand'): 489.0, ('Zwart', 'effen kap'): 529.0, ('Zwart', 'kap met kartelrand'): 539.0}
    MKB = {'Gegalvaniseerd': 849.0, 'Zwart': 899.0}
    MKU = [f'{f} frame, {k}' for f, k in MKP] + [f'{f} frame, bedrukte kap' for f in MKB]
    MKC = {'Gegalvaniseerd': 'GA', 'Zwart': 'ZW'}
    vs = [variant(f'KK-INR-MKR-{MKC[f]}{"-KR" if "kartel" in kk else ""}-{COLOR_CODE[k]}', [f'{f} frame, {kk}', k], p, 45000 + (500 if f == 'Zwart' else 0), inv(4, f + kk + k + 'mkr', k))
          for (f, kk), p in MKP.items() for k in MK]
    vs += [variant(f'KK-INR-MKR-{MKC[f]}-BDR-WIT', [f'{f} frame, bedrukte kap', 'Wit'], p, 46000, None, tracked=False) for f, p in MKB.items()]
    imgs, vmap = kleur_images('marktkraam-2-m', MK, 'marketStall', lambda k: {'w': 2, 'canopyColor': render_color(k), **render_finish(k)}, 'Rood', status='needs-model', p2=3)
    imgs.append(img('marktkraam-2-m-bedrukte-kap.webp', 'variant', 2, 'marketStall', {'w': 2, 'canopyColor': 'wit', 'canopyPrint': {'artwork': 'brand/img/voorbeeld-fullcolour.png'}},
                    'hero', 'Wit', 'needs-model', alt='met een voorbeeldontwerp op de bedrukte kap'))
    imgs.append(img('marktkraam-2-m-zwart-frame-kartelrand.webp', 'variant', 2, 'marketStall', {'w': 2, 'frame': 'zwart', 'canopyColor': 'rood', 'valance': 'kartel'},
                    'hero', 'Rood', 'needs-param', alt='zwart frame met rode kap met kartelrand'))
    simple('marktkraam-2-m', 'Marktkraam 2 m', 'Marktkraam', ['zakelijk', 'pallet', 'bedrukbaar', 'gebruik:markt'], [opt('Uitvoering', MKU), opt('Kleur', MK)], vs, imgs,
           {'kenmerk_kort': 'Frame gegalvaniseerd of zwart · 2 m werkblad · kap effen, met kartelrand of bedrukt', 'verzending': 'pallet', 'garantie': '1 jaar',
            'staffelkorting': ST_MARKT, 'bedrukbaar': True, 'addon_eenmalig': ['transportkar-marktkramen'],
            'drukopties': {'posities': ['Kap (dak en randen, full colour)'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1,
                           'optie': 'Uitvoering', 'zonder': [u for u in MKU if 'bedrukt' not in u]},
            'specificaties': [sp('Frame', 'Gegalvaniseerd', 'Thermisch verzinkt staal, Ø 25 mm, roestvrij buiten'), sp('Frame', 'Zwart', 'Staal, zwart gepoedercoat over verzinkt'),
                              sp('Kap', 'Materiaal', 'PVC 500 g/m², met elastieken om het frame'), sp('Kap', 'Kartelrand', 'Rand van ca. 20 cm met geschulpte onderkant aan voor- en zijkanten'),
                              sp('Werkblad', 'Maat', '200 x 100 cm, multiplex met antislip-toplaag')]},
           ['inrichting-evenement.marktkramen'], 'inrichting', 'Voor scholen, verenigingen en markten: opzetten zonder gereedschap; frame verzinkt of zwart, kap effen, met kartelrand of bedrukt.',
           ['marktkraam kopen', 'marktkraam 2 meter', 'marktkraam bedrukt', 'marktkraam zwart frame', 'marktkraam kartelrand'],
           {'outmate': 'gegalvaniseerd €523 / kartelrand €533 · zwart €588 / €599 · bedrukt €961 · dakzeil €89 · rok €69 · houten blad €89 · trolley €675',
            'ours': {**{f'{f} {k}': p for (f, k), p in MKP.items()}, **{f'{f} bedrukt': p for f, p in MKB.items()}}}, vmap=vmap,
           extra={'variant_image_sku': {**{f'KK-INR-MKR-{c}-BDR-WIT': 'marktkraam-2-m-bedrukte-kap.webp' for c in MKC.values()},
                                        'KK-INR-MKR-ZW-KR-ROD': 'marktkraam-2-m-zwart-frame-kartelrand.webp'}})
    # the loose parts of the marktkraam (L10): dakzeil effen or met kartelrand, a rok rondom the toonbank, a loose werkblad and the trolley
    DKM = {'Effen': 79.95, 'Met kartelrand': 84.95}
    simple('dakzeil-marktkraam', 'Dakzeil voor marktkraam', 'Marktkraam', ['zakelijk', 'gebruik:markt'], [opt('Uitvoering', list(DKM)), opt('Kleur', MK)],
           [variant(f'KK-INR-MKD-{"E" if u == "Effen" else "KR"}-{COLOR_CODE[k]}', [u, k], p, 4500, inv(6, u + k + 'mkd', k)) for u, p in DKM.items() for k in MK],
           *(lambda r: (r[0],))(kleur_images('dakzeil-marktkraam', MK, 'marketStall', lambda k: {'w': 2, 'canopyColor': render_color(k), 'only': 'kap'}, 'Rood', status='needs-param', p2=3)),
           {'kenmerk_kort': 'PVC 500 g/m² · effen of met kartelrand · 5 kleuren · past op onze 2 m kraam', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL, 'past_op': ['marktkraam-2-m'],
            'specificaties': [sp('Kap', 'Materiaal', 'PVC 500 g/m², waterdicht'), sp('Kap', 'Maat', 'Voor een kraam van 200 x 100 cm'), sp('Kap', 'Bevestiging', 'Elastieken om het frame')]},
           ['inrichting-evenement.marktkramen'], 'inrichting', 'Een nieuwe kleur of een versleten kap vervangen; met of zonder kartelrand; past op het frame van onze marktkraam.',
           ['dakzeil marktkraam', 'kap marktkraam', 'marktkraam zeil kartelrand'], {'outmate': 'dakzeil voor marktkraam vanaf €89', 'ours': DKM},
           vmap={k: f'dakzeil-marktkraam-{slug(k)}-hero.webp' for k in MK})
    RMK = ['Wit', 'Zwart', 'Rood', 'Blauw', 'Groen']
    simple('rok-marktkraam', 'Rok voor marktkraam', 'Marktkraam', ['zakelijk', 'gebruik:markt'], [opt('Kleur', RMK)],
           [variant(f'KK-INR-MKROK-{COLOR_CODE[k]}', [k], 61.95, 1800, inv(6, k + 'mkrok', k)) for k in RMK],
           *(lambda r: (r[0],))(kleur_images('rok-marktkraam', RMK, 'marketStall', lambda k: {'w': 2, 'canopyColor': 'wit', 'skirt': render_color(k)}, 'Wit', status='needs-param', p2=3)),
           {'kenmerk_kort': 'Rondom de toonbank · 3 zijden · klittenband · 5 kleuren', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL, 'past_op': ['marktkraam-2-m'],
            'specificaties': [sp('Rok', 'Materiaal', 'Polyester 220 g/m², kreukarm, wasbaar op 30 °C'), sp('Rok', 'Maat', 'Voorkant 200 cm en 2 zijkanten van 100 cm, hoogte 75 cm'),
                              sp('Rok', 'Bevestiging', 'Klittenband langs de rand van het werkblad')]},
           ['inrichting-evenement.marktkramen'], 'inrichting', 'Netjes tot de grond: dozen en voorraad onder de toonbank uit het zicht; 3 zijden, klittenband.',
           ['rok marktkraam', 'toonbankrok marktkraam'], {'outmate': 'rok voor marktkraam €69', 'ours': 61.95}, vmap={k: f'rok-marktkraam-{slug(k)}-hero.webp' for k in RMK})
    simple('werkblad-marktkraam', 'Werkblad voor marktkraam 200 x 100 cm', 'Marktkraam', ['zakelijk', 'gebruik:markt'], [],
           [variant('KK-INR-MKBL', [], 79.95, 16000, inv(6, 'mkbl'))],
           [img('werkblad-marktkraam-hero.webp', 'hero', 1, 'tableTop', {'w': 2.0, 'd': 1.0, 'thickness': 0.018, 'finish': 'multiplex-antislip'}, 'hero', None, 'needs-param',
                alt='multiplex werkblad van 200 × 100 cm met bruine antislip-toplaag')],
           {'kenmerk_kort': 'Multiplex 18 mm · 200 x 100 cm · antislip-toplaag · reserve of extra', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL, 'past_op': ['marktkraam-2-m'],
            'specificaties': [sp('Blad', 'Materiaal', 'Berken multiplex 18 mm met antislip-filmlaag, kanten gelakt'), sp('Blad', 'Maat', '200 x 100 cm'), sp('Blad', 'Gewicht', 'ca. 16 kg')]},
           ['inrichting-evenement.marktkramen'], 'inrichting', 'Een tweede werkblad (onderplank voor voorraad) of vervanging van een versleten blad; past in de liggers van onze kraam.',
           ['werkblad marktkraam', 'blad marktkraam', 'houten blad marktkraam'], {'outmate': 'houten blad voor marktkraam €89', 'ours': 79.95})
    simple('transportkar-marktkramen', 'Transportkar voor marktkramen', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:markt'], [],
           [variant('KK-MEU-TKMK', [], 609.0, 48000, inv(2, 'tkmk'))],
           [img('transportkar-marktkramen-hero.webp', 'hero', 1, 'trolley', {'kind': 'marktkraam', 'loaded': 0}, 'hero', None, 'needs-model'),
            img('transportkar-marktkramen-gevuld.webp', 'in-gebruik', 3, 'trolley', {'kind': 'marktkraam', 'loaded': 6}, 'hero', None, 'needs-model',
                alt='met 6 ingeklapte marktkramen (kramen niet inbegrepen)')],
           {'kenmerk_kort': 'Voor 6 marktkramen met kap en blad · 4 zwenkwielen, 2 met rem', 'verzending': 'pallet', 'staffelkorting': ST_KAR, 'past_op': ['marktkraam-2-m'],
            'specificaties': [sp('Kar', 'Capaciteit', '6 marktkramen van 2 m (frames, kappen en werkbladen)'), sp('Kar', 'Afmetingen', 'ca. 215 x 110 x 125 cm'),
                              sp('Kar', 'Wielen', '4 zwenkwielen Ø 160 mm, 2 met rem'), sp('Kar', 'Materiaal', 'Staal, verzinkt')]},
           ['tafels-stoelen.trolleys', 'inrichting-evenement.marktkramen'], 'inrichting',
           'Zes complete kramen in één keer van de opslag naar het plein: frames, kappen en bladen op hun plek; door een dubbele deur.',
           ['transportkar marktkraam', 'trolley marktkramen'], {'outmate': 'trolley voor marktkramen €675', 'ours': 609.0})
    LP = [('1 m breed', 7.95), ('2 m breed', 14.95)]
    # M11: Wit for the bruiloft aisle and 3 more; catalog round 5 (low): Roze, Bordeaux and Zandkleur too (the reference sells 4 + 7 colours
    # across two qualities, among them roze, bordeaux and zandkleur)
    LK = ['Rood', 'Zwart', 'Antraciet', 'Wit', 'Blauw', 'Groen', 'Beige', 'Roze', 'Bordeaux', 'Zandkleur']
    LQ = ['Standaard (400 g/m²)', 'Zwaar (600 g/m²)']                        # M11: a heavier quality for repeated use
    vs = [variant(f'KK-INR-LOP-{"1" if m.startswith("1") else "2"}-{COLOR_CODE[k]}' + ('-Z' if q == LQ[1] else ''), [m, k, q], p + (round(p * 0.4) if q == LQ[1] else 0),
                  (1200 if m.startswith('1') else 2400) * (1.5 if q == LQ[1] else 1), None, tracked=False,
                  qrule={'min': 5, 'max': 60, 'increment': 1}) for m, p in LP for k in LK for q in LQ]
    imgs, vmap = kleur_images('loper-per-meter', LK, 'carpetRunner', lambda k: {'width': 1, 'length': 6, 'color': render_color(k)}, 'Rood', status='needs-model', p2=3)
    simple('loper-per-meter', 'Loper (per meter)', 'Loper', ['zakelijk', 'gebruik:evenement'], [opt('Maat', [l[0] for l in LP]), opt('Kleur', LK), opt('Uitvoering', LQ)], vs, imgs,
           {'kenmerk_kort': 'Naaldvilt 400 of 600 g/m² · 1 of 2 m breed · 10 kleuren', 'verzending': 'pakket', 'addon_modus': 'per-regel'},
           ['inrichting-evenement.lopers'], 'inrichting', 'Rode (of zwarte) loper per meter: aantal = meters, uit één stuk tot 60 m.', ['rode loper kopen', 'loper per meter'],
           {'outmate': 'rode loper budget 50 m €439', 'ours': {'1 m breed': '€7,95/m', '2 m breed': '€14,95/m'}}, vmap=vmap)
    # catalog round 3: the 50 m rol (reference € 439 for a 50 m rol, rood, wit or zwart): 1 m breed, ongesneden op een koker; priced at the
    # per-meter price with its 50 m staffel (-10%), so a rol and 50 cut meters cost the same
    LRK = ['Rood', 'Zwart', 'Wit', 'Antraciet', 'Blauw', 'Groen', 'Beige', 'Roze', 'Bordeaux', 'Zandkleur']
    LRQ = {'Standaard (400 g/m²)': 359.0, 'Zwaar (600 g/m²)': 489.0}
    vs = [variant(f'KK-INR-LOPR50-{COLOR_CODE[k]}' + ('-Z' if q.startswith('Zwaar') else ''), ['50 x 1 m', k, q], p, 60000 * (1.5 if q.startswith('Zwaar') else 1), None, tracked=False)
          for k in LRK for q, p in LRQ.items()]
    imgs, vmap = kleur_images('loper-rol-50-m', LRK, 'carpetRunner', lambda k: {'width': 1, 'length': 50, 'color': render_color(k), 'rolled': True}, 'Rood', status='needs-param', p2=3)
    simple('loper-rol-50-m', 'Loper op rol, 50 m', 'Loper', ['zakelijk', 'pallet', 'gebruik:evenement'], [opt('Maat', ['50 x 1 m']), opt('Kleur', LRK), opt('Uitvoering', list(LRQ))], vs, imgs,
           {'kenmerk_kort': 'Hele rol 50 x 1 m · naaldvilt · ongesneden op koker · 10 kleuren', 'verzending': 'pallet',
            'specificaties': [sp('Loper', 'Maat', '50 m lang, 1 m breed, ongesneden op een kartonnen koker'), sp('Loper', 'Materiaal', 'Naaldvilt polypropyleen met antislip-rug'),
                              sp('Loper', 'Gewicht', 'Standaard 400 g/m² (ca. 20 kg per rol), zwaar 600 g/m² (ca. 30 kg per rol)')]},
           ['inrichting-evenement.lopers'], 'inrichting',
           'Voor wie vaak legt (verhuur, evenementenbureau, zaal): een hele rol van 50 m, zelf op maat snijden; zelfde prijs als 50 m per meter met staffel; per meter blijft voor kortere lengtes.',
           ['loper 50 meter', 'rode loper rol', 'loper op rol'], {'outmate': 'rode, witte of zwarte loper 50 m Classic €439', 'ours': LRQ}, vmap=vmap)
    # carport (catalog round 3, L): a Kleur choice like the reference (grijs or groen next to wit) and cart recommendations
    _cp = HANDLES['carport-opslagtent-vast-frame']
    CPK = ['Wit', 'Grijs', 'Groen']
    _cpv = []
    for _v in _cp['variants']:
        for k in CPK:
            _cpv.append(variant(_v['sku'] + ('' if k == 'Wit' else f'-{COLOR_CODE[k]}'), [_v['option1'], k], _v['price'] / 100, _v['grams'], 2))
    _cp['variants'] = _cpv
    _cp['options'] = [_cp['options'][0], opt('Kleur', CPK)]
    _cp['images'] += [img(f'carport-opslagtent-vast-frame-{slug(k)}-hero.webp', 'variant', 2, 'carportTent', {'w': 3.3, 'd': 4.8, 'color': render_color(k)}, 'hero', k, 'needs-model',
                          alt=f'met {k.lower()} doek') for k in CPK if k != 'Wit']
    _cp['variant_image_sku'] = {**{f'KK-TENT-CP-{code(m)}-{COLOR_CODE[k]}': f'carport-opslagtent-vast-frame-{slug(k)}-hero.webp'
                                   for m in ['3,3 x 4,8 m', '3,3 x 7,2 m', '3,3 x 9,6 m'] for k in CPK if k != 'Wit'}}
    _cp['complementary'] = ['spanband-met-ratel', 'haringen-en-bevestigingsmateriaal-partytent', 'betonblok-ballast-tent', 'reparatieset-tentdoek', 'zeilringen-12-mm']

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
    return {'Zwart': 'zwart', 'Wit': 'wit', 'Houtlook': 'houtlook', 'Eiken': 'eiken'}[k]
