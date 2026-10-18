# Statafels en statafeltextiel (rokken, hoezen, kleden, topcovers, beschermplaten, bedrukt).
from kk_base import *
from fam_acc import simple

ROUND = ['statafel-inklapbaar-professional', 'statafel-inklapbaar-hdpe-80', 'statafel-met-kruisvoet']

def top_param(k):
    return {'Wit': 'wit', 'Zwart': 'zwart', 'Berken': 'berken', 'Antraciet': 'antraciet', 'Lichtgrijs': 'hdpe-grijs', 'Houtlook': 'houtlook', 'Graniet': 'graniet',
            'Leisteen': 'leisteen', 'Eiken': 'eiken', 'Vintage hout': 'vintage-hout', 'Wit gespikkeld': 'wit-gespikkeld',
            # compact-HPL decors (catalog round 3): new textures for renders/js/materials.js (needs-param)
            'Betonlook': 'beton', 'Wit marmer': 'marmer-wit', 'Zwart marmer': 'marmer-zwart', 'Grijs eiken': 'eiken-grijs', 'Teak': 'teak'}[k]


# Catalog round 3 (H3 for the square, wide and terrace tables): one decor set for the hoekige statafels and terrastafels. Binnen: HPL on
# 18 mm plaat in 7 decors; buiten: 12 mm compact HPL, weather- and UV-proof, in 12 decors (the reference lines run ca. 12 compact decors).
# 'Houtlook' is gone: the same oak look is 'Eiken' everywhere now (one Kleur filter value).
HOEK_BINNEN = ['Wit', 'Zwart', 'Antraciet', 'Graniet', 'Leisteen', 'Eiken', 'Vintage hout']
HOEK_BUITEN = ['Wit', 'Zwart', 'Antraciet', 'Graniet', 'Leisteen', 'Betonlook', 'Wit marmer', 'Zwart marmer', 'Eiken', 'Grijs eiken', 'Teak', 'Vintage hout']
HOEK_DECORS = HOEK_BINNEN + [k for k in HOEK_BUITEN if k not in HOEK_BINNEN]
HOEK_DECOR_EXTRA = {'Graniet': 10, 'Leisteen': 10, 'Betonlook': 10, 'Eiken': 10, 'Grijs eiken': 10, 'Teak': 10, 'Vintage hout': 10,
                    'Wit marmer': 15, 'Zwart marmer': 15}


def hoek_combos(uitv):
    for k in HOEK_DECORS:
        for u in uitv:
            if (u.startswith('Buiten') and k in HOEK_BUITEN) or (u.startswith('Binnen') and k in HOEK_BINNEN):
                yield k, u


def hoek_sku(u):
    return ('-HPL' if u.startswith('Buiten') else '') + ('-RVS' if 'RVS' in u else '') + ('-OW' if 'wit onderstel' in u else '')


# table-top finishes (H3, catalog round 2026-10-18): HPL decors on 18 mm plaat for binnen; compact HPL (buiten) only in the plain and stone
# decors the supplier presses in 12 mm compact; surcharge per decor. Frame colours: zwart (standard), wit (the event look with a wit blad),
# chroom (binnen). Our own decor names (brand.md: the name of the finish, never a brand colour).
STF_TOPS = ['Wit', 'Zwart', 'Antraciet', 'Graniet', 'Berken', 'Leisteen', 'Eiken', 'Vintage hout', 'Wit gespikkeld']
STF_TOP_EXTRA = {'Berken': 15, 'Graniet': 10, 'Leisteen': 10, 'Eiken': 15, 'Vintage hout': 15, 'Wit gespikkeld': 10}
STF_BUITEN = ['Wit', 'Zwart', 'Antraciet', 'Graniet', 'Leisteen']
STF_UITV = ['Binnen, zwart onderstel', 'Binnen, wit onderstel', 'Binnen, chroom onderstel', 'Binnen, zwart onderstel, met parasolgat',
            'Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel', 'Buiten (compact HPL), zwart onderstel, met parasolgat']


def stf_combos(tops=STF_TOPS, uitv=STF_UITV):
    for k in tops:
        for u in uitv:
            if u.startswith('Buiten') and k not in STF_BUITEN:
                continue
            yield k, u


def stf_extra(k, u):
    return STF_TOP_EXTRA.get(k, 0) + (25 if u.startswith('Buiten') else 0) + (10 if 'parasolgat' in u else 0) + (15 if 'chroom' in u else 0)


def stf_sku_suffix(u):
    return ('-HPL' if u.startswith('Buiten') else '') + ('-PG' if 'parasolgat' in u else '') + ('-OW' if 'wit onderstel' in u else '') + ('-OC' if 'chroom' in u else '')


def frame_of(u):
    return 'wit' if 'wit onderstel' in u else ('chroom' if 'chroom' in u else 'zwart')


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
    SPK = STF_TOPS
    # Binnen: HPL-toplaag op 18 mm plaat · Buiten: massief compact HPL 12 mm (weer- en UV-bestendig, + € 25) · parasolgat: holle kolom
    # + gat in het blad (+ € 10) · decor-toeslag (STF_TOP_EXTRA) · onderstel zwart, wit of chroom (+ € 15, binnen)
    SPU = STF_UITV
    vs = [variant(f'KK-STF-PRO-{code(m)}-{COLOR_CODE[k]}' + stf_sku_suffix(u), [m, k, u], p + stf_extra(k, u),
                  kg * 1000 + (500 if 'parasolgat' in u else 0) + (1500 if u.startswith('Buiten') else 0),
                  inv(30, m + k + u, k, (1.3 if m == 'Ø80 cm' else 0.7) * (1 if u == SPU[0] else 0.25)))
          for m, (p, kg) in SP.items() for k, u in stf_combos()]
    imgs, vmap = kleur_images('statafel-inklapbaar-professional', SPK, 'statafel', lambda k: {'diameter': 0.8, 'height': 1.1, 'top': top_param(k), 'frame': 'zwart', 'base': 'klap'}, 'Wit',
                              [img('statafel-inklapbaar-professional-wit-ingeklapt.webp', 'detail', 2, 'statafel', {'diameter': 0.8, 'top': 'wit', 'frame': 'zwart', 'base': 'klap', 'folded': True}, 'hero', 'Wit',
                                   alt='ingeklapt'),
                               img('statafel-inklapbaar-professional-wit-detail.webp', 'detail', 3, 'statafel', {'diameter': 0.8, 'top': 'wit', 'frame': 'zwart', 'base': 'klap'}, 'detail', 'Wit',
                                   alt='bladrand met kantenband'),
                               img('statafel-inklapbaar-professional-met-rok.webp', 'in-gebruik', 3, 'statafelCover', {'type': 'stretch', 'color': 'zwart', 'diameter': 0.8, 'topcover': 'zwart'}, 'hero', None, 'existing',
                                   alt='met statafelrok stretch zwart (rok niet inbegrepen)'),
                               img('statafel-inklapbaar-professional-wit-parasolgat.webp', 'detail', 3, 'statafel', {'diameter': 0.8, 'top': 'wit', 'frame': 'zwart', 'base': 'klap', 'parasolHole': 0.04}, 'detail', 'Wit', 'needs-param',
                                   alt='uitvoering met parasolgat en afdekdop'),
                               img('statafel-inklapbaar-professional-wit-wit-onderstel.webp', 'variant', 2, 'statafel', {'diameter': 0.8, 'height': 1.1, 'top': 'wit', 'frame': 'wit', 'base': 'klap'}, 'hero', 'Wit',
                                   'needs-param', alt='wit blad op een wit onderstel'),
                               img('statafel-inklapbaar-professional-wit-chroom-onderstel.webp', 'variant', 3, 'statafel', {'diameter': 0.8, 'height': 1.1, 'top': 'wit', 'frame': 'chroom', 'base': 'klap'}, 'hero', 'Wit',
                                   'needs-param', alt='wit blad op een verchroomd onderstel')],
                              status='existing', p2=2)
    for _i in imgs:
        if _i['kleur'] in ('Leisteen', 'Eiken', 'Vintage hout', 'Wit gespikkeld') and _i['role'] == 'variant':
            _i['model_status'] = 'needs-param'   # new decor textures for renders/js/materials.js
    simple('statafel-inklapbaar-professional', 'Statafel inklapbaar Professional', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement', 'gebruik:tuinfeest'],
           [opt('Maat', list(SP)), opt('Kleur', SPK), opt('Uitvoering', SPU)], vs, imgs,
           {'kenmerk_kort': '110 cm hoog · 9 bladdecors · onderstel zwart, wit of chroom',
            'specificaties': [sp('Blad', 'Diameter', 'Ø70, Ø80 of Ø85 cm'), sp('Blad', 'Materiaal', 'HPL-toplaag op 18 mm plaat, kantenband rondom (Berken: 18 mm berken multiplex, gelakt)'),
                              sp('Blad', 'Eigenschappen', 'Krasvast, hittebestendig tot ca. 180 °C, binnen en buiten'),
                              sp('Onderstel', 'Materiaal', 'Staal, zwart epoxy-gepoedercoat, kolom Ø 32 mm, 4 inklapbare poten'),
                              sp('Afmetingen', 'Hoogte', '110 cm'), sp('Afmetingen', 'Ingeklapt', 'ca. 140 x 80 x 15 cm (Ø80)'), sp('Gewicht', 'Totaal', '12–14 kg'),
                              sp('Uitvoering', 'Met parasolgat', 'Gat Ø 40 mm midden in het blad met afdekdop, holle kolom Ø 45 mm, voor parasolstokken tot Ø 38 mm'),
                              sp('Onderstel', 'Kleuren', 'Zwart of wit epoxy-gepoedercoat, of verchroomd (binnen)')],
            'staffelkorting': ST_STATAFEL, 'addons': ['statafelrok-stretch', 'beschermplaat-statafel'], 'verzending': 'pakket', 'vergelijk_groep': 'statafel',
            'gewicht_kg': 13, 'verpakt': '142 x 82 x 16 cm (Ø80)', 'garantie': '2 jaar', 'addon_eenmalig': ['transportkar-statafels']},
           ['tafels-stoelen.statafels'], 'statafel',
           'Dé statafel voor horeca, verhuur en feest: maatkeuze (Ø70 = 4–5 staand, Ø80 = 6), bladkeuze, inklapbaar in één beweging, hoe hoog 110 cm is t.o.v. barkrukken.',
           ['statafel inklapbaar', 'statafel 80 cm', 'statafel kopen'],
           {'statafelshop': 'Savannah vanaf €102,79 · Oregon Ø80 €96,74 · Colorado Ø85 graniet buiten €104 · Sacramento antraciet/pizarra/punti binnen en buiten vanaf €102,79 · Columbus €108,84',
            'band': 'horeca mid €97–€109; DIY €46–€80',
            'outmate': 'statafels met 8 bladdecors (spikkel, leisteen, vintage hout, hout, geborsteld metaal, compact HPL) en onderstel wit, chroom, hamerslag, beige of lichtgrijs',
            'ours': {m: v[0] for m, v in SP.items()}, 'opties': '+ € 25 buiten (compact HPL) · + € 10 graniet, leisteen, wit gespikkeld · + € 15 berken, eiken, vintage hout · + € 10 parasolgat · + € 15 chroom onderstel'},
           vmap=vmap, extra={'variant_image_sku': {**{f'KK-STF-PRO-{code(m)}-WIT{stf_sku_suffix(u)}': 'statafel-inklapbaar-professional-wit-wit-onderstel.webp'
                                                      for m in SP for u in STF_UITV if 'wit onderstel' in u},
                                                   **{f'KK-STF-PRO-{code(m)}-WIT-OC': 'statafel-inklapbaar-professional-wit-chroom-onderstel.webp' for m in SP}}})
    # catalog round 2026-10-18 (H9): the entry statafel at € 42,95 (it set the 'vanaf' price above both shops' entry tables, € 45 / zwart
    # € 49 / 2-pack € 74), a Zwart blad (+ € 4) and packs of 2 and 4 (the reference sells a 2-pack)
    HK = ['Wit', 'Lichtgrijs', 'Zwart']
    HDPE_PACK = {'1 stuk': (42.95, 1), 'Set van 2': (69.95, 2), 'Set van 4': (129.0, 4)}
    vs = [variant(f'KK-STF-HDPE-D80-{COLOR_CODE[k]}' + ('' if n == 1 else f'-S{n}'), ['Ø80 cm', k, u], p + (4 * n if k == 'Zwart' else 0), 9000 * n, inv(40, 'hdpe' + k + u, k))
          for k in HK for u, (p, n) in HDPE_PACK.items()]
    imgs, vmap = kleur_images('statafel-inklapbaar-hdpe-80', HK, 'statafel', lambda k: {'diameter': 0.8, 'height': 1.1, 'top': {'Wit': 'hdpe', 'Lichtgrijs': 'hdpe-grijs', 'Zwart': 'hdpe-zwart'}[k],
                                                                                        'frame': 'zwart', 'base': 'klap'}, 'Wit',
                              [img('statafel-inklapbaar-hdpe-80-wit-ingeklapt.webp', 'detail', 3, 'statafel', {'diameter': 0.8, 'top': 'hdpe', 'frame': 'zwart', 'base': 'klap', 'folded': True}, 'hero', 'Wit')])
    for _i in imgs:
        if _i['kleur'] == 'Zwart':
            _i['model_status'] = 'needs-param'
    simple('statafel-inklapbaar-hdpe-80', 'Statafel inklapbaar HDPE Ø80 cm', 'Statafel', ['zakelijk', 'gebruik:tuinfeest', 'gebruik:evenement'],
           [opt('Maat', ['Ø80 cm']), opt('Kleur', HK), opt('Uitvoering', list(HDPE_PACK))], vs, imgs,
           {'kenmerk_kort': '110 cm hoog · 45 mm HDPE-blad · 9 kg', 'staffelkorting': ST_STATAFEL, 'addons': ['statafelrok-stretch'], 'verzending': 'pakket',
            'addon_eenmalig': ['transportkar-statafels'],
            'specificaties': [sp('Blad', 'Materiaal', 'HDPE blow-mould 45 mm, wit of lichtgrijs, binnen en buiten'), sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, inklapbaar'),
                              sp('Afmetingen', 'Hoogte', '110 cm'), sp('Gewicht', 'Totaal', '9 kg')],
            'vergelijk_groep': 'statafel', 'gewicht_kg': 9, 'verpakt': '112 x 82 x 12 cm', 'garantie': '2 jaar'},
           ['tafels-stoelen.statafels'], 'statafel', 'Lichte, onderhoudsarme statafel voor thuis en de club; eerlijk vergelijken met Professional (lichter, minder chic blad).',
           ['statafel goedkoop', 'statafel kunststof', 'statafels 2 stuks'], {'band': 'DIY €46–€80 (Gamma HDPE €57,99)', 'statafelshop': 'New York €45 · zwart €49 · 2 stuks €74',
                                                                             'ours': {u: v[0] for u, v in HDPE_PACK.items()}}, vmap=vmap)
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
    VQK = HOEK_DECORS
    # catalog round 3: binnen (HPL, zwart or geborsteld RVS onderstel, RVS + € 30) and buiten (compact HPL 12 mm, zwart or wit onderstel,
    # + € 55): the reference compact lines are Statafelshop Indus / Kansas / Mississippi (€ 149-381)
    VQU = ['Binnen, zwart onderstel', 'Binnen, RVS onderstel', 'Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel']
    VQG = {'60 x 60 cm': 15000, '70 x 70 cm': 16000, '80 x 80 cm': 19000}
    vs = [variant(f'KK-STF-VK-{code(m)}-{COLOR_CODE[k]}' + hoek_sku(u), [m, k, u],
                  p + HOEK_DECOR_EXTRA.get(k, 0) + (30 if 'RVS' in u else 0) + (55 if u.startswith('Buiten') else 0),
                  VQG[m] + (3000 if u.startswith('Buiten') else 0), inv(10, m + k + 'vk' + u, k)) for m, p in VQ.items() for k, u in hoek_combos(VQU)]
    imgs, vmap = kleur_images('statafel-vierkant-stapelbaar', VQK, 'statafel', lambda k: {'shape': 'square', 'width': 0.7, 'height': 1.07, 'top': top_param(k), 'frame': 'zwart', 'base': 'kruis', 'stackable': True}, 'Zwart',
                              [img('statafel-vierkant-stapelbaar-wit-wit-onderstel.webp', 'variant', 3, 'statafel',
                                   {'shape': 'square', 'width': 0.7, 'height': 1.07, 'top': 'wit', 'frame': 'wit', 'base': 'kruis', 'stackable': True}, 'hero', 'Wit', 'needs-param',
                                   alt='wit compact-HPL-blad op een wit onderstel')],
                              status='existing', p2=3)
    for _i in imgs:
        if _i['kleur'] not in ('Zwart', 'Wit') and _i['role'] == 'variant':
            _i['model_status'] = 'needs-param'   # decor textures (renders/js/materials.js)
    simple('statafel-vierkant-stapelbaar', 'Statafel vierkant stapelbaar', 'Statafel', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(VQ)), opt('Kleur', VQK), opt('Uitvoering', VQU)], vs, imgs,
           {'kenmerk_kort': 'Vierkant blad · stapelbaar · 107 cm · binnen of compact HPL buiten', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket', 'vergelijk_groep': 'statafel', 'gewicht_kg': 16,
            'addon_eenmalig': ['transportkar-statafels'],   # the plateaukar for 5 stacked tables: once per order line
            'specificaties': [sp('Afmetingen', 'Hoogte', '107 cm'), sp('Onderstel', 'Materiaal', 'Staal zwart of wit gepoedercoat, of geborsteld RVS (binnen), stapelbaar'),
                              sp('Blad', 'Binnen', 'HPL-toplaag op 18 mm plaat, 7 decors'), sp('Blad', 'Buiten', 'Compact HPL 12 mm, door en door, 12 decors')], 'garantie': '2 jaar'},
           ['tafels-stoelen.statafels'], 'statafel', 'Strakke vierkante statafel die je stapelt in plaats van inklapt; populair in horeca en lounges.',
           ['statafel vierkant', 'statafel stapelbaar', 'statafel rvs', 'statafel compact hpl'], {'statafelshop': 'Indus €148,77–314,60 (13 decors) · Kansas RVS of zwart frame €163,29–204,43 · Mississippi €217,74–381,15', 'outmate': '70x70 €159–€169', 'ours': VQ, 'opties': '+ € 30 RVS · + € 55 compact HPL buiten · + € 10 / € 15 decor'},
           vmap=vmap, extra={'variant_image_sku': {f'KK-STF-VK-{code(m)}-WIT-HPL-OW': 'statafel-vierkant-stapelbaar-wit-wit-onderstel.webp' for m in VQ}})
    # catalog round 3: 6 decors (was Berken and Zwart only) and a 180 x 70 cm for a bar of 10-12 people staand
    RH = {'120 x 60 cm': 169.0, '120 x 70 cm': 179.0, '160 x 60 cm': 189.0, '180 x 70 cm': 229.0}
    RHK = ['Berken', 'Zwart', 'Wit', 'Antraciet', 'Eiken', 'Graniet']
    RHG = {'120 x 60 cm': 21000, '120 x 70 cm': 23000, '160 x 60 cm': 25000, '180 x 70 cm': 30000}
    vs = [variant(f'KK-STF-RH-{code(m)}-{COLOR_CODE[k]}', [m, k], p + {'Berken': 0, 'Eiken': 10, 'Graniet': 10}.get(k, 0), RHG[m], inv(6, m + k + 'rh', k))
          for m, p in RH.items() for k in RHK]
    imgs, vmap = kleur_images('statafel-rechthoekig-inklapbaar', RHK, 'statafel', lambda k: {'shape': 'rect', 'width': 1.6, 'depth': 0.6, 'height': 1.1, 'top': top_param(k), 'frame': 'zwart', 'base': 'klap'}, 'Berken',
                              status='existing', p2=3)
    for _i in imgs:
        if _i['kleur'] not in ('Berken', 'Zwart'):
            _i['model_status'] = 'needs-param'
    simple('statafel-rechthoekig-inklapbaar', 'Statafel rechthoekig inklapbaar', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'], [opt('Maat', list(RH)), opt('Kleur', RHK)], vs, imgs,
           {'kenmerk_kort': 'Lang blad voor 8–12 personen staand · 110 cm · inklapbaar · 6 decors', 'staffelkorting': ST_STATAFEL, 'verzending': 'pallet', 'vergelijk_groep': 'statafel', 'garantie': '2 jaar'},
           ['tafels-stoelen.statafels'], 'statafel', 'Lange statafel als bar of buffet op stahoogte; inklapbaar voor opslag.',
           ['statafel rechthoekig', 'lange statafel', 'statafel 180 x 70'], {'statafelshop': 'Indus Breed €252,89 · Purus 160x60 €204,49', 'outmate': 'Times Square 180x70 stapelbaar €435 (zie statafel-breed-stapelbaar)', 'ours': RH}, vmap=vmap)
    # catalog round 3: a Ø100 cm vat next to the Ø80 (the reference barrel is Ø100 at € 399)
    WV = {'Ø80 cm': (349.0, 25000), 'Ø100 cm': (359.0, 32000)}
    simple('statafel-wijnvat-houtlook', 'Statafel wijnvat houtlook', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'], [opt('Maat', list(WV))],
           [variant(f'KK-STF-VAT-{code(m)}', [m], p, g, 6) for m, (p, g) in WV.items()],
           [img('statafel-wijnvat-houtlook-hero.webp', 'hero', 1, 'barrelTable', {'top': 0.8, 'height': 1.05, 'finish': 'houtlook'}, 'hero', None, 'needs-model'),
            img('statafel-wijnvat-houtlook-d100.webp', 'variant', 2, 'barrelTable', {'top': 1.0, 'height': 1.05, 'finish': 'houtlook'}, 'hero', None, 'needs-param',
                alt='Ø100 cm, met breder blad')],
           {'kenmerk_kort': 'Kunststof vat in houtlook · Ø80 of Ø100 cm blad · vulbaar met water of zand', 'verzending': 'pallet', 'gewicht_kg': 25, 'vergelijk_groep': 'statafel'},
           ['tafels-stoelen.statafels', 'tafels-stoelen.barrels-sets'], 'statafel', 'Sfeermaker voor terras en feest; vulbaar voor stabiliteit; weerbestendig.',
           ['wijnvat statafel', 'barrel statafel', 'wijnvat tafel 100 cm'], {'outmate': 'Barrel Ø100 €399', 'ours': {m: v[0] for m, v in WV.items()}},
           vmap={'Ø80 cm': 'statafel-wijnvat-houtlook-hero.webp', 'Ø100 cm': 'statafel-wijnvat-houtlook-d100.webp'}, vby='Maat')

    # ------------------------------------------------------------ catalog round 3: wide stackable statafel (180 x 70, H3) and design statafels (M14)
    BS = {'140 x 70 cm': (329.0, 26000), '180 x 70 cm': (389.0, 31000)}   # reference: Outmate Times Square 180 x 70 stapelbaar € 435
    BSU = ['Binnen, zwart onderstel', 'Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel']
    vs = [variant(f'KK-STF-BS-{code(m)}-{COLOR_CODE[k]}' + hoek_sku(u), [m, k, u],
                  p + 2 * HOEK_DECOR_EXTRA.get(k, 0) + ((90 if m.startswith('140') else 110) if u.startswith('Buiten') else 0),
                  g + (5000 if u.startswith('Buiten') else 0), inv(4, m + k + 'bs' + u, k)) for m, (p, g) in BS.items() for k, u in hoek_combos(BSU)]
    imgs, vmap = kleur_images('statafel-breed-stapelbaar', HOEK_DECORS, 'statafel',
                              lambda k: {'shape': 'rect', 'width': 1.8, 'depth': 0.7, 'height': 1.1, 'top': top_param(k), 'frame': 'zwart', 'base': 'vierpoot', 'stackable': True},
                              'Eiken', [img('statafel-breed-stapelbaar-gestapeld.webp', 'detail', 3, 'statafel',
                                            {'shape': 'rect', 'width': 1.8, 'depth': 0.7, 'height': 1.1, 'top': 'zwart', 'frame': 'zwart', 'base': 'vierpoot', 'stackable': True, 'stack': 3},
                                            'hero', 'Zwart', 'needs-param', alt='drie tafels gestapeld')], status='needs-param', p2=3)
    simple('statafel-breed-stapelbaar', 'Statafel breed stapelbaar', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Maat', list(BS)), opt('Kleur', HOEK_DECORS), opt('Uitvoering', BSU)], vs, imgs,
           {'kenmerk_kort': 'Breed blad 140 of 180 x 70 cm · 4 poten · stapelbaar · binnen of compact HPL buiten', 'staffelkorting': ST_STATAFEL, 'verzending': 'pallet',
            'vergelijk_groep': 'statafel', 'garantie': '2 jaar',
            'specificaties': [sp('Afmetingen', 'Hoogte', '110 cm'), sp('Afmetingen', 'Blad', '140 x 70 of 180 x 70 cm'),
                              sp('Onderstel', 'Materiaal', 'Stalen frame met 4 vierkante poten 40 x 40 mm, zwart of wit gepoedercoat, stapelbaar'),
                              sp('Blad', 'Binnen', 'HPL-toplaag op 25 mm plaat, 7 decors'), sp('Blad', 'Buiten', 'Compact HPL 12 mm, 12 decors')]},
           ['tafels-stoelen.statafels'], 'statafel',
           'Brede statafel als bar, buffet of sta-werkplek voor 8 tot 12 personen; 4 poten op de hoeken (geen kruisvoet in de weg), stapelbaar voor opslag; binnen of buiten in compact HPL.',
           ['statafel 180 x 70', 'brede statafel', 'statafel stapelbaar rechthoekig', 'bartafel 180 cm'],
           {'outmate': 'Times Square 180 x 70 stapelbaar €435', 'statafelshop': 'Indus Breed 120 x 60/70 €252,89', 'ours': {m: v[0] for m, v in BS.items()},
            'opties': '+ € 90 / € 110 compact HPL buiten · + € 20 / € 30 decor'}, vmap=vmap)

    # design statafel with a marmerlook blad on a slim inklapbare kolom (reference band: Statafelshop Havana € 240,79-337,59, Outmate Rivièra
    # € 239-335, Statafelshop Trentino € 272,19): hoogglans (binnen) or compact HPL (binnen en buiten), onderstel zwart or geborsteld goud
    DM = {('Hoogglans', 'zwart'): 219.0, ('Hoogglans', 'goud'): 269.0, ('Compact HPL', 'zwart'): 249.0, ('Compact HPL', 'goud'): 299.0}
    DMU = [f'{b}, {c} onderstel' if c == 'zwart' else f'{b}, geborsteld goud onderstel' for b, c in DM]
    DMK = ['Wit marmer', 'Zwart marmer']
    vs = [variant(f'KK-STF-DSM-D70-{COLOR_CODE[k]}-{"HG" if b == "Hoogglans" else "HPL"}-{"GD" if c == "goud" else "ZW"}', ['Ø70 cm', k, u], p, 15000 if b == 'Hoogglans' else 17000,
                  inv(4, k + u + 'dsm', k)) for k in DMK for ((b, c), p), u in zip(DM.items(), DMU)]
    imgs, vmap = kleur_images('statafel-design-marmerlook', DMK, 'statafel',
                              lambda k: {'diameter': 0.7, 'height': 1.1, 'top': top_param(k), 'frame': 'goud', 'base': 'design-klap'}, 'Wit marmer',
                              [img('statafel-design-marmerlook-zwart-marmer-zwart-onderstel.webp', 'variant', 3, 'statafel',
                                   {'diameter': 0.7, 'height': 1.1, 'top': 'marmer-zwart', 'frame': 'zwart', 'base': 'design-klap'}, 'hero', 'Zwart marmer', 'needs-param',
                                   alt='zwart marmerlook op een zwart onderstel'),
                               img('statafel-design-marmerlook-wit-marmer-detail.webp', 'detail', 3, 'statafel',
                                   {'diameter': 0.7, 'height': 1.1, 'top': 'marmer-wit', 'frame': 'goud', 'base': 'design-klap'}, 'detail', 'Wit marmer', 'needs-param',
                                   alt='bladrand en geborsteld gouden kolom')], status='needs-param', p2=2)
    simple('statafel-design-marmerlook', 'Design statafel marmerlook Ø70 cm', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Maat', ['Ø70 cm']), opt('Kleur', DMK), opt('Uitvoering', DMU)], vs, imgs,
           {'kenmerk_kort': 'Marmerlook blad · geborsteld goud of zwart onderstel · inklapbaar · 110 cm', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket',
            'vergelijk_groep': 'statafel', 'garantie': '2 jaar', 'gewicht_kg': 15, 'addon_eenmalig': ['transportkar-statafels'],
            'specificaties': [sp('Blad', 'Diameter', 'Ø70 cm'), sp('Blad', 'Hoogglans', 'MDF met hoogglans marmerdecor, 18 mm (binnen)'),
                              sp('Blad', 'Compact HPL', 'Compact HPL 12 mm met mat marmerdecor (binnen en buiten)'),
                              sp('Onderstel', 'Materiaal', 'Kolom Ø 60 mm met 4 inklapbare poten, staal zwart gepoedercoat of RVS met geborsteld goudkleurige coating'),
                              sp('Afmetingen', 'Hoogte', '110 cm'), sp('Gewicht', 'Totaal', 'ca. 15–17 kg')]},
           ['tafels-stoelen.statafels'], 'statafel',
           'Statafel voor recepties, beurzen en bruiloften waar het er chic uit moet zien zonder rok: marmerlook op een slanke kolom; hoogglans voor binnen, compact HPL ook voor buiten; vouwt in.',
           ['design statafel', 'statafel marmer', 'statafel goud onderstel', 'luxe statafel'],
           {'statafelshop': 'Havana €240,79–337,59 · Trentino €272,19', 'outmate': 'Rivièra €239–335', 'ours': {', '.join(k): v for k, v in DM.items()}}, vmap=vmap,
           extra={'variant_image_sku': {'KK-STF-DSM-D70-ZMR-HG-ZW': 'statafel-design-marmerlook-zwart-marmer-zwart-onderstel.webp',
                                        'KK-STF-DSM-D70-ZMR-HPL-ZW': 'statafel-design-marmerlook-zwart-marmer-zwart-onderstel.webp'}})

    # design statafel HPL on a zuil with a heavy voetplaat (reference: Outmate Infinity € 195 / Urban € 219, Statafelshop Trentino): compact HPL
    # blad, rond or vierkant, in 6 decors, onderstel zwart, wit or zandkleur; vaste zuil, not inklapbaar
    DZ = {'Ø70 cm': 179.0, '70 x 70 cm': 189.0}
    DZK = ['Wit marmer', 'Zwart marmer', 'Betonlook', 'Grijs eiken', 'Teak', 'Zwart']
    DZU = ['Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel', 'Buiten (compact HPL), zandkleur onderstel']
    vs = [variant(f'KK-STF-DSZ-{code(m)}-{COLOR_CODE[k]}-{["ZW", "WI", "ZK"][i]}', [m, k, u], p + (10 if k != 'Zwart' else 0), 18000, inv(4, m + k + u + 'dsz', k))
          for m, p in DZ.items() for k in DZK for i, u in enumerate(DZU)]
    imgs, vmap = kleur_images('statafel-design-zuilvoet', DZK, 'statafel',
                              lambda k: {'diameter': 0.7, 'height': 1.1, 'top': top_param(k), 'frame': 'zwart', 'base': 'zuil-plaat'}, 'Wit marmer',
                              [img('statafel-design-zuilvoet-vierkant-betonlook.webp', 'detail', 3, 'statafel',
                                   {'shape': 'square', 'width': 0.7, 'height': 1.1, 'top': 'beton', 'frame': 'zandkleur', 'base': 'zuil-plaat'}, 'hero', 'Betonlook', 'needs-param',
                                   alt='vierkant blad 70 x 70 cm in betonlook op een zandkleurig onderstel')], status='needs-param', p2=2)
    simple('statafel-design-zuilvoet', 'Design statafel HPL met zuilvoet', 'Statafel', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'],
           [opt('Maat', list(DZ)), opt('Kleur', DZK), opt('Uitvoering', DZU)], vs, imgs,
           {'kenmerk_kort': 'Compact HPL · rond of vierkant 70 cm · zware zuilvoet · binnen en buiten', 'staffelkorting': ST_STATAFEL, 'verzending': 'pakket',
            'vergelijk_groep': 'statafel', 'garantie': '2 jaar', 'gewicht_kg': 18,
            'specificaties': [sp('Blad', 'Materiaal', 'Compact HPL 12 mm, door en door, weer- en UV-bestendig'), sp('Blad', 'Maten', 'Ø70 cm of 70 x 70 cm'),
                              sp('Onderstel', 'Materiaal', 'Stalen zuil Ø 76 mm op een voetplaat van 45 x 45 cm, gepoedercoat zwart, wit of zandkleur'),
                              sp('Afmetingen', 'Hoogte', '109 cm'), sp('Gewicht', 'Totaal', 'ca. 18 kg'), sp('Onderstel', 'Stelvoeten', '4 verstelbare doppen onder de voetplaat')]},
           ['tafels-stoelen.statafels'], 'statafel',
           'Vaste statafel voor terras en lounge zonder kruis of poten in de weg: compact HPL in 6 decors op een zware voetplaat; blijft buiten staan; geen rok nodig.',
           ['statafel hpl', 'statafel zuilvoet', 'design statafel buiten', 'statafel marmerlook'],
           {'outmate': 'Infinity €195 · Urban €219 (HPL, rond of vierkant, onderstel wit/zandkleur/zwart)', 'ours': DZ}, vmap=vmap)

    # ------------------------------------------------------------ rokken & hoezen
    RM = ['Ø80-85 cm', 'Ø60-70 cm']
    RU = ['Met topcover', 'Zonder topcover']
    # M22 (catalog round 2026-10-18): Goud and Zilver are a metallic stretch, a premium tier (+ € 6; Statafelshop prices them + 74%)
    METAAL = {'Goud': 6, 'Zilver': 6}
    vs = [variant(f'KK-ROK-ST-{code(m)}-{"TC" if u == RU[0] else "ZT"}-{COLOR_CODE[k]}', [m, u, k], (19.95 if u == RU[0] else 15.95) + METAAL.get(k, 0), 650 if u == RU[0] else 520,
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
    # L3: € 7,95 was 40% under the reference (vanaf € 12,04): € 10,95, metallic + € 3
    vs = [variant(f'KK-TOP-ST-{code(m)}-{COLOR_CODE[k]}', [m, k], 10.95 + (3 if k in METAAL else 0), 120, inv(40, m + k + 'tc', k)) for m in RM for k in ROK_KLEUREN]
    # packshot: the topcover on a stretchrok in a contrasting colour (the alt says the rok is not included)
    imgs, vmap = kleur_images('topcover-stretch-statafel', ROK_KLEUREN, 'statafelCover',
                              lambda k: {'type': 'stretch', 'color': contrast_textile(k), 'diameter': 0.8, 'topcover': render_color(k)}, 'Zwart', status='existing', p2=3)
    simple('topcover-stretch-statafel', 'Topcover stretch voor statafel', 'Topcover', ['zakelijk', 'gebruik:horeca'], [opt('Maat', RM), opt('Kleur', ROK_KLEUREN)], vs, imgs,
           {'kenmerk_kort': 'Los blad-hoesje · contrastkleur of vervanging · 24 kleuren', 'staffelkorting': ST_TEXTIEL, 'past_op': ROUND + ['statafelrok-stretch'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.topcovers'], 'textiel', 'Losse topcover voor een tweede kleur of als reserve; zelfde 24 kleuren als de rok.',
           ['topcover statafel', 'topcover stretch'], {'statafelshop': 'vanaf €12,04', 'band': 'biertafelplaza €7,50 per stuk', 'ours': 10.95}, vmap=vmap)
    # L3: € 26,95 was 23% under the reference
    vs = [variant(f'KK-HOES-STR-{code(m)}-{COLOR_CODE[k]}', [m, k], 31.95, 900, inv(20 if m == RM[0] else 8, m + k + 'strik', k)) for m in RM for k in STRIK_KLEUREN]
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
    # bankhoes (for the loose bierbank); Maat = what it covers. Catalog round 2026-10-18 (M10): every bladmaat of the biertafelset (180 and
    # 220 cm, 50 to 80 cm; the 67 cm blad takes the 70 cm hoes) and both bank lengths, 10 colours, ca. 8% under the reference (€ 24,99 per set).
    # Set stays cheaper than tafel + 2 banken los.
    BTU = ['Set: tafel en 2 banken', 'Alleen tafel', 'Alleen bank']
    BK_HOES = ['Wit', 'Zwart', 'Antraciet', 'Crème', 'Zilver', 'Rood', 'Bordeaux', 'Blauw', 'Marineblauw', 'Groen']
    HOES_T = ['180 x 50 cm', '180 x 60 cm', '180 x 70 cm', '180 x 80 cm', '220 x 50 cm', '220 x 60 cm', '220 x 70 cm', '220 x 80 cm']
    BT = [(m, BTU[0], 22.95 if int(m.split(' x ')[1][:2]) <= 60 else 24.95, 1300 + 40 * int(m.split(' x ')[1][:2]) // 10, 'S') for m in HOES_T] + \
         [(m, BTU[1], 13.95 if int(m.split(' x ')[1][:2]) <= 60 else 14.95, 600 + 30 * int(m.split(' x ')[1][:2]) // 10, 'T') for m in HOES_T] + \
         [('180 x 25 cm', BTU[2], 6.95, 300, 'B'), ('220 x 25 cm', BTU[2], 6.95, 350, 'B')]
    BTM = HOES_T + ['180 x 25 cm', '220 x 25 cm']
    BK = BK_HOES
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
           {'kenmerk_kort': 'Stretch voor tafel + 2 banken, of los · 180 of 220 cm · 10 kleuren', 'staffelkorting': ST_TEXTIEL, 'past_op': ['biertafelset', 'bierbank-220'], 'verzending': 'pakket'},
           ['statafelrokken-hoezen.biertafelset-hoezen'], 'textiel', 'Biertafelset feestklaar in één keer: 3 hoezen, ook buiten; of één hoes voor een losse tafel of bank.',
           ['hoes biertafelset', 'biertafel hoes', 'hoes bierbank', 'hoezen biertafelset 180'], {'outmate': 'set van 3 hoezen €24,99 in 180 x 50/60/70/80 en 220 x 50/60/70/80', 'ours': {f'{m} {u}': p for m, u, p, g, c in BT}}, vmap=vmap,
           extra={'variant_image_sku': {**{f'KK-THOES-BT-{code(m)}-T-{COLOR_CODE[k]}': f'hoes-biertafelset-alleen-tafel-{slug(k)}.webp' for m in HOES_T for k in BK},
                                        **{f'KK-THOES-BT-{code(m)}-{COLOR_CODE[k]}': f'hoes-biertafelset-alleen-bank-{slug(k)}.webp' for m in ('180 x 25 cm', '220 x 25 cm') for k in BK}}})
    # stretchhoes for the vierkante and rechthoekige statafel (merchandising review 2026-10-18: those two had no textile at all). Strak tot
    # de grond with a voetzak per poot, like the klaptafelhoes (buffetCover model, cover only, no table). Prices: owner review.
    SQ = {'60 x 60 cm': (29.95, 0.6, 0.6, 1.07), '70 x 70 cm': (32.95, 0.7, 0.7, 1.07), '80 x 80 cm': (34.95, 0.8, 0.8, 1.07),
          '120 x 60 cm': (44.95, 1.2, 0.6, 1.1), '120 x 70 cm': (46.95, 1.2, 0.7, 1.1), '160 x 60 cm': (52.95, 1.6, 0.6, 1.1),
          # catalog round 3: the 140 and 180 x 70 cm of the brede statafel and the rechthoekige 180 x 70
          '140 x 70 cm': (49.95, 1.4, 0.7, 1.1), '180 x 70 cm': (56.95, 1.8, 0.7, 1.1)}
    vs = [variant(f'KK-HOES-STV-{code(m)}-{COLOR_CODE[k]}', [m, k], v[0], 450 + int(400 * v[1] * v[2]), inv(10, m + k + 'stv', k)) for m, v in SQ.items() for k in BK]
    imgs, vmap = kleur_images('stretchhoes-statafel-vierkant-en-rechthoekig', BK, 'buffetCover',
                              lambda k: {'kind': 'klaptafel', 'length': 0.7, 'width': 0.7, 'height': 1.07, 'color': render_color(k)}, 'Zwart',
                              [img('stretchhoes-statafel-vierkant-en-rechthoekig-zwart-160x60.webp', 'variant', 3, 'buffetCover',
                                   {'kind': 'klaptafel', 'length': 1.6, 'width': 0.6, 'height': 1.1, 'color': 'zwart'}, 'hero', 'Zwart', 'existing',
                                   alt='zwart om een rechthoekige statafel van 160 × 60 cm (tafel niet inbegrepen)')], status='existing', p2=3)
    simple('stretchhoes-statafel-vierkant-en-rechthoekig', 'Stretchhoes vierkante en rechthoekige statafel', 'Statafelrok', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Maat', list(SQ)), opt('Kleur', BK)], vs, imgs,
           {'kenmerk_kort': 'Strak tot de grond · 60 × 60 tot 160 × 60 cm · voetzak per poot', 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket',
            'past_op': ['statafel-vierkant-stapelbaar', 'statafel-rechthoekig-inklapbaar', 'statafel-breed-stapelbaar'],
            'specificaties': [sp('Stof', 'Materiaal', '90% polyester, 10% elastaan, 220 g/m²'), sp('Pasvorm', 'Vierkant', '60 x 60, 70 x 70 of 80 x 80 cm, 107 cm hoog'),
                              sp('Pasvorm', 'Rechthoekig', '120 x 60, 120 x 70, 140 x 70, 160 x 60 of 180 x 70 cm, 110 cm hoog'), sp('Pasvorm', 'Model', 'Strak over blad en poten, voetzak per poot')]},
           ['statafelrokken-hoezen.statafelrok-stretch'], 'textiel',
           'Stretchhoes voor de vierkante (stapelbare) en de rechthoekige statafel: maat = blad, strak tot de grond met voetzakken; wit, zwart of antraciet; staffel vanaf 10.',
           ['hoes vierkante statafel', 'stretchhoes statafel vierkant', 'hoes rechthoekige statafel'], {'note': 'geen referentieprijs gevonden; € 29,95 – € 52,95 naar oppervlak', 'ours': {m: v[0] for m, v in SQ.items()}},
           vmap=vmap,
           # the rechthoekige zwarte hoezen show the rechthoekige render, not the square hero (merchandising review 3)
           extra={'variant_image_sku': {f'KK-HOES-STV-{code(m)}-ZWA': 'stretchhoes-statafel-vierkant-en-rechthoekig-zwart-160x60.webp'
                                        for m in ['120 x 60 cm', '120 x 70 cm', '140 x 70 cm', '160 x 60 cm', '180 x 70 cm']}})
    # round plates 2 cm under the blad; square and rectangular plates in the size of the vierkante / rechthoekige statafel and the terrastafel
    BP = {'Ø68 cm': 15.95, 'Ø78 cm': 16.95, 'Ø83 cm': 17.95, '60 x 60 cm': 16.95, '70 x 70 cm': 18.95, '80 x 80 cm': 19.95,
          '120 x 60 cm': 22.95, '120 x 70 cm': 23.95, '140 x 70 cm': 24.95, '160 x 60 cm': 25.95, '180 x 70 cm': 26.95, '182 x 75 cm': 26.95}
    simple('beschermplaat-statafel', 'Beschermplaat transparant voor statafel', 'Beschermplaat', ['zakelijk', 'gebruik:horeca'], [opt('Maat', list(BP))],
           [variant(f'KK-BPL-{code(m)}', [m], p, 900 + 300 * i, inv(20, m + 'bp')) for i, (m, p) in enumerate(BP.items())],
           [img('beschermplaat-statafel-hero.webp', 'hero', 1, 'protectionDisc', {'diameter': 0.78, 'onCover': {'type': 'stretch', 'color': 'zwart'}}, 'hero', 'Transparant', 'needs-model',
                alt='op een statafel met zwarte stretchrok (tafel en rok niet inbegrepen)')],
           {'kenmerk_kort': 'Transparant PVC over hoes en topcover · tegen vlekken', 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket',
            'past_op': ROUND + ['statafel-vierkant-stapelbaar', 'statafel-rechthoekig-inklapbaar', 'statafel-wijnvat-houtlook', 'terrastafel-inklapbaar', 'klaptafel-hdpe-rechthoekig',
                                'statafel-breed-stapelbaar', 'statafel-design-marmerlook', 'statafel-design-zuilvoet']},
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
