# Catalog round 5 (2026-10-22, graded findings): terrace twins of the hoekige and design statafels, a wiebelvrije tafel, trolleys and
# seating spare parts, gala posts, loper pins and the Statafelshop pack combinations that were missing.
#
# Prices ca. 5-15% under the live reference (Outmate / Statafelshop capture of 2026-10-18; numbers only, no text), owner review in
# docs/claims-to-confirm.md. Specs are product DEFINITIONS to confirm with the supplier.
from kk_base import *
from fam_acc import simple
from fam_tafel import HOEK_DECORS, HOEK_DECOR_EXTRA, hoek_combos, hoek_sku, top_param
from fam_set import bundle
from fam_easyup import x9


def setp(los):
    """A pakket is 10-12% under its parts (BRIEF); x9 rounding can drop a small one below 88%: then ,95."""
    p = float(x9(0.9 * los))
    return p if p >= 0.88 * los - 1e-9 else round(int(0.9 * los) - 0.05, 2)


TERRAS = ['terrastafel-vierkant-stapelbaar', 'terrastafel-breed-stapelbaar', 'terrastafel-design-zuilvoet', 'terrastafel-wiebelvrij']
STAPELBAAR = ['stapelstoel-metaal', 'stapelstoel-kunststof', 'banquetstoel-gestoffeerd', 'stapelstoel-cross-back']


def build():
    # ------------------------------------------------------------ terrastafels (medium: the landing had 2 products)
    # 1. the vierkante stapelbare statafel at terrace height (75 cm): same decors, same onderstellen (zwart, RVS binnen, wit buiten), stacks
    # like it. Reference: Statafelshop Kansas terrastafel (zwart or RVS) vanaf € 148,82, Indus terrastafel vanaf € 143,93, Outmate Times
    # Square vierkant stapelbaar 70x70 vanaf € 159. Ours € 10 under the statafel twin: 60 x 60 € 129 (-10%), 70 x 70 € 139 (-13%).
    VT = {'60 x 60 cm': 129.0, '70 x 70 cm': 139.0, '80 x 80 cm': 149.0}
    VTU = ['Binnen, zwart onderstel', 'Binnen, RVS onderstel', 'Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel']
    VTG = {'60 x 60 cm': 12500, '70 x 70 cm': 13500, '80 x 80 cm': 16000}
    vs = [variant(f'KK-TER-VK-{code(m)}-{COLOR_CODE[k]}' + hoek_sku(u), [m, k, u],
                  p + HOEK_DECOR_EXTRA.get(k, 0) + (30 if 'RVS' in u else 0) + (55 if u.startswith('Buiten') else 0),
                  VTG[m] + (3000 if u.startswith('Buiten') else 0), inv(10, m + k + 'tvk' + u, k)) for m, p in VT.items() for k, u in hoek_combos(VTU)]
    tv = lambda k, frame='zwart': {'shape': 'square', 'width': 0.7, 'height': 0.75, 'top': top_param(k), 'frame': frame, 'base': 'kruis', 'stackable': True}
    imgs, vmap = kleur_images('terrastafel-vierkant-stapelbaar', HOEK_DECORS, 'statafel', tv, 'Zwart',
                              [img('terrastafel-vierkant-stapelbaar-wit-wit-onderstel.webp', 'variant', 3, 'statafel', tv('Wit', 'wit'), 'hero', 'Wit', 'needs-param',
                                   alt='wit compact-HPL-blad op een wit onderstel'),
                               img('terrastafel-vierkant-stapelbaar-eiken-rvs-onderstel.webp', 'variant', 3, 'statafel', tv('Eiken', 'rvs'), 'hero', 'Eiken', 'needs-param',
                                   alt='eiken blad op een geborsteld RVS onderstel'),
                               img('terrastafel-vierkant-stapelbaar-gestapeld.webp', 'detail', 3, 'statafel', dict(tv('Zwart'), stack=4), 'hero', 'Zwart', 'needs-param',
                                   alt='vier terrastafels op elkaar gestapeld')],
                              status='needs-param', p2=3)
    vsku = {}
    for v in vs:
        if v['option3'] == 'Buiten (compact HPL), wit onderstel' and v['option2'] == 'Wit':
            vsku[v['sku']] = 'terrastafel-vierkant-stapelbaar-wit-wit-onderstel.webp'
        if v['option3'] == 'Binnen, RVS onderstel' and v['option2'] == 'Eiken':
            vsku[v['sku']] = 'terrastafel-vierkant-stapelbaar-eiken-rvs-onderstel.webp'
    simple('terrastafel-vierkant-stapelbaar', 'Terrastafel vierkant stapelbaar', 'Terrastafel', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'],
           [opt('Maat', list(VT)), opt('Kleur', HOEK_DECORS), opt('Uitvoering', VTU)], vs, imgs,
           {'kenmerk_kort': 'Vierkant blad · 4 poten · stapelbaar tot 6 · 75 cm · RVS, zwart of wit', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket', 'gewicht_kg': 13.5,
            'garantie': '2 jaar', 'addon_eenmalig': ['transportkar-statafels'],
            'specificaties': [sp('Afmetingen', 'Hoogte', '75 cm'), sp('Onderstel', 'Materiaal', 'Staal zwart of wit gepoedercoat, of geborsteld RVS (binnen), 4 poten, stapelbaar'),
                              sp('Blad', 'Binnen', 'HPL-toplaag op 18 mm plaat, 7 decors'), sp('Blad', 'Buiten', 'Compact HPL 12 mm, door en door, 12 decors')]},
           ['tafels-stoelen.terrastafels'], 'meubilair',
           'De vierkante stapelstatafel op zithoogte: zelfde bladen en onderstellen (zwart, RVS, wit), stapelt tot 6; voor terras, kantine en lounge in één stijl met de statafel.',
           ['terrastafel stapelbaar', 'terrastafel rvs', 'terrastafel vierkant 70x70', 'terrastafel compact hpl'],
           {'statafelshop': 'Kansas terrastafel zwart of RVS vanaf €148,82 · Indus vanaf €143,93', 'outmate': 'Times Square vierkant stapelbaar 70x70 vanaf €159 (live, 2026-10-18)',
            'ours': VT, 'opties': '+ € 30 RVS · + € 55 compact HPL buiten · + € 10 / € 15 decor'},
           vmap=vmap, extra={'variant_image_sku': vsku})

    # 2. the brede stapelbare statafel at terrace height, also in 120 x 60 / 120 x 70 cm (reference: Statafelshop Indus Breed terrastafel 120 x 60 /
    # 120 x 70 vanaf € 246,84, Mississippi Breed vanaf € 296,39; Outmate Times Square terrastafel 120 x 70 stapelbaar € 336)
    BT = {'120 x 60 cm': (229.0, 19000, 80), '120 x 70 cm': (249.0, 21000, 80), '140 x 70 cm': (289.0, 23000, 90), '180 x 70 cm': (349.0, 28000, 110)}
    BTU = ['Binnen, zwart onderstel', 'Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel']
    vs = [variant(f'KK-TER-BS-{code(m)}-{COLOR_CODE[k]}' + hoek_sku(u), [m, k, u], p + 2 * HOEK_DECOR_EXTRA.get(k, 0) + (hpl if u.startswith('Buiten') else 0),
                  g + (5000 if u.startswith('Buiten') else 0), inv(4, m + k + 'tbs' + u, k)) for m, (p, g, hpl) in BT.items() for k, u in hoek_combos(BTU)]
    tb = lambda k: {'shape': 'rect', 'width': 1.2, 'depth': 0.7, 'height': 0.75, 'top': top_param(k), 'frame': 'zwart', 'base': 'vierpoot', 'stackable': True}
    imgs, vmap = kleur_images('terrastafel-breed-stapelbaar', HOEK_DECORS, 'statafel', tb, 'Eiken',
                              [img('terrastafel-breed-stapelbaar-gestapeld.webp', 'detail', 3, 'statafel', dict(tb('Zwart'), stack=3), 'hero', 'Zwart', 'needs-param',
                                   alt='drie tafels gestapeld')], status='needs-param', p2=3)
    simple('terrastafel-breed-stapelbaar', 'Terrastafel breed stapelbaar', 'Terrastafel', ['zakelijk', 'gebruik:horeca', 'gebruik:evenement'],
           [opt('Maat', list(BT)), opt('Kleur', HOEK_DECORS), opt('Uitvoering', BTU)], vs, imgs,
           {'kenmerk_kort': 'Breed blad 120 tot 180 cm · 4 poten op de hoeken · stapelbaar · 75 cm', 'staffelkorting': ST_MEUBEL, 'verzending': 'pallet', 'garantie': '2 jaar',
            'specificaties': [sp('Afmetingen', 'Hoogte', '75 cm'), sp('Afmetingen', 'Blad', '120 x 60, 120 x 70, 140 x 70 of 180 x 70 cm'),
                              sp('Onderstel', 'Materiaal', 'Stalen frame met 4 vierkante poten 40 x 40 mm, zwart of wit gepoedercoat, stapelbaar'),
                              sp('Blad', 'Binnen', 'HPL-toplaag op 25 mm plaat, 7 decors'), sp('Blad', 'Buiten', 'Compact HPL 12 mm, 12 decors')]},
           ['tafels-stoelen.terrastafels'], 'meubilair',
           'Lange terrastafel voor 4 tot 8 personen, poten op de hoeken, stapelbaar tot 4; zelfde bladen als de brede statafel; 120 x 60 en 120 x 70 voor het smalle terras.',
           ['terrastafel 120 x 70', 'terrastafel rechthoekig stapelbaar', 'lange terrastafel', 'terrastafel 180 cm'],
           {'statafelshop': 'Indus Breed terrastafel 120x60 / 120x70 vanaf €246,84 · Mississippi Breed vanaf €296,39', 'outmate': 'Times Square terrastafel 120x70 stapelbaar €336 (live, 2026-10-18)',
            'ours': {m: v[0] for m, v in BT.items()}, 'opties': '+ € 80 / € 90 / € 110 compact HPL buiten · + € 20 / € 30 decor'}, vmap=vmap)

    # 3. the design statafel met zuilvoet at terrace height (reference: Outmate Terrastafel Infinity HPL blad € 189; Statafelshop Trentino terrastafel
    # vanaf € 253,50): same 6 compact-HPL decors and the three onderstel colours
    DT = {'Ø70 cm': 169.0, '70 x 70 cm': 179.0}
    DTK = ['Wit marmer', 'Zwart marmer', 'Betonlook', 'Grijs eiken', 'Teak', 'Zwart']
    DTU = ['Buiten (compact HPL), zwart onderstel', 'Buiten (compact HPL), wit onderstel', 'Buiten (compact HPL), zandkleur onderstel']
    vs = [variant(f'KK-TER-DSZ-{code(m)}-{COLOR_CODE[k]}-{["ZW", "WI", "ZK"][i]}', [m, k, u], p + (10 if k != 'Zwart' else 0), 16000, inv(4, m + k + u + 'tdsz', k))
          for m, p in DT.items() for k in DTK for i, u in enumerate(DTU)]
    imgs, vmap = kleur_images('terrastafel-design-zuilvoet', DTK, 'statafel',
                              lambda k: {'diameter': 0.7, 'height': 0.75, 'top': top_param(k), 'frame': 'zwart', 'base': 'zuil-plaat'}, 'Wit marmer',
                              [img('terrastafel-design-zuilvoet-vierkant-teak.webp', 'detail', 3, 'statafel',
                                   {'shape': 'square', 'width': 0.7, 'height': 0.75, 'top': 'teak', 'frame': 'zandkleur', 'base': 'zuil-plaat'}, 'hero', 'Teak', 'needs-param',
                                   alt='vierkant blad 70 x 70 cm in teak op een zandkleurig onderstel')], status='needs-param', p2=3)
    simple('terrastafel-design-zuilvoet', 'Terrastafel HPL met zuilvoet', 'Terrastafel', ['zakelijk', 'gebruik:horeca', 'gebruik:tuinfeest'],
           [opt('Maat', list(DT)), opt('Kleur', DTK), opt('Uitvoering', DTU)], vs, imgs,
           {'kenmerk_kort': 'Compact HPL · rond of vierkant 70 cm · zware zuilvoet · 75 cm · blijft buiten staan', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket',
            'garantie': '2 jaar', 'gewicht_kg': 16,
            'specificaties': [sp('Blad', 'Materiaal', 'Compact HPL 12 mm, door en door, weer- en UV-bestendig'), sp('Blad', 'Maten', 'Ø70 cm of 70 x 70 cm'),
                              sp('Onderstel', 'Materiaal', 'Stalen zuil Ø 76 mm op een voetplaat van 45 x 45 cm, gepoedercoat zwart, wit of zandkleur'),
                              sp('Afmetingen', 'Hoogte', '75 cm'), sp('Gewicht', 'Totaal', 'ca. 16 kg'), sp('Onderstel', 'Stelvoeten', '4 verstelbare doppen onder de voetplaat')]},
           ['tafels-stoelen.terrastafels'], 'meubilair',
           'De design statafel met zuilvoet op zithoogte: zelfde 6 decors en onderstelkleuren, zware voetplaat, niets waar je knieën tegenaan stoten; blijft buiten staan.',
           ['terrastafel hpl', 'terrastafel zuilvoet', 'terrastafel marmerlook', 'design terrastafel'],
           {'outmate': 'Terrastafel Infinity HPL blad €189 (live, 2026-10-18)', 'statafelshop': 'Trentino terrastafel vanaf €253,50', 'ours': DT, 'opties': '+ € 10 decor (niet bij zwart)'},
           vmap=vmap)

    # 4. low: a wiebelvrije tafel (the reference's 'slimme' statafels and terrastafels: No-rock 70x70 vanaf € 285, Orbit Ø70 € 249, Rivièra € 239-335,
    # X4TRAIL self-stabilising base € 249, terras + sta in one base € 395). Ours: an onderstel with 4 zelfstellende voeten that find the floor
    # on an uneven terrace, at terrace (75 cm) or bar height (110 cm); compact HPL blad.
    WV = {'Ø70 cm': 229.0, '70 x 70 cm': 249.0, 'Ø80 cm': 249.0}
    WVK = ['Wit', 'Zwart', 'Betonlook', 'Wit marmer', 'Grijs eiken', 'Teak']
    WVU = ['Terrastafel 75 cm, zwart onderstel', 'Statafel 110 cm, zwart onderstel']
    vs = [variant(f'KK-TER-WV-{code(m)}-{COLOR_CODE[k]}' + ('-STA' if u.startswith('Statafel') else ''), [m, k, u], p + (40 if u.startswith('Statafel') else 0) +
                  (10 if k not in ('Wit', 'Zwart') else 0), 15000 + (2000 if u.startswith('Statafel') else 0) + (1500 if m == 'Ø80 cm' else 0), inv(4, m + k + u + 'wv', k))
          for m, p in WV.items() for k in WVK for u in WVU]
    imgs, vmap = kleur_images('terrastafel-wiebelvrij', WVK, 'statafel',
                              lambda k: {'diameter': 0.7, 'height': 0.75, 'top': top_param(k), 'frame': 'zwart', 'base': 'zelfstellend'}, 'Betonlook',
                              [img('terrastafel-wiebelvrij-statafel-110-cm.webp', 'variant', 2, 'statafel',
                                   {'diameter': 0.7, 'height': 1.1, 'top': 'beton', 'frame': 'zwart', 'base': 'zelfstellend'}, 'hero', None, 'needs-param',
                                   alt='als statafel van 110 cm, betonlook blad'),
                               img('terrastafel-wiebelvrij-voet-detail.webp', 'detail', 3, 'statafel',
                                   {'diameter': 0.7, 'height': 0.75, 'top': 'beton', 'frame': 'zwart', 'base': 'zelfstellend', 'ground': 'tegels-scheef'}, 'detail', None, 'needs-param',
                                   alt='de zelfstellende voeten op een scheef terras')], status='needs-param', p2=3)
    simple('terrastafel-wiebelvrij', 'Wiebelvrije terrastafel en statafel', 'Terrastafel', ['zakelijk', 'gebruik:horeca'],
           [opt('Maat', list(WV)), opt('Kleur', WVK), opt('Uitvoering', WVU)], vs, imgs,
           {'kenmerk_kort': 'Zelfstellende voeten · staat recht op een scheef terras · 75 of 110 cm · compact HPL', 'staffelkorting': ST_MEUBEL, 'verzending': 'pakket',
            'garantie': '2 jaar', 'vergelijk_groep': 'statafel',
            'specificaties': [sp('Onderstel', 'Werking', '4 voeten die zelf hun hoogte zoeken: de tafel staat stil op tegels, klinkers of een licht hellend terras'),
                              sp('Onderstel', 'Materiaal', 'Staal, zwart gepoedercoat, 4 poten op een middenkolom'),
                              sp('Onderstel', 'Bereik', 'Vangt ca. 15 mm hoogteverschil per voet op'),
                              sp('Blad', 'Materiaal', 'Compact HPL 12 mm, weer- en UV-bestendig'), sp('Blad', 'Maten', 'Ø70, 70 x 70 of Ø80 cm'),
                              sp('Afmetingen', 'Hoogte', '75 cm (terrastafel) of 110 cm (statafel)')]},
           ['tafels-stoelen.terrastafels', 'tafels-stoelen.statafels'], 'meubilair',
           'Voor het terras met scheve tegels: vier voeten die zichzelf stellen, dus geen bierviltje onder de poot; als terrastafel of als statafel; compact HPL blijft buiten.',
           ['wiebelvrije terrastafel', 'zelfstellende tafel', 'terrastafel scheef terras', 'statafel wiebelt niet'],
           {'outmate': 'No-rock terrastafel 70x70 vanaf €285 · Orbit Ø70 €249 · Rivièra €239–335 · X4TRAIL onderstel €249 · terras + sta onderstel €395 (live, 2026-10-18)',
            'ours': WV, 'opties': '+ € 40 statafelhoogte · + € 10 decor'},
           vmap=vmap, extra={'variant_image_sku': {v['sku']: 'terrastafel-wiebelvrij-statafel-110-cm.webp' for v in vs
                                                   if v['option3'].startswith('Statafel') and v['option2'] == 'Betonlook'}})

    # ------------------------------------------------------------ karren (low)
    # steekwagen for ca. 12 stapelstoelen (reference Outmate € 125, Statafelshop trolley stapelstoel € 127,35)
    simple('steekwagen-stapelstoelen', 'Steekwagen voor stapelstoelen', 'Transportkar', ['zakelijk', 'gebruik:evenement', 'gebruik:horeca'], [],
           [variant('KK-MEU-STW-12', [], 109.0, 9500, inv(6, 'stw'))],
           [img('steekwagen-stapelstoelen-hero.webp', 'hero', 1, 'trolley', {'kind': 'steekwagen', 'loaded': 0}, 'hero', None, 'needs-param', alt='leeg, schuin vooraanzicht'),
            img('steekwagen-stapelstoelen-geladen.webp', 'in-gebruik', 2, 'trolley', {'kind': 'steekwagen', 'loaded': 10, 'chairStyle': 'metaal', 'chairColor': 'zwart'}, 'hero', None,
                'needs-param', alt='met een stapel van 10 zwarte stapelstoelen')],
           {'kenmerk_kort': 'Rijdt een stapel van ca. 12 stoelen · 2 luchtbanden · past door elke deur', 'verzending': 'pakket', 'staffelkorting': ST_KAR, 'gewicht_kg': 9.5,
            'past_op': list(STAPELBAAR),
            'specificaties': [sp('Steekwagen', 'Capaciteit', 'Eén stapel van ca. 12 stapelstoelen, tot 150 kg'), sp('Steekwagen', 'Wielen', '2 luchtbanden Ø 26 cm'),
                              sp('Steekwagen', 'Schep', 'Staal 40 x 30 cm, onder de onderste stoel'), sp('Steekwagen', 'Frame', 'Staal, zwart gepoedercoat, hoogte ca. 125 cm')]},
           ['tafels-stoelen.trolleys'], 'meubilair',
           'Voor wie stoelen van zaal naar zaal rijdt zonder grote kar: één stapel op twee wielen, door een gewone deur; het grote werk doet de kar voor 20 of 40.',
           ['steekwagen stapelstoelen', 'trolley stapelstoelen klein', 'stoelen verplaatsen'],
           {'outmate': 'transportkar/steekwagen voor 12 stapelstoelen €125', 'statafelshop': 'trolley stapelstoel €127,35 (live, 2026-10-18)', 'ours': 109.0})
    # universal stacking trolley, single and double (reference Outmate Uni stack € 411-530,50)
    UK = [('Enkel, 1 stapel', 369.0, 'E', 22000), ('Dubbel, 2 stapels', 479.0, 'D', 34000)]
    simple('transportkar-universeel', 'Transportkar universeel voor stapels', 'Transportkar', ['zakelijk', 'pallet', 'gebruik:evenement'], [opt('Uitvoering', [u[0] for u in UK])],
           [variant(f'KK-MEU-TKU-{c}', [n], p, g, inv(3, c + 'tku')) for n, p, c, g in UK],
           [img('transportkar-universeel-hero.webp', 'hero', 1, 'trolley', {'kind': 'universeel', 'stacks': 1, 'loaded': 0}, 'hero', None, 'needs-param', alt='enkele uitvoering, leeg'),
            img('transportkar-universeel-dubbel.webp', 'variant', 2, 'trolley', {'kind': 'universeel', 'stacks': 2, 'loaded': 0}, 'hero', None, 'needs-param', alt='dubbele uitvoering, leeg'),
            img('transportkar-universeel-geladen.webp', 'in-gebruik', 3, 'trolley', {'kind': 'universeel', 'stacks': 2, 'loaded': 'mixed'}, 'hero', None, 'needs-param',
                alt='dubbel, met een stapel stoelen en een stapel barkrukken')],
           {'kenmerk_kort': 'Plateau met verstelbare beugels · stoelen, krukken of kratten · 4 zwenkwielen', 'verzending': 'pallet', 'staffelkorting': ST_KAR,
            'past_op': list(STAPELBAAR) + ['barkruk-stapelbaar-metaal', 'barkruk-chroom-stapelbaar', 'barkruk-draad-stapelbaar', 'kruk-laag-stapelbaar'],
            'specificaties': [sp('Kar', 'Plateau', 'Enkel ca. 60 x 60 cm, dubbel ca. 120 x 60 cm, staal verzinkt'),
                              sp('Kar', 'Beugels', 'Per stapel 2 verstelbare beugels tot ca. 160 cm, met spanband'),
                              sp('Kar', 'Wielen', '4 zwenkwielen Ø 125 mm, 2 met rem'), sp('Kar', 'Draagvermogen', 'Enkel 250 kg, dubbel 400 kg')]},
           ['tafels-stoelen.trolleys'], 'meubilair',
           'Eén kar voor wat je stapelt: stoelen van verschillende merken, barkrukken of kratten; beugels verstelbaar; enkel of dubbel.',
           ['universele transportkar', 'stapeltrolley', 'trolley stoelen en krukken'],
           {'outmate': 'Uni stack universele transportkar €411–€530,50 (live, 2026-10-18)', 'ours': {u[0]: u[1] for u in UK}})
    # one more klapstoelen kar size: 50 (reference Statafelshop transportkar klapstoel 50x € 417,45)
    tk = HANDLES['transportkar-klaptafels-en-stoelen']
    tk['options'][0]['values'] = tk['options'][0]['values'] + ['Voor 50 klapstoelen']
    tk['variants'].append(variant('KK-MEU-TKK-KLS50', ['Voor 50 klapstoelen'], 369.0, 32000, inv(3, 'kls50tkk')))
    tk['price_ref'] = dict(tk['price_ref'], statafelshop_50=('transportkar klapstoel 50 stuks €417,45 (live, 2026-10-18); ours €369'))

    # FoldTable-type: a table with two benches that folds into one rolling unit (reference € 955,90 / € 959)
    simple('klaptafel-met-banken-rolbaar', 'Klaptafel met banken, rolbaar 200 x 60 cm', 'Klaptafel', ['zakelijk', 'pallet', 'gebruik:evenement', 'gebruik:horeca'],
           [opt('Maat', ['200 x 60 cm'])], [variant('KK-MEU-KTB-200X60', ['200 x 60 cm'], 859.0, 62000, inv(2, 'ktb'))],
           [img('klaptafel-met-banken-rolbaar-hero.webp', 'hero', 1, 'foldTable', {'length': 2.0, 'width': 0.6, 'open': True}, 'hero', None, 'needs-model', alt='uitgeklapt, met twee banken'),
            img('klaptafel-met-banken-rolbaar-ingeklapt.webp', 'detail', 2, 'foldTable', {'length': 2.0, 'width': 0.6, 'open': False}, 'hero', None, 'needs-model',
                alt='ingeklapt op de wielen, rechtop')],
           {'kenmerk_kort': 'Tafel en 2 banken in één · 8 personen · klapt op tot een rolbare unit', 'verzending': 'pallet', 'staffelkorting': ST_GROOT, 'gewicht_kg': 62,
            'specificaties': [sp('Tafel', 'Blad', '200 x 60 cm, multiplex met HPL-toplaag'), sp('Banken', 'Zitting', '2 x 200 x 25 cm, zithoogte 45 cm'),
                              sp('Frame', 'Materiaal', 'Staal, gepoedercoat, met gasveren'), sp('Inklappen', 'Werking', 'Banken en blad klappen samen op; de unit rijdt op 4 wielen'),
                              sp('Ingeklapt', 'Afmetingen', 'ca. 200 x 60 x 155 cm'), sp('Capaciteit', 'Personen', '8 zittend')]},
           ['tafels-stoelen.klaptafels', 'tafels-stoelen.biertafels'], 'meubilair',
           'Voor kantine, school en sporthal: tafel en banken in één stuk, opgeklapt en weggereden door één persoon; geen losse banken die zoekraken.',
           ['klaptafel met banken', 'rolbare kantinetafel', 'inklapbare tafel met bank', 'tafel met bank op wielen'],
           {'statafelshop': 'FoldTable €955,90', 'outmate': 'Foldtable 200x60 €959 (live, 2026-10-18)', 'ours': 859.0})

    # ------------------------------------------------------------ zitmeubilair: onderdelen per model (low)
    # reference per-model spares (Outmate: zitting inklapbare barkruk € 23,50, onderbeugel € 8,50, buisbeugel € 1,50, voetdop € 1,50; zitting
    # wedding chair € 9,18; voetdop klapstoel € 0,75; voetdop barkruk voor / achter € 3,50)
    SO = [('Zitting barkruk inklapbaar, zwart', 20.95, 'BKI-Z', 900, ['barkruk-inklapbaar'], ('seatParts', {'part': 'zitting', 'chair': 'barkruk-inklapbaar'})),
          ('Onderbeugel barkruk inklapbaar', 7.45, 'BKI-OB', 600, ['barkruk-inklapbaar'], ('seatParts', {'part': 'onderbeugel', 'chair': 'barkruk-inklapbaar'})),
          ('Beugelklemmen barkruk inklapbaar (set van 2)', 2.69, 'BKI-BK', 80, ['barkruk-inklapbaar'], ('seatParts', {'part': 'buisklem', 'chair': 'barkruk-inklapbaar', 'count': 2})),
          ('Voetdoppen barkruk inklapbaar (set van 4)', 5.25, 'BKI-VD', 80, ['barkruk-inklapbaar'], ('footCaps', {'shape': 'rond', 'size': 25, 'count': 4})),
          ('Voetdoppen barkruk metaal, voor (set van 2)', 5.95, 'BKM-VV', 60, ['barkruk-stapelbaar-metaal'], ('footCaps', {'shape': 'vierkant', 'size': 25, 'count': 2})),
          ('Voetdoppen barkruk metaal, achter (set van 2)', 5.95, 'BKM-VA', 60, ['barkruk-stapelbaar-metaal'], ('footCaps', {'shape': 'vierkant', 'size': 25, 'count': 2, 'angle': 'schuin'})),
          ('Zitting weddingstoel, wit', 7.95, 'WED-ZW', 700, ['klapstoel-wedding'], ('seatParts', {'part': 'zitting', 'chair': 'klapstoel-wedding', 'color': 'wit'})),
          ('Zitting weddingstoel, zwart', 7.95, 'WED-ZZ', 700, ['klapstoel-wedding'], ('seatParts', {'part': 'zitting', 'chair': 'klapstoel-wedding', 'color': 'zwart'})),
          ('Voetdoppen klapstoel (set van 4)', 2.49, 'KLS-VD', 40, ['klapstoel'], ('footCaps', {'shape': 'ovaal', 'size': 20, 'count': 4})),
          ('Voetdoppen stapelstoel metaal (set van 4)', 3.95, 'STM-VD', 60, ['stapelstoel-metaal'], ('footCaps', {'shape': 'rond', 'size': 22, 'count': 4}))]
    SO_IMG = {n: f'onderdelen-stoelen-en-barkrukken-{slug(n.split(" (")[0])}.webp' for n, *_ in SO}
    simple('onderdelen-stoelen-en-barkrukken', 'Onderdelen voor stoelen en barkrukken', 'Meubelonderdeel', ['zakelijk'], [opt('Uitvoering', [s_[0] for s_ in SO])],
           [variant(f'KK-MEU-OSB-{c}', [n], p, g, inv(30, c + 'osb')) for n, p, c, g, _, _ in SO],
           [img('onderdelen-stoelen-en-barkrukken-hero.webp', 'hero', 1, 'items', {'items': [{'model': 'seatParts', 'part': 'zitting', 'chair': 'barkruk-inklapbaar'},
                                                                                            {'model': 'footCaps', 'shape': 'rond', 'count': 4}]}, 'hero', None, 'needs-model',
                alt='zitting en voetdoppen naast elkaar')] +
           [img(SO_IMG[n], 'variant', 3, m_, prm, 'hero', None, 'needs-model' if m_ == 'seatParts' else 'needs-param') for n, _, _, _, _, (m_, prm) in SO],
           {'kenmerk_kort': 'Zittingen, beugels en voetdoppen per model · los te bestellen', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'past_op': sorted({h for *_, hs, _ in SO for h in hs}),
            'specificaties': [sp('Onderdelen', 'Barkruk inklapbaar', 'Zitting (zwart kunstleer), onderbeugel, beugelklemmen, voetdoppen'),
                              sp('Onderdelen', 'Barkruk stapelbaar metaal', 'Voetdoppen voor en achter (de achterste lopen schuin af)'),
                              sp('Onderdelen', 'Weddingstoel', 'Zitting wit of zwart, klikt in het frame'),
                              sp('Onderdelen', 'Klapstoel en stapelstoel metaal', 'Voetdoppen, set van 4')]},
           ['tafels-stoelen.stoelen-onderdelen', 'tafels-stoelen.barkruk-onderdelen'], 'meubilair',
           'Een kapotte zitting of een kwijtgeraakte dop betekent geen nieuwe stoel: per model de zitting, beugels en doppen; welk onderdeel bij welke stoel.',
           ['onderdelen barkruk', 'zitting weddingstoel', 'voetdoppen klapstoel', 'reserveonderdelen stoelen'],
           {'outmate': 'zitting inklapbare barkruk €23,50 · onderbeugel €8,50 · buisbeugel €1,50 · voetdop €1,50 · zitting wedding chair €9,18 · voetdop klapstoel €0,75 · voetdop barkruk voor/achter €3,50 (live, 2026-10-18)',
            'ours': {s_[0]: s_[1] for s_ in SO}}, vmap=SO_IMG, vby='Uitvoering')

    # ------------------------------------------------------------ afzetpalen en lopers (low)
    # premium gala / galerie posts with a koord (reference ForFlows gala vanaf € 104, gallery 60 cm € 92 / 90 cm € 105; Statafelshop Chicago € 146,35)
    GA = [('Gala 100 cm, bolle kop', 93.95, 'GALA', 9000), ('Galerie 60 cm', 82.95, 'GAL60', 7000), ('Galerie 90 cm', 94.95, 'GAL90', 8500)]
    GAK = ['Zwart', 'Goud', 'Chroom']
    vs = [variant(f'KK-INR-AZG-{c}-{COLOR_CODE[k]}', [n, k], p, g, inv(8, c + k + 'azg')) for n, p, c, g in GA for k in GAK]
    imgs, vmap = kleur_images('afzetpaal-gala', GAK, 'stanchion', lambda k: {'style': 'gala', 'finish': render_color(k), 'rope': 'zwart' if k == 'Zwart' else 'bordeaux', 'pair': True}, 'Goud',
                              [img('afzetpaal-gala-galerie-60-cm.webp', 'variant', 3, 'stanchion', {'style': 'galerie', 'height': 0.6, 'finish': 'zwart', 'rope': 'zwart', 'pair': True},
                                   'hero', None, 'needs-param', alt='twee lage galeriepalen van 60 cm met zwart koord')], status='needs-param', p2=3)
    simple('afzetpaal-gala', 'Luxe afzetpaal gala en galerie', 'Afzetpaal', ['zakelijk', 'gebruik:evenement'], [opt('Uitvoering', [g_[0] for g_ in GA]), opt('Kleur', GAK)], vs, imgs,
           {'kenmerk_kort': 'Zware voet · bolle kop of lage galeriepaal · voor koord · zwart, goud of chroom', 'verzending': 'pakket', 'staffelkorting': ST_MEUBEL,
            'specificaties': [sp('Paal', 'Uitvoeringen', 'Gala 100 cm met bolle kop; galerie 60 of 90 cm met platte kop'),
                              sp('Paal', 'Afwerking', 'Zwart gepoedercoat, goudkleurig of chroom'), sp('Voet', 'Materiaal', 'Gietijzer Ø 35 cm met vilt onder, ca. 7–9 kg'),
                              sp('Koord', 'Bevestiging', '2 ogen per paal voor koord met haak (los)')]},
           ['inrichting-evenement.afzetpalen'], 'inrichting',
           'Voor de rode loper, het museum en de gala-entree: zware gala- of galeriepalen met fluwelen koord in plaats van een trekband; koord los, zelfde kar.',
           ['luxe afzetpaal', 'afzetpaal goud', 'afzetpaal met koord gala', 'museum afzetpaal'],
           {'outmate': 'ForFlows gala vanaf €104 · gallery 60 cm €92 · 90 cm €105', 'statafelshop': 'Chicago vanaf €146,35 (live, 2026-10-18)', 'ours': {g_[0]: g_[1] for g_ in GA}},
           vmap=vmap)
    # loper pins, 25 per pack (reference € 12)
    simple('loperpennen-set-van-25', 'Bevestigingspennen voor loper, 25 stuks', 'Loper', ['zakelijk', 'gebruik:evenement'], [],
           [variant('KK-INR-LPN-25', [], 10.95, 900, inv(40, 'lpn'))],
           [img('loperpennen-set-van-25-hero.webp', 'hero', 1, 'haringen', {'count': 25, 'length': 0.15, 'type': 'pen'}, 'hero', None, 'needs-param', alt='25 stalen pennen met kop')],
           {'kenmerk_kort': '25 stalen pennen van 15 cm · houden een loper op gras op zijn plek', 'verzending': 'pakket', 'staffelkorting': ST_TEXTIEL,
            'past_op': ['loper-per-meter', 'loper-rol-50-m', 'tentvloer-kunststof'],
            'specificaties': [sp('Pen', 'Materiaal', 'Verzinkt staal met platte kop Ø 3 cm'), sp('Pen', 'Lengte', '15 cm'), sp('Aantal', 'Per verpakking', '25 stuks'),
                              sp('Gebruik', 'Advies', 'Elke meter aan beide randen een pen, op gras of zand')]},
           ['inrichting-evenement.lopers'], 'inrichting',
           'Een loper op gras waait op of schuift: elke meter aan beide randen een pen; op een harde vloer neem je tape.',
           ['loper pennen', 'pennen rode loper', 'loper vastzetten gras'], {'outmate': 'bevestigingspennen 25 stuks €12 (live, 2026-10-18)', 'ours': 10.95})

    # ------------------------------------------------------------ pakketten (low: Statafelshop combinations we lacked)
    SK = ['Zwart', 'Wit', 'Antraciet']
    bundle('pakket-20-stapelstoelen-met-transportkar', '20 stapelstoelen met transportkar (pakket)', [opt('Kleur', SK)], [(k,) for k in SK],
           lambda los, k: setp(los),
           lambda k: [('stapelstoel-metaal', {'Kleur': k}, 20), ('transportkar-stapelstoelen', {'Uitvoering': 'Voor 20 stapelstoelen'}, 1)],
           [img(f'pakket-20-stapelstoelen-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'stapelstoel', 'chairs': 20, 'loaded': 19, 'chairStyle': 'metaal', 'chairColor': render_color(k), 'position': [-0.35, 0, 0]},
                           {'model': 'chair', 'style': 'metaal', 'color': render_color(k), 'position': [0.65, 0, 0.45], 'rotationY': -30}]}, 'hero', k, 'needs-param') for k in SK],
           {k: f'pakket-20-stapelstoelen-met-transportkar-{slug(k)}-hero.webp' for k in SK}, 'Kleur',
           '20 metalen stapelstoelen + transportkar · één kleur',
           'Voor de vereniging, het café of de kantine die met 20 stoelen toekomt: 2 stapels van 10 op één kar; besparing t.o.v. los.',
           ['20 stapelstoelen met kar', 'stapelstoelen set 20', 'stoelen met trolley 20'], ['tafels-stoelen.bundels', 'tafels-stoelen.trolleys', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:horeca', 'gebruik:evenement'], {'statafelshop': 'transportkar inclusief stapelstoel Waal 20 stuks €1.482,25 (live, 2026-10-18; luxere stoel)'},
           sku='20STM', verz='pallet')
    bundle('pakket-50-klapstoelen-met-transportkar', '50 klapstoelen met transportkar (pakket)', [opt('Kleur', ['Wit', 'Zwart'])], [('Wit',), ('Zwart',)],
           lambda los, k: setp(los),
           lambda k: [('klapstoel', {'Kleur': k}, 50), ('transportkar-klaptafels-en-stoelen', {'Uitvoering': 'Voor 50 klapstoelen'}, 1)],
           [img(f'pakket-50-klapstoelen-met-transportkar-{slug(k)}-hero.webp', 'hero' if k == 'Wit' else 'variant', 1 if k == 'Wit' else 3, 'items',
                {'items': [{'model': 'trolley', 'kind': 'klapstoel', 'loaded': 50, 'chairColor': render_color(k)}]}, 'hero', k, 'needs-param') for k in ['Wit', 'Zwart']],
           {k: f'pakket-50-klapstoelen-met-transportkar-{slug(k)}-hero.webp' for k in ['Wit', 'Zwart']}, 'Kleur',
           '50 klapstoelen + transportkar · wit of zwart', 'Ceremonie, schoolavond of ledenvergadering voor 50: alle stoelen op één kar; los vs pakket.',
           ['50 klapstoelen met kar', 'klapstoelen 50 stuks', 'klapstoelen met trolley'], ['tafels-stoelen.bundels', 'tafels-stoelen.trolleys', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:evenement'], {'statafelshop': 'transportkar inclusief klapstoel Donau 50 stuks €1.264,45', 'outmate': 'Supercombi 50x klapstoel + trolley vanaf €585 (live, 2026-10-18)'},
           sku='50KLS', verz='pallet')
    BTM = ['220 x 50 cm', '220 x 60 cm', '220 x 70 cm', '220 x 80 cm']
    BTQ = ['Standaard', 'Brouwerijkwaliteit']
    bundle('pakket-10-biertafels-met-transportkar', '10 biertafels met transportkar, zonder banken (pakket)', [opt('Maat', BTM), opt('Uitvoering', BTQ)],
           [(m, q) for m in BTM for q in BTQ], lambda los, m, q: setp(los),
           lambda m, q: [('biertafelset', {'Maat': m, 'Uitvoering': q, 'Samenstelling': 'Alleen tafel'}, 10), ('transportkar-biertafelsets', {}, 1)],
           [img('transportkar-biertafelsets-gevuld.webp', 'hero', 1, 'trolley', {'kind': 'biertafel', 'loaded': 10, 'tableWidth': 0.5}, 'hero', None, 'existing',
                alt='10 biertafels op de transportkar', extra={'shared_with': 'transportkar-biertafelsets'})],
           None, None, '10 biertafels zonder banken + transportkar · standaard of brouwerij',
           'Voor wie al banken of stoelen heeft, of tafels als buffet of bar gebruikt: tien biertafels op hun kar; besparing t.o.v. los.',
           ['10 biertafels met kar', 'biertafels zonder banken', 'biertafels 10 stuks trolley'], ['tafels-stoelen.biertafels', 'tafels-stoelen.trolleys', 'statafelrokken-hoezen.actiepakketten'],
           ['zakelijk', 'pallet', 'gebruik:tuinfeest', 'gebruik:evenement'], {'statafelshop': '10 biertafels standaard vanaf €1.017,55 / brouwerij vanaf €1.376,92 (alleen tafels, live 2026-10-18)'},
           sku='10BTK', verz='pallet')
    BFK = ['Zwart', 'Wit', 'Antraciet']
    BFU = ['Vast blad', 'In het midden inklapbaar']
    BFS = ['Met beschermplaat', 'Zonder beschermplaat']
    bundle('pakket-buffettafel-met-stretchhoes', 'Buffettafel met stretchhoes (pakket)', [opt('Uitvoering', BFU), opt('Kleur', BFK), opt('Samenstelling', BFS)],
           [(u, k, s_) for u in BFU for k in BFK for s_ in BFS], lambda los, u, k, s_: setp(los),
           lambda u, k, s_: [('klaptafel-hdpe-rechthoekig', {'Maat': '183 x 76 cm', 'Uitvoering': u}, 1), ('stretchhoes-klaptafel', {'Maat': '183 x 76 cm', 'Kleur': k}, 1)] +
                            ([('beschermplaat-statafel', {'Maat': '182 x 75 cm'}, 1)] if s_ == BFS[0] else []),
           [img(f'stretchhoes-klaptafel-{slug(k)}-hero.webp', 'hero' if k == 'Zwart' else 'variant', 1 if k == 'Zwart' else 3, 'buffetCover',
                {'length': 1.83, 'width': 0.76, 'color': render_color(k), 'kind': 'klaptafel'}, 'hero', k, 'existing', extra={'shared_with': 'stretchhoes-klaptafel'}) for k in BFK],
           {k: f'stretchhoes-klaptafel-{slug(k)}-hero.webp' for k in BFK}, 'Kleur',
           'Klaptafel 183 x 76 cm + stretchhoes tot de grond · met of zonder beschermplaat',
           'Eén buffet- of registratietafel die er netjes uitziet: tafel, hoes en desgewenst een beschermplaat; besparing t.o.v. los.',
           ['buffettafel met hoes', 'buffettafel stretchrok', 'klaptafel met stretchhoes'], ['statafelrokken-hoezen.buffettafel-hoezen', 'statafelrokken-hoezen.actiepakketten', 'tafels-stoelen.bundels'],
           ['zakelijk', 'gebruik:evenement'], {'statafelshop': 'buffettafel inclusief stretchrok en beschermplaat €205,64 · blow mold met stretchrok €119,79 (live, 2026-10-18)'},
           sku='BUF1')

    # ------------------------------------------------------------ fits (new lists: never += on a shared past_op list)
    for h, extra in [('beschermplaat-statafel', TERRAS),
                     ('zijwandenset-easy-up-heavy-duty-pvc', ['easy-up-partytent-professional-met-logo-op-de-luifel']),
                     ('transportkar-statafels', ['terrastafel-vierkant-stapelbaar']),
                     ('transportkar-afzetpalen', ['afzetpaal-gala']),
                     ('afzetkoord-velours', ['afzetpaal-gala']),
                     ('onderdelen-prikkabel-en-lichtslang', []),
                     ('transportkar-klaptafels-en-stoelen', []),
                     ('transportkar-biertafelsets', ['pakket-10-biertafels-met-transportkar'])]:
        HANDLES[h]['metafields']['past_op'] = list(HANDLES[h]['metafields'].get('past_op') or []) + [x for x in extra if x not in (HANDLES[h]['metafields'].get('past_op') or [])]
    # cart recommendations
    for h in STAPELBAAR:
        HANDLES[h]['complementary'] = list(HANDLES[h].get('complementary') or []) + ['steekwagen-stapelstoelen', 'transportkar-universeel']
    for h in TERRAS:
        HANDLES[h]['complementary'] = ['stapelstoel-metaal', 'kruk-laag-stapelbaar', 'stapelstoel-kunststof']
    HANDLES['terrastafel-breed-stapelbaar']['complementary'] = ['stapelstoel-metaal', 'bank-houten-frame', 'stapelstoel-kunststof']
    HANDLES['loper-rol-50-m']['complementary'] = list(HANDLES['loper-rol-50-m'].get('complementary') or []) + ['loperpennen-set-van-25']
    HANDLES['tentvloer-kunststof']['complementary'] = list(HANDLES['tentvloer-kunststof'].get('complementary') or []) + ['loperpennen-set-van-25']
    for h in ['klapstoel', 'klapstoel-wedding', 'barkruk-inklapbaar', 'barkruk-stapelbaar-metaal', 'stapelstoel-metaal']:
        HANDLES[h]['complementary'] = list(HANDLES[h].get('complementary') or []) + ['onderdelen-stoelen-en-barkrukken']
    HANDLES['afzetpaal-gala']['complementary'] = ['afzetkoord-velours', 'onderdelen-afzetsysteem', 'loper-per-meter']
    HANDLES['klaptafel-met-banken-rolbaar']['complementary'] = ['biertafelset', 'transportkar-biertafelsets']
