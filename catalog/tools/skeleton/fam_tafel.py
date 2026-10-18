# Statafels en statafeltextiel (rokken, hoezen, kleden, topcovers, beschermplaten, bedrukt).
from kk_base import *
from fam_acc import simple

ROUND = ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80', 'statafel-met-kruisvoet']

def top_param(k):
    return {'Wit': 'wit', 'Zwart': 'zwart', 'Berken': 'berken', 'Antraciet': 'antraciet', 'Lichtgrijs': 'hdpe-grijs', 'Houtlook': 'houtlook', 'Graniet': 'graniet'}[k]


def _lum(k):
    h = SWATCH_HEX.get(k, '#808080').lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_textile(k):
    """The rok / hoes a loose topcover, strik or kleed is shown on: wit under a dark colour, zwart under a light one."""
    return 'wit' if _lum(k) < 0.42 else 'zwart'

def build():
    # ------------------------------------------------------------ statafels
    SP = {'Ø70 cm': (89.95, 12), 'Ø80 cm': (94.95, 13), 'Ø85 cm': (99.95, 14)}
    SPK = ['Wit', 'Zwart', 'Antraciet', 'Graniet', 'Berken']
    # Binnen: HPL-toplaag op 18 mm plaat · Buiten: massief compact HPL 12 mm (weer- en UV-bestendig, + € 25) · parasolgat: holle kolom
    # + gat in het blad (+ € 10) · Graniet = steenlook-HPL (+ € 10) · Berken is multiplex, dus alleen Binnen (+ € 15)
    SPU = ['Binnen', 'Binnen, met parasolgat', 'Buiten (compact HPL)', 'Buiten (compact HPL), met parasolgat']
    def sp_price(p, k, u):
        return p + {'Berken': 15, 'Graniet': 10}.get(k, 0) + (25 if u.startswith('Buiten') else 0) + (10 if 'parasolgat' in u else 0)
    vs = [variant(f'KK-STF-PRO-{code(m)}-{COLOR_CODE[k]}' + ('-HPL' if u.startswith('Buiten') else '') + ('-PG' if 'parasolgat' in u else ''), [m, k, u], sp_price(p, k, u),
                  kg * 1000 + (500 if 'parasolgat' in u else 0) + (1500 if u.startswith('Buiten') else 0),
                  inv(30, m + k + u, k, (1.3 if m == 'Ø80 cm' else 0.7) * (1 if u == SPU[0] else 0.25)))
          for m, (p, kg) in SP.items() for k in SPK for u in SPU if not (k == 'Berken' and u.startswith('Buiten'))]
    imgs, vmap = kleur_images('statafel-inklapbaar-professional', SPK, 'statafel', lambda k: {'diameter': 0.8, 'height': 1.1, 'top': top_param(k), 'frame': 'zwart', 'base': 'klap'}, 'Wit',
                              [img('statafel-inklapbaar-professional-wit-ingeklapt.webp', 'detail', 2, 'statafel', {'diameter': 0.8, 'top': 'wit', 'frame': 'zwart', 'base': 'klap', 'folded': True}, 'hero', 'Wit',
                                   alt='ingeklapt'),
                               img('statafel-inklapbaar-professional-wit-detail.webp', 'detail', 3, 'statafel', {'diameter': 0.8, 'top': 'wit', 'frame': 'zwart', 'base': 'klap'}, 'detail', 'Wit',
                                   alt='bladrand met kantenband'),
                               img('statafel-inklapbaar-professional-met-rok.webp', 'in-gebruik', 3, 'statafelCover', {'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart'}, 'hero', None, 'existing',
                                   alt='met statafelrok stretch zwart (rok niet inbegrepen)'),
                               img('statafel-inklapbaar-professional-wit-parasolgat.webp', 'detail', 3, 'statafel', {'diameter': 0.8, 'top': 'wit', 'frame': 'zwart', 'base': 'klap', 'parasolHole': 0.04}, 'detail', 'Wit', 'needs-param',
                                   alt='uitvoering met parasolgat en afdekdop')],
                              status='existing', p2=2)
    simple('statafel-inklapbaar-professional', 'Statafel inklapbaar Professional', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Maat', list(SP)), opt('Kleur', SPK), opt('Uitvoering', SPU)], vs, imgs,
           {'kenmerk_kort': '110 cm hoog · kolom Ø 32 mm · hittebestendig blad met kantenband',
            'specificaties': [sp('Blad', 'Diameter', 'Ø70, Ø80 of Ø85 cm'), sp('Blad', 'Materiaal', 'HPL-toplaag op 18 mm plaat, kantenband rondom (Berken: 18 mm berken multiplex, gelakt)'),
                              sp('Blad', 'Eigenschappen', 'Krasvast, hittebestendig tot ca. 180 °C, binnen en buiten'),
                              sp('Onderstel', 'Materiaal', 'Staal, zwart epoxy-gepoedercoat, kolom Ø 32 mm, 4 inklapbare poten'),
                              sp('Afmetingen', 'Hoogte', '110 cm'), sp('Afmetingen', 'Ingeklapt', 'ca. 140 x 80 x 15 cm (Ø80)'), sp('Gewicht', 'Totaal', '12–14 kg'),
                              sp('Uitvoering', 'Met parasolgat', 'Gat Ø 40 mm midden in het blad met afdekdop, holle kolom Ø 45 mm, voor parasolstokken tot Ø 38 mm')],
            'staffelkorting': ST_STATAFEL, 'addons': ['statafelrok-stretch', 'beschermplaat-statafel'], 'verzending': 'pakket', 'vergelijk_groep': 'statafel',
            'gewicht_kg': 13, 'verpakt': '142 x 82 x 16 cm (Ø80)', 'garantie': '2 jaar', 'addon_eenmalig': ['transportkar-statafels']},
           ['tafels-stoelen.statafels'], 'statafel',
           'Dé statafel voor horeca, verhuur en feest: maatkeuze (Ø70 = 4–5 staand, Ø80 = 6), bladkeuze, inklapbaar in één beweging, hoe hoog 110 cm is t.o.v. barkrukken.',
           ['statafel inklapbaar', 'statafel 80 cm', 'statafel kopen'],
           {'statafelshop': 'Savannah vanaf €102,79 · Oregon Ø80 €96,74 · Colorado Ø85 graniet buiten €104 · Sacramento antraciet/pizarra/punti binnen en buiten vanaf €102,79 · Columbus €108,84',
            'band': 'horeca mid €97–€109; DIY €46–€80',
            'ours': {m: v[0] for m, v in SP.items()}, 'opties': '+ € 25 buiten (compact HPL) · + € 10 graniet · + € 15 berken · + € 10 parasolgat'}, vmap=vmap)
    HK = ['Wit', 'Lichtgrijs']
    vs = [variant(f'KK-STF-HDPE-D80-{COLOR_CODE[k]}', ['Ø80 cm', k], 54.95, 9000, inv(40, 'hdpe' + k, k)) for k in HK]
    imgs, vmap = kleur_images('statafel-inklapbaar-hdpe-80', HK, 'statafel', lambda k: {'diameter': 0.8, 'height': 1.1, 'top': 'hdpe' if k == 'Wit' else 'hdpe-grijs', 'frame': 'zwart', 'base': 'klap'}, 'Wit',
                              [img('statafel-inklapbaar-hdpe-80-wit-ingeklapt.webp', 'detail', 3, 'statafel', {'diameter': 0.8, 'top': 'hdpe', 'frame': 'zwart', 'base': 'klap', 'folded': True}, 'hero', 'Wit')])
    simple('statafel-inklapbaar-hdpe-80', 'Statafel inklapbaar HDPE Ø80 cm', 'Statafel', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:evenement'], [opt('Maat', ['Ø80 cm']), opt('Kleur', HK)], vs, imgs,
           {'kenmerk_kort': '110 cm hoog · 45 mm HDPE-blad · 9 kg', 'staffelkorting': ST_STATAFEL, 'addons': ['statafelrok-stretch'], 'verzending': 'pakket',
            'addon_eenmalig': ['transportkar-statafels'],
            'specificaties': [sp('Blad', 'Materiaal', 'HDPE blow-mould 45 mm, wit of lichtgrijs, binnen en buiten'), sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, inklapbaar'),
                              sp('Afmetingen', 'Hoogte', '110 cm'), sp('Gewicht', 'Totaal', '9 kg')],
            'vergelijk_groep': 'statafel', 'gewicht_kg': 9, 'verpakt': '112 x 82 x 12 cm', 'garantie': '2 jaar'},
           ['tafels-stoelen.statafels'], 'statafel', 'Lichte, onderhoudsarme statafel voor thuis en de club; eerlijk vergelijken met Professional (lichter, minder chic blad).',
           ['statafel goedkoop', 'statafel kunststof'], {'band': 'DIY €46–€80 (Gamma HDPE €57,99)', 'statafelshop': 'New York €45 (geen specificaties)', 'ours': 54.95}, vmap=vmap)
    KV = {'Ø70 cm': 129.0, 'Ø80 cm': 139.0, 'Ø85 cm': 149.0}
    KK_ = ['Wit', 'Zwart', 'Berken']
    KVU = ['110 cm hoog', '107 cm hoog']   # 107 cm: the lower bar height Statafelshop sells next to 110 cm
    vs = [variant(f'KK-STF-KV-{code(m)}-{COLOR_CODE[k]}' + ('-107' if u == KVU[1] else ''), [m, k, u], p + (10 if k == 'Berken' else 0), 22000,
                  inv(10, m + k + 'kv' + ('' if u == KVU[0] else u), k, 1 if u == KVU[0] else 0.4)) for m, p in KV.items() for k in KK_ for u in KVU]
    imgs, vmap = kleur_images('statafel-met-kruisvoet', KK_, 'statafel', lambda k: {'diameter': 0.8, 'height': 1.1, 'top': top_param(k), 'frame': 'zwart', 'base': 'kruis'}, 'Zwart', p2=3)
    simple('statafel-met-kruisvoet', 'Statafel met kruisvoet', 'Statafel', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(KV)), opt('Kleur', KK_), opt('Uitvoering', KVU)], vs, imgs,
           {'kenmerk_kort': 'Vaste stalen kruisvoet · 110 of 107 cm · voor terras en bar', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket', 'vergelijk_groep': 'statafel',
            'specificaties': [sp('Onderstel', 'Voet', 'Stalen kruisvoet 70 x 70 cm met stelvoetjes'), sp('Afmetingen', 'Hoogte', '110 of 107 cm'), sp('Gewicht', 'Totaal', 'ca. 22 kg')],
            'gewicht_kg': 22, 'garantie': '2 jaar'},
           ['tafels-stoelen.statafels'], 'statafel', 'Vaste horeca-statafel die blijft staan: zwaarder, niet inklapbaar, stelvoetjes voor schuine terrassen.',
           ['statafel horeca', 'statafel kruisvoet'], {'band': 'zwaar kruisvoet €272 (VVEP)', 'ours': KV}, vmap=vmap)
    VQ = {'60 x 60 cm': 119.0, '70 x 70 cm': 129.0, '80 x 80 cm': 139.0}
    VQK = ['Zwart', 'Wit', 'Houtlook']
    VQU = ['Zwart onderstel', 'RVS onderstel']   # RVS: geborsteld roestvast staal, + € 30
    VQG = {'60 x 60 cm': 15000, '70 x 70 cm': 16000, '80 x 80 cm': 19000}
    vs = [variant(f'KK-STF-VK-{code(m)}-{COLOR_CODE[k]}' + ('-RVS' if u == VQU[1] else ''), [m, k, u], p + (30 if u == VQU[1] else 0), VQG[m],
                  inv(10, m + k + 'vk' + ('' if u == VQU[0] else u), k, 1 if u == VQU[0] else 0.4)) for m, p in VQ.items() for k in VQK for u in VQU]
    imgs, vmap = kleur_images('statafel-vierkant-stapelbaar', VQK, 'statafel', lambda k: {'shape': 'square', 'width': 0.7, 'height': 1.07, 'top': top_param(k), 'frame': 'zwart', 'base': 'kruis', 'stackable': True}, 'Zwart',
                              status='existing', p2=3)
    simple('statafel-vierkant-stapelbaar', 'Statafel vierkant stapelbaar', 'Statafel', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(VQ)), opt('Kleur', VQK), opt('Uitvoering', VQU)], vs, imgs,
           {'kenmerk_kort': 'Vierkant blad · stapelbaar · 107 cm · zwart of RVS', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket', 'vergelijk_groep': 'statafel', 'gewicht_kg': 16,
            'addon_eenmalig': ['transportkar-statafels'],   # the plateaukar for 5 stacked tables: once per order line
            'specificaties': [sp('Afmetingen', 'Hoogte', '107 cm'), sp('Onderstel', 'Materiaal', 'Staal zwart gepoedercoat of geborsteld RVS, stapelbaar')], 'garantie': '2 jaar'},
           ['tafels-stoelen.statafels'], 'statafel', 'Strakke vierkante statafel die je stapelt in plaats van inklapt; populair in horeca en lounges.',
           ['statafel vierkant', 'statafel stapelbaar', 'statafel rvs'], {'statafelshop': 'Indus €148,77 · Kansas RVS of zwart frame vanaf €163,29', 'outmate': '70x70 €159–€169', 'ours': VQ, 'rvs': '+ € 30'}, vmap=vmap)
    RH = {'120 x 60 cm': 169.0, '120 x 70 cm': 179.0, '160 x 60 cm': 189.0}
    RHK = ['Berken', 'Zwart']
    RHG = {'120 x 60 cm': 21000, '120 x 70 cm': 23000, '160 x 60 cm': 25000}
    vs = [variant(f'KK-STF-RH-{code(m)}-{COLOR_CODE[k]}', [m, k], p, RHG[m], inv(6, m + k + 'rh', k)) for m, p in RH.items() for k in RHK]
    imgs, vmap = kleur_images('statafel-rechthoekig-inklapbaar', RHK, 'statafel', lambda k: {'shape': 'rect', 'width': 1.6, 'depth': 0.6, 'height': 1.1, 'top': top_param(k), 'frame': 'zwart', 'base': 'klap'}, 'Berken',
                              status='existing', p2=3)
    simple('statafel-rechthoekig-inklapbaar', 'Statafel rechthoekig inklapbaar', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'], [opt('Maat', list(RH)), opt('Kleur', RHK)], vs, imgs,
           {'kenmerk_kort': 'Lang blad voor 8–10 personen staand · 110 cm · inklapbaar', 'staffelkorting': ST_STATAFEL, 'verzending': 'pallet', 'vergelijk_groep': 'statafel', 'garantie': '2 jaar'},
           ['tafels-stoelen.statafels'], 'statafel', 'Lange statafel als bar of buffet op stahoogte; inklapbaar voor opslag.',
           ['statafel rechthoekig', 'lange statafel'], {'statafelshop': 'Indus Breed €252,89 · Purus 160x60 €204,49', 'ours': RH}, vmap=vmap)
    simple('statafel-wijnvat-houtlook', 'Statafel wijnvat houtlook', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'], [opt('Maat', ['Ø80 cm'])],
           [variant('KK-STF-VAT-D80', ['Ø80 cm'], 349.0, 25000, 6)],
           [img('statafel-wijnvat-houtlook-hero.webp', 'hero', 1, 'barrelTable', {'top': 0.8, 'height': 1.05, 'finish': 'houtlook'}, 'hero', 'Houtlook', 'needs-model')],
           {'kenmerk_kort': 'Kunststof vat in houtlook · vulbaar met water of zand · binnen en buiten', 'verzending': 'pallet', 'gewicht_kg': 25, 'vergelijk_groep': 'statafel'},
           ['tafels-stoelen.statafels', 'tafels-stoelen.barrels-sets'], 'statafel', 'Sfeermaker voor terras en feest; vulbaar voor stabiliteit; weerbestendig.',
           ['wijnvat statafel', 'barrel statafel'], {'outmate': 'Barrel Ø100 €399', 'ours': 349})

    # ------------------------------------------------------------ rokken & hoezen
    RM = ['Ø80-85 cm', 'Ø60-70 cm']
    RU = ['Met topcover', 'Zonder topcover']
    vs = [variant(f'KK-ROK-ST-{code(m)}-{"TC" if u == RU[0] else "ZT"}-{COLOR_CODE[k]}', [m, u, k], 19.95 if u == RU[0] else 15.95, 650 if u == RU[0] else 520,
                  inv(60 if m == RM[0] else 25, m + u + k, k, 1.0 if u == RU[0] else 0.5)) for m in RM for u in RU for k in ROK_KLEUREN]
    imgs, vmap = kleur_images('statafelrok-stretch', ROK_KLEUREN, 'statafelCover', lambda k: {'type': 'stretch', 'color': render_color(k), 'diameter': 0.8, 'topcover': render_color(k)}, 'Zwart',
                              [img('statafelrok-stretch-zwart-detail.webp', 'detail', 2, 'statafelCover', {'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart'}, 'detail', 'Zwart',
                                   alt='zoom tussen de voeten'),
                               img('statafelrok-stretch-wit-zwarte-topcover.webp', 'in-gebruik', 3, 'statafelCover', {'type': 'stretch', 'color': 'wit', 'diameter': 0.8, 'topcover': 'zwart'}, 'hero', 'Wit',
                                   alt='wit met losse zwarte topcover (apart verkrijgbaar)')], p2=2)
    simple('statafelrok-stretch', 'Statafelrok stretch', 'Statafelrok', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Maat', RM), opt('Uitvoering', RU), opt('Kleur', ROK_KLEUREN)], vs, imgs,
           {'kenmerk_kort': 'Voor Ø 80–85 of 60–70 cm · 220 g/m² stretch · 24 kleuren',
            'specificaties': [sp('Stof', 'Materiaal', '90% polyester, 10% elastaan, 220 g/m²'), sp('Pasvorm', 'Ø80-85 cm', 'Bladen Ø 80–85 cm, tafelhoogte 105–115 cm'),
                              sp('Pasvorm', 'Ø60-70 cm', 'Bladen Ø 60–70 cm, tafelhoogte 105–115 cm'), sp('Onderhoud', 'Wassen', '30 °C, niet in de droger, kreukherstellend')],
            'staffelkorting': ST_TEXTIEL, 'past_op': ROUND, 'verzending': 'pakket', 'vergelijk_groep': 'statafeltextiel', 'addons': ['topcover-stretch-statafel', 'beschermplaat-statafel']},
           ['statafelrokken-hoezen.statafelrok-stretch'], 'textiel',
           'Bestseller-categorie: welke maat bij welk blad (link maatadvies), met of zonder topcover, 24 kleuren, staffelprijs vanaf 10 (Statafelshop heeft geen staffel), wassen op 30 °C.',
           ['statafelrok stretch', 'statafelhoes stretch 80 cm', 'statafelrok zwart'],
           {'outmate': '€14,99 incl. topcover (190 g/m²)', 'statafelshop': '€33,82 incl. topcover', 'band': '€15–€34 incl. topcover; zonder €12,50–€18', 'ours': {'met topcover': 19.95, 'zonder topcover': 15.95}}, vmap=vmap)
    TU = ['Topcover rood-wit-blauw', 'Topcover voetbal']
    vs = [variant(f'KK-ROK-TH-{code(m)}-{"RWB" if u == TU[0] else "VB"}', [m, u], 42.95, 650, inv(20 if m == RM[0] else 8, m + u + 'thema'))
          for m in RM for u in TU]
    th_imgs = [img('statafelrok-stretch-oranje-thema-rood-wit-blauw-hero.webp', 'hero', 1, 'statafelCover',
                   {'type': 'stretch', 'color': 'oranje', 'diameter': 0.8, 'topcover': 'rood', 'topcoverPrint': 'stripes-rwb'}, 'hero', None, 'existing',
                   alt='oranje rok met topcover in rood, wit en blauw'),
               img('statafelrok-stretch-oranje-thema-voetbal-hero.webp', 'variant', 2, 'statafelCover',
                   {'type': 'stretch', 'color': 'oranje', 'diameter': 0.8, 'topcover': 'wit', 'topcoverPrint': 'voetbal'}, 'hero', None, 'existing',
                   alt='oranje rok met topcover in voetbalprint')]
    simple('statafelrok-stretch-oranje-thema', 'Statafelrok stretch oranje met themacover', 'Statafelrok', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Maat', RM), opt('Uitvoering', TU)], vs, th_imgs,
           {'kenmerk_kort': 'Oranje stretchrok + bedrukte topcover · Ø 60–70 of 80–85 cm',
            'specificaties': [sp('Stof', 'Materiaal', '90% polyester, 10% elastaan, 220 g/m²'), sp('Topcover', 'Opdruk', 'Rood-wit-blauwe banen of voetbalprint, sublimatie'),
                              sp('Pasvorm', 'Ø80-85 cm', 'Bladen Ø 80–85 cm, tafelhoogte 105–115 cm'), sp('Pasvorm', 'Ø60-70 cm', 'Bladen Ø 60–70 cm, tafelhoogte 105–115 cm'),
                              sp('Onderhoud', 'Wassen', '30 °C, niet in de droger')],
            'staffelkorting': ST_TEXTIEL, 'past_op': ROUND, 'verzending': 'pakket', 'vergelijk_groep': 'statafeltextiel'},
           ['statafelrokken-hoezen.statafelrok-stretch'], 'textiel',
           'Seizoensrok voor Koningsdag, EK en WK: oranje stretchrok met een topcover in rood-wit-blauw of voetbalprint; zelfde pasvorm als de gewone stretchrok; staffel vanaf 10.',
           ['oranje statafelrok', 'statafelrok koningsdag', 'statafelrok ek wk'],
           {'statafelshop': 'EK/WK stretchrok €48,34 (actie, was €54,45)', 'ours': 42.95}, vmap={'Topcover rood-wit-blauw': th_imgs[0]['file'], 'Topcover voetbal': th_imgs[1]['file']},
           vby='Uitvoering')
    vs = [variant(f'KK-TOP-ST-{code(m)}-{COLOR_CODE[k]}', [m, k], 7.95, 120, inv(40, m + k + 'tc', k)) for m in RM for k in ROK_KLEUREN]
    # packshot: the topcover on a stretchrok in a contrasting colour (the alt says the rok is not included)
    imgs, vmap = kleur_images('topcover-stretch-statafel', ROK_KLEUREN, 'statafelCover',
                              lambda k: {'type': 'stretch', 'color': contrast_textile(k), 'diameter': 0.8, 'topcover': render_color(k)}, 'Zwart', status='existing', p2=3)
    simple('topcover-stretch-statafel', 'Topcover stretch voor statafel', 'Topcover', ['zakelijk', 'gebruik:horeca'], [opt('Maat', RM), opt('Kleur', ROK_KLEUREN)], vs, imgs,
           {'kenmerk_kort': 'Los blad-hoesje · contrastkleur of vervanging · 24 kleuren', 'staffelkorting': ST_TEXTIEL, 'past_op': ROUND + ['statafelrok-stretch'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.topcovers'], 'textiel', 'Losse topcover voor een tweede kleur of als reserve; zelfde 24 kleuren als de rok.',
           ['topcover statafel', 'topcover stretch'], {'statafelshop': 'vanaf €12,04', 'band': 'biertafelplaza €7,50 per stuk', 'ours': 7.95}, vmap=vmap)
    vs = [variant(f'KK-HOES-STR-{code(m)}-{COLOR_CODE[k]}', [m, k], 26.95, 900, inv(20 if m == RM[0] else 8, m + k + 'strik', k)) for m in RM for k in STRIK_KLEUREN]
    imgs, vmap = kleur_images('statafelhoes-met-strik', STRIK_KLEUREN, 'statafelCover', lambda k: {'type': 'strik', 'color': render_color(k), 'diameter': 0.8}, 'Wit',
                              [img('statafelhoes-met-strik-wit-detail.webp', 'detail', 2, 'statafelCover', {'type': 'strik', 'color': 'wit', 'diameter': 0.8}, 'detail', 'Wit', alt='de strik')], p2=2)
    simple('statafelhoes-met-strik', 'Statafelhoes met strik', 'Statafelhoes met strik', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'], [opt('Maat', RM), opt('Kleur', STRIK_KLEUREN)], vs, imgs,
           {'kenmerk_kort': 'Los vallend polyester · strik op taillehoogte · tot de grond', 'staffelkorting': ST_TEXTIEL, 'past_op': ROUND, 'verzending': 'pakket',
            'vergelijk_groep': 'statafeltextiel', 'addons': ['losse-strik-statafelhoes'],
            'specificaties': [sp('Stof', 'Materiaal', '100% polyester, kreukarm'), sp('Pasvorm', 'Bladen', 'Ø 60–70 of Ø 80–85 cm, tot 115 cm hoog')]},
           ['statafelrokken-hoezen.statafelhoes-strik'], 'textiel', 'Feestelijker dan stretch (bruiloft, gala): valt in plooien, strik om de taille; met losse strik in een contrastkleur te combineren.',
           ['statafelhoes met strik', 'strikrok statafel'], {'statafelshop': '€30,19–€35,03', 'ours': 26.95}, vmap=vmap)
    SL = STRIK_KLEUREN + ['Roze', 'Groen']
    vs = [variant(f'KK-STRIK-{COLOR_CODE[k]}', [k], 6.95, 150, inv(25, k + 'sl', k)) for k in SL]
    # per colour: the strik tied round a hoes met strik in a contrasting colour, close up on the bow (statafelCover detail)
    imgs, vmap = kleur_images('losse-strik-statafelhoes', SL, 'statafelCover', lambda k: {'type': 'strik', 'color': contrast_textile(k), 'sashColor': render_color(k), 'diameter': 0.8},
                              'Goud', [img('losse-strik-statafelhoes-op-hoes.webp', 'in-gebruik', 2, 'statafelCover', {'type': 'strik', 'color': 'wit', 'sashColor': 'goud', 'diameter': 0.8}, 'hero', 'Goud', 'existing',
                                           alt='goud om een witte hoes met strik (hoes niet inbegrepen)')], status='existing', p2=3)
    for i in imgs:
        if i['file'] != 'losse-strik-statafelhoes-op-hoes.webp':
            i['render']['angle'] = 'detail'
    simple('losse-strik-statafelhoes', 'Losse strik voor statafelhoes', 'Strik', ['zakelijk', 'gebruik:evenement'], [opt('Kleur', SL)], vs, imgs,
           {'kenmerk_kort': 'Satijnen sjerp 300 cm · contrast op je hoes', 'staffelkorting': ST_TEXTIEL, 'past_op': ['statafelhoes-met-strik', 'statafelrok-stretch'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.statafelhoes-strik'], 'textiel', 'Kleur van de strik zelf kiezen (bv. wit met goud voor een bruiloft); werkt ook om een stretchrok.',
           ['strik statafel', 'sjerp statafelhoes'], {'note': 'geen referentie; Statafelshop biedt geen losse strikkleur', 'ours': 6.95}, vmap=vmap)
    KL = ['Wit', 'Crème', 'Zwart', 'Antraciet', 'Bordeaux', 'Marineblauw']
    KM = ['Ø130 cm', '140 x 140 cm']
    vs = [variant(f'KK-KLD-{code(m)}-{COLOR_CODE[k]}', [m, k], 15.95, 400, inv(15, m + k + 'kl', k)) for m in KM for k in KL]
    # round Ø130 kleed (25 cm overhang on a Ø80 blad) over a stretchrok in a contrasting colour (statafelCover kleed with drop + over)
    imgs, vmap = kleur_images('statafelkleed', KL, 'statafelCover',
                              lambda k: {'type': 'kleed', 'color': render_color(k), 'diameter': 0.8, 'drop': 0.25, 'over': 'stretch', 'underColor': contrast_textile(k)}, 'Wit',
                              status='existing', p2=3)
    # square 140 x 140 kleed: own render per colour (the four points hang lower than the sides), image per SKU
    for k in KL:
        imgs.append(img(f'statafelkleed-{slug(k)}-vierkant-hero.webp', 'variant', 3, 'statafelCover',
                        {'type': 'kleed', 'color': render_color(k), 'diameter': 0.8, 'square': 1.4, 'over': 'stretch', 'underColor': contrast_textile(k)},
                        'hero', k, 'existing'))
    kld_sq = {f'KK-KLD-{code(KM[1])}-{COLOR_CODE[k]}': f'statafelkleed-{slug(k)}-vierkant-hero.webp' for k in KL}
    simple('statafelkleed', 'Statafelkleed', 'Statafelkleed', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'], [opt('Maat', KM), opt('Kleur', KL)], vs, imgs,
           {'kenmerk_kort': 'Rond Ø 130 of vierkant 140 x 140 cm · over je stretchrok', 'staffelkorting': ST_TEXTIEL, 'past_op': ROUND + ['statafel-vierkant-stapelbaar'],
            'verzending': 'pakket', 'vergelijk_groep': 'statafeltextiel'},
           ['statafelrokken-hoezen.statafelkleden'], 'textiel', 'Kleed over een stretchrok: chiquer en beschermt de rok; rond of vierkant (punten vallen anders).',
           ['statafelkleed', 'tafelkleed statafel'], {'statafelshop': '€18,09', 'ours': 15.95}, vmap=vmap,
           extra={'variant_image_sku': kld_sq})
    KG = ['Wit', 'Crème', 'Champagne', 'Zwart']
    KGM = {'Ø300 cm': (34.95, 1300), 'Ø330 cm': (39.95, 1600)}   # Ø330: Ø180 banket-tafel, 180 + 2 x 74 = 328 cm
    vs = [variant(f'KK-KLD-{code(m)}-{COLOR_CODE[k]}', [m, k], p, g, inv(10, (k + 'kg') if m == 'Ø300 cm' else (m + k + 'kg'), k)) for m, (p, g) in KGM.items() for k in KG]
    imgs, vmap = kleur_images('statafelkleed-rond-tot-de-grond', KG, 'statafelCover', lambda k: {'type': 'kleed', 'color': render_color(k), 'diameter': 0.8}, 'Wit', p2=3)
    simple('statafelkleed-rond-tot-de-grond', 'Rond tafelkleed tot de grond', 'Statafelkleed', ['gebruik:evenement'], [opt('Maat', list(KGM)), opt('Kleur', KG)], vs, imgs,
           {'kenmerk_kort': 'Ø 300 of 330 cm · tot de grond op statafel of banket-tafel', 'staffelkorting': ST_TEXTIEL, 'past_op': ROUND + ['klaptafel-hdpe-rond'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.statafelkleden'], 'textiel', 'Rond kleed dat tot de grond valt, voor diners en recepties; uitleg waarom Ø 300 cm (80 + 2 × 110).',
           ['statafelkleed tot de grond', 'rond tafelkleed 300', 'tafelkleed ronde tafel 180'], {'note': 'Statafelshop heeft geen kleed tot de grond', 'ours': {m: v[0] for m, v in KGM.items()}}, vmap=vmap)
    BH = {'122 x 61 cm': 29.95, '183 x 76 cm': 34.95, '244 x 76 cm': 39.95}
    BK = ['Wit', 'Zwart', 'Antraciet']
    vs = [variant(f'KK-THOES-{code(m)}-{COLOR_CODE[k]}', [m, k], p, 700 + 200 * i, inv(12, m + k + 'bh', k)) for i, (m, p) in enumerate(BH.items()) for k in BK]
    imgs, vmap = kleur_images('stretchhoes-klaptafel', BK, 'buffetCover', lambda k: {'length': 1.83, 'width': 0.76, 'color': render_color(k), 'kind': 'klaptafel'}, 'Zwart', status='existing', p2=3)
    simple('stretchhoes-klaptafel', 'Stretchhoes klaptafel en buffettafel', 'Tafelhoes', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'], [opt('Maat', list(BH)), opt('Kleur', BK)], vs, imgs,
           {'kenmerk_kort': 'Strak tot de grond · voor klaptafels 122, 183 en 244 cm', 'staffelkorting': ST_TEXTIEL, 'past_op': ['klaptafel-hdpe-rechthoekig'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.buffettafel-hoezen'], 'textiel', 'Buffet- en klaptafels netjes aankleden, poten uit het zicht; maat = blad.',
           ['stretchhoes buffettafel', 'hoes klaptafel 183'], {'statafelshop': '183x76 €42,29', 'ours': BH}, vmap=vmap)
    # Uitvoering after the merchandising review: the set (tafel + 2 banken), a tafelhoes alone (for the biertafel 'Alleen tafel') or one
    # bankhoes (for the loose bierbank); Maat = what it covers. Set stays cheaper than tafel + 2 banken los (39,95 < 24,95 + 2 x 9,95).
    BTU = ['Set: tafel en 2 banken', 'Alleen tafel', 'Alleen bank']
    BT = [('220 x 50 cm', BTU[0], 39.95, 1400, 'S'), ('220 x 70 cm', BTU[0], 44.95, 1500, 'S'), ('220 x 50 cm', BTU[1], 24.95, 700, 'T'),
          ('220 x 70 cm', BTU[1], 27.95, 800, 'T'), ('220 x 25 cm', BTU[2], 9.95, 350, 'B')]
    BTM = ['220 x 50 cm', '220 x 70 cm', '220 x 25 cm']
    # SKU of the set keeps its old form (KK-THOES-BT-220X50-WIT); tafel alone -T, bank alone 220X25
    vs = [variant(f'KK-THOES-BT-{code(m)}' + ('-T' if c == 'T' else '') + f'-{COLOR_CODE[k]}', [m, u, k], p, g, inv(8, m + u + k + 'bt', k)) for m, u, p, g, c in BT for k in BK]
    imgs, vmap = kleur_images('hoes-biertafelset', BK, 'buffetCover', lambda k: {'kind': 'biertafelset', 'length': 2.2, 'width': 0.5, 'color': render_color(k)}, 'Wit', status='existing', p2=3)
    # tafel alone and bank alone: own render per colour (buffetCover single table / one bierbank), so a bankhoes never shows the set
    for k in BK:
        imgs += [img(f'hoes-biertafelset-alleen-tafel-{slug(k)}.webp', 'variant', 3, 'buffetCover', {'kind': 'biertafelset', 'single': True, 'length': 2.2, 'width': 0.5,
                                                                                                      'color': render_color(k)},
                     'hero', k, 'existing', alt=f'alleen de tafelhoes in {k.lower()}, op een biertafel van 220 cm (tafel niet inbegrepen)'),
                 img(f'hoes-biertafelset-alleen-bank-{slug(k)}.webp', 'variant', 3, 'buffetCover', {'kind': 'bierbank', 'length': 2.2, 'width': 0.25, 'height': 0.47,
                                                                                                     'color': render_color(k)},
                     'hero', k, 'existing', alt=f'één bankhoes in {k.lower()} op een bierbank van 220 × 25 cm (bank niet inbegrepen)')]
    simple('hoes-biertafelset', 'Hoes biertafelset, biertafel of bierbank', 'Tafelhoes', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:evenement'],
           [opt('Maat', BTM), opt('Uitvoering', BTU), opt('Kleur', BK)], vs, imgs,
           {'kenmerk_kort': 'Stretch voor tafel + 2 banken, of los per tafel of bank · 220 cm', 'staffelkorting': ST_TEXTIEL, 'past_op': ['biertafelset', 'bierbank-220'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.biertafelset-hoezen'], 'textiel', 'Biertafelset feestklaar in één keer: 3 hoezen, ook buiten; of één hoes voor een losse tafel of bank.',
           ['hoes biertafelset', 'biertafel hoes', 'hoes bierbank'], {'note': 'geen referentieprijs voor effen biertafelsethoezen', 'ours': {f'{m} {u}': p for m, u, p, g, c in BT}}, vmap=vmap,
           extra={'variant_image_sku': {**{f'KK-THOES-BT-{code(m)}-T-{COLOR_CODE[k]}': f'hoes-biertafelset-alleen-tafel-{slug(k)}.webp' for m in BTM[:2] for k in BK},
                                        **{f'KK-THOES-BT-220X25-{COLOR_CODE[k]}': f'hoes-biertafelset-alleen-bank-{slug(k)}.webp' for k in BK}}})
    # stretchhoes for the vierkante and rechthoekige statafel (merchandising review 2026-10-18: those two had no textile at all). Strak tot
    # de grond with a voetzak per poot, like the klaptafelhoes (buffetCover model, cover only, no table). Prices: owner review.
    SQ = {'60 x 60 cm': (29.95, 0.6, 0.6, 1.07), '70 x 70 cm': (32.95, 0.7, 0.7, 1.07), '80 x 80 cm': (34.95, 0.8, 0.8, 1.07),
          '120 x 60 cm': (44.95, 1.2, 0.6, 1.1), '120 x 70 cm': (46.95, 1.2, 0.7, 1.1), '160 x 60 cm': (52.95, 1.6, 0.6, 1.1)}
    vs = [variant(f'KK-HOES-STV-{code(m)}-{COLOR_CODE[k]}', [m, k], v[0], 450 + int(400 * v[1] * v[2]), inv(10, m + k + 'stv', k)) for m, v in SQ.items() for k in BK]
    imgs, vmap = kleur_images('stretchhoes-statafel-vierkant-en-rechthoekig', BK, 'buffetCover',
                              lambda k: {'kind': 'klaptafel', 'length': 0.7, 'width': 0.7, 'height': 1.07, 'color': render_color(k)}, 'Zwart',
                              [img('stretchhoes-statafel-vierkant-en-rechthoekig-zwart-160x60.webp', 'variant', 3, 'buffetCover',
                                   {'kind': 'klaptafel', 'length': 1.6, 'width': 0.6, 'height': 1.1, 'color': 'zwart'}, 'hero', 'Zwart', 'existing',
                                   alt='zwart om een rechthoekige statafel van 160 × 60 cm (tafel niet inbegrepen)')], status='existing', p2=3)
    simple('stretchhoes-statafel-vierkant-en-rechthoekig', 'Stretchhoes vierkante en rechthoekige statafel', 'Statafelrok', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Maat', list(SQ)), opt('Kleur', BK)], vs, imgs,
           {'kenmerk_kort': 'Strak tot de grond · 60 × 60 tot 160 × 60 cm · voetzak per poot', 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket',
            'past_op': ['statafel-vierkant-stapelbaar', 'statafel-rechthoekig-inklapbaar'],
            'specificaties': [sp('Stof', 'Materiaal', '90% polyester, 10% elastaan, 220 g/m²'), sp('Pasvorm', 'Vierkant', '60 x 60, 70 x 70 of 80 x 80 cm, 107 cm hoog'),
                              sp('Pasvorm', 'Rechthoekig', '120 x 60, 120 x 70 of 160 x 60 cm, 110 cm hoog'), sp('Pasvorm', 'Model', 'Strak over blad en poten, voetzak per poot')]},
           ['statafelrokken-hoezen.statafelrok-stretch'], 'textiel',
           'Stretchhoes voor de vierkante (stapelbare) en de rechthoekige statafel: maat = blad, strak tot de grond met voetzakken; wit, zwart of antraciet; staffel vanaf 10.',
           ['hoes vierkante statafel', 'stretchhoes statafel vierkant', 'hoes rechthoekige statafel'], {'note': 'geen referentieprijs gevonden; € 29,95 – € 52,95 naar oppervlak', 'ours': {m: v[0] for m, v in SQ.items()}},
           vmap=vmap)
    # round plates 2 cm under the blad; square and rectangular plates in the size of the vierkante / rechthoekige statafel and the terrastafel
    BP = {'Ø68 cm': 15.95, 'Ø78 cm': 16.95, 'Ø83 cm': 17.95, '60 x 60 cm': 16.95, '70 x 70 cm': 18.95, '80 x 80 cm': 19.95,
          '120 x 60 cm': 22.95, '120 x 70 cm': 23.95, '160 x 60 cm': 25.95, '182 x 75 cm': 26.95}
    simple('beschermplaat-statafel', 'Beschermplaat transparant voor statafel', 'Beschermplaat', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(BP))],
           [variant(f'KK-BPL-{code(m)}', [m], p, 900 + 300 * i, inv(20, m + 'bp')) for i, (m, p) in enumerate(BP.items())],
           [img('beschermplaat-statafel-hero.webp', 'hero', 1, 'protectionDisc', {'diameter': 0.78, 'onCover': {'type': 'stretch', 'color': 'zwart'}}, 'hero', 'Transparant', 'needs-model',
                alt='op een statafel met zwarte stretchrok (tafel en rok niet inbegrepen)')],
           {'kenmerk_kort': 'Transparant PVC over hoes en topcover · tegen vlekken', 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket',
            'past_op': ROUND + ['statafel-vierkant-stapelbaar', 'statafel-rechthoekig-inklapbaar', 'statafel-wijnvat-houtlook', 'terrastafel-inklapbaar', 'klaptafel-hdpe-rechthoekig']},
           ['statafelrokken-hoezen.beschermplaten'], 'textiel', 'Glasheldere plaat die de rok schoon houdt (bier, wijn); maat iets kleiner dan het blad.',
           ['beschermplaat statafel', 'transparante plaat statafel'], {'statafelshop': 'Ø68/78/83 vanaf €18,09 · 182x75 €30,19', 'ours': BP})

    # ------------------------------------------------------------ bedrukt textiel
    LK = ['Wit', 'Zwart', 'Antraciet', 'Marineblauw', 'Rood', 'Blauw']
    LU = ['Logo op 1 kant', 'Logo op 2 kanten', 'Full colour rondom']
    LP = {'Logo op 1 kant': 109.0, 'Logo op 2 kanten': 129.0, 'Full colour rondom': 139.0}
    vs = []
    for m in RM:
        for u in LU:
            for k in (['Wit'] if u == 'Full colour rondom' else LK):
                vs.append(variant(f'KK-BDR-ROK-{code(m)}-{["L1", "L2", "FC"][LU.index(u)]}-{COLOR_CODE[k]}', [m, u, k], LP[u], 700, None, tracked=False))
    def pr(k):
        return {'type': 'stretch', 'color': render_color(k), 'diameter': 0.8, 'topcover': render_color(k),
                'print': {'svg': 'brand/tools/print-mark.json', 'color': '#FBF6EC' if k != 'Wit' else '#C83812', 'width': 0.15, 'y': 0.27, 'azimuth': 'panel-mid'}}
    imgs, vmap = kleur_images('statafelhoes-stretch-met-logo', LK, 'statafelCover', pr, 'Zwart', status='existing', p2=3)
    imgs[0]['alt_hint'] = 'met voorbeeldopdruk Klapklaar op het vlakke deel van de rok'
    simple('statafelhoes-stretch-met-logo', 'Statafelhoes stretch met jouw logo', 'Statafelrok', ['bedrukbaar', 'zakelijk', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Maat', RM), opt('Uitvoering', LU), opt('Kleur', LK)], vs, imgs,
           {'kenmerk_kort': 'Jouw logo op de rok · drukproef vooraf · vanaf 1 stuk', 'bedrukbaar': True,
            'drukopties': {'posities': ['Voorkant', 'Voor- en achterkant', 'Rondom'], 'aanlevering': AANLEVERING, 'levertijd': LT_DRUK, 'min_aantal': 1},
            'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'past_op': ROUND, 'verzending': 'pakket'},
           ['statafelrokken-hoezen.bedrukte-hoezen'], 'bedrukt-textiel',
           'Logo uploaden bij bestellen (beter dan mailen achteraf), drukproef, staffel tot 25%; logo op het vlakke deel tussen de voeten (brand.md §8.4).',
           ['statafelhoes bedrukken', 'statafelrok met logo', 'bedrukte statafelhoes'],
           {'statafelshop': '€119,79 incl. (€99 excl.)', 'band': '€88–€125 excl. per stuk', 'ours': LP}, vmap=vmap)
    BPP = {'Ø68 cm': 69.95, 'Ø78 cm': 69.95, 'Ø83 cm': 74.95}
    simple('beschermplaat-met-opdruk', 'Beschermplaat met jouw opdruk', 'Beschermplaat', ['bedrukbaar', 'zakelijk', 'gebruik:horeca'], [opt('Maat', list(BPP))],
           [variant(f'KK-BDR-BPL-{code(m)}', [m], p, 1000, None, tracked=False) for m, p in BPP.items()],
           [img('beschermplaat-met-opdruk-hero.webp', 'hero', 1, 'protectionDisc', {'diameter': 0.78, 'print': {'svg': 'brand/tools/print-mark.json', 'color': '#C83812'}, 'onCover': {'type': 'stretch', 'color': 'wit'}},
                'hero', None, 'needs-model', alt='met voorbeeldopdruk, op een statafel met witte rok (tafel en rok niet inbegrepen)')],
           {'kenmerk_kort': 'Full colour onder transparant PVC · Ø 68, 78 of 83 cm', 'bedrukbaar': True,
            'drukopties': {'posities': ['Bovenkant (rond)'], 'aanlevering': AANLEVERING, 'levertijd': LT_DRUK, 'min_aantal': 1},
            'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'past_op': ROUND, 'verzending': 'pakket'},
           ['statafelrokken-hoezen.bedrukte-hoezen'], 'bedrukt-textiel', 'Je logo bovenop de statafel, waar je gasten hun glas zetten; afwasbaar.',
           ['beschermplaat bedrukt', 'statafel logo bovenop'], {'statafelshop': 'vanaf €75,63', 'ours': BPP})
    BB = [('183 x 76 cm', 'Logo op de voorkant', 149.0), ('183 x 76 cm', 'Full colour rondom', 189.0), ('244 x 76 cm', 'Logo op de voorkant', 169.0), ('244 x 76 cm', 'Full colour rondom', 219.0)]
    simple('stretchhoes-klaptafel-met-logo', 'Stretchhoes klaptafel met jouw logo', 'Tafelhoes', ['bedrukbaar', 'zakelijk', 'gebruik:evenement'],
           [opt('Maat', ['183 x 76 cm', '244 x 76 cm']), opt('Uitvoering', ['Logo op de voorkant', 'Full colour rondom'])],
           [variant(f'KK-BDR-THOES-{code(m)}-{"L" if "Logo" in u else "FC"}', [m, u], p, 1100, None, tracked=False) for m, u, p in BB],
           [img('stretchhoes-klaptafel-met-logo-hero.webp', 'hero', 1, 'buffetCover', {'length': 1.83, 'width': 0.76, 'color': 'zwart', 'print': {'svg': 'brand/tools/print-wordmark.json', 'color': '#FBF6EC', 'side': 'front'}},
                'hero', None, 'existing', alt='met voorbeeldopdruk op de voorkant')],
           {'kenmerk_kort': 'Beursbalie in een handomdraai · logo of full colour', 'bedrukbaar': True,
            'drukopties': {'posities': ['Voorkant', 'Rondom'], 'aanlevering': AANLEVERING, 'levertijd': LT_DRUK, 'min_aantal': 1},
            'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'past_op': ['klaptafel-hdpe-rechthoekig'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.bedrukte-hoezen', 'statafelrokken-hoezen.buffettafel-hoezen'], 'bedrukt-textiel',
           'Klaptafel wordt beursbalie of registratietafel met je logo; sjabloon per maat.', ['bedrukte tafelhoes', 'beurs tafelhoes logo'],
           {'band': 'bedrukte buffet stretchhoes €149–€204', 'ours': {f'{m} {u}': p for m, u, p in BB}})
