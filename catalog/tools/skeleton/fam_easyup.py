# Easy-up tents (Premium / Professional per size), printed easy-ups, walls, sets, roofs, frames.
from kk_base import *

DIMS = {'2 x 2 m': (2, 2), '3 x 3 m': (3, 3), '3 x 4,5 m': (3, 4.5), '3 x 6 m': (3, 6), '4 x 4 m': (4, 4),
        '4 x 6 m': (4, 6), '4 x 8 m': (4, 8), '5 x 5 m': (5, 5)}

def legs(maat):
    w, d = DIMS[maat]
    return 4 + (2 if d > 4 else 0) + (2 if w > 4 else 0)

def m2(maat):
    w, d = DIMS[maat]
    return w * d

def x9(x):
    """Round down to a price ending in 9 (whole euros)."""
    n = int(x)
    p = n - n % 10 + 9
    return p if p <= x else p - 10

# ---------------------------------------------------------------- Premium
PREM = {  # maat: (price, kg, verpakt, outmate_ref)
    '3 x 3 m': (279, 27, '155 x 28 x 28 cm', 299),
    '3 x 4,5 m': (359, 34, '155 x 35 x 30 cm', 379),
    '3 x 6 m': (449, 41, '155 x 45 x 30 cm', 459),
}
PRO = {  # maat: (poly, hd, kg_poly, hd_extra_kg, verpakt, om_poly, om_hd)
    '2 x 2 m': (499, None, 22, 0, '130 x 25 x 25 cm', 599, None),
    '3 x 3 m': (599, 719, 37, 4, '170 x 35 x 35 cm', 679, 789),
    '3 x 4,5 m': (719, 869, 45, 6, '170 x 45 x 35 cm', 789, 1025),
    '3 x 6 m': (949, 1149, 58, 8, '170 x 55 x 40 cm', 1149, 1359),
    '4 x 4 m': (749, 889, 50, 7, '175 x 40 x 40 cm', 839, 979),
    '4 x 6 m': (999, 1199, 68, 11, '175 x 55 x 45 cm', 1125, 1389),
    '4 x 8 m': (1249, 1499, 84, 14, '210 x 60 x 45 cm', 1449, 1769),
    '5 x 5 m': (1199, None, 66, 0, '210 x 45 x 45 cm', 1399, None),
}
PRO_KLEUREN = {'2 x 2 m': ['Rood', 'Wit', 'Zwart'], '5 x 5 m': ['Rood', 'Wit', 'Zwart', 'Antraciet']}

def h_prem(m): return 'easy-up-partytent-premium-' + slug(m).replace('-m', '').replace('m', '')
def h_pro(m): return 'easy-up-partytent-professional-' + slug(m).replace('-m', '').replace('m', '')

def tent_params(maat, line, k, **kw):
    w, d = DIMS[maat]
    p = {'w': w, 'd': d, 'color': render_color(k), 'legs': line}
    p.update(render_finish(k))
    p.update(kw)
    return p

def tent_extra_imgs(handle, maat, line, k='Rood'):
    return [
        img(f'{handle}-{slug(k)}-detail.webp', 'detail', 2, 'easyUpTent', tent_params(maat, line, k), 'detail', k,
            alt=f'hoekstuk, schaar en luifelzoom, {k}'),
        img(f'{handle}-{slug(k)}-front.webp', 'front', 3, 'easyUpTent', tent_params(maat, line, k), 'front', k),
        img(f'{handle}-wit-zijwanden-hero.webp', 'in-gebruik', 3, 'easyUpTent',
            tent_params(maat, line, 'Wit', walls={'back': 'window', 'left': 'closed', 'right': 'door'}, weights=1), 'hero', 'Wit',
            alt='met zijwandenset en voetgewichten (los verkrijgbaar)'),
    ]

def doorloop(maat, line):
    w, d = DIMS[maat]
    if line == 'premium':
        return '170–200 cm', '315 cm'
    if w >= 5:
        return '160–210 cm', '386 cm'
    if w >= 4:
        return '155–210 cm', '365 cm'
    return '150–205 cm', '330 cm'

def capaciteit(maat):
    a = m2(maat)
    return f'ca. {int(a * 1.5)} staand / {int(a)} zittend'

def build():
    prem_handles = [h_prem(m) for m in PREM]
    pro_handles = [h_pro(m) for m in PRO]
    for m, (price, kg, verpakt, om) in PREM.items():
        h = h_prem(m)
        variants = []
        for k in TENT_KLEUREN:
            sku = f'KK-EU-PRM-{code(m)}-{COLOR_CODE[k]}'
            variants.append(variant(sku, [m, k], price, kg * 1000, inv(8 if m == '3 x 3 m' else 5, sku, k)))
        imgs, vmap = kleur_images(h, TENT_KLEUREN, 'easyUpTent', lambda k, m=m: tent_params(m, 'premium', k), 'Rood',
                                  tent_extra_imgs(h, m, 'premium'))
        dl, th = doorloop(m, 'premium')
        add({
            'handle': h, 'title': f'Easy-up partytent Premium {m}', 'product_type': 'Easy-up partytent',
            'tags': ['gebruik:tuinfeest', 'gebruik:markt', 'gebruik:evenement'] + (['pallet'] if kg > 31.5 else []),
            'options': [opt('Maat', [m]), opt('Kleur', TENT_KLEUREN)], 'variants': variants,
            'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
            'metafields': {
                'kenmerk_kort': '40 mm staal · 320 g/m² dakdoek · 5 standen',
                'specificaties': [
                    sp('Frame', 'Materiaal', 'Staal, zwart gepoedercoat'), sp('Frame', 'Profiel poten', 'Zeskant 40 mm, wand 0,8 mm'),
                    sp('Frame', 'Hoekstukken', 'Glasvezelversterkt nylon (los na te bestellen)'), sp('Frame', 'Hoogtestanden', '5'),
                    sp('Frame', 'Aantal poten', str(legs(m))),
                    sp('Dak', 'Materiaal', '500D polyester, PVC-gecoat, 320 g/m²'), sp('Dak', 'Eigenschappen', 'Waterdicht, naden afgeplakt, UV-bestendig, brandvertragend'),
                    sp('Afmetingen', 'Maat', m), sp('Afmetingen', 'Oppervlak', f'{m2(m):g} m²'.replace('.', ',')),
                    sp('Afmetingen', 'Doorloophoogte', dl), sp('Afmetingen', 'Totale hoogte', th),
                    sp('Afmetingen', 'Capaciteit', capaciteit(m)),
                    sp('Gewicht', 'Totaal', f'{kg} kg'), sp('Verpakking', 'Ingeklapt in beschermhoes', verpakt),
                    sp('Levering', 'Inbegrepen', 'Frame, dak met luifel, beschermhoes'),
                    sp('Levering', 'Niet inbegrepen', 'Zijwanden, voetgewichten, haringen en spanbanden'),
                ],
                'staffelkorting': ST_TENT,
                'addons': ['spanbanden-en-haringen-easy-up', 'voetgewicht-easy-up-15-kg', 'zandzakken-partytent-set-van-4'],
                'verzending': 'pallet' if kg > 31.5 else 'pakket',
                'vergelijk_groep': 'easy-up-' + slug(m).replace('-m', ''),
                'gewicht_kg': kg, 'verpakt': verpakt, 'garantie': '1 jaar op het frame',
                'andere_maten': [x for x in prem_handles if x != h],
            },
            'complementary': ['zijwandenset-easy-up', 'wieltas-easy-up', 'regengoot-partytent', 'beschermhoes-easy-up'],
            'covers': ['easy-up-partytenten.easy-up-premium'],
            'family': 'easy-up-tent', 'weight': 1.25,
            'copy_brief': f'Instapmodel staal voor tuin, club en markt in {m}: noem wat erin zit (frame, dak, hoes) en wat niet; eerlijk over staal vs. aluminium; verwijs naar Professional voor intensief gebruik.',
            'seo_keywords': [f'easy-up partytent {m.replace(" m", "").replace(" ", "")}', f'vouwtent {m.replace(" m", "").replace(" ", "")}', 'partytent premium staal'],
            'price_ref': {'outmate': om, 'band': 'semi-pro staal 3x3 €229–€359; 3x6 €449–€549', 'ours': price},
        })

    for m, (poly, hd, kg, hdkg, verpakt, om, omhd) in PRO.items():
        h = h_pro(m)
        kleuren = PRO_KLEUREN.get(m, TENT_KLEUREN)
        uitv = ['Polyester'] + (['Heavy duty PVC'] if hd else [])
        variants = []
        for u in uitv:
            for k in (kleuren if u == 'Polyester' else HD_KLEUREN):
                ucode = 'POL' if u == 'Polyester' else 'HDP'
                sku = f'KK-EU-PRO-{code(m)}-{ucode}-{COLOR_CODE[k]}'
                pr = poly if u == 'Polyester' else hd
                kgv = kg + (0 if u == 'Polyester' else hdkg)
                variants.append(variant(sku, [m, u, k], pr, kgv * 1000, inv(6 if u == 'Polyester' else 3, sku, k)))
        imgs, vmap = kleur_images(h, kleuren, 'easyUpTent', lambda k, m=m: tent_params(m, 'professional', k), 'Rood',
                                  tent_extra_imgs(h, m, 'professional'))
        dl, th = doorloop(m, 'professional')
        maxkg = kg + hdkg
        add({
            'handle': h, 'title': f'Easy-up partytent Professional {m}', 'product_type': 'Easy-up partytent',
            'tags': ['zakelijk', 'gebruik:evenement', 'gebruik:horeca', 'gebruik:markt'] + (['pallet'] if maxkg > 31.5 else []),
            'options': [opt('Maat', [m]), opt('Uitvoering', uitv), opt('Kleur', kleuren)], 'variants': variants,
            'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
            'metafields': {
                'kenmerk_kort': '50 mm aluminium · ' + ('320 g/m² of 580 g/m² PVC' if hd else '320 g/m² dakdoek') + ' · 5 standen',
                'specificaties': [
                    sp('Frame', 'Materiaal', 'Aluminium 6063-T5, geanodiseerd'), sp('Frame', 'Profiel poten', 'Zeskant 50 mm, wand 1,8 mm'),
                    sp('Frame', 'Schaararmen', 'Aluminium, 2 mm'), sp('Frame', 'Hoekstukken', 'Aluminium'),
                    sp('Frame', 'Hoogtestanden', '5'), sp('Frame', 'Aantal poten', str(legs(m))),
                    sp('Dak', 'Polyester', '500D polyester, PVC-gecoat, 320 g/m², dubbel gestikt'),
                ] + ([sp('Dak', 'Heavy duty PVC', 'PVC 580 g/m², thermisch gelast')] if hd else []) + [
                    sp('Dak', 'Eigenschappen', 'Waterdicht, UV-bestendig, brandvertragend'),
                    sp('Afmetingen', 'Maat', m), sp('Afmetingen', 'Oppervlak', f'{m2(m):g} m²'.replace('.', ',')),
                    sp('Afmetingen', 'Doorloophoogte', dl), sp('Afmetingen', 'Totale hoogte', th),
                    sp('Afmetingen', 'Capaciteit', capaciteit(m)),
                    sp('Gewicht', 'Totaal', f'{kg} kg' + (f' (heavy duty PVC {kg + hdkg} kg)' if hd else '')),
                    sp('Verpakking', 'Ingeklapt in wieltas', verpakt),
                    sp('Levering', 'Inbegrepen', 'Frame, dak met luifel, wieltas, 4 spanbanden en 4 haringen'),
                    sp('Levering', 'Niet inbegrepen', 'Zijwanden en voetgewichten'),
                ],
                'staffelkorting': ST_TENT,
                'addons': ['voetgewicht-easy-up-15-kg', 'zandzakken-partytent-set-van-4'],
                'verzending': 'pallet' if maxkg > 31.5 else 'pakket',
                'vergelijk_groep': 'easy-up-' + slug(m).replace('-m', ''),
                'gewicht_kg': kg, 'verpakt': verpakt, 'garantie': '2 jaar op het frame',
                'andere_maten': [x for x in pro_handles if x != h],
            },
            'complementary': ['zijwandenset-easy-up', 'zijwandenset-easy-up-heavy-duty-pvc', 'regengoot-partytent', 'koppelset-easy-up'],
            'covers': ['easy-up-partytenten.easy-up-professional'],
            'family': 'easy-up-tent', 'weight': 1.25,
            'copy_brief': f'Aluminium tent voor intensief en zakelijk gebruik in {m}: uitleg keuze polyester of heavy duty PVC, wat er in de doos zit, opzetten met twee man, verankering verplicht.',
            'seo_keywords': [f'easy-up partytent {m.replace(" m", "").replace(" ", "")} professional', f'vouwtent aluminium {m.replace(" m", "").replace(" ", "")}', 'easy up heavy duty pvc'],
            'price_ref': {'outmate': {'polyester': om, 'hd_pvc': omhd}, 'band': 'pro alu 3x3 €549–€799; 3x6 €699–€1.359', 'ours': {'polyester': poly, 'hd_pvc': hd}},
        })

    # ------------------------------------------------------------ printed easy-ups
    SIX = ['3 x 3 m', '3 x 4,5 m', '3 x 6 m', '4 x 4 m', '4 x 6 m', '4 x 8 m']
    LOGO_K = ['Rood', 'Wit', 'Zwart', 'Blauw', 'Antraciet', 'Groen']
    def logo_params(m, line, k):
        p = tent_params(m, line, k)
        p['valancePrint'] = {'svg': 'brand/tools/print-wordmark.json', 'color': '#1D2420' if k == 'Wit' else '#FBF6EC',
                             'sides': ['front', 'back', 'left', 'right'], 'pad': 0.05}
        return p
    h = 'easy-up-partytent-professional-met-logo-op-de-luifel'
    variants = []
    for m in SIX:
        for k in LOGO_K:
            sku = f'KK-BDR-EUPRO-LOG-{code(m)}-{COLOR_CODE[k]}'
            variants.append(variant(sku, [m, k], PRO[m][0] + 150, (PRO[m][2]) * 1000, None, tracked=False))
    imgs, vmap = kleur_images(h, LOGO_K, 'easyUpTent', lambda k: logo_params('3 x 3 m', 'professional', k), 'Rood',
                              [img(f'{h}-rood-front.webp', 'front', 2, 'easyUpTent', logo_params('3 x 3 m', 'professional', 'Rood'), 'front', 'Rood', 'needs-patch',
                                   alt='met voorbeeldopdruk Klapklaar op de luifel')], status='needs-patch')
    add({'handle': h, 'title': 'Easy-up partytent Professional met jouw logo op de luifel', 'product_type': 'Easy-up partytent',
         'tags': ['bedrukbaar', 'zakelijk', 'gebruik:evenement', 'gebruik:markt', 'pallet'],
         'options': [opt('Maat', SIX), opt('Kleur', LOGO_K)], 'variants': variants,
         'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
         'metafields': {'kenmerk_kort': '50 mm aluminium · logo op 4 luifelzijden · drukproef vooraf',
                        'bedrukbaar': True, 'drukopties': {'posities': ['Luifel voorkant', 'Luifel rondom (4 zijden)'], 'aanlevering': AANLEVERING, 'levertijd': LT_DRUK, 'min_aantal': 1},
                        'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'verzending': 'pallet',
                        'past_op': [], 'garantie': '2 jaar op het frame'},
         'complementary': ['bedrukte-zijwand-easy-up', 'voetgewicht-easy-up-15-kg'],
         'covers': ['easy-up-partytenten.easy-up-professional'], 'family': 'bedrukt-tent', 'weight': 2,
         'copy_brief': 'Professional-tent met jouw logo op de luifel: uploaden, drukproef, akkoord, dan produceren; maatvoering logo (54% luifelhoogte); prijs is incl. bedrukking rondom.',
         'seo_keywords': ['partytent met logo', 'easy up bedrukken', 'reclametent bedrukt'],
         'price_ref': {'band': 'bedrukte easy-up 3x3 €566–€795 (meest excl.)', 'ours': '3x3 €749 incl.'}})

    h = 'easy-up-partytent-professional-full-colour-bedrukt'
    FC = {'3 x 3 m': (949, 1349), '3 x 4,5 m': (1129, 1579), '3 x 6 m': (1349, 1849), '4 x 4 m': (1149, 1599), '4 x 6 m': (1449, 1979), '4 x 8 m': (1749, 2349)}
    UV = ['Dak en luifel', 'Dak, luifel en 3 zijwanden']
    variants = []
    for m in SIX:
        for i, u in enumerate(UV):
            sku = f'KK-BDR-EUPRO-FC-{code(m)}-{"DL" if i == 0 else "DLW"}'
            variants.append(variant(sku, [m, u], FC[m][i], (PRO[m][2] + (6 if i else 0)) * 1000, None, tracked=False))
    fcp = tent_params('3 x 3 m', 'professional', 'Wit', roofPrint={'artwork': 'brand/img/voorbeeld-fullcolour.png', 'note': 'voorbeeldontwerp'})
    add({'handle': h, 'title': 'Easy-up partytent Professional full colour bedrukt', 'product_type': 'Easy-up partytent',
         'tags': ['bedrukbaar', 'zakelijk', 'gebruik:evenement', 'gebruik:markt', 'pallet'],
         'options': [opt('Maat', SIX), opt('Uitvoering', UV)], 'variants': variants,
         'images': [img(f'{h}-hero.webp', 'hero', 1, 'easyUpTent', fcp, 'hero', None, 'needs-param', alt='met voorbeeldontwerp in full colour op dak en luifel'),
                    img(f'{h}-zijwanden-hero.webp', 'variant', 2, 'easyUpTent', dict(fcp, walls={'back': 'closed', 'left': 'closed', 'right': 'closed'}, wallPrint=True), 'hero', None, 'needs-param',
                        alt='met voorbeeldontwerp op dak, luifel en 3 zijwanden'),
                    img(f'{h}-detail.webp', 'detail', 3, 'easyUpTent', fcp, 'detail', None, 'needs-param')],
         'variant_image_by': 'Uitvoering', 'variant_images': {'Dak en luifel': f'{h}-hero.webp', 'Dak, luifel en 3 zijwanden': f'{h}-zijwanden-hero.webp'},
         'metafields': {'kenmerk_kort': '50 mm aluminium · full colour sublimatie · drukproef vooraf',
                        'bedrukbaar': True, 'drukopties': {'posities': ['Dak', 'Luifel', 'Zijwanden'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1},
                        'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'verzending': 'pallet', 'garantie': '2 jaar op het frame'},
         'covers': ['easy-up-partytenten.easy-up-professional'], 'family': 'bedrukt-tent', 'weight': 2,
         'copy_brief': 'Volledig in jouw huisstijl: dak en luifel (optioneel 3 wanden) in full colour; sjabloon downloaden, drukproef, levertijd na akkoord; beeld toont een voorbeeldontwerp.',
         'seo_keywords': ['bedrukte partytent', 'partytent full colour', 'promotietent bedrukken'],
         'price_ref': {'band': '€566–€795 per stuk (meest excl.)', 'ours': '3x3 €949 incl. (€784 excl.)'}})

    h = 'easy-up-partytent-premium-met-logo-op-de-luifel'
    variants = []
    PL = {'3 x 3 m': 399, '3 x 4,5 m': 479, '3 x 6 m': 569}
    for m in PREM:
        for k in TENT_KLEUREN:
            sku = f'KK-BDR-EUPRM-LOG-{code(m)}-{COLOR_CODE[k]}'
            variants.append(variant(sku, [m, k], PL[m], PREM[m][1] * 1000, None, tracked=False))
    imgs, vmap = kleur_images(h, TENT_KLEUREN, 'easyUpTent', lambda k: logo_params('3 x 3 m', 'premium', k), 'Rood', status='needs-patch', p2=3)
    add({'handle': h, 'title': 'Easy-up partytent Premium met jouw logo op de luifel', 'product_type': 'Easy-up partytent',
         'tags': ['bedrukbaar', 'gebruik:markt', 'gebruik:evenement', 'pallet'],
         'options': [opt('Maat', list(PREM)), opt('Kleur', TENT_KLEUREN)], 'variants': variants,
         'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
         'metafields': {'kenmerk_kort': '40 mm staal · logo op de luifel · drukproef vooraf', 'bedrukbaar': True,
                        'drukopties': {'posities': ['Luifel voorkant', 'Luifel rondom (4 zijden)'], 'aanlevering': AANLEVERING, 'levertijd': LT_DRUK, 'min_aantal': 1},
                        'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'verzending': 'pallet', 'garantie': '1 jaar op het frame'},
         'covers': ['easy-up-partytenten.easy-up-premium'], 'family': 'bedrukt-tent', 'weight': 2,
         'copy_brief': 'Budgetversie voor verenigingen, scholen en marktkramers: stalen tent met logo op de luifel; zelfde drukproefproces als Professional.',
         'seo_keywords': ['partytent met logo goedkoop', 'vereniging partytent logo'], 'price_ref': {'ours': '3x3 €399 incl.'}})

    # ------------------------------------------------------------ walls (polyester)
    WALL = {'2 m': (39.95, 49.95, 49.95, 0.9), '3 m': (49.95, 59.95, 59.95, 1.3), '4 m': (59.95, 69.95, 69.95, 1.7),
            '4,5 m': (64.95, 74.95, 74.95, 1.9), '5 m': (69.95, 79.95, 79.95, 2.1), '6 m': (84.95, 99.95, 99.95, 2.5),
            '8 m': (109.95, 124.95, 124.95, 3.3)}
    all_eu = prem_handles + pro_handles
    for idx, (suffix, title, wtype, ucode) in enumerate([('dicht', 'Zijwand easy-up dicht', 'closed', 'DI'),
                                                        ('met-raam', 'Zijwand easy-up met raam', 'window', 'RA'),
                                                        ('met-deur', 'Zijwand easy-up met deur', 'door', 'DE')]):
        h = f'zijwand-easy-up-{suffix}'
        variants = []
        for m, row in WALL.items():
            for k in TENT_KLEUREN:
                sku = f'KK-ZW-EU-{ucode}-{code(m)}-{COLOR_CODE[k]}'
                variants.append(variant(sku, [m, k], row[idx], row[3] * 1000, inv(10, sku, k, 1.2 if m == '3 m' else 0.6)))
        extra = [img(f'{h}-wit-in-gebruik.webp', 'in-gebruik', 2, 'easyUpTent', tent_params('3 x 3 m', 'professional', 'Wit', walls={'back': wtype}), 'hero', 'Wit',
                     alt='aan een easy-up 3 × 3 m (tent niet inbegrepen)')]
        imgs, vmap = kleur_images(h, TENT_KLEUREN, 'sideWall', lambda k, wtype=wtype: {'length': 3, 'height': 2.0, 'type': wtype, 'color': render_color(k), 'material': 'polyester', **render_finish(k)},
                                  'Wit', extra, status='needs-model', p2=3)
        add({'handle': h, 'title': title, 'product_type': 'Zijwand',
             'tags': ['gebruik:tuinfeest', 'gebruik:markt', 'gebruik:evenement'],
             'options': [opt('Maat', list(WALL)), opt('Kleur', TENT_KLEUREN)], 'variants': variants,
             'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
             'metafields': {'kenmerk_kort': {'closed': 'Dicht · 320 g/m² polyester · klittenband', 'window': 'PVC-raam · 320 g/m² polyester · klittenband',
                                             'door': 'Ritsdeur met oprolbanden · 320 g/m² · klittenband'}[wtype],
                            'specificaties': [sp('Wand', 'Materiaal', '500D polyester, PVC-gecoat, 320 g/m²'), sp('Wand', 'Bevestiging', 'Klittenband aan dakrand en poten'),
                                              sp('Wand', 'Hoogte', 'ca. 200 cm (past op Premium en Professional)')] +
                                             ([sp('Wand', 'Raam', 'Helder PVC, gestikte rand')] if wtype == 'window' else []) +
                                             ([sp('Wand', 'Deur', 'Rits in het midden, 2 oprolbanden')] if wtype == 'door' else []),
                            'staffelkorting': ST_TEXTIEL, 'past_op': all_eu, 'verzending': 'pakket', 'gewicht_kg': WALL['3 m'][3],
                            'verpakt': '40 x 30 x 8 cm (3 m)'},
             'covers': ['easy-up-accessoires.easy-up-zijwanden'], 'family': 'zijwand', 'weight': 1,
             'copy_brief': f'Losse zijwand ({wtype}) per zijde: welke lengte bij welke tent (3 m = korte zijde 3 × 6 m enz.), zelfde kleuren als de tenten, ophangen met klittenband.',
             'seo_keywords': [f'zijwand easy up {suffix.replace("-", " ")}', 'zijwand partytent 3 meter'],
             'price_ref': {'outmate': '3 m dicht/deur €69, raam €85; 6 m raam €135', 'band': '€50–€69 per 3 m wand', 'ours': {k: v[idx] for k, v in WALL.items()}}})

    HALF = {'3 m': 34.95, '4 m': 42.95, '4,5 m': 45.95, '6 m': 54.95}
    HK = ['Wit', 'Zwart', 'Antraciet', 'Rood']
    h = 'halve-zijwand-easy-up'
    variants = [variant(f'KK-ZW-EU-HA-{code(m)}-{COLOR_CODE[k]}', [m, k], pr, 600 + 200 * i, inv(6, f'h{m}{k}', k))
                for i, (m, pr) in enumerate(HALF.items()) for k in HK]
    imgs, vmap = kleur_images(h, HK, 'easyUpTent', lambda k: tent_params('3 x 3 m', 'premium', k, walls={'front': 'half'}), 'Wit', status='needs-param', p2=3)
    add({'handle': h, 'title': 'Halve zijwand easy-up', 'product_type': 'Zijwand', 'tags': ['gebruik:markt', 'gebruik:horeca'],
         'options': [opt('Maat', list(HALF)), opt('Kleur', HK)], 'variants': variants, 'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
         'metafields': {'kenmerk_kort': 'Borstwering 100 cm hoog · klittenband · 320 g/m²', 'past_op': all_eu, 'verzending': 'pakket',
                        'specificaties': [sp('Wand', 'Hoogte', '100 cm'), sp('Wand', 'Materiaal', '500D polyester, PVC-gecoat, 320 g/m²')]},
         'covers': ['easy-up-accessoires.easy-up-zijwanden'], 'family': 'zijwand', 'weight': 1,
         'copy_brief': 'Halve wand als toonbank- of windscherm voor markt en bar: tent blijft open, bovenkant vrij.',
         'seo_keywords': ['halve zijwand partytent', 'windscherm easy up'], 'price_ref': {'outmate': 'halve 3 m €49', 'ours': HALF}})

    HDW = {'3 m': (94.95, 109.0, 104.95, 2.6), '4 m': (114.95, 129.0, 124.95, 3.4), '4,5 m': (124.95, 139.0, 134.95, 3.8),
           '6 m': (149.0, 165.0, 159.0, 5.0), '8 m': (189.0, 209.0, 199.0, 6.6)}
    HDU = ['Dicht', 'Met raam', 'Met deur']
    h = 'zijwand-easy-up-heavy-duty-pvc'
    variants = [variant(f'KK-ZW-EU-HD-{["DI", "RA", "DE"][i]}-{code(m)}-{COLOR_CODE[k]}', [m, u, k], row[i], row[3] * 1000, inv(4, f'hd{m}{u}{k}', k))
                for m, row in HDW.items() for i, u in enumerate(HDU) for k in HD_KLEUREN]
    imgs, vmap = kleur_images(h, HD_KLEUREN, 'easyUpTent', lambda k: tent_params('3 x 3 m', 'professional', k, walls={'back': 'window'}), 'Wit', status='existing', p2=2)
    add({'handle': h, 'title': 'Zijwand easy-up heavy duty PVC', 'product_type': 'Zijwand', 'tags': ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'],
         'options': [opt('Maat', list(HDW)), opt('Uitvoering', HDU), opt('Kleur', HD_KLEUREN)], 'variants': variants,
         'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
         'metafields': {'kenmerk_kort': 'PVC 580 g/m² · thermisch gelast · klittenband rond de poot',
                        'specificaties': [sp('Wand', 'Materiaal', 'PVC 580 g/m², brandvertragend'), sp('Wand', 'Bevestiging', 'Klittenband over de volle hoogte rond de poten')],
                        'past_op': pro_handles, 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket'},
         'covers': ['easy-up-accessoires.easy-up-zijwanden'], 'family': 'zijwand', 'weight': 1,
         'copy_brief': 'Zware PVC-wand voor verhuur en horeca: dicht, raam of deur; hoort bij de heavy duty PVC-daken; afneembaar en afneembaar schoon te maken.',
         'seo_keywords': ['zijwand pvc easy up', 'heavy duty zijwand'], 'price_ref': {'outmate': '3 m dicht/deur €112, raam €125', 'ours': {k: v[:3] for k, v in HDW.items()}}})

    # ------------------------------------------------------------ wall sets
    SETS = ['3 x 3 m', '3 x 4,5 m', '3 x 6 m', '4 x 4 m', '4 x 6 m', '4 x 8 m', '5 x 5 m']
    def lenstr(x): return (f'{x:g}'.replace('.', ',')) + ' m'
    def set_price(m, table, idx_closed=0, idx_win=1, idx_door=2):
        w, d = DIMS[m]
        s = table[lenstr(w)][idx_closed] + table[lenstr(w)][idx_door] + 2 * table[lenstr(d)][idx_win]
        return x9(0.88 * s), round(s, 2)
    h = 'zijwandenset-easy-up'
    variants, refs = [], {}
    for m in SETS:
        pr, s = set_price(m, WALL)
        refs[m] = {'set': pr, 'los': s}
        w, d = DIMS[m]
        g = (WALL[lenstr(w)][3] * 2 + WALL[lenstr(d)][3] * 2) * 1000
        for k in TENT_KLEUREN:
            sku = f'KK-ZW-EU-SET-{code(m)}-{COLOR_CODE[k]}'
            variants.append(variant(sku, [m, k], pr, g, inv(6, sku, k, 1.3 if m == '3 x 3 m' else 0.6)))
    imgs, vmap = kleur_images(h, TENT_KLEUREN, 'easyUpTent', lambda k: tent_params('3 x 3 m', 'professional', k, walls={'front': 'door', 'back': 'closed', 'left': 'window', 'right': 'window'}), 'Wit',
                              [img(f'{h}-wit-3x6-hero.webp', 'in-gebruik', 3, 'easyUpTent', tent_params('3 x 6 m', 'professional', 'Wit', walls={'front': 'window', 'back': 'window', 'left': 'door', 'right': 'closed'}), 'hero', 'Wit',
                                   alt='op een easy-up 3 × 6 m (tent niet inbegrepen)')], p2=2)
    add({'handle': h, 'title': 'Zijwandenset easy-up', 'product_type': 'Zijwandenset', 'tags': ['gebruik:tuinfeest', 'gebruik:evenement', 'gebruik:markt'],
         'options': [opt('Maat', SETS), opt('Kleur', TENT_KLEUREN)], 'variants': variants,
         'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
         'metafields': {'kenmerk_kort': '4 wanden: 1 dicht, 2 met raam, 1 met deur · 320 g/m²',
                        'specificaties': [sp('Set', 'Samenstelling', 'Korte zijden: 1 dicht en 1 met deur; lange zijden: 2 met raam'), sp('Wand', 'Materiaal', '500D polyester, PVC-gecoat, 320 g/m²'),
                                          sp('Wand', 'Bevestiging', 'Klittenband')],
                        'staffelkorting': ST_TEXTIEL, 'past_op': all_eu, 'verzending': 'pakket'},
         'covers': ['easy-up-accessoires.easy-up-zijwandensets'], 'family': 'zijwand', 'weight': 1.5,
         'copy_brief': 'Complete set per tentmaat, goedkoper dan los (noem de losse prijs); welke wand waar komt; zelfde kleuren als de tenten.',
         'seo_keywords': ['zijwanden set easy up 3x3', 'zijwandenset partytent'],
         'price_ref': {'outmate': '3x3 polyester vanaf €249', 'band': '€175–€279 per set 3x3', 'ours': refs}})

    h = 'zijwandenset-easy-up-heavy-duty-pvc'
    variants, refs = [], {}
    for m in SETS[:6]:
        pr, s = set_price(m, HDW)
        refs[m] = {'set': pr, 'los': s}
        w, d = DIMS[m]
        g = (HDW[lenstr(w)][3] * 2 + HDW[lenstr(d)][3] * 2) * 1000
        for k in HD_KLEUREN:
            sku = f'KK-ZW-EU-HDSET-{code(m)}-{COLOR_CODE[k]}'
            variants.append(variant(sku, [m, k], pr, g, inv(3, sku, k)))
    imgs, vmap = kleur_images(h, HD_KLEUREN, 'easyUpTent', lambda k: tent_params('3 x 3 m', 'professional', k, walls={'front': 'door-open', 'back': 'closed', 'left': 'window', 'right': 'window'}), 'Wit')
    add({'handle': h, 'title': 'Zijwandenset easy-up heavy duty PVC', 'product_type': 'Zijwandenset', 'tags': ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'],
         'options': [opt('Maat', SETS[:6]), opt('Kleur', HD_KLEUREN)], 'variants': variants,
         'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
         'metafields': {'kenmerk_kort': '4 wanden PVC 580 g/m² · thermisch gelast · brandvertragend',
                        'past_op': pro_handles, 'staffelkorting': ST_TEXTIEL, 'verzending': 'pakket'},
         'covers': ['easy-up-accessoires.easy-up-zijwandensets'], 'family': 'zijwand', 'weight': 1.5,
         'copy_brief': 'PVC-set voor de Professional-tenten: samenstelling, gewicht, waarom PVC voor verhuur en horeca.',
         'seo_keywords': ['zijwanden pvc easy up set'], 'price_ref': {'outmate': '3x3 HD €199–€299 (snapshots)', 'ours': refs}})

    # ------------------------------------------------------------ roofs
    # frame + dak is never cheaper than the complete tent (validate.py checks it); polyester 5-15% under Outmate (3x3 €129, 4x8 €319)
    DAK = {'2 x 2 m': (79, None), '3 x 3 m': (119, 219), '3 x 4,5 m': (149, 279), '3 x 6 m': (199, 359), '4 x 4 m': (159, 279),
           '4 x 6 m': (229, 379), '4 x 8 m': (279, 529), '5 x 5 m': (249, None)}
    h = 'dakzeil-easy-up'
    variants = []
    for m, (pp, ph) in DAK.items():
        for u, pr, ks in [('Polyester', pp, PRO_KLEUREN.get(m, TENT_KLEUREN)), ('Heavy duty PVC', ph, HD_KLEUREN)]:
            if pr is None:
                continue
            for k in ks:
                sku = f'KK-DAK-EU-{"POL" if u == "Polyester" else "HDP"}-{code(m)}-{COLOR_CODE[k]}'
                kg = m2(m) * (0.42 if u == 'Polyester' else 0.75)
                variants.append(variant(sku, [m, u, k], pr, kg * 1000, inv(3, sku, k)))
    imgs, vmap = kleur_images(h, TENT_KLEUREN, 'canopyRoof', lambda k: {'w': 3, 'd': 3, 'color': render_color(k), 'material': 'polyester', 'display': 'draped', **render_finish(k)},
                              'Rood', [img(f'{h}-rood-gevouwen.webp', 'detail', 3, 'canopyRoof', {'w': 3, 'd': 3, 'color': 'rood', 'display': 'folded'}, 'hero', 'Rood', 'needs-model')],
                              status='needs-model', p2=3)
    add({'handle': h, 'title': 'Dakzeil easy-up partytent', 'product_type': 'Dakzeil', 'tags': ['gebruik:tuinfeest', 'gebruik:evenement'],
         'options': [opt('Maat', list(DAK)), opt('Uitvoering', ['Polyester', 'Heavy duty PVC']), opt('Kleur', TENT_KLEUREN)], 'variants': variants,
         'images': imgs, 'variant_image_by': 'Kleur', 'variant_images': vmap,
         'metafields': {'kenmerk_kort': 'Vervangend dak met luifel · 320 g/m² of PVC 580 g/m²', 'past_op': all_eu, 'verzending': 'pakket',
                        'specificaties': [sp('Dak', 'Polyester', '500D polyester, PVC-gecoat, 320 g/m²'), sp('Dak', 'Heavy duty PVC', 'PVC 580 g/m², thermisch gelast'),
                                          sp('Pasvorm', 'Past op', 'Klapklaar easy-up Premium en Professional van dezelfde maat')]},
         'covers': ['easy-up-accessoires.easy-up-dakzeilen'], 'family': 'dakzeil', 'weight': 1,
         'copy_brief': 'Nieuw dak voor je bestaande Klapklaar-frame of een andere kleur; eerlijk dat het alleen op onze frames gegarandeerd past; heavy duty PVC alleen wit/zwart.',
         'seo_keywords': ['dakzeil easy up 3x3', 'vervangend dak partytent'], 'price_ref': {'outmate': '3x3 poly €129, 4x8 €319; HD 3x3 €219, 4x8 €615', 'ours': DAK}})

    h = 'bedrukte-zijwand-easy-up'
    BZ = {'3 m': (149, 219), '4 m': (179, 259), '4,5 m': (195, 285), '6 m': (239, 349)}
    BU = ['Buitenzijde', 'Binnen- en buitenzijde']
    variants = [variant(f'KK-BDR-ZW-{code(m)}-{"B" if i == 0 else "BB"}', [m, u], v[i], (1.4 + 0.3 * j) * 1000, None, tracked=False)
                for j, (m, v) in enumerate(BZ.items()) for i, u in enumerate(BU)]
    bzp = tent_params('3 x 3 m', 'professional', 'Wit', walls={'back': 'closed'}, wallPrint={'svg': 'brand/tools/print-wordmark.json', 'color': '#C83812', 'side': 'back'})
    add({'handle': h, 'title': 'Bedrukte zijwand voor easy-up partytent', 'product_type': 'Zijwand', 'tags': ['bedrukbaar', 'zakelijk', 'gebruik:evenement', 'gebruik:markt'],
         'options': [opt('Maat', list(BZ)), opt('Uitvoering', BU)], 'variants': variants,
         'images': [img(f'{h}-hero.webp', 'hero', 1, 'easyUpTent', bzp, 'hero', None, 'needs-param', alt='met voorbeeldopdruk op de achterwand'),
                    img(f'{h}-front.webp', 'front', 3, 'easyUpTent', bzp, 'front', None, 'needs-param')],
         'metafields': {'kenmerk_kort': 'Full colour op 320 g/m² polyester · drukproef vooraf', 'bedrukbaar': True,
                        'drukopties': {'posities': ['Buitenzijde', 'Binnen- en buitenzijde'], 'aanlevering': AANLEVERING, 'levertijd': LT_DRUK, 'min_aantal': 1},
                        'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'past_op': all_eu, 'verzending': 'pakket'},
         'covers': ['easy-up-accessoires.easy-up-zijwanden'], 'family': 'bedrukt-tent', 'weight': 1.5,
         'copy_brief': 'Achterwand als reclamebord: enkel- of dubbelzijdig, sjabloon per lengte, drukproef; ook los te gebruiken met een effen tent.',
         'seo_keywords': ['bedrukte zijwand partytent', 'zijwand met logo'], 'price_ref': {'ours': BZ}})

    h = 'bedrukt-dakzeil-easy-up'
    BD = {'3 x 3 m': 379, '3 x 4,5 m': 459, '3 x 6 m': 549, '4 x 4 m': 479, '4 x 6 m': 599, '4 x 8 m': 729}
    variants = [variant(f'KK-BDR-DAK-{code(m)}', [m], pr, m2(m) * 420, None, tracked=False) for m, pr in BD.items()]
    bdp = {'w': 3, 'd': 3, 'color': 'wit', 'display': 'draped', 'roofPrint': {'artwork': 'brand/img/voorbeeld-fullcolour.png'}}
    add({'handle': h, 'title': 'Bedrukt dakzeil voor easy-up partytent', 'product_type': 'Dakzeil', 'tags': ['bedrukbaar', 'zakelijk', 'gebruik:evenement'],
         'options': [opt('Maat', list(BD))], 'variants': variants,
         'images': [img(f'{h}-hero.webp', 'hero', 1, 'canopyRoof', bdp, 'hero', None, 'needs-model', alt='met voorbeeldontwerp'),
                    img(f'{h}-op-frame.webp', 'in-gebruik', 2, 'easyUpTent', dict(tent_params('3 x 3 m', 'professional', 'Wit'), roofPrint={'artwork': 'brand/img/voorbeeld-fullcolour.png'}), 'hero', None, 'needs-param',
                        alt='op een Professional-frame (frame niet inbegrepen)')],
         'metafields': {'kenmerk_kort': 'Dak en luifel full colour · past op Klapklaar-frames', 'bedrukbaar': True,
                        'drukopties': {'posities': ['Dak', 'Luifel'], 'aanlevering': AANLEVERING + ' (of ons sjabloon)', 'levertijd': LT_DRUK, 'min_aantal': 1},
                        'staffelkorting': ST_BEDRUKT, 'levertijd': 'Levertijd ' + LT_DRUK, 'past_op': all_eu, 'verzending': 'pakket'},
         'covers': ['easy-up-accessoires.easy-up-dakzeilen'], 'family': 'bedrukt-tent', 'weight': 1.5,
         'copy_brief': 'Heb je al een Klapklaar-frame? Dan alleen een bedrukt dak; pasvorm en sjabloon per maat.',
         'seo_keywords': ['bedrukt dak partytent', 'dakzeil met logo'], 'price_ref': {'ours': BD}})

    # ------------------------------------------------------------ frames & parts
    FP = {'3 x 3 m': 169, '3 x 4,5 m': 219, '3 x 6 m': 259}
    h = 'los-frame-easy-up-premium'
    variants = [variant(f'KK-FRM-EU-PRM-{code(m)}', [m], pr, (PREM[m][1] - 4) * 1000, inv(3, m + 'fp')) for m, pr in FP.items()]
    add({'handle': h, 'title': 'Los frame easy-up Premium', 'product_type': 'Frame-onderdeel', 'tags': ['pallet'],
         'options': [opt('Maat', list(FP))], 'variants': variants,
         'images': [img(f'{h}-hero.webp', 'hero', 1, 'easyUpTent', {'w': 3, 'd': 3, 'legs': 'premium', 'roof': False}, 'hero', None, 'needs-param', alt='zonder dak'),
                    img(f'{h}-detail.webp', 'detail', 3, 'easyUpTent', {'w': 3, 'd': 3, 'legs': 'premium', 'roof': False}, 'detail', None, 'needs-param')],
         'metafields': {'kenmerk_kort': '40 mm staal · zonder dak · 5 standen', 'past_op': prem_handles, 'verzending': 'pallet', 'garantie': '1 jaar op het frame',
                        'specificaties': [sp('Frame', 'Materiaal', 'Staal, zwart gepoedercoat, zeskant 40 mm')]},
         'covers': ['easy-up-accessoires.easy-up-frames-onderdelen'], 'family': 'frame', 'weight': 1,
         'copy_brief': 'Vervangend frame zonder dak; dak apart (link Dakzeil easy-up).', 'seo_keywords': ['frame easy up 3x3', 'los frame partytent'],
         'price_ref': {'outmate': '179/225/269', 'ours': FP}})

    FPR = {'2 x 2 m': 429, '3 x 3 m': 509, '3 x 4,5 m': 599, '3 x 6 m': 799, '4 x 4 m': 619, '4 x 6 m': 829, '4 x 8 m': 1019, '5 x 5 m': 999}
    h = 'los-frame-easy-up-professional'
    variants = [variant(f'KK-FRM-EU-PRO-{code(m)}', [m], pr, (PRO[m][2] - m2(m) * 0.45) * 1000, inv(2, m + 'fpr')) for m, pr in FPR.items()]
    add({'handle': h, 'title': 'Los frame easy-up Professional', 'product_type': 'Frame-onderdeel', 'tags': ['zakelijk', 'pallet'],
         'options': [opt('Maat', list(FPR))], 'variants': variants,
         'images': [img(f'{h}-hero.webp', 'hero', 1, 'easyUpTent', {'w': 3, 'd': 3, 'legs': 'professional', 'roof': False}, 'hero', None, 'needs-param', alt='zonder dak'),
                    img(f'{h}-detail.webp', 'detail', 2, 'easyUpTent', {'w': 3, 'd': 3, 'legs': 'professional', 'roof': False}, 'detail', None, 'needs-param')],
         'metafields': {'kenmerk_kort': '50 mm aluminium · zonder dak · 5 standen', 'past_op': pro_handles, 'verzending': 'pallet', 'garantie': '2 jaar op het frame',
                        'specificaties': [sp('Frame', 'Materiaal', 'Aluminium 6063-T5, zeskant 50 mm, wand 1,8 mm')]},
         'covers': ['easy-up-accessoires.easy-up-frames-onderdelen'], 'family': 'frame', 'weight': 1,
         'copy_brief': 'Vervangend aluminium frame; voor verhuurders die daken wisselen.', 'seo_keywords': ['aluminium frame easy up', 'frame vouwtent'],
         'price_ref': {'outmate': '2x2 €499 · 3x3 €599 · 3x4,5 €742 · 3x6 €999 · 4x4 €689 · 4x6 €915 · 4x8 €1.199', 'ours': FPR}})

    PARTS = [('Hoekstuk Premium (nylon)', 4.95, 'HKP', 80), ('Hoekstuk Professional (aluminium)', 12.95, 'HKA', 250),
             ('Middenstuk Professional (aluminium)', 12.95, 'MDA', 260), ('Schuifstuk met drukknop', 6.95, 'SCH', 90),
             ('Voetplaat Premium', 7.95, 'VPP', 300), ('Voetplaat Professional', 14.95, 'VPA', 420),
             ('Staander compleet Premium', 29.95, 'STP', 3200), ('Staander compleet Professional', 44.95, 'STA', 3600),
             ('Schaararm Premium', 14.95, 'SAP', 900), ('Schaararm 3 m Professional', 24.95, 'SA3', 1200),
             ('Schaararm 4 m Professional', 29.95, 'SA4', 1500), ('Set kliksloten (10 stuks)', 9.95, 'KLS', 200)]
    h = 'frame-onderdelen-easy-up'
    variants = [variant(f'KK-FRM-EU-{c}', [n], pr, g, inv(15, c)) for n, pr, c, g in PARTS]
    add({'handle': h, 'title': 'Frame-onderdelen easy-up', 'product_type': 'Frame-onderdeel', 'tags': ['zakelijk'],
         'options': [opt('Uitvoering', [p[0] for p in PARTS])], 'variants': variants,
         'images': [img(f'{h}-hoekstukken-hero.webp', 'hero', 1, 'easyUpParts', {'parts': ['hoekstuk-premium', 'hoekstuk-professional', 'voetplaat-professional', 'schuifstuk']}, 'hero', None, 'needs-model'),
                    img(f'{h}-staander.webp', 'variant', 3, 'easyUpParts', {'parts': ['staander-professional']}, 'hero', None, 'needs-model')],
         'variant_image_by': None,
         'metafields': {'kenmerk_kort': 'Hoekstukken, voetplaten, staanders en schaararmen', 'past_op': all_eu, 'verzending': 'pakket',
                        'specificaties': [sp('Pasvorm', 'Premium', 'Zeskant 40 mm staal'), sp('Pasvorm', 'Professional', 'Zeskant 50 mm aluminium')]},
         'covers': ['easy-up-accessoires.easy-up-frames-onderdelen'], 'family': 'frame', 'weight': 1,
         'copy_brief': 'Losse onderdelen zodat je tent niet afgeschreven hoeft bij één kapot hoekstuk; per onderdeel Premium of Professional; eerlijk: Premium-hoekstukken zijn nylon.',
         'seo_keywords': ['hoekstuk easy up', 'onderdelen vouwtent', 'voetplaat partytent'],
         'price_ref': {'outmate': 'kruisstuk Premium €17,50 · koppelstuk Premium €3,99 · staander 3 m €45 · voetplaat €19', 'ours': {p[0]: p[1] for p in PARTS}}})
